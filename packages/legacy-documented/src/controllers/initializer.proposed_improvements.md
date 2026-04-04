# initializer.ts proposed improvements

Source reviewed: `packages/legacy/src/controllers/initializer.ts`

These are transfer-oriented suggestions only. They are **not** claims that the current code is wrong; they are candidates for a safer v5 rewrite while preserving behavior.

## 1. Replace recursive restart paths with explicit state-machine transitions

Relevant source lines:

- `initializer.ts:243-246`
- `initializer.ts:285-288`
- `initializer.ts:451`

Current behavior is intentionally robust, but restart-on-recursion makes the control flow harder to port and reason about. In v5, the same behavior would likely be easier to preserve with explicit restart reasons such as:

- `SESSION_DATA_EXPIRED`
- `MULTI_DEVICE_AUTO_UPGRADE`
- `INVALID_SESSION_RETRY`

That would keep the bug-fixed behavior while making launch telemetry and testing much clearer.

## 2. Separate operator UX from launch control flow

Relevant source lines:

- `initializer.ts:110-129`
- `initializer.ts:196-205`
- `initializer.ts:415-443`

Banner printing, popup startup, issue-link printing, and spinner emission are mixed directly into the state transitions. In v5, isolating those into a launch reporter/observer would let the actual session state machine stay deterministic and testable.

## 3. Make the launch phases first-class named steps

Relevant source lines:

- whole function, especially `initializer.ts:138-451`

This function already behaves like a mature state machine. A v5 rewrite should preserve that by codifying explicit phases such as:

1. normalize config
2. prepare operator surfaces
3. init page
4. probe session/auth state
5. interactive authentication if needed
6. final injection
7. validate session internals
8. patch/license overlay
9. finalize public client

The current behavior is already phase-structured; naming those phases would reduce migration risk.

## 4. Distinguish launch diagnostics from fatal conditions

Relevant source lines:

- `initializer.ts:173-177`
- `initializer.ts:196-205`
- `initializer.ts:453-474`

There is a lot of valuable operational observability here. In v5, preserving it through structured launch events (rather than mixed console/log/spinner output) would make replay, tests, and remote diagnosis easier without changing behavior.

## 5. Wrap page-global mutations behind a narrower adapter

Relevant source lines:

- `initializer.ts:217`
- `initializer.ts:300-301`
- `initializer.ts:305`

The current code carefully mutates globals like `window.Store` and launch flags for timing reasons. Those mutations are probably behavior-critical. In v5 they should likely live behind a dedicated “page runtime adapter” so the exact hacks remain preserved but are easier to audit and evolve.

## 6. Treat socket/event transport as core infrastructure, not an optional extra

Relevant source context:

- `initializer.ts:62-64`
- `controllers/events.ts`
- `cli/server.ts:437-505`

Given the v5 direction, socket-driven integration should likely become part of the default runtime contract. The legacy code already has multiple overlapping event systems (`ev`, `Spin`, `Client.events`, socket.io bridge). In v5, consolidating these around an always-on transport layer would reduce duplication and make plugins/integrations first-class.

## 7. Remove legacy multi-device branching from the launcher model

Relevant source lines:

- `initializer.ts:67`
- `initializer.ts:147-152`
- `initializer.ts:283-288`
- `browser.ts:220-232`

In 2026, multi-device is not a special mode anymore. A v5 rewrite should model MD as the only supported session shape, which means:

- no MD detection/restart branch
- no legacy-vs-MD session divergence
- no config surface that suggests non-MD launch is viable.

That simplification should make the bootstrap state machine much smaller without changing the effective modern behavior.

## 8. Make environment absorption unconditional and centralized

Relevant source lines:

- `initializer.ts:99-107`
- `utils/tools.ts:76-84`
- `cli/setup.ts:106-110`

The current code absorbs env vars in more than one place and still carries Docker-specific gating in the initializer. For v5, env-to-config absorption should likely be a single unconditional preprocessing step that happens before launch, regardless of Docker or CLI mode.
