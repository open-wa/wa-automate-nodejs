---
name: Get Kanban State
description: Instantly retrieve the list of active plans categorized by their Kanban columns (CREATED, PLAN REVIEWED, CODED, CODE REVIEWED).
---

# Get Kanban State

Use this skill to instantly identify which plans are in which stage of the workflow without manually searching through session logs or the plan registry.

## Use Cases
- When a user asks to "update all plans in the [Column] column".
- When you need to find the oldest pending plan to work on.
- When verifying the current state of a specific session.

## Usage

Call the `get_kanban_state` MCP tool.

### Response Format
The tool outputs a JSON object where keys are Kanban columns and values are arrays of plan metadata:

```json
{
  "CREATED": [
    {
      "topic": "Feature Title",
      "sessionId": "sess_123456789",
      "createdAt": "2026-03-12T..."
    }
  ],
  "PLAN REVIEWED": [],
  "CODED": [],
  "CODE REVIEWED": []
}
```

## Next Steps after identification
Once you have the `sessionId`:
1. Read the session file at `.switchboard/sessions/{sessionId}.json`.
2. Locate the `planFile` path (e.g., `.switchboard/plans/feature_plan_...md`).
3. Read the plan file and proceed with the requested action (improve, detail, review, etc.).
