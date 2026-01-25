/**
 * Client configuration types - re-exported from @open-wa/config
 * 
 * @deprecated Import from '@open-wa/config' instead
 */

export { ConfigSchema as ClientConfigSchema, type Config as ClientConfig } from '@open-wa/config';

/**
 * Migrates a v4 configuration object to the v5 schema format.
 * Currently, most v4 options are compatible with v5.
 * This function serves as a placeholder for any future transformations.
 * 
 * @deprecated This is a legacy compatibility function. Use @open-wa/config directly.
 */
export function migrateV4Config(oldConfig: Record<string, unknown>): Record<string, unknown> {
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
