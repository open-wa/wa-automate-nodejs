import Crypto from "crypto";
import * as fs from 'fs'
import * as fsp from 'fs/promises'
import * as path from 'path';
import datauri from 'datauri'
import isUrl from 'is-url-superb'
import { JsonObject } from 'type-fest';
import { AdvancedFile, ConfigObject, CustomError, DataURL, ERROR_NAME } from '../api/model';
import { default as axios, AxiosRequestConfig, AxiosResponseHeaders } from 'axios';
import { SessionInfo } from '../api/model/sessionInfo';
import { execSync } from 'child_process';
import { homedir } from 'os'
import {
  performance
} from 'perf_hooks';
import mime from 'mime';
import { tmpdir } from 'os';
import { Readable } from "stream";
import { log } from "../logging/logging";
import { import_ } from '@brillout/import'
const fsconstants = fsp.constants || {
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1
};

const IGNORE_FILE_EXTS = [
  'mpga'
]

let _ft = null;

const ft = async () =>{
  if(!_ft) {
    const x = await import_('file-type');
    _ft = x
  }
  return _ft;
}

//@ts-ignore
process.send = process.send || function () {};

export const timeout = ms =>  new Promise(resolve => setTimeout(resolve, ms, 'timeout'));
/**
 *  Use this to generate a more likely valid user agent. It makes sure it has the WA part and replaces any windows or linux os info with mac.
 * @param useragent Your custom user agent
 * @param v The WA version from the debug info. This is optional. default is 2.2117.5
 */
export const smartUserAgent: (ua: string, version?: string) => string = (
  useragent: string,
  v = '2.2117.5'
) => {
  useragent = useragent.replace(
    useragent
      .match(/\(([^()]*)\)/g)
      .find(
        (x) =>
          x.toLowerCase().includes('linux') ||
          x.toLowerCase().includes('windows')
      ),
    '(Macintosh; Intel Mac OS X 10_15_2)'
  );
  if (!useragent.includes('WhatsApp')) return `WhatsApp/${v} ${useragent}`;
  return useragent.replace(
    useragent
      .match(/WhatsApp\/([.\d])*/g)[0]
      .match(/[.\d]*/g)
      .find((x) => x),
    v
  );
};

export const getConfigFromProcessEnv: any = (json: any) => {
  const output = {};
  json.forEach(({ env, key }) => {
    if (process.env[env]) output[key] = process.env[env];
    if (process.env[env] === 'true' || process.env[env] === 'false')
      output[key] = Boolean(process.env[env]);
  });
  return output;
};

/**
 * Remove the key from the object and return the rest of the object.
 * @param {JsonObject} obj - The object to be filtered.
 * @param {string} key - The key to discard.
 * @returns The object without the key.
 */
export const without: any = (obj: JsonObject, key: string) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [key]: discard,
    ...rest
  } = obj;
  return rest;
};

export const camelize: (str: string) => string = (str: string) => {
  const arr = str.split('-');
  const capital = arr.map((item, index) =>
    index
      ? item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()
      : item.toLowerCase()
  );
  // ^-- change here.
  const capitalString = capital.join('');
  return capitalString;
};

/**
 * Check if a string is Base64
 * @param str string
 * @returns 
 */
export const isBase64: (str: string) => boolean = (str: string) => {
  const len = str.length;
  if (!len || len % 4 !== 0 || /[^A-Z0-9+/=]/i.test(str)) {
    return false;
  }
  const firstPaddingChar = str.indexOf('=');
  return (
    firstPaddingChar === -1 ||
    firstPaddingChar === len - 1 ||
    (firstPaddingChar === len - 2 && str[len - 1] === '=')
  );
};

/**
 * Check if a string is a DataURL
 * @param s string
 * @returns 
 */
export const isDataURL: (s: string) => boolean = (s: string) =>
  !!s.match(/^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/g);


/**
 * @internal
 * A convinience method to download the buffer of a downloaded file
 * @param url The url
 * @param optionsOverride You can use this to override the [axios request config](https://github.com/axios/axios#request-config)
 */
export const getBufferFromUrl: (
  url: string,
  optionsOverride?: any
) => Promise<[Buffer, any]> = async (
  url: string,
  optionsOverride: AxiosRequestConfig = {}
) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: {
        DNT: 1,
        'Upgrade-Insecure-Requests': 1,
      },
      ...optionsOverride,
      responseType: 'arraybuffer',
    });
    return [Buffer.from(res.data, 'binary'), res.headers];
  } catch (error) {
    throw error;
  }
};


/**
 * @internal
 * A convinience method to download the [[DataURL]] of a file
 * @param url The url
 * @param optionsOverride You can use this to override the [axios request config](https://github.com/axios/axios#request-config)
 */
export const getDUrl: (
  url: string,
  optionsOverride?: AxiosRequestConfig
) => Promise<DataURL> = async (
  url: string,
  optionsOverride: AxiosRequestConfig = {}
) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const [buff, headers] = await getBufferFromUrl(url, optionsOverride)
    const dUrl: DataURL = `data:${
      headers['content-type']
    };base64,${buff.toString('base64')}` as DataURL;
    return dUrl;
  } catch (error) {
    throw error;
  }
};

/**
 * @internal
 * Use this to extract the mime type from a [[DataURL]]
 */
export const base64MimeType: (dUrl: DataURL) => string = (dUrl: DataURL) => {
  let result = null;

  if (typeof dUrl !== 'string') {
    return result;
  }

  const mime = (dUrl as string).match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);

  if (mime && mime.length) {
    result = mime[1];
  }

  return result;
};

/**
 * If process.send is defined, send the message three times
 * @param {string} message - The message to send to the parent process.
 * @returns Nothing.
 */
export const processSend: (message: string) => void = (message: string) => {
  if (process.send) {
    process.send(message);
    process.send(message);
    process.send(message);
  }
  return;
};

/**
 * Return the performance object if it is available, otherwise return the Date object
 */
export const perf = () => performance || Date;

/**
 * Return the current time in milliseconds
 */
export const now = () => perf().now();

/**
 * `timePromise` returns a promise that resolves to the time it took to run the function passed to it
 * @param fn - the function to be timed.
 * @returns A string.
 */
export async function timePromise(fn: () => Promise<any>): Promise<string> {
  const start = now();
  await fn()
  return (now() - start).toFixed(0);
}

/**
 * It sends a message to the parent process.
 * @param {any} data - The data to be sent to the parent process.
 * @returns Nothing.
 */
export const processSendData = (data : any = {}) => {
  const sd = () => process.send({
    type : 'process:msg',
    data
  }, (error) => {
    if (error) {
      console.error(error);
    }
  })
  return sd()
  //  return await new Promise((resolve, reject)=>{
  //   sd(resolve,reject)
  //  })
}

/**
 * It generates a link to the GitHub issue template for the current session
 * @param {ConfigObject} config - the config object
 * @param {SessionInfo} sessionInfo - The sessionInfo object from the CLI
 * @param {any} extras - any
 * @returns A link to the issue tracker for the current session.
 */
export const generateGHIssueLink = (config : ConfigObject, sessionInfo: SessionInfo, extras : any = {}) => {
  const npm_ver = execSync('npm -v')
  const labels = []
  if(sessionInfo.CLI) labels.push('CLI')
  if(!sessionInfo.LATEST_VERSION) labels.push('NCV')
  labels.push(config.multiDevice ? 'MD' : 'Legacy')
  if(sessionInfo.ACC_TYPE === 'BUSINESS') labels.push('BHA')
  if(sessionInfo.ACC_TYPE === 'PERSONAL') labels.push('PHA')
  const qp = {
    "template": "bug_report.yaml",
    //@ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    "d_info": `${encodeURI(JSON.stringify((({ OS, purged, PAGE_UA, OW_KEY, NUM, NUM_HASH, ...o }) => o)(sessionInfo) ,null,2))}`,
    "enviro": `${`-%20OS:%20${encodeURI(sessionInfo.OS)}%0A-%20Node:%20${encodeURI(process.versions.node)}%0A-%20npm:%20${(String(npm_ver)).replace(/\s/g,'')}`}`,
    "labels": labels.join(','),
    ...extras
  }
  return `https://github.com/open-wa/wa-automate-nodejs/issues/new?${Object.keys(qp).map(k=>`${k}=${qp[k]}`).join('&')}`
}

/**
 * If the file is a DataURL, return it. If it's a file, convert it to a DataURL. If it's a URL,
 * download it and convert it to a DataURL. If Base64, returns it.
 * @param {string} file - The file to be converted to a DataURL.
 * @param {AxiosRequestConfig} requestConfig - AxiosRequestConfig = {}
 * @param {string} filename - Filename with an extension so a datauri mimetype can be inferred.
 * @returns A DataURL
 */
export const ensureDUrl = async (file : string | Buffer, requestConfig: AxiosRequestConfig = {}, filename?: string) => {
  if(Buffer.isBuffer(file)) {
    if(!filename) {
      const { ext } = await (await ft()).fileTypeFromBuffer(file);
      filename = `file.${ext}`;
    }
    return `data:${mime.getType(filename)};base64,${file.toString('base64').split(',')[1]}`
  } else
  if(!isDataURL(file) && !isBase64(file)) {
      //must be a file then
      const relativePath = path.join(path.resolve(process.cwd(),file|| ''));
      if(fs.existsSync(file) || fs.existsSync(relativePath)) {
        file = await datauri(fs.existsSync(file)  ? file : relativePath);
      } else if(isUrl(file)){
        file = await getDUrl(file, requestConfig);
      } else throw new CustomError(ERROR_NAME.FILE_NOT_FOUND,'Cannot find file. Make sure the file reference is relative, a valid URL or a valid DataURL')
    }
    if(!filename) {
      const { ext } = await (await ft()).fileTypeFromBuffer(Buffer.from(file.split(',')[1], 'base64'));
      filename = `file.${ext}`;
    }
    if(file.includes("data:") && file.includes("undefined") || file.includes("application/octet-stream") && filename && mime.getType(filename)) {
      file = `data:${mime.getType(filename)};base64,${file.split(',')[1]}`
    }
    return file;
}

export const FileInputTypes = {
  "VALIDATED_FILE_PATH": "VALIDATED_FILE_PATH",
  "URL": "URL",
  "DATA_URL": "DATA_URL",
  "BASE_64": "BASE_64",
  "BUFFER": "BUFFER",
  "READ_STREAM": "READ_STREAM",
}

export const FileOutputTypes = {
  ...FileInputTypes,
  "TEMP_FILE_PATH": "TEMP_FILE_PATH",
}

/**
 * Remove file asynchronously
 * @param file Filepath
 * @returns 
 */
export function rmFileAsync(file: string) {
  return new Promise((resolve, reject) => {
    fs.unlink(file, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    })
  })
}

/**
 * Takes a file parameter and consistently returns the desired type of file.
 * @param file The file path, URL, base64 or DataURL string of the file
 * @param outfileName The ouput filename of the file
 * @param desiredOutputType The type of file output required from this function
 * @param requestConfig optional axios config if file parameter is a url
 */
export const assertFile : (file: AdvancedFile | Buffer, outfileName: string, desiredOutputType: keyof typeof FileOutputTypes, requestConfig ?: any ) => Promise<string | Buffer | Readable > = async (file, outfileName,  desiredOutputType, requestConfig) => {
  let inputType;
  outfileName = sanitizeAccentedChars(outfileName)
  if(typeof file == 'string') {
    if(isDataURL(file)) inputType = FileInputTypes.DATA_URL
    else if(isBase64(file)) inputType = FileInputTypes.BASE_64
    /**
     * Check if it is a path
     */
    else {
      const relativePath = path.join(path.resolve(process.cwd(),file|| ''));
      if(fs.existsSync(file) || fs.existsSync(relativePath)) {
        // file = await datauri(fs.existsSync(file)  ? file : relativePath);
        inputType = FileInputTypes.VALIDATED_FILE_PATH; 
      } else if(isUrl(file)) inputType = FileInputTypes.URL; 
      /**
       * If not file type is determined by now then it is some sort of unidentifiable string. Throw an error.
       */
      if(!inputType) throw new CustomError(ERROR_NAME.FILE_NOT_FOUND,`Cannot find file. Make sure the file reference is relative, a valid URL or a valid DataURL: ${file.slice(0,25)}`)
    }
  } else {
    if(Buffer.isBuffer(file)) inputType = FileInputTypes.BUFFER
    /**
     * Leave space to determine if incoming file parameter is any other type of object (maybe one day people will submit a path object as a param?)
     */
  }
  if(inputType === desiredOutputType) return file;
  switch(desiredOutputType) {
    case FileOutputTypes.DATA_URL:
    case FileOutputTypes.BASE_64:
      return await ensureDUrl(file as string, requestConfig, outfileName);
      break;
    case FileOutputTypes.TEMP_FILE_PATH: {
      /**
       * Create a temp file in tempdir, return the tempfile.
       */
      let tfn = `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${outfileName}`;
      if(inputType != FileInputTypes.BUFFER){
        file = await ensureDUrl(file as string, requestConfig, outfileName);
        const ext = mime.getExtension(file.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0]);
        if(ext && !IGNORE_FILE_EXTS.includes(ext) && !tfn.endsWith(ext)) tfn = `${tfn}.${ext}`;
        file = Buffer.from(file.split(',')[1], 'base64')
      }
      const tempFilePath = path.join(tmpdir(),tfn);
      await fs.writeFileSync(tempFilePath, file);
      log.info(`Saved temporary file to ${tempFilePath}`)
      return tempFilePath
      break;
    }
    case FileOutputTypes.BUFFER:
      return Buffer.from((await ensureDUrl(file as string, requestConfig, outfileName)).split(',')[1], 'base64');
      break;
    case FileOutputTypes.READ_STREAM: {
      if(inputType === FileInputTypes.VALIDATED_FILE_PATH) return fs.createReadStream(file)
      else if(inputType != FileInputTypes.BUFFER) file = Buffer.from((await ensureDUrl(file as string, requestConfig, outfileName)).split(',')[1], 'base64')
      return Readable.from(file)
      break;
    }
  }
  return file;
} 

/**
 * Checks if a given path exists.
 * 
 * If exists, returns the resolved absolute path. Otherwise returns false.
 * 
 * @param _path a relative, absolute or homedir path to a folder or a file
 * @param failSilent If you're expecting for the file to not exist and just want the `false` response then set this to true to prevent false-positive error messages in the logs.
 * @returns string | false
 */
export const pathExists : (_path : string, failSilent?: boolean) => Promise<string | false> = async (_path : string, failSilent ?: boolean) => {
  _path = fixPath(_path)
  try {
      await fsp.access(_path, fsconstants.R_OK | fsconstants.W_OK)
      return _path;
  } catch (error) {
      if(!failSilent) log.error('Given check path threw an error', error)
      return false;
  }
}

/**
 * Returns an absolute file path reference
 * @param _path a relative, absolute or homedir path to a folder or a file
 * @returns string
 */
export const fixPath : (_path : string) => string = ( _path : string) => {
  _path = _path.replace("~",homedir())
  _path = _path.includes('./') ? path.join(process.cwd(), _path) : _path;
  return _path;
}

/**
 * 
 * Accented filenames break file sending in docker containers. This is used to replace accented chars in strings to prevent file sending failures.
 * 
 * @param input The raw string
 * @returns A sanitized string with all accented chars removed
 */
export const sanitizeAccentedChars : (input : string) => string = (input: string) => {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
