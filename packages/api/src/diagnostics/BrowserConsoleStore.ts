export type BrowserConsoleLevel = 'error' | 'warn' | 'info' | 'debug';

export interface BrowserConsoleRecord {
  id: number;
  sequence: number;
  timestamp: number;
  lastSeen: number;
  level: BrowserConsoleLevel;
  text: string;
  stack: string | null;
  source: 'console' | 'pageerror';
  location: { url: string; lineNumber?: number; columnNumber?: number } | null;
  count: number;
}

export interface BrowserConsoleSnapshot {
  streamId: string;
  sequence: number;
  available: boolean;
  captureLimit: number;
  records: BrowserConsoleRecord[];
}

const CAPTURE_LIMIT = 300;
const MAX_TEXT = 8_000;

/** Keep browser errors readable without exposing embedded scripts or session secrets. */
function cleanText(value: unknown, limit = MAX_TEXT): string {
  if (typeof value !== 'string') return '';
  const clean = value.slice(0, 250_000)
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/data:[^\s)"']+/g, (url) => {
      const position = /:\d+:\d+$/.exec(url)?.[0] ?? '';
      return `[injected script]${position}`;
    })
    .replace(/["']?(?:api[_-]?key|license[_-]?key|authorization|cookie|(?:access[_-]?|refresh[_-]?)?token|password|secret|private[_-]?key|session[_-]?(?:id|key|data|dataEncryptionKey))["']?\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^,;\s}]+)/gi, '[credential redacted]')
    .replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, '[authorization redacted]')
    .replace(/\b(?:https?|wss?):\/\/[^/\s?#]+@[^/\s?#]+/gi, '[URL credentials redacted]')
    .replace(/([?&](?:api[_-]?key|key|token|secret|password)=)[^&\s)]+/gi, '$1[redacted]')
    .replace(/\b[\d:.-]+@(?:c\.us|s\.whatsapp\.net|g\.us|lid)\b/gi, '[chat ID redacted]')
    .replace(/\b\d{10,16}\b/g, '[identifier redacted]')
    .replace(/["']?(?:body|caption|conversation|content|phone(?:number)?|displayName|pushName)["']?\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^,;}\n]+)/gi, '[personal content redacted]')
    .replace(/\b[A-Za-z0-9+/=_-]{80,}\b/g, '[opaque value redacted]')
    .trim();
  return clean.length > limit ? `${clean.slice(0, limit)}\n[truncated]` : clean;
}

function cleanLocation(value: unknown): BrowserConsoleRecord['location'] {
  if (!value || typeof value !== 'object') return null;
  const location = value as Record<string, unknown>;
  const url = typeof location.url === 'string' && location.url.startsWith('data:')
    ? '[injected script]' : cleanText(location.url, 400).split(/[?#]/, 1)[0];
  if (!url) return null;
  return {
    url,
    lineNumber: typeof location.lineNumber === 'number' ? location.lineNumber : undefined,
    columnNumber: typeof location.columnNumber === 'number' ? location.columnNumber : undefined,
  };
}

/** Bounded browser-console history and batched live delivery, independent of session readiness. */
export class BrowserConsoleStore {
  private readonly streamId = crypto.randomUUID();
  private nextId = 0;
  private sequence = 0;
  private attached = false;
  private records = new Map<string, BrowserConsoleRecord>();
  private pending = new Map<number, BrowserConsoleRecord>();
  private publish?: (snapshot: BrowserConsoleSnapshot) => void;
  private flushTimer?: ReturnType<typeof setTimeout>;

  setPublisher(publish: (snapshot: BrowserConsoleSnapshot) => void) {
    this.publish = publish;
  }

  attach() {
    this.attached = true;
    this.scheduleDelivery();
  }

  private scheduleDelivery() {
    if (!this.publish || this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = undefined;
      const records = [...this.pending.values()];
      this.pending.clear();
      this.publish?.({
        streamId: this.streamId,
        sequence: this.sequence,
        available: this.attached,
        captureLimit: CAPTURE_LIMIT,
        records,
      });
    }, 250);
    this.flushTimer.unref?.();
  }

  capture(payload: unknown): BrowserConsoleRecord | null {
    if (!payload || typeof payload !== 'object') return null;
    const value = payload as Record<string, unknown>;
    const text = cleanText(value.text);
    if (!text) return null;
    const type = String(value.level ?? 'info').toLowerCase();
    const level: BrowserConsoleLevel = ['error', 'assert'].includes(type) ? 'error'
      : ['warn', 'warning'].includes(type) ? 'warn'
        : ['debug', 'trace'].includes(type) ? 'debug' : 'info';
    const stack = cleanText(value.stack) || null;
    const location = cleanLocation(value.location);
    const source = value.source === 'pageerror' ? 'pageerror' : 'console';
    const key = JSON.stringify([level, text, stack, source, location]);
    const previous = this.records.get(key);
    const now = Date.now();
    const record: BrowserConsoleRecord = {
      id: previous?.id ?? ++this.nextId,
      sequence: ++this.sequence,
      timestamp: previous?.timestamp ?? now,
      lastSeen: now,
      level, text, stack, source, location,
      count: (previous?.count ?? 0) + 1,
    };
    this.records.delete(key);
    this.records.set(key, record);
    if (this.records.size > CAPTURE_LIMIT) this.records.delete(this.records.keys().next().value!);
    this.pending.delete(record.id);
    this.pending.set(record.id, record);
    if (this.pending.size > CAPTURE_LIMIT) this.pending.delete(this.pending.keys().next().value!);
    this.scheduleDelivery();
    return record;
  }

  getSnapshot(): BrowserConsoleSnapshot {
    return {
      streamId: this.streamId,
      sequence: this.sequence,
      available: this.attached,
      captureLimit: CAPTURE_LIMIT,
      records: [...this.records.values()],
    };
  }

  close() {
    clearTimeout(this.flushTimer);
    this.flushTimer = undefined;
    this.pending.clear();
    this.publish = undefined;
    this.attached = false;
  }
}
