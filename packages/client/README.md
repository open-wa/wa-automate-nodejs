# @open-wa/client

`@open-wa/client` provides the in-process TypeScript client for a WhatsApp Web session. It wraps the client created by `@open-wa/core`. For a remote HTTP server, use `@open-wa/socket-client`.

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## Install

```bash
bun add @open-wa/client @open-wa/core @open-wa/driver-puppeteer
```

## Start a session and send a message

```typescript
import { Client } from '@open-wa/client';
import { createClient } from '@open-wa/core';
import { PuppeteerDriver } from '@open-wa/driver-puppeteer';

const session = await createClient({
  sessionId: 'main-session',
  driver: new PuppeteerDriver(),
});
const client = new Client({ client: session, transport: session.getTransport() });

await client.start();
await client.sendText('447700900123@c.us', 'Hello from Open-WA');

await client.stop();
```

The client starts the browser session in your process. See the [custom code guide](https://openwa.dev/docs/getting-started/custom-code) for authentication and browser-profile setup.

## Text send results

`sendText(chatId, content)` resolves to a validated serialized `MessageId` string, including when the runtime returns an object containing `_serialized`. A returned ID is not a delivery or read receipt. Failures throw the exported `SendTextError`, whose `code` explains the failure and whose `outcome` distinguishes a rejected send from an uncertain attempt.

| Code | Outcome | Meaning |
| --- | --- | --- |
| `INVALID_ARGUMENT` | `not_sent` | The chat ID or text is missing or is not a string; no browser call was made. |
| `LICENSE_REQUIRED` | `not_sent` | Starting this chat requires an applied restricted or premium license. |
| `SEND_REJECTED` | `not_sent` | The runtime rejected the unsupported broadcast recipient. |
| `INVALID_SEND_RESULT` | `unknown` | The runtime returned no usable message ID, including `false` or an unrecognized failure value. |
| `SEND_FAILED` | `unknown` | Browser evaluation failed; the original error is available as `cause`. |

For an `unknown` outcome, check the chat before deciding whether to send again. The client never retries automatically because the first attempt may already have sent the message. Other messaging methods retain their existing return contracts.

## Documentation

See the [custom code guide](https://openwa.dev/docs/getting-started/custom-code) for setup and [how Open-WA works](https://openwa.dev/docs/concepts/how-it-works) for the package roles.

## License

[H-DNH 1.1](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md) — Hippocratic + Do Not Harm
