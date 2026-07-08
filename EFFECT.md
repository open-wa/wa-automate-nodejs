# Effect conventions (v5)

open-wa v5 uses [Effect](https://effect.website) **v4** as an internal
implementation detail for lifecycle, retries, structured concurrency, and typed
errors. This file is the source of truth for how we use it. **Coding agents:
read this before writing Effect code — do not use Effect v3 idioms, they differ
from v4 and most training data predates v4.**

Pinned version: `effect` is pinned to an exact beta (`4.0.0-beta.94`) in the
workspace catalog. Upgrade deliberately (v4 is still in beta and APIs move
between betas); never bump it as a side effect of another change.

## The one hard rule: Effect never leaks

Effect stays behind the public API. Every exported Promise-returning method,
HTTP handler, Socket.IO handler, webhook, and plugin-facing surface must catch
failures at the boundary and rethrow a plain `OpenWAError`.

- Use `runToPromise(effect)` from `@open-wa/core` (`src/effect/errors.ts`) at
  public boundaries instead of `Effect.runPromise`. It guarantees the rejection
  is an `OpenWAError` with a stable `name` (the failure's tag), a readable
  `message`, an HTTP-ish `status`, optional `details`, and the original `cause`.
- Never expose `Cause`, `Exit`, `FiberFailure`, or a fiber trace to a caller.
- HTTP surfaces map `OpenWAError.status` to the response code.

Downstream users and their tools must be able to read our errors as ordinary
`Error`s. That is non-negotiable and is enforced in `PUBLIC_CONTRACT.md`.

## Where Effect is allowed

- **Yes:** `@open-wa/core` internals (transport/session lifecycle, `httpClient`),
  `integrations/webhook` delivery, the execution kernel, and (later) the schema
  layer and orchestrator core.
- **No:** public method signatures, `@open-wa/plugin-sdk`, `@open-wa/client`,
  generated code, and anything a consumer imports and calls directly. Those stay
  Promise-based. (An additive `client.effect.*` surface may be offered later,
  but the Promise surface always exists.)

## v4 idioms we use

- **Tagged errors:** `class FooError extends Data.TaggedError('FooError')<{ readonly cause: unknown }> {}`.
  Instances are real `Error`s and carry `_tag`. Give an error its own numeric
  `status` field when it maps to a specific HTTP code, otherwise add the tag to
  `TAG_STATUS` in `src/effect/errors.ts`.
- **External IO:** `Effect.tryPromise({ try, catch })`, mapping the thrown value
  into a tagged error in `catch`.
- **Retries:** `Effect.retry(program, Schedule.exponential(...))` instead of
  hand-rolled backoff loops.
- **Resources:** `Effect.acquireRelease` + `Effect.scoped` so cleanup is
  structural (used for browser/page/session lifetime).
- **Timeouts:** `Effect.timeoutFail` / `Effect.race` instead of `setTimeout`
  races.
- **Running:** `runToPromise` at boundaries; `Effect.runPromiseExit` when you
  need to inspect the `Cause` internally (extract the error with `Cause.squash`).

## Error message quality

Public error messages come from the failure, not from Effect internals. When a
tagged error wraps a validation failure, put the human-readable, annotation-derived
message (e.g. `Expected ChatId (...) received "..."`) on the error's `message`
and the machine-readable issues on `details`. See the schema-layer plan in
issue #3333.

## Testing Effect code

- Test the pure pieces directly.
- Assert the **public** behavior: that a boundary rejects with an `OpenWAError`
  of the expected `name`/`status`/`message`, not that some internal fiber failed.
  See `packages/core/test/unit/effectErrors.test.ts` for the template.
