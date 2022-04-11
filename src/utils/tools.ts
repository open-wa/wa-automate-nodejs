import * as fs from 'fs'
import * as path from 'path';
import datauri from 'datauri'
import isUrl from 'is-url-superb'
import { JsonObject } from 'type-fest';
import { ConfigObject, CustomError, DataURL, ERROR_NAME } from '../api/model';
import { default as axios, AxiosRequestConfig } from 'axios';
import { SessionInfo } from '../api/model/sessionInfo';
import { execSync } from 'child_process';
import {
  performance
} from 'perf_hooks';

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
    const dUrl: DataURL = `data:${
      res.headers['content-type']
    };base64,${Buffer.from(res.data, 'binary').toString('base64')}`;
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

  const mime = dUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);

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
export const processSendData = async (data : any = {}) => {
  const sd = (resolve,reject) => process.send({
    type : 'process:msg',
    data
  }, (error) => {
    if (error) {
      console.error(error);
      reject(error)
    }
    resolve(true)
  })
   return await new Promise((resolve, reject)=>{
    sd(resolve,reject)
   })
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
 * @returns A DataURL
 */
export const ensureDUrl = async (file : string, requestConfig: AxiosRequestConfig = {}) => {
  if(!isDataURL(file) && !isBase64(file)) {
      //must be a file then
      const relativePath = path.join(path.resolve(process.cwd(),file|| ''));
      if(fs.existsSync(file) || fs.existsSync(relativePath)) {
        file = await datauri(fs.existsSync(file)  ? file : relativePath);
      } else if(isUrl(file)){
        file = await getDUrl(file, requestConfig);
      } else throw new CustomError(ERROR_NAME.FILE_NOT_FOUND,'Cannot find file. Make sure the file reference is relative, a valid URL or a valid DataURL')
    }
    return file;
}