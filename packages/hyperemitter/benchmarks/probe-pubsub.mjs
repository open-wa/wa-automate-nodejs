import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { Deferred, Effect } from 'effect';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const reportPath = new URL('./results/pubsub-node-2026-10-14.json', import.meta.url);
const report = JSON.parse(await readFile(reportPath, 'utf8'));
const require = createRequire(join(root, 'packages/hyperemitter/package.json'));
const scratch = await mkdtemp(join(root, 'node_modules/.cache/pubsub-semantics-'));
try {
  // Reproduce the exact PubSub candidate from the recorded benchmark.
  const candidate = join(scratch, 'candidate.mjs');
  await writeFile(candidate, `import { Deferred, Effect, Exit, PubSub, Scope } from 'effect';\nexport ${report.implementations.find(i => i.name === 'pubsub-bounded-256-batched').source}\n`);
  const { PubSubEmitter } = await import(pathToFileURL(candidate).href);
  const outfile = join(scratch, 'hyper.mjs');
  await build({ entryPoints: [join(root, 'packages/hyperemitter/src/index.ts')], outfile, bundle: true, packages: 'external', platform: 'node', format: 'esm', logLevel: 'silent', plugins: [{ name: 'logger', setup(c) { c.onResolve({ filter: /^@open-wa\/logger$/ }, () => ({ path: require.resolve('@open-wa/logger'), external: true })); } }] });
  const { EventEmitter } = await import(pathToFileURL(outfile).href);
  const pubsub = await PubSubEmitter.make(true);
  const gate = Deferred.makeUnsafe(), firstStarted = Deferred.makeUnsafe();
  let started = 0;
  await pubsub.on('probe', () => {
    started++;
    return started === 1 ? Deferred.succeed(firstStarted, undefined).pipe(Effect.andThen(Deferred.await(gate))) : Effect.void;
  });
  const firstDone = Deferred.makeUnsafe(), secondDone = Deferred.makeUnsafe();
  const { PubSub } = await import('effect');
  Effect.runSync(PubSub.publish(pubsub.hub, { event: 'probe', value: 1, completion: { remaining: 1, done: firstDone } }));
  await Effect.runPromise(Deferred.await(firstStarted));
  const publishedSecond = Effect.runSync(PubSub.publish(pubsub.hub, { event: 'probe', value: 2, completion: { remaining: 1, done: secondDone } }));
  const beforeReturn = started;
  assert.equal(beforeReturn, 1, 'A busy queued consumer must not process event 2 before finishing event 1');
  await Effect.runPromise(Deferred.succeed(gate, undefined).pipe(Effect.andThen(Deferred.await(firstDone)), Effect.andThen(Deferred.await(secondDone))));
  assert.equal(started, 2);
  await Effect.runPromise(pubsub.close());

  const emitter = new EventEmitter(); const callbackGate = Deferred.makeUnsafe(); let callbackStarted = 0;
  emitter.on('probe', () => { callbackStarted++; return callbackStarted === 1 ? Deferred.await(callbackGate) : undefined; });
  emitter.emit('probe', 1); emitter.emit('probe', 2);
  assert.equal(callbackStarted, 2, 'The public emitter invokes the next callback even with previous async work outstanding');
  await Effect.runPromise(Deferred.succeed(callbackGate, undefined));
  await Effect.runPromise(emitter.close());
  report.busySubscriberProbe = { recordedAt: new Date().toISOString(), pubsub: { publishedSecond, listenerInvocationsBeforeSecondPublishReturned: beforeReturn, listenerInvocationsAfterDrain: started }, publicEmitter: { listenerInvocationsBeforeSecondEmitReturned: callbackStarted } };
  report.notes.push('A ready consumer can execute before publish returns; publishing does not guarantee callback dispatch. The busy-subscriber probe demonstrates queued serialization versus immediate public callback invocation.');
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report.busySubscriberProbe));
} finally { await rm(scratch, { recursive: true, force: true }); }
