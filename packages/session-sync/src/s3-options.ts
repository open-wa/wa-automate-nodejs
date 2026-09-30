import { CLOUD_PROVIDERS, type S3RequestOptions } from 'pico-s3';

export interface S3Config {
    bucket: string;
    region?: string;
    accessKeyId: string;
    secretAccessKey: string;
    provider?: string;
    endpoint?: string;
    host?: string;
    url?: string;
    directory?: string;
    headers?: Record<string, string>;
    sessionToken?: string;
}

/** Use the same PicoS3 provider vocabulary for archives and portable objects. */
export function toS3Options(config: S3Config): S3RequestOptions {
    const endpoint = config.endpoint || config.url;
    let host = endpoint || config.host;
    let provider = (endpoint ? 'MINIO' : config.provider || (host ? 'MINIO' : 'AWS')).toUpperCase();
    // PicoS3's R2_ALT URL embeds the bucket in the hostname. Use its path-style provider instead.
    if (provider === 'R2_ALT') provider = 'MINIO';
    if (!Object.values(CLOUD_PROVIDERS).includes(provider as CLOUD_PROVIDERS)
        || !config.bucket || !config.accessKeyId || !config.secretAccessKey) {
        throw new Error('SESSION_S3_CONFIG_INVALID');
    }
    if (host) {
        let parsed: URL;
        try { parsed = new URL(host.includes('://') ? host : `https://${host}`); }
        catch { throw new Error('SESSION_S3_ENDPOINT_INVALID'); }
        if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password
            || parsed.search || parsed.hash || parsed.pathname !== '/') throw new Error('SESSION_S3_ENDPOINT_INVALID');
        host = parsed.origin;
    }
    if (['MINIO', 'R2', 'R2_ALT'].includes(provider) && !host) throw new Error('SESSION_S3_ENDPOINT_REQUIRED');
    return {
        provider: provider as CLOUD_PROVIDERS,
        bucket: config.bucket,
        region: config.region || (config.provider?.toUpperCase().startsWith('R2') ? 'auto' : 'us-east-1'),
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        host,
        headers: config.headers,
    };
}
