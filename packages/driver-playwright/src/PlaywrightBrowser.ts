import { IBrowser, IPage, DriverCapabilities } from '@open-wa/driver-interface';
import type { Browser } from 'playwright';
import { PlaywrightPage } from './PlaywrightPage';
import { PlaywrightBrowserType } from './PlaywrightDriver';

export class PlaywrightBrowser implements IBrowser {
    readonly name = 'playwright' as const;
    
    constructor(
        private browser: Browser,
        private browserType: PlaywrightBrowserType,
        private capabilities: DriverCapabilities
    ) {}
    
    async newPage(): Promise<IPage> {
        const page = await this.browser.newPage();
        return new PlaywrightPage(page, this.browserType, this.capabilities);
    }
    
    async pages(): Promise<IPage[]> {
        const contexts = this.browser.contexts();
        const allPages: IPage[] = [];
        
        for (const context of contexts) {
            const pages = context.pages();
            allPages.push(...pages.map(p => new PlaywrightPage(p, this.browserType, this.capabilities)));
        }
        
        return allPages;
    }
    
    async close(): Promise<void> {
        await this.browser.close();
    }
    
    isConnected(): boolean {
        return this.browser.isConnected();
    }
    
    async versionString(): Promise<string> {
        return this.browser.version();
    }
    
    unwrap(): Browser {
        return this.browser;
    }
}
