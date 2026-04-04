# init_patch.ts pseudocode trace

Source of truth: `packages/legacy/src/controllers/init_patch.ts`

## Role in session bootstrap

- `init_patch.ts:6-10` — `injectInitPatch(page)` injects a large minified/obfuscated page patch during finalization.
- `init_patch.ts:19-20` — `injectProgObserver(page)` injects another minified/obfuscated observer used earlier in `browser.ts` to surface launch progress.
- `init_patch.ts:26-27` — `injectInternalEventHandler(page)` currently injects a minimal console marker (`internal_event_handler_injected`).

## Interpretation

- This file is intentionally opaque at source level because the injected payloads are already built artifacts.
- For migration purposes, the behavioral contract matters more than the raw minified code:
  1. progress observer goes in before full app readiness
  2. final init patch goes in after session validity and license/patch overlay
  3. internal event handler is a lightweight marker/hook.

## v5 transfer note

- Treat these as versioned injectable artifacts, not handwritten business logic.
- The migration work should preserve the insertion points and dependencies first, then decide whether the payloads themselves should remain built artifacts or become source-managed patches.

## Behavioral contract / pseudo tests

- Progress-observer injection should happen early enough to report launch activity while the page is still booting.
- Final init patch injection should happen only after the session is considered valid enough to finalize.
- The system should treat these patches as ordered lifecycle steps, not arbitrary script blobs.
- Failure in a nonessential observer patch should not be conflated with fatal session invalidity.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Ordered lifecycle injection points | Preserve | Timing/placement matters more than implementation form. |
| Exact patch payload contents | Intentionally changed | Artifacts can be regenerated/reimplemented. |

## Inputs / outputs / side effects

- Inputs: page handle and launch lifecycle stage.
- Outputs: injected observer/init behavior in page context.
- Side effects: page-global mutation via script evaluation.

## Failure taxonomy

- Observer injection failure
- Finalization patch injection failure

## Dependency contracts

- Requires: page capable of eval/script injection and caller-controlled lifecycle ordering.
- Guarantees: caller can place observer and finalization logic at separate stages.

## State transitions

- `PAGE_BOOTING -> OBSERVER_PATCHED`
- `SESSION_VALIDATED -> FINAL_PATCHED`
