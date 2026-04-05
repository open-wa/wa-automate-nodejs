import { describe, expect, it, vi } from 'vitest';
import { createEventProjectionStore } from '../state/event-projection-store';

class FakeEmitter {
  private handlers = new Map<string, Set<(payload: unknown) => void>>();

  on(event: string, handler: (payload: unknown) => void) {
    const handlers = this.handlers.get(event) ?? new Set();
    handlers.add(handler);
    this.handlers.set(event, handlers);
    return this;
  }

  off(event: string, handler: (payload: unknown) => void) {
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  emit(event: string, payload: unknown) {
    for (const handler of this.handlers.get(event) ?? []) {
      handler(payload);
    }
  }

  listenerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0;
  }
}

describe('EventProjectionStore', () => {
  it('retains only a bounded number of log entries', () => {
    const store = createEventProjectionStore({ maxLogs: 2 });

    store.projectLog({ level: 'info', message: 'one', source: 'runtime', timestamp: 1 });
    store.projectLog({ level: 'info', message: 'two', source: 'runtime', timestamp: 2 });
    store.projectLog({ level: 'info', message: 'three', source: 'runtime', timestamp: 3 });

    expect(store.getSnapshot().recentLogs.map((entry) => entry.message)).toEqual(['two', 'three']);
  });

  it('coalesces bursty runtime events before exposing them to the snapshot', async () => {
    vi.useFakeTimers();
    const store = createEventProjectionStore({ eventDebounceMs: 100 });
    const emitter = new FakeEmitter();
    const detach = store.attachEmitter(emitter as any);

    emitter.emit('message.received', {});
    emitter.emit('message.received', {});
    emitter.emit('ack.changed', {});

    expect(store.getSnapshot().messageCount).toBe(0);
    expect(store.getSnapshot().ackCount).toBe(0);

    await vi.advanceTimersByTimeAsync(100);

    expect(store.getSnapshot().messageCount).toBe(2);
    expect(store.getSnapshot().ackCount).toBe(1);

    detach();
    expect(emitter.listenerCount('message.received')).toBe(0);
    expect(emitter.listenerCount('ack.changed')).toBe(0);
    vi.useRealTimers();
  });
});
