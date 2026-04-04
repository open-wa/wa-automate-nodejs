import * as fs from 'node:fs/promises';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HyperEmitter } from '@open-wa/hyperemitter';
import type { OpenWAClient, OpenWAEventMap, STATE, Transport } from '@open-wa/core';
import { Client } from '../Client.js';

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((innerResolve) => {
    resolve = innerResolve;
  });

  return { promise, resolve };
}

function createTestClient(config: OpenWAClient['config']) {
  const events = new HyperEmitter<OpenWAEventMap>({ delimiter: '.', captureRejections: true });
  let finalizationHook: (() => Promise<void> | void) | undefined;
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

  const openwaClient: OpenWAClient = {
    sessionId: 'logout-parity',
    events,
    logger: logger as any,
    session: {} as any,
    plugins: {} as any,
    config,
    registerFinalizationHook: vi.fn((hook: () => Promise<void> | void) => {
      finalizationHook = hook;
      return () => {
        finalizationHook = undefined;
      };
    }),
    start: vi.fn(),
    stop: vi.fn().mockResolvedValue(undefined),
    getState: vi.fn(() => 'READY' as STATE),
    getReadiness: vi.fn(),
    getTransport: vi.fn(),
    screenshot: vi.fn(),
    evaluateScript: vi.fn(),
  };

  const transport: Transport = {
    evaluate: vi.fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce('2.26.3'),
  } as any;

  return {
    client: new Client({ client: openwaClient, transport }),
    events,
    logger,
    openwaClient,
    getFinalizationHook: () => finalizationHook,
  };
}

describe('Client logout cleanup', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(path.join(tmpdir(), 'openwa-logout-'));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  it('drains listener queues before invalidating, deleting session data, and stopping the client', async () => {
    const sessionDataPath = path.join(tempRoot, 'logout-parity.data.json');
    const userDataDir = path.join(tempRoot, 'profile');
    writeFileSync(sessionDataPath, '{"token":"active"}', 'utf8');
    mkdirSync(userDataDir, { recursive: true });
    writeFileSync(path.join(userDataDir, 'Default'), 'profile', 'utf8');

    const { client, events, logger, openwaClient, getFinalizationHook } = createTestClient({
      deleteSessionDataOnLogout: true,
      killClientOnLogout: true,
      sessionDataPath,
      userDataDir,
    });

    await getFinalizationHook()?.();

    const blocker = createDeferred();
    client.onMessage(async () => {
      await blocker.promise;
    }, { concurrency: 1 });

    events.emit('message.received', {
      ctx: { correlationId: 'queued-message', ts: Date.now() },
      message: {
        id: 'msg_queued',
        body: 'hold',
        from: '123@c.us',
        to: '456@c.us',
        t: Date.now(),
        self: 'in',
        ack: 1,
        sender: { id: '123@c.us', pushname: 'Queue' },
        timestamp: Date.now(),
        type: 'chat',
        content: 'hold',
        isGroupMsg: false,
        isMedia: false,
        isNotification: false,
        isPSA: false,
        isNewMsg: true,
        fromMe: false,
        chat: { id: '123@c.us', isGroup: false, contact: { id: '123@c.us' } },
        chatId: '123@c.us',
        isQuotedMsgAvailable: false,
      },
    } as any);

    await expect(fs.readFile(sessionDataPath, 'utf8')).resolves.toContain('active');

    events.emit('session.logout', {
      correlationId: 'logout',
      ts: Date.now(),
      step: 'session_logout',
      details: { reason: 'post_logout=1' },
    });

    await new Promise((resolve) => setTimeout(resolve, 25));
    await expect(fs.readFile(sessionDataPath, 'utf8')).resolves.toContain('active');
    expect(openwaClient.stop).not.toHaveBeenCalled();

    blocker.resolve();

    await vi.waitFor(() => {
      expect(logger.info).toHaveBeenCalledWith('logout_invalidate_session_data', expect.objectContaining({ sessionDataPath }));
      expect(logger.info).toHaveBeenCalledWith('logout_delete_session_data', expect.objectContaining({ sessionDataPath }));
      expect(logger.info).toHaveBeenCalledWith('logout_delete_user_data_dir', expect.objectContaining({ userDataDir }));
      expect(openwaClient.stop).toHaveBeenCalledWith('LOGGED_OUT');
    });

    await expect(fs.access(sessionDataPath)).rejects.toThrow();
    await expect(fs.access(userDataDir)).rejects.toThrow();

    const invalidateOrder = logger.info.mock.invocationCallOrder[
      logger.info.mock.calls.findIndex(([eventName]) => eventName === 'logout_invalidate_session_data')
    ];
    const deleteOrder = logger.info.mock.invocationCallOrder[
      logger.info.mock.calls.findIndex(([eventName]) => eventName === 'logout_delete_session_data')
    ];
    const userDataDirDeleteOrder = logger.info.mock.invocationCallOrder[
      logger.info.mock.calls.findIndex(([eventName]) => eventName === 'logout_delete_user_data_dir')
    ];
    const stopOrder = vi.mocked(openwaClient.stop).mock.invocationCallOrder[0];

    expect(invalidateOrder).toBeLessThan(deleteOrder);
    expect(deleteOrder).toBeLessThan(userDataDirDeleteOrder);
    expect(userDataDirDeleteOrder).toBeLessThan(stopOrder);
  });

  it('does not invalidate, delete, or stop when logout cleanup flags are disabled', async () => {
    const sessionDataPath = path.join(tempRoot, 'logout-parity.data.json');
    const userDataDir = path.join(tempRoot, 'profile');
    writeFileSync(sessionDataPath, '{"token":"active"}', 'utf8');
    mkdirSync(userDataDir, { recursive: true });

    const { events, logger, openwaClient, getFinalizationHook } = createTestClient({
      deleteSessionDataOnLogout: false,
      killClientOnLogout: false,
      sessionDataPath,
      userDataDir,
    });

    await getFinalizationHook()?.();

    events.emit('session.logout', {
      correlationId: 'logout',
      ts: Date.now(),
      step: 'session_logout',
      details: { reason: 'post_logout=1' },
    });

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(logger.info).not.toHaveBeenCalledWith('logout_invalidate_session_data', expect.anything());
    expect(logger.info).not.toHaveBeenCalledWith('logout_delete_session_data', expect.anything());
    expect(logger.info).not.toHaveBeenCalledWith('logout_delete_user_data_dir', expect.anything());
    expect(openwaClient.stop).not.toHaveBeenCalled();
    await expect(fs.readFile(sessionDataPath, 'utf8')).resolves.toContain('active');
  });
});
