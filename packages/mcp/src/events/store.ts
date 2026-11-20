import { randomBytes } from 'node:crypto';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export interface Subscription {
  id: string; owner: string; name: string; arguments: Record<string, unknown>;
  url: string; secret: string; previousSecret?: string; previousSecretUntil?: number; expiresAt: number;
  lastDeliveryAt?: number; lastError?: string;
}
export interface LoggedEvent { seq: number; owner: string; name: string; eventId: string; timestamp: string; data: Record<string, unknown>; recordedAt: number }
export interface DeliveryJob {
  id: number; subscriptionId: string; webhookId: string; seq: number | null; body: string;
  /** Control envelopes keep their own destination, because the subscription is already gone. */
  url: string | null; secret: string | null;
  attempts: number; firstAttemptAt: number; nextAttemptAt: number;
}

const SCHEMA_VERSION = 2;

/** Secrets, payloads and the short replay log stay in a private local journal, never discovery or logs. */
export class McpEventStore {
  private readonly db: DatabaseSync;
  readonly epoch: string;

  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    chmodSync(path, 0o600);
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;');
    const version = Number((this.db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version);
    if (version !== SCHEMA_VERSION) {
      // Journals are soft state: clients resubscribe on their next refresh.
      this.db.exec(`
        DROP TABLE IF EXISTS mcp_event_deliveries; DROP TABLE IF EXISTS mcp_event_subscriptions;
        DROP TABLE IF EXISTS mcp_event_log; DROP TABLE IF EXISTS mcp_event_meta;
        PRAGMA user_version=${SCHEMA_VERSION};
      `);
    }
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mcp_event_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS mcp_event_log (
        seq INTEGER PRIMARY KEY AUTOINCREMENT, owner TEXT NOT NULL, name TEXT NOT NULL, event_id TEXT NOT NULL,
        timestamp TEXT NOT NULL, data TEXT NOT NULL, recorded_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS mcp_event_log_name ON mcp_event_log(owner, name, seq);
      CREATE TABLE IF NOT EXISTS mcp_event_subscriptions (
        id TEXT PRIMARY KEY, owner TEXT NOT NULL, name TEXT NOT NULL, arguments TEXT NOT NULL, url TEXT NOT NULL,
        secret TEXT NOT NULL, previous_secret TEXT, previous_secret_until INTEGER, expires_at INTEGER NOT NULL,
        last_delivery_at INTEGER, last_error TEXT
      );
      CREATE TABLE IF NOT EXISTS mcp_event_deliveries (
        id INTEGER PRIMARY KEY, subscription_id TEXT NOT NULL, webhook_id TEXT NOT NULL UNIQUE, seq INTEGER,
        body TEXT NOT NULL, url TEXT, secret TEXT, attempts INTEGER NOT NULL DEFAULT 0,
        first_attempt_at INTEGER NOT NULL, next_attempt_at INTEGER NOT NULL, UNIQUE(subscription_id, seq)
      );
      CREATE INDEX IF NOT EXISTS mcp_event_pending ON mcp_event_deliveries(next_attempt_at);
    `);
    const existing = this.db.prepare("SELECT value FROM mcp_event_meta WHERE key='epoch'").get() as { value: string } | undefined;
    this.epoch = existing?.value ?? randomBytes(6).toString('hex');
    if (!existing) this.db.prepare("INSERT INTO mcp_event_meta VALUES ('epoch', ?)").run(this.epoch);
  }

  // Event log

  append(event: Omit<LoggedEvent, 'seq' | 'recordedAt'>): LoggedEvent {
    const recordedAt = Date.now();
    const result = this.db.prepare('INSERT INTO mcp_event_log(owner,name,event_id,timestamp,data,recorded_at) VALUES (?,?,?,?,?,?)')
      .run(event.owner, event.name, event.eventId, event.timestamp, JSON.stringify(event.data), recordedAt);
    return { ...event, seq: Number(result.lastInsertRowid), recordedAt };
  }
  /** Highest sequence ever assigned, including pruned events. */
  head(): number {
    const row = this.db.prepare("SELECT seq FROM sqlite_sequence WHERE name='mcp_event_log'").get() as { seq: number } | undefined;
    return Number(row?.seq ?? 0);
  }
  prunedThrough(): number {
    const row = this.db.prepare("SELECT value FROM mcp_event_meta WHERE key='pruned'").get() as { value: string } | undefined;
    return Number(row?.value ?? 0);
  }
  /** The newest sequence recorded before `before`, so replay can start after it. */
  lastBefore(before: number): number {
    const row = this.db.prepare('SELECT MAX(seq) AS seq FROM mcp_event_log WHERE recorded_at < ?').get(before) as { seq: number | null };
    return Math.max(Number(row.seq ?? 0), this.prunedThrough());
  }
  events(owner: string, name: string, after: number, limit: number): LoggedEvent[] {
    const rows = this.db.prepare('SELECT * FROM mcp_event_log WHERE owner=? AND name=? AND seq>? ORDER BY seq LIMIT ?')
      .all(owner, name, after, limit) as Record<string, unknown>[];
    return rows.map(row => ({
      seq: Number(row.seq), owner: String(row.owner), name: String(row.name), eventId: String(row.event_id),
      timestamp: String(row.timestamp), data: JSON.parse(String(row.data)), recordedAt: Number(row.recorded_at),
    }));
  }
  prune(retentionMs: number, maxEvents: number): void {
    const row = this.db.prepare('SELECT MAX(seq) AS seq FROM mcp_event_log WHERE recorded_at < ? OR seq <= ?')
      .get(Date.now() - retentionMs, this.head() - maxEvents) as { seq: number | null };
    if (row.seq == null) return;
    this.db.prepare('DELETE FROM mcp_event_log WHERE seq <= ?').run(row.seq);
    this.db.prepare("INSERT INTO mcp_event_meta VALUES ('pruned', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
      .run(String(Math.max(row.seq, this.prunedThrough())));
  }

  // Webhook subscriptions

  save(subscription: Subscription): void {
    this.db.prepare(`INSERT INTO mcp_event_subscriptions(id,owner,name,arguments,url,secret,previous_secret,previous_secret_until,expires_at)
      VALUES (?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET secret=excluded.secret, previous_secret=excluded.previous_secret,
        previous_secret_until=excluded.previous_secret_until, expires_at=excluded.expires_at`)
      .run(subscription.id, subscription.owner, subscription.name, JSON.stringify(subscription.arguments), subscription.url,
        subscription.secret, subscription.previousSecret ?? null, subscription.previousSecretUntil ?? null, subscription.expiresAt);
  }
  get(id: string, owner: string): Subscription | undefined {
    const row = this.db.prepare('SELECT * FROM mcp_event_subscriptions WHERE id=? AND owner=? AND expires_at>?').get(id, owner, Date.now()) as Record<string, unknown> | undefined;
    return row ? this.subscription(row) : undefined;
  }
  matching(name: string, owner: string): Subscription[] {
    const rows = this.db.prepare('SELECT * FROM mcp_event_subscriptions WHERE name=? AND owner=? AND expires_at>?').all(name, owner, Date.now()) as Record<string, unknown>[];
    return rows.map(row => this.subscription(row));
  }
  /** Subscriptions that can no longer be served: another principal, or an event type that is gone. */
  orphaned(owner: string | undefined, available: (name: string) => boolean): Subscription[] {
    const rows = this.db.prepare('SELECT * FROM mcp_event_subscriptions WHERE expires_at>?').all(Date.now()) as Record<string, unknown>[];
    return rows.map(row => this.subscription(row)).filter(sub => sub.owner !== owner || !available(sub.name));
  }
  count(owner: string): number {
    return Number((this.db.prepare('SELECT COUNT(*) AS n FROM mcp_event_subscriptions WHERE owner=? AND expires_at>?').get(owner, Date.now()) as { n: number }).n);
  }
  remove(id: string): void {
    this.db.prepare('DELETE FROM mcp_event_subscriptions WHERE id=?').run(id);
    this.db.prepare('DELETE FROM mcp_event_deliveries WHERE subscription_id=? AND url IS NULL').run(id);
  }
  recordAttempt(id: string, error?: string): void {
    if (error) this.db.prepare('UPDATE mcp_event_subscriptions SET last_error=? WHERE id=?').run(error, id);
    else this.db.prepare('UPDATE mcp_event_subscriptions SET last_delivery_at=?, last_error=NULL WHERE id=?').run(Date.now(), id);
  }
  private subscription(row: Record<string, unknown>): Subscription {
    return {
      id: String(row.id), owner: String(row.owner), name: String(row.name), arguments: JSON.parse(String(row.arguments)),
      url: String(row.url), secret: String(row.secret), expiresAt: Number(row.expires_at),
      previousSecret: row.previous_secret == null ? undefined : String(row.previous_secret),
      previousSecretUntil: row.previous_secret_until == null ? undefined : Number(row.previous_secret_until),
      lastDeliveryAt: row.last_delivery_at == null ? undefined : Number(row.last_delivery_at),
      lastError: row.last_error == null ? undefined : String(row.last_error),
    };
  }

  // Delivery journal

  enqueue(job: Pick<DeliveryJob, 'subscriptionId' | 'webhookId' | 'seq' | 'body'> & { url?: string; secret?: string }): void {
    const now = Date.now();
    this.db.prepare('INSERT OR IGNORE INTO mcp_event_deliveries(subscription_id,webhook_id,seq,body,url,secret,first_attempt_at,next_attempt_at) VALUES(?,?,?,?,?,?,?,?)')
      .run(job.subscriptionId, job.webhookId, job.seq, job.body, job.url ?? null, job.secret ?? null, now, now);
  }
  /** Lowest sequence still awaiting delivery for a subscription. */
  oldestPending(subscriptionId: string): number | undefined {
    const row = this.db.prepare('SELECT MIN(seq) AS seq FROM mcp_event_deliveries WHERE subscription_id=? AND seq IS NOT NULL').get(subscriptionId) as { seq: number | null };
    return row.seq == null ? undefined : Number(row.seq);
  }
  pending(limit = 100): DeliveryJob[] {
    const now = Date.now();
    const expired = this.db.prepare('SELECT id FROM mcp_event_subscriptions WHERE expires_at<=?').all(now) as { id: string }[];
    for (const { id } of expired) this.remove(id);
    const rows = this.db.prepare('SELECT * FROM mcp_event_deliveries WHERE next_attempt_at<=? ORDER BY id LIMIT ?').all(now, limit) as Record<string, unknown>[];
    return rows.map(row => ({
      id: Number(row.id), subscriptionId: String(row.subscription_id), webhookId: String(row.webhook_id),
      seq: row.seq == null ? null : Number(row.seq), body: String(row.body),
      url: row.url == null ? null : String(row.url), secret: row.secret == null ? null : String(row.secret),
      attempts: Number(row.attempts), firstAttemptAt: Number(row.first_attempt_at), nextAttemptAt: Number(row.next_attempt_at),
    }));
  }
  retry(id: number, nextAttemptAt: number): void {
    this.db.prepare('UPDATE mcp_event_deliveries SET attempts=attempts+1,next_attempt_at=? WHERE id=?').run(nextAttemptAt, id);
  }
  complete(id: number): void { this.db.prepare('DELETE FROM mcp_event_deliveries WHERE id=?').run(id); }
  close(): void { this.db.close(); }
}
