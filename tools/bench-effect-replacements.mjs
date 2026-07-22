import { build } from 'esbuild';
import { Effect, Fiber, PubSub, Schema } from 'effect';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { z } from 'zod';
import { HyperEmitter } from '../packages/hyperemitter/dist/index.cjs';

const schemaIterations = 100_000;
const eventIterations = 10_000;
const event = {
  event: 'message.received',
  sessionId: 'benchmark',
  timestamp: 1,
  payload: { body: 'hello' },
};
const effectSchema = Schema.Struct({
  event: Schema.String,
  sessionId: Schema.String,
  timestamp: Schema.Number,
  payload: Schema.Unknown,
});
const effectDecode = Schema.decodeUnknownSync(effectSchema);
const zodSchema = z.object({
  event: z.string(),
  sessionId: z.string(),
  timestamp: z.number(),
  payload: z.unknown(),
});

const measure = async (iterations, run) => {
  await run();
  const startedAt = performance.now();
  await run();
  const durationMs = performance.now() - startedAt;
  return {
    iterations,
    durationMs: Number(durationMs.toFixed(2)),
    operationsPerSecond: Math.round(iterations / (durationMs / 1000)),
  };
};

const effectSchemaResult = await measure(schemaIterations, () => {
  for (let index = 0; index < schemaIterations; index += 1) effectDecode(event);
});
const zodSchemaResult = await measure(schemaIterations, () => {
  for (let index = 0; index < schemaIterations; index += 1) zodSchema.parse(event);
});

const hyperEmitterResult = await measure(eventIterations, async () => {
  const emitter = new HyperEmitter({ captureRejections: true });
  let delivered = 0;
  emitter.on('message.received', () => { delivered += 1; });
  for (let index = 0; index < eventIterations; index += 1) {
    emitter.emit('message.received', index);
  }
  if (delivered !== eventIterations) throw new Error('HyperEmitter lost an event');
});
const effectPubSubResult = await measure(eventIterations, () => Effect.runPromise(
  Effect.scoped(Effect.gen(function* () {
    const pubsub = yield* PubSub.unbounded();
    const subscription = yield* PubSub.subscribe(pubsub);
    const consumer = yield* Effect.forEach(
      Array.from({ length: eventIterations }),
      () => PubSub.take(subscription),
      { discard: true },
    ).pipe(Effect.forkChild);
    yield* Effect.forEach(
      Array.from({ length: eventIterations }, (_, index) => index),
      (value) => PubSub.publish(pubsub, value),
      { discard: true },
    );
    yield* Fiber.join(consumer);
  })),
));

const bundleBytes = async (contents) => {
  const result = await build({
    absWorkingDir: process.cwd(),
    bundle: true,
    format: 'esm',
    minify: true,
    platform: 'browser',
    plugins: [{
      name: 'openwa-logger-stub',
      setup(context) {
        context.onResolve({ filter: /^@open-wa\/logger$/ }, () => ({
          path: 'logger-stub',
          namespace: 'openwa-benchmark',
        }));
        context.onLoad({ filter: /.*/, namespace: 'openwa-benchmark' }, () => ({
          contents: `export const createLogger = () => ({ debug() {}, info() {}, warn() {}, error() {}, withContext() { return this; } });`,
          loader: 'js',
        }));
      },
    }],
    stdin: { contents, loader: 'ts', resolveDir: process.cwd() },
    treeShaking: true,
    write: false,
  });
  return result.outputFiles.reduce((total, file) => total + file.contents.byteLength, 0);
};

const bundles = {
  schema: {
    effectBytes: await bundleBytes(`
      import { Schema } from 'effect';
      const Contract = Schema.Struct({ event: Schema.String, sessionId: Schema.String, timestamp: Schema.Number, payload: Schema.Unknown });
      export const decode = Schema.decodeUnknownSync(Contract);
    `),
    zodBytes: await bundleBytes(`
      import { z } from 'zod';
      const Contract = z.object({ event: z.string(), sessionId: z.string(), timestamp: z.number(), payload: z.unknown() });
      export const decode = (input) => Contract.parse(input);
    `),
  },
  events: {
    effectBytes: await bundleBytes(`
      import { PubSub, Stream } from 'effect';
      export const makePipeline = (capacity) => PubSub.bounded(capacity).pipe(Stream.fromPubSub);
    `),
    hyperEmitterBytes: await bundleBytes(`
      import { HyperEmitter } from './packages/hyperemitter/src/index.ts';
      export const makeEmitter = () => new HyperEmitter({ captureRejections: true });
    `),
  },
  declaration: {
    effectHttpRpcBytes: await bundleBytes(`
      import { Schema } from 'effect';
      import { HttpApi, HttpApiEndpoint, HttpApiGroup } from 'effect/unstable/httpapi';
      import { Rpc } from 'effect/unstable/rpc';
      const Health = Schema.Struct({ ready: Schema.Boolean });
      export const Api = HttpApi.make('openwa').add(HttpApiGroup.make('runtime').add(HttpApiEndpoint.get('health', '/health', { success: Health })));
      export const Ask = Rpc.make('openwa.ask', { payload: { method: Schema.String, args: Schema.Array(Schema.Unknown) }, success: Schema.Unknown });
    `),
    handAuthoredBytes: await bundleBytes(`
      export const Api = { runtime: { health: { method: 'GET', path: '/health', success: { ready: 'boolean' } } } };
      export const Ask = { tag: 'openwa.ask', payload: { method: 'string', args: 'unknown[]' }, success: 'unknown' };
    `),
  },
};

const report = {
  benchmark: 'effect-v4-replacement-spikes',
  recordedAt: new Date().toISOString(),
  effect: '4.0.0-beta.100',
  runtime: `${process.version}-${process.platform}-${process.arch}`,
  performance: {
    schemaDecode: { effect: effectSchemaResult, zod: zodSchemaResult },
    eventFanout: { effectPubSub: effectPubSubResult, hyperEmitter: hyperEmitterResult },
  },
  bundles,
};

const output = `${JSON.stringify(report, null, 2)}\n`;
const outputFlag = process.argv.indexOf('--output');
if (outputFlag !== -1) {
  const outputPath = resolve(process.argv[outputFlag + 1]);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output);
}
console.log(output);
