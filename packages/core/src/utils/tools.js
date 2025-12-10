"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeAccentedChars = exports.fixPath = exports.pathExists = exports.assertFile = exports.FileOutputTypes = exports.FileInputTypes = exports.ensureDUrl = exports.generateGHIssueLink = exports.processSendData = exports.now = exports.perf = exports.processSend = exports.base64MimeType = exports.getDUrl = exports.getBufferFromUrl = exports.isDataURL = exports.isBase64 = exports.camelize = exports.without = exports.getConfigFromProcessEnv = exports.smartUserAgent = exports.timeout = void 0;
exports.timePromise = timePromise;
exports.rmFileAsync = rmFileAsync;
const crypto_1 = __importDefault(require("crypto"));
const fs = __importStar(require("fs"));
const fsp = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const datauri_1 = __importDefault(require("datauri"));
const is_url_superb_1 = __importDefault(require("is-url-superb"));
const model_1 = require("../api/model");
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const os_1 = require("os");
const perf_hooks_1 = require("perf_hooks");
const mime_1 = __importDefault(require("mime"));
const os_2 = require("os");
const stream_1 = require("stream");
const logging_1 = require("../logging/logging");
const import_1 = require("@brillout/import");
const fsconstants = fsp.constants || {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1
};
const IGNORE_FILE_EXTS = [
    'mpga'
];
let _ft = null;
const ft = async () => {
    if (!_ft) {
        const x = await (0, import_1.import_)('file-type');
        _ft = x;
    }
    return _ft;
};
process.send = process.send || function () { };
const timeout = ms => new Promise(resolve => setTimeout(resolve, ms, 'timeout'));
exports.timeout = timeout;
const smartUserAgent = (useragent, v = '2.2117.5') => {
    useragent = useragent.replace(useragent
        .match(/\(([^()]*)\)/g)
        .find((x) => x.toLowerCase().includes('linux') ||
        x.toLowerCase().includes('windows')), '(Macintosh; Intel Mac OS X 10_15_2)');
    if (!useragent.includes('WhatsApp'))
        return `WhatsApp/${v} ${useragent}`;
    return useragent.replace(useragent
        .match(/WhatsApp\/([.\d])*/g)[0]
        .match(/[.\d]*/g)
        .find((x) => x), v);
};
exports.smartUserAgent = smartUserAgent;
const getConfigFromProcessEnv = (json) => {
    const output = {};
    json.forEach(({ env, key }) => {
        if (process.env[env])
            output[key] = process.env[env];
        if (process.env[env] === 'true' || process.env[env] === 'false')
            output[key] = Boolean(process.env[env]);
    });
    return output;
};
exports.getConfigFromProcessEnv = getConfigFromProcessEnv;
const without = (obj, key) => {
    const { [key]: discard, ...rest } = obj;
    return rest;
};
exports.without = without;
const camelize = (str) => {
    const arr = str.split('-');
    const capital = arr.map((item, index) => index
        ? item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()
        : item.toLowerCase());
    const capitalString = capital.join('');
    return capitalString;
};
exports.camelize = camelize;
const isBase64 = (str) => {
    const len = str.length;
    if (!len || len % 4 !== 0 || /[^A-Z0-9+/=]/i.test(str)) {
        return false;
    }
    const firstPaddingChar = str.indexOf('=');
    return (firstPaddingChar === -1 ||
        firstPaddingChar === len - 1 ||
        (firstPaddingChar === len - 2 && str[len - 1] === '='));
};
exports.isBase64 = isBase64;
const isDataURL = (s) => !!s.match(/^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/g);
exports.isDataURL = isDataURL;
const getBufferFromUrl = async (url, optionsOverride = {}) => {
    try {
        const res = await (0, axios_1.default)({
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
    }
    catch (error) {
        throw error;
    }
};
exports.getBufferFromUrl = getBufferFromUrl;
const getDUrl = async (url, optionsOverride = {}) => {
    try {
        const [buff, headers] = await (0, exports.getBufferFromUrl)(url, optionsOverride);
        const dUrl = `data:${headers['content-type']};base64,${buff.toString('base64')}`;
        return dUrl;
    }
    catch (error) {
        throw error;
    }
};
exports.getDUrl = getDUrl;
const base64MimeType = (dUrl) => {
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
exports.base64MimeType = base64MimeType;
const processSend = (message) => {
    if (process.send) {
        process.send(message);
        process.send(message);
        process.send(message);
    }
    return;
};
exports.processSend = processSend;
const perf = () => perf_hooks_1.performance || Date;
exports.perf = perf;
const now = () => (0, exports.perf)().now();
exports.now = now;
async function timePromise(fn) {
    const start = (0, exports.now)();
    await fn();
    return ((0, exports.now)() - start).toFixed(0);
}
const processSendData = (data = {}) => {
    const sd = () => process.send({
        type: 'process:msg',
        data
    }, (error) => {
        if (error) {
            console.error(error);
        }
    });
    return sd();
};
exports.processSendData = processSendData;
const generateGHIssueLink = (config, sessionInfo, extras = {}) => {
    const npm_ver = (0, child_process_1.execSync)('npm -v');
    const labels = [];
    if (sessionInfo.CLI)
        labels.push('CLI');
    if (!sessionInfo.LATEST_VERSION)
        labels.push('NCV');
    labels.push(config.multiDevice ? 'MD' : 'Legacy');
    if (sessionInfo.ACC_TYPE === 'BUSINESS')
        labels.push('BHA');
    if (sessionInfo.ACC_TYPE === 'PERSONAL')
        labels.push('PHA');
    const qp = {
        "template": "bug_report.yaml",
        "d_info": `${encodeURI(JSON.stringify((({ OS, purged, PAGE_UA, OW_KEY, NUM, NUM_HASH, ...o }) => o)(sessionInfo), null, 2))}`,
        "enviro": `${`-%20OS:%20${encodeURI(sessionInfo.OS)}%0A-%20Node:%20${encodeURI(process.versions.node)}%0A-%20npm:%20${(String(npm_ver)).replace(/\s/g, '')}`}`,
        "labels": labels.join(','),
        ...extras
    };
    return `https://github.com/open-wa/wa-automate-nodejs/issues/new?${Object.keys(qp).map(k => `${k}=${qp[k]}`).join('&')}`;
};
exports.generateGHIssueLink = generateGHIssueLink;
const ensureDUrl = async (file, requestConfig = {}, filename) => {
    if (Buffer.isBuffer(file)) {
        if (!filename) {
            const { ext } = await (await ft()).fileTypeFromBuffer(file);
            filename = `file.${ext}`;
        }
        return `data:${mime_1.default.getType(filename)};base64,${file.toString('base64').split(',')[1]}`;
    }
    else if (!(0, exports.isDataURL)(file) && !(0, exports.isBase64)(file)) {
        const relativePath = path.join(path.resolve(process.cwd(), file || ''));
        if (fs.existsSync(file) || fs.existsSync(relativePath)) {
            file = await (0, datauri_1.default)(fs.existsSync(file) ? file : relativePath);
        }
        else if ((0, is_url_superb_1.default)(file)) {
            file = await (0, exports.getDUrl)(file, requestConfig);
        }
        else
            throw new model_1.CustomError(model_1.ERROR_NAME.FILE_NOT_FOUND, 'Cannot find file. Make sure the file reference is relative, a valid URL or a valid DataURL');
    }
    if (!filename) {
        const { ext } = await (await ft()).fileTypeFromBuffer(Buffer.from(file.split(',')[1], 'base64'));
        filename = `file.${ext}`;
    }
    if (file.includes("data:") && file.includes("undefined") || file.includes("application/octet-stream") && filename && mime_1.default.getType(filename)) {
        file = `data:${mime_1.default.getType(filename)};base64,${file.split(',')[1]}`;
    }
    return file;
};
exports.ensureDUrl = ensureDUrl;
exports.FileInputTypes = {
    "VALIDATED_FILE_PATH": "VALIDATED_FILE_PATH",
    "URL": "URL",
    "DATA_URL": "DATA_URL",
    "BASE_64": "BASE_64",
    "BUFFER": "BUFFER",
    "READ_STREAM": "READ_STREAM",
};
exports.FileOutputTypes = {
    ...exports.FileInputTypes,
    "TEMP_FILE_PATH": "TEMP_FILE_PATH",
};
function rmFileAsync(file) {
    return new Promise((resolve, reject) => {
        fs.unlink(file, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(true);
            }
        });
    });
}
const assertFile = async (file, outfileName, desiredOutputType, requestConfig) => {
    let inputType;
    outfileName = (0, exports.sanitizeAccentedChars)(outfileName);
    if (typeof file == 'string') {
        if ((0, exports.isDataURL)(file))
            inputType = exports.FileInputTypes.DATA_URL;
        else if ((0, exports.isBase64)(file))
            inputType = exports.FileInputTypes.BASE_64;
        else {
            const relativePath = path.join(path.resolve(process.cwd(), file || ''));
            if (fs.existsSync(file) || fs.existsSync(relativePath)) {
                inputType = exports.FileInputTypes.VALIDATED_FILE_PATH;
            }
            else if ((0, is_url_superb_1.default)(file))
                inputType = exports.FileInputTypes.URL;
            if (!inputType)
                throw new model_1.CustomError(model_1.ERROR_NAME.FILE_NOT_FOUND, `Cannot find file. Make sure the file reference is relative, a valid URL or a valid DataURL: ${file.slice(0, 25)}`);
        }
    }
    else {
        if (Buffer.isBuffer(file))
            inputType = exports.FileInputTypes.BUFFER;
    }
    if (inputType === desiredOutputType)
        return file;
    switch (desiredOutputType) {
        case exports.FileOutputTypes.DATA_URL:
        case exports.FileOutputTypes.BASE_64:
            return await (0, exports.ensureDUrl)(file, requestConfig, outfileName);
            break;
        case exports.FileOutputTypes.TEMP_FILE_PATH: {
            let tfn = `${crypto_1.default.randomBytes(6).readUIntLE(0, 6).toString(36)}.${outfileName}`;
            if (inputType != exports.FileInputTypes.BUFFER) {
                file = await (0, exports.ensureDUrl)(file, requestConfig, outfileName);
                const ext = mime_1.default.getExtension(file.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0]);
                if (ext && !IGNORE_FILE_EXTS.includes(ext) && !tfn.endsWith(ext))
                    tfn = `${tfn}.${ext}`;
                file = Buffer.from(file.split(',')[1], 'base64');
            }
            const tempFilePath = path.join((0, os_2.tmpdir)(), tfn);
            await fs.writeFileSync(tempFilePath, file);
            logging_1.log.info(`Saved temporary file to ${tempFilePath}`);
            return tempFilePath;
            break;
        }
        case exports.FileOutputTypes.BUFFER:
            return Buffer.from((await (0, exports.ensureDUrl)(file, requestConfig, outfileName)).split(',')[1], 'base64');
            break;
        case exports.FileOutputTypes.READ_STREAM: {
            if (inputType === exports.FileInputTypes.VALIDATED_FILE_PATH)
                return fs.createReadStream(file);
            else if (inputType != exports.FileInputTypes.BUFFER)
                file = Buffer.from((await (0, exports.ensureDUrl)(file, requestConfig, outfileName)).split(',')[1], 'base64');
            return stream_1.Readable.from(file);
            break;
        }
    }
    return file;
};
exports.assertFile = assertFile;
const pathExists = async (_path, failSilent) => {
    _path = (0, exports.fixPath)(_path);
    try {
        await fsp.access(_path, fsconstants.R_OK | fsconstants.W_OK);
        return _path;
    }
    catch (error) {
        if (!failSilent)
            logging_1.log.error('Given check path threw an error', error);
        return false;
    }
};
exports.pathExists = pathExists;
const fixPath = (_path) => {
    _path = _path.replace("~", (0, os_1.homedir)());
    _path = _path.includes('./') ? path.join(process.cwd(), _path) : _path;
    return _path;
};
exports.fixPath = fixPath;
const sanitizeAccentedChars = (input) => {
    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};
exports.sanitizeAccentedChars = sanitizeAccentedChars;
//# sourceMappingURL=tools.js.map