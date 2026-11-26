import {
    DriverCapabilities,
    DriverCapabilityError,
    DriverCapabilityKey,
    IBrowser,
    IPage,
} from '@open-wa/driver-interface';
import { LightpandaPage } from './LightpandaPage';
import { installTransferablePorts } from './transferablePorts';
import { compressionPrelude } from './compressionStreams';

export class LightpandaBrowser implements IBrowser {
    readonly name = 'lightpanda' as const;
    private closePromise?: Promise<void>;

    constructor(
        private readonly capabilities: DriverCapabilities,
        private readonly browser?: any,
        private readonly processManager?: { stop(): Promise<void>; getProcessId?(): number | undefined },
        private readonly experimentalWhatsApp = false,
    ) { }

    async newPage(options?: { clearFirstPage?: boolean }): Promise<IPage> {
        const browser = this.requireBrowser();
        const page = await browser.newPage();
        if (this.experimentalWhatsApp) {
            // Lightpanda 1.0.5 has compression streams, MessagePort transfer to workers, signed
            // byte views in Web Crypto and CryptoKey cloning. The stand-ins below are for an
            // executable that lacks them, and they break WhatsApp's login page when it doesn't.
            const native = await page.evaluate(async () => {
                const root = globalThis as any;
                const compression = typeof root.CompressionStream === 'function' && typeof root.DecompressionStream === 'function';
                let keyCloning = false, signedViews = false, portTransfer = false;
                try {
                    const key = await crypto.subtle.importKey('raw', crypto.getRandomValues(new Uint8Array(32)), 'HKDF', false, ['deriveBits']);
                    const clone = structuredClone(key);
                    keyCloning = clone instanceof CryptoKey && clone.extractable === false && clone.algorithm.name === 'HKDF';
                } catch { /* not supported */ }
                try {
                    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt']);
                    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) }, key, new Int8Array([1, -2, 3]));
                    signedViews = true;
                } catch { /* not supported */ }
                try {
                    portTransfer = await new Promise<boolean>(resolve => {
                        const timer = setTimeout(() => resolve(false), 2000);
                        const worker = new Worker(URL.createObjectURL(new Blob(
                            ['onmessage = event => event.data.port.postMessage(1);'], { type: 'text/javascript' },
                        )));
                        const channel = new MessageChannel();
                        channel.port1.onmessage = () => { clearTimeout(timer); worker.terminate(); resolve(true); };
                        worker.postMessage({ port: channel.port2 }, [channel.port2]);
                    });
                } catch { /* not supported */ }
                return { compression, keyCloning, signedViews, portTransfer };
            });
            if (!native.compression) await page.evaluateOnNewDocument(await compressionPrelude());
            if (!native.portTransfer || !native.signedViews || !native.keyCloning) {
                await page.evaluateOnNewDocument(installTransferablePorts, false, native.keyCloning);
            }
        }

        if (options?.clearFirstPage) {
            const pages = await browser.pages();
            if (pages.length > 0) {
                await pages[0].close();
            }
        }

        return new LightpandaPage(this.capabilities, page);
    }

    async pages(): Promise<IPage[]> {
        const browser = this.requireBrowser();
        const pages = await browser.pages();
        return pages.map((page: any) => new LightpandaPage(this.capabilities, page));
    }

    async close(): Promise<void> {
        if (this.closePromise) {
            return await this.closePromise;
        }

        this.closePromise = (async () => {
            try {
                await this.browser?.close?.();
            } finally {
                await this.processManager?.stop?.();
            }
        })();

        return await this.closePromise;
    }

    isConnected(): boolean {
        return this.browser?.isConnected?.() ?? false;
    }

    async versionString(): Promise<string> {
        return await this.requireBrowser().version();
    }

    processId(): number | undefined {
        return this.processManager?.getProcessId?.();
    }

    unwrap(): unknown {
        return this.browser;
    }

    has<C extends DriverCapabilityKey>(cap: C): boolean {
        return this.capabilities[cap].supported;
    }

    require<C extends DriverCapabilityKey>(cap: C): void {
        const capability = this.capabilities[cap];
        if (!capability.supported) {
            throw new DriverCapabilityError(this.name, cap, capability.reason);
        }
    }

    private requireBrowser(): any {
        if (!this.browser) {
            throw new Error('Lightpanda browser is not connected');
        }

        return this.browser;
    }
}
