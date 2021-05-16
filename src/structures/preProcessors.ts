import { Client } from '../api/Client';
import { Message } from "../api/model/message";
import mime from 'mime';
import { outputFileSync } from 'fs-extra';

/**
 * This preprocessor scrubs `body` and `content` from media messages.
 * This would be useful if you want to reduce the message object size because neither of these values represent the actual file, only the thumbnail.
 * 
 * @param message The message object
 * @returns Promise<Message>
 */
const SCRUB : (message: Message, client: Client) => Promise<Message> = async (message: Message) => {
    if(message.isMedia) return {
        ...message,
        conetnt: "",
        body: ""
    }
    return message
}

/**
 * A preprocessor that limits the amount of base64 data is present in the message object by removing duplication of `body` in `content` by replacing `content` with `""`.
 * @param message message
 * @returns Promise<Message>
 */
export const BODY_ONLY : (message: Message, client: Client) => Promise<Message> = async (message: Message) => {
    if(message.isMedia) return {
        ...message,
        conetnt: "",
    }
    return message
}

/**
 * Replaces the media thumbnail base64 in `body` with the actual file's DataURL.
 * 
 * @param message message
 * @returns 
 */
const AUTO_DECRYPT : (message: Message, client: Client) => Promise<Message> = async (message: Message, client: Client) => {
    if(message.isMedia) return {
        ...message,
        body: await client.decryptMedia(message),
    }
    return message
}

/**
 * Automatically saves the file in a folder named `/media` relative to the process working directory.
 * 
 * PLEASE NOTE, YOU WILL NEED TO MANUALLY CLEAR THIS FOLDER!!!
 * 
 * @param message message
 * @param client The client
 * @returns Promise<Message>
 */
const AUTO_DECRYPT_SAVE : (message: Message, client: Client) => Promise<Message> = async (message: Message, client: Client) => {
    if(message.isMedia) {
        const filename = `${message.id.split("_").slice(-1)[0]}.${mime.extension(message.mimetype)}`;
        const mediaData = await client.decryptMedia(message)
        const filePath = `media/${filename}`;
        try {
            outputFileSync(filePath, Buffer.from(mediaData.split(",")[1], 'base64'));   
        } catch (error) {
            console.error(error);
            return message;  
        }
        return {
        ...message,
        body: filename,
        content: "",
        filePath
    }}
    return message
}

export const MessagePreprocessors : {
    [fnName: string] : (message: Message, client: Client) => Promise<Message>
} = {
    AUTO_DECRYPT_SAVE,
    AUTO_DECRYPT,
    BODY_ONLY,
    SCRUB
}

export enum PREPROCESSORS {
    SCRUB = "SCRUB",
    BODY_ONLY = "BODY_ONLY",
    AUTO_DECRYPT = "AUTO_DECRYPT",
    AUTO_DECRYPT_SAVE = "AUTO_DECRYPT_SAVE"
}