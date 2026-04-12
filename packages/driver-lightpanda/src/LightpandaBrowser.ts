import {
    DriverCapabilities,
    DriverCapabilityError,
    DriverCapabilityKey,
    IBrowser,
    IPage,
} from '@open-wa/driver-interface';
import { LightpandaPage } from './LightpandaPage';

export class LightpandaBrowser implements IBrowser {
    readonly name = 'lightpanda' as const;
    private closePromise?: Promise<void>;

    constructor(
        private readonly capabilities: DriverCapabilities,
        private readonly browser?: any,
        private readonly processManager?: { stop(): Promise<void> },
    ) { }

    async newPage(options?: { clearFirstPage?: boolean }): Promise<IPage> {
        const browser = this.requireBrowser();
        const page = await browser.newPage();

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
