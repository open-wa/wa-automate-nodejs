const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { create, ev } = require('@open-wa/wa-automate');
const sdkRequire = createRequire(require.resolve('@open-wa/wa-automate'));
const { Launcher } = sdkRequire('chrome-launcher');
assert.equal(sdkRequire.resolve('@open-wa/core'), require.resolve('@open-wa/core'), 'create() must use the core package under test.');

const sessionId = 'regression-3559';
let nativeQr;
let reported = false;

ev.on('launch.auth.qr.generated', (event, id) => {
  if (id === sessionId) nativeQr = event.details?.qr;
});
ev.on('qr.**', (qr, id, namespace) => {
  if (id !== sessionId || reported) return;
  reported = true;
  process.send({ type: 'qr', sessionId: id, namespace, payloadType: typeof qr, length: qr?.length, matchesNative: qr === nativeQr });
});

const executablePath = process.env.OPENWA_TEST_CHROME || Launcher.getInstallations()[0];
if (!executablePath) throw new Error('Install Chrome or set OPENWA_TEST_CHROME to its executable.');
const rootOnLinux = process.platform === 'linux' && process.getuid() === 0;

create({
  sessionId,
  sessionDataPath: path.join(__dirname, 'checkpoint'),
  userDataDir: path.join(__dirname, 'chrome-profile'),
  headless: true,
  executablePath,
  authTimeout: 0,
  qrTimeout: 0,
  qrLogSkip: true,
  chromiumArgs: rootOnLinux ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
  allowDangerousBrowserArgs: rootOnLinux,
  deleteSessionDataOnLogout: false,
  killClientOnLogout: false,
  logConsole: false,
  logConsoleErrors: false,
}).then(() => {
  process.send({ type: 'failure', error: 'Fresh startup reached READY without emitting a QR.' });
}).catch(error => {
  process.send({ type: 'failure', error: error.stack || error.message });
});
