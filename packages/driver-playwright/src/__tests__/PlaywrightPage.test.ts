import { describe, expect, it, vi } from 'vitest';
import { PlaywrightPage } from '../PlaywrightPage';

type MockHandler = (...args: any[]) => void | Promise<void>;

class MockPlaywrightPage {
  private readonly listeners = new Map<string, Set<MockHandler>>();

  readonly mainFrameValue = {
    url: () => 'https://example.test',
    name: () => 'main',
    parentFrame: () => null,
    content: vi.fn(async () => '<html></html>'),
  };

  readonly route = vi.fn(async () => undefined);
  readonly unroute = vi.fn(async () => undefined);
  readonly addInitScript = vi.fn(async () => undefined);
  readonly setViewportSize = vi.fn(async () => undefined);
  readonly setExtraHTTPHeaders = vi.fn(async () => undefined);
  readonly waitForSelector = vi.fn(async () => null);
  readonly waitForFunction = vi.fn(async () => undefined);
  readonly $ = vi.fn(async () => null);
  readonly $$ = vi.fn(async () => []);
  readonly click = vi.fn(async () => undefined);
  readonly type = vi.fn(async () => undefined);
  readonly screenshot = vi.fn(async () => Buffer.from([]));
  readonly exposeFunction = vi.fn(async () => undefined);
  readonly close = vi.fn(async () => undefined);
  readonly goto = vi.fn(async () => undefined);
  readonly reload = vi.fn(async () => undefined);
  readonly evaluate = vi.fn(async () => undefined);
  readonly url = vi.fn(() => 'about:blank');
  readonly isClosed = vi.fn(() => false);
  readonly context = vi.fn(() => ({
    route: vi.fn(async () => undefined),
    tracing: {
      start: vi.fn(async () => undefined),
      stop: vi.fn(async () => undefined),
    },
    newCDPSession: vi.fn(async () => ({})),
  }));

  mainFrame() {
    return this.mainFrameValue;
  }

  on(event: string, handler: MockHandler): void {
    const handlers = this.listeners.get(event) ?? new Set<MockHandler>();
    handlers.add(handler);
    this.listeners.set(event, handlers);
  }

  off(event: string, handler: MockHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  async emit(event: string, payload?: unknown): Promise<void> {
    const handlers = [...(this.listeners.get(event) ?? [])];
    await Promise.all(handlers.map((handler) => Promise.resolve(handler(payload))));
  }
}

const capabilities = {
  cdp: { supported: true },
  requestInterception: { supported: true },
  serviceWorkerBypass: { supported: true },
  stealth: { supported: false, reason: 'unsupported' },
  pdf: { supported: true },
  tracing: { supported: true },
  persistentContext: { supported: true },
  browserExtensions: { supported: false, reason: 'unsupported' },
  exposeBinding: { supported: true },
};

describe('PlaywrightPage', () => {
  it('makes request interception toggles idempotent with a stable route handler', async () => {
    const rawPage = new MockPlaywrightPage();
    const page = new PlaywrightPage(rawPage as any, 'chromium', capabilities as any);

    await page.setRequestInterception(true);
    await page.setRequestInterception(true);
    await page.setRequestInterception(false);
    await page.setRequestInterception(false);

    expect(rawPage.route).toHaveBeenCalledTimes(1);
    expect(rawPage.unroute).toHaveBeenCalledTimes(1);
    expect(rawPage.route).toHaveBeenCalledWith('**/*', expect.any(Function));
    const registeredRouteHandler = (rawPage.route.mock.calls[0] as any[] | undefined)?.[1];
    expect(rawPage.unroute).toHaveBeenCalledWith('**/*', registeredRouteHandler);
  });

  it('keeps duplicate listeners independently disposable', async () => {
    const rawPage = new MockPlaywrightPage();
    const page = new PlaywrightPage(rawPage as any, 'chromium', capabilities as any);
    const handler = vi.fn();

    const first = page.on('request', handler);
    const second = page.on('request', handler);

    const request = {
      url: () => 'https://example.test',
      method: () => 'GET',
      headers: () => ({ accept: 'application/json' }),
      resourceType: () => 'document',
      isNavigationRequest: () => true,
      frame: () => rawPage.mainFrameValue,
    };

    await rawPage.emit('request', request);
    expect(handler).toHaveBeenCalledTimes(2);

    await first.dispose();
    await rawPage.emit('request', request);
    expect(handler).toHaveBeenCalledTimes(3);

    await second.dispose();
    await rawPage.emit('request', request);
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('throws explicit route-bound errors for request mutation methods', async () => {
    const rawPage = new MockPlaywrightPage();
    const page = new PlaywrightPage(rawPage as any, 'chromium', capabilities as any);
    let wrappedRequest: any;

    page.on('request', (request: any) => {
      wrappedRequest = request;
    });

    await rawPage.emit('request', {
      url: () => 'https://example.test/api',
      method: () => 'POST',
      headers: () => ({ 'content-type': 'application/json' }),
      resourceType: () => 'xhr',
      isNavigationRequest: () => false,
      frame: () => rawPage.mainFrameValue,
    });

    await expect(wrappedRequest.abort()).rejects.toThrow(/without a bound route/);
    await expect(wrappedRequest.continue({ method: 'GET' })).rejects.toThrow(/without a bound route/);
    await expect(wrappedRequest.respond({ status: 200, body: 'ok' })).rejects.toThrow(/without a bound route/);
  });
});
