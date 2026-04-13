import { describe, expect, it, vi } from 'vitest';

describe('wa-automate public contract', () => {
  it('re-exports config truth from @open-wa/config and runtime bootstrap from @open-wa/core', async () => {
    const createClientMock = vi.fn();

    vi.resetModules();
    vi.doMock('@open-wa/core', () => ({ createClient: createClientMock }));
    vi.doMock('@open-wa/client', () => ({}));
    vi.doMock('@open-wa/schema', () => ({ eventRegistry: { getAll: () => [] } }));
    vi.doMock('@open-wa/driver-puppeteer', () => ({ PuppeteerDriver: class MockPuppeteerDriver {} }));
    vi.doMock('@open-wa/driver-lightpanda', () => ({ LightpandaDriver: class MockLightpandaDriver {} }));

    const waAutomate = await import('../../index');
    const { createClient } = await import('@open-wa/core');
    const { ConfigSchema } = await import('@open-wa/config');

    expect(waAutomate.ConfigSchema).toBe(ConfigSchema);
    expect(waAutomate.createClient).toBe(createClient);
  });

  it('keeps the top-level package focused on CLI and API runtime ownership plus passthrough compatibility exports', async () => {
    vi.resetModules();
    vi.doMock('@open-wa/core', () => ({ createClient: vi.fn() }));
    vi.doMock('@open-wa/client', () => ({}));
    vi.doMock('@open-wa/schema', () => ({ eventRegistry: { getAll: () => [] } }));
    vi.doMock('@open-wa/driver-puppeteer', () => ({ PuppeteerDriver: class MockPuppeteerDriver {} }));
    vi.doMock('@open-wa/driver-lightpanda', () => ({ LightpandaDriver: class MockLightpandaDriver {} }));

    const waAutomate = await import('../../index');

    expect(typeof waAutomate.WAServer).toBe('function');
    expect(typeof waAutomate.APILifecycleManager).toBe('function');
    expect(typeof waAutomate.SessionManager).toBe('function');
    expect(typeof waAutomate.create).toBe('function');
    expect(typeof waAutomate.runCli).toBe('function');
    expect(typeof waAutomate.startCli).toBe('function');
    expect(typeof waAutomate.parseCliArgs).toBe('function');
  });

  it('supports programmatic Lightpanda selection through the package create entrypoint', async () => {
    const createClientMock = vi.fn().mockResolvedValue({ client: 'ok' });
    const PuppeteerDriverMock = vi.fn(function MockPuppeteerDriver() {
      return { name: 'puppeteer' };
    });
    const LightpandaDriverMock = vi.fn(function MockLightpandaDriver() {
      return { name: 'lightpanda' };
    });

    vi.resetModules();
    vi.doMock('@open-wa/core', () => ({ createClient: createClientMock }));
    vi.doMock('@open-wa/client', () => ({}));
    vi.doMock('@open-wa/schema', () => ({ eventRegistry: { getAll: () => [] } }));
    vi.doMock('@open-wa/driver-puppeteer', () => ({ PuppeteerDriver: PuppeteerDriverMock }));
    vi.doMock('@open-wa/driver-lightpanda', () => ({ LightpandaDriver: LightpandaDriverMock }));

    const waAutomate = await import('../../index');

    await waAutomate.create({
      sessionId: 'programmatic-lightpanda',
      useLightpanda: true,
      lightpanda: {
        executablePath: '/tmp/lightpanda-bin',
        portStart: 9310,
        host: '127.0.0.1',
        startupTimeoutMs: 41000,
        disableTelemetry: true,
      },
    });

    expect(LightpandaDriverMock).toHaveBeenCalledTimes(1);
    expect(PuppeteerDriverMock).not.toHaveBeenCalled();
    expect(createClientMock).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'programmatic-lightpanda',
      driver: expect.objectContaining({ name: 'lightpanda' }),
      executablePath: '/tmp/lightpanda-bin',
      lightpanda: {
        executablePath: '/tmp/lightpanda-bin',
        portStart: 9310,
        host: '127.0.0.1',
        startupTimeoutMs: 41000,
        disableTelemetry: true,
      },
    }));
  });
});
