import type { CallIdentity, CallMediaOptions, CallSnapshot, RawAudioFormat } from '@open-wa/schema';
import type { SessionScope } from '@open-wa/runtime-core';

export interface AudioFrame { samples: number[]; sampleRate: number; sequence: number; }
export interface PreparedCallMedia {
  microphone: 'device' | 'injected' | 'disabled';
  speaker: 'device' | 'captured' | 'disabled';
  camera: 'device' | 'injected' | 'disabled';
  deviceIds?: { microphone?: string; speaker?: string; camera?: string };
  start(write: (frame: AudioFrame) => Promise<void>): Promise<void>;
  receive(frame: AudioFrame): Promise<void>;
  clear(): Promise<void>;
  mute(muted: boolean): Promise<void>;
}
export interface CallMediaHost {
  prepare(options: CallMediaOptions, scope: SessionScope, onFailure?: (error: Error) => void, inputFormat?: RawAudioFormat): Promise<PreparedCallMedia>;
}
export interface CallingProviderInfo {
  protocolVersion: 1;
  artifactRevision: string;
  expiresAt: number;
  control: boolean;
  audio: boolean;
  video: boolean;
}
export type CallingProviderEvent =
  | { type: 'state'; snapshot: Omit<CallSnapshot, 'sessionId' | 'generation'> | null; terminal?: Omit<CallSnapshot, 'sessionId' | 'generation'> }
  | { type: 'audio'; callId: string; attachmentId: string; frame: AudioFrame }
  | { type: 'media-error'; callId: string; attachmentId?: string; message: string };

export type CallingIdentity = CallIdentity;
