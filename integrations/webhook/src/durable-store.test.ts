import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WebhookPayload } from './config.js';
import { WebhookDeliverer } from './deliverer.js';
import { SqliteWebhookDeliveryStore } from './durable-store.js';

const directories: string[] = [];
const temporaryDatabase = () => {
  const directory = mkdtempSync(join(tmpdir(), 'openwa-webhooks-'));
  directories.push(directory);
  return join(directory, 'deliveries.sqlite');
};

const payload: WebhookPayload = {
  webhookId: 'webhook-1',
  sessionId: 'session-1',
  event: 'message.received',
  payload: { id: 'message-1' },
  timestamp: 1234,
  idempotencyKey: 'message-1',
};

const logger = {
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

afterEach(() => {
  vi.unstubAllGlobals();
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('durable webhook delivery', () => {
  it('survives store restart and deduplicates the same delivery', () => {
    const path = temporaryDatabase();
    const first = new SqliteWebhookDeliveryStore(path);
    const stored = first.enqueue(payload);
    first.markAttempt(stored.id, 'offline', 5000);
    first.close();

    const second = new SqliteWebhookDeliveryStore(path);
    const replay = second.pending();
    expect(replay).toHaveLength(1);
    expect(replay[0]).toMatchObject({ id: stored.id, attempts: 1, nextAttemptAt: 5000 });
    expect(second.enqueue(payload).id).toBe(stored.id);
    second.markDelivered(stored.id);
    expect(second.pending()).toEqual([]);
    second.close();
  });

  it('quarantines rows whose payload can no longer be decoded', () => {
    const path = temporaryDatabase();
    const store = new SqliteWebhookDeliveryStore(path);
    store.close();
    const database = new DatabaseSync(path);
    database.prepare(`
      INSERT INTO webhook_deliveries
        (id, payload, attempts, next_attempt_at, status, created_at, updated_at)
      VALUES ('broken', '{', 0, 0, 'pending', 0, 0)
    `).run();
    database.close();

    const reopened = new SqliteWebhookDeliveryStore(path);
    expect(reopened.pending()).toEqual([]);
    reopened.close();
  });

  it('replays a pending row after a simulated process death', async () => {
    const path = temporaryDatabase();
    const first = new SqliteWebhookDeliveryStore(path);
    first.enqueue(payload);
    first.close();

    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const deliverer = new WebhookDeliverer({
      url: 'https://example.test/webhook',
      retries: 0,
      durability: { enabled: true, path },
    }, logger as never);

    await deliverer.waitForIdle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({
      'Idempotency-Key': expect.any(String),
    });
    await deliverer.close();

    const verified = new SqliteWebhookDeliveryStore(path);
    expect(verified.pending()).toEqual([]);
    verified.close();
  });

  it('persists retry decisions and exposes their runtime metrics', async () => {
    const path = temporaryDatabase();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503, statusText: 'Unavailable' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const deliverer = new WebhookDeliverer({
      url: 'https://example.test/webhook',
      retries: 1,
      retryDelay: 1,
      durability: { enabled: true, path },
    }, logger as never);

    await deliverer.deliver(payload);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    await expect(deliverer.metrics()).resolves.toMatchObject({
      'retry_decisions{attempt=1,component=webhook}': 1,
    });
    await deliverer.close();

    const verified = new SqliteWebhookDeliveryStore(path);
    expect(verified.pending()).toEqual([]);
    verified.close();
  });

  it('interrupts scheduled replay on shutdown without losing the pending delivery', async () => {
    const path = temporaryDatabase();
    const store = new SqliteWebhookDeliveryStore(path);
    const stored = store.enqueue(payload);
    store.markAttempt(stored.id, 'offline', Date.now() + 60_000);
    store.close();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const deliverer = new WebhookDeliverer({
      url: 'https://example.test/webhook',
      retries: 0,
      durability: { enabled: true, path },
    }, logger as never);

    await expect(Promise.race([
      deliverer.close().then(() => 'closed'),
      new Promise<string>((resolve) => setTimeout(() => resolve('timed-out'), 250)),
    ])).resolves.toBe('closed');
    expect(fetchMock).not.toHaveBeenCalled();

    const verified = new SqliteWebhookDeliveryStore(path);
    expect(verified.pending()).toHaveLength(1);
    verified.close();
  });

  it('stops at the retry limit and moves the delivery to the dead letter state', async () => {
    const path = temporaryDatabase();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(null, { status: 503, statusText: 'Unavailable' }),
    ));
    const deliverer = new WebhookDeliverer({
      url: 'https://example.test/webhook',
      retries: 1,
      retryDelay: 1,
      durability: { enabled: true, path },
    }, logger as never);

    await expect(deliverer.deliver(payload)).rejects.toBeDefined();
    await deliverer.close();

    const database = new DatabaseSync(path);
    const row = database.prepare(
      'SELECT status, attempts FROM webhook_deliveries LIMIT 1',
    ).get() as { status: string; attempts: number };
    expect(row).toEqual({ status: 'dead_letter', attempts: 1 });
    database.close();
  });
});
