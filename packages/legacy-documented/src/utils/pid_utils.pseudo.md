# utils/pid_utils.ts pseudocode trace

Source of truth: `packages/legacy/src/utils/pid_utils.ts`

## Role

- Utility for aggregating resource usage across a process tree.

## Main flow

- `pid_utils.ts:14-20` — `pidTreeUsage(pid)`:
  - normalize a single pid or pid array
  - expand each to its descendant process tree with `pidtree`
  - de-duplicate all PIDs
  - query aggregate stats with `pidusage`
  - return the usage map.

## Why this matters for v5

- Small helper, but relevant if the runtime/plugin host wants stronger process/resource observability.

## Behavioral contract / pseudo tests

- Resource-observability helpers should account for descendant processes, not just the parent pid.
- Duplicate pids should be de-duplicated before usage aggregation.
- Failure in pid inspection should be reportable without destabilizing the main runtime.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Process-tree observability helper | Preserve | Still useful operationally. |
| Exact pid libraries | Intentionally changed | Implementation can change. |

## Inputs / outputs / side effects

- Inputs: pid or pid list.
- Outputs: aggregated per-pid stats.
- Side effects: process-tree inspection calls.

## Failure taxonomy

- Pid tree lookup failure
- Usage-stat collection failure

## Dependency contracts

- Requires: access to process-tree and pid-usage providers.
- Guarantees: callers get de-duplicated tree-aware stats rather than parent-only metrics.

## State transitions

- `PID_GIVEN -> TREE_EXPANDED -> STATS_COLLECTED | OBSERVABILITY_ERROR`
