import { Page } from '@types/puppeteer';
export declare function initClient(sessionId?: string, config?: any, customUserAgent?: string): Promise<Page>;
export declare function injectApi(page: Page): Promise<Page>;
