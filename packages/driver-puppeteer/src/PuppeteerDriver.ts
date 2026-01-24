import { IDriver, IBrowser, LaunchOptions, ConnectOptions, IDriverContext, DriverCapabilities } from '@open-wa/driver-interface';
import { PuppeteerBrowser } from './PuppeteerBrowser';

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
        };
    }
    
    async init(ctx?: IDriverContext): Promise<void> {
        this.ctx = ctx;
        
        this.puppeteer = require('puppeteer-extra');
        
        try {
            const pkg = require('puppeteer/package.json');
            this.version = pkg.version;
        } catch {}
        
        this.ctx?.logger?.info('PuppeteerDriver initialized', { version: this.version });
    }
    
    async launch(options?: LaunchOptions): Promise<IBrowser> {
        if (!this.puppeteer) await this.init();
        
        const browser = await this.puppeteer.launch({
            headless: options?.headless ?? true,
            executablePath: options?.executablePath,
            args: options?.args || [],
            defaultViewport: options?.defaultViewport,
            userDataDir: options?.userDataDir,
            timeout: options?.timeoutMs,
        });
        
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
