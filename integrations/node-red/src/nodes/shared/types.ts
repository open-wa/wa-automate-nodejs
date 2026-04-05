/**
 * Runtime-only types that depend on @open-wa/socket-client.
 * Re-exports common types for backward compatibility.
 */
import { SocketClient } from '@open-wa/socket-client';

// Re-export everything from common for backward compat
export { CLIENT_STORE, type EasyAPIServer, type ServerSubscriber } from './common';

export interface ClientStore {
    [id : string] : SocketClient
  }