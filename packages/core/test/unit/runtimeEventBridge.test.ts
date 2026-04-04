import { describe, expect, it, vi } from 'vitest';
import type {
  DisposableHandle,
  IBrowser,
  IDriver,
  IElementHandle,
  IFrame,
  IPage,
  IRequest,
  WaitForFunctionOptions,
} from '@open-wa/driver-interface';
import { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { OpenWAEventMap } from '../../src/events/eventMap.js';
import { Transport } from '../../src/transport/Transport.js';

class FakeElementHandle implements IElementHandle {
  async click(): Promise<void> {}
  async type(_text: string): Promise<void> {}
  async getAttribute(_name: string): Promise<string | null> {
    return null;
  }
  async textContent(): Promise<string | null> {
    return null;
  }
  async dispose(): Promise<void> {}
  unwrap(): unknown {
    return this;
  }
}

class FakeFrame implements IFrame {
  constructor(
    private readonly mainFrame: boolean,
    private readonly currentUrl: string,
  ) {}

  url(): string {
    return this.currentUrl;
  }

  name(): string {
    return this.mainFrame ? 'main' : 'subframe';
  }

  isMainFrame(): boolean {
    return this.mainFrame;
  }

  parentFrame(): IFrame | null {
    return null;
  }

  unwrap(): unknown {
    return this;
  }
}

type RuntimeChannel = 'message' | 'ack' | 'state' | 'addedToGroup';

class RuntimeBridgePage implements IPage {
  readonly name = 'fake-driver';
  readonly operations: string[] = [];
  readonly waitForFunctionCalls: string[] = [];
  readonly runtimeCallbacks: Partial<Record<RuntimeChannel, Array<(payload: unknown) => unknown>>> = {};
  readonly listeners = new Map<string, Array<(...args: any[]) => void | Promise<void>>>();
  readonly browserGlobals: Record<string, any>;
  readonly wapiRegisterSpies = {
    onAnyMessage: vi.fn((callback: (payload: unknown) => unknown) => {
      this.runtimeCallbacks.message = [...(this.runtimeCallbacks.message ?? []), callback];
      return true;
    }),
    onAck: vi.fn((callback: (payload: unknown) => unknown) => {
      this.runtimeCallbacks.ack = [...(this.runtimeCallbacks.ack ?? []), callback];
      return true;
    }),
    onStateChanged: vi.fn((callback: (payload: unknown) => unknown) => {
      this.runtimeCallbacks.state = [...(this.runtimeCallbacks.state ?? []), callback];
      return true;
    }),
    onAddedToGroup: vi.fn((callback: (payload: unknown) => unknown) => {
      this.runtimeCallbacks.addedToGroup = [...(this.runtimeCallbacks.addedToGroup ?? []), callback];
      return true;
    }),
  };
  private currentUrl = 'about:blank';

  constructor() {
    this.browserGlobals = {
      WAPI: {
        onAnyMessage: this.wapiRegisterSpies.onAnyMessage,
        onAck: this.wapiRegisterSpies.onAck,
        onStateChanged: this.wapiRegisterSpies.onStateChanged,
        onAddedToGroup: this.wapiRegisterSpies.onAddedToGroup,
      },
      Store: { Msg: {} },
      document: {
        querySelector: (selector: string) => (selector === '#pane-side' ? {} : null),
        readyState: 'complete',
      },
      isSessionLoaded: () => true,
      WA_AUTHENTICATED: true,
      __OPENWA_RUNTIME_BRIDGE__: undefined,
    };
  }

  async goto(url: string): Promise<void> {
    this.currentUrl = url;
    this.operations.push(`goto:${url}`);
  }

  url(): string {
    return this.currentUrl;
  }

  async reload(): Promise<void> {}

  mainFrame(): IFrame | null {
    return new FakeFrame(true, this.currentUrl);
  }

  async evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret> {
    const root = globalThis as Record<string, any>;
    const originalWindow = root.window;
    const originalValues = new Map<string, unknown>();
    const keys = new Set(Object.keys(this.browserGlobals));

    for (const key of keys) {
      originalValues.set(key, root[key]);
      root[key] = this.browserGlobals[key];
    }

    root.window = root;

    try {
      const result = await fn(arg);
      for (const key of keys) {
        this.browserGlobals[key] = root[key];
      }
      return result;
    } finally {
      for (const key of keys) {
        root[key] = originalValues.get(key);
      }
      root.window = originalWindow;
    }
  }

  async evaluateScript<Ret = unknown>(_script: string): Promise<Ret> {
    this.operations.push('evaluateScript');
    if (_script.length < 1000 && (_script.includes('Boolean(') || _script.includes('document.querySelector'))) {
      const evaluator = new Function(
        'window',
        'document',
        'Store',
        'WAPI',
        'isSessionLoaded',
        'WA_AUTHENTICATED',
        `return (${_script});`,
      );

      return evaluator(
        this.browserGlobals,
        this.browserGlobals.document,
        this.browserGlobals.Store,
        this.browserGlobals.WAPI,
        this.browserGlobals.isSessionLoaded,
        this.browserGlobals.WA_AUTHENTICATED,
      ) as Ret;
    }

    this.restoreRuntime();

    return undefined as Ret;
  }

  async addInitScript(script: string): Promise<DisposableHandle> {
    this.operations.push(`addInitScript:${script.length}`);
    if (script.includes('OpenWA_RuntimeReplacementDetected')) {
      this.installRuntimeReplacementObserver();
    }
    return { dispose: () => undefined };
  }

  async setViewport(_viewport: { width: number; height: number }): Promise<void> {}
  async setUserAgent(_ua: string): Promise<void> {}
  async setRequestInterception(_enabled: boolean): Promise<void> {}
  async waitForSelector(_selector: string): Promise<IElementHandle | null> {
    return new FakeElementHandle();
  }
  async waitForFunction(_script: string, _options?: WaitForFunctionOptions): Promise<void>;
  async waitForFunction<Arg>(_fn: (arg: Arg) => boolean, _arg: Arg, _options?: WaitForFunctionOptions): Promise<void>;
  async waitForFunction(fnOrScript?: string | ((arg: unknown) => boolean), argOrOptions?: unknown, maybeOptions?: WaitForFunctionOptions): Promise<void> {
    const script = typeof fnOrScript === 'string' ? fnOrScript : null;
    if (script) {
      this.waitForFunctionCalls.push(script);
      const passed = this.evaluateBooleanScript(script);
      if (!passed) {
        throw new Error(`waitForFunction failed: ${script}`);
      }
      return;
    }

    const fn = fnOrScript as ((arg: unknown) => boolean) | undefined;
    const arg = maybeOptions ? argOrOptions : undefined;
    const passed = fn ? fn(arg) : true;
    if (!passed) {
      throw new Error('waitForFunction predicate failed');
    }
  }
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

  async exposeFunction(name: string, fn: (...args: any[]) => any): Promise<void> {
    this.operations.push(`exposeFunction:${name}`);
    this.browserGlobals[name] = fn;
  }

  on(event: string, handler: ((payload: IRequest) => void | Promise<void>) | ((payload: IFrame) => void | Promise<void>) | (() => void | Promise<void>)): DisposableHandle {
    const handlers = this.listeners.get(event) ?? [];
    handlers.push(handler as (...args: any[]) => void | Promise<void>);
    this.listeners.set(event, handlers);

    return {
      dispose: () => {
        this.off(event, handler as (...args: any[]) => void | Promise<void>);
      },
    };
  }

  off(event: string, handler: ((payload: IRequest) => void | Promise<void>) | ((payload: IFrame) => void | Promise<void>) | (() => void | Promise<void>)): void {
    const handlers = this.listeners.get(event) ?? [];
    this.listeners.set(event, handlers.filter((registered) => registered !== handler));
  }

  async close(): Promise<void> {}
  isClosed(): boolean {
    return false;
  }
  unwrap(): unknown {
    return this;
  }

  async emit(event: string, payload?: unknown): Promise<void> {
    const handlers = [...(this.listeners.get(event) ?? [])];
    await Promise.all(handlers.map((handler) => Promise.resolve(handler(payload as never))));
  }

  async emitRuntime(channel: RuntimeChannel, payload: unknown): Promise<void> {
    const callbacks = [...(this.runtimeCallbacks[channel] ?? [])];
    await Promise.all(callbacks.map((callback) => Promise.resolve(callback(payload))));
  }

  dropRuntime(): void {
    this.browserGlobals.WAPI = undefined;
    this.browserGlobals.Store = undefined;
    this.runtimeCallbacks.message = [];
    this.runtimeCallbacks.ack = [];
    this.runtimeCallbacks.state = [];
    this.runtimeCallbacks.addedToGroup = [];
  }

  replaceRuntime(): void {
    this.runtimeCallbacks.message = [];
    this.runtimeCallbacks.ack = [];
    this.runtimeCallbacks.state = [];
    this.runtimeCallbacks.addedToGroup = [];
    this.browserGlobals.WAPI = {
      onAnyMessage: this.wapiRegisterSpies.onAnyMessage,
      onAck: this.wapiRegisterSpies.onAck,
      onStateChanged: this.wapiRegisterSpies.onStateChanged,
      onAddedToGroup: this.wapiRegisterSpies.onAddedToGroup,
    };
  }

  private restoreRuntime(): void {
    if (!this.browserGlobals.WAPI) {
      this.browserGlobals.WAPI = {
        onAnyMessage: this.wapiRegisterSpies.onAnyMessage,
        onAck: this.wapiRegisterSpies.onAck,
        onStateChanged: this.wapiRegisterSpies.onStateChanged,
        onAddedToGroup: this.wapiRegisterSpies.onAddedToGroup,
      };
    }

    if (!this.browserGlobals.Store) {
      this.browserGlobals.Store = { Msg: {} };
    }
  }

  private evaluateBooleanScript(script: string): boolean {
    const evaluator = new Function(
      'window',
      'document',
      'Store',
      'WAPI',
      'isSessionLoaded',
      'WA_AUTHENTICATED',
      `return (${script});`,
    );

    return Boolean(evaluator(
      this.browserGlobals,
      this.browserGlobals.document,
      this.browserGlobals.Store,
      this.browserGlobals.WAPI,
      this.browserGlobals.isSessionLoaded,
      this.browserGlobals.WA_AUTHENTICATED,
    ));
  }

  private installRuntimeReplacementObserver(): void {
    let currentValue = this.browserGlobals.WAPI;

    Object.defineProperty(this.browserGlobals, 'WAPI', {
      configurable: true,
      enumerable: true,
      get: () => currentValue,
      set: (value) => {
        const previous = currentValue;
        currentValue = value;

        if (previous && value && previous !== value) {
          void Promise.resolve(this.browserGlobals.OpenWA_RuntimeReplacementDetected?.({ reason: 'runtime_replaced' }));
        }
      },
    });
  }
}

class FakeBrowser implements IBrowser {
  readonly name = 'fake-driver';

  constructor(private readonly page: RuntimeBridgePage) {}

  async newPage(): Promise<IPage> {
    return this.page;
  }

  async pages(): Promise<IPage[]> {
    return [this.page];
  }

  async close(): Promise<void> {}
  isConnected(): boolean {
    return true;
  }
  async versionString(): Promise<string> {
    return 'fake-browser';
  }
  unwrap(): unknown {
    return this;
  }
}

class FakeDriver implements IDriver {
  readonly name = 'fake-driver';

  constructor(private readonly browser: FakeBrowser) {}

  async init(): Promise<void> {}
  async launch(): Promise<IBrowser> {
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

describe('Transport runtime event bridge', () => {
  it('maps browser runtime callbacks onto core events and avoids duplicate setup in the same generation', async () => {
    const page = new RuntimeBridgePage();
    const events = new HyperEmitter<OpenWAEventMap>({ delimiter: '.', captureRejections: true });
    const transport = new Transport({
      driver: new FakeDriver(new FakeBrowser(page)),
      events,
      logger: createLogger(),
      headless: true,
      blockCrashLogs: false,
      blockAssets: false,
    });

    const emitted: Record<string, unknown[]> = {
      'message.received': [],
      'message.any': [],
      'ack.changed': [],
      'session.state.changed': [],
      'session.logout': [],
    };

    for (const eventName of Object.keys(emitted) as Array<keyof typeof emitted>) {
      events.on(eventName as keyof OpenWAEventMap, (payload) => {
        emitted[eventName].push(payload);
      });
    }

    await transport.initialize();
    await transport.injectWapi();
    await transport.injectWapi();

    expect(page.wapiRegisterSpies.onAnyMessage).toHaveBeenCalledTimes(2);
    expect(page.wapiRegisterSpies.onAck).toHaveBeenCalledTimes(1);
    expect(page.wapiRegisterSpies.onStateChanged).toHaveBeenCalledTimes(1);

    await page.emitRuntime('message', { id: 'msg_1', body: 'hello' });
    await page.emitRuntime('ack', { id: 'ack_1', chatId: '123@c.us', ack: 2 });
    await page.emitRuntime('state', 'READY');
    await page.emit('framenavigated', new FakeFrame(true, 'https://web.whatsapp.com/?post_logout=1'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(emitted['message.received']).toHaveLength(1);
    expect(emitted['message.any']).toHaveLength(1);
    expect(emitted['ack.changed']).toHaveLength(1);
    expect(emitted['session.state.changed']).toHaveLength(1);
    expect(emitted['session.logout']).toHaveLength(1);

    expect(emitted['message.received'][0]).toMatchObject({ message: { id: 'msg_1', body: 'hello' } });
    expect(emitted['ack.changed'][0]).toMatchObject({ ack: { id: 'ack_1', ack: 2 } });
    expect(emitted['session.state.changed'][0]).toMatchObject({ details: { next: 'READY' } });
    expect(emitted['session.logout'][0]).toMatchObject({ details: { reason: 'post_logout=1' } });
  });

  it('reinjects once for main-frame runtime loss, ignores iframe-only navigation, and uses waitForFunction probes', async () => {
    const page = new RuntimeBridgePage();
    const transport = new Transport({
      driver: new FakeDriver(new FakeBrowser(page)),
      events: new HyperEmitter<OpenWAEventMap>({ delimiter: '.', captureRejections: true }),
      logger: createLogger(),
      headless: true,
      blockCrashLogs: false,
      blockAssets: false,
    });

    await transport.initialize();
    await transport.injectWapi();

    const evaluateCountBeforeRecovery = page.operations.filter((operation) => operation === 'evaluateScript').length;

    page.dropRuntime();
    await page.emit('framenavigated', new FakeFrame(false, 'https://web.whatsapp.com/iframe'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(page.operations.filter((operation) => operation === 'evaluateScript')).toHaveLength(evaluateCountBeforeRecovery);

    await page.emit('framenavigated', new FakeFrame(true, 'https://web.whatsapp.com/?reload=1'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(page.operations.filter((operation) => operation === 'evaluateScript').length).toBeGreaterThan(evaluateCountBeforeRecovery);
    expect(page.waitForFunctionCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('document.readyState'),
      expect.stringContaining('window.WAPI'),
    ]));
    expect(page.wapiRegisterSpies.onAnyMessage).toHaveBeenCalledTimes(4);
    expect(page.wapiRegisterSpies.onAck).toHaveBeenCalledTimes(2);
    expect(page.wapiRegisterSpies.onStateChanged).toHaveBeenCalledTimes(2);
    expect(page.browserGlobals.WAPI).toBeTruthy();
    expect(page.browserGlobals.Store?.Msg).toBeTruthy();
  });

  it('drops stale navigation recoveries so overlapping main-frame navigations only reinject once for the latest generation', async () => {
    const page = new RuntimeBridgePage();
    const transport = new Transport({
      driver: new FakeDriver(new FakeBrowser(page)),
      events: new HyperEmitter<OpenWAEventMap>({ delimiter: '.', captureRejections: true }),
      logger: createLogger(),
      headless: true,
      blockCrashLogs: false,
      blockAssets: false,
    });

    await transport.initialize();
    await transport.injectWapi();

    const evaluateCountBeforeRecovery = page.operations.filter((operation) => operation === 'evaluateScript').length;

    page.dropRuntime();
    await Promise.all([
      page.emit('framenavigated', new FakeFrame(true, 'https://web.whatsapp.com/?nav=1')),
      page.emit('framenavigated', new FakeFrame(true, 'https://web.whatsapp.com/?nav=2')),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(page.operations.filter((operation) => operation === 'evaluateScript').length).toBeGreaterThan(evaluateCountBeforeRecovery);
    expect(page.wapiRegisterSpies.onAnyMessage).toHaveBeenCalledTimes(4);
    expect(page.wapiRegisterSpies.onAck).toHaveBeenCalledTimes(2);
    expect(page.wapiRegisterSpies.onStateChanged).toHaveBeenCalledTimes(2);
  });

  it('routes in-place runtime replacement through the same queued recovery path', async () => {
    const page = new RuntimeBridgePage();
    const transport = new Transport({
      driver: new FakeDriver(new FakeBrowser(page)),
      events: new HyperEmitter<OpenWAEventMap>({ delimiter: '.', captureRejections: true }),
      logger: createLogger(),
      headless: true,
      blockCrashLogs: false,
      blockAssets: false,
    });

    await transport.initialize();
    await transport.injectWapi();

    const evaluateCountBeforeRecovery = page.operations.filter((operation) => operation === 'evaluateScript').length;

    page.replaceRuntime();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(page.operations.filter((operation) => operation === 'evaluateScript').length).toBeGreaterThan(evaluateCountBeforeRecovery);
    expect(page.wapiRegisterSpies.onAnyMessage).toHaveBeenCalledTimes(4);
    expect(page.wapiRegisterSpies.onAck).toHaveBeenCalledTimes(2);
    expect(page.wapiRegisterSpies.onStateChanged).toHaveBeenCalledTimes(2);
    expect(page.waitForFunctionCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('document.readyState'),
    ]));
  });
});
