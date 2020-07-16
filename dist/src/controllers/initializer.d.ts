import { Client } from '../api/Client';
import { ConfigObject } from '../api/model/index';
export declare const licenseCheckUrl: any;
export declare function create(sessionId?: any | ConfigObject, config?: ConfigObject, customUserAgent?: string): Promise<Client>;
