import * as winston from 'winston';
export declare const log: winston.Logger;
export declare const addRotateFileLogTransport: (options?: any) => void;
export declare const addSysLogTransport: (options?: any) => void;
export type ConfigLogTransport = {
    type: 'syslog' | 'console' | 'file' | 'ev';
    options?: any;
    done?: boolean;
};
export declare const setupLogging: (logging: ConfigLogTransport[], sessionId?: string) => ConfigLogTransport[];
//# sourceMappingURL=logging.d.ts.map