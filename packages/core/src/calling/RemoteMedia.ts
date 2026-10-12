import { SessionScope } from '@open-wa/runtime-core';
import type { CallIdentity, CallMediaOptions } from '@open-wa/schema';

export interface RemoteMediaRequest { call?: CallIdentity; to?: string; mode: 'accept' | 'start' | 'replace' | 'observe'; microphone: boolean; speaker: boolean; replacesId?: string; onMediaFailure?: 'end' | 'keep-open'; }
export interface RemoteAudioConnection { send(bytes: Uint8Array, timestampMs?: number): Promise<void>; activate(callId: string): void; close(): void; }
const INPUT_BUFFER_BYTES = 16_000 * 2 * 0.2;
export class RemoteMediaReservation {
  readonly id = crypto.randomUUID();
  readonly expiresAt = Date.now() + 30_000;
  readonly media: CallMediaOptions;
  readonly input: ReadableStream<Uint8Array>;
  readonly output: WritableStream<Uint8Array>;
  consumed = false;
  claimed = false;
  connection?: RemoteAudioConnection;
  outputTimestampMs?: number;
  private controller?: ReadableStreamDefaultController<Uint8Array>;
  private timer?: ReturnType<typeof setTimeout>;
  private closed = false;
  private inputClosed = false;
  private frames: Uint8Array[] = [];
  private bufferedBytes = 0;
  private pendingRead?: () => void;
  private droppedBytes = 0;
  private lastDropNoticeAt = 0;
  private constructor(readonly request: RemoteMediaRequest, readonly generation: string, readonly scope: SessionScope,
    private readonly onDrop?: (stats: { discardedMs: number; bufferedMs: number }) => void) {
    const deliver = () => {
      const frame = this.frames.shift();
      if (frame) { this.bufferedBytes -= frame.length; this.controller?.enqueue(frame); }
    };
    this.input = new ReadableStream({
      start: controller => { this.controller = controller; },
      pull: () => {
        if (this.frames.length) { deliver(); return; }
        return new Promise<void>(resolve => { this.pendingRead = () => { this.pendingRead = undefined; deliver(); resolve(); }; });
      },
      cancel: () => { this.inputClosed = true; this.frames = []; this.bufferedBytes = 0; this.pendingRead?.(); },
    }, { highWaterMark: 0 });
    this.output = new WritableStream({ write: async bytes => {
      if (!this.connection) throw new Error('The call media client disconnected.');
      await this.connection.send(bytes, this.outputTimestampMs);
    } });
    this.media = { microphone: request.microphone ? { kind: 'remote', remoteId: this.id } : null, speaker: request.speaker ? { kind: 'remote', remoteId: this.id } : null, camera: null, ...(request.onMediaFailure ? { onMediaFailure: request.onMediaFailure } : {}) };
  }
  static async make(request: RemoteMediaRequest, generation: string, onDrop?: (stats: { discardedMs: number; bufferedMs: number }) => void): Promise<RemoteMediaReservation> {
    const scope = await SessionScope.make();
    const reservation = new RemoteMediaReservation(request, generation, scope, onDrop);
    reservation.timer = setTimeout(() => { if (!reservation.claimed) void scope.close('interruption'); }, 30_000);
    reservation.timer.unref?.();
    await scope.addFinalizer('remote-client', () => {
      reservation.closed = true; clearTimeout(reservation.timer);
      reservation.frames = []; reservation.bufferedBytes = 0;
      try { reservation.controller?.close(); } catch {}
      reservation.pendingRead?.();
      reservation.connection?.close(); reservation.connection = undefined;
    });
    return reservation;
  }
  attach(connection: RemoteAudioConnection): void {
    if (this.closed || this.consumed || this.expiresAt <= Date.now()) throw new Error('Call media admission expired or was already consumed.');
    this.consumed = true; this.connection = connection;
  }
  push(bytes: Uint8Array): void {
    if (this.closed || bytes.length > 3840 || bytes.length % 2) throw new Error('Invalid call audio frame.');
    if (this.inputClosed || !bytes.length) return;
    // Keep the newest live audio within 200 ms. A delayed consumer creates a
    // short gap, rather than an ever-growing delay or a forced hang-up.
    while (this.bufferedBytes + bytes.length > INPUT_BUFFER_BYTES && this.frames.length) {
      const stale = this.frames.shift()!;
      this.bufferedBytes -= stale.length; this.droppedBytes += stale.length;
    }
    this.frames.push(bytes); this.bufferedBytes += bytes.length;
    this.pendingRead?.();
    if (this.droppedBytes && Date.now() - this.lastDropNoticeAt >= 5000) {
      this.lastDropNoticeAt = Date.now();
      this.onDrop?.({ discardedMs: this.droppedBytes / 32, bufferedMs: this.bufferedBytes / 32 });
      this.droppedBytes = 0;
    }
  }
}
