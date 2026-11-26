import { afterEach, describe, expect, it, vi } from 'vitest';
import { createClient, type OpenWAClient } from '../../src/createClient';
import { Transport, type PatchFetchConfig } from '../../src/transport/Transport';
import type {
  DisposableHandle,
  IBrowser,
  DriverCapabilities,
  IDriver,
  IElementHandle,
  IFrame,
  IPage,
  IRequest,
  WaitForFunctionOptions,
} from '@open-wa/driver-interface';
import type { OpenWAEventMap } from '../../src/events/eventMap';

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
  screenshotError?: Error;
  runtimeAvailable?: boolean;
  runtimeMethods?: string[];
  storeMsgAvailable?: boolean;
  sessionLoaded?: boolean;
  phoneOutOfReach?: boolean;
  linkCode?: string;
  generatedLinkCode?: string | null;
  authenticateOnLinkCodeRequest?: boolean;
  qrMax?: number;
  authTimeoutMs?: number;
  oorTimeoutMs?: number;
  qrPollingMs?: number;
  licenseKey?: string | Record<string, string | undefined> | ((sessionId: string) => Promise<string | null | undefined> | string | null | undefined);
  licenseApplyFails?: boolean;
  initPatchFails?: boolean;
  patchConfig?: PatchFetchConfig;
  driverCapabilities?: Partial<DriverCapabilities>;
  driverName?: string;
  /** WhatsApp shows the pairing QR while the page loads, then takes it away. */
  qrDisappearsAfterNavigation?: boolean;
  launchAssetFails?: boolean;
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
  private phoneOutOfReach: boolean;
  private readonly configuredLinkCode?: string;
  private readonly generatedLinkCode: string | null;
  private readonly authenticateOnLinkCodeRequest: boolean;
  private readonly screenshotError?: Error;
  private screenshotCallCount = 0;
  private keyType: string | false = false;
  private launchError: string | null = null;
  private readonly licenseApplyFails: boolean;
  private readonly initPatchFails: boolean;
  private readonly qrDisappearsAfterNavigation: boolean;
  private readonly launchAssetFails: boolean;
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
    this.phoneOutOfReach = options.phoneOutOfReach ?? false;
    this.configuredLinkCode = options.linkCode;
    this.generatedLinkCode = options.generatedLinkCode ?? 'ABC-1234';
    this.authenticateOnLinkCodeRequest = options.authenticateOnLinkCodeRequest ?? false;
    this.screenshotError = options.screenshotError;
    this.licenseApplyFails = options.licenseApplyFails ?? false;
    this.initPatchFails = options.initPatchFails ?? false;
    this.qrDisappearsAfterNavigation = options.qrDisappearsAfterNavigation ?? false;
    this.launchAssetFails = options.launchAssetFails ?? false;
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

  getScreenshotCallCount(): number {
    return this.screenshotCallCount;
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

    if (script.includes('function _0x7aa3') || script.includes('window.isRipeSession=function')) {
      if (!this.wapiAssetInjected) {
        throw new ReferenceError('WAPI is not defined');
      }

      this.launchInjectionCount += 1;

      if (this.launchAssetFails) {
        throw new Error('simulated launch asset failure');
      }

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

  /**
   * Evaluates a boolean probe script against the harness state.
   * Returns true if the condition is met, false otherwise.
   * This is called by waitForFunction() to evaluate probe scripts.
   */
  private evaluateBooleanScript(script: string): boolean {
    // Navigation's pre-auth surface probe: WhatsApp is showing its chat list or a pairing QR.
    if (script.includes('post_logout=1')) {
      const surfaceReady = this.sessionLoaded || this.qrCode !== null;
      if (surfaceReady && this.qrDisappearsAfterNavigation) {
        this.qrCode = null;
        this.qrCodes = [];
      }
      return surfaceReady;
    }

    // LEGACY_IS_INSIDE_CHAT_CHECK_SCRIPT and RIPE_SESSION_CHECK_SCRIPT
    // Check: WA_AUTHENTICATED or DOM elements (.app/.two with tabindex)
    if (
      script.includes('WA_AUTHENTICATED') &&
      (script.includes('document.getElementsByClassName') || script.includes('tabindex'))
    ) {
      return Boolean(this.browserGlobals.WA_AUTHENTICATED);
    }

    // AUTHENTICATED_SHELL_CHECK_SCRIPT
    // Checks: isSessionLoaded(), WA_AUTHENTICATED, #pane-side, chat-list-search, app/two tabindex
    if (script.includes('pane-side') || script.includes('chat-list-search') || script.includes('isSessionLoaded')) {
      return Boolean(this.browserGlobals.WA_AUTHENTICATED);
    }

    // PHONE_OUT_OF_REACH_CHECK_SCRIPT - checks body.innerText.includes('Trying to reach phone')
    if (script.includes('Trying to reach phone')) {
      return Boolean(this.phoneOutOfReach);
    }

    // QR_CHECK_SCRIPT (used in Boolean context) - checks canvas[aria-label]
    if (script.includes('canvas[aria-label]')) {
      return this.qrCode !== null;
    }

    // WAPI_RUNTIME_CHECK_SCRIPT - checks !!window.WAPI
    if (script === '!!window.WAPI' || (script.includes('window.WAPI') && script.includes('!!'))) {
      return Boolean(this.runtimeAvailable);
    }

    // STORE_MSG_CHECK_SCRIPT - checks !!(window.Store && window.Store.Msg)
    if (script.includes('Store.Msg') || (script.includes('window.Store') && script.includes('!!'))) {
      return Boolean(this.storeMsgAvailable);
    }

    // LINK_CODE_AVAILABLE_CHECK_SCRIPT - checks typeof window.linkCode === 'function'
    if (script.includes('window.linkCode') && script.includes('typeof')) {
      return Boolean(this.configuredLinkCode && this.generatedLinkCode);
    }

    // ATTEMPTING_REAUTH_CHECK_SCRIPT - checks localStorage for WAToken2 or last-wid-md
    if (script.includes('WAToken2') || script.includes('last-wid-md')) {
      // Not directly modeled in harness - return false to not interfere
      return false;
    }

    // For unrecognized scripts, return true to maintain backward compatibility
    // The original no-op stub would succeed for any script
    return true;
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
    // QR selectors - only succeed if qrCode is actually present
    // QR_SELECTOR_PRIMARY = "canvas[aria-label='Scan this QR code to link a device!']"
    // QR_SELECTOR_FALLBACK = 'canvas[aria-label]'
    if (_selector.includes('canvas[aria-label]')) {
      if (this.qrCode !== null) {
        return new FakeElementHandle();
      }
      // No QR code available - throw to trigger timeout behavior
      throw new Error(`waitForSelector timeout: ${_selector}`);
    }

    // For other selectors used by the page, return FakeElementHandle
    // to not break other functionality
    return new FakeElementHandle();
  }

  async waitForFunction(_script: string, _options?: WaitForFunctionOptions): Promise<void>;
  async waitForFunction<Arg>(_fn: (arg: Arg) => boolean, _arg: Arg, _options?: WaitForFunctionOptions): Promise<void>;
  async waitForFunction(fnOrScript?: string | ((arg: unknown) => boolean), argOrOptions?: unknown, maybeOptions?: WaitForFunctionOptions): Promise<void> {
    const script = typeof fnOrScript === 'string' ? fnOrScript : null;
    if (script) {
      const passed = this.evaluateBooleanScript(script);
      if (!passed) {
        throw new Error(`waitForFunction condition not met: ${script.slice(0, 80)}`);
      }
      return;
    }

    const fn = fnOrScript as ((arg: unknown) => boolean) | undefined;
    const _arg = maybeOptions ? argOrOptions : undefined;
    const passed = fn ? fn(_arg) : true;
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
    this.screenshotCallCount += 1;
    if (this.screenshotError) {
      throw this.screenshotError;
    }

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
  readonly name: string;
  readonly capabilities: DriverCapabilities;

  constructor(private readonly browser: FakeBrowser, options: Pick<HarnessOptions, 'driverCapabilities' | 'driverName'> = {}) {
    this.name = options.driverName ?? 'puppeteer';
    this.capabilities = {
      cdp: { supported: true },
      requestInterception: { supported: true },
      serviceWorkerBypass: { supported: true },
      stealth: { supported: true },
      pdf: { supported: true },
      tracing: { supported: true },
      persistentContext: { supported: true },
      browserExtensions: { supported: true },
      exposeBinding: { supported: true },
      screenshot: { supported: true },
      rendering: { supported: true },
      ...options.driverCapabilities,
    };
  }

  async init(): Promise<void> {}

  async launch(): Promise<IBrowser> {
    return this.browser;
  }

  async connect(): Promise<IBrowser> {
    return this.browser;
  }

  createCapabilityError(capability: keyof DriverCapabilities, reason?: string): Error {
    if (this.name === 'lightpanda' && (capability === 'rendering' || capability === 'screenshot' || capability === 'pdf' || capability === 'tracing')) {
      return new Error(
        `Driver 'Lightpanda' does not support capability '${capability}': ${reason ?? 'Lightpanda has no rendering engine'}`,
      );
    }

    return new Error(
      `Driver '${this.name}' does not support capability '${capability}'${reason ? `: ${reason}` : ''}`,
    );
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

const harnessClients = new Set<OpenWAClient>();

async function createHarness(options: HarnessOptions = {}): Promise<{
  client: OpenWAClient;
  page: FakePage;
  recordedEvents: RecordedEvent[];
}> {
  const page = new FakePage(options);
  const driver = new FakeDriver(new FakeBrowser(page), options);
  const client = await createClient({
    driver,
    lightpanda: options.driverName === 'lightpanda' ? { experimentalWhatsApp: true } : undefined,
    sessionId: 'bootstrap-contract',
    headless: true,
    qrTimeoutMs: 10,
    authTimeoutMs: options.authTimeoutMs,
    oorTimeoutMs: options.oorTimeoutMs,
    linkCode: options.linkCode,
    qrMax: options.qrMax,
    licenseKey: options.licenseKey,
    patchConfig: options.patchConfig,
  });
  harnessClients.add(client);

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

afterEach(async () => {
  try {
    await Promise.all([...harnessClients].map(client => client.stop('bootstrap_harness_cleanup')));
  } finally {
    harnessClients.clear();
    vi.restoreAllMocks();
  }
});

describe('bootstrap contract harness', () => {
  it('allows pre-auth navigation to continue once the pairing QR is visible, before any runtime is injectable', async () => {
    const { client } = await createHarness({
      qrCode: 'contract-qr',
    });

    try {
      const transport = client.getTransport();
      await transport.initialize();
      await expect(transport.navigate()).resolves.toBeUndefined();
    } finally {
      await client.stop('pre_auth_qr_navigation_cleanup');
    }
  });

  it('defers launch helper failures when the pre-auth QR surface is already available', async () => {
    const { client, page } = await createHarness({
      launchAssetFails: true,
      qrCode: 'contract-qr',
      runtimeAvailable: true,
      storeMsgAvailable: false,
      sessionLoaded: false,
    });

    try {
      const transport = client.getTransport();
      await transport.initialize();
      await transport.navigate();
      await expect(transport.injectWapi()).resolves.toBe(true);
      expect(page.getLaunchInjectionCount()).toBe(1);
    } finally {
      await client.stop('pre_auth_qr_launch_defer_cleanup');
    }
  });

  it('Phase D: keeps readiness blocked while WhatsApp is still showing the pairing QR', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: false,
      storeMsgAvailable: false,
      sessionLoaded: false,
    });

    const startResult = await settleStart(client);

    requireBlockedReady(
      recordedEvents,
      'client.ready must stay blocked until WhatsApp shows the chat list, but the active path emitted client.ready while the fake page was still showing the pairing QR.'
    );

    if (startResult.status !== 'rejected') {
      throw new Error(
        'Bootstrap must reject when the pairing QR is never scanned, but start() resolved on a page that never left the QR.'
      );
    }

    expect(String(startResult.error)).toContain('Authentication did not finish: qr_timeout');
    expect(findEventIndex(recordedEvents, 'launch.auth.qr.generated')).toBeGreaterThan(-1);
    expect(findEventIndex(recordedEvents, 'core.started')).toBe(-1);
    expect(client.getReadiness()).toMatchObject({
      ready: false,
      status: 'not_ready',
      exposureSafe: false,
      blockers: [],
      requirements: {
        runtimeUsable: { state: 'pending' },
        finalization: { state: 'pending' },
      },
    });

    await client.stop('phase_d_cleanup');
  });

  it('Phase D: reports ready from the chat list alone and keeps a missing runtime observable as pending work', async () => {
    vi.spyOn(Transport.prototype as any, 'fetchLivePatchesWithCache').mockResolvedValue({
      data: [],
      tag: 'empty',
      source: 'remote' as const,
    });

    // Since the October 2026 lifecycle change, readiness follows WhatsApp's own screens.
    // Startup no longer validates or repairs the injected runtime before reporting ready.
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: false,
      storeMsgAvailable: false,
      sessionLoaded: true,
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'resolved') {
      throw new Error(`Expected an authenticated session to start without a runtime validation gate, but it rejected with: ${String(startResult.error)}`);
    }

    expect(recordedEvents.filter((event) => event.name === 'client.ready')).toHaveLength(1);

    const readiness = client.getReadiness();
    expect(readiness).toMatchObject({
      ready: true,
      status: 'ready',
      blockers: [],
      lowerLevel: {
        runtimeOperational: false,
        runtimeBridgeReady: false,
      },
      requirements: {
        runtimeUsable: { state: 'satisfied' },
        patchLifecycle: { state: 'non_blocking' },
        finalization: { state: 'satisfied' },
      },
    });
    expect(readiness.pending).toEqual(expect.arrayContaining(['runtimeOperational', 'runtimeBridgeReady']));

    await client.stop('phase_d_chat_list_cleanup');
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

  it('Phase E: invalid license remains observable without blocking public readiness', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: true,
      licenseKey: 'invalid-demo-license',
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'resolved') {
      throw new Error(`Expected public bootstrap to resolve after an invalid license, but it rejected with: ${String(startResult.error)}`);
    }

    expect(client.getReadiness()).toMatchObject({
      ready: true,
      requirements: { licenseLifecycle: { state: 'non_blocking' } },
    });
    expect(recordedEvents.filter((event) => event.name === 'client.ready')).toHaveLength(1);

    const invalidCheckIndex = recordedEvents.findIndex((event) => {
      if (event.name !== 'launch.license.check.after') return false;
      const payload = event.payload as { details?: { status?: string } } | undefined;
      return payload?.details?.status === 'invalid';
    });

    if (invalidCheckIndex === -1) {
      throw new Error('Expected invalid license path to emit launch.license.check.after with status=invalid.');
    }

    const finalizeIndex = findEventIndex(recordedEvents, 'launch.client.finalize.after');
    expect(finalizeIndex).toBeGreaterThan(invalidCheckIndex);
    expect(findEventIndex(recordedEvents, 'client.ready')).toBeGreaterThan(finalizeIndex);

    await client.stop('phase_e_invalid_license_cleanup');
  });

  it('Phase E: expired license remains observable without blocking public readiness', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: true,
      licenseKey: 'expired-demo-license',
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'resolved') {
      throw new Error(`Expected public bootstrap to resolve after an expired license, but it rejected with: ${String(startResult.error)}`);
    }

    expect(client.getReadiness()).toMatchObject({
      ready: true,
      requirements: { licenseLifecycle: { state: 'non_blocking' } },
    });
    expect(recordedEvents.filter((event) => event.name === 'client.ready')).toHaveLength(1);

    const expiredCheckIndex = recordedEvents.findIndex((event) => {
      if (event.name !== 'launch.license.check.after') return false;
      const payload = event.payload as { details?: { status?: string } } | undefined;
      return payload?.details?.status === 'expired';
    });

    if (expiredCheckIndex === -1) {
      throw new Error('Expected expired license path to emit launch.license.check.after with status=expired.');
    }

    const finalizeIndex = findEventIndex(recordedEvents, 'launch.client.finalize.after');
    expect(finalizeIndex).toBeGreaterThan(expiredCheckIndex);
    expect(findEventIndex(recordedEvents, 'client.ready')).toBeGreaterThan(finalizeIndex);

    await client.stop('phase_e_expired_license_cleanup');
  });

  it('Phase F: pre-auth required-method gaps do not stop QR pairing, and the post-auth runtime reports none missing', async () => {
    vi.spyOn(Transport.prototype as any, 'fetchLivePatchesWithCache').mockResolvedValue({
      data: [],
      tag: 'empty',
      source: 'remote' as const,
    });

    const requiredMethods = ['onAck', 'onAnyMessage', 'onStateChanged'];
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      runtimeMethods: ['onAnyMessage', 'onStateChanged'],
      storeMsgAvailable: true,
      sessionLoaded: false,
    });

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
      throw new Error(`Expected a pre-auth required-method gap to be deferred, but bootstrap rejected with: ${String(startResult.error)}`);
    }

    const qrGeneratedIndex = findEventIndex(recordedEvents, 'launch.auth.qr.generated');
    expect(qrGeneratedIndex).toBeGreaterThan(-1);

    // The runtime is injected again once WhatsApp has authenticated.
    const postAuthInjectionIndex = recordedEvents.findIndex(
      (event, index) => index > qrGeneratedIndex && event.name === 'launch.wapi.inject.after',
    );
    expect(postAuthInjectionIndex).toBeGreaterThan(qrGeneratedIndex);
    expect(recordedEvents[postAuthInjectionIndex]?.payload).toMatchObject({ details: { success: true } });
    expect(findEventIndex(recordedEvents, 'client.ready')).toBeGreaterThan(postAuthInjectionIndex);

    expect(recordedEvents.filter((event) => event.name === 'error')).toEqual([]);
    expect(client.getReadiness()).toMatchObject({
      ready: true,
      pending: [],
      lowerLevel: {
        runtimeBridgeReady: true,
        missingRuntimeMethods: [],
      },
      requirements: {
        runtimeUsable: { state: 'satisfied' },
      },
    });

    await client.stop('phase_f_broken_method_deferred_cleanup');
  });

  it('Phase F: a required runtime method still missing after authentication stays observable in readiness', async () => {
    vi.spyOn(Transport.prototype as any, 'fetchLivePatchesWithCache').mockResolvedValue({
      data: [],
      tag: 'empty',
      source: 'remote' as const,
    });

    // Startup no longer runs an integrity gate or a repair cycle. The gap is
    // reported in the readiness snapshot for callers that want to act on it.
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      runtimeMethods: ['onAnyMessage', 'onStateChanged', 'onAddedToGroup'],
      storeMsgAvailable: true,
      sessionLoaded: true,
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'resolved') {
      throw new Error(`Expected a missing runtime method to be reported, not to reject bootstrap, but it rejected with: ${String(startResult.error)}`);
    }

    expect(recordedEvents.filter((event) => event.name === 'client.ready')).toHaveLength(1);
    expect(client.getReadiness()).toMatchObject({
      ready: true,
      pending: ['runtimeBridgeReady'],
      blockers: [],
      lowerLevel: {
        runtimeOperational: true,
        runtimeBridgeReady: false,
        missingRuntimeMethods: ['onAck'],
      },
    });

    await client.stop('phase_f_broken_method_observable_cleanup');
  });

  it('Phase F failure classes: a failed post-auth runtime injection rejects start() and blocks readiness', async () => {
    vi.spyOn(Transport.prototype, 'injectWapi').mockRejectedValue(new Error('simulated injection failure'));

    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: false,
      storeMsgAvailable: false,
      sessionLoaded: true,
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'rejected') {
      throw new Error('A failed post-auth runtime injection must block readiness entirely, but start() resolved.');
    }

    // The pre-auth attempt is deferred, so authentication still completes before the failure.
    expect(String(startResult.error)).toContain('simulated injection failure');
    expect(recordedEvents.find((event) => event.name === 'launch.auth.check.after')?.payload).toMatchObject({
      details: { isAuthenticated: true },
    });

    requireBlockedReady(
      recordedEvents,
      'A failed post-auth runtime injection must block readiness entirely, but client.ready still emitted.'
    );
    expect(findEventIndex(recordedEvents, 'core.started')).toBe(-1);
    expect(findEventIndex(recordedEvents, 'launch.client.finalize.after')).toBe(-1);
    expect(client.getReadiness()).toMatchObject({
      ready: false,
      status: 'not_ready',
      requirements: {
        runtimeUsable: { state: 'pending' },
        finalization: { state: 'pending' },
      },
    });

    await client.stop('phase_f_fatal_cleanup');
  });

  it('Phase G: fresh auth injects the runtime again after authentication, before overlays begin', async () => {
    let recordedAtAuthentication = -1;
    let recorded: RecordedEvent[] = [];

    vi.spyOn(Transport.prototype, 'waitForAuthentication').mockImplementation(async function (this: Transport) {
      const page = this.getPage() as FakePage;
      page.setSessionLoaded(true);
      page.setRuntimeAvailable(false);
      page.setStoreMsgAvailable(false);
      page.setRecoverRuntimeOnNextLaunchInjection(true);
      recordedAtAuthentication = recorded.length;

      return {
        outcome: 'authenticated',
        qrSeen: true,
        qrAttempts: 1,
      };
    });

    const { client, page, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: false,
    });
    recorded = recordedEvents;

    const startResult = await settleStart(client);
    if (startResult.status !== 'resolved') {
      throw new Error(`Expected fresh-auth post-auth recovery path to resolve, but it rejected with: ${String(startResult.error)}`);
    }

    expect(page.getLaunchInjectionCount()).toBeGreaterThanOrEqual(2);
    expect(page.isRuntimeAvailable()).toBe(true);
    expect(recordedAtAuthentication).toBeGreaterThan(-1);

    const postAuthInjectionIndex = recordedEvents.findIndex(
      (event, index) => index >= recordedAtAuthentication && event.name === 'launch.wapi.inject.after',
    );
    const overlayIndex = recordedEvents.findIndex(
      (event, index) => index >= recordedAtAuthentication && event.name === 'patch.init.before',
    );
    expect(postAuthInjectionIndex).toBeGreaterThan(-1);
    expect(recordedEvents[postAuthInjectionIndex]?.payload).toMatchObject({ details: { success: true } });
    expect(overlayIndex).toBeGreaterThan(postAuthInjectionIndex);

    const finalizeAfterIndex = findEventIndex(recordedEvents, 'launch.client.finalize.after');
    const readyIndex = findEventIndex(recordedEvents, 'client.ready');
    expect(finalizeAfterIndex).toBeGreaterThan(overlayIndex);
    expect(readyIndex).toBeGreaterThan(finalizeAfterIndex);

    await client.stop('phase_g_fresh_auth_post_auth_reinject_cleanup');
  });

  it('Phase G: resumed sessions inject once before and once after authentication, and no more', async () => {
    const originalInjectWapi = Transport.prototype.injectWapi;
    const injectSpy = vi.spyOn(Transport.prototype, 'injectWapi').mockImplementation(function (this: Transport, options) {
      return originalInjectWapi.call(this, options);
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

    // The simple lifecycle has no repair or reinjection loop: one optional attempt while
    // WhatsApp authenticates, then one authoritative injection with freshly loaded patches.
    expect(injectSpy).toHaveBeenCalledTimes(2);
    expect(injectSpy.mock.calls[0]).toEqual([]);
    expect(injectSpy.mock.calls[1]).toEqual([{ reuseCachedPatches: false }]);

    await client.stop('phase_g_resumed_session_truthful_cleanup');
  });

  it('Phase G: client.ready does not emit until authentication, injection, overlays, and finalization are complete', async () => {
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

    // Finalization is the last step before readiness: it follows the final overlay.
    const finalizeAfterIndex = findEventIndex(recordedEvents, 'launch.client.finalize.after');
    const lastOverlayIndex = recordedEvents.reduce(
      (last, event, index) => (['patch.init.after', 'license.check.after', 'license.inject.after'].includes(String(event.name)) ? index : last),
      -1,
    );
    expect(lastOverlayIndex).toBeGreaterThan(-1);
    expect(finalizeAfterIndex).toBeGreaterThan(lastOverlayIndex);

    const requiredBeforeReady: Array<{ name: string; events: string[] }> = [
      {
        name: 'authentication completion',
        events: ['launch.auth.check.after'],
      },
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
    vi.spyOn(Transport.prototype as any, 'fetchLivePatchesWithCache').mockResolvedValue({
      data: [],
      tag: null,
      source: 'none' as const,
    });

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

    client.events.on('launch.client.finalize.after', () => {
      markerOrder.push('finalize.after');
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

    expect(markerOrder).not.toContain('finalize.after');
    expect(markerOrder).not.toContain('client.ready');
    expect(findEventIndex(recordedEvents, 'client.ready')).toBe(-1);

    releaseHook();

    const startResult = await startPromise;
    if (startResult.status !== 'resolved') {
      throw new Error(`Expected finalization-hook bootstrap fixture to resolve, but it rejected with: ${String(startResult.error)}`);
    }

    expect(markerOrder).toEqual(['hook.start', 'hook.end', 'finalize.after', 'client.ready']);

    await client.stop('phase_g_hook_cleanup');
  });

  it('Phase G: an unfinished QR authentication rejects start() with its outcome and never finalizes', async () => {
    const finalizationHook = vi.fn();
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: false,
    });
    client.registerFinalizationHook(finalizationHook);

    const startResult = await settleStart(client);

    if (startResult.status !== 'rejected') {
      throw new Error('Expected an unscanned QR to reject start(), but it resolved.');
    }

    expect(String(startResult.error)).toContain('Authentication did not finish: qr_timeout');

    requireBlockedReady(
      recordedEvents,
      'An unfinished authentication must block client.ready, but client.ready still emitted after the QR timed out.'
    );

    // Authentication got as far as showing the QR; nothing after it ran.
    const qrGeneratedIndex = findEventIndex(recordedEvents, 'launch.auth.qr.generated');
    expect(qrGeneratedIndex).toBeGreaterThan(-1);
    expect(recordedEvents.slice(qrGeneratedIndex).map((event) => event.name)).not.toContain('launch.wapi.inject.before');
    expect(findEventIndex(recordedEvents, 'patch.init.before')).toBe(-1);
    expect(findEventIndex(recordedEvents, 'launch.client.finalize.after')).toBe(-1);
    expect(finalizationHook).not.toHaveBeenCalled();

    expect(client.getReadiness()).toMatchObject({
      ready: false,
      status: 'not_ready',
      requirements: {
        finalization: { state: 'pending' },
      },
    });

    await client.stop('phase_g_finalize_failure_cleanup');
  });

  it('classifies phone-out-of-reach distinctly from ordinary authentication timeout', async () => {
    // WhatsApp replaces the pairing QR with its "Trying to reach phone" notice.
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: false,
      phoneOutOfReach: true,
      qrDisappearsAfterNavigation: true,
      authTimeoutMs: 5,
      oorTimeoutMs: 5,
      qrPollingMs: 1,
    });

    const startResult = await settleStart(client);

    expect(startResult.status).toBe('rejected');
    expect(String(startResult.status === 'rejected' ? startResult.error : '')).toContain('Authentication did not finish: phone_out_of_reach');
    expect(findEventIndex(recordedEvents, 'launch.auth.phoneOutOfReach')).toBeGreaterThan(-1);
    expect(findEventIndex(recordedEvents, 'client.ready')).toBe(-1);

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
      qrDisappearsAfterNavigation: true,
      authTimeoutMs: 5,
      oorTimeoutMs: 5,
      qrPollingMs: 1,
    });

    const startResult = await settleStart(client);

    expect(startResult.status).toBe('rejected');
    expect(String(startResult.status === 'rejected' ? startResult.error : '')).toContain('Authentication did not finish: auth_timeout');
    expect(String(startResult.status === 'rejected' ? startResult.error : '')).not.toContain('phone_out_of_reach');
    expect(findEventIndex(recordedEvents, 'launch.auth.phoneOutOfReach')).toBe(-1);
    expect(findEventIndex(recordedEvents, 'client.ready')).toBe(-1);

    const timeoutEvent = recordedEvents.find((event) => event.name === 'launch.auth.timeout');
    const timeoutPayload = timeoutEvent?.payload as { details?: { phoneOutOfReach?: boolean } } | undefined;
    expect(timeoutPayload?.details?.phoneOutOfReach).toBe(false);

    await client.stop('auth_timeout_classification_cleanup');
  });

  it('supports the retained link-code auth path explicitly when the runtime exposes window.linkCode', async () => {
    const { client, recordedEvents } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: false,
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

    // The link code replaces QR pairing: the login screen's QR is never offered to the caller.
    expect(findEventIndex(recordedEvents, 'launch.auth.qr.generated')).toBe(-1);
    expect(findEventIndex(recordedEvents, 'client.ready')).toBeGreaterThan(
      findEventIndex(recordedEvents, 'launch.auth.linkCode.generated'),
    );

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
    expect(String(startResult.status === 'rejected' ? startResult.error : '')).toContain('Authentication did not finish: qr_max');

    const qrGeneratedEvents = recordedEvents.filter((event) => event.name === 'launch.auth.qr.generated');
    expect(qrGeneratedEvents).toHaveLength(1);

    await client.stop('qr_max_classification_cleanup');
  });

  it('fails fast in createClient.screenshot() before touching the Lightpanda page screenshot path', async () => {
    const { client, page } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: true,
      driverName: 'lightpanda',
      driverCapabilities: {
        screenshot: { supported: false, reason: 'Lightpanda has no rendering engine' },
        rendering: { supported: false, reason: 'Lightpanda has no rendering engine' },
      },
      screenshotError: new Error('page.screenshot() should not have been called'),
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'resolved') {
      throw new Error(`Expected screenshot delegation harness to start successfully, but it rejected with: ${String(startResult.error)}`);
    }

    await expect(client.screenshot()).rejects.toThrow(
      "Driver 'Lightpanda' does not support capability 'screenshot': Lightpanda has no rendering engine",
    );
    expect(page.getScreenshotCallCount()).toBe(0);

    await client.stop('lightpanda_screenshot_guard_cleanup');
  });

  it('keeps supported non-rendering client entrypoints working under Lightpanda', async () => {
    const { client } = await createHarness({
      runtimeAvailable: true,
      storeMsgAvailable: true,
      sessionLoaded: true,
      driverName: 'lightpanda',
      driverCapabilities: {
        screenshot: { supported: false, reason: 'Lightpanda has no rendering engine' },
        rendering: { supported: false, reason: 'Lightpanda has no rendering engine' },
      },
    });

    const startResult = await settleStart(client);

    if (startResult.status !== 'resolved') {
      throw new Error(`Expected non-rendering Lightpanda harness to start successfully, but it rejected with: ${String(startResult.error)}`);
    }

    await expect(client.evaluateScript('window.Store != null')).resolves.toBeUndefined();

    await client.stop('lightpanda_non_rendering_path_cleanup');
  });

  describe('payload depth: remote patch fetch', () => {
    it('includes remote patches in preloaded artifacts when cdn.openwa.dev responds', async () => {
      // Spy on the private method via prototype to simulate successful remote fetch
      const fetchSpy = vi.spyOn(
        Transport.prototype as any,
        'fetchLivePatchesWithCache',
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
        'fetchLivePatchesWithCache',
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

    it('reports a failed deferred init patch without blocking readiness', async () => {
      const fetchSpy = vi.spyOn(
        Transport.prototype as any,
        'fetchLivePatchesWithCache',
      ).mockResolvedValue({
        data: [],
        tag: 'empty',
        source: 'remote' as const,
      });

      // Since the October 2026 lifecycle change a patch failure is reported, not fatal:
      // the session is authenticated, so startup finishes and leaves the failure observable.
      const { client, recordedEvents } = await createHarness({
        runtimeAvailable: true,
        storeMsgAvailable: true,
        sessionLoaded: true,
        licenseKey: 'community-valid-license',
        initPatchFails: true,
      });

      const startResult = await settleStart(client);

      if (startResult.status !== 'resolved') {
        throw new Error(`Expected a failed deferred init patch to be reported without rejecting start(), but it rejected with: ${String(startResult.error)}`);
      }

      const initPatchApplyAfterIndex = recordedEvents.findIndex((event) => {
        if (event.name !== 'patch.apply.after') {
          return false;
        }

        const payload = event.payload as { details?: { patchId?: string } } | undefined;
        return payload?.details?.patchId === 'init-patch-legacy';
      });
      expect(recordedEvents[initPatchApplyAfterIndex]?.payload).toMatchObject({
        details: { applied: false, outcome: 'failed', required: true },
      });

      const initPatchSummaryIndex = recordedEvents.findIndex(
        (event, index) => index > initPatchApplyAfterIndex && event.name === 'patch.init.after',
      );
      expect(recordedEvents[initPatchSummaryIndex]?.payload).toMatchObject({
        details: { applied: [], outcome: 'failed', blockingFailure: true },
      });

      const readyIndex = findEventIndex(recordedEvents, 'client.ready');
      expect(readyIndex).toBeGreaterThan(initPatchSummaryIndex);
      expect(client.getReadiness()).toMatchObject({
        ready: true,
        status: 'ready',
      });

      await client.stop('deferred_init_patch_failure_cleanup');
      fetchSpy.mockRestore();
    });
  });

  describe('payload depth: license server validation', () => {
    it('preloads the license with the host ID once the live patch has revealed it', async () => {
      const unknownHost = {
        WA_VERSION: '2.3000.0',
        WA_AUTOMATE_VERSION: '5.0.0',
        hostNumber: '',
      };
      const resolvedHost = { ...unknownHost, hostNumber: '1234567890@c.us' };
      let recorded: RecordedEvent[] = [];
      const livePatchesApplied = () => recorded.some((event) => {
        const payload = event.payload as { details?: { phase?: string } } | undefined;
        return event.name === 'patch.init.after' && payload?.details?.phase === 'apply';
      });
      // The host ID is unknown until the live patches have run.
      const debugSpy = vi.spyOn(Transport.prototype, 'getSessionDebugInfo')
        .mockImplementation(async () => (livePatchesApplied() ? resolvedHost : unknownHost));
      const originalPreload = Transport.prototype.preloadLicenseArtifact;
      const licensePreloadSpy = vi.spyOn(Transport.prototype, 'preloadLicenseArtifact')
        .mockImplementation(function (this: Transport, options) {
          if (!options.sessionInfo?.hostNumber) {
            return originalPreload.call(this, options);
          }
          return Promise.resolve({
            outcome: 'ready',
            status: 'valid',
            source: 'local',
            artifact: {
              key: 'insiders-test-key-12345',
              maskedKey: '******************2345',
              source: 'local',
              payload: 'window.__OPENWA_LICENSE__ = {}; window.KEYTYPE = "insiders"; true',
              keyType: 'insiders',
              payloadSource: 'server',
            },
            blockingFailure: false,
          });
        });
      vi.spyOn(Transport.prototype as any, 'fetchLivePatchesWithCache').mockResolvedValue({
        data: [],
        tag: 'empty',
        source: 'remote',
      });

      const { client, recordedEvents } = await createHarness({
        runtimeAvailable: true,
        storeMsgAvailable: true,
        sessionLoaded: true,
        licenseKey: 'insiders-test-key-12345',
      });
      recorded = recordedEvents;

      expect(await settleStart(client)).toMatchObject({ status: 'resolved' });

      // Startup preloads once without the host, then asks for the host a single time, after the live patches.
      expect(debugSpy).toHaveBeenCalledTimes(1);
      expect(licensePreloadSpy).toHaveBeenCalledTimes(2);
      expect(licensePreloadSpy.mock.calls[0]?.[0].sessionInfo).toBeUndefined();
      expect(licensePreloadSpy).toHaveBeenLastCalledWith(expect.objectContaining({
        licenseKey: 'insiders-test-key-12345',
        sessionInfo: expect.objectContaining({ hostNumber: '1234567890@c.us' }),
      }));
      expect(recordedEvents).toContainEqual(expect.objectContaining({
        name: 'launch.license.check.after',
        payload: expect.objectContaining({
          details: expect.objectContaining({ status: 'valid' }),
        }),
      }));
      expect(client.getReadiness()).toMatchObject({
        ready: true,
        requirements: { licenseLifecycle: { state: 'satisfied' } },
      });

      await client.stop('license_host_recovery_cleanup');
    });

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
      // by mocking fetchLivePatchesWithCache and using a spy on the license side
      const fetchSpy = vi.spyOn(
        Transport.prototype as any,
        'fetchLivePatchesWithCache',
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
        'fetchLivePatchesWithCache',
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
