import { describe, it, expect } from 'vitest';
import {
  ConfigSchema,
  parseConfig,
  validateConfig,
  getDefaultConfig,
  QRFormat,
  OnError,
} from '../schema';

describe('ConfigSchema', () => {
  describe('defaults', () => {
    it('should provide sensible defaults for all required fields', () => {
      const defaults = getDefaultConfig();

      expect(defaults.sessionId).toBe('session');
      expect(defaults.port).toBe(8080);
      expect(defaults.headless).toBe(true);
      expect(defaults.qrTimeout).toBe(60);
      expect(defaults.authTimeout).toBe(60);
      expect(defaults.blockCrashLogs).toBe(true);
      expect(defaults.multiDevice).toBe(true);
      expect(defaults.onError).toBe(OnError.NOTHING);
      expect(defaults.qrFormat).toBe(QRFormat.PNG);
    });

    it('should parse empty object with defaults', () => {
      const result = ConfigSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionId).toBe('session');
        expect(result.data.port).toBe(8080);
      }
    });
  });

  describe('validation', () => {
    it('should accept valid config', () => {
      const config = {
        sessionId: 'my-session',
        port: 3000,
        headless: false,
      };

      const result = validateConfig(config);
      expect(result.success).toBe(true);
      expect(result.data?.sessionId).toBe('my-session');
      expect(result.data?.port).toBe(3000);
    });

    it('should reject invalid port number', () => {
      const config = {
        port: 99999, // Invalid port
      };

      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should accept valid QRFormat enum', () => {
      const config = {
        qrFormat: QRFormat.JPEG,
      };

      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject invalid enum value', () => {
      const config = {
        qrFormat: 'invalid',
      };

      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('parseConfig', () => {
    it('should return parsed config with defaults filled', () => {
      const config = parseConfig({ sessionId: 'test' });

      expect(config.sessionId).toBe('test');
      expect(config.port).toBe(8080); // default
      expect(config.headless).toBe(true); // default
    });

    it('should throw on invalid config', () => {
      expect(() => parseConfig({ port: 'invalid' })).toThrow();
    });
  });

  describe('nested objects', () => {
    it('should validate viewport object', () => {
      const config = {
        viewport: {
          width: 1920,
          height: 1080,
        },
      };

      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.viewport?.width).toBe(1920);
        expect(result.data.viewport?.height).toBe(1080);
      }
    });

    it('should validate proxyServerCredentials', () => {
      const config = {
        proxyServerCredentials: {
          address: '127.0.0.1:8080',
          username: 'user',
          password: 'pass',
        },
      };

      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should validate cloudUploadOptions', () => {
      const config = {
        cloudUploadOptions: {
          provider: 'AWS',
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
          bucket: 'my-bucket',
          region: 'us-east-1',
        },
      };

      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('type coercion', () => {
    it('should handle boolean values', () => {
      const config = {
        headless: true,
        logConsole: false,
      };

      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.headless).toBe(true);
        expect(result.data.logConsole).toBe(false);
      }
    });

    it('should handle numeric values', () => {
      const config = {
        port: 3000,
        qrTimeout: 120,
        authTimeout: 30,
      };

      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.port).toBe(3000);
        expect(result.data.qrTimeout).toBe(120);
        expect(result.data.authTimeout).toBe(30);
      }
    });
  });
});
