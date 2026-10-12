import { describe, expect, it, vi } from 'vitest';
import { HyperEmitter } from '@open-wa/hyperemitter';
import { Client } from '../Client';
import type { OpenWAClient, OpenWAEventMap, STATE, Transport } from '@open-wa/core';

function createTestClient() {
  const events = new HyperEmitter<OpenWAEventMap>({ delimiter: '.', captureRejections: true });

  const openwaClient: OpenWAClient = {
    sessionId: 'test-session',
    events,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any,
    session: {} as any,
    plugins: {} as any,
    config: {},
    registerFinalizationHook: vi.fn(() => () => undefined),
    start: vi.fn(),
    stop: vi.fn(),
    getState: vi.fn(() => 'READY' as STATE),
    getReadiness: vi.fn(),
    getTransport: vi.fn(),
    screenshot: vi.fn(),
    evaluateScript: vi.fn(),
  };

  const transport: Transport = {
    evaluate: vi.fn(),
    setPortableMessageHandler: vi.fn((handler) => {
      const listener = ({ message }: any) => handler(message);
      events.on('message.received', listener);
      return () => events.off('message.received', listener);
    }),
  } as any;

  return new Client({ client: openwaClient, transport });
}

describe('Client runtime surface smoke coverage', () => {
  it.each([
    ['setGroupTitle', (client: Client) => client.setGroupTitle('123@g.us' as any, 'new title')],
    ['setGroupDescription', (client: Client) => client.setGroupDescription('123@g.us' as any, 'new description')],
    ['getGroupInfo', (client: Client) => client.getGroupInfo('123@g.us' as any)],
    ['pinChat', (client: Client) => client.pinChat('123@c.us' as any)],
    ['unpinChat', (client: Client) => client.unpinChat('123@c.us' as any)],
    ['muteChat', (client: Client) => client.muteChat('123@c.us' as any)],
    ['unmuteChat', (client: Client) => client.unmuteChat('123@c.us' as any)],
    ['getBlockedContacts', (client: Client) => client.getBlockedContacts()],
    ['getCommonGroups', (client: Client) => client.getCommonGroups('123@c.us' as any)],
  ])('throws explicit unsupported errors for %s', async (_name, invoke) => {
    const client = createTestClient();

    await expect(invoke(client)).rejects.toThrow(/not supported by the shipped browser runtime/i);
  });

  it('throws explicit unsupported errors for onMessageDeleted', () => {
    const client = createTestClient();

    expect(() => client.onMessageDeleted(() => undefined)).toThrow(/not supported by the shipped browser runtime/i);
  });
});
