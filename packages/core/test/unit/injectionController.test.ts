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
import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { OpenWAEventMap } from '../../src/events/eventMap.js';
import { InjectionController } from '../../src/transport/InjectionController.js';
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
  constructor(private readonly mainFrame: boolean) {}

  url(): string {
    return 'https://web.whatsapp.com';
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

class RecordingPage implements IPage {
  readonly name = 'fake-driver';
  readonly operations: string[] = [];
  private readonly listeners = new Map<string, Array<(...args: any[]) => void | Promise<void>>>();
  private currentUrl = 'about:blank';

  async goto(url: string): Promise<void> {
    this.operations.push(`goto:${url}`);
    this.currentUrl = url;
  }

  url(): string {
    return this.currentUrl;
  }

  async reload(): Promise<void> {
    this.operations.push('reload');
  }

  mainFrame(): IFrame | null {
    return new FakeFrame(true);
  }

  async evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret> {
    return fn(arg);
  }

  async evaluateScript<Ret = unknown>(_script: string): Promise<Ret> {
    this.operations.push('evaluateScript');
    return undefined as Ret;
  }

  async addInitScript(script: string): Promise<DisposableHandle> {
    this.operations.push(`addInitScript:${script.length}`);
    return {
      dispose: () => {
        this.operations.push('disposeInitScript');
      },
    };
  }

  async setViewport(_viewport: { width: number; height: number }): Promise<void> {}

  async setUserAgent(_ua: string): Promise<void> {
    this.operations.push('setUserAgent');
  }

  async setRequestInterception(_enabled: boolean): Promise<void> {
    this.operations.push('setRequestInterception');
  }

  async waitForSelector(_selector: string): Promise<IElementHandle | null> {
    return new FakeElementHandle();
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

  async exposeFunction(name: string, _fn: (...args: any[]) => any): Promise<void> {
    this.operations.push(`exposeFunction:${name}`);
  }

  on(event: string, handler: ((payload: IRequest) => void | Promise<void>) | ((payload: IFrame) => void | Promise<void>) | (() => void | Promise<void>)): DisposableHandle {
    const handlers = this.listeners.get(event) ?? [];
    handlers.push(handler as (...args: any[]) => void | Promise<void>);
    this.listeners.set(event, handlers);
    this.operations.push(`on:${event}`);

    return {
      dispose: () => {
        this.operations.push(`dispose:${event}`);
        this.off(event, handler as (...args: any[]) => void | Promise<void>);
      },
    };
  }

  off(event: string, handler: ((payload: IRequest) => void | Promise<void>) | ((payload: IFrame) => void | Promise<void>) | (() => void | Promise<void>)): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    const nextHandlers = handlers.filter((registered) => registered !== handler);
    this.listeners.set(event, nextHandlers);
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
}

class RuntimeBridgeRecordingPage implements IPage {
  readonly name = 'fake-driver';
  readonly listeners = new Map<string, Array<(...args: any[]) => void | Promise<void>>>();
  readonly browserGlobals: Record<string, any>;
  readonly registerMessageBridge = vi.fn((callback: (payload: unknown) => unknown) => {
    this.messageCallbacks.push(callback);

    return {
      dispose: () => {
        this.disposedMessageListeners += 1;
        this.messageCallbacks = this.messageCallbacks.filter((registered) => registered !== callback);
      },
    };
  });
  messageCallbacks: Array<(payload: unknown) => unknown> = [];
  disposedMessageListeners = 0;
  private currentUrl = 'about:blank';

  constructor() {
    this.browserGlobals = {
      WAPI: {
        onAnyMessage: this.registerMessageBridge,
      },
      Store: { Msg: {} },
      document: {
        querySelector: (selector: string) => (selector === '#pane-side' ? {} : null),
      },
      isSessionLoaded: () => true,
      WA_AUTHENTICATED: true,
      __OPENWA_RUNTIME_BRIDGE__: undefined,
    };
  }

  async goto(url: string): Promise<void> {
    this.currentUrl = url;
  }

  url(): string {
    return this.currentUrl;
  }

  async reload(): Promise<void> {}

  mainFrame(): IFrame | null {
    return new FakeFrame(true);
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
    return undefined as Ret;
  }

  async addInitScript(_script: string): Promise<DisposableHandle> {
    return {
      dispose: () => undefined,
    };
  }

  async setViewport(_viewport: { width: number; height: number }): Promise<void> {}
  async setUserAgent(_ua: string): Promise<void> {}
  async setRequestInterception(_enabled: boolean): Promise<void> {}
  async waitForSelector(_selector: string): Promise<IElementHandle | null> {
    return new FakeElementHandle();
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

  async exposeFunction(name: string, fn: (...args: any[]) => any): Promise<void> {
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

  async emitRuntimeMessage(payload: unknown): Promise<void> {
    const callbacks = [...this.messageCallbacks];
    await Promise.all(callbacks.map((callback) => Promise.resolve(callback(payload))));
  }

  replaceRuntime(): void {
    this.messageCallbacks = [];
    this.browserGlobals.WAPI = {
      onAnyMessage: this.registerMessageBridge,
    };
  }
}

class RecordingBrowser implements IBrowser {
  readonly name = 'fake-driver';

  constructor(private readonly page: RecordingPage) {}

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

class RecordingDriver implements IDriver {
  readonly name = 'fake-driver';

  constructor(private readonly browser: RecordingBrowser) {}

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

describe('InjectionController', () => {
  it('fences stale document generations after main-frame navigation', async () => {
    const page = new RecordingPage();
    const controller = new InjectionController(createLogger());

    await controller.registerPersistentBinding('ProgressBarEvent', vi.fn(), { required: true });
    await controller.registerPersistentInitScript('prog_observer', 'window.ProgressBarEvent?.({ value: 1 });', { required: true });
    await controller.initialize(page);

    const initialGeneration = controller.captureGenerationSnapshot();
    expect(controller.getHealthSnapshot().phase).toBe('preload_registered');

    await page.emit('framenavigated', new FakeFrame(true));
    await controller.enqueue(async () => undefined);

    const nextHealth = controller.getHealthSnapshot();
    expect(controller.isCurrentGeneration(initialGeneration)).toBe(false);
    expect(nextHealth.generation.browserContextId).toBe(initialGeneration.browserContextId);
    expect(nextHealth.generation.documentId).not.toBe(initialGeneration.documentId);
    expect(nextHealth.phase).toBe('document_observed');
  });

  it('keeps page-side runtime bridge binding idempotent within the same runtime generation', async () => {
    const page = new RuntimeBridgeRecordingPage();
    const handler = vi.fn();
    const controller = new InjectionController(createLogger());

    await controller.registerRuntimeWapiBridge(
      'message.received',
      'OpenWA_RuntimeMessageReceived',
      handler,
      { wapiMethod: 'onAnyMessage', required: true },
    );
    await controller.initialize(page);

    await controller.ensureRuntimeBridge();
    await controller.ensureRuntimeBridge();
    await page.emitRuntimeMessage({ id: 'msg_1' });

    expect(page.registerMessageBridge).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(page.messageCallbacks).toHaveLength(1);
    expect(page.browserGlobals.__OPENWA_RUNTIME_BRIDGE__).toMatchObject({
      runtimeId: controller.getHealthSnapshot().generation.runtimeId,
    });
    expect(Object.keys(page.browserGlobals.__OPENWA_RUNTIME_BRIDGE__.listeners)).toEqual(['message.received']);
  });

  it('disposes page-side runtime listeners on runtime rollover and rebinds cleanly', async () => {
    const page = new RuntimeBridgeRecordingPage();
    const handler = vi.fn();
    const controller = new InjectionController(createLogger());

    await controller.registerRuntimeWapiBridge(
      'message.received',
      'OpenWA_RuntimeMessageReceived',
      handler,
      { wapiMethod: 'onAnyMessage', required: true },
    );
    await controller.initialize(page);

    await controller.ensureRuntimeBridge();
    const firstRuntimeId = controller.getHealthSnapshot().generation.runtimeId;
    await page.emitRuntimeMessage({ id: 'before_rollover' });

    const rolloverGeneration = await controller.rolloverRuntimeGeneration();
    page.replaceRuntime();
    await controller.ensureRuntimeBridge();
    await page.emitRuntimeMessage({ id: 'after_rollover' });

    expect(rolloverGeneration.runtimeId).not.toBe(firstRuntimeId);
    expect(page.disposedMessageListeners).toBe(1);
    expect(page.registerMessageBridge).toHaveBeenCalledTimes(2);
    expect(page.messageCallbacks).toHaveLength(1);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(page.browserGlobals.__OPENWA_RUNTIME_BRIDGE__).toMatchObject({
      runtimeId: rolloverGeneration.runtimeId,
      lastResetReason: expect.stringContaining('runtime_cleanup:'),
    });
  });

  it('resets page-side bridge ownership when the runtime object is replaced in-place', async () => {
    const page = new RuntimeBridgeRecordingPage();
    const handler = vi.fn();
    const controller = new InjectionController(createLogger());

    await controller.registerRuntimeWapiBridge(
      'message.received',
      'OpenWA_RuntimeMessageReceived',
      handler,
      { wapiMethod: 'onAnyMessage', required: true },
    );
    await controller.initialize(page);

    await controller.ensureRuntimeBridge();
    page.replaceRuntime();
    await controller.ensureRuntimeBridge();
    await page.emitRuntimeMessage({ id: 'replacement_runtime' });

    expect(page.disposedMessageListeners).toBe(1);
    expect(page.registerMessageBridge).toHaveBeenCalledTimes(2);
    expect(page.messageCallbacks).toHaveLength(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(page.browserGlobals.__OPENWA_RUNTIME_BRIDGE__).toMatchObject({
      runtimeId: controller.getHealthSnapshot().generation.runtimeId,
      lastResetReason: 'runtime_replaced',
    });
  });
});

describe('Transport injection controller bootstrap order', () => {
  it('registers persistent bindings and init scripts after navigation completes', async () => {
    const page = new RecordingPage();
    const transport = new Transport({
      driver: new RecordingDriver(new RecordingBrowser(page)),
      events: { emit: vi.fn() } as unknown as HyperEmitter<OpenWAEventMap>,
      logger: createLogger(),
      headless: true,
      blockCrashLogs: false,
      blockAssets: false,
    });

    await transport.initialize();
    await transport.navigate();

    const progressBindingIndex = page.operations.indexOf('exposeFunction:ProgressBarEvent');
    const criticalBindingIndex = page.operations.indexOf('exposeFunction:CriticalInternalMessage');
    const preloadIndex = page.operations.findIndex((operation) => operation.startsWith('addInitScript:'));
    const navigationIndex = page.operations.findIndex((operation) => operation.startsWith('goto:https://web.whatsapp.com'));

    expect(progressBindingIndex).toBeGreaterThan(-1);
    expect(criticalBindingIndex).toBeGreaterThan(-1);
    expect(preloadIndex).toBeGreaterThan(-1);
    expect(navigationIndex).toBeGreaterThan(-1);
    expect(progressBindingIndex).toBeGreaterThan(navigationIndex);
    expect(criticalBindingIndex).toBeGreaterThan(navigationIndex);
    expect(preloadIndex).toBeGreaterThan(navigationIndex);
    expect(page.operations).not.toContain('evaluateScript');
  });
});
