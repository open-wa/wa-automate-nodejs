/**
 * Frames exchanged over the upstream WebSocket between the Durable Object and the session's TunnelClient.
 * HTTP requests and responses are streamed: a start frame with the head, body frames, then an end or abort
 * frame. Server-sent events and large media therefore pass through without buffering or a total timeout.
 */
export type HeaderPairs = [string, string][];

/** Largest body slice per frame, before base64. */
export const BODY_CHUNK_BYTES = 256 * 1024;

export interface RequestStartMessage {
  type: 'req_start';
  id: string;
  method: string;
  /** Path and query string, relative to the session. */
  path: string;
  headers: HeaderPairs;
  hasBody: boolean;
}

export interface ResponseStartMessage {
  type: 'res_start';
  id: string;
  status: number;
  headers: HeaderPairs;
}

export interface BodyMessage {
  type: 'req_body' | 'res_body';
  id: string;
  /** Base64-encoded bytes. */
  chunk: string;
}

export interface EndMessage {
  type: 'req_end' | 'res_end';
  id: string;
}

export interface AbortMessage {
  type: 'req_abort' | 'res_abort';
  id: string;
  error?: string;
}

export interface RpcRequestMessage {
  type: 'rpc_request';
  id: string;
  method: string;
  args: unknown[];
}

export interface RpcResponseMessage {
  type: 'rpc_response';
  id: string;
  result?: unknown;
  error?: string;
}

export interface EventMessage {
  type: 'event';
  event: string;
  data: unknown;
}

export interface SessionOfflineMessage {
  type: 'session_offline';
}

/** Sent to a session's old connection when another instance connects; the old one must stop reconnecting. */
export interface ReplacedMessage { type: 'replaced' }

/** Sent to a licensed session when it connects: its public address. */
export interface WelcomeMessage { type: 'welcome'; address: string }

export interface PingMessage { type: 'ping' }
export interface PongMessage { type: 'pong' }

export type AnyProxyMessage =
  | PingMessage
  | PongMessage
  | RequestStartMessage
  | ResponseStartMessage
  | BodyMessage
  | EndMessage
  | AbortMessage
  | RpcRequestMessage
  | RpcResponseMessage
  | EventMessage
  | SessionOfflineMessage
  | ReplacedMessage
  | WelcomeMessage;

/** Connection-level headers that must not cross the tunnel. */
export const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade', 'te', 'trailer', 'host', 'content-length', 'expect',
]);
