import type { CreateClientOptions, OpenWAEventMap } from '@open-wa/core';
import type { Client } from '@open-wa/client';
import { resolveConfig, type PartialConfig, type Config, type TrackedConfig } from '@open-wa/config';
import { accessSync, constants, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { getCliOutputSink } from './cli/output-sink';
import { chooseBrowser, findSystemBrowser, readBrowserChoice, writeBrowserChoice, type BrowserChoice } from './browser-choice';

export interface ExecutablePathResolution {
    executablePath?: string;
    source:
        | 'config'
        | 'cache'
        | 'chrome_installation'
        | 'driver_default'
        | 'lightpanda_config'
        | 'lightpanda_managed'
        | 'managed_browser';
    warning?: string;
}

export interface DriverSelection {
    driver: CreateClientOptions['driver'];
    engineLabel: 'Puppeteer' | 'Lightpanda';
    executableResolution: ExecutablePathResolution;
    preferLocalChrome: boolean;
}

function readChromePathCache(cacheFilePath: string): { executablePath?: string } | undefined {
    try {
        if (!existsSync(cacheFilePath)) {
            return undefined;
        }

        const raw = JSON.parse(readFileSync(cacheFilePath, 'utf8')) as { executablePath?: string };
        if (!raw || typeof raw !== 'object') {
            return undefined;
        }

        return {
            executablePath: typeof raw.executablePath === 'string' ? raw.executablePath : undefined,
        };
    } catch {
        return undefined;
    }
}

function writeChromePathCache(executablePath: string, cacheFilePath: string): void {
    mkdirSync(dirname(cacheFilePath), { recursive: true });
    writeFileSync(cacheFilePath, JSON.stringify({ executablePath, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
}

function clearChromePathCache(cacheFilePath: string): void {
    if (existsSync(cacheFilePath)) {
        rmSync(cacheFilePath, { force: true });
    }
}

function isUsableExecutablePath(executablePath?: string): executablePath is string {
    if (!executablePath) return false;
    try {
        if (!statSync(executablePath).isFile()) return false;
        accessSync(executablePath, constants.X_OK);
        return true;
    } catch {
        return false;
    }
}

function getExplicitUseChromePreference(rawConfigs?: TrackedConfig['rawConfigs']): boolean | undefined {
    const explicitConfigSources = [
        rawConfigs?.file,
        rawConfigs?.env,
        rawConfigs?.cli,
        rawConfigs?.programmatic,
    ];

    for (let index = explicitConfigSources.length - 1; index >= 0; index -= 1) {
        const source = explicitConfigSources[index];
        if (source?.useChrome !== undefined) {
            return source.useChrome;
        }
    }

    return undefined;
}

export function shouldPreferLocalChrome(
    config: Config,
    rawConfigs?: TrackedConfig['rawConfigs'],
    defaultPreference = true,
): boolean {
    if (config.useLightpanda || config.useChromium || config.browser?.kind === 'chromium') {
        return false;
    }

    if (config.executablePath || process.env.PUPPETEER_EXECUTABLE_PATH !== undefined) {
        return false;
    }

    const explicitUseChrome = getExplicitUseChromePreference(rawConfigs);
    if (explicitUseChrome !== undefined) {
        return explicitUseChrome;
    }

    return defaultPreference;
}

export async function resolveExecutablePath(
    config: Config,
    options: {
        preferLocalChrome?: boolean;
        cacheFilePath: string;
        kind?: 'chrome' | 'chromium';
    }
): Promise<ExecutablePathResolution> {
    const configuredPath = config.executablePath ?? process.env.PUPPETEER_EXECUTABLE_PATH;
    if (configuredPath !== undefined) {
        return {
            executablePath: configuredPath,
            source: 'config',
        };
    }

    const preferLocalChrome = options.preferLocalChrome ?? config.useChrome;
    if (!preferLocalChrome) {
        return {
            source: 'driver_default',
        };
    }

    const matchesKind = (path: string) => options.kind === 'chromium'
        ? /chromium/i.test(path)
        : !/chromium/i.test(path);
    const cachedPath = readChromePathCache(options.cacheFilePath)?.executablePath;
    if (isUsableExecutablePath(cachedPath) && matchesKind(cachedPath)) {
        return {
            executablePath: cachedPath,
            source: 'cache',
        };
    }

    if (cachedPath) {
        clearChromePathCache(options.cacheFilePath);
    }

    // Check known installation paths and PATH without a synchronous OS-wide
    // application scan, so a missing Chrome reaches the picker promptly.
    const detectedPath = await findSystemBrowser(options.kind ?? 'chrome');

    if (detectedPath) {
        writeChromePathCache(detectedPath, options.cacheFilePath);
        return {
            executablePath: detectedPath,
            source: 'chrome_installation',
        };
    }

    clearChromePathCache(options.cacheFilePath);

    return {
        source: 'driver_default',
    };
}

export function resolveLightpandaExecutablePath(config: Config): ExecutablePathResolution {
    const executablePath = config.lightpanda?.executablePath ?? config.executablePath ?? process.env.LIGHTPANDA_EXECUTABLE_PATH;
    if (executablePath) {
        return {
            executablePath,
            source: 'lightpanda_config',
        };
    }

    return {
        source: 'lightpanda_managed',
    };
}

export async function selectRuntimeDriver(
    config: Config,
    options: {
        rawConfigs?: TrackedConfig['rawConfigs'];
        cacheFilePath: string;
        defaultPreferLocalChrome?: boolean;
        promptForMissingBrowser?: boolean;
        nonInteractive?: boolean;
    }
): Promise<DriverSelection> {
    const flags = [config.useChrome, config.useChromium, config.useLightpanda].filter(Boolean);
    if (flags.length > 1) throw new Error('Choose only one browser: useChrome, useChromium or useLightpanda.');
    let kind: BrowserChoice | undefined = config.useLightpanda ? 'lightpanda'
        : config.useChromium ? 'chromium'
        : config.useChrome ? 'chrome'
        : config.browser?.kind;
    const explicitChoice = kind !== undefined || getExplicitUseChromePreference(options.rawConfigs) !== undefined
        || config.browser?.download === 'auto';
    const preferLocalChrome = shouldPreferLocalChrome(config, options.rawConfigs, options.defaultPreferLocalChrome ?? true);
    let executableResolution: ExecutablePathResolution = { source: 'driver_default' };
    if (kind !== 'lightpanda') {
        executableResolution = await resolveExecutablePath(config, {
            preferLocalChrome: kind === 'chromium' || preferLocalChrome,
            cacheFilePath: kind === 'chromium' ? `${options.cacheFilePath}.chromium` : options.cacheFilePath,
            kind: kind === 'chromium' ? 'chromium' : 'chrome',
        });
    } else {
        executableResolution = resolveLightpandaExecutablePath(config);
        executableResolution.executablePath ??= config.executablePath;
    }
    if (!executableResolution.executablePath && (kind !== undefined || options.promptForMissingBrowser)) {
        const remembered = await readBrowserChoice();
        if (remembered && (kind === undefined || remembered.kind === kind)) {
            kind = remembered.kind;
            executableResolution = { source: 'cache', executablePath: remembered.executablePath };
        }
    }
    if (!kind && executableResolution.executablePath === undefined && options.promptForMissingBrowser) {
        // A pre-provisioned Chrome cache is usable even without a remembered choice.
        const { ensureBrowser } = await import('@open-wa/driver-puppeteer');
        try {
            const executablePath = await ensureBrowser({ browser: { ...config.browser, kind: 'chrome', download: 'never' } });
            executableResolution = { source: 'managed_browser', executablePath };
        } catch (error) {
            if (!(error instanceof Error) || !/missing from .* and browser downloads are disabled/.test(error.message)) throw error;
        }
    }
    if (!kind && !executableResolution.executablePath && !explicitChoice && options.promptForMissingBrowser) {
        if (config.browser?.download === 'never') {
            throw new Error('No browser is available and browser downloads are disabled. Configure executablePath or pre-provision a browser cache.');
        }
        if (options.nonInteractive || process.env.CI || process.env.NONINTERACTIVE) {
            throw new Error('No browser is installed. Choose --use-chrome, --use-chromium or --use-lightpanda to download one without a prompt.');
        }
        kind = await chooseBrowser();
    }
    kind ??= 'chrome';
    const sink = getCliOutputSink();
    const ctx = { logger: {
        debug: (message: string) => sink.write({ level: 'debug', message }),
        info: (message: string) => sink.write({ level: 'info', message }),
        warn: (message: string) => sink.write({ level: 'warn', message }),
        error: (message: string) => sink.write({ level: 'error', message }),
    } };
    const browser = {
        ...config.browser,
        ...(explicitChoice || options.promptForMissingBrowser ? { download: config.browser?.download ?? ('auto' as const) } : {}),
        ...(kind !== 'lightpanda' ? { kind } : {}),
    };
    if (kind === 'lightpanda') {
        const { LightpandaDriver, ensureLightpanda } = await import('@open-wa/driver-lightpanda');
        config.browser = browser;
        const executablePath = await ensureLightpanda({
            executablePath: executableResolution.executablePath,
            browser,
        }, ctx);
        config.useLightpanda = true;
        config.useChrome = false;
        config.useChromium = false;
        sink.write({ level: 'warn', message: 'Lightpanda has low compatibility and experimental WhatsApp support; video, screenshots and rendering are unavailable.' });
        if (options.promptForMissingBrowser) {
            await writeBrowserChoice(kind, executablePath).catch(error => sink.write({ level: 'warn', message: `Could not remember the browser choice: ${error instanceof Error ? error.message : String(error)}` }));
        }
        return {
            driver: new LightpandaDriver(),
            engineLabel: 'Lightpanda',
            executableResolution: { source: 'lightpanda_managed', executablePath },
            preferLocalChrome: false,
        };
    }
    config.browser = browser;
    const { PuppeteerDriver, ensureBrowser } = await import('@open-wa/driver-puppeteer');
    const executablePath = await ensureBrowser({ executablePath: executableResolution.executablePath, browser }, ctx);
    if (!executableResolution.executablePath) executableResolution = { source: 'managed_browser', executablePath };
    if (options.promptForMissingBrowser) {
        await writeBrowserChoice(kind, executablePath).catch(error => sink.write({ level: 'warn', message: `Could not remember the browser choice: ${error instanceof Error ? error.message : String(error)}` }));
    }
    return {
        driver: new PuppeteerDriver(),
        engineLabel: 'Puppeteer',
        executableResolution,
        preferLocalChrome,
    };
}

export function toCreateClientOptions(
    config: Config,
    driverSelection: DriverSelection,
    options: {
        debug?: boolean;
    } = {},
): CreateClientOptions {
    return {
        sessionId: config.sessionId,
        driver: driverSelection.driver,
        deleteSessionDataOnLogout: config.deleteSessionDataOnLogout,
        killClientOnLogout: config.killClientOnLogout,
        sessionDataPath: config.sessionDataPath,
        sessionData: config.sessionData,
        skipSessionSave: config.skipSessionSave,
        sessionDataBucketAuth: config.sessionDataBucketAuth,
        sessionDataEncryptionKey: config.sessionDataEncryptionKey,
        sessionDataEncryptionKeyFile: config.sessionDataEncryptionKeyFile,
        s3Sync: config.s3Sync,
        debug: options.debug ?? (config.logLevel === 'debug' || config.logConsole),
        headless: config.headless,
        qrTimeoutMs: typeof config.qrTimeout === 'number' ? config.qrTimeout * 1000 : undefined,
        authTimeoutMs: typeof config.authTimeout === 'number' ? config.authTimeout * 1000 : undefined,
        executablePath: driverSelection.executableResolution.executablePath,
        browserArgs: config.chromiumArgs,
        browser: config.browser,
        allowDangerousBrowserArgs: config.allowDangerousBrowserArgs,
        userDataDir: config.userDataDir,
        ephemeral: config.ephemeral,
        linkCode: config.linkCode,
        qrMax: config.qrMax,
        oorTimeoutMs: config.oorTimeout * 1000,
        logConsole: config.logConsole,
        logConsoleErrors: config.logConsoleErrors,
        blockCrashLogs: config.blockCrashLogs,
        blockAssets: config.blockAssets,
        safeMode: config.safeMode,
        lightpanda: config.useLightpanda ? config.lightpanda : undefined,
        licenseKey: config.licenseKey as any,
        licenseConfig: { runtime: config.runtimeLicense },
        patchConfig: { ghPatch: config.ghPatch, cachedPatch: config.cachedPatch },
    };
}

/** Options for the ready-to-use messaging client. */
export type CreateOptions = Omit<PartialConfig, 's3Sync'> & {
    s3Sync?: Omit<NonNullable<PartialConfig['s3Sync']>, 'region' | 'syncInterval'> & {
        region?: string;
        syncInterval?: number;
    };
    /** Override the default Puppeteer driver. */
    driver?: CreateClientOptions['driver'];
};

/** Start WhatsApp, display QR login when needed, and return a ready messaging client. */
export async function create(options: CreateOptions = {}): Promise<Client> {
    const { createClient: createCoreClient } = await import('@open-wa/core');
    const { Client } = await import('@open-wa/client');
    const { driver, sessionData, sessionDataBucketAuth, s3Sync,
        sessionDataEncryptionKey, sessionDataEncryptionKeyFile, ...configOverrides } = options;
    const { config, rawConfigs } = await resolveConfig({
        programmaticOverrides: {
            qrTimeout: 0, ...configOverrides,
            // Session seeds, encryption keys and bucket credentials bypass tracked/debug config.
        },
        skipConfigFile: true,
        skipEnv: true,
        includeRawConfigs: true,
    });

    const driverSelection: DriverSelection = driver ? {
        driver,
        engineLabel: driver.name === 'lightpanda' ? 'Lightpanda' : 'Puppeteer',
        executableResolution: { source: 'config', executablePath: config.executablePath },
        preferLocalChrome: false,
    } : await selectRuntimeDriver(config, {
        rawConfigs,
        cacheFilePath: resolve(process.cwd(), '.open-wa', 'chrome-executable-path.json'),
        defaultPreferLocalChrome: false,
    });

    const coreOptions = toCreateClientOptions(config, driverSelection);
    if (driver) coreOptions.driver = driver;
    coreOptions.sessionData = sessionData;
    coreOptions.sessionDataBucketAuth = sessionDataBucketAuth;
    coreOptions.sessionDataEncryptionKey = sessionDataEncryptionKey;
    coreOptions.sessionDataEncryptionKeyFile = sessionDataEncryptionKeyFile;
    coreOptions.s3Sync = s3Sync;

    const core = await createCoreClient(coreOptions);
    const sink = getCliOutputSink();
    const onQr = (event: OpenWAEventMap['launch.auth.qr.generated']) => {
        if (config.qrLogSkip || !event.details?.qr) return;
        sink.write({ level: 'info', message: 'Open WhatsApp on your sending phone: Linked Devices → Link a Device, then scan this QR code.' });
        sink.qr({ qr: event.details.qr, sessionId: config.sessionId });
    };
    const onLinkCode = (event: OpenWAEventMap['launch.auth.linkCode.generated']) => {
        if (event.details?.linkCode && !config.qrLogSkip) {
            sink.write({ level: 'info', message: `Enter this link code on your sending phone: ${event.details.linkCode}` });
        }
    };
    core.events.on('launch.auth.qr.generated', onQr);
    core.events.on('launch.auth.linkCode.generated', onLinkCode);
    let client: Client | undefined;
    try {
        client = new Client({ client: core, transport: core.getTransport() });
        await client.start();
        if (core.getState() !== 'READY' || !core.getReadiness().exposureSafe) {
            throw new Error('WhatsApp startup finished without a messaging-ready session.');
        }
        return client;
    } catch (error) {
        try {
            if (client) await client.stop('startup-failure');
            else await core.stop('startup-failure');
        } catch {
            // Keep the startup failure as the actionable error.
        }
        throw error;
    } finally {
        core.events.off('launch.auth.qr.generated', onQr);
        core.events.off('launch.auth.linkCode.generated', onLinkCode);
    }
}
