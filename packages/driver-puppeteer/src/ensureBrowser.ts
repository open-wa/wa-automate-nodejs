import { constants } from 'node:fs';
import { access, mkdir, mkdtemp, readdir, rename, rm, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { toPublicError, type BrowserProvisionOptions, type IDriverContext } from '@open-wa/driver-interface';

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
 * Resolve a browser without launching it. Chrome's default revision comes from
 * puppeteer-core, so the same cache can be pre-provisioned during
 * deployment and reused by startup with `browser.download: 'never'`.
 */
async function provisionBrowser(
    options: EnsureBrowserOptions = {},
    ctx?: IDriverContext,
): Promise<string> {
    const configuredPath = options.executablePath ?? process.env.PUPPETEER_EXECUTABLE_PATH;
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

    const { Browser, Cache, detectBrowserPlatform, install, resolveBuildId } = await import('@puppeteer/browsers');
    const platform = detectBrowserPlatform();
    if (!platform) {
        throw new Error(`Automatic browser setup is unavailable on ${process.platform}/${process.arch}. Configure executablePath with a compatible Chrome installation.`);
    }
    // Both headless:true and headless:false launch Chrome. The separate
    // chrome-headless-shell download is only used by Puppeteer's 'shell' mode.
    const browser = options.browser?.kind === 'chromium' ? Browser.CHROMIUM : Browser.CHROME;
    const label = browser === Browser.CHROMIUM ? 'Chromium' : 'Chrome';
    const cacheDir = resolve(options.browser?.cacheDirectory ?? process.env.PUPPETEER_CACHE_DIR ?? join(homedir(), '.cache', 'puppeteer'));
    const cache = new Cache(cacheDir);
    const skipDownload = [process.env.PUPPETEER_SKIP_DOWNLOAD, process.env.PUPPETEER_CHROME_SKIP_DOWNLOAD]
        .some(value => value !== undefined && !['', '0', 'false', 'off'].includes(value.toLowerCase()));
    const allowDownload = options.browser?.download !== undefined
        ? options.browser.download === 'auto'
        : !skipDownload;

    let buildId: string;
    if (browser === Browser.CHROMIUM) {
        // Reuse a snapshot before doing any network lookup, including offline starts.
        const installed = cache.getInstalledBrowsers()
            .filter(item => item.browser === browser && item.platform === platform)
            .sort((a, b) => Number(b.buildId) - Number(a.buildId));
        for (const item of installed) {
            if (await isExecutable(item.executablePath)) return item.executablePath;
        }
        if (!allowDownload) {
            throw new Error(`Chromium is missing from ${cacheDir} and browser downloads are disabled. Configure executablePath or enable browser.download.`);
        }
        if (platform === 'linux_arm') {
            throw new Error('Managed Chromium snapshots are unavailable for Linux ARM64. Configure executablePath to a native Chromium installation.');
        }
        buildId = (await resolveBuildId(browser, platform, 'latest')).trim();
    } else {
        const { PUPPETEER_REVISIONS } = await import('puppeteer-core/internal/revisions.js');
        buildId = process.env.PUPPETEER_CHROME_VERSION ?? PUPPETEER_REVISIONS.chrome;
        if (!/^\d+\.\d+\.\d+\.\d+$/.test(buildId)) {
            throw new Error('PUPPETEER_CHROME_VERSION must be an exact Chrome version. Remove it to use the Puppeteer-matched version.');
        }
    }
    const executablePath = cache.computeExecutablePath({ browser, buildId, platform });
    if (await isExecutable(executablePath)) return executablePath;
    // An existing Chrome is sufficient; a CLI package update must not force a download.
    for (const installed of cache.getInstalledBrowsers()
        .filter(item => item.browser === browser && item.platform === platform)
        .sort((a, b) => b.buildId.localeCompare(a.buildId, undefined, { numeric: true }))) {
        if (await isExecutable(installed.executablePath)) return installed.executablePath;
    }

    if (!allowDownload) {
        throw new Error(
            `${label} ${buildId} is missing from ${cacheDir} and browser downloads are disabled. ` +
            'Pre-provision this cache with await ensureBrowser({ browser: { download: "auto", cacheDirectory: "..." } }) on a connected machine of the same platform, or configure executablePath.',
        );
    }

    // Effect is loaded only when a download is actually needed. Installed and
    // cached executables keep their lightweight startup path.
    const { Data, Effect, Schedule } = await import('effect');
    const { lock } = await import('proper-lockfile');
    class BrowserProvisionError extends Data.TaggedError('BrowserProvisionError')<{
        readonly message: string;
        readonly cause: unknown;
        readonly details: { browser: string; buildId: string; stage: string };
    }> {}
    const io = <A>(operation: () => PromiseLike<A>, stage = 'download') => Effect.tryPromise({
        try: operation,
        catch: cause => new BrowserProvisionError({
            message: stage === 'lock'
                ? `Could not acquire the browser installation lock in ${cacheDir}. Another startup may still be downloading ${label}; retry after it finishes.`
                : `Unable to provision ${label} ${buildId}: ${cause instanceof Error ? cause.message : String(cause)}. ` +
                    `Check your connection, proxy settings, browser.downloadBaseUrl and write access to ${cacheDir}, then retry.`,
            cause,
            details: { browser: label, buildId, stage },
        }),
    });
    let compromised: Error | undefined;
    const program = Effect.gen(function* () {
        yield* io(() => mkdir(cacheDir, { recursive: true }));
        yield* Effect.acquireRelease(
            io(() => lock(cache.installationDir(browser, platform, buildId), {
                realpath: false,
                lockfilePath: join(cacheDir, `.open-wa-${browser}-${platform}-${buildId}.lock`),
                stale: 120_000,
                update: 10_000,
                retries: 0,
                onCompromised(error) { compromised = error; },
            }), 'lock').pipe(Effect.retry({
                times: 600,
                schedule: Schedule.spaced('1 second'),
                while: error => (error.cause as NodeJS.ErrnoException)?.code === 'ELOCKED',
            })),
            release => compromised ? Effect.void : io(() => release(), 'lock release').pipe(Effect.orDie),
        );
        // A concurrent startup may have completed while this caller waited.
        if (yield* Effect.promise(() => isExecutable(executablePath))) return executablePath;
        const stagingPrefix = `.open-wa-${browser}-${platform}-${buildId}-download-`;
        for (const name of yield* io(() => readdir(cacheDir))) {
            if (name.startsWith(stagingPrefix)) {
                yield* io(() => rm(join(cacheDir, name), { recursive: true, force: true }));
            }
        }
        const staging = yield* Effect.acquireRelease(
            io(() => mkdtemp(join(cacheDir, stagingPrefix))),
            path => io(() => rm(path, { recursive: true, force: true }), 'staging cleanup').pipe(Effect.orDie),
        );
        report(ctx, `Downloading ${label} ${buildId} for ${platform}. It will be reused from ${cacheDir}.`);
        let lastReport = 0;
        // Puppeteer's installer does not accept an AbortSignal. Let its IO settle
        // before the scope removes staging files or releases the installation lock.
        const installed = yield* io(() => install({
            browser,
            buildId,
            platform,
            cacheDir: staging,
            baseUrl: options.browser?.downloadBaseUrl ?? (browser === Browser.CHROME ? process.env.PUPPETEER_CHROME_DOWNLOAD_BASE_URL : undefined),
            installDeps: false,
            downloadProgressCallback(downloaded, total) {
                const now = Date.now();
                if (now - lastReport < 2_000 && downloaded !== total) return;
                lastReport = now;
                const progress = total > 0
                    ? `${Math.min(100, Math.floor(downloaded / total * 100))}%`
                    : `${Math.round(downloaded / 1_048_576)} MiB`;
                report(ctx, `Downloading ${label} ${buildId}: ${progress}`);
            },
        }));
        yield* io(async () => {
            if (compromised) throw compromised;
            if (!(await isExecutable(installed.executablePath))) {
                throw new Error(`The browser archive did not contain an executable ${label} binary.`);
            }
            const destination = cache.installationDir(browser, platform, buildId);
            await mkdir(cache.browserRoot(browser), { recursive: true });
            // Publish only the fully extracted installation.
            await rm(destination, { recursive: true, force: true });
            if (compromised) throw compromised;
            await rename(installed.path, destination);
        }, 'publication');
        report(ctx, `${label} ${buildId} is ready.`);
        return executablePath;
    });
    return Effect.runPromise(Effect.scoped(Effect.uninterruptible(program)).pipe(
        Effect.withSpan('browser.provision', { attributes: { browser: label, buildId, platform } }),
    ));
}

/** Promise boundary: callers receive ordinary SDK errors, never Effect internals. */
export function ensureBrowser(options: EnsureBrowserOptions = {}, ctx?: IDriverContext): Promise<string> {
    return provisionBrowser(options, ctx).catch(cause => { throw toPublicError(cause); });
}
