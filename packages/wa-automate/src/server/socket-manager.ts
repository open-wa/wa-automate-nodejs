import { Server as SocketIOServer } from 'socket.io';
import { clientRegistry, z } from '@open-wa/schema';
import '@open-wa/schema/methods';

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
        const methods = clientRegistry.getAll();

        methods.forEach((def) => {
            const methodName = def.meta.functionName;
            const inputSchema = def.meta.inputSchema;
            
            socket.on(methodName, async (data: any, callback: Function) => {
                try {
                    let input = data;

                    if (data && Array.isArray(data.args) && inputSchema instanceof z.ZodObject) {
                        const shape = inputSchema.shape;
                        const keys = Object.keys(shape);
                        const args = data.args;
                        input = {};
                        keys.forEach((key, index) => {
                            if (args[index] !== undefined) {
                                input[key] = args[index];
                            }
                        });
                    }

                    const validated = inputSchema.parse(input);

                    const result = await this.executeMethod(methodName, validated);

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

    private async executeMethod(methodName: string, input: any): Promise<any> {
        if (!this.client) {
            throw new Error('Client not initialized');
        }

        const method = this.client[methodName];
        if (typeof method !== 'function') {
            throw new Error(`Method ${methodName} not implemented on Client`);
        }

        const result = await method(input);
        return result;
    }

    public emit(event: string, data: any) {
        this.io.emit(event, data);
    }
}
