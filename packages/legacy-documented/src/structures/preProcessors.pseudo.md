# preProcessors.ts pseudocode trace

Source of truth: `packages/legacy/src/structures/preProcessors.ts`

## Role

- Defines built-in message preprocessors that mutate inbound message payloads before downstream handlers consume them.

## Main preprocessors

- `SCRUB` — remove media thumbnail/base64 payload fields from media messages.
- `BODY_ONLY` — keep `body`, remove duplicate `content` payload.
- `AUTO_DECRYPT` — replace message body with the decrypted media DataURL.
- `AUTO_DECRYPT_SAVE` — decrypt media and save it to local disk, then rewrite the message body/filePath to point at the saved asset.
- `UPLOAD_CLOUD` — decrypt media, upload it to configured cloud storage, and attach `cloudUrl`.

## Shared behavior

- Uses `client.decryptMedia(...)` as the bridge from message metadata to actual media content.
- Avoids duplicate processing with an in-memory `processedFiles` map and a shared upload queue.
- Reads cloud/provider overrides from config and `OW_CLOUD_*` env vars.

## Public surface

- `preProcessors.ts:177-185` — export `MessagePreprocessors` object.
- `preProcessors.ts:193+` — export `PREPROCESSORS` enum with the built-in choices.

## Why this matters for v5

- This file is part of the legacy extension story: message payloads can be transformed before user code sees them.
- That makes it relevant to a future plugin/integration model, even though it is not part of launch itself.

## Behavioral contract / pseudo tests

- Preprocessors should transform message payloads deterministically based on declared policy.
- Media preprocessors should not accidentally perform duplicate expensive work for the same message when avoidable.
- Failed media decrypt/upload operations should fail the preprocessing step clearly without corrupting the original message object contract.
- Cloud-upload preprocessors should require enough configuration to produce a valid upload target and should fail loudly when critical config is missing.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Declarative built-in preprocessors | Preserve | Useful extension seam. |
| Exact storage/cloud backends | Intentionally changed | Upload/save implementations may vary. |

## Inputs / outputs / side effects

- Inputs: message payloads, client media APIs, config/env cloud settings.
- Outputs: transformed message payloads.
- Side effects: media decryption, local file writes, cloud uploads, queue scheduling.

## Failure taxonomy

- Media decrypt failure
- Local save failure
- Cloud config missing
- Upload failure

## Dependency contracts

- Requires: client media decryption and optional storage providers.
- Guarantees: preprocessors are composable payload mutators rather than alternate message sources.

## State transitions

- `RAW_MESSAGE -> PROCESSED_MESSAGE`
- `RAW_MEDIA_MESSAGE -> DECRYPTED | SAVED | UPLOADED | PROCESSOR_FAILED`
