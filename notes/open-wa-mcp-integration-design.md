# open-wa MCP Integration Design

> Deep implementation note for exposing open-wa's schema-generated client to AI systems through MCP.
> Date: 2026-04-13

---

## Executive summary

The best design for open-wa is **hybrid, but schema-first**.

That means:

1. **Do not** make Hono routes the source of truth for MCP.
2. **Do not** hand-maintain a second MCP schema layer.
3. Generate MCP tool definitions from the existing **schema registry** and **`HttpMethodDefinition`** manifest.
4. Reuse the same normalization, validation, readiness, and invocation pipeline that the HTTP API already uses.
5. Use **TanStack Intent** alongside MCP, but only for **agent skills and usage guidance**, not as transport.

In short:

**Schema registry -> manifest projection -> shared invocation kernel -> HTTP + MCP adapters**

This keeps open-wa maintainable, prevents schema drift, preserves backwards compatibility, and gives AI systems a clean tool surface.

---

## Why this note exists

open-wa already has most of the hard pieces needed for AI integration:

- a schema-driven client method registry
- generated HTTP method definitions
- alias and deprecated alias metadata
- parameter-order and parameter-alias handling
- runtime OpenAPI and Postman generation
- a Hono-based API server

The question is not whether open-wa can expose itself to AI systems. It already can, indirectly, through HTTP and generated docs.

The real question is:

> What is the cleanest way to expose open-wa as an MCP server so AI systems can call it reliably, without introducing a second source of truth?

---

## Relevant evidence from the repo

### 1. Schema registry is the real contract

The current v5 design already treats the schema layer as canonical.

Relevant files:

- `packages/schema/src/registry.ts`
- `packages/schema/src/http-manifest.ts`
- `notes/v5-schema-design-specification.md`

Important properties already exist there:

- canonical method identity
- namespaced names
- flat aliases
- deprecated aliases
- parameter order
- Zod input/output schemas
- parameter key alias metadata

This is exactly the information an MCP tool surface needs.

### 2. HTTP is already derived from schema

Relevant files:

- `packages/api/src/createApiMiddleware.ts`
- `packages/api/src/routes/meta.ts`
- `packages/api/src/docs/openapi.ts`
- `packages/api/src/docs/postman.ts`

The current HTTP stack already derives its routes and explorer docs from `HttpMethodDefinition[]`.

That means MCP should follow the same direction: **derive from schema**, not derive from route handlers.

### 3. Hono is still useful

Relevant files:

- `packages/api/src/createApiServer.ts`
- `packages/wa-automate/src/server/hono-server.ts`

Hono is a strong hosting surface for MCP because it already gives open-wa:

- auth middleware
- rate limiting
- lifecycle checks
- operational familiarity
- an existing network boundary

So Hono is a good **adapter host**, just not the canonical capability model.

---

## External reference findings

## MCP protocol grounding

This design is grounded in the MCP specification as of the currently stable protocol family referenced during research (`2025-03-26`), with one important caveat:

- the URL `https://modelcontextprotocol.io/llms-full.txt` did not reliably return the actual full spec during research and appeared to redirect to a client listing page
- implementation decisions below are therefore grounded in the actual specification pages, not in that redirect target

### Protocol facts that matter to this design

For a hosted Easy API MCP endpoint, the coding agent should treat the following as hard protocol constraints unless we explicitly choose a pragmatic deviation:

1. MCP uses **JSON-RPC 2.0** message envelopes.
2. Hosted HTTP servers should implement **Streamable HTTP** semantics rather than the older deprecated HTTP+SSE pattern.
3. The server must support the MCP initialization lifecycle:
   - `initialize` request
   - initialize response
   - `notifications/initialized`
   - only then should normal operations proceed
4. Tool discovery and invocation are protocol methods, not ad-hoc REST routes:
   - `tools/list`
   - `tools/call`
5. Tool results should return MCP content arrays and should distinguish tool-level errors from protocol-level errors.
6. For hosted HTTP, authentication is normally specified in OAuth-oriented terms by the protocol, which means our API-key requirement is a deliberate product simplification rather than full OAuth feature implementation.

### open-wa implementation stance on compliance

open-wa should aim to be **protocol-shaped and client-compatible**, but the first implementation should be honest about one intentional product simplification:

- we are using **Easy API API-key gating** rather than implementing the full OAuth 2.1 authorization model in the first version

That means the docs and code should avoid overstating compliance.

Recommended phrasing in docs and UX:

> open-wa exposes a hosted MCP endpoint for Easy API and secures it using the Easy API API key. This is an opinionated Easy API deployment model designed for practical hosted use.

Do **not** claim:

- “full OAuth MCP authorization support”
- “general-purpose MCP transport for any runtime surface”

### Protocol-grounded transport notes

The coding agent should implement MCP as a protocol handler on a single hosted endpoint, for example:

- `POST /mcp`
- `GET /mcp`

Key transport expectations:

- `POST` handles client-to-server JSON-RPC messages
- `GET` is reserved for stream/server-initiated behavior when needed by the chosen transport implementation
- request/response handling should follow MCP transport semantics, not a bespoke REST shape

Important instruction for the coding agent:

> Do not invent a fake REST endpoint that “looks like MCP”. Use a real MCP server/transport implementation shape and then attach open-wa tools to it.

### Protocol-grounded error model

The coding agent needs to keep two error layers distinct:

#### 1. Protocol errors

Use JSON-RPC error responses for:

- malformed request envelopes
- invalid params
- unknown protocol method
- other protocol-level failures

#### 2. Tool execution errors

Use MCP tool results with `isError: true` for:

- open-wa runtime invocation failures
- validation failures after tool selection
- readiness failures
- API-key/auth-related execution failures if surfaced from tool invocation flow

This distinction matters because MCP clients interpret protocol errors and tool errors differently.

### Protocol-grounded tool result shape

The coding agent should return MCP content arrays, with text fallback always present.

Recommended result pattern:

```ts
return {
  content: [
    { type: 'text', text: JSON.stringify(result, null, 2) },
  ],
  structuredContent: result,
  isError: false,
}
```

If the chosen SDK/server helper does not support `structuredContent`, preserve at least:

```ts
{
  content: [{ type: 'text', text: '...' }],
  isError: false
}
```

### Protocol-grounded initialization rules

The coding agent must not skip lifecycle details.

Rules:

- normal MCP operations should only be served after successful initialization lifecycle handling
- do not treat the endpoint as a plain authenticated JSON POST endpoint
- use an actual MCP server abstraction or implement the protocol envelope faithfully

### Protocol-grounded discovery rules

The MCP endpoint should expose tool discovery through MCP itself (`tools/list`), but open-wa should still keep `/meta/mcp-tools.json` as a non-protocol dashboard/debugging artifact.

That distinction should be explicit:

- MCP clients discover tools through MCP protocol methods
- humans and dashboard UI can inspect `/meta/mcp-tools.json`

### Security notes from the protocol that matter here

The coding agent should account for the following, even in a simplified API-key model:

- validate host/origin assumptions carefully for hosted HTTP deployments
- never place secrets in query strings when avoidable
- apply auth checks consistently on every MCP request
- avoid exposing MCP at all when the runtime is not configured for secured Easy API use

---

## TanStack Intent

TanStack Intent is useful here, but only in one part of the stack.

It helps maintainers ship **agent skills** as package artifacts so AI agents know:

- how to use a library correctly
- what failure modes to expect
- setup sequences
- safe workflows
- recommended patterns

It does **not** provide MCP transport.

So TanStack Intent should be used to teach agents:

- when to call open-wa tools
- how session readiness works
- how auth and QR/link-code flows behave
- what operations are risky or license-gated
- what not to do with WhatsApp automation

But the actual callable interface still needs MCP.

## `hono-mcp-server`

`hono-mcp-server` shows a practical pattern for turning Hono routes into MCP tools.

That pattern is useful for:

- transport integration
- route-to-tool registration
- mapping Zod schemas to tool input/output
- hosting MCP beside an existing Hono app

But it should be treated as an **adapter idea**, not as the core architecture.

If open-wa simply wraps Hono routes directly and treats those routes as the MCP contract, it risks coupling AI tooling to HTTP-level compatibility behavior and alias routing details.

---

## Architecture decision

## Recommended option: hybrid, schema-first

There are three obvious approaches.

### Option A — HTTP-first MCP wrapper

Wrap the existing Hono API with an MCP adapter.

**Pros**

- quickest to ship
- reuses auth and rate limiting immediately
- operationally simple
- easy to host beside Easy API

**Cons**

- MCP contract becomes shaped by HTTP quirks
- alias routes can leak into tool discovery
- harder to keep AI-facing naming clean
- route-level compatibility behavior becomes part of the tool model

### Option B — Schema-first standalone MCP server

Generate MCP tools directly from schema/manifest and execute methods without going through HTTP.

**Pros**

- cleanest capability model
- best source-of-truth discipline
- transport-independent
- best long-term AI ergonomics

**Cons**

- easy to accidentally bypass HTTP-layer safety behavior
- requires deliberate reuse of readiness/auth/lifecycle logic
- adds a second hosting mode if not integrated carefully

### Option C — Hybrid, schema-first with Hono hosting

Generate MCP tools from schema/manifest, but host the MCP transport through Hono or alongside the existing API runtime, while reusing the same invocation kernel.

**Pros**

- preserves a single capability source of truth
- preserves operational reuse from Hono
- avoids hand-duplicated schemas
- clean AI-facing tool identity
- compatible with current Easy API deployment model

**Cons**

- requires a small new abstraction boundary
- requires discipline about what belongs to manifest vs transport

### Final decision

**Choose Option C.**

It gives open-wa the cleanest long-term contract without throwing away the already-mature HTTP runtime.

---

## Core design principle

The MCP layer should expose **capabilities**, not **routes**.

That means the canonical unit is:

- `functionName`
- `namespacedName`
- `description`
- canonical input schema
- canonical output schema
- alias metadata
- parameter order
- key alias map

Those already exist in `HttpMethodDefinition` or are derivable from the schema registry.

The MCP system should therefore project a new representation from that data, for example:

```ts
interface McpToolDefinition {
  toolName: string;
  functionName: string;
  namespacedName: string;
  namespace: string;
  description: string;
  inputSchema: ZodObject<any>;
  outputSchema: ZodTypeAny;
  parameterOrder: string[];
  aliases: string[];
  deprecatedAliases: string[];
  keyAliasMap: Record<string, string>;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
  };
}
```

This should be generated from the same source as the HTTP manifest.

---

## Proposed layered architecture

## Layer 1 — Capability definition layer

**Source of truth**

- `defineMethodV2(...)`
- `clientRegistry`
- parameter metadata registry

Responsibilities:

- capability metadata
- aliases and deprecations
- input/output schemas
- parameter alias handling
- namespace organization

No MCP-specific duplication should live here unless it is generic metadata that benefits every transport.

Potential addition:

```ts
interface ClientFunctionMetadata {
  // existing fields...
  mcp?: {
    enabled?: boolean;
    title?: string;
    annotations?: {
      readOnlyHint?: boolean;
      destructiveHint?: boolean;
      idempotentHint?: boolean;
    };
  };
}
```

This should stay optional and small. The registry should not become polluted with transport-only noise.

## Layer 2 — Manifest projection layer

Current:

- `getHttpMethodDefinitions(basePath = '/api')`

Add:

- `getMcpToolDefinitions()`

Responsibilities:

- choose canonical MCP tool names
- map Zod schemas into MCP-friendly input/output shapes
- attach aliases as metadata, not duplicated tools
- optionally expose tool annotations for better AI client UX

### Naming rule

Expose **one canonical MCP tool per method**.

Recommended default:

- canonical tool name: `namespace.method`

Examples:

- `chats.getAll`
- `messages.sendText`
- `groups.create`

Why this is better than flat names in MCP:

- lower collision risk
- better grouping in AI clients
- closer to capability organization than HTTP compatibility names

Aliases should still be resolvable, but they should not all appear as standalone tools.

## Layer 3 — Shared invocation kernel

This is the most important implementation boundary.

Both HTTP and MCP should go through the same pipeline:

1. lifecycle/readiness check
2. auth boundary check
3. payload normalization
4. key alias normalization
5. Zod validation
6. client method invocation
7. structured response shaping
8. error normalization

The current HTTP path already contains much of this in:

- `normalizeMethodPayload(...)`
- `invokeClientMethod(...)`
- lifecycle guards in `createApiMiddleware.ts`

The MCP implementation should reuse or extract this path rather than re-implement it.

Recommended extraction:

```ts
interface InvocationContext {
  sessionId: string;
  authMode: 'api-key' | 'internal' | 'mcp';
}

async function executeCapability(
  definition: HttpMethodDefinition,
  rawPayload: Record<string, unknown>,
  context: InvocationContext,
) {
  // shared normalization + validation + invoke path
}
```

Then:

- HTTP adapter calls `executeCapability(...)`
- MCP adapter calls `executeCapability(...)`

That is the real anti-drift mechanism.

## Layer 4 — Transport adapters

### HTTP adapter

Existing.

### MCP adapter

New.

For open-wa, MCP should be hosted **only** through the Easy API runtime.

That means:

- MCP is an Easy API capability, not a generic transport capability of every open-wa surface
- `createClient()` remains an SDK escape hatch for custom builders, but does **not** expose MCP directly
- the hosted Hono runtime is the single supported MCP exposure model

---

## Recommended package boundaries

There are two reasonable ways to place the MCP implementation.

### Option 1 — new package: `packages/mcp`

Chosen from the start.

Package name:

- `@open-wa/mcp`

Why:

- keeps transport concerns separate from API docs and HTTP middleware
- keeps the MCP surface explicit and isolated from general API packaging concerns
- can depend on `@open-wa/schema` and shared invocation internals cleanly
- makes it publishable independently if useful

Suggested contents:

```text
packages/mcp/
  src/
    manifest.ts
    tool-naming.ts
    adapter/
      register-tools.ts
      hono-mcp.ts
    execution/
      execute-capability.ts
      errors.ts
    index.ts
```

### Option 2 — embed inside `packages/api`

Not recommended.

Why it is weaker:

- transport-specific concerns get mixed into the API package
- stdio and non-Hono futures become harder to organize
- the conceptual boundary becomes blurry

Recommendation:

- do not start here
- keep MCP isolated in `packages/mcp` from the first implementation

---

## Tool naming and alias policy

This is where many MCP integrations go wrong.

open-wa already has a rich alias system for compatibility and developer ergonomics. That is good for HTTP and SDK surfaces, but bad if copied naively into MCP discovery.

### Rule

Register **one MCP tool per canonical method**.

### Expose aliases as metadata only

Example:

```json
{
  "toolName": "messages.sendText",
  "title": "Send text message",
  "aliases": ["sendText"],
  "deprecatedAliases": [],
  "description": "Send a text message to a chat"
}
```

### Why

- avoids bloated tool lists
- prevents multiple tools that do the same thing
- reduces agent confusion
- keeps compatibility support without polluting discovery

### Resolution rule

If the MCP runtime ever needs to accept alias-style invocation internally, it can resolve aliases to the canonical definition before execution.

But the **public discovery surface** should stay canonical.

---

## Schema conversion strategy

MCP clients work best when tool schemas are strongly typed and descriptive.

The good news is open-wa already uses Zod.

### Input schema

Source:

- `HttpMethodDefinition.inputSchema`

Use directly where possible.

### Output schema

Source:

- `HttpMethodDefinition.outputSchema`

Use directly where possible, but note that methods returning `z.any()` will provide much less value to MCP consumers.

### Improvement opportunity

Audit methods with weak output typing and upgrade them incrementally.

This is not required to launch MCP, but it has outsized value because AI systems benefit heavily from structured responses.

### Response shape recommendation

Return both:

1. structured content
2. text fallback

Example pattern:

```ts
return {
  structuredContent: result,
  content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  isError: false,
};
```

This gives the broadest compatibility across MCP clients.

---

## Authentication and runtime boundaries

This is the biggest practical design constraint.

MCP must not become a side door that bypasses the safety posture of Easy API.

This is especially important because many users will host sessions remotely. If MCP is exposed casually, maintainers will get blamed for session exposure even when the operator deployed it unsafely.

### Hosted MCP

If MCP is mounted into the running Hono server, it should inherit:

- strict API key requirements
- session readiness gating
- lifecycle availability rules
- rate limiting or equivalent guardrails
- MCP protocol lifecycle handling
- protocol-correct tool discovery and invocation behavior

### Hard rule: MCP is disabled unless Easy API auth is configured

The MCP flag should **not work** unless the Easy API API key flag/config is set.

In practice:

- MCP is available **only** through Easy API
- MCP is available **only** when `apiKey` is configured
- if the user enables the MCP flag without an API key, startup should fail closed with a clear error
- `createClient()` should not expose MCP at all

This is both a security decision and a product-boundary decision.

It is also a deliberate protocol tradeoff: the first version is choosing Easy API API-key auth over a fuller OAuth-based hosted MCP authorization model.

That is acceptable as a product decision, but it should be documented honestly.

The safety posture should be:

> No API key, no MCP.

This avoids accidental public exposure and keeps the convenience route opinionated and safe by default.

### Why MCP is Easy API-only

The repo has two different user stories:

1. **Easy API** — the convenience route with clear operational defaults
2. **`createClient()`** — the SDK route for custom builders who want to own their own infrastructure

MCP belongs to the first category.

That means the supported product stance is:

- if a user wants AI tooling out of the box, they should run Easy API
- if a user is building a custom system around `createClient()`, they own that integration work themselves

This keeps the maintainer surface smaller and the security story much clearer.

---

## Proposed MCP exposure model

There is one supported deployment model.

## Model 1 — Easy API with hosted MCP endpoint

open-wa runtime starts as usual and also exposes MCP.

This is the **only supported MCP model**.

Good for:

- teams already running Easy API
- remote AI agents
- hosted orchestration systems
- operators who need a single secured endpoint for both API and MCP access

Flow:

```text
AI Client -> MCP Transport -> open-wa Hono host -> shared invocation kernel -> runtime client
```

### Pros

- simple operational story
- close to current deployment model
- no extra process needed
- best fit for remotely hosted sessions
- easiest model to secure and document

### Cons

- transport tied to the API host lifecycle
- requires an opinionated product boundary around Easy API

### Required enablement rules

The hosted MCP endpoint must obey these rules:

1. MCP is exposed only when the Easy API MCP flag is enabled.
2. MCP flag is valid only when Easy API `apiKey` is also set.
3. If MCP is enabled without an API key, startup fails with a clear configuration error.
4. MCP authentication should reuse the same Easy API auth boundary rather than inventing a second parallel auth model.
5. The endpoint must still behave like an MCP endpoint, not like a custom REST endpoint wearing MCP branding.

This makes the security behavior obvious and prevents foot-guns.

---

## Relationship to `/meta` routes and generated artifacts

The repo already exposes:

- `/meta/swagger.json`
- `/meta/postman.json`
- `/meta/basic/commands`

These should not be replaced.

Instead, the MCP work should align with them.

### Good direction

Add a generated MCP-oriented manifest, for example:

- `/meta/mcp-tools.json`

This would be useful for:

- debugging
- AI integration visibility
- contract inspection
- future codegen or docs

Possible contents:

```json
[
  {
    "toolName": "messages.sendText",
    "functionName": "sendText",
    "namespace": "messages",
    "description": "Send a text message to a chat",
    "aliases": ["sendText"],
    "parameterOrder": ["to", "content"]
  }
]
```

This keeps MCP introspection aligned with the existing meta surface.

---

## Dashboard requirements (`apps/dashboard-neo`)

MCP should not be a hidden server-only feature. If it is supported through Easy API, the dashboard should make it obvious, understandable, and easy to connect.

The current `dashboard-neo` structure is sidebar-first, using TanStack Router routes and a central sidebar declaration. That means MCP should be represented as a **dedicated route under the Developer section**, not as an embedded panel inside Debug or API Docs.

### Relevant dashboard files

- `apps/dashboard-neo/src/components/app-sidebar.tsx` — primary place where sidebar items are declared
- `apps/dashboard-neo/src/routes/__root.tsx` — root layout mounting the sidebar
- `apps/dashboard-neo/src/routes/api-docs.tsx` — current developer-facing docs surface
- `apps/dashboard-neo/src/routes/debug.tsx` — debug/config surface, not ideal as the main MCP UX
- `apps/dashboard-neo/src/lib/hooks/use-health.ts` — best existing place to source lightweight capability booleans
- `apps/dashboard-neo/src/lib/hooks/use-session.ts` — session/runtime state hook
- `apps/dashboard-neo/src/lib/api-client.ts` — shared dashboard API entrypoint

### Recommended dashboard shape

Add a new dedicated route:

- `apps/dashboard-neo/src/routes/mcp.tsx`

And add a conditional sidebar item in the Developer group.

### Visibility rule

The MCP tab should appear **only when both are true**:

1. MCP is enabled in Easy API
2. Easy API `apiKey` is configured

That means the dashboard should not infer capability from redacted raw config. Instead, the API should expose explicit capability booleans.

Recommended capability fields from the backend:

```ts
interface DashboardCapabilities {
  apiKeyConfigured: boolean;
  mcpEnabled: boolean;
  mcpAvailable: boolean; // effectively apiKeyConfigured && mcpEnabled
}
```

Best place to surface this initially:

- extend `/health`, or
- add a dedicated lightweight capability/meta endpoint

The existing `use-health.ts` hook is the most natural first dashboard data source for sidebar visibility.

### What the MCP page should show

The MCP page should optimize for copy-paste setup into AI tools.

At minimum it should include:

1. **Status banner**
   - MCP enabled
   - API key configured
   - session readiness / runtime availability

2. **Connection details**
   - MCP endpoint URL
   - transport type
   - auth requirement summary

3. **Copy-paste configuration blocks**
   - Claude Desktop example
   - Cursor example
   - generic MCP client example if useful

4. **Tooling notes**
   - this MCP surface is hosted by Easy API
   - requires API key
   - not available through `createClient()`

5. **Discovery links**
   - `/meta/mcp-tools.json`
   - `/meta/swagger.json`
   - `/api-docs/`

### UX requirements for the page

The page should make the following actions trivial:

- copy endpoint URL
- copy full JSON config snippet
- understand why the tab is hidden or disabled
- understand why MCP may be unavailable even when Easy API is running

### Empty/disabled states

This is important for support burden.

If the dashboard route is reachable but MCP is not available, the page should explain exactly why using explicit states such as:

- “MCP is disabled because Easy API MCP mode is off.”
- “MCP is disabled because no API key is configured.”
- “MCP is configured, but the session is not ready yet.”

This removes guesswork and reduces maintainer support load.

### Dashboard implementation implication

To support this cleanly, the plan should include:

- backend capability booleans for UI gating
- a dedicated dashboard route for MCP
- a sidebar item that appears only when `mcpAvailable === true`
- page-level explanations for partial or unavailable states

---

## What TanStack Intent should do here

TanStack Intent is valuable, just not where transport lives.

## Recommended use

Ship one or more open-wa agent skills that teach AI systems how to use the MCP tools safely and effectively.

Possible skills:

### `core-runtime`

Teach:

- session lifecycle concepts
- readiness expectations
- QR vs link-code auth
- message-send safety considerations

### `easy-api-mcp`

Teach:

- how to connect to the hosted MCP surface
- how to authenticate
- when to use hosted MCP vs local stdio MCP

### `automation-safety`

Teach:

- anti-spam boundaries
- feature licensing caveats
- what operations should require explicit user intent

### Why this matters

MCP tells an AI system **what tools exist**.

TanStack Intent helps it understand:

- which tools it should call
- in what order
- under what constraints
- what failure modes are normal

That pairing is much stronger than either layer alone.

---

## Suggested implementation phases

Before the phase list, this section adds a concrete file-by-file implementation blueprint intended for a faster coding agent.

## Execution-ready implementation blueprint

This section is intentionally detailed so an implementation agent can work mostly from this document.

### Target packages and files

#### New package

- `packages/mcp/package.json`
- `packages/mcp/src/index.ts`
- `packages/mcp/src/manifest.ts`
- `packages/mcp/src/tool-naming.ts`
- `packages/mcp/src/execution/execute-capability.ts`
- `packages/mcp/src/execution/errors.ts`
- `packages/mcp/src/adapter/hono-mcp.ts`
- `packages/mcp/src/__tests__/...`

#### Existing backend files likely to change

- `packages/config/src/schema/config.ts`
- `packages/api/src/createApiServer.ts`
- `packages/api/src/createApiMiddleware.ts` or a shared extracted execution helper
- `packages/api/src/routes/meta.ts`
- possibly `packages/api/src/types.ts`
- possibly `packages/schema/src/http-manifest.ts` or a sibling MCP manifest file

#### Existing dashboard files likely to change

- `apps/dashboard-neo/src/components/app-sidebar.tsx`
- `apps/dashboard-neo/src/lib/hooks/use-health.ts`
- `apps/dashboard-neo/src/routes/api-docs.tsx`
- `apps/dashboard-neo/src/routes/mcp.tsx` (new)
- `apps/dashboard-neo/src/routeTree.gen.ts` (generated)

---

## Backend implementation detail

### 1. Config schema additions

File:

- `packages/config/src/schema/config.ts`

Add a new MCP sub-config to `ConfigSchema`.

Recommended shape:

```ts
export const McpConfigSchema = z.object({
  enabled: z
    .boolean()
    .default(false)
    .describe('Enable the hosted MCP endpoint for Easy API. Requires apiKey.'),
  path: z
    .string()
    .default('/mcp')
    .describe('Hosted MCP endpoint path for Easy API.'),
  exposeToolsMeta: z
    .boolean()
    .default(true)
    .describe('Expose /meta/mcp-tools.json for dashboard and debugging.'),
})
```

Then add:

```ts
mcp: McpConfigSchema.optional().describe('Easy API MCP configuration. Hosted MCP requires apiKey.')
```

Notes:

- keep this under Easy API config, not under generic client/runtime config semantics
- `enabled: false` by default
- `path` should remain configurable, but the dashboard should read the actual effective path from the backend rather than assuming `/mcp`

### 2. Startup validation rules

Validation rule:

```ts
if (config.mcp?.enabled && !config.apiKey) {
  throw new Error('MCP requires Easy API apiKey. Refusing to start with MCP enabled and no apiKey configured.')
}
```

Where this should live:

- ideally near Easy API startup/config validation, before the server begins listening

Why:

- fail closed
- error early
- eliminate ambiguous runtime states

Also add a second validation rule in docs and implementation comments:

```ts
// open-wa product decision:
// hosted MCP is Easy API-only and unavailable through createClient()
```

### 3. MCP manifest generation

Primary source options:

1. create a new MCP manifest generator in `packages/mcp/src/manifest.ts`
2. optionally reuse `packages/schema/src/http-manifest.ts` inputs internally

Recommended exported type:

```ts
export interface McpToolDefinition {
  toolName: string
  functionName: string
  namespacedName: string
  namespace: string
  description: string
  inputSchema: HttpMethodDefinition['inputSchema']
  outputSchema: HttpMethodDefinition['outputSchema']
  parameterOrder: string[]
  aliases: string[]
  deprecatedAliases: string[]
  keyAliasMap: Record<string, string>
  annotations?: {
    title?: string
    readOnlyHint?: boolean
    destructiveHint?: boolean
    idempotentHint?: boolean
  }
}
```

Recommended API:

```ts
export function getMcpToolDefinitions(basePath = '/api'): McpToolDefinition[]
```

Implementation guidance:

- derive from `getHttpMethodDefinitions(basePath)`
- do not generate multiple tools for aliases
- preserve aliases in metadata only
- canonical MCP tool name should be stable and namespaced

Recommended canonical naming:

- `messages.sendText`
- `chats.getAll`
- `groups.create`

### 4. Shared execution kernel

Current HTTP path already performs:

- lifecycle gating
- payload normalization
- Zod validation
- invocation

The MCP adapter must reuse this logic.

Recommended extraction target:

- either extract from `packages/api/src/createApiMiddleware.ts`
- or create a shared helper that both API and MCP use

Suggested interface:

```ts
export interface ExecuteCapabilityOptions {
  config: Config
  getClient: () => ClientMethodMap | undefined
  isSessionConnected?: () => boolean
  elasticEmitter?: ElasticEmitter
}

export async function executeCapability(
  definition: HttpMethodDefinition,
  rawPayload: Record<string, unknown>,
  options: ExecuteCapabilityOptions,
): Promise<unknown>
```

Implementation order inside `executeCapability(...)`:

1. readiness/lifecycle check
2. normalize method payload
3. parse via `definition.inputSchema.parseAsync(...)`
4. invoke via `invokeClientMethod(...)`
5. return structured result

Do not let MCP invent its own normalization path.

### 5. Hono MCP adapter

File:

- `packages/mcp/src/adapter/hono-mcp.ts`

Recommended responsibilities:

- register MCP transport routes under configured `config.mcp.path`
- register canonical tools from generated `McpToolDefinition[]`
- reuse `executeCapability(...)`
- enforce API key auth using the same semantics as Easy API
- expose structured tool results plus text fallback
- preserve MCP initialization / lifecycle behavior
- return protocol-level errors for malformed protocol requests
- return tool-level errors for open-wa execution failures

Suggested factory:

```ts
export interface CreateHostedMcpOptions {
  config: Config
  getClient: () => ClientMethodMap | undefined
  isSessionConnected?: () => boolean
  methodDefinitions?: HttpMethodDefinition[]
}

export function mountHostedMcp(app: Hono, options: CreateHostedMcpOptions): void
```

Implementation note for the coding agent:

- prefer using an MCP SDK/server abstraction that already implements the protocol envelope correctly
- do not hand-roll JSON-RPC parsing unless absolutely necessary
- if an SDK requires a transport-specific adapter, keep that adapter thin and focused on wiring open-wa tool definitions into the server

Mounting behavior:

- if `config.mcp?.enabled !== true`, do nothing
- if enabled and no `apiKey`, throw before mounting

Transport note:

- the endpoint should be mounted as a single MCP endpoint path (for example `/mcp`) rather than inventing multiple ad-hoc sub-routes for tool actions

### 6. API server integration

File:

- `packages/api/src/createApiServer.ts`

Current `/health` response already includes:

- `host`
- `connected`
- `session`
- QR and health details

Extend it with capability info for dashboard gating.

Recommended addition:

```ts
capabilities: {
  apiKeyConfigured: Boolean(this.config.apiKey),
  mcpEnabled: Boolean(this.config.mcp?.enabled),
  mcpAvailable: Boolean(this.config.apiKey && this.config.mcp?.enabled),
  mcpPath: this.config.mcp?.path || '/mcp',
}
```

Also add host metadata if useful:

```ts
host: {
  ...,
  mcp: {
    enabled: Boolean(this.config.mcp?.enabled),
    available: Boolean(this.config.apiKey && this.config.mcp?.enabled),
    path: this.config.mcp?.path || '/mcp',
  }
}
```

Then mount MCP after core middleware and before startup completes.

### 7. Meta routes

File:

- `packages/api/src/routes/meta.ts`

Add a new route:

- `GET /meta/mcp-tools.json`

Suggested payload:

```ts
{
  endpoint: '/mcp',
  requiresApiKey: true,
  tools: McpToolDefinition[]
}
```

Why:

- dashboard consumption
- debugging
- future docs/codegen

Important distinction:

- `/meta/mcp-tools.json` is **not** the protocol discovery surface
- it is a convenience/debug artifact only

---

## Dashboard implementation detail

### 1. Sidebar integration

File:

- `apps/dashboard-neo/src/components/app-sidebar.tsx`

Current pattern:

- static `navItems` array
- rendered group-by-group

Implementation guidance:

- do not hardcode MCP into the top-level static array with unconditional visibility
- inject the MCP item into the Developer group only when capability data says it is available

Recommended approach:

1. add a lightweight hook, likely based on `use-health.ts`
2. derive `mcpAvailable`
3. clone or transform `navItems` before rendering

Example shape:

```ts
const { health } = useHealth()
const mcpAvailable = Boolean(health?.capabilities?.mcpAvailable)
```

Then append:

```ts
{ title: 'MCP', href: '/mcp', icon: <Bot size={18} /> }
```

to the Developer group only when `mcpAvailable` is true.

### 2. Health hook extension

File:

- `apps/dashboard-neo/src/lib/hooks/use-health.ts`

Extend `HealthData` with capability fields.

Recommended update:

```ts
export interface HealthData {
  // existing fields...
  capabilities?: {
    apiKeyConfigured: boolean
    mcpEnabled: boolean
    mcpAvailable: boolean
    mcpPath?: string
  }
}
```

The REST fallback parser should preserve `capabilities` from `/health`.

Do not derive these booleans in the dashboard from unrelated config fields.

### 3. MCP route

New file:

- `apps/dashboard-neo/src/routes/mcp.tsx`

Suggested route registration:

```ts
export const Route = createFileRoute('/mcp')({ component: McpPage })
```

Suggested sections on the page:

#### Header

- title: `MCP`
- short explanation: hosted MCP endpoint for Easy API

#### Status card

Show:

- MCP enabled / disabled
- API key configured / missing
- session ready / not ready

#### Connection details card

Show:

- base API URL
- effective MCP URL = `${apiUrl}${mcpPath}`
- auth requirement summary

Because MCP clients differ, the page should avoid pretending that all clients want the same auth shape. The UI should present:

- the required secret (`apiKey`)
- the recommended header shape used by open-wa
- copy-ready examples per client configuration format

#### Copy-paste snippets card

At minimum:

- Claude Desktop JSON example
- Cursor MCP JSON example
- generic endpoint/auth example

These snippets should use the runtime-discovered API URL and MCP path, not hardcoded defaults.

They should also include an explicit note that open-wa is using Easy API API-key auth for the hosted endpoint.

#### Discovery links card

- `/meta/mcp-tools.json`
- `/meta/swagger.json`
- `/api-docs/`

#### Unavailable state card

When not available, show an explanation instead of a broken setup flow.

### 4. API Docs route note

File:

- `apps/dashboard-neo/src/routes/api-docs.tsx`

This file currently explicitly disables MCP in Scalar:

```ts
mcp: { disabled: true }
```

That should remain as-is for now.

Reason:

- the dashboard will own the MCP UX explicitly
- avoid duplicating MCP entry points in API Docs and the dedicated MCP page

### 5. UX copy requirements

The dashboard text should be very explicit.

Examples:

- “Hosted MCP is enabled for this Easy API instance.”
- “MCP requires the same Easy API API key used for secured API access.”
- “MCP is not available through createClient(). Use Easy API if you want first-party MCP support.”
- “MCP is disabled because this instance does not have an API key configured.”

This matters because the feature will otherwise generate confusion and support load.

---

## Suggested PR/task slices

This is the recommended decomposition for a fast coding agent.

### Slice 1 — config and capability plumbing

Goal:

- add `config.mcp`
- reject MCP without `apiKey`
- surface capability booleans in `/health`

Files:

- `packages/config/src/schema/config.ts`
- `packages/api/src/createApiServer.ts`

Acceptance:

- enabling MCP without `apiKey` fails clearly
- `/health` returns capability booleans
- docs/comments state that MCP is Easy API-only

### Slice 2 — MCP manifest generation

Goal:

- add `@open-wa/mcp`
- generate canonical MCP tool manifest from schema

Files:

- `packages/mcp/src/manifest.ts`
- `packages/mcp/src/tool-naming.ts`

Acceptance:

- one canonical tool per method
- aliases in metadata only
- tool metadata is sufficient to drive `tools/list` responses

### Slice 3 — shared execution kernel

Goal:

- unify HTTP and MCP invocation logic

Files:

- `packages/mcp/src/execution/execute-capability.ts`
- or extracted shared helper from API package

Acceptance:

- parity tests pass for representative methods
- tool errors vs protocol errors are clearly separated

### Slice 4 — hosted MCP transport

Goal:

- mount MCP into Easy API host
- add `/meta/mcp-tools.json`

Files:

- `packages/mcp/src/adapter/hono-mcp.ts`
- `packages/api/src/routes/meta.ts`
- `packages/api/src/createApiServer.ts`

Acceptance:

- hosted MCP endpoint works only when allowed
- auth enforcement matches Easy API
- initialization lifecycle works correctly
- tool discovery works through MCP `tools/list`
- tool invocation works through MCP `tools/call`

### Slice 5 — dashboard UX

Goal:

- conditional MCP sidebar item
- dedicated MCP setup page

Files:

- `apps/dashboard-neo/src/components/app-sidebar.tsx`
- `apps/dashboard-neo/src/lib/hooks/use-health.ts`
- `apps/dashboard-neo/src/routes/mcp.tsx`

Acceptance:

- MCP nav item appears only when available
- page shows correct endpoint and copy snippets
- disabled states are understandable

### Slice 6 — docs and release framing

Goal:

- update docs and release notes
- explain Easy API-only boundary and API key requirement

Acceptance:

- users understand how to enable the feature safely
- users are not misled into thinking this is generic `createClient()` MCP support

---

## Ordered task list for the coding agent

This section is intentionally prescriptive. The coding agent should follow it in order.

### Task 1 — Add config surface

1. Add `McpConfigSchema` to `packages/config/src/schema/config.ts`
2. Add `mcp` to `ConfigSchema`
3. Ensure defaults are safe:
   - `enabled: false`
   - `path: '/mcp'`
   - `exposeToolsMeta: true`
4. Add descriptive schema text explaining that hosted MCP requires `apiKey`

### Task 2 — Add startup validation

1. Locate Easy API startup/config validation path
2. Reject invalid config where:
   - `mcp.enabled === true`
   - and `apiKey` is missing
3. Use a clear actionable error message
4. Add tests for this validation

### Task 3 — Create `@open-wa/mcp`

1. Add `packages/mcp/package.json`
2. Add initial exports in `packages/mcp/src/index.ts`
3. Create placeholders for:
   - `manifest.ts`
   - `tool-naming.ts`
   - `execution/execute-capability.ts`
   - `execution/errors.ts`
   - `adapter/hono-mcp.ts`

### Task 4 — Generate canonical MCP tool definitions

1. In `packages/mcp/src/manifest.ts`, derive tool definitions from `getHttpMethodDefinitions()`
2. Use canonical namespaced tool names only
3. Preserve aliases as metadata only
4. Carry through:
   - description
   - parameter order
   - key alias map
   - input/output schemas
5. Add tests ensuring alias routes do not become separate tools

### Task 5 — Extract/reuse shared execution logic

1. Identify the exact normalization + validation + invocation flow in `packages/api/src/createApiMiddleware.ts`
2. Extract or wrap it into a shared execution helper
3. Ensure it can be called from both HTTP and MCP without behavior drift
4. Keep readiness/lifecycle logic intact
5. Add parity tests for a few representative methods

### Task 6 — Implement hosted MCP transport correctly

1. In `packages/mcp/src/adapter/hono-mcp.ts`, wire a real MCP server/transport abstraction
2. Mount it on a single configured path (`config.mcp.path`)
3. Register tools from generated manifest
4. Route tool execution through the shared execution kernel
5. Enforce API key auth on every MCP request
6. Ensure the endpoint behaves as MCP, not a fake REST wrapper
7. Verify:
   - initialization flow
   - `tools/list`
   - `tools/call`
   - protocol errors
   - tool errors

### Task 7 — Integrate into Easy API server

1. Mount hosted MCP from `packages/api/src/createApiServer.ts`
2. Extend `/health` with capability booleans and MCP path
3. Add any host metadata useful to the dashboard
4. Keep this integration behind `config.mcp.enabled`

### Task 8 — Add meta debugging surface

1. Add `/meta/mcp-tools.json` in `packages/api/src/routes/meta.ts`
2. Return:
   - endpoint path
   - auth requirement summary
   - generated tool metadata
3. Keep this route clearly separate from protocol discovery semantics

### Task 9 — Add dashboard capability plumbing

1. Extend `HealthData` in `apps/dashboard-neo/src/lib/hooks/use-health.ts`
2. Preserve backend `capabilities` object from `/health`
3. Do not derive MCP visibility from redacted config

### Task 10 — Add dashboard nav gating

1. Update `apps/dashboard-neo/src/components/app-sidebar.tsx`
2. Add MCP item to the Developer group only when `mcpAvailable === true`
3. Do not hardcode unconditional visibility

### Task 11 — Add MCP dashboard page

1. Create `apps/dashboard-neo/src/routes/mcp.tsx`
2. Show:
   - status banner
   - effective MCP URL
   - auth summary
   - copy-paste snippets for supported AI clients
   - discovery links
   - unavailable-state explanations
3. Keep `api-docs.tsx` MCP-disabled in Scalar

### Task 12 — Add tests

Minimum required coverage:

1. config validation tests
2. manifest generation tests
3. invocation parity tests
4. MCP transport lifecycle tests
5. auth failure tests
6. dashboard visibility tests

### Task 13 — Add docs/release framing

1. Document that MCP is Easy API-only
2. Document that MCP requires `apiKey`
3. Document that `createClient()` does not expose first-party MCP support
4. Explain the security rationale clearly

---

## Coding agent handoff brief

Use this brief when handing the work to a faster/weaker coding agent.

### Copy-paste brief

Implement the MCP feature exactly as specified in `notes/open-wa-mcp-integration-design.md`.

Follow the ordered task list in that document strictly.

Non-negotiable constraints:

1. MCP is **Easy API-only**.
2. MCP lives in a new package: **`@open-wa/mcp`**.
3. MCP must be **schema-first** and generated from the existing schema/manifest pipeline.
4. MCP must **not** be exposed through `createClient()`.
5. MCP must **fail closed** when `mcp.enabled === true` and `apiKey` is missing.
6. The hosted endpoint must behave like a real MCP endpoint, not a fake REST wrapper.
7. Dashboard work is required for completeness:
   - add a conditional MCP nav item
   - add `apps/dashboard-neo/src/routes/mcp.tsx`
   - show copy-paste MCP setup details
8. `/meta/mcp-tools.json` is a dashboard/debug artifact only, not the protocol discovery mechanism.
9. Keep protocol errors separate from tool execution errors.
10. Keep `apps/dashboard-neo/src/routes/api-docs.tsx` MCP-disabled in Scalar for now.

Implementation order:

- config surface
- startup validation
- `@open-wa/mcp` package scaffold
- MCP manifest generation
- shared execution kernel
- hosted MCP transport
- Easy API integration
- meta debugging route
- dashboard capability plumbing
- dashboard MCP page
- tests
- docs/release framing

If you are unsure about any behavior, do not invent new product scope. Follow the design doc.

### What success looks like

The implementation is only done when all of these are true:

- hosted MCP works through Easy API
- MCP cannot be enabled without `apiKey`
- tools are generated from schema/manifest
- dashboard shows MCP only when available
- dashboard MCP page shows usable copy-paste setup details
- tests cover config, transport, auth, and dashboard visibility

---

## Coding agent progress checklist

The coding agent should copy this checklist into its working notes and update it continuously.

### Status legend

- `[ ]` not started
- `[-]` in progress
- `[x]` completed
- `[blocked]` blocked, with reason noted inline

### Checklist

#### Config and validation

- [ ] Add `McpConfigSchema` to `packages/config/src/schema/config.ts`
- [ ] Add `mcp` field to `ConfigSchema`
- [ ] Ensure safe defaults (`enabled: false`, `path: '/mcp'`, `exposeToolsMeta: true`)
- [ ] Add startup validation rejecting MCP without `apiKey`
- [ ] Add tests for invalid MCP-without-apiKey config

#### MCP package scaffold

- [ ] Create `packages/mcp/package.json`
- [ ] Create `packages/mcp/src/index.ts`
- [ ] Create `packages/mcp/src/manifest.ts`
- [ ] Create `packages/mcp/src/tool-naming.ts`
- [ ] Create `packages/mcp/src/execution/execute-capability.ts`
- [ ] Create `packages/mcp/src/execution/errors.ts`
- [ ] Create `packages/mcp/src/adapter/hono-mcp.ts`

#### Manifest and schema projection

- [ ] Generate canonical MCP tool definitions from `getHttpMethodDefinitions()`
- [ ] Ensure one canonical tool per method
- [ ] Preserve aliases as metadata only
- [ ] Preserve parameter order and key alias map
- [ ] Add manifest tests

#### Shared execution path

- [ ] Extract or wrap the API normalization/validation/invocation path
- [ ] Reuse shared execution from MCP
- [ ] Preserve readiness/lifecycle behavior
- [ ] Separate protocol errors from tool execution errors
- [ ] Add invocation parity tests

#### Hosted MCP transport

- [ ] Mount MCP on a single configured endpoint path
- [ ] Use a real MCP server/transport abstraction
- [ ] Implement initialization lifecycle correctly
- [ ] Implement `tools/list`
- [ ] Implement `tools/call`
- [ ] Enforce Easy API auth on every MCP request
- [ ] Verify endpoint is protocol-shaped, not fake REST

#### Easy API integration

- [ ] Integrate hosted MCP into `packages/api/src/createApiServer.ts`
- [ ] Extend `/health` with MCP capability booleans
- [ ] Add MCP host/path metadata if needed
- [ ] Keep this integration behind `config.mcp.enabled`

#### Meta/debugging surface

- [ ] Add `/meta/mcp-tools.json`
- [ ] Return endpoint path, auth summary, and generated tool metadata
- [ ] Keep `/meta/mcp-tools.json` clearly separate from MCP protocol discovery

#### Dashboard

- [ ] Extend `apps/dashboard-neo/src/lib/hooks/use-health.ts` with MCP capability fields
- [ ] Update `apps/dashboard-neo/src/components/app-sidebar.tsx` to show MCP conditionally
- [ ] Add `apps/dashboard-neo/src/routes/mcp.tsx`
- [ ] Show status banner, endpoint details, auth summary, discovery links, and copy-paste snippets
- [ ] Keep Scalar MCP disabled in `apps/dashboard-neo/src/routes/api-docs.tsx`
- [ ] Add clear disabled/unavailable state messaging
- [ ] Add dashboard visibility tests

#### Docs and release framing

- [ ] Document MCP as Easy API-only
- [ ] Document that MCP requires `apiKey`
- [ ] Document that `createClient()` does not expose first-party MCP
- [ ] Document the security rationale clearly
- [ ] Add release notes or changelog framing

#### Final verification

- [ ] Config validation passes
- [ ] MCP transport works end-to-end
- [ ] Tool discovery works
- [ ] Tool invocation works
- [ ] Auth failures behave correctly
- [ ] Dashboard visibility works
- [ ] Copy-paste dashboard snippets are correct
- [ ] No unsupported product scope was added

### If blocked

If the coding agent gets stuck, it should report using this format:

```md
[blocked] <checklist item>
Reason: <specific blocker>
Tried: <what was attempted>
Needs: <decision / missing context / failing dependency>
```

That makes it easy to resume without losing context.



## Phase 0 — design cleanup

Before writing MCP transport code:

1. identify weak output schemas (`z.any`) in high-value methods
2. confirm canonical MCP naming rules
3. decide whether MCP annotations belong in registry metadata now or later
4. extract shared execution boundary if HTTP currently owns too much of it

Deliverables:

- naming decision
- manifest shape decision
- execution boundary decision

## Phase 1 — generate MCP manifest from schema

Add:

- `getMcpToolDefinitions()` in schema or new MCP package

Rules:

- one canonical tool per method
- aliases included as metadata only
- preserve parameter order and key alias map
- include enough description for AI discovery

Deliverables:

- manifest types
- manifest generator
- snapshot tests

## Phase 2 — shared invocation kernel

Extract or formalize shared execution logic.

Deliverables:

- reusable `executeCapability(...)`
- consistent error mapping
- readiness and auth hooks
- tests proving HTTP and MCP execute the same semantics

## Phase 3 — hosted MCP in Easy API

Mount MCP beside Easy API as the only supported transport.

Deliverables:

- Hono MCP transport adapter
- auth and readiness integration
- startup validation that rejects MCP without `apiKey`
- docs for hosted deployment

## Phase 4 — dashboard integration (`apps/dashboard-neo`)

Add a first-class dashboard surface for MCP.

Deliverables:

- new dashboard route: `apps/dashboard-neo/src/routes/mcp.tsx`
- conditional sidebar item in `apps/dashboard-neo/src/components/app-sidebar.tsx`
- backend capability booleans for UI gating
- copy-paste config blocks for supported AI clients
- clear disabled/unavailable state messaging

## Phase 5 — Intent skills

Ship agent skills with the package ecosystem.

Deliverables:

- `skills/core-runtime/SKILL.md`
- `skills/easy-api-mcp/SKILL.md`
- validation and packaging config

---

## Testing strategy

MCP work will fail if it is tested only at the transport layer.

It needs three levels of tests.

## 1. Manifest contract tests

Assert that generated MCP tool definitions match registry data.

Examples:

- canonical tool names are stable
- aliases do not become duplicate tools
- parameter order is preserved
- key alias map is present

## 2. Invocation parity tests

Given the same logical call:

- HTTP invocation and MCP invocation should normalize and validate the same way
- both should produce equivalent results or equivalent errors

These are the most important tests in the whole design.

## 3. End-to-end transport tests

Test:

- hosted Hono MCP server
- auth failures
- readiness failures
- structured output behavior
- dashboard visibility and copy-paste UX correctness

---

## Risks and failure modes

## 1. Tool explosion

If every alias is exposed as a separate MCP tool, AI clients will see a noisy tool list and choose inconsistently.

**Mitigation**

- one canonical tool per method
- aliases as metadata only

## 2. Schema drift

If MCP introduces its own hand-maintained schemas, it will drift from HTTP and SDK behavior.

**Mitigation**

- derive exclusively from registry/manifest
- never hand-copy schemas

## 3. Auth bypass

If MCP executes methods directly without going through equivalent guardrails, it may bypass Easy API security and lifecycle policies.

**Mitigation**

- shared invocation kernel
- explicit auth/readiness hooks

## 4. Weak structured outputs

If high-value methods return `z.any`, MCP consumers lose much of the benefit of typed responses.

**Mitigation**

- prioritize stronger output schemas for the most-used methods

## 5. Transport-first design creep

It is easy to let a Hono wrapper become the real design by accident.

**Mitigation**

- keep manifest generation as the primary implementation milestone
- keep transport adapters thin

## 6. Incomplete operator UX

If MCP ships without clear dashboard visibility, copy-paste setup instructions, and explicit disabled states, users will misconfigure it and blame the runtime.

**Mitigation**

- dedicated MCP page in `dashboard-neo`
- capability-driven sidebar visibility
- copy-ready configuration snippets
- explicit reasons when MCP is unavailable

---

## Concrete recommendation

If this were being turned into implementation work today, the recommendation would be:

1. Create a new `packages/mcp` package.
2. Generate `McpToolDefinition[]` from the existing schema registry / `HttpMethodDefinition` data.
3. Extract a shared capability execution function so HTTP and MCP do not diverge.
4. Ship **hosted MCP in Easy API only**.
5. Require Easy API `apiKey` before MCP can be enabled; fail closed otherwise.
6. Keep `createClient()` out of scope for first-party MCP exposure.
7. Add a dedicated `dashboard-neo` MCP page with conditional sidebar visibility and copy-paste client configuration.
8. Ship **TanStack Intent skills** to document usage patterns and safety constraints.

That path gives the fastest useful AI integration without compromising the repo’s architecture.

---

## Final position

open-wa should not expose MCP by wrapping routes as the canonical model.

It should expose MCP by projecting tools from the same schema registry that already drives:

- client generation
- aliasing
- validation
- HTTP manifests
- OpenAPI
- Postman

Hono should remain the transport and hosting layer for the supported MCP surface.

TanStack Intent should sit next to MCP as the agent-instruction layer.

That gives open-wa the right split:

- **schema for truth**
- **MCP for execution**
- **Intent for guidance**

---

## Appendix: possible first public artifacts

### Runtime artifacts

- `/meta/mcp-tools.json`
- hosted MCP endpoint in Easy API
- Easy API config validation that rejects MCP without `apiKey`
- dashboard capability fields for MCP visibility
- dashboard MCP connection page

### Package artifacts

- `@open-wa/mcp`
- `skills/core-runtime/SKILL.md`
- `skills/easy-api-mcp/SKILL.md`

### Internal follow-up docs

- tool naming decision record
- invocation parity test plan
- output-schema hardening shortlist

---

## What “feature complete” should mean

This feature is not complete just because an MCP endpoint exists.

For open-wa, feature complete should mean all of the following are true:

### Backend completeness

- `@open-wa/mcp` exists and owns MCP-specific implementation
- MCP tool manifest is generated from schema/manifest, not hand-authored
- MCP runs only through Easy API
- MCP cannot be enabled unless `apiKey` is configured
- startup failure is clear and actionable when config is invalid
- readiness/auth/lifecycle behavior matches HTTP behavior

### Dashboard completeness

- MCP tab appears only when capability requirements are satisfied
- MCP page shows endpoint details and copy-paste config blocks
- unavailable states are explained clearly
- users can discover related artifacts (`/meta/mcp-tools.json`, `/api-docs/`, swagger)

### Documentation completeness

- Easy API docs explain how to enable MCP safely
- docs explicitly state MCP is not available via `createClient()`
- docs include examples for at least the most likely AI clients
- docs explain the security rationale behind the API-key requirement

### Testing completeness

- manifest tests
- invocation parity tests
- transport/auth tests
- dashboard visibility tests
- copy-block rendering or snapshot coverage for dashboard MCP setup details

### Support/comms completeness

- release notes call out that MCP is Easy API-only
- release notes call out that MCP requires `apiKey`
- error messages are phrased to prevent operator confusion
- maintainer-facing docs include common troubleshooting cases

If any of those pieces are missing, the implementation is still only partially complete.
