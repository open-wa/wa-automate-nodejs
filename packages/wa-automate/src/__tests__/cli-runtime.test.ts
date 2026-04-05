import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as chromeLauncher from 'chrome-launcher';
import { ConfigSchema, type TrackedConfig } from '@open-wa/config';
import {
  clearChromePathCache,
  parseCliArgs,
  readChromePathCache,
  resolveExecutablePath,
  shouldPreferLocalChrome,
  writeChromePathCache,
} from '../cli-runtime';

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

describe('cli runtime chrome resolution', () => {
  const tempDirs: string[] = [];
  const getInstallationsSpy = vi.spyOn(chromeLauncher.Launcher, 'getInstallations');

  afterEach(() => {
    getInstallationsSpy.mockReset();
    vi.resetModules();
    vi.doUnmock('@open-wa/core');
    vi.doUnmock('@open-wa/client');
    vi.doUnmock('../server/hono-server');
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

  it('honors explicit useChrome false overrides', () => {
    const config = makeConfig();

    expect(
      shouldPreferLocalChrome(config, {
        defaults: { useChrome: false },
        file: { useChrome: false },
      } as TrackedConfig['rawConfigs'])
    ).toBe(false);
  });

  it('reuses a valid cached Chrome path without probing chrome-launcher again', async () => {
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

  it('keeps CLI override mapping source-local before resolveConfig owns precedence', () => {
    const parsed = parseCliArgs(['--session-id', 'alpha', '--port', '9000', '--headful', '--use-chrome']);

    expect(parsed.cliOverrides).toMatchObject({
      sessionId: 'alpha',
      port: 9000,
      headless: false,
      useChrome: true,
    });
    expect(parsed.forwardedArgs).toEqual(['--session-id', 'alpha', '--port', '9000', '--headful', '--use-chrome']);
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

    vi.doMock('@open-wa/core', () => ({ createClient: createClientMock }));
    vi.doMock('@open-wa/client', () => ({
      Client: class MockClient {
        start = clientStartMock;
        stop = vi.fn();
        getState = clientGetStateMock;
      },
    }));
    vi.doMock('../server/hono-server', () => ({
      WAServer: class MockWAServer {
        start = vi.fn();
        stop = vi.fn();
        setReadinessProvider = vi.fn();
        setQR = vi.fn();
        setClient = vi.fn();
      },
    }));
    vi.doMock('@open-wa/driver-puppeteer', () => ({ PuppeteerDriver: vi.fn() }));
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
    expect(sink.write).toHaveBeenCalledWith(expect.objectContaining({ message: 'Starting WhatsApp Client...' }));
    expect(sink.write).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('WhatsApp Client ready with state: CONNECTED'),
      })
    );

    outputSinkModule.resetCliOutputSink();
  });
});
