# Packaged startup regression tests

Run `pnpm test:startup` with Node and an installed Chrome. Set `OPENWA_TEST_CHROME`
if Chrome is outside its usual installation location. The command builds the SDK,
packs the local core, SDK and Puppeteer driver, and installs their tarballs into
an isolated directory whose name contains spaces and `%`.

The three tests cover readable runtime assets through both Node export conditions
and the real CommonJS `create(configObject)` path, including its dynamic ESM core
import and matching native/public QR events. The browser test passes at QR, without
a phone scan or waiting for READY. A QR alone cannot detect #3559 because the broken
release could emit a QR before failing; the ESM asset test catches that failure.

The browser uses a fresh temporary profile and checkpoint. The test stops its own
child and browser after QR or failure, then removes the installation. It needs
network access to npm, the patch endpoint and WhatsApp Web. Nothing is mocked.

To demonstrate the asset failure against the reported 5.6.4 core after building:

```sh
OPENWA_TEST_VERSION=5.6.4 node --test --test-name-pattern='core resolves' tools/regression/runtime-startup.test.mjs
```

Both asset tests exercise `Transport` through the installed package exports; they
do not inspect source text or mock stack frames. The ESM case must fail for 5.6.4.
