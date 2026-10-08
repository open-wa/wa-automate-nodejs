import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { StickerError } from './errors.mjs';

const pending = new Map();
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

export async function cachedResource(resource, options = {}) {
  const directory = options.cacheDirectory ?? join(process.env.XDG_CACHE_HOME || join(homedir(), '.cache'), 'openwa', 'stickers', 'v1');
  const path = join(directory, `${resource.sha256}-${resource.filename}`);
  const key = `${path}`;
  if (pending.has(key)) return pending.get(key);
  const promise = (async () => {
    try {
      const bytes = await readFile(path);
      if (bytes.length === resource.bytes && digest(bytes) === resource.sha256) return path;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (options.offline) throw new StickerError('RESOURCE_UNAVAILABLE', `Missing cached resource ${resource.filename}; provision it before using offline mode.`);
    const response = await fetch(resource.url, { signal: options.signal });
    if (!response.ok) throw new StickerError('RESOURCE_UNAVAILABLE', `Resource request returned HTTP ${response.status}.`, { resource: resource.filename });
    const reader = response.body?.getReader();
    if (!reader) throw new StickerError('RESOURCE_UNAVAILABLE', 'Resource response has no readable body.');
    const parts = []; let length = 0;
    try {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        length += value.length;
        if (length > resource.bytes) throw new StickerError('RESOURCE_REJECTED', 'Resource exceeds its pinned byte length.');
        parts.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    const bytes = Buffer.concat(parts, length);
    if (length !== resource.bytes || digest(bytes) !== resource.sha256) throw new StickerError('RESOURCE_REJECTED', 'Resource does not match its pinned digest.', { resource: resource.filename });
    await mkdir(directory, { recursive: true });
    const temporary = `${path}.${randomUUID()}.tmp`;
    try { await writeFile(temporary, bytes, { flag: 'wx' }); await rename(temporary, path); }
    finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
    return path;
  })();
  pending.set(key, promise);
  try { return await promise; } finally { pending.delete(key); }
}
