# OpenWA v5.0.0

Three years in the making, v5 is now the `latest` OpenWA release. If you are coming from v4, this is a major change to how you run and extend OpenWA. The familiar WhatsApp automation work is now organized around a hosted API, a remote client, and an explicit embedded runtime, so you can choose who owns the browser and session.

## What changes for v4 users

### 01 / Run WhatsApp as an API

Easy API owns browser setup, the session, and HTTP hosting. Start it as a process, then call its documented methods from your service. Your application can use OpenWA without also managing a browser lifecycle.

### 02 / Keep remote consumers separate

SocketClient connects a Node.js app to a running Easy API instance. Commands use HTTP and live events use Server-Sent Events. Your bot or worker can consume a session without hosting it in every process.

### 03 / Embed only when you need control

The public embedded entry point is now `createClient`. Choose a browser driver and own startup and shutdown in your app when you need direct runtime control. Existing v4 code using `create` needs to move to the v5 contract.

### 04 / Extend with packages and plugins

The v5 line separates the runtime, API, schema, browser drivers, and integrations into packages. Load reusable behavior through `plugins` and `pluginConfig`; webhook delivery, Chatwoot, S3 media handling, Cloudflare session proxying, and Node-RED have dedicated integration paths.

### 05 / Discover the API from the running service

The method schema powers interactive API docs and generated metadata, so the reference follows the service you actually run. Easy API exposes Swagger and Postman descriptions alongside the live methods, making integration changes easier to inspect.

### 06 / Give agents a bounded tool surface

Easy API can expose its schema as MCP tools at `/mcp`. Tool discovery and execution require the Easy API key, and the dashboard shows connection details. This gives agent integrations a defined method surface instead of a second, hand-maintained API.

## Before you migrate

### 01 / Pin or opt in deliberately

`npm` now resolves `@open-wa/wa-automate@latest` to v5. Existing v4 deployments should pin `4.76.0` until their code and configuration are migrated. Start a separate v5 Easy API instance and verify login, named sessions, and recovery before switching traffic.

### 02 / Update the edges that changed

Move remote consumers to SocketClient and embedded users to `createClient`. Configure webhooks with `@open-wa/integration-webhook` in `wa.config.*`; the v5 CLI accepts `--webhook` but does not register delivery. Webhook receivers should read `payload` in the new `{ webhookId, sessionId, event, payload, timestamp }` envelope, rather than v4-style `data`.

### 03 / Check the live contract

Open `/api-docs/` on your running Easy API and compare the methods and schemas your application calls. If you use MCP, enable it in `wa.config.*` with an API key; `--mcp` is not a v5 CLI option. Migrate one workflow at a time before moving production sessions.

## Explore the release

The attached numbered images contain the complete package-level changelogs in readable pages. Start with the [Easy API guide](https://openwa.dev/docs/getting-started/easy-api), [SocketClient guide](https://openwa.dev/docs/client-and-integrations/socket-client), [configuration guide](https://openwa.dev/docs/guides/configuration-and-cli), and [webhook guide](https://openwa.dev/docs/guides/webhooks-for-business).

Compare the source since the last v4 release: [4.76.0…v5.0.0](https://github.com/open-wa/wa-automate-nodejs/compare/4.76.0...v5.0.0).
