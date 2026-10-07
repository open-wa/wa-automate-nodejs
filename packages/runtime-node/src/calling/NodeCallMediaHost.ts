import { spawn } from 'node:child_process';
import { access, open, mkdir } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { Effect, Stream, FileSystem } from 'effect';
import { NodeServices } from '@effect/platform-node';
import type { CallMediaHost, PreparedCallMedia, AudioFrame } from '@open-wa/core';
import type { SessionScope } from '@open-wa/runtime-core';
import { DEFAULT_MIC, DEFAULT_CAM, DEFAULT_SPEAKER, encodeAudioPacket, decodeAudioPacket } from '@open-wa/schema';
import type { CallMediaOptions, MediaDescriptor, RawAudioFormat } from '@open-wa/schema';
import { AudioResampler, decodePcm, encodePcm, HOST_AUDIO_RATE, RAW_AUDIO_DEFAULT, wavHeader } from './audio';

export class CallMediaError extends Error {
  readonly code = 'MEDIA_SOURCE_FAILED'; readonly status = 422;
}

type Source = { stream: Stream.Stream<Uint8Array, unknown>; format: RawAudioFormat; finite?: boolean; clear?: () => void };
type Output = ((bytes: Uint8Array) => Promise<void>) & { clear?: () => void };
const isReadable = (value: unknown): value is ReadableStream<Uint8Array> => !!value && typeof (value as ReadableStream<Uint8Array>).getReader === 'function';
const isWritable = (value: unknown): value is WritableStream<Uint8Array> => !!value && typeof (value as WritableStream<Uint8Array>).getWriter === 'function';
const descriptor = (value: string | MediaDescriptor): MediaDescriptor => typeof value === 'string' ? (/^https?:\/\//i.test(value) || /^wss?:\/\//i.test(value) ? { kind: 'url', url: value } : { kind: 'file', path: value }) : value;
const streamFrom = (value: AsyncIterable<Uint8Array>) => Stream.fromAsyncIterable(value, error => error);

export function makeNodeCallMediaHost(options: { log?: (message: string) => void; onFailure?: (error: Error) => void } = {}): CallMediaHost {
  return {
    async prepare(media, scope, onFailure, inputFormat) {
      let muted = false;
      let clearSequence = 0;
      let sourceCleared = false;
      let sequence = 0;
      const microphone = media.microphone;
      const speaker = media.speaker;
      const camera = media.camera;
      const deviceMic = microphone === DEFAULT_MIC || (microphone && typeof microphone === 'object' && 'kind' in microphone && microphone.kind === 'device');
      const deviceSpeaker = speaker === DEFAULT_SPEAKER || (speaker && typeof speaker === 'object' && 'kind' in speaker && speaker.kind === 'device');
      const deviceCamera = camera === DEFAULT_CAM || (camera && typeof camera === 'object' && camera.kind === 'device');
      if (camera && !deviceCamera) throw new CallMediaError('This host does not yet support the selected camera source. Use a device or a remote browser camera.');
      let source: Source | undefined;
      if (microphone && !deviceMic) {
        source = isReadable(microphone) || microphone instanceof Blob
          ? await prepareReadable(microphone instanceof Blob ? microphone.stream() : microphone, scope, inputFormat)
          : await prepareSource(descriptor(microphone as string | MediaDescriptor), scope);
        if (microphone instanceof Blob) source.finite = true;
      }
      const output = speaker && !deviceSpeaker ? await prepareOutput(speaker, scope, options.log).catch(error => { throw error instanceof CallMediaError ? error : new CallMediaError(`Cannot open the received audio output: ${error instanceof Error ? error.message : String(error)}`); }) : undefined;
      const receiveResampler = new AudioResampler(16_000);
      const result: PreparedCallMedia = {
        microphone: microphone === null ? 'disabled' : deviceMic ? 'device' : 'injected',
        speaker: speaker === null ? 'disabled' : deviceSpeaker ? 'device' : 'captured',
        camera: !camera ? 'disabled' : 'device',
        deviceIds: {
          microphone: typeof microphone === 'object' && microphone && 'deviceId' in microphone ? microphone.deviceId : undefined,
          speaker: typeof speaker === 'object' && speaker && 'deviceId' in speaker ? speaker.deviceId : undefined,
          camera: typeof camera === 'object' && camera ? camera.deviceId : undefined,
        },
        async start(write) {
          if (!source) return;
          const resampler = new AudioResampler(HOST_AUDIO_RATE);
          const width = (source.format.encoding === 'float32le' ? 4 : 2) * source.format.channels;
          let remainder = new Uint8Array(0);
          let audio = new Float32Array(0);
          let deadline = Date.now();
          const pump = Stream.runForEach(source.stream, chunk => Effect.gen(function* () {
            if (sourceCleared) yield* Effect.interrupt;
            const combined = new Uint8Array(remainder.length + chunk.length); combined.set(remainder); combined.set(chunk, remainder.length);
            const length = combined.length - combined.length % width;
            remainder = combined.slice(length);
            const decoded = resampler.process(decodePcm(combined.subarray(0, length), source!.format), source!.format.sampleRate);
            const samples = new Float32Array(audio.length + decoded.length); samples.set(audio); samples.set(decoded, audio.length);
            let offset = 0;
            while (samples.length - offset >= 960) {
              if (sourceCleared) yield* Effect.interrupt;
              const epoch = clearSequence;
              yield* Effect.sleep(Math.max(0, deadline - Date.now()));
              deadline = Math.max(deadline + 20, Date.now() - 100);
              const frame = samples.slice(offset, offset + 960); offset += 960;
              if (epoch !== clearSequence) { audio = new Float32Array(0); offset = samples.length; frame.fill(0); }
              if (muted) frame.fill(0);
              yield* Effect.tryPromise({ try: () => write({ samples: Array.from(frame), sampleRate: HOST_AUDIO_RATE, sequence: sequence++ }), catch: error => error });
            }
            audio = samples.slice(offset);
          })).pipe(Effect.andThen(Effect.gen(function* () {
            if (remainder.length) yield* Effect.fail(new CallMediaError('Raw audio ended with an incomplete sample.'));
            if (audio.length && !sourceCleared) {
              yield* Effect.sleep(Math.max(0, deadline - Date.now()));
              const tail = new Float32Array(960); if (!muted) tail.set(audio);
              yield* Effect.tryPromise({ try: () => write({ samples: Array.from(tail), sampleRate: HOST_AUDIO_RATE, sequence: sequence++ }), catch: error => error });
            }
          })), Effect.catch(error => Effect.sync(() => (onFailure ?? options.onFailure)?.(error instanceof Error ? error : new Error(String(error))))));
          await scope.fork(pump);
        },
        async receive(frame) { if (output) await output(encodePcm(receiveResampler.process(Float32Array.from(frame.samples), frame.sampleRate))); },
        async clear() { clearSequence++; if (source?.finite) sourceCleared = true; source?.clear?.(); },
        async mute(value) { muted = value; },
      };
      return result;
    },
  };
}

function isEncodedAudio(prefix: Uint8Array): boolean {
  const signature = new TextDecoder().decode(prefix);
  return /^(RIFF|RF64|OggS|ID3|fLaC|FORM)/.test(signature) || signature.slice(4, 8) === 'ftyp' || (prefix[0] === 255 && (prefix[1] & 224) === 224);
}
async function prepareReadable(input: ReadableStream<Uint8Array>, scope: SessionScope, format?: RawAudioFormat): Promise<Source> {
  const reader = input.getReader();
  const readyBy = Date.now() + 15_000;
  await scope.addFinalizer('microphone-stream', async () => { try { await within(reader.cancel(), 3000, 'The microphone stream did not close.'); } finally { reader.releaseLock(); } });
  if (format) {
    async function* chunks() { while (true) { const next = await reader.read(); if (next.done) break; yield next.value; } }
    return { stream: streamFrom(chunks()), format };
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const first = await Promise.race([reader.read(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new CallMediaError('Microphone stream did not become ready within 15 seconds.')), 15_000); })]).finally(() => clearTimeout(timer));
  if (first.done) throw new CallMediaError('The microphone stream is empty.');
  // Stream chunks can split a container header. Buffer only the first 16 bytes
  // before deciding whether this is encoded audio or the raw PCM default.
  const prefix = new Uint8Array(16);
  const leading: Uint8Array[] = [first.value];
  let prefixLength = Math.min(16, first.value.length);
  prefix.set(first.value.subarray(0, prefixLength));
  while (prefixLength < 16) {
    if (Date.now() >= readyBy) throw new CallMediaError('Microphone stream did not provide an audio header within 15 seconds.');
    const next = await within(reader.read(), readyBy - Date.now(), 'Microphone stream did not provide an audio header within 15 seconds.');
    if (next.done) break;
    if (next.value.length) leading.push(next.value);
    const length = Math.min(16 - prefixLength, next.value.length);
    prefix.set(next.value.subarray(0, length), prefixLength); prefixLength += length;
  }
  async function* bufferedChunks() { yield* leading; while (true) { const next = await reader.read(); if (next.done) break; yield next.value; } }
  const stream = streamFrom(bufferedChunks());
  return isEncodedAudio(prefix.subarray(0, prefixLength)) ? decodeSource('pipe:0', scope, { kind: 'url' }, undefined, stream) : { stream, format: RAW_AUDIO_DEFAULT };
}

async function prepareSource(input: MediaDescriptor, scope: SessionScope): Promise<Source> {
  if (input.kind === 'remote') throw new CallMediaError('Remote media must be admitted through its authenticated media helper.');
  if (input.url && /^wss?:\/\//i.test(input.url)) return prepareSocketSource(input, scope);
  const raw = input.raw ?? RAW_AUDIO_DEFAULT;
  if (!Number.isFinite(raw.sampleRate) || raw.sampleRate < 8_000 || raw.sampleRate > 192_000) throw new CallMediaError('Raw audio needs a sample rate between 8000 and 192000 Hz.');
  if (input.kind === 'file') {
    if (!input.path) throw new CallMediaError('The microphone file path is missing.');
    const path = resolve(input.path);
    await access(path).catch(() => { throw new CallMediaError(`Cannot read microphone file: ${path}`); });
    const file = await open(path, 'r');
    const prefix = new Uint8Array(16);
    try { await file.read(prefix, 0, prefix.length, 0); } finally { await file.close(); }
    const encoded = isEncodedAudio(prefix);
    if (!encoded && !input.loop) {
      const stream = Stream.unwrap(Effect.gen(function* () { const fs = yield* FileSystem.FileSystem; return fs.stream(path, { chunkSize: 3840 }); })).pipe(Stream.provide(NodeServices.layer));
      return { stream, format: raw, finite: true };
    }
    return decodeSource(path, scope, input, encoded ? undefined : raw);
  }
  if (!input.url || !/^https?:\/\//i.test(input.url)) throw new CallMediaError('Microphone sources accept files, HTTP/HLS URLs, compatible WebSockets or streams.');
  return decodeSource(input.url, scope, input);
}

async function decodeSource(source: string, scope: SessionScope, input: MediaDescriptor, raw?: RawAudioFormat, inputStream?: Stream.Stream<Uint8Array, unknown>): Promise<Source> {
  const { default: binary } = await import('ffmpeg-static');
  if (!binary) throw new CallMediaError('The calling media decoder is unavailable on this platform.');
  const args = ['-hide_banner', '-loglevel', 'error', '-nostdin'];
  if (input.loop) args.push('-stream_loop', '-1');
  if (input.headers) args.push('-headers', Object.entries(input.headers).map(([key, value]) => `${key}: ${value}\r\n`).join(''));
  if (raw) args.push('-f', raw.encoding === 'float32le' ? 'f32le' : 's16le', '-ar', String(raw.sampleRate), '-ac', String(raw.channels));
  args.push('-i', source, '-vn', '-f', 'f32le', '-ar', String(HOST_AUDIO_RATE), '-ac', '1', 'pipe:1');
  const child = spawn(binary, args, { stdio: [inputStream ? 'pipe' : 'ignore', 'pipe', 'pipe'] });
  let errors = '';
  child.stderr.on('data', chunk => { errors = (errors + String(chunk)).slice(-2000); });
  const failed = new Promise<never>((_, reject) => { child.once('error', error => reject(new CallMediaError(`Cannot start the calling decoder: ${error.message}`))); child.once('exit', code => { if (code !== 0 && code !== null) reject(new CallMediaError(`Cannot decode microphone source: ${errors}`)); }); });
  void failed.catch(() => undefined);
  await scope.addFinalizer('decoder', async () => { child.stdout.destroy(); if (child.exitCode === null) child.kill('SIGKILL'); });
  if (inputStream) {
    const inputPump = Stream.runForEach(inputStream, bytes => Effect.tryPromise({ try: () => new Promise<void>((resolve, reject) => {
      child.stdin!.write(bytes, error => error ? reject(error) : resolve());
    }), catch: error => error })).pipe(Effect.onExit(() => Effect.sync(() => child.stdin?.end())));
    await scope.fork(inputPump);
  }
  const iterator = child.stdout[Symbol.asyncIterator]();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ready = await Promise.race([iterator.next(), failed, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new CallMediaError('Microphone source did not become ready within 15 seconds.')), 15_000); })]).finally(() => clearTimeout(timer));
  if (ready.done) throw new CallMediaError('The selected microphone source contains no decodable audio.');
  async function* chunks() { yield new Uint8Array(ready.value); while (true) { const next = await Promise.race([iterator.next(), failed]); if (next.done) break; yield new Uint8Array(next.value); } }
  return { stream: streamFrom(chunks()), format: { encoding: 'float32le', sampleRate: HOST_AUDIO_RATE, channels: 1 }, finite: !input.loop && input.kind === 'file' };
}

async function prepareOutput(value: NonNullable<CallMediaOptions['speaker']>, scope: SessionScope, log?: (message: string) => void): Promise<Output> {
  if (isWritable(value)) {
    const writer = value.getWriter();
    await scope.addFinalizer('speaker-stream', async () => { try { await within(writer.close(), 3000, 'The received audio stream did not close.'); } finally { writer.releaseLock(); } });
    return bytes => writer.write(bytes);
  }
  const output = descriptor(value);
  if (output.url && /^wss?:\/\//i.test(output.url)) return prepareSocketOutput(output, scope);
  if (output.kind !== 'file' || !output.path) throw new CallMediaError('The speaker output accepts a recording path, compatible WebSocket or WritableStream.');
  let path = resolve(output.path);
  if (!['.wav', '.pcm'].includes(extname(path).toLowerCase())) throw new CallMediaError('Received audio recordings use .wav or .pcm.');
  await mkdir(dirname(path), { recursive: true });
  let file;
  try { file = await open(path, output.overwrite ? 'w+' : 'wx+'); }
  catch (error) {
    if ((error as { code?: string }).code !== 'EEXIST') throw error;
    const suffix = extname(path); path = path.slice(0, path.length - suffix.length) + '-' + crypto.randomUUID().slice(0, 8) + suffix;
    file = await open(path, 'wx+');
  }
  const wav = extname(path).toLowerCase() === '.wav';
  if (!wav && extname(path).toLowerCase() !== '.pcm') { await file.close(); throw new CallMediaError('Received audio recordings use .wav or .pcm.'); }
  if (wav) await file.write(wavHeader(0), 0, 44, 0);
  let length = 0;
  let queue = Promise.resolve();
  log?.(`Recording received call audio to ${path}`);
  await scope.addFinalizer('recording', async () => { try { await queue; if (wav) await file.write(wavHeader(length), 0, 44, 0); await file.sync(); } finally { await file.close(); } });
  return async bytes => {
    queue = queue.then(async () => { let offset = 0; while (offset < bytes.length) { const result = await file.write(bytes, offset, bytes.length - offset, (wav ? 44 : 0) + length + offset); if (!result.bytesWritten) throw new CallMediaError('The received audio file stopped accepting data.'); offset += result.bytesWritten; } length += bytes.length; });
    await queue;
  };
}

function validFormat(value: unknown): value is RawAudioFormat {
  const format = value as RawAudioFormat;
  return !!format && ['pcm16le', 'float32le'].includes(format.encoding) && [1, 2].includes(format.channels)
    && Number.isFinite(format.sampleRate) && format.sampleRate >= 8000 && format.sampleRate <= 192000;
}

async function within<A>(operation: Promise<A>, timeoutMs: number, message: string): Promise<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([operation, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new CallMediaError(message)), timeoutMs); })]); }
  finally { clearTimeout(timer); }
}

async function socket(input: MediaDescriptor, role: 'microphone' | 'speaker', scope: SessionScope, onMessage: (data: Uint8Array | string) => void) {
  const { default: WebSocket } = await import('ws');
  const ws = new WebSocket(input.url!, { headers: input.headers, maxPayload: 128_000 });
  await scope.addFinalizer('media-socket', () => { ws.close(1000, 'Call ended'); ws.terminate(); });
  let resolveReady: (format: RawAudioFormat) => void, rejectReady: (error: Error) => void;
  const ready = new Promise<RawAudioFormat>((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  const timer = setTimeout(() => rejectReady(new CallMediaError('Media WebSocket did not announce its format within 10 seconds.')), 10_000);
  ws.on('message', (data, binary) => {
    if (binary) { onMessage(new Uint8Array(data as Buffer)); return; }
    try {
      const message = JSON.parse(String(data));
      if (message.type === 'start' || message.type === 'ready') {
        if (message.version !== 1 || !validFormat(message.format)) throw new Error();
        resolveReady(message.format);
      } else onMessage(String(data));
    } catch { rejectReady(new CallMediaError('Expected a format-announcing OpenWA audio WebSocket. Use a provider adapter for proprietary protocols.')); }
  });
  ws.on('error', error => rejectReady(new CallMediaError(error.message)));
  ws.on('close', () => rejectReady(new CallMediaError('Media WebSocket closed before it was ready.')));
  ws.on('open', () => ws.send(JSON.stringify({ type: 'start', version: 1, role, format: input.raw ?? RAW_AUDIO_DEFAULT })));
  const format = await ready.finally(() => clearTimeout(timer));
  return { ws, format };
}

async function prepareSocketSource(input: MediaDescriptor, scope: SessionScope): Promise<Source> {
  const queue: Array<Uint8Array | { mark: string }> = [];
  let format = input.raw ?? RAW_AUDIO_DEFAULT;
  let wake: (() => void) | undefined;
  let failure: Error | undefined;
  let closed = false, buffered = 0, expected: number | undefined;
  const { ws, format: negotiated } = await socket(input, 'microphone', scope, data => {
    try {
      if (typeof data !== 'string') {
        const packet = decodeAudioPacket(data);
        const width = (format.encoding === 'pcm16le' ? 2 : 4) * format.channels;
        if (packet.audio.length % width || packet.audio.length > format.sampleRate * width * 0.12) throw new CallMediaError('Invalid audio packet duration.');
        if (expected !== undefined && packet.sequence !== expected) { queue.length = 0; buffered = 0; }
        expected = packet.sequence + 1;
        if (buffered + packet.audio.length > format.sampleRate * width * 0.5) throw new CallMediaError('Media WebSocket exceeded its 500 ms audio buffer.');
        buffered += packet.audio.length; queue.push(packet.audio);
      } else {
        const message = JSON.parse(data);
        if (message.type === 'clear' || message.type === 'discontinuity') { queue.length = 0; buffered = 0; expected = undefined; }
        if (message.type === 'mark' && typeof message.name === 'string' && queue.length < 128) queue.push({ mark: message.name.slice(0, 128) });
        if (message.type === 'end') closed = true;
        if (message.type === 'error') throw new CallMediaError(String(message.message));
      }
    } catch (error) { failure = error instanceof Error ? error : new CallMediaError(String(error)); }
    wake?.(); wake = undefined;
  });
  format = negotiated;
  ws.on('close', () => { closed = true; wake?.(); }); ws.on('error', error => { failure = error; wake?.(); });
  async function* chunks() {
    while (!closed || queue.length) {
      if (failure) throw failure;
      if (queue.length) { const next = queue.shift()!; if (next instanceof Uint8Array) { buffered -= next.length; yield next; } else ws.send(JSON.stringify({ type: 'mark', name: next.mark, boundary: 'openwa-consumed' })); }
      else await new Promise<void>(resolve => { wake = resolve; });
    }
  }
  return { stream: streamFrom(chunks()), format, clear() { queue.length = 0; buffered = 0; ws.send(JSON.stringify({ type: 'clear' })); } };
}

async function prepareSocketOutput(output: MediaDescriptor, scope: SessionScope): Promise<Output> {
  const { ws, format } = await socket(output, 'speaker', scope, () => {});
  const resampler = new AudioResampler(format.sampleRate);
  let sequence = 0, timestamp = 0;
  const write: Output = async bytes => {
    if (ws.readyState !== ws.OPEN) throw new CallMediaError('Speaker WebSocket disconnected.');
    const width = (format.encoding === 'pcm16le' ? 2 : 4) * format.channels;
    if (ws.bufferedAmount > format.sampleRate * width * 0.5) throw new CallMediaError('Speaker WebSocket is more than 500 ms behind.');
    const mono = resampler.process(decodePcm(bytes, RAW_AUDIO_DEFAULT), 16_000);
    const interleaved = format.channels === 2 ? Float32Array.from(Array.from(mono).flatMap(sample => [sample, sample])) : mono;
    const converted = encodePcm(interleaved, format.encoding);
    const packet = encodeAudioPacket(converted, sequence++, timestamp); timestamp += mono.length * 1000 / format.sampleRate;
    await new Promise<void>((resolve, reject) => ws.send(packet, error => error ? reject(error) : resolve()));
  };
  write.clear = () => ws.send(JSON.stringify({ type: 'clear' }));
  return write;
}
