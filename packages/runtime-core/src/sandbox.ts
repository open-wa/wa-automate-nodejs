import { Context, Effect } from 'effect';
import type { SandboxExecutionError } from './errors';

export type SandboxIsolation = 'worker' | 'process' | 'container';

export interface ChatSandboxPolicy {
  readonly chats: boolean;
  readonly isolation: SandboxIsolation;
  readonly timeoutMs: number;
  readonly idleTimeoutMs: number;
  readonly memoryMb: number;
  readonly concurrency: number;
  readonly filesystem: 'none' | 'read-only' | 'workspace';
  readonly network: 'none' | 'allowlist';
  readonly networkAllowlist: ReadonlyArray<string>;
  readonly env: 'none' | ReadonlyArray<string>;
  readonly capabilities: ReadonlyArray<string>;
}

export const defaultChatSandboxPolicy: ChatSandboxPolicy = {
  chats: false,
  isolation: 'process',
  timeoutMs: 30_000,
  idleTimeoutMs: 5 * 60_000,
  memoryMb: 256,
  concurrency: 1,
  filesystem: 'none',
  network: 'none',
  networkAllowlist: [],
  env: 'none',
  capabilities: ['sendText'],
};

export type SandboxCapabilityHandler = (
  ...args: ReadonlyArray<unknown>
) => unknown | Promise<unknown>;

export type SandboxCapabilityHandlers = Readonly<
  Record<string, SandboxCapabilityHandler>
>;

export interface SandboxRequest {
  readonly chatId: string;
  readonly source: string;
  readonly input?: unknown;
  readonly policy: ChatSandboxPolicy;
  /** Parent-owned capability implementations. Functions never enter the sandbox. */
  readonly capabilityHandlers?: SandboxCapabilityHandlers;
}

export interface ExecutionSandboxShape {
  readonly execute: (
    request: SandboxRequest,
  ) => Effect.Effect<unknown, SandboxExecutionError>;
  readonly closeChat: (chatId: string) => Effect.Effect<void>;
  readonly close: Effect.Effect<void>;
}

export const ExecutionSandbox =
  Context.Service<ExecutionSandboxShape>('@open-wa/ExecutionSandbox');

/** Cause capture only. This function does not provide a security boundary. */
export const captureSandboxCause = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  Effect.sandbox(effect);
