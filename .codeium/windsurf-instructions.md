# Switchboard Configuration for Windsurf (Cascade)

This project uses the **Switchboard** protocol for cross-IDE agent collaboration.
Windsurf's Cascade agent can participate via the Switchboard MCP server.

## Setup

1. Ensure the Switchboard MCP server is running (started by the VS Code extension).
2. Connect Cascade to the MCP server endpoint.
3. Use the workflow triggers below to coordinate with other agents.

## Available MCP Tools

- **send_message** — Send structured messages for workflow actions (`execute`, `delegate_task`).
- **check_inbox** — Read messages from inbox/outbox (`verbose=true` for full payloads).
- **get_team_roster** — Discover registered terminals/chat agents and their roles.
- **start_workflow** / **complete_workflow_phase** / **stop_workflow** — Workflow control.
- **get_workflow_state** — Inspect active workflow and phase status.
- **run_in_terminal** — Execute commands in a registered terminal.
- **set_agent_status** — Update terminal/chat availability status.
- **handoff_clipboard** — Copy prepared handoff artifacts to clipboard.

## Workflow Triggers

| Trigger | Workflow | Description |
|:--------|:---------|:------------|
| `/handoff` | handoff | Delegate tasks to external agents |
| `/handoff-chat` | handoff-chat | Clipboard/chat delegation workflow |
| `/handoff-relay` | handoff-relay | Execute-now, stage-rest relay workflow |
| `/handoff-lead` | handoff-lead | One-shot lead execution workflow |
| `/improve-plan` | improve-plan | Deep planning, dependency checks, and adversarial review |
| `/accuracy` | accuracy | High-accuracy solo mode |
| `/chat` | chat | Product Manager consultation (no code) |
