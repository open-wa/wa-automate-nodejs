import { Browser, Page } from 'puppeteer';
import { Spin } from './events';
import { ConfigObject } from '../api/model';
import { QRManager } from './auth';
export declare let BROWSER_START_TS: number;
export declare function initPage(sessionId?: string, config?: ConfigObject, qrManager?: QRManager, customUserAgent?: string, spinner?: Spin, _page?: Page, skipAuth?: boolean): Promise<Page>;
export declare const deleteSessionData: (config: ConfigObject) => Promise<boolean>;
export declare const invalidateSesssionData: (config: ConfigObject) => Promise<boolean>;
export declare const getSessionDataFilePath: (sessionId: string, config: ConfigObject) => Promise<string | false>;
export declare const addScript: (page: Page, js: string, asScriptTag?: boolean) => Promise<unknown>;
export declare function injectPreApiScripts(page: Page, spinner?: Spin): Promise<Page>;
export declare function injectWapi(page: Page, spinner?: Spin, force?: boolean): Promise<Page>;
export declare function injectApi(page: Page, spinner?: Spin, force?: boolean): Promise<Page>;
export declare const kill: (p: Page, b?: Browser, exit?: boolean, pid?: number, reason?: string) => Promise<void>;
//# sourceMappingURL=browser.d.ts.map