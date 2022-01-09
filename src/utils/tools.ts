import { JsonObject } from 'type-fest';
import { ConfigObject, DataURL } from '../api/model';
import { default as axios, AxiosRequestConfig } from 'axios';
import { SessionInfo } from '../api/model/sessionInfo';
import { execSync } from 'child_process';
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

export const isDataURL: (s: string) => boolean = (s: string) =>
  !!s.match(/^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/g);

/**
 * @internal
 * A convinience method to download the [[DataURL]] of a file
 * @param url The url
 * @param optionsOverride You can use this to override the [axios request config](https://github.com/axios/axios#request-config)
 * @returns Promise<DataURL>
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

export const processSend: (message: string) => void = (message: string) => {
  if (process.send) {
    process.send(message);
    process.send(message);
    process.send(message);
  }
  return;
};


export const processSendData = (data : any = {}) => {
   process.send({
    type : 'process:msg',
    data
  })
  return;
}

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    "d_info": `${encodeURI(JSON.stringify((({ OS, PAGE_UA, ...o }) => o)(sessionInfo) ,null,2))}`,
    "enviro": `${`-%20OS:%20${encodeURI(sessionInfo.OS)}%0A-%20Node:%20${encodeURI(process.versions.node)}%0A-%20npm:%20${(String(npm_ver)).replace(/\s/g,'')}`}`,
    "labels": labels.join(','),
    ...extras
  }
  return `https://github.com/open-wa/wa-automate-nodejs/issues/new?${Object.keys(qp).map(k=>`${k}=${qp[k]}`).join('&')}`
}