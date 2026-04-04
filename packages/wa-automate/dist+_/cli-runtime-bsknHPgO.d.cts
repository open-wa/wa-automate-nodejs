import { Client } from "@open-wa/client";
import { ApiServer } from "@open-wa/api";
import { Config, PartialConfig } from "@open-wa/config";

//#region src/server/hono-server.d.ts
declare class WAServer extends ApiServer {
  constructor(config: Config);
}
//#endregion
//#region src/cli-runtime.d.ts
interface ParsedCliArgs {
  procName: string;
  pm2: boolean;
  forwardedArgs: string[];
  configPath?: string;
  cliOverrides: PartialConfig;
  verbose: boolean;
  unsupportedWarnings: string[];
}
declare function parseCliArgs(argv?: string[]): ParsedCliArgs;
declare function start(parsedArgs?: ParsedCliArgs): Promise<{
  server: WAServer;
  client: Client;
  config: Config;
}>;
declare function main(argv?: string[]): Promise<{
  server: WAServer;
  client: Client;
  config: Config;
} | void>;
//#endregion
export { WAServer as i, parseCliArgs as n, start as r, main as t };
//# sourceMappingURL=cli-runtime-bsknHPgO.d.cts.map