# open-wa AI Installation & Quickstart Reference

This is a high-density, machine-optimized quickstart guide for installing, configuring, and verifying the `open-wa` (`wa-automate-nodejs`) runtime. It is designed for rapid ingestion by AI coding agents and automated setup pipelines.

---

## 1. Prerequisites & Environment Check

Before initiating setup, ensure the host environment meets the strict compatibility parameters:

- **Node.js**: `node >= 22.21.1` (Required. Earlier versions will fail due to ESM and syntax requirements).
- **Package Manager**: `npm` or `pnpm` (pnpm is preferred for monorepos).
- **Linked Device**: A physical or virtual phone with WhatsApp installed to act as the host session scanner.

Verification command:
```bash
node --version
```

---

## 2. Option A: Standalone Easy API CLI Setup (Recommended for Agents)

The fastest way to spin up the HTTP JSON-RPC gateway is via the CLI.

### Step 1: Run the CLI Server

Spawn the API server with strict port allocation and API key protection:

```bash
npx @open-wa/wa-automate --port <PORT_NUMBER> --api-key "<YOUR_SECURE_API_KEY>"
```

### Step 2: Device Authentication (First-Run Only)

1. Monitor the stdout/stderr for the terminal-rendered **QR Code**.
2. Open **WhatsApp** on the host phone.
3. Navigate to **Linked Devices** -> **Link a Device**.
4. Scan the terminal QR code.
5. Alternatively, use phone number pairing (Link-code login):
   ```bash
   npx @open-wa/wa-automate --port <PORT_NUMBER> --link-code "<YOUR_PHONE_NUMBER>"
   ```

---

## 3. Option B: Docker Container Deployment

For persistent or headless server deployments, use the official Docker image.

### Run with Session Persistence & Environment Flags

```bash
docker run -d \
  --name open-wa-api \
  -p 8080:8080 \
  -v open_wa_sessions:/sessions \
  -e WA_PORT=8080 \
  -e WA_SESSION_ID=default \
  -e WA_USER_DATA_DIR=/sessions/default \
  -e WA_API_KEY="<YOUR_SECURE_API_KEY>" \
  openwa/wa-automate
```

- **Persistence**: Mounts a volume on `/sessions` and points `WA_USER_DATA_DIR` at `/sessions/default` so the browser profile is reused across container restarts. Without `WA_USER_DATA_DIR`, the current v5 runtime derives the profile path from the working directory and session id.
- **Config Precedence**: Environment variables prefixed with `WA_*` override configurations in `wa.config.mjs`.

---

## 4. Option C: Embedded Code (Direct Node.js Integration)

To embed the core browser driver directly into your custom TypeScript/JavaScript runtime, use `@open-wa/core`.

### Installation

```bash
npm install @open-wa/core @open-wa/driver-puppeteer
```

### Client Scaffolding

Create `client.ts` / `client.js`:

```typescript
import { createClient } from '@open-wa/core';
import { PuppeteerDriver } from '@open-wa/driver-puppeteer';

async function start() {
  const client = await createClient({
    sessionId: 'sales-bot',
    driver: new PuppeteerDriver(),
    useChrome: true,
    authTimeout: 60,
    blockCrashLogs: true,
  });

  // Listen to new incoming messages
  client.onMessage(async (message) => {
    if (message.body === 'ping') {
      await client.sendText(message.from, 'pong');
    }
  });

  // Safe Lifecycle shutdown hook
  process.on('SIGINT', async () => {
    await client.stop();
    process.exit(0);
  });
}

start().catch(console.error);
```

---

## 5. Setup Verification & Health Check

Once the API or client is running, execute a health check to verify availability.

### Step 1: Query the Health Endpoint

```bash
curl -i http://localhost:8080/health
```

Expected HTTP Response:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "UP",
  "sessionId": "default",
  "authenticated": true
}
```

### Step 2: Send a Verification Text

Send a test text to your own Chat ID (`<PHONE_NUMBER>@c.us`):

```bash
curl -X POST http://localhost:8080/api/sendText \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <YOUR_SECURE_API_KEY>" \
  -d '{
    "to": "1234567890@c.us",
    "text": "Hello, verification successful!"
  }'
```

Expected API Success Response:
```json
{
  "success": true,
  "data": "true_1234567890@c.us_EXAMPLE_MESSAGE_ID"
}
```

If the API key is incorrect or missing, expect a 401:
```json
{
  "error": "Unauthorized"
}
```

---

## 6. Safety & Anti-Ban Configuration Boundaries

To protect host WhatsApp accounts from automation bans, strictly adhere to these limits when configuring custom agents:

| Metric | Recommended Safe Setting | CLI Flag / Config Property |
| --- | --- | --- |
| Cool-down queue | Enforce random sleep | `wa.config.mjs` -> `enqueueCooldown: true` |
| Concurrency limit | Limit to 1 message at a time | Utilize external `p-queue` inside bot loop |
| Block rate limits | Under 500 messages/hour | Handle `429` statuses with exponential backoff |
| Safety filters | Filter specific group IDs | `groupFilter` in configuration |
