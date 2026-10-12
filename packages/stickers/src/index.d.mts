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
  quotedMsgId?: string;
  signal?: AbortSignal;
  onProgress?: (progress: StickerProgress) => void;
}
export interface StickerResult {
  bytes: Uint8Array; mime: 'image/webp'; backend: 'browser' | 'standalone';
  width: number; height: number; animated: boolean; frames: number;
  durationMs: number; loopCount: number; alpha: boolean; elapsedMs: number;
  author?: string; pack?: string;
  steps: (StickerEffect & { selected?: string })[];
}
export interface BackendCapabilities { available: boolean; requirements: readonly string[]; }
export interface BrowserBackend {
  capabilities(): Promise<BackendCapabilities>;
  render(input: { bytes: Uint8Array; mime: string }, job: StickerJob, requirements: string[]): Promise<Pick<StickerResult,'bytes'|'width'|'height'|'frames'|'durationMs'|'steps'>>;
  dispose(): Promise<void>;
}
export interface StickerRuntime {
  createSticker(input: StickerInput, job?: StickerJob): Promise<StickerResult>;
  dispose(): Promise<void>;
}
export interface EffectDescriptor {
  name: string; version: string; emoji?: string; description?: string;
  implemented: boolean; browser: boolean; standalone: boolean;
  requirements: readonly string[]; defaults?: Readonly<Record<string, unknown>>;
  animated?: boolean; provenance?: string; unavailableReason?: string;
}
export function createSticker(input: StickerInput, job?: StickerJob): Promise<StickerResult>;
export function createStickerRuntime(options?: { browser?: BrowserBackend; cacheDirectory?: string; offline?: boolean }): StickerRuntime;
export function disposeStickerRuntime(): Promise<void>;
export function listEffects(options?: { backend?: StickerBackend; availableOnly?: boolean }): EffectDescriptor[];
export const effectCatalogue: Readonly<Record<string, EffectDescriptor>>;
export const STICKER_PROFILE: Readonly<{ version: string; width: number; height: number; maxInputBytes: number; maxSourcePixels: number; maxFrames: number; maxDurationMs: number; maxEffects: number; maxStaticBytes: number; maxAnimatedBytes: number; metadataReserveBytes: number }>;
export const resourceManifest: Readonly<Record<string, { url: string; sha256: string; bytes: number; filename: string; version: string; license: string; family?: string }>>;
export class StickerError extends Error { readonly code: string; readonly detail: Readonly<Record<string, unknown>>; constructor(code: string, message: string, detail?: Record<string, unknown>, cause?: unknown); }
