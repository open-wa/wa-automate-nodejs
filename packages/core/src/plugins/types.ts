import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { OpenWAEventMap } from '../events/eventMap.js';
import type { z } from 'zod';

export interface PluginInput {
  events: HyperEmitter<OpenWAEventMap>;
  logger: Logger;
  config: unknown;
  sessionId: string;
  client?: unknown;
}

export type Plugin = (input: PluginInput) => Promise<Hooks>;

export interface ToolDefinition {
  description: string;
  args: Record<string, z.ZodType>;
  execute: (args: Record<string, unknown>, context: ToolContext) => Promise<string>;
}

export interface ToolContext {
  sessionId: string;
  logger: Logger;
  abort: AbortSignal;
}

export interface Hooks {
  event?: (input: { event: keyof OpenWAEventMap; payload: unknown }) => Promise<void>;
  
  tool?: Record<string, ToolDefinition>;
  
  dispose?: () => Promise<void>;
  
  'core.starting'?: (payload: { config: unknown }) => Promise<void>;
  'core.started'?: () => Promise<void>;
  'core.stopping'?: (payload: { reason?: string }) => Promise<void>;
  
  'auth.qr'?: (payload: { sessionId: string; qr: string; attempt: number }) => Promise<void>;
  'auth.authenticated'?: (payload: { sessionId: string }) => Promise<void>;
  
  'client.ready'?: (payload: { sessionId: string }) => Promise<void>;
  
  'message.received'?: (payload: { message: unknown }) => Promise<void>;
  'message.sent'?: (payload: { message: unknown }) => Promise<void>;
  'message.ack'?: (payload: { messageId: string; ack: unknown }) => Promise<void>;
  
  'message.send.before'?: (
    input: { to: string; content: unknown },
    output: { content: unknown; metadata?: Record<string, unknown> }
  ) => Promise<void>;
  
  'message.send.after'?: (
    input: { messageId: string; to: string },
    output: { metadata?: Record<string, unknown> }
  ) => Promise<void>;
}
