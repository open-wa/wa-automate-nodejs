import { i as WAServer, n as parseCliArgs, r as start, t as main } from "./cli-runtime-bsknHPgO.cjs";
import { createApiMiddleware, createApiServer } from "@open-wa/api";
import { Config, Config as Config$1, ConfigSchema } from "@open-wa/config";
import { ClientConfig } from "@open-wa/schema";
import { CreateClientOptions, OpenWAClient, createClient } from "@open-wa/core";
export * from "@open-wa/client";

//#region src/server/lifecycle-manager.d.ts
declare class APILifecycleManager {
  private config;
  private server?;
  private sessionManager?;
  private _sessionConnected;
  constructor(config: Config$1);
  initialize(): Promise<void>;
  private waitForConnection;
  private startFullAPI;
  private startMinimalAPI;
  stop(): Promise<void>;
}
//#endregion
//#region src/session/SessionManager.d.ts
interface SessionManagerConfig {
  sessionId: string;
  dataDir: string;
  s3Config?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    host?: string;
  };
  syncInterval?: number;
  compressionOptions?: string;
  enableLocalCompression?: boolean;
  enableS3Backup?: boolean;
}
declare class SessionManager {
  private config;
  private logger;
  private localCompression;
  private s3Sync;
  constructor(config: SessionManagerConfig);
  start(): Promise<void>;
  stop(): Promise<void>;
  backupSession(): Promise<string | null>;
  restoreSession(filename: string): Promise<void>;
  getSessionBackupUrl(filename: string, expiresIn?: number): Promise<string | null>;
  private startPeriodicSync;
  static createFromConfig(clientConfig: ClientConfig): SessionManager;
}
//#endregion
export { APILifecycleManager, Config, ConfigSchema, type CreateClientOptions, type OpenWAClient, SessionManager, WAServer, createApiMiddleware, createApiServer, createClient, parseCliArgs, main as runCli, start as startCli };
//# sourceMappingURL=index.d.cts.map