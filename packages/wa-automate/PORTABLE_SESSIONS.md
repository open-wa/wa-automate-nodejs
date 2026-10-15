# Portable session storage

Compact authentication is the only authentication path for `create()`, `createClient()`, and the CLI. The baked, obfuscated pre-init patch restores an encrypted session into a disposable browser profile. There is no `portableSession` option or patch-provider callback. Encryption uses the baked default unless you supply a customer key. The host storage layer handles only the opaque `{ auth, data }` JSON envelope.

Existing browser profiles and obsolete v4 token JSON are not imported. Scan a new QR code when moving to compact authentication. Existing profile directories are left intact. Puppeteer and Playwright are supported; there is no legacy profile fallback.

```ts
import { create } from '@open-wa/wa-automate';

const client = await create({
  sessionId: 'sales',
  sessionDataPath: './sessions',
  s3Sync: {
    bucket: process.env.SESSION_BUCKET!,
    region: 'eu-west-2',
    accessKeyId: process.env.SESSION_ACCESS_KEY!,
    secretAccessKey: process.env.SESSION_SECRET_KEY!,
    directory: '_sessionData',
  },
});
```

The example writes `./sessions/sales.data.json` and `_sessionData/sales.data.json` in S3. Omit `s3Sync` for local persistence. Existing `s3Sync.syncInterval` and `enableLocalCompression` options apply to profile archives, not portable checkpoints: portable writes await remote persistence before reporting success.

## Names and inputs

| Option | Behavior |
| --- | --- |
| No session ID or path | `session.data.json` in the current working directory. |
| `sessionId: 'sales'` | `sales.data.json`. The ID must be a portable filename component. |
| `sessionDataPath: './sessions'` | Store the file in that directory. Absolute paths and `~/` are supported. |
| `sessionDataPath: './sessions/custom.data.json'` | Use that exact filename locally. The S3 object remains `sales.data.json`. |
| `sessionData` | Seed an empty store with the encrypted pair as an object, JSON string, or base64 JSON. Legacy WhatsApp token objects are not converted. |
| `SALES_DATA_JSON` | Session-specific environment seed, with the same formats; takes precedence over `sessionData`. |
| `sessionData: 'NUKE'` | Explicitly invalidate the selected stores and start fresh. Remove this setting after resetting. A session-specific environment seed takes precedence. |
| `sessionDataBucketAuth` | Accept the v4 base64-encoded PicoS3 configuration. Explicit `s3Sync` fields override matching fields. |
| `skipSessionSave: true` | Use S3 without a local payload. Requires S3 configuration. |

For v4 compatibility, any configured path containing `.data.json` is treated as a filename, including names with a suffix after that extension.

The convenience factory still takes programmatic configuration. The environment seed above and encryption environment variables below are supported explicitly; they do not enable loading arbitrary environment/config files. Lower-level `createClient()` accepts the same session file, encryption and S3 settings alongside its driver.

## Customer encryption keys

Supply one optional base64-encoded 32-byte random key. Omit it to use the baked default. Keep the same key and `sessionId` across containers, and store the key separately from the session JSON. No key depends on a hostname, Docker image or filesystem path.

```ts
const client = await create({
  sessionId: 'sales',
  sessionDataEncryptionKey: process.env.OPENWA_SESSION_DATA_ENCRYPTION_KEY,
});
```

`OPENWA_SESSION_DATA_ENCRYPTION_KEY` is also read automatically by `create()`, `createClient()` and the CLI. For mounted Docker secrets, use `sessionDataEncryptionKeyFile` or `OPENWA_SESSION_DATA_ENCRYPTION_KEY_FILE` instead; the file contains the base64 key, with an optional trailing newline. The normal `WA_` environment names also work, with `OPENWA_` taking precedence. Supply the key or its file, never both. Direct SDK options override the environment; the CLI follows normal configuration precedence. Secret files are limited to 4 KiB and read at launch.

There is one key and one payload format, with no previous-key list, key IDs, migration or fallback decryption. Changing the key requires resetting the saved session and scanning a new QR code. Use `sessionData: 'NUKE'` for that reset, then remove it after pairing so subsequent launches reuse the session. An unusable encrypted checkpoint returns to fresh QR pairing and is replaced after pairing.

The file remains `{ auth, data }`. Session decoding, encryption and restoration happen inside the private pre-init patch. Debug responses redact key settings; verbose environment loading prints variable names only.

## Shared storage and recovery

The provider extends `@open-wa/session-sync` and uses its existing `pico-s3` transport. It supports PicoS3 provider names, custom endpoints, a configurable directory prefix, temporary credentials, and storage encryption headers. It does not set a public ACL.

Local and S3 storage allow multiple processes to open the same session. They do not create or acquire companion lock files or objects. Each save replaces the complete checkpoint, and the last completed write wins. Storage does not coordinate WhatsApp activity between those processes.

An existing remote checkpoint is authoritative, including over local files and supplied seeds. Only a missing remote object permits importing a local file or seed. Corrupt payloads return to fresh QR pairing. Storage failures are reported separately from WhatsApp connection state. S3 writes replace the complete object unconditionally, then refresh the local copy. No archive is created.

Logout writes credential-free invalidation markers so older local files or configured seeds cannot silently restore the session. The markers are not usable session payloads. Valid checkpoints always retain exactly the two encrypted `auth` and `data` values. Local storage uses an atomic mode-0600 replacement, with writes serialized within each storage handle.

## Login and incoming messages

WhatsApp's visible screen drives authentication: a QR code means pairing, the chat list means connected, and loading means wait. An invalid saved checkpoint is discarded so a new QR can be scanned. A logout keeps the client and its message listeners alive while the session returns to pairing.

`onMessage` receives ordinary WAPI runtime events. OpenWA does not intercept native database writes or delivery receipts, wait for application callbacks before acknowledging WhatsApp messages, or require an unread-message audit before startup. Handler errors are reported through the event system.

Encrypted session snapshots are saved in the background. A failed save does not block WhatsApp or stop message delivery. Native unread messages can be included in a snapshot; this is not a durable application delivery queue or an at-least-once callback guarantee.

Session files are bound to their session ID; keep that ID when moving a file between hosts. Key handling runs inside the obfuscated patch, with no supported decryption API. Obfuscation cannot prevent an operator who controls the runtime from inspecting or invoking it. Customer keys protect files when the key remains separate; the shared baked default is an obfuscation boundary. Protect session files as credentials.

The integrated browser and S3 paths have not received a live runtime acceptance run. Receipt coverage, concurrent native state changes, and abrupt crashes during outbound sends remain acceptance boundaries; successful graceful saves do not establish crash safety for every native operation. S3 durability depends on the configured provider's object-storage guarantees.
