import { expect, test } from 'bun:test';
import { CallPlayback } from '../src/audio';
import { makeNodeCallMediaHost } from '../../../packages/runtime-node/src/calling/NodeCallMediaHost';
import { SessionScope } from '../../../packages/runtime-core/src/session-scope';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function tone(seconds = 1) {
  const pcm = Buffer.alloc(48000 * seconds);
  for (let n = 0; n < pcm.length / 2; n++) pcm.writeInt16LE(Math.round(8000 * Math.sin(n / 8)), n * 2);
  return pcm;
}
async function throughHost(produce: (playback: CallPlayback, signal: AbortSignal) => Promise<void>, rpcMs: number | ((index: number) => number)) {
  const playback = new CallPlayback(), scope = await SessionScope.make();
  const packets: Array<{ atMs: number; durationMs: number; silent: boolean }> = [];
  const failures: Error[] = [];
  const media = await makeNodeCallMediaHost().prepare({ microphone: playback.stream, speaker: null, camera: null }, scope, error => { failures.push(error); });
  await media.start(async frame => {
    packets.push({ atMs: performance.now(), durationMs: frame.samples.length / 48, silent: !frame.samples.some(Boolean) });
    await Bun.sleep(typeof rpcMs === 'function' ? rpcMs(packets.length - 1) : rpcMs);
  });
  try {
    await produce(playback, AbortSignal.timeout(10000));
    await playback.drain(AbortSignal.timeout(10000));
    // drain() releases the final packet to the host; allow its paced send.
    await Bun.sleep(200);
  } finally { playback.close(); await scope.close(); }
  expect(failures).toEqual([]);
  const first = packets.findIndex(packet => !packet.silent), last = packets.findLastIndex(packet => !packet.silent);
  expect(first).toBeGreaterThanOrEqual(0);
  const speech = packets.slice(first, last + 1);
  let untilMs = speech[0].atMs, missingMs = 0;
  for (const packet of speech) {
    missingMs += Math.max(0, packet.atMs - untilMs);
    untilMs = Math.max(untilMs, packet.atMs) + packet.durationMs;
  }
  return { speech, missingMs };
}

test('bursty TTS stays continuous through the actual call media host', async () => {
  const { speech, missingMs } = await throughHost(async (playback, signal) => {
    const pcm = tone(), started = performance.now();
    for (const [index, arrival] of [0, 300, 400, 700, 800].entries()) {
      await Bun.sleep(Math.max(0, arrival - (performance.now() - started)));
      await playback.write24k(pcm.subarray(index * 9600, (index + 1) * 9600), signal);
    }
  }, 5);
  expect(speech.every(packet => !packet.silent)).toBe(true);
  expect(missingMs).toBeLessThan(25);
  expect(speech.reduce((sum, packet) => sum + packet.durationMs, 0)).toBe(1040);
}, 10000);

test('browser RPCs longer than 20 ms do not stretch speech or drop its tail', async () => {
  const { speech, missingMs } = await throughHost((playback, signal) => playback.write24k(tone(3), signal), 30);
  expect(speech.every(packet => packet.durationMs === 80)).toBe(true);
  expect(missingMs).toBeLessThan(25);
  expect(speech.reduce((sum, packet) => sum + packet.durationMs, 0)).toBe(3040);
}, 10000);


test('a brief RPC stall is absorbed without robotic silence gaps or native queue overflow', async () => {
  const { speech, missingMs } = await throughHost((playback, signal) => playback.write24k(tone(3), signal), index => index === 6 ? 130 : 5);
  expect(missingMs).toBeLessThan(25);
  expect(speech.reduce((sum, packet) => sum + packet.durationMs, 0)).toBe(3040);
  let sentMs = 0;
  for (const packet of speech) {
    sentMs += packet.durationMs;
    expect(sentMs - (packet.atMs - speech[0].atMs)).toBeLessThanOrEqual(400);
  }
}, 10000);

test('file microphone audio stays continuous when browser RPCs exceed 20 ms', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'openwa-file-audio-'));
  const pcm = tone(2), header = Buffer.alloc(44);
  header.write('RIFF'); header.writeUInt32LE(pcm.length + 36, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(24000, 24); header.writeUInt32LE(48000, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  const file = join(directory, 'prompt.wav'); await writeFile(file, Buffer.concat([header, pcm]));
  const scope = await SessionScope.make(), packets: Array<{ at: number; duration: number }> = [], failures: Error[] = [];
  try {
    const media = await makeNodeCallMediaHost().prepare({ microphone: file, speaker: null, camera: null }, scope, error => failures.push(error));
    await media.start(async frame => { packets.push({ at: performance.now(), duration: frame.samples.length / 48 }); await Bun.sleep(30); });
    const deadline = Date.now() + 7000;
    while (packets.reduce((sum, p) => sum + p.duration, 0) < 1999 && Date.now() < deadline) await Bun.sleep(10);
    expect(failures).toEqual([]);
    expect(packets.reduce((sum, p) => sum + p.duration, 0)).toBe(2000);
    let until = packets[0].at, missing = 0;
    for (const p of packets) { missing += Math.max(0, p.at - until); until = Math.max(until, p.at) + p.duration; }
    expect(missing).toBeLessThan(25);
  } finally { await scope.close(); await rm(directory, { recursive: true, force: true }); }
}, 10000);

test('closing idle live media cancels its pending reader before joining the pump', async () => {
  const playback = new CallPlayback(), scope = await SessionScope.make();
  const media = await makeNodeCallMediaHost().prepare({ microphone: playback.stream, speaker: null, camera: null }, scope);
  await media.start(async () => {});
  await Bun.sleep(50);
  const closing = scope.close();
  try {
    expect(await Promise.race([closing.then(() => 'closed'), Bun.sleep(300).then(() => 'stuck')])).toBe('closed');
  } finally { playback.close(); await closing; }
});
