import { Collection as BaseCollection } from '@discordjs/collection';
import { EventEmitter } from 'events';
export declare class Collection<K, V> extends BaseCollection<K, V> {
    toJSON(): any[];
}
export type CollectorFilter<T extends any[]> = (...args: T) => boolean | Promise<boolean>;
export interface CollectorOptions {
    maxProcessed?: number;
    max?: number;
    time?: number;
    idle?: number;
    dispose?: boolean;
}
export interface AwaitMessagesOptions extends CollectorOptions {
    errors?: string[];
}
export declare class Collector extends EventEmitter {
    filter: (...args: any[]) => boolean | Promise<boolean>;
    options: CollectorOptions;
    collected: Collection<string, any>;
    protected _timeout: NodeJS.Timeout;
    protected _idletimeout: NodeJS.Timeout;
    ended: boolean;
    protected _timeouts: Set<NodeJS.Timeout>;
    protected _intervals: Set<NodeJS.Timeout>;
    protected _immediates: Set<NodeJS.Immediate>;
    constructor(filter: CollectorFilter<any>, options?: CollectorOptions);
    handleCollect(...args: any[]): Promise<void>;
    handleDispose(...args: any[]): Promise<void>;
    get next(): Promise<any>;
    stop(reason?: string): void;
    resetTimer({ time, idle }?: {
        time: any;
        idle: any;
    }): void;
    checkEnd(): void;
    [Symbol.asyncIterator](): any;
    collect(...args: any[]): string | null | false;
    dispose(...args: any[]): string | null;
    endReason(...args: any[]): string | null;
    clearTimeout(timeout: NodeJS.Timeout): void;
    setInterval(fn: (...args: any[]) => any, delay: number, ...args: any[]): NodeJS.Timeout;
    clearInterval(interval: NodeJS.Timeout): void;
    setImmediate(fn: (...args: any[]) => any, ...args: any[]): NodeJS.Immediate;
    clearImmediate(immediate: NodeJS.Immediate): void;
    protected incrementMaxListeners(): void;
    protected decrementMaxListeners(): void;
    setTimeout(fn: (...args: any[]) => any, delay: number, ...args: any[]): NodeJS.Timeout;
    destroy(): void;
}
//# sourceMappingURL=Collector.d.ts.map