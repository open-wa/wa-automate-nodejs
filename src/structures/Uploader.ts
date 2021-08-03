import { default as axios } from 'axios'
import aws4 from 'aws4';
import { CLOUD_PROVIDERS } from '../api/model/config';


/**
 * Please submit a new issue if you need another s3 compatible provider.
 */
const PROVIDERS = {
    "GCP": {
        host: ({ bucket }) => `${bucket}.storage.googleapis.com`,
        url: ({ bucket, filename }) => `https://${bucket}.storage.googleapis.com/${filename}`,
        res: ({ bucket, filename }: any) => `https://storage.cloud.google.com/${bucket}/${filename}`
    },
    "AWS": {
        host: ({ bucket }) => `${bucket}.s3.amazonaws.com`,
        url: ({ bucket, filename }) => `https://${bucket}.s3.amazonaws.com/${filename}`,
        res: ({ bucket, filename, region }: any) => `https://${bucket}.s3.${region}.amazonaws.com/${filename}`
    },
    "WASABI": {
        host: ({ region, bucket }: any) => `${bucket}.s3.${region}.wasabisys.com`,
        url: ({ region, filename, bucket }: any) => `https://${bucket}.s3.${region}.wasabisys.com/${filename}`,
        res: ({ bucket, filename, region }: any) => `https://s3.${region}.wasabisys.com/${bucket}/${filename}`
    }
}

export interface UploadOptions {
    provider: CLOUD_PROVIDERS,
    file: string,
    filename: string,
    accessKeyId: string,
    secretAccessKey: string,
    region?: string,
    bucket: string
}

export const getCloudUrl: (options: UploadOptions) => string = (options: UploadOptions) => PROVIDERS[options.provider].res(options);

export const upload: (uploadOptions: UploadOptions) => Promise<string> = async (uploadOptions: UploadOptions) => {
    const { provider, file, filename, accessKeyId, secretAccessKey } = uploadOptions;
    const region = provider === CLOUD_PROVIDERS.GCP ? 'region' : uploadOptions.region;
    const _ = PROVIDERS[provider];
    if (!_) throw new Error(`Invalid provider ${provider}. Valid providers: ${Object.keys(PROVIDERS)}`);
    try {

        const START = Date.now();
        console.log(`Uploading ${filename} to ${provider}`);
        await axios(aws4.sign({
            host: _.host(uploadOptions),
            path: `/${filename}`,
            url: _.url(uploadOptions),
            service: 's3',
            region,
            method: 'PUT',
            headers: {
                'Content-Type': file.match(/[^:\s*]\w+\/[\w-+\d.]+(?=[;| ])/)[0],
                'x-amz-content-sha256': 'UNSIGNED-PAYLOAD'
            },
            data: Buffer.from(file.split(',')[1], 'base64')
        },
            {
                accessKeyId,
                secretAccessKey
            }));
        const END = Date.now() - START;

        console.log(`${filename} uploaded  to ${provider} in ${END}ms`);
        return _.res(uploadOptions) || "";
    } catch (error) {
        console.error("UPLOAD ERROR", filename, provider, error.message);
        throw error;
    }
};
