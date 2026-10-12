import { CallSnapshotSchema } from '../calling';
import { projectEffectSchema } from '../effect-projection';
import { defineListenerV2 } from './registry';

export const incomingCallEvent = defineListenerV2('incomingCall', {
  legacyName: 'onIncomingCall', meta: { namespace: 'calls', license: 'restricted', status: 'experimental', description: 'A native incoming call. The SDK hydrates its bound controls.' },
  payload: projectEffectSchema(CallSnapshotSchema), defaultQueueOptions: { capacity: 32, concurrency: 1 },
});
export const callStateEvent = defineListenerV2('callState', {
  legacyName: 'onCallState', meta: { namespace: 'calls', license: 'restricted', status: 'experimental', description: 'Observed native call state, including unknown states.' },
  payload: projectEffectSchema(CallSnapshotSchema), defaultQueueOptions: { capacity: 64, concurrency: 1 },
});
