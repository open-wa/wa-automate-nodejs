# Switchboard Configuration for github

This project uses the **Switchboard** protocol for cross-IDE agent collaboration.

## Available MCP Tools

When the Switchboard MCP server is connected, you have access to these tools:

### Messaging (Cross-IDE)
- **send_message** — Send structured messages to other agents. Actions: `delegate_task`, `execute`.
- **check_inbox** — Read messages from an agent's inbox or outbox. Use `verbose=true` for full payloads.
- **get_team_roster** — Discover registered terminals/chat agents and role assignments.

### Workflow Management
- **start_workflow** — Begin a workflow (e.g., `handoff`, `improve-plan`, `challenge`, `accuracy`).
- **get_workflow_state** — Inspect active workflow and phase state.
- **complete_workflow_phase** — Mark a workflow phase as done (enforces step ordering and required artifacts).
- **stop_workflow** — End the current workflow.

### Terminal Management
- **run_in_terminal** — Send commands to a registered terminal.
- **set_agent_status** — Update terminal/chat status.
- **handoff_clipboard** — Copy staged handoff artifacts to clipboard.

## Messaging Protocol

Messages are delivered via the filesystem:
- **Inbox**: `.switchboard/inbox/<agent>/` — Incoming commands (`execute`, `delegate_task`).
- **Outbox**: `.switchboard/outbox/<agent>/` — Delivery artifacts and receipts.

## Workflow Triggers

| Trigger | Workflow | Description |
|:--------|:---------|:------------|
| `/handoff` | handoff | Delegate tasks to external agents |
| `/handoff-chat` | handoff-chat | Clipboard/chat delegation workflow |
| `/handoff-relay` | handoff-relay | Execute-now, stage-rest relay workflow |
| `/handoff-lead` | handoff-lead | One-shot lead execution workflow |
| `/improve-plan` | improve-plan | Deep planning, dependency checks, and adversarial review |
| `/challenge` | challenge | Internal adversarial review (no Kanban auto-move) |
| `/accuracy` | accuracy | High-accuracy solo mode |
| `/chat` | chat | Product Manager consultation (no code) |
