"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREPROCESSORS = exports.MessagePreprocessors = void 0;
const mime_1 = __importDefault(require("mime"));
const fs_extra_1 = require("fs-extra");
const config_1 = require("../api/model/config");
const p_queue_1 = __importDefault(require("p-queue"));
const pico_s3_1 = require("pico-s3");
const processedFiles = {};
let uploadQueue;
const SCRUB = async (message) => {
    if (message.deprecatedMms3Url && message.mimetype)
        return {
            ...message,
            content: "",
            body: "",
        };
    return message;
};
const BODY_ONLY = async (message) => {
    if (message.deprecatedMms3Url && message.mimetype)
        return {
            ...message,
            content: "",
        };
    return message;
};
const AUTO_DECRYPT = async (message, client) => {
    if (message.deprecatedMms3Url && message.mimetype)
        return {
            ...message,
            body: await client.decryptMedia(message),
        };
    return message;
};
const AUTO_DECRYPT_SAVE = async (message, client, alreadyBeingProcessed) => {
    if (message.deprecatedMms3Url && message.mimetype) {
        const filename = `${message.mId}.${mime_1.default.getExtension(message.mimetype)}`;
        const filePath = `media/${filename}`;
        if (alreadyBeingProcessed) {
            return {
                ...message,
                body: filename,
                content: "",
                filePath,
            };
        }
        try {
            const mediaData = await client.decryptMedia(message);
            (0, fs_extra_1.outputFileSync)(filePath, Buffer.from(mediaData.split(",")[1], "base64"));
        }
        catch (error) {
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
const UPLOAD_CLOUD = async (message, client, alreadyBeingProcessed) => {
    if (message?.deprecatedMms3Url && message.mimetype) {
        const { cloudUploadOptions } = client.getConfig();
        if (message.fromMe && (cloudUploadOptions.ignoreHostAccount || process.env.OW_CLOUD_IGNORE_HOST))
            return message;
        if (!uploadQueue) {
            uploadQueue = new p_queue_1.default({ concurrency: 2, interval: 1000, carryoverConcurrencyCount: true, intervalCap: 2 });
        }
        const filename = `${message.mId || `${Date.now()}`}.${mime_1.default.getExtension(message.mimetype)}`;
        const mediaData = await client.decryptMedia(message);
        if (!cloudUploadOptions)
            return message;
        const provider = (process.env.OW_CLOUD_PROVIDER || cloudUploadOptions.provider);
        const opts = {
            file: mediaData,
            filename,
            provider,
            accessKeyId: process.env.OW_CLOUD_ACCESS_KEY_ID || cloudUploadOptions.accessKeyId,
            secretAccessKey: process.env.OW_CLOUD_SECRET_ACCESS_KEY || cloudUploadOptions.secretAccessKey,
            bucket: process.env.OW_CLOUD_BUCKET || cloudUploadOptions.bucket,
            region: process.env.OW_CLOUD_REGION || cloudUploadOptions.region,
            public: process.env.OW_CLOUD_PUBLIC && true || cloudUploadOptions.public,
            headers: cloudUploadOptions.headers,
        };
        const dirStrat = process.env.OW_DIRECTORY || cloudUploadOptions.directory;
        if (dirStrat) {
            let directory = '';
            switch (dirStrat) {
                case config_1.DIRECTORY_STRATEGY.DATE:
                    directory = `${new Date().toISOString().slice(0, 10)}`;
                    break;
                case config_1.DIRECTORY_STRATEGY.CHAT:
                    directory = `${message.from.replace("@c.us", "").replace("@g.us", "")}`;
                    break;
                case config_1.DIRECTORY_STRATEGY.DATE_CHAT:
                    directory = `${new Date().toISOString().slice(0, 10)}/${message.from.replace("@c.us", "").replace("@g.us", "")}`;
                    break;
                case config_1.DIRECTORY_STRATEGY.CHAT_DATE:
                    directory = `${message.from.replace("@c.us", "").replace("@g.us", "")}/${new Date().toISOString().slice(0, 10)}`;
                    break;
                default:
                    directory = dirStrat;
                    break;
            }
            opts.directory = directory;
        }
        if (!opts.accessKeyId) {
            console.error("UPLOAD ERROR: No accessKeyId provided. If you're using the CLI, set env var OW_CLOUD_ACCESS_KEY_ID");
            return message;
        }
        if (!opts.secretAccessKey) {
            console.error("UPLOAD ERROR: No secretAccessKey provided. If you're using the CLI, set env var OW_CLOUD_SECRET_ACCESS_KEY");
            return message;
        }
        if (!opts.bucket) {
            console.error("UPLOAD ERROR: No bucket provided. If you're using the CLI, set env var OW_CLOUD_BUCKET");
            return message;
        }
        if (!opts.provider) {
            console.error("UPLOAD ERROR: No provider provided. If you're using the CLI, set env var OW_CLOUD_PROVIDER");
            return message;
        }
        const url = (0, pico_s3_1.getCloudUrl)(opts);
        if (!processedFiles[filename] && !alreadyBeingProcessed) {
            processedFiles[filename] = true;
            try {
                await uploadQueue.add(() => (0, pico_s3_1.upload)(opts).catch(() => { }));
            }
            catch (error) {
                console.error(error);
                return message;
            }
        }
        return {
            ...message,
            cloudUrl: url
        };
    }
    return message;
};
exports.MessagePreprocessors = {
    AUTO_DECRYPT_SAVE,
    AUTO_DECRYPT,
    BODY_ONLY,
    SCRUB,
    UPLOAD_CLOUD
};
var PREPROCESSORS;
(function (PREPROCESSORS) {
    PREPROCESSORS["SCRUB"] = "SCRUB";
    PREPROCESSORS["BODY_ONLY"] = "BODY_ONLY";
    PREPROCESSORS["AUTO_DECRYPT"] = "AUTO_DECRYPT";
    PREPROCESSORS["AUTO_DECRYPT_SAVE"] = "AUTO_DECRYPT_SAVE";
    PREPROCESSORS["UPLOAD_CLOUD"] = "UPLOAD_CLOUD";
})(PREPROCESSORS || (exports.PREPROCESSORS = PREPROCESSORS = {}));
//# sourceMappingURL=preProcessors.js.map