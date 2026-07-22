import { RuntimeCapabilities } from '@open-wa/runtime-core';
import { Effect, Exit } from 'effect';
import { describe, expect, it } from 'vitest';
import { BrowserRuntimeLayer } from './index';

describe('BrowserRuntimeLayer', () => {
  it('exposes control-plane capabilities and rejects host-only work', async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const capabilities = yield* RuntimeCapabilities;
        return {
          runtime: capabilities.runtime,
          fetch: capabilities.has('web-fetch'),
          chromium: yield* Effect.exit(capabilities.require('chromium-launch')),
        };
      }).pipe(Effect.provide(BrowserRuntimeLayer)),
    );

    expect(result.runtime).toBe('browser');
    expect(result.fetch).toBe(true);
    expect(Exit.isFailure(result.chromium)).toBe(true);
  });
});
