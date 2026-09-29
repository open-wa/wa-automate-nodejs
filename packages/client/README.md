# @open-wa/client

`@open-wa/client` provides the in-process TypeScript client for a WhatsApp Web session. It wraps the client created by `@open-wa/core`. For a remote HTTP server, use `@open-wa/socket-client`.

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## Install

```bash
npm install @open-wa/client@5.1.0 @open-wa/core@5.1.0 @open-wa/driver-puppeteer@5.1.0
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

## Documentation

See the [custom code guide](https://openwa.dev/docs/getting-started/custom-code) for setup and [how Open-WA works](https://openwa.dev/docs/concepts/how-it-works) for the package roles.

## License

[H-DNH 1.1](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md) — Hippocratic + Do Not Harm
