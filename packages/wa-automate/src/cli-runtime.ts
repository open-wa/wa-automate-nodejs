import { createClient } from '@open-wa/core';
import { Client as ClientFacade } from '@open-wa/client';
import { PuppeteerDriver } from '@open-wa/driver-puppeteer';
import { WAServer } from './server/hono-server';
import { resolveConfig, type PartialConfig, type Config, type TrackedConfig } from '@open-wa/config';
import boxen from 'boxen';
import qrcode from 'qrcode-terminal';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const CHROME_CACHE_FILE = resolve(process.cwd(), '.open-wa', 'chrome-executable-path.json');

interface ChromePathCacheRecord {
    executablePath?: string;
    updatedAt?: string;
}

interface ExecutablePathResolution {
    executablePath?: string;
    source: 'config' | 'cache' | 'chrome_installation' | 'driver_default';
    warning?: string;
}

function renderTerminalQr(qr: string, sessionId: string) {
    qrcode.generate(qr, { small: true }, (terminalQrCode) => {
        console.log(boxen(terminalQrCode, {
            title: sessionId,
            padding: 1,
            titleAlignment: 'center',
        }));
    });
}

export interface ParsedCliArgs {
    procName: string;
    pm2: boolean;
    forwardedArgs: string[];
    configPath?: string;
    cliOverrides: PartialConfig;
    verbose: boolean;
    unsupportedWarnings: string[];
}

export function getChromeCacheFilePath(): string {
    return CHROME_CACHE_FILE;
}

export function readChromePathCache(cacheFilePath: string = getChromeCacheFilePath()): ChromePathCacheRecord | undefined {
    if (!existsSync(cacheFilePath)) {
        return undefined;
    }

    try {
        const raw = JSON.parse(readFileSync(cacheFilePath, 'utf8')) as ChromePathCacheRecord;
        if (!raw || typeof raw !== 'object') {
            return undefined;
        }

        return {
            executablePath: typeof raw.executablePath === 'string' ? raw.executablePath : undefined,
            updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
        };
    } catch {
        return undefined;
    }
}

export function writeChromePathCache(executablePath: string, cacheFilePath: string = getChromeCacheFilePath()): void {
    mkdirSync(dirname(cacheFilePath), { recursive: true });
    writeFileSync(cacheFilePath, JSON.stringify({ executablePath, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
}

export function clearChromePathCache(cacheFilePath: string = getChromeCacheFilePath()): void {
    if (existsSync(cacheFilePath)) {
        rmSync(cacheFilePath, { force: true });
    }
}

export function isUsableExecutablePath(executablePath?: string): executablePath is string {
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

export function shouldPreferLocalChrome(config: Config, rawConfigs?: TrackedConfig['rawConfigs']): boolean {
    if (config.executablePath) {
        return false;
    }

    const explicitUseChrome = getExplicitUseChromePreference(rawConfigs);
    if (explicitUseChrome !== undefined) {
        return explicitUseChrome;
    }

    return true;
}

function getVal(argv: string[], flag: string): string | undefined {
    const index = argv.findIndex(arg => arg === flag);
    return index !== -1 ? argv[index + 1] : undefined;
}

export function parseCliArgs(argv: string[] = process.argv.slice(2)): ParsedCliArgs {
    const cliOverrides: PartialConfig = {};
    const unsupportedWarnings: string[] = [];
    let verbose = false;
    let configPath: string | undefined;

    const sessionId = getVal(argv, '--session-id') || 'session';
    cliOverrides.sessionId = sessionId;

    const portValue = getVal(argv, '--port') || getVal(argv, '-p');
    if (portValue) cliOverrides.port = parseInt(portValue, 10);

    const host = getVal(argv, '--host') || getVal(argv, '-h');
    if (host) cliOverrides.host = host;

    const apiKey = getVal(argv, '--api-key') || getVal(argv, '--key') || getVal(argv, '-k');
    if (apiKey) cliOverrides.apiKey = apiKey;

    const logLevel = getVal(argv, '--log-level');
    if (logLevel) cliOverrides.logLevel = logLevel;

    if (argv.includes('--no-ezqr')) cliOverrides.ezqr = false;
    if (argv.includes('--socket')) cliOverrides.socketMode = true;
    if (argv.includes('--headful')) cliOverrides.headless = false;
    if (argv.includes('--headless')) cliOverrides.headless = true;
    if (argv.includes('--use-chrome')) cliOverrides.useChrome = true;
    if (argv.includes('--log-console')) cliOverrides.logConsole = true;
    if (argv.includes('--aggressive-garbage-collection')) cliOverrides.aggressiveGarbageCollection = true;
    if (argv.includes('--no-dashboard')) cliOverrides.dashboard = false;

    const dashboardPort = getVal(argv, '--dashboard-port');
    if (dashboardPort) cliOverrides.dashboardPort = parseInt(dashboardPort, 10);

    const licenseKey = getVal(argv, '--license-key') || getVal(argv, '-l');
    if (licenseKey) cliOverrides.licenseKey = licenseKey;

    const webhook = getVal(argv, '--webhook') || getVal(argv, '-w');
    if (webhook) cliOverrides.webhook = webhook;

    const proxyHost = getVal(argv, '--proxy-host');
    if (proxyHost) cliOverrides.proxyHost = proxyHost;

    const proxyToken = getVal(argv, '--proxy-token');
    if (proxyToken) cliOverrides.proxyToken = proxyToken;

    const readyWebhook = getVal(argv, '--ready-webhook');
    if (readyWebhook) unsupportedWarnings.push(`--ready-webhook was provided (${readyWebhook}) but ready-webhook delivery is not yet wired in v5 CLI.`);

    if (argv.includes('-v') || argv.includes('--verbose')) {
        verbose = true;
        cliOverrides.disableSpins = true;
        cliOverrides.logConsole = true;
        cliOverrides.logLevel = cliOverrides.logLevel || 'debug';
    }

    if (argv.includes('--stats')) {
        unsupportedWarnings.push('--stats was provided but swagger-stats parity is not restored; v5 only exposes the compatibility redirect/deprecation route.');
    }

    if (argv.includes('--generate-api-docs')) {
        unsupportedWarnings.push('--generate-api-docs was provided; runtime docs are always served from the shared API layer and no separate collection generation step currently runs at CLI boot.');
    }

    if (argv.includes('--tunnel')) {
        unsupportedWarnings.push('--tunnel was provided but tunnel setup parity is not yet restored in the v5 CLI.');
    }

    if (argv.includes('--chatwoot-url') || argv.includes('--twilio-webhook') || argv.includes('--bot-press-url')) {
        unsupportedWarnings.push('Legacy integration flags (Chatwoot/Twilio/BotPress) were provided but are not yet wired into the v5 CLI boot path.');
    }

    if (argv.includes('--use-session-id-in-path')) {
        cliOverrides.sessionId = sessionId;
    }

    configPath = getVal(argv, '--config') || getVal(argv, '-c');

    const procName = getVal(argv, '--name') || sessionId || '@OPEN-WA EASY API';
    const pm2 = argv.includes('--pm2');

    return {
        procName,
        pm2,
        forwardedArgs: argv,
        configPath,
        cliOverrides,
        verbose,
        unsupportedWarnings,
    };
}

export async function resolveExecutablePath(
    config: Config,
    options: {
        preferLocalChrome?: boolean;
        cacheFilePath?: string;
    } = {}
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

    const cacheFilePath = options.cacheFilePath ?? getChromeCacheFilePath();
    const cachedPath = readChromePathCache(cacheFilePath)?.executablePath;
    if (isUsableExecutablePath(cachedPath)) {
        return {
            executablePath: cachedPath,
            source: 'cache',
        };
    }

    if (cachedPath) {
        clearChromePathCache(cacheFilePath);
    }

    const { Launcher } = await import('chrome-launcher');
    const detectedPath = Launcher.getInstallations().find((installationPath) => isUsableExecutablePath(installationPath));

    if (detectedPath) {
        writeChromePathCache(detectedPath, cacheFilePath);
        return {
            executablePath: detectedPath,
            source: 'chrome_installation',
        };
    }

    clearChromePathCache(cacheFilePath);

    return {
        source: 'driver_default',
        warning: 'Chrome resolution warning: no valid local Chrome installation was found. Falling back to Puppeteer/default driver browser resolution.',
    };
}

function printStartupSummary(config: Config, resolution: ExecutablePathResolution, preferLocalChrome: boolean) {
    const host = config.host.includes('http') ? config.host : `http://${config.host}`;
    console.log(`Easy API session: ${config.sessionId}`);
    console.log(`Health: ${host}:${config.port}/health`);
    console.log(`API Explorer: ${host}:${config.port}/api-docs/`);
    console.log(`Swagger JSON: ${host}:${config.port}/meta/swagger.json`);
    console.log(`Postman JSON: ${host}:${config.port}/meta/postman.json`);
    console.log(`Socket mode: ${config.socketMode ? 'enabled' : 'disabled'}`);
    console.log(`Browser mode: ${config.headless ? 'headless' : 'headful'}`);
    if (config.dashboard) {
        console.log(`Dashboard: http://localhost:${config.dashboardPort}`);
    } else {
        console.log('Dashboard: disabled (--no-dashboard)');
    }
    if (resolution.source === 'config' && config.executablePath) {
        console.log(`Browser executable: explicit override (${config.executablePath})`);
    } else if (resolution.source === 'cache') {
        console.log(`Browser executable: local Chrome from cache (${resolution.executablePath})`);
    } else if (resolution.source === 'chrome_installation') {
        console.log(`Browser executable: local Chrome detected (${resolution.executablePath})`);
    } else if (preferLocalChrome) {
        console.log('Browser executable: driver default fallback (local Chrome unavailable)');
    }
    if (config.webhook) {
        console.warn(`Webhook configured (${config.webhook}) but v5 CLI webhook registration parity is not yet restored.`);
    }
}

export async function start(parsedArgs: ParsedCliArgs = parseCliArgs()): Promise<{ server: WAServer; client: ClientFacade; config: Config }> {
    const { configPath, cliOverrides, verbose, unsupportedWarnings } = parsedArgs;

    const { config, sources, configFilePath, rawConfigs } = await resolveConfig({
        configPath,
        cliOverrides: {
            disableSpins: true,
            apiLifecycle: 'hybrid',
            socketMode: true,
            host: '0.0.0.0',
            port: 8002,
            ...cliOverrides,
        },
        includeRawConfigs: true,
        verbose,
    });

    if (verbose) {
        console.log(`Config sources: ${sources.join(', ')}`);
        if (configFilePath) {
            console.log(`Config file: ${configFilePath}`);
        }
    }

    unsupportedWarnings.forEach((warning) => console.warn(`Compatibility warning: ${warning}`));

    const preferLocalChrome = shouldPreferLocalChrome(config, rawConfigs);
    const executableResolution = await resolveExecutablePath(config, { preferLocalChrome });
    if (executableResolution.warning) {
        console.warn(executableResolution.warning);
    }

    const server = new WAServer(config);

    await server.start();

    printStartupSummary(config, executableResolution, preferLocalChrome);

    console.log('Starting WhatsApp Client...');

    const driver = new PuppeteerDriver();
    const openwaClient = await createClient({
        sessionId: config.sessionId,
        driver,
        deleteSessionDataOnLogout: config.deleteSessionDataOnLogout,
        killClientOnLogout: config.killClientOnLogout,
        sessionDataPath: config.sessionDataPath,
        debug: config.logLevel === 'debug' || verbose || config.logConsole,
        headless: config.headless,
        qrTimeoutMs: typeof config.qrTimeout === 'number' ? config.qrTimeout * 1000 : undefined,
        authTimeoutMs: typeof config.authTimeout === 'number' ? config.authTimeout * 1000 : undefined,
        executablePath: executableResolution.executablePath,
        browserArgs: config.chromiumArgs,
        userDataDir: config.userDataDir,
        logConsole: config.logConsole,
        logConsoleErrors: config.logConsoleErrors,
        blockCrashLogs: config.blockCrashLogs,
        blockAssets: config.blockAssets,
        safeMode: config.safeMode,
        licenseKey: config.licenseKey as any,
    });

    server.setReadinessProvider(() => openwaClient.getReadiness());

    openwaClient.events.on('launch.auth.qr.generated', (event) => {
        const qr = event.details?.qr;
        if (!qr) {
            return;
        }

        if (config.qrLogSkip) {
            console.log('New QR Code generated. Not printing in console because qrLogSkip is set to true');
        } else {
            renderTerminalQr(qr, config.sessionId);
        }

        server.setQR(qr);
    });

    const client = new ClientFacade({
        client: openwaClient,
        transport: openwaClient.getTransport(),
    });

    server.setClient(client as any);

    await client.start();

    const readiness = openwaClient.getReadiness();
    console.log(`WhatsApp Client ready with state: ${client.getState()} (status=${readiness.status}, exposureSafe=${readiness.exposureSafe})`);

    return { server, client, config };
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<{ server: WAServer; client: ClientFacade; config: Config } | void> {
    const parsedArgs = parseCliArgs(argv);

    if (parsedArgs.pm2) {
        const { spawn } = require('child_process');
        try {
            const pm2 = spawn('pm2');

            new Promise<void>((resolve, reject) => {
                pm2.on('error', reject);
                pm2.stdout.on('data', () => resolve());
            });

            const pm2Flags = parsedArgs.forwardedArgs;
            const cliPath = '/Users/Mohammed/projects/tools/wa/packages/wa-automate/dist/cli.cjs';

            spawn('pm2', [
                'start',
                cliPath,
                '--name', parsedArgs.procName,
                '--stop-exit-codes', '88',
                ...pm2Flags,
                '--',
                ...pm2Flags.filter((x: string) => !pm2Flags.includes(x))
            ], {
                stdio: 'inherit',
                detached: true
            });
            return;
        } catch (error: any) {
            if (error.errorno === -2) {
                console.error('pm2 not found. Please install with: npm install -g pm2');
                return;
            }
            throw error;
        }
    }

    return await start(parsedArgs);
}
