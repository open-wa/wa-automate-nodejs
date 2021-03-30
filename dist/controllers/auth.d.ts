import { Observable } from 'rxjs';
import { ConfigObject } from '../api/model';
import { Page } from 'puppeteer';
/**
 * Validates if client is authenticated
 * @returns true if is authenticated, false otherwise
 * @param waPage
 */
export declare const isAuthenticated: (waPage: Page) => Promise<unknown>;
export declare const needsToScan: (waPage: Page) => Observable<unknown>;
export declare const isInsideChat: (waPage: Page) => Observable<boolean>;
export declare const sessionDataInvalid: (waPage: Page) => Promise<string>;
export declare const phoneIsOutOfReach: (waPage: Page) => Promise<boolean>;
export declare function smartQr(waPage: Page, config?: ConfigObject): Promise<boolean | void>;
