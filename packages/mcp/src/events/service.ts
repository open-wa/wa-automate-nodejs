import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { getEventContract, getMcpEventDefinitions } from '@open-wa/schema';
import { ScopedTaskQueue } from '@open-wa/runtime-core';
import { Webhook } from 'standardwebhooks';
import { callbackFailure, callbackUrl, postCallback } from './callback';
import {
  SUBSCRIPTION_META, canonicalJson, errorBody, eventErrors, matchesArguments,
  type CallbackFailure, type EventOccurrence, type PollParams, type StreamParams, type SubscribeParams, type UnsubscribeParams,
} from './protocol';
import { McpEventStore, type DeliveryJob, type LoggedEvent, type Subscription } from './store';

export interface McpEventsOptions {
  sessionId: string;
  storePath: string;
  owner: () => string | undefined;
  lifetimeMs: number;
  retentionMs: number;
  log?: (data: Record<string, unknown>) => void;
  /** Callback transport; replaceable in tests. */
  post?: typeof postCallback;
}

/** What `events/stream` needs from the request it runs inside. */
export interface StreamContext {
  requestId: string | number;
  signal: AbortSignal;
  notify(method: string, params: Record<string, unknown>): Promise<void>;
}

interface LiveStream {
  owner: string; name: string; arguments: Record<string, unknown>;
  offer(event: LoggedEvent): void;
  end(error?: ReturnType<typeof errorBody>): void;
}

const MAX_BODY_BYTES = 256 * 1024;
/** Five attempts in about 14 minutes, inside the spec's 10–15 minute retry window. */
const RETRY_DELAYS_MS = [30_000, 120_000, 300_000, 420_000];
const ROTATION_GRACE_MS = 10 * 60_000;
const MAX_SUBSCRIPTIONS = 1000;
const MAX_STREAMS = 100;
const MAX_LOGGED_EVENTS = 10_000;
const NEXT_POLL_MS = 5000;
const POLL_EVENTS = { default: 100, max: 500 };
const HEARTBEAT_MS = { min: 5000, default: 30_000, max: 60_000 };
const VERIFICATIONS_PER_HOST_PER_MINUTE = 10;
const MAINTENANCE_MS = 30_000;

const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const messageId = (kind?: string) => `msg_${kind ? `${kind}_` : ''}${randomBytes(16).toString('hex')}`;
const iso = (ms: number | undefined) => ms === undefined ? null : new Date(ms).toISOString();

export class McpEventsService {
  private readonly store: McpEventStore;
  private readonly post: typeof postCallback;
  private readonly queue: Promise<ScopedTaskQueue>;
  private readonly controller = new AbortController();
  private readonly active = new Map<number, Promise<unknown>>();
  private readonly deliveries = new Map<string, Set<AbortController>>();
  private readonly verified = new Map<string, number>();
  private readonly verificationBudget = new Map<string, number[]>();
  private readonly streams = new Set<LiveStream>();
  private readonly timer: ReturnType<typeof setInterval>;
  private lastMaintenance = 0;
  private closing = false;

  constructor(private readonly options: McpEventsOptions) {
    this.store = new McpEventStore(options.storePath);
    this.post = options.post ?? postCallback;
    this.queue = ScopedTaskQueue.make({ name: 'mcp.events', capacity: 100, concurrency: 4, overload: 'dropping' });
    this.timer = setInterval(() => this.pump(), 1000);
    this.timer.unref?.();
    void this.queue.then(() => this.pump()).catch(() => this.log('mcp_event_queue_unavailable'));
  }

  list() {
    // One page holds the whole catalog, so any pagination cursor is answered with it.
    return { resultType: 'complete' as const, events: getMcpEventDefinitions() };
  }

  // Shared subscription mechanics

  private principal(): string {
    const owner = this.options.owner();
    if (!owner || this.closing) throw eventErrors.forbidden('MCP access is unavailable');
    return owner;
  }

  private validated(name: string, args: Record<string, unknown>) {
    const contract = getEventContract(name);
    if (!contract?.mcp) throw eventErrors.notFound('event');
    const parsed = contract.mcp.inputSchema.safeParse(args);
    if (!parsed.success) throw eventErrors.invalidParams('Invalid subscription arguments');
    return parsed.data as Record<string, unknown>;
  }

  private cursor(seq: number): string { return `${this.store.epoch}.${seq}`; }

  /** Resolves a client cursor to the sequence delivery starts after, per the spec's cursor lifecycle. */
  private start(cursor: string | null | undefined, maxAgeMs?: number): { after: number; truncated: boolean } {
    const head = this.store.head();
    if (cursor == null) return { after: head, truncated: false };
    const match = /^([0-9a-f]+)\.(\d+)$/.exec(cursor);
    if (!match) throw eventErrors.invalidParams('Unrecognised cursor');
    const seq = Number(match[2]);
    // Another journal, or a position this journal never issued: resume from now and report the gap.
    if (match[1] !== this.store.epoch || seq > head) return { after: head, truncated: true };
    let after = seq;
    let truncated = false;
    const pruned = this.store.prunedThrough();
    if (after < pruned) { after = pruned; truncated = true; }
    if (maxAgeMs !== undefined) {
      const floor = this.store.lastBefore(Date.now() - maxAgeMs);
      if (floor > after) { after = floor; truncated = true; }
    }
    return { after, truncated };
  }

  /** Calls `visit` for each logged event after `after` that this subscription would receive. */
  private scan(owner: string, name: string, args: Record<string, unknown>, after: number, visit: (event: LoggedEvent) => boolean | void): number {
    let position = after;
    for (;;) {
      const batch = this.store.events(owner, name, position, 500);
      for (const event of batch) {
        if (matchesArguments(args, event.data) && visit(event) === false) return position;
        position = event.seq;
      }
      if (batch.length < 500) return this.store.head();
    }
  }

  private occurrence(event: LoggedEvent, cursor?: string): EventOccurrence {
    return { eventId: event.eventId, name: event.name, timestamp: event.timestamp, data: event.data, ...(cursor ? { cursor } : {}) };
  }

  // Poll

  poll(params: PollParams) {
    const owner = this.principal();
    const args = this.validated(params.name, params.arguments);
    const limit = Math.min(params.maxEvents ?? POLL_EVENTS.default, POLL_EVENTS.max);
    const { after, truncated } = this.start(params.cursor, params.maxAgeMs);
    const events: EventOccurrence[] = [];
    let hasMore = false;
    // scan() stops before the first event that does not fit, so the cursor never skips an unreturned match.
    const position = this.scan(owner, params.name, args, after, event => {
      if (events.length === limit) { hasMore = true; return false; }
      events.push(this.occurrence(event));
      return true;
    });
    return { resultType: 'complete' as const, events, cursor: this.cursor(position), truncated, hasMore, nextPollMs: NEXT_POLL_MS };
  }

  // Push

  async stream(params: StreamParams, ctx: StreamContext) {
    const owner = this.principal();
    const args = this.validated(params.name, params.arguments);
    if (this.streams.size >= MAX_STREAMS) throw eventErrors.exhausted('streams', MAX_STREAMS);
    const { after, truncated } = this.start(params.cursor, params.maxAgeMs);
    const heartbeatMs = Math.min(Math.max(params.heartbeatMs ?? HEARTBEAT_MS.default, HEARTBEAT_MS.min), HEARTBEAT_MS.max);
    const meta = { [SUBSCRIPTION_META]: ctx.requestId };
    if (ctx.signal.aborted) return { resultType: 'complete' as const, _meta: meta };

    let chain: Promise<void> = Promise.resolve();
    let lastSent = 0;
    let closed = false;
    let resolveDone!: () => void;
    const done = new Promise<void>(resolve => { resolveDone = resolve; });
    const send = (method: string, body: Record<string, unknown>) => {
      if (closed) return;
      lastSent = Date.now();
      // Anything queued before end() still goes out, so a terminated notification follows its events.
      chain = chain.then(() => ctx.signal.aborted ? undefined : ctx.notify(method, { ...body, _meta: meta })).catch(() => stream.end());
    };
    const heartbeat = setInterval(() => {
      if (this.options.owner() !== owner) { stream.end(errorBody(-32024, 'Forbidden', { reason: 'Access revoked' })); return; }
      if (Date.now() - lastSent >= heartbeatMs) send('notifications/events/heartbeat', { cursor: this.cursor(this.store.head()) });
    }, Math.min(1000, heartbeatMs));
    heartbeat.unref?.();

    const stream: LiveStream = {
      owner, name: params.name, arguments: args,
      offer: event => send('notifications/events/event', this.occurrence(event, this.cursor(event.seq)) as unknown as Record<string, unknown>),
      end: error => {
        if (closed) return;
        if (error) send('notifications/events/terminated', { error });
        closed = true;
        clearInterval(heartbeat);
        this.streams.delete(stream);
        void chain.finally(resolveDone);
      },
    };
    ctx.signal.addEventListener('abort', () => stream.end(), { once: true });

    // Backlog and registration happen in one synchronous turn, so no publish can fall between them.
    send('notifications/events/active', { cursor: this.cursor(after), truncated, heartbeatMs });
    this.scan(owner, params.name, args, after, event => { stream.offer(event); });
    this.streams.add(stream);
    await done;
    return { resultType: 'complete' as const, _meta: meta };
  }

  // Webhook

  private identity(owner: string, name: string, args: Record<string, unknown>, url: string): string {
    return `sub_${createHash('sha256').update(canonicalJson({ owner, name, arguments: args, url })).digest('hex').slice(0, 32)}`;
  }

  private watermark(subscriptionId: string): string {
    const oldest = this.store.oldestPending(subscriptionId);
    return this.cursor(oldest === undefined ? this.store.head() : oldest - 1);
  }

  async subscribe(params: SubscribeParams) {
    const owner = this.principal();
    const args = this.validated(params.name, params.arguments);
    let url: string;
    try { url = callbackUrl(params.delivery.url).href; } catch { throw eventErrors.invalidParams('Callback must be a public HTTPS URL without credentials or fragments'); }
    const encodedKey = params.delivery.secret.slice(6);
    const key = Buffer.from(encodedKey, 'base64');
    if (!params.delivery.secret.startsWith('whsec_') || key.length < 24 || key.length > 64 || key.toString('base64') !== encodedKey) {
      throw eventErrors.invalidParams('Signing secret must be whsec_ followed by a base64 key of 24–64 bytes');
    }
    const id = this.identity(owner, params.name, args, url);
    const existing = this.store.get(id, owner);
    if (!existing && this.store.count(owner) >= MAX_SUBSCRIPTIONS) throw eventErrors.exhausted('subscriptions', MAX_SUBSCRIPTIONS);
    // A live subscription treats the supplied cursor as a no-op; a new or lapsed one starts from it.
    const start = existing ? { after: 0, truncated: false } : this.start(params.cursor, params.maxAgeMs);
    await this.verify(owner, id, url, params.delivery.secret);
    if (this.principal() !== owner) throw eventErrors.forbidden('MCP access changed during subscription');

    // A null TTL is granted a finite lifetime; refreshBefore communicates that decision.
    const expiresAt = Date.now() + Math.min(params.ttlMs ?? this.options.lifetimeMs, this.options.lifetimeMs);
    const rotated = existing !== undefined && existing.secret !== params.delivery.secret;
    const subscription: Subscription = {
      id, owner, name: params.name, arguments: args, url, secret: params.delivery.secret, expiresAt,
      previousSecret: rotated ? existing.secret : existing?.previousSecret,
      previousSecretUntil: rotated ? Date.now() + ROTATION_GRACE_MS : existing?.previousSecretUntil,
    };
    this.store.save(subscription);
    if (!existing) {
      this.scan(owner, params.name, args, start.after, event => { this.enqueueEvent(subscription, event); });
      this.pump();
    }
    return {
      resultType: 'complete' as const, id, refreshBefore: new Date(expiresAt).toISOString(),
      cursor: this.watermark(id), truncated: start.truncated,
      ...(existing ? { deliveryStatus: { active: true, lastDeliveryAt: iso(existing.lastDeliveryAt), lastError: existing.lastError ?? null } } : {}),
    };
  }

  unsubscribe(params: UnsubscribeParams) {
    const owner = this.principal();
    const args = this.validated(params.name, params.arguments);
    let url: string;
    try { url = callbackUrl(params.delivery.url).href; } catch { throw eventErrors.invalidParams('Invalid callback URL'); }
    const id = this.identity(owner, params.name, args, url);
    if (!this.store.get(id, owner)) throw eventErrors.notFound('subscription');
    this.store.remove(id);
    for (const controller of this.deliveries.get(id) ?? []) controller.abort();
    return { resultType: 'complete' as const };
  }

  private async verify(owner: string, id: string, url: string, secret: string): Promise<void> {
    const now = Date.now();
    for (const [cacheKey, expiry] of this.verified) if (expiry <= now) this.verified.delete(cacheKey);
    const cacheKey = canonicalJson({ owner, url });
    if ((this.verified.get(cacheKey) ?? 0) > now) return;

    const host = new URL(url).host;
    const recent = (this.verificationBudget.get(host) ?? []).filter(at => at > now - 60_000);
    if (recent.length >= VERIFICATIONS_PER_HOST_PER_MINUTE) throw eventErrors.exhausted('verifications', VERIFICATIONS_PER_HOST_PER_MINUTE);
    this.verificationBudget.set(host, [...recent, now]);
    if (this.verificationBudget.size > 1000) this.verificationBudget.delete(this.verificationBudget.keys().next().value!);

    const challenge = randomBytes(24).toString('base64url');
    const body = JSON.stringify({ type: 'verification', challenge });
    let failure: CallbackFailure | undefined;
    try {
      const response = await this.post(url, body, this.headers([secret], id, messageId('verification'), body), this.controller.signal);
      if (response.status < 200 || response.status >= 300) failure = callbackFailure(undefined, response.status);
      else {
        let echoed: unknown;
        try { echoed = (JSON.parse(response.body) as { challenge?: unknown }).challenge; } catch { echoed = undefined; }
        const actual = typeof echoed === 'string' ? Buffer.from(echoed) : Buffer.alloc(0);
        const expected = Buffer.from(challenge);
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) failure = 'challenge_failed';
      }
    } catch (error) {
      failure = callbackFailure(error);
    }
    if (failure) throw eventErrors.callback(failure);
    // Bound cache size as well as lifetime; arbitrary callbacks cannot grow it forever.
    if (this.verified.size >= 1000) this.verified.delete(this.verified.keys().next().value!);
    this.verified.set(cacheKey, Date.now() + 15 * 60_000);
  }

  private headers(secrets: string[], subscriptionId: string, webhookId: string, body: string): Record<string, string> {
    const at = new Date();
    return {
      'webhook-id': webhookId,
      'webhook-timestamp': String(Math.floor(at.getTime() / 1000)),
      // During secret rotation both signatures are sent; receivers accept either.
      'webhook-signature': secrets.map(secret => new Webhook(secret).sign(webhookId, at, body)).join(' '),
      'X-MCP-Subscription-Id': subscriptionId,
    };
  }

  private enqueueEvent(subscription: Subscription, event: LoggedEvent): void {
    this.store.enqueue({ subscriptionId: subscription.id, webhookId: messageId(), seq: event.seq, body: JSON.stringify(this.occurrence(event)) });
  }

  // Publishing

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
    const eventId = contract.mcp.eventId?.(data) ?? `evt_${randomBytes(16).toString('hex')}`;
    const timestamp = date.toISOString();
    const sized = JSON.stringify({ eventId, name, timestamp, data, cursor: this.cursor(Number.MAX_SAFE_INTEGER) });
    if (Buffer.byteLength(sized) > MAX_BODY_BYTES) { this.log('mcp_event_payload_too_large', name); return; }

    const event = this.store.append({ owner, name, eventId, timestamp, data });
    for (const subscription of this.store.matching(name, owner)) {
      if (matchesArguments(subscription.arguments, data)) this.enqueueEvent(subscription, event);
    }
    for (const stream of this.streams) {
      if (stream.owner === owner && stream.name === name && matchesArguments(stream.arguments, data)) stream.offer(event);
    }
    this.pump();
  }

  // Delivery

  private maintain(): void {
    const now = Date.now();
    if (now - this.lastMaintenance < MAINTENANCE_MS) return;
    this.lastMaintenance = now;
    this.store.prune(this.options.retentionMs, MAX_LOGGED_EVENTS);
    const owner = this.options.owner();
    for (const subscription of this.store.orphaned(owner, name => Boolean(getEventContract(name)?.mcp))) {
      const error = subscription.owner !== owner
        ? errorBody(-32024, 'Forbidden', { reason: 'Access revoked' })
        : errorBody(-32023, 'NotFound', { kind: 'event' });
      this.store.enqueue({
        subscriptionId: subscription.id, webhookId: messageId('terminated'), seq: null,
        body: JSON.stringify({ type: 'terminated', error }), url: subscription.url, secret: subscription.secret,
      });
      this.store.remove(subscription.id);
    }
    for (const stream of this.streams) {
      if (stream.owner !== owner) stream.end(errorBody(-32024, 'Forbidden', { reason: 'Access revoked' }));
      else if (!getEventContract(stream.name)?.mcp) stream.end(errorBody(-32023, 'NotFound', { kind: 'event' }));
    }
  }

  private pump(): void {
    if (this.closing) return;
    try {
      this.maintain();
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
    let url: string;
    let secrets: string[];
    let subscription: Subscription | undefined;
    if (job.url && job.secret) {
      url = job.url; secrets = [job.secret];
    } else {
      const owner = this.options.owner();
      subscription = owner ? this.store.get(job.subscriptionId, owner) : undefined;
      if (!subscription) { this.store.complete(job.id); return; }
      url = subscription.url;
      secrets = [subscription.secret];
      if (subscription.previousSecret && (subscription.previousSecretUntil ?? 0) > Date.now()) secrets.push(subscription.previousSecret);
    }
    // The payload cursor is a watermark: it never passes an event that is still awaiting delivery, this one included.
    const body = job.seq === null ? job.body : JSON.stringify({ ...JSON.parse(job.body), cursor: this.watermark(job.subscriptionId) });
    const controller = new AbortController();
    const signals = this.deliveries.get(job.subscriptionId) ?? new Set<AbortController>();
    signals.add(controller); this.deliveries.set(job.subscriptionId, signals);
    try {
      const response = await this.post(url, body, this.headers(secrets, job.subscriptionId, job.webhookId, body), AbortSignal.any([this.controller.signal, controller.signal]));
      if (response.status >= 200 && response.status < 300) {
        this.store.complete(job.id);
        if (subscription) this.store.recordAttempt(subscription.id);
        return;
      }
      if (subscription) this.store.recordAttempt(subscription.id, callbackFailure(undefined, response.status));
      if (response.status === 410 || response.status === 413 || (response.status < 500 && response.status !== 408 && response.status !== 425 && response.status !== 429)) {
        this.store.complete(job.id); this.log('mcp_event_delivery_rejected'); return;
      }
      this.retry(job);
    } catch (error) {
      if (this.closing || controller.signal.aborted) return;
      if (subscription) this.store.recordAttempt(subscription.id, callbackFailure(error));
      this.retry(job);
    } finally {
      signals.delete(controller);
      if (!signals.size) this.deliveries.delete(job.subscriptionId);
    }
  }

  private retry(job: DeliveryJob): void {
    const delay = RETRY_DELAYS_MS[job.attempts];
    // Exhausted events are abandoned for watermark purposes; a client can replay them by cursor while they are retained.
    if (delay === undefined) { this.store.complete(job.id); this.log('mcp_event_delivery_exhausted'); return; }
    this.store.retry(job.id, Date.now() + delay);
  }

  private log(message: string, event?: string): void {
    this.options.log?.({ level: 'warn', component: 'mcp.events', message, event });
  }

  async close(): Promise<void> {
    if (this.closing) return;
    this.closing = true; clearInterval(this.timer); this.controller.abort();
    for (const stream of this.streams) stream.end();
    const queue = await this.queue;
    await queue.close();
    await Promise.allSettled([...this.active.values()]);
    this.store.close();
  }
}
