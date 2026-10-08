import { Schema } from 'effect';
import type { AudioInput, AudioOutput, CallMediaOptions, VideoInput } from './calling-media';

export const RawAudioFormatSchema = Schema.Struct({ encoding: Schema.Literals(['pcm16le', 'float32le']), sampleRate: Schema.Number, channels: Schema.Literals([1, 2]) });
export const MediaDescriptorSchema = Schema.Struct({
  kind: Schema.Literals(['file', 'url', 'device', 'remote']), path: Schema.optional(Schema.String), url: Schema.optional(Schema.String),
  deviceId: Schema.optional(Schema.String), raw: Schema.optional(RawAudioFormatSchema), headers: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  overwrite: Schema.optional(Schema.Boolean), loop: Schema.optional(Schema.Boolean), remoteId: Schema.optional(Schema.String),
});
export const CallMediaOptionsSchema = Schema.Struct({
  microphone: Schema.optional(Schema.Unknown), speaker: Schema.optional(Schema.Unknown), camera: Schema.optional(Schema.Unknown),
  onMediaFailure: Schema.optional(Schema.Literals(['end', 'keep-open'])),
});
export const CallIdentitySchema = Schema.Struct({
  id: Schema.String,
  sessionId: Schema.String,
  generation: Schema.String,
});
export const CallSnapshotSchema = Schema.Struct({
  ...CallIdentitySchema.fields,
  peer: Schema.String,
  state: Schema.String,
  direction: Schema.Literals(['incoming', 'outgoing']),
  video: Schema.Boolean,
  terminal: Schema.Boolean,
  observedAt: Schema.Number,
  media: Schema.optional(Schema.Struct({ state: Schema.Literals(['attached', 'ended']), reason: Schema.optional(Schema.String) })),
});
export const CallReasonSchema = Schema.Struct({ code: Schema.String, message: Schema.String, status: Schema.Number });
export const CallActionResultSchema = Schema.Union([
  Schema.Struct({ ok: Schema.Literal(true), status: Schema.Literal('requested'), callId: Schema.optional(Schema.String) }),
  Schema.Struct({ ok: Schema.Literal(false), status: Schema.Literals(['unavailable', 'failed', 'unknown']), reason: CallReasonSchema, callId: Schema.optional(Schema.String) }),
]);
export const CallCapabilitiesSchema = Schema.Struct({
  control: Schema.Boolean, audio: Schema.Boolean, video: Schema.Boolean,
  reason: Schema.optional(CallReasonSchema),
});
export type CallIdentity = typeof CallIdentitySchema.Type;
export type CallSnapshot = typeof CallSnapshotSchema.Type;
export type CallActionResult = typeof CallActionResultSchema.Type;
export type CallCapabilities = typeof CallCapabilitiesSchema.Type;
export type CallAudioObserver = { ok: true; status: 'attached'; stop(): Promise<void> };

/** Methods are hydrated locally; transports carry only CallSnapshot. */
export interface Call extends CallSnapshot {
  accept(microphone?: AudioInput | CallMediaOptions, speaker?: AudioOutput, camera?: VideoInput): Promise<CallActionResult>;
  reject(): Promise<CallActionResult>;
  end(): Promise<CallActionResult>;
  mute(): Promise<CallActionResult>;
  unmute(): Promise<CallActionResult>;
  clearAudio(): Promise<CallActionResult>;
  setMedia(options: CallMediaOptions): Promise<CallActionResult>;
  observeAudio(speaker: AudioOutput): Promise<CallAudioObserver | Exclude<CallActionResult, { ok: true }>>;
}
