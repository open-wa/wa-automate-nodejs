import { describe, expect, it, vi } from 'vitest';
import { HyperEmitter } from '@open-wa/hyperemitter';
import type { OpenWAClient, OpenWAEventMap, STATE, Transport } from '@open-wa/core';
import { Client } from '../Client';

function createTestClient(killClientOnLogout: boolean) {
  const events = new HyperEmitter<OpenWAEventMap>({ delimiter: '.', captureRejections: true });
  const openwaClient = {
    sessionId: 'logout-parity', events,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    session: {}, plugins: {}, config: { killClientOnLogout },
    registerFinalizationHook: vi.fn(), start: vi.fn(), stop: vi.fn(),
    getState: vi.fn(() => 'READY' as STATE), getReadiness: vi.fn(),
  } as unknown as OpenWAClient;
  const transport = {
    evaluate: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce('2.26.3'),
    setPortableMessageHandler: vi.fn((handler) => {
      const listener = ({ message }: any) => handler(message);
      events.on('message.received', listener);
      return () => events.off('message.received', listener);
    }),
    invalidatePortableSession: vi.fn().mockResolvedValue(undefined),
  };
  const client = new Client({ client: openwaClient, transport: transport as unknown as Transport });
  return { client, events, transport, openwaClient };
}

describe('Client logout cleanup', () => {
  it('delegates portable invalidation to Transport before stopping the client', async () => {
    const { client, events, transport, openwaClient } = createTestClient(true);
    let finish!: () => void;
    transport.invalidatePortableSession.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    await client.loaded();
    events.emit('session.logout', { correlationId: 'logout', ts: Date.now(), step: 'session_logout', details: { reason: 'post_logout=1' } });
    await vi.waitFor(() => expect(transport.invalidatePortableSession).toHaveBeenCalledTimes(1));
    expect(openwaClient.stop).not.toHaveBeenCalled();
    finish();
    await vi.waitFor(() => expect(openwaClient.stop).toHaveBeenCalledWith('LOGGED_OUT'));
    await client.stop();
  });

  it('invalidates portable authorization without stopping when logout shutdown is disabled', async () => {
    const { client, events, transport, openwaClient } = createTestClient(false);
    await client.loaded();
    events.emit('session.logout', { correlationId: 'logout', ts: Date.now(), step: 'session_logout', details: { reason: 'post_logout=1' } });
    await vi.waitFor(() => expect(transport.invalidatePortableSession).toHaveBeenCalledTimes(1));
    expect(openwaClient.stop).not.toHaveBeenCalled();
    await client.stop();
  });
});
