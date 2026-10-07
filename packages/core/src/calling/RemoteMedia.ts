import { SessionScope } from '@open-wa/runtime-core';
import type { CallIdentity, CallMediaOptions } from '@open-wa/schema';

export interface RemoteMediaRequest { call?: CallIdentity; to?: string; mode: 'accept' | 'start' | 'replace' | 'observe'; microphone: boolean; speaker: boolean; replacesId?: string; }
export interface RemoteAudioConnection { send(bytes: Uint8Array): Promise<void>; activate(callId: string): void; close(): void; }
export class RemoteMediaReservation {
  readonly id = crypto.randomUUID();
  readonly expiresAt = Date.now() + 30_000;
  readonly media: CallMediaOptions;
  readonly input: ReadableStream<Uint8Array>;
  readonly output: WritableStream<Uint8Array>;
  consumed = false;
  claimed = false;
  connection?: RemoteAudioConnection;
  private controller?: ReadableStreamDefaultController<Uint8Array>;
  private timer?: ReturnType<typeof setTimeout>;
  private closed = false;
  private constructor(readonly request: RemoteMediaRequest, readonly generation: string, readonly scope: SessionScope) {
    this.input = new ReadableStream({ start: controller => { this.controller = controller; } }, { highWaterMark: 10 });
    this.output = new WritableStream({ write: async bytes => {
      if (!this.connection) throw new Error('The call media client disconnected.');
      await this.connection.send(bytes);
    } });
    this.media = { microphone: request.microphone ? { kind: 'remote', remoteId: this.id } : null, speaker: request.speaker ? { kind: 'remote', remoteId: this.id } : null, camera: null };
  }
  static async make(request: RemoteMediaRequest, generation: string): Promise<RemoteMediaReservation> {
    const scope = await SessionScope.make();
    const reservation = new RemoteMediaReservation(request, generation, scope);
    reservation.timer = setTimeout(() => { if (!reservation.claimed) void scope.close('interruption'); }, 30_000);
    reservation.timer.unref?.();
    await scope.addFinalizer('remote-client', () => {
      reservation.closed = true; clearTimeout(reservation.timer);
      try { reservation.controller?.close(); } catch {}
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
    if ((this.controller?.desiredSize ?? 0) <= 0) throw new Error('Call audio exceeded its 200 ms input buffer.');
    this.controller?.enqueue(bytes);
  }
}
