import type { BackendCapabilities, StickerJob, StickerResult } from './index.mjs';
export const standaloneCapabilities: BackendCapabilities;
export function createLibraryBackend(options?: { cacheDirectory?: string; offline?: boolean; idleMs?: number }): {
  capabilities: BackendCapabilities;
  render(input: { bytes: Uint8Array; mime: string }, job: StickerJob, requirements: string[]): Promise<Pick<StickerResult,'bytes'|'width'|'height'|'frames'|'durationMs'|'steps'>>;
  dispose(): Promise<void>;
};
