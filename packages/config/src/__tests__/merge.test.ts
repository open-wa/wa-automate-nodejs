import { describe, it, expect } from 'vitest';
import {
  mergeConfigs,
  resolveConfigSync,
  validatePartialConfig,
  ConfigSource,
} from '../merge';

describe('Config Merger', () => {
  describe('mergeConfigs', () => {
    it('should merge two configs', () => {
      const config1 = { sessionId: 'session1', port: 8080 };
      const config2 = { sessionId: 'session2' };

      const merged = mergeConfigs(config1, config2);

      expect(merged.sessionId).toBe('session2'); // Later wins
      expect(merged.port).toBe(8080); // Preserved from first
    });

    it('should merge multiple configs in order', () => {
      const defaults = { sessionId: 'default', port: 8080, headless: true };
      const fileConfig = { sessionId: 'file-session' };
      const envConfig = { port: 3000 };
      const cliConfig = { headless: false };

      const merged = mergeConfigs(defaults, fileConfig, envConfig, cliConfig);

      expect(merged.sessionId).toBe('file-session');
      expect(merged.port).toBe(3000);
      expect(merged.headless).toBe(false);
    });

    it('should deep merge nested objects', () => {
      const config1 = {
        viewport: { width: 1920, height: 1080 },
      };
      const config2 = {
        viewport: { width: 1440 },
      };

      const merged = mergeConfigs(config1, config2);

      expect(merged.viewport?.width).toBe(1440);
      expect(merged.viewport?.height).toBe(1080);
    });

    it('should replace arrays instead of concatenating', () => {
      const config1 = { chromiumArgs: ['--arg1', '--arg2'] };
      const config2 = { chromiumArgs: ['--arg3'] };

      const merged = mergeConfigs(config1, config2);

      expect(merged.chromiumArgs).toEqual(['--arg3']);
    });
  });

  describe('resolveConfigSync', () => {
    it('should start with defaults', () => {
      const result = resolveConfigSync({ skipEnv: true });

      expect(result.config.sessionId).toBe('session');
      expect(result.config.port).toBe(8080);
      expect(result.sources).toContain(ConfigSource.DEFAULTS);
    });

    it('should apply file config', () => {
      const result = resolveConfigSync({
        skipEnv: true,
        fileConfig: { sessionId: 'file-session', port: 3000 },
      });

      expect(result.config.sessionId).toBe('file-session');
      expect(result.config.port).toBe(3000);
      expect(result.sources).toContain(ConfigSource.FILE);
    });

    it('should apply CLI overrides with highest priority', () => {
      const result = resolveConfigSync({
        skipEnv: true,
        fileConfig: { sessionId: 'file-session', port: 3000 },
        cliOverrides: { port: 4000 },
      });

      expect(result.config.sessionId).toBe('file-session');
      expect(result.config.port).toBe(4000);
      expect(result.sources).toContain(ConfigSource.CLI);
    });

    it('should include rawConfigs when requested', () => {
      const result = resolveConfigSync({
        skipEnv: true,
        fileConfig: { sessionId: 'file-session' },
        cliOverrides: { port: 4000 },
        includeRawConfigs: true,
      });

      expect(result.rawConfigs).toBeDefined();
      expect(result.rawConfigs?.defaults).toBeDefined();
      expect(result.rawConfigs?.file?.sessionId).toBe('file-session');
      expect(result.rawConfigs?.cli?.port).toBe(4000);
    });

    it('should apply programmatic overrides last', () => {
      const result = resolveConfigSync({
        skipEnv: true,
        cliOverrides: { port: 4000 },
        programmaticOverrides: { port: 5000 },
      });

      expect(result.config.port).toBe(5000);
      expect(result.sources).toContain(ConfigSource.PROGRAMMATIC);
    });
  });

  describe('validatePartialConfig', () => {
    it('should validate valid partial config', () => {
      const result = validatePartialConfig({
        sessionId: 'test',
        port: 3000,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid config', () => {
      const result = validatePartialConfig({
        port: 'invalid', // Should be number
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should accept empty config', () => {
      const result = validatePartialConfig({});

      expect(result.valid).toBe(true);
    });
  });
});
