
## 2026-04-13 Task 8 - Fixing FakePage.waitForFunction()

### Problem
The `FakePage.waitForFunction()` in `bootstrapContract.test.ts` was a no-op stub that returned immediately without evaluating the script. This caused auth probes like `LEGACY_IS_INSIDE_CHAT_CHECK_SCRIPT` to succeed when they should fail (when `sessionLoaded=false`).

### Solution
Added `evaluateBooleanScript()` method to `FakePage` that properly evaluates probe scripts against harness state:

1. **LEGACY_IS_INSIDE_CHAT_CHECK_SCRIPT / RIPE_SESSION_CHECK_SCRIPT** → returns `browserGlobals.WA_AUTHENTICATED`
2. **AUTHENTICATED_SHELL_CHECK_SCRIPT** → returns `browserGlobals.WA_AUTHENTICATED`
3. **SESSION_INVALID_CHECK_SCRIPT** → returns `invalidSession`
4. **PHONE_OUT_OF_REACH_CHECK_SCRIPT** → returns `phoneOutOfReach`
5. **QR_CHECK_SCRIPT** → returns `qrCode !== null`
6. **WAPI_RUNTIME_CHECK_SCRIPT** → returns `runtimeAvailable`
7. **STORE_MSG_CHECK_SCRIPT** → returns `storeMsgAvailable`
8. **LINK_CODE_AVAILABLE_CHECK_SCRIPT** → returns `configuredLinkCode && generatedLinkCode`
9. **All other scripts** → returns `true` (backward compatibility)

### Results
- bootstrapContract: 13 failures → 6 failures (7 tests now passing)
- Full core tests: 17 failures → 10 failures (7 tests now passing)

### Key Insight
The `evaluateBooleanScript()` must be selective - only auth/session probes should evaluate against harness state. Non-auth probes (like module loading checks) should return `true` to maintain backward compatibility.

## 2026-04-13 - waitForSelector Fix Attempt

### Problem
`FakePage.waitForSelector()` always returned `FakeElementHandle`, causing `needsToScan()` to always resolve to `false`.

### Solution
Made `waitForSelector()` stateful for QR selectors:
- For QR selectors (`canvas[aria-label]`): return element only if `qrCode !== null`, otherwise throw
- For other selectors: keep current behavior

### Results
- No change to test results - still 6 bootstrapContract failures
- The 6 remaining failures are pre-existing auth classification edge cases that require production code changes

### Key Insight
The `waitForSelector` fix was correct in principle but didn't improve tests because the remaining failures are at a different layer - they require fixes in `Transport.ts` production code, not harness changes.
