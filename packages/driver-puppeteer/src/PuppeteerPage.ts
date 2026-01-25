import { IPage, IElementHandle, DriverCapabilities } from '@open-wa/driver-interface';
import type { Page, CDPSession } from 'puppeteer';
import { PuppeteerElementHandle } from './PuppeteerElementHandle';

export class PuppeteerPage implements IPage {
    readonly name = 'puppeteer' as const;
    
    constructor(
        private page: Page,
        private capabilities: DriverCapabilities
    ) {}
    
    async goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeoutMs?: number }): Promise<void> {
        await this.page.goto(url, {
            waitUntil: options?.waitUntil as any,
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
        await this.page.setViewport(viewport);
    }
    
    async setUserAgent(ua: string): Promise<void> {
        await this.page.setUserAgent(ua);
    }
    
    async waitForSelector(selector: string, options?: { timeoutMs?: number }): Promise<IElementHandle | null> {
        const element = await this.page.waitForSelector(selector, { timeout: options?.timeoutMs });
        return element ? new PuppeteerElementHandle(element) : null;
    }
    
    async waitForFunction<Arg>(fn: (arg: Arg) => boolean, arg: Arg, options?: { timeoutMs?: number }): Promise<void> {
        await this.page.waitForFunction(fn as any, { timeout: options?.timeoutMs }, arg as any);
    }
    
    async $(selector: string): Promise<IElementHandle | null> {
        const element = await this.page.$(selector);
        return element ? new PuppeteerElementHandle(element) : null;
    }
    
    async $$(selector: string): Promise<IElementHandle[]> {
        const elements = await this.page.$$(selector);
        return elements.map(el => new PuppeteerElementHandle(el));
    }
    
    async click(selector: string): Promise<void> {
        await this.page.click(selector);
    }
    
    async type(selector: string, text: string, options?: { delayMs?: number }): Promise<void> {
        await this.page.type(selector, text, { delay: options?.delayMs });
    }
    
    async screenshot(options?: { type?: 'png' | 'jpeg'; fullPage?: boolean }): Promise<Uint8Array> {
        const buffer = await this.page.screenshot(options);
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
    
    has<C extends string>(cap: C): boolean {
        return (this.capabilities as any)[cap]?.supported === true;
    }
    
    require<C extends string>(cap: C): void {
        if (!this.has(cap)) {
            const capability = (this.capabilities as any)[cap];
            throw new Error(
                `Page does not support capability '${cap}'${
                    capability?.reason ? `: ${capability.reason}` : ''
                }`
            );
        }
    }
    
    cdp(): CDPSession {
        this.require('cdp');
        return (this.page as any).target().createCDPSession();
    }
    
    async setRequestInterception(enabled: boolean): Promise<void> {
        this.require('requestInterception');
        await this.page.setRequestInterception(enabled);
    }
    
    async setBypassServiceWorker(bypass: boolean): Promise<void> {
        this.require('serviceWorkerBypass');
        await this.page.setBypassServiceWorker(bypass);
    }
    
    async pdf(options?: { path?: string; format?: string }): Promise<Uint8Array> {
        this.require('pdf');
        const buffer = await this.page.pdf(options as any);
        return new Uint8Array(buffer);
    }
    
    async startTracing(options?: { path?: string; screenshots?: boolean }): Promise<void> {
        this.require('tracing');
        await this.page.tracing.start(options);
    }
    
    async stopTracing(): Promise<Uint8Array> {
        this.require('tracing');
        const buffer = await this.page.tracing.stop();
        return buffer ? new Uint8Array(buffer) : new Uint8Array();
    }
    
    unwrap(): Page {
        return this.page;
    }
}
