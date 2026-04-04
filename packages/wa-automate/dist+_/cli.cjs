#!/usr/bin/env node
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_cli_runtime = require("./cli-runtime-DwWAoskR.cjs");
//#region src/cli.ts
if (require.main === module) require_cli_runtime.main().catch((err) => {
	console.error("Failed to start:", err);
	process.exit(1);
});
//#endregion
exports.main = require_cli_runtime.main;
exports.parseCliArgs = require_cli_runtime.parseCliArgs;
exports.start = require_cli_runtime.start;

//# sourceMappingURL=cli.cjs.map