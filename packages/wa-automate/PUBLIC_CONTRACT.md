# `@open-wa/wa-automate` public contract truth

This package is the thin public entrypoint for the v5 CLI and API runtime.

## Top-level export truth

- `WAServer`, `APILifecycleManager`, `SessionManager`, `runCli`, `startCli`, and `parseCliArgs` are owned here.
- `createClient` is re-exported from `@open-wa/core` because core owns runtime bootstrap.
- `Config` and `ConfigSchema` are re-exported from `@open-wa/config` because config truth now lives there, not in the deprecated `@open-wa/schema` compatibility shim.
- `export * from '@open-wa/client'` remains a compatibility passthrough for the client facade surface. It is not evidence that `wa-automate` owns client runtime implementation.

## Explicit downgrade and deprecation truth

### Popup and local QR parity

- `popup`
- `qrPopUpOnly`

These options are retained as downgraded compatibility switches. They may still open a local browser window or expose QR output, but v5 does not promise legacy popup QR parity as a supported runtime contract.

### MD-obsolete JSON session restore

- `sessionData`
- `sessionDataPath`
- `skipSessionSave`

These options are deprecated compatibility inputs for the old `.data.json` session flow. They stay only for legacy migration. The truthful v5 persistence path is `userDataDir`.

## Effect never leaks

v5 uses Effect internally (see `EFFECT.md`), but Effect is not part of the
public contract:

- Public APIs are Promise-based. Method signatures, `@open-wa/plugin-sdk`,
  `@open-wa/client`, and generated code never require or expose Effect types.
- Failures cross the boundary as a plain `OpenWAError` (an `Error` subclass with
  `name`, `message`, `status`, `details`, and preserved `cause`). Callers never
  receive an Effect `Cause`, `Exit`, `FiberFailure`, or fiber trace.
- HTTP surfaces map `OpenWAError.status` to the response code.

## Executable proof

- `packages/config/src/__tests__/deprecation-contract.test.ts`
- `packages/wa-automate/src/server/__tests__/public-contract.test.ts`
- `packages/wa-automate/src/server/__tests__/readiness-parity.test.ts`
- `packages/core/test/unit/effectErrors.test.ts` (Effect-never-leaks boundary)
