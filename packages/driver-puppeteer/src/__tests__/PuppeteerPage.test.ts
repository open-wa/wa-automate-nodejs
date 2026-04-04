import { describe, expect, it, vi } from 'vitest';
import { PuppeteerPage } from '../PuppeteerPage';

type MockHandler = (...args: any[]) => void | Promise<void>;

class MockPuppeteerPage {
  private readonly listeners = new Map<string, Set<MockHandler>>();

  readonly mainFrameValue = {
    url: () => 'https://example.test',
    name: () => 'main',
    parentFrame: () => null,
    content: vi.fn(async () => '<html></html>'),
  };

  readonly setViewport = vi.fn(async () => undefined);
  readonly setUserAgent = vi.fn(async () => undefined);
  readonly setRequestInterception = vi.fn(async () => undefined);
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
  readonly evaluateOnNewDocument = vi.fn(async () => ({ identifier: 'init-script-1' }));
  readonly removeScriptToEvaluateOnNewDocument = vi.fn(async () => undefined);

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
  stealth: { supported: true },
  pdf: { supported: true },
  tracing: { supported: true },
  persistentContext: { supported: true },
  browserExtensions: { supported: true },
  exposeBinding: { supported: true },
};

describe('PuppeteerPage', () => {
  it('keeps duplicate listeners independently disposable', async () => {
    const rawPage = new MockPuppeteerPage();
    const page = new PuppeteerPage(rawPage as any, capabilities as any);
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
      abort: vi.fn(async () => undefined),
      continue: vi.fn(async () => undefined),
      respond: vi.fn(async () => undefined),
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

  it('removes init scripts via returned identifiers and makes disposal idempotent', async () => {
    const rawPage = new MockPuppeteerPage();
    const page = new PuppeteerPage(rawPage as any, capabilities as any);

    const handle = await page.addInitScript('window.__OPENWA__ = true;');

    await handle.dispose();
    await handle.dispose();

    expect(rawPage.evaluateOnNewDocument).toHaveBeenCalledWith('window.__OPENWA__ = true;');
    expect(rawPage.removeScriptToEvaluateOnNewDocument).toHaveBeenCalledTimes(1);
    expect(rawPage.removeScriptToEvaluateOnNewDocument).toHaveBeenCalledWith('init-script-1');
  });

  it('wraps request payloads and normalizes Uint8Array response bodies', async () => {
    const rawPage = new MockPuppeteerPage();
    const page = new PuppeteerPage(rawPage as any, capabilities as any);
    const respond = vi.fn(async () => undefined);
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
      abort: vi.fn(async () => undefined),
      continue: vi.fn(async () => undefined),
      respond,
    });

    await wrappedRequest.respond({
      status: 200,
      body: new Uint8Array([1, 2, 3]),
    });

    expect(wrappedRequest.url()).toBe('https://example.test/api');
    expect(wrappedRequest.frame()?.isMainFrame()).toBe(true);
    expect(respond).toHaveBeenCalledWith({
      status: 200,
      body: Buffer.from([1, 2, 3]),
    });
  });
});
