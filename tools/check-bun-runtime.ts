import { RuntimeCapabilities } from '../packages/runtime-core/src/index.ts';
import { BunRuntimeLayer } from '../packages/runtime-bun/src/index.ts';
import { Effect } from 'effect';

const runtime = await Effect.runPromise(
  Effect.gen(function* () {
    const capabilities = yield* RuntimeCapabilities;
    yield* capabilities.require('filesystem');
    yield* capabilities.require('chromium-launch');
    return capabilities.runtime;
  }).pipe(Effect.provide(BunRuntimeLayer)),
);

if (runtime !== 'bun') {
  throw new Error(`Expected the Bun runtime Layer, received ${runtime}`);
}

console.log('Portable capability program passed under BunRuntimeLayer.');
