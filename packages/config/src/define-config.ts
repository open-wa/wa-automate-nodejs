/**
 * @open-wa/config - defineConfig helper
 *
 * Provides type-safe configuration definition for users.
 * Pattern inspired by Vite, Vitest, and Playwright configs.
 */
import type { Config, PartialConfig } from './schema';

/**
 * Configuration input can be:
 * 1. A static config object
 * 2. A synchronous function returning a config object
 * 3. An async function returning a config object (for dynamic defaults)
 */
export type ConfigInput = PartialConfig | (() => PartialConfig) | (() => Promise<PartialConfig>);

/**
 * Define an open-wa configuration with full TypeScript support.
 *
 * @example
 * // wa.config.ts
 * import { defineConfig } from '@open-wa/config';
 *
 * export default defineConfig({
 *   sessionId: 'my-session',
 *   port: 8080,
 *   headless: true,
 * });
 *
 * @example
 * // Async config for dynamic values
 * import { defineConfig } from '@open-wa/config';
 *
 * export default defineConfig(async () => ({
 *   sessionId: 'my-session',
 *   licenseKey: await fetchFromVault('WA_LICENSE_KEY'),
 * }));
 */
export function defineConfig(config: PartialConfig): PartialConfig;
export function defineConfig(config: () => PartialConfig): () => PartialConfig;
export function defineConfig(config: () => Promise<PartialConfig>): () => Promise<PartialConfig>;
export function defineConfig(config: ConfigInput): ConfigInput {
  return config;
}

/**
 * Resolve a config input to an actual config object.
 * Handles both sync and async function configs.
 */
export async function resolveConfigInput(input: ConfigInput): Promise<PartialConfig> {
  if (typeof input === 'function') {
    return await input();
  }
  return input;
}
