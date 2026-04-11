---
description: Internal adversarial review workflow (self mode only)
---
# Challenge - Internal Adversarial Review

This workflow is internal-only. It does not dispatch to external agents.

Use this for:
- `/challenge --self`
- `/challenge`

## File Creation Rules
- When creating files in `.switchboard/`, always use `IsArtifact: false` to prevent path validation errors.

## Quick Reference
- **Valid Actions**: None (internal-only workflow, no cross-agent delegation)

## CRITICAL CONSTRAINTS

> [!CAUTION]
> **YOU ARE A REVIEWER. NOT AN IMPLEMENTER. DO NOT CONFUSE THE TWO.**

- **NO IMPLEMENTATION**: You are strictly FORBIDDEN from modifying any project source files to fix the issues you identify. This applies to ALL tools including `write_to_file`, `replace_file_content`, `multi_replace_file_content`, and `run_command`.
- **PLAN ONLY**: Your ONLY permissible write action (beyond the review artifact files) is updating the existing Feature Plan document (`.switchboard/plans/features/*.md`) to reflect approved findings.
- **VIOLATION RESPONSE**: If you feel tempted to fix something yourself, STOP IMMEDIATELY. Call `notify_user` to explain what you found and await instructions. Do not apply the fix.
- **NO SKIPPING REVIEWS**: You must ALWAYS perform a fresh adversarial review. NEVER skip the review just because the plan document already contains headers like "Adversarial Synthesis", "Grumpy Critique", or "Balanced Response". Existing reviews must be considered stale and overwritten.
- **CONTENT PRESERVATION**: You are FORBIDDEN from deleting original implementation details, prose, or context. Your goal is to **APPEND** or **OVERWRITE ONLY THE REVIEW SECTION**, not replace or truncate the rest of the plan.
- **NOTE**: This is advisory governance. The tools remain available; compliance is required by role, not enforced by the system.

## Steps

1. **Start + Scope**
   - Call `start_workflow(name: "challenge", force: true)` to auto-replace any stale workflows.
   - Identify the exact plan/code scope to review from the user's message (e.g. a file link, plan name, or path).
   - Resolve the target plan path now and store it as `targetPlanFile`. If no matching plan is found, ask the user to confirm before proceeding.
   - **No Kanban mutation rule**: Do NOT pin, derive, or pass any `sessionId` to workflow phase completion calls in this workflow.
   - Resolve output paths up front:
     - `grumpyPath` default: `.switchboard/reviews/grumpy_critique.md`
     - `balancedPath` default: `.switchboard/reviews/balanced_review.md`
     - If user explicitly requests different filenames, use those filenames for all subsequent steps.
   - Call `complete_workflow_phase(phase: 1, workflow: "challenge", artifacts: [{ path: ".switchboard", description: "Internal review scope established" }])`.

2. **Dependency & Conflict Check**
   - MANDATORY: Read the code of any service, utility, or module being modified or worked around.
   - MANDATORY: Scan `.switchboard/plans/` or the current Kanban state to identify if this plan conflicts with, or relies on, other pending work.
   - Do not assume black-box behavior. Verify actual implementation before review.
   - Call `complete_workflow_phase(phase: 2, workflow: "challenge", artifacts: [{ path: ".switchboard", description: "Dependencies verified" }])`.

3. **Execute Internal Review**
   - ⛔ Do NOT implement any findings. Update the Feature Plan only.
   - ⚠️ ALWAYS perform a fresh review. If the plan already contains an "Adversarial Synthesis", overwrite it. Do NOT skip this step.
   - MUST read current plan/task objective.
   - MUST read `.agent/personas/grumpy.md`. If missing, HALT.
   - Generate `grumpyPath` in CRITICAL/MAJOR/NIT format.
   - MUST include at least 5 distinct findings.
   - MUST read `.agent/personas/lead_developer.md`. If missing, HALT.
   - Generate `balancedPath` with:
     - Summary of Review
     - Valid Concerns
     - Action Plan
     - Dismissed Points
   - Call `complete_workflow_phase(phase: 3, workflow: "challenge", artifacts: [{ path: "<grumpyPath>", description: "Adversarial critique" }, { path: "<balancedPath>", description: "Balanced synthesis" }])`.

4. **Present Findings**
   - Notify user with both artifact paths:
     - `grumpyPath`
     - `balancedPath`
   - Call `complete_workflow_phase(phase: 4, workflow: "challenge", artifacts: [{ path: ".switchboard/reviews", description: "Findings presented to user" }])`.

5. **Complete + Integrate**
   - MANDATORY before calling `complete_workflow_phase`: update the original Feature Plan document with the Action Plan items from the balanced review.
     - Use `targetPlanFile` pinned in Step 1 as the absolute path to the Feature Plan.
     - Edit the Feature Plan to integrate the approved Action Plan items. ⚠️ **CRITICAL: Ensure you do NOT truncate, summarize, or delete the existing implementation steps, code blocks, or goal statements when editing.** This is a permitted write under the CRITICAL CONSTRAINTS block — it is orchestration, not implementation.
   - Call `complete_workflow_phase(phase: 5, workflow: "challenge", artifacts: [{ path: "<balancedPath>", description: "Final internal review output" }, { path: "<targetPlanFile>", description: "Feature Plan updated with review findings" }])`.
   - **Kanban safety**: This workflow is advisory-only. Do NOT trigger, request, or imply Kanban column transitions from challenge completion.

## Final-Phase Recovery Rule
- Phase 5 is terminal for `challenge`. Do NOT call phase 6.
- If phase 5 succeeded but summary still shows active:
  - Call `get_workflow_state`.
  - If still active, call `stop_workflow(reason: "Recovery: final phase completed but workflow remained active")`.
