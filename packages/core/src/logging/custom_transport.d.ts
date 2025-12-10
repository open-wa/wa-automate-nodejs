import TransportStream from 'winston-transport';
export declare class LogToEvTransport extends TransportStream {
    constructor(opts?: any);
    log(info: any, callback: any): any;
}
export declare class NoOpTransport extends TransportStream {
    constructor(opts?: any);
    log(info: any, callback: any): any;
}
//# sourceMappingURL=custom_transport.d.ts.map