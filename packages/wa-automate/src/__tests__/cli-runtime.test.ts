import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigSchema, type TrackedConfig } from '@open-wa/config';

const getInstallationsMock = vi.hoisted(() => vi.fn<() => string[]>());

vi.mock('chrome-launcher', () => ({
  Launcher: {
    getInstallations: getInstallationsMock,
  },
}));

import {
  clearChromePathCache,
  readChromePathCache,
  resolveExecutablePath,
  shouldPreferLocalChrome,
  writeChromePathCache,
} from '../cli-runtime';

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

  afterEach(() => {
    getInstallationsMock.mockReset();
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

    getInstallationsMock.mockReturnValue([localChromePath]);

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
    expect(getInstallationsMock).not.toHaveBeenCalled();
  });

  it('ignores stale cached paths and refreshes them from a newly detected local Chrome executable', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'openwa-cli-runtime-'));
    tempDirs.push(tempDir);
    const cacheFilePath = join(tempDir, '.open-wa', 'chrome-executable-path.json');
    const refreshedChromePath = createTempExecutable(tempDir, 'Refreshed Google Chrome');
    const config = makeConfig();

    mkdirSync(join(tempDir, '.open-wa'), { recursive: true });
    writeFileSync(cacheFilePath, JSON.stringify({ executablePath: join(tempDir, 'missing-chrome') }), 'utf8');
    getInstallationsMock.mockReturnValue([join(tempDir, 'missing-chrome'), refreshedChromePath]);

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
    getInstallationsMock.mockReturnValue([join(tempDir, 'also-missing-chrome')]);

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
});
