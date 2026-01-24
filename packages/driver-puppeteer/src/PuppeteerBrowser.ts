import { IBrowser, IPage } from '@open-wa/driver-interface';
import type { Browser } from 'puppeteer';
import { PuppeteerPage } from './PuppeteerPage';

export class PuppeteerBrowser implements IBrowser {
    readonly name = 'puppeteer' as const;
    
    constructor(
        private browser: Browser
    ) {}
    
    async newPage(): Promise<IPage> {
        const page = await this.browser.newPage();
        return new PuppeteerPage(page);
    }
    
    async pages(): Promise<IPage[]> {
        const pages = await this.browser.pages();
        return pages.map(p => new PuppeteerPage(p));
    }
    
    async close(): Promise<void> {
        await this.browser.close();
    }
    
    isConnected(): boolean {
        return this.browser.isConnected();
    }
    
    async versionString(): Promise<string> {
        return await this.browser.version();
    }
    
    unwrap(): Browser {
        return this.browser;
    }
}
