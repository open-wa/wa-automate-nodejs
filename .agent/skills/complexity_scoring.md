# Skill: Complexity Scoring

## Overview
Assess and assign numeric complexity scores (1-10) to plans and tasks.

## Usage

When asked to estimate complexity, create a plan, or review complexity:
1. Reference this skill
2. Apply the scoring criteria below
3. Output `**Complexity:** [N]` where N is 1-10

## Scoring Criteria

### 1-2: Very Low
- Trivial config or copy changes
- Single-line fixes
- No logic changes

### 3-4: Low
- Routine single-file changes
- Reuses existing patterns
- Low risk, no architectural changes
- Typically <20 lines of code

### 5-6: Medium
- Multi-file changes (2-3 files)
- Moderate logic additions
- Extends existing patterns
- Some cross-component coordination

### 7-8: High
- New architectural patterns
- Complex state management
- Security-sensitive changes
- Breaking changes to core data structures

### 9-10: Very High
- Architectural rewrites
- New framework integrations
- Multi-system coordination with tight coupling
- Fundamental schema or API changes

## Examples

| Task | Score | Rationale |
|------|-------|-----------|
| Fix a CSS color | 3 | Single file, routine change |
| Add a new button using existing handler | 4 | Single file, reuses pattern |
| Add validation across frontend + backend | 6 | Multi-file, moderate logic |
| Implement new auth middleware | 7 | New pattern, security-critical |
| Migrate to new database layer | 9 | Architectural rewrite |

## Output Format

Always use this exact format in plan metadata:

```markdown
## Metadata
**Tags:** [comma-separated from allowed list]
**Complexity:** [integer 1-10]
```
