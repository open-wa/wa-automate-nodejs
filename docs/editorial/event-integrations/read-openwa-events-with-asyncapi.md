# Read OpenWA event payloads with AsyncAPI

An event name only tells you part of what a consumer receives. OpenWA's listener callback `onMessage` receives a message, while its runtime event `message.received` carries `{ ctx, message }`. SSE and webhooks then wrap that payload differently.

The upcoming AsyncAPI integration describes those wire contracts in one downloadable document and renders them as a Fumadocs reference. This guide covers PR #3539; the release containing it is still pending.

## Start a linked Easy API session

Use Node.js 22.21.1 or later. Replace the version placeholder with the release containing AsyncAPI, set a private API key and start the server:

```bash
export OPENWA_VERSION='REPLACE_WITH_RELEASE_VERSION'
export OPENWA_API_URL='http://127.0.0.1:8080'
export WA_API_KEY='REPLACE_WITH_YOUR_PRIVATE_API_KEY'

npx "@open-wa/wa-automate@$OPENWA_VERSION" \
  --session-id sales --host 127.0.0.1 --port 8080 \
  --api-key "$WA_API_KEY"
```

Pair from **WhatsApp → Linked devices → Link a device** by scanning the QR code. The API explorer at `/api-docs/` links to the instance's AsyncAPI document. The metadata endpoint describes supported contracts; it doesn't mean every delivery integration is enabled.

## Download the contract

The instance serves AsyncAPI 3.1 at `/meta/asyncapi.json`. This read-only metadata request doesn't execute a WhatsApp action. The example includes the same API-key header you'll use for event streams and API methods:

```bash
curl --fail-with-body "$OPENWA_API_URL/meta/asyncapi.json" \
  -H "X-API-Key: $WA_API_KEY" \
  --output openwa-asyncapi.json
```

```js
const response = await fetch(
  process.env.OPENWA_API_URL + '/meta/asyncapi.json',
  { headers: { 'X-API-Key': process.env.WA_API_KEY } },
);
if (!response.ok) throw new Error(await response.text());
const contract = await response.json();
console.log(contract.asyncapi, Object.keys(contract.operations));
```

```python
import os
import requests

response = requests.get(
    os.environ['OPENWA_API_URL'].rstrip('/') + '/meta/asyncapi.json',
    headers={'X-API-Key': os.environ['WA_API_KEY']},
    timeout=30,
)
response.raise_for_status()
contract = response.json()
print(contract['asyncapi'], list(contract['operations']))
```

JavaScript uses Node's built-in `fetch`. Install Python's HTTP dependency with `python -m pip install requests`. The metadata response is the AsyncAPI document itself; ordinary method routes use `{ success, data }`.

The initial contract covers incoming and any messages, acknowledgements, session state changes, being added to a group, and logout. It records optional runtime listeners and listener aliases. Internal lifecycle events aren't part of this initial reference.

## Read the transport envelope

For a local consumer that stays connected, open the SSE stream:

```bash
curl --no-buffer --fail-with-body \
  "$OPENWA_API_URL/api/events?topics=message.received,ack.changed" \
  -H "X-API-Key: $WA_API_KEY"
```

Each `data:` line contains `{ id, event, payload, ts, sessionId }`. For `message.received`, the message is at `payload.message`. For `ack.changed`, the acknowledgement snapshot is at `payload.ack`. SSE envelope timestamps are Unix milliseconds. The stream sends keepalive comments every 20 seconds and a three-second reconnect hint; reconnecting doesn't replay earlier events.

The webhook integration sends `{ webhookId, sessionId, event, payload, timestamp }` by HTTP POST. Configure its destination and event filter using the [webhook setup guide](https://openwa.dev/docs/client-and-integrations/webhook-payloads). Its optional delivery journal adds an `Idempotency-Key` header and retries pending deliveries after a restart.

MCP Events sends a compact event summary inside `data`, with an ISO timestamp, stable event ID and callback signatures. That is the surface ChatGPT Work subscribes to.

The transports have different event policies. SSE uses the supplied event bridge; the webhook plugin excludes internal and sensitive events; MCP exposes three explicit subscription events. Use the contract for the transport you're consuming rather than assuming their envelopes or coverage are identical.

## Browse the generated reference

[Open the event-contract reference](https://openwa.dev/docs/reference/event-contracts) to read operation, channel, envelope and payload details. The static [schema download](https://openwa.dev/asyncapi.json) and runtime endpoint come from the same document builder. The instance's copy includes its origin, external base path and MCP configuration metadata.

HTTP commands remain in OpenAPI. AsyncAPI describes the updates those commands and incoming WhatsApp activity can produce; it doesn't add historical replay or exactly-once delivery.
