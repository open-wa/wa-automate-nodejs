export type DriverCapabilityKey =
    | 'cdp'
    | 'requestInterception'
    | 'serviceWorkerBypass'
    | 'stealth'
    | 'pdf'
    | 'tracing'
    | 'persistentContext'
    | 'browserExtensions'
    | 'exposeBinding'
    | 'screenshot'
    | 'rendering';

export type CapabilitySupport =
    | { supported: true; notes?: string }
    | { supported: false; reason: string };

export type DriverCapabilities = Record<DriverCapabilityKey, CapabilitySupport>;

export interface IHasCapabilities {
    readonly name: string;
    readonly version?: string;
    readonly capabilities: DriverCapabilities;
    
    has<C extends DriverCapabilityKey>(cap: C): this is this & CapabilityExtensionMap[C];
    
    require<C extends DriverCapabilityKey>(cap: C): void;
}

export interface ICapabilityErrorFactory {
    createCapabilityError?<C extends DriverCapabilityKey>(capability: C, reason?: string): Error;
}

export type CapabilitySubject = Pick<IHasCapabilities, 'name' | 'capabilities'> & ICapabilityErrorFactory;

export interface CapabilityExtensionMap {
    cdp: ICDPSupport;
    requestInterception: IRequestInterceptionSupport;
    serviceWorkerBypass: IServiceWorkerBypassSupport;
    stealth: IStealthSupport;
    pdf: IPdfSupport;
    tracing: ITracingSupport;
    persistentContext: IPersistentContextSupport;
    browserExtensions: IBrowserExtensionsSupport;
    exposeBinding: IExposeBindingSupport;
    screenshot: IScreenshotSupport;
    rendering: IRenderingSupport;
}

export interface ICDPSupport {
    cdp(): ICDPSession;
}

export interface ICDPSession {
    send<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
    detach(): Promise<void>;
}

export interface IRequestInterceptionSupport {
    setRequestInterception(enabled: boolean): Promise<void>;
}

export interface IServiceWorkerBypassSupport {
    setBypassServiceWorker(bypass: boolean): Promise<void>;
}

export interface IStealthSupport {
    enableStealth(enabled: boolean): Promise<void>;
}

export interface IPdfSupport {
    pdf(options?: { path?: string; format?: 'A4' | 'Letter' }): Promise<Uint8Array>;
}

export interface ITracingSupport {
    startTracing(options?: { categories?: string[] }): Promise<void>;
    stopTracing(): Promise<Uint8Array>;
}

export interface IPersistentContextSupport {
    getPersistentContext(): unknown;
}

export interface IBrowserExtensionsSupport {
    loadExtension(path: string): Promise<void>;
}

export interface IExposeBindingSupport {
    exposeBinding(name: string, fn: (...args: any[]) => any): Promise<void>;
}

export interface IScreenshotSupport {
    screenshot(options?: { type?: 'png' | 'jpeg'; fullPage?: boolean }): Promise<Uint8Array>;
}

export interface IRenderingSupport {
    readonly rendering?: true;
}

export class DriverCapabilityError extends Error {
    constructor(
        public readonly driverName: string,
        public readonly capability: DriverCapabilityKey,
        public readonly reason?: string
    ) {
        super(
            `Driver '${driverName}' does not support capability '${capability}'${
                reason ? `: ${reason}` : ''
            }`
        );
        this.name = 'DriverCapabilityError';
    }
}

export function requireCapability<C extends DriverCapabilityKey>(subject: CapabilitySubject, capability: C): void {
    const support = subject.capabilities[capability];
    if (support.supported) {
        return;
    }

    throw subject.createCapabilityError?.(capability, support.reason)
        ?? new DriverCapabilityError(subject.name, capability, support.reason);
}
