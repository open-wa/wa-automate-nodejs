# AGENTS.md - Switchboard Protocol

## 🚨 STRICT PROTOCOL ENFORCEMENT 🚨

This project relies on **Switchboard Workflows** defined in `.agent/workflows`.

**Rule #1**: If a user request matches a known workflow trigger, you **MUST** execute that workflow exactly as defined in the corresponding `.md` file. Do not "wing it" or use internal capability unless explicitly told to ignore the workflow.

**Rule #2**: You MUST NOT call `send_message` with unsupported actions. Only `submit_result` and `status_update` are valid (see Code-Level Enforcement below). The tool will reject unrecognized or unauthorized actions.

**Rule #3**: The `send_message` tool auto-routes actions to the correct recipient based on the active workflow. You do NOT need to specify a recipient. If the workflow requires a specific role (e.g. `reviewer`), ensure an agent with that role is registered.

### Workflow Registry

| Trigger Words | Workflow File | Description |
| :--- | :--- | :--- |
| `/accuracy` | **`accuracy.md`** | High accuracy mode with self-review (Standard Protocol). |
| `/improve-plan` | **`improve-plan.md`** | Deep planning, dependency checks, and adversarial review. |
| `/challenge`, `/challenge --self` | **`challenge.md`** | Internal adversarial review workflow (no delegation). |
| `/chat` | **`chat.md`** | Activate chat consultation workflow. |
| `/archive` | **`archive.md`** | Query or search the plan archive. |
| `/export` | **`export.md`** | Export current conversation to archive. |


### ⚠️ MANDATORY PRE-FLIGHT CHECK

Before EVERY response, you MUST:

1. **Scan** the user's message for explicit workflow commands from the table above (prefer `/workflow` forms).
2. **Do not auto-trigger on generic language** (for example: "review this", "delegate this", "quick start") unless the user explicitly asks to run that workflow.
3. **If a command match is found**: Read the workflow file with `view_file .agent/workflows/[WORKFLOW].md` and execute it step-by-step. Do NOT improvise an alternative approach.
4. **Fast Kanban Resolution**: If the user asks about plans in specific Kanban columns (e.g. "update all created plans"), you MUST use the `get_kanban_state` MCP tool to instantly identify the target plans.
5. **If no match is found**: Respond normally.

### Execution Rules

1. **Read Definition**: Use `view_file .agent/workflows/[WORKFLOW].md` to read the steps.
2. **Execute Step-by-Step**: Follow the numbered steps in the workflow.
   - If a step says "Call tool X", call it.
   - If a step says "Generate artifact Y", generate it.
3. **Do Not Skip**: Do not merge steps or skip persona adoption unless the workflow explicitly allows it (e.g. `// turbo`).
4. **Do Not Improvise**: If a workflow exists for the user's request, you MUST use it. Calling tools directly without following the workflow is a protocol violation and will be rejected by the tool layer.

### Code-Level Enforcement

The following actions are enforced at the tool level and WILL be rejected if misused:

| Action | Required Active Workflow |
| :--- | :--- |
| `submit_result` | *(no restriction — this is a response)* |
| `status_update` | *(no restriction — informational)* |

Sending to non-existent recipients is always rejected (even when auto-routed).

### 🏗️ Switchboard Global Architecture

```
User ──► Switchboard Operator (chat.md)
              │  Plans captured in .switchboard/plans/
              │
              ├──► /improve-plan   Deep planning, dependency checks, and adversarial review
              └──► Kanban Board    Plans moved through workflow stages (Created → Coded → Reviewed → Done)

All file writes to .switchboard/ MUST use IsArtifact: false.
Plans are executed via Kanban board workflow, not delegation.
```

Conversational routing: when the intent is to advance a kanban card or send a plan to the next agent/stage, prefer `move_kanban_card(sessionId, target)` over raw `send_message`. The `target` may be a kanban column label, a built-in role, or a kanban-enabled custom agent name; generic conversational `coded` / `team` targets are smart-routed by plan complexity.

### 📚 Available Skills

Skills provide specialized capabilities and domain knowledge. Invoke with `skill: "<name>"`.

| Skill | When to Use |
|-------|-------------|
| `archive` | User asks to "search archives", "query archives", "find old plans", "export conversation" |
| `review` | User asks to review code changes, a PR, or specific files |

**Usage**: Call `skill: "archive"` before performing archive operations to access detailed tool documentation and examples.

**Skill Files Location**: `.agent/skills/` (distributed with plugin)
