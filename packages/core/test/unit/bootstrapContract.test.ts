import { afterEach, describe, expect, it, vi } from 'vitest';
import { createClient, type OpenWAClient } from '../../src/createClient.js';
import { Transport, type PatchFetchConfig } from '../../src/transport/Transport.js';
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
import type { OpenWAEventMap } from '../../src/events/eventMap.js';

type RecordedEvent = {
  name: keyof OpenWAEventMap | string;
  payload: unknown;
};

type StartResult =
  | { status: 'resolved' }
  | { status: 'rejected'; error: unknown };

type HarnessOptions = {
  qrCode?: string | null;
  qrCodes?: Array<string | null>;
  runtimeAvailable?: boolean;
  runtimeMethods?: string[];
  storeMsgAvailable?: boolean;
  sessionLoaded?: boolean;
  invalidSession?: boolean;
  phoneOutOfReach?: boolean;
  linkCode?: string;
  generatedLinkCode?: string | null;
  authenticateOnLinkCodeRequest?: boolean;
  qrMax?: number;
  ignoreNuke?: boolean;
  authTimeoutMs?: number;
  oorTimeoutMs?: number;
  qrPollingMs?: number;
  licenseKey?: string | Record<string, string | undefined> | ((sessionId: string) => Promise<string | null | undefined> | string | null | undefined);
  licenseApplyFails?: boolean;
  initPatchFails?: boolean;
  patchConfig?: PatchFetchConfig;
};

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

class FakePage implements IPage {
  readonly name = 'fake-driver';
  private static readonly defaultRuntimeMethods = [
    'onAnyMessage',
    'onAck',
    'onStateChanged',
    'onAddedToGroup',
  ];
  private currentUrl = 'about:blank';
  private closed = false;
  private qrCode: string | null;
  private qrCodes: Array<string | null>;
  private runtimeAvailable: boolean;
  private runtimeMethods = new Set<string>();
  private storeMsgAvailable: boolean;
  private sessionLoaded: boolean;
  private invalidSession: boolean;
  private phoneOutOfReach: boolean;
  private readonly configuredLinkCode?: string;
  private readonly generatedLinkCode: string | null;
  private readonly authenticateOnLinkCodeRequest: boolean;
  private keyType: string | false = false;
  private launchError: string | null = null;
  private readonly licenseApplyFails: boolean;
  private readonly initPatchFails: boolean;
  private wapiAssetInjected = false;
  private recoverRuntimeOnNextLaunchInjection = false;
  private recoverRuntimeMethodsOnNextLaunchInjection: string[] | null = null;
  private launchInjectionCount = 0;
  private runtimeBridgeState: Record<string, unknown> | undefined;
  private browserGlobals: Record<string, any> = {};

  constructor(options: HarnessOptions = {}) {
    this.qrCode = options.qrCode === undefined ? 'contract-qr' : options.qrCode;
    this.qrCodes = [...(options.qrCodes ?? [])];
    this.runtimeAvailable = options.runtimeAvailable ?? false;
    this.runtimeMethods = new Set(options.runtimeMethods ?? FakePage.defaultRuntimeMethods);
    this.storeMsgAvailable = options.storeMsgAvailable ?? false;
    this.sessionLoaded = options.sessionLoaded ?? false;
    this.invalidSession = options.invalidSession ?? false;
    this.phoneOutOfReach = options.phoneOutOfReach ?? false;
    this.configuredLinkCode = options.linkCode;
    this.generatedLinkCode = options.generatedLinkCode ?? 'ABC-1234';
    this.authenticateOnLinkCodeRequest = options.authenticateOnLinkCodeRequest ?? false;
    this.licenseApplyFails = options.licenseApplyFails ?? false;
    this.initPatchFails = options.initPatchFails ?? false;
    this.refreshBrowserGlobals();
  }

  setRuntimeAvailable(value: boolean): void {
    this.runtimeAvailable = value;
    this.refreshBrowserGlobals();
  }

  setRuntimeMethods(methods: string[]): void {
    this.runtimeMethods = new Set(methods);
    this.refreshBrowserGlobals();
  }

  setStoreMsgAvailable(value: boolean): void {
    this.storeMsgAvailable = value;
    this.refreshBrowserGlobals();
  }

  setSessionLoaded(value: boolean): void {
    this.sessionLoaded = value;
    this.refreshBrowserGlobals();
  }

  setRecoverRuntimeOnNextLaunchInjection(value: boolean): void {
    this.recoverRuntimeOnNextLaunchInjection = value;
  }

  setRecoverRuntimeMethodsOnNextLaunchInjection(methods: string[] | null): void {
    this.recoverRuntimeMethodsOnNextLaunchInjection = methods;
  }

  isRuntimeAvailable(): boolean {
    return this.runtimeAvailable;
  }

  getLaunchInjectionCount(): number {
    return this.launchInjectionCount;
  }

  mainFrame(): IFrame | null {
    return null;
  }

  async goto(url: string): Promise<void> {
    this.currentUrl = url;
  }

  url(): string {
    return this.currentUrl;
  }

  async reload(): Promise<void> {}

  async evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret> {
    const root = globalThis as Record<string, any>;
    const originalWindow = root.window;
    const originalValues = new Map<string, unknown>();
    this.refreshBrowserGlobals();
    const keys = new Set(Object.keys(this.browserGlobals));

    for (const key of keys) {
      originalValues.set(key, root[key]);
      root[key] = this.browserGlobals[key];
    }

    root.window = root;

    try {
      const result = await fn(arg);
      this.runtimeBridgeState = root.__OPENWA_RUNTIME_BRIDGE__;
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

  async evaluateScript<Ret = unknown>(script: string): Promise<Ret> {
    if (script.includes('window.WAPI = {}')) {
      this.wapiAssetInjected = true;
      return undefined as Ret;
    }

    if (script.includes('function _0x7aa3')) {
      if (!this.wapiAssetInjected) {
        throw new ReferenceError('WAPI is not defined');
      }

      this.launchInjectionCount += 1;

      if (this.recoverRuntimeOnNextLaunchInjection) {
        this.runtimeAvailable = true;
        this.storeMsgAvailable = true;
        if (this.recoverRuntimeMethodsOnNextLaunchInjection) {
          this.runtimeMethods = new Set(this.recoverRuntimeMethodsOnNextLaunchInjection);
          this.recoverRuntimeMethodsOnNextLaunchInjection = null;
        }
        this.recoverRuntimeOnNextLaunchInjection = false;
        this.refreshBrowserGlobals();
      }

      return undefined as Ret;
    }

    if (script.includes('function _0x264f1c')) {
      if (this.initPatchFails) {
        throw new Error('simulated init patch failure');
      }

      return undefined as Ret;
    }

    if (script.includes('canvas[aria-label]')) {
      if (this.qrCodes.length > 0) {
        const nextQr = this.qrCodes.length > 1 ? this.qrCodes.shift() ?? null : this.qrCodes[0] ?? null;
        this.qrCode = nextQr;
      }

      return this.qrCode as Ret;
    }

    if (script.includes('old-logout-cred')) {
      return this.invalidSession as Ret;
    }

    if (script.includes('Trying to reach phone')) {
      return this.phoneOutOfReach as Ret;
    }

    if (script.includes('window.linkCode(')) {
      if (!this.configuredLinkCode || !this.generatedLinkCode) {
        return null as Ret;
      }

      if (this.authenticateOnLinkCodeRequest) {
        this.sessionLoaded = true;
        this.runtimeAvailable = true;
        this.storeMsgAvailable = true;
        this.refreshBrowserGlobals();
      }

      return this.generatedLinkCode as Ret;
    }

    if (script.includes('typeof window.linkCode')) {
      return Boolean(this.configuredLinkCode && this.generatedLinkCode) as Ret;
    }

    if (script.includes('window.WAPI') || script.includes('WAPI.')) {
      return this.runtimeAvailable as Ret;
    }

    if (script.includes('window.Store.Msg') || script.includes('Store.Msg')) {
      return this.storeMsgAvailable as Ret;
    }

    if (script.includes('isSessionLoaded')) {
      return this.sessionLoaded as Ret;
    }

    if (script.includes('window.__OPENWA_LICENSE__')) {
      if (this.licenseApplyFails) {
        this.launchError = 'simulated license injection failure';
        this.keyType = false;
        return false as Ret;
      }

      const keyTypeMatch = script.match(/window\.KEYTYPE = "([^"]+)"/);
      this.keyType = keyTypeMatch?.[1] ?? 'license';
      this.launchError = null;
      return true as Ret;
    }

    if (script.includes('window.KEYTYPE')) {
      return this.keyType as Ret;
    }

    if (script.includes('window.launchError')) {
      return this.launchError as Ret;
    }

    return undefined as Ret;
  }

  async addInitScript(_script: string): Promise<DisposableHandle> {
    return {
      dispose(): void {},
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

  on(_event: string, _handler: ((payload: IRequest) => void | Promise<void>) | (() => void | Promise<void>)): DisposableHandle {
    return {
      dispose(): void {},
    };
  }

  off(_event: string, _handler: ((payload: IRequest) => void | Promise<void>) | (() => void | Promise<void>)): void {}

  async close(): Promise<void> {
    this.closed = true;
  }

  isClosed(): boolean {
    return this.closed;
  }

  unwrap(): unknown {
    return this;
  }

  private refreshBrowserGlobals(): void {
    const document = {
      querySelector: (selector: string) => {
        if (selector === 'body') {
          return { innerText: this.phoneOutOfReach ? 'Trying to reach phone' : '' };
        }

        if (!this.sessionLoaded) {
          return null;
        }

        return ['#pane-side', '[data-testid="chat-list-search"]', '[aria-label="Search or start a new chat"]'].includes(selector)
          ? {}
          : null;
      },
    };

    const wapi = this.runtimeAvailable
      ? Object.fromEntries(
          [...this.runtimeMethods].map((methodName) => [
            methodName,
            (..._args: unknown[]) => ({ dispose: () => undefined }),
          ])
        )
      : undefined;

    this.browserGlobals = {
      ...this.browserGlobals,
      WAPI: wapi,
      Store: this.storeMsgAvailable ? { Msg: {} } : undefined,
      document,
      isSessionLoaded: () => this.sessionLoaded,
      WA_AUTHENTICATED: this.sessionLoaded,
      __OPENWA_RUNTIME_BRIDGE__: this.runtimeBridgeState,
    };
  }
}

class FakeBrowser implements IBrowser {
  readonly name = 'fake-driver';

  constructor(private readonly page: FakePage) {}

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

function captureEvents(client: OpenWAClient): RecordedEvent[] {
  const recorded: RecordedEvent[] = [];
  const originalEmit = client.events.emit.bind(client.events);

  vi.spyOn(client.events, 'emit').mockImplementation(((eventName: keyof OpenWAEventMap, payload: unknown) => {
    recorded.push({ name: eventName, payload });
    return originalEmit(eventName, payload as never);
  }) as typeof client.events.emit);

  return recorded;
}

async function createHarness(options: HarnessOptions = {}): Promise<{
  client: OpenWAClient;
  page: FakePage;
  recordedEvents: RecordedEvent[];
}> {
  const page = new FakePage(options);
  const driver = new FakeDriver(new FakeBrowser(page));
  const client = await createClient({
    driver,
    sessionId: 'bootstrap-contract',
    headless: true,
    qrTimeoutMs: 10,
    authTimeoutMs: options.authTimeoutMs,
    oorTimeoutMs: options.oorTimeoutMs,
    linkCode: options.linkCode,
    qrMax: options.qrMax,
    ignoreNuke: options.ignoreNuke,
    licenseKey: options.licenseKey,
    patchConfig: options.patchConfig,
  });

  if (options.qrPollingMs != null) {
    (client.getTransport() as unknown as { qrPollingMs: number }).qrPollingMs = options.qrPollingMs;
  }

  const recordedEvents = captureEvents(client);

  return { client, page, recordedEvents };
}

async function settleStart(client: OpenWAClient): Promise<StartResult> {
  try {
    await client.start();
    return { status: 'resolved' };
  } catch (error) {
    return { status: 'rejected', error };
  }
}

function findEventIndex(recordedEvents: RecordedEvent[], eventName: string): number {
  return recordedEvents.findIndex((event) => event.name === eventName);
}

function findFirstOf(recordedEvents: RecordedEvent[], eventNames: string[]): number {
  return recordedEvents.findIndex((event) => eventNames.includes(String(event.name)));
}

function requireBlockedReady(recordedEvents: RecordedEvent[], reason: string): void {
  if (findEventIndex(recordedEvents, 'client.ready') !== -1) {
    throw new Error(reason);
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('bootstrap contract harness', () => {
  it('Phase D: blocks readiness until runtime injection proves usable capability', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: false,
      storeMsgAvailable: false,
      sessionLoaded: false,
    });

    const startResult = await settleStart(client);

    requireBlockedReady(
      recordedEvents,
      'Section 27.D/27.G requires client.ready to stay blocked until runtime injection proves usable capability, but the active path emitted client.ready even though the fake page never exposed WAPI/runtime capability.'
    );

    if (startResult.status !== 'rejected') {
      throw new Error(
        'Section 27.D requires bootstrap to fail or remain blocked when runtime capability is absent after injection, but start() resolved successfully on a page with no runtime capability.'
      );
    }

    expect(client.getReadiness()).toMatchObject({
      ready: false,
      status: 'blocked',
      blockers: ['runtimeUsable'],
    });

    await client.stop('phase_d_cleanup');
  });

  it('Phase E: emits distinct patch and license overlay lifecycle before readiness', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: true,
      licenseKey: 'community-valid-license',
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'resolved') {
      throw new Error(`Expected happy-path bootstrap fixture to resolve, but it rejected with: ${String(startResult.error)}`);
    }

    const readyIndex = findEventIndex(recordedEvents, 'client.ready');
    if (readyIndex === -1) {
      throw new Error('Expected happy-path bootstrap fixture to emit client.ready so the overlay ordering contract could be evaluated.');
    }

    const patchLifecycleIndex = findFirstOf(recordedEvents, [
      'launch.patch.init.before',
      'launch.patch.init.after',
      'patch.init.before',
      'patch.init.after',
      'patch.apply.before',
      'patch.apply.after',
    ]);
    if (patchLifecycleIndex === -1 || patchLifecycleIndex > readyIndex) {
      throw new Error(
        'Section 27.E requires a distinct live patch lifecycle before readiness, but no patch lifecycle event was observed before client.ready.'
      );
    }

    const licenseLifecycleIndex = findFirstOf(recordedEvents, [
      'launch.license.preload.before',
      'launch.license.preload.after',
      'launch.license.check.before',
      'launch.license.check.after',
      'license.check.before',
      'license.check.after',
      'license.inject.before',
      'license.inject.after',
    ]);
    if (licenseLifecycleIndex === -1 || licenseLifecycleIndex > readyIndex) {
      throw new Error(
        'Section 27.E requires a distinct license overlay lifecycle before readiness, but no license lifecycle event was observed before client.ready.'
      );
    }

    const licenseApplyIndex = findFirstOf(recordedEvents, ['license.inject.after']);
    if (licenseApplyIndex === -1 || licenseApplyIndex > readyIndex) {
      throw new Error(
        'Section 27.E requires the real license overlay path to reach apply/inject before readiness when a license is present, but no license.inject.after event was observed before client.ready.'
      );
    }

    await client.stop('phase_e_cleanup');
  });

  it('Phase D/E: runtime activation remains package-safe when process.cwd changes', async () => {
    const originalCwd = process.cwd();
    process.chdir('/tmp');

    let client: OpenWAClient | undefined;

    try {
      const harness = await createHarness({
        runtimeAvailable: true,
        storeMsgAvailable: true,
        sessionLoaded: true,
      });
      client = harness.client;

      const startResult = await settleStart(client);
      if (startResult.status !== 'resolved') {
        throw new Error(`Expected bootstrap to remain package-safe after cwd change, but it rejected with: ${String(startResult.error)}`);
      }

      expect(client.getReadiness()).toMatchObject({
        ready: true,
        status: 'ready',
      });
    } finally {
      process.chdir(originalCwd);
      if (client) {
        await client.stop('phase_d_package_safe_cleanup');
      }
    }
  });

  it('Phase E: missing license stays observable and explicitly non-blocking for readiness', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: true,
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'resolved') {
      throw new Error(`Expected missing-license bootstrap fixture to resolve, but it rejected with: ${String(startResult.error)}`);
    }

    const licenseCheckEvent = recordedEvents.find((event) => event.name === 'launch.license.check.after');
    if (!licenseCheckEvent) {
      throw new Error('Expected missing-license path to emit launch.license.check.after so readiness policy stays observable.');
    }

    const payload = licenseCheckEvent.payload as { details?: { status?: string } } | undefined;
    expect(payload?.details?.status).toBe('missing');

    const readyIndex = findEventIndex(recordedEvents, 'client.ready');
    expect(readyIndex).toBeGreaterThan(-1);
    expect(recordedEvents.filter((event) => event.name === 'client.ready')).toHaveLength(1);
    expect(recordedEvents.filter((event) => event.name === 'core.started')).toHaveLength(1);

    await client.stop('phase_e_missing_license_cleanup');
  });

  it('Phase E: invalid license classification blocks readiness before finalization', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: true,
      licenseKey: 'invalid-demo-license',
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'rejected') {
      throw new Error('Expected invalid-license bootstrap fixture to reject, but start() resolved.');
    }

    requireBlockedReady(
      recordedEvents,
      'Section 27.E/27.G requires invalid license outcomes to block readiness explicitly, but client.ready still emitted after invalid license classification.'
    );

    const invalidCheckIndex = recordedEvents.findIndex((event) => {
      if (event.name !== 'launch.license.check.after') return false;
      const payload = event.payload as { details?: { status?: string } } | undefined;
      return payload?.details?.status === 'invalid';
    });

    if (invalidCheckIndex === -1) {
      throw new Error('Expected invalid license path to emit launch.license.check.after with status=invalid.');
    }

    const finalizeIndex = findEventIndex(recordedEvents, 'launch.client.finalize.before');
    if (finalizeIndex !== -1 && finalizeIndex > invalidCheckIndex) {
      throw new Error('Expected invalid license classification to stop bootstrap before finalization began.');
    }

    await client.stop('phase_e_invalid_license_cleanup');
  });

  it('Phase E: expired license classification blocks readiness before finalization', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: true,
      licenseKey: 'expired-demo-license',
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'rejected') {
      throw new Error('Expected expired-license bootstrap fixture to reject, but start() resolved.');
    }

    requireBlockedReady(
      recordedEvents,
      'Section 27.E/27.G requires expired license outcomes to block readiness explicitly, but client.ready still emitted after expired license classification.'
    );

    const expiredCheckIndex = recordedEvents.findIndex((event) => {
      if (event.name !== 'launch.license.check.after') return false;
      const payload = event.payload as { details?: { status?: string } } | undefined;
      return payload?.details?.status === 'expired';
    });

    if (expiredCheckIndex === -1) {
      throw new Error('Expected expired license path to emit launch.license.check.after with status=expired.');
    }

    const finalizeIndex = findEventIndex(recordedEvents, 'launch.client.finalize.before');
    if (finalizeIndex !== -1 && finalizeIndex > expiredCheckIndex) {
      throw new Error('Expected expired license classification to stop bootstrap before finalization began.');
    }

    await client.stop('phase_e_expired_license_cleanup');
  });

  it('Phase F: surfaces repairable validation work before readiness instead of hiding it behind success', async () => {
    let repairAttempts = 0;

    vi.spyOn(Transport.prototype, 'repairRuntimeIntegrity').mockImplementation(async function mockRepair(this: Transport) {
      repairAttempts += 1;
      const page = this.getPage() as FakePage | null;
      if (page) {
        page.setRuntimeAvailable(true);
        page.setStoreMsgAvailable(true);
        page.setSessionLoaded(true);
      }
      return true;
    });

    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: false,
      storeMsgAvailable: false,
      sessionLoaded: false,
    });

    const startResult = await settleStart(client);
    const readyIndex = findEventIndex(recordedEvents, 'client.ready');
    const repairSignalIndex = findFirstOf(recordedEvents, [
      'launch.session.invalid.retry',
      'session.reinject.before',
      'session.reinject.after',
      'session.reinject.qr.waiting',
    ]);

    if (repairSignalIndex === -1) {
      throw new Error(
        'Section 27.F requires repairable/deferred bootstrap work to be surfaced explicitly, but no retry or reinject lifecycle event was emitted when the fixture needed a repair pass.'
      );
    }

    if (readyIndex !== -1 && readyIndex < repairSignalIndex) {
      throw new Error(
        'Section 27.F/27.G requires repair or reinject work to happen before client.ready. The active path emitted client.ready before any repair signal.'
      );
    }

    if (repairAttempts < 1) {
      throw new Error(
        'Section 27.F expects a repairable path to attempt another validation/repair action before readiness. The fixture never received a repair attempt.'
      );
    }

    if (startResult.status !== 'resolved') {
      throw new Error(`Expected repairable scenario to recover after repair, but bootstrap rejected with: ${String(startResult.error)}`);
    }

    await client.stop('phase_f_repair_cleanup');
  });

  it('Phase F broken-method integrity gate: repairs a recoverable required-method gap before readiness', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: true,
    });

    const validateRuntimeUsability = vi.spyOn(Transport.prototype, 'validateRuntimeUsability');
    validateRuntimeUsability
      .mockResolvedValueOnce({
        stage: 'post_injection',
        usable: false,
        repairable: true,
        failureReason: 'required_method_missing',
        hasRuntime: true,
        hasStoreMsg: true,
        sessionLoaded: true,
        bridgeReady: false,
        requiredMethods: ['onAck', 'onAnyMessage', 'onStateChanged'],
        missingMethods: ['onAck'],
      })
      .mockResolvedValueOnce({
        stage: 'post_injection',
        usable: true,
        repairable: false,
        hasRuntime: true,
        hasStoreMsg: true,
        sessionLoaded: true,
        bridgeReady: true,
        requiredMethods: ['onAck', 'onAnyMessage', 'onStateChanged'],
        missingMethods: [],
      })
      .mockResolvedValueOnce({
        stage: 'post_overlay',
        usable: true,
        repairable: false,
        hasRuntime: true,
        hasStoreMsg: true,
        sessionLoaded: true,
        bridgeReady: true,
        requiredMethods: ['onAck', 'onAnyMessage', 'onStateChanged'],
        missingMethods: [],
      });

    const repairRuntimeIntegrity = vi.spyOn(Transport.prototype, 'repairRuntimeIntegrity').mockResolvedValue(true);

    const startResult = await settleStart(client);

    if (startResult.status !== 'resolved') {
      throw new Error(`Expected broken-method repair path to resolve, but bootstrap rejected with: ${String(startResult.error)}`);
    }

    const missingMethodValidationIndex = recordedEvents.findIndex((event) => {
      if (event.name !== 'launch.session.validityCheck.after') return false;
      const payload = event.payload as { details?: { failureReason?: string } } | undefined;
      return payload?.details?.failureReason === 'required_method_missing';
    });

    if (missingMethodValidationIndex === -1) {
      throw new Error('Expected broken-method integrity validation to classify a missing required runtime method before attempting repair.');
    }

    const repairSignalIndex = findFirstOf(recordedEvents, [
      'launch.session.invalid.retry',
      'session.reinject.before',
      'session.reinject.after',
    ]);

    if (repairSignalIndex === -1 || repairSignalIndex < missingMethodValidationIndex) {
      throw new Error('Expected required-method integrity failure to surface before the repair path ran.');
    }

    if (repairRuntimeIntegrity.mock.calls.length !== 1) {
      throw new Error('Expected broken-method integrity repair to invoke the transport repair path exactly once before readiness.');
    }

    await client.stop('phase_f_broken_method_repair_cleanup');
  });

  it('Phase F broken-method integrity gate: defers pre-auth required-method gaps so QR/auth polling can proceed before strict post-auth validation', async () => {
    const requiredMethods = ['onAck', 'onAnyMessage', 'onStateChanged'];
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      runtimeMethods: ['onAnyMessage', 'onStateChanged'],
      storeMsgAvailable: true,
      sessionLoaded: false,
    });

    vi.spyOn(Transport.prototype, 'validateRuntimeUsability')
      .mockResolvedValueOnce({
        stage: 'post_injection',
        usable: false,
        repairable: true,
        failureReason: 'required_method_missing',
        hasRuntime: true,
        hasStoreMsg: true,
        sessionLoaded: false,
        bridgeReady: false,
        requiredMethods,
        missingMethods: ['onAck'],
      })
      .mockResolvedValueOnce({
        stage: 'post_injection',
        usable: true,
        repairable: false,
        hasRuntime: true,
        hasStoreMsg: true,
        sessionLoaded: true,
        bridgeReady: true,
        requiredMethods,
        missingMethods: [],
      })
      .mockResolvedValueOnce({
        stage: 'post_overlay',
        usable: true,
        repairable: false,
        hasRuntime: true,
        hasStoreMsg: true,
        sessionLoaded: true,
        bridgeReady: true,
        requiredMethods,
        missingMethods: [],
      });

    const repairRuntimeIntegrity = vi.spyOn(Transport.prototype, 'repairRuntimeIntegrity').mockResolvedValue(true);
    vi.spyOn(Transport.prototype, 'waitForAuthentication').mockImplementation(async function (this: Transport) {
      const transport = this as unknown as {
        events: { emit: (eventName: string, payload: unknown) => void };
        getPage: () => FakePage;
      };
      const page = transport.getPage();

      transport.events.emit('launch.auth.qr.generated', {
        correlationId: 'auth-settle',
        ts: Date.now(),
        step: 'qr_generated',
        details: {
          qr: 'contract-qr',
          attemptInThisCycle: 1,
        },
      });

      page.setSessionLoaded(true);
      page.setRuntimeAvailable(true);
      page.setRuntimeMethods(requiredMethods);
      page.setStoreMsgAvailable(true);

      return {
        outcome: 'authenticated',
        qrSeen: true,
        qrAttempts: 1,
        authMethod: 'qr',
      };
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'resolved') {
      throw new Error(`Expected deferred pre-auth integrity scenario to resolve, but bootstrap rejected with: ${String(startResult.error)}`);
    }

    const postInjectionValidationEvents = recordedEvents
      .map((event, index) => ({ event, index }))
      .filter(({ event }) => event.name === 'launch.session.validityCheck.after')
      .filter(({ event }) => {
        const payload = event.payload as { details?: { phase?: string } } | undefined;
        return payload?.details?.phase === 'post_injection';
      });

    expect(postInjectionValidationEvents).toHaveLength(2);

    const firstValidationPayload = postInjectionValidationEvents[0]?.event.payload as {
      details?: { valid?: boolean; failureReason?: string };
    } | undefined;
    const secondValidationPayload = postInjectionValidationEvents[1]?.event.payload as {
      details?: { valid?: boolean; failureReason?: string };
    } | undefined;

    expect(firstValidationPayload?.details?.valid).toBe(false);
    expect(firstValidationPayload?.details?.failureReason).toBe('required_method_missing');
    expect(secondValidationPayload?.details?.valid).toBe(true);

    const qrGeneratedIndex = findEventIndex(recordedEvents, 'launch.auth.qr.generated');
    expect(qrGeneratedIndex).toBeGreaterThan(postInjectionValidationEvents[0]!.index);
    expect(qrGeneratedIndex).toBeLessThan(postInjectionValidationEvents[1]!.index);

    const fatalIntegrityErrorIndex = recordedEvents.findIndex((event) => {
      if (event.name !== 'error') return false;
      const payload = event.payload as { fatal?: boolean; error?: { message?: string } } | undefined;
      return payload?.fatal === true && payload?.error?.message?.includes('required_method_missing');
    });

    expect(fatalIntegrityErrorIndex).toBe(-1);
    expect(repairRuntimeIntegrity).not.toHaveBeenCalled();
    expect(client.getReadiness()).toMatchObject({
      ready: true,
      requirements: {
        runtimeUsable: { state: 'satisfied' },
      },
    });

    await client.stop('phase_f_broken_method_deferred_cleanup');
  });

  it('Phase F broken-method integrity gate: terminal required-method gaps block readiness explicitly', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: true,
    });

    const validateRuntimeUsability = vi.spyOn(Transport.prototype, 'validateRuntimeUsability');
    validateRuntimeUsability
      .mockResolvedValueOnce({
        stage: 'post_injection',
        usable: false,
        repairable: true,
        failureReason: 'required_method_missing',
        hasRuntime: true,
        hasStoreMsg: true,
        sessionLoaded: true,
        bridgeReady: false,
        requiredMethods: ['onAck', 'onAnyMessage', 'onStateChanged'],
        missingMethods: ['onAck'],
      })
      .mockResolvedValueOnce({
        stage: 'post_injection',
        usable: false,
        repairable: true,
        failureReason: 'required_method_missing',
        hasRuntime: true,
        hasStoreMsg: true,
        sessionLoaded: true,
        bridgeReady: false,
        requiredMethods: ['onAck', 'onAnyMessage', 'onStateChanged'],
        missingMethods: ['onAck'],
      });

    const repairRuntimeIntegrity = vi.spyOn(Transport.prototype, 'repairRuntimeIntegrity').mockResolvedValue(true);
    const startResult = await settleStart(client);

    if (startResult.status !== 'rejected') {
      throw new Error('Expected unrepaired broken-method integrity failure to block readiness, but start() resolved.');
    }

    requireBlockedReady(
      recordedEvents,
      'Expected unrepaired broken-method integrity failure to block readiness, but client.ready still emitted.'
    );

    const fatalIntegrityErrorIndex = recordedEvents.findIndex((event) => {
      if (event.name !== 'error') return false;
      const payload = event.payload as { fatal?: boolean; error?: { message?: string } } | undefined;
      return payload?.fatal === true && payload?.error?.message?.includes('required_method_missing');
    });

    if (fatalIntegrityErrorIndex === -1) {
      throw new Error('Expected broken-method integrity failure to be classified as a fatal readiness blocker.');
    }

    if (repairRuntimeIntegrity.mock.calls.length !== 1) {
      throw new Error('Expected unrepaired broken-method integrity failure to attempt exactly one transport repair/reinject cycle before blocking readiness.');
    }

    await client.stop('phase_f_broken_method_terminal_cleanup');
  });

  it('Phase F failure classes: required injection failure is classified as a fatal bootstrap blocker', async () => {
    vi.spyOn(Transport.prototype, 'injectWapi').mockRejectedValue(new Error('simulated injection failure'));

    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: false,
      storeMsgAvailable: false,
      sessionLoaded: false,
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'rejected') {
      throw new Error('Section 27.5 requires required injection failure to block readiness entirely, but start() resolved.');
    }

    requireBlockedReady(
      recordedEvents,
      'Section 27.5/27.6 requires required injection failure to block readiness entirely, but client.ready still emitted after a required injection failure.'
    );

    const fatalErrorIndex = recordedEvents.findIndex((event) => {
      if (event.name !== 'error') return false;
      const payload = event.payload as { fatal?: boolean } | undefined;
      return payload?.fatal === true;
    });

    if (fatalErrorIndex === -1) {
      throw new Error(
        'Section 27.5 requires a fatal bootstrap blocker classification for required injection failure, but no fatal error signal was emitted.'
      );
    }

    await client.stop('phase_f_fatal_cleanup');
  });

  it('Phase G: fresh auth reruns post-auth reinjection and ripe-session gating before overlays begin', async () => {
    vi.spyOn(Transport.prototype, 'waitForAuthentication').mockImplementation(async function (this: Transport) {
      const page = this.getPage() as FakePage;
      page.setSessionLoaded(true);
      page.setRuntimeAvailable(false);
      page.setStoreMsgAvailable(false);
      page.setRecoverRuntimeOnNextLaunchInjection(true);

      return {
        outcome: 'authenticated',
        qrSeen: true,
        qrAttempts: 1,
      };
    });

    const originalGetSessionDebugInfo = Transport.prototype.getSessionDebugInfo;
    vi.spyOn(Transport.prototype, 'getSessionDebugInfo').mockImplementation(function (this: Transport) {
      const page = this.getPage() as FakePage;
      if (!page.isRuntimeAvailable()) {
        throw new Error('session debug info requested before post-auth reinjection restored the runtime');
      }

      return originalGetSessionDebugInfo.call(this);
    });

    const { client, page, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: false,
    });

    const startResult = await settleStart(client);
    if (startResult.status !== 'resolved') {
      throw new Error(`Expected fresh-auth post-auth recovery path to resolve, but it rejected with: ${String(startResult.error)}`);
    }

    expect(page.getLaunchInjectionCount()).toBeGreaterThanOrEqual(2);

    const finalizeBeforeIndex = findEventIndex(recordedEvents, 'launch.client.finalize.before');
    const readyIndex = findEventIndex(recordedEvents, 'client.ready');
    expect(finalizeBeforeIndex).toBeGreaterThan(-1);
    expect(readyIndex).toBeGreaterThan(finalizeBeforeIndex);

    await client.stop('phase_g_fresh_auth_post_auth_reinject_cleanup');
  });

  it('Phase G: resumed sessions do not regress into extra post-auth reinjection when the authenticated runtime is already truthful', async () => {
    const originalInjectWapi = Transport.prototype.injectWapi;
    const injectSpy = vi.spyOn(Transport.prototype, 'injectWapi').mockImplementation(function (this: Transport) {
      return originalInjectWapi.call(this);
    });

    vi.spyOn(Transport.prototype, 'waitForAuthentication').mockResolvedValue({
      outcome: 'authenticated',
      qrSeen: false,
      qrAttempts: 0,
    });

    const { client } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: true,
    });

    const startResult = await settleStart(client);
    if (startResult.status !== 'resolved') {
      throw new Error(`Expected resumed-session bootstrap to stay green, but it rejected with: ${String(startResult.error)}`);
    }

    expect(injectSpy).toHaveBeenCalledTimes(1);

    await client.stop('phase_g_resumed_session_truthful_cleanup');
  });

  it('Phase G: client.ready does not emit until injection, overlays, validation, and finalization are complete', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: true,
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'resolved') {
      throw new Error(`Expected happy-path bootstrap fixture to resolve, but it rejected with: ${String(startResult.error)}`);
    }

    const readyIndex = findEventIndex(recordedEvents, 'client.ready');
    expect(readyIndex).toBeGreaterThan(-1);

    const finalizeAfterEvent = recordedEvents.find((event) => event.name === 'launch.client.finalize.after');
    const finalizeAfterPayload = finalizeAfterEvent?.payload as { details?: { success?: boolean; outcome?: string } } | undefined;
    expect(finalizeAfterPayload?.details?.success).toBe(true);
    expect(finalizeAfterPayload?.details?.outcome).toBe('ready');

    const patchCompleteIndex = findFirstOf(recordedEvents, ['launch.patch.init.after', 'patch.init.after', 'patch.apply.after']);
    const licenseCompleteIndex = findFirstOf(recordedEvents, ['launch.license.check.after', 'license.check.after', 'license.inject.after']);
    const validationEvents = recordedEvents
      .map((event, index) => ({ event, index }))
      .filter(({ event }) => event.name === 'launch.session.validityCheck.after');
    const postOverlayValidation = validationEvents.find(({ event, index }) => {
      const payload = event.payload as { details?: { phase?: string } } | undefined;
      return payload?.details?.phase === 'post_overlay' && index > patchCompleteIndex && index > licenseCompleteIndex;
    });

    if (!postOverlayValidation) {
      throw new Error(
        'Section 27.F/27.G requires a real post-overlay validation stage before readiness, but no post_overlay launch.session.validityCheck.after event was observed after overlays completed.'
      );
    }

    const requiredBeforeReady: Array<{ name: string; events: string[] }> = [
      {
        name: 'runtime injection completion',
        events: ['launch.wapi.inject.after'],
      },
      {
        name: 'patch overlay completion',
        events: ['launch.patch.init.after', 'patch.init.after', 'patch.apply.after'],
      },
      {
        name: 'license overlay completion',
        events: ['launch.license.check.after', 'license.check.after', 'license.inject.after'],
      },
      {
        name: 'session validation completion',
        events: ['launch.session.validityCheck.after'],
      },
      {
        name: 'client finalization completion',
        events: ['launch.client.finalize.after'],
      },
    ];

    for (const requirement of requiredBeforeReady) {
      const requirementIndex = findFirstOf(recordedEvents, requirement.events);
      if (requirementIndex === -1 || requirementIndex > readyIndex) {
        throw new Error(
          `Section 27.G says client.ready must wait for ${requirement.name}, but no qualifying event for ${requirement.name} occurred before client.ready.`
        );
      }
    }

    expect(client.getReadiness()).toMatchObject({
      ready: true,
      status: 'ready',
      exposureSafe: true,
      pending: [],
      blockers: [],
      lowerLevel: {
        driverActiveGeneration: true,
        runtimeOperational: true,
        runtimeBridgeReady: true,
        reinjectionSettled: true,
      },
      requirements: {
        runtimeUsable: { state: 'satisfied' },
        patchLifecycle: { state: 'satisfied' },
        licenseLifecycle: { state: 'non_blocking' },
        finalization: { state: 'satisfied' },
      },
    });

    await client.stop('phase_g_cleanup');
  });

  it('Phase G: awaited client finalization hooks complete before client.ready emits', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: true,
      licenseKey: 'community-valid-license',
    });

    const markerOrder: string[] = [];
    let releaseHook!: () => void;
    const hookGate = new Promise<void>((resolve) => {
      releaseHook = resolve;
    });

    client.events.on('launch.client.finalize.before', () => {
      markerOrder.push('finalize.before');
    });
    client.events.on('client.ready', () => {
      markerOrder.push('client.ready');
    });

    client.registerFinalizationHook(async () => {
      markerOrder.push('hook.start');
      await hookGate;
      markerOrder.push('hook.end');
    });

    const startPromise = settleStart(client);

    await vi.waitFor(() => {
      expect(markerOrder).toContain('hook.start');
    });

    expect(markerOrder).not.toContain('client.ready');
    expect(findEventIndex(recordedEvents, 'client.ready')).toBe(-1);

    releaseHook();

    const startResult = await startPromise;
    if (startResult.status !== 'resolved') {
      throw new Error(`Expected finalization-hook bootstrap fixture to resolve, but it rejected with: ${String(startResult.error)}`);
    }

    expect(markerOrder.indexOf('finalize.before')).toBeGreaterThan(-1);
    expect(markerOrder.indexOf('hook.start')).toBeGreaterThan(markerOrder.indexOf('finalize.before'));
    expect(markerOrder.indexOf('hook.end')).toBeGreaterThan(markerOrder.indexOf('hook.start'));
    expect(markerOrder.indexOf('client.ready')).toBeGreaterThan(markerOrder.indexOf('hook.end'));

    await client.stop('phase_g_hook_cleanup');
  });

  it('Phase G: pending QR authentication remains a blocked finalization path instead of crashing bootstrap immediately', async () => {
    vi.spyOn(Transport.prototype, 'waitForAuthentication').mockResolvedValue({
      outcome: 'authenticated',
      qrSeen: true,
      qrAttempts: 1,
    });
    vi.spyOn(Transport.prototype, 'waitForRipeSession').mockResolvedValue(false);

    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: false,
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'rejected') {
      throw new Error('Expected pending authentication timeout to reject start(), but it resolved.');
    }

    requireBlockedReady(
      recordedEvents,
      'Finalization failure must block client.ready, but client.ready still emitted after pending authentication timed out.'
    );

    const finalizeAfterEvent = recordedEvents.find((event) => event.name === 'launch.client.finalize.after');
    if (!finalizeAfterEvent) {
      throw new Error('Expected finalization failure path to emit launch.client.finalize.after with an explicit failed outcome.');
    }

    const finalizeAfterPayload = finalizeAfterEvent.payload as {
      details?: { success?: boolean; outcome?: string; detail?: string };
    } | undefined;

    expect(finalizeAfterPayload?.details?.success).toBe(false);
    expect(finalizeAfterPayload?.details?.outcome).toBe('failed');
    expect(finalizeAfterPayload?.details?.detail).toContain('ripe session');

    expect(client.getReadiness()).toMatchObject({
      ready: false,
      status: 'blocked',
      blockers: ['finalization'],
    });

    await client.stop('phase_g_finalize_failure_cleanup');
  });

  it('classifies invalid session / NUKE distinctly instead of collapsing into auth timeout', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: false,
      invalidSession: true,
      qrCode: null,
      authTimeoutMs: 5,
      qrPollingMs: 1,
    });

    const startResult = await settleStart(client);

    expect(startResult.status).toBe('rejected');
    expect(String(startResult.status === 'rejected' ? startResult.error : '')).toContain('manual host account logout');
    expect(findEventIndex(recordedEvents, 'launch.auth.nuke.detected')).toBeGreaterThan(-1);
    expect(findEventIndex(recordedEvents, 'launch.auth.phoneOutOfReach')).toBe(-1);

    await client.stop('invalid_session_classification_cleanup');
  });

  it('ignoreNuke keeps invalid-session detection from aborting bootstrap as a forced NUKE path', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: false,
      invalidSession: true,
      ignoreNuke: true,
      qrCode: null,
      authTimeoutMs: 5,
      qrPollingMs: 1,
    });

    const startResult = await settleStart(client);

    expect(startResult.status).toBe('rejected');
    expect(String(startResult.status === 'rejected' ? startResult.error : '')).toContain('Authentication timed out');
    expect(findEventIndex(recordedEvents, 'launch.auth.nuke.detected')).toBe(-1);

    await client.stop('ignore_nuke_cleanup');
  });

  it('classifies phone-out-of-reach distinctly from ordinary authentication timeout', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: false,
      phoneOutOfReach: true,
      qrCode: null,
      authTimeoutMs: 5,
      oorTimeoutMs: 5,
      qrPollingMs: 1,
    });

    const startResult = await settleStart(client);

    expect(startResult.status).toBe('rejected');
    expect(String(startResult.status === 'rejected' ? startResult.error : '')).toContain('host phone is out of reach');
    expect(findEventIndex(recordedEvents, 'launch.auth.phoneOutOfReach')).toBeGreaterThan(-1);

    const timeoutEvent = recordedEvents.find((event) => event.name === 'launch.auth.timeout');
    const timeoutPayload = timeoutEvent?.payload as { details?: { phoneOutOfReach?: boolean } } | undefined;
    expect(timeoutPayload?.details?.phoneOutOfReach).toBe(true);

    await client.stop('phone_out_of_reach_classification_cleanup');
  });

  it('keeps ordinary auth timeout distinct when the phone-out-of-reach signal never appears', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: false,
      qrCode: null,
      authTimeoutMs: 5,
      oorTimeoutMs: 5,
      qrPollingMs: 1,
    });

    const startResult = await settleStart(client);

    expect(startResult.status).toBe('rejected');
    expect(String(startResult.status === 'rejected' ? startResult.error : '')).toContain('Authentication timed out');
    expect(String(startResult.status === 'rejected' ? startResult.error : '')).not.toContain('out of reach');
    expect(findEventIndex(recordedEvents, 'launch.auth.phoneOutOfReach')).toBe(-1);

    await client.stop('auth_timeout_classification_cleanup');
  });

  it('supports the retained link-code auth path explicitly when the runtime exposes window.linkCode', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: false,
      qrCode: null,
      linkCode: '15551234567',
      generatedLinkCode: 'XYZ-1234',
      authenticateOnLinkCodeRequest: true,
      authTimeoutMs: 20,
      qrPollingMs: 1,
    });

    const startResult = await settleStart(client);

    expect(startResult.status).toBe('resolved');
    expect(findEventIndex(recordedEvents, 'launch.auth.linkCode.requested')).toBeGreaterThan(-1);

    const generatedEvent = recordedEvents.find((event) => event.name === 'launch.auth.linkCode.generated');
    const generatedPayload = generatedEvent?.payload as { details?: { linkCode?: string } } | undefined;
    expect(generatedPayload?.details?.linkCode).toBe('XYZ-1234');

    await client.stop('link_code_auth_path_cleanup');
  });

  it('enforces qrMax explicitly instead of collapsing repeated QR refreshes into a later timeout', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: false,
      qrCodes: ['first-qr', 'second-qr'],
      qrMax: 1,
      authTimeoutMs: 50,
      qrPollingMs: 1,
    });

    const startResult = await settleStart(client);

    expect(startResult.status).toBe('rejected');
    expect(String(startResult.status === 'rejected' ? startResult.error : '')).toContain('QR/link-code limit');

    const qrGeneratedEvents = recordedEvents.filter((event) => event.name === 'launch.auth.qr.generated');
    expect(qrGeneratedEvents).toHaveLength(1);

    await client.stop('qr_max_classification_cleanup');
  });

  describe('payload depth: remote patch fetch', () => {
    it('includes remote patches in preloaded artifacts when cdn.openwa.dev responds', async () => {
      // Spy on the private method via prototype to simulate successful remote fetch
      const fetchSpy = vi.spyOn(
        Transport.prototype as any,
        'fetchRemotePatchesWithCache',
      ).mockResolvedValue({
        data: ['console.log("remote-patch-1")', 'console.log("remote-patch-2")'],
        tag: 'abc12',
        source: 'remote' as const,
      });

      const { client, recordedEvents } = await createHarness({
        runtimeAvailable: true,
        storeMsgAvailable: true,
        sessionLoaded: true,
      });

      const startResult = await settleStart(client);

      // Find patch preload event
      const patchInitAfter = recordedEvents.find(
        (e) => e.name === 'launch.patch.init.after',
      );

      expect(patchInitAfter).toBeDefined();

      const details = (patchInitAfter?.payload as Record<string, unknown>)?.details as
        | Record<string, unknown>
        | undefined;

      // Should contain remote patch IDs alongside builtin ones
      const available = details?.available as string[] | undefined;
      expect(available).toBeDefined();
      const hasRemote = available!.some((id) => id.startsWith('remote-patch-'));
      expect(hasRemote).toBe(true);

      // Source should reflect remote fetch
      expect(details?.source).toBe('remote');

      // Tag should be from the remote result
      expect(details?.tag).toBe('abc12');

      await client.stop('payload_depth_patch_cleanup');
      fetchSpy.mockRestore();
    });

    it('runs the deferred init patch only after license injection succeeds', async () => {
      const fetchSpy = vi.spyOn(
        Transport.prototype as any,
        'fetchRemotePatchesWithCache',
      ).mockResolvedValue({
        data: [],
        tag: 'empty',
        source: 'remote' as const,
      });

      const { client, recordedEvents } = await createHarness({
        runtimeAvailable: true,
        storeMsgAvailable: true,
        sessionLoaded: true,
        licenseKey: 'community-valid-license',
      });

      const startResult = await settleStart(client);

      if (startResult.status !== 'resolved') {
        throw new Error(`Expected deferred init patch bootstrap fixture to resolve, but it rejected with: ${String(startResult.error)}`);
      }

      const licenseInjectAfterIndex = findEventIndex(recordedEvents, 'license.inject.after');
      const initPatchApplyAfterIndex = recordedEvents.findIndex((event) => {
        if (event.name !== 'patch.apply.after') {
          return false;
        }

        const payload = event.payload as { details?: { patchId?: string } } | undefined;
        return payload?.details?.patchId === 'init-patch-legacy';
      });

      expect(licenseInjectAfterIndex).toBeGreaterThan(-1);
      expect(initPatchApplyAfterIndex).toBeGreaterThan(licenseInjectAfterIndex);

      await client.stop('deferred_init_patch_order_cleanup');
      fetchSpy.mockRestore();
    });

    it('blocks readiness when the required deferred init patch fails', async () => {
      const fetchSpy = vi.spyOn(
        Transport.prototype as any,
        'fetchRemotePatchesWithCache',
      ).mockResolvedValue({
        data: [],
        tag: 'empty',
        source: 'remote' as const,
      });

      const { client, recordedEvents } = await createHarness({
        runtimeAvailable: true,
        storeMsgAvailable: true,
        sessionLoaded: true,
        licenseKey: 'community-valid-license',
        initPatchFails: true,
      });

      const startResult = await settleStart(client);

      requireBlockedReady(
        recordedEvents,
        'Required deferred init patch failures must block readiness, but client.ready still emitted after the init patch threw.'
      );

      if (startResult.status !== 'rejected') {
        throw new Error('Expected deferred init patch failure to reject start(), but it resolved.');
      }

      expect(client.getReadiness()).toMatchObject({
        ready: false,
        status: 'blocked',
        blockers: ['patchLifecycle'],
      });

      await client.stop('deferred_init_patch_failure_cleanup');
      fetchSpy.mockRestore();
    });
  });

  describe('payload depth: license server validation', () => {
    it('passes host number to license validation server for round-trip check', async () => {
      // Mock getSessionDebugInfo to return a host number
      const debugSpy = vi.spyOn(
        Transport.prototype,
        'getSessionDebugInfo',
      ).mockResolvedValue({
        WA_VERSION: '2.2350.0',
        WA_AUTOMATE_VERSION: '5.0.0',
        hostNumber: '1234567890@c.us',
        BROWSER_VERSION: 'fake-browser',
        PAGE_UA: 'test-ua',
        OS: 'test',
        NUM_HASH: 'a1b2c',
      });

      // Intercept the validateLicense call at the Transport level
      // by mocking fetchRemotePatchesWithCache and using a spy on the license side
      const fetchSpy = vi.spyOn(
        Transport.prototype as any,
        'fetchRemotePatchesWithCache',
      ).mockResolvedValue({
        data: [],
        tag: 'empty',
        source: 'remote' as const,
      });

      const { client, recordedEvents } = await createHarness({
        runtimeAvailable: true,
        storeMsgAvailable: true,
        sessionLoaded: true,
        licenseKey: 'insiders-test-key-12345',
      });

      const startResult = await settleStart(client);

      // The debug info spy should have been called (proving session info plumbing works)
      expect(debugSpy).toHaveBeenCalledTimes(1);

      // The license preload event should show success
      const licensePreloadAfter = recordedEvents.find(
        (e) => e.name === 'launch.license.preload.after',
      );

      expect(licensePreloadAfter).toBeDefined();

      const details = (licensePreloadAfter?.payload as Record<string, unknown>)?.details as
        | Record<string, unknown>
        | undefined;
      expect(details?.success).toBe(true);

      await client.stop('payload_depth_license_cleanup');
      debugSpy.mockRestore();
      fetchSpy.mockRestore();
    });

    it('classifies local_metadata fallback distinctly from a server-confirmed license unlock', async () => {
      // Mock getSessionDebugInfo to provide host info
      const debugSpy = vi.spyOn(
        Transport.prototype,
        'getSessionDebugInfo',
      ).mockResolvedValue({
        WA_VERSION: '2.2350.0',
        WA_AUTOMATE_VERSION: '5.0.0',
        hostNumber: '1234567890@c.us',
        BROWSER_VERSION: 'fake-browser',
        PAGE_UA: 'test-ua',
        OS: 'test',
        NUM_HASH: 'a1b2c',
      });

      const fetchSpy = vi.spyOn(
        Transport.prototype as any,
        'fetchRemotePatchesWithCache',
      ).mockResolvedValue({
        data: [],
        tag: 'empty',
        source: 'remote' as const,
      });

      // Direct unit test: create a Transport with license config set to offline mode,
      // confirming it falls back to local_metadata (no server round-trip)
      const { client, recordedEvents } = await createHarness({
        runtimeAvailable: true,
        storeMsgAvailable: true,
        sessionLoaded: true,
        licenseKey: 'community-valid-license',
      });

      // Override the licenseConfig to force offline mode (no server call)
      (client.getTransport() as any).licenseConfig = { offlineLicenseMode: true };

      const startResult = await settleStart(client);

      if (startResult.status !== 'resolved') {
        throw new Error(`Expected metadata-only fallback bootstrap fixture to resolve, but start() rejected with: ${String(startResult.error)}`);
      }

      const licensePreloadAfter = recordedEvents.find(
        (e) => e.name === 'launch.license.preload.after',
      );

      expect(licensePreloadAfter).toBeDefined();
      const details = (licensePreloadAfter?.payload as Record<string, unknown>)?.details as
        | Record<string, unknown>
        | undefined;
      expect(details?.success).toBe(true);
      expect(details?.status).toBe('metadata_only');
      expect(details?.payloadSource).toBe('local_metadata');

      const licenseCheckAfter = recordedEvents.find(
        (e) => e.name === 'launch.license.check.after',
      );

      expect(licenseCheckAfter).toBeDefined();

      const checkDetails = (licenseCheckAfter?.payload as Record<string, unknown>)?.details as
        | Record<string, unknown>
        | undefined;
      expect(checkDetails?.status).toBe('metadata_only');
      expect(checkDetails?.payloadSource).toBe('local_metadata');

      expect(client.getReadiness()).toMatchObject({
        ready: true,
        status: 'ready',
        requirements: {
          licenseLifecycle: {
            state: 'non_blocking',
          },
        },
      });

      await client.stop('payload_depth_fallback_cleanup');
      debugSpy.mockRestore();
      fetchSpy.mockRestore();
    });
  });
});
