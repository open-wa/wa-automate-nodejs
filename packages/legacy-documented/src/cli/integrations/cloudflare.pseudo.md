# cli/integrations/cloudflare.ts pseudocode trace

Source of truth: `packages/legacy/src/cli/integrations/cloudflare.ts`

## Role

- Creates a Cloudflare tunnel that exposes the local Easy API server on a custom domain.

## Main flow

- `cloudflare.ts:4-69` — `createCustomDomainTunnel(cliConfig, PORT)`:
  - derive a sanitized session-based tunnel name and FQDN
  - check whether the named tunnel already exists
  - create it if missing
  - route DNS to the tunnel
  - run the tunnel against `http://localhost:${PORT}`
  - wait for all edge connections to come up
  - return url, child process handles, and a stop function that also deletes the tunnel.

## Why this matters for v5

- It is an example of infrastructure automation bolted onto the runtime host.
- Relevant if integrations/plugins in v5 are expected to provision public endpoints or transport adapters.

## Behavioral contract / pseudo tests

- Tunnel provisioning should be idempotent enough to recover when a named tunnel already exists.
- Public endpoint setup should clearly report the final externally reachable URL.
- Tunnel teardown should clean up created infrastructure rather than only stopping the local process.
- Failure to create public exposure should not be mistaken for failure of the core local runtime unless policy requires it.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| External endpoint provisioning capability | Preserve | Useful optional host feature. |
| Exact cloudflared workflow | Intentionally changed | Infra provider/tool may change. |

## Inputs / outputs / side effects

- Inputs: host config, target local port.
- Outputs: externally reachable URL and stop/teardown handle.
- Side effects: remote tunnel creation/routing, child process spawn, DNS route mutation.

## Failure taxonomy

- Tunnel existence check failure
- Tunnel create/route failure
- External connection establishment failure
- Teardown/delete failure

## Dependency contracts

- Requires: local server target and infrastructure credentials/environment for tunnel creation.
- Guarantees: caller gets an explicit URL/stop handle pair on success.

## State transitions

- `NO_TUNNEL -> TUNNEL_EXISTS | TUNNEL_CREATED -> ROUTED -> CONNECTIONS_READY`
- `CONNECTIONS_READY -> STOPPED -> DELETED`
