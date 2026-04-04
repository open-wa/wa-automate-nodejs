Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_cli_runtime = require("./cli-runtime-DwWAoskR.cjs");
let _open_wa_api = require("@open-wa/api");
let _open_wa_session_sync = require("@open-wa/session-sync");
let _open_wa_logger = require("@open-wa/logger");
let _open_wa_core = require("@open-wa/core");
let _open_wa_config = require("@open-wa/config");
//#region src/session/SessionManager.ts
var SessionManager = class SessionManager {
	logger = (0, _open_wa_logger.createLogger)({ component: "SessionManager" });
	localCompression = null;
	s3Sync = null;
	constructor(config) {
		this.config = config;
		this.logger.info("SessionManager initialized", { sessionId: config.sessionId });
	}
	async start() {
		if (this.config.enableLocalCompression !== false) {
			this.localCompression = new _open_wa_session_sync.LocalSessionCompression({
				sessionPath: this.config.dataDir,
				sessionId: this.config.sessionId,
				intervalMs: this.config.syncInterval || 6e5
			});
			await this.localCompression.start();
			this.logger.info("Local session compression started");
		}
		if (this.config.enableS3Backup && this.config.s3Config) {
			this.s3Sync = new _open_wa_session_sync.S3SyncManager(this.config.s3Config);
			this.startPeriodicSync();
			this.logger.info("S3 session sync started");
		}
	}
	async stop() {
		if (this.localCompression) {
			await this.localCompression.stop();
			this.localCompression = null;
		}
		if (this.s3Sync) this.s3Sync = null;
		this.logger.info("SessionManager stopped");
	}
	async backupSession() {
		if (!this.s3Sync) {
			this.logger.warn("S3 sync not configured");
			return null;
		}
		try {
			const sessionZstPath = `${this.config.dataDir}/${this.config.sessionId}.data.zst`;
			const filename = await this.s3Sync.backupSession(sessionZstPath);
			this.logger.info("Session backed up to S3", { filename });
			return filename;
		} catch (error) {
			this.logger.error("Failed to backup session to S3", { error: error.message });
			throw error;
		}
	}
	async restoreSession(filename) {
		if (!this.s3Sync) {
			this.logger.warn("S3 sync not configured");
			throw new Error("S3 sync not configured for session restore");
		}
		try {
			await this.s3Sync.restoreSession(filename, this.config.dataDir);
			this.logger.info("Session restored from S3", { filename });
		} catch (error) {
			this.logger.error("Failed to restore session from S3", { error: error.message });
			throw error;
		}
	}
	async getSessionBackupUrl(filename, expiresIn = 3600) {
		if (!this.s3Sync) {
			this.logger.warn("S3 sync not configured");
			return null;
		}
		try {
			const url = await this.s3Sync.getDownloadUrl(filename, expiresIn);
			this.logger.info("Generated session backup URL", {
				filename,
				expiresIn
			});
			return url;
		} catch (error) {
			this.logger.error("Failed to generate backup URL", { error: error.message });
			throw error;
		}
	}
	startPeriodicSync() {
		if (!this.s3Sync) return;
		const syncInterval = this.config.syncInterval || 6e5;
		setInterval(async () => {
			try {
				await this.backupSession();
			} catch (error) {
				this.logger.error("Periodic sync failed", { error: error.message });
			}
		}, syncInterval);
	}
	static createFromConfig(clientConfig) {
		const s3Config = clientConfig.s3Sync;
		return new SessionManager({
			sessionId: clientConfig.sessionId || "session",
			dataDir: clientConfig.sessionDataPath || "./.wwebjs",
			s3Config,
			syncInterval: clientConfig.s3Sync?.syncInterval,
			compressionOptions: "-1 -T0",
			enableLocalCompression: clientConfig.s3Sync?.enableLocalCompression !== false,
			enableS3Backup: !!s3Config
		});
	}
};
//#endregion
//#region src/server/lifecycle-manager.ts
var APILifecycleManager = class {
	config;
	server;
	sessionManager;
	_sessionConnected = false;
	constructor(config) {
		this.config = config;
		if (config.s3Sync) this.sessionManager = SessionManager.createFromConfig(config);
	}
	async initialize() {
		switch (this.config.apiLifecycle) {
			case "immediate":
				await this.startFullAPI();
				break;
			case "post-connection":
				this.waitForConnection();
				break;
			case "hybrid":
				await this.startMinimalAPI();
				break;
		}
		if (this.sessionManager) await this.sessionManager.start();
	}
	async waitForConnection() {
		console.log("Waiting for session connection before starting API...");
	}
	async startFullAPI() {
		console.log("Starting full API immediately...");
		this.server = new require_cli_runtime.WAServer(this.config);
		await this.server.start();
	}
	async startMinimalAPI() {
		console.log("Starting minimal API (QR only)...");
		this.server = new require_cli_runtime.WAServer(this.config);
		await this.server.start();
	}
	async stop() {
		if (this.sessionManager) await this.sessionManager.stop();
		if (this.server) await this.server.stop();
	}
};
//#endregion
exports.APILifecycleManager = APILifecycleManager;
Object.defineProperty(exports, "Config", {
	enumerable: true,
	get: function() {
		return _open_wa_config.Config;
	}
});
Object.defineProperty(exports, "ConfigSchema", {
	enumerable: true,
	get: function() {
		return _open_wa_config.ConfigSchema;
	}
});
exports.SessionManager = SessionManager;
exports.WAServer = require_cli_runtime.WAServer;
Object.defineProperty(exports, "createApiMiddleware", {
	enumerable: true,
	get: function() {
		return _open_wa_api.createApiMiddleware;
	}
});
Object.defineProperty(exports, "createApiServer", {
	enumerable: true,
	get: function() {
		return _open_wa_api.createApiServer;
	}
});
Object.defineProperty(exports, "createClient", {
	enumerable: true,
	get: function() {
		return _open_wa_core.createClient;
	}
});
exports.parseCliArgs = require_cli_runtime.parseCliArgs;
exports.runCli = require_cli_runtime.main;
exports.startCli = require_cli_runtime.start;
var _open_wa_client = require("@open-wa/client");
Object.keys(_open_wa_client).forEach(function(k) {
	if (k !== "default" && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function() {
			return _open_wa_client[k];
		}
	});
});

//# sourceMappingURL=index.cjs.map