import { ConfigObject } from '../api/model/index';
import { Spin } from './events';
import { SessionInfo } from '../api/model/sessionInfo';
import { Page } from 'puppeteer';
export declare function getPatch(config: ConfigObject, spinner?: Spin, sessionInfo?: SessionInfo): Promise<{
    data: any;
    tag: string;
}>;
export declare function injectLivePatch(page: Page, patch: {
    data: any;
    tag: string;
}, spinner?: Spin): Promise<string>;
export declare function getAndInjectLivePatch(page: Page, spinner?: Spin, preloadedPatch?: {
    data: any;
    tag: string;
}, config?: ConfigObject, sessionInfo?: SessionInfo): Promise<void>;
export declare function getLicense(config: ConfigObject, me: {
    _serialized: string;
}, debugInfo: SessionInfo, spinner?: Spin): Promise<string | false>;
export declare function earlyInjectionCheck(page: Page): Promise<(page: Page) => boolean>;
export declare function getAndInjectLicense(page: Page, config: ConfigObject, me: {
    _serialized: string;
}, debugInfo: SessionInfo, spinner?: Spin, preloadedLicense?: string | false): Promise<boolean>;
//# sourceMappingURL=patch_manager.d.ts.map