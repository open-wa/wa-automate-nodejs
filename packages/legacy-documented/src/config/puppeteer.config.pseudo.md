# puppeteer.config.ts pseudocode trace

Source of truth: `packages/legacy/src/config/puppeteer.config.ts`

## Role

- Static browser-launch defaults consumed by `browser.ts`.

## Main contents

- `puppeteer.config.ts:1-56` — define the default WA URL, default viewport size, and a large Chromium argument set aimed at stability/headless compatibility.
- `puppeteer.config.ts:58-59` — define `createUserAgent(waVersion)` and a default `useragent` pinned to a WA version string.
- `puppeteer.config.ts:62-63` — export width/height convenience constants.

## Why this matters for v5

- The current launcher assumes a curated Chromium profile rather than vanilla Puppeteer defaults.
- The user-agent/version coupling is part of the session boot strategy and should be treated as launch policy, not incidental config.

## Behavioral contract / pseudo tests

- Browser defaults should prioritize stable WA session boot over minimal configuration purity.
- Launch config should provide a clear default target URL and a deterministic default viewport.
- User-agent policy should remain version-aware enough to avoid obviously incompatible sessions.
- Chromium flags may change, but v5 should still document which browser behaviors are intentionally constrained for stability.

## Parity status

| Dimension | Status | Note |
| --- | --- | --- |
| Central launch defaults | Preserve | One place should define browser defaults. |
| Exact Chromium args | Intentionally changed | Tooling/browser stack may differ. |

## Inputs / outputs / side effects

- Inputs: WA version or browser policy inputs.
- Outputs: default WA URL, viewport, UA policy, launch args.
- Side effects: none beyond configuration definition.

## Failure taxonomy

- Incompatible default UA
- Unsupported browser flags

## Dependency contracts

- Requires: launcher/browser layer consumes a single source of default browser policy.
- Guarantees: callers have deterministic defaults when they do not override browser settings.

## State transitions

- `DEFAULTS_DEFINED -> CONSUMED_BY_BROWSER_BOOTSTRAP`
