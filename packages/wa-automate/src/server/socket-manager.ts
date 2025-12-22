import { Server as SocketIOServer } from 'socket.io';
import { Registry, CapabilityDefinition, z } from '@open-wa/schema';

export class SocketManager {
    private io: SocketIOServer;
    private client: any;

    constructor(io: SocketIOServer) {
        this.io = io;
        this.setupHandlers();
    }

    public setClient(client: any) {
        this.client = client;
    }

    private setupHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            this.registerCapabilityHandlers(socket);

            socket.on('sendToListener', (data) => {
                this.io.emit('listenerMessage', data);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }

    private registerCapabilityHandlers(socket: any) {
        const capabilities = Registry.getAllMethods();

        capabilities.forEach((capability) => {
            socket.on(capability.name, async (data: any, callback: Function) => {
                try {
                    let input = data;

                    if (data && Array.isArray(data.args) && capability.inputSchema instanceof z.ZodObject) {
                        const shape = (capability.inputSchema as any).shape;
                        const keys = Object.keys(shape);
                        const args = data.args;
                        input = {};
                        keys.forEach((key, index) => {
                            if (args[index] !== undefined) {
                                input[key] = args[index];
                            }
                        });
                    }

                    const validated = capability.inputSchema.parse(input);

                    const result = await this.executeCapability(capability, validated);

                    if (callback && typeof callback === 'function') {
                        callback({ success: true, data: result });
                    }
                } catch (error: any) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    const errorDetails = error?.errors;
                    
                    if (callback && typeof callback === 'function') {
                        callback({ success: false, error: errorMessage, details: errorDetails });
                    }
                }
            });
        });
    }

    private async executeCapability(capability: CapabilityDefinition, input: any): Promise<any> {
        if (!this.client) {
            throw new Error('Client not initialized');
        }

        const method = this.client[capability.name];
        if (typeof method !== 'function') {
            throw new Error(`Method ${capability.name} not implemented on Client`);
        }

        const result = await method(input);
        return result;
    }

    public emit(event: string, data: any) {
        this.io.emit(event, data);
    }
}
