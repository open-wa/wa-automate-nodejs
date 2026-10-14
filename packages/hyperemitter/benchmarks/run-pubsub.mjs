import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { cpus } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { Deferred, Effect, Exit, PubSub, Scope } from 'effect';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const require = createRequire(join(root, 'packages/hyperemitter/package.json'));
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i < 0 ? fallback : process.argv[i + 1]; };
const rounds = Number(arg('--rounds', '7'));
const output = resolve(arg('--output', 'packages/hyperemitter/benchmarks/results/pubsub-node-2026-10-14.json'));
const frozen = JSON.parse(await readFile(new URL('./results/effect-fair-comparison-node-2026-10-14.json', import.meta.url), 'utf8'));
const scratch = await mkdtemp(join(root, 'node_modules/.cache/pubsub-benchmark-'));

// Benchmark candidate: one bounded broadcast hub, persistent scoped consumer
// per listener, and completion acknowledgements after listener work finishes.
class PubSubEmitter {
  constructor() { this.scope = Scope.makeUnsafe(); this.count = 0; }
  static async make(batched = false) {
    const self = new PubSubEmitter();
    self.batched = batched;
    self.hub = await Effect.runPromise(PubSub.bounded(256));
    return self;
  }
  async on(pattern, listener) {
    const self = this;
    const matches = event => pattern === event || (pattern.endsWith('.#') && (event === pattern.slice(0, -2) || event.startsWith(pattern.slice(0, -1))));
    await Effect.runPromise(Effect.gen(function* () {
      const sub = yield* PubSub.subscribe(self.hub).pipe(Scope.provide(self.scope));
      const consume = Effect.suspend(() => {
        const take = self.batched ? PubSub.takeBetween(sub, 1, 256) : PubSub.take(sub).pipe(Effect.map(frame => [frame]));
        return take.pipe(Effect.flatMap(frames => {
          const loop = (start) => Effect.suspend(() => {
            for (let i = start; i < frames.length; i++) {
              const frame = frames[i];
              if (!matches(frame.event)) continue;
              const result = listener(frame.value);
              const acknowledge = () => --frame.completion.remaining === 0
                ? Deferred.succeed(frame.completion.done, undefined) : Effect.void;
              if (Effect.isEffect(result) || (result && typeof result.then === 'function')) {
                const work = Effect.isEffect(result) ? result : Effect.tryPromise({ try: () => result, catch: e => e });
                return work.pipe(Effect.andThen(acknowledge), Effect.andThen(() => loop(i + 1)));
              }
              if (--frame.completion.remaining === 0) {
                return Deferred.succeed(frame.completion.done, undefined).pipe(Effect.andThen(() => loop(i + 1)));
              }
            }
            return Effect.void;
          });
          return loop(0);
        }));
      });
      yield* Effect.forkIn(Effect.forever(consume), self.scope, { startImmediately: true });
      self.count++;
    }));
  }
  emitEffect(event, value) {
    const self = this;
    return Effect.gen(function* () {
      const done = yield* Deferred.make();
      yield* PubSub.publish(self.hub, { event, value, completion: { remaining: self.count, done } });
      if (self.count) yield* Deferred.await(done);
    });
  }
  emitAllEffect(event, values) {
    const self = this;
    return Effect.gen(function* () {
      const done = yield* Deferred.make();
      const completion = { remaining: self.count * values.length, done };
      yield* PubSub.publishAll(self.hub, values.map(value => ({ event, value, completion })));
      if (completion.remaining) yield* Deferred.await(done);
    });
  }
  close() { return Scope.close(this.scope, Exit.void).pipe(Effect.andThen(PubSub.shutdown(this.hub))); }
}

async function compile(snapshot, name) {
  const dir = join(scratch, name);
  for (const [file, contents] of Object.entries(snapshot.sourceFiles)) {
    const target = join(dir, file); await mkdir(dirname(target), { recursive: true }); await writeFile(target, contents);
  }
  const outfile = join(scratch, `${name}.mjs`);
  await build({ entryPoints: [join(dir, 'index.ts')], outfile, bundle: true, packages: 'external', platform: 'node', format: 'esm', target: 'node22', logLevel: 'silent', plugins: [{ name: 'logger', setup(c) { c.onResolve({ filter: /^@open-wa\/logger$/ }, () => ({ path: require.resolve('@open-wa/logger'), external: true })); } }] });
  const module = await import(pathToFileURL(outfile).href);
  return { name, HyperEmitter: name === 'public-event-emitter' ? module.EventEmitter : module.HyperEmitter, sourceSha256: snapshot.sourceSha256, sourceFiles: snapshot.sourceFiles };
}
const scenarios = [];
for (const kind of ['callback', 'effect', 'promise']) {
  for (const listeners of [1, 16]) {
    for (const mode of ['await-event', 'pipeline-256']) {
      scenarios.push({ name: `${mode}-${kind}-${listeners}`, kind, listeners, mode, iterations: kind === 'promise' ? 4096 : 16384 });
    }
  }
}
scenarios.push({ name: 'await-event-wildcard-callback-1', kind: 'callback', listeners: 1, mode: 'await-event', wildcard: true, iterations: 16384 });

async function batch(impl, scenario) {
  const emitter = impl.name.startsWith('pubsub-') ? await PubSubEmitter.make(impl.name.endsWith('-batched')) : new impl.HyperEmitter({ captureRejections: false });
  let delivered = 0, checksum = 0, completion;
  const order = new Array(scenario.listeners).fill(-1);
  let ordered = true;
  const receive = (listener, value) => {
    ordered &&= value === order[listener] + 1;
    order[listener] = value; delivered++; checksum += value;
    if (completion && --completion.remaining === 0) return Deferred.succeed(completion.done, undefined);
  };
  const event = scenario.wildcard ? 'message.received.live' : 'message.received';
  for (let l = 0; l < scenario.listeners; l++) {
    const handler = scenario.kind === 'effect'
      ? value => Effect.suspend(() => { const done = receive(l, value); return done ?? Effect.void; })
      : scenario.kind === 'promise'
        ? value => Promise.resolve().then(() => {
            const done = receive(l, value);
            if (done) Effect.runSync(done);
          })
        : value => receive(l, value);
    await emitter.on(scenario.wildcard ? (impl.name === 'public-event-emitter' ? 'message.**' : 'message.#') : event, handler);
  }
  return {
    run: () => Effect.runPromise(Effect.gen(function* () {
      if (scenario.mode === 'await-event') {
        for (let i = 0; i < scenario.iterations; i++) yield* emitter.emitEffect(event, i);
      } else {
        for (let start = 0; start < scenario.iterations; start += 256) {
          const count = Math.min(256, scenario.iterations - start);
          if (emitter.emitAllEffect) {
            yield* emitter.emitAllEffect(event, Array.from({ length: count }, (_, i) => start + i));
          } else {
            const done = yield* Deferred.make();
            completion = { remaining: count * scenario.listeners, done };
            for (let i = start; i < start + count; i++) emitter.emit(event, i);
            yield* Deferred.await(done);
            completion = undefined;
          }
        }
      }
    })),
    verify() {
      assert.equal(delivered, scenario.iterations * scenario.listeners, 'completed deliveries');
      assert.equal(checksum, scenario.iterations * (scenario.iterations - 1) / 2 * scenario.listeners, 'payload checksum');
      assert(ordered, 'per-listener FIFO order');
    },
    close: () => Effect.runPromise(emitter.close()),
  };
}
async function measure(impl, scenario) {
  const b = await batch(impl, scenario); globalThis.gc?.();
  const cpuStart = process.cpuUsage(); const start = performance.now();
  try {
    await b.run(); const ms = performance.now() - start; const cpu = process.cpuUsage(cpuStart);
    b.verify(); return { durationMs: ms, cpuMs: (cpu.user + cpu.system) / 1000 };
  } finally { await b.close(); }
}
async function currentSnapshot() {
  const directory = join(root, 'packages/hyperemitter/src');
  const sourceFiles = {};
  const visit = async dir => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.name.endsWith('.ts')) sourceFiles[relative(directory, path)] = await readFile(path, 'utf8');
    }
  };
  await visit(directory);
  const hash = createHash('sha256');
  for (const path of Object.keys(sourceFiles).sort()) hash.update(path).update(sourceFiles[path]);
  return { sourceFiles, sourceSha256: hash.digest('hex') };
}
try {
  const current = await currentSnapshot();
  const implementations = [
    await compile(current, 'tuned-hybrid'),
    await compile(current, 'public-event-emitter'),
    await compile(frozen.implementations.find(i => i.name === 'effect-dispatcher'), 'tuned-full-effect'),
    { name: 'pubsub-bounded-256-batched', sourceSha256: createHash('sha256').update(PubSubEmitter.toString()).digest('hex'), source: PubSubEmitter.toString() },
    { name: 'pubsub-bounded-256', sourceSha256: createHash('sha256').update(PubSubEmitter.toString()).digest('hex'), source: PubSubEmitter.toString() },
  ];
  const results = [];
  for (const scenario of scenarios) {
    const samples = new Map(implementations.map(i => [i.name, []]));
    for (const impl of implementations) for (let w = 0; w < 2; w++) await measure(impl, scenario);
    for (let r = 0; r < rounds; r++) {
      const offset = r % implementations.length;
      for (const impl of [...implementations.slice(offset), ...implementations.slice(0, offset)]) samples.get(impl.name).push(await measure(impl, scenario));
    }
    const measurements = implementations.map(impl => {
      const raw = samples.get(impl.name); const times = raw.map(s => s.durationMs).sort((a,b) => a-b);
      const medianMs = times[Math.floor(times.length / 2)];
      return { implementation: impl.name, medianMs, operationsPerSecond: Math.round(scenario.iterations / medianMs * 1000), nanosecondsPerOperation: medianMs / scenario.iterations * 1e6, minMs: times[0], maxMs: times.at(-1), samples: raw };
    });
    results.push({ ...scenario, measurements });
    console.log(`${scenario.name}: ${measurements.map(m => `${m.implementation}=${m.operationsPerSecond}/s`).join(', ')}`);
  }
  // Demonstrate whether publish completion also means synchronous delivery.
  const probe = await PubSubEmitter.make(); let received = 0;
  await probe.on('probe', () => { received++; });
  const done = Deferred.makeUnsafe();
  const published = Effect.runSync(PubSub.publish(probe.hub, { event: 'probe', value: 1, completion: { remaining: 1, done } }));
  const beforeReturn = received;
  await Effect.runPromise(Deferred.await(done));
  await Effect.runPromise(probe.close());
  const report = { benchmark: 'hyperemitter-pubsub-completed-delivery', recordedAt: new Date().toISOString(), node: process.version, effect: require('effect/package.json').version, cpu: cpus()[0]?.model, rounds, warmupBatches: 2, implementations: implementations.map(({ HyperEmitter, ...i }) => i), synchronousProbe: { published, completedBeforePublishReturned: beforeReturn, completedAfterAwait: received }, notes: ['Every measurement waits for completed listener work and verifies delivery counts, checksums, and FIFO order.', 'Bounded PubSub capacity 256, replay 0, backpressure enabled, one persistent scoped consumer fiber per listener. No dropping or sliding.', 'Await-event acknowledges every event. Pipeline-256 publishes chunks with one completion barrier; hybrid uses direct emit and the same chunk barrier.', 'Construction, registration, explicit GC, correctness assertions, and scoped worker shutdown are outside timing.', 'The hybrid and public emitter use frozen current source. The full dispatcher comes from the earlier fair comparison. No stale dist bundles are used.', 'Throughput is per event, not per callback. This is a local batch benchmark, not application latency.'], results };
  await mkdir(dirname(output), { recursive: true }); await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Saved ${output}`);
} finally { await rm(scratch, { recursive: true, force: true }); }
