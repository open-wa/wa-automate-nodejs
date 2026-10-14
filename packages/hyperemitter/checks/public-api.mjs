import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { Deferred, Effect, Exit, Fiber, PubSub, Scope, Stream } from 'effect';
import { EventEmitter as NodeEmitter } from 'node:events';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const require = createRequire(join(root, 'packages/core/package.json'));
// Reference is only loaded by this manual contract check, never by SDK code.
const referenceIndex = process.argv.indexOf('--reference');
const referencePath = referenceIndex < 0 ? 'eventemitter2' : process.argv[referenceIndex + 1];
const { EventEmitter2 } = require(referencePath);
const referenceVersion = JSON.parse(await readFile(join(dirname(require.resolve(referencePath)), '../package.json'), 'utf8')).version;
assert.equal(referenceVersion, '6.4.9', 'Use the pinned EventEmitter2 6.4.9 reference');
const scratch = await mkdtemp(join(root, 'node_modules/.cache/emitter-api-'));
const evidence = [];
const bundleHashes = {};
const check = async (name, work) => { await work(); evidence.push(name); console.log(`PASS ${name}`); };
try {
  const compile = async (entry, name, format, extra = {}) => {
    const outfile = join(scratch, `${name}.${format === 'esm' ? 'mjs' : 'cjs'}`);
    await build({ entryPoints: [join(root, entry)], outfile, bundle: true, packages: 'external', platform: 'node', format, target: 'node22', logLevel: 'silent', plugins: [{ name: 'workspaces', setup(c) {
      c.onResolve({ filter: /^@open-wa\/hyperemitter$/ }, () => ({ path: join(root, 'packages/hyperemitter/src/index.ts') }));
      c.onResolve({ filter: /^@open-wa\/(logger|schema)$/ }, args => ({ path: require.resolve(args.path), external: true }));
    } }], ...extra });
    bundleHashes[`${name}-${format}`] = createHash('sha256').update(await readFile(outfile)).digest('hex');
    return format === 'esm' ? import(pathToFileURL(outfile).href) : require(outfile);
  };
  const { EventEmitter, HyperEmitter } = await compile('packages/hyperemitter/src/index.ts', 'hyper', 'esm');
  const globalESM = await compile('packages/core/src/events/globalEvents.ts', 'global', 'esm');
  const globalCJS = await compile('packages/core/src/events/globalEvents.ts', 'global', 'cjs');
  const fresh = () => new EventEmitter({ ignoreErrors: true });
  const reference = () => new EventEmitter2({ wildcard: true, delimiter: '.', ignoreErrors: true });
  const compare = async work => {
    // Verify the same callback API both with and without the optional hub enabled.
    for (const enablePubSub of [false, true]) {
      const old = reference(), current = fresh();
      if (enablePubSub) current.pubsub();
      try { assert.deepEqual(await work(current), await work(old)); }
      finally { await Effect.runPromise(current.close()); old.removeAllListeners(); old.offAny(); }
    }
  };

  await check('public method names', () => {
    const emitter = fresh();
    for (const name of ['emit', 'emitAsync', 'addListener', 'on', 'prependListener', 'once', 'prependOnceListener', 'many', 'prependMany', 'onAny', 'prependAny', 'offAny', 'removeListener', 'off', 'removeAllListeners', 'setMaxListeners', 'getMaxListeners', 'eventNames', 'listenerCount', 'listeners', 'listenersAny', 'waitFor', 'listenTo', 'stopListeningTo', 'hasListeners']) assert.equal(typeof emitter[name], 'function', name);
    return Effect.runPromise(emitter.close());
  });
  await check('synchronous variadic delivery, context, return values, fluent API', () => compare(e => {
    const seen = [];
    const fn = function(...args) { seen.push([this === e, this.event, args]); };
    assert.equal(e.on('app.job', fn), e);
    const first = e.emit('app.job', 1, 'two', { three: 3 });
    e.removeListener('app.job', fn);
    return { seen, first, empty: e.emit('absent'), count: e.listenerCount('app.job') };
  }));
  await check('wildcards: single, leading, middle, trailing, zero segments', () => compare(e => {
    const seen = [];
    for (const pattern of ['qr.*', 'qr.**', '**.support', 'app.**.done', '**', 'app.*.done']) e.on(pattern, function(value) { seen.push([pattern, this.event, value]); });
    for (const event of ['qr.support', 'qr', 'app.done', 'app.work.done', 'app.work.more.done', 'support']) e.emit(event, event);
    return seen;
  }));
  await check('any listeners run first, preserve duplicates, prepend and removal', () => compare(e => {
    const seen = []; const any = (name, ...args) => { seen.push(['any', name, args]); };
    e.on('a', x => { seen.push(['normal', x]); }); e.onAny(any); e.onAny(any);
    e.prependAny((name, x) => { seen.push(['first', name, x]); });
    e.emit('a', 7); const count = e.listenersAny().length;
    e.offAny(any); e.offAny(); e.emit('a', 8);
    return { seen, count, left: e.listenersAny().length };
  }));
  await check('once and many remove before recursive dispatch', () => compare(e => {
    const seen = [];
    e.once('a', value => { seen.push(['once', value]); e.emit('a', 2); });
    e.many('a', 2, value => { seen.push(['many', value]); });
    e.prependOnceListener('a', value => { seen.push(['prepend', value]); });
    e.emit('a', 1); e.emit('a', 3);
    return { seen, count: e.listenerCount('a') };
  }));
  await check('listener order and identity, eventNames, max listener configuration', () => compare(e => {
    const a = () => {}, b = () => {};
    e.on('x', a); e.prependListener('x', b); e.on('message.*', a);
    e.setMaxListeners(25);
    assert.throws(() => e.listeners(), /event name required/);
    assert.throws(() => e.listenerCount(), /event name required/);
    return { order: e.listeners('x').map(fn => fn === a ? 'a' : 'b'), count: e.listenerCount('x'), names: e.eventNames(), arrays: e.eventNames(true), max: e.getMaxListeners() };
  }));
  await check('emitAsync waits, returns resolved results in listener order', () => compare(async e => {
    const seen = [];
    e.onAny(() => 'any'); e.on('a', value => value + 1);
    e.on('a', async value => { await Promise.resolve(); seen.push(value); return value + 2; });
    return { result: await e.emitAsync('a', 3), seen };
  }));
  await check('emit and emitAsync expose callback failures; error event is ignored by ev', () => compare(async e => {
    const error = new Error('expected'); e.on('a', () => { throw error; });
    let sync = false, async = false;
    try { e.emit('a'); } catch (caught) { sync = caught === error; }
    try { await e.emitAsync('a'); } catch (caught) { async = caught === error; }
    return { sync, async, errorEmit: e.emit('error', error) };
  }));
  await check('namespace arrays and symbol identities', () => compare(e => {
    const symbol = Symbol.for('emitter-contract'); const seen = [];
    e.on(['app', symbol], function(...values) { seen.push([this.event, values]); });
    e.on(['app', 'done'], function(...values) { seen.push([this.event, values]); });
    e.emit(['app', symbol], 1, 2); e.emit('app.done', 3);
    return { seen, names: e.eventNames(true) };
  }));
  await check('objectified subscriptions and scheduled promisified callbacks', () => compare(async e => {
    const seen = [];
    const subscription = e.on('a', value => { seen.push(value); return value; }, { objectify: true, promisify: true });
    const results = await e.emitAsync('a', 4); subscription.off(); e.emit('a', 5);
    return { results, seen, left: e.listenerCount('a') };
  }));
  await check('waitFor filter, arguments, cancellation and timeout remove registrations', () => compare(async e => {
    const wait = e.waitFor('a', value => value > 1); e.emit('a', 1); e.emit('a', 2, 'ok');
    const values = await wait;
    const cancel = e.waitFor('b'); const canceled = cancel.catch(() => 'canceled'); cancel.cancel();
    const timeout = await e.waitFor('c', 5).catch(error => error.code);
    return { values, canceled: await canceled, timeout, left: ['a','b','c'].map(name => e.listenerCount(name)) };
  }));
  await check('listenTo mappings, reducers, stopListeningTo', () => compare(e => {
    const target = new NodeEmitter(); const seen = [];
    e.on('mapped', value => { seen.push(value); });
    e.listenTo(target, { original: 'mapped' }, { reducers: event => { event.data[0] *= 2; return event.data[0] > 2; } });
    target.emit('original', 1); target.emit('original', 2);
    const stopped = e.stopListeningTo(target); target.emit('original', 3);
    return { seen, stopped, left: target.listenerCount('original') };
  }));
  await check('wildcard queries and removeAllListeners preserve onAny registrations', () => compare(e => {
    const a = () => {}; e.on('app.one', a); e.on('app.two', a); e.onAny(a);
    const count = e.listeners('app.*').length; e.removeAllListeners('app.*');
    e.on('b', a); e.removeAllListeners();
    return { count, left: e.eventNames(), any: e.listenersAny().length };
  }));
  await check('Effect results, lazy emission, scoped cancellation and duplicate ownership', async () => {
    const e = fresh(); let count = 0, finalized = 0;
    const fn = () => { count++; }; e.on('a', fn);
    await Effect.runPromise(Effect.scoped(Effect.gen(function* () {
      yield* e.onScoped('a', fn); e.emit('a');
      yield* e.onScoped('work', () => Effect.never.pipe(Effect.ensuring(Effect.sync(() => { finalized++; }))));
      e.emit('work');
    })));
    e.emit('a'); assert.equal(count, 3); assert.equal(e.listenerCount('a'), 1); assert.equal(finalized, 1);
    e.on('effect', value => Effect.succeed(value * 2)); assert.deepEqual(await e.emitAsync('effect', 4), [8]);
    const lazy = e.emitEffect('a'); assert.equal(count, 3); await Effect.runPromise(lazy); assert.equal(count, 4);
    let anyCalls = 0;
    await Effect.runPromise(Effect.scoped(Effect.gen(function* () {
      yield* e.onAnyScoped(function(name, ...args) { assert.equal(this, e); anyCalls++; void [name, args]; });
      assert.equal(e.listenersAny().length, 1); e.emit('any', 1, 2);
    })));
    assert.equal(e.listenersAny().length, 0); e.emit('any', 3); assert.equal(anyCalls, 1);
    const abort = new AbortController(); e.on('abort', fn, { signal: abort.signal }); abort.abort(); assert.equal(e.listenerCount('abort'), 0);
    await Effect.runPromise(e.close());
  });
  await check('Effect failure cancels sibling listener work; close cancels owned work and waits', async () => {
    const e = fresh(); const failure = new Error('effect failure'); let finalized = 0;
    e.on('work', () => Effect.never.pipe(Effect.ensuring(Effect.sync(() => { finalized++; }))));
    e.on('work', () => Effect.fail(failure));
    await assert.rejects(e.emitAsync('work'), error => error === failure);
    assert.equal(finalized, 1);
    e.on('owned', () => Effect.never.pipe(Effect.ensuring(Effect.sync(() => { finalized++; }))));
    e.emit('owned');
    const pending = e.waitFor('later'); const stopped = pending.catch(error => error.message);
    await Effect.runPromise(e.close()); assert.equal(finalized, 2);
    assert.equal(await stopped, 'EventEmitter is closed'); assert.deepEqual(e.eventNames(), []);
    assert.throws(() => e.on('closed', () => {}), /closed/);
  });
  await check('plain Node ESM/CJS global exports share the same process emitter' , () => {
    assert.equal(globalESM.ev, globalCJS.ev);
    assert.equal(globalESM.ev.on('entry', () => {}), globalESM.ev);
    globalCJS.ev.removeAllListeners('entry');
  });
  await check('session bridge preserves native payload identity and alias argument shapes', async () => {
    const { ev, attachGlobalEvents } = globalESM; ev.removeAllListeners(); ev.offAny();
    const source = new HyperEmitter(); const seen = []; const failures = [];
    ev.onAny((...args) => { seen.push(args); });
    const detach = attachGlobalEvents(source, 'support', true, error => failures.push(error));
    const native = { details: { qr: 'pairing' } }; source.emit('launch.auth.qr.generated', native);
    const qr = seen.find(args => args[0] === 'qr.support'); assert.deepEqual(qr.slice(1), ['pairing', 'support', 'qr']);
    assert.equal(seen[0][1], native); assert.deepEqual(seen[0].slice(2), ['support', 'launch.auth.qr.generated']);
    source.emit('session.data', { data: '{"auth":"a","data":"b"}' });
    assert.deepEqual(seen.find(args => args[0] === 'sessionData.support').slice(1), [{ auth: 'a', data: 'b' }, 'support', 'sessionData']);
    assert.equal(Buffer.from(seen.find(args => args[0] === 'sessionDataBase64.support')[1], 'base64').toString(), '{"auth":"a","data":"b"}');
    source.emit('message.received', { message: { id: 'm' } });
    const alias = seen.find(args => args[0].startsWith('onMessage.support.'));
    assert.deepEqual(alias[1].data, { id: 'm' }); assert.deepEqual(alias.slice(2), ['support', 'onMessage']); assert.equal(alias[1].event, 'onMessage');
    await detach(); const before = seen.length; source.emit('message.received', { message: { id: 'after' } }); assert.equal(seen.length, before); assert.equal(source.listenerCount(), 0); assert.deepEqual(failures, []);
    await Effect.runPromise(source.close()); ev.removeAllListeners(); ev.offAny();
  });
  await check('session forwarding isolates detach, eventMode and callback failures', async () => {
    const { ev, attachGlobalEvents, hasGlobalMessageListeners } = globalESM;
    ev.removeAllListeners(); ev.offAny();
    const first = new HyperEmitter(), second = new HyperEmitter(); const seen = []; const failures = [];
    const detachFirst = attachGlobalEvents(first, 'first', true, error => failures.push(error));
    const detachSecond = attachGlobalEvents(second, 'second', false, error => failures.push(error));
    ev.on('onMessage.**', (...args) => { seen.push(args); });
    assert.equal(hasGlobalMessageListeners(first), true); assert.equal(hasGlobalMessageListeners(second), false);
    first.emit('message.received', { message: { id: 'first' } }); second.emit('message.received', { message: { id: 'second' } });
    assert.equal(seen.length, 1); assert.equal(seen[0][1], 'first');
    ev.on('message.received', (...args) => { seen.push(args); });
    assert.equal(hasGlobalMessageListeners(second), true);
    await detachFirst(); second.emit('message.received', { message: { id: 'still' } });
    assert.equal(seen.at(-1)[1], 'second');
    ev.on('launch.auth.qr.generated', () => { throw new Error('callback'); });
    second.emit('launch.auth.qr.generated', { details: { qr: 'qr' } }); assert.equal(failures.length, 1);
    await detachSecond(); await Effect.runPromise(first.close()); await Effect.runPromise(second.close());
    ev.removeAllListeners(); ev.offAny();
  });
  await check('optional native PubSub is lazy, preserves payload identity and observes emissions without callbacks', async () => {
    const emitter = new HyperEmitter(); const payload = { id: 'message' };
    assert.equal(emitter.pubsubStatus.enabled, false);
    const scope = Scope.makeUnsafe();
    const subscription = Effect.runSync(emitter.subscribe().pipe(Scope.provide(scope)));
    const hub = emitter.pubsub(); assert.equal(emitter.hasPubSub, true);
    assert.equal(emitter.emit('message', payload), false);
    const frame = Effect.runSync(PubSub.take(subscription));
    assert.equal(frame.event, 'message'); assert.equal(frame.payload, payload); assert(Object.isFrozen(frame));
    await Effect.runPromise(emitter.close()); assert(PubSub.isShutdownUnsafe(hub));
    assert(Exit.isFailure(await Effect.runPromise(Effect.exit(PubSub.take(subscription)))));
    await Effect.runPromise(Scope.close(scope, Exit.void));
  });
  await check('queued facade packets preserve variadic arguments and reentrant FIFO without result collectors', async () => {
    const emitter = fresh(); const payload = { id: 'p' }; const scope = Scope.makeUnsafe();
    const subscription = Effect.runSync(emitter.subscribe().pipe(Scope.provide(scope)));
    emitter.on('outer', () => { emitter.emit('inner', 2); return 'outer-result'; });
    emitter.emit('outer', payload, 'support', 'outer');
    const first = Effect.runSync(PubSub.take(subscription)), second = Effect.runSync(PubSub.take(subscription));
    assert.equal(first.event, 'outer'); assert.equal(second.event, 'inner');
    assert.equal(first.args[0], payload); assert.deepEqual(first.args.slice(1), ['support', 'outer']);
    assert(Object.isFrozen(first)); assert(Object.isFrozen(first.args));
    assert.deepEqual(Object.keys(first).sort(), ['args', 'event']);
    const result = await emitter.emitAsync('outer', payload); assert.deepEqual(result, ['outer-result']);
    assert.equal(Effect.runSync(PubSub.take(subscription)).event, 'outer');
    assert.equal(Effect.runSync(PubSub.take(subscription)).event, 'inner');
    await Effect.runPromise(Scope.close(scope, Exit.void)); await Effect.runPromise(emitter.close());
  });
  await check('raw PubSub operations address queued observers; emitter ingress reaches both interfaces once', async () => {
    const emitter = fresh(); const scope = Scope.makeUnsafe(); let called = 0;
    emitter.on('a', () => { called++; }); const hub = emitter.pubsub();
    const subscription = Effect.runSync(PubSub.subscribe(hub).pipe(Scope.provide(scope)));
    Effect.runSync(PubSub.publish(hub, { event: 'a', args: [1] })); assert.equal(called, 0);
    assert.deepEqual(Effect.runSync(PubSub.take(subscription)), { event: 'a', args: [1] });
    assert.equal(emitter.emit('a', 2), true); assert.equal(called, 1);
    assert.deepEqual(Effect.runSync(PubSub.take(subscription)), { event: 'a', args: [2] });
    assert.equal(emitter.pubsubStatus.accepted, 1);
    await Effect.runPromise(Scope.close(scope, Exit.void)); await Effect.runPromise(emitter.close());
  });
  await check('explicit dropping and sliding buffers cap backlog without changing callback delivery', async () => {
    for (const strategy of ['dropping', 'sliding']) {
      const emitter = fresh(); const scope = Scope.makeUnsafe(); const seen = [];
      const options = { strategy, capacity: 2 }; const hub = emitter.pubsub(options);
      assert.equal(emitter.pubsub(options), hub);
      assert.throws(() => emitter.pubsub({ strategy, capacity: 3 }), /already configured/);
      const subscription = Effect.runSync(emitter.subscribe().pipe(Scope.provide(scope)));
      emitter.on('a', value => { seen.push(value); });
      for (let value = 0; value < 3; value++) assert.equal(emitter.emit('a', value), true);
      const queued = Effect.runSync(PubSub.takeAll(subscription)).map(frame => frame.args[0]);
      assert.deepEqual(queued, strategy === 'dropping' ? [0, 1] : [1, 2]);
      assert.deepEqual(seen, [0, 1, 2]); assert.equal(emitter.pubsubStatus.rejected, strategy === 'dropping' ? 1 : 0);
      await Effect.runPromise(Scope.close(scope, Exit.void)); await Effect.runPromise(emitter.close());
    }
    const emitter = fresh(); assert.throws(() => emitter.pubsub({ strategy: 'bounded', capacity: 2 }), /non-blocking/);
    assert.throws(() => emitter.pubsub({ strategy: 'sliding', capacity: 0 }), /positive integer/);
    assert.throws(() => emitter.pubsub({ capacity: 2 }), /Choose dropping or sliding/);
    assert.equal(emitter.pubsubStatus.enabled, false);
    await Effect.runPromise(emitter.close());
  });
  await check('optional replay and scoped Stream consumption use the native hub', async () => {
    const emitter = fresh(); const hub = emitter.pubsub({ replay: 2 });
    emitter.emit('a', 1); emitter.emit('a', 2); emitter.emit('a', 3);
    await Effect.runPromise(Effect.scoped(Effect.gen(function* () {
      const subscription = yield* emitter.subscribe();
      assert.deepEqual((yield* PubSub.takeAll(subscription)).map(frame => frame.args[0]), [2, 3]);
    })));
    assert.equal(emitter.pubsub(), hub); await Effect.runPromise(emitter.close());
    const streaming = fresh(); const stream = streaming.stream(); assert.equal(streaming.hasPubSub, false);
    await Effect.runPromise(Effect.scoped(Effect.gen(function* () {
      const fiber = yield* Effect.forkChild(stream.pipe(Stream.take(2), Stream.runCollect), { startImmediately: true });
      streaming.emit('a', 1); streaming.emit('a', 2);
      assert.deepEqual((yield* Fiber.join(fiber)).map(frame => frame.args[0]), [1, 2]);
    })));
    await Effect.runPromise(streaming.close());
  });
  await check('closing the emitter interrupts queued readers and rejects registrations from finalizers', async () => {
    const emitter = fresh(), scope = Scope.makeUnsafe(), done = Deferred.makeUnsafe();
    const subscription = Effect.runSync(emitter.subscribe().pipe(Scope.provide(scope)));
    let closedDuringFinalizer = false, rejected = false;
    const reader = PubSub.take(subscription).pipe(Effect.ensuring(Effect.sync(() => {
      closedDuringFinalizer = emitter.isClosed;
      try { emitter.on('late', () => {}); } catch { rejected = true; }
    }).pipe(Effect.andThen(Deferred.succeed(done, undefined)))));
    Effect.runSync(Effect.forkIn(reader, scope, { startImmediately: true }));
    await Effect.runPromise(emitter.close()); await Effect.runPromise(Deferred.await(done));
    assert(closedDuringFinalizer); assert(rejected); assert.deepEqual(emitter.eventNames(), []);
    await Effect.runPromise(Scope.close(scope, Exit.void));
  });
  await check('queued global subscriptions activate native/alias forwarding and retain ESM/CJS identity', async () => {
    const { ev, attachGlobalEvents, hasGlobalMessageListeners } = globalESM;
    ev.removeAllListeners(); ev.offAny(); const first = new HyperEmitter(), second = new HyperEmitter();
    const detachFirst = attachGlobalEvents(first, 'first', true, error => { throw error; });
    const detachSecond = attachGlobalEvents(second, 'second', false, error => { throw error; });
    const scope = Scope.makeUnsafe(); const subscription = Effect.runSync(ev.subscribe().pipe(Scope.provide(scope)));
    assert.equal(globalCJS.ev.pubsub(), ev.pubsub()); assert.equal(ev.listenerCount('message.received'), 0);
    assert.equal(hasGlobalMessageListeners(first), true); assert.equal(hasGlobalMessageListeners(second), true);
    const payload = { message: { id: 'm' } }; first.emit('message.received', payload);
    const frames = Effect.runSync(PubSub.takeAll(subscription));
    assert.equal(frames[0].event, 'message.received'); assert.equal(frames[0].args[0], payload);
    assert.deepEqual(frames[0].args.slice(1), ['first', 'message.received']);
    assert(frames[1].event.startsWith('onMessage.first.')); assert.equal(frames[1].args[0].data, payload.message);
    await detachFirst(); second.emit('message.received', payload);
    assert.deepEqual(Effect.runSync(PubSub.takeAll(subscription)).map(frame => frame.event), ['message.received']);
    await detachSecond(); await Effect.runPromise(first.close()); await Effect.runPromise(second.close());
    await Effect.runPromise(Scope.close(scope, Exit.void)); await Effect.runPromise(ev.close());
    const native = new HyperEmitter(); assert.equal(hasGlobalMessageListeners(native), false);
    native.pubsub(); assert.equal(hasGlobalMessageListeners(native), true); await Effect.runPromise(native.close());
  });
  await check('TypeScript consumer API: variadic callbacks, fluent helpers and scoped Effects', () => {
    execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--ignoreConfig', '--noEmit', '--strict', '--skipLibCheck', '--noUnusedLocals', '--noUnusedParameters', '--noImplicitReturns', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'Bundler', '--types', 'node', join(root, 'packages/hyperemitter/checks/public-api.types.ts')], { cwd: root, stdio: 'pipe' });
  });
  await check('Full EventEmitter2 instance interface remains structurally assignable in TypeScript', async () => {
    const fixture = join(scratch, 'structural-api.ts');
    const referenceTypes = join(dirname(require.resolve(referencePath)), '../eventemitter2');
    await writeFile(fixture, `import type { EventEmitter2 } from ${JSON.stringify(referenceTypes)};\nimport { EventEmitter } from ${JSON.stringify(join(root, 'packages/hyperemitter/src/index'))};\nconst userEmitter: EventEmitter2 = new EventEmitter();\nvoid userEmitter;\n`);
    execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--ignoreConfig', '--noEmit', '--strict', '--skipLibCheck', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'Bundler', '--types', 'node', fixture], { cwd: root, stdio: 'pipe' });
  });
  const output = join(root, 'packages/hyperemitter/benchmarks/results/public-api-node-2026-10-14.json');
  await writeFile(output, JSON.stringify({ checkedAt: new Date().toISOString(), node: process.version, effect: require('effect/package.json').version, reference: `eventemitter2@${referenceVersion}`, bundleHashes, scope: 'Focused current-source ESM/CJS bundles, not a published registry package or a live WhatsApp session', checks: evidence }, null, 2) + '\n');
  console.log(`Saved ${output}`);
} finally { await rm(scratch, { recursive: true, force: true }); }
