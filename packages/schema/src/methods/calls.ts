import { Schema } from 'effect';
import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { projectEffectSchema } from '../effect-projection';
import { CallActionResultSchema, CallCapabilitiesSchema, CallMediaOptionsSchema, CallIdentitySchema, CallSnapshotSchema } from '../calling';

const media = Schema.optional(Schema.Unknown);
const actionInput = Schema.Struct({ call: CallIdentitySchema, media: Schema.optional(CallMediaOptionsSchema) });
const register = (name: string, input: Schema.Top, output: Schema.Top, parameters: string[], description: string) => defineMethodV2(name, {
  meta: { namespace: 'calls', action: 'update', httpMethod: 'POST', license: name === 'getCallCapabilities' ? 'none' : 'restricted', functionality: 'both', description },
  input: projectEffectSchema(input) as z.ZodObject<any>, parameterOrder: parameters, output: projectEffectSchema(output),
});
export const getCallCapabilities = register('getCallCapabilities', Schema.Struct({}), CallCapabilitiesSchema, [], 'Optional calling availability for UI and diagnostics. Actions perform admission automatically.');
export const getActiveCall = register('getActiveCall', Schema.Struct({}), Schema.NullOr(CallSnapshotSchema), [], 'Get the current call snapshot. SDK clients hydrate its bound methods.');
export const acceptCall = register('acceptCall', actionInput, CallActionResultSchema, ['call', 'media'], 'Prepare media and accept this incoming call.');
export const startCall = register('startCall', Schema.Struct({ to: Schema.String, microphone: media, speaker: media, camera: media }), CallActionResultSchema, ['to', 'microphone', 'speaker', 'camera'], 'Prepare media and place an outgoing audio or video call.');
export const rejectCall = register('rejectCall', Schema.Struct({ call: CallIdentitySchema }), CallActionResultSchema, ['call'], 'Reject this call with native state confirmation.');
export const endCall = register('endCall', Schema.Struct({ call: CallIdentitySchema }), CallActionResultSchema, ['call'], 'Request hangup for this call.');
export const muteCall = register('muteCall', Schema.Struct({ call: CallIdentitySchema, muted: Schema.Boolean }), CallActionResultSchema, ['call', 'muted'], 'Mute or unmute the microphone without ending reception.');
export const clearCallAudio = register('clearCallAudio', Schema.Struct({ call: CallIdentitySchema }), CallActionResultSchema, ['call'], 'Discard queued outgoing audio.');
export const setCallMedia = register('setCallMedia', actionInput, CallActionResultSchema, ['call', 'media'], 'Prepare a replacement before releasing the working media.');
export const observeCallAudio = register('observeCallAudio', Schema.Struct({ call: CallIdentitySchema, speaker: Schema.Unknown }), Schema.Union([Schema.Struct({ ok: Schema.Literal(true), status: Schema.Literal('requested'), observerId: Schema.String }), CallActionResultSchema]), ['call', 'speaker'], 'Attach an isolated receive-only audio sink. Its failure does not interrupt the call owner.');
export const stopCallAudioObserver = register('stopCallAudioObserver', Schema.Struct({ call: CallIdentitySchema, observerId: Schema.String }), CallActionResultSchema, ['call', 'observerId'], 'Stop an audio observer and finalize its sink.');
