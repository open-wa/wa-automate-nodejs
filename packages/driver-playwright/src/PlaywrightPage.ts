import { IPage, IElementHandle, DriverCapabilities } from '@open-wa/driver-interface';
import type { Page, CDPSession } from 'playwright';
import { PlaywrightElementHandle } from './PlaywrightElementHandle';
import { PlaywrightBrowserType } from './PlaywrightDriver';

export class PlaywrightPage implements IPage {
    readonly name = 'playwright' as const;

    constructor(
        private page: Page,
        _browserType: PlaywrightBrowserType,
        private capabilities: DriverCapabilities
    ) { }

    async goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeoutMs?: number }): Promise<void> {
        const waitUntil = options?.waitUntil === 'networkidle' ? 'networkidle' : options?.waitUntil;

        await this.page.goto(url, {
            waitUntil: waitUntil as any,
            timeout: options?.timeoutMs,
        });
    }

    url(): string {
        return this.page.url();
    }

    async reload(): Promise<void> {
        await this.page.reload();
    }

    async evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret> {
        return await this.page.evaluate(fn as any, arg as any) as Ret;
    }

    async evaluateScript<Ret = unknown>(script: string): Promise<Ret> {
        return await this.page.evaluate(script) as Ret;
    }

    async setViewport(viewport: { width: number; height: number }): Promise<void> {
        await this.page.setViewportSize(viewport);
    }

    async setUserAgent(ua: string): Promise<void> {
        await this.page.setExtraHTTPHeaders({ 'User-Agent': ua });
    }

    async waitForSelector(selector: string, options?: { timeoutMs?: number }): Promise<IElementHandle | null> {
        const element = await this.page.waitForSelector(selector, { timeout: options?.timeoutMs });
        return element ? new PlaywrightElementHandle(element) : null;
    }

    async waitForFunction<Arg>(fn: (arg: Arg) => boolean, arg: Arg, options?: { timeoutMs?: number }): Promise<void> {
        await this.page.waitForFunction(fn as any, arg as any, { timeout: options?.timeoutMs });
    }

    async $(selector: string): Promise<IElementHandle | null> {
        const element = await this.page.$(selector);
        return element ? new PlaywrightElementHandle(element) : null;
    }

    async $$(selector: string): Promise<IElementHandle[]> {
        const elements = await this.page.$$(selector);
        return elements.map(el => new PlaywrightElementHandle(el));
    }

    async click(selector: string): Promise<void> {
        await this.page.click(selector);
    }

    async type(selector: string, text: string, options?: { delayMs?: number }): Promise<void> {
        await this.page.type(selector, text, { delay: options?.delayMs });
    }

    async screenshot(options?: { type?: 'png' | 'jpeg'; fullPage?: boolean }): Promise<Uint8Array> {
        const buffer = await this.page.screenshot({
            type: options?.type,
            fullPage: options?.fullPage,
        });
        return new Uint8Array(buffer);
    }

    async exposeFunction(name: string, fn: (...args: any[]) => any): Promise<void> {
        await this.page.exposeFunction(name, fn);
    }

    async close(): Promise<void> {
        await this.page.close();
    }

    isClosed(): boolean {
        return this.page.isClosed();
    }

    // Capability-specific methods
    has<C extends string>(cap: C): boolean {
        return (this.capabilities as any)[cap]?.supported === true;
    }

    require<C extends string>(cap: C): void {
        if (!this.has(cap)) {
            const capability = (this.capabilities as any)[cap];
            throw new Error(
                `Page does not support capability '${cap}'${capability?.reason ? `: ${capability.reason}` : ''
                }`
            );
        }
    }

    // CDP Support (Chromium-based only)
    cdp(): CDPSession {
        this.require('cdp');
        const context = this.page.context();
        return (context as any).newCDPSession(this.page) as CDPSession;
    }

    // Request Interception
    async setRequestInterception(enabled: boolean): Promise<void> {
        this.require('requestInterception');
        if (enabled) {
            await this.page.route('**/*', route => route.continue());
        } else {
            await this.page.unroute('**/*');
        }
    }

    // Service Worker Bypass
    async setBypassServiceWorker(bypass: boolean): Promise<void> {
        this.require('serviceWorkerBypass');
        await this.page.context().route('**/*', (route) => {
            if (bypass && route.request().serviceWorker()) {
                route.abort();
            } else {
                route.continue();
            }
        });
    }

    // PDF Generation (Chromium only)
    async pdf(options?: { path?: string; format?: string }): Promise<Uint8Array> {
        this.require('pdf');
        const buffer = await this.page.pdf(options as any);
        return new Uint8Array(buffer);
    }

    // Tracing
    async startTracing(options?: { path?: string; screenshots?: boolean }): Promise<void> {
        this.require('tracing');
        await this.page.context().tracing.start(options as any);
    }

    async stopTracing(): Promise<Uint8Array> {
        this.require('tracing');
        const tempPath = `/tmp/trace-${Date.now()}.zip`;
        await this.page.context().tracing.stop({ path: tempPath });

        const fs = await import('fs/promises');
        const buffer = await fs.readFile(tempPath);
        await fs.unlink(tempPath).catch(() => { });

        return new Uint8Array(buffer);
    }

    unwrap(): Page {
        return this.page;
    }
}
