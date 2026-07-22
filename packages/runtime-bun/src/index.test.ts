import { RuntimeCapabilities } from '@open-wa/runtime-core';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

describe('BunRuntimeLayer', () => {
  const runtimeIt = 'Bun' in globalThis ? it : it.skip;

  runtimeIt('runs the same portable capability program with Bun services', async () => {
    const { BunRuntimeLayer } = await import('./index.js');
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const capabilities = yield* RuntimeCapabilities;
        yield* capabilities.require('filesystem');
        yield* capabilities.require('chromium-launch');
        return capabilities.runtime;
      }).pipe(Effect.provide(BunRuntimeLayer)),
    );

    expect(result).toBe('bun');
  });
});
