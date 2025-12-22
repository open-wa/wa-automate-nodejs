import { EventEmitter2 } from 'eventemitter2';
import Spinnies from "spinnies";
export declare const ev: EventEmitter2;
export declare class EvEmitter {
    sessionId: string;
    eventNamespace: string;
    bannedTransports: string[];
    constructor(sessionId: string, eventNamespace: string);
    emit(data: unknown, eventNamespaceOverride?: string): void;
    emitAsync(data: unknown, eventNamespaceOverride?: string): Promise<any>;
}
export declare class Spin extends EvEmitter {
    _spinner: Spinnies.Spinner;
    _shouldEmit: boolean;
    _spinId: string;
    constructor(sessionId: string | undefined, eventNamespace: string, disableSpins?: boolean, shouldEmit?: boolean);
    start(eventMessage: string, indent?: number): void;
    info(eventMessage: string): void;
    fail(eventMessage: string): void;
    succeed(eventMessage?: string): void;
    remove(): void;
}
//# sourceMappingURL=events.d.ts.map