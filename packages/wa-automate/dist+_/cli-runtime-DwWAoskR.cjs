//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let _open_wa_api = require("@open-wa/api");
let _open_wa_core = require("@open-wa/core");
let _open_wa_client = require("@open-wa/client");
let _open_wa_driver_puppeteer = require("@open-wa/driver-puppeteer");
let _open_wa_config = require("@open-wa/config");
let boxen = require("boxen");
boxen = __toESM(boxen);
let qrcode_terminal = require("qrcode-terminal");
qrcode_terminal = __toESM(qrcode_terminal);
//#region src/server/hono-server.ts
var WAServer = class extends _open_wa_api.ApiServer {
	constructor(config) {
		super({ config });
	}
};
//#endregion
//#region src/cli-runtime.ts
function renderTerminalQr(qr, sessionId) {
	qrcode_terminal.default.generate(qr, { small: true }, (terminalQrCode) => {
		console.log((0, boxen.default)(terminalQrCode, {
			title: sessionId,
			padding: 1,
			titleAlignment: "center"
		}));
	});
}
function getVal(argv, flag) {
	const index = argv.findIndex((arg) => arg === flag);
	return index !== -1 ? argv[index + 1] : void 0;
}
function parseCliArgs(argv = process.argv.slice(2)) {
	const cliOverrides = {};
	const unsupportedWarnings = [];
	let verbose = false;
	let configPath;
	const sessionId = getVal(argv, "--session-id") || "session";
	cliOverrides.sessionId = sessionId;
	const portValue = getVal(argv, "--port") || getVal(argv, "-p");
	if (portValue) cliOverrides.port = parseInt(portValue, 10);
	const host = getVal(argv, "--host") || getVal(argv, "-h");
	if (host) cliOverrides.host = host;
	const apiKey = getVal(argv, "--api-key") || getVal(argv, "--key") || getVal(argv, "-k");
	if (apiKey) cliOverrides.apiKey = apiKey;
	const logLevel = getVal(argv, "--log-level");
	if (logLevel) cliOverrides.logLevel = logLevel;
	if (argv.includes("--no-ezqr")) cliOverrides.ezqr = false;
	if (argv.includes("--socket")) cliOverrides.socketMode = true;
	if (argv.includes("--headful")) cliOverrides.headless = false;
	if (argv.includes("--headless")) cliOverrides.headless = true;
	if (argv.includes("--use-chrome")) cliOverrides.useChrome = true;
	if (argv.includes("--log-console")) cliOverrides.logConsole = true;
	if (argv.includes("--aggressive-garbage-collection")) cliOverrides.aggressiveGarbageCollection = true;
	if (argv.includes("--no-dashboard")) cliOverrides.dashboard = false;
	const dashboardPort = getVal(argv, "--dashboard-port");
	if (dashboardPort) cliOverrides.dashboardPort = parseInt(dashboardPort, 10);
	const licenseKey = getVal(argv, "--license-key") || getVal(argv, "-l");
	if (licenseKey) cliOverrides.licenseKey = licenseKey;
	const webhook = getVal(argv, "--webhook") || getVal(argv, "-w");
	if (webhook) cliOverrides.webhook = webhook;
	const proxyHost = getVal(argv, "--proxy-host");
	if (proxyHost) cliOverrides.proxyHost = proxyHost;
	const proxyToken = getVal(argv, "--proxy-token");
	if (proxyToken) cliOverrides.proxyToken = proxyToken;
	const readyWebhook = getVal(argv, "--ready-webhook");
	if (readyWebhook) unsupportedWarnings.push(`--ready-webhook was provided (${readyWebhook}) but ready-webhook delivery is not yet wired in v5 CLI.`);
	if (argv.includes("-v") || argv.includes("--verbose")) {
		verbose = true;
		cliOverrides.disableSpins = true;
		cliOverrides.logConsole = true;
		cliOverrides.logLevel = cliOverrides.logLevel || "debug";
	}
	if (argv.includes("--stats")) unsupportedWarnings.push("--stats was provided but swagger-stats parity is not restored; v5 only exposes the compatibility redirect/deprecation route.");
	if (argv.includes("--generate-api-docs")) unsupportedWarnings.push("--generate-api-docs was provided; runtime docs are always served from the shared API layer and no separate collection generation step currently runs at CLI boot.");
	if (argv.includes("--tunnel")) unsupportedWarnings.push("--tunnel was provided but tunnel setup parity is not yet restored in the v5 CLI.");
	if (argv.includes("--chatwoot-url") || argv.includes("--twilio-webhook") || argv.includes("--bot-press-url")) unsupportedWarnings.push("Legacy integration flags (Chatwoot/Twilio/BotPress) were provided but are not yet wired into the v5 CLI boot path.");
	if (argv.includes("--use-session-id-in-path")) cliOverrides.sessionId = sessionId;
	configPath = getVal(argv, "--config") || getVal(argv, "-c");
	return {
		procName: getVal(argv, "--name") || sessionId || "@OPEN-WA EASY API",
		pm2: argv.includes("--pm2"),
		forwardedArgs: argv,
		configPath,
		cliOverrides,
		verbose,
		unsupportedWarnings
	};
}
async function resolveExecutablePath(config) {
	if (config.executablePath) return config.executablePath;
	if (!config.useChrome) return;
	const { Launcher } = await import("chrome-launcher");
	return Launcher.getInstallations()[0];
}
function printStartupSummary(config) {
	const host = config.host.includes("http") ? config.host : `http://${config.host}`;
	console.log(`Easy API session: ${config.sessionId}`);
	console.log(`Health: ${host}:${config.port}/health`);
	console.log(`API Explorer: ${host}:${config.port}/api-docs/`);
	console.log(`Swagger JSON: ${host}:${config.port}/meta/swagger.json`);
	console.log(`Postman JSON: ${host}:${config.port}/meta/postman.json`);
	console.log(`Socket mode: ${config.socketMode ? "enabled" : "disabled"}`);
	console.log(`Browser mode: ${config.headless ? "headless" : "headful"}`);
	if (config.dashboard) console.log(`Dashboard: http://localhost:${config.dashboardPort}`);
	else console.log("Dashboard: disabled (--no-dashboard)");
	if (config.useChrome) console.log("Chrome resolution: enabled via --use-chrome");
	if (config.webhook) console.warn(`Webhook configured (${config.webhook}) but v5 CLI webhook registration parity is not yet restored.`);
}
async function start(parsedArgs = parseCliArgs()) {
	const { configPath, cliOverrides, verbose, unsupportedWarnings } = parsedArgs;
	const { config, sources, configFilePath } = await (0, _open_wa_config.resolveConfig)({
		configPath,
		cliOverrides: {
			disableSpins: true,
			apiLifecycle: "hybrid",
			socketMode: true,
			host: "0.0.0.0",
			port: 8002,
			...cliOverrides
		},
		includeRawConfigs: verbose,
		verbose
	});
	if (verbose) {
		console.log(`Config sources: ${sources.join(", ")}`);
		if (configFilePath) console.log(`Config file: ${configFilePath}`);
	}
	unsupportedWarnings.forEach((warning) => console.warn(`Compatibility warning: ${warning}`));
	const executablePath = await resolveExecutablePath(config);
	if (config.useChrome && !executablePath) console.warn("Compatibility warning: --use-chrome was provided but no Chrome installation was auto-detected. Falling back to default browser resolution.");
	const server = new WAServer(config);
	await server.start();
	printStartupSummary(config);
	console.log("Starting WhatsApp Client...");
	const driver = new _open_wa_driver_puppeteer.PuppeteerDriver();
	const openwaClient = await (0, _open_wa_core.createClient)({
		sessionId: config.sessionId,
		driver,
		deleteSessionDataOnLogout: config.deleteSessionDataOnLogout,
		killClientOnLogout: config.killClientOnLogout,
		sessionDataPath: config.sessionDataPath,
		debug: config.logLevel === "debug" || verbose || config.logConsole,
		headless: config.headless,
		qrTimeoutMs: typeof config.qrTimeout === "number" ? config.qrTimeout * 1e3 : void 0,
		authTimeoutMs: typeof config.authTimeout === "number" ? config.authTimeout * 1e3 : void 0,
		executablePath,
		browserArgs: config.chromiumArgs,
		userDataDir: config.userDataDir,
		logConsole: config.logConsole,
		logConsoleErrors: config.logConsoleErrors,
		blockCrashLogs: config.blockCrashLogs,
		blockAssets: config.blockAssets,
		safeMode: config.safeMode,
		licenseKey: config.licenseKey
	});
	server.setReadinessProvider(() => openwaClient.getReadiness());
	openwaClient.events.on("launch.auth.qr.generated", (event) => {
		const qr = event.details?.qr;
		if (!qr) return;
		if (config.qrLogSkip) console.log("New QR Code generated. Not printing in console because qrLogSkip is set to true");
		else renderTerminalQr(qr, config.sessionId);
		server.setQR(qr);
	});
	const client = new _open_wa_client.Client({
		client: openwaClient,
		transport: openwaClient.getTransport()
	});
	server.setClient(client);
	await client.start();
	const readiness = openwaClient.getReadiness();
	console.log(`WhatsApp Client ready with state: ${client.getState()} (status=${readiness.status}, exposureSafe=${readiness.exposureSafe})`);
	return {
		server,
		client,
		config
	};
}
async function main(argv = process.argv.slice(2)) {
	const parsedArgs = parseCliArgs(argv);
	if (parsedArgs.pm2) {
		const { spawn } = require("child_process");
		try {
			const pm2 = spawn("pm2");
			new Promise((resolve, reject) => {
				pm2.on("error", reject);
				pm2.stdout.on("data", () => resolve());
			});
			const pm2Flags = parsedArgs.forwardedArgs;
			spawn("pm2", [
				"start",
				"/Users/Mohammed/projects/tools/wa/packages/wa-automate/dist/cli.cjs",
				"--name",
				parsedArgs.procName,
				"--stop-exit-codes",
				"88",
				...pm2Flags,
				"--",
				...pm2Flags.filter((x) => !pm2Flags.includes(x))
			], {
				stdio: "inherit",
				detached: true
			});
			return;
		} catch (error) {
			if (error.errorno === -2) {
				console.error("pm2 not found. Please install with: npm install -g pm2");
				return;
			}
			throw error;
		}
	}
	return await start(parsedArgs);
}
//#endregion
Object.defineProperty(exports, "WAServer", {
	enumerable: true,
	get: function() {
		return WAServer;
	}
});
Object.defineProperty(exports, "__toESM", {
	enumerable: true,
	get: function() {
		return __toESM;
	}
});
Object.defineProperty(exports, "main", {
	enumerable: true,
	get: function() {
		return main;
	}
});
Object.defineProperty(exports, "parseCliArgs", {
	enumerable: true,
	get: function() {
		return parseCliArgs;
	}
});
Object.defineProperty(exports, "start", {
	enumerable: true,
	get: function() {
		return start;
	}
});

//# sourceMappingURL=cli-runtime-DwWAoskR.cjs.map