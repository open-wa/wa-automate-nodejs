# Workflow Integrity Protocol

**Applicability**: This protocol applies to **ALL** workflows ending in `.md`.

## 1. Strict Adherence Strategy
Workflows are **Algorithms**, not "Guidelines".
- **Atomic Execution**: You must execute every numbered step in order.
- **No Optimization**: Do not group, skip, or reorder steps unless the workflow explicitly permits it (e.g., `// turbo`).
- **Checklist Logic**: A checklist item `[ ]` is a gate. You cannot pass the gate until the action is physically complete.

## 1.6. Fast-Path Exception (Routine Tasks)
Workflows marked as **Routine** or containing the `// turbo-all` annotation are exempt from the formal `implementation_plan.md` requirement and the mandatory research in Section 1.5.
- **Exempt Workflows**: `audit`.
- **Logic**: For these tasks, skip to **EXECUTION** mode immediately. The agent may still use a `task.md` for internal tracking but should not block the user with a plan review. Do **NOT** perform pre-flight research (e.g. `dir`, `ls`, or existence checks) for scripts/tools explicitly defined in these workflows.

## 1.5. Tool Discovery & Readiness
Every workflow **MUST** begin with a **Mandatory Tool Inventory**.
- **Acknowledge**: Before executing Step 1, you must physically confirm you possess the tools listed.
- **Self-Correction**: If a required tool is missing from your toolkit, **HALT** and ask for clarification. Do NOT attempt to "substitute" with a weaker tool.

## 2. Anti-Simulation Rule (The "Mental Model" Ban)
You are strictly forbidden from "Simulating" execution in your mind.
- **Bad**: "I reviewed the code and it looks correct." (Mental Model)
- **Bad**: "I promise I checked it." (Chat Output)
- **Good**: "I ran `grep` and found 0 occurrences." (Physical Proof)
- **Constraint**: If a step requires a command, **RUN THE COMMAND**.

## 3. Proof of Work (Strict Definition)
Verification steps require **Immutable Artifacts**.
- **Valid Artifacts**: Logs, Screenshots (embedded), Git Diffs, Test Results (exit codes).
- **INVALID Artifacts**: Chat explanations, "Step Complete" messages, User assurances.
- **The "Blind Faith" Ban**: You cannot mark a verification step as passed based on confidence alone.
- **Re-Audits**: If you fix a bug found in an audit, you **MUST** re-run the audit. "I just fixed it" is not valid verification.

## 4. Protocol Optimization
- **Strip Slash Commands**: Do NOT start messages with `/chat` or other reset commands unless specifically required by the CLI's state (e.g. escaping shell mode).
- **Abolish Formal Resets**: Do NOT perform "memory wipes" or persona resets unless context isolation is strictly required for security.
- **Direct Submission**: Prioritize direct technical communication (e.g., "Hey I made this change for this reason, please check").
- **File-Only Submission**: For audits, do NOT copy-paste code snippets. Instead, provide absolute file paths and instruct the auditor to read them directly.
- **Stability vs. Speed**: While stability is key, avoid complex handshakes for internal audits.

## 5. Stability Over Speed
- **Polling**: When interacting with CLI tools, respect the `Stability Polling` protocol (wait for anchors).
- **Stop-The-Line**: If a step fails or produces unexpected output, **HALT** immediately. Do not proceed to the next step "hoping it will work out."

## 6. Mandatory Context Injection
- **The Prime Directive**: This file must be read and injected into the context of **EVERY** session executing a workflow.
- **Agent Responsibility**: If you are starting a workflow, you **MUST** first read this file to bind yourself to these laws.
