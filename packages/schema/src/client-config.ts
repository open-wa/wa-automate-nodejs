import { ConfigSchema, Config } from './config';

export const ClientConfigSchema = ConfigSchema;

export type ClientConfig = Config;

/**
 * Migrates a v4 configuration object to the v5 schema format.
 * Currently, most v4 options are compatible with v5.
 * This function serves as a placeholder for any future transformations.
 */
export function migrateV4Config(oldConfig: any): ClientConfig {
    // Deep clone to avoid mutating original
    const config = JSON.parse(JSON.stringify(oldConfig));

    // Example migration: if 'authTimeout' was string in some legacy version (unlikely but example)
    if (typeof config.authTimeout === 'string') {
        config.authTimeout = parseInt(config.authTimeout, 10);
    }

    // Ensure socketMode defaults to true for v5 if not specified
    if (config.socketMode === undefined) {
        config.socketMode = true;
    }

    if (config.apiLifecycle === undefined) {
        config.apiLifecycle = 'hybrid';
    }

    return config;
}
