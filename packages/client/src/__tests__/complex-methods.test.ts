import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { decryptMedia as decryptMediaBuffer } from '@open-wa/decrypt';
import { Client } from '../Client.js';
import type { OpenWAClient, OpenWAEventMap, STATE, Transport } from '@open-wa/core';
import { HyperEmitter } from '@open-wa/hyperemitter';

vi.mock('axios');
vi.mock('@open-wa/decrypt', () => ({
  decryptMedia: vi.fn(),
}));

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
  } as any;

  return {
    client: new Client({ client: openwaClient, transport }),
    transport,
  };
}

describe('Client complex methods', () => {
  let client: Client;
  let transport: Transport;

  beforeEach(() => {
    const testClient = createTestClient();
    client = testClient.client;
    transport = testClient.transport;
    vi.clearAllMocks();
  });

  it('decryptMedia resolves message ids before decrypting', async () => {
    const message = {
      id: 'm1',
      mimetype: 'image/png',
      mediaKey: 'media-key',
      filehash: 'hash',
      size: 4,
      type: 'image',
      deprecatedMms3Url: 'https://example.com/file',
    };

    client.getMessageById = vi.fn().mockResolvedValue(message as any);
    vi.mocked(decryptMediaBuffer).mockResolvedValue(Buffer.from('hello'));

    const result = await client.decryptMedia('m1' as any);

    expect(client.getMessageById).toHaveBeenCalledWith('m1');
    expect(decryptMediaBuffer).toHaveBeenCalledWith(message);
    expect(result).toBe('data:image/png;base64,aGVsbG8=');
  });

  it('downloadMedia writes decrypted media to disk path', async () => {
    client.decryptMedia = vi.fn().mockResolvedValue('data:image/png;base64,aGVsbG8=');

    const outputPath = '/tmp/open-wa-download.bin';
    const result = await client.downloadMedia({} as any, outputPath);

    expect(result).toBe(outputPath);
  });

  it('sendFileFromUrl is explicit about missing runtime support', async () => {
    await expect(
      client.sendFileFromUrl('123@c.us' as any, 'https://example.com/file.txt', 'file.txt', 'caption')
    ).rejects.toThrow(/not supported by the shipped browser runtime/i);

    expect(axios.get).not.toHaveBeenCalled();
  });

  it('loadEarlierMessages keeps compatibility while accepting count/includeMe', async () => {
    vi.mocked(transport.evaluate as any).mockResolvedValue([{ id: 'm1' }] as any);

    const result = await client.loadEarlierMessages('123@c.us' as any, 50, true);

    expect(transport.evaluate).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'm1' }]);
  });
});
