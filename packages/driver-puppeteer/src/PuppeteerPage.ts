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
import type { ConsoleMessage, Frame, HTTPRequest, Page, CDPSession } from 'puppeteer';
import { PuppeteerElementHandle } from './PuppeteerElementHandle';

type ListenerWrapper = (...args: any[]) => void | Promise<void>;

class PuppeteerDisposableHandle implements DisposableHandle {
    constructor(private readonly disposer: () => Promise<void> | void) {}

    dispose(): Promise<void> | void {
        return this.disposer();
    }
}

class PuppeteerFrame implements IFrame {
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
        return parent ? new PuppeteerFrame(parent, false) : null;
    }

    async content(): Promise<string> {
        return this.frame.content();
    }

    unwrap(): Frame {
        return this.frame;
    }
}

function normalizeSnippet(input: string): string {
    return input.replace(/\s+/g, ' ').trim().slice(0, 160);
}

function enrichEvaluateError(kind: 'evaluate' | 'evaluateScript', source: string, error: unknown): never {
    const normalized = error instanceof Error ? error : new Error(String(error));
    const preview = normalizeSnippet(source);
    const enriched = new Error(
        `[puppeteer:${kind}] ${normalized.message} | scriptBytes=${source.length} | scriptPreview=${preview}`,
    );
    enriched.stack = normalized.stack ?? enriched.message;
    throw enriched;
}

function enrichWaitError(
    kind: 'waitForSelector' | 'waitForFunction' | 'waitForFunctionFn',
    details: Record<string, unknown>,
    error: unknown,
): never {
    const normalized = error instanceof Error ? error : new Error(String(error));
    const detailText = Object.entries(details)
        .filter(([, value]) => typeof value !== 'undefined')
        .map(([key, value]) => `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`)
        .join(' | ');
    const enriched = new Error(`[puppeteer:${kind}] ${normalized.message}${detailText ? ` | ${detailText}` : ''}`);
    enriched.stack = normalized.stack ?? enriched.message;
    throw enriched;
}

class PuppeteerRequest implements IRequest {
    constructor(private readonly request: HTTPRequest, private readonly page: Page) {}

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
        return frame ? new PuppeteerFrame(frame, frame === this.page.mainFrame()) : null;
    }

    async abort(errorCode?: string): Promise<void> {
        await this.request.abort(errorCode as never);
    }

    async continue(overrides?: IRequestContinueOverrides): Promise<void> {
        await this.request.continue(overrides);
    }

    async respond(response: IRequestResponse): Promise<void> {
        await this.request.respond({
            ...response,
            body: response.body instanceof Uint8Array ? Buffer.from(response.body) : response.body,
        } as never);
    }

    unwrap(): HTTPRequest {
        return this.request;
    }
}

class PuppeteerConsoleMessage implements IConsoleMessage {
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

export class PuppeteerPage implements IPage {
    readonly name = 'puppeteer' as const;
    private readonly listenerWrappers = new Map<string, Map<Function, Set<ListenerWrapper>>>();
    
    constructor(
        private page: Page,
        private capabilities: DriverCapabilities
    ) {}
    
    async goto(url: string, options?: { waitUntil?: NavigationWaitUntil; timeoutMs?: number }): Promise<void> {
        await this.page.goto(url, {
            waitUntil: options?.waitUntil as any,
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
        return new PuppeteerFrame(this.page.mainFrame(), true);
    }
    
    async evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret> {
        try {
            return await this.page.evaluate(fn as any, arg as any) as Ret;
        } catch (error) {
            const fnSource = typeof fn === 'function' ? fn.toString() : '[anonymous evaluate fn]';
            return enrichEvaluateError('evaluate', fnSource, error);
        }
    }
    
    async evaluateScript<Ret = unknown>(script: string): Promise<Ret> {
        try {
            return await this.page.evaluate(script) as Ret;
        } catch (error) {
            return enrichEvaluateError('evaluateScript', script, error);
        }
    }

    async addInitScript(script: string): Promise<DisposableHandle> {
        const registration = await (this.page as any).evaluateOnNewDocument(script);
        const identifier = this.getInitScriptIdentifier(registration);
        let disposed = false;

        return new PuppeteerDisposableHandle(async () => {
            if (disposed) {
                return;
            }

            disposed = true;
            if (identifier && typeof (this.page as any).removeScriptToEvaluateOnNewDocument === 'function') {
                await (this.page as any).removeScriptToEvaluateOnNewDocument(identifier);
            }
        });
    }
    
    async setViewport(viewport: { width: number; height: number }): Promise<void> {
        await this.page.setViewport(viewport);
    }
    
    async setUserAgent(ua: string): Promise<void> {
        await this.page.setUserAgent(ua);
    }

    async setRequestInterception(enabled: boolean): Promise<void> {
        this.require('requestInterception');
        await this.page.setRequestInterception(enabled);
    }
    
    async waitForSelector(selector: string, options?: { timeoutMs?: number }): Promise<IElementHandle | null> {
        try {
            const element = await this.page.waitForSelector(selector, { timeout: options?.timeoutMs });
            return element ? new PuppeteerElementHandle(element) : null;
        } catch (error) {
            return enrichWaitError('waitForSelector', {
                selector,
                timeoutMs: options?.timeoutMs,
            }, error);
        }
    }
    
    async waitForFunction<Arg>(script: string, options?: WaitForFunctionOptions): Promise<void>;
    async waitForFunction<Arg>(fn: (arg: Arg) => boolean, arg: Arg, options?: WaitForFunctionOptions): Promise<void>;
    async waitForFunction<Arg>(fnOrScript: string | ((arg: Arg) => boolean), argOrOptions?: Arg | WaitForFunctionOptions, maybeOptions?: WaitForFunctionOptions): Promise<void> {
        if (typeof fnOrScript === 'string') {
            const options = argOrOptions as WaitForFunctionOptions | undefined;
            try {
                await this.page.waitForFunction(fnOrScript, {
                    timeout: options?.timeoutMs,
                    polling: options?.polling as any,
                });
                return;
            } catch (error) {
                return enrichWaitError('waitForFunction', {
                    timeoutMs: options?.timeoutMs,
                    polling: options?.polling,
                    scriptBytes: fnOrScript.length,
                    scriptPreview: normalizeSnippet(fnOrScript),
                }, error);
            }
        }

        const options = maybeOptions;
        try {
            await this.page.waitForFunction(fnOrScript as any, {
                timeout: options?.timeoutMs,
                polling: options?.polling as any,
            }, argOrOptions as any);
        } catch (error) {
            return enrichWaitError('waitForFunctionFn', {
                timeoutMs: options?.timeoutMs,
                polling: options?.polling,
                fnPreview: normalizeSnippet(fnOrScript.toString()),
                argPreview: typeof argOrOptions === 'undefined' ? undefined : normalizeSnippet(JSON.stringify(argOrOptions)),
            }, error);
        }
    }
    
    async $(selector: string): Promise<IElementHandle | null> {
        const element = await this.page.$(selector);
        return element ? new PuppeteerElementHandle(element) : null;
    }
    
    async $$(selector: string): Promise<IElementHandle[]> {
        const elements = await this.page.$$(selector);
        return elements.map(el => new PuppeteerElementHandle(el));
    }
    
    async click(selector: string): Promise<void> {
        await this.page.click(selector);
    }
    
    async type(selector: string, text: string, options?: { delayMs?: number }): Promise<void> {
        await this.page.type(selector, text, { delay: options?.delayMs });
    }
    
    async screenshot(options?: { type?: 'png' | 'jpeg'; fullPage?: boolean }): Promise<Uint8Array> {
        const buffer = await this.page.screenshot(options);
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

        return new PuppeteerDisposableHandle(() => {
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
    
    has<C extends string>(cap: C): boolean {
        return (this.capabilities as any)[cap]?.supported === true;
    }
    
    require<C extends string>(cap: C): void {
        if (!this.has(cap)) {
            const capability = (this.capabilities as any)[cap];
            throw new Error(
                `Page does not support capability '${cap}'${
                    capability?.reason ? `: ${capability.reason}` : ''
                }`
            );
        }
    }
    
    async cdp(): Promise<CDPSession> {
        this.require('cdp');
        return await this.page.createCDPSession();
    }
    
    async setBypassServiceWorker(bypass: boolean): Promise<void> {
        this.require('serviceWorkerBypass');
        await this.page.setBypassServiceWorker(bypass);
    }
    
    async pdf(options?: { path?: string; format?: string }): Promise<Uint8Array> {
        this.require('pdf');
        const buffer = await this.page.pdf(options as any);
        return new Uint8Array(buffer);
    }
    
    async startTracing(options?: { path?: string; screenshots?: boolean }): Promise<void> {
        this.require('tracing');
        await this.page.tracing.start(options);
    }
    
    async stopTracing(): Promise<Uint8Array> {
        this.require('tracing');
        const buffer = await this.page.tracing.stop();
        return buffer ? new Uint8Array(buffer) : new Uint8Array();
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

    private getInitScriptIdentifier(registration: unknown): string | undefined {
        if (typeof registration === 'string') {
            return registration;
        }

        if (registration && typeof registration === 'object') {
            const candidate = (registration as { identifier?: unknown; id?: unknown }).identifier
                ?? (registration as { identifier?: unknown; id?: unknown }).id;
            return typeof candidate === 'string' ? candidate : undefined;
        }

        return undefined;
    }

    private wrapEventPayload(event: string, args: any[]): unknown {
        const [payload] = args;
        switch (event) {
            case 'request':
            case 'requestfailed':
            case 'requestfinished':
                return new PuppeteerRequest(payload as HTTPRequest, this.page);
            case 'framenavigated':
                return new PuppeteerFrame(payload as Frame, payload === this.page.mainFrame());
            case 'console':
                return new PuppeteerConsoleMessage(payload as ConsoleMessage);
            case 'pageerror':
                return payload as Error;
            default:
                return payload;
        }
    }
}
