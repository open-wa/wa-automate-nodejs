import crypto from 'crypto';
import hkdf from 'futoin-hkdf';
import atob from 'atob';
import axios from 'axios';
import { ResponseType } from 'axios';
import { RequireAtLeastOne } from 'type-fest/source/require-at-least-one';
import { Message } from '@open-wa/wa-automate-types-only/dist/api/model/message';
const makeOptions = (useragentOverride: string | undefined) => ({
  responseType: 'arraybuffer' as ResponseType,
  headers: {
    'User-Agent': processUA(useragentOverride),
    'DNT': 1,
    'Upgrade-Insecure-Requests': 1,
    'origin': 'https://web.whatsapp.com/',
    'referer': 'https://web.whatsapp.com/'
  }
});

const nonSizeTypes = [
  "sticker"
]

const timeout = (ms: number) => new Promise(res => setTimeout(res, ms));
export const mediaTypes : {
  [k: string] : string
} = {
  IMAGE: 'Image',
  VIDEO: 'Video',
  AUDIO: 'Audio',
  PTT: 'Audio',
  DOCUMENT: 'Document',
  STICKER: 'Image'
};

export type RequiredDecryptionMessage = {
  mediaKey: string,
  filehash: string,
  mimetype: string,
  type: string,
  size: number
}

export type DecryptableMessage = RequireAtLeastOne<{
  clientUrl ?: string,
  deprecatedMms3Url ?: string,
}, 'clientUrl' | 'deprecatedMms3Url'> & RequiredDecryptionMessage

export class MissingCriticalDataError extends Error {
  constructor(public message: string) {
    super();
    this.name = "MissingCriticalDataError"
    this.message = message;
  }
}

//@ts-ignore
export const decryptMedia :  (message: DecryptableMessage | Message | boolean, useragentOverride?: string) => Promise<Buffer> = async (message: DecryptableMessage | Message | boolean, useragentOverride?: string) => {
  const options = makeOptions(useragentOverride);
  if(!message || (message as any) === false || typeof message === "boolean") return new Error("Message is not a valid message");
  let missingProps = [];
  message = message as DecryptableMessage;
  if (!message.mediaKey) missingProps.push('mediaKey');
  if (!message.filehash) missingProps.push('filehash');
  if (!message.mimetype) missingProps.push('mimetype');
  if (!message.type) missingProps.push('type');
  if (!message.size) missingProps.push('size'); 

  if (!message || !message.mediaKey || !message.filehash || !message.mimetype || !message.type || !message.size) {
    if (missingProps.length == 1 && missingProps[0]==="size") {
      if(!nonSizeTypes.includes(message.type)) console.warn("@open-wa/wa-decrypt - WARN: size property is missing. File will fail an integrity check.")
    } 
    else throw new MissingCriticalDataError(`Message is missing critical data: ${missingProps.join(', ')}`);
  }
  let haventGottenImageYet = true;
  let res: any;
  try {
    while (haventGottenImageYet) {
      res = await axios.get(message.deprecatedMms3Url.trim(), options);
      if (res.status == 200) {
        haventGottenImageYet = false;
      } else if (res.status == 404) {
        console.error('This media does not exist, or is no longer available on the server. Please see: https://docs.openwa.dev/pages/How%20to/decrypt-media.html#40439d')
        haventGottenImageYet = false;
      } else {
        await timeout(2000);
      }
    }
  } catch (error) {
    throw error
  }
  const buff = Buffer.from(res.data, 'binary');
  return magix(buff, message.mediaKey, message.type, message.size, message.mimetype);
};

const processUA = (userAgent: string | undefined) => {
  let ua = userAgent || 'WhatsApp/2.16.352 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.92 Safari/537.36';
  if (!ua.includes('WhatsApp')) ua = "WhatsApp/2.16.352 " + ua;
  return ua;
}

const magix = (fileData: any, mediaKeyBase64: any, mediaType: string, expectedSize?: number, mimetype ?: string) => {
  var encodedHex = fileData.toString('hex');
  var encodedBytes = hexToBytes(encodedHex);
  var mediaKeyBytes: any = base64ToBytes(mediaKeyBase64);
  const info = `WhatsApp ${mediaTypes[mediaType.toUpperCase()] || mediaTypes[Object.keys(mediaTypes).filter(type=>mimetype.includes(type.toLowerCase()))[0]]} Keys`;
  const hash: string = 'sha256';
  const salt: any = new Uint8Array(32);
  const expandedSize = 112;
  const mediaKeyExpanded = hkdf(mediaKeyBytes, expandedSize, {
    salt,
    info,
    hash
  });
  var iv = mediaKeyExpanded.slice(0, 16);
  var cipherKey = mediaKeyExpanded.slice(16, 48);
  var decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
  var decoded: Buffer = decipher.update(encodedBytes);
  const mediaDataBuffer = expectedSize ? fixPadding(decoded, expectedSize) : decoded;
  return mediaDataBuffer;
};

const fixPadding = (data: Buffer, expectedSize: number) => {
  let padding = (16 - (expectedSize % 16)) & 0xf;
  if (padding > 0) {
    if ((expectedSize + padding) == data.length) {
      //  console.log(`trimmed: ${padding} bytes`);
      data = data.slice(0, data.length - padding);
    } else if ((data.length + padding) == expectedSize) {
      // console.log(`adding: ${padding} bytes`);
      let arr = new Uint16Array(padding).map(() => padding);
      data = Buffer.concat([data, Buffer.from(arr)]);
    }
  }
  //@ts-ignore
  return Buffer.from(data, 'utf-8');
};


const hexToBytes = (hexStr: any) => {
  var intArray = [];
  for (var i = 0; i < hexStr.length; i += 2) {
    intArray.push(parseInt(hexStr.substr(i, 2), 16));
  }
  return new Uint8Array(intArray);
};

const base64ToBytes = (base64Str: any) => {
  var binaryStr = atob(base64Str);
  var byteArray = new Uint8Array(binaryStr.length);
  for (var i = 0; i < binaryStr.length; i++) {
    byteArray[i] = binaryStr.charCodeAt(i);
  }
  return byteArray;
};

/**
 * This removes all but the minimum required data to decrypt media. This can be useful to minimize sensitive data transport. Note, this deletes all information regarding where/who sent the message.
 */
export const bleachMessage = (m : {
  [k : string] : unknown
}) => {
  var r = { ...m };
  Object.keys(m).map(key => {
    if (!["type", "clientUrl", "mimetype", "mediaKey", "size", "filehash", "uploadhash", "deprecatedMms3Url"].includes(key)) delete r[key]
  })
  return r;
}
