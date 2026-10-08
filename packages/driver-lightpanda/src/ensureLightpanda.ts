import { constants, createWriteStream } from 'node:fs';
import { access, chmod, mkdir, mkdtemp, rename, rm, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { get, type IncomingMessage } from 'node:https';
import { homedir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { toPublicError, type BrowserProvisionOptions, type IDriverContext } from '@open-wa/driver-interface';

const VERSION = '1.0.0';

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

export async function findLightpanda(): Promise<string | undefined> {
    const directories = [...(process.env.PATH ?? '').split(delimiter).filter(Boolean), join(homedir(), '.local', 'bin')];
    for (const directory of directories) {
        const candidate = join(directory, 'lightpanda');
        if (await isExecutable(candidate)) return candidate;
    }
    return undefined;
}

/** Download only on demand, verify the release checksum, and reuse a per-user binary. */
async function provisionLightpanda(
    options: { executablePath?: string; browser?: BrowserProvisionOptions; preferPinnedRelease?: boolean } = {},
    ctx?: IDriverContext,
): Promise<string> {
    const configuredPath = options.executablePath ?? process.env.LIGHTPANDA_EXECUTABLE_PATH;
    if (configuredPath !== undefined) {
        const executablePath = resolve(configuredPath);
        if (!configuredPath || !(await isExecutable(executablePath))) {
            throw new Error(`The configured Lightpanda executable is missing or not executable: ${configuredPath || '(empty path)'}`);
        }
        return executablePath;
    }
    const localPath = options.preferPinnedRelease ? undefined : await findLightpanda();
    if (localPath) return localPath;

    const os = process.platform === 'darwin' ? 'macos' : process.platform === 'linux' ? 'linux' : undefined;
    const arch = process.arch === 'arm64' ? 'aarch64' : process.arch === 'x64' ? 'x86_64' : undefined;
    if (!os || !arch) {
        throw new Error(`Lightpanda downloads are unavailable on ${process.platform}/${process.arch}. On Windows, run open-wa inside WSL2.`);
    }
    const assetName = `lightpanda-${arch}-${os}`;
    const cacheDir = resolve(options.browser?.cacheDirectory ?? join(homedir(), '.cache', 'open-wa', 'lightpanda'));
    const installationDir = join(cacheDir, VERSION, `${os}-${arch}`);
    const executablePath = join(installationDir, 'lightpanda');
    if (await isExecutable(executablePath)) return executablePath;
    const skipDownload = process.env.PUPPETEER_SKIP_DOWNLOAD;
    if (options.browser?.download === 'never' || options.browser?.download === undefined
        && skipDownload !== undefined && !['', '0', 'false', 'off'].includes(skipDownload.toLowerCase())) {
        throw new Error(`Lightpanda is missing from ${cacheDir} and browser downloads are disabled. Configure lightpanda.executablePath or enable browser.download.`);
    }

    const { Data, Effect, Schedule } = await import('effect');
    const { lock } = await import('proper-lockfile');
    const { ProxyAgent } = await import('proxy-agent');
    class LightpandaProvisionError extends Data.TaggedError('LightpandaProvisionError')<{
        readonly message: string;
        readonly cause: unknown;
        readonly retryable: boolean;
        readonly details: { browser: string; version: string; stage: string };
    }> {}
    const failure = (cause: unknown, stage: string, retryable = false) => new LightpandaProvisionError({
        message: `Unable to download Lightpanda: ${cause instanceof Error ? cause.message : String(cause)}. ` +
            `Check your connection, proxy settings and write access to ${cacheDir}, then retry.`,
        cause,
        retryable,
        details: { browser: 'Lightpanda', version: VERSION, stage },
    });
    const io = <A>(operation: (signal: AbortSignal) => PromiseLike<A>, stage = 'download') => Effect.tryPromise({
        try: operation,
        catch: cause => failure(cause, stage, stage === 'request' && (
            ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes((cause as NodeJS.ErrnoException)?.code ?? '')
            || cause instanceof Error && cause.message.includes('timed out')
        )),
    });
    let compromised: Error | undefined;
    const program = Effect.gen(function* () {
        yield* io(() => mkdir(installationDir, { recursive: true }));
        yield* Effect.acquireRelease(
            io(() => lock(installationDir, {
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
        if (yield* Effect.promise(() => isExecutable(executablePath))) return executablePath;
        const agent = yield* Effect.acquireRelease(
            Effect.sync(() => new ProxyAgent()),
            value => Effect.sync(() => value.destroy()),
        );
        const request = (url: string, redirects = 0): import('effect').Effect.Effect<
            IncomingMessage, LightpandaProvisionError, import('effect').Scope.Scope
        > => Effect.gen(function* () {
            if (redirects > 10) {
                return yield* Effect.fail(failure(new Error('Too many redirects while downloading Lightpanda.'), 'request'));
            }
            const response = yield* Effect.acquireRelease(
                io(signal => new Promise<IncomingMessage>((resolveResponse, reject) => {
                    const req = get(url, { agent, signal, headers: { 'User-Agent': 'open-wa', Accept: 'application/json' } }, resolveResponse);
                    req.on('error', reject);
                    // Aborts the underlying socket, including an idle response body.
                    req.setTimeout(60_000, () => req.destroy(new Error('Lightpanda download timed out.')));
                }), 'request'),
                value => Effect.sync(() => { value.destroy(); }),
            );
            if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                response.resume();
                return yield* request(new URL(response.headers.location, url).href, redirects + 1);
            }
            if (response.statusCode !== 200) {
                response.destroy();
                return yield* Effect.fail(failure(
                    new Error(`Lightpanda download returned HTTP ${response.statusCode}.`),
                    'request', response.statusCode === 429 || (response.statusCode ?? 0) >= 500,
                ));
            }
            return response;
        }).pipe(Effect.retry({
            times: 2,
            schedule: Schedule.exponential('250 millis'),
            while: error => error.retryable,
        }));
        report(ctx, `Downloading Lightpanda ${VERSION}. It will be reused from ${cacheDir}.`);
        const metadata = yield* request(`https://api.github.com/repos/lightpanda-io/browser/releases/tags/${VERSION}`);
        const asset = yield* io(async () => {
            const chunks: Buffer[] = [];
            for await (const chunk of metadata) chunks.push(Buffer.from(chunk));
            const assets = (JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
                assets: Array<{ name: string; digest?: string; browser_download_url: string }>;
            }).assets;
            const asset = assets.find(item => item.name === assetName);
            if (!asset || !/^sha256:[a-f0-9]{64}$/.test(asset.digest ?? '')) {
                throw new Error(`No checksummed Lightpanda ${VERSION} binary is available for ${os}/${arch}.`);
            }
            return asset;
        }, 'release metadata');
        const staging = yield* Effect.acquireRelease(
            io(() => mkdtemp(join(installationDir, '.download-'))),
            path => io(() => rm(path, { recursive: true, force: true }), 'staging cleanup').pipe(Effect.orDie),
        );
        const binaryPath = join(staging, 'lightpanda');
        const response = yield* request(asset.browser_download_url);
        const total = Number(response.headers['content-length']) || 0;
        const hash = createHash('sha256');
        let downloaded = 0;
        let lastReport = 0;
        yield* io(signal => pipeline(response, new Transform({
            transform(chunk, _encoding, callback) {
                hash.update(chunk);
                downloaded += chunk.length;
                const now = Date.now();
                if (now - lastReport >= 2_000 || downloaded === total) {
                    lastReport = now;
                    report(ctx, `Downloading Lightpanda: ${total ? `${Math.min(100, Math.floor(downloaded / total * 100))}%` : `${Math.round(downloaded / 1_048_576)} MiB`}`);
                }
                callback(null, chunk);
            },
        }), createWriteStream(binaryPath, { flags: 'wx' }), { signal }));
        yield* io(async () => {
            if (`sha256:${hash.digest('hex')}` !== asset.digest) throw new Error('Lightpanda checksum verification failed.');
            await chmod(binaryPath, 0o755);
            if (compromised) throw compromised;
            await rename(binaryPath, executablePath);
        }, 'checksum and publication');
        report(ctx, `Lightpanda ${VERSION} is ready.`);
        return executablePath;
    });
    // Scope finalizers run after the file and stream operations have settled.
    return Effect.runPromise(Effect.scoped(Effect.uninterruptible(program)).pipe(
        Effect.withSpan('browser.provision', { attributes: { browser: 'Lightpanda', version: VERSION, platform: `${os}-${arch}` } }),
    ));
}

export function ensureLightpanda(
    options: { executablePath?: string; browser?: BrowserProvisionOptions; preferPinnedRelease?: boolean } = {},
    ctx?: IDriverContext,
): Promise<string> {
    return provisionLightpanda(options, ctx).catch(cause => { throw toPublicError(cause); });
}
