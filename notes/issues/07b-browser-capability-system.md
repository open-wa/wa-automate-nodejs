# Issue #07b: Browser Abstraction - Full Capability System (v5.1+ Scope)

**Priority**: LOW (Future)  
**Effort**: 3-5 days  
**Risk**: MEDIUM  
**Depends on**: 07a (thin adapter)  
**Blocks**: Playwright support, remote browsers

---

## Scope

This is the **full browser abstraction** with:
- Capability system for non-portable features
- Type-safe capability guards
- Playwright driver implementation
- Contract tests
- Remote browser support

---

## Capability System Design

### Why Capabilities?

Not all browsers support all features:

| Capability | Puppeteer | Playwright (Chromium) | Playwright (Firefox) |
|------------|:---------:|:---------------------:|:--------------------:|
| CDP Access | Yes | Yes | No |
| Stealth Plugins | Yes | Partial | No |
| Service Worker Bypass | Yes | Partial | Partial |
| PDF Generation | Yes | Yes | No |

### Capability Interface

```typescript
// packages/driver-interface/src/capabilities.ts

export type DriverCapabilityKey =
    | 'cdp'                    // Chrome DevTools Protocol access
    | 'requestInterception'   // Intercept/modify requests
    | 'serviceWorkerBypass'   // Bypass service workers
    | 'stealth'               // Anti-detection measures
    | 'pdf'                   // PDF generation
    | 'tracing'               // Performance tracing
    | 'persistentContext'     // Persistent browser context
    | 'browserExtensions'     // Chrome extension loading
    | 'exposeBinding';        // Expose Node functions to page

export type CapabilitySupport =
    | { supported: true; notes?: string }
    | { supported: false; reason: string };

export type DriverCapabilities = Record<DriverCapabilityKey, CapabilitySupport>;

export interface IHasCapabilities {
    readonly name: string;
    readonly version?: string;
    readonly capabilities: DriverCapabilities;
    
    /** Type guard: narrows `this` to include capability extension */
    has<C extends DriverCapabilityKey>(cap: C): this is this & CapabilityExtensionMap[C];
    
    /** Fail-fast helper - throws if capability missing */
    require<C extends DriverCapabilityKey>(cap: C): void;
}
```

### Capability Extensions

```typescript
// Each capability maps to an interface with its methods

export interface CapabilityExtensionMap {
    cdp: ICDPSupport;
    requestInterception: IRequestInterceptionSupport;
    serviceWorkerBypass: IServiceWorkerBypassSupport;
    stealth: IStealthSupport;
    pdf: IPdfSupport;
    // ... others
}

export interface ICDPSupport {
    cdp(): ICDPSession;
}

export interface ICDPSession {
    send<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
    detach(): Promise<void>;
}

export interface IServiceWorkerBypassSupport {
    setBypassServiceWorker(bypass: boolean): Promise<void>;
}

export interface IStealthSupport {
    enableStealth(enabled: boolean): Promise<void>;
}
```

---

## Usage Pattern

```typescript
// Type-safe capability check
async function setupSession(page: IPage) {
    // Type guard narrows the type
    if (page.has('serviceWorkerBypass')) {
        // TypeScript knows setBypassServiceWorker exists
        await page.setBypassServiceWorker(true);
    }
    
    // Or fail-fast
    page.require('cdp'); // Throws if not supported
    const session = page.cdp();
    await session.send('Network.enable');
}
```

---

## Playwright Driver Implementation

**File**: `packages/driver-playwright/src/PlaywrightDriver.ts`

```typescript
import { IDriver, IBrowser, DriverCapabilities } from '@open-wa/driver-interface';

export class PlaywrightDriver implements IDriver {
    readonly name = 'playwright';
    readonly capabilities: DriverCapabilities = {
        cdp: { supported: true, notes: 'Chromium only' },
        requestInterception: { supported: true },
        serviceWorkerBypass: { supported: true, notes: 'Different API' },
        stealth: { supported: false, reason: 'No puppeteer-extra equivalent' },
        pdf: { supported: true, notes: 'Chromium only' },
        tracing: { supported: true },
        persistentContext: { supported: true },
        browserExtensions: { supported: false, reason: 'Playwright limitation' },
        exposeBinding: { supported: true },
    };
    
    constructor(private browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium') {}
    
    async init(): Promise<void> {
        this.playwright = await import('playwright');
    }
    
    async launch(options?: LaunchOptions): Promise<IBrowser> {
        const browser = await this.playwright[this.browserType].launch({
            headless: options?.headless ?? true,
            executablePath: options?.executablePath,
            args: options?.args,
        });
        return new PlaywrightBrowser(browser, this.capabilities);
    }
    
    // ... rest of implementation
}
```

---

## Configuration Design

```typescript
// packages/core/src/api/model/config.ts

export type DriverConfig =
    // String shorthand (most common)
    | { driver?: 'puppeteer'; driverOptions?: PuppeteerOptions }
    | { driver: 'playwright'; driverOptions?: PlaywrightOptions }
    // Explicit injection (advanced)
    | { driver: IDriver };

interface PlaywrightOptions extends LaunchOptions {
    browser?: 'chromium' | 'firefox' | 'webkit';
}

// Usage examples:
const config1 = {
    sessionId: 'my-session',
    // Default: Puppeteer
};

const config2 = {
    sessionId: 'my-session',
    driver: 'playwright',
    driverOptions: { browser: 'chromium', headless: true }
};
```

---

## Contract Tests

```typescript
// packages/driver-interface/src/contract-tests/page.contract.ts

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
    });
}

// Run against both drivers
describe('Puppeteer Driver', () => {
    runPageContractTests(() => puppeteerDriver.launch().then(b => b.newPage()));
});

describe('Playwright Driver', () => {
    runPageContractTests(() => playwrightDriver.launch().then(b => b.newPage()));
});
```

---

## Capability Matrix

| Capability | Puppeteer | Playwright (Chromium) | Playwright (Firefox) | Playwright (WebKit) |
|------------|:---------:|:---------------------:|:--------------------:|:-------------------:|
| Core (navigate, evaluate) | Yes | Yes | Yes | Yes |
| CDP Access | Yes | Yes | No | No |
| Request Interception | Yes | Yes | Yes | Yes |
| Service Worker Bypass | Yes | Partial | Partial | Partial |
| Stealth Plugins | Yes | Partial | No | No |
| PDF Generation | Yes | Yes | No | No |
| Tracing | Partial | Yes | Yes | Yes |
| Code Coverage | Yes | Yes | No | No |
| Persistent Context | Yes | Yes | Yes | Yes |
| Mobile Emulation | Yes | Yes | Yes | Yes |
| Browser Extensions | Yes | No | No | No |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Semantic differences (auto-wait, timing) | Define behavioral contracts in tests |
| Hidden CDP usage in core | Audit and wrap all CDP calls |
| Stealth expectation mismatch | Document clearly, keep Puppeteer default |
| Breaking TypeScript API | Keep deprecated exports, provide `unwrap()` |

---

## Package Structure

```
packages/driver-interface/
├── src/
│   ├── types.ts              # Basic types
│   ├── capabilities.ts       # Capability system
│   ├── driver.ts             # IDriver, IBrowser, IPage
│   ├── errors.ts             # DriverCapabilityError
│   ├── contract-tests/       # Reusable test definitions
│   └── index.ts
└── package.json

packages/driver-puppeteer/
├── src/
│   ├── PuppeteerDriver.ts
│   ├── PuppeteerBrowser.ts
│   ├── PuppeteerPage.ts
│   ├── capabilities.ts
│   └── index.ts
└── package.json

packages/driver-playwright/     # NEW in v5.1+
├── src/
│   ├── PlaywrightDriver.ts
│   ├── PlaywrightBrowser.ts
│   ├── PlaywrightPage.ts
│   ├── capabilities.ts
│   └── index.ts
└── package.json
```

---

## Implementation Roadmap

| Phase | Scope | Target |
|-------|-------|--------|
| Phase 0 | Add packages, no behavior change | v5.0 (07a) |
| Phase 1 | Replace types in core | v5.0 (07a) |
| Phase 2 | Migrate Puppeteer-specific calls | v5.1 |
| Phase 3 | Add Playwright driver | v5.1 |
| Phase 4 | Remove direct Puppeteer imports | v5.2 |

---

## Verification

```bash
# Run contract tests against both drivers
cd packages/driver-puppeteer && pnpm test
cd packages/driver-playwright && pnpm test

# Test with WhatsApp Web
node -e "
const { create } = require('@open-wa/wa-automate');
create({ driver: 'playwright', driverOptions: { browser: 'chromium' } })
    .then(client => console.log('Playwright works!'))
    .catch(console.error);
"
```

---

## Expected Outcomes

| Before | After |
|--------|-------|
| Puppeteer only | Multiple driver support |
| No capability awareness | Type-safe capability checks |
| Untestable browser code | Contract tests for all drivers |
| No path to remote browsers | Foundation for Browserless.io, etc. |
