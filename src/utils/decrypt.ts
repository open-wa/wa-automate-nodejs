import crypto from 'crypto';
import hkdf from 'futoin-hkdf';
import atob from 'atob';
var rp = require('request-promise');

const timeout = ms => new Promise(res => setTimeout(res, ms));
export const mediaTypes = {
  IMAGE: 'Image',
  VIDEO: 'Video',
  AUDIO: 'Audio',
  PTT: 'Audio',
  DOCUMENT: 'Document',
  STICKER: 'Image'
};

export const decryptMedia = async (message: any, useragentOverride?: string) => {
  let ua = useragentOverride||"WhatsApp/2.16.352 Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:72.0) Gecko/20100101 Firefox/72.0";
  if (!ua.includes('WhatsApp')) ua = "WhatsApp/2.16.352 "+ua;
  const options = {
    url: message.clientUrl.trim(),
    encoding: null,
    simple: false,
    resolveWithFullResponse: true,
    headers: {
      'User-Agent': ua
    }
  };
  let haventGottenImageYet = true;
  let res: any;
  while (haventGottenImageYet) {
    res = await rp.get(options);
    if (res.statusCode == 200) {
      haventGottenImageYet = false;
    } else {
      await timeout(2000);
    }
  }
  const buff = Buffer.from(res.body, 'utf8');
  const mediaDataBuffer = magix(buff, message.mediaKey, message.type);
  return mediaDataBuffer;
};

const magix = (fileData: any, mediaKeyBase64: any, mediaType: any) => {
  var encodedHex = fileData.toString('hex');
  var encodedBytes = hexToBytes(encodedHex);
  var mediaKeyBytes: any = base64ToBytes(mediaKeyBase64);
  const info = `WhatsApp ${mediaTypes[mediaType.toUpperCase()]} Keys`;
  const hash: string = 'sha256';
  const salt: any = new Uint8Array(32);
  const expandedSize = 112;
  // @ts-ignore
  const mediaKeyExpanded = hkdf(mediaKeyBytes, expandedSize, {
    salt,
    info,
    hash
  });
  var iv = mediaKeyExpanded.slice(0, 16);
  // console.log("mediaKeyExpanded:  (" + mediaKeyExpanded.length + " bytes)");
  var cipherKey = mediaKeyExpanded.slice(16, 48);
  encodedBytes = encodedBytes.slice(0, -10);
  var decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
  var decoded: any = decipher.update(encodedBytes);
  // console.log("decoded:  (" + decoded.length + " bytes)");
  const mediaDataBuffer = Buffer.from(decoded, 'utf-8');
  // const isimg = imageType(imageDataBuffer);
  return mediaDataBuffer;
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
