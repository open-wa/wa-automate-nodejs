declare const puppeteerConfig: {
    WAUrl: string;
    width: number;
    height: number;
    chromiumArgs: string[];
};
export declare const useragent = "WhatsApp/2.2108.8 Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36";
export declare const createUserAgent: (waVersion: string) => string;
export { puppeteerConfig };
export declare const width: number;
export declare const height: number;
