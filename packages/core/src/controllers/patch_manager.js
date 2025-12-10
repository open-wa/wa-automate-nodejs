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
exports.getPatch = getPatch;
exports.injectLivePatch = injectLivePatch;
exports.getAndInjectLivePatch = getAndInjectLivePatch;
exports.getLicense = getLicense;
exports.earlyInjectionCheck = earlyInjectionCheck;
exports.getAndInjectLicense = getAndInjectLicense;
const crypto = __importStar(require("crypto"));
const events_1 = require("./events");
const initializer_1 = require("./initializer");
const axios_1 = __importDefault(require("axios"));
const fs_1 = require("fs");
const { default: PQueue } = require("p-queue");
const queue = new PQueue();
async function getPatch(config, spinner, sessionInfo) {
    var data = null;
    var headers = {};
    const ghUrl = `https://raw.githubusercontent.com/open-wa/wa-automate-nodejs/master/patches.json`;
    const hasSpin = !!spinner;
    const patchFilePath = `${process.cwd()}/patches.ignore.data.json`;
    if (config?.cachedPatch) {
        spinner.info('Searching for cached patch');
        if ((0, fs_1.existsSync)(patchFilePath)) {
            spinner.info('Found cached patch');
            const lastModifiedDate = (0, fs_1.statSync)(patchFilePath).mtimeMs;
            if ((lastModifiedDate + 86400000) < Date.now()) {
                spinner.fail('Cached patch is stale.');
            }
            else {
                const patch = (0, fs_1.readFileSync)(patchFilePath, 'utf8');
                data = JSON.parse(patch);
                spinner.info('Cached patch loaded');
            }
        }
        else
            spinner.fail('Cached patch not found');
    }
    const freshPatchFetchPromise = () => new Promise(async (resolve, reject) => {
        const patchesBaseUrl = config?.ghPatch ? ghUrl : initializer_1.pkg.patches;
        const patchesUrl = patchesBaseUrl + `?wv=${sessionInfo.WA_VERSION}&wav=${sessionInfo.WA_AUTOMATE_VERSION}`;
        if (!spinner)
            spinner = new events_1.Spin(config.sessionId, "FETCH_PATCH", config.disableSpins, true);
        spinner?.start(`Downloading ${config?.cachedPatch ? 'cached ' : ''}patches from ${patchesBaseUrl}`, hasSpin ? undefined : 2);
        const START = Date.now();
        var { data, headers } = await axios_1.default.get(patchesUrl).catch(() => {
            spinner?.info('Downloading patches. Retrying.');
            return axios_1.default.get(`${ghUrl}?v=${Date.now()}`);
        });
        const END = Date.now();
        if (!headers['etag']) {
            spinner?.info('Generating patch hash');
            headers['etag'] = crypto.createHash('md5').update(typeof data === 'string' ? data : JSON.stringify(data)).digest("hex").slice(-5);
        }
        spinner?.succeed(`Downloaded patches in ${(END - START) / 1000}s`);
        if (config?.cachedPatch) {
            spinner?.info('Saving patches to current working directory');
            (0, fs_1.writeFileSync)(patchFilePath, JSON.stringify(data, null, 2));
            spinner?.succeed('Saved patches to current working directory');
        }
        return resolve({
            data,
            tag: `${(headers.etag || '').replace(/"/g, '').slice(-5)}`
        });
    });
    if (config?.cachedPatch && data) {
        queue.add(freshPatchFetchPromise);
        return { data, tag: `CACHED-${(crypto.createHash('md5').update(typeof data === 'string' ? data : JSON.stringify(data)).digest("hex").slice(-5)).replace(/"/g, '').slice(-5)}` };
    }
    else
        return await freshPatchFetchPromise();
}
async function injectLivePatch(page, patch, spinner) {
    const { data, tag } = patch;
    spinner?.info('Installing patches');
    await Promise.all(data.map(patch => page.evaluate(`${patch}`)));
    spinner?.succeed(`Patches Installed: ${tag}`);
    return tag;
}
async function getAndInjectLivePatch(page, spinner, preloadedPatch, config, sessionInfo) {
    let patch = preloadedPatch;
    if (!patch)
        patch = await getPatch(config, spinner, sessionInfo);
    const patch_hash = await injectLivePatch(page, patch, spinner);
    sessionInfo.PATCH_HASH = patch_hash;
}
async function getLicense(config, me, debugInfo, spinner) {
    if (!config?.licenseKey || !me?._serialized)
        return false;
    const hasSpin = !!spinner;
    if (!spinner)
        spinner = new events_1.Spin(config.sessionId || "session", "FETCH_LICENSE", config.disableSpins, true);
    if (typeof config.licenseKey === "function") {
        config.licenseKey = await config.licenseKey(config.sessionId, me._serialized);
    }
    if (config.licenseKey && typeof config.licenseKey === "object") {
        config.licenseKey = config.licenseKey[me._serialized] || config.licenseKey[config.sessionId];
    }
    spinner?.start(`Fetching License: ${Array.isArray(config.licenseKey) ? config.licenseKey : typeof config.licenseKey === "string" ? config.licenseKey.indexOf("-") == -1 ? config.licenseKey.slice(-4) : config.licenseKey.split("-").slice(-1)[0] : config.licenseKey}`, hasSpin ? undefined : 2);
    try {
        const START = Date.now();
        const { data } = await axios_1.default.post(initializer_1.pkg.licenseCheckUrl, { key: config.licenseKey, number: me._serialized, ...debugInfo });
        const END = Date.now();
        spinner?.succeed(`Downloaded License in ${(END - START) / 1000}s`);
        return data;
    }
    catch (error) {
        spinner?.fail(`License request failed: ${error.statusCode || error.status || error.code} ${error.message}`);
        return false;
    }
}
async function earlyInjectionCheck(page) {
    await page.waitForFunction(`require("__debug").modulesMap["WAWebCollections"] ? true : false`, { timeout: 10, polling: 500 }).catch(() => { });
    return true;
}
async function getAndInjectLicense(page, config, me, debugInfo, spinner, preloadedLicense) {
    if (!config?.licenseKey || !me?._serialized)
        return false;
    let l_err;
    let data = preloadedLicense;
    spinner?.info('Checking License');
    try {
        if (!data) {
            spinner?.info('Fethcing License...');
            data = await getLicense(config, me, debugInfo, spinner);
        }
        if (data) {
            spinner?.info('Injecting License...');
            const l_success = await page.evaluate(data => eval(data), data);
            if (!l_success) {
                spinner?.info('License injection failed. Getting error..');
                l_err = await page.evaluate('window.launchError');
            }
            else {
                spinner?.info('License injected successfully..');
                const keyType = await page.evaluate('window.KEYTYPE || false');
                spinner?.succeed(`License Valid${keyType ? `: ${keyType}` : ''}`);
                return true;
            }
        }
        else
            l_err = "The key is invalid";
        if (l_err) {
            spinner?.fail(`License issue${l_err ? `: ${l_err}` : ""}`);
        }
        return false;
    }
    catch (error) {
        spinner?.fail(`License request failed: ${error.statusCode || error.status || error.code} ${error.message}`);
        return false;
    }
}
//# sourceMappingURL=patch_manager.js.map