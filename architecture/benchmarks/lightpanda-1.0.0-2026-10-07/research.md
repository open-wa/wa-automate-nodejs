# Lightpanda v1 / OpenWA research: benchmarks, native session fixes, and unresolved reliability

This is the full public research record for the 7–8 October 2026 investigation. Stock Lightpanda 1.0.0 used substantially fewer resources than Chrome on the successful local extraction workload, but stock 1.0.0 did not reach WhatsApp's QR screen in the original comparison. A custom native build plus OpenWA integration fixes subsequently reached authenticated library readiness, returned non-empty real chat/contact lists, and demonstrated a saved-session reload with a new checkpoint. Later lifecycle and dashboard regressions, together with user-reported send failures, mean reliable WhatsApp operation and Chrome feature parity remain unestablished.

The investigation was stopped at the user's request and preserved for research. This document records observations and code changes; it does not announce production support or a published release.

## Privacy and evidence boundaries

This report excludes account identifiers, phone numbers, contact names, message contents, session identifiers, session filenames, QR strings or fingerprints, credentials, encrypted checkpoints, raw browser/CDP logs, account screenshots, and user-local paths. Real-account data is described only as non-empty lists. Public native changes are preserved as source; proprietary injected runtime changes are described by behavior, without publishing their implementation or private repository location.

The benchmark used generated local records, not a real account. Runtime findings came from the actual OpenWA library and Easy API session. A successful HTTP response, visible chat list, native CONNECTED socket, completed checkpoint, and delivered outgoing message are separate pieces of evidence. The record below keeps those distinctions explicit.

## Preserved implementation and artifacts

- [OpenWA research branch](https://github.com/open-wa/wa-automate-nodejs/tree/codex/lightpanda-research): driver, transport, portable-session host, diagnostics, benchmark sources, documentation, and marketing artifacts.
- [OpenWA native Lightpanda fork](https://github.com/open-wa/lightpanda-browser/tree/codex/lightpanda-research): native session primitives and ownership fixes. The native implementation commit is [f984445bdc86563ad6236378197ded3da4b980f8](https://github.com/open-wa/lightpanda-browser/commit/f984445bdc86563ad6236378197ded3da4b980f8).
- [Native patch and selection instructions](https://github.com/open-wa/wa-automate-nodejs/tree/codex/lightpanda-research/packages/driver-lightpanda/native): current main-based patch and the earlier 1.0.0-based patches, retained as investigation history.
- [Benchmark harness](https://github.com/open-wa/wa-automate-nodejs/blob/codex/lightpanda-research/architecture/benchmarks/lightpanda-1.0.0-2026-10-07/benchmark.mjs) and [summary implementation](https://github.com/open-wa/wa-automate-nodejs/blob/codex/lightpanda-research/architecture/benchmarks/lightpanda-1.0.0-2026-10-07/summarize.mjs): reproducible synthetic workload and measurement calculation.
- [Marketing source and exports](https://github.com/open-wa/wa-automate-nodejs/tree/codex/lightpanda-research/architecture/benchmarks/lightpanda-1.0.0-2026-10-07/marketing): announcement film, GIF, poster, sound, and source. Its numbers belong to the stock synthetic benchmark, not authenticated WhatsApp.

The private patch sources were also committed on a separate research branch. Public OpenWA source consumes generated assets from that authoritative pipeline. The immutable WAPI asset was not edited. Research changes are preserved without implying that all prior work has been removed from existing development history.

The [upstream source notes](https://github.com/open-wa/wa-automate-nodejs/blob/codex/lightpanda-research/architecture/benchmarks/lightpanda-1.0.0-2026-10-07/upstream-sources.md) retain exact merge SHAs, source inspection details, and release-workflow provenance. The findings and their limits are included in this issue body.

## 1. Binary and source provenance

### Original measured binaries

The original comparison used official Lightpanda **1.0.0**, ARM64 macOS, with SHA-256 **955440053a84754dd64c62f970449a56a2b350cdf43ea5f2e809a73047b8173d**, and Chrome **154.0.8037.58**. The host was an Apple M1 Pro with eight CPU cores and 16 GiB RAM, running macOS 26.6.2 / Darwin 25.6.0, Node 26.10.0, and Puppeteer 25.3.0.

Lightpanda's CDP Browser.getVersion advertised Chrome/124.0.6367.29. That compatibility string does not identify its executable release. The executable version and artifact digest were used for benchmark provenance.

The [numbered 1.0.0 release](https://github.com/lightpanda-io/browser/releases/tag/1.0.0) was published on 2 October 2026, and its source tag resolves to [588f6223b9cae8a2406aeef035ed9363a3e404fd](https://github.com/lightpanda-io/browser/commit/588f6223b9cae8a2406aeef035ed9363a3e404fd).

### Custom builds used during the authenticated investigation

The first native storage work used a custom 1.0.0+openwa.cryptokey.idb.2 Debug build. Later clean-start work used **1.1.0-dev+openwa.native.8**, based on upstream main at [e98a770e0ef37083b64e40d6047ab5fa5893cbff](https://github.com/lightpanda-io/browser/commit/e98a770e0ef37083b64e40d6047ab5fa5893cbff), plus the OpenWA native patch.

The source baseline was refreshed during the investigation, but it must not be described as perpetually latest. A final upstream read at approximately 07:50 UTC on 8 October found main had advanced to [cbc0deb70f0ebceed041bb5a2133f1c3d52f9f10](https://github.com/lightpanda-io/browser/commit/cbc0deb70f0ebceed041bb5a2133f1c3d52f9f10), through telemetry/tool changes. The [comparison from e98a770](https://github.com/lightpanda-io/browser/compare/e98a770e0ef37083b64e40d6047ab5fa5893cbff...cbc0deb70f0ebceed041bb5a2133f1c3d52f9f10) did not change the browser-semantic gaps inspected for this report. The custom build is still a local derivative of e98a770, not an official release.

### Why “latest release” was ambiguous

At the source check, GitHub's latest-release endpoint returned the rolling [nightly release](https://github.com/lightpanda-io/browser/releases/tag/nightly). Its original publication date and old Git tag do not identify replaced assets. The macOS ARM asset was updated at 02:48:58 UTC on 8 October; the latest successful scheduled [release workflow](https://github.com/lightpanda-io/browser/actions/runs/37718466386) used [c3dfbaab3bc112c1780d798a4306905f7a166dcb](https://github.com/lightpanda-io/browser/commit/c3dfbaab3bc112c1780d798a4306905f7a166dcb) and completed at 02:57:26 UTC. That predates e98a770's 03:28 UTC root-navigation fix.

Stable tag, rolling nightly asset, main checkout, cached executable, and custom executable are different identities. Fetching main does not update an already running process. The investigation therefore recorded source/build identity rather than assuming a cache label or CDP UA proved freshness. No additional nightly binary was downloaded or executed for the final source-only review.

## 2. Stock resource benchmark against Chrome

### Method

There were five repetitions per engine at concurrency one and three, alternating engine order and starting fresh browser processes/sessions. The local workload fetched 1,000 generated message-shaped records, inserted 1,000 DOM nodes, and checked the count, numeric sum, and final text. Each run then repeated the successful load twenty times and waited one second idle. All twenty resource runs returned the expected extraction result.

Process-tree RSS and CPU time were sampled at approximately 50 ms intervals. Measurements included browser descendants and excluded the Node controller/sampler. Sum-of-process RSS can count shared pages more than once; it is not a direct measurement of unique physical memory. CPU time is estimated process time, not CPU utilization, and sampling can miss short-lived processes. This was an active desktop, not an isolated performance lab.

### Median results

| Concurrent sessions | Engine | Launch to first extraction | Twenty repeated loads | Peak browser-tree RSS | Estimated browser CPU time |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | Chrome | 1,252 ms | 787 ms | 985.1 MiB | 3.35 s |
| 1 | Stock Lightpanda 1.0.0 | 125 ms | 183 ms | 43.7 MiB | 0.40 s |
| 3 | Chrome | 2,058 ms | 1,341 ms | 2,666.0 MiB | 9.01 s |
| 3 | Stock Lightpanda 1.0.0 | 178 ms | 240 ms | 122.6 MiB | 1.08 s |

For one session, this is approximately **95.6% lower peak summed RSS**, **10.0× faster launch-to-first-result**, **4.3× faster repeated loads**, and **8.4× less sampled CPU time**. For three sessions, the corresponding ratios were approximately 21.7× lower peak RSS, 11.6× faster first result, 5.6× faster repeated loads, and 8.3× less CPU time. One-session warm-work CPU time was 0.29 s versus 1.27 s, and idle RSS was 35.5 MiB versus 846.4 MiB.

These figures describe a successful generated extraction workload. They do not measure authenticated WhatsApp sync, message delivery, long-lived reliability, or the custom Debug native build. The resource benefit of that custom build remains unmeasured.

### Original unauthenticated WhatsApp comparison

| Engine/configuration | Result | Time to observed result | Peak browser-tree RSS |
| --- | --- | ---: | ---: |
| Chrome | Reached QR screen | 8.59 s | 1,100.7 MiB |
| Stock Lightpanda 1.0.0 | Unsupported-browser page | 0.38 s | 27.9 MiB |
| Stock Lightpanda with resource loading | Unsupported-browser page | 2.29 s | 41.4 MiB |

The smaller Lightpanda figures here are not a valid equivalent-work performance comparison: it did not load the same application state. They are failure-path measurements, not evidence that WhatsApp itself used less memory.

## 3. Focused stock compatibility probes

Chrome passed 25/25 selected probes. Stock Lightpanda passed 17/25 with default resource loading and 19/25 with workers, iframes, and stylesheets enabled. This is a small purpose-built matrix, not a general browser-conformance percentage or a WhatsApp feature-parity score.

| Probe | Chrome | Lightpanda default | Lightpanda resources enabled |
| --- | --- | --- | --- |
| CDP version, new page, navigation, DOM, fetch | Pass | Pass | Pass |
| New-document initialization before page script | Pass | Pass | Pass |
| Exposed host function | Pass | Pass | Pass |
| CDP user-agent override used by OpenWA | Pass | Fail | Fail |
| localStorage across navigation | Pass | Pass | Pass |
| IndexedDB basic write/read | Pass | Pass | Pass |
| IndexedDB across navigation in the same browser session | Pass | Pass | Pass |
| WebCrypto SHA-256 and AES-GCM | Pass | Pass | Pass |
| WebSocket echo | Pass | Pass | Pass |
| Dedicated Worker message round trip | Pass | Timeout | Pass |
| Relative ES-module import from evaluation | Pass | Fail | Fail |
| Absolute-URL ES-module import | Pass | Pass | Pass |
| MutationObserver | Pass | Pass | Pass |
| Shadow DOM selection | Pass | Pass | Pass |
| CDP cookie export/import | Pass | Pass | Pass |
| CORS denied without permission | Pass | Pass | Pass |
| CORS allowed with permission | Pass | Pass | Pass |
| Request interception/abort | Pass | Pass | Pass |
| Puppeteer input typing and click | Pass | Pass | Pass |
| Contenteditable keyboard entry | Pass | Fail | Fail |
| Canvas 2D pixel round trip | Pass | Fail | Fail |
| Screenshot returns PNG bytes | Pass | Pass* | Pass* |
| Service Worker activation | Pass | Fail | Fail |
| Iframe load and DOM | Pass | Timeout | Pass |
| Multiple isolated browser contexts in one browser connection | Pass | Rejected | Rejected |

*Lightpanda returned PNG bytes, but the inspected output was a text representation rather than Chrome's rendered graphical page. A successful screenshot API call does not provide a usable Live Portal visual feed. The current integration has no such feed with Lightpanda.

Basic IndexedDB and WebCrypto probes did not cover the later CryptoKey persistence, transfer, asynchronous request-wrapper ownership, worker takeover, or full client lifecycle requirements. Their success must not be extrapolated to those semantics.

## 4. Reaching a real QR through the driver and library

### Browser identity was a real contributor, but not the whole problem

The initial user-agent hypothesis was partly correct. The stock configuration rejected Mozilla-containing UA strings, and native client-hint headers could override the Chromium identity requested through the integration. A JavaScript navigator.userAgent override alone did not correct HTTP/client-hint behavior, and a successful CDP call did not prove the effective identity changed. The relevant upstream restriction is [PR #3200](https://github.com/lightpanda-io/browser/pull/3200); the baseline [validator](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/Config.zig#L1655-L1662) still enforces it.

An early experiment modified a copy of the official binary's UA/header literals and applied an ad hoc macOS signature. The downloaded stock input remained distinct from that modified copy. The later native patch implements configured UA and client-hint overrides in source, so the experimental result is no longer dependent on treating a byte-edited executable as stock.

### Missing runtime semantics surfaced after the browser gate

After the unsupported-browser gate, the client needed CacheStorage, worker communication, cryptographic storage, and browser compression. Earlier work temporarily enabled experimental Service Workers to expose CacheStorage and installed a page-local worker/opaque-key bridge. Those measures reached further, but did not establish durable recovery.

The opaque-key approach kept non-extractable CryptoKeys in the owning browser realm and passed references, not exported key bytes, through the bridge. Its reference map was document-local. After navigation, restored IndexedDB entries referred to a previous document and failed with the sanitized diagnostic “CryptoKey reference belongs to another page.” This was a concrete limitation of our bridge. It was removed from the current driver in favor of native key cloning and native transfers.

CompressionStream was absent in stock 1.0.0 during the first authenticated-sync attempt. Browser-side compression/decompression based on fflate was installed. The earlier TransformStream implementation did not await an asynchronous flush as expected, so the browser prelude used a synchronous flush. This did not move crypto or compression to Node. Upstream's later native Compression Streams merge is listed separately below; the current prepared page still installs its compression prelude.

WebCrypto also rejected signed byte views and some BufferSource shapes synchronously. Early normalization preserved bytes, offsets, and lengths while converting views; the native patch now accepts signed typed arrays and DataView. This is distinct from the ability to clone a CryptoKey.

### QR renewal and OpenWA startup fixes

The QR DOM observer missed some rotations, leaving an older QR in Easy API. A short one-second CDP polling path renews the existing QR event when the native value changes and stops on authentication, close, or page replacement. Expired QR renewal uses the native link-device reset action; the assumed refresh method was absent in the observed build. No QR value or hash is published here.

Several blockers were our integration bugs rather than evidence against Lightpanda's engine: an experimental configuration value was discarded, a core compact-auth guard rejected the driver, a runtime value was exposed through a type-only export, the pre-auth inbox initialized before native stores existed, and source/stale compiled artifact or Bun configuration loading paths did not match the intended run. These were corrected to run the actual library and Easy API path.

Long page-evaluation waits were replaced with short evaluations so an unlimited QR wait did not become a Puppeteer protocol-call timeout. A local strip-ansi/ansi-styles resolution repair was a Bun/package issue, not a native browser diagnosis.

### What was actually reached

Driver QR experiments reached a real QR in individual runs of 13.629 s / 281.7 MiB and 24.706 s / 237.5 MiB browser RSS. These were not repeated matched Chrome comparisons; they excluded the Bun controller and sampled browser RSS at 100 ms after page creation.

The complete library create path and Easy API Lightpanda selection subsequently reached a real QR and entered authenticated synchronization. A phone-linked entry, displayed QR, and native CONNECTED socket were repeatedly observed before library readiness; none was treated as proof of completed sync.

The private compact-session adapter initially had an exact build allowlist at 2.3000.1048775404. That was corrected to a minimum dotted-version floor with no upper ceiling, following the requirement to keep working on future WhatsApp builds unless behavior actually breaks. Checkpoint version metadata remains provenance. Semantic capability checks and observed breakage determine support, rather than a daily build string being different. A newer 2.3000.1049604663 build reached QR during the investigation.

## 5. OpenWA adapter and persistence failures

### Readiness incorrectly required historical unread bodies

The adapter treated historical unread-count hints as proof that corresponding message bodies must already have been captured. All captured references could be decrypted while older history outside the initial capture window still produced PORTABLE_STARTUP_UNREAD_INCOMPLETE. That prevented library readiness even when a usable current session existed.

The correction separates missing captured bodies from historical unread hints and uses native chat-range information. History can reduce the remaining gaps as it arrives. The library no longer equates a historical unread count with a missing body in the captured snapshot.

### Restored readiness incorrectly required an offline-delivery cycle

Saved-session runs reported the native session loaded and connected while the offline-delivery-end flag remained false. Requiring a new offline-delivery cycle blocked a session that was already loaded. Readiness now uses loaded-session truth together with the runtime requirements, rather than insisting that every restored document replay the same delivery phase.

### Checkpoint/receipt ordering created a circular wait

A checkpoint scheduled inside an accepted native write tried to clear the offline snapshot while receipt processing waited on that same queue. Flushing Signal state could also attempt to drain the queue containing the current callback. This produced a circular wait in our integration.

The correction captures accepted references without committing a checkpoint from inside that native write queue, and saves at the receipt boundary after relevant Signal writes. The flush path avoids waiting on its own currently executing queue.

### The permanent write-failure stop was our policy

The rejected-native-message-write hook converted a native rejection into a permanent adapter stop. The user asked for recoverable sessions rather than that terminal policy. The stop was removed: in-flight tracking is released, the original native failure remains visible, and future progress is not permanently prohibited by that hook.

A run without this stop reached library READY, returned non-empty chats/contacts through read-only APIs, and saved checkpoints. The original particular rejected write was not reproduced in that run, so automatic recovery from that exact error remains unproven. Removing the stop did not resolve page-local key lifetimes or every startup/reload problem.

### Durable commit acknowledgement and invalidation needed separate treatment

A host write can durably replace an encrypted payload and then fail before its acknowledgement reaches the caller. The host now reads back and compares the exact ciphertext: the newly written payload can acknowledge the commit, the previous payload leaves the save retryable, and a foreign replacement is treated as an ownership/revision conflict. This is opaque persistence reconciliation; plaintext account material is not needed.

The browser-side checkpoint path keeps failed saves dirty and paused for retry instead of turning every persistence error into a permanent session death. Confirmed revocation and explicit logout retain their separate invalidation behavior.

The client can navigate with a post_logout marker because local initialization/storage failed. That URL alone did not prove that the phone had revoked the device. Only a confirmed eligible native logout reason now invalidates the saved session through that path. Intact encrypted backups and failed-run data were preserved; a damaged short non-capsule artifact encountered during recovery was not treated as a valid checkpoint.

### Native IDs and store lifetime exposed our assumptions

Our serialized-ID alias collided with a native Wid logging method named $1. The private source now skips that alias when $1 is a function. This was our alias assumption, not an upstream identity-format defect.

After document replacement, native collections must be rebound before the event bridge is activated. The transport now waits for collection restoration, and a surviving injected runtime must reactivate its bridge and portable owner after host generation health resets. An optional OfflineMessageHandler lookup no longer treats its absence as a fatal module-mapping error. These changes address OpenWA runtime lifecycle, not native Web API conformance.

## 6. Native changes preserved in the OpenWA fork

The main-based patch changes 22 native/build files. It is an experimental derivative under the upstream AGPL-3.0-or-later license, not a claim of upstream acceptance or complete standards conformance.

| Native change | Why the actual client needed it | Evidence boundary |
| --- | --- | --- |
| CryptoKey structured cloning | Browser-owned keys must survive IndexedDB serialization and cross-realm messages with algorithm, usages, and extractability intact. | Replaces the document-local opaque-key approach; it does not export non-extractable key material. Complete CryptoKey conformance was not established. |
| MessagePort transfer | Worker/window handoff needs ownership transfer, native entanglement, sender detachment, and MessageEvent.ports. | Simple message cloning and a MessagePort constructor are insufficient. The patch implements the transfer path; all transfer edge cases remain unverified. |
| ArrayBuffer transfer | Transfer lists must move backing data and detach the sender. | Ordinary built-in cloning does not establish transfer semantics. |
| Named workers | Worker names identify separate takeover locks in the observed client. | Generic Worker support did not propagate this option. |
| Origin-scoped Web Locks | Windows and workers need shared/exclusive ownership, takeover and abort handling, callback-lifetime holding, and context-close release. | Custom implementation; related upstream Web Locks PR remained unmerged when read. |
| BufferSource support | Signed typed arrays and DataView must preserve bytes and offsets in native cryptographic operations. | Separate from CryptoKey cloning. |
| Pending IndexedDB wrapper retention | Dexie attaches batch-position metadata to JavaScript request wrappers that must remain reachable until completion. | Batch-read failures disappeared in the observed startup after retention. The exact GC event was inferred rather than directly recorded. |
| DOMStringList iterator ownership | Iterators can outlive the list wrapper and its arena-backed store/index-name slices. | The earlier crash matched this ownership path; native.8 retained the backing list. No further such crash was seen in the observed startup, but full lifetime coverage was not established. |
| Configured UA and client hints | Effective request identity must reflect configured values rather than only a navigator override. | Necessary for the unsupported-browser gate in this investigation, insufficient for session reliability. |
| CacheStorage exposed separately from Service Workers | The client needed caching without enabling an incomplete Service Worker lifecycle. | Custom selection; not an official supported configuration or durable CacheStorage parity claim. |
| Dedicated executable build target | Produce the selected research executable without invoking upstream verification targets. | Build support is preserved; the custom Debug executable was not resource-benchmarked. |

The current driver requires native key cloning, MessagePort transfer, and Web Locks before attempting WhatsApp. It no longer installs the document-local key/worker bridge. Dedicated worker, iframe, and stylesheet loading is enabled. The incomplete experimental Service Worker implementation stays disabled, with native CacheStorage exposed by the custom patch.

The stock managed download has not been replaced by this fork. The custom executable must be selected through lightpanda.executablePath or LIGHTPANDA_EXECUTABLE_PATH. A driver package, an experimental CLI flag, and a prepared native executable are separate parts of the setup.

## 7. Authenticated startup, reload milestones, and later regressions

| Phase | Established | Not established / later failure |
| --- | --- | --- |
| Stock 1.0.0 comparison | Successful synthetic workload; unsupported-browser result on WhatsApp. | Stock authenticated WhatsApp support. |
| Identity and early browser bridges | Real QR through driver and library. | Durable key restoration; opaque-key references failed across documents. |
| Corrected adapter with earlier native storage fixes | Library READY, non-empty real read-only API data, dashboard chat rendering, and checkpoint saves. | Reliable reload; a later page reload failed recovery. |
| Guard-free run | Library READY and successful read-only APIs/checkpoints. | Recovery from the original rejected native write, which was not reproduced. |
| Clean fresh pairing on native.6 | Native connection and stream progressed after scan. | Initial checkpoint failed, followed by a native string-list iterator crash. |
| Fresh pairing on native.8 and host/runtime corrections | Authenticated startup and checkpointing; a recorded saved-session reload restored the session and committed a subsequent checkpoint. | Full sync completion, reliable repeated lifecycle recovery, Chrome parity, and outbound delivery. |
| Later dashboard investigation | Read-only APIs returned non-empty data and an actual dashboard chat list was again visible after corrections. | A detached main frame had previously produced API failures while health remained READY; root cause of that detachment remains unresolved. User-reported send failures were not resolved to a proven cause. |

The clean-start run record at 05:16 UTC on 8 October explicitly recorded saved-session restoration after reload, a committed checkpoint after that reload, and connected health. It followed fixes to Effect.catch-based host reconciliation, the optional native module lookup, surviving-runtime activation, and native collection rebinding. That is a successful reload milestone, so “every reload failed” would be inaccurate. Later regressions also mean it is not evidence of generally reliable self-healing.

Earlier recovery logs included sanitized categories such as startHandlingRequests before startComms, storage destruction before initialization, and NotInitializedError. UNINITIALIZED HANDSHAKE also appeared, but source inspection showed a placeholder rejection that was immediately caught in the observed WhatsApp source; that text alone is not proof of failed authentication.

The later detached-frame failure reached the API as an “Attempted to use detached Frame” error while health still reported ready. The transport's active-generation check now requires a connected browser and an attached main frame, and the Lightpanda page wrapper does not return a detached root frame. Adding that check exposed a separate wrapper bug: current Puppeteer uses its connected property, whereas our Lightpanda wrapper still called an absent optional isConnected method. That wrapper now reads connected. The originating native/CDP frame-detachment cause remains open.

One restart timed out waiting for the client loader while resources were still loading/failing. Later instrumentation reported OperationTimedout, CorsBlocked, and net::ERR_ABORTED on some requests even when the app successfully loaded. A count of failed requests does not prove that essential bootstrap scripts failed, and the record does not establish one universal cause for loader timeouts. One failed navigation observed around five minutes after startup is not proof of a deterministic five-minute failure cycle.

No outgoing message was sent by the agent during diagnosis. The user reported failed attempts, but a definitive send error and successful receiver-side delivery were not established before the investigation was stopped. Readable contacts/chats are not a substitute for delivery evidence.

## 8. Dashboard and browser-console diagnostics work

The requested diagnostics tab was implemented because raw browser/internal logs were difficult to follow and could be available before WhatsApp reached READY. Core browser console and pageerror events now feed a bounded browser-console store, exposed as history plus sanitized live updates on the existing event stream.

The store retains up to 300 grouped records, limits individual text, normalizes severity, counts repetitions, batches delivery at 250 ms, and scrubs common credential forms, account identifiers, known personal-content fields, opaque values, and injected data-URL source. History uses the configured Easy API key policy. Browser errors also reach the existing error diagnostics. This filtering improves a private dashboard view; it is not a guarantee that arbitrary logs are safe to publish. Raw session logs remain excluded from this issue.

The dashboard's Browser Console tab supports severity and text filtering, pause/resume, copy-visible records, clearing the view, following new records, and expanding stack details. It can operate while the session is not ready, which is when startup failures need inspection.

An initial implementation added a second event stream specifically for this tab. During debugging, multiple long-lived HTTP connections were observed, and connection exhaustion was considered a possible reason for stalled data requests. The observed connection count alone did not prove all connections were SSE or that it caused every empty dashboard state.

A concrete client ownership bug was found independently: getClient returned the cached client only while it was connected, so a reconnecting EventSource could be replaced while the old stream continued retrying. The corrected code reuses the client, closes a failed initial connection, closes superseded generations during reset, disposes the connection on development hot replacement, and streams console records over the shared event connection.

The dashboard also inferred readiness from a READY/CONNECTED label even when an explicit ready value was false. It now requires ready=true, and REST health refreshes notify all health subscribers. These frontend and health fixes should not be conflated with WhatsApp synchronization or with the unresolved underlying frame-detachment issue.

## 9. Related upstream issues and merged changes

Source states below were checked on 8 October 2026 at approximately 07:30–07:50 UTC. They are snapshots, not promises that issues will remain open. General API introduction, a narrow ownership fix, and complete application semantics are different scopes.

### The two originally linked issues

| Reference | State when checked | What it actually establishes |
| --- | --- | --- |
| [Lightpanda #1799 — Missing features](https://github.com/lightpanda-io/browser/issues/1799) | Open | A broad earlier missing-feature list. Worker and experimental Service Worker work subsequently merged, so this issue is not a current capability matrix. |
| [OpenWA #3384 — driver-lightpanda options, binary pinning, and WhatsApp blocker](https://github.com/open-wa/wa-automate-nodejs/issues/3384) | Open | Earlier ignored options, a cached older binary, ineffective UA setter, and unsupported-browser behavior. Its earlier single-Service-Worker-blocker conclusion must not be reused as the current diagnosis. |

### Related PRs and release inclusion

All rows marked merged are included in the e98a770 source baseline. Inclusion in numbered stable 1.0.0 was separately checked against the release commit; a shallow local ancestry miss was not treated as proof of exclusion.

| PR | State | In stable 1.0.0 source? | Scope relevant to this investigation |
| --- | --- | --- | --- |
| [#1790 — Add window.structuredClone](https://github.com/lightpanda-io/browser/pull/1790) | Merged 13 March | Yes | Built-in cloning; host objects were initially deferred. |
| [#2078 — Worker](https://github.com/lightpanda-io/browser/pull/2078) | Merged 14 April | Yes | Worker contexts, not every worker option or transfer operation. |
| [#2666 — WPT /WebCryptoAPI/](https://github.com/lightpanda-io/browser/pull/2666) | Merged 8 June | Yes | Cryptographic operations and CryptoKey worker exposure, not CryptoKey structured cloning. |
| [#2771 — Structured-clone posted messages](https://github.com/lightpanda-io/browser/pull/2771) | Merged 18 June | Yes | Receiver-realm cloning, not transfer-list ownership. |
| [#2858 — StructuredClone for host objects](https://github.com/lightpanda-io/browser/pull/2858) | Merged 2 July | Yes | Serialization framework and selected host types, not all host types. |
| [#2841 — IndexedDB base](https://github.com/lightpanda-io/browser/pull/2841) | Merged 11 July | Yes | In-memory, browser-session-scoped SQLite storage, not process-persistent Chrome-equivalent storage. |
| [#3200 — User-Agent/Sec-Ch-Ua restrictions](https://github.com/lightpanda-io/browser/pull/3200) | Merged 15 August | Yes | Explains restricted HTTP identity configuration; not an authentication fix. |
| [#3393 — Retain upgradeneeded event](https://github.com/lightpanda-io/browser/pull/3393) | Merged 2 September | Yes | One event lifetime, not every pending request wrapper. |
| [#3394 — IndexedDB WPT conformance](https://github.com/lightpanda-io/browser/pull/3394) | Merged 3 September | Yes | Selected close/databases/validation/count fixes; not complete IndexedDB conformance. |
| [#3539 — IndexedDB double-free fix](https://github.com/lightpanda-io/browser/pull/3539) | Merged 16 September | Yes | OpenContext running/ownership state, not all native lifetimes. |
| [#3512 — Experimental ServiceWorker](https://github.com/lightpanda-io/browser/pull/3512) | Merged 16 September | Yes | Explicitly incomplete flag-gated implementation. |
| [#3562 — Cache/CacheStore](https://github.com/lightpanda-io/browser/pull/3562) | Merged 18 September | Yes | In-memory caching gated with experimental Service Workers. |
| [#3616 — Web Locks](https://github.com/lightpanda-io/browser/pull/3616) | Open, unmerged | No | Proposed implementation; a prospective merge SHA is not a completed merge. |
| [#3742 — Compression Streams](https://github.com/lightpanda-io/browser/pull/3742) | Merged 7 October | No | Newer native compression support, absent from the numbered stock benchmark build. |
| [#3831 — CDP node/DOMException reporting](https://github.com/lightpanda-io/browser/pull/3831) | Merged 8 October | No | Better host-object classification and error descriptions, not session recovery. |
| [#3843 — Failed root-navigation error document](https://github.com/lightpanda-io/browser/pull/3843) | Merged 8 October | No | Specific root-navigation failure behavior; newer than the inspected nightly workflow head. |

[IndexedDB issue #2732](https://github.com/lightpanda-io/browser/issues/2732) is closed as completed after the API implementation landed. That addresses the original missing indexedDB global, not every serialization/lifetime requirement. [PR #1785](https://github.com/lightpanda-io/browser/pull/1785) is closed without merging and was replaced by #1790; a closed PR must not automatically be described as a shipped fix.

### Exact remaining gaps in the inspected source

1. **CryptoKey clone support.** The [host clone list](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/browser/js/Value.zig#L467-L480) omits CryptoKey, and [CryptoKey metadata](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/browser/webapi/CryptoKey.zig#L233-L247) has no serialization hooks. General WebCrypto and host-clone PRs do not close that gap.
2. **Transfers.** The [serializer](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/browser/js/Value.zig#L383-L395) explicitly lacks transferables. [MessagePort.postMessage](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/browser/webapi/MessagePort.zig#L70-L99), [Worker.postMessage](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/browser/webapi/Worker.zig#L338-L354), and [worker-global posting](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/browser/webapi/DedicatedWorkerGlobalScope.zig#L78-L80) do not accept a transfer list. Cloning ArrayBuffers does not detach/transfer them.
3. **Worker names.** [WorkerOptions](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/browser/webapi/Worker.zig#L67-L88) only defines type, and the [worker-global API](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/browser/webapi/DedicatedWorkerGlobalScope.zig#L239-L253) does not expose a name accessor.
4. **Pending IndexedDB wrappers.** [IDBRequest reference forwarding](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/browser/webapi/storage/idb/IDBRequest.zig#L90-L142) and the [native request queue](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/browser/webapi/storage/idb/IDBTransaction.zig#L504-L513) do not by themselves demonstrate that JavaScript wrappers and their metadata remain pinned while pending. This supports the retention hypothesis without proving the exact GC event in every failed batch.
5. **DOMStringList ownership.** The [list destructor](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/browser/webapi/collections/DOMStringList.zig#L45-L58) releases its arena, while [iterators](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/browser/webapi/collections/DOMStringList.zig#L81-L109) borrow list slices without retaining the owner. The source ownership mismatch supports an iterator-outlives-list failure mechanism. It is separate from general iterator fixes [#3817](https://github.com/lightpanda-io/browser/pull/3817) and [#3198](https://github.com/lightpanda-io/browser/pull/3198).
6. **Service Worker scope.** [Experimental configuration](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/Config.zig#L241-L244) defaults it off, and [API exposure](https://github.com/lightpanda-io/browser/blob/e98a770e0ef37083b64e40d6047ab5fa5893cbff/src/browser/js/Env.zig#L341-L343) is gated. The merged shell and cache implementation do not prove full interception, lifecycle, or durable persistence.

Targeted public issue/PR searches did not locate an exact existing fix for CryptoKey cloning, transfer lists, named workers, pending IndexedDB request-wrapper retention, or this DOMStringList lifetime. That is a bounded search result, not a claim that no discussion exists anywhere.

### Why merged issues did not make this work automatically

The merged changes fix narrower behavior than the actual client needs. A missing global becoming available does not establish durable encrypted storage; a postMessage clone implementation does not establish transfer ownership. Some fixes also landed after stable 1.0.0, and one landed after the inspected nightly was built. Separately, native fixes cannot correct our adapter's unread assumptions, checkpoint queue ordering, runtime rebinding, or dashboard client leaks.

The current problem is a combination of missing browser semantics and OpenWA lifecycle/persistence assumptions. UA changes opened the first gate, but they were not a complete solution. Full Service Worker absence is also not a sufficient single-cause explanation: custom runs reached authenticated library readiness without enabling the incomplete Service Worker implementation.

## 10. Setup retained for continued research

This is the configuration direction actually pursued, rather than a proposal presented as if it had already run:

1. **Use an explicit native executable and revision.** Select the e98a770-based OpenWA build with the native session primitives, record its identity, and keep the stock download separate. The driver rejects missing key/port/lock capabilities before pairing.
2. **Keep native crypto, worker transfer, storage, and ownership inside the browser.** Avoid document-local key indirection for persisted state. Use native CacheStorage with incomplete Service Workers disabled, enable the required resource classes, and keep browser compression available.
3. **Use authoritative source-generated OpenWA patches.** Accept future WhatsApp builds above the supported floor, bind current native stores, and establish loaded-session readiness without historical unread/offline-cycle assumptions or circular checkpoint waits.
4. **Keep encrypted checkpoint persistence retryable and ownership-aware.** A failed acknowledgement is reconciled against stored ciphertext; a genuine foreign revision or confirmed logout remains distinct from a local initialization failure.
5. **Expose current health and readable diagnostics through one owned connection.** Require an attached page, connected driver, and ready=true. Show sanitized browser console history while startup is incomplete, and release stale EventSource clients.

For a local checkout containing this research branch and the prepared custom executable, the Easy API selection is:

    LIGHTPANDA_EXECUTABLE_PATH=/absolute/path/to/custom-lightpanda \
      npx @open-wa/wa-automate --lightpanda

The npx example is the intended package command, not evidence that the currently published stable package includes all research changes. The checkout/custom executable and authoritative patch selection must match. The native README records the source patch and build parameters. Runtime session directories and encrypted backups are intentionally not included in this public recipe.

A complete clean-start configuration was initially proposed before it had been executed. That distinction was corrected: fresh pairing with native.6 and native.8 was then actually attempted, with the outcomes above. The user should not have had to infer whether a proposed setup had run from optimistic wording.

## 11. Outstanding work and acceptance boundaries

These are remaining research requirements, not completed checks or permission to run a new campaign:

- Establish the cause of native/CDP root-frame detachment and show that the library cannot advertise READY while its current page is unusable.
- Establish repeatable document replacement and process restart from an intact encrypted checkpoint, with a successful new checkpoint and usable library APIs after each recovery.
- Capture the exact failure path of an authorized outgoing send and establish receiver-side delivery. Chat/contact reads and native socket state cannot prove this.
- Establish full sync behavior and the relevant WhatsApp API/media/event capabilities separately; the current record does not claim Chrome parity.
- Reproduce the original native write failure under the recoverable policy before claiming that particular failure self-heals.
- Narrow the native lifetime/transfer/lock changes into upstreamable patches and keep ownership/conformance claims bounded to demonstrated behavior.
- Benchmark the actual custom executable and authenticated equivalent workload before making WhatsApp resource or load-time claims.
- Retain a deliberate Live Portal product limitation: Lightpanda currently supplies no rendered feed. A visual Chrome-equivalent portal requires a rendering-capable browser or a separately designed product experience.

The application and saved data were left intact when the user ended diagnosis. No additional application restart, account send, test campaign, build, or release was performed for publication of this report.

## 12. Marketing and release preparation

The existing announcement was revised into a 32-second Remotion film with an OpenWA explanation, a persistent wordmark and openwa.dev, and a held ending showing the npx command with --lightpanda and the linked-device/dashboard next step. MP4, GIF, poster, source, and original sound are retained with the benchmark artifacts.

The resource claims refer to stock 1.0.0 on the controlled generated workload. Authenticated WhatsApp performance was not measured, custom Debug performance is unknown, and the feature remains experimental. Bumpy minor-release intent was prepared, but this research does not establish a published package or a production-ready Lightpanda release.

## Final status of the investigation

There is useful native and integration work here, with a substantial stock synthetic performance benefit and real authenticated startup/read-only/reload milestones. There is also unresolved reliability and outbound behavior. The preserved research branch and fork are the basis for continued investigation; this issue is the full sanitized record of that work, including our integration mistakes and the limits of the evidence.
