import { WAServer } from './hono-server';
import type { Config } from '@open-wa/config';
import { getCliOutputSink } from '../cli/output-sink';

export class APILifecycleManager {
    private config: Config;
    private server?: WAServer;
    // @ts-ignore
    private _sessionConnected: boolean = false;

    constructor(config: Config) {
        this.config = config;
    }

    public async initialize(): Promise<void> {
        const sink = getCliOutputSink();
        switch (this.config.apiLifecycle) {
            case 'immediate':
                sink.status({ phase: 'server.starting', sessionId: this.config.sessionId, detail: 'Starting full API immediately' });
                await this.startFullAPI();
                break;
            case 'post-connection':
                this.waitForConnection();
                break;
            case 'hybrid':
                sink.status({ phase: 'server.starting', sessionId: this.config.sessionId, detail: 'Starting minimal API (QR only)' });
                await this.startMinimalAPI();
                break;
        }
    }

    private async waitForConnection(): Promise<void> {
        getCliOutputSink().write({ level: 'info', message: 'Waiting for session connection before starting API...' });
        // This will be called by the orchestrator or main entry point when session connects
    }

    private async startFullAPI(): Promise<void> {
        getCliOutputSink().write({ level: 'info', message: 'Starting full API immediately...' });
        this.server = new WAServer(this.config);
        await this.server.start();
    }

    private async startMinimalAPI(): Promise<void> {
        getCliOutputSink().write({ level: 'info', message: 'Starting minimal API (QR only)...' });
        
        // Create server with full config but we might restrict routes in the future
        // For now, hybrid mode just starts the server, but logic inside routes (like sendText)
        // should check if session is connected before execution.
        // In a more advanced implementation, we would only register public routes here.
        
        this.server = new WAServer(this.config);
        await this.server.start();
    }
    
    public async stop(): Promise<void> {
        if (this.server) {
            await this.server.stop();
        }
    }
}
