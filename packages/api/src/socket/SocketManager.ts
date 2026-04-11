import { Server as SocketIOServer } from 'socket.io';
import { getHttpMethodDefinitions } from '@open-wa/schema';
import '@open-wa/schema/methods';
import { normalizeMethodPayload } from '../compat/args';
import { invokeClientMethod } from '../invoke-client-method';
import type { ClientMethodMap } from '../types';

export interface EventBridge {
  onAny(listener: (event: string, value: any) => void): void;
  offAny(listener: (event: string, value: any) => void): void;
}

export class SocketManager {
  private io: SocketIOServer;
  private client: ClientMethodMap | undefined;
  private eventBridge: EventBridge | undefined;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupHandlers();
  }

  public setClient(client: ClientMethodMap | undefined) {
    this.client = client;
  }

  public setEventBridge(bridge: EventBridge) {
    this.eventBridge = bridge;
  }

  private setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      this.registerCapabilityHandlers(socket);

      // Legacy compat: when the client sends register_ev,
      // bridge ALL internal events to this socket so the dashboard
      // events page receives them in real-time.
      socket.on('register_ev', () => {
        if (this.eventBridge) {
          const forwarder = (event: string, value: any) => {
            socket.emit(event, value);
          };
          this.eventBridge.onAny(forwarder);
          socket.on('disconnect', () => {
            this.eventBridge?.offAny(forwarder);
          });
        }
      });

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
      for (const invocationName of def.invocationNames) {
        socket.on(invocationName, async (data: any, callback: Function) => {
          try {
            const normalized = normalizeMethodPayload(def, data);
            const validated = await def.inputSchema.parseAsync(normalized);

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
      }
    });
  }

  public emit(event: string, data: any) {
    this.io.emit(event, data);
  }
}
