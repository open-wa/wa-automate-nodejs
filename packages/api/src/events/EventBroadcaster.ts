export interface SseEventEnvelope {
  id: string;
  event: string;
  payload: unknown;
  ts: number;
  sessionId: string;
}

interface EventSubscriber {
  topics: Set<string> | null;
  push: (chunk: string) => void;
}

export interface EventStreamOptions {
  keepaliveMs?: number;
  signal?: AbortSignal;
  topics?: string[];
}

const DEFAULT_KEEPALIVE_MS = 20_000;

function normalizeTopics(topics?: string[]): Set<string> | null {
  if (!topics || topics.length === 0 || topics.includes('*')) {
    return null;
  }

  return new Set(topics);
}

function formatEventFrame(envelope: SseEventEnvelope): string {
  return `id: ${envelope.id}\nevent: ${envelope.event}\ndata: ${JSON.stringify(envelope)}\n\n`;
}

export class EventBroadcaster {
  private readonly encoder = new TextEncoder();
  private readonly sessionId: string;
  private nextEventId = 0;
  private nextSubscriberId = 0;
  private subscribers = new Map<number, EventSubscriber>();

  constructor(sessionId?: string) {
    this.sessionId = sessionId ?? '';
  }

  public broadcast(event: string, payload: unknown): SseEventEnvelope {
    const envelope: SseEventEnvelope = {
      id: String(++this.nextEventId),
      event,
      payload,
      ts: Date.now(),
      sessionId: this.sessionId,
    };

    const frame = formatEventFrame(envelope);

    for (const subscriber of this.subscribers.values()) {
      if (subscriber.topics && !subscriber.topics.has(event)) {
        continue;
      }

      subscriber.push(frame);
    }

    return envelope;
  }

  public createStream(options: EventStreamOptions = {}): ReadableStream<Uint8Array> {
    const topics = normalizeTopics(options.topics);
    const keepaliveMs = options.keepaliveMs ?? DEFAULT_KEEPALIVE_MS;
    let cleanup = () => {};

    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        const subscriberId = ++this.nextSubscriberId;

        let closed = false;

        const keepaliveTimer: ReturnType<typeof setInterval> = setInterval(() => {
          push(':keepalive\n\n');
        }, keepaliveMs);

        cleanup = () => {
          if (closed) {
            return;
          }

          closed = true;
          this.subscribers.delete(subscriberId);
          clearInterval(keepaliveTimer);
          options.signal?.removeEventListener('abort', cleanup);
        };

        const push = (chunk: string) => {
          if (closed) {
            return;
          }

          try {
            controller.enqueue(this.encoder.encode(chunk));
          } catch {
            cleanup();
          }
        };

        if (typeof keepaliveTimer.unref === 'function') {
          keepaliveTimer.unref();
        }

        this.subscribers.set(subscriberId, {
          topics,
          push,
        });

        options.signal?.addEventListener('abort', cleanup, { once: true });
        push('retry: 3000\n\n');
      },
      cancel: () => {
        cleanup();
      },
    });
  }

  public getSubscriberCount(): number {
    return this.subscribers.size;
  }
}
