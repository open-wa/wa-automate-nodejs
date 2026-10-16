const { config, report, observe } = require('./qr-observer.cjs');

async function start(load) {
  const entry = JSON.parse(process.env.OPENWA_STARTUP_ENTRY);
  const api = await load(entry.package);
  // Load the tested entrypoint first: preloading core can hide ESM load failures.
  const coreApi = entry.package === '@open-wa/core' ? api : await load('@open-wa/core');
  observe(coreApi.ev);
  if (entry.kind === 'create') {
    await api.create(config);
  } else if (entry.kind === 'core' || entry.kind === 'facade') {
    const { PuppeteerDriver } = await load('@open-wa/driver-puppeteer');
    const { createClient } = entry.kind === 'core' ? api : await load('@open-wa/core');
    const core = await createClient({
      sessionId: config.sessionId,
      sessionDataPath: config.sessionDataPath,
      userDataDir: config.userDataDir,
      driver: new PuppeteerDriver(),
      headless: config.headless,
      executablePath: config.executablePath,
      browserArgs: config.chromiumArgs,
      allowDangerousBrowserArgs: config.allowDangerousBrowserArgs,
      authTimeoutMs: 0,
      qrTimeoutMs: 0,
      deleteSessionDataOnLogout: false,
      killClientOnLogout: false,
    });
    const client = entry.kind === 'facade'
      ? new api.Client({ client: core, transport: core.getTransport() })
      : core;
    await client.start();
  } else {
    const { parseCliArgs } = await load('@open-wa/wa-automate');
    const argv = ['--config', process.env.OPENWA_STARTUP_CONFIG, '--non-interactive'];
    await api[entry.method](entry.kind === 'cli-start' ? parseCliArgs(argv) : argv);
  }
  report({ type: 'failure', error: 'Fresh startup returned before the QR test stopped it.' });
}

module.exports = load => start(load).catch(error => {
  report({ type: 'failure', error: error.stack || error.message });
  process.exitCode = 1;
});
