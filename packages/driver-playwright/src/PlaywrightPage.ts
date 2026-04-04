import {
    IPage,
    IElementHandle,
    DriverCapabilities,
    type DisposableHandle,
    type IConsoleMessage,
    type IFrame,
    type IRequest,
    type IRequestContinueOverrides,
    type IRequestResponse,
    type NavigationWaitUntil,
    type PageEventHandler,
    type WaitForFunctionOptions,
} from '@open-wa/driver-interface';
import type { ConsoleMessage, Frame, Page, Request, CDPSession } from 'playwright';
import { PlaywrightElementHandle } from './PlaywrightElementHandle';
import { PlaywrightBrowserType } from './PlaywrightDriver';

type ListenerWrapper = (...args: any[]) => void | Promise<void>;

const PLAYWRIGHT_REQUEST_ROUTE_ERROR = 'Playwright request event payload cannot abort, continue, or respond without a bound route';

class PlaywrightDisposableHandle implements DisposableHandle {
    constructor(private readonly disposer: () => Promise<void> | void) {}

    dispose(): Promise<void> | void {
        return this.disposer();
    }
}

class PlaywrightFrame implements IFrame {
    constructor(private readonly frame: Frame, private readonly isMain: boolean) {}

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
        const parent = this.frame.parentFrame();
        return parent ? new PlaywrightFrame(parent, false) : null;
    }

    async content(): Promise<string> {
        return this.frame.content();
    }

    unwrap(): Frame {
        return this.frame;
    }
}

class PlaywrightRequest implements IRequest {
    constructor(private readonly request: Request, private readonly page: Page) {}

    url(): string {
        return this.request.url();
    }

    method(): string {
        return this.request.method();
    }

    headers(): Record<string, string> {
        return this.request.headers();
    }

    resourceType(): string | null {
        return this.request.resourceType?.() ?? null;
    }

    isNavigationRequest(): boolean {
        return this.request.isNavigationRequest();
    }

    frame(): IFrame | null {
        const frame = this.request.frame();
        return frame ? new PlaywrightFrame(frame, frame === this.page.mainFrame()) : null;
    }

    async abort(): Promise<void> {
        throw new Error(PLAYWRIGHT_REQUEST_ROUTE_ERROR);
    }

    async continue(_overrides?: IRequestContinueOverrides): Promise<void> {
        throw new Error(PLAYWRIGHT_REQUEST_ROUTE_ERROR);
    }

    async respond(_response: IRequestResponse): Promise<void> {
        throw new Error(PLAYWRIGHT_REQUEST_ROUTE_ERROR);
    }

    unwrap(): Request {
        return this.request;
    }
}

class PlaywrightConsoleMessage implements IConsoleMessage {
    constructor(private readonly message: ConsoleMessage) {}

    type(): string {
        return this.message.type();
    }

    text(): string {
        return this.message.text();
    }

    location(): { url?: string; lineNumber?: number; columnNumber?: number } {
        const location = this.message.location();
        return {
            url: location.url,
            lineNumber: location.lineNumber,
            columnNumber: location.columnNumber,
        };
    }

    args(): unknown[] {
        return this.message.args();
    }

    unwrap(): ConsoleMessage {
        return this.message;
    }
}

export class PlaywrightPage implements IPage {
    readonly name = 'playwright' as const;
    private readonly listenerWrappers = new Map<string, Map<Function, Set<ListenerWrapper>>>();
    private readonly requestInterceptionRoute = async (route: { continue: () => Promise<void> }) => {
        await route.continue();
    };
    private requestInterceptionEnabled = false;

    constructor(
        private page: Page,
        _browserType: PlaywrightBrowserType,
        private capabilities: DriverCapabilities
    ) { }

    async goto(url: string, options?: { waitUntil?: NavigationWaitUntil; timeoutMs?: number }): Promise<void> {
        const waitUntil = options?.waitUntil === 'networkidle' ? 'networkidle' : options?.waitUntil;

        await this.page.goto(url, {
            waitUntil: waitUntil as any,
            timeout: options?.timeoutMs,
        });
    }

    url(): string {
        return this.page.url();
    }

    async reload(): Promise<void> {
        await this.page.reload();
    }

    mainFrame(): IFrame {
        return new PlaywrightFrame(this.page.mainFrame(), true);
    }

    async evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret> {
        return await this.page.evaluate(fn as any, arg as any) as Ret;
    }

    async evaluateScript<Ret = unknown>(script: string): Promise<Ret> {
        return await this.page.evaluate(script) as Ret;
    }

    async addInitScript(script: string): Promise<DisposableHandle> {
        await this.page.addInitScript(script);
        return new PlaywrightDisposableHandle(() => undefined);
    }

    async setViewport(viewport: { width: number; height: number }): Promise<void> {
        await this.page.setViewportSize(viewport);
    }

    async setUserAgent(ua: string): Promise<void> {
        await this.page.setExtraHTTPHeaders({ 'User-Agent': ua });
    }

    async setRequestInterception(enabled: boolean): Promise<void> {
        this.require('requestInterception');
        if (enabled === this.requestInterceptionEnabled) {
            return;
        }

        if (enabled) {
            await this.page.route('**/*', this.requestInterceptionRoute as any);
            this.requestInterceptionEnabled = true;
            return;
        }

        await this.page.unroute('**/*', this.requestInterceptionRoute as any);
        this.requestInterceptionEnabled = false;
    }

    async waitForSelector(selector: string, options?: { timeoutMs?: number }): Promise<IElementHandle | null> {
        const element = await this.page.waitForSelector(selector, { timeout: options?.timeoutMs });
        return element ? new PlaywrightElementHandle(element) : null;
    }

    async waitForFunction(script: string, options?: WaitForFunctionOptions): Promise<void>;
    async waitForFunction<Arg>(fn: (arg: Arg) => boolean, arg: Arg, options?: WaitForFunctionOptions): Promise<void>;
    async waitForFunction<Arg>(fnOrScript: string | ((arg: Arg) => boolean), argOrOptions?: Arg | WaitForFunctionOptions, maybeOptions?: WaitForFunctionOptions): Promise<void> {
        if (typeof fnOrScript === 'string') {
            const options = argOrOptions as WaitForFunctionOptions | undefined;
            await this.page.waitForFunction(fnOrScript, undefined, {
                timeout: options?.timeoutMs,
                polling: options?.polling as any,
            });
            return;
        }

        await this.page.waitForFunction(fnOrScript as any, argOrOptions as any, {
            timeout: maybeOptions?.timeoutMs,
            polling: maybeOptions?.polling as any,
        });
    }

    async $(selector: string): Promise<IElementHandle | null> {
        const element = await this.page.$(selector);
        return element ? new PlaywrightElementHandle(element) : null;
    }

    async $$(selector: string): Promise<IElementHandle[]> {
        const elements = await this.page.$$(selector);
        return elements.map(el => new PlaywrightElementHandle(el));
    }

    async click(selector: string): Promise<void> {
        await this.page.click(selector);
    }

    async type(selector: string, text: string, options?: { delayMs?: number }): Promise<void> {
        await this.page.type(selector, text, { delay: options?.delayMs });
    }

    async screenshot(options?: { type?: 'png' | 'jpeg'; fullPage?: boolean }): Promise<Uint8Array> {
        const buffer = await this.page.screenshot({
            type: options?.type,
            fullPage: options?.fullPage,
        });
        return new Uint8Array(buffer);
    }

    async exposeFunction(name: string, fn: (...args: any[]) => any): Promise<void> {
        await this.page.exposeFunction(name, fn);
    }

    on<K extends string>(event: K, handler: ((...args: any[]) => void | Promise<void>) | PageEventHandler<any>): DisposableHandle {
        const wrapped = (...args: any[]) => {
            const payload = this.wrapEventPayload(event, args);
            if (event === 'close') {
                return (handler as () => void | Promise<void>)();
            }
            return (handler as (payload: unknown) => void | Promise<void>)(payload);
        };

        this.getWrapperSet(event, handler as Function).add(wrapped);
        this.page.on(event as any, wrapped as any);

        return new PlaywrightDisposableHandle(() => {
            this.removeWrappedListener(event, handler as Function, wrapped);
        });
    }

    off<K extends string>(event: K, handler: ((...args: any[]) => void | Promise<void>) | PageEventHandler<any>): void {
        const wrappers = this.listenerWrappers.get(event)?.get(handler as Function);
        if (!wrappers || wrappers.size === 0) {
            this.page.off(event as any, handler as any);
            return;
        }

        for (const wrapped of wrappers) {
            this.page.off(event as any, wrapped as any);
        }

        this.listenerWrappers.get(event)?.delete(handler as Function);
    }

    async close(): Promise<void> {
        await this.page.close();
    }

    isClosed(): boolean {
        return this.page.isClosed();
    }

    // Capability-specific methods
    has<C extends string>(cap: C): boolean {
        return (this.capabilities as any)[cap]?.supported === true;
    }

    require<C extends string>(cap: C): void {
        if (!this.has(cap)) {
            const capability = (this.capabilities as any)[cap];
            throw new Error(
                `Page does not support capability '${cap}'${capability?.reason ? `: ${capability.reason}` : ''
                }`
            );
        }
    }

    // CDP Support (Chromium-based only)
    cdp(): CDPSession {
        this.require('cdp');
        const context = this.page.context();
        return (context as any).newCDPSession(this.page) as CDPSession;
    }

    // Service Worker Bypass
    async setBypassServiceWorker(bypass: boolean): Promise<void> {
        this.require('serviceWorkerBypass');
        await this.page.context().route('**/*', (route) => {
            if (bypass && route.request().serviceWorker()) {
                route.abort();
            } else {
                route.continue();
            }
        });
    }

    // PDF Generation (Chromium only)
    async pdf(options?: { path?: string; format?: string }): Promise<Uint8Array> {
        this.require('pdf');
        const buffer = await this.page.pdf(options as any);
        return new Uint8Array(buffer);
    }

    // Tracing
    async startTracing(options?: { path?: string; screenshots?: boolean }): Promise<void> {
        this.require('tracing');
        await this.page.context().tracing.start(options as any);
    }

    async stopTracing(): Promise<Uint8Array> {
        this.require('tracing');
        const tempPath = `/tmp/trace-${Date.now()}.zip`;
        await this.page.context().tracing.stop({ path: tempPath });

        const fs = await import('fs/promises');
        const buffer = await fs.readFile(tempPath);
        await fs.unlink(tempPath).catch(() => { });

        return new Uint8Array(buffer);
    }

    unwrap(): Page {
        return this.page;
    }

    private getWrapperSet(event: string, handler: Function): Set<ListenerWrapper> {
        let wrappers = this.listenerWrappers.get(event);
        if (!wrappers) {
            wrappers = new Map();
            this.listenerWrappers.set(event, wrappers);
        }

        let handlerWrappers = wrappers.get(handler);
        if (!handlerWrappers) {
            handlerWrappers = new Set();
            wrappers.set(handler, handlerWrappers);
        }

        return handlerWrappers;
    }

    private removeWrappedListener(event: string, handler: Function, wrapped: ListenerWrapper): void {
        this.page.off(event as any, wrapped as any);

        const eventWrappers = this.listenerWrappers.get(event);
        const handlerWrappers = eventWrappers?.get(handler);
        if (!handlerWrappers) {
            return;
        }

        handlerWrappers.delete(wrapped);
        if (handlerWrappers.size === 0) {
            eventWrappers?.delete(handler);
        }
        if (eventWrappers && eventWrappers.size === 0) {
            this.listenerWrappers.delete(event);
        }
    }

    private wrapEventPayload(event: string, args: any[]): unknown {
        const [payload] = args;
        switch (event) {
            case 'request':
            case 'requestfailed':
            case 'requestfinished':
                return new PlaywrightRequest(payload as Request, this.page);
            case 'framenavigated':
                return new PlaywrightFrame(payload as Frame, payload === this.page.mainFrame());
            case 'console':
                return new PlaywrightConsoleMessage(payload as ConsoleMessage);
            case 'pageerror':
                return payload as Error;
            default:
                return payload;
        }
    }
}
