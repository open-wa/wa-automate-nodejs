// Manual release check. Build package dependencies before running this command.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const nodeIndex = process.argv.indexOf('--node');
const node = nodeIndex < 0 ? process.execPath : process.argv[nodeIndex + 1];
const scratch = await mkdtemp(join(root, 'node_modules/.cache/packed-events-'));
const candidates = ['hyperemitter', 'core', 'socket-client', 'wa-automate'];
const packs = [];
const packages = new Map();
const sha = value => createHash('sha256').update(value).digest('hex');
try {
  const modules = join(scratch, 'node_modules');
  await mkdir(join(modules, '@open-wa'), { recursive: true });
  await writeFile(join(scratch, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  for (const workspaceRoot of ['packages', 'integrations']) {
    for (const entry of await readdir(join(root, workspaceRoot), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = entry.name;
      try {
        const manifest = JSON.parse(await readFile(join(root, workspaceRoot, dir, 'package.json'), 'utf8'));
        packages.set(manifest.name, { dir: join(root, workspaceRoot, dir), manifest });
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
  }
  for (const dir of candidates) {
    execFileSync('pnpm', ['--config.verify-deps-before-run=false', 'pack', '--pack-destination', scratch], {
      cwd: join(root, 'packages', dir), stdio: 'pipe', timeout: 60000,
    });
    const { manifest } = packages.get(`@open-wa/${dir}`);
    const tarball = `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`;
    packs.push({ name: manifest.name, tarball, sha256: sha(await readFile(join(scratch, tarball))) });
  }
  const staged = new Set();
  const stage = async name => {
    if (staged.has(name)) return;
    staged.add(name);
    const { dir, manifest } = packages.get(name);
    const target = join(modules, name);
    await mkdir(target, { recursive: true });
    const pack = packs.find(p => p.name === name);
    if (pack) {
      execFileSync('tar', ['-xzf', join(scratch, pack.tarball), '--strip-components=1', '-C', target]);
      const published = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'));
      assert.equal(published.dependencies?.eventemitter2, undefined);
      assert.equal(JSON.stringify(published.exports).includes('"bun"'), false);
      assert.equal(JSON.stringify(published.dependencies).includes('workspace:'), false);
      for (const file of await readdir(join(target, 'dist'))) {
        if (!/\.(mjs|cjs)$/.test(file)) continue;
        assert.equal((await readFile(join(target, 'dist', file), 'utf8')).includes('eventemitter2'), false);
      }
    } else {
      // Transitive workspaces use their built output; third-party dependencies
      // resolve from this checkout. This is not a clean registry installation.
      for (const file of manifest.files ?? ['dist']) {
        try { await cp(join(dir, file), join(target, file), { recursive: true }); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      await writeFile(join(target, 'package.json'), JSON.stringify({ ...manifest, ...manifest.publishConfig }));
    }
    for (const [dependency, specifier] of Object.entries(manifest.dependencies ?? {})) {
      if (specifier.startsWith('workspace:')) await stage(dependency);
    }
  };
  for (const { name } of packs) await stage(name);
  const smoke = `
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Effect, PubSub } from 'effect';
import { EventEmitter, HyperEmitter } from '@open-wa/hyperemitter';
import * as core from '@open-wa/core';
import * as sdk from '@open-wa/wa-automate';
import * as sockets from '@open-wa/socket-client';
const require = createRequire(import.meta.url);
for (const name of ${JSON.stringify(packs.map(p => p.name))}) {
  assert.ok(await import(name)); assert.ok(require(name));
}
assert.equal(core.ev, require('@open-wa/core').ev);
assert.equal(core.ev, sdk.ev);
assert.equal(core.ev, require('@open-wa/wa-automate').ev);
assert.equal(typeof sdk.create, 'function');
assert.equal(typeof core.createClient, 'function');
assert.equal(core.ev instanceof EventEmitter, true);
const events = new EventEmitter();
const payload = { jobId: 'daily-summary' };
let synchronous = false;
events.on('app.**', function (value, sessionId) {
  assert.equal(this, events); assert.equal(this.event, 'app.job.finished');
  assert.equal(value, payload); assert.equal(sessionId, 'support'); synchronous = true;
});
await Effect.runPromise(Effect.scoped(Effect.gen(function* () {
  const subscription = yield* events.subscribe();
  assert.equal(events.emit('app.job.finished', payload, 'support'), true);
  assert.equal(synchronous, true);
  const frame = yield* PubSub.take(subscription);
  assert.equal(frame.event, 'app.job.finished'); assert.equal(frame.args[0], payload);
  assert.equal(frame.args[1], 'support');
})).pipe(Effect.ensuring(events.close())));
const typed = new HyperEmitter();
assert.equal(typeof typed.stream, 'function');
await Effect.runPromise(typed.close());
const tunnel = new sockets.TunnelSocketClient({ proxyHost: 'ws://localhost', proxyToken: 'unused', sessionId: 'support' });
assert.equal(tunnel.ev instanceof EventEmitter, true);
await Effect.runPromise(tunnel.ev.close());
assert.equal(typeof sockets.SocketClient, 'function');
assert.equal(typeof sockets.MessageCollector, 'function');
console.log(JSON.stringify({node:process.version,importAndRequire:4,sharedEv:true,synchronousAndQueued:true,socketEmitter:true}));
`;
  await writeFile(join(scratch, 'smoke.mjs'), smoke);
  const runtime = JSON.parse(execFileSync(node, ['smoke.mjs'], { cwd: scratch, encoding: 'utf8', timeout: 30000 }));
  const guide = await readFile(join(root, 'apps/docs/content/docs/guides/effect-event-streams.mdx'), 'utf8');
  const js = [...guide.matchAll(/```js\n([\s\S]*?)```/g)][0][1];
  const ts = [...guide.matchAll(/```ts\n([\s\S]*?)```/g)].find(match => match[1].includes('type Events ='))[1];
  await writeFile(join(scratch, 'events.mjs'), js);
  await writeFile(join(scratch, 'typed-events.ts'), ts);
  const callbackOutput = execFileSync(node, ['events.mjs'], { cwd: scratch, encoding: 'utf8', timeout: 10000 }).trim();
  execFileSync(join(root, 'node_modules/.bin/tsc'), ['--ignoreConfig', '--strict', '--skipLibCheck', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--outDir', 'compiled', 'typed-events.ts'], { cwd: scratch, stdio: 'inherit', timeout: 30000 });
  const streamOutput = execFileSync(node, ['compiled/typed-events.js'], { cwd: scratch, encoding: 'utf8', timeout: 10000 }).trim();
  assert.equal(callbackOutput, 'Callback: daily-summary\nQueued: app.job.finished daily-summary');
  assert.equal(streamOutput, 'Stream: daily-summary');
  const report = { date: new Date().toISOString(), scope: 'Local release tarballs for four candidates, built transitive workspaces and installed third-party dependencies; no registry install or live WhatsApp session', packs, transitiveWorkspaces: staged.size - packs.length, runtime, documentation: { callbackOutput, streamOutput, streamTypes: true } };
  await writeFile(join(root, 'packages/hyperemitter/benchmarks/results/package-exports-node-2026-10-14.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { await rm(scratch, { recursive: true, force: true }); }
