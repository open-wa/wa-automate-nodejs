import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import type { BrowserProvisionOptions, IDriverContext } from '@open-wa/driver-interface';

const run = promisify(execFile);
const RECIPE = 'whatsapp-ua-v1';
// Official 1.0.0 release digests. Never modify an arbitrary installed binary.
const RELEASE_DIGESTS = new Set([
    '955440053a84754dd64c62f970449a56a2b350cdf43ea5f2e809a73047b8173d',
    'e510299683b37a203912eac0ee00732224b2ef9b07fe58e69c467f5255be45e2',
    '69791924bcee43b13b224af4c845622c5fe66fdbc1b8143bfaa39ca8f85244f5',
    'aa5a4b8ed53d1e38b3c73f5b2647d0a84a82e6744557f45f9a9c85858aa031c3',
]);
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/** Prepare a separate cached v1 copy that accepts WhatsApp's browser identity. */
export async function prepareWhatsAppExecutable(
    sourcePath: string,
    browser?: BrowserProvisionOptions,
    ctx?: IDriverContext,
): Promise<string> {
    const original = await readFile(sourcePath);
    const sourceSha256 = digest(original);
    // An explicit custom executable may already implement the required UA override.
    // The page driver checks that override before navigating WhatsApp.
    if (!RELEASE_DIGESTS.has(sourceSha256)) return sourcePath;

    const cacheRoot = resolve(browser?.cacheDirectory ?? join(homedir(), '.cache', 'open-wa', 'lightpanda'));
    const directory = join(cacheRoot, RECIPE, sourceSha256);
    const executablePath = join(directory, 'lightpanda');
    const manifestPath = join(directory, 'manifest.json');
    const cached = async () => {
        try {
            const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
            return manifest.recipe === RECIPE && manifest.sourceSha256 === sourceSha256
                && manifest.executableSha256 === digest(await readFile(executablePath));
        } catch { return false; }
    };
    if (await cached()) return executablePath;
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const { lock } = await import('proper-lockfile');
    let compromised: Error | undefined;
    const release = await lock(directory, {
        stale: 120_000, update: 10_000,
        retries: { retries: 60, factor: 1, minTimeout: 1_000, maxTimeout: 1_000 },
        onCompromised(error) { compromised = error; },
    });
    let staging: string | undefined;
    try {
        if (await cached()) return executablePath;
        ctx?.logger?.info('Preparing experimental Lightpanda WhatsApp executable (separate cached copy)');
        const patched = Buffer.from(original);
        for (const [oldText, newText, minimumCount] of [
            ['mozilla', 'mozil_x', 1], ['Sec-Ch-Ua', 'X-ec-H-UA', 4],
        ] as const) {
            const oldBytes = Buffer.from(oldText), newBytes = Buffer.from(newText);
            let count = 0, offset = 0;
            while ((offset = patched.indexOf(oldBytes, offset)) !== -1) {
                newBytes.copy(patched, offset);
                offset += oldBytes.length;
                count++;
            }
            if (count < minimumCount || count > 20) {
                throw new Error('The pinned Lightpanda executable does not match the WhatsApp preparation recipe.');
            }
        }
        staging = await mkdtemp(join(directory, '.prepare-'));
        const prepared = join(staging, 'lightpanda');
        await writeFile(prepared, patched, { flag: 'wx', mode: 0o700 });
        if (process.platform === 'darwin') {
            await run('/usr/bin/codesign', ['--force', '--sign', '-', '--identifier', 'open-wa.lightpanda.experimental-v1', prepared]);
        }
        await chmod(prepared, 0o700);
        const manifest = {
            recipe: RECIPE, sourceSha256, executableSha256: digest(await readFile(prepared)),
            version: '1.0.0', experimentalWhatsApp: true,
        };
        const preparedManifest = join(staging, 'manifest.json');
        await writeFile(preparedManifest, JSON.stringify(manifest) + '\n', { flag: 'wx', mode: 0o600 });
        if (compromised) throw compromised;
        await rename(prepared, executablePath);
        await rename(preparedManifest, manifestPath);
        return executablePath;
    } finally {
        try { if (staging) await rm(staging, { recursive: true, force: true }); }
        finally { if (!compromised) await release(); }
    }
}
