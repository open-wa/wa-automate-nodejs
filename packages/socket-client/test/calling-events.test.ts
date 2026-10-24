import { afterEach, expect, it, vi } from 'vitest';
import { SocketClient } from '../src/SocketClient';

class TestEventSource {
  static latest: TestEventSource;
  onopen?: () => void;
  listeners = new Map<string, (event: unknown) => void>();
  constructor() { TestEventSource.latest = this; queueMicrotask(() => this.onopen?.()); }
  addEventListener(name: string, callback: (event: unknown) => void) { this.listeners.set(name, callback); }
  emit(name: string, payload: unknown) { this.listeners.get(name)?.({ data: JSON.stringify({ event: name, payload }) }); }
  close() {}
}
let client: SocketClient | undefined;
afterEach(() => { client?.close(); vi.unstubAllGlobals(); });

it('receives call state and incoming calls when a capability request is rate limited', async () => {
  vi.stubGlobal('EventSource', TestEventSource);
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: 'Too Many Requests' }, { status: 429 })));
  client = await SocketClient.connect('http://localhost:8122');
  const state = vi.fn(), incoming = vi.fn();
  await expect(client.onCallState(state)).resolves.toEqual(expect.any(String));
  await expect(client.onIncomingCall(incoming)).resolves.toEqual(expect.any(String));
  const snapshot = { id: 'call-1', sessionId: 'test-session', generation: 'generation-1', peer: '447700900123@c.us', state: 'active', terminal: false, observedAt: 1 };
  TestEventSource.latest.emit('call.state', { state: snapshot });
  TestEventSource.latest.emit('call.incoming', { call: { ...snapshot, state: 'ringing' } });
  await vi.waitFor(() => {
    expect(state).toHaveBeenCalledWith(expect.objectContaining({ id: 'call-1', state: 'active', end: expect.any(Function) }));
    expect(incoming).toHaveBeenCalledWith(expect.objectContaining({ id: 'call-1', state: 'ringing', accept: expect.any(Function) }));
  });
});
