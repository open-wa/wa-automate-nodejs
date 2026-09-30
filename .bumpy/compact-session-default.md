---
'@open-wa/core': minor
'@open-wa/client': minor
'@open-wa/config': minor
'@open-wa/session-sync': minor
'@open-wa/wa-automate': minor
'@open-wa/api': patch
---

Make compact encrypted session files the default authentication method. The baked pre-init patch restores authentication and an acknowledged pending inbox from `{sessionId}.data.json`, without retaining a persistent browser profile. Existing file/path and seed settings remain available, and S3 persistence uses the existing PicoS3 transport with conditional ownership and writes.

Set `legacyDataDirAuth: true` to keep the previous profile authentication behavior and an existing linked profile. First use of compact authentication requires pairing; obsolete token JSON and profile directories are not automatically converted. Unsupported WhatsApp builds and drivers must use the legacy fallback. There is no public `portableSession` option or caller-supplied encryption key.

Incoming message handlers acknowledge pending messages after successful processing; retries remain at least once. This release has not received integrated browser/S3 acceptance, and abrupt-crash durability for all native operations is not established.
