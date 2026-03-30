import { describe, it, expect, vi } from 'vitest';
import { HyperEmitter } from '@open-wa/hyperemitter';
import { Client } from '../Client.js';
import type { OpenWAClient, OpenWAEventMap, STATE, Transport } from '@open-wa/core';

function createTestClient() {
  const events = new HyperEmitter<OpenWAEventMap>({ delimiter: '.', captureRejections: true });

  const openwaClient: OpenWAClient = {
    sessionId: 'test-session',
    events,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any,
    session: {} as any,
    plugins: {} as any,
    start: vi.fn(),
    stop: vi.fn(),
    getState: vi.fn(() => 'READY' as STATE),
    screenshot: vi.fn(),
    evaluateScript: vi.fn(),
  };

  const transport: Transport = {
    evaluate: vi.fn(),
  } as any;

  return {
    client: new Client({ client: openwaClient, transport }),
    events,
  };
}

describe('Client listeners', () => {
  it('onMessage returns a handle and forwards validated message payloads', async () => {
    const { client, events } = createTestClient();
    const callback = vi.fn();

    const handle = client.onMessage(callback);
    expect(handle.active).toBe(true);

    const message = {
      id: 'msg_1',
      body: 'hello',
      from: '123@c.us',
      to: '456@c.us',
      t: Date.now(),
      self: 'in',
      ack: 1,
      sender: { id: '123@c.us', pushname: 'Test' },
      timestamp: Date.now(),
      type: 'chat',
      content: 'hello',
      isGroupMsg: false,
      isMedia: false,
      isNotification: false,
      isPSA: false,
      isNewMsg: true,
      fromMe: false,
      chat: { id: '123@c.us', isGroup: false, contact: { id: '123@c.us' } },
      chatId: '123@c.us',
      isQuotedMsgAvailable: false,
    };

    events.emit('message.received', { ctx: { correlationId: 'c1', ts: Date.now() }, message });

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ id: 'msg_1', body: 'hello' }));
    });

    handle.off();
    expect(handle.active).toBe(false);
  });

  it('onAck transforms ack payload into the legacy-friendly shape', async () => {
    const { client, events } = createTestClient();
    const callback = vi.fn();

    client.onAck(callback);

    events.emit('ack.changed', {
      ctx: { correlationId: 'c2', ts: Date.now() },
      ack: { id: 'ack_1', chatId: '123@c.us', ack: 2, timestamp: Date.now() },
    });

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith({ messageId: 'ack_1', ack: 2 });
    });
  });

  it('onStateChanged emits next state only', async () => {
    const { client, events } = createTestClient();
    const callback = vi.fn();

    client.onStateChanged(callback);

    events.emit('session.state.changed', {
      correlationId: 'c3',
      ts: Date.now(),
      step: 'state',
      details: { prev: 'STARTING', next: 'READY' },
    });

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith('READY');
    });
  });

  it('ignores invalid transformed payloads', async () => {
    const { client, events } = createTestClient();
    const callback = vi.fn();

    client.onMessageDeleted(callback);

    events.emit('message.deleted', {
      ctx: { correlationId: 'c4', ts: Date.now() },
      messageId: undefined,
      chatId: '123@c.us',
    } as any);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(callback).not.toHaveBeenCalled();
  });
});
