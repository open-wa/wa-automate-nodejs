import { RuntimeCapabilities } from '@open-wa/runtime-core';
import { Effect, Exit } from 'effect';
import { describe, expect, it } from 'vitest';
import { EdgeRuntimeLayer } from './index';

describe('EdgeRuntimeLayer', () => {
  it('exposes Worker capabilities and rejects host-only work', async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const capabilities = yield* RuntimeCapabilities;
        return {
          runtime: capabilities.runtime,
          bindings: capabilities.has('worker-bindings'),
          filesystem: yield* Effect.exit(capabilities.require('filesystem')),
        };
      }).pipe(Effect.provide(EdgeRuntimeLayer)),
    );

    expect(result.runtime).toBe('edge');
    expect(result.bindings).toBe(true);
    expect(Exit.isFailure(result.filesystem)).toBe(true);
  });
});
