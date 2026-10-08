# Live session patch refresh and license activation

Date: 2026-10-08
Status: Source implementation after PR #3503 merged; no execution checks, live-session acceptance, deployment, or publication performed.

## Implementation decision

Reload the WhatsApp page in the existing browser, then reinstall its complete document runtime. Retain Node, the API server, the browser process/context, the public client, host listeners/plugins, and the portable persistence lease. Manual refresh rebuilds even when the public patch tag is unchanged.

The two dashboard actions share one session-owned operation:

- **Refresh patches** downloads fresh public patches, replaces the page, and obtains fresh license code for the effective session key during installation.
- **Apply license** performs the same replacement in the background and evaluates the submitted key's license code on the replacement page.

Preparation happens while the old document remains available. Replacement interrupts WhatsApp operations and document-owned call media; it does not promise to preserve an active media stream across reload.

## Settled base and prior art

Public implementation starts at the merged #3503 commit `2cc43534659d3d1cea48627f1ffafd6e6d265eb1`. That source uses the existing `/license-check` protected-program flow. The independent signed-licensing work was not merged by #3503 and is not an implementation dependency here; this corrects the earlier plan's assumption.

The existing v5 transport recovery queue, generation tracking, injection controller, listener bindings, and readiness machinery remain the owners of their respective resources. The preserved v5 coordinator/activity gate supplied useful mechanics; its separate Worker, publisher, polling, and release-manifest system are outside this change. `client.refresh()` retains the useful v4 public concept using current ownership.

Public source is isolated at `/private/tmp/owa-session-refresh-20261008`, branch `feat/session-refresh`. Paired private source is isolated at `/private/tmp/owa-private-session-refresh-20261008`, also `feat/session-refresh`, based on private commit `a9f2f17cb8f12ca878e1c38cb4eee5673eb77efa`. Primary checkouts remain available for their existing work.

The private worktree carries the existing dirty primary `functions/portable-session/pre_init.js` as its prerequisite baseline before adding the reversible reload handoff. Its complete diff therefore includes pre-existing native storage/crypto corrections. Keep that provenance when grouping later commits. Other concurrent private patch edits remain in the primary checkout.

## Runtime ownership and installation

`packages/core/src/livePatch/SessionRefreshController.ts` owns one accepted operation and its candidate key. `ActivityGate.ts` tracks admitted application calls. `installDocument.ts` owns the repeatable ordered overlay installation used by startup, explicit refresh, and complete document recovery.

The ordered replacement is:

1. **Download:** resolve the current account/version and fetch public patches afresh. Failed or empty public downloads fail before intentional navigation.
2. **Drain:** claim planned runtime mutation ownership, settle prior recovery work, close application admission, and wait up to 15 seconds for admitted operations. New application calls receive `SESSION_REFRESHING`; mutations are never queued for replay.
3. **Checkpoint:** pause portable acknowledged delivery, settle native writes and receipts, save through the host, and fence old-document commits. This stage has its own 15-second deadline and reversible abort path; it does not use terminal flush/release.
4. **Reload:** mark document readiness pending, invalidate calling media, reload the existing page, wait for its bootstrap and authentication surface, and install the base runtime without replaying cached public patches ahead of the selected bundle.
5. **Install:** apply every selected public artifact, confirm the account still matches, request and evaluate fresh license code, run the initializer, and activate browser bindings and portable delivery. A license rejection remains a non-blocking feature-access result.
6. **Commit:** require existing runtime/operational readiness and attestation for successfully installed licensed calling capabilities, commit an accepted key and the installed public patch tag, and reopen application admission. A rejected license reports an error while the public session stays ready.

Startup-only plugin initialization, collectors, webhook registration, process finalizers, and `core.started` are not rerun. InjectionController retains browser-registration ownership; host listener handles survive.

Stop and confirmed logout supersede refresh. Planned reload callbacks cannot launch competing automatic recovery. Automatic full recovery uses the shared installer with fresh license authorization from the committed key, and renewal work is fenced against a retiring document generation.

## Failure and pairing behavior

Before navigation, download or draining failures leave the installed state unchanged. A checkpoint failure attempts to resume the original document. Failed resumption leaves readiness blocked instead of claiming the document recovered.

After navigation, the old document is gone. A runtime installation failure allows one restoration with the previously installed public artifacts and effective key, obtaining fresh license code. Successful restoration reports the requested operation as failed with `restored: true` and a usable runtime. Failed restoration leaves the browser and data in place with application calls blocked. A license rejection alone finishes public initialization, reports `SESSION_REFRESH_LICENSE_REJECTED` with `runtimeUsable: true`, and doesn't trigger restoration.

If the replacement needs pairing, publish `needs_auth`, expose the existing QR journey, retain operation ownership, and resume installation after authentication. The pending continuation is bounded to 120 seconds; status remains available throughout. It cannot install material for a different account. An SDK call can return the actionable pairing state before the continuation completes.

## License evaluation

Use the existing `/license-check` request and executable response. Obtain fresh code immediately before applying it on the replacement page. The program's own account/expiry guards and `applyLicenseArtifact()` determine whether the key unlocks functionality before the initializer freezes WAPI.

Refresh requires a server response for feature unlocks and doesn't fall back to local license metadata. Downloading non-empty JavaScript doesn't prove authorization; its evaluation result updates installed license state. Rejection doesn't stop the host or block public functionality.

The committed key lives in host session memory. Omitting a key preserves it; an empty submitted key is invalid. Process-restart persistence, config-file edits, and license removal are outside this change.

There is no license preparation flag or additional license-service deployment dependency. The Bitbucket branch removes that mode; its remaining server change removes credential logging. `open-wa-backoffice` already owns a `/license-check` route and needs no refresh-specific response contract. Source installation code is not live-session acceptance.

## SDK, API, and progress

The core client and Client facade expose:

```ts
requestRefresh(options?: { licenseKey?: string }): { operationId: string };
refresh(options?: { licenseKey?: string }): Promise<SessionRefreshResult>;
getRefreshStatus(): Promise<SessionRefreshSnapshot>;
```

HTTP/SSE SocketClient and TunnelSocketClient implement explicit host controls, with asynchronous `requestRefresh()`. The CLI tunnel maps those controls to the dedicated local HTTP route with its configured API credential. Their generic WAPI proxies do not own replacement.

| Method | Route | Response |
| --- | --- | --- |
| POST | `/api/session/refresh`, body `{ licenseKey?: string }` | 202 `{ operationId }` |
| GET | `/api/session/refresh` | Safe current operation snapshot |

Mount these routes before generic WAPI dispatch, outside document readiness admission, with the configured API key policy and rate limiting. HTTP controls remain reachable during replacement. Use 400 for invalid input, 409 for conflicting ownership/state, and 503 for an unavailable runtime owner. Accepted work belongs to the session and survives requesting-client disconnection.

The snapshot includes operation ID, reason, phase, timestamps, patch tag, `runtimeUsable`, `restored`, and a sanitized error. It never includes a key or executable program. `session.refresh.progress` uses the existing event bridge and explicit SocketClient stream subscription.

HealthStore and dashboard health keep candidate preparation separate from installed state. Preparation retains the active badge/tag; reload clears the retired installation; application results become installed state only after readiness succeeds or restoration completes.

## Dashboard and documentation

The Health page has separate **Refresh status** and **Refresh patches** controls. The license popover has a masked key input and **Apply license**, which runs the shared operation without another manual click. Both show progress, block conflicting requests, reconcile status after reconnect/remount, and clear submitted credentials on acceptance. Demo mode does not dispatch live controls.

Operator documentation lives in `apps/docs/content/docs/operations/session-refresh.mdx`. `.bumpy/session-refresh.md` records package bump intent; it does not publish packages.

## Private artifact and retained constraints

Private injected changes live in `functions/portable-session/pre_init.js`. Its existing source builder generated the public `packages/core/src/transport/assets/pre_init.js` using installed dependencies. The immutable `packages/core/src/transport/assets/wapi.js` is untouched. Generated bundles were not hand-edited.

This implementation adds no compatibility paths or legacy aliases. Same-document replacement, patch polling, a new control plane/CDN, process restart persistence of dashboard keys, and runtime upgrades remain outside scope.

Mohammed's repository instructions prohibit tests, fixtures, typechecks, lint, build checks, and CI work unless explicitly requested. None were added or run. Source artifact generation is part of shipping the requested private browser code. No live WhatsApp session was started. The implementation is delivered as separate runtime, dashboard, and documentation commits, with paired private source commits; deployment and publication remain separate.
