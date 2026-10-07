import { IDriver, IBrowser, LaunchOptions, ConnectOptions, IDriverContext, DriverCapabilities } from '@open-wa/driver-interface';
import { PuppeteerBrowser } from './PuppeteerBrowser';
import { ensureBrowser } from './ensureBrowser';

export class PuppeteerDriver implements IDriver {
    readonly name = 'puppeteer' as const;
    version?: string;
    readonly capabilities: DriverCapabilities;
    
    private puppeteer: any;
    private ctx?: IDriverContext;
    
    constructor() {
        this.capabilities = {
            cdp: { supported: true },
            requestInterception: { supported: true },
            serviceWorkerBypass: { supported: true },
            stealth: { supported: true, notes: 'Via puppeteer-extra plugins' },
            pdf: { supported: true },
            tracing: { supported: true, notes: 'Basic tracing support' },
            persistentContext: { supported: true },
            browserExtensions: { supported: true },
            exposeBinding: { supported: true },
            screenshot: { supported: true },
            rendering: { supported: true },
        };
    }
    
    async init(ctx?: IDriverContext): Promise<void> {
        this.ctx = ctx;
        
        const pExtra = await import('puppeteer-extra');
        this.puppeteer = pExtra.default ?? pExtra;
        
        try {
            const { createRequire } = await import('node:module');
            const _require = createRequire(__filename);
            const pkg = _require('puppeteer/package.json');
            this.version = pkg.version;
        } catch {}
        
        this.ctx?.logger?.info('PuppeteerDriver initialized', { version: this.version });
    }
    
    async launch(options?: LaunchOptions): Promise<IBrowser> {
        if (!this.puppeteer) await this.init();
        
        const executablePath = await ensureBrowser(options, this.ctx);
        let browser: any;
        try {
            browser = await this.puppeteer.launch({
                browser: 'chrome',
                headless: options?.headless ?? true,
                executablePath,
                args: ['--autoplay-policy=no-user-gesture-required', ...(options?.args || [])],
                ignoreDefaultArgs: ['--mute-audio'],
                defaultViewport: options?.defaultViewport,
                userDataDir: options?.userDataDir,
                timeout: options?.timeoutMs,
            });
        } catch (cause) {
            const detail = cause instanceof Error ? cause.message : String(cause);
            if (/error while loading shared libraries|Library not loaded|cannot open shared object file/i.test(detail)) {
                throw new Error(`Chrome is installed but an operating-system dependency is missing. Install the library named in the browser error using your system administrator or deployment image; open-wa does not install OS packages. See https://pptr.dev/troubleshooting. Browser error: ${detail}`, { cause });
            }
            if (/No usable sandbox|Running as root without --no-sandbox|Failed to move to new namespace/i.test(detail)) {
                throw new Error(`Chrome could not start with its sandbox enabled. Configure sandbox support and a non-root browser user in your deployment image. See https://pptr.dev/troubleshooting. Browser error: ${detail}`, { cause });
            }
            throw cause;
        }
        
        try {
            const browserVersion = await browser.version();
            this.ctx?.logger?.info('Browser executable version', { version: browserVersion });
        } catch {}

        return new PuppeteerBrowser(browser, this.capabilities);
    }
    
    async connect(options: ConnectOptions): Promise<IBrowser> {
        if (!this.puppeteer) await this.init();
        
        const browser = await this.puppeteer.connect({
            browserWSEndpoint: options.wsEndpoint,
            timeout: options?.timeoutMs,
        });
        
        return new PuppeteerBrowser(browser, this.capabilities);
    }
    
    unwrap(): any {
        return this.puppeteer;
    }
    
    has<C extends string>(cap: C): boolean {
        return (this.capabilities as any)[cap]?.supported === true;
    }
    
    require<C extends string>(cap: C): void {
        if (!this.has(cap)) {
            const capability = (this.capabilities as any)[cap];
            throw new Error(
                `Driver '${this.name}' does not support capability '${cap}'${
                    capability?.reason ? `: ${capability.reason}` : ''
                }`
            );
        }
    }
}
