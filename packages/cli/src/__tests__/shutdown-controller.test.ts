import { describe, expect, it, vi } from 'vitest';
import { createShutdownController } from '../runtime/shutdown-controller';

describe('ShutdownController', () => {
  it('runs graceful shutdown before cleanup on the first signal', async () => {
    const order: string[] = [];
    const controller = createShutdownController({
      gracefulShutdown: async (signal) => {
        order.push(`graceful:${signal}`);
      },
      cleanup: async () => {
        order.push('cleanup');
      },
      exit: (code) => {
        order.push(`exit:${code}`);
      },
    });

    await controller.handleSignal('SIGINT');

    expect(order).toEqual(['graceful:SIGINT', 'cleanup', 'exit:0']);
  });

  it('escalates to a failing exit when graceful shutdown times out', async () => {
    vi.useFakeTimers();
    const order: string[] = [];
    const controller = createShutdownController({
      timeoutMs: 25,
      gracefulShutdown: async () => {
        await new Promise(() => undefined);
      },
      cleanup: async () => {
        order.push('cleanup');
      },
      exit: (code) => {
        order.push(`exit:${code}`);
      },
    });

    const promise = controller.handleSignal('SIGTERM');
    await vi.advanceTimersByTimeAsync(25);
    await promise;

    expect(order).toEqual(['cleanup', 'exit:1']);
    vi.useRealTimers();
  });

  it('forces immediate exit on a second signal', async () => {
    vi.useFakeTimers();
    const order: string[] = [];
    const controller = createShutdownController({
      timeoutMs: 1_000,
      gracefulShutdown: async () => {
        order.push('graceful');
        await new Promise(() => undefined);
      },
      cleanup: async () => {
        order.push('cleanup');
      },
      exit: (code) => {
        order.push(`exit:${code}`);
      },
    });

    const first = controller.handleSignal('SIGINT');
    await controller.handleSignal('SIGINT');

    expect(order).toEqual(['graceful', 'cleanup', 'exit:1']);
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    void first;
  });
});
