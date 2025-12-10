import { Server as SocketIOServer } from 'socket.io';
import { Registry } from '@open-wa/schema';

export class SocketManager {
    private io: SocketIOServer;

    constructor(io: SocketIOServer) {
        this.io = io;
        this.setupHandlers();
    }

    private setupHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Register all capability handlers
            this.registerCapabilityHandlers(socket);

            // Listener forwarding (bidirectional)
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
                    // Validate input
                    const validated = capability.inputSchema.parse(data);

                    // Execute method (placeholder)
                    const result = await this.executeCapability(capability, validated);

                    // Validate output
                    // const validatedOutput = capability.outputSchema.parse(result);

                    if (callback && typeof callback === 'function') {
                        callback({ success: true, data: result });
                    }
                } catch (error: any) {
                    if (callback && typeof callback === 'function') {
                        callback({ success: false, error: error.message });
                    }
                }
            });
        });
    }

    private async executeCapability(capability: any, input: any): Promise<any> {
        // TODO: Connect to actual WAPI implementation
        // This is where we will hook into the actual driver/client later
        return { placeholder: true, method: capability.name, input };
    }

    public emit(event: string, data: any) {
        this.io.emit(event, data);
    }
}
