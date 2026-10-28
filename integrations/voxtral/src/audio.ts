import { spawn } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

/** The encoder is shipped with the package; no system ffmpeg is required. */
export async function encodeVoiceNote(pcm: Uint8Array, signal: AbortSignal): Promise<Buffer> {
  if (!ffmpeg) throw new Error('The bundled audio encoder is unavailable on this host.');
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', 'pipe:0', '-c:a', 'libopus', '-ar', '48000', '-b:a', '32k', '-f', 'ogg', 'pipe:1'], { stdio: ['pipe', 'pipe', 'pipe'] });
    const chunks: Buffer[] = []; let size = 0; let error = '';
    const abort = () => child.kill('SIGTERM');
    signal.addEventListener('abort', abort, { once: true });
    child.stdout.on('data', chunk => { size += chunk.length; if (size > 25 * 1024 * 1024) child.kill('SIGTERM'); else chunks.push(chunk); });
    child.stderr.on('data', chunk => { error = (error + String(chunk)).slice(-1000); });
    child.stdin.on('error', () => {});
    child.on('error', reject);
    child.on('close', code => {
      signal.removeEventListener('abort', abort);
      if (signal.aborted) reject(signal.reason);
      else if (code !== 0) reject(new Error(`Voice-note encoding failed: ${error || code}`));
      else resolve(Buffer.concat(chunks));
    });
    child.stdin.end(pcm);
  });
}

const CALL_FRAME_BYTES = 2560; // 80 ms of signed 16-bit mono PCM at 16 kHz.

/** Bounded 16 kHz speech buffer. The call media host owns the playback clock. */
export class CallPlayback {
  readonly stream: ReadableStream<Uint8Array>;
  private controller?: ReadableStreamDefaultController<Uint8Array>;
  private frames: Uint8Array[] = [];
  private waiters = new Set<() => void>();
  private playing = false;
  private draining = false;
  private closed = false;
  private remainder = new Uint8Array(0);
  private phase = 0;
  private previous = 0;
  private pendingOutput = new Uint8Array(0);
  private epoch = 0;

  constructor() {
    this.stream = new ReadableStream({
      start: controller => {
        this.controller = controller;
        // Let the host identify raw PCM before any speech has been requested.
        controller.enqueue(new Uint8Array(CALL_FRAME_BYTES));
      },
      pull: async controller => {
        // Hold 240 ms before starting or resuming an utterance. Short speech
        // starts when drain() marks its final chunk; idle calls need no RPCs.
        while (!this.closed && !(this.frames.length && (this.playing || this.draining || this.frames.length >= 3))) await this.wait();
        if (this.closed) return;
        this.playing = true;
        controller.enqueue(this.frames.shift()!);
        if (!this.frames.length) this.playing = false;
        this.wake();
      },
      cancel: () => this.close(),
    }, { highWaterMark: 0 });
  }
  private wake() {
    for (const wake of this.waiters) wake();
    this.waiters.clear();
  }
  private wait(signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted();
    return new Promise(resolve => {
      const wake = () => { signal?.removeEventListener('abort', wake); this.waiters.delete(wake); resolve(); };
      this.waiters.add(wake); signal?.addEventListener('abort', wake, { once: true });
    });
  }
  clear() {
    this.epoch++; this.frames = []; this.playing = false; this.draining = false;
    this.remainder = new Uint8Array(0); this.pendingOutput = new Uint8Array(0); this.phase = 0; this.previous = 0;
    this.wake();
  }
  async write24k(bytes: Uint8Array, signal: AbortSignal) {
    const epoch = this.epoch;
    const combined = Buffer.concat([this.remainder, bytes]);
    this.remainder = combined.subarray(combined.length - combined.length % 2);
    const count = Math.floor(combined.length / 2);
    const samples: number[] = [];
    while (this.phase < count - 1) {
      const index = Math.floor(this.phase);
      const a = index < 0 ? this.previous : combined.readInt16LE(index * 2);
      const b = combined.readInt16LE((index + 1) * 2);
      samples.push(Math.round(a + (b - a) * (this.phase - index)));
      this.phase += 1.5;
    }
    this.phase -= count;
    if (count) this.previous = combined.readInt16LE((count - 1) * 2);
    const converted = Buffer.alloc(samples.length * 2);
    samples.forEach((sample, index) => converted.writeInt16LE(sample, index * 2));
    const output = Buffer.concat([this.pendingOutput, converted]);
    const length = output.length - output.length % CALL_FRAME_BYTES;
    this.pendingOutput = output.subarray(length);
    for (let at = 0; at < length; at += CALL_FRAME_BYTES) {
      // Keep at most two seconds queued, with backpressure on the TTS stream.
      while (this.frames.length >= 25 && !this.closed && epoch === this.epoch) {
        signal.throwIfAborted();
        await this.wait(signal);
      }
      signal.throwIfAborted();
      if (this.closed || epoch !== this.epoch) throw new Error('Call playback was interrupted.');
      const frame = new Uint8Array(CALL_FRAME_BYTES); frame.set(output.subarray(at, at + CALL_FRAME_BYTES)); this.frames.push(frame); this.wake();
    }
  }
  async drain(signal: AbortSignal) {
    const epoch = this.epoch;
    signal.throwIfAborted();
    if (this.pendingOutput.length) {
      const frame = new Uint8Array(CALL_FRAME_BYTES); frame.set(this.pendingOutput); this.frames.push(frame);
      this.pendingOutput = new Uint8Array(0);
    }
    this.draining = true; this.wake();
    while (this.frames.length && !this.closed && epoch === this.epoch) {
      signal.throwIfAborted();
      await this.wait(signal);
    }
    signal.throwIfAborted();
    if (this.closed || epoch !== this.epoch) throw new Error('Call playback was interrupted.');
    this.draining = false; this.playing = false;
    this.remainder = new Uint8Array(0); this.phase = 0; this.previous = 0;
  }
  close() {
    if (this.closed) return;
    this.closed = true; this.clear();
    try { this.controller?.close(); } catch { /* The host may already have cancelled the reader. */ }
  }
}
