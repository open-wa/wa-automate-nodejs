const path = require("node:path");
const { create, ev } = require("@open-wa/wa-automate");
const qrcode = require("qrcode-terminal");

ev.on("qr.**", function (qr, sessionId, namespace) {
  console.log(`\n[ev QR BEGIN] event=${this.event} sessionId=${sessionId} namespace=${namespace}`);
  qrcode.generate(qr, { small: true });
  console.log("[ev QR END]\n");
});

const configObject = {
  sessionId: "bug-repro",
  sessionDataPath: path.join(__dirname, "sessions"),
  headless: true,
  authTimeout: 0,
  qrTimeout: 0,
  executablePath: process.env.OPENWA_REPRO_CHROME || (
    process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "/usr/bin/google-chrome-stable"
  ),
  chromiumArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
  allowDangerousBrowserArgs: true,
  deleteSessionDataOnLogout: false,
  killClientOnLogout: false,
  logConsole: false,
  logConsoleErrors: false,
};

console.log(`Node ${process.version}; CommonJS create(configObject); headless=${configObject.headless}`);
create(configObject)
  .then(() => console.log("READY: create(configObject) resolved"))
  .catch(error => {
    console.error("CREATE_FAILED:", error);
    process.exitCode = 1;
  });
