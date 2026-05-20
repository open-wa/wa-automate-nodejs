import { createClient } from '@open-wa/core';
import { Client as ClientFacade } from '@open-wa/client';
import { LightpandaDriver } from '@open-wa/driver-lightpanda';
import { PuppeteerDriver } from '@open-wa/driver-puppeteer';
import { eventRegistry } from '@open-wa/schema';
import { WAServer } from './server/hono-server';
import { resolveConfig, type PartialConfig, type Config, type TrackedConfig } from '@open-wa/config';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCliOutputSink, type CliOutputSink } from './cli/output-sink';

export interface CliRuntimeResult {
    server: WAServer;
    client: ClientFacade;
    config: Config;
    events: ClientFacade['events'];
}

interface RuntimeEventPublisher {
    publish(eventName: string, payload: any): void;
}

function bridgeRuntimeEvents(
    openwaClient: Awaited<ReturnType<typeof createClient>>,
    publishRuntimeEvent: (eventName: string, payload: any) => void,
): () => void {
    if (typeof openwaClient.events.onAny === 'function' && typeof openwaClient.events.offAny === 'function') {
        openwaClient.events.onAny(publishRuntimeEvent);
        return () => openwaClient.events.offAny(publishRuntimeEvent);
    }

    const unsubscribers: Array<() => void> = [];
    const bridgedEvents = new Set(eventRegistry.getAll().map((def) => def.meta.eventName));

    bridgedEvents.forEach((eventName) => {
        const handler = (payload: any) => publishRuntimeEvent(eventName, payload);
        openwaClient.events.on(eventName as never, handler);
        unsubscribers.push(() => openwaClient.events.off(eventName as never, handler));
    });

    return () => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
}

function attachLaunchNarration(
    openwaClient: Awaited<ReturnType<typeof createClient>>,
    sink: CliOutputSink,
    sessionId: string,
): () => void {
    const unsubscribers: Array<() => void> = [];
    const on = (event: string, handler: (...args: any[]) => void) => {
        openwaClient.events.on(event as never, handler);
        unsubscribers.push(() => openwaClient.events.off(event as never, handler));
    };

    on('launch.auth.check.before', (event: any) => {
        sink.status({ phase: 'launch.auth', sessionId, detail: `Authenticating (timeout=${event?.details?.timeoutMs ?? '∞'}ms)` });
    });

    on('launch.auth.check.after', (event: any) => {
        sink.write({ level: 'info', message: `Auth detected via ${event?.details?.method ?? 'unknown'} (${event?.details?.isAuthenticated ? 'authenticated' : 'not-authenticated'})` });
    });

    on('launch.helper.pre_api.before', (event: any) => {
        sink.status({ phase: 'launch.helpers', sessionId, detail: event?.details?.mode === 'scripts' ? 'Injecting pre-API helper assets...' : 'Pre-API helpers already present' });
    });

    on('launch.helper.pre_api.after', (event: any) => {
        sink.write({ level: 'info', message: `Pre-API helper phase complete (${event?.details?.mode ?? 'unknown'})` });
    });

    on('internal_launch_progress', (event: any) => {
        const prefix = (event?.value || event?.value === 0) ? `${event.value}% ` : '';
        if (event?.text) sink.write({ level: 'info', message: `${prefix}${event.text}`.trim() });
    });

    on('critical_internal_message', (event: any) => {
        sink.write({ level: 'warn', message: `Internal launch message: ${event?.text ?? event?.value ?? 'unknown'}` });
    });

    on('launch.patch.init.before', (event: any) => {
        if (event?.details?.phase === 'preload') {
            sink.status({ phase: 'launch.patch', sessionId, detail: 'Downloading patches from CDN...' });
        }
    });

    on('launch.patch.init.after', (event: any) => {
        if (event?.details?.phase === 'preload') {
            const source = event?.details?.source ?? 'unknown';
            const tag = event?.details?.tag ? ` tag=${event.details.tag}` : '';
            const available = Array.isArray(event?.details?.available) ? event.details.available.length : 0;
            const durationMs = event?.durationMs;
            const durationStr = durationMs ? ` in ${(durationMs / 1000).toFixed(2)}s` : '';
            sink.write({ level: 'info', message: `Downloaded patches${durationStr} (source=${source}, available=${available}${tag})` });
        }
    });

    on('patch.init.before', (event: any) => {
        if (event?.details?.phase === 'apply') {
            const count = Array.isArray(event?.details?.patchIds) ? event.details.patchIds.length : 0;
            sink.status({ phase: 'launch.patch', sessionId, detail: `Installing patches (${count} queued)` });
        }
    });

    on('patch.apply.before', (event: any) => {
        sink.status({ phase: 'launch.patch', sessionId, detail: `Applying patch: ${event?.details?.patchId ?? 'unknown'}` });
    });

    on('patch.apply.after', (event: any) => {
        sink.write({
            level: event?.details?.outcome === 'failed' ? 'warn' : 'info',
            message: `Patch ${event?.details?.patchId ?? 'unknown'}: ${event?.details?.outcome ?? (event?.details?.applied ? 'applied' : 'unknown')}${event?.details?.detail ? ` — ${event.details.detail}` : ''}`,
        });
    });

    on('patch.init.after', (event: any) => {
        if (event?.details?.phase === 'apply') {
            const applied = Array.isArray(event?.details?.applied) ? event.details.applied : [];
            const outcome = event?.details?.outcome ?? 'unknown';
            const tag = applied.length > 0 ? applied.join(', ') : outcome;
            const durationMs = event?.durationMs;
            const durationStr = durationMs ? ` in ${(durationMs / 1000).toFixed(2)}s` : '';
            sink.write({
                level: event?.details?.blockingFailure ? 'warn' : 'info',
                message: `Patches Installed${durationStr}: ${tag}`,
            });
        }
    });

    on('launch.patch.integrity.before', () => {
        sink.status({ phase: 'launch.patch', sessionId, detail: 'Validating patched runtime...' });
    });

    on('launch.patch.integrity.after', (event: any) => {
        sink.write({ level: event?.details?.usable ? 'info' : 'warn', message: `Patched runtime validation: ${event?.details?.usable ? 'usable' : 'failed'}${event?.details?.failureReason ? ` (${event.details.failureReason})` : ''}` });
    });

    on('launch.license.check.before', (event: any) => {
        sink.status({ phase: 'launch.license', sessionId, detail: `Checking license (${event?.details?.source ?? 'local'})` });
    });

    on('launch.license.check.after', (event: any) => {
        sink.write({ level: event?.details?.blockingFailure ? 'warn' : 'info', message: `License check: ${event?.details?.status ?? 'unknown'}${event?.details?.detail ? ` — ${event.details.detail}` : ''}` });
    });

    on('license.inject.before', () => {
        sink.status({ phase: 'launch.license', sessionId, detail: 'Injecting license payload...' });
    });

    on('license.inject.after', (event: any) => {
        sink.write({ level: event?.details?.success ? 'info' : 'warn', message: `License inject: ${event?.details?.success ? 'success' : 'failed'}${event?.details?.status ? ` (${event.details.status})` : ''}${event?.details?.detail ? ` — ${event.details.detail}` : ''}` });
    });

    on('launch.auth.qr.generated', (event: any) => {
        const qrIndex = event?.details?.qrIndex ?? '?';
        sink.status({ phase: 'launch.auth', sessionId, detail: `QR code generated (#${qrIndex})` });
    });

    on('launch.client.finalize.before', (event: any) => {
        sink.status({ phase: 'launch.finalize', sessionId, detail: `Finalizing session (${event?.details?.validationStage ?? 'unknown'})` });
    });

    on('launch.client.finalize.after', (event: any) => {
        sink.write({ level: event?.details?.success ? 'info' : 'warn', message: `Finalize: ${event?.details?.outcome ?? 'unknown'}${event?.details?.detail ? ` — ${event.details.detail}` : ''}` });
    });

    on('error', (event: any) => {
        const scope = event?.scope ?? 'unknown';
        const msg = event?.error?.message ?? String(event?.error ?? 'unknown error');
        const fatal = event?.fatal ? ' [FATAL]' : '';
        sink.write({ level: 'error', message: `${fatal} ${scope}: ${msg}`.trim() });
    });

    return () => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
}

const CHROME_CACHE_FILE = resolve(process.cwd(), '.open-wa', 'chrome-executable-path.json');

interface ChromePathCacheRecord {
    executablePath?: string;
    updatedAt?: string;
}

interface ExecutablePathResolution {
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

interface DriverSelection {
    driver: PuppeteerDriver | LightpandaDriver;
    engineLabel: 'Puppeteer' | 'Lightpanda';
    executableResolution: ExecutablePathResolution;
    preferLocalChrome: boolean;
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
    if (argv.includes('--headful')) cliOverrides.headless = false;
    if (argv.includes('--headless')) cliOverrides.headless = true;
    if (argv.includes('--use-chrome')) cliOverrides.useChrome = true;
    if (argv.includes('--use-lightpanda')) cliOverrides.useLightpanda = true;
    if (argv.includes('--log-console')) cliOverrides.logConsole = true;
    if (argv.includes('--aggressive-garbage-collection')) cliOverrides.aggressiveGarbageCollection = true;
    if (argv.includes('--no-dashboard')) cliOverrides.dashboard = false;
    if (argv.includes('--ephemeral')) cliOverrides.ephemeral = true;

    const qrTimeout = getVal(argv, '--qr-timeout');
    if (qrTimeout) cliOverrides.qrTimeout = parseInt(qrTimeout, 10);

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

function resolveLightpandaExecutablePath(config: Config): ExecutablePathResolution {
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

async function selectRuntimeDriver(config: Config, rawConfigs?: TrackedConfig['rawConfigs']): Promise<DriverSelection> {
    if (config.useLightpanda) {
        return {
            driver: new LightpandaDriver(),
            engineLabel: 'Lightpanda',
            executableResolution: resolveLightpandaExecutablePath(config),
            preferLocalChrome: false,
        };
    }

    const preferLocalChrome = shouldPreferLocalChrome(config, rawConfigs);
    const executableResolution = await resolveExecutablePath(config, { preferLocalChrome });

    return {
        driver: new PuppeteerDriver(),
        engineLabel: 'Puppeteer',
        executableResolution,
        preferLocalChrome,
    };
}

function printStartupSummary(
    config: Config,
    resolution: ExecutablePathResolution,
    preferLocalChrome: boolean,
    engineLabel: DriverSelection['engineLabel'],
) {
    const host = config.host.includes('http') ? config.host : `http://${config.host}`;
    const sink = getCliOutputSink();
    sink.write({ level: 'info', message: `Easy API session: ${config.sessionId}` });
    sink.write({ level: 'info', message: `Health: ${host}:${config.port}/health` });
    sink.write({ level: 'info', message: `API Explorer: ${host}:${config.port}/api-docs/` });
    sink.write({ level: 'info', message: `Swagger JSON: ${host}:${config.port}/meta/swagger.json` });
    sink.write({ level: 'info', message: `Postman JSON: ${host}:${config.port}/meta/postman.json` });
    sink.write({ level: 'info', message: `Browser mode: ${config.headless ? 'headless' : 'headful'}` });
    sink.write({ level: 'info', message: `Browser engine: ${engineLabel}` });
    if (config.dashboard) {
        sink.write({ level: 'info', message: `Dashboard: ${host}:${config.port}/dashboard/` });
    } else {
        sink.write({ level: 'info', message: 'Dashboard: disabled (--no-dashboard)' });
    }
    if (resolution.source === 'lightpanda_config' && resolution.executablePath) {
        sink.write({ level: 'info', message: `Browser executable: explicit Lightpanda override (${resolution.executablePath})` });
    } else if (resolution.source === 'lightpanda_sdk_default') {
        sink.write({ level: 'info', message: 'Browser executable: Lightpanda SDK managed executable (shared cache/default resolution)' });
    } else if (resolution.source === 'config' && config.executablePath) {
        sink.write({ level: 'info', message: `Browser executable: explicit override (${config.executablePath})` });
    } else if (resolution.source === 'cache') {
        sink.write({ level: 'info', message: `Browser executable: local Chrome from cache (${resolution.executablePath})` });
    } else if (resolution.source === 'chrome_installation') {
        sink.write({ level: 'info', message: `Browser executable: local Chrome detected (${resolution.executablePath})` });
    } else if (preferLocalChrome) {
        sink.write({ level: 'info', message: 'Browser executable: driver default fallback (local Chrome unavailable)' });
    }
    if (config.webhook) {
        sink.write({
            level: 'warn',
            message: `Webhook configured (${config.webhook}) but v5 CLI webhook registration parity is not yet restored.`,
        });
    }
}

export async function start(parsedArgs: ParsedCliArgs = parseCliArgs()): Promise<CliRuntimeResult> {
    const { configPath, cliOverrides, verbose, unsupportedWarnings } = parsedArgs;
    const sink = getCliOutputSink();

    sink.status({ phase: 'boot' });

    const { config, sources, configFilePath, rawConfigs } = await resolveConfig({
        configPath,
        cliOverrides: {
            disableSpins: true,
            apiLifecycle: 'hybrid',
            host: '0.0.0.0',
            port: 8002,
            ...cliOverrides,
        },
        includeRawConfigs: true,
        verbose,
    });

    if (verbose) {
        sink.write({ level: 'info', message: `Config sources: ${sources.join(', ')}` });
        if (configFilePath) {
            sink.write({ level: 'info', message: `Config file: ${configFilePath}` });
        }
    }

    sink.status({ phase: 'config.resolved', sessionId: config.sessionId });

    unsupportedWarnings.forEach((warning) => sink.write({ level: 'warn', message: `Compatibility warning: ${warning}` }));

    const driverSelection = await selectRuntimeDriver(config, rawConfigs);
    const { driver, engineLabel, executableResolution, preferLocalChrome } = driverSelection;
    if (executableResolution.warning) {
        sink.write({ level: 'warn', message: executableResolution.warning });
    }

    const server = new WAServer(config);
    sink.status({ phase: 'server.starting', sessionId: config.sessionId });

    await server.start();
    sink.status({ phase: 'server.started', sessionId: config.sessionId });

    printStartupSummary(config, executableResolution, preferLocalChrome, engineLabel);

    sink.status({ phase: 'client.starting', sessionId: config.sessionId });
    sink.write({ level: 'info', message: 'Starting WhatsApp Client...' });

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
        ephemeral: config.ephemeral,
        logConsole: config.logConsole,
        logConsoleErrors: config.logConsoleErrors,
        blockCrashLogs: config.blockCrashLogs,
        blockAssets: config.blockAssets,
        safeMode: config.safeMode,
        licenseKey: config.licenseKey as any,
    });

    server.setReadinessProvider(() => ({ ...openwaClient.getReadiness(), state: openwaClient.getState() }));
    const detachLaunchNarration = attachLaunchNarration(openwaClient, sink, config.sessionId);

    openwaClient.events.on('launch.auth.qr.generated', (event) => {
        const qr = event.details?.qr;
        if (!qr) {
            return;
        }

        if (config.qrLogSkip) {
            sink.write({ level: 'info', message: 'New QR Code generated. Not printing in console because qrLogSkip is set to true' });
        } else {
            sink.status({ phase: 'auth.qr', sessionId: config.sessionId, detail: 'QR code generated' });
            sink.qr({ qr, sessionId: config.sessionId });
        }

        server.setQR(qr);
    });

    const client = new ClientFacade({
        client: openwaClient,
        transport: openwaClient.getTransport(),
    });

    server.setClient(client as any);

    const runtimeBridgeListeners = new Set<(event: string, value: any) => void>();
    const runtimeEventPublishers: RuntimeEventPublisher[] = [
        {
            publish: (eventName, payload) => {
                runtimeBridgeListeners.forEach((listener) => {
                    listener(eventName, payload);
                });
            },
        },
    ];

    const publishRuntimeEvent = (eventName: string, payload: any) => {
        runtimeEventPublishers.forEach((publisher) => {
            publisher.publish(eventName, payload);
        });
    };

    const detachRuntimeBridge = bridgeRuntimeEvents(openwaClient, publishRuntimeEvent);

    // Bridge core events to the socket manager so dashboard clients
    // receive live events when they send register_ev.
    if (typeof server.setEventBridge === 'function') {
        server.setEventBridge({
            onAny: (listener: (event: string, value: any) => void) => {
                runtimeBridgeListeners.add(listener);
            },
            offAny: (listener: (event: string, value: any) => void) => {
                runtimeBridgeListeners.delete(listener);
            },
        });
    }

    openwaClient.events.on('launch.browser.init.after', async () => {
        const page = openwaClient.getTransport().getPage();
        if (page) {
            await server.setPage(page as any).catch(() => {});
        }
    });

    try {
      await client.start();
    } catch (startError) {
      const msg = startError instanceof Error ? startError.message : String(startError);
      sink.write({ level: 'error', message: `Bootstrap failed: ${msg}` });
      sink.write({ level: 'warn', message: 'Session kept alive for debugging. Browser page is still open.' });
      sink.write({ level: 'warn', message: 'The server is running — use /health and /api-docs to inspect state.' });
      detachLaunchNarration();
      return { server, client, config, events: openwaClient.events };
    }

    const readiness = openwaClient.getReadiness();
    sink.status({
        phase: 'client.ready',
        sessionId: config.sessionId,
        detail: `status=${readiness.status}, exposureSafe=${readiness.exposureSafe}`,
    });
    sink.write({
        level: 'info',
        message: `WhatsApp Client ready with state: ${client.getState()} (status=${readiness.status}, exposureSafe=${readiness.exposureSafe})`,
    });

    detachLaunchNarration();
    return { server, client, config, events: openwaClient.events };
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<CliRuntimeResult | void> {
    const parsedArgs = parseCliArgs(argv);

    if (parsedArgs.pm2) {
        const { spawn } = require('child_process');
        const sink = getCliOutputSink();
        const pm2Command = getPm2Command();
        const pm2SpawnOptions = getPm2SpawnOptions();
        try {
            const pm2 = spawn(pm2Command, ['--version'], pm2SpawnOptions);

            await new Promise<void>((resolve, reject) => {
                pm2.on('error', reject);
                pm2.on('exit', (code: number | null) => {
                    if (code === 0) {
                        resolve();
                        return;
                    }

                    reject(new Error(`pm2 probe exited with code ${code ?? 'unknown'}`));
                });
                pm2.stdout.on('data', () => resolve());
            });

            const pm2Flags = parsedArgs.forwardedArgs.filter((flag: string) => flag !== '--pm2');
            const cliPath = fileURLToPath(new URL('../dist/cli.cjs', import.meta.url));

            spawn(pm2Command, [
                'start',
                cliPath,
                '--name', parsedArgs.procName,
                '--stop-exit-codes', '88',
                '--',
                ...pm2Flags,
            ], {
                ...pm2SpawnOptions,
                stdio: 'inherit',
                detached: true
            });
            return;
        } catch (error: unknown) {
            if (isCommandNotFoundError(error)) {
                sink.write({ level: 'error', message: 'pm2 not found. Please install with: npm install -g pm2' });
                return;
            }
            throw error;
        }
    }

    return await start(parsedArgs);
}

function getPm2Command(): string {
    return process.platform === 'win32' ? 'pm2.cmd' : 'pm2';
}

function getPm2SpawnOptions(): { shell: boolean } {
    return { shell: process.platform === 'win32' };
}

function isCommandNotFoundError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
        return false;
    }

    const systemError = error as { code?: unknown; errno?: unknown };
    return systemError.code === 'ENOENT' || systemError.errno === -2;
}
