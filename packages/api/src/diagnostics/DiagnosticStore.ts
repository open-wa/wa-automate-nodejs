export type ServerDiagnosticRecord = {
  id: number;
  event: string;
  timestamp: number;
  message: string;
  stack: string | null;
  scope: string | null;
  method: string | null;
  route: string | null;
  component: string | null;
};

const MAX_RECORDS = 100;
const MAX_TEXT = 8_000;

function text(value: unknown, limit = 500): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const clean = value.trim();
  if (clean.length <= limit) return clean;
  const notice = `\n[truncated at ${limit} characters]`;
  return `${clean.slice(0, limit - notice.length)}${notice}`;
}

function unwrap(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  const record = payload as Record<string, unknown>;
  const nested = record.details ?? record.ctx ?? record.payload;
  return nested && typeof nested === 'object' ? nested as Record<string, unknown> : record;
}

function isErrorEvent(event: string, payload: unknown) {
  const outer = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const nested = unwrap(payload);
  const records = outer === nested ? [outer] : [outer, nested];
  const levels = records.map((record) => String(record.level ?? record.severity ?? record.type ?? record.kind ?? '').toLowerCase());
  if (records.some((record) => record.warning === true) || levels.some((level) => ['warn', 'warning', 'info', 'debug', 'trace', 'verbose'].includes(level))) return false;
  if (event === 'error') return true;
  return event === 'debug:log' && levels.some((level) => level === 'error' || level === 'fatal');
}

/** Holds structured runtime errors observed on this API server's event bridge. */
export class DiagnosticStore {
  private nextId = 0;
  private records: ServerDiagnosticRecord[] = [];
  private attached = false;

  attach() {
    this.attached = true;
  }

  capture(event: string, payload: unknown) {
    if (!isErrorEvent(event, payload)) return;
    const outer = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
    const record = unwrap(payload);
    const error = record.error instanceof Error
      ? record.error
      : outer.error instanceof Error
        ? outer.error
        : null;
    const errorRecord = record.error && typeof record.error === 'object'
      ? record.error as Record<string, unknown>
      : {};
    const message = text(error?.message ?? errorRecord.message ?? record.message ?? record.msg ?? (typeof record.error === 'string' ? record.error : undefined) ?? (event === 'error' && typeof payload === 'string' ? payload : undefined), 1_500);
    if (!message) return;
    const stack = text(error?.stack ?? errorRecord.stack ?? record.stack ?? record.trace, MAX_TEXT);
    this.records.push({
      id: ++this.nextId,
      event,
      timestamp: Date.now(),
      message,
      stack,
      scope: text(record.scope ?? record.name, 240),
      method: text(record.method ?? record.operation, 240),
      route: text(record.route ?? record.path ?? record.endpoint, 240),
      component: text(record.component ?? record.source ?? record.module, 240),
    });
    if (this.records.length > MAX_RECORDS) this.records.splice(0, this.records.length - MAX_RECORDS);
  }

  getSnapshot() {
    return {
      available: this.attached,
      captureSource: 'session event bridge' as const,
      captureLimit: MAX_RECORDS,
      records: this.records.slice(),
    };
  }
}
