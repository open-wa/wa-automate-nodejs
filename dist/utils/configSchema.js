"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFromProcessEnv = exports.getConfigWithCase = void 0;
var tsj = require("ts-json-schema-generator");
var change_case_1 = require("change-case");
var defaultConfig = {
    path: "../api/model/config.ts",
    tsconfig: "../../tsconfig.json",
    type: "ConfigObject",
};
exports.getConfigWithCase = function (config) {
    if (!config)
        config = defaultConfig;
    var schema = tsj.createGenerator(config).createSchema(config.type);
    var ignoredConfigs = [
        'browserRevision',
        'useStealth',
        'chromiumArgs',
        'browserWSEndpoint',
        'executablePath',
        'skipBrokenMethodsCheck',
        'inDocker',
        'bypassCSP',
        'throwErrorOnTosBlock',
        'killProcessOnBrowserClose'
    ];
    var configs = Object.keys(schema.definitions.ConfigObject.properties).map(function (key) { return (__assign(__assign({}, schema.definitions.ConfigObject.properties[key]), { key: key })); }).filter(function (_a) {
        var type = _a.type, key = _a.key;
        return type && !ignoredConfigs.includes(key);
    });
    var configWithCases = configs.map(function (o) { return (__assign({ env: "WA_" + change_case_1.constantCase(o.key), p: change_case_1.paramCase(o.key) }, o)); });
    return configWithCases;
};
exports.getConfigFromProcessEnv = function (config) {
    var output = {};
    Object.keys(exports.getConfigWithCase(config)).forEach(function (_env) {
        if (process.env[_env])
            output[_env] = process.env[_env];
    });
    return output;
};
