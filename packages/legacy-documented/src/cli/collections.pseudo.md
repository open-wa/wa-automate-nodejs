# collections.ts pseudocode trace

Source of truth: `packages/legacy/src/cli/collections.ts`

## Role

- Generates and stores Postman/Swagger collections for Easy API mode.

## Main flow

- `collections.ts:7` — export mutable in-memory `collections` registry.
- `collections.ts:9-218` — `generateCollections(config, spinner)`:
  - load prebuilt OAS type schemas
  - generate Postman collection
  - convert Postman → Swagger/OpenAPI
  - add tags, security, request/response normalization, and meta/media paths
  - sort paths
  - optionally write Swagger output to disk
  - cache both `postman` and `swagger` in memory.

## Why this matters for v5

- It documents how the legacy API server self-describes its runtime surface.
- Useful if v5 wants pluggable/self-generated API schemas from the same integration host.

## Behavioral contract / pseudo tests

- API collection generation should reflect the real callable API surface, not stale hand-maintained documentation.
- Generated specs should include auth metadata when API keys are enabled.
- Meta/documentation endpoints should be discoverable from the generated server surface.
- Spec generation failures should be observable without crashing unrelated runtime behavior.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Self-generated API collections | Preserve | Valuable for host discoverability. |
| Exact Postman->Swagger toolchain | Intentionally changed | Generation stack may change. |

## Inputs / outputs / side effects

- Inputs: runtime config, generated client method inventory, type schemas.
- Outputs: in-memory swagger/postman collections and optional saved files.
- Side effects: file writes, spinner/reporting output.

## Failure taxonomy

- Collection generation failure
- Type-schema mismatch
- Spec post-processing failure

## Dependency contracts

- Requires: a canonical API command surface and type-schema source.
- Guarantees: server/docs layers can consume generated collections from memory.

## State transitions

- `NO_COLLECTIONS -> POSTMAN_GENERATED -> SWAGGER_GENERATED -> COLLECTIONS_READY`
