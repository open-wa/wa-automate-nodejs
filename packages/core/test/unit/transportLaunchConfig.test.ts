import { describe, expect, it, vi, afterEach } from 'vitest';
import type {
  DisposableHandle,
  IBrowser,
  IConsoleMessage,
  IDriver,
  IDriverContext,
  IElementHandle,
  IFrame,
  IPage,
  IRequest,
  IRequestContinueOverrides,
  IRequestResponse,
  LaunchOptions,
  WaitForFunctionOptions,
} from '@open-wa/driver-interface';
import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { OpenWAEventMap } from '../../src/events/eventMap.js';
import { Transport } from '../../src/transport/Transport.js';

class TestConsoleMessage implements IConsoleMessage {
  constructor(
    private readonly messageType: string,
    private readonly messageText: string,
  ) {}

  type(): string {
    return this.messageType;
  }

  text(): string {
    return this.messageText;
  }

  unwrap(): unknown {
    return this;
  }
}

class TestRequest implements IRequest {
  readonly abort = vi.fn(async (_errorCode?: string) => undefined);
  readonly continue = vi.fn(async (_overrides?: IRequestContinueOverrides) => undefined);
  readonly respond = vi.fn(async (_response: IRequestResponse) => undefined);

  constructor(
    private readonly requestUrl: string,
    private readonly typeName: string | null = 'document',
  ) {}

  url(): string {
    return this.requestUrl;
  }

  method(): string {
    return 'GET';
  }

  headers(): Record<string, string> {
    return {};
  }

  resourceType(): string | null {
    return this.typeName;
  }

  isNavigationRequest(): boolean {
    return false;
  }

  frame(): IFrame | null {
    return null;
  }

  unwrap(): unknown {
    return this;
  }
}

class TestPage implements IPage {
  readonly name = 'test-driver';
  readonly setRequestInterception = vi.fn(async (_enabled: boolean) => {
    if (this.throwOnSetRequestInterception) {
      throw new Error('request interception unsupported');
    }
  });

  private readonly listeners = new Map<string, Set<(...args: any[]) => void | Promise<void>>>();
  private currentUrl = 'about:blank';
  private closed = false;

  constructor(private readonly throwOnSetRequestInterception = false) {}

  async goto(url: string): Promise<void> {
    this.currentUrl = url;
  }

  url(): string {
    return this.currentUrl;
  }

  async reload(): Promise<void> {}

  mainFrame(): IFrame | null {
    return null;
  }

  async evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret> {
    return fn(arg);
  }

  async evaluateScript<Ret = unknown>(): Promise<Ret> {
    return undefined as Ret;
  }

  async addInitScript(_script: string): Promise<DisposableHandle> {
    return { dispose(): void {} };
  }

  async setViewport(_viewport: { width: number; height: number }): Promise<void> {}

  async setUserAgent(_ua: string): Promise<void> {}

  async waitForSelector(_selector: string): Promise<IElementHandle | null> {
    return null;
  }

  async waitForFunction(_script: string, _options?: WaitForFunctionOptions): Promise<void>;
  async waitForFunction<Arg>(_fn: (arg: Arg) => boolean, _arg: Arg, _options?: WaitForFunctionOptions): Promise<void>;
  async waitForFunction(): Promise<void> {}

  async $(_selector: string): Promise<IElementHandle | null> {
    return null;
  }

  async $$(_selector: string): Promise<IElementHandle[]> {
    return [];
  }

  async click(_selector: string): Promise<void> {}

  async type(_selector: string, _text: string): Promise<void> {}

  async screenshot(): Promise<Uint8Array> {
    return new Uint8Array();
  }

  async exposeFunction(_name: string, _fn: (...args: any[]) => any): Promise<void> {}

  on(event: string, handler: (...args: any[]) => void | Promise<void>): DisposableHandle {
    const handlers = this.listeners.get(event) ?? new Set<(...args: any[]) => void | Promise<void>>();
    handlers.add(handler);
    this.listeners.set(event, handlers);

    return {
      dispose: () => {
        this.off(event, handler);
      },
    };
  }

  off(event: string, handler: (...args: any[]) => void | Promise<void>): void {
    this.listeners.get(event)?.delete(handler);
  }

  async close(): Promise<void> {
    this.closed = true;
  }

  isClosed(): boolean {
    return this.closed;
  }

  unwrap(): unknown {
    return this;
  }

  async emit(event: string, payload: unknown): Promise<void> {
    const handlers = [...(this.listeners.get(event) ?? [])];
    for (const handler of handlers) {
      await handler(payload);
    }
  }
}

class TestBrowser implements IBrowser {
  readonly name = 'test-driver';

  constructor(private readonly page: TestPage) {}

  async newPage(): Promise<IPage> {
    return this.page;
  }

  async pages(): Promise<IPage[]> {
    return [this.page];
  }

  async close(): Promise<void> {
    await this.page.close();
  }

  isConnected(): boolean {
    return true;
  }

  async versionString(): Promise<string> {
    return 'test-browser';
  }

  unwrap(): unknown {
    return this;
  }
}

class CaptureDriver implements IDriver {
  readonly name = 'test-driver';
  capturedLaunchOptions?: LaunchOptions;
  capturedInitContext?: IDriverContext;

  constructor(private readonly browser: TestBrowser) {}

  async init(ctx?: IDriverContext): Promise<void> {
    this.capturedInitContext = ctx;
  }

  async launch(options?: LaunchOptions): Promise<IBrowser> {
    this.capturedLaunchOptions = options;
    return this.browser;
  }

  async connect(): Promise<IBrowser> {
    return this.browser;
  }

  unwrap(): unknown {
    return this;
  }
}

function createLogger(): Logger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  } as unknown as Logger;
}

function createEvents(): HyperEmitter<OpenWAEventMap> {
  return {
    emit: vi.fn(),
  } as unknown as HyperEmitter<OpenWAEventMap>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Transport launch/config plumbing', () => {
  it('forwards userDataDir to driver launch options', async () => {
    const page = new TestPage();
    const driver = new CaptureDriver(new TestBrowser(page));
    const transport = new Transport({
      driver,
      events: createEvents(),
      logger: createLogger(),
      userDataDir: '/tmp/openwa-profile',
      blockCrashLogs: false,
    });

    await transport.initialize();

    expect(driver.capturedLaunchOptions?.userDataDir).toBe('/tmp/openwa-profile');
  });

  it('passes logger context to driver.init and nested lightpanda options to driver.launch', async () => {
    const logger = createLogger();
    const page = new TestPage();
    const driver = new CaptureDriver(new TestBrowser(page));
    const lightpanda = {
      executablePath: '/tmp/lightpanda-bin',
      portStart: 9400,
      host: '127.0.0.1',
      startupTimeoutMs: 45_000,
      disableTelemetry: true,
    };
    const transport = new Transport({
      driver,
      events: createEvents(),
      logger,
      lightpanda,
      blockCrashLogs: false,
    });

    await transport.initialize();

    expect(driver.capturedInitContext).toEqual({ logger });
    expect(driver.capturedLaunchOptions?.lightpanda).toEqual(lightpanda);
  });

  it('logs browser console output and page errors when enabled', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const logger = createLogger();
    const page = new TestPage();
    const transport = new Transport({
      driver: new CaptureDriver(new TestBrowser(page)),
      events: createEvents(),
      logger,
      logConsole: true,
      logConsoleErrors: true,
      blockCrashLogs: false,
    });

    await transport.initialize();
    await page.emit('console', new TestConsoleMessage('log', 'hello from browser'));
    await page.emit('pageerror', new Error('browser exploded'));

    expect(consoleLogSpy).toHaveBeenCalledWith('hello from browser');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'browser exploded' }));
    expect(logger.info).toHaveBeenCalledWith('page_console', expect.objectContaining({ text: 'hello from browser' }));
    expect(logger.error).toHaveBeenCalledWith('page_console_error', expect.objectContaining({ message: 'browser exploded' }));
  });

  it('blocks crashlog and asset requests while allowing normal traffic to continue', async () => {
    const page = new TestPage();
    const transport = new Transport({
      driver: new CaptureDriver(new TestBrowser(page)),
      events: createEvents(),
      logger: createLogger(),
      headless: true,
      blockCrashLogs: true,
      blockAssets: true,
    });

    await transport.initialize();

    const crashLogRequest = new TestRequest('https://crashlogs.whatsapp.net/submit');
    const imageRequest = new TestRequest('https://static.example.test/logo.png', 'image');
    const documentRequest = new TestRequest('https://web.whatsapp.com/', 'document');

    await page.emit('request', crashLogRequest);
    await page.emit('request', imageRequest);
    await page.emit('request', documentRequest);

    expect(page.setRequestInterception).toHaveBeenCalledWith(true);
    expect(crashLogRequest.abort).toHaveBeenCalledTimes(1);
    expect(crashLogRequest.continue).not.toHaveBeenCalled();
    expect(imageRequest.abort).toHaveBeenCalledTimes(1);
    expect(imageRequest.continue).not.toHaveBeenCalled();
    expect(documentRequest.abort).not.toHaveBeenCalled();
    expect(documentRequest.continue).toHaveBeenCalledTimes(1);
  });

  it('downgrades interception-dependent config explicitly when interception is unavailable', async () => {
    const logger = createLogger();
    const page = new TestPage(true);
    const transport = new Transport({
      driver: new CaptureDriver(new TestBrowser(page)),
      events: createEvents(),
      logger,
      blockCrashLogs: true,
      blockAssets: true,
    });

    await transport.initialize();

    expect(logger.warn).toHaveBeenCalledWith(
      'page_request_interception_unavailable',
      expect.objectContaining({
        blockCrashLogs: true,
        blockAssets: true,
      }),
    );
  });
});
