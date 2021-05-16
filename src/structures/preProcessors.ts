import { Client } from "../api/Client";
import { Message } from "../api/model/message";
import mime from "mime";
import { outputFileSync } from "fs-extra";

const SCRUB: (message: Message, client: Client) => Promise<Message> = async (
  message: Message
) => {
  if (message.isMedia)
    return {
      ...message,
      conetnt: "",
      body: "",
    };
  return message;
};

const BODY_ONLY: (message: Message, client: Client) => Promise<Message> =
  async (message: Message) => {
    if (message.isMedia)
      return {
        ...message,
        conetnt: "",
      };
    return message;
  };

const AUTO_DECRYPT: (message: Message, client: Client) => Promise<Message> =
  async (message: Message, client: Client) => {
    if (message.isMedia)
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
  if (message.isMedia) {
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
}
