import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadConfigFile, loadConfigFileSync } from '../loader';

const temporaryDirectories: string[] = [];

function createConfig(filename: string): string {
  const directory = mkdtempSync(join(tmpdir(), 'open-wa-config-'));
  temporaryDirectories.push(directory);
  const configPath = join(directory, filename);
  writeFileSync(configPath, 'export default { port: 8765 };\n');
  return configPath;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('config file loading', () => {
  it('loads TypeScript configuration through both async and sync explorers', async () => {
    const configPath = createConfig('wa.config.ts');

    expect((await loadConfigFile({ configPath, throwOnMissing: true }))?.config.port).toBe(8765);
    expect(loadConfigFileSync({ configPath, throwOnMissing: true })?.config.port).toBe(8765);
  });

  it('loads ESM configuration through the async explorer', async () => {
    const configPath = createConfig('wa.config.mjs');

    expect((await loadConfigFile({ configPath, throwOnMissing: true }))?.config.port).toBe(8765);
  });
});
