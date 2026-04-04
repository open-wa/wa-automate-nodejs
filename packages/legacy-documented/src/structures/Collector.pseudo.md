# Collector.ts pseudocode trace

Source of truth: `packages/legacy/src/structures/Collector.ts`

## Role

- Generic event collector abstraction adapted from discord.js.
- Underpins higher-level collection flows such as message collection.

## Main flow

- `Collector.ts:12-16` — custom `Collection` wrapper with JSON serialization.
- `Collector.ts:30-58` — option types for collection count/time/idle/disposal behavior.
- `Collector.ts:64-140` — `Collector` base constructor:
  - store filter/options
  - create collected-item registry
  - bind collect/dispose handlers
  - arm time/idle timers when configured.
- `Collector.ts:147-186` — `handleCollect(...)` and `handleDispose(...)`
  - evaluate whether the payload should be collected/disposed
  - update collection state
  - emit lifecycle events.
- `Collector.ts:194-218` — `next` promise resolves on next collected item or rejects when collection ends first.
- `Collector.ts:226+` — stop/reset/end-check helpers and timer housekeeping.

## Why this matters for v5

- This file captures a reusable async-interaction pattern already present in the codebase.
- If plugins need conversational or event-window abstractions, collectors are a natural building block.

## Behavioral contract / pseudo tests

- Collectors should stop deterministically on time/idleness/max-processed/max-collected conditions.
- Collectors should emit clear collect/dispose/end lifecycle events.
- `next` should either resolve with the next item or reject with the collected set when the collector ends first.
- Timer reset logic should not resurrect an already ended collector.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Generic timed collector abstraction | Preserve | Useful reusable runtime primitive. |
| Exact discord.js-inspired implementation | Intentionally changed | Internal architecture can differ. |

## Inputs / outputs / side effects

- Inputs: filter function, collector options, incoming event payloads.
- Outputs: collected item set and lifecycle events.
- Side effects: timer allocation and event listener registration.

## Failure taxonomy

- Filter/handler failure
- Timer lifecycle failure
- Collector not ending when expected

## Dependency contracts

- Requires: callers provide a valid filter and a subclass-specific collection key/disposal strategy.
- Guarantees: subclasses get consistent time/max/idle lifecycle handling.

## State transitions

- `CREATED -> COLLECTING -> ENDED`
- `COLLECTING -> IDLE_TIMEOUT | TIME_TIMEOUT | LIMIT_REACHED | USER_STOPPED`
