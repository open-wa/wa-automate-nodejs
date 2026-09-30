import { Cause, Data, Effect } from 'effect';
import { runToPromise } from '../effect/errors';

type PortableSessionFailureCode =
  | 'PORTABLE_SESSION_FAILED'
  | 'PORTABLE_SESSION_PAYLOAD_INVALID'
  | 'PORTABLE_SESSION_HANDLER_ALREADY_BOUND'
  | 'PORTABLE_SESSION_ALREADY_INSTALLED'
  | 'PORTABLE_SESSION_NOT_INSTALLED'
  | 'PORTABLE_SESSION_PROVISION_FAILED'
  | 'PORTABLE_SESSION_PATCH_REQUIRED'
  | 'PORTABLE_SESSION_FENCED'
  | 'PORTABLE_SESSION_REVISION_CONFLICT'
  | 'PORTABLE_SESSION_SAVE_FAILED'
  | 'PORTABLE_SESSION_HANDLER_FAILED'
  | 'PORTABLE_SESSION_ACTIVATE_FAILED'
  | 'PORTABLE_SESSION_STATUS_FAILED'
  | 'PORTABLE_SESSION_REPLAY_FAILED'
  | 'PORTABLE_SESSION_FLUSH_FAILED'
  | 'PORTABLE_SESSION_REMOVE_FAILED'
  | 'PORTABLE_SESSION_RELEASE_FAILED'
  | 'PORTABLE_SESSION_STORE_LOCKED'
  | 'PORTABLE_SESSION_STORE_CLOSED'
  | 'PORTABLE_SESSION_CONFIG_INVALID'
  | 'PORTABLE_SESSION_ENCRYPTION_CONFIG_INVALID'
  | 'PORTABLE_SESSION_ENCRYPTION_KEY_FILE_FAILED'
  | 'PORTABLE_SESSION_DURABLE_STORE_REQUIRED'
  | 'PORTABLE_SESSION_STORE_FAILED';

/** Never retain provider errors: they can contain keys, payloads, or private source. */
export class PortableSessionFailure extends Data.TaggedError('PortableSessionError')<{
  readonly message: PortableSessionFailureCode;
  readonly status: number;
}> {}

export function portableFailure(message: PortableSessionFailureCode): PortableSessionFailure {
  const status = ['PORTABLE_SESSION_PAYLOAD_INVALID', 'PORTABLE_SESSION_CONFIG_INVALID', 'PORTABLE_SESSION_ENCRYPTION_CONFIG_INVALID', 'PORTABLE_SESSION_ENCRYPTION_KEY_FILE_FAILED', 'PORTABLE_SESSION_DURABLE_STORE_REQUIRED'].includes(message) ? 400
    : ['PORTABLE_SESSION_STORE_LOCKED', 'PORTABLE_SESSION_REVISION_CONFLICT',
      'PORTABLE_SESSION_ALREADY_INSTALLED', 'PORTABLE_SESSION_HANDLER_ALREADY_BOUND'].includes(message) ? 409
    : ['PORTABLE_SESSION_FENCED', 'PORTABLE_SESSION_STORE_CLOSED', 'PORTABLE_SESSION_NOT_INSTALLED'].includes(message) ? 503
    : 500;
  return new PortableSessionFailure({ message, status });
}

export function portableIO<A>(
  code: PortableSessionFailureCode,
  operation: () => PromiseLike<A>,
): Effect.Effect<A, PortableSessionFailure> {
  return Effect.tryPromise({ try: operation, catch: () => portableFailure(code) });
}

/** Normalize finalizer defects too, so no Effect cause or private exception crosses the SDK boundary. */
export function runPortable<A>(effect: Effect.Effect<A, PortableSessionFailure>): Promise<A> {
  return runToPromise(effect.pipe(Effect.catchCause(cause => {
    const failure = Cause.squash(cause);
    return Effect.fail(failure instanceof PortableSessionFailure ? failure : portableFailure('PORTABLE_SESSION_FAILED'));
  })));
}

export const validatePortablePayload = (payload: string): Effect.Effect<void, PortableSessionFailure> =>
  Effect.try({
    try: () => {
      if (typeof payload !== 'string' || Buffer.byteLength(payload) > 64 * 1024 * 1024) throw new Error();
      const value = JSON.parse(payload) as { auth?: unknown; data?: unknown } | null;
      if (!value || Array.isArray(value) || Object.keys(value).sort().join(',') !== 'auth,data'
        || typeof value.auth !== 'string' || !value.auth || typeof value.data !== 'string' || !value.data) throw new Error();
    },
    catch: () => portableFailure('PORTABLE_SESSION_PAYLOAD_INVALID'),
  });

/** Decode only the public JSON/base64 wrapper. The encrypted values stay opaque. */
export const normalizePortablePayload = (input: unknown): Effect.Effect<string, PortableSessionFailure> =>
  Effect.gen(function* () {
    const payload = yield* Effect.try({
      try: () => {
        if (typeof input !== 'string') {
          const encoded = JSON.stringify(input);
          if (typeof encoded !== 'string') throw new Error();
          return encoded;
        }
        if (Buffer.byteLength(input) > 90 * 1024 * 1024) throw new Error();
        let value: unknown;
        try { value = JSON.parse(input); }
        catch { value = input; }
        if (typeof value === 'string') value = JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
        return JSON.stringify(value);
      },
      catch: () => portableFailure('PORTABLE_SESSION_PAYLOAD_INVALID'),
    });
    yield* validatePortablePayload(payload);
    return payload;
  });
