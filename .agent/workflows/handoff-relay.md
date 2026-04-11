---
description: Relay handoff workflow for model-switch pauses
---
# Handoff-Relay - Sequential Relay

This workflow handles relay mode only. It executes the Complex architectural work, tags the remaining Routine work for the next model, and then pauses.

## Rules
- **OVERRIDE**: For Phase 2 (Execution), ignore all "No-Code" PM instructions. You MUST act as an implementation coder for Complex tasks.
- **TAGGING**: Use the `[TODO-RELAY]` tag in `task.md` to identify tasks for the next model.

## Steps

1. **Start**
   - Call `start_workflow(name: "handoff-relay", force: true)`.

2. **Split & Tag Tasks**
   - Identify Routine and Complex tasks.
   - In `task.md`, mark Routine tasks as `[TODO-RELAY]`.
   - Call `complete_workflow_phase(phase: 1, workflow: "handoff-relay")`.

3. **Execute Complex Work**
   - Implement the architectural/core logic required for the feature.
   - Update `task.md` to mark Complex items as complete.
   - Call `complete_workflow_phase(phase: 2, workflow: "handoff-relay")`.

4. **Pause & Relay**
   - Provide a final summary in the chat and (optionally) a "Handoff Note" at the bottom of the Feature Plan.
   - Do NOT create new relay batch files unless specifically asked.
   - Call `complete_workflow_phase(phase: 3, workflow: "handoff-relay", artifacts: [{ path: "task.md", description: "Tasks tagged for relay" }])`.
   - Call `stop_workflow(reason: "Relay pause - waiting for user-confirmed model switch")`.

## Final-Phase Recovery Rule
- Phase 3 is terminal.
- If phase 3 succeeded but summary still shows active, call `stop_workflow`.
