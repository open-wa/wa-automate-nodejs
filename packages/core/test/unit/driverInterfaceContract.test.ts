import { describe, expect, it, vi } from 'vitest';
import type {
  DisposableHandle,
  IElementHandle,
  IFrame,
  IPage,
  IRequest,
  WaitForFunctionOptions,
} from '@open-wa/driver-interface';

class ContractPage implements IPage {
  readonly name = 'contract-driver';
  private readonly listeners = new Map<string, Array<(...args: any[]) => void | Promise<void>>>();
  private readonly initScripts = new Set<string>();

  async goto(): Promise<void> {}
  url(): string {
    return 'about:blank';
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
  async addInitScript(script: string): Promise<DisposableHandle> {
    this.initScripts.add(script);
    return {
      dispose: () => {
        this.initScripts.delete(script);
      },
    };
  }
  async setViewport(): Promise<void> {}
  async setUserAgent(): Promise<void> {}
  async setRequestInterception(): Promise<void> {}
  async waitForSelector(): Promise<IElementHandle | null> {
    return null;
  }
  async waitForFunction(_script: string, _options?: WaitForFunctionOptions): Promise<void>;
  async waitForFunction<Arg>(_fn: (arg: Arg) => boolean, _arg: Arg, _options?: WaitForFunctionOptions): Promise<void>;
  async waitForFunction(): Promise<void> {}
  async $(): Promise<IElementHandle | null> {
    return null;
  }
  async $$(): Promise<IElementHandle[]> {
    return [];
  }
  async click(): Promise<void> {}
  async type(): Promise<void> {}
  async screenshot(): Promise<Uint8Array> {
    return new Uint8Array();
  }
  async exposeFunction(): Promise<void> {}
  on(event: string, handler: ((payload: IRequest) => void | Promise<void>) | (() => void | Promise<void>)): DisposableHandle {
    const handlers = this.listeners.get(event) ?? [];
    handlers.push(handler as (...args: any[]) => void | Promise<void>);
    this.listeners.set(event, handlers);

    return {
      dispose: () => {
        this.off(event, handler);
      },
    };
  }
  off(event: string, handler: ((payload: IRequest) => void | Promise<void>) | (() => void | Promise<void>)): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    const index = handlers.findIndex((registered) => registered === (handler as (...args: any[]) => void | Promise<void>));
    if (index >= 0) {
      handlers.splice(index, 1);
    }
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

  hasInitScript(script: string): boolean {
    return this.initScripts.has(script);
  }
}

describe('driver interface contract', () => {
  it('supports deterministic listener removal via disposable handles and off()', async () => {
    const page = new ContractPage();
    const requestHandler = vi.fn();
    const closeHandler = vi.fn();

    const requestHandle = page.on('request', requestHandler);
    const closeHandle = page.on('close', closeHandler);

    await page.emit('request', { url: () => 'https://example.test' });
    await page.emit('close');

    expect(requestHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler).toHaveBeenCalledTimes(1);

    page.off('request', requestHandler);
    await requestHandle.dispose();
    await closeHandle.dispose();

    await page.emit('request', { url: () => 'https://example.test/again' });
    await page.emit('close');

    expect(requestHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler).toHaveBeenCalledTimes(1);
  });

  it('keeps duplicate listener registrations independently disposable', async () => {
    const page = new ContractPage();
    const requestHandler = vi.fn();

    const firstHandle = page.on('request', requestHandler);
    const secondHandle = page.on('request', requestHandler);

    await page.emit('request', { url: () => 'https://example.test' });
    expect(requestHandler).toHaveBeenCalledTimes(2);

    await firstHandle.dispose();
    await page.emit('request', { url: () => 'https://example.test/second' });
    expect(requestHandler).toHaveBeenCalledTimes(3);

    await secondHandle.dispose();
    await page.emit('request', { url: () => 'https://example.test/third' });
    expect(requestHandler).toHaveBeenCalledTimes(3);
  });

  it('supports generation-safe init-script registration removal', async () => {
    const page = new ContractPage();
    const initScript = 'window.__OPENWA_RUNTIME_GENERATION__ = 1;';

    const handle = await page.addInitScript(initScript);
    expect(page.hasInitScript(initScript)).toBe(true);

    await handle.dispose();
    expect(page.hasInitScript(initScript)).toBe(false);
  });
});
