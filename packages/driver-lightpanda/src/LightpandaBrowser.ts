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
            // Prefer real browser-owned keys whenever the executable can clone
            // them. The opaque worker bridge cannot persist across navigation.
            const nativeKeyCloning = await page.evaluate(async () => {
                try {
                    const key = await crypto.subtle.importKey('raw', crypto.getRandomValues(new Uint8Array(32)), 'HKDF', false, ['deriveBits']);
                    const clone = structuredClone(key);
                    return clone instanceof CryptoKey && clone.extractable === false && clone.algorithm.name === 'HKDF';
                } catch { return false; }
            });
            await page.evaluateOnNewDocument(await compressionPrelude());
            await page.evaluateOnNewDocument(installTransferablePorts, false, nativeKeyCloning);
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
