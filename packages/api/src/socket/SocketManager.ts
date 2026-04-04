import { Server as SocketIOServer } from 'socket.io';
import { z, getHttpMethodDefinitions } from '@open-wa/schema';
import '@open-wa/schema/methods';
import { normalizeMethodPayload } from '../compat/args';
import { invokeClientMethod } from '../invoke-client-method';
import type { ClientMethodMap } from '../types';

export class SocketManager {
  private io: SocketIOServer;
  private client: ClientMethodMap | undefined;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupHandlers();
  }

  public setClient(client: ClientMethodMap | undefined) {
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
    const methods = getHttpMethodDefinitions();

    methods.forEach((def) => {
      socket.on(def.functionName, async (data: any, callback: Function) => {
        try {
          const normalized = normalizeMethodPayload(def, data);
          const validated =
            def.inputSchema instanceof z.ZodObject ? def.inputSchema.parse(normalized) : normalized;

          const result = await invokeClientMethod(this.client, def, validated);

          if (typeof callback === 'function') {
            callback({ success: true, data: result });
          }
        } catch (error: any) {
          if (typeof callback === 'function') {
            callback({
              success: false,
              error: error instanceof Error ? error.message : String(error),
              details: error?.errors,
            });
          }
        }
      });
    });
  }

  public emit(event: string, data: any) {
    this.io.emit(event, data);
  }
}
