import { describe, it, expect } from 'vitest';
import { defineConfig, resolveConfigInput } from '../define-config';

describe('defineConfig', () => {
  it('should pass through a config object', () => {
    const config = defineConfig({
      sessionId: 'test-session',
      port: 3000,
    });

    expect(config).toEqual({
      sessionId: 'test-session',
      port: 3000,
    });
  });

  it('should pass through a sync function', () => {
    const configFn = defineConfig(() => ({
      sessionId: 'fn-session',
    }));

    expect(typeof configFn).toBe('function');
    expect((configFn as () => any)()).toEqual({
      sessionId: 'fn-session',
    });
  });

  it('should pass through an async function', async () => {
    const configFn = defineConfig(async () => ({
      sessionId: 'async-session',
    }));

    expect(typeof configFn).toBe('function');
    const result = await (configFn as () => Promise<any>)();
    expect(result).toEqual({
      sessionId: 'async-session',
    });
  });

  it('remains a shape helper and does not validate the config payload', () => {
    const config = defineConfig({
      port: 'not-a-number' as unknown as number,
    });

    expect(config).toEqual({
      port: 'not-a-number',
    });
  });
});

describe('resolveConfigInput', () => {
  it('should resolve a plain object', async () => {
    const config = { sessionId: 'test' };
    const result = await resolveConfigInput(config);

    expect(result).toEqual({ sessionId: 'test' });
  });

  it('should resolve a sync function', async () => {
    const configFn = () => ({ sessionId: 'sync-fn' });
    const result = await resolveConfigInput(configFn);

    expect(result).toEqual({ sessionId: 'sync-fn' });
  });

  it('should resolve an async function', async () => {
    const configFn = async () => ({ sessionId: 'async-fn' });
    const result = await resolveConfigInput(configFn);

    expect(result).toEqual({ sessionId: 'async-fn' });
  });

  it('should handle function that returns promise', async () => {
    const configFn = () =>
      new Promise<{ sessionId: string }>((resolve) =>
        setTimeout(() => resolve({ sessionId: 'delayed' }), 10)
      );
    const result = await resolveConfigInput(configFn);

    expect(result).toEqual({ sessionId: 'delayed' });
  });
});
