import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as chromeLauncher from 'chrome-launcher';
import { ConfigSchema, type TrackedConfig } from '@open-wa/config';

class FakeEmitter {
  private handlers = new Map<string, Array<(payload: unknown) => void>>();

  on(event: string, handler: (payload: unknown) => void) {
    const handlers = this.handlers.get(event) ?? [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
    return this;
  }

  off(event: string, handler: (payload: unknown) => void) {
    this.handlers.set(
      event,
      (this.handlers.get(event) ?? []).filter((registered) => registered !== handler)
    );
    return this;
  }

  emit(event: string, payload: unknown) {
    for (const handler of this.handlers.get(event) ?? []) {
      handler(payload);
    }
  }
}

function makeConfig(overrides: Record<string, unknown> = {}) {
  return ConfigSchema.parse({
    sessionId: 'test-session',
    ...overrides,
  });
}

function createTempExecutable(rootDir: string, fileName: string): string {
  const executablePath = join(rootDir, fileName);
  mkdirSync(join(rootDir), { recursive: true });
  writeFileSync(executablePath, 'binary');
  return executablePath;
}

async function importCliRuntimeUtilityModule() {
  vi.doMock('@open-wa/core', () => ({ createClient: vi.fn() }));
  vi.doMock('@open-wa/client', () => ({ Client: class MockClient {} }));
  vi.doMock('@open-wa/schema', () => ({ eventRegistry: { getAll: () => [] } }));
  vi.doMock('../server/hono-server', () => ({ WAServer: class MockWAServer {} }));
  vi.doMock('@open-wa/driver-puppeteer', () => ({ PuppeteerDriver: class MockPuppeteerDriver {} }));
  vi.doMock('@open-wa/driver-lightpanda', () => ({ LightpandaDriver: class MockLightpandaDriver {} }));
  return await import('../cli-runtime');
}

describe('cli runtime chrome resolution', () => {
  const tempDirs: string[] = [];
  const getInstallationsSpy = vi.spyOn(chromeLauncher.Launcher, 'getInstallations');

  afterEach(() => {
    getInstallationsSpy.mockReset();
    vi.resetModules();
    vi.doUnmock('@open-wa/core');
    vi.doUnmock('@open-wa/client');
    vi.doUnmock('../server/hono-server');
    vi.doUnmock('@open-wa/driver-lightpanda');
    vi.doUnmock('@open-wa/driver-puppeteer');
    vi.doUnmock('@open-wa/config');
    while (tempDirs.length) {
      const dir = tempDirs.pop();
      if (dir) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('prefers local Chrome by default for CLI startup even when schema defaults useChrome to false', async () => {
    const { readChromePathCache, resolveExecutablePath, shouldPreferLocalChrome } = await importCliRuntimeUtilityModule();
    const tempDir = mkdtempSync(join(tmpdir(), 'openwa-cli-runtime-'));
    tempDirs.push(tempDir);
    const cacheFilePath = join(tempDir, '.open-wa', 'chrome-executable-path.json');
    const localChromePath = createTempExecutable(tempDir, 'Google Chrome');
    const config = makeConfig();

    expect(shouldPreferLocalChrome(config, { defaults: { useChrome: false } } as TrackedConfig['rawConfigs'])).toBe(true);

    getInstallationsSpy.mockReturnValue([localChromePath]);

    const result = await resolveExecutablePath(config, {
      preferLocalChrome: true,
      cacheFilePath,
    });

    expect(result).toEqual({
      executablePath: localChromePath,
      source: 'chrome_installation',
    });
    expect(readChromePathCache(cacheFilePath)?.executablePath).toBe(localChromePath);
  });

  it('honors explicit useChrome false overrides', async () => {
    const { shouldPreferLocalChrome } = await importCliRuntimeUtilityModule();
    const config = makeConfig();

    expect(
      shouldPreferLocalChrome(config, {
        defaults: { useChrome: false },
        file: { useChrome: false },
      } as TrackedConfig['rawConfigs'])
    ).toBe(false);
  });

  it('reuses a valid cached Chrome path without probing chrome-launcher again', async () => {
    const { readChromePathCache, resolveExecutablePath, writeChromePathCache } = await importCliRuntimeUtilityModule();
    const tempDir = mkdtempSync(join(tmpdir(), 'openwa-cli-runtime-'));
    tempDirs.push(tempDir);
    const cacheFilePath = join(tempDir, '.open-wa', 'chrome-executable-path.json');
    const cachedChromePath = createTempExecutable(tempDir, 'Cached Google Chrome');
    const config = makeConfig();

    writeChromePathCache(cachedChromePath, cacheFilePath);

    const result = await resolveExecutablePath(config, {
      preferLocalChrome: true,
      cacheFilePath,
    });

    expect(result).toEqual({
      executablePath: cachedChromePath,
      source: 'cache',
    });
    expect(getInstallationsSpy).not.toHaveBeenCalled();
  });

  it('ignores stale cached paths and refreshes them from a newly detected local Chrome executable', async () => {
    const { readChromePathCache, resolveExecutablePath } = await importCliRuntimeUtilityModule();
    const tempDir = mkdtempSync(join(tmpdir(), 'openwa-cli-runtime-'));
    tempDirs.push(tempDir);
    const cacheFilePath = join(tempDir, '.open-wa', 'chrome-executable-path.json');
    const refreshedChromePath = createTempExecutable(tempDir, 'Refreshed Google Chrome');
    const config = makeConfig();

    mkdirSync(join(tempDir, '.open-wa'), { recursive: true });
    writeFileSync(cacheFilePath, JSON.stringify({ executablePath: join(tempDir, 'missing-chrome') }), 'utf8');
    getInstallationsSpy.mockReturnValue([join(tempDir, 'missing-chrome'), refreshedChromePath]);

    const result = await resolveExecutablePath(config, {
      preferLocalChrome: true,
      cacheFilePath,
    });

    expect(result).toEqual({
      executablePath: refreshedChromePath,
      source: 'chrome_installation',
    });
    expect(readChromePathCache(cacheFilePath)?.executablePath).toBe(refreshedChromePath);
  });

  it('clears invalid cache entries and returns a truthful fallback warning when local Chrome cannot be resolved', async () => {
    const { clearChromePathCache, readChromePathCache, resolveExecutablePath } = await importCliRuntimeUtilityModule();
    const tempDir = mkdtempSync(join(tmpdir(), 'openwa-cli-runtime-'));
    tempDirs.push(tempDir);
    const cacheFilePath = join(tempDir, '.open-wa', 'chrome-executable-path.json');
    const config = makeConfig();

    mkdirSync(join(tempDir, '.open-wa'), { recursive: true });
    writeFileSync(cacheFilePath, JSON.stringify({ executablePath: join(tempDir, 'missing-chrome') }), 'utf8');
    getInstallationsSpy.mockReturnValue([join(tempDir, 'also-missing-chrome')]);

    const result = await resolveExecutablePath(config, {
      preferLocalChrome: true,
      cacheFilePath,
    });

    expect(result).toEqual({
      source: 'driver_default',
      warning: 'Chrome resolution warning: no valid local Chrome installation was found. Falling back to Puppeteer/default driver browser resolution.',
    });
    expect(readChromePathCache(cacheFilePath)).toBeUndefined();
    clearChromePathCache(cacheFilePath);
    expect(() => readFileSync(cacheFilePath, 'utf8')).toThrow();
  });

  it('keeps CLI override mapping source-local before resolveConfig owns precedence', async () => {
    const { parseCliArgs } = await importCliRuntimeUtilityModule();
    const parsed = parseCliArgs(['--session-id', 'alpha', '--port', '9000', '--headful', '--use-chrome', '--use-lightpanda']);

    expect(parsed.cliOverrides).toMatchObject({
      sessionId: 'alpha',
      port: 9000,
      headless: false,
      useChrome: true,
      useLightpanda: true,
    });
    expect(parsed.forwardedArgs).toEqual(['--session-id', 'alpha', '--port', '9000', '--headful', '--use-chrome', '--use-lightpanda']);
  });

  it('routes startup, QR, and readiness notices through the sink abstraction', async () => {
    const fakeEmitter = new FakeEmitter();
    const sink = {
      write: vi.fn(),
      status: vi.fn(),
      qr: vi.fn(),
    };

    const resolveConfigMock = vi.fn().mockResolvedValue({
      config: makeConfig({ sessionId: 'sink-session', port: 8123, host: '127.0.0.1' }),
      sources: ['defaults', 'cli'],
      rawConfigs: { defaults: { useChrome: false }, cli: { sessionId: 'sink-session' } },
    });
    const createClientMock = vi.fn().mockResolvedValue({
      events: fakeEmitter,
      getReadiness: () => ({ status: 'CONNECTED', exposureSafe: true }),
      getTransport: () => ({ transport: true }),
    });
    const clientStartMock = vi.fn(async () => {
      fakeEmitter.emit('launch.auth.qr.generated', { details: { qr: 'qr-value' } });
    });
    const clientGetStateMock = vi.fn(() => 'CONNECTED');
    const PuppeteerDriverMock = vi.fn(function MockPuppeteerDriver() {
      return { name: 'puppeteer' };
    });
    const LightpandaDriverMock = vi.fn(function MockLightpandaDriver() {
      return { name: 'lightpanda' };
    });

    vi.doMock('@open-wa/core', () => ({ createClient: createClientMock }));
    vi.doMock('@open-wa/client', () => ({
      Client: class MockClient {
        start = clientStartMock;
        stop = vi.fn();
        getState = clientGetStateMock;
      },
    }));
    vi.doMock('@open-wa/schema', () => ({ eventRegistry: { getAll: () => [] } }));
    vi.doMock('../server/hono-server', () => ({
      WAServer: class MockWAServer {
        start = vi.fn();
        stop = vi.fn();
        setReadinessProvider = vi.fn();
        setQR = vi.fn();
        setClient = vi.fn();
      },
    }));
    vi.doMock('@open-wa/driver-puppeteer', () => ({ PuppeteerDriver: PuppeteerDriverMock }));
    vi.doMock('@open-wa/driver-lightpanda', () => ({ LightpandaDriver: LightpandaDriverMock }));
    vi.doMock('@open-wa/config', async () => {
      const actual = await vi.importActual<typeof import('@open-wa/config')>('@open-wa/config');
      return {
        ...actual,
        resolveConfig: resolveConfigMock,
      };
    });

    const outputSinkModule = await import('../cli/output-sink');
    outputSinkModule.setCliOutputSink(sink as any);
    const runtimeModule = await import('../cli-runtime');
    getInstallationsSpy.mockReturnValue([]);

    const result = await runtimeModule.start({
      procName: 'sink-session',
      pm2: false,
      forwardedArgs: [],
      configPath: undefined,
      cliOverrides: { sessionId: 'sink-session' },
      verbose: false,
      unsupportedWarnings: [],
    });

    expect(result.config.sessionId).toBe('sink-session');
    expect(sink.status).toHaveBeenCalledWith({ phase: 'boot' });
    expect(sink.status).toHaveBeenCalledWith({ phase: 'config.resolved', sessionId: 'sink-session' });
    expect(sink.status).toHaveBeenCalledWith({ phase: 'server.starting', sessionId: 'sink-session' });
    expect(sink.status).toHaveBeenCalledWith({ phase: 'server.started', sessionId: 'sink-session' });
    expect(sink.status).toHaveBeenCalledWith({ phase: 'client.starting', sessionId: 'sink-session' });
    expect(sink.qr).toHaveBeenCalledWith({ qr: 'qr-value', sessionId: 'sink-session' });
    expect(PuppeteerDriverMock).toHaveBeenCalledTimes(1);
    expect(LightpandaDriverMock).not.toHaveBeenCalled();
    expect(createClientMock).toHaveBeenCalledWith(expect.objectContaining({ driver: expect.objectContaining({ name: 'puppeteer' }) }));
    expect(sink.write).toHaveBeenCalledWith(expect.objectContaining({ message: 'Starting WhatsApp Client...' }));
    expect(sink.write).toHaveBeenCalledWith(expect.objectContaining({ message: 'Browser engine: Puppeteer' }));
    expect(sink.write).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('WhatsApp Client ready with state: CONNECTED'),
      })
    );

    outputSinkModule.resetCliOutputSink();
  });

  it('selects LightpandaDriver from normalized config and reports the Lightpanda executable source', async () => {
    const fakeEmitter = new FakeEmitter();
    const sink = {
      write: vi.fn(),
      status: vi.fn(),
      qr: vi.fn(),
    };

    const resolveConfigMock = vi.fn().mockResolvedValue({
      config: makeConfig({
        sessionId: 'lightpanda-session',
        port: 8124,
        host: '127.0.0.1',
        useLightpanda: true,
        lightpanda: {
          executablePath: '/tmp/lightpanda-bin',
          portStart: 9000,
          host: '127.0.0.1',
          startupTimeoutMs: 30000,
          disableTelemetry: false,
        },
      }),
      sources: ['defaults', 'programmatic'],
      rawConfigs: { defaults: { useChrome: false }, programmatic: { useLightpanda: true } },
    });
    const createClientMock = vi.fn().mockResolvedValue({
      events: fakeEmitter,
      getReadiness: () => ({ status: 'CONNECTED', exposureSafe: true }),
      getTransport: () => ({ transport: true }),
    });
    const clientStartMock = vi.fn();
    const clientGetStateMock = vi.fn(() => 'CONNECTED');
    const PuppeteerDriverMock = vi.fn(function MockPuppeteerDriver() {
      return { name: 'puppeteer' };
    });
    const LightpandaDriverMock = vi.fn(function MockLightpandaDriver() {
      return { name: 'lightpanda' };
    });

    vi.doMock('@open-wa/core', () => ({ createClient: createClientMock }));
    vi.doMock('@open-wa/client', () => ({
      Client: class MockClient {
        start = clientStartMock;
        stop = vi.fn();
        getState = clientGetStateMock;
      }
    }));
    vi.doMock('@open-wa/schema', () => ({ eventRegistry: { getAll: () => [] } }));
    vi.doMock('../server/hono-server', () => ({
      WAServer: class MockWAServer {
        start = vi.fn();
        stop = vi.fn();
        setReadinessProvider = vi.fn();
        setQR = vi.fn();
        setClient = vi.fn();
      }
    }));
    vi.doMock('@open-wa/driver-puppeteer', () => ({ PuppeteerDriver: PuppeteerDriverMock }));
    vi.doMock('@open-wa/driver-lightpanda', () => ({ LightpandaDriver: LightpandaDriverMock }));
    vi.doMock('@open-wa/config', async () => {
      const actual = await vi.importActual<typeof import('@open-wa/config')>('@open-wa/config');
      return {
        ...actual,
        resolveConfig: resolveConfigMock,
      };
    });

    const outputSinkModule = await import('../cli/output-sink');
    outputSinkModule.setCliOutputSink(sink as any);
    const runtimeModule = await import('../cli-runtime');

    await runtimeModule.start({
      procName: 'lightpanda-session',
      pm2: false,
      forwardedArgs: [],
      configPath: undefined,
      cliOverrides: { sessionId: 'lightpanda-session', useLightpanda: true },
      verbose: false,
      unsupportedWarnings: [],
    });

    expect(LightpandaDriverMock).toHaveBeenCalledTimes(1);
    expect(PuppeteerDriverMock).not.toHaveBeenCalled();
    expect(createClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        driver: expect.objectContaining({ name: 'lightpanda' }),
        executablePath: '/tmp/lightpanda-bin',
      })
    );
    expect(getInstallationsSpy).not.toHaveBeenCalled();
    expect(sink.write).toHaveBeenCalledWith(expect.objectContaining({ message: 'Browser engine: Lightpanda' }));
    expect(sink.write).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Browser executable: explicit Lightpanda override (/tmp/lightpanda-bin)',
      })
    );

    outputSinkModule.resetCliOutputSink();
  });
});
