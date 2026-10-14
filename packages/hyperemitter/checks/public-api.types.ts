import { Effect, PubSub, Stream } from 'effect';
import { EventEmitter, HyperEmitter, type EventSubscription, type EventEmission } from '../src/index';

const ev = new EventEmitter();
ev.on('message.received', function (payload, sessionId: string, namespace: string) {
  const event = this.event;
  void [payload, sessionId, namespace, event];
}).once('qr.**', (qr: string, sessionId: string) => { void [qr, sessionId]; });
ev.prependListener('app.done', () => {}).many('app.done', 2, () => {}).offAny();
const subscription: EventSubscription = ev.on('app.done', () => {}, { objectify: true });
subscription.off();
ev.emit('app.done', 1, 'two', { three: 3 });
const results: Promise<any[]> = ev.emitAsync('app.done', 1, 'two');
void results;
const waiter = ev.waitFor('app.done', { timeout: 100, filter: value => value > 0 });
waiter.cancel();
const program = Effect.scoped(Effect.gen(function* () {
  yield* ev.onScoped('message.*', (payload, sessionId: string) => Effect.sync(() => { void [payload, sessionId]; }));
  yield* ev.onAnyScoped((event, ...args) => { void [event, args]; });
  const emitted: boolean = yield* ev.emitEffect('message.received', {}, 'support', 'message.received');
  return emitted;
}));
void program;

const raw: PubSub.PubSub<EventEmission> = ev.pubsub({ strategy: 'sliding', capacity: 256 });
const queued = Effect.scoped(Effect.gen(function* () {
  const subscription = yield* PubSub.subscribe(raw);
  const frame: EventEmission = yield* PubSub.take(subscription);
  return frame.args;
}));
void queued;
const events = new HyperEmitter<{ message: { id: string }; ready: boolean }>();
const native = events.stream().pipe(Stream.map(frame => {
  if (frame.event === 'message') return frame.payload.id;
  return String(frame.payload);
}));
void native;
