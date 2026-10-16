# Packaged startup regression tests

Run `pnpm test:startup` with Node, Bun and an installed Chrome. Set `OPENWA_TEST_CHROME`
if Chrome is outside its usual installation location. The command builds the SDK,
packs the CLI, SDK and all their runtime workspace dependencies, and installs
their tarballs into an isolated directory whose name contains spaces and `%`.
The fixture checks that dependencies resolve to these local packages, so a
registry copy cannot hide a regression. `OPENWA_TEST_BUN` can select a Bun binary.

Every programmatic entrypoint below runs through both CommonJS and ESM under
both Node and Bun, each with a fresh Chrome profile and checkpoint:

| Package | Startup entrypoints |
| --- | --- |
| `@open-wa/wa-automate` | `create`, `createClient`, `Client.start`, `runCli`, `startCli` |
| `@open-wa/core` | `createClient` followed by `start` |
| `@open-wa/client` | `Client.start` |
| `@open-wa/cli` | `main`, `start` |

Both runtimes also execute every binary alias from the packed SDK/CLI manifests:
the SDK's `wa-automate`, and the CLI's `wa`, `wa-automate` and `openwa`. Binary
inventory comes from the manifests, so new aliases join the test automatically.
Programmatic cases require matching native and public QR events; CLI cases also
require an actual rendered terminal QR. Binary cases execute the shipped main file
without preloading the SDK, then require the terminal QR. These tests stop at QR
without a phone scan or waiting for READY.

Four additional cases read the packaged WAPI and launch assets through each
runtime and export condition. A QR alone cannot detect #3559 because the broken
release could emit a QR before failing; the Node ESM asset case catches that error.

The suite runs at most two browser cases concurrently. It stops each owned child
and browser after QR or failure, then removes the installation. It needs
network access to npm, the patch endpoint and WhatsApp Web. Nothing is mocked.
Child processes discard inherited application config, Node preloads and external
module search paths so local credentials or preloaded modules cannot affect startup.

To demonstrate the asset failure against the reported 5.6.4 core after building:

```sh
OPENWA_TEST_VERSION=5.6.4 node --test --test-name-pattern='core resolves' tools/regression/runtime-startup.test.mjs
```

Asset tests exercise `Transport` through the installed package exports; they
do not inspect source text or mock stack frames. The ESM case must fail for 5.6.4.

For a focused diagnosis, `OPENWA_STARTUP_CASE` selects QR case names by substring;
an unmatched selector fails. Omit it for the complete matrix. For example:

```sh
OPENWA_STARTUP_CASE='Bun module @open-wa/core createClient' node --test tools/regression/runtime-startup.test.mjs
```
