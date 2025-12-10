import { Observable } from 'rxjs';
import { Spin } from './events';
import { ConfigObject } from '../api/model';
import { Page } from 'puppeteer';
export declare const isAuthenticated: (waPage: Page) => Promise<unknown>;
export declare const needsToScan: (waPage: Page) => Observable<unknown>;
export declare const waitForRipeSession: (waPage: Page, waitForRipeSessionTimeout?: number) => Promise<boolean>;
export declare const sessionDataInvalid: (waPage: Page) => Promise<string>;
export declare const phoneIsOutOfReach: (waPage: Page) => Promise<boolean>;
export declare class QRManager {
    qrEv: any;
    qrNum: number;
    hash: string;
    config: ConfigObject;
    firstEmitted: boolean;
    _internalQrPngLoaded: boolean;
    qrCheck: string;
    constructor(config?: any);
    setConfig(config: any): void;
    qrEvF(config?: ConfigObject): any;
    grabAndEmit(qrData: any, waPage: Page, config: ConfigObject, spinner: Spin): Promise<void>;
    linkCode(waPage: Page, config?: ConfigObject, spinner?: Spin): Promise<boolean | void | string>;
    smartQr(waPage: Page, config?: ConfigObject, spinner?: Spin): Promise<boolean | void | string>;
    emitFirst(waPage: Page, config?: ConfigObject, spinner?: Spin): Promise<void>;
    waitFirstQr(waPage: Page, config?: ConfigObject, spinner?: Spin): Promise<void>;
}
//# sourceMappingURL=auth.d.ts.map