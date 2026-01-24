import { IPage, IElementHandle } from '@open-wa/driver-interface';
import type { Page } from 'puppeteer';
import { PuppeteerElementHandle } from './PuppeteerElementHandle';

export class PuppeteerPage implements IPage {
    readonly name = 'puppeteer' as const;
    
    constructor(
        private page: Page
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
    
    unwrap(): Page {
        return this.page;
    }
}
