import { LaunchOptions, ConnectOptions, IDriverContext, DriverName } from './types';

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
    
    newPage(): Promise<IPage>;
    pages(): Promise<IPage[]>;
    close(): Promise<void>;
    isConnected(): boolean;
    versionString(): Promise<string>;
    
    unwrap(): unknown;
}

export interface IPage {
    readonly name: DriverName;
    
    goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeoutMs?: number }): Promise<void>;
    url(): string;
    reload(): Promise<void>;
    
    evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret>;
    
    setViewport(viewport: { width: number; height: number }): Promise<void>;
    setUserAgent(ua: string): Promise<void>;
    
    waitForSelector(selector: string, options?: { timeoutMs?: number }): Promise<IElementHandle | null>;
    waitForFunction<Arg>(fn: (arg: Arg) => boolean, arg: Arg, options?: { timeoutMs?: number }): Promise<void>;
    $(selector: string): Promise<IElementHandle | null>;
    $$(selector: string): Promise<IElementHandle[]>;
    
    click(selector: string): Promise<void>;
    type(selector: string, text: string, options?: { delayMs?: number }): Promise<void>;
    
    screenshot(options?: { type?: 'png' | 'jpeg'; fullPage?: boolean }): Promise<Uint8Array>;
    
    exposeFunction(name: string, fn: (...args: any[]) => any): Promise<void>;
    
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
