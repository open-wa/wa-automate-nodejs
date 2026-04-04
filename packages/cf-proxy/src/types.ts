export type ProxyMessageType =
  | 'ping'
  | 'pong'
  | 'http_request'
  | 'http_response'
  | 'rpc_request'
  | 'rpc_response'
  | 'event'
  | 'session_offline';

export interface BaseMessage {
  type: ProxyMessageType;
}

export interface HttpRequestMessage extends BaseMessage {
  type: 'http_request';
  id: string; // Correlation ID
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string | null; // base64 encoded for binary, or plain text
}

export interface HttpResponseMessage extends BaseMessage {
  type: 'http_response';
  id: string;
  status: number;
  headers: Record<string, string | string[]>;
  body: string | null; // base64 encoded for binary, or plain text
}

export interface RpcRequestMessage extends BaseMessage {
  type: 'rpc_request';
  id: string; // Correlation ID
  method: string;
  args: any[];
}

export interface RpcResponseMessage extends BaseMessage {
  type: 'rpc_response';
  id: string;
  result?: any;
  error?: string;
}

export interface EventMessage extends BaseMessage {
  type: 'event';
  event: string;
  data: any;
}

export interface SessionOfflineMessage extends BaseMessage {
  type: 'session_offline';
}

export interface PingMessage extends BaseMessage {
  type: 'ping';
}

export interface PongMessage extends BaseMessage {
  type: 'pong';
}

export type AnyProxyMessage =
  | PingMessage
  | PongMessage
  | HttpRequestMessage
  | HttpResponseMessage
  | RpcRequestMessage
  | RpcResponseMessage
  | EventMessage
  | SessionOfflineMessage;
