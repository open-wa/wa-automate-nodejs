export interface WebpChunk { id: string; data: Uint8Array; raw: Uint8Array; }
export interface WebpInfo { width: number; height: number; animated: boolean; alpha: boolean; frames: number; durationMs: number; loopCount: number; chunks: WebpChunk[]; }
export function parseWebp(bytes: Uint8Array): WebpInfo;
export function riffChunk(id: string, data: Uint8Array): Uint8Array;
export function joinBytes(parts: Uint8Array[]): Uint8Array;
export function writeWebp(chunks: Uint8Array[]): Uint8Array;
