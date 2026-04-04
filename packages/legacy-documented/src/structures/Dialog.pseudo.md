# Dialog.ts pseudocode trace

Source of truth: `packages/legacy/src/structures/Dialog.ts`

## Role

- Defines dialog/template types for structured conversational workflows.

## Main contents

- `Dialog.ts:4-66` — interfaces and enums describing:
  - dialog state
  - dialog templates
  - dialog properties/prompts/options
  - validation rules and validation types.
- `Dialog.ts:68-79` — commented-out sketch of a future `processDialog(...)` runtime.

## Why this matters for v5

- Even though the runtime implementation is unfinished, this file captures the intended shape of a guided dialog abstraction.
- That could become relevant for plugin-driven interaction flows later.

## Behavioral contract / pseudo tests

- Dialog definitions should be declarative enough that prompt order, validation, and branching are data-driven.
- A dialog runtime should be able to distinguish current step, accumulated props, last input, completion, and error state.
- Optional skip conditions and validations should be expressible without hardcoding flow into callers.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Declarative dialog schema | Preserve | Still useful as a future extension contract. |
| Unfinished runtime sketch | Deferred | Implementation can be rebuilt later. |

## Inputs / outputs / side effects

- Inputs: dialog template, message inputs, current dialog state.
- Outputs: validated next-step state or completion/error state.
- Side effects: none in current file beyond type/schema definition.

## Failure taxonomy

- Invalid template shape
- Validation mismatch
- Skip-condition ambiguity

## Dependency contracts

- Requires: a future runtime that can consume this declarative schema.
- Guarantees: schema is expressive enough to model ordered prompts and validations.

## State transitions

- `NOT_STARTED -> IN_PROGRESS -> COMPLETED | ERROR`
- `IN_PROGRESS -> STEP_ADVANCED | STEP_SKIPPED | VALIDATION_FAILED`
