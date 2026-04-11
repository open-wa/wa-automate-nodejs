---
name: Fix Plans Dropdown
description: Diagnose and fix stale or missing plan entries in the Switchboard plans dropdown.
---

# Fix Plans Dropdown Skill

Use this skill when the Switchboard sidebar dropdown shows stale plans that should be gone, or expected plans that are missing.

## Decision Gate

First, determine which case you are dealing with:

- **Stale plan visible** → a plan appears in the dropdown but should no longer be active (e.g., completed or deleted).
- **Expected plan missing** → a plan you created or know about does not appear in the dropdown.

---

## Step 1: Identify the Workspace Root

```
vscode.workspace.workspaceFolders[0].uri.fsPath
```

All paths below are relative to this root. Confirm it is correct before proceeding.

---

## Step 2: Inspect Runsheets

Runsheets are the source-of-truth records for known plans.

- Location: `.switchboard/sessions/*.json`
- Each file contains: `sessionId`, `planFile`, `brainSourcePath` (if from brain), `completed` (if finished), `events`.

**What to look for:**

| Field | What it means |
|---|---|
| `completed: true` | Plan is finished — should not appear in dropdown unless tombstone is missing |
| `brainSourcePath` present | Plan came from a brain source — registry membership controls visibility |
| `brainSourcePath` absent | Local plan — always visible (no registry gate) |

---

## Step 3: Verify Registry Membership

Brain-sourced plans are **only visible** if their path is registered in `switchboard.workspaceBrainPaths`.

To inspect:
1. Open VS Code Command Palette → **Preferences: Open Workspace Settings (JSON)**
2. Look for `switchboard.workspaceBrainPaths` — an array of absolute file paths.
3. Normalize paths for comparison: lowercase on Windows, resolve symlinks, strip trailing separators.

**Missing-plan diagnosis:**
- If the plan's `brainSourcePath` (normalized) is **not** in `workspaceBrainPaths`, it will not appear. The fix is to register it.
- To register: add the normalized absolute path to the `workspaceBrainPaths` array in workspace settings.

---

## Step 4: Inspect Tombstones

Tombstones permanently exclude plans from the dropdown.

- Location: `.switchboard/plan_tombstones.json`
- Format: a JSON array of SHA-256 hex hashes (64 hex characters each).
- Each hash is computed as: `SHA-256(normalizedAbsoluteBrainPath)` where the path is lowercased on Windows.

**Stale-plan diagnosis:**
- If a plan is still visible but `completed: true` in its runsheet, check whether its path hash is in `plan_tombstones.json`.
- If the hash is **absent**, the tombstone write may have failed. Add the hash manually to the array as a string entry.

**Missing-plan diagnosis:**
- If a plan is unexpectedly absent, check whether its path hash is in `plan_tombstones.json`.
- If the hash is **present**, the plan has been tombstoned. Remove the hash entry to restore visibility (if intentional).

**Computing the hash (PowerShell):**
```powershell
$path = "c:\path\to\plan.md".ToLower()  # normalize on Windows
$bytes = [System.Text.Encoding]::UTF8.GetBytes($path)
$hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
($hash | ForEach-Object { $_.ToString("x2") }) -join ""
```

---

## Step 5: Remediation

### Case A — Stale plan still visible

1. Confirm `completed: true` in the runsheet for that `sessionId`.
2. Compute the SHA-256 hash of the plan's normalized `brainSourcePath`.
3. Add the hash to `.switchboard/plan_tombstones.json`.
4. Reload the Switchboard sidebar (reload window or re-open the extension panel).

### Case B — Expected plan missing

1. Confirm the runsheet file exists in `.switchboard/sessions/` for that plan.
2. Check if `brainSourcePath` is set. If so, verify the path exists on disk.
3. Verify the normalized path is in `switchboard.workspaceBrainPaths`. Add it if absent.
4. Verify the normalized path hash is **not** in `plan_tombstones.json`. Remove it if present.
5. Reload the Switchboard sidebar.

---

## Guardrails

- **Do not bulk-delete runsheet files** — this removes plan history permanently.
- **Do not clear `workspaceBrainPaths` entirely** — this hides all brain-sourced plans.
- **Do not modify `plan_tombstones.json` entries you cannot identify** — only edit the specific hash for the affected plan.
- **Always normalize paths** before computing hashes — mismatched casing on Windows is the most common source of false negatives.

---

## Quick Reference

| Symptom | First check | Fix |
|---|---|---|
| Plan visible, should be gone | `completed` in runsheet + hash in tombstones | Add hash to tombstones |
| Plan missing, no `brainSourcePath` | Should always be visible — check runsheet exists | Restore runsheet or re-create plan |
| Plan missing, has `brainSourcePath` | `workspaceBrainPaths` registration | Add normalized path to registry |
| Plan missing, registered but gone | Hash in tombstones | Remove hash from tombstones |
