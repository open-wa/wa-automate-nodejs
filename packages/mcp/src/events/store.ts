import { chmodSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export interface Subscription {
  id: string; owner: string; name: string; arguments: Record<string, unknown>;
  url: string; secret: string; expiresAt: number;
}
export interface DeliveryJob { id: number; subscriptionId: string; eventId: string; body: string; attempts: number; nextAttemptAt: number }

/** Secrets and payloads stay in a private local journal, never discovery or logs. */
export class McpEventStore {
  private readonly db: DatabaseSync;
  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    chmodSync(path, 0o600);
    this.db.exec(`
      PRAGMA journal_mode=WAL;
      PRAGMA synchronous=FULL;
      PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS mcp_event_subscriptions (
        id TEXT PRIMARY KEY, owner TEXT NOT NULL, name TEXT NOT NULL,
        arguments TEXT NOT NULL, url TEXT NOT NULL, secret TEXT NOT NULL, expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS mcp_event_deliveries (
        id INTEGER PRIMARY KEY, subscription_id TEXT NOT NULL REFERENCES mcp_event_subscriptions(id) ON DELETE CASCADE,
        event_id TEXT NOT NULL, body TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_at INTEGER NOT NULL, UNIQUE(subscription_id,event_id)
      );
      CREATE INDEX IF NOT EXISTS mcp_event_pending ON mcp_event_deliveries(next_attempt_at);
    `);
  }
  save(subscription: Subscription): void {
    this.db.prepare(`INSERT INTO mcp_event_subscriptions VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET secret=excluded.secret, expires_at=excluded.expires_at`)
      .run(subscription.id, subscription.owner, subscription.name, JSON.stringify(subscription.arguments), subscription.url, subscription.secret, subscription.expiresAt);
  }
  get(id: string, owner: string): Subscription | undefined {
    const row = this.db.prepare('SELECT * FROM mcp_event_subscriptions WHERE id=? AND owner=? AND expires_at>?').get(id, owner, Date.now()) as Record<string, unknown> | undefined;
    return row ? { id: String(row.id), owner: String(row.owner), name: String(row.name), arguments: JSON.parse(String(row.arguments)), url: String(row.url), secret: String(row.secret), expiresAt: Number(row.expires_at) } : undefined;
  }
  matching(name: string, owner: string): Subscription[] {
    const rows = this.db.prepare('SELECT id FROM mcp_event_subscriptions WHERE name=? AND owner=? AND expires_at>?').all(name, owner, Date.now()) as { id: string }[];
    return rows.flatMap(row => { const sub = this.get(row.id, owner); return sub ? [sub] : []; });
  }
  remove(id: string, owner: string): void {
    this.db.prepare('DELETE FROM mcp_event_subscriptions WHERE id=? AND owner=?').run(id, owner);
  }
  enqueue(sub: Subscription, eventId: string, body: string): void {
    this.db.prepare('INSERT OR IGNORE INTO mcp_event_deliveries(subscription_id,event_id,body,next_attempt_at) VALUES(?,?,?,?)').run(sub.id, eventId, body, Date.now());
  }
  pending(limit = 100): DeliveryJob[] {
    this.db.prepare('DELETE FROM mcp_event_subscriptions WHERE expires_at<=?').run(Date.now());
    const rows = this.db.prepare('SELECT * FROM mcp_event_deliveries WHERE next_attempt_at<=? ORDER BY id LIMIT ?').all(Date.now(), limit) as Record<string, unknown>[];
    return rows.map(row => ({ id: Number(row.id), subscriptionId: String(row.subscription_id), eventId: String(row.event_id), body: String(row.body), attempts: Number(row.attempts), nextAttemptAt: Number(row.next_attempt_at) }));
  }
  retry(id: number, nextAttemptAt: number): void {
    this.db.prepare('UPDATE mcp_event_deliveries SET attempts=attempts+1,next_attempt_at=? WHERE id=?').run(nextAttemptAt, id);
  }
  complete(id: number): void { this.db.prepare('DELETE FROM mcp_event_deliveries WHERE id=?').run(id); }
  close(): void { this.db.close(); }
}
