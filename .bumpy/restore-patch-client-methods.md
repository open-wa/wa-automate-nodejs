---
'@open-wa/client': patch
'@open-wa/core': patch
'@open-wa/schema': patch
---

Restore schema-bound client methods for file sending, editing, reactions, group
information, titles and descriptions through the existing private patch pipeline.
Restore per-group and global participant listeners through the schema event bridge,
including shared ev aliases, and correct the migration guide's unsupported claims.
