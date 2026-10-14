import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { ProtocolError, ProtocolErrorCode } from '@modelcontextprotocol/server';
import { getEventContract, getMcpEventDefinitions } from '@open-wa/schema';
import { ScopedTaskQueue } from '@open-wa/runtime-core';
import { Webhook } from 'standardwebhooks';
import { callbackUrl, postCallback } from './callback';
import { canonicalJson, type SubscribeParams, type UnsubscribeParams } from './protocol';
import { McpEventStore, type DeliveryJob, type Subscription } from './store';

export interface McpEventsOptions {
  sessionId: string;
  storePath: string;
  owner: () => string | undefined;
  lifetimeMs: number;
  log?: (data: Record<string, unknown>) => void;
}

const MAX_BODY_BYTES = 256 * 1024;
const MAX_ATTEMPTS = 4;
const error = (message: string) => new ProtocolError(ProtocolErrorCode.InvalidParams, message);
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};

export class McpEventsService {
  private readonly store: McpEventStore;
  private readonly queue: Promise<ScopedTaskQueue>;
  private readonly controller = new AbortController();
  private readonly active = new Map<number, Promise<unknown>>();
  private readonly deliveries = new Map<string, Set<AbortController>>();
  private readonly verified = new Map<string, number>();
  private readonly timer: ReturnType<typeof setInterval>;
  private closing = false;

  constructor(private readonly options: McpEventsOptions) {
    this.store = new McpEventStore(options.storePath);
    this.queue = ScopedTaskQueue.make({ name: 'mcp.events', capacity: 100, concurrency: 4, overload: 'dropping' });
    this.timer = setInterval(() => this.pump(), 1000);
    this.timer.unref?.();
    void this.queue.then(() => this.pump()).catch(() => this.log('mcp_event_queue_unavailable'));
  }

  list(cursor?: string) {
    if (cursor !== undefined) throw error('The event catalog fits in one page; omit cursor');
    return { events: getMcpEventDefinitions() };
  }

  private principal(): string {
    const owner = this.options.owner();
    if (!owner || this.closing) throw new ProtocolError(-32001, 'MCP access is unavailable');
    return owner;
  }

  private validated(name: string, args: Record<string, unknown>) {
    const contract = getEventContract(name);
    if (!contract?.mcp) throw error('Unknown or unavailable MCP event');
    const parsed = contract.mcp.inputSchema.safeParse(args);
    if (!parsed.success) throw error('Invalid subscription filters');
    return { contract, arguments: parsed.data as Record<string, unknown> };
  }

  private identity(owner: string, name: string, args: Record<string, unknown>, url: string): string {
    return `sub_${createHash('sha256').update(canonicalJson({ owner, name, arguments: args, url })).digest('hex')}`;
  }

  async subscribe(params: SubscribeParams) {
    const owner = this.principal();
    const { arguments: args } = this.validated(params.name, params.arguments);
    if (params.cursor != null) throw error('These events do not support history replay; use cursor:null');
    let url: string;
    try { url = callbackUrl(params.delivery.url).href; } catch { throw error('Callback must be a public HTTPS URL without credentials or fragments'); }
    const encodedKey = params.delivery.secret.slice(6);
    const key = Buffer.from(encodedKey, 'base64');
    if (!params.delivery.secret.startsWith('whsec_') || key.length < 24 || key.length > 64 || key.toString('base64') !== encodedKey) {
      throw error('Signing secret must be whsec_ followed by a base64 key of 24–64 bytes');
    }
    const id = this.identity(owner, params.name, args, url);
    await this.verify(owner, id, url, params.delivery.secret);
    if (this.principal() !== owner) throw new ProtocolError(-32001, 'MCP access changed during subscription');
    // A null TTL is granted a finite lifetime; refreshBefore communicates that decision.
    const lifetime = Math.min(params.ttlMs ?? this.options.lifetimeMs, this.options.lifetimeMs);
    const expiresAt = Date.now() + lifetime;
    this.store.save({ id, owner, name: params.name, arguments: args, url, secret: params.delivery.secret, expiresAt });
    return { id, refreshBefore: new Date(expiresAt).toISOString(), cursor: null, truncated: false };
  }

  unsubscribe(params: UnsubscribeParams) {
    const owner = this.principal();
    const { arguments: args } = this.validated(params.name, params.arguments);
    let url: string;
    try { url = callbackUrl(params.delivery.url).href; } catch { throw error('Invalid callback URL'); }
    const id = this.identity(owner, params.name, args, url);
    this.store.remove(id, owner);
    for (const controller of this.deliveries.get(id) ?? []) controller.abort();
    return {};
  }

  private async verify(owner: string, id: string, url: string, secret: string): Promise<void> {
    const now = Date.now();
    for (const [cacheKey, expiry] of this.verified) if (expiry <= now) this.verified.delete(cacheKey);
    const cacheKey = canonicalJson({ owner, url });
    if ((this.verified.get(cacheKey) ?? 0) > now) return;
    const challenge = randomUUID();
    const eventId = `verification_${randomUUID()}`;
    const body = JSON.stringify({ type: 'verification', challenge });
    try {
      const response = await postCallback(url, body, this.headers(secret, id, eventId, body), this.controller.signal);
      const reply = JSON.parse(response.body) as { challenge?: unknown };
      const actual = typeof reply.challenge === 'string' ? Buffer.from(reply.challenge) : Buffer.alloc(0);
      const expected = Buffer.from(challenge);
      if (response.status < 200 || response.status >= 300 || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
        throw new Error('challenge_failed');
      }
      // Bound cache size as well as lifetime; arbitrary callbacks cannot grow it forever.
      if (this.verified.size >= 1000) this.verified.delete(this.verified.keys().next().value!);
      this.verified.set(cacheKey, Date.now() + 15 * 60_000);
    } catch {
      throw new ProtocolError(-32015, 'Callback verification failed', { reason: 'challenge_failed' });
    }
  }

  private headers(secret: string, subscriptionId: string, eventId: string, body: string): Record<string, string> {
    const at = new Date();
    return {
      'webhook-id': eventId,
      'webhook-timestamp': String(Math.floor(at.getTime() / 1000)),
      'webhook-signature': new Webhook(secret).sign(eventId, at, body),
      'X-MCP-Subscription-Id': subscriptionId,
    };
  }

  publish(name: string, payload: unknown): void {
    const owner = this.options.owner();
    const contract = getEventContract(name);
    if (this.closing || !owner || !contract?.mcp) return;
    const projected = contract.mcp.payloadSchema.safeParse(contract.mcp.project(payload, this.options.sessionId));
    if (!projected.success) { this.log('mcp_event_payload_unavailable', name); return; }
    const data = projected.data as Record<string, unknown>;
    const runtime = object(payload);
    const occurredAt = object(runtime.ctx).ts ?? runtime.ts;
    if (typeof occurredAt !== 'number' || !Number.isFinite(occurredAt)) { this.log('mcp_event_timestamp_unavailable', name); return; }
    const date = new Date(occurredAt);
    if (!Number.isFinite(date.getTime())) return;
    const eventId = `evt_${randomUUID()}`;
    const body = JSON.stringify({ eventId, name, timestamp: date.toISOString(), data, cursor: null });
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) { this.log('mcp_event_payload_too_large', name); return; }
    for (const subscription of this.store.matching(name, owner)) {
      if (subscription.arguments.chatId !== undefined && subscription.arguments.chatId !== data.chatId) continue;
      this.store.enqueue(subscription, eventId, body);
    }
    this.pump();
  }

  private pump(): void {
    if (this.closing) return;
    try {
      for (const job of this.store.pending()) {
        if (this.active.size >= 100) break;
        if (this.active.has(job.id)) continue;
        const pending = this.queue.then(queue => queue.submit(() => this.deliver(job), `event.${job.id}`))
          .catch(() => this.log('mcp_event_delivery_deferred'))
          .finally(() => this.active.delete(job.id));
        this.active.set(job.id, pending);
      }
    } catch { this.log('mcp_event_journal_unavailable'); }
  }

  private async deliver(job: DeliveryJob): Promise<void> {
    if (this.closing) return;
    const owner = this.options.owner();
    const subscription = owner ? this.store.get(job.subscriptionId, owner) : undefined;
    if (!subscription || !getEventContract(subscription.name)?.mcp) { this.store.complete(job.id); return; }
    const controller = new AbortController();
    const signals = this.deliveries.get(subscription.id) ?? new Set<AbortController>();
    signals.add(controller); this.deliveries.set(subscription.id, signals);
    try {
      const response = await postCallback(subscription.url, job.body, this.headers(subscription.secret, subscription.id, job.eventId, job.body), AbortSignal.any([this.controller.signal, controller.signal]));
      if (response.status >= 200 && response.status < 300) { this.store.complete(job.id); return; }
      if (response.status === 410 || response.status === 413 || (response.status < 500 && response.status !== 408 && response.status !== 429)) {
        this.store.complete(job.id); this.log('mcp_event_delivery_rejected', subscription.name); return;
      }
      this.retry(job, subscription);
    } catch {
      if (!this.closing && !controller.signal.aborted) this.retry(job, subscription);
    } finally {
      signals.delete(controller);
      if (!signals.size) this.deliveries.delete(subscription.id);
    }
  }

  private retry(job: DeliveryJob, subscription: Subscription): void {
    if (job.attempts + 1 >= MAX_ATTEMPTS) { this.store.complete(job.id); this.log('mcp_event_delivery_exhausted', subscription.name); return; }
    this.store.retry(job.id, Date.now() + 1000 * 2 ** job.attempts);
  }

  private log(message: string, event?: string): void {
    this.options.log?.({ level: 'warn', component: 'mcp.events', message, event });
  }

  async close(): Promise<void> {
    if (this.closing) return;
    this.closing = true; clearInterval(this.timer); this.controller.abort();
    const queue = await this.queue;
    await queue.close();
    await Promise.allSettled([...this.active.values()]);
    this.store.close();
  }
}
