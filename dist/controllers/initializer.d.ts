import { Client } from '../api/Client';
import { ConfigObject } from '../api/model/index';
import { Spin } from './events';
import { SessionInfo } from '../api/model/sessionInfo';
import { Page } from 'puppeteer';
export declare let screenshot: any;
/**
 * Used to initialize the client session.
 *
 * *Note* It is required to set all config variables as [ConfigObject](https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html) that includes both [sessionId](https://open-wa.github.io/wa-automate-nodejs/interfaces/configobject.html#sessionId). Setting the session id as the first variable is no longer valid
 *
 * e.g
 *
 * ```javascript
 * create({
 * sessionId: 'main',
 * customUserAgent: ' 'WhatsApp/2.16.352 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Safari/605.1.15',
 * blockCrashLogs true,
 * ...
 * })....
 * ```
 * @param config ConfigObject] The extended custom configuration
 */
export declare function create(config?: ConfigObject): Promise<Client>;
/**
 * @private
 */
export declare function getPatch(config: ConfigObject, spinner?: Spin): Promise<{
    data: any;
    tag: string;
}>;
/**
 * @private
 * @param page
 * @param spinner
 */
export declare function injectLivePatch(page: Page, patch: {
    data: any;
    tag: string;
}, spinner?: Spin): Promise<void>;
/**
 * @private
 */
export declare function getAndInjectLivePatch(page: Page, spinner?: Spin, preloadedPatch?: {
    data: any;
    tag: string;
}): Promise<void>;
/**
 * @private
 */
export declare function getLicense(config: ConfigObject, me: {
    _serialized: string;
}, debugInfo: SessionInfo, spinner?: Spin): Promise<string | false>;
export declare function getAndInjectLicense(page: Page, config: ConfigObject, me: {
    _serialized: string;
}, debugInfo: SessionInfo, spinner?: Spin, preloadedLicense?: string | false): Promise<boolean>;
