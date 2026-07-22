import { Data } from 'effect';

export class RuntimeCapabilityError extends Data.TaggedError(
  'RuntimeCapabilityError',
)<{
  readonly capability: RuntimeCapability;
  readonly runtime: RuntimeKind;
  readonly detail: string;
}> {}

export class QueueOverloadedError extends Data.TaggedError(
  'QueueOverloadedError',
)<{
  readonly queue: string;
  readonly capacity: number;
}> {}

export class QueueClosedError extends Data.TaggedError('QueueClosedError')<{
  readonly queue: string;
}> {}

export class TaskTimeoutError extends Data.TaggedError('TaskTimeoutError')<{
  readonly queue: string;
  readonly timeoutMs: number;
}> {}

export class TaskExecutionError extends Data.TaggedError(
  'TaskExecutionError',
)<{
  readonly queue: string;
  readonly cause: unknown;
}> {}

export class StartupGraphError extends Data.TaggedError('StartupGraphError')<{
  readonly detail: string;
  readonly nodes: ReadonlyArray<string>;
}> {}

export class SandboxPolicyError extends Data.TaggedError(
  'SandboxPolicyError',
)<{
  readonly detail: string;
  readonly field?: string;
}> {}

export class SandboxExecutionError extends Data.TaggedError(
  'SandboxExecutionError',
)<{
  readonly chatId: string;
  readonly isolation: string;
  readonly cause: unknown;
}> {}

export class SessionAdmissionError extends Data.TaggedError(
  'SessionAdmissionError',
)<{
  readonly requestedMemoryMb: number;
  readonly availableMemoryMb: number;
}> {}

export type RuntimeKind = 'node' | 'bun' | 'browser' | 'edge' | 'test';

export type RuntimeCapability =
  | 'browser-client'
  | 'chromium-launch'
  | 'filesystem'
  | 'process'
  | 'web-fetch'
  | 'worker-bindings';
