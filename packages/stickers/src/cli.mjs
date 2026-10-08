#!/usr/bin/env node
import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createStickerRuntime, listEffects } from './index.mjs';

const help = `Usage: openwa-sticker <input> --output <output.webp> [--effects comic,tint,sparkle]
       openwa-sticker <input> --output <output.webp> --job <job.json>
       openwa-sticker effects [--all]

--job supplies ordered effect options, fit, quality, trim and animation settings.
--offline requires previously cached resources; --cache-dir chooses the cache.
The CLI uses the standalone backend. It downloads its pinned compositor on demand.
`;
async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--help')) { process.stdout.write(help); return; }
  if (args[0] === 'effects') {
    process.stdout.write(JSON.stringify(listEffects({ availableOnly: !args.includes('--all') }), null, 2) + '\n'); return;
  }
  const input = args.shift(), values = {}, flags = new Set();
  while (args.length) {
    const key = args.shift();
    if (key === '--offline') { flags.add(key); continue; }
    if (!['--output','--effects','--job','--cache-dir'].includes(key) || !args.length) throw Error('Unknown or incomplete option ' + key);
    values[key] = args.shift();
  }
  if (!values['--output']) throw Error('Supply --output <output.webp>.');
  if (values['--effects'] && values['--job']) throw Error('Use --effects or --job.');
  const job = values['--job'] ? JSON.parse(await readFile(values['--job'],'utf8')) : { effects: values['--effects']?.split(',').filter(Boolean) || [] };
  if (job.backend && !['auto','standalone'].includes(job.backend)) throw Error('The CLI runs standalone jobs.');
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  process.once('SIGINT', interrupt);
  const runtime = createStickerRuntime({ cacheDirectory: values['--cache-dir'], offline: flags.has('--offline') });
  const output = resolve(values['--output']), temporary = `${output}.${randomUUID()}.tmp`;
  try {
    const result = await runtime.createSticker(input, { ...job, backend: 'standalone', signal: controller.signal });
    await writeFile(temporary, result.bytes, { flag: 'wx' }); await rename(temporary, output);
    process.stdout.write(JSON.stringify({ output, backend: result.backend, bytes: result.bytes.length, frames: result.frames, durationMs: result.durationMs, elapsedMs: Math.round(result.elapsedMs) }) + '\n');
  } finally {
    process.removeListener('SIGINT', interrupt); await runtime.dispose();
    await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
}
main().catch(error => { process.stderr.write(`${error.code || 'STICKER_FAILED'}: ${error.message}\n`); if (process.env.OPENWA_STICKER_DEBUG === '1' && error.detail?.stack) process.stderr.write(error.detail.stack + '\n'); process.exitCode = 1; });
