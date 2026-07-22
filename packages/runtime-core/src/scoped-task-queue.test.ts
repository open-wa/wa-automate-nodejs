import { describe, expect, it } from 'vitest';
import { QueueClosedError, QueueOverloadedError, TaskTimeoutError } from './errors';
import { ScopedTaskQueue } from './scoped-task-queue';

const waitUntil = async (predicate: () => boolean): Promise<void> => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  throw new Error('condition was not met');
};

describe('ScopedTaskQueue', () => {
  it('preserves FIFO ordering and reports completion metrics', async () => {
    const queue = await ScopedTaskQueue.make({
      name: 'fifo',
      capacity: 4,
      concurrency: 1,
      overload: 'backpressure',
    });
    const order: number[] = [];

    const results = await Promise.all(
      [1, 2, 3].map((value) =>
        queue.submit(async () => {
          order.push(value);
          return value * 2;
        }),
      ),
    );

    expect(results).toEqual([2, 4, 6]);
    expect(order).toEqual([1, 2, 3]);
    expect(queue.metrics()).toMatchObject({
      depth: 0,
      active: 0,
      completed: 3,
      failed: 0,
    });
    await queue.close();
  });

  it('rejects work beyond a dropping queue capacity', async () => {
    const queue = await ScopedTaskQueue.make({
      name: 'bounded',
      capacity: 1,
      concurrency: 1,
      overload: 'dropping',
    });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const active = queue.submit(() => gate);
    await waitUntil(() => queue.metrics().active === 1);
    const pending = queue.submit(() => 'pending');
    const dropped = queue.submit(() => 'dropped');

    await expect(dropped).rejects.toBeInstanceOf(QueueOverloadedError);
    release();
    await expect(active).resolves.toBeUndefined();
    await expect(pending).resolves.toBe('pending');
    expect(queue.metrics().dropped).toBe(1);
    await queue.close();
  });

  it('enforces task timeouts', async () => {
    const queue = await ScopedTaskQueue.make({
      name: 'timeout',
      capacity: 1,
      concurrency: 1,
      overload: 'backpressure',
      timeoutMs: 5,
    });

    await expect(
      queue.submit(() => new Promise(() => undefined)),
    ).rejects.toBeInstanceOf(TaskTimeoutError);
    await queue.close();
  });

  it('paces work with the declared rate policy and reports the decision', async () => {
    const queue = await ScopedTaskQueue.make({
      name: 'rate-limited',
      capacity: 2,
      concurrency: 1,
      overload: 'backpressure',
      rate: { limit: 1, intervalMs: 100 },
    });

    await Promise.all([
      queue.submit(() => 'first'),
      queue.submit(() => 'second'),
    ]);

    expect(queue.metrics().rateLimited).toBeGreaterThanOrEqual(1);
    await queue.close();
  });

  it('rejects queued and active work when the scope closes', async () => {
    const queue = await ScopedTaskQueue.make({
      name: 'shutdown',
      capacity: 2,
      concurrency: 1,
      overload: 'backpressure',
    });
    const active = queue.submit(() => new Promise(() => undefined));
    await waitUntil(() => queue.metrics().active === 1);
    const pending = queue.submit(() => 'pending');
    await waitUntil(() => queue.metrics().depth === 1);

    await queue.close();

    await expect(active).rejects.toBeInstanceOf(QueueClosedError);
    await expect(pending).rejects.toBeInstanceOf(QueueClosedError);
    expect(queue.metrics()).toMatchObject({ closed: true, depth: 0, active: 0 });
  });
});
