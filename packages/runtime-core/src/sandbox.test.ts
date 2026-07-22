import { Cause, Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { captureSandboxCause } from './sandbox.js';

describe('Effect Cause sandboxing', () => {
  it('moves a typed failure Cause into the error channel', async () => {
    const cause = await Effect.runPromise(
      Effect.flip(captureSandboxCause(Effect.fail('typed failure'))),
    );

    expect(Cause.pretty(cause)).toContain('typed failure');
  });

  it('does not pretend to be a security boundary', async () => {
    let externallyVisible = false;
    await Effect.runPromise(captureSandboxCause(Effect.sync(() => {
      externallyVisible = true;
    })));

    expect(externallyVisible).toBe(true);
  });
});
