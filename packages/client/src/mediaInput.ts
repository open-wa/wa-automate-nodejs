import { fileToDataUrlCodec, MediaSendOptionsSchema } from '@open-wa/schema';
import type { ChatId, MessageId, MediaSendOptions } from '@open-wa/schema';
import type { Client } from './Client';

/** A data URL, base64 string, URL, local path or Buffer. */
export type MediaInput = string | Buffer;
/** A submission result, not confirmation of delivery to the recipient. */
export type MediaSendResult = MessageId | boolean;

const mimeByExtension: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', mp3: 'audio/mpeg',
  wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac', flac: 'audio/flac',
  pdf: 'application/pdf', txt: 'text/plain', csv: 'text/csv', zip: 'application/zip',
};

function detectMime(bytes: Buffer): string | undefined {
  const ascii = (start: number, end: number) => bytes.toString('ascii', start, end);
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (/^GIF8[79]a$/.test(ascii(0, 6))) return 'image/gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE') return 'audio/wav';
  if (ascii(0, 4) === 'OggS') return 'audio/ogg';
  if (bytes[0] === 255 && (bytes[1]! & 0xf6) === 0xf0) return 'audio/aac';
  if (ascii(0, 3) === 'ID3' || (bytes[0] === 255 && (bytes[1]! & 0xe0) === 0xe0)) return 'audio/mpeg';
  if (ascii(0, 4) === 'fLaC') return 'audio/flac';
  if (ascii(4, 8) === 'ftyp') return ascii(8, 12).startsWith('M4A') ? 'audio/mp4' : 'video/mp4';
  if (bytes.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163]))) return 'video/webm';
  if (ascii(0, 5) === '%PDF-') return 'application/pdf';
  return undefined;
}

export async function resolveMediaInput(input: MediaInput, filename?: string): Promise<{ dataUrl: string; mime: string; filename: string }> {
  if (!filename && typeof input === 'string' && !input.startsWith('data:')) {
    const candidate = input.split(/[\\/]/).pop()?.split(/[?#]/)[0];
    if (candidate && candidate.length <= 255 && mimeByExtension[candidate.split('.').pop()!.toLowerCase()]) filename = candidate;
  }
  const dataUrl = await fileToDataUrlCodec.decode(input);
  if (typeof dataUrl !== 'string') throw new Error('Could not resolve media input to a data URL.');
  const match = /^data:([^;,]*)(?:;[^,]*)?;base64,([\s\S]+)$/.exec(dataUrl);
  if (!match) throw new Error('Media input must resolve to a base64 data URL.');
  let mime = match[1] || 'application/octet-stream';
  if (mime === 'application/octet-stream') {
    const extension = filename?.split('.').pop()?.toLowerCase();
    mime = (extension ? mimeByExtension[extension] : undefined)
      ?? detectMime(Buffer.from(match[2]!.slice(0, 128), 'base64'))
      ?? mime;
  }
  const extension = Object.keys(mimeByExtension).find(key => mimeByExtension[key] === mime) ?? 'bin';
  return { dataUrl: dataUrl.replace(/^data:[^;,]*/, `data:${mime}`), mime, filename: filename || `media.${extension}` };
}

export function mediaSendResult(result: unknown): MediaSendResult {
  if (typeof result === 'boolean') return result;
  if (typeof result === 'string' && /^(true|false)_.+_.+$/.test(result)) return result as MessageId;
  throw new Error(typeof result === 'string' ? result : 'Media submission did not return a message ID or success status; check the chat before retrying.');
}

export async function sendMedia(
  client: Client, to: ChatId, input: MediaInput, filename?: string,
  options: MediaSendOptions = {},
): Promise<MediaSendResult> {
  options = MediaSendOptionsSchema.parse(options);
  const resolved = await resolveMediaInput(input, filename);
  // MP4 and WebM signatures identify containers, which can also contain audio only.
  if (options.type === 'audio') {
    if (resolved.mime === 'video/mp4' || resolved.mime === 'video/webm') {
      resolved.mime = resolved.mime.replace('video/', 'audio/');
      resolved.dataUrl = resolved.dataUrl.replace(/^data:[^;,]*/, `data:${resolved.mime}`);
    }
    if (!resolved.mime.startsWith('audio/')) throw new Error('Audio sending requires audio media.');
  }
  const presentation = options.type && options.type !== 'auto' ? options.type
    : resolved.mime.startsWith('image/') ? 'image'
    : resolved.mime.startsWith('video/') ? 'video'
    : resolved.mime.startsWith('audio/') ? 'audio' : 'document';
  if ((presentation === 'image' || presentation === 'video') && !resolved.mime.startsWith(`${presentation}/`)) {
    throw new Error(`The requested ${presentation} presentation requires ${presentation} media.`);
  }
  const ptt = options.type === 'audio' && options.ptt === true;
  const isGif = options.type === 'video' && options.isGif === true;
  const videoNote = options.type === 'video' && options.videoNote === true;
  const once = 'viewOnce' in options && options.viewOnce === true;
  if (once && !['image', 'video'].includes(presentation) && !ptt) throw new Error('View once requires an image, video or voice note.');
  if ((isGif || videoNote) && resolved.mime !== 'video/mp4') throw new Error('GIFs and video notes require an MP4 video; this API does not transcode media.');
  const caption = 'caption' in options ? options.caption ?? '' : '';
  if (presentation === 'audio' && caption) throw new Error('Audio attachments do not support captions.');
  const flags = { ptt, isGif, videoNote, viewOnce: once, asFile: presentation === 'document', caption, quotedMsgId: options.quotedMsgId };
  const result = await client.evaluate(async ({ to, resolved, flags }) => {
    const api = (globalThis as unknown as { WAPI?: { sendImage?: (...args: unknown[]) => Promise<unknown> } }).WAPI;
    if (typeof api?.sendImage !== 'function') throw new Error('The current media patch is unavailable in this session.');
    const binary = atob(resolved.dataUrl.slice(resolved.dataUrl.indexOf(',') + 1));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    // A File preserves MIME information and avoids the patch's octet-stream-to-MP4 coercion.
    const file = new File([bytes], resolved.filename, { type: resolved.mime });
    return await api.sendImage(file, to, resolved.filename, flags.caption, flags.quotedMsgId,
      true, flags.ptt, flags.asFile, false, false, false, flags.isGif, flags.viewOnce, flags.videoNote);
  }, { to, resolved, flags });
  return mediaSendResult(result);
}
