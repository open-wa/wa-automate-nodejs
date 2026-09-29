import { constants } from 'node:fs';
import { access, mkdir, mkdtemp, readdir, rename, rm, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import type { BrowserProvisionOptions, IDriverContext } from '@open-wa/driver-interface';

export interface EnsureBrowserOptions {
    executablePath?: string;
    browser?: BrowserProvisionOptions;
}

async function isExecutable(path: string): Promise<boolean> {
    try {
        if (!(await stat(path)).isFile()) return false;
        await access(path, constants.X_OK);
        return true;
    } catch {
        return false;
    }
}

function report(ctx: IDriverContext | undefined, message: string): void {
    if (ctx?.logger) ctx.logger.info(message);
    else console.error(`[open-wa] ${message}`);
}

/**
 * Resolve Chrome without launching it. The default revision comes from the
 * installed Puppeteer package, so the same cache can be pre-provisioned during
 * deployment and reused by startup with `browser.download: 'never'`.
 */
export async function ensureBrowser(
    options: EnsureBrowserOptions = {},
    ctx?: IDriverContext,
): Promise<string> {
    const { default: puppeteer, PUPPETEER_REVISIONS } = await import('puppeteer');
    const configuration = await puppeteer.configuration();
    const configuredPath = options.executablePath ?? configuration.executablePath;
    if (configuredPath !== undefined) {
        const executablePath = resolve(configuredPath);
        if (!configuredPath || !(await isExecutable(executablePath))) {
            throw new Error(
                `The configured browser executable is missing or not executable: ${configuredPath || '(empty path)'}. ` +
                'Set executablePath (or PUPPETEER_EXECUTABLE_PATH) to the browser binary, or remove it to use managed Chrome.',
            );
        }
        return executablePath;
    }

    const { Browser, Cache, detectBrowserPlatform, install } = await import('@puppeteer/browsers');
    const platform = detectBrowserPlatform();
    if (!platform) {
        throw new Error(`Automatic browser setup is unavailable on ${process.platform}/${process.arch}. Configure executablePath with a compatible Chrome installation.`);
    }
    // Both headless:true and headless:false launch Chrome. The separate
    // chrome-headless-shell download is only used by Puppeteer's 'shell' mode.
    const browser = Browser.CHROME;
    const buildId = configuration.chrome?.version ?? PUPPETEER_REVISIONS.chrome;
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(buildId)) {
        throw new Error('PUPPETEER_CHROME_VERSION must be an exact Chrome version for reproducible browser setup. Remove it to use the Puppeteer-matched version.');
    }
    const cacheDir = resolve(options.browser?.cacheDirectory ?? configuration.cacheDirectory ?? join(homedir(), '.cache', 'puppeteer'));
    const cache = new Cache(cacheDir);
    const executablePath = cache.computeExecutablePath({ browser, buildId, platform });
    if (await isExecutable(executablePath)) return executablePath;

    const allowDownload = options.browser?.download !== undefined
        ? options.browser.download === 'auto'
        : !configuration.skipDownload && !configuration.chrome?.skipDownload;
    if (!allowDownload) {
        throw new Error(
            `Chrome ${buildId} is missing from ${cacheDir} and browser downloads are disabled. ` +
            'Pre-provision this cache with await ensureBrowser({ browser: { download: "auto", cacheDirectory: "..." } }) on a connected machine of the same platform, or configure executablePath.',
        );
    }

    await mkdir(cacheDir, { recursive: true });
    const { lock } = await import('proper-lockfile');
    let compromised: Error | undefined;
    const release = await lock(cache.installationDir(browser, platform, buildId), {
        realpath: false,
        lockfilePath: join(cacheDir, `.open-wa-${platform}-${buildId}.lock`),
        stale: 120_000,
        update: 10_000,
        retries: { retries: 600, factor: 1, minTimeout: 1_000, maxTimeout: 1_000 },
        onCompromised(error) { compromised = error; },
    }).catch((cause: unknown) => {
        throw new Error(`Could not acquire the browser installation lock in ${cacheDir}. Another startup may still be downloading Chrome; retry after it finishes.`, { cause });
    });

    let staging: string | undefined;
    try {
        // A concurrent startup may have completed while this caller waited.
        if (await isExecutable(executablePath)) return executablePath;
        const stagingPrefix = `.open-wa-${platform}-${buildId}-download-`;
        // Only this revision's disposable download directories are removed.
        // They are never browser profiles or session data.
        for (const name of await readdir(cacheDir)) {
            if (name.startsWith(stagingPrefix)) await rm(join(cacheDir, name), { recursive: true, force: true });
        }
        staging = await mkdtemp(join(cacheDir, stagingPrefix));
        report(ctx, `Downloading Chrome ${buildId} for ${platform}. It will be reused from ${cacheDir}.`);
        let lastReport = 0;
        const installed = await install({
            browser,
            buildId,
            platform,
            cacheDir: staging,
            baseUrl: options.browser?.downloadBaseUrl ?? configuration.chrome?.downloadBaseUrl,
            installDeps: false,
            downloadProgressCallback(downloaded, total) {
                const now = Date.now();
                if (now - lastReport < 2_000 && downloaded !== total) return;
                lastReport = now;
                const progress = total > 0
                    ? `${Math.min(100, Math.floor(downloaded / total * 100))}%`
                    : `${Math.round(downloaded / 1_048_576)} MiB`;
                report(ctx, `Downloading Chrome ${buildId}: ${progress}`);
            },
        });
        if (compromised) throw compromised;
        if (!(await isExecutable(installed.executablePath))) {
            throw new Error('The browser archive did not contain an executable Chrome binary.');
        }
        const destination = cache.installationDir(browser, platform, buildId);
        await mkdir(cache.browserRoot(browser), { recursive: true });
        // Replace an incomplete prior installation only after its replacement
        // is fully extracted. Readers only see the final directory after rename.
        await rm(destination, { recursive: true, force: true });
        if (compromised) throw compromised;
        await rename(installed.path, destination);
        report(ctx, `Chrome ${buildId} is ready.`);
        return executablePath;
    } catch (cause) {
        throw new Error(
            `Unable to provision Chrome ${buildId}. Check your connection, HTTP_PROXY/HTTPS_PROXY/NO_PROXY, browser.downloadBaseUrl and write access to ${cacheDir}, then retry. ` +
            'Alternatively, configure executablePath to an installed Chrome binary.',
            { cause },
        );
    } finally {
        try {
            if (staging) await rm(staging, { recursive: true, force: true });
        } finally {
            // A compromised lock belongs to another process now; proper-lockfile
            // has already relinquished it and release would mask the real error.
            if (!compromised) await release();
        }
    }
}
