import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { defaultChatSandboxPolicy } from '@open-wa/runtime-core';
import { makeNodeExecutionSandbox } from './execution-sandbox';

describe('Node execution sandbox', () => {
  it('executes serializable functions in a separate permissioned process', async () => {
    const sandbox = makeNodeExecutionSandbox();
    const result = await Effect.runPromise(sandbox.execute({
      chatId: 'chat-1',
      source: '(input) => ({ doubled: input.value * 2, processType: typeof process })',
      input: { value: 21 },
      policy: { ...defaultChatSandboxPolicy, chats: true, timeoutMs: 2_000 },
    }));

    expect(result).toEqual({ doubled: 42, processType: 'undefined' });
    await Effect.runPromise(sandbox.close);
  });

  it('supports memory-limited worker isolation', async () => {
    const sandbox = makeNodeExecutionSandbox();
    const result = await Effect.runPromise(sandbox.execute({
      chatId: 'chat-worker',
      source: '(input) => input.message.toUpperCase()',
      input: { message: 'isolated' },
      policy: {
        ...defaultChatSandboxPolicy,
        chats: true,
        isolation: 'worker',
        timeoutMs: 2_000,
        memoryMb: 64,
      },
    }));

    expect(result).toBe('ISOLATED');
    await Effect.runPromise(sandbox.close);
  });

  it('kills executions that exceed their policy timeout', async () => {
    const sandbox = makeNodeExecutionSandbox();
    const exit = await Effect.runPromise(Effect.exit(sandbox.execute({
      chatId: 'chat-timeout',
      source: '() => new Promise(() => {})',
      policy: { ...defaultChatSandboxPolicy, chats: true, timeoutMs: 25 },
    })));

    expect(exit._tag).toBe('Failure');
    await Effect.runPromise(sandbox.close);
  });

  it('blocks ambient process, require, and string code generation in process mode', async () => {
    const sandbox = makeNodeExecutionSandbox();
    const result = await Effect.runPromise(sandbox.execute({
      chatId: 'chat-escape',
      source: `() => ({
        process: typeof process,
        require: typeof require,
        constructorEscape: (() => {
          try { return Function('return process')(); }
          catch { return 'blocked'; }
        })()
      })`,
      policy: { ...defaultChatSandboxPolicy, chats: true, timeoutMs: 2_000 },
    }));

    expect(result).toEqual({
      process: 'undefined',
      require: 'undefined',
      constructorEscape: 'blocked',
    });
    await Effect.runPromise(sandbox.close);
  });

  it('terminates process output that exceeds its resource policy', async () => {
    const sandbox = makeNodeExecutionSandbox({ maxOutputBytes: 128 });
    const exit = await Effect.runPromise(Effect.exit(sandbox.execute({
      chatId: 'chat-output-limit',
      source: `() => 'x'.repeat(4096)`,
      policy: { ...defaultChatSandboxPolicy, chats: true, timeoutMs: 2_000 },
    })));

    expect(exit._tag).toBe('Failure');
    await Effect.runPromise(sandbox.close);
  });

  it('fails closed when a non-container policy requests host access', async () => {
    const sandbox = makeNodeExecutionSandbox();
    const exit = await Effect.runPromise(Effect.exit(sandbox.execute({
      chatId: 'chat-policy',
      source: '() => true',
      policy: {
        ...defaultChatSandboxPolicy,
        chats: true,
        network: 'allowlist',
        networkAllowlist: ['api.example.test'],
      },
    })));

    expect(exit._tag).toBe('Failure');
    await Effect.runPromise(sandbox.close);
  });
});
