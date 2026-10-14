import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { cpus } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { EventEmitter } from 'node:events';
import { build } from 'esbuild';
import { Deferred, Effect, Exit, Scope, Stream } from 'effect';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const require = createRequire(import.meta.url);
const workspaceRequire = createRequire(join(root, 'packages/hyperemitter/package.json'));
const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
};
const rounds = Number(option('--rounds', '7'));
const scale = Number(option('--scale', '1'));
const baselineRef = option('--baseline-ref', 'edf0e755da222b162d88980ba39dc0b1bc0e7419');
const comparisonSource = option('--compare-source', null);
const prototypeSource = option('--prototype-source', null);
const optimizedAwareSource = option('--optimized-aware-source', null);
const output = option('--output', null);
const fullSource = option('--full-source', null);
assert(Number.isInteger(rounds) && rounds >= 3, '--rounds must be at least 3');
assert(Number.isFinite(scale) && scale > 0, '--scale must be positive');

const cache = join(root, 'node_modules/.cache');
await mkdir(cache, { recursive: true });
const scratch = await mkdtemp(join(cache, 'hyperemitter-benchmark-'));

const filesUnder = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(path));
    else if (entry.name.endsWith('.ts')) files.push(path);
  }
  return files.sort();
};

const sourceHash = async (directory) => {
  const hash = createHash('sha256');
  for (const file of await filesUnder(directory)) {
    hash.update(relative(directory, file));
    hash.update(await readFile(file));
  }
  return hash.digest('hex');
};

const compile = async (name, directory) => {
  const frozen = join(scratch, `${name}-src`);
  const sourceFiles = {};
  for (const file of await filesUnder(directory)) {
    const path = relative(directory, file);
    const contents = await readFile(file, 'utf8');
    sourceFiles[path] = contents;
    const target = join(frozen, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents);
  }
  const outfile = join(scratch, `${name}.mjs`);
  await build({
    absWorkingDir: root,
    entryPoints: [join(frozen, 'index.ts')],
    outfile,
    bundle: true,
    packages: 'external',
    platform: 'node',
    format: 'esm',
    target: 'node22',
    logLevel: 'silent',
    plugins: [{
      name: 'workspace-logger',
      setup(context) {
        context.onResolve({ filter: /^@open-wa\/logger$/ }, () => ({
          path: workspaceRequire.resolve('@open-wa/logger'),
          external: true,
        }));
      },
    }],
  });
  const { HyperEmitter, EventEmitter } = await import(pathToFileURL(outfile).href);
  return { name, HyperEmitter, EventEmitter, sourceSha256: await sourceHash(frozen), sourceFiles };
};

const restoreBaseline = async () => {
  const directory = join(scratch, 'baseline-src');
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', baselineRef, '--', 'packages/hyperemitter/src'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
  for (const file of files) {
    const target = join(directory, relative('packages/hyperemitter/src', file));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, execFileSync('git', ['show', `${baselineRef}:${file}`], { cwd: root }));
  }
  return directory;
};

const scenarios = [
  { name: 'sync-empty', mode: 'sync', listeners: 0, iterations: 100_000 },
  { name: 'sync-exact-1', mode: 'sync', listeners: 1, iterations: 100_000 },
  { name: 'sync-exact-capture-1', mode: 'sync', listeners: 1, capture: true, iterations: 100_000 },
  { name: 'sync-wildcard-1', mode: 'sync', listeners: 1, wildcard: true, iterations: 100_000 },
  { name: 'sync-fanout-16', mode: 'sync', listeners: 16, iterations: 10_000 },
  { name: 'sync-fanout-capture-16', mode: 'sync', listeners: 16, capture: true, iterations: 10_000 },
  { name: 'sync-effect-listener-1', mode: 'fork', listeners: 1, iterations: 10_000 },
  { name: 'effect-callback-1', mode: 'await-callback', listeners: 1, iterations: 10_000 },
  { name: 'effect-callback-fanout-16', mode: 'await-callback', listeners: 16, capture: true, iterations: 10_000 },
  { name: 'effect-listener-1', mode: 'await-effect', listeners: 1, iterations: 10_000 },
  { name: 'effect-listener-fanout-16', mode: 'await-effect', listeners: 16, capture: true, iterations: 2_000 },
  { name: 'effect-promise-listener-1', mode: 'await-promise', listeners: 1, iterations: 2_000 },
  { name: 'effect-promise-fanout-16', mode: 'await-promise', listeners: 16, capture: true, iterations: 500 },
  { name: 'scoped-subscribe-emit-close', mode: 'scope', listeners: 1, iterations: 1_000 },
  { name: 'scoped-effect-interrupt', mode: 'scope-effect', listeners: 1, capture: true, iterations: 500 },
  { name: 'sync-with-queued-observer-burst', mode: 'queued-callback', listeners: 1, iterations: 10_000 },
  { name: 'sync-queued-only-burst', mode: 'queued-only', listeners: 0, iterations: 10_000 },
  { name: 'effect-with-queued-observer-burst', mode: 'queued-effect', listeners: 1, iterations: 10_000 },
].map(scenario => ({ ...scenario, iterations: Math.max(1, Math.round(scenario.iterations * scale)) }));

const makeBatch = (implementation, scenario, iterations) => {
  if (scenario.wildcard && implementation.name === 'node-eventemitter') return null;
  const emitter = implementation.HyperEmitter
    ? new implementation.HyperEmitter({ captureRejections: scenario.capture ?? false })
    : new EventEmitter().setMaxListeners(0);
  if (scenario.mode !== 'sync' && !emitter.emitEffect) return null;
  if (scenario.mode.startsWith('queued') && !emitter.stream) return null;
  let delivered = 0;
  let checksum = 0;
  const receive = value => { delivered += 1; checksum += value; };
  const event = scenario.wildcard ? 'message.received.live' : 'message.received';
  for (let listener = 0; listener < scenario.listeners && !scenario.mode.startsWith('scope'); listener++) {
    const handler = scenario.mode === 'fork' || scenario.mode === 'await-effect'
      ? value => Effect.sync(() => receive(value))
      : scenario.mode === 'await-promise'
        ? value => Promise.resolve().then(() => receive(value))
        : receive;
    emitter.on(scenario.wildcard ? (implementation.public ? 'message.**' : 'message.#') : event, handler);
  }
  let observerCount = 0, observerChecksum = 0, observerFIFO = true;
  let observerScope, observerDone;
  if (scenario.mode.startsWith('queued')) {
    observerScope = Scope.makeUnsafe(); observerDone = Deferred.makeUnsafe();
    const consume = emitter.stream().pipe(Stream.take(iterations), Stream.runForEach(frame => Effect.sync(() => {
      const value = implementation.public ? frame.args[0] : frame.payload;
      observerFIFO &&= value === observerCount;
      observerCount++; observerChecksum += value;
    })), Effect.andThen(Deferred.succeed(observerDone, undefined)));
    Effect.runSync(Effect.forkIn(consume, observerScope, { startImmediately: true }));
  }
  const run = scenario.mode.startsWith('queued')
    ? () => Effect.runPromise(Effect.gen(function* () {
        for (let index = 0; index < iterations; index++) {
          if (scenario.mode === 'queued-effect') yield* emitter.emitEffect(event, index);
          else emitter.emit(event, index);
        }
        yield* Deferred.await(observerDone);
      }))
    : scenario.mode === 'sync' || scenario.mode === 'fork'
    ? () => { for (let index = 0; index < iterations; index++) emitter.emit(event, index); }
    : scenario.mode === 'scope-effect'
      ? async () => {
          for (let index = 0; index < iterations; index++) {
            const scope = Scope.makeUnsafe();
            Effect.runSync(emitter.onScoped(event, value => Effect.never.pipe(
              Effect.ensuring(Effect.sync(() => receive(value))),
            )).pipe(Scope.provide(scope)));
            emitter.emit(event, index);
            await Effect.runPromise(Scope.close(scope, Exit.void));
          }
        }
      : scenario.mode === 'scope'
      ? () => {
          for (let index = 0; index < iterations; index++) {
            const scope = Scope.makeUnsafe();
            Effect.runSync(emitter.onScoped(event, receive).pipe(Scope.provide(scope)));
            emitter.emit(event, index);
            Effect.runSync(Scope.close(scope, Exit.void));
          }
        }
      : () => Effect.runPromise(Effect.gen(function* () {
          for (let index = 0; index < iterations; index++) yield* emitter.emitEffect(event, index);
        }));
  return {
    run,
    verify() {
      assert.equal(delivered, iterations * scenario.listeners, `${implementation.name}/${scenario.name}: delivery count`);
      assert.equal(checksum, iterations * (iterations - 1) / 2 * scenario.listeners, `${implementation.name}/${scenario.name}: payload checksum`);
      if (scenario.mode.startsWith('queued')) {
        assert.equal(observerCount, iterations, 'Queued observation delivery count');
        assert.equal(observerChecksum, iterations * (iterations - 1) / 2, 'Queued observation checksum');
        assert(observerFIFO, 'Queued observations must remain FIFO');
      }
      if (scenario.mode.startsWith('scope')) assert.equal(emitter.listenerCount(event), 0, 'Scoped registrations leaked');
    },
    async close() {
      if (observerScope) await Effect.runPromise(Scope.close(observerScope, Exit.void));
      if (emitter.close) await Effect.runPromise(emitter.close());
      else emitter.removeAllListeners();
    },
  };
};

const measure = async (implementation, scenario, iterations) => {
  const batch = makeBatch(implementation, scenario, iterations);
  if (!batch) return null;
  globalThis.gc?.();
  const cpuStart = process.cpuUsage();
  const startedAt = performance.now();
  await batch.run();
  const durationMs = performance.now() - startedAt;
  const cpu = process.cpuUsage(cpuStart);
  try { batch.verify(); } finally { await batch.close(); }
  return { durationMs, cpuMs: (cpu.user + cpu.system) / 1000 };
};

try {
  const baselineDirectory = await restoreBaseline();
  const current = await compile('tuned-hybrid', join(root, 'packages/hyperemitter/src'));
  const implementations = [
    { name: 'node-eventemitter', sourceSha256: null },
    await compile('callback-baseline', baselineDirectory),
    ...(comparisonSource ? [await compile('effect-aware-snapshot', resolve(comparisonSource))] : []),
    ...(prototypeSource ? [await compile('effect-prototype-snapshot', resolve(prototypeSource))] : []),
    ...(optimizedAwareSource ? [await compile('effect-aware-optimized', resolve(optimizedAwareSource))] : []),
    ...(fullSource ? [await compile('tuned-full-effect', resolve(fullSource))] : []),
    current,
    { ...current, name: 'public-event-emitter', HyperEmitter: current.EventEmitter, public: true },
  ];
  const results = [];
  for (const scenario of scenarios) {
    const samples = new Map(implementations.map(implementation => [implementation.name, []]));
    for (const implementation of implementations) {
      for (let warmup = 0; warmup < 2; warmup++) await measure(implementation, scenario, scenario.iterations);
    }
    for (let round = 0; round < rounds; round++) {
      // Rotate the starting implementation so one version is not always measured first.
      const ordered = [...implementations.slice(round % implementations.length), ...implementations.slice(0, round % implementations.length)];
      for (const implementation of ordered) {
        const sample = await measure(implementation, scenario, scenario.iterations);
        if (sample !== null) samples.get(implementation.name).push(sample);
      }
    }
    const measurements = implementations.map(({ name }) => {
      const raw = samples.get(name);
      const values = raw.map(sample => sample.durationMs).sort((left, right) => left - right);
      if (!values.length) return { implementation: name, supported: false };
      const medianMs = values[Math.floor(values.length / 2)];
      const cpuValues = raw.map(sample => sample.cpuMs).sort((left, right) => left - right);
      return {
        implementation: name,
        supported: true,
        medianMs,
        minMs: values[0],
        maxMs: values.at(-1),
        operationsPerSecond: Math.round(scenario.iterations / medianMs * 1000),
        nanosecondsPerOperation: medianMs / scenario.iterations * 1_000_000,
        samplesMs: values,
        medianCpuMs: cpuValues[Math.floor(cpuValues.length / 2)],
        samples: raw,
      };
    });
    results.push({ ...scenario, measurements });
    console.log(`${scenario.name}: ${measurements.filter(value => value.supported).map(value => `${value.implementation}=${value.operationsPerSecond.toLocaleString('en-US')}/s`).join(', ')}`);
  }
  const report = {
    benchmark: 'hyperemitter-effect-dispatch',
    recordedAt: new Date().toISOString(),
    node: process.version,
    effect: require('effect/package.json').version,
    platform: `${process.platform}-${process.arch}`,
    cpu: cpus()[0]?.model,
    baselineCommit: execFileSync('git', ['rev-parse', baselineRef], { cwd: root, encoding: 'utf8' }).trim(),
    rounds,
    warmupBatches: 2,
    gcExposed: typeof globalThis.gc === 'function',
    implementations: implementations.map(({ name, sourceSha256, sourceFiles }) => ({ name, sourceSha256, sourceFiles })),
    notes: [
      'Current source and frozen baseline sources are bundled to temporary ESM files and executed by plain Node.',
      'Dependencies are external: all HyperEmitter variants use the same installed Effect and logger packages.',
      'Creation, registration, delivery-count/checksum checks, GC, and teardown are outside timing, except the scoped churn scenario.',
      'Async scenarios wait for completed listener work; queued burst scenarios also wait for their Stream observer and verify count, checksum, and FIFO; scoped churn verifies zero remaining registrations.',
      'Effect await scenarios use one root Effect runtime per batch; synchronous hybrid dispatch enters Effect only for async listener work.',
      'Numbers are per-event batch medians, not per-callback or application end-to-end latency.',
      'Unsupported features are omitted rather than approximated with compatibility wrappers.',
    ],
    results,
  };
  if (output) {
    const outputPath = resolve(output);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Saved ${outputPath}`);
  }
} finally {
  await rm(scratch, { recursive: true, force: true });
}
