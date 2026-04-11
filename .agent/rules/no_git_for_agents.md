# Rule: No Git Mutations for Dispatched Agents

## Policy
Agents dispatched via Switchboard (lead coder, coder, intern, and any
sub-agents they spawn) **MUST NOT** execute state-mutating git commands.

### Prohibited Commands
Any git command that changes repository state:
`commit`, `push`, `pull`, `fetch`, `merge`, `rebase`, `reset`,
`checkout` (branch switching), `branch` (create/delete), `stash`,
`cherry-pick`, `revert`, `tag` (create/delete), `am`, `format-patch`.

### Permitted Commands
Read-only git commands that inspect state without modifying it:
`status`, `log`, `diff`, `show`, `blame`, `shortlog`, `describe`.

### Rationale
1. **State coordination**: Only the parent agent or user manages repo state.
2. **Race conditions**: Concurrent git writes from multiple agents corrupt history.
3. **Rollback safety**: The parent agent must track all state changes for recovery.
4. **Atomicity**: Sub-agents cannot coordinate commits across parallel work.

### Enforcement
- **Prompt-level** (active): The `buildKanbanBatchPrompt()` function in
  `src/services/agentPromptBuilder.ts` injects a git prohibition directive
  into every dispatched prompt.
- **Persona-level** (active): All execution personas (lead_coder, coder,
  intern) include the prohibition in their behavioral rules.
- **Tool-level** (future): Runtime interception of git commands at the
  shell layer. Not yet implemented — tracked as a future enhancement.

### Exceptions
None. If an agent needs a git operation performed, it must return work
to the parent agent or user with an explicit request.
