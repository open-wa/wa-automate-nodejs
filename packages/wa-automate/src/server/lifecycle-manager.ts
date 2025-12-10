import { WAServer } from './hono-server';
import type { Config } from '@open-wa/schema';

export class APILifecycleManager {
    private config: Config;
    private server?: WAServer;
    // @ts-ignore
    private _sessionConnected: boolean = false;

    constructor(config: Config) {
        this.config = config;
    }

    public async initialize() {
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
    }

    private async startFullAPI() {
        console.log('Starting full API immediately...');
        this.server = new WAServer(this.config);
        await this.server.start();
    }

    private async startMinimalAPI() {
        console.log('Starting minimal API (QR only)...');

        // Create server with full config but we might restrict routes in the future
        // For now, hybrid mode just starts the server, but logic inside routes (like sendText)
        // should check if session is connected before execution.
        // In a more advanced implementation, we would only register public routes here.

        this.server = new WAServer(this.config);
        await this.server.start();
    }

    private waitForConnection() {
        console.log('Waiting for session connection before starting API...');
        // This will be called by the orchestrator or main entry point when session connects
    }

    public async onSessionConnected() {
        this._sessionConnected = true;

        // Clear QR code on connection
        if (this.server) {
            this.server.setQR('');
        }

        if (this.config.apiLifecycle === 'hybrid') {
            console.log('Session connected, API fully operational...');
            // If we had restricted routes, we would enable them here. 
            // Since Hono routes are static, we rely on runtime checks inside controllers.
        } else if (this.config.apiLifecycle === 'post-connection') {
            await this.startFullAPI();
        }
    }

    public onQRUpdate(qr: string) {
        if (this.server) {
            this.server.setQR(qr);
        }
    }

    public getServer() {
        return this.server;
    }
}
