# How to Plan: The Switchboard Standard

**🚨 STRICT DIRECTIVE FOR AI AGENTS 🚨**
Do NOT skip straight to writing code or outputting a generic implementation plan. You must perform internal cognitive reasoning first. To guarantee this, you must output your plan EXACTLY matching the "Plan Template" at the bottom of this document. The template requires you to simulate an internal adversarial review before you write the proposed changes.

Follow these steps sequentially to formulate your plan:

## Step 1: Understand the Goal
Identify the core problem or feature. Clarify what success looks like. If the user's request is ambiguous, stop and ask clarifying questions before generating a plan.

## Step 2: Complexity, Edge-Case & Dependency Audit
Before writing any implementation steps, audit the system:
*   **Complexity:** Rate the routine vs. complex/risky parts of the request.
*   **Edge Cases:** Identify race conditions, security flaws, backward compatibility issues, and side effects.
*   **Dependencies & Conflicts:** 
    - Query the Kanban database via the `get_kanban_state` MCP tool (no column filter) to retrieve all active plans.
    - Consider plans in **New** and **Planned** columns for dependencies and conflicts. Exclude plans in Completed, Intern, Lead Coder, Coder, and Reviewed columns — these are already implemented.
    - Identify if this plan relies on other active plans or conflicts with concurrent work.
    - If database query fails, document the uncertainty rather than scanning unfiltered.

## Step 3: Improve Plan (`/improve-plan`)
Audit the strategy and stress-test the assumptions:
- Identify missing pieces, implicit dependencies, or assumptions that need hardening
- Decompose large changes into Routine and Complex/Risky tasks
- **Grumpy Persona**: Aggressively critique every assumption. Find edge cases, race conditions, missing error handling, and scope creep.
- **Balanced Persona**: Synthesize the critique and finalize the plan.

## Step 4: The Implementation Spec (Plan Template)
Output your final plan using the exact Markdown structure below. **You must include every section.**

## 5. Exhaustive Implementation Spec
Produce a complete, copy-paste-ready implementation spec. You must maximize your context window to provide the highest level of detail possible. Include:
- Exact search/replace blocks or unified diffs for EVERY file change.
- **NO TRUNCATION:** You are strictly forbidden from using placeholders like `// ... existing code ...`, `// ... implement later`, `TODO`, or omitted middle sections for modified code. Write the exact, final state of the functions or blocks being changed.
- Deep logical breakdowns explaining the *Why* behind each architectural choice before code.
- Inline comments explaining non-obvious logic.

---

# [Plan Title]

## Goal
[1-2 sentences summarizing the objective]

## User Review Required
> [!NOTE]
> [Any user-facing warnings, breaking changes, or manual steps required]

## Complexity Audit
### Routine
- [List routine, safe changes]
### Complex / Risky
- [List complex logic, state mutations, or risky changes]

## Edge-Case & Dependency Audit
- **Race Conditions:** [Analysis]
- **Security:** [Analysis]
- **Side Effects:** [Analysis]
- **Dependencies & Conflicts:** [Identify if this plan relies on or conflicts with other pending Kanban plans]

## Adversarial Synthesis
### Grumpy Critique
[Simulate the Grumpy Engineer: Attack the plan's weaknesses, missing error handling, and naive assumptions.]

### Balanced Response
[Simulate the Lead Developer: Address Grumpy's concerns and explain how the implementation steps below have been adjusted to prevent them.]

## Proposed Changes
> [!IMPORTANT]
> **MAXIMUM DETAIL REQUIRED:** Provide complete, fully functioning code blocks. Break down the logic step-by-step before showing code.

### [Target File or Component 1]
#### [MODIFY / CREATE / DELETE] `path/to/file.ext`
- **Context:** [Explain exactly why this file needs to be changed]
- **Logic:** [Provide a granular, step-by-step breakdown of the logical changes required]
- **Implementation:** [Provide the complete code block, unified diff, or full function rewrite without truncation. Choose ONE primary format per change.]
- **Edge Cases Handled:** [Explain how the code above mitigates the risks identified in the Edge-Case Audit]

### [Target File or Component 2]
...

## Verification Plan
### Automated Tests
- [What existing or new tests need to be run/written?]
