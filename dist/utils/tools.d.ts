/**
 *  Use this to generate a more likely valid user agent. It makes sure it has the WA part and replaces any windows or linux os info with mac.
 * @param useragent Your custom user agent
 * @param v The WA version from the debug info. This is optional. default is 0.4.315
 */
export declare const smartUserAgent: (useragent: string, v?: string) => string;
export declare const getConfigFromProcessEnv: (json: any) => {};
