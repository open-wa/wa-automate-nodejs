# Native Lightpanda session support

`lightpanda-e98a770-native-session.patch` targets upstream main at `e98a770e0ef37083b64e40d6047ab5fa5893cbff`. It supplies the native APIs required by the experimental WhatsApp session path:

- CryptoKey structured cloning preserves algorithm metadata, usages and extractability. Non-extractable keys remain inside the browser.
- MessagePort transfers move native entanglement between window and worker realms, populate `MessageEvent.ports`, and detach the sending port. ArrayBuffer transfers detach the sending buffer.
- Web Locks coordinate requests across native windows and workers in the same origin, hold locks until callbacks settle, support shared/exclusive modes and takeover, and release ownership when a context closes. Worker names identify WhatsApp's separate worker takeover locks.
- IndexedDB retains pending request wrappers, including Dexie's request batch positions, until completion. String-list iterators retain their backing list so garbage collection cannot invalidate store and index names.
- WebCrypto accepts BufferSource byte views, including signed typed arrays and DataView.
- User-agent and client-hint overrides support the configured browser identity.

The driver requires native key cloning, port transfers and Web Locks before starting WhatsApp. It no longer installs the page-local key and worker message bridge. Browser compression remains installed in the page. Native CacheStorage is available independently of the disabled, incomplete Service Worker implementation. Select the custom executable using `lightpanda.executablePath` or `LIGHTPANDA_EXECUTABLE_PATH`; the official release download does not include these additional native changes.

The patch includes a `session-executable` compilation target to produce the required binary without running the upstream formatting or verification targets. With the matching Zig toolchain and V8 archive available:

```sh
git checkout e98a770e0ef37083b64e40d6047ab5fa5893cbff
git apply /absolute/path/lightpanda-e98a770-native-session.patch
zig build session-executable -Doptimize=Debug \
  -Dversion=1.1.0-dev+openwa.native.8 \
  -Dprebuilt_v8_path=/absolute/path/libc_v8.a
```

These native changes follow the upstream browser's AGPL-3.0-or-later license. The custom Debug executable has not been benchmarked, and the stock-browser benchmark figures do not describe this build. Authenticated startup, dashboard access and reload recovery must be established through the actual library run before claiming session support is complete.

The three `lightpanda-1.0.0-*` patches record the earlier investigation against `588f6223b9cae8a2406aeef035ed9363a3e404fd`; the main-based session patch is the current implementation.
