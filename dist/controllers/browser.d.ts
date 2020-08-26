import { Page } from '@types/puppeteer';
import { ConfigObject } from '../api/model';
export declare function initClient(sessionId?: string, config?: ConfigObject, customUserAgent?: string): Promise<Page>;
export declare function injectApi(page: Page): Promise<Page>;
