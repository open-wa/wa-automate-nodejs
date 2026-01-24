# Issue #7: Browser Abstraction Layer (BAL) Design

**Priority**: 🟡 HIGH  
**Effort**: Large (3+ days for full implementation)  
**Impact**: Future-proofs the library, enables Playwright/other drivers

---

## Problem Statement

wa-automate is **tightly coupled to Puppeteer** with 64+ direct imports/references:

```typescript
// Current state - Puppeteer everywhere
import { Page, Browser, executablePath } from 'puppeteer';
const puppeteer = require('puppeteer-extra');

// Direct Puppeteer API calls
await waPage._client.send('Network.setBypassServiceWorker', { bypass: true });
puppeteer.use(stealth());
```

This prevents:
- Using Playwright (better debugging, Firefox/WebKit support)
- Using lightweight CDP-only solutions
- Using remote browser services (Browserless.io, Bright Data)
- Proper unit testing with mock browsers

---

## Solution: Contract-First Browser Abstraction Layer

Build a **typed interface layer** with a **capability system** that allows different browser automation implementations while maintaining a consistent API.

### Design Principles

1. **Small Core Surface**: Only what wa-automate truly needs
2. **Capabilities for Non-Portable Features**: CDP, stealth, PDF, etc.
3. **Escape Hatch**: `unwrap()` for power users who need the underlying object
4. **Type-Safe Narrowing**: `driver.has('cdp')` as type predicate

---

## Step 1: Create `@open-wa/driver-interface` Package

### Package Structure

```
packages/driver-interface/
├── src/
│   ├── types.ts              # Basic types (DriverName, LogMeta, etc.)
│   ├── capabilities.ts       # Capability system
│   ├── driver.ts             # IDriver, IBrowser, IPage, IElementHandle
│   ├── errors.ts             # DriverCapabilityError, etc.
│   ├── config.zod.ts         # Zod schemas for driver config
│   ├── contract-tests/       # Reusable test definitions
│   └── index.ts
├── package.json
└── tsconfig.json
```

### Core Interfaces

**File**: `packages/driver-interface/src/types.ts`

```typescript
export type DriverName = 'puppeteer' | 'playwright' | 'remote' | string;

export type LogMeta = Record<string, unknown>;

export type WaitForSelectorState = 'attached' | 'detached' | 'visible' | 'hidden';

export type ScreenshotType = 'png' | 'jpeg' | 'webp';

export interface IDriverContext {
    logger?: {
        debug(msg: string, meta?: LogMeta): void;
        info(msg: string, meta?: LogMeta): void;
        warn(msg: string, meta?: LogMeta): void;
        error(msg: string, meta?: LogMeta): void;
    };
}
```

**File**: `packages/driver-interface/src/capabilities.ts`

```typescript
/**
 * Capability keys for features that aren't universally supported
 */
export type DriverCapabilityKey =
    | 'cdp'                    // Chrome DevTools Protocol access
    | 'requestInterception'   // Intercept/modify requests
    | 'serviceWorkerBypass'   // Bypass service workers
    | 'stealth'               // Anti-detection measures
    | 'pdf'                   // PDF generation
    | 'tracing'               // Performance tracing
    | 'coverage'              // Code coverage
    | 'persistentContext'     // Persistent browser context
    | 'mobileEmulation'       // Mobile device emulation
    | 'downloads'             // Download handling
    | 'browserExtensions'     // Chrome extension loading
    | 'exposeBinding'         // Expose Node functions to page
    | 'devtools';             // DevTools panel

export type CapabilitySupport =
    | { supported: true; notes?: string }
    | { supported: false; reason: string };

export type DriverCapabilities = Record<DriverCapabilityKey, CapabilitySupport>;

/**
 * Interface for objects that report capabilities
 */
export interface IHasCapabilities {
    readonly name: DriverName;
    readonly version?: string;
    readonly capabilities: DriverCapabilities;

    /**
     * Type guard: narrows `this` to include capability extension interfaces
     */
    has<C extends DriverCapabilityKey>(
        cap: C
    ): this is this & CapabilityExtensionMap[C];

    /**
     * Fail-fast helper - throws if capability missing
     */
    require<C extends DriverCapabilityKey>(cap: C): void;
}

/**
 * Capability extension interfaces
 * Each capability key maps to an interface that provides its methods
 */
export interface CapabilityExtensionMap {
    cdp: ICDPSupport;
    requestInterception: IRequestInterceptionSupport;
    serviceWorkerBypass: IServiceWorkerBypassSupport;
    stealth: IStealthSupport;
    pdf: IPdfSupport;
    tracing: ITracingSupport;
    // ... others
}

// CDP Support
export interface ICDPSupport {
    cdp(): ICDPSession;
}

export interface ICDPSession {
    send<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
    detach(): Promise<void>;
}

// Request Interception Support
export interface IRequestInterceptionSupport {
    setRequestInterception(enabled: boolean): Promise<void>;
    onRequest(handler: (req: IRequest) => Promise<void> | void): void;
}

export interface IRequest {
    url(): string;
    method(): string;
    headers(): Record<string, string>;
    postData(): string | null;
    continue(overrides?: Partial<{
        url: string;
        method: string;
        headers: Record<string, string>;
        postData: string;
    }>): Promise<void>;
    abort(errorCode?: string): Promise<void>;
    respond(response: {
        status: number;
        headers?: Record<string, string>;
        body?: string | Uint8Array;
    }): Promise<void>;
}

// Service Worker Bypass Support
export interface IServiceWorkerBypassSupport {
    setBypassServiceWorker(bypass: boolean): Promise<void>;
}

// Stealth Support
export interface IStealthSupport {
    enableStealth(enabled: boolean): Promise<void>;
}

// PDF Support
export interface IPdfSupport {
    pdf(options?: { format?: string; printBackground?: boolean }): Promise<Uint8Array>;
}

// Tracing Support
export interface ITracingSupport {
    startTracing(options?: { screenshots?: boolean }): Promise<void>;
    stopTracing(): Promise<Uint8Array>;
}
```

**File**: `packages/driver-interface/src/driver.ts`

```typescript
import { IHasCapabilities, DriverCapabilities } from './capabilities';
import { IDriverContext, WaitForSelectorState, ScreenshotType } from './types';

// ============================================================================
// Launch/Connect Options
// ============================================================================

export interface LaunchOptions {
    headless?: boolean;
    executablePath?: string;
    args?: string[];
    proxy?: { server: string; username?: string; password?: string };
    userDataDir?: string;
    env?: Record<string, string>;
    timeoutMs?: number;
    defaultViewport?: { width: number; height: number } | null;
}

export interface ConnectOptions {
    wsEndpoint?: string;
    cdpEndpoint?: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
}

export interface PageOptions {
    viewport?: { width: number; height: number; deviceScaleFactor?: number };
    userAgent?: string;
    locale?: string;
    timezoneId?: string;
}

// ============================================================================
// IDriver - Factory for browsers
// ============================================================================

export interface IDriver extends IHasCapabilities {
    /**
     * Driver-level initialization (lazy load, plugin setup)
     */
    init(ctx?: IDriverContext): Promise<void>;

    /**
     * Launch a new browser instance
     */
    launch(options?: LaunchOptions): Promise<IBrowser>;

    /**
     * Connect to existing browser
     */
    connect(options: ConnectOptions): Promise<IBrowser>;

    /**
     * Escape hatch: get underlying driver object
     * Core should NOT depend on this
     */
    unwrap(): unknown;
}

// ============================================================================
// IBrowser - Browser instance
// ============================================================================

export interface IBrowser extends IHasCapabilities {
    /**
     * Create a new page
     */
    newPage(options?: PageOptions): Promise<IPage>;

    /**
     * Get all pages
     */
    pages(): Promise<IPage[]>;

    /**
     * Close the browser
     */
    close(): Promise<void>;

    /**
     * Check if still connected
     */
    isConnected(): boolean;

    /**
     * Get browser version string
     */
    versionString(): Promise<string>;

    /**
     * Escape hatch
     */
    unwrap(): unknown;
}

// ============================================================================
// IPage - Page instance
// ============================================================================

export interface EvaluateFn<Arg, Ret> {
    (arg: Arg): Ret | Promise<Ret>;
}

export interface IPage extends IHasCapabilities {
    // Navigation
    goto(url: string, options?: {
        waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
        timeoutMs?: number;
    }): Promise<void>;
    url(): string;
    reload(): Promise<void>;

    // JavaScript execution
    evaluate<Arg, Ret>(fn: EvaluateFn<Arg, Ret>, arg: Arg): Promise<Ret>;
    evaluateHandle<Arg>(fn: EvaluateFn<Arg, unknown>, arg: Arg): Promise<IJSHandle>;

    // Page settings
    setViewport(viewport: { width: number; height: number; deviceScaleFactor?: number }): Promise<void>;
    setUserAgent(ua: string): Promise<void>;
    setCacheEnabled(enabled: boolean): Promise<void>;
    setBypassCSP(enabled: boolean): Promise<void>;

    // Element selection
    waitForSelector(selector: string, options?: {
        timeoutMs?: number;
        state?: WaitForSelectorState;
    }): Promise<IElementHandle | null>;
    waitForFunction<Arg>(
        fn: EvaluateFn<Arg, boolean>,
        arg: Arg,
        options?: { timeoutMs?: number; pollingMs?: number }
    ): Promise<void>;
    $(selector: string): Promise<IElementHandle | null>;
    $$(selector: string): Promise<IElementHandle[]>;

    // Input
    click(selector: string, options?: { delayMs?: number }): Promise<void>;
    type(selector: string, text: string, options?: { delayMs?: number }): Promise<void>;

    // Screenshots
    screenshot(options?: {
        type?: ScreenshotType;
        quality?: number;
        fullPage?: boolean;
        path?: string;
    }): Promise<Uint8Array>;

    // Events
    on<E extends PageEventName>(event: E, handler: PageEventHandlerMap[E]): void;
    off<E extends PageEventName>(event: E, handler: PageEventHandlerMap[E]): void;

    // Expose functions
    exposeFunction(name: string, fn: (...args: any[]) => any): Promise<void>;

    // Lifecycle
    close(): Promise<void>;
    isClosed(): boolean;

    // Escape hatch
    unwrap(): unknown;
}

// ============================================================================
// Page Events
// ============================================================================

export type PageEventName =
    | 'console'
    | 'dialog'
    | 'pageerror'
    | 'request'
    | 'response'
    | 'requestfailed'
    | 'framenavigated'
    | 'close';

export type PageEventHandlerMap = {
    console: (msg: { type: string; text: string; location?: string }) => void;
    dialog: (dlg: {
        type: string;
        message: string;
        accept(promptText?: string): Promise<void>;
        dismiss(): Promise<void>;
    }) => void;
    pageerror: (err: Error) => void;
    request: (req: { url(): string; method(): string }) => void;
    response: (res: {
        url(): string;
        status(): number;
        headers(): Record<string, string>;
        text(): Promise<string>;
    }) => void;
    requestfailed: (req: { url(): string }) => void;
    framenavigated: (frame: { url(): string }) => void;
    close: () => void;
};

// ============================================================================
// IElementHandle - DOM element wrapper
// ============================================================================

export interface IElementHandle {
    click(options?: { delayMs?: number }): Promise<void>;
    type(text: string, options?: { delayMs?: number }): Promise<void>;
    focus(): Promise<void>;
    hover(): Promise<void>;

    getAttribute(name: string): Promise<string | null>;
    textContent(): Promise<string | null>;
    innerHTML(): Promise<string>;

    evaluate<Arg, Ret>(fn: EvaluateFn<Arg, Ret>, arg: Arg): Promise<Ret>;

    dispose(): Promise<void>;
    unwrap(): unknown;
}

// ============================================================================
// IJSHandle - JavaScript handle
// ============================================================================

export interface IJSHandle {
    jsonValue<T = unknown>(): Promise<T>;
    dispose(): Promise<void>;
    unwrap(): unknown;
}
```

**File**: `packages/driver-interface/src/errors.ts`

```typescript
/**
 * Error thrown when a required capability is missing
 */
export class DriverCapabilityError extends Error {
    constructor(
        public readonly capability: string,
        public readonly driver: string,
        public readonly reason: string,
        public readonly location?: string
    ) {
        super(
            `Capability "${capability}" required${location ? ` by ${location}` : ''}; ` +
            `driver="${driver}" does not support it: ${reason}`
        );
        this.name = 'DriverCapabilityError';
    }
}

/**
 * Error thrown for driver protocol/connection issues
 */
export class DriverProtocolError extends Error {
    constructor(message: string, public readonly driver: string) {
        super(`[${driver}] ${message}`);
        this.name = 'DriverProtocolError';
    }
}
```

---

## Step 2: Create `@open-wa/driver-puppeteer` Package

### Package Structure

```
packages/driver-puppeteer/
├── src/
│   ├── PuppeteerDriver.ts
│   ├── PuppeteerBrowser.ts
│   ├── PuppeteerPage.ts
│   ├── PuppeteerElementHandle.ts
│   ├── capabilities.ts
│   ├── plugins/
│   │   └── stealth.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### Implementation Example

**File**: `packages/driver-puppeteer/src/PuppeteerDriver.ts`

```typescript
import {
    IDriver,
    IBrowser,
    IDriverContext,
    LaunchOptions,
    ConnectOptions,
    DriverCapabilities,
    DriverCapabilityKey,
    CapabilityExtensionMap,
    DriverCapabilityError,
} from '@open-wa/driver-interface';
import { PuppeteerBrowser } from './PuppeteerBrowser';
import { PUPPETEER_CAPABILITIES } from './capabilities';

export class PuppeteerDriver implements IDriver {
    readonly name = 'puppeteer' as const;
    readonly version?: string;
    readonly capabilities: DriverCapabilities = PUPPETEER_CAPABILITIES;

    private puppeteer: any;
    private ctx?: IDriverContext;
    private stealthEnabled = false;

    async init(ctx?: IDriverContext): Promise<void> {
        this.ctx = ctx;
        
        // Lazy load puppeteer
        this.puppeteer = require('puppeteer-extra');
        
        // Get version
        const pkg = require('puppeteer/package.json');
        (this as any).version = pkg.version;
        
        this.ctx?.logger?.info('PuppeteerDriver initialized', { version: this.version });
    }

    has<C extends DriverCapabilityKey>(cap: C): this is this & CapabilityExtensionMap[C] {
        return this.capabilities[cap]?.supported === true;
    }

    require<C extends DriverCapabilityKey>(cap: C): void {
        if (!this.has(cap)) {
            const reason = (this.capabilities[cap] as any)?.reason || 'unknown';
            throw new DriverCapabilityError(cap, this.name, reason);
        }
    }

    async launch(options?: LaunchOptions): Promise<IBrowser> {
        if (!this.puppeteer) {
            await this.init();
        }

        // Apply stealth if requested
        if (this.stealthEnabled) {
            const { default: stealth } = await import('puppeteer-extra-plugin-stealth');
            this.puppeteer.use(stealth());
        }

        const browser = await this.puppeteer.launch({
            headless: options?.headless ?? true,
            executablePath: options?.executablePath,
            args: options?.args || [],
            defaultViewport: options?.defaultViewport,
            userDataDir: options?.userDataDir,
            timeout: options?.timeoutMs,
        });

        return new PuppeteerBrowser(browser, this.capabilities, this.ctx);
    }

    async connect(options: ConnectOptions): Promise<IBrowser> {
        if (!this.puppeteer) {
            await this.init();
        }

        const browser = await this.puppeteer.connect({
            browserWSEndpoint: options.wsEndpoint,
            timeout: options.timeoutMs,
        });

        return new PuppeteerBrowser(browser, this.capabilities, this.ctx);
    }

    // Stealth capability implementation
    async enableStealth(enabled: boolean): Promise<void> {
        this.stealthEnabled = enabled;
    }

    unwrap(): any {
        return this.puppeteer;
    }
}
```

**File**: `packages/driver-puppeteer/src/PuppeteerPage.ts`

```typescript
import {
    IPage,
    IElementHandle,
    IJSHandle,
    PageEventName,
    PageEventHandlerMap,
    EvaluateFn,
    DriverCapabilities,
    DriverCapabilityKey,
    CapabilityExtensionMap,
    DriverCapabilityError,
    IDriverContext,
    WaitForSelectorState,
    ScreenshotType,
    ICDPSession,
    IRequest,
} from '@open-wa/driver-interface';
import { Page } from 'puppeteer';
import { PuppeteerElementHandle } from './PuppeteerElementHandle';

export class PuppeteerPage implements IPage {
    readonly name = 'puppeteer' as const;
    readonly capabilities: DriverCapabilities;

    constructor(
        private page: Page,
        capabilities: DriverCapabilities,
        private ctx?: IDriverContext
    ) {
        this.capabilities = capabilities;
    }

    has<C extends DriverCapabilityKey>(cap: C): this is this & CapabilityExtensionMap[C] {
        return this.capabilities[cap]?.supported === true;
    }

    require<C extends DriverCapabilityKey>(cap: C): void {
        if (!this.has(cap)) {
            const reason = (this.capabilities[cap] as any)?.reason || 'unknown';
            throw new DriverCapabilityError(cap, this.name, reason);
        }
    }

    // Navigation
    async goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeoutMs?: number }): Promise<void> {
        await this.page.goto(url, {
            waitUntil: options?.waitUntil === 'networkidle' ? 'networkidle0' : options?.waitUntil,
            timeout: options?.timeoutMs,
        });
    }

    url(): string {
        return this.page.url();
    }

    async reload(): Promise<void> {
        await this.page.reload();
    }

    // JavaScript execution
    async evaluate<Arg, Ret>(fn: EvaluateFn<Arg, Ret>, arg: Arg): Promise<Ret> {
        return await this.page.evaluate(fn, arg);
    }

    async evaluateHandle<Arg>(fn: EvaluateFn<Arg, unknown>, arg: Arg): Promise<IJSHandle> {
        const handle = await this.page.evaluateHandle(fn, arg);
        return {
            async jsonValue<T>() { return await handle.jsonValue() as T; },
            async dispose() { await handle.dispose(); },
            unwrap() { return handle; },
        };
    }

    // Settings
    async setViewport(viewport: { width: number; height: number; deviceScaleFactor?: number }): Promise<void> {
        await this.page.setViewport(viewport);
    }

    async setUserAgent(ua: string): Promise<void> {
        await this.page.setUserAgent(ua);
    }

    async setCacheEnabled(enabled: boolean): Promise<void> {
        await this.page.setCacheEnabled(enabled);
    }

    async setBypassCSP(enabled: boolean): Promise<void> {
        await this.page.setBypassCSP(enabled);
    }

    // Element selection
    async waitForSelector(selector: string, options?: { timeoutMs?: number; state?: WaitForSelectorState }): Promise<IElementHandle | null> {
        const element = await this.page.waitForSelector(selector, {
            timeout: options?.timeoutMs,
            visible: options?.state === 'visible',
            hidden: options?.state === 'hidden',
        });
        return element ? new PuppeteerElementHandle(element) : null;
    }

    async waitForFunction<Arg>(fn: EvaluateFn<Arg, boolean>, arg: Arg, options?: { timeoutMs?: number; pollingMs?: number }): Promise<void> {
        await this.page.waitForFunction(fn, { timeout: options?.timeoutMs, polling: options?.pollingMs }, arg);
    }

    async $(selector: string): Promise<IElementHandle | null> {
        const element = await this.page.$(selector);
        return element ? new PuppeteerElementHandle(element) : null;
    }

    async $$(selector: string): Promise<IElementHandle[]> {
        const elements = await this.page.$$(selector);
        return elements.map(el => new PuppeteerElementHandle(el));
    }

    // Input
    async click(selector: string, options?: { delayMs?: number }): Promise<void> {
        await this.page.click(selector, { delay: options?.delayMs });
    }

    async type(selector: string, text: string, options?: { delayMs?: number }): Promise<void> {
        await this.page.type(selector, text, { delay: options?.delayMs });
    }

    // Screenshot
    async screenshot(options?: { type?: ScreenshotType; quality?: number; fullPage?: boolean; path?: string }): Promise<Uint8Array> {
        const buffer = await this.page.screenshot({
            type: options?.type,
            quality: options?.quality,
            fullPage: options?.fullPage,
            path: options?.path,
        });
        return new Uint8Array(buffer);
    }

    // Events
    on<E extends PageEventName>(event: E, handler: PageEventHandlerMap[E]): void {
        this.page.on(event as any, handler as any);
    }

    off<E extends PageEventName>(event: E, handler: PageEventHandlerMap[E]): void {
        this.page.off(event as any, handler as any);
    }

    // Expose functions
    async exposeFunction(name: string, fn: (...args: any[]) => any): Promise<void> {
        await this.page.exposeFunction(name, fn);
    }

    // Lifecycle
    async close(): Promise<void> {
        await this.page.close();
    }

    isClosed(): boolean {
        return this.page.isClosed();
    }

    // ========================================================================
    // Capability Extensions
    // ========================================================================

    // CDP Support
    cdp(): ICDPSession {
        this.require('cdp');
        const client = (this.page as any)._client();
        return {
            async send<T>(method: string, params?: Record<string, unknown>): Promise<T> {
                return await client.send(method, params);
            },
            async detach(): Promise<void> {
                await client.detach();
            },
        };
    }

    // Request Interception
    async setRequestInterception(enabled: boolean): Promise<void> {
        this.require('requestInterception');
        await this.page.setRequestInterception(enabled);
    }

    onRequest(handler: (req: IRequest) => Promise<void> | void): void {
        this.require('requestInterception');
        this.page.on('request', (puppeteerReq) => {
            const req: IRequest = {
                url: () => puppeteerReq.url(),
                method: () => puppeteerReq.method(),
                headers: () => puppeteerReq.headers(),
                postData: () => puppeteerReq.postData() || null,
                continue: (overrides) => puppeteerReq.continue(overrides),
                abort: (code) => puppeteerReq.abort(code),
                respond: (response) => puppeteerReq.respond(response),
            };
            handler(req);
        });
    }

    // Service Worker Bypass
    async setBypassServiceWorker(bypass: boolean): Promise<void> {
        this.require('serviceWorkerBypass');
        const cdp = this.cdp();
        await cdp.send('Network.setBypassServiceWorker', { bypass });
    }

    // Escape hatch
    unwrap(): Page {
        return this.page;
    }
}
```

**File**: `packages/driver-puppeteer/src/capabilities.ts`

```typescript
import { DriverCapabilities } from '@open-wa/driver-interface';

export const PUPPETEER_CAPABILITIES: DriverCapabilities = {
    cdp: { supported: true },
    requestInterception: { supported: true },
    serviceWorkerBypass: { supported: true },
    stealth: { supported: true, notes: 'Via puppeteer-extra-plugin-stealth' },
    pdf: { supported: true },
    tracing: { supported: true },
    coverage: { supported: true },
    persistentContext: { supported: true, notes: 'Via userDataDir' },
    mobileEmulation: { supported: true },
    downloads: { supported: true },
    browserExtensions: { supported: true, notes: 'Chrome only' },
    exposeBinding: { supported: true },
    devtools: { supported: true },
};
```

---

## Step 3: Configuration Design

### User Configuration

```typescript
// packages/core/src/api/model/config.ts

import { IDriver, LaunchOptions } from '@open-wa/driver-interface';

export type DriverConfig =
    // String shorthand (most common)
    | { driver?: 'puppeteer'; driverOptions?: LaunchOptions & { stealth?: boolean } }
    | { driver: 'playwright'; driverOptions?: LaunchOptions & { browser?: 'chromium' | 'firefox' | 'webkit' } }
    // Explicit injection (advanced)
    | { driver: IDriver };

// Usage examples:
const config1 = {
    sessionId: 'my-session',
    // Default: Puppeteer
};

const config2 = {
    sessionId: 'my-session',
    driver: 'playwright',
    driverOptions: { browser: 'firefox', headless: true }
};

const config3 = {
    sessionId: 'my-session',
    driver: new CustomDriver(), // IDriver implementation
};
```

### Driver Resolution

```typescript
// packages/core/src/controllers/driver-resolver.ts

import { IDriver } from '@open-wa/driver-interface';
import { ConfigObject } from '../api/model';

export async function resolveDriver(config: ConfigObject): Promise<IDriver> {
    // Explicit driver injection
    if (config.driver && typeof config.driver === 'object') {
        return config.driver as IDriver;
    }

    // String-based driver selection
    const driverName = config.driver || 'puppeteer';

    switch (driverName) {
        case 'puppeteer': {
            const { PuppeteerDriver } = await import('@open-wa/driver-puppeteer');
            const driver = new PuppeteerDriver();
            await driver.init();
            if (config.driverOptions?.stealth) {
                await driver.enableStealth(true);
            }
            return driver;
        }

        case 'playwright': {
            const { PlaywrightDriver } = await import('@open-wa/driver-playwright');
            const driver = new PlaywrightDriver({
                browser: config.driverOptions?.browser || 'chromium',
            });
            await driver.init();
            return driver;
        }

        default:
            throw new Error(`Unknown driver: ${driverName}`);
    }
}
```

---

## Step 4: Migration Strategy

### Phase 0: Add Packages (No Behavior Change)

1. Create `@open-wa/driver-interface` with all interfaces
2. Create `@open-wa/driver-puppeteer` wrapping existing Puppeteer usage
3. Add as dependencies but don't use yet

**Outcome**: Packages exist, can be tested in isolation

### Phase 1: Replace Types in Core (Low Risk)

Replace Puppeteer types with BAL types:

```typescript
// Before
import { Page, Browser } from 'puppeteer';
private _page: Page;

// After
import { IPage, IBrowser } from '@open-wa/driver-interface';
private _page: IPage;
```

**Outcome**: Compilation forces routing through BAL interfaces

### Phase 2: Migrate Puppeteer-Specific Calls (Medium Risk)

Target hotspots one by one:

```typescript
// Before
await this._page._client.send('Network.setBypassServiceWorker', { bypass: true });

// After
if (this._page.has('serviceWorkerBypass')) {
    await this._page.setBypassServiceWorker(true);
}
```

**Outcome**: Core becomes driver-agnostic

### Phase 3: Add Playwright Driver (Feature-Gated)

1. Implement `@open-wa/driver-playwright`
2. Test with WhatsApp Web
3. Mark missing features via capability reasons
4. Release as experimental

**Outcome**: Early adopters can try Playwright

### Phase 4: Remove Direct Puppeteer Imports (Completion)

1. Core depends only on `@open-wa/driver-interface`
2. Puppeteer is implementation detail of `driver-puppeteer`
3. Remove all `import ... from 'puppeteer'` in core

**Outcome**: True decoupling achieved

---

## Step 5: Capability Matrix

| Capability | Puppeteer | Playwright (Chromium) | Playwright (Firefox) | Playwright (WebKit) |
|------------|:---------:|:---------------------:|:--------------------:|:-------------------:|
| Core (navigate, evaluate, etc.) | ✅ | ✅ | ✅ | ✅ |
| CDP Access | ✅ | ✅ | ❌ | ❌ |
| Request Interception | ✅ | ✅ | ✅ | ✅ |
| Service Worker Bypass | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Stealth Plugins | ✅ | ⚠️ | ❌ | ❌ |
| PDF Generation | ✅ | ✅ | ❌ | ❌ |
| Tracing | ⚠️ | ✅ | ✅ | ✅ |
| Code Coverage | ✅ | ✅ | ❌ | ❌ |
| Persistent Context | ✅ | ✅ | ✅ | ✅ |
| Mobile Emulation | ✅ | ✅ | ✅ | ✅ |
| Browser Extensions | ✅ | ❌ | ❌ | ❌ |

Legend: ✅ Supported, ⚠️ Partial/Different API, ❌ Not Supported

---

## Step 6: Testing Strategy

### Contract Tests

```typescript
// packages/driver-interface/src/contract-tests/page.contract.ts

import { IPage } from '../driver';

export function runPageContractTests(createPage: () => Promise<IPage>) {
    describe('IPage Contract', () => {
        let page: IPage;

        beforeEach(async () => {
            page = await createPage();
        });

        afterEach(async () => {
            await page.close();
        });

        it('should navigate to URL', async () => {
            await page.goto('https://example.com');
            expect(page.url()).toContain('example.com');
        });

        it('should evaluate JavaScript', async () => {
            await page.goto('about:blank');
            const result = await page.evaluate(() => 1 + 1, undefined);
            expect(result).toBe(2);
        });

        it('should take screenshots', async () => {
            await page.goto('https://example.com');
            const screenshot = await page.screenshot();
            expect(screenshot.length).toBeGreaterThan(0);
        });

        // ... more tests
    });
}
```

### Running Against Multiple Drivers

```typescript
// packages/driver-puppeteer/test/contract.test.ts
import { runPageContractTests } from '@open-wa/driver-interface/contract-tests';
import { PuppeteerDriver } from '../src';

describe('Puppeteer Driver', () => {
    const driver = new PuppeteerDriver();
    let browser: any;

    beforeAll(async () => {
        await driver.init();
        browser = await driver.launch({ headless: true });
    });

    afterAll(async () => {
        await browser.close();
    });

    runPageContractTests(() => browser.newPage());
});
```

### Mock Driver for Unit Tests

```typescript
// packages/driver-interface/src/MockDriver.ts

export class MockDriver implements IDriver {
    readonly name = 'mock';
    readonly capabilities = MOCK_CAPABILITIES;

    pages: MockPage[] = [];

    async init(): Promise<void> {}

    async launch(): Promise<IBrowser> {
        return new MockBrowser(this);
    }

    // ... mock implementations
}
```

---

## Step 7: Risk Analysis

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Semantic differences (auto-wait, timing) | HIGH | MEDIUM | Define behavioral contracts, add driver tuning |
| Hidden CDP usage in core | HIGH | HIGH | Audit and wrap all CDP calls with capability guards |
| Stealth expectation mismatch | MEDIUM | HIGH | Document clearly, keep Puppeteer default |
| Bundle size bloat | MEDIUM | LOW | peerDependencies + dynamic imports |
| Breaking TypeScript API | LOW | MEDIUM | Keep deprecated exports, provide `unwrap()` |

---

## Step 8: Integration with Existing Architecture

### With Schema System

```typescript
// Driver type in config schema
import { z } from 'zod';

export const DriverConfigSchema = z.discriminatedUnion('driver', [
    z.object({
        driver: z.literal('puppeteer').optional(),
        driverOptions: PuppeteerOptionsSchema.optional(),
    }),
    z.object({
        driver: z.literal('playwright'),
        driverOptions: PlaywrightOptionsSchema.optional(),
    }),
]);
```

### With Logger

```typescript
// Logger context includes driver info
import { LoggerContext } from '@open-wa/logger';

const context: LoggerContext = {
    sessionId: 'my-session',
    driver: driver.name,        // 'puppeteer' | 'playwright' | etc.
    driverVersion: driver.version,
};
```

### With Event System

```typescript
// Emit driver-related events
import { eventRegistry } from '@open-wa/schema';

const driverErrorEvent = defineListenerV2('driverError', {
    meta: { description: 'Driver-level error occurred' },
    payload: z.object({
        driver: z.string(),
        error: z.string(),
        capability: z.string().optional(),
    }),
});
```

---

## Deliverables Summary

| Deliverable | Status | Location |
|-------------|--------|----------|
| Interface definitions | 📋 Designed | This document |
| Package structure | 📋 Designed | This document |
| Puppeteer adapter | 📋 Designed | This document |
| Migration plan | 📋 Designed | 4 phases above |
| Capability matrix | 📋 Designed | Step 5 above |
| Configuration design | 📋 Designed | Step 3 above |
| Risk analysis | 📋 Designed | Step 7 above |

---

## Next Steps

1. **Create `packages/driver-interface`** - Pure TypeScript interfaces
2. **Create `packages/driver-puppeteer`** - Wrap existing usage
3. **Add to pnpm-workspace.yaml** - Include new packages
4. **Phase 1 migration** - Replace types in core
5. **Iterate on capability coverage** - Add missing capabilities as discovered

---

## Alignment with Other Issues

| Issue | Relationship |
|-------|--------------|
| [01-clientregistry-cutover](./01-clientregistry-cutover.md) | Driver config should be in schema |
| [02-define-listener-v2](./02-define-listener-v2.md) | Driver events can be typed in eventRegistry |
| [05-typescript-strictness](./05-typescript-strictness.md) | Driver interfaces should be strict from day 1 |
| [06-plugin-architecture](./06-plugin-architecture.md) | Drivers could be plugin-style in future |
