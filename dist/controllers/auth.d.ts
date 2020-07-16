import * as puppeteer from 'puppeteer';
import { QRFormat, QRQuality } from '../api/model';
export declare const isAuthenticated: (waPage: puppeteer.Page) => Promise<boolean>;
export declare const needsToScan: (waPage: puppeteer.Page) => import("rxjs").Observable<boolean>;
export declare const isInsideChat: (waPage: puppeteer.Page) => import("rxjs").Observable<boolean>;
export declare const phoneIsOutOfReach: (waPage: puppeteer.Page) => Promise<puppeteer.JSHandle<any>>;
export declare function retrieveQR(waPage: puppeteer.Page, sessionId?: string, autoRefresh?: boolean, throwErrorOnTosBlock?: boolean, qrLogSkip?: boolean, format?: QRFormat, quality?: QRQuality): Promise<boolean>;
