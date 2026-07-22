import { Effect, PubSub, Schema, Stream } from 'effect';
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
} from 'effect/unstable/httpapi';
import { Rpc } from 'effect/unstable/rpc';

export const RuntimeHealthSchema = Schema.Struct({
  sessionId: Schema.String,
  state: Schema.Literals(['STARTING', 'AUTHENTICATING', 'READY', 'DISCONNECTED', 'STOPPED']),
  ready: Schema.Boolean,
});

export const RuntimeEventSchema = Schema.Struct({
  event: Schema.String,
  sessionId: Schema.String,
  timestamp: Schema.Number,
  payload: Schema.Unknown,
});

export const OpenWaHttpApi = HttpApi.make('openwa').add(
  HttpApiGroup.make('runtime').add(
    HttpApiEndpoint.get('health', '/health', { success: RuntimeHealthSchema }),
  ),
);

export const OpenWaAskRpc = Rpc.make('openwa.ask', {
  payload: {
    method: Schema.String,
    args: Schema.Array(Schema.Unknown),
  },
  success: Schema.Unknown,
});

export const decodeRuntimeEvent = Schema.decodeUnknownEffect(RuntimeEventSchema);

export const makeBoundedEventPipeline = <A>(capacity: number) =>
  Effect.gen(function* () {
    const pubsub = yield* PubSub.bounded<A>(capacity);
    return {
      publish: (event: A) => PubSub.publish(pubsub, event),
      events: Stream.fromPubSub(pubsub),
      shutdown: PubSub.shutdown(pubsub),
    } as const;
  });
