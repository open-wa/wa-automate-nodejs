# Portable session storage

Compact authentication is the default for `create()`, `createClient()`, and the CLI. The baked, obfuscated pre-init patch restores an encrypted session into a disposable browser profile. There is no `portableSession` option, patch-provider callback, or encryption-key setting. The host storage layer handles only the opaque `{ auth, data }` JSON envelope.

To keep using an existing browser profile, set `legacyDataDirAuth: true` with your existing session ID and profile location. Compact authentication does not import old profile directories or obsolete v4 token JSON; the first compact launch requires pairing. Existing directories are left intact. Puppeteer and Playwright support compact authentication; other drivers require the legacy flag.

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
| Existing file beside the entry script | If the working-directory candidate is absent, use the entry-script-relative candidate for both reads and writes. |
| `sessionData` | Seed an empty store with the encrypted pair as an object, JSON string, or base64 JSON. Legacy WhatsApp token objects are not converted. |
| `SALES_DATA_JSON` | Session-specific environment seed, with the same formats; takes precedence over `sessionData`. |
| `sessionData: 'NUKE'` | Explicitly invalidate the selected stores and start fresh. Remove this setting after resetting. A session-specific environment seed takes precedence. |
| `sessionDataBucketAuth` | Accept the v4 base64-encoded PicoS3 configuration. Explicit `s3Sync` fields override matching fields. |
| `skipSessionSave: true` | Use S3 without a local payload/lock. Requires S3 configuration. |
| `legacyDataDirAuth: true` | Use the previous browser-profile authentication path. |

For v4 compatibility, any configured path containing `.data.json` is treated as a filename, including names with a suffix after that extension.

The convenience factory still takes programmatic configuration. The environment seed above is supported explicitly; it does not enable loading arbitrary environment/config files. Lower-level `createClient()` accepts the same session file and S3 settings alongside its driver. The CLI accepts `--legacy-data-dir-auth` for profile authentication.

## S3 ownership and recovery

The provider extends `@open-wa/session-sync` and uses its existing `pico-s3` transport. It supports PicoS3 provider names, custom endpoints, a configurable directory prefix, temporary credentials, and storage encryption headers. It does not set a public ACL. The endpoint must provide strongly consistent reads and enforce conditional PUT with `If-Match` and `If-None-Match`; unsupported conditions are errors, never retried as unconditional writes.

A companion `sales.data.json.lock` object holds ownership. Its body changes on acquire/release, and conditional writes prevent two cooperating clients from acquiring the same session. It has no expiry and is never stolen automatically. Clean shutdown releases it only after browser closure. A crash or ambiguous network write can leave it locked; an operator must establish that the old process/browser and any in-flight requests have stopped before removing that lock. Do not apply bucket lifecycle expiration to lock objects or edit session objects while a client owns them.

An existing remote checkpoint is authoritative, including over local files and supplied seeds. Only a missing remote object permits importing a local file or seed. Permission errors, transport failures, and corrupt payloads stop startup instead of falling back to older credentials. Writes replace the complete object using its current ETag, then refresh the local copy. No archive is created.

Logout writes credential-free invalidation markers so older local files or configured seeds cannot silently restore the session. The markers are not usable session payloads. Valid checkpoints always retain exactly the two encrypted `auth` and `data` values. Local storage uses an atomic mode-0600 replacement and an exclusive lock; local locks also require deliberate recovery after a crash.

## Incoming messages and compatibility

Pending incoming messages remain in the encrypted `data` value until every registered `onMessage` handler completes and the acknowledgement is saved. Register a handler after `create()` resolves; no handler means no acknowledgement. Processing is at least once, so deduplicate application side effects by message ID. A rejected handler pauses replay; call `client.replayPortableMessages()` to retry. `client.getPortableSessionStatus()` exposes counts and pause state. Processed message history is ephemeral.

The private adapter rejects unsupported WhatsApp builds or storage layouts instead of guessing how to restore credentials. Use `legacyDataDirAuth: true` with an existing profile, or pair in that mode, when the adapter needs an update. A compact file cannot be handed directly to legacy profile authentication.

Session files are bound to their session ID; keep that ID when moving a file between hosts. Key handling is baked into the obfuscated patch, with no supported decryption API. This is implementation concealment, not protection from an operator who controls and inspects the executing browser. Protect session files as credentials.

The integrated browser and S3 paths have not received a live runtime acceptance run. Receipt coverage, concurrent native state changes, and abrupt crashes during outbound sends remain acceptance boundaries; successful graceful saves do not establish crash safety for every native operation. S3 durability also depends on the endpoint enforcing its conditional-request semantics.
