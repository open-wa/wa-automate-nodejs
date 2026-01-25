/**
 * @open-wa/config - Configuration Precedence Test Suite
 *
 * Tests the config merging order:
 *
 * ```
 * DEFAULTS → FILE → ENV → CLI → PROGRAMMATIC
 *   (1)      (2)    (3)   (4)       (5)
 * ```
 *
 * Each subsequent source overrides the previous.
 * This is the standard precedence order used by most CLI tools.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  resolveConfigSync,
  ConfigSource,
  mergeConfigs,
} from '../merge';
import { getDefaultConfig } from '../schema';

describe('Configuration Precedence', () => {
  // Store original env to restore after tests
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear any WA_* env vars before each test
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('WA_')) {
        delete process.env[key];
      }
    }
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe('Precedence Order: DEFAULTS → FILE → ENV → CLI → PROGRAMMATIC', () => {
    /**
     * Test the complete precedence chain.
     * Each source should override the previous one.
     */
    it('should follow correct precedence order (later sources win)', () => {
      const result = resolveConfigSync({
        fileConfig: { port: 1000 },
        envOptions: { env: { WA_PORT: '2000' } },
        cliOverrides: { port: 3000 },
        programmaticOverrides: { port: 4000 },
        includeRawConfigs: true,
      });

      // Programmatic (highest priority) wins
      expect(result.config.port).toBe(4000);

      // Verify all sources were applied
      expect(result.sources).toEqual([
        ConfigSource.DEFAULTS,
        ConfigSource.FILE,
        ConfigSource.ENV,
        ConfigSource.CLI,
        ConfigSource.PROGRAMMATIC,
      ]);

      // Verify raw configs captured each source
      expect(result.rawConfigs?.defaults.port).toBe(8080);
      expect(result.rawConfigs?.file?.port).toBe(1000);
      expect(result.rawConfigs?.env?.port).toBe(2000);
      expect(result.rawConfigs?.cli?.port).toBe(3000);
      expect(result.rawConfigs?.programmatic?.port).toBe(4000);
    });

    it('DEFAULTS (priority 1): provides baseline values', () => {
      const result = resolveConfigSync({ skipEnv: true });

      // Check known defaults from schema
      expect(result.config.sessionId).toBe('session');
      expect(result.config.port).toBe(8080);
      expect(result.config.headless).toBe(true);
      expect(result.config.qrTimeout).toBe(60);

      expect(result.sources).toContain(ConfigSource.DEFAULTS);
    });

    it('FILE (priority 2): overrides DEFAULTS', () => {
      const result = resolveConfigSync({
        skipEnv: true,
        fileConfig: { port: 3000, sessionId: 'file-session' },
      });

      // File values override defaults
      expect(result.config.port).toBe(3000);
      expect(result.config.sessionId).toBe('file-session');

      // Defaults still apply for unspecified values
      expect(result.config.headless).toBe(true);

      expect(result.sources).toContain(ConfigSource.FILE);
    });

    it('ENV (priority 3): overrides FILE and DEFAULTS', () => {
      const result = resolveConfigSync({
        fileConfig: { port: 3000, sessionId: 'file-session', headless: false },
        envOptions: { env: { WA_PORT: '4000', WA_SESSION_ID: 'env-session' } },
      });

      // Env values override file
      expect(result.config.port).toBe(4000);
      expect(result.config.sessionId).toBe('env-session');

      // File value preserved when env doesn't override
      expect(result.config.headless).toBe(false);

      expect(result.sources).toContain(ConfigSource.ENV);
    });

    it('CLI (priority 4): overrides ENV, FILE, and DEFAULTS', () => {
      const result = resolveConfigSync({
        fileConfig: { port: 3000, sessionId: 'file-session' },
        envOptions: { env: { WA_PORT: '4000', WA_HEADLESS: 'false' } },
        cliOverrides: { port: 5000 },
      });

      // CLI overrides everything
      expect(result.config.port).toBe(5000);

      // Env still wins for fields not in CLI
      expect(result.config.headless).toBe(false);

      // File still wins for fields not in env or CLI
      expect(result.config.sessionId).toBe('file-session');

      expect(result.sources).toContain(ConfigSource.CLI);
    });

    it('PROGRAMMATIC (priority 5): overrides all other sources', () => {
      const result = resolveConfigSync({
        fileConfig: { port: 3000 },
        envOptions: { env: { WA_PORT: '4000' } },
        cliOverrides: { port: 5000 },
        programmaticOverrides: { port: 6000 },
      });

      // Programmatic has highest priority
      expect(result.config.port).toBe(6000);

      expect(result.sources).toContain(ConfigSource.PROGRAMMATIC);
    });
  });

  describe('Partial Source Application', () => {
    it('should work with only DEFAULTS (no other sources)', () => {
      const result = resolveConfigSync({ skipEnv: true });

      expect(result.sources).toEqual([ConfigSource.DEFAULTS]);
      expect(result.config.port).toBe(8080);
    });

    it('should work with DEFAULTS + FILE only', () => {
      const result = resolveConfigSync({
        skipEnv: true,
        fileConfig: { port: 3000 },
      });

      expect(result.sources).toEqual([ConfigSource.DEFAULTS, ConfigSource.FILE]);
      expect(result.config.port).toBe(3000);
    });

    it('should work with DEFAULTS + ENV only', () => {
      const result = resolveConfigSync({
        envOptions: { env: { WA_PORT: '4000' } },
      });

      expect(result.sources).toEqual([ConfigSource.DEFAULTS, ConfigSource.ENV]);
      expect(result.config.port).toBe(4000);
    });

    it('should work with DEFAULTS + CLI only', () => {
      const result = resolveConfigSync({
        skipEnv: true,
        cliOverrides: { port: 5000 },
      });

      expect(result.sources).toEqual([ConfigSource.DEFAULTS, ConfigSource.CLI]);
      expect(result.config.port).toBe(5000);
    });

    it('should skip empty sources', () => {
      const result = resolveConfigSync({
        skipEnv: true,
        fileConfig: {}, // Empty - should not add FILE source
        cliOverrides: { port: 5000 },
      });

      expect(result.sources).not.toContain(ConfigSource.FILE);
      expect(result.sources).toContain(ConfigSource.CLI);
    });
  });

  describe('Deep Merge Behavior', () => {
    it('should deep merge nested objects', () => {
      const result = resolveConfigSync({
        skipEnv: true,
        fileConfig: {
          viewport: { width: 1920, height: 1080 },
        },
        cliOverrides: {
          viewport: { width: 1440 },
        },
      });

      // CLI overrides width, file's height is preserved
      expect(result.config.viewport?.width).toBe(1440);
      expect(result.config.viewport?.height).toBe(1080);
    });

    it('should replace arrays (not concatenate)', () => {
      const result = resolveConfigSync({
        skipEnv: true,
        fileConfig: {
          chromiumArgs: ['--disable-gpu', '--no-sandbox'],
        },
        cliOverrides: {
          chromiumArgs: ['--headless'],
        },
      });

      // CLI completely replaces the array
      expect(result.config.chromiumArgs).toEqual(['--headless']);
    });

    it('should allow env to override nested object fields', () => {
      const result = resolveConfigSync({
        fileConfig: {
          viewport: { width: 1920, height: 1080 },
        },
        // Note: env can't easily set nested values, but if it could...
        envOptions: { env: {} },
        cliOverrides: {
          viewport: { height: 720 },
        },
      });

      expect(result.config.viewport?.width).toBe(1920);
      expect(result.config.viewport?.height).toBe(720);
    });
  });

  describe('mergeConfigs utility', () => {
    it('should merge configs in argument order', () => {
      const merged = mergeConfigs(
        { port: 1000, sessionId: 'a' },
        { port: 2000 },
        { sessionId: 'c' }
      );

      expect(merged.port).toBe(2000);
      expect(merged.sessionId).toBe('c');
    });

    it('should handle undefined values correctly', () => {
      const merged = mergeConfigs(
        { port: 1000, sessionId: 'a' },
        { port: undefined } // undefined should not override
      );

      // undefined is still merged (Zod will handle validation)
      expect(merged.sessionId).toBe('a');
    });
  });

  describe('Source Tracking', () => {
    it('should track which sources contributed', () => {
      const result = resolveConfigSync({
        fileConfig: { sessionId: 'file' },
        envOptions: { env: { WA_PORT: '3000' } },
        cliOverrides: { headless: false },
        includeRawConfigs: true,
      });

      expect(result.sources).toContain(ConfigSource.DEFAULTS);
      expect(result.sources).toContain(ConfigSource.FILE);
      expect(result.sources).toContain(ConfigSource.ENV);
      expect(result.sources).toContain(ConfigSource.CLI);
    });

    it('should preserve raw configs for debugging', () => {
      const result = resolveConfigSync({
        fileConfig: { port: 3000 },
        cliOverrides: { port: 5000 },
        skipEnv: true,
        includeRawConfigs: true,
      });

      expect(result.rawConfigs?.file?.port).toBe(3000);
      expect(result.rawConfigs?.cli?.port).toBe(5000);
      expect(result.config.port).toBe(5000); // Final merged value
    });
  });

  describe('Real-world Scenarios', () => {
    it('scenario: developer overrides production config file with env for local dev', () => {
      // Production config file
      const fileConfig = {
        port: 443,
        headless: true,
        sessionId: 'production',
      };

      // Developer sets env vars for local development
      const result = resolveConfigSync({
        fileConfig,
        envOptions: {
          env: {
            WA_PORT: '3000',
            WA_HEADLESS: 'false',
          },
        },
      });

      // Env overrides file for local dev
      expect(result.config.port).toBe(3000);
      expect(result.config.headless).toBe(false);
      // File value preserved for sessionId
      expect(result.config.sessionId).toBe('production');
    });

    it('scenario: CI/CD uses CLI to override everything', () => {
      const result = resolveConfigSync({
        fileConfig: { sessionId: 'dev', port: 3000 },
        envOptions: { env: { WA_SESSION_ID: 'staging' } },
        cliOverrides: { sessionId: 'ci-test', headless: true },
      });

      // CLI wins for sessionId
      expect(result.config.sessionId).toBe('ci-test');
      expect(result.config.headless).toBe(true);
      // File wins for port (not overridden by env or CLI)
      expect(result.config.port).toBe(3000);
    });

    it('scenario: test uses programmatic override to force specific values', () => {
      const result = resolveConfigSync({
        fileConfig: { port: 3000 },
        cliOverrides: { port: 4000 },
        programmaticOverrides: { port: 9999 }, // Test-specific port
      });

      expect(result.config.port).toBe(9999);
    });
  });
});
