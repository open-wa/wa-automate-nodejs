import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { OpenWAEventMap } from '@open-wa/core';
import type { BrokerEntry } from '../runtime/output-broker';
import type { CliQrPayload, CliStatusUpdate } from '@open-wa/wa-automate';

export interface ProjectionSnapshot {
  phase: string;
  sessionId?: string;
  detail?: string;
  qr?: CliQrPayload;
  recentLogs: BrokerEntry[];
  messageCount: number;
  ackCount: number;
  ready: boolean;
  lastEventAt?: number;
}

export interface EventProjectionStoreOptions {
  maxLogs?: number;
  eventDebounceMs?: number;
}

type ProjectionListener = (snapshot: ProjectionSnapshot) => void;
type RuntimeEventName = 'message.received' | 'ack.changed' | 'core.starting' | 'core.stopping' | 'core.stopped' | 'client.ready' | 'launch.auth.qr.generated';

export class EventProjectionStore {
  private readonly maxLogs: number;
  private readonly eventDebounceMs: number;
  private readonly listeners = new Set<ProjectionListener>();
  private readonly state: ProjectionSnapshot = {
    phase: 'boot',
    recentLogs: [],
    messageCount: 0,
    ackCount: 0,
    ready: false,
  };
  private pendingMessageCount = 0;
  private pendingAckCount = 0;
  private flushTimer?: NodeJS.Timeout;

  constructor(options: EventProjectionStoreOptions = {}) {
    this.maxLogs = options.maxLogs ?? 200;
    this.eventDebounceMs = options.eventDebounceMs ?? 100;
  }

  subscribe(listener: ProjectionListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): ProjectionSnapshot {
    return {
      ...this.state,
      recentLogs: [...this.state.recentLogs],
    };
  }

  projectLog(entry: BrokerEntry): void {
    this.state.recentLogs.push(entry);
    if (this.state.recentLogs.length > this.maxLogs) {
      this.state.recentLogs.splice(0, this.state.recentLogs.length - this.maxLogs);
    }
    this.emit();
  }

  projectStatus(update: CliStatusUpdate): void {
    this.state.phase = update.phase;
    this.state.sessionId = update.sessionId ?? this.state.sessionId;
    this.state.detail = update.detail;
    if (update.phase === 'client.ready') {
      this.state.ready = true;
    }
    if (update.phase === 'shutdown.starting') {
      this.state.ready = false;
    }
    this.emit();
  }

  projectQr(payload: CliQrPayload): void {
    this.state.phase = 'auth.qr';
    this.state.qr = payload;
    this.state.sessionId = payload.sessionId;
    this.emit();
  }

  attachEmitter(emitter: HyperEmitter<OpenWAEventMap>): () => void {
    const handlers: Array<[RuntimeEventName, (payload: any) => void]> = [
      ['core.starting', () => {
        this.state.phase = 'boot';
        this.state.lastEventAt = Date.now();
        this.emit();
      }],
      ['core.stopping', () => {
        this.state.phase = 'shutdown.starting';
        this.state.ready = false;
        this.state.lastEventAt = Date.now();
        this.emit();
      }],
      ['core.stopped', () => {
        this.state.phase = 'shutdown.complete';
        this.state.lastEventAt = Date.now();
        this.emit();
      }],
      ['client.ready', () => {
        this.state.phase = 'client.ready';
        this.state.ready = true;
        this.state.lastEventAt = Date.now();
        this.emit();
      }],
      ['launch.auth.qr.generated', (payload) => {
        const qr = payload?.details?.qr;
        if (typeof qr === 'string' && this.state.sessionId) {
          this.projectQr({ qr, sessionId: this.state.sessionId });
        }
      }],
      ['message.received', () => {
        this.pendingMessageCount += 1;
        this.scheduleFlush();
      }],
      ['ack.changed', () => {
        this.pendingAckCount += 1;
        this.scheduleFlush();
      }],
    ];

    for (const [event, handler] of handlers) {
      emitter.on(event, handler as never);
    }

    return () => {
      for (const [event, handler] of handlers) {
        emitter.off(event, handler as never);
      }
    };
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushTimer = undefined;
      this.state.messageCount += this.pendingMessageCount;
      this.state.ackCount += this.pendingAckCount;
      this.pendingMessageCount = 0;
      this.pendingAckCount = 0;
      this.state.lastEventAt = Date.now();
      this.emit();
    }, this.eventDebounceMs);
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export function createEventProjectionStore(options: EventProjectionStoreOptions = {}): EventProjectionStore {
  return new EventProjectionStore(options);
}
