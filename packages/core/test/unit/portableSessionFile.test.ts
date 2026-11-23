import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { acquirePortableSessionFile } from '../../src/transport/portableSessionFile';

let directory: string | undefined;
afterEach(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });

describe('portable session file', () => {
  it('keeps a rejected login as <file>.rejected when it is cleared', async () => {
    directory = await mkdtemp(join(tmpdir(), 'owa-session-'));
    const file = join(directory, 'shop.data.json');
    await writeFile(file, 'saved-login', { mode: 0o600 });

    const lease = await acquirePortableSessionFile(file);
    await lease.remove();
    // A second reset finds only the marker and must not replace the kept login.
    await lease.remove();
    await lease.release();

    expect(await readFile(file, 'utf8')).toBe('LOGGED OUT');
    expect(await readFile(`${file}.rejected`, 'utf8')).toBe('saved-login');
  });
});
