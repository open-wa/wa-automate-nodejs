/** Device defaults are serializable so embedded and remote clients share the same API. */
export const DEFAULT_MIC = 'default:microphone' as const;
export const DEFAULT_SPEAKER = 'default:speaker' as const;
export const DEFAULT_CAM = 'default:camera' as const;

export interface RawAudioFormat {
  encoding: 'pcm16le' | 'float32le';
  sampleRate: number;
  channels: 1 | 2;
}

export interface MediaDescriptor {
  kind: 'file' | 'url' | 'device' | 'remote';
  path?: string;
  url?: string;
  deviceId?: string;
  raw?: RawAudioFormat;
  headers?: Record<string, string>;
  overwrite?: boolean;
  loop?: boolean;
  /** Internal helper admission; applications use ordinary files/devices/streams. */
  remoteId?: string;
}

export type AudioInput = string | MediaDescriptor | ReadableStream<Uint8Array> | Blob | null;
export type AudioOutput = string | MediaDescriptor | WritableStream<Uint8Array> | null;
export type VideoInput = string | MediaDescriptor | null;
export interface CallMediaOptions {
  microphone?: AudioInput;
  speaker?: AudioOutput;
  camera?: VideoInput;
  onMediaFailure?: 'end' | 'keep-open';
}
export interface CallingOptions {
  defaults?: CallMediaOptions;
  /** Trusted issuer keys, keyed by the grant's key ID. Never supplied by an HTTP caller. */
  verificationKeys?: Record<string, string>;
  preparationTimeoutMs?: number;
}

export function normalizeCallMedia(
  microphone?: AudioInput | CallMediaOptions,
  speaker?: AudioOutput,
  camera?: VideoInput,
): CallMediaOptions {
  if (microphone && typeof microphone === 'object' && !('kind' in microphone) && !('getReader' in microphone) && !('arrayBuffer' in microphone)) {
    return microphone as CallMediaOptions;
  }
  return { microphone: microphone as AudioInput | undefined, speaker, camera };
}
