"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigWithCase = void 0;
const tsj = require("ts-json-schema-generator");
const change_case_1 = require("change-case");
const defaultConfig = {
    path: "../api/model/config.ts",
    tsconfig: "../../tsconfig.json",
    type: "ConfigObject",
};
const getConfigWithCase = (config) => {
    if (!config)
        config = defaultConfig;
    const schema = tsj.createGenerator(config).createSchema(config.type);
    const ignoredConfigs = [
        'useStealth',
        'chromiumArgs',
        'executablePath',
        'skipBrokenMethodsCheck',
        'inDocker',
        'autoRefresh',
        'bypassCSP',
        'throwErrorOnTosBlock',
        'killProcessOnBrowserClose',
        'qrRefreshS'
    ];
    //only convert simple types
    // const configs = Object.keys(schema.definitions.ConfigObject.properties).map(key=>({...schema.definitions.ConfigObject.properties[key],key})).filter(({type,key})=>type&&!ignoredConfigs.includes(key));
    const configs = Object.entries(schema.definitions.ConfigObject.properties).map(([key, entry]) => {
        if (key === 'sessionData') {
            entry.type = 'string';
            entry.description = 'The base64 encoded sessionData used to restore a session.';
            delete entry.anyOf;
        }
        if (key === 'licenseKey') {
            entry.type = 'string';
            entry.description = 'The license key to use with the session.';
            delete entry.anyOf;
        }
        return Object.assign(Object.assign({}, entry), { key });
    }).filter(({ type, key }) => type && !ignoredConfigs.includes(key));
    const configWithCases = configs.map(o => (Object.assign({ env: `WA_${change_case_1.constantCase(o.key)}`, p: change_case_1.paramCase(o.key) }, o)));
    return configWithCases;
};
exports.getConfigWithCase = getConfigWithCase;
