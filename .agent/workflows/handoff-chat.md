---
description: Clipboard/chat delegation workflow
---
# Handoff-Chat - Clipboard Delegation

This workflow prepares delegation instructions for manual chat paste.

Allowed branch:
- `--all` only (skip split and delegate everything)

## File Creation Rules
- When creating files in `.switchboard/`, always use `IsArtifact: false` to prevent path validation errors.

## Quick Reference
- **Valid Actions**: None (clipboard workflow, no MCP cross-agent delegation)

## Steps

1. **Start**
   - Call `start_workflow(name: "handoff-chat", force: true)` to auto-replace any stale workflows.

2. **Split Tasks** (skip if `--all`)
   - Routine = low-risk (delegatable)
   - Complex = architectural (keep local)
   - MUST mark Routine tasks `[DELEGATED]` in task.md
   - Call `complete_workflow_phase(phase: 1, workflow: "handoff-chat")`.

3. **Prepare Clipboard Payload**
   - Create staged handoff artifact under `.switchboard/handoff/`.
   - Copy the payload using `handoff_clipboard(file: "<path>")`.
   - Tell user exactly which file was copied.
   - Call `complete_workflow_phase(phase: 2, workflow: "handoff-chat", artifacts: [{ path: ".switchboard/handoff", description: "Clipboard payload prepared" }])`.

4. **Wait for User Confirmation + Merge**
   - Wait for the user to confirm the pasted delegate has finished.
   - On confirmation, verify and merge changes locally.
   - Call `complete_workflow_phase(phase: 3, workflow: "handoff-chat")`.

## Final-Phase Recovery Rule
- Phase 3 is terminal for `handoff-chat`. Do NOT call phase 4.
- If phase 3 succeeded but summary still shows active:
  - Call `get_workflow_state`.
  - If still active, call `stop_workflow(reason: "Recovery: final phase completed but workflow remained active")`.
