import { JsonObject } from 'type-fest';
import { Page } from 'puppeteer';
import { Spin } from './events';
import { SessionInfo } from '../api/model/sessionInfo';
export declare function checkWAPIHash(): Promise<boolean>;
export declare function integrityCheck(waPage: Page, notifier: {
    update: JsonObject;
}, spinner: Spin, debugInfo: SessionInfo): Promise<boolean>;
//# sourceMappingURL=launch_checks.d.ts.map