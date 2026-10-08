/** Experimental MessagePort bridge with native CryptoKey cloning when available. */
export function installTransferablePorts(workerRealm = false, nativeKeyCloning = false): void {
    const root = globalThis as any;
    const ports = new Map<string, Port>();
    const routes = new Map<string, (message: unknown) => void>();
    const prefix = crypto.randomUUID();
    let sequence = 0;
    const marker = '__openwaTransferredPort';
    const wire = '__openwaPortMessage';

    // Native keys stay in the page realm. Workers operate on opaque references,
    // and no key is made extractable. These references last for this page only.
    const keyMarker = '__openwaEphemeralCryptoKey';
    const keyObjects = new Map<string, any>();
    const keyIds = new WeakMap<object, string>();
    const cryptoCalls = new Map<string, { resolve(value: any): void; reject(error: Error): void }>();
    const nativeCryptoKey = root.CryptoKey;
    if (!workerRealm || nativeKeyCloning) {
        // v1's crypto bindings reject signed byte views used by WA sync.
        // Reinterpret the same byte range without changing keys or algorithms.
        const bytes = (value: any) => ArrayBuffer.isView(value) && !(value instanceof Uint8Array)
            ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
            : value;
        for (const [method, positions] of [
            ['encrypt', [2]], ['decrypt', [2]], ['sign', [2]], ['verify', [2, 3]],
        ] as const) {
            const original = root.crypto.subtle[method].bind(root.crypto.subtle);
            root.crypto.subtle[method] = (...args: any[]) => {
                for (const position of positions) args[position] = bytes(args[position]);
                return original(...args);
            };
        }
    }
    class RemoteKey {
        constructor(readonly reference: any) {}
        get algorithm(): any { return this.reference.algorithm; }
        get extractable(): boolean { return this.reference.extractable; }
        get type(): string { return this.reference.type; }
        get usages(): string[] { return this.reference.usages; }
        get [Symbol.toStringTag](): string { return 'CryptoKey'; }
    }
    function translateKeys(value: any, writing: boolean, seen = new Map<any, any>()): any {
        if (!value || typeof value !== 'object') return value;
        if (value instanceof RemoteKey) return writing ? value.reference : value;
        if (value instanceof nativeCryptoKey) {
            if (!writing) return value;
            let id = keyIds.get(value);
            if (!id) { id = `${prefix}:key:${sequence++}`; keyIds.set(value, id); keyObjects.set(id, value); }
            return { [keyMarker]: id, algorithm: value.algorithm, extractable: value.extractable, type: value.type, usages: value.usages };
        }
        if (!writing && value[keyMarker]) {
            if (workerRealm) return new RemoteKey(value);
            const key = keyObjects.get(value[keyMarker]);
            if (!key) throw new Error('CryptoKey reference belongs to another page');
            return key;
        }
        if (seen.has(value)) return seen.get(value);
        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && prototype !== null && !Array.isArray(value)) return value;
        const out: any = Array.isArray(value) ? [] : {}; seen.set(value, out);
        for (const key of Object.keys(value)) out[key] = translateKeys(value[key], writing, seen);
        return out;
    }
    if (!nativeKeyCloning) for (const method of ['put', 'add']) {
        const original = root.IDBObjectStore.prototype[method];
        root.IDBObjectStore.prototype[method] = function(value: any, ...rest: any[]) { return original.call(this, translateKeys(value, true), ...rest); };
    }
    if (!nativeKeyCloning) for (const [prototype, name] of [[root.IDBRequest.prototype, 'result'], [root.IDBCursorWithValue.prototype, 'value']]) {
        const descriptor = Object.getOwnPropertyDescriptor(prototype, name)!;
        const getter = descriptor.get!;
        Object.defineProperty(prototype, name, { ...descriptor, get() { return translateKeys(getter.call(this), false); } });
    }
    if (workerRealm && !nativeKeyCloning) {
        root.CryptoKey = RemoteKey;
        const nativePost = root.postMessage.bind(root);
        for (const method of ['importKey', 'exportKey', 'generateKey', 'deriveKey', 'deriveBits', 'encrypt', 'decrypt', 'sign', 'verify', 'wrapKey', 'unwrapKey', 'digest']) {
            root.crypto.subtle[method] = (...args: any[]) => new Promise((resolve, reject) => {
                const id = `${prefix}:crypto:${sequence++}`;
                cryptoCalls.set(id, { resolve, reject });
                nativePost({ __openwaCryptoRequest: id, method, args: translateKeys(args, true) });
            });
        }
    }

    function encode(value: any, send: (message: unknown) => void, transfers: Set<any>, seen = new Map<any, any>()): any {
        if (!value || typeof value !== 'object') return value;
        if (value instanceof nativeCryptoKey) return nativeKeyCloning ? value : translateKeys(value, true);
        if (value instanceof RemoteKey) return translateKeys(value, true);
        if (value instanceof Port) {
            if (!transfers.has(value) || value.detached) throw new DOMException('MessagePort must be transferred', 'DataCloneError');
            routes.set(value.id, send);
            ports.delete(value.id);
            value.detached = true;
            return { [marker]: value.id, peer: value.peer };
        }
        if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer || value instanceof Date) return value;
        if (seen.has(value)) return seen.get(value);
        if (value instanceof Map) {
            const out = new Map(); seen.set(value, out);
            for (const [key, item] of value) out.set(encode(key, send, transfers, seen), encode(item, send, transfers, seen));
            return out;
        }
        if (value instanceof Set) {
            const out = new Set(); seen.set(value, out);
            for (const item of value) out.add(encode(item, send, transfers, seen));
            return out;
        }
        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && prototype !== null && !Array.isArray(value)) return value;
        const out: any = Array.isArray(value) ? [] : {};
        seen.set(value, out);
        for (const key of Object.keys(value)) out[key] = encode(value[key], send, transfers, seen);
        return out;
    }

    function decode(value: any, send: (message: unknown) => void, seen = new Map<any, any>()): any {
        if (!value || typeof value !== 'object') return value;
        if (value[keyMarker]) return translateKeys(value, false);
        if (value[marker]) {
            const port = new Port(value[marker], value.peer);
            routes.set(port.peer, send);
            return port;
        }
        if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer || value instanceof Date) return value;
        if (seen.has(value)) return seen.get(value);
        if (value instanceof Map) {
            const out = new Map(); seen.set(value, out);
            for (const [key, item] of value) out.set(decode(key, send, seen), decode(item, send, seen));
            return out;
        }
        if (value instanceof Set) {
            const out = new Set(); seen.set(value, out);
            for (const item of value) out.add(decode(item, send, seen));
            return out;
        }
        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && prototype !== null && !Array.isArray(value)) return value;
        const out: any = Array.isArray(value) ? [] : {};
        seen.set(value, out);
        for (const key of Object.keys(value)) out[key] = decode(value[key], send, seen);
        return out;
    }

    function transferSet(options: any): Set<any> {
        return new Set(Array.isArray(options) ? options : options?.transfer ?? []);
    }

    class Emitter {
        private listeners = new Map<string, Set<any>>();
        declare onmessage: any;
        declare onerror: any;
        declare onmessageerror: any;
        addEventListener(type: string, listener: any): void {
            const list = this.listeners.get(type) ?? new Set(); list.add(listener); this.listeners.set(type, list);
        }
        removeEventListener(type: string, listener: any): void { this.listeners.get(type)?.delete(listener); }
        dispatchEvent(event: any): boolean {
            event.target = this; event.currentTarget = this;
            (this as any)[`on${event.type}`]?.call(this, event);
            for (const listener of this.listeners.get(event.type) ?? []) {
                if (typeof listener === 'function') listener.call(this, event);
                else listener.handleEvent(event);
            }
            return true;
        }
    }

    class Port extends Emitter {
        readonly id: string;
        readonly peer: string;
        detached = false;
        private started = false;
        private closed = false;
        private queue: any[] = [];
        private handler: any;
        constructor(id: string, peer: string) { super(); this.id = id; this.peer = peer; ports.set(id, this); }
        get [Symbol.toStringTag](): string { return 'MessagePort'; }
        postMessage(value: any, options?: any): void {
            if (this.detached) throw new DOMException('MessagePort has been transferred', 'InvalidStateError');
            if (this.closed) return;
            const route = routes.get(this.peer);
            if (route) route({ [wire]: this.peer, value: encode(value, route, transferSet(options)) });
            else ports.get(this.peer)?.receive(structuredClone(value));
        }
        receive(value: any): void {
            if (this.closed) return;
            if (!this.started) { this.queue.push(value); return; }
            setTimeout(() => { if (!this.closed) this.dispatchEvent({ type: 'message', data: value, ports: [] }); }, 0);
        }
        start(): void { this.started = true; for (const value of this.queue.splice(0)) this.receive(value); }
        close(): void { this.closed = true; this.queue = []; ports.delete(this.id); routes.delete(this.id); }
    }
    // The onmessage setter starts a port, as it does in browsers.
    Object.defineProperty(Port.prototype, 'onmessage', {
        get() { return this.handler; },
        set(handler) { this.handler = handler; if (handler) this.start(); },
        configurable: true,
    });
    root.MessagePort = Port;
    root.MessageChannel = class {
        port1: Port;
        port2: Port;
        constructor() {
            const first = `${prefix}:${sequence++}`, second = `${prefix}:${sequence++}`;
            this.port1 = new Port(first, second); this.port2 = new Port(second, first);
        }
    };

    if (workerRealm) {
        const post = root.postMessage.bind(root);
        const send = (value: unknown) => post(value);
        root.postMessage = (value: unknown, options?: unknown) => post(encode(value, send, transferSet(options)));
        root.addEventListener('message', (event: any) => {
            if (event.data?.__openwaCryptoReply) {
                const result = event.data, call = cryptoCalls.get(result.__openwaCryptoReply);
                cryptoCalls.delete(result.__openwaCryptoReply);
                if (result.error) call?.reject(new DOMException(result.error.message, result.error.name));
                else call?.resolve(translateKeys(result.value, false));
                event.stopImmediatePropagation();
                return;
            }
            if (event.data?.[wire]) {
                ports.get(event.data[wire])?.receive(decode(event.data.value, send));
                event.stopImmediatePropagation();
            } else Object.defineProperty(event, 'data', { value: decode(event.data, send), configurable: true });
        });
        return;
    }

    const NativeWorker = root.Worker;
    const prelude = `(${installTransferablePorts.toString()})(true, ${nativeKeyCloning});\n`;
    root.Worker = class extends Emitter {
        private worker: any;
        private queued: unknown[] = [];
        private closed = false;
        private blobUrl?: string;
        constructor(url: string | URL, options?: unknown) {
            super();
            const sourceUrl = new URL(String(url), root.location.href).href;
            void fetch(sourceUrl).then(response => {
                if (!response.ok) throw new Error(`Worker script request failed: ${response.status}`);
                return response.text();
            }).then(source => {
                if (this.closed) return;
                this.blobUrl = URL.createObjectURL(new Blob([prelude, source, `\n//# sourceURL=${sourceUrl}`], { type: 'text/javascript' }));
                this.worker = new NativeWorker(this.blobUrl, options);
                this.worker.onmessage = (event: any) => {
                    if (event.data?.__openwaCryptoRequest) {
                        const request = event.data;
                        void Promise.resolve().then(() => root.crypto.subtle[request.method](...translateKeys(request.args, false))).then(
                            value => this.send({ __openwaCryptoReply: request.__openwaCryptoRequest, value: translateKeys(value, true) }),
                            error => this.send({ __openwaCryptoReply: request.__openwaCryptoRequest, error: { name: error.name, message: error.message } }),
                        );
                        return;
                    }
                    const send = (message: unknown) => this.send(message);
                    if (event.data?.[wire]) ports.get(event.data[wire])?.receive(decode(event.data.value, send));
                    else this.dispatchEvent({ type: 'message', data: decode(event.data, send), ports: event.ports ?? [] });
                };
                this.worker.onerror = (event: any) => this.dispatchEvent({ type: 'error', message: event.message, error: event.error });
                this.worker.onmessageerror = (event: any) => this.dispatchEvent({ type: 'messageerror', data: event.data });
                for (const value of this.queued.splice(0)) this.worker.postMessage(value);
            }).catch(error => this.dispatchEvent({ type: 'error', message: error.message, error }));
        }
        private send(value: unknown): void { if (!this.closed) { if (this.worker) this.worker.postMessage(value); else this.queued.push(value); } }
        postMessage(value: unknown, options?: unknown): void {
            if (this.closed) return;
            this.send(encode(value, message => this.send(message), transferSet(options)));
        }
        terminate(): void {
            this.closed = true; this.queued = []; this.worker?.terminate();
            if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
        }
    };
}
