import { IDriver, IBrowser, LaunchOptions, ConnectOptions, IDriverContext, DriverCapabilities } from '@open-wa/driver-interface';
import { PlaywrightBrowser } from './PlaywrightBrowser';

export type PlaywrightBrowserType = 'chromium' | 'firefox' | 'webkit' | 'chrome' | 'msedge';

export interface PlaywrightLaunchOptions extends LaunchOptions {
    browser?: PlaywrightBrowserType;
    channel?: 'chrome' | 'chrome-beta' | 'chrome-dev' | 'chrome-canary' | 'msedge' | 'msedge-beta' | 'msedge-dev' | 'msedge-canary';
}

export class PlaywrightDriver implements IDriver {
    readonly name = 'playwright' as const;
    version?: string;
    readonly capabilities: DriverCapabilities;
    
    private playwright: any;
    private ctx?: IDriverContext;
    private browserType: PlaywrightBrowserType;
    
    constructor(browserType: PlaywrightBrowserType = 'chromium') {
        this.browserType = browserType;
        
        this.capabilities = {
            cdp: browserType === 'chromium' || browserType === 'chrome' || browserType === 'msedge' 
                ? { supported: true, notes: 'Chromium-based only' }
                : { supported: false, reason: 'CDP only available in Chromium browsers' },
            requestInterception: { supported: true },
            serviceWorkerBypass: { supported: true, notes: 'Different API than Puppeteer' },
            stealth: { supported: false, reason: 'No puppeteer-extra equivalent' },
            pdf: browserType === 'chromium' || browserType === 'chrome' || browserType === 'msedge'
                ? { supported: true, notes: 'Chromium-based only' }
                : { supported: false, reason: 'PDF generation only in Chromium' },
            tracing: { supported: true },
            persistentContext: { supported: true },
            browserExtensions: { supported: false, reason: 'Playwright limitation' },
            exposeBinding: { supported: true },
        };
    }
    
    async init(ctx?: IDriverContext): Promise<void> {
        this.ctx = ctx;
        
        this.playwright = await import('playwright');
        this.version = this.playwright.version || 'unknown';
        
        this.ctx?.logger?.info('PlaywrightDriver initialized', { 
            version: this.version,
            browserType: this.browserType 
        });
    }
    
    async launch(options?: PlaywrightLaunchOptions): Promise<IBrowser> {
        if (!this.playwright) await this.init();
        
        const browserType = (options as PlaywrightLaunchOptions)?.browser || this.browserType;
        const channel = (options as PlaywrightLaunchOptions)?.channel;
        
        let browserEngine: any;
        if (browserType === 'chrome' || browserType === 'msedge') {
            browserEngine = this.playwright.chromium;
        } else if (browserType === 'firefox') {
            browserEngine = this.playwright.firefox;
        } else if (browserType === 'webkit') {
            browserEngine = this.playwright.webkit;
        } else {
            browserEngine = this.playwright[browserType];
        }
        
        const launchOptions: any = {
            headless: options?.headless ?? true,
            executablePath: options?.executablePath,
            args: options?.args,
            timeout: options?.timeoutMs,
        };
        
        if (channel) {
            launchOptions.channel = channel;
        }
        
        const browser = await browserEngine.launch(launchOptions);
        
        return new PlaywrightBrowser(browser, browserType, this.capabilities);
    }
    
    async connect(options: ConnectOptions): Promise<IBrowser> {
        if (!this.playwright) await this.init();
        
        const browser = await this.playwright.chromium.connect({
            wsEndpoint: options.wsEndpoint,
            timeout: options.timeoutMs,
        });
        
        return new PlaywrightBrowser(browser, this.browserType, this.capabilities);
    }
    
    unwrap(): any {
        return this.playwright;
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
