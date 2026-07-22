import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { WebhookPayload } from './config';

export interface StoredWebhookDelivery {
  readonly id: string;
  readonly payload: WebhookPayload;
  readonly attempts: number;
  readonly nextAttemptAt: number;
  readonly status: 'pending' | 'delivered' | 'dead_letter';
}

export interface WebhookDeliveryStore {
  enqueue(payload: WebhookPayload): StoredWebhookDelivery;
  pending(limit?: number): StoredWebhookDelivery[];
  markAttempt(id: string, error: string, nextAttemptAt: number): void;
  markDelivered(id: string): void;
  markDeadLetter(id: string, error: string): void;
  close(): void;
}

interface DeliveryRow {
  id: string;
  payload: string;
  attempts: number;
  next_attempt_at: number;
  status: StoredWebhookDelivery['status'];
}

const deliveryId = (payload: WebhookPayload): string =>
  createHash('sha256')
    .update(payload.idempotencyKey ?? JSON.stringify(payload))
    .digest('hex');

export class SqliteWebhookDeliveryStore implements WebhookDeliveryStore {
  private readonly database: DatabaseSync;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.database = new DatabaseSync(path);
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = FULL;
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_at INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        last_error TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS webhook_deliveries_pending
        ON webhook_deliveries(status, next_attempt_at);
    `);
  }

  enqueue(payload: WebhookPayload): StoredWebhookDelivery {
    const id = deliveryId(payload);
    const now = Date.now();
    this.database.prepare(`
      INSERT OR IGNORE INTO webhook_deliveries
        (id, payload, attempts, next_attempt_at, status, created_at, updated_at)
      VALUES (?, ?, 0, ?, 'pending', ?, ?)
    `).run(id, JSON.stringify(payload), now, now, now);
    return this.get(id)!;
  }

  pending(limit = 1000): StoredWebhookDelivery[] {
    const rows = this.database.prepare(`
      SELECT id, payload, attempts, next_attempt_at, status
      FROM webhook_deliveries
      WHERE status = 'pending'
      ORDER BY next_attempt_at ASC, created_at ASC
      LIMIT ?
    `).all(limit) as unknown as DeliveryRow[];
    return rows.flatMap((row) => {
      try {
        return [this.decode(row)];
      } catch (error) {
        this.markDeadLetter(row.id, `decode failed: ${error instanceof Error ? error.message : String(error)}`);
        return [];
      }
    });
  }

  markAttempt(id: string, error: string, nextAttemptAt: number): void {
    this.database.prepare(`
      UPDATE webhook_deliveries
      SET attempts = attempts + 1, next_attempt_at = ?, last_error = ?, updated_at = ?
      WHERE id = ? AND status = 'pending'
    `).run(nextAttemptAt, error, Date.now(), id);
  }

  markDelivered(id: string): void {
    this.database.prepare(`
      UPDATE webhook_deliveries
      SET status = 'delivered', last_error = NULL, updated_at = ?
      WHERE id = ?
    `).run(Date.now(), id);
  }

  markDeadLetter(id: string, error: string): void {
    this.database.prepare(`
      UPDATE webhook_deliveries
      SET status = 'dead_letter', last_error = ?, updated_at = ?
      WHERE id = ?
    `).run(error, Date.now(), id);
  }

  close(): void {
    this.database.close();
  }

  private get(id: string): StoredWebhookDelivery | undefined {
    const row = this.database.prepare(`
      SELECT id, payload, attempts, next_attempt_at, status
      FROM webhook_deliveries WHERE id = ?
    `).get(id) as unknown as DeliveryRow | undefined;
    return row ? this.decode(row) : undefined;
  }

  private decode(row: DeliveryRow): StoredWebhookDelivery {
    return {
      id: row.id,
      payload: JSON.parse(row.payload) as WebhookPayload,
      attempts: row.attempts,
      nextAttemptAt: row.next_attempt_at,
      status: row.status,
    };
  }
}
