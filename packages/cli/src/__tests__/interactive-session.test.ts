import { describe, expect, it, vi } from 'vitest';

describe('createInteractiveCliSession', () => {
  it('uses a broker configuration that leaves stdio streams untouched for Ink', async () => {
    const install = vi.fn();
    const dispose = vi.fn();
    const subscribe = vi.fn(() => vi.fn());
    const write = vi.fn();

    const createOutputBroker = vi.fn(() => ({
      install,
      dispose,
      subscribe,
      write,
    }));

    vi.doMock('../runtime/output-broker', async () => {
      const actual = await vi.importActual<typeof import('../runtime/output-broker')>('../runtime/output-broker');
      return {
        ...actual,
        createOutputBroker,
      };
    });
    vi.doMock('../presenter/interactive-terminal', () => ({
      InteractiveTerminalPresenter: class MockInteractiveTerminalPresenter {
        async start() {}
        stop() {}
      },
    }));

    const module = await import('../runtime/interactive-session');
    const session = await module.createInteractiveCliSession();

    expect(createOutputBroker).toHaveBeenCalledWith(
      expect.objectContaining({
        interactive: true,
        interceptStreams: false,
      })
    );

    session.cleanup();
    vi.resetModules();
    vi.doUnmock('../runtime/output-broker');
    vi.doUnmock('../presenter/interactive-terminal');
  });

  it('awaits presenter startup before resolving the interactive session', async () => {
    let resolveStart: (() => void) | undefined;
    const start = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveStart = resolve;
        })
    );
    const stop = vi.fn();

    vi.doMock('../presenter/interactive-terminal', () => ({
      InteractiveTerminalPresenter: class MockInteractiveTerminalPresenter {
        start = start;
        stop = stop;
      },
    }));

    const module = await import('../runtime/interactive-session');
    let resolved = false;
    const sessionPromise = module.createInteractiveCliSession().then((session) => {
      resolved = true;
      return session;
    });

    await Promise.resolve();

    expect(start).toHaveBeenCalledTimes(1);
    expect(resolved).toBe(false);

    resolveStart?.();
    const session = await sessionPromise;

    expect(resolved).toBe(true);
    session.cleanup();
    vi.resetModules();
    vi.doUnmock('../presenter/interactive-terminal');
  });
});
