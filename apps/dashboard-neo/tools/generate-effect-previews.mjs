// With the dashboard dev server running, from the repository root:
// node apps/dashboard-neo/tools/generate-effect-previews.mjs [http://127.0.0.1:3004/dashboard/]
// Product artwork, rendered with the same sticker recipes used by the studio.
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listEffects } from '../../../packages/stickers/src/index.mjs';
import { joinBytes, parseWebp, riffChunk, writeWebp } from '../../../packages/stickers/src/webp.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const destination = fileURLToPath(new URL('../public/studio/effects/', import.meta.url));
// Publish together at the end so Vite's public-file reloads cannot interrupt rendering.
const directory = (await mkdtemp(join(tmpdir(), 'openwa-effect-previews-'))) + '/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const origin = process.argv[2] || 'http://127.0.0.1:3004/dashboard/';
const generatorUrl = new URL('generate-sticker-previews.html', origin).href;
// A blank same-origin document avoids the dev client's hot-reload connection.
await page.route(generatorUrl, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Sticker artwork generator</title>' }));
await page.goto(generatorUrl);
const rendererPath = fileURLToPath(new URL('../../../packages/stickers/src/browser-web.mjs', import.meta.url));
await page.evaluate(async path => { globalThis.previewRuntime = (await import(new URL('@fs' + path, location.href).href)).createBrowserStickerRuntime(); }, rendererPath);
const u24 = (bytes, offset, value) => { bytes[offset] = value; bytes[offset + 1] = value >> 8; bytes[offset + 2] = value >> 16; };
try {
  // Original cat illustration. A gentle nod and blink make timing recipes visible.
  // Eyes sit at the renderer's default laser-eye anchors (38%, 40% and 62%, 40%).
  const sourceFrames = [];
  for (let frame = 0; frame < 12; frame++) {
    const dy = Math.round(Math.sin(frame / 12 * Math.PI * 2) * 4);
    const blink = frame === 8;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs><linearGradient id="fur" x2=".6" y2="1"><stop stop-color="#ffca70"/><stop offset="1" stop-color="#f48d42"/></linearGradient></defs>
      <circle cx="256" cy="263" r="221" fill="#c8b8ef"/>
      <path d="M65 338l17-26 13 29-13 28zM400 105l12-23 12 23-12 23z" fill="#fff2b8"/>
      <g transform="translate(0 ${dy})" stroke="#4a3047" stroke-width="9" stroke-linejoin="round">
        <path d="M144 375c-46-34-77-5-60 25 18 31 72 28 97 0" fill="#f6a453"/>
        <path d="M157 354q-30 63-13 95h225q19-43-19-95" fill="#ffb05e"/>
        <path d="M125 190l-12-103q2-19 19-8l87 56h77l86-56q18-11 18 8l-12 103q32 53 15 113-23 77-147 77S103 330 103 270q0-43 22-80z" fill="url(#fur)"/>
        <path d="M136 111l10 59 43-26zM375 111l-10 59-43-26z" fill="#ed8e9e" stroke="none"/>
        <path d="M232 136l10 37m37-37l-10 37M113 249l32 10m-28 22l29 2m253-34l-32 10m28 22l-29 2" fill="none" stroke="#b65e39" stroke-linecap="round"/>
        <ellipse cx="195" cy="205" rx="15" ry="${blink ? 2 : 21}" fill="#403046" stroke="none"/>
        <ellipse cx="317" cy="205" rx="15" ry="${blink ? 2 : 21}" fill="#403046" stroke="none"/>
        ${blink ? '' : '<circle cx="190" cy="198" r="4" fill="white" stroke="none"/><circle cx="312" cy="198" r="4" fill="white" stroke="none"/>'}
        <ellipse cx="173" cy="251" rx="26" ry="13" fill="#ef8895" stroke="none"/><ellipse cx="339" cy="251" rx="26" ry="13" fill="#ef8895" stroke="none"/>
        <path d="M243 240q13-9 26 0l-13 13z" fill="#a34e68" stroke-width="5"/>
        <path d="M256 253v10q-17 24-34 1m34-1q17 24 34 1" fill="none" stroke-width="6" stroke-linecap="round"/>
        <path d="M158 357q99 44 196 0l-9 44q-86 35-177 0z" fill="#31877e"/>
        <path d="M284 392l45-3 12 75-51 7z" fill="#31877e"/><path d="M292 435l42-5" stroke="#f5dc8c" stroke-width="13"/>
      </g></svg>`;
    if (!frame) await writeFile(directory + 'sample.svg', svg);
    const bytes = await page.evaluate(async svg => {
      const image = new Image();
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      await image.decode();
      const canvas = new OffscreenCanvas(512, 512); canvas.getContext('2d').drawImage(image, 0, 0);
      return Array.from(new Uint8Array(await (await canvas.convertToBlob({ type: 'image/webp', quality: .82 })).arrayBuffer()));
    }, svg);
    const header = new Uint8Array(16); u24(header, 6, 511); u24(header, 9, 511); u24(header, 12, 133); header[15] = 2;
    sourceFrames.push(riffChunk('ANMF', joinBytes([header, ...parseWebp(Uint8Array.from(bytes)).chunks.filter(c => ['ALPH', 'VP8 ', 'VP8L'].includes(c.id)).map(c => c.raw)])));
  }
  const extended = new Uint8Array(10); extended[0] = 18; u24(extended, 4, 511); u24(extended, 7, 511);
  const source = writeWebp([riffChunk('VP8X', extended), riffChunk('ANIM', new Uint8Array(6)), ...sourceFrames]);
  await writeFile(directory + 'sample.webp', source);
  const manifest = { sourceSha256: createHash('sha256').update(source).digest('hex'), effects: {} };
  for (const effect of listEffects({ backend: 'browser', availableOnly: true })) {
    const result = await page.evaluate(async ({ bytes, name }) => {
      const result = await globalThis.previewRuntime.createSticker(new Blob([Uint8Array.from(bytes)], { type: 'image/webp' }), { effects: [name], quality: .72, fps: 8, loopCount: 0 });
      const decoder = new ImageDecoder({ data: result.bytes, type: 'image/webp', preferAnimation: true });
      await decoder.tracks.ready;
      const frames = [];
      for (let index = 0; index < decoder.tracks.selectedTrack.frameCount; index++) {
        const { image } = await decoder.decode({ frameIndex: index });
        const canvas = new OffscreenCanvas(192, 192); canvas.getContext('2d').drawImage(image, 0, 0, 192, 192);
        frames.push({ bytes: Array.from(new Uint8Array(await (await canvas.convertToBlob({ type: 'image/webp', quality: .76 })).arrayBuffer())), duration: Math.round((image.duration || 80000) / 1000) });
        image.close();
      }
      decoder.close();
      return { frames, animated: result.animated, durationMs: result.durationMs };
    }, { bytes: Array.from(source), name: effect.name });
    const still = Uint8Array.from(result.frames[0].bytes);
    let output = still;
    if (result.frames.length > 1) {
      const ext = new Uint8Array(10); ext[0] = 18; u24(ext, 4, 191); u24(ext, 7, 191);
      output = writeWebp([riffChunk('VP8X', ext), riffChunk('ANIM', new Uint8Array(6)), ...result.frames.map(frame => {
        const header = new Uint8Array(16); u24(header, 6, 191); u24(header, 9, 191); u24(header, 12, frame.duration); header[15] = 2;
        return riffChunk('ANMF', joinBytes([header, ...parseWebp(Uint8Array.from(frame.bytes)).chunks.filter(c => ['ALPH', 'VP8 ', 'VP8L'].includes(c.id)).map(c => c.raw)]));
      })]);
    }
    await writeFile(directory + effect.name + '.webp', output);
    await writeFile(directory + effect.name + '-still.webp', still);
    manifest.effects[effect.name] = { animated: result.animated, frames: result.frames.length, durationMs: result.durationMs, bytes: output.length };
    process.stdout.write(`${effect.name}: ${result.frames.length} frames, ${output.length} bytes\n`);
  }
  await writeFile(directory + 'manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  await mkdir(destination, { recursive: true });
  await cp(directory, destination, { recursive: true });
} finally { await page.evaluate(() => globalThis.previewRuntime?.dispose()).catch(() => {}); await browser.close(); await rm(directory, { recursive: true, force: true }); }
