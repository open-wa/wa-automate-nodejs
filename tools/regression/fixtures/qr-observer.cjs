const { readFileSync } = require('node:fs');

const config = JSON.parse(readFileSync(process.env.OPENWA_STARTUP_CONFIG, 'utf8'));
const marker = 'OPENWA_STARTUP_RESULT ';
let nativeQr;
let seenQr = false;

function report(value) {
  console.log('\n' + marker + JSON.stringify(value));
}

function observe(ev) {
  ev.on('launch.auth.qr.generated', (event, sessionId) => {
    if (sessionId === config.sessionId) nativeQr = event.details?.qr;
  });
  ev.on('qr.**', (qr, sessionId, namespace) => {
    if (sessionId !== config.sessionId || seenQr) return;
    seenQr = true;
    report({ type: 'qr', sessionId, namespace, payloadType: typeof qr, length: qr?.length, matchesNative: qr === nativeQr });
  });
  ev.on('core.stopped', (_event, sessionId) => {
    if (sessionId === config.sessionId && !seenQr) {
      report({ type: 'failure', error: 'The client stopped before emitting a QR.' });
    }
  });
}

module.exports = { config, report, observe };
