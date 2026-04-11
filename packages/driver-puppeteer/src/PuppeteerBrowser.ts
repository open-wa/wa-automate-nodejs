import { IBrowser, IPage, DriverCapabilities } from '@open-wa/driver-interface';
import type { Browser } from 'puppeteer';
import { PuppeteerPage } from './PuppeteerPage';

export class PuppeteerBrowser implements IBrowser {
    readonly name = 'puppeteer' as const;

    constructor(
        private browser: Browser,
        private capabilities: DriverCapabilities
    ) { }

    async newPage(options?: {
        clearFirstPage?: boolean
    }): Promise<IPage> {
        const page = await this.browser.newPage();
        if (options?.clearFirstPage) {
            const pages = await this.browser.pages();
            if (pages.length > 0) {
                await pages[0].close();
            }
        }
        return new PuppeteerPage(page, this.capabilities);
    }

    async pages(): Promise<IPage[]> {
        const pages = await this.browser.pages();
        return pages.map(p => new PuppeteerPage(p, this.capabilities));
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
