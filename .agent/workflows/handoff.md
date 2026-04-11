---
description: Default terminal delegation workflow
ack_mode: minimal
---
# Handoff - Default Delegation

This workflow handles terminal delegation only.

Allowed branch:
- `--all` only (skip split and delegate everything)

## File Creation Rules
- When creating files in `.switchboard/`, always use `IsArtifact: false` to prevent path validation errors.

## Active Document Guardrail
- Discard IDE-injected active documents at workflow start.
- Only read file content when the user's current message explicitly names a file path and uses a directive verb (for example: `review`, `read`, `use`, or `apply`).

## Quick Reference
- **Valid Actions**: `execute`
- **Invalid Actions**: `delegate_task` (use `execute` via the active `handoff` flow)

## Steps

1. **Start**
   - Call `start_workflow(name: "handoff", force: true)` to auto-replace any stale workflows.

2. **Split Tasks** (skip if `--all`)
   - Routine = low-risk (delegatable)
   - Complex = architectural (keep local)
   - MUST mark Routine tasks `[DELEGATED]` in task.md
   - Call `complete_workflow_phase(phase: 1, workflow: "handoff")`.

3. **Prepare Delegation Payload**
   - Stage required artifacts in `.switchboard/handoff/`.
   - If approved plan exists, reference it directly and require direct execution (no re-planning).
   - If no plan exists, create `.switchboard/handoff/task_batch_[TIMESTAMP].md`.

4. **Deliver (Terminal)**
   - Call `send_message(action: "execute", payload)`.
   - **Payload format**: A single line only: `Please execute the plan at: [ABSOLUTE PATH]`. Do NOT include summaries, context, or multi-line essays.
   - InboxWatcher will write an auto-delivery receipt on delivery (unless metadata.no_auto_ack=true).
   - Capture dispatch `id` and `createdAt`.
   - Call `complete_workflow_phase(phase: 2, workflow: "handoff", artifacts: [{ path: ".switchboard/handoff", description: "Delegation payload staged and dispatched" }])`.

5. **Wait for User Confirmation + Merge**
   - After dispatch, STOP and ask the user to confirm when the remote worker has finished (for example: "Reply `done` when remote execution is complete.").
   - Do not rely on `submit_result`/`status_update` correlation.
   - On user confirmation, verify delegated changes and merge with local work.
   - Call `complete_workflow_phase(phase: 3, workflow: "handoff")`.

Notes:
- ack_mode: minimal — the system auto-delivery receipt is accepted as 'started' evidence for the dispatch step. Final completion is confirmed by explicit user input ("done", "finished", etc.).

## Final-Phase Recovery Rule
- Phase 3 is terminal for `handoff`. Do NOT call phase 4.
- If phase 3 succeeded but summary still shows active:
  - Call `get_workflow_state`.
  - If still active, call `stop_workflow(reason: "Recovery: final phase completed but workflow remained active")`.
