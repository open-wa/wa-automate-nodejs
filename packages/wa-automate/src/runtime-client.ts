import { createClient as createCoreClient, type CreateClientOptions, type OpenWAClient } from '@open-wa/core';
import { resolveConfig, type PartialConfig, type Config, type TrackedConfig } from '@open-wa/config';
import { LightpandaDriver } from '@open-wa/driver-lightpanda';
import { PuppeteerDriver } from '@open-wa/driver-puppeteer';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export interface ExecutablePathResolution {
    executablePath?: string;
    source:
        | 'config'
        | 'cache'
        | 'chrome_installation'
        | 'driver_default'
        | 'lightpanda_config'
        | 'lightpanda_sdk_default';
    warning?: string;
}

export interface DriverSelection {
    driver: PuppeteerDriver | LightpandaDriver;
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
    return !!executablePath && existsSync(executablePath);
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
    if (config.useLightpanda) {
        return false;
    }

    if (config.executablePath) {
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
    }
): Promise<ExecutablePathResolution> {
    if (config.executablePath) {
        return {
            executablePath: config.executablePath,
            source: 'config',
        };
    }

    const preferLocalChrome = options.preferLocalChrome ?? config.useChrome;
    if (!preferLocalChrome) {
        return {
            source: 'driver_default',
        };
    }

    const cachedPath = readChromePathCache(options.cacheFilePath)?.executablePath;
    if (isUsableExecutablePath(cachedPath)) {
        return {
            executablePath: cachedPath,
            source: 'cache',
        };
    }

    if (cachedPath) {
        clearChromePathCache(options.cacheFilePath);
    }

    const { Launcher } = await import('chrome-launcher');
    const detectedPath = Launcher.getInstallations().find((installationPath) => isUsableExecutablePath(installationPath));

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
        warning: 'Chrome resolution warning: no valid local Chrome installation was found. Falling back to Puppeteer/default driver browser resolution.',
    };
}

export function resolveLightpandaExecutablePath(config: Config): ExecutablePathResolution {
    const executablePath = config.lightpanda?.executablePath;
    if (executablePath) {
        return {
            executablePath,
            source: 'lightpanda_config',
        };
    }

    return {
        source: 'lightpanda_sdk_default',
    };
}

export async function selectRuntimeDriver(
    config: Config,
    options: {
        rawConfigs?: TrackedConfig['rawConfigs'];
        cacheFilePath: string;
        defaultPreferLocalChrome?: boolean;
    }
): Promise<DriverSelection> {
    if (config.useLightpanda) {
        return {
            driver: new LightpandaDriver(),
            engineLabel: 'Lightpanda',
            executableResolution: resolveLightpandaExecutablePath(config),
            preferLocalChrome: false,
        };
    }

    const preferLocalChrome = shouldPreferLocalChrome(config, options.rawConfigs, options.defaultPreferLocalChrome ?? true);
    const executableResolution = await resolveExecutablePath(config, {
        preferLocalChrome,
        cacheFilePath: options.cacheFilePath,
    });

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
        debug: options.debug ?? (config.logLevel === 'debug' || config.logConsole),
        headless: config.headless,
        qrTimeoutMs: typeof config.qrTimeout === 'number' ? config.qrTimeout * 1000 : undefined,
        authTimeoutMs: typeof config.authTimeout === 'number' ? config.authTimeout * 1000 : undefined,
        executablePath: driverSelection.executableResolution.executablePath,
        browserArgs: config.chromiumArgs,
        userDataDir: config.userDataDir,
        ephemeral: config.ephemeral,
        logConsole: config.logConsole,
        logConsoleErrors: config.logConsoleErrors,
        blockCrashLogs: config.blockCrashLogs,
        blockAssets: config.blockAssets,
        safeMode: config.safeMode,
        lightpanda: config.useLightpanda ? config.lightpanda : undefined,
        licenseKey: config.licenseKey as any,
    };
}

export async function create(configOverrides: PartialConfig = {}): Promise<OpenWAClient> {
    const { config, rawConfigs } = await resolveConfig({
        programmaticOverrides: configOverrides,
        skipConfigFile: true,
        skipEnv: true,
        includeRawConfigs: true,
    });

    const driverSelection = await selectRuntimeDriver(config, {
        rawConfigs,
        cacheFilePath: resolve(process.cwd(), '.open-wa', 'chrome-executable-path.json'),
        defaultPreferLocalChrome: false,
    });

    return await createCoreClient(toCreateClientOptions(config, driverSelection));
}
