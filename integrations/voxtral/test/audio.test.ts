import { expect, test } from 'bun:test';
import { encodeVoiceNote, CallPlayback } from '../src/audio';

function tone() {
  const pcm = Buffer.alloc(48000);
  for (let i = 0; i < 24000; i++) pcm.writeInt16LE(Math.round(8000 * Math.sin(i / 8)), i * 2);
  return pcm;
}
async function render(chunks: Uint8Array[]) {
  const playback = new CallPlayback();
  const frames: Uint8Array[] = [];
  const reader = playback.stream.getReader();
  const reading = (async () => { for (;;) { const next = await reader.read(); if (next.done) return; frames.push(next.value); } })();
  try {
    for (const chunk of chunks) await playback.write24k(chunk, AbortSignal.timeout(4000));
    await playback.drain(AbortSignal.timeout(4000));
  } finally { playback.close(); await reading; }
  return Buffer.concat(frames.filter(frame => frame.some(Boolean)));
}

test('bundled encoder creates an actual Ogg Opus voice note from PCM', async () => {
  const encoded = await encodeVoiceNote(tone(), AbortSignal.timeout(10000));
  expect(encoded.subarray(0, 4).toString()).toBe('OggS');
  expect(encoded.includes(Buffer.from('OpusHead'))).toBe(true);
  expect(encoded.length).toBeGreaterThan(100);
});
test('24 kHz speech becomes exactly one second of 16 kHz call audio across odd byte boundaries', async () => {
  const pcm = tone();
  const complete = await render([pcm]);
  const chunks: Uint8Array[] = [];
  for (let at = 0; at < pcm.length; at += 701) chunks.push(pcm.subarray(at, at + 701));
  const fragmented = await render(chunks);
  expect(complete.length).toBe(32000);
  expect(fragmented.equals(complete)).toBe(true);
}, 10000);
test('clearing interrupted speech also removes audio not yet read by the call host', async () => {
  const playback = new CallPlayback();
  try {
    await playback.write24k(tone().subarray(0, 4800), AbortSignal.timeout(1000));
    await Bun.sleep(65);
    playback.clear();
    const reader = playback.stream.getReader();
    const next = await reader.read();
    expect(next.value?.some(Boolean)).toBe(false);
    reader.releaseLock();
  } finally { playback.close(); }
});
