declare const puppeteerConfig: {
    WAUrl: string;
    width: number;
    height: number;
    chromiumArgs: string[];
};
export declare const useragent = "WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36";
export declare const createUserAgent: (waVersion: string) => string;
export { puppeteerConfig };
export declare const width: number;
export declare const height: number;
