import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StickerError, abortIfRequested } from './errors.mjs';
import { STICKER_PROFILE } from './profile.mjs';

const INSTALL_HINT = 'Install ffmpeg (https://ffmpeg.org/download.html) on the machine that runs open-wa and send again, or supply an H.264 MP4 or WebM.';
let warned = false;

/**
 * Convert a video the browser cannot decode, such as HEVC, to H.264 with the system's ffmpeg.
 * ffmpeg is not bundled. When it is missing, the log and the error say how to get it.
 */
export async function convertVideo(bytes, { signal } = {}) {
  abortIfRequested(signal);
  const command = process.env.FFMPEG_PATH || 'ffmpeg';
  const directory = await mkdtemp(join(tmpdir(), 'openwa-sticker-'));
  const source = join(directory, 'input'), target = join(directory, 'output.mp4');
  try {
    await writeFile(source, bytes, { mode: 0o600 });
    const args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', source, '-map', '0:v:0', '-map', '0:a:0?',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-f', 'mp4', target];
    await new Promise((resolve, reject) => {
      let stderr = '', child;
      try { child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'], signal }); }
      catch (error) { reject(error); return; }
      const timer = setTimeout(() => child.kill('SIGKILL'), 90_000);
      child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-600); });
      child.on('error', error => { clearTimeout(timer); reject(error); });
      child.on('close', code => {
        clearTimeout(timer);
        code === 0 ? resolve() : reject(new StickerError('VIDEO_CONVERSION_FAILED', `ffmpeg could not convert this video${stderr.trim() ? ` (${stderr.trim().split('\n').pop()})` : ''}. Supply an H.264 MP4 or WebM.`));
      });
    });
    const converted = new Uint8Array(await readFile(target));
    if (!converted.length || converted.length > STICKER_PROFILE.maxInputBytes) throw new StickerError('VIDEO_CONVERSION_FAILED', 'The converted video is empty or too large. Trim the video and send again.');
    return converted;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      const message = `This video needs converting before the browser can read it, and ffmpeg was not found. ${INSTALL_HINT}`;
      if (!warned) { warned = true; console.warn(`[open-wa stickers] ${message}`); }
      throw new StickerError('FFMPEG_MISSING', message);
    }
    throw error;
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(() => {});
  }
}
