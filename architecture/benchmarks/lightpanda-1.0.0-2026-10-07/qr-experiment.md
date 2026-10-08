# WhatsApp QR through the Lightpanda driver

> Historical notes from the earlier investigation. Read [research.md](research.md) for the full 7–8 October record, later successful milestones, and unresolved failures. Status statements below describe the run at that point, not the current session.
The source `LightpandaDriver` reached a real WhatsApp Web QR on 7 October 2026. This is an experimental v1 path with a separate modified binary and ephemeral browser API bridges. Stock 1.0.0 still fails the browser gate. The original benchmark results remain stock-binary measurements.

The clean driver command reached QR in 13.629 seconds with 281.7 MiB peak Lightpanda RSS. Running the documented preparation command and its resulting copy also reached QR in 24.706 seconds with 237.5 MiB peak RSS. These are individual live observations, including driver launch, with RSS sampled every 100 ms after page creation. They exclude Bun/controller memory and are not a repeated Chrome comparison. Per-run progress files remain local diagnostic data.

Current release-preparation status, 8 October 2026: later reloads failed with session takeover and initialization errors, and the diagnostic Easy API has not recovered library READY. Earlier READY milestones below are historical observations. The custom native Debug executable is separate from the unchanged stock download; this experiment does not establish reliable recovery, outbound delivery, long-session durability or Chrome parity.

## Reproduce on this Mac

Run from `[local checkout path omitted]`. The input is the official ARM64 macOS [Lightpanda 1.0.0 release](https://github.com/lightpanda-io/browser/releases/tag/1.0.0), whose SHA256 is `955440053a84754dd64c62f970449a56a2b350cdf43ea5f2e809a73047b8173d`.

```sh
python3 architecture/benchmarks/lightpanda-1.0.0-2026-10-07/prepare-ua-experiment.py \
  /tmp/openwa-lightpanda-v1-benchmark/lightpanda-1.0.0 \
  /tmp/openwa-lightpanda-qr/lightpanda-1.0.0-qr-repro

LIGHTPANDA_EXECUTABLE_PATH=/tmp/openwa-lightpanda-qr/lightpanda-1.0.0-qr-repro \
  bun architecture/benchmarks/lightpanda-1.0.0-2026-10-07/reach-qr.ts
```

Choose a new output filename if the prepared copy already exists; preparation refuses to overwrite files. The preparation command edits a copy, applies an ad-hoc macOS signature, and prints its digest. It does not edit the installed binary, the SDK cache, or the official input.

The prepared copy used for the latest successful command has SHA256 `55b696f3e75192e2e2c2039a94564d35b4fd9b3e719b339731d2aadaeba5c813`. macOS signing identifiers can vary with the output filename, so the preparation command always prints the resulting digest.

The application command enables `lightpanda.experimentalWhatsApp`, sets a Chrome user agent through the driver, navigates the live WhatsApp page, and waits for its QR `data-ref`. It prints `QR_REACHED`, writes redacted observations, and re-encodes WhatsApp's QR payload to a local `lightpanda-qr.png` using `qrcode`. That PNG is a real login payload, not a Lightpanda screenshot. The command closes its fresh session afterward, so the saved image is evidence rather than a QR to scan later.

## What blocked stock v1

1. **User agent and client hints:** native UA validation rejects strings containing `mozilla`, while CDP reports success; fixed `Sec-Ch-Ua` headers also override supplied Chrome hints. Changing only `navigator.userAgent` leaves the unsupported-browser HTML response unchanged. The diagnostic binary replaces the reserved-token literal and renames those fixed hint headers so the driver's normal HTTP overrides can take effect.
2. **Cache Storage:** WhatsApp uses `caches` during storage initialization. The driver enables `--experimental-features serviceworker` for this experiment, which exposes Cache Storage and service workers. With this flag absent, the initial failure is `ReferenceError: caches is not defined`; the later database warning is recovery behavior.
3. **Transferred ports:** WhatsApp sends a `MessageChannel` port to its FTS worker. Lightpanda's native `Worker.postMessage` cannot clone that port, so the experiment routes port messages over cloneable worker messages and prefixes worker scripts with the bridge.
4. **Stored crypto keys:** WhatsApp saves a non-extractable `CryptoKey` in `wawc_db_enc` and reads it from the worker. Native IndexedDB serialization rejects the key. The bridge stores opaque key references and performs worker WebCrypto requests in the main Lightpanda page realm, retaining the original key's extractability and usages. It does not export key material or route cryptography through Chrome or Node.

The corresponding v1 source is pinned at `588f6223b9cae8a2406aeef035ed9363a3e404fd`: [UA validation](https://github.com/lightpanda-io/browser/blob/588f6223b9cae8a2406aeef035ed9363a3e404fd/src/Config.zig), [HTTP headers](https://github.com/lightpanda-io/browser/blob/588f6223b9cae8a2406aeef035ed9363a3e404fd/src/network/HttpClient.zig), and [structured cloning](https://github.com/lightpanda-io/browser/blob/588f6223b9cae8a2406aeef035ed9363a3e404fd/src/browser/js/Value.zig). These findings extend [OpenWA #3384](https://github.com/open-wa/wa-automate-nodejs/issues/3384); [Lightpanda #1799](https://github.com/lightpanda-io/browser/issues/1799) discusses earlier browser limitations.

## Full library run

The public source `create()` path also reached a real QR with the Lightpanda driver, configuration resolution, compact-session bootstrap, live patch preload, WAPI/helper injection, and normal library QR event handling. The runner uses a fresh private temporary session directory and stays open for scanning:

```sh
LIGHTPANDA_EXECUTABLE_PATH=/tmp/openwa-lightpanda-qr/lightpanda-1.0.0-qr-repro \
  bun architecture/benchmarks/lightpanda-1.0.0-2026-10-07/run-library.ts
```

It prints the session output directory, updates `live-qr.png` through the public CLI output sink, and records `status.json` without the raw QR payload. `LIBRARY_READY` is emitted only after authentication and the library's readiness gates complete. The current run is awaiting a phone scan; QR is not evidence of authenticated persistence or messaging.

This run exposed and corrected integration blockers: the configuration schema discarded the experimental flag, core rejected the driver before launch, the public barrel exported a type as a runtime value, and pre-authentication injection activated the compact inbox before the authenticated store existed. The local dependency tree also needed the existing compatible `strip-ansi` and `ansi-styles` copies linked under `wrap-ansi`; no manifest or lockfile rewrite was made for that repair.

The private session adapter had an exact WhatsApp build allowlist and an exact-build match for restoring checkpoints. It now uses a minimum of `2.3000.1048775404`, accepts all newer dotted numeric versions with no upper bound, and treats checkpoint build metadata as provenance. Required native APIs and semantic session validation detect actual breakage. The corrected path reached QR on `2.3000.1049604663`; the obfuscated public artifact was regenerated from its private sources.

Lightpanda function waits now use short native page evaluations, so an unlimited scan wait does not expire at Puppeteer's protocol timeout. The library connects its QR event sink to the existing Smart QR observer so changing QR payloads are emitted while waiting.

## Easy API with automatic setup

The source CLI frontend now reaches the same real QR using only `--lightpanda` and ordinary API/session settings:

```sh
bun packages/cli/src/bin.ts --lightpanda \
  --config /tmp/openwa-lightpanda-easy-api/config.json
```

The config contains the session ID, private session directory, loopback host, port 8046, and unlimited QR/authentication waits. It contains no Lightpanda executable or experimental bridge settings, and no `LIGHTPANDA_EXECUTABLE_PATH` environment variable is supplied. Startup downloaded the checksummed official macOS ARM64 1.0.0 release, prepared a separate signed UA-capable cache copy, enabled service workers and the worker/crypto bridges, loaded live patches, and emitted a real QR. `/health` and `/qr` expose it; the normal dashboard displayed the scan screen at `http://127.0.0.1:8046/dashboard/?demo=false`. Sanitized observations are saved in `easy-api-progress.json`.

The CLI frontend needed a Bun source export so a source run used the current runtime instead of an old compiled artifact. Running the dashboard under Bun also exposed config-loader and incomplete local dependency issues; the config loader now uses Bun's native TypeScript support, and the declared runtime/workspace dependencies were linked locally. The running Easy API is waiting for a phone scan. These source changes have not been published to npm.

### Pairing failure and stale QR correction

A phone scan of the first Easy API QR returned “Couldn't link device, try again later.” Live inspection found that WhatsApp had replaced its QR payload while `/health` and `/qr` still held the initial one: the native QR had rotated while the API still held an earlier QR, with only one emitted QR event. Lightpanda's Smart QR DOM observer had missed the updates. The transport now reads the current QR surface through short CDP evaluations once per second in Lightpanda mode, emits changed payloads through the existing QR event path, and cancels that polling on authentication, close, or replacement of a watcher. The requested Easy API run then emitted eight successive QR payloads, and a native/API comparison matched after a rotation. This corrects stale QR delivery; successful phone pairing is still required before claiming login works.

The visible `UNINITIALIZED HANDSHAKE` warning was initially suspected to identify the pairing failure. Reading the actual delivered WhatsApp bundle showed it is a rejected-promise placeholder immediately followed by a catch handler in `WANoiseHandshake` and `WANoiseSocket`. Native WebSocket instrumentation showed an open socket exchanging binary frames and cryptographic calls completing. That warning and the pre-authentication `DISCONNECTED` model label do not, by themselves, establish that the Noise handshake failed. Diagnostics retained only payload hashes, socket metadata and errors, without WebSocket frame contents, credentials, or key material.

### Native WebSocket deadline correction

Phone scans continued failing after QR delivery was corrected. Capturing native stderr exposed repeated `OperationTimedout` closures of the active WhatsApp WebSocket, approximately 15 seconds after connection, followed by a new socket and QR. Lightpanda v1's `Connection.reset` applies `config.httpTimeout()` to curl transfers, with a 15,000 ms default; its WebSocket setup retains that deadline. The experimental WhatsApp launch now supplies `--http-timeout 0`, retaining the separate connection timeout and application navigation limits. The requested Easy API run then kept its active WhatsApp socket open beyond the previous cutoff with no native timeout closures observed. This establishes correction of the socket deadline; successful phone pairing still needs a fresh scan.

The driver also forwards native stderr to its application logger, so browser errors remain visible after startup. Temporary passive pairing instrumentation remains in a private local launcher while awaiting the scan. Native stderr and sanitized page/socket observations are retained under `/tmp/openwa-lightpanda-easy-api/diagnostics/`; raw QR values, frame contents and key material are not included in these diagnostic observations.

### Registration reached; synchronization failed

The subsequent phone scan reached device registration, prekey generation/upload and encrypted data synchronization. It did not produce a ready library client: the page reported `CompressionStream is not defined`, a synchronous WebCrypto `invalid argument` error, sync decryption failures and a fatal sync logout. The later CLI QR timeout label did not identify the underlying synchronization failure. Authentication wait errors are now logged with their actual cause, and private diagnostic counters capture synchronous cryptographic exceptions as well as rejected promises.

The experimental driver now installs compression/decompression stream APIs backed by the installed fflate browser codec. The codec runs synchronously in Lightpanda, including stream flush, because v1's native TransformStream does not await an asynchronous flush callback. Session contents and key material stay inside the browser; no host compression callback is exposed. A new requested Easy API run reached QR with these APIs installed, no host compression binding, and no non-placeholder page exceptions before scanning. A new phone scan is required to establish whether synchronization completes and to identify any remaining cryptographic failure. The earlier scan and its native logs remain preserved privately.


### Signed byte views rejected during synchronization

A subsequent scan registered the device and started sync with compression installed. Private argument-type counters identified the remaining native WebCrypto failure: HMAC signing received a native HMAC CryptoKey and an Int8Array, which Lightpanda rejected synchronously with `TypeError: invalid argument`. Reinterpreting the same byte range as Uint8Array in the running page allowed additional HMAC operations to finish, then exposed the same rejection for AES-CBC decryption. Sync reached a fatal logout before that second call could be repaired. No CompressionStream error recurred in this scan.

The experimental bridge now normalizes the data BufferSource views for encrypt, decrypt, sign and verify to Uint8Array before calling Lightpanda's native cryptography. The backing bytes, byte offsets, lengths, keys and algorithms are preserved. This does not export keys or perform cryptography on the host. The requested Easy API has been restarted with the normalization installed before authentication; another phone scan is needed to establish completion. Device registration and synchronization activity alone have still not established library readiness.

### Live Portal rendering limitation

Live Portal requires rendered screencast frames, which the Lightpanda driver declares unsupported. The dashboard previously called the view streaming as soon as its WebSocket opened, leaving a blank canvas and 0 FPS. It now waits for a real frame before showing streaming status, exposes errors, and explains the rendering requirement while waiting. The API source advertises the portal capability and skips binding a Lightpanda page on future launches. The existing pairing process was not restarted for this UI change. Opening the requested portal in the running dashboard displayed the rendered-frame waiting notice and Lightpanda limitation without a false FPS indicator; the temporary view was then closed.

### Expired QR cycle and dashboard data readiness

The dashboard data report was traced to the active browser remaining unregistered while the library stayed AUTHENTICATING. Chat/contact requests are correctly withheld until the library readiness gates complete. The native QR cycle could expire while the dashboard retained its last payload; the current WhatsApp Cmd object no longer exposes the refreshQR method referenced by the observer helper. Calling the current WAWebLinkDeviceAction.resetLinkDeviceState with QR_CODE restored a fresh native QR that matched the API payload in the existing process, preserving the byte-view normalization installed before authentication.

Lightpanda QR polling now renews UNPAIRED_IDLE through that current native action, emits QR expiry, and stops using the observer helper for this driver. The API and dashboard clear expired QR payloads through the existing expiry event. A scoped renewal timer was installed in the running page so the current phone scan can proceed without restarting it. Successful registration, completed sync, authenticated library readiness, and dashboard data parity remain unestablished for this corrected run.

## Scope

The normal driver now launches the configured executable directly instead of passing ignored options to the SDK, loads workers/iframes/stylesheets, honors the telemetry option, and reports an ignored UA override as an error. Experimental service workers and the worker/crypto bridges require `experimentalWhatsApp: true`.

Key references last only for the current page. Page reload, session restoration, login, messaging, and long-running memory behavior have not been established. Core permits the Lightpanda compact-auth path only with the explicit experimental flag. Both direct-driver QR and full-library QR have been reached; the full library has not yet returned an authenticated client. No test suites, typechecks, lint checks, or build checks were run for this continuation.

### 8 October 2026: authenticated scan reached native data; unread history hints blocked SDK startup

The current corrected Lightpanda run accepted the phone scan and reached native `CONNECTED` with the WhatsApp chat shell. The live store exposed 362 chats and 2,217 contacts; every observed cryptographic operation completed without a failure. This establishes native authentication and available session data, not library READY or dashboard parity.

SDK bridge activation failed with `PORTABLE_STARTUP_UNREAD_INCOMPLETE`: all 23 captured unread message references were present and decrypted, but 14 phone unread-count hints across six chats referred to history outside the initial downloaded window. The checkpoint recorded initial history sync complete and retained the actual unread references. The native document subsequently lost its chat shell; the SDK remains DISCONNECTED. Encrypted checkpoint files and failure logs were preserved.

The private inbox now separates captured-message body failures from historical unread-count hints, uses native chat-range helpers, and allows gap counts to shrink as history arrives. Historical hints remain observable rather than being silently discarded. The private pre-init artifact was regenerated from source. This change has not been loaded by the running process: applying it requires a restart using the preserved checkpoint, and the pairing monitor explicitly prohibits restarting. No messages, tests, typechecks, lint checks or build checks were run.

### 8 October 2026: saved session restored, SDK READY and dashboard chat/contact data observed

the user approved restarting with the preserved encrypted session. The process resumed native authentication without a QR scan. Two additional adapter defects became visible: restored WhatsApp reported `WAPI.isSessionLoaded() === true` with native CONNECTED and a populated chat shell while `Cmd.isOfflineDeliveryEnd` stayed false, and checkpointing inside an accepted native message write called `clearOfflineSnapShot`, which waits for the same native queue and receipt batches. Source inspection of the actual WhatsApp assets confirmed that circular wait.

Private fixes now use the SDK's loaded-session truth and authenticated native socket, capture accepted message references without checkpointing inside their native queue, and save at the receipt boundary after native Signal snapshots have committed. Checkpointing flushes Signal writes directly instead of draining message or receipt queues. Phase and in-flight capture counts are available in portable status. Generated artifacts were produced from private source; immutable wapi.js was not edited.

At that observation, the Easy API reported top-level connected=true, session.state=READY, session.ready=true, no pending requirements, no blockers and no QR. The requested live getAllChats and getAllContacts calls both returned HTTP 200/success, with 362 chats and 2,029 contacts. The existing in-app dashboard Chat page renders 362 chat buttons and no loading, connection, empty-state or chat-load error. Only counts and fixed status indicators were inspected; no account identifiers, personal contents or message bodies were printed.

This establishes saved-session restoration, authenticated library readiness, and the dashboard chat/contact read paths. It does not establish every dashboard feature, outbound delivery, long-running durability, full Chrome parity, or authenticated performance comparisons. Live Portal remains unavailable because Lightpanda does not render frames. No messages, tests, typechecks, lint checks or build checks were run.

### 8 October 2026: removed permanent native-write failure stop; reload defect isolated

the user requested trying the session without the adapter permanently stopping after a native message-write error. The private write hook now releases its in-flight tracking on success or rejection and returns the original failure to WhatsApp without setting the adapter terminal flag. Saved encrypted session data was backed up and retained. The actual Easy API restarted at 00:37:45 UTC, restored without a QR scan, reached library READY at 00:38:02 UTC and served 362 chats and 2,017 contacts. Encrypted checkpoints continued saving. Neither the original native write error nor `PORTABLE_SESSION_STOPPED` was observed in this run, so recovery from that specific error remains unproven.

At 00:43:02 UTC, approximately five minutes after READY, the page reloaded and disconnected. Read-only native IndexedDB diagnostics isolated the cause: enumeration of the encryption-key table succeeded with one row, but reading that row threw `CryptoKey reference belongs to another page`. This error is from our experimental driver bridge, which stored a reference to a CryptoKey held in a page-local map. Native IndexedDB survives navigation; that map does not. Key initialization then never resolves, and WhatsApp never launches its socket. Removing the message-write stop cannot resolve this earlier initialization failure.

A native CryptoKey structured-clone implementation is being prepared against Lightpanda's 1.0.0 source tag, with algorithm metadata, usages and non-extractability preserved. It keeps keys inside the browser and allows the driver to use actual keys in IndexedDB and worker messages. Runtime recovery also needs to reactivate the compact-session owner after a replacement document loads. Installation and actual reload recovery are not yet established. No tests, typechecks, lint checks or verification builds were run; compilation is solely to produce the browser executable required by this application fix.


### Native storage fixes in the guard-free run

The custom native executable now supports structured cloning of non-extractable CryptoKeys. An actual IndexedDB encryption-key row contains a native non-extractable CryptoKey instead of an opaque reference into the previous page. The driver feature-detects native cloning and stops installing its ephemeral key bridge in that case. Runtime document recovery now also reactivates the private compact-session owner after loading the runtime bridge.

The first native-key run authenticated its socket but stalled on a Dexie collection modification: a batch read produced undefined values, while direct read-only lookups of the existing keys succeeded. Lightpanda held request wrappers weakly while queued operations retained only native pointers. A second native patch retains the original JavaScript request through its completion event, preserving Dexie's request position metadata. This lifetime defect was inferred from source and the difference between the observed batch and direct reads; garbage collection of a specific failing request was not directly recorded.

The actual Easy API resumed the preserved encrypted session at 01:58 UTC using `1.0.0+openwa.cryptokey.idb.2` (Debug). It reached authenticated library READY with no pending readiness requirements, no blockers and no QR. Its read-only getAllChats/getAllContacts APIs returned HTTP 200/success with 362 chats and 2,017 contacts. The batch-read exception did not recur and the private adapter saved a new checkpoint. WhatsApp background errors remain, including a Wid.toLogString `$1` function error, item-not-found and an unsupported operation; these did not prevent current readiness. A later document reload and recovery from the original failed write remain unconfirmed at this observation. No outbound messages, tests, typechecks, lint checks or verification builds were run. The native executable was compiled to run the application. This custom Debug run does not extend the controlled stock-browser performance benchmark or establish full Chrome parity.


### Reload outcome: the session still does not self-heal

At 02:04:04 UTC the first native request-retention run navigated again. The replacement document successfully restored native keys and authenticated its socket, but library readiness did not recover. Chat loading raised `this.$1 is not a function` from WhatsApp's native Wid logging method; the private live patch had installed a `_serialized` setter that assigned `$1`, shadowing that method. The authoritative patch source now skips this alias when `$1` is a native function, and a private bundle was generated from source for the actual Easy API run. No CDN deployment was performed.

The reload also produced local-session takeover timeouts, database operations dropped during logout, and subsequent adapter stopped/fenced errors. These are distinct from the removed rejected-write latch. By the time the failed process exited, its live checkpoint had become a 10-byte non-capsule value; the intact encrypted backup was retained and restored for the corrected private-patch run at 02:08 UTC. That run has not reached library READY: current diagnostics include UNINITIALIZED HANDSHAKE, startHandlingRequests called before startComms, a storage destruction-before-initialization error, and NotInitializedError. A native CONNECTED socket does not establish library readiness. The original failed native write was not reproduced, and removing its permanent-stop handler did not by itself establish automatic recovery. The later failed reload supersedes the earlier READY observations; current per-run health files remain local. The monitor must not announce that the session remains healthy.
