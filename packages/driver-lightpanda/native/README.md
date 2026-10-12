# Lightpanda native CryptoKey storage

`lightpanda-1.0.0-cryptokey-clone.patch` applies to the upstream `1.0.0` tag at commit `588f6223b9cae8a2406aeef035ed9363a3e404fd`. It adds native structured cloning for CryptoKey values, including their algorithm metadata, usages and extractability. Keys remain inside Lightpanda; this does not make non-extractable keys exportable or pass their bytes through Node. The patch is covered by the upstream browser's AGPL-3.0-or-later license.

The driver detects native key cloning when opening a page and uses real CryptoKey values in IndexedDB and worker messages when it is available. Without native support, the experimental opaque-key bridge only survives the current document; an IndexedDB key reference from an earlier document cannot be restored by that bridge.

The released browser download has not been replaced. A compiled executable with this patch must be selected through `lightpanda.executablePath` or `LIGHTPANDA_EXECUTABLE_PATH`; `lightpanda-1.0.0-whatsapp-ua.patch` supplies the same user-agent preparation used by the managed executable. The source patch records the native fix separately from the private WhatsApp compact-session patches.

`lightpanda-1.0.0-idb-request-lifetime.patch` retains each pending IndexedDB request's original JavaScript wrapper through its completion event. Dexie stores a batch position on that wrapper; losing it while the request is pending can produce sparse batch results. The running `1.0.0+openwa.cryptokey.idb.2` Debug executable includes all three patches. Its authenticated resource usage has not been benchmarked.
