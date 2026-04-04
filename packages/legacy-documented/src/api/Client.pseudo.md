# Client.ts bootstrap-relevant pseudocode trace

Source of truth: `packages/legacy/src/api/Client.ts`

This file is huge. This note only covers the parts reached directly by `initializer.ts:create(...)` during session bootstrap.

## Constructor path

- `Client.ts:360-379` — constructor stores:
  - page
  - create config
  - session info
  - generated instance id
  - event manager registry
  - close handler via `_setOnClose()`.

## loaded()

- `Client.ts:388-430` — `loaded()` is the final client-side launch phase after `initializer.ts` has finished page/session preparation.
- Steps:
  1. wait for `WAPI.isSessionLoaded()` so the in-page session finishes syncing
  2. if `eventMode` is enabled, register simple listeners onto the event bus
  3. populate `PHONE_VERSION` from `getMe()`
  4. optionally install auto-emoji behavior
  5. optionally install logout handlers that invalidate/delete session data and kill the client
  6. mark the client as loaded.

## refresh()

- `Client.ts:485-558` — `refresh()` is used by `initializer.ts` only in the “first headful QR scan + ensureHeadfulIntegrity” path.
- High-level behavior:
  - preload license
  - open a new tab
  - run `initPage(..., newTab, true)` to prepare a fresh page without normal auth restoration
  - close the stale tab after conflict resolution
  - reinject WAPI, wait for ripe session if configured, reapply patches/license/init patch
  - call `loaded()` again and restore listeners.

## getMe()

- `Client.ts:2249-2250` — returns `WAPI.getMe()` from the page context.
- Used immediately after client construction to resolve the host account identity.

## getLicenseLink()

- `Client.ts:1515-1517` — thin wrapper over internal `link(...)` helper.
- Used by `initializer.ts` to print a purchase link when no license key is present.

## getIssueLink()

- `Client.ts:2590-2592` — returns `generateGHIssueLink(config, sessionInfo)`.
- Used by `initializer.ts` to print a prefilled issue-report link at the end of launch.

## Behavioral contract / pseudo tests

- Constructing `Client` should not itself imply the session is fully loaded; `loaded()` is a distinct phase.
- `loaded()` should wait for internal session sync before enabling user-facing readiness semantics.
- If event mode is active, `loaded()` should register the simple listener surface automatically.
- Logout-related cleanup should invalidate or remove session artifacts according to config, not silently ignore logout.
- `refresh()` should preserve the semantic contract of a live session refresh: reopen, reinject, restore listeners, and end in a ready state or fail clearly.
- Support helpers like `getMe()`, `getIssueLink()`, and `getLicenseLink()` should be callable once the client is ready without requiring callers to know internal launch details.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Constructor vs loaded-phase split | Preserve | Ready state is not implied by construction. |
| Exact refresh implementation | Intentionally changed | Semantics matter more than tab choreography. |
| Listener auto-registration on ready | Preserve | Important for event-mode compatibility. |

## Inputs / outputs / side effects

- Inputs: prepared page, resolved config, session info.
- Outputs: public client methods and ready client state.
- Side effects: listener registration, logout cleanup hooks, optional refresh/reinjection paths.

## Failure taxonomy

- Loaded-phase session sync failure
- Listener registration failure
- Refresh failure
- Logout cleanup failure

## Dependency contracts

- Requires: a page/session already brought close to readiness by the launcher.
- Guarantees: `loaded()` transitions the client from constructed to operational.
- Guarantees downstream: helper methods expose launch/session metadata without needing launcher internals.

## State transitions

- `CONSTRUCTED -> LOADING -> READY`
- `READY -> REFRESHING -> READY | REFRESH_FAILED`
- `READY -> LOGGED_OUT -> CLEANED_UP`
