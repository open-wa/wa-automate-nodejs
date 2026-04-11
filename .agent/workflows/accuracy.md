---
description: Implement with high accuracy and self-review (optimized for per-prompt pricing)
---
# Accuracy — Solo High-Accuracy Mode

> This workflow is designed for **per-prompt pricing** (e.g., Windsurf). Every prompt costs the same regardless of tokens, so the strategy is: **maximize work per prompt, invest heavily in planning to avoid rework.**

## File Creation Rules
- When creating files in `.switchboard/`, always use `IsArtifact: false` to prevent path validation errors.

## Quick Reference
- **Valid Actions**: None (solo workflow, no cross-agent delegation)

## Steps

1. **Start** — Call `start_workflow(name: "accuracy", force: true)` to auto-replace any stale workflows

2. **Deep Context Gathering** (invest time here to avoid rework):
   - MUST read ALL files that will be modified or depend on changes.
   - MUST read existing tests, types, and interfaces related to the task.
   - MUST identify every dependency and side-effect BEFORE writing any code.
   - Read `.agent/rules/switchboard_modes.md` for the "Lead Engineer" persona.
   - **WHY**: Missing context causes mistakes. Mistakes cause rework. Rework costs extra prompts.
   - Call `complete_workflow_phase(phase: 1, workflow: "accuracy", notes: "Context gathered")`

3. **Thorough Plan**:
   - MUST create a detailed plan listing every change, which files are affected, and how to verify each.
   - MUST map dependencies between changes — which must happen first?
   - MUST identify risks: what could break? What edge cases exist?
   - **DESTRUCTION CHECK**: If deleting files, MUST run `grep_search` to confirm nothing depends on them.
   - **RULE**: Spend more time planning. A plan that prevents 1 rework cycle saves an entire prompt.

4. **Implement in verified groups**:
   - Group related changes together — if 3 files need coordinated changes, do all 3 in one pass.
   - **HARD GATE after each group**: You MUST verify before moving to the next group:
     1. MUST call `run_command` with compile/lint/test command. Paste output.
     2. MUST read modified files back. Confirm changes are exactly as intended.
     3. If verification fails: fix immediately. If fix fails twice, **HALT** and notify user.
     4. NEVER proceed to the next group with a broken build.
   - Do as many groups as possible within one prompt — but NEVER skip the verification gate.
   - MUST update `task.md` as you go: mark completed items `[x]`.

5. **Self-Review (Red Team)** — catch issues before they become rework:
   - Review ALL changes holistically as a hostile reviewer.
   - For each modified file, MUST check:
     - Does it handle edge cases (null, empty, boundary values)?
     - Are error paths covered?
     - Is it consistent with existing code style?
     - Could it break anything else in the codebase?
   - MUST list ≥3 concrete potential failure modes per modified file.
   - Document findings in `### Red Team Findings` with specific line numbers.
   - Fix all issues found — NEVER leave them for a future prompt.

6. **Final Verification & Complete**:
   - MUST run final compile/test across the whole project via `run_command`.
   - Review the complete diff for consistency.
   - Output: `**ACCURACY VERIFICATION COMPLETE**`
   - **Call `complete_workflow_phase(phase: 5, workflow: "accuracy")`** (Auto-stops workflow).

## Final-Phase Recovery Rule
- Phase 5 is terminal for `accuracy`. Do NOT call phase 6.
- If phase 5 succeeded but summary still shows active:
  - Call `get_workflow_state`.
  - If still active, call `stop_workflow(reason: "Recovery: final phase completed but workflow remained active")`.
