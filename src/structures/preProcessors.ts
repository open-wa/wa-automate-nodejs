import { Client } from "../api/Client";
import { Message } from "../api/model/message";
import mime from "mime";
import { outputFileSync } from "fs-extra";
import { getCloudUrl, upload } from "./Uploader";
import { CLOUD_PROVIDERS } from "../api/model/config";
import { default as PQueue }  from "p-queue";

const processedFiles = {};

let uploadQueue;

const SCRUB: (message: Message, client: Client) => Promise<Message> = async (
  message: Message
) => {
  if (message.deprecatedMms3Url)
    return {
      ...message,
      content: "",
      body: "",
    };
  return message;
};

const BODY_ONLY: (message: Message, client: Client) => Promise<Message> =
  async (message: Message) => {
    if (message.deprecatedMms3Url)
      return {
        ...message,
        content: "",
      };
    return message;
  };

const AUTO_DECRYPT: (message: Message, client: Client) => Promise<Message> =
  async (message: Message, client: Client) => {
    if (message.deprecatedMms3Url)
      return {
        ...message,
        body: await client.decryptMedia(message),
      };
    return message;
  };

const AUTO_DECRYPT_SAVE: (
  message: Message,
  client: Client
) => Promise<Message> = async (message: Message, client: Client) => {
  if (message.deprecatedMms3Url) {
    const filename = `${message.id.split("_").slice(-1)[0]}.${mime.extension(
      message.mimetype
    )}`;
    const mediaData = await client.decryptMedia(message);
    const filePath = `media/${filename}`;
    try {
      outputFileSync(filePath, Buffer.from(mediaData.split(",")[1], "base64"));
    } catch (error) {
      console.error(error);
      return message;
    }
    return {
      ...message,
      body: filename,
      content: "",
      filePath,
    };
  }
  return message;
};

const UPLOAD_CLOUD: (
  message: Message,
  client: Client
) => Promise<Message> = async (message: Message, client: Client) => {
  const {cloudUploadOptions} = client.getConfig();
  if(message.fromMe && (cloudUploadOptions.ignoreHostAccount || process.env.OW_CLOUD_IGNORE_HOST)) return message;
  if(!uploadQueue) {
    uploadQueue = new PQueue({ concurrency: 2, interval: 1000, carryoverConcurrencyCount: true, intervalCap: 2 });
  }
  if (message.deprecatedMms3Url) {
    const filename = `${message.id.split("_").slice(-1)[0]}.${mime.extension(
      message.mimetype
    )}`;
    const mediaData = await client.decryptMedia(message);
    if(!cloudUploadOptions) return message;
    const provider = (process.env.OW_CLOUD_PROVIDER || cloudUploadOptions.provider) as CLOUD_PROVIDERS
    const opts = {
      file: mediaData,
      filename,
      provider,
      accessKeyId: process.env.OW_CLOUD_ACCESS_KEY_ID || cloudUploadOptions.accessKeyId,
      secretAccessKey: process.env.OW_CLOUD_SECRET_ACCESS_KEY || cloudUploadOptions.secretAccessKey, 
      bucket: process.env.OW_CLOUD_BUCKET || cloudUploadOptions.bucket,
      region: process.env.OW_CLOUD_REGION || cloudUploadOptions.region,
    }
    
    if(!opts.accessKeyId) {
      console.error("UPLOAD ERROR: No accessKeyId provided. If you're using the CLI, set env var OW_CLOUD_ACCESS_KEY_ID");
      return message;
    }

    if(!opts.secretAccessKey) {
      console.error("UPLOAD ERROR: No secretAccessKey provided. If you're using the CLI, set env var OW_CLOUD_SECRET_ACCESS_KEY");
      return message;
    }

    if(!opts.bucket) {
      console.error("UPLOAD ERROR: No bucket provided. If you're using the CLI, set env var OW_CLOUD_BUCKET");
      return message;
    }

    if(!opts.provider) {
      console.error("UPLOAD ERROR: No provider provided. If you're using the CLI, set env var OW_CLOUD_PROVIDER");
      return message;
    }

    const url = getCloudUrl(opts);
    if(!processedFiles[filename]) {
      processedFiles[filename] = true;
      try {
        await uploadQueue.add(() => upload(opts).catch(()=>{}));
      } catch (error) {
        console.error(error);
        return message;
      }
    }
    return {
      ...message,
      cloudUrl: url
    };
  }

};

type MessagePreProcessor = (message: Message, client?: Client) => Promise<Message>

/**
 * An object that contains all available [[PREPROCESSORS]].
 * 
 * [Check out the processor code here](https://github.com/open-wa/wa-automate-nodejs/blob/master/src/structures/preProcessors.ts)
 */
export const MessagePreprocessors: {
  [processorName: string]: MessagePreProcessor
} = {
  AUTO_DECRYPT_SAVE,
  AUTO_DECRYPT,
  BODY_ONLY,
  SCRUB,
  UPLOAD_CLOUD
};

/**
 * A set of easy to use, built-in message processors.
 * 
 * [Check out the processor code here](https://github.com/open-wa/wa-automate-nodejs/blob/master/src/structures/preProcessors.ts)
 * 
 */
export enum PREPROCESSORS {
  /**
   * This preprocessor scrubs `body` and `content` from media messages.
   * This would be useful if you want to reduce the message object size because neither of these values represent the actual file, only the thumbnail.
   */
  SCRUB = "SCRUB",

  /**
   * A preprocessor that limits the amount of base64 data is present in the message object by removing duplication of `body` in `content` by replacing `content` with `""`.
   */
  BODY_ONLY = "BODY_ONLY",
  /**
   * Replaces the media thumbnail base64 in `body` with the actual file's DataURL.
   */
  AUTO_DECRYPT = "AUTO_DECRYPT",
  /**
   * Automatically saves the file in a folder named `/media` relative to the process working directory.
   *
   * PLEASE NOTE, YOU WILL NEED TO MANUALLY CLEAR THIS FOLDER!!!
   */
  AUTO_DECRYPT_SAVE = "AUTO_DECRYPT_SAVE",
  /**
   * 
   * Uploads file to a cloud storage provider (GCP/AWS for now).
   * 
   * If this preprocessor is set then you have to also set [`cloudUploadOptions`](https://docs.openwa.dev/interfaces/api_model_config.ConfigObject.html#cloudUploadOptions) in the config.
   * 
   */
  UPLOAD_CLOUD = "UPLOAD_CLOUD",
}
