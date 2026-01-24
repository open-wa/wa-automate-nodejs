# Issue #07a: Browser Abstraction - Thin Puppeteer Adapter (v5.0 Scope)

**Priority**: MEDIUM  
**Effort**: 2-3 days  
**Risk**: LOW  
**Depends on**: Core stabilization (01, 01a, 02, 03)  
**Blocks**: Future Playwright support (07b)

---

## Problem Statement

wa-automate is tightly coupled to Puppeteer with 64+ direct imports. This prevents:
- Using Playwright (better debugging, Firefox/WebKit support)
- Using lightweight CDP-only solutions
- Using remote browser services (Browserless.io, Bright Data)
- Proper unit testing with mock browsers

---

## v5.0 Scope: Thin Wrapper Only

For v5.0, we create a **thin abstraction layer** that:
1. Wraps existing Puppeteer usage behind interfaces
2. Does NOT add Playwright support yet
3. Enables future extensibility without breaking changes

This is **refactoring**, not a feature addition.

---

## Step 1: Define Core Interfaces

**File**: `packages/driver-interface/src/types.ts`

```typescript
export type DriverName = 'puppeteer' | 'playwright' | 'remote' | string;

export interface IDriverContext {
    logger?: {
        debug(msg: string, meta?: Record<string, unknown>): void;
        info(msg: string, meta?: Record<string, unknown>): void;
        warn(msg: string, meta?: Record<string, unknown>): void;
        error(msg: string, meta?: Record<string, unknown>): void;
    };
}

export interface LaunchOptions {
    headless?: boolean;
    executablePath?: string;
    args?: string[];
    proxy?: { server: string; username?: string; password?: string };
    userDataDir?: string;
    timeoutMs?: number;
    defaultViewport?: { width: number; height: number } | null;
}

export interface ConnectOptions {
    wsEndpoint?: string;
    cdpEndpoint?: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
}
```

---

## Step 2: Define IDriver, IBrowser, IPage

**File**: `packages/driver-interface/src/driver.ts`

```typescript
import { LaunchOptions, ConnectOptions, IDriverContext, DriverName } from './types';

export interface IDriver {
    readonly name: DriverName;
    readonly version?: string;
    
    init(ctx?: IDriverContext): Promise<void>;
    launch(options?: LaunchOptions): Promise<IBrowser>;
    connect(options: ConnectOptions): Promise<IBrowser>;
    
    /** Escape hatch: get underlying driver object */
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
    
    // Navigation
    goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeoutMs?: number }): Promise<void>;
    url(): string;
    reload(): Promise<void>;
    
    // JavaScript execution
    evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret>;
    
    // Settings
    setViewport(viewport: { width: number; height: number }): Promise<void>;
    setUserAgent(ua: string): Promise<void>;
    
    // Element selection
    waitForSelector(selector: string, options?: { timeoutMs?: number }): Promise<IElementHandle | null>;
    waitForFunction<Arg>(fn: (arg: Arg) => boolean, arg: Arg, options?: { timeoutMs?: number }): Promise<void>;
    $(selector: string): Promise<IElementHandle | null>;
    $$(selector: string): Promise<IElementHandle[]>;
    
    // Input
    click(selector: string): Promise<void>;
    type(selector: string, text: string, options?: { delayMs?: number }): Promise<void>;
    
    // Screenshots
    screenshot(options?: { type?: 'png' | 'jpeg'; fullPage?: boolean }): Promise<Uint8Array>;
    
    // Expose functions
    exposeFunction(name: string, fn: (...args: any[]) => any): Promise<void>;
    
    // Lifecycle
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
```

---

## Step 3: Create PuppeteerDriver Wrapper

**File**: `packages/driver-puppeteer/src/PuppeteerDriver.ts`

```typescript
import { IDriver, IBrowser, LaunchOptions, ConnectOptions, IDriverContext } from '@open-wa/driver-interface';
import { PuppeteerBrowser } from './PuppeteerBrowser';

export class PuppeteerDriver implements IDriver {
    readonly name = 'puppeteer' as const;
    version?: string;
    
    private puppeteer: any;
    private ctx?: IDriverContext;
    
    async init(ctx?: IDriverContext): Promise<void> {
        this.ctx = ctx;
        
        // Lazy load puppeteer-extra
        this.puppeteer = require('puppeteer-extra');
        
        // Get version
        try {
            const pkg = require('puppeteer/package.json');
            this.version = pkg.version;
        } catch {}
        
        this.ctx?.logger?.info('PuppeteerDriver initialized', { version: this.version });
    }
    
    async launch(options?: LaunchOptions): Promise<IBrowser> {
        if (!this.puppeteer) await this.init();
        
        const browser = await this.puppeteer.launch({
            headless: options?.headless ?? true,
            executablePath: options?.executablePath,
            args: options?.args || [],
            defaultViewport: options?.defaultViewport,
            userDataDir: options?.userDataDir,
            timeout: options?.timeoutMs,
        });
        
        return new PuppeteerBrowser(browser, this.ctx);
    }
    
    async connect(options: ConnectOptions): Promise<IBrowser> {
        if (!this.puppeteer) await this.init();
        
        const browser = await this.puppeteer.connect({
            browserWSEndpoint: options.wsEndpoint,
            timeout: options.timeoutMs,
        });
        
        return new PuppeteerBrowser(browser, this.ctx);
    }
    
    unwrap(): any {
        return this.puppeteer;
    }
}
```

---

## Step 4: Create PuppeteerPage Wrapper

**File**: `packages/driver-puppeteer/src/PuppeteerPage.ts`

```typescript
import { IPage, IElementHandle, IDriverContext } from '@open-wa/driver-interface';
import { Page } from 'puppeteer';
import { PuppeteerElementHandle } from './PuppeteerElementHandle';

export class PuppeteerPage implements IPage {
    readonly name = 'puppeteer' as const;
    
    constructor(
        private page: Page,
        private ctx?: IDriverContext
    ) {}
    
    async goto(url: string, options?: { waitUntil?: string; timeoutMs?: number }): Promise<void> {
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
    
    async evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret> {
        return await this.page.evaluate(fn, arg);
    }
    
    async setViewport(viewport: { width: number; height: number }): Promise<void> {
        await this.page.setViewport(viewport);
    }
    
    async setUserAgent(ua: string): Promise<void> {
        await this.page.setUserAgent(ua);
    }
    
    async waitForSelector(selector: string, options?: { timeoutMs?: number }): Promise<IElementHandle | null> {
        const element = await this.page.waitForSelector(selector, { timeout: options?.timeoutMs });
        return element ? new PuppeteerElementHandle(element) : null;
    }
    
    async waitForFunction<Arg>(fn: (arg: Arg) => boolean, arg: Arg, options?: { timeoutMs?: number }): Promise<void> {
        await this.page.waitForFunction(fn, { timeout: options?.timeoutMs }, arg);
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
    
    async close(): Promise<void> {
        await this.page.close();
    }
    
    isClosed(): boolean {
        return this.page.isClosed();
    }
    
    unwrap(): Page {
        return this.page;
    }
}
```

---

## Step 5: Integration with Core

### In core, replace direct Puppeteer imports:

```typescript
// Before
import { Page, Browser } from 'puppeteer';
private _page: Page;

// After
import { IPage, IBrowser } from '@open-wa/driver-interface';
private _page: IPage;
```

### Driver resolution in create():

```typescript
// packages/core/src/controllers/driver-resolver.ts
import { IDriver } from '@open-wa/driver-interface';
import { ConfigObject } from '../api/model';

export async function resolveDriver(config: ConfigObject): Promise<IDriver> {
    // For v5.0, always use Puppeteer
    const { PuppeteerDriver } = await import('@open-wa/driver-puppeteer');
    const driver = new PuppeteerDriver();
    await driver.init();
    return driver;
}
```

---

## What's NOT in v5.0 Scope

| Feature | Deferred To |
|---------|-------------|
| Playwright driver | v5.1+ (07b) |
| Capability system | v5.1+ (07b) |
| CDP access abstraction | v5.1+ (07b) |
| Remote browser support | v5.2+ |
| Contract tests | v5.1+ |

---

## Migration Checklist

- [ ] Create `packages/driver-interface` with types only
- [ ] Create `packages/driver-puppeteer` wrapping existing usage
- [ ] Add to `pnpm-workspace.yaml`
- [ ] Replace `Page` type with `IPage` in core (5-10 files)
- [ ] Replace `Browser` type with `IBrowser` in core
- [ ] Test that all existing functionality works

---

## Verification

```bash
# Build new packages
cd packages/driver-interface && pnpm build
cd packages/driver-puppeteer && pnpm build

# Verify core still works
cd packages/core && pnpm build && pnpm test

# Verify wa-automate still works
cd packages/wa-automate && pnpm build
```

---

## Expected Outcomes

| Before | After |
|--------|-------|
| 64+ direct Puppeteer imports | Abstracted behind interfaces |
| `Page` type hardcoded | `IPage` interface |
| No path to Playwright | Foundation for Playwright support |
| Tight coupling | Loose coupling via interfaces |
