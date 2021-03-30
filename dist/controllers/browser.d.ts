import { Page } from 'puppeteer';
import { Spin } from './events';
import { ConfigObject } from '../api/model';
export declare function initPage(sessionId?: string, config?: ConfigObject, customUserAgent?: string, spinner?: Spin): Promise<Page>;
export declare const addScript: (page: Page, js: string) => Promise<unknown>;
export declare function injectApi(page: Page): Promise<Page>;
