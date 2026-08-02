# @open-wa/integration-s3

S3/Cloud storage integration plugin for open-wa

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## What it does

`@open-wa/integration-s3` handles `message.received` events that contain decryptable media. It uploads media through `pico-s3` to S3-compatible storage. It adds the resulting `cloudUrl` to the message object.

Use this integration so downstream message handlers receive a cloud URL instead of only the original WhatsApp media reference.

## Configuration

The configuration type is `S3Config` in `src/config.ts`.

| Field | Necessary | Source-visible behavior |
| --- | --- | --- |
| `provider` | Yes | Cloud provider identifier. Source type allows `aws`, `gcp`, `do`, `wasabi`, or `backblaze`. |
| `accessKeyId` | Yes | Passed to `pico-s3` upload and URL generation options. |
| `secretAccessKey` | Yes | Passed to `pico-s3` upload and URL generation options. |
| `bucket` | Yes | Target bucket passed to `pico-s3`. |
| `region` | No | Optional region passed to `pico-s3`. |
| `public` | No | Optional public flag passed to `pico-s3`. |
| `directory` | No | Optional directory strategy or literal directory string. |
| `ignoreHostAccount` | No | When true, messages with `fromMe` are not uploaded. |
| `headers` | No | Optional headers passed to upload options. |

`directory` supports the exported `DirectoryStrategy` enum values `DATE`, `CHAT`, `DATE_CHAT`, and `CHAT_DATE`. A custom string is used directly as the upload directory.

## Runtime behavior

- On `message.received`, the plugin checks for `deprecatedMms3Url`, `mimetype`, and a client with `decryptMedia`.
- Matching media messages are passed to `S3Uploader.uploadMedia`.
- `uploadMedia` skips messages without media URL or MIME type, and skips host-account messages when `ignoreHostAccount` is true.
- File extensions are derived from the MIME type with the `mime` package, falling back to `bin`.
- File names use `message.mId` when present, otherwise `Date.now()`.
- Duplicate file names are tracked in memory and return the existing cloud URL instead of uploading again.
- Uploads run through a bounded Effect queue with concurrency 2 and a two-per-second rate limit.
- After a successful queue upload, `getCloudUrl` is used to compute the URL and the plugin assigns it to `message.cloudUrl`.
- On `dispose`, the plugin waits for the upload queue to become idle and logs that the queue drained.

## Exports

- `s3Plugin` from `src/plugin.ts`.
- `S3Uploader` from `src/uploader.ts`.
- `S3Config`, `CloudProvider`, and `DirectoryStrategy` from `src/config.ts`.

## Development

- `pnpm --filter @open-wa/integration-s3 build`
- `pnpm --filter @open-wa/integration-s3 dev`
- `pnpm --filter @open-wa/integration-s3 lint`
- `pnpm --filter @open-wa/integration-s3 clean`

## Documentation

See the [docs site](https://docs.openwa.dev).

## License

[H-DNH V1.0](https://github.com/open-wa/wa-automate-nodejs/blob/main/LICENSE.md) - Hippocratic + Do Not Harm
