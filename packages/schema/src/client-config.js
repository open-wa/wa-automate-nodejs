"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientConfigSchema = void 0;
exports.migrateV4Config = migrateV4Config;
const config_1 = require("./config");
exports.ClientConfigSchema = config_1.ConfigSchema;
function migrateV4Config(oldConfig) {
    const config = JSON.parse(JSON.stringify(oldConfig));
    if (typeof config.authTimeout === 'string') {
        config.authTimeout = parseInt(config.authTimeout, 10);
    }
    if (config.socketMode === undefined) {
        config.socketMode = true;
    }
    if (config.apiLifecycle === undefined) {
        config.apiLifecycle = 'hybrid';
    }
    return config;
}
//# sourceMappingURL=client-config.js.map