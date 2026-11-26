import type { Client } from './Client';
import { clientStickerRuntime } from './stickers';

/** Media after `resolveMediaInput`: a base64 data URL with its MIME type and filename. */
export interface ResolvedMedia { dataUrl: string; mime: string; filename: string }

/**
 * What a converted voice note is held to. Voice notes are speech, so 32 kbit/s of mono Opus is enough. The page decodes
 * the whole sound in memory before it encodes, about 23 MB for a minute of stereo, so ten minutes is the most it converts.
 */
export const VOICE_NOTE_LIMITS = Object.freeze({ maxSeconds: 600, maxBytes: 4_000_000, bitrate: 32_000 });
/** The largest file that is handed to the page for conversion. */
export const VOICE_NOTE_MAX_SOURCE_BYTES = 20 * 1024 * 1024;

const READY = 'A mono Ogg Opus file is sent as it is.';

function conversionFailure(cause: unknown): string {
  const error = cause as { code?: string; message?: string; detail?: { reason?: string } } | undefined;
  const reason = error?.detail?.reason;
  if (reason === 'AUDIO_TOO_LONG') return `A voice note that needs converting can be at most ${VOICE_NOTE_LIMITS.maxSeconds / 60} minutes long. ${READY}`;
  if (error?.code === 'AUDIO_UNAVAILABLE' || reason === 'AUDIO_UNSUPPORTED') return `This session's browser cannot convert audio to a voice note. Supply a mono Ogg Opus file, which is sent as it is.`;
  if (reason === 'AUDIO_UNREADABLE') return `The session's browser found no audio it can read in this file, so no voice note was sent. ${READY}`;
  const detail = String(error?.message ?? cause).replace(/^audio: /, '');
  return `The audio could not be converted to a voice note: ${detail} ${READY}`;
}

/**
 * A voice note has to be mono Ogg Opus to play on every phone. Mono Ogg Opus goes out untouched;
 * any other audio is converted in the session's page. Nothing has been sent when this throws.
 */
export async function voiceNoteMedia(client: Client, media: ResolvedMedia): Promise<ResolvedMedia> {
  // An image or a document has no sound. The send reports those itself.
  if (!/^(?:audio|video)\//.test(media.mime) && media.mime !== 'application/octet-stream') return media;
  const bytes = Buffer.from(media.dataUrl.slice(media.dataUrl.indexOf(',') + 1), 'base64');
  const { isMonoOggOpus } = await import('@open-wa/stickers');
  if (isMonoOggOpus(bytes)) return media;
  if (bytes.length > VOICE_NOTE_MAX_SOURCE_BYTES) {
    throw new Error(`A voice note that needs converting can be at most ${VOICE_NOTE_MAX_SOURCE_BYTES / 1024 / 1024} MB. ${READY}`);
  }
  let clip: { bytes: Uint8Array };
  try {
    clip = await (await clientStickerRuntime(client)).convertAudio(bytes, VOICE_NOTE_LIMITS);
  } catch (cause) {
    throw new Error(conversionFailure(cause), { cause });
  }
  return {
    dataUrl: `data:audio/ogg;base64,${Buffer.from(clip.bytes).toString('base64')}`,
    mime: 'audio/ogg',
    filename: `${media.filename.replace(/\.[^.]*$/, '')}.ogg`,
  };
}
