// Run with Node 24.21.0. CommonJS imports and config from GitHub issue #3534.
// Set OPENWA_REPRO_HEADLESS=false for the otherwise identical visible run.
const path = require("node:path");
const { create } = require("@open-wa/wa-automate");

const configObject = {
  sessionId: "bug-repro",
  sessionDataPath: path.join(__dirname, "sessions"),
  headless: process.env.OPENWA_REPRO_HEADLESS !== "false",
  authTimeout: 0,
  qrTimeout: 0,
  executablePath: process.env.OPENWA_REPRO_CHROME || "/usr/bin/google-chrome-stable",
  chromiumArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
  allowDangerousBrowserArgs: true,
  deleteSessionDataOnLogout: false,
  killClientOnLogout: false,
  logConsole: false,
  logConsoleErrors: false,
};

console.log("Issue #3534: CommonJS create(configObject)");
console.log({
  node: process.version,
  platform: process.platform,
  configObject,
});
console.log("Starting WhatsApp. Pairing is required before create() resolves.");

create(configObject)
  .then((client: any) => {
    console.log("CREATE_RESOLVED: WhatsApp is ready.");
    process.once("SIGINT", async () => {
      await client.stop("repro-interrupted");
      process.exit(0);
    });
  })
  .catch((error: Error) => {
    console.error("CREATE_FAILED:", error.stack || error.message);
    process.exitCode = 1;
  });
