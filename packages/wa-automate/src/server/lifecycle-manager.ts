import { WAServer } from './hono-server';
import type { Config } from '@open-wa/schema';
import { SessionManager } from '../session/SessionManager';

export class APILifecycleManager {
    private config: Config;
    private server?: WAServer;
    private sessionManager?: SessionManager;
    // @ts-ignore
    private _sessionConnected: boolean = false;

    constructor(config: Config) {
        this.config = config;
        
        // Initialize session manager if S3 sync is configured
        if (config.s3Sync) {
            this.sessionManager = SessionManager.createFromConfig(config);
        }
    }

    public async initialize(): Promise<void> {
        switch (this.config.apiLifecycle) {
            case 'immediate':
                await this.startFullAPI();
                break;
            case 'post-connection':
                this.waitForConnection();
                break;
            case 'hybrid':
                await this.startMinimalAPI();
                break;
        }
        
        // Start session manager after all other initialization
        if (this.sessionManager) {
            await this.sessionManager.start();
        }
    }

    private async waitForConnection(): Promise<void> {
        console.log('Waiting for session connection before starting API...');
        // This will be called by the orchestrator or main entry point when session connects
    }

    private async startFullAPI(): Promise<void> {
        console.log('Starting full API immediately...');
        this.server = new WAServer(this.config);
        await this.server.start();
    }

    private async startMinimalAPI(): Promise<void> {
        console.log('Starting minimal API (QR only)...');
        
        // Create server with full config but we might restrict routes in the future
        // For now, hybrid mode just starts the server, but logic inside routes (like sendText)
        // should check if session is connected before execution.
        // In a more advanced implementation, we would only register public routes here.
        
        this.server = new WAServer(this.config);
        await this.server.start();
    }
    
    public async stop(): Promise<void> {
        // Stop session manager first
        if (this.sessionManager) {
            await this.sessionManager.stop();
        }
        
        // Then stop server
        if (this.server) {
            await this.server.stop();
        }
    }
}