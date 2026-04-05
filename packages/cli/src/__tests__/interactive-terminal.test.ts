import { describe, expect, it, vi } from 'vitest';

describe('InteractiveTerminalPresenter', () => {
  it('subscribes externally and rerenders Ink without React hooks in the presenter', async () => {
    const rerender = vi.fn();
    const clear = vi.fn();
    const unmount = vi.fn();
    const render = vi.fn(() => ({ rerender, clear, unmount }));
    const createElement = vi.fn((type: unknown, props?: Record<string, unknown>, ...children: unknown[]) => ({
      type,
      props: { ...(props ?? {}), children },
    }));
    const subscribe = vi.fn((listener: (snapshot: unknown) => void) => {
      subscribe.listener = listener;
      listener({
        phase: 'auth.qr',
        sessionId: 'demo',
        qr: { sessionId: 'demo', qr: 'qr-token' },
        recentLogs: [],
        messageCount: 0,
        ackCount: 0,
        ready: false,
      });
      return () => undefined;
    }) as ReturnType<typeof vi.fn> & { listener?: () => void };
    const getSnapshot = vi
      .fn()
      .mockReturnValueOnce({ phase: 'boot', recentLogs: [], messageCount: 0, ackCount: 0, ready: false })
      .mockReturnValue({
        phase: 'auth.qr',
        sessionId: 'demo',
        qr: { sessionId: 'demo', qr: 'qr-token' },
        recentLogs: [],
        messageCount: 0,
        ackCount: 0,
        ready: false,
      });

    vi.doMock('react', () => ({ createElement }));
    vi.doMock('ink', () => ({
      render,
      Box: 'Box',
      Text: 'Text',
    }));
    vi.doMock('qrcode', () => ({
      default: {
        toString: vi.fn(async () => 'QR ASCII'),
      },
    }));

    const { InteractiveTerminalPresenter } = await import('../presenter/interactive-terminal');
    const presenter = new InteractiveTerminalPresenter({
      store: {
        subscribe,
        getSnapshot,
      } as any,
      stdout: { columns: 200 } as any,
      stderr: {} as any,
    });

    await presenter.start();
    await Promise.resolve();

    expect(render).toHaveBeenCalledTimes(1);
    expect(rerender).toHaveBeenCalled();

    const rerenderedTree = rerender.mock.calls.at(-1)?.[0] as { props?: { qrAscii?: string } } | undefined;
    expect(rerenderedTree?.props?.qrAscii).toBe('QR ASCII');
    expect(
      createElement.mock.calls.some((call) => call.includes('Terminal window too small to render QR Code visually. Please expand.'))
    ).toBe(false);

    presenter.stop();

    vi.resetModules();
    vi.doUnmock('react');
    vi.doUnmock('ink');
    vi.doUnmock('qrcode');
  });
});
