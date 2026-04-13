import {
    ConnectOptions,
    DriverCapabilities,
    DriverCapabilityError,
    DriverCapabilityKey,
    IBrowser,
    IDriver,
    IDriverContext,
    LaunchOptions,
} from '@open-wa/driver-interface';
import { LightpandaBrowser } from './LightpandaBrowser';
import { LightpandaConnectError, LightpandaInvalidExecutableError, LightpandaPortExhaustionError, LightpandaRenderingError, LightpandaStartupError } from './errors';
import { LightpandaProcessManager } from './process-manager';

const LIGHTPANDA_CAPABILITIES: DriverCapabilities = {
    cdp: { supported: true },
    requestInterception: { supported: true },
    serviceWorkerBypass: { supported: false, reason: 'Lightpanda does not support service workers' },
    stealth: { supported: false, reason: 'Lightpanda does not support stealth plugins' },
    pdf: { supported: false, reason: 'Lightpanda has no rendering engine' },
    tracing: { supported: false, reason: 'Lightpanda has no rendering engine' },
    persistentContext: { supported: false, reason: 'Not applicable to Lightpanda process-per-session model' },
    browserExtensions: { supported: false, reason: 'Lightpanda does not support browser extensions' },
    exposeBinding: { supported: true },
    screenshot: { supported: false, reason: 'Lightpanda has no rendering engine' },
    rendering: { supported: false, reason: 'Lightpanda has no rendering engine' },
};

export class LightpandaDriver implements IDriver {
    readonly name = 'lightpanda' as const;
    readonly capabilities: DriverCapabilities = LIGHTPANDA_CAPABILITIES;
    version?: string;

    private ctx?: IDriverContext;
    private puppeteer?: { connect(options: { browserWSEndpoint?: string; timeout?: number; headers?: Record<string, string> }): Promise<any> };

    async init(ctx?: IDriverContext): Promise<void> {
        this.ctx = ctx;
        this.ctx?.logger?.info('LightpandaDriver scaffold initialized');
    }

    async launch(options?: LaunchOptions): Promise<IBrowser> {
        const processManager = new LightpandaProcessManager();
        const lightpandaOptions = options?.lightpanda;

        let processInfo;
        try {
            processInfo = await processManager.start({
                executablePath: lightpandaOptions?.executablePath ?? options?.executablePath,
                portStart: lightpandaOptions?.portStart,
                host: lightpandaOptions?.host,
                startupTimeoutMs: lightpandaOptions?.startupTimeoutMs ?? options?.timeoutMs,
                disableTelemetry: lightpandaOptions?.disableTelemetry,
            });
        } catch (error) {
            throw this.normalizeStartupError(error);
        }

        try {
            return await this.connectToBrowser({
                wsEndpoint: processInfo.wsEndpoint,
                timeoutMs: options?.timeoutMs,
            }, processManager, {
                host: processInfo.host,
                port: processInfo.port,
            });
        } catch (error) {
            await processManager.stop();
            throw this.normalizeConnectError(error, processInfo.wsEndpoint);
        }
    }

    async connect(options: ConnectOptions): Promise<IBrowser> {
        return await this.connectToBrowser(options);
    }

    createBrowser(): IBrowser {
        return new LightpandaBrowser(this.capabilities);
    }

    unwrap(): undefined {
        return undefined;
    }

    has<C extends DriverCapabilityKey>(cap: C): boolean {
        return this.capabilities[cap].supported;
    }

    require<C extends DriverCapabilityKey>(cap: C): void {
        const capability = this.capabilities[cap];
        if (!capability.supported) {
            throw this.createCapabilityError(cap, capability.reason);
        }
    }

    createCapabilityError<C extends DriverCapabilityKey>(capability: C, reason?: string): Error {
        if (capability === 'rendering' || capability === 'screenshot' || capability === 'pdf' || capability === 'tracing') {
            return new LightpandaRenderingError(capability, reason);
        }

        return new DriverCapabilityError(this.name, capability, reason);
    }

    private async loadPuppeteer(): Promise<{ connect(options: { browserWSEndpoint?: string; timeout?: number; headers?: Record<string, string> }): Promise<any> }> {
        if (!this.puppeteer) {
            try {
                const module = await import('puppeteer');
                this.puppeteer = module.default ?? module;
            } catch (error) {
                throw this.normalizeConnectError(error);
            }
        }

        return this.puppeteer;
    }

    private async connectToBrowser(
        options: ConnectOptions,
        processManager?: { stop(): Promise<void> },
        processInfo?: { host: string; port: number },
    ): Promise<IBrowser> {
        const wsEndpoint = options.wsEndpoint ?? options.cdpEndpoint;
        if (!wsEndpoint) {
            throw this.normalizeConnectError(new Error('A wsEndpoint or cdpEndpoint is required to connect to Lightpanda'));
        }

        const puppeteer = await this.loadPuppeteer();
        const browser = await puppeteer.connect({
            browserWSEndpoint: wsEndpoint,
            headers: options.headers,
            timeout: options.timeoutMs,
        });

        try {
            const browserVersion = await browser.version();
            this.ctx?.logger?.info('Lightpanda browser executable version', {
                ...(processInfo ?? {}),
                version: browserVersion,
            });
        } catch {
            this.ctx?.logger?.debug('Unable to read Lightpanda browser version', processInfo);
        }

        return new LightpandaBrowser(this.capabilities, browser, processManager);
    }

    private normalizeStartupError(error: unknown): Error {
        if (error instanceof LightpandaStartupError
            || error instanceof LightpandaInvalidExecutableError
            || error instanceof LightpandaPortExhaustionError) {
            return error;
        }

        const message = error instanceof Error ? error.message : String(error);
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('available port') || lowerMessage.includes('free port')) {
            return new LightpandaPortExhaustionError(message);
        }

        if (lowerMessage.includes('executable')) {
            return new LightpandaInvalidExecutableError(message);
        }

        return new LightpandaStartupError(message);
    }

    private normalizeConnectError(error: unknown, wsEndpoint?: string): Error {
        if (error instanceof LightpandaConnectError) {
            return error;
        }

        const message = error instanceof Error ? error.message : String(error);
        return new LightpandaConnectError(wsEndpoint ? `${wsEndpoint} (${message})` : message);
    }
}
