/**
 * Runtime-only types that depend on @open-wa/socket-client.
 *
 * Legacy compatibility note:
 * - Node-RED still uses the SocketClient naming surface for backward compat.
 * - In v5 the active runtime transport is HTTP RPC + SSE, not direct Socket.IO.
 * - Do not import SocketManager from @open-wa/api here.
 */
import { SocketClient } from '@open-wa/socket-client';

// Re-export everything from common for backward compat
export { CLIENT_STORE, type EasyAPIServer, type ServerSubscriber } from './common';

export interface ClientStore {
    [id : string] : SocketClient
  }
