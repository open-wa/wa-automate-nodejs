import {
    DisposableHandle,
    DriverCapabilities,
    DriverCapabilityError,
    DriverCapabilityKey,
    IElementHandle,
    IFrame,
    IPage,
    NavigationWaitUntil,
    PageEventHandler,
    WaitForFunctionOptions,
} from '@open-wa/driver-interface';
import { requireScreenshot } from './capability-checks';
import { LightpandaRenderingError } from './errors';

class LightpandaDisposableHandle implements DisposableHandle {
    constructor(private readonly disposer: () => Promise<void> | void = () => undefined) { }

    dispose(): Promise<void> | void {
        return this.disposer();
    }
}

class LightpandaFrame implements IFrame {
    constructor(private readonly frame: any, private readonly isMain: boolean) { }

    url(): string {
        return this.frame.url();
    }

    name(): string {
        return this.frame.name();
    }

    isMainFrame(): boolean {
        return this.isMain;
    }

    parentFrame(): IFrame | null {
        const parent = this.frame.parentFrame?.();
        return parent ? new LightpandaFrame(parent, false) : null;
    }

    unwrap(): unknown {
        return this.frame;
    }
}

class LightpandaElementHandle implements IElementHandle {
    constructor(private readonly handle: any) { }

    async click(): Promise<void> {
        await this.handle.click();
    }

    async type(text: string): Promise<void> {
        await this.handle.type(text);
    }

    async getAttribute(name: string): Promise<string | null> {
        return await this.handle.evaluate(
            (element: { getAttribute(attributeName: string): string | null }, attributeName: string) =>
                element.getAttribute(attributeName),
            name,
        );
    }

    async textContent(): Promise<string | null> {
        return await this.handle.evaluate((element: { textContent: string | null }) => element.textContent);
    }

    async dispose(): Promise<void> {
        await this.handle.dispose();
    }

    unwrap(): unknown {
        return this.handle;
    }
}

export class LightpandaPage implements IPage {
    readonly name = 'lightpanda' as const;
    private readonly listenerWrappers = new Map<string, Map<Function, Set<(...args: any[]) => void | Promise<void>>>>();

    constructor(
        private readonly capabilities: DriverCapabilities,
        private readonly page?: any,
    ) { }

    async goto(url: string, options?: { waitUntil?: NavigationWaitUntil; timeoutMs?: number }): Promise<void> {
        await this.requirePage().goto(url, {
            waitUntil: options?.waitUntil,
            timeout: options?.timeoutMs,
        });
    }

    url(): string {
        return this.requirePage().url();
    }

    async reload(): Promise<void> {
        await this.requirePage().reload();
    }

    mainFrame(): IFrame | null {
        const page = this.requirePage();
        return new LightpandaFrame(page.mainFrame(), true);
    }

    async evaluateOnNewDocument<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<void> {
        await this.requirePage().evaluateOnNewDocument(fn as any, arg as any);
    }

    async evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret> {
        return await this.requirePage().evaluate(fn as any, arg as any) as Ret;
    }

    async evaluateScript<Ret = unknown>(script: string): Promise<Ret> {
        return await this.requirePage().evaluate(script) as Ret;
    }

    async addInitScript(script: string): Promise<DisposableHandle> {
        const page = this.requirePage();
        const registration = await page.evaluateOnNewDocument(script);
        const identifier = typeof registration === 'string'
            ? registration
            : registration && typeof registration === 'object' && 'identifier' in registration
                ? (registration as { identifier?: string }).identifier
                : undefined;

        let disposed = false;

        return new LightpandaDisposableHandle(async () => {
            if (disposed) {
                return;
            }

            disposed = true;
            if (identifier && typeof page.removeScriptToEvaluateOnNewDocument === 'function') {
                await page.removeScriptToEvaluateOnNewDocument(identifier);
            }
        });
    }

    async setViewport(viewport: { width: number; height: number }): Promise<void> {
        await this.requirePage().setViewport(viewport);
    }

    async setUserAgent(ua: string): Promise<void> {
        const page = this.requirePage();
        await page.setUserAgent(ua);
        const actual = await page.evaluate(() => navigator.userAgent);
        if (actual !== ua) {
            throw new Error('Lightpanda ignored the requested user agent. Use managed Easy API --lightpanda mode, or configure a custom executable that supports the Chrome user agent override.');
        }
        const chrome = /Chrome\/(\d+)\.(\d+)\.(\d+)\.(\d+)/.exec(ua);
        if (!chrome) return;
        const platform = /Macintosh/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : 'Linux';
        await page.setExtraHTTPHeaders({
            'User-Agent': ua,
            'Sec-CH-UA': `"Chromium";v="${chrome[1]}", "Google Chrome";v="${chrome[1]}", "Not_A Brand";v="99"`,
            'Sec-CH-UA-Platform': `"${platform}"`,
            'Sec-CH-UA-Mobile': /Mobile/.test(ua) ? '?1' : '?0',
        });
        await page.evaluateOnNewDocument((agent: string, os: string) => {
            Object.defineProperty(navigator, 'appVersion', { get: () => agent.slice(8), configurable: true });
            Object.defineProperty(navigator, 'platform', { get: () => os === 'macOS' ? 'MacIntel' : os === 'Windows' ? 'Win32' : 'Linux x86_64', configurable: true });
        }, ua, platform);
    }

    async setRequestInterception(enabled: boolean): Promise<void> {
        await this.requirePage().setRequestInterception(enabled);
    }

    async waitForSelector(selector: string, options?: { timeoutMs?: number }): Promise<IElementHandle | null> {
        const element = await this.requirePage().waitForSelector(selector, { timeout: options?.timeoutMs });
        return element ? new LightpandaElementHandle(element) : null;
    }

    async waitForFunction(_script: string, _options?: WaitForFunctionOptions): Promise<void>;
    async waitForFunction<Arg>(_fn: (arg: Arg) => boolean, _arg: Arg, _options?: WaitForFunctionOptions): Promise<void>;
    async waitForFunction<Arg>(
        fnOrScript: string | ((arg: Arg) => boolean),
        argOrOptions?: Arg | WaitForFunctionOptions,
        maybeOptions?: WaitForFunctionOptions,
    ): Promise<void> {
        const page = this.requirePage();
        const options = typeof fnOrScript === 'string'
            ? argOrOptions as WaitForFunctionOptions | undefined
            : maybeOptions;
        const timeoutMs = options?.timeoutMs ?? 30_000;
        const intervalMs = typeof options?.polling === 'number' ? options.polling : 100;
        const started = Date.now();
        // Keep each CDP evaluation short. A pending browser-side poller otherwise
        // hits Puppeteer's protocol timeout even when timeoutMs is zero.
        while (!page.isClosed()) {
            const ready = typeof fnOrScript === 'string'
                ? await page.evaluate(fnOrScript)
                : await page.evaluate(fnOrScript, argOrOptions);
            if (ready) return;
            const elapsedMs = Date.now() - started;
            if (timeoutMs !== 0 && elapsedMs >= timeoutMs) {
                throw new Error(`Waiting for function timed out after ${timeoutMs}ms`);
            }
            await new Promise(resolve => setTimeout(resolve,
                timeoutMs === 0 ? intervalMs : Math.min(intervalMs, timeoutMs - elapsedMs)));
        }
        throw new Error('Lightpanda page closed while waiting for function');
    }

    async $(selector: string): Promise<IElementHandle | null> {
        const element = await this.requirePage().$(selector);
        return element ? new LightpandaElementHandle(element) : null;
    }

    async $$(selector: string): Promise<IElementHandle[]> {
        const elements = await this.requirePage().$$(selector);
        return elements.map((element: any) => new LightpandaElementHandle(element));
    }

    async click(selector: string): Promise<void> {
        await this.requirePage().click(selector);
    }

    async type(selector: string, text: string, options?: { delayMs?: number }): Promise<void> {
        await this.requirePage().type(selector, text, { delay: options?.delayMs });
    }

    async screenshot(_options?: { type?: 'png' | 'jpeg'; fullPage?: boolean }): Promise<Uint8Array> {
        requireScreenshot(this);
        throw new LightpandaRenderingError('screenshot');
    }

    async exposeFunction(name: string, fn: (...args: any[]) => any): Promise<void> {
        await this.requirePage().exposeFunction(name, fn);
    }

    on<K extends keyof import('@open-wa/driver-interface').IPageEventMap>(_event: K, _handler: PageEventHandler<K>): DisposableHandle;
    on(_event: string, _handler: (...args: any[]) => void | Promise<void>): DisposableHandle;
    on(event: string, handler: ((...args: any[]) => void | Promise<void>) | PageEventHandler<any>): DisposableHandle {
        const page = this.requirePage();
        const wrapped = (...args: any[]) => {
            const payload = this.wrapEventPayload(event, args);
            if (event === 'close') {
                return (handler as () => void | Promise<void>)();
            }

            return (handler as (payload: unknown) => void | Promise<void>)(payload);
        };

        this.getWrapperSet(event, handler as Function).add(wrapped);
        page.on(event, wrapped);

        return new LightpandaDisposableHandle(() => {
            this.removeWrappedListener(event, handler as Function, wrapped);
        });
    }

    off<K extends keyof import('@open-wa/driver-interface').IPageEventMap>(_event: K, _handler: PageEventHandler<K>): void;
    off(_event: string, _handler: (...args: any[]) => void | Promise<void>): void;
    off(event: string, handler: ((...args: any[]) => void | Promise<void>) | PageEventHandler<any>): void {
        const page = this.requirePage();
        const wrappers = this.listenerWrappers.get(event)?.get(handler as Function);
        if (!wrappers || wrappers.size === 0) {
            page.off(event, handler as any);
            return;
        }

        for (const wrapped of wrappers) {
            page.off(event, wrapped);
        }

        this.listenerWrappers.get(event)?.delete(handler as Function);
    }

    async close(): Promise<void> {
        await this.requirePage().close();
    }

    isClosed(): boolean {
        return this.requirePage().isClosed();
    }

    unwrap(): unknown {
        return this.page;
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

    private requirePage(): any {
        if (!this.page) {
            throw new Error('Lightpanda page is not connected');
        }

        return this.page;
    }

    private getWrapperSet(event: string, handler: Function): Set<(...args: any[]) => void | Promise<void>> {
        let handlers = this.listenerWrappers.get(event);
        if (!handlers) {
            handlers = new Map();
            this.listenerWrappers.set(event, handlers);
        }

        let wrappers = handlers.get(handler);
        if (!wrappers) {
            wrappers = new Set();
            handlers.set(handler, wrappers);
        }

        return wrappers;
    }

    private removeWrappedListener(event: string, handler: Function, wrapped: (...args: any[]) => void | Promise<void>): void {
        const page = this.requirePage();
        page.off(event, wrapped);

        const wrappers = this.listenerWrappers.get(event)?.get(handler);
        wrappers?.delete(wrapped);

        if (wrappers && wrappers.size === 0) {
            this.listenerWrappers.get(event)?.delete(handler);
        }
    }

    private wrapEventPayload(event: string, args: any[]): unknown {
        const [firstArg] = args;

        switch (event) {
            case 'console':
            case 'pageerror':
                return firstArg;
            case 'framenavigated':
                return firstArg ? new LightpandaFrame(firstArg, firstArg === this.requirePage().mainFrame()) : null;
            case 'request':
            case 'requestfailed':
            case 'requestfinished':
                return firstArg;
            default:
                return firstArg;
        }
    }
}
