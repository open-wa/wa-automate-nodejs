import { LaunchOptions, ConnectOptions, IDriverContext, DriverName } from './types';

export type NavigationWaitUntil = 'load' | 'domcontentloaded' | 'networkidle' | 'networkidle0' | 'networkidle2';

export interface DisposableHandle {
    dispose(): Promise<void> | void;
}

export interface WaitForFunctionOptions {
    timeoutMs?: number;
    polling?: number | 'raf' | 'mutation';
}

export interface IFrame {
    url(): string;
    name(): string;
    isMainFrame(): boolean;
    parentFrame(): IFrame | null;
    content?(): Promise<string>;
    unwrap(): unknown;
}

export interface IRequestContinueOverrides {
    url?: string;
    method?: string;
    postData?: string;
    headers?: Record<string, string>;
}

export interface IRequestResponse {
    status?: number;
    headers?: Record<string, string>;
    contentType?: string;
    body?: string | Uint8Array;
}

export interface IRequest {
    url(): string;
    method(): string;
    headers(): Record<string, string>;
    resourceType(): string | null;
    isNavigationRequest(): boolean;
    frame(): IFrame | null;
    abort(errorCode?: string): Promise<void>;
    continue(overrides?: IRequestContinueOverrides): Promise<void>;
    respond(response: IRequestResponse): Promise<void>;
    unwrap(): unknown;
}

export interface IConsoleMessage {
    type(): string;
    text(): string;
    location?(): { url?: string; lineNumber?: number; columnNumber?: number };
    args?(): unknown[];
    unwrap(): unknown;
}

export interface IPageEventMap {
    close: void;
    console: IConsoleMessage;
    pageerror: Error;
    request: IRequest;
    requestfailed: IRequest;
    requestfinished: IRequest;
    framenavigated: IFrame;
}

export type PageEventHandler<K extends keyof IPageEventMap> = IPageEventMap[K] extends void
    ? () => void | Promise<void>
    : (payload: IPageEventMap[K]) => void | Promise<void>;

export interface IDriver {
    readonly name: DriverName;
    readonly version?: string;

    init(ctx?: IDriverContext): Promise<void>;
    launch(options?: LaunchOptions): Promise<IBrowser>;
    connect(options: ConnectOptions): Promise<IBrowser>;

    unwrap(): unknown;
}

export interface IBrowser {
    readonly name: DriverName;

    newPage(options?: {
        //clears the first page
        clearFirstPage?: boolean
    }): Promise<IPage>;
    pages(): Promise<IPage[]>;
    close(): Promise<void>;
    isConnected(): boolean;
    versionString(): Promise<string>;

    unwrap(): unknown;
}

export interface IPage {
    readonly name: DriverName;

    goto(url: string, options?: { waitUntil?: NavigationWaitUntil; timeoutMs?: number }): Promise<void>;
    url(): string;
    reload(): Promise<void>;
    mainFrame(): IFrame | null;

    evaluateOnNewDocument<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<void>;

    evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret>;
    evaluateScript<Ret = unknown>(script: string): Promise<Ret>;
    addInitScript(script: string): Promise<DisposableHandle>;

    setViewport(viewport: { width: number; height: number }): Promise<void>;
    setUserAgent(ua: string): Promise<void>;
    setRequestInterception(enabled: boolean): Promise<void>;

    waitForSelector(selector: string, options?: { timeoutMs?: number }): Promise<IElementHandle | null>;
    waitForFunction(script: string, options?: WaitForFunctionOptions): Promise<void>;
    waitForFunction<Arg>(fn: (arg: Arg) => boolean, arg: Arg, options?: WaitForFunctionOptions): Promise<void>;
    $(selector: string): Promise<IElementHandle | null>;
    $$(selector: string): Promise<IElementHandle[]>;

    click(selector: string): Promise<void>;
    type(selector: string, text: string, options?: { delayMs?: number }): Promise<void>;

    screenshot(options?: { type?: 'png' | 'jpeg'; fullPage?: boolean }): Promise<Uint8Array>;

    exposeFunction(name: string, fn: (...args: any[]) => any): Promise<void>;
    on<K extends keyof IPageEventMap>(event: K, handler: PageEventHandler<K>): DisposableHandle;
    on(event: string, handler: (...args: any[]) => void | Promise<void>): DisposableHandle;
    off<K extends keyof IPageEventMap>(event: K, handler: PageEventHandler<K>): void;
    off(event: string, handler: (...args: any[]) => void | Promise<void>): void;

    close(): Promise<void>;
    isClosed(): boolean;

    unwrap(): unknown;
}

export interface IElementHandle {
    click(): Promise<void>;
    type(text: string): Promise<void>;
    getAttribute(name: string): Promise<string | null>;
    textContent(): Promise<string | null>;
    dispose(): Promise<void>;
    unwrap(): unknown;
}
