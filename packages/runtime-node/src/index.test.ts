import { RuntimeCapabilities } from '@open-wa/runtime-core';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { NodeRuntimeLayer } from './index.js';

describe('NodeRuntimeLayer', () => {
  it('runs a portable capability program with Node services', async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const capabilities = yield* RuntimeCapabilities;
        yield* capabilities.require('filesystem');
        yield* capabilities.require('chromium-launch');
        return capabilities.runtime;
      }).pipe(Effect.provide(NodeRuntimeLayer)),
    );

    expect(result).toBe('node');
  });
});
