/** Effect remains internal; normalize failures at the public Promise boundary. */
import { Effect } from 'effect';
import { toPublicError } from '@open-wa/driver-interface';
export { OpenWAError, TAG_STATUS, toPublicError, type OpenWAErrorInit } from '@open-wa/driver-interface';

/**
 * Run an Effect and return a Promise whose rejection is always a public
 * `OpenWAError`. Use this at every public Promise boundary instead of
 * `Effect.runPromise` directly.
 */
export function runToPromise<A>(effect: Effect.Effect<A, unknown, never>): Promise<A> {
  return Effect.runPromise(effect).catch((cause: unknown) => {
    throw toPublicError(cause);
  });
}
