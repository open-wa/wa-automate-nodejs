# cli/integrations/chatwoot.ts pseudocode trace

Source of truth: `packages/legacy/src/cli/integrations/chatwoot.ts`

This file is large. This note focuses on the integration behavior exposed to the CLI/server layer.

## Role

- Bidirectional bridge between a live WA client and Chatwoot inbox/conversation flows.

## Main exported pieces

- `chatwoot.ts:25` — event name constant used for integration checks.
- `chatwoot.ts:42-128` — `chatwootMiddleware(cliConfig, client)`
  - consume Chatwoot webhook payloads
  - ignore unsupported/private/incoming cases
  - map Chatwoot messages and attachments into WA sends
  - support CSAT follow-up messages
  - store outgoing message ids in an ignore map.
- `chatwoot.ts:130-134` — `setupChatwootOutgoingMessageHandler(...)` initializes the Chatwoot client wrapper.

## ChatwootClient

- `chatwoot.ts:179+` — `ChatwootClient` encapsulates:
  - Chatwoot endpoint/account/inbox discovery
  - webhook validation and setup
  - contact/conversation lookup/creation
  - outbound message sync between WA and Chatwoot.

## Why this matters for v5

- This file shows a concrete example of a nontrivial integration layered on top of the legacy client.
- It is useful as reference material for the future plugin/integration architecture even though it is optional runtime behavior.

## Behavioral contract / pseudo tests

- Integration middleware should translate external-system events into WA-side actions without bypassing the core client contract.
- Unsupported message types or unsupported contexts should be ignored explicitly rather than producing undefined behavior.
- Contact/conversation mapping should remain stable across repeated sync operations.
- Outbound integration sends should protect against feedback loops where the integration consumes its own emitted messages.
- Integration bootstrap should verify enough remote state to know whether the integration is usable.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Bidirectional CRM/helpdesk bridge | Preserve | Good plugin/integration reference. |
| Exact Chatwoot-specific API choreography | Intentionally changed | Specific integration can be reworked. |

## Inputs / outputs / side effects

- Inputs: webhook payloads, client, Chatwoot config/API credentials.
- Outputs: translated outbound WA actions and synced Chatwoot state.
- Side effects: remote API calls, local ignore/contact/conversation registry mutation.

## Failure taxonomy

- Remote API auth failure
- Webhook payload mismatch
- Contact/conversation sync failure
- Outgoing message translation failure

## Dependency contracts

- Requires: live client, remote Chatwoot API reachability, stable ID mapping.
- Guarantees: integration sits on top of client/server contracts rather than bypassing them.

## State transitions

- `WEBHOOK_RECEIVED -> TRANSLATED -> WA_ACTION_SENT | IGNORED | INTEGRATION_ERROR`
- `INTEGRATION_UNINITIALIZED -> REMOTE_STATE_VERIFIED -> INTEGRATION_READY`
