/**
 * Effect error boundary — the "Effect never leaks" law (see EFFECT.md).
 *
 * Effect is an internal implementation detail. Every public Promise API must
 * catch failures at the boundary and rethrow a plain `OpenWAError` (an Error
 * subclass) with a stable `name`, a readable `message`, an HTTP-ish `status`,
 * optional `details`, and the original `cause` preserved. Downstream users and
 * their tools should never see an Effect `Cause`, `FiberFailure`, or fiber
 * trace.
 *
 * Effect v4 note: `Effect.runPromise` rejects with the typed failure value
 * directly (a `Data.TaggedError` instance, which is itself an `Error` carrying
 * `_tag`). `toPublicError` normalizes whatever a boundary catches.
 */
import { Effect } from 'effect';

/** A tagged error, as produced by `Data.TaggedError`. */
type TaggedLike = {
  readonly _tag: string;
  readonly message?: string;
  readonly status?: number;
  readonly details?: unknown;
  readonly cause?: unknown;
};

/**
 * Default tag -> HTTP status mapping. A tagged error may also carry its own
 * numeric `status`, which takes precedence. Unmapped tags default to 500.
 */
export const TAG_STATUS: Readonly<Record<string, number>> = {
  ValidationError: 400,
  CapabilityValidationError: 400,
  MethodInputValidationError: 400,
  AuthenticationError: 401,
  ForbiddenError: 403,
  NotFoundError: 404,
  CapabilityNotFoundError: 404,
  TimeoutError: 408,
  SessionNotReadyError: 503,
  CapabilityClientMissingError: 503,
};

export interface OpenWAErrorInit {
  name: string;
  message: string;
  status: number;
  details?: unknown;
  cause?: unknown;
}

/**
 * The only error type that crosses the public boundary. Plain `Error` subclass
 * so existing `try/catch`, `error.message`, and logging keep working.
 */
export class OpenWAError extends Error {
  override readonly name: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(init: OpenWAErrorInit) {
    super(init.message, init.cause !== undefined ? { cause: init.cause } : undefined);
    this.name = init.name;
    this.status = init.status;
    this.details = init.details;
  }
}

function isTagged(value: unknown): value is TaggedLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { _tag?: unknown })._tag === 'string'
  );
}

function messageFor(err: TaggedLike): string {
  if (typeof err.message === 'string' && err.message.length > 0) return err.message;
  return err._tag;
}

/**
 * Normalize anything caught at an Effect boundary into a public `OpenWAError`.
 * Idempotent: already-public errors pass through unchanged.
 */
export function toPublicError(value: unknown): OpenWAError {
  if (value instanceof OpenWAError) return value;

  if (isTagged(value)) {
    const status =
      typeof value.status === 'number' ? value.status : (TAG_STATUS[value._tag] ?? 500);
    return new OpenWAError({
      name: value._tag,
      message: messageFor(value),
      status,
      details: value.details,
      cause: value.cause ?? value,
    });
  }

  if (value instanceof Error) {
    return new OpenWAError({
      name: 'OpenWAError',
      message: value.message,
      status: 500,
      cause: value,
    });
  }

  return new OpenWAError({
    name: 'OpenWAError',
    message: typeof value === 'string' ? value : 'Unknown error',
    status: 500,
    cause: value,
  });
}

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
