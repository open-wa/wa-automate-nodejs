export type StickerInput = Uint8Array | ArrayBuffer | Blob | string;
export type StickerBackend = 'auto' | 'browser' | 'standalone';
export interface StickerEffect { name: string; options?: Record<string, unknown>; }
export interface StickerProgress { frame: number; frames: number; }
export interface StickerJob {
  effects?: (string | StickerEffect)[];
  backend?: StickerBackend;
  quality?: number;
  fit?: 'contain' | 'cover';
  circle?: boolean;
  background?: string;
  trim?: [startMs: number, endMs: number];
  fps?: number;
  loopCount?: number;
  author?: string;
  pack?: string;
  /**
   * Attach a sound that the recipient can play. `true` keeps the sound of a video input, cut to the same
   * part of the video as the sticker. A filename, URL, data URL or bytes attaches that sound instead.
   * Mono Ogg Opus and M4A clips of at most 1 MB are used as they are; anything else is converted in the browser to mono Ogg Opus.
   */
  audio?: boolean | StickerInput;
  quotedMsgId?: string;
  signal?: AbortSignal;
  onProgress?: (progress: StickerProgress) => void;
}
export interface StickerResult {
  bytes: Uint8Array; mime: 'image/webp'; backend: 'browser' | 'standalone';
  width: number; height: number; animated: boolean; frames: number;
  durationMs: number; loopCount: number; alpha: boolean; elapsedMs: number;
  author?: string; pack?: string;
  /** The sound to send with the sticker, when the job asked for one. */
  audio?: StickerAudio;
  steps: (StickerEffect & { selected?: string })[];
}
export interface StickerAudio { bytes: Uint8Array; mime: 'audio/ogg; codecs=opus' | 'audio/mp4'; durationMs?: number; }
/** Limits for `convertAudio`. Left out, they are those of sticker sound: five minutes, 1 MB and a bitrate of at most 48 kbit/s that fits the length. */
export interface AudioConversion {
  /** The longest sound to convert, in seconds. A longer sound is refused. */
  maxSeconds?: number;
  /** The largest converted clip, in bytes. A larger result is refused. */
  maxBytes?: number;
  /** The Opus bitrate in bits per second. */
  bitrate?: number;
  signal?: AbortSignal;
}
export interface BackendCapabilities { available: boolean; requirements: readonly string[]; }
export interface BrowserBackend {
  capabilities(): Promise<BackendCapabilities>;
  render(input: { bytes: Uint8Array; mime: string }, job: StickerJob, requirements: string[]): Promise<Pick<StickerResult,'bytes'|'width'|'height'|'frames'|'durationMs'|'steps'|'audio'>>;
  /** Convert a sound to a mono Ogg Opus clip. Needed only for sounds that are not already mono Ogg Opus or M4A. */
  convertAudio?(sound: Uint8Array, options: AudioConversion): Promise<StickerAudio>;
  dispose(): Promise<void>;
}
export interface StickerRuntime {
  createSticker(input: StickerInput, job?: StickerJob): Promise<StickerResult>;
  /**
   * Convert a sound to mono Ogg Opus at 48 kHz, the format of a voice note. A clip that is already mono Ogg Opus
   * is returned as it is. Anything else is converted in the browser page, so a runtime without one refuses it.
   */
  convertAudio(input: StickerInput, options?: AudioConversion): Promise<StickerAudio>;
  dispose(): Promise<void>;
}
export interface EffectDescriptor {
  name: string; version: string; emoji?: string; description?: string;
  implemented: boolean; browser: boolean; standalone: boolean;
  requirements: readonly string[]; defaults?: Readonly<Record<string, unknown>>;
  options?: Readonly<Record<string, EffectOption>>;
  animated?: boolean; provenance?: string; unavailableReason?: string;
}
export type EffectOption = Readonly<
  { type: 'number'; min: number; max: number; integer: boolean; step: number } |
  { type: 'string'; maxLength: number; format?: 'color' } |
  { type: 'points'; min: number; max: number; step: number }
>;
/** Automatically queue bursts, reuse renderers, and release resources after idle. No disposal is needed. */
export function createSticker(input: StickerInput, job?: StickerJob): Promise<StickerResult>;
/** True for an Ogg Opus clip with one channel. */
export function isMonoOggOpus(bytes: Uint8Array): boolean;
/** Validate a job without decoding media or starting a renderer. */
export function validateStickerJob(job?: StickerJob): void;
export function createStickerRuntime(options?: { browser?: BrowserBackend; cacheDirectory?: string; offline?: boolean }): StickerRuntime;
export function disposeStickerRuntime(): Promise<void>;
export function listEffects(options?: { backend?: StickerBackend; availableOnly?: boolean }): EffectDescriptor[];
export const effectCatalogue: Readonly<Record<string, EffectDescriptor>>;
export const STICKER_PROFILE: Readonly<{ version: string; width: number; height: number; maxInputBytes: number; maxSourcePixels: number; maxFrames: number; maxDurationMs: number; maxEffects: number; maxStaticBytes: number; maxAnimatedBytes: number; metadataReserveBytes: number }>;
export const resourceManifest: Readonly<Record<string, { url: string; sha256: string; bytes: number; filename: string; version: string; license: string; family?: string }>>;
export class StickerError extends Error { readonly code: string; readonly detail: Readonly<Record<string, unknown>>; constructor(code: string, message: string, detail?: Record<string, unknown>, cause?: unknown); }
