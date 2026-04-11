---
description: Deep planning, dependency checks, and adversarial review
---

# Improve Plan

Use this workflow to strengthen an existing feature plan in a single fluid pass.

## Critical Constraints
- **NO IMPLEMENTATION**: You are strictly FORBIDDEN from modifying any project source files. Your ONLY permissible write action is updating the existing Feature Plan document.
- **CONTENT PRESERVATION**: You are FORBIDDEN from deleting original implementation details, code blocks, prose, or goal statements. Append and refine; do not truncate.
- **SINGLE PASS**: Complete enhancement, dependency checks, adversarial critique, balanced synthesis, and plan update in one continuous response.

## Steps

1. **Load the plan and verify dependencies**
   - Read the target plan file and treat it as the single source of truth.
   - Read the actual code for any services, utilities, or modules referenced by the plan.
   - **Query active Kanban plans for dependencies (DO NOT scan the plans folder directly):**
     - Call the `get_kanban_state` MCP tool (no column filter) to retrieve all active plans grouped by Kanban column.
     - Inspect plans in **New** and **Planned** columns for potential dependencies and conflicts.
     - **Exclude plans in Completed, Intern, Lead Coder, Coder, and Reviewed columns** — these are already implemented (or in final review) and irrelevant for dependency/conflict analysis.
     - Document any cross-plan conflicts with the active plan set only.
     - **If the database query fails:** Do not fall back to unfiltered file scanning. Instead, note the uncertainty in the `## Edge-Case & Dependency Audit` section under `Dependencies & Conflicts`.

2. **Improve the plan**
   - Fill in underspecified sections.
   - Break work into clear execution steps with file paths and line numbers.
   - Add a **Complexity Audit** section using the criteria below.
   - Add a **Dependencies** section checking for conflicts with other plans.
   - Do not add net-new product scope unless it is strictly implied by the existing plan.

   **Complexity Criteria:**
   
   **Routine:**
   - Single-file, localized changes (text updates, button renames, CSS tweaks)
   - Reuses existing patterns (calling an already-implemented handler, adding a field to an existing struct)
   - Low risk (no architectural changes, no multi-system coordination)
   - Small scope (typically <20 lines of code per change)
   
   **Complex / Risky:**
   - Multi-file coordination (changes span 3+ files with tight coupling)
   - New architectural patterns (introducing new state management, new message types, new DB schema)
   - Data consistency risks (race conditions, state synchronization across systems)
   - Breaking changes (modifying core data structures, changing column definitions)
   
   **"Routine + Moderate" (Mixed Complexity):**
   - Use this label when a plan has BOTH routine and moderate components
   - Majority is routine (70%+ of changes are straightforward)
   - One or two moderate pieces that add risk but are well-scoped
   - No architectural rewrites — the moderate parts extend existing patterns
   - Example: A plan with simple UI changes (routine) plus a file rename-on-save with multi-reference updates (moderate)

3. **Run the internal adversarial review**
   - First, produce a sharp Grumpy-style critique focused on assumptions, risks, race conditions, missing error handling, and validation gaps.
   - Immediately follow with a balanced synthesis that keeps valid concerns, rejects weak ones, and converges on the strongest execution strategy.

4. **Update the original plan file**
   - Write the improvement findings back into the same feature plan file.
   - Preserve all existing implementation steps, code blocks, and goal statements.
   - Mark completed checklist items when appropriate.

5. **Complete the workflow**
   - Call `complete_workflow_phase` with `workflow: "improve-plan"`, `phase: 1`, and the updated plan as the artifact.
   - End by recommending whether the plan should go to the Coder agent or the Lead Coder.
