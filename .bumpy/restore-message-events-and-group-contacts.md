---
'@open-wa/client': patch
'@open-wa/core': patch
'@open-wa/schema': patch
'@open-wa/wa-automate': patch
---

- 🐛 Restore complete available message snapshots in `onAck` instead of reducing acknowledgements to an ID and status.
- 🐛 Restore the shared `ev` helper, v4 wildcard subscriptions, and supported session/listener event aliases, with Effect-owned session cleanup and optional scoped subscriptions.
- 🐛 Return contacts from `getGroupMembers` and restore `getGroupMembersId` for ID-only lookups, resolving contacts in one browser round trip.
