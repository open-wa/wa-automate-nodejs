import type { Call, CallActionResult, CallIdentity, CallMediaOptions, CallSnapshot, AudioOutput } from '@open-wa/schema';
import { normalizeCallMedia } from '@open-wa/schema';

export interface CallActions {
  acceptCall(call: CallIdentity, media?: CallMediaOptions): Promise<CallActionResult>;
  rejectCall(call: CallIdentity): Promise<CallActionResult>;
  endCall(call: CallIdentity): Promise<CallActionResult>;
  muteCall(call: CallIdentity, muted: boolean): Promise<CallActionResult>;
  clearCallAudio(call: CallIdentity): Promise<CallActionResult>;
  setCallMedia(call: CallIdentity, media: CallMediaOptions): Promise<CallActionResult>;
  observeCallAudio(call: CallIdentity, speaker: AudioOutput): Promise<CallActionResult & { observerId?: string }>;
  stopCallAudioObserver(call: CallIdentity, observerId: string): Promise<CallActionResult>;
}

export function hydrateCall(snapshot: CallSnapshot, actions: CallActions): Call {
  const call = { ...snapshot };
  const identity: CallIdentity = { id: snapshot.id, sessionId: snapshot.sessionId, generation: snapshot.generation };
  const methods: Omit<Call, keyof CallSnapshot> = {
    accept: (microphone, speaker, camera) => actions.acceptCall(identity, normalizeCallMedia(microphone, speaker, camera)),
    reject: () => actions.rejectCall(identity), end: () => actions.endCall(identity),
    mute: () => actions.muteCall(identity, true), unmute: () => actions.muteCall(identity, false),
    clearAudio: () => actions.clearCallAudio(identity), setMedia: options => actions.setCallMedia(identity, options),
    observeAudio: async speaker => { const result = await actions.observeCallAudio(identity, speaker); if (!result.ok) return result; return { ok: true, status: 'attached', stop: async () => { await actions.stopCallAudioObserver(identity, result.observerId!); } }; },
  };
  Object.defineProperties(call, Object.fromEntries(Object.entries(methods).map(([key, value]) => [key, { value, enumerable: false }])));
  return call as Call;
}
