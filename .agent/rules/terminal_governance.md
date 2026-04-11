# Protocol Enforcement: Terminal Governance

To prevent "stalls" and "UI drifts," all agents MUST adhere to the following terminal registration logic.

## 1. No Manual Bypasses
Directly editing `.switchboard/state.json` is a FAIL-STATE. 
- **Rule**: If `register_terminal` is available, you MUST use it.

## 2. Windows Connectivity (Host PID)
The sidebar UI listens to the **Shell Host**, not the worker process.
- **Action**: Always resolve the **Parent PID** using PowerShell before registration.
- **Validation**: Never register a PID without first verifying its `StartTime` matches the registry entry.

## 3. Tool Recovery Loop
If the MCP server is unresponsive:
1. Check `bridge.json` for pending requests.
2. Attempt to restart the server via `node src/mcp-server/mcp-server.js`.
3. Report the failure to the user before proceeding manually.

## 4. System Script Prohibitions
To prevent process duplication and state corruption, agents MUST NOT manually execute the following core system scripts:
- `inbox-watcher.js`: This logic is embedded in the Extension Host. Manual execution causes race conditions on file processing.
- `mcp-server.js`: This should only be managed by the Extension's `connectMcp` command or the auto-heal logic.

If a terminal appears "empty" or "idle," trust the **InboxWatcher** to handle delivery. Never attempt to "jump-start" a workflow by manually injecting these scripts.

---
*Failure to follow this protocol invites technical debt and UI fragmentation.*
