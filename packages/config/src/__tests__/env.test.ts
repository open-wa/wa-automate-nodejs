import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadFromEnv, getConfigEnvVars } from '../env';

describe('Environment Variable Loader', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('loadFromEnv', () => {
    it('should load WA_SESSION_ID', () => {
      const env = { WA_SESSION_ID: 'my-session' };
      const config = loadFromEnv({ env });

      expect(config.sessionId).toBe('my-session');
    });

    it('should load WA_PORT as number', () => {
      const env = { WA_PORT: '3000' };
      const config = loadFromEnv({ env });

      expect(config.port).toBe(3000);
    });

    it('should load WA_HEADLESS as boolean true', () => {
      const env = { WA_HEADLESS: 'true' };
      const config = loadFromEnv({ env });

      expect(config.headless).toBe(true);
    });

    it('should load WA_HEADLESS as boolean false', () => {
      const env = { WA_HEADLESS: 'false' };
      const config = loadFromEnv({ env });

      expect(config.headless).toBe(false);
    });

    it('should handle TRUE/FALSE case variants', () => {
      const env = {
        WA_HEADLESS: 'TRUE',
        WA_LOG_CONSOLE: 'FALSE',
      };
      const config = loadFromEnv({ env });

      expect(config.headless).toBe(true);
      expect(config.logConsole).toBe(false);
    });

    it('should handle 1/0 as boolean', () => {
      const env = {
        WA_HEADLESS: '1',
        WA_LOG_CONSOLE: '0',
      };
      const config = loadFromEnv({ env });

      expect(config.headless).toBe(true);
      expect(config.logConsole).toBe(false);
    });

    it('should load multiple env vars', () => {
      const env = {
        WA_SESSION_ID: 'test-session',
        WA_PORT: '8080',
        WA_HEADLESS: 'true',
        WA_LICENSE_KEY: 'my-license-key',
      };
      const config = loadFromEnv({ env });

      expect(config.sessionId).toBe('test-session');
      expect(config.port).toBe(8080);
      expect(config.headless).toBe(true);
      expect(config.licenseKey).toBe('my-license-key');
    });

    it('should ignore non-WA_ prefixed env vars', () => {
      const env = {
        WA_SESSION_ID: 'my-session',
        NODE_ENV: 'production',
        PATH: '/usr/bin',
      };
      const config = loadFromEnv({ env });

      expect(config.sessionId).toBe('my-session');
      expect((config as any).nodeEnv).toBeUndefined();
      expect((config as any).path).toBeUndefined();
    });

    it('should handle custom prefix', () => {
      const env = {
        CUSTOM_SESSION_ID: 'custom-session',
        WA_SESSION_ID: 'wa-session',
      };
      const config = loadFromEnv({ env, prefix: 'CUSTOM_' });

      expect(config.sessionId).toBe('custom-session');
    });

    it('should convert snake_case to camelCase', () => {
      const env = {
        WA_BROWSER_WS_ENDPOINT: 'ws://localhost:9222',
        WA_SKIP_UPDATE_CHECK: 'true',
      };
      const config = loadFromEnv({ env });

      expect(config.browserWSEndpoint).toBe('ws://localhost:9222');
      expect(config.skipUpdateCheck).toBe(true);
    });

    it('should return empty object when no WA_ vars present', () => {
      const env = {
        NODE_ENV: 'production',
      };
      const config = loadFromEnv({ env });

      expect(Object.keys(config).length).toBe(0);
    });

    it('should handle JSON values', () => {
      const env = {
        WA_CHROMIUM_ARGS: '["--no-sandbox", "--disable-gpu"]',
      };
      const config = loadFromEnv({ env });

      expect(config.chromiumArgs).toEqual(['--no-sandbox', '--disable-gpu']);
    });
  });

  describe('getConfigEnvVars', () => {
    it('should return array of env var mappings', () => {
      const vars = getConfigEnvVars();

      expect(Array.isArray(vars)).toBe(true);
      expect(vars.length).toBeGreaterThan(0);

      const sessionIdVar = vars.find((v) => v.envVar === 'WA_SESSION_ID');
      expect(sessionIdVar).toBeDefined();
      expect(sessionIdVar?.configKey).toBe('sessionId');
    });

    it('should include common config mappings', () => {
      const vars = getConfigEnvVars();
      const envVarNames = vars.map((v) => v.envVar);

      expect(envVarNames).toContain('WA_SESSION_ID');
      expect(envVarNames).toContain('WA_PORT');
      expect(envVarNames).toContain('WA_HEADLESS');
      expect(envVarNames).toContain('WA_LICENSE_KEY');
    });
  });
});
