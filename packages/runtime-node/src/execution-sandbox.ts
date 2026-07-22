import { spawn, type ChildProcess } from 'node:child_process';
import { Worker } from 'node:worker_threads';
import {
  SandboxExecutionError,
  ScopedTaskQueue,
  type ExecutionSandboxShape,
  type SandboxRequest,
} from '@open-wa/runtime-core';
import { Effect } from 'effect';

const SANDBOX_PROGRAM = String.raw`
const read = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};
const { default: vm } = await import('node:vm');
try {
  const request = await read();
  const context = vm.createContext(Object.assign(Object.create(null), {
    input: structuredClone(request.input),
    console: Object.freeze({ log() {}, warn() {}, error() {} }),
    TextEncoder,
    TextDecoder,
  }), { codeGeneration: { strings: false, wasm: false } });
  const script = new vm.Script('Promise.resolve((' + request.source + ')(input))');
  const value = await script.runInContext(context, { timeout: request.syncTimeoutMs });
  process.stdout.write(JSON.stringify({ ok: true, value }));
} catch (error) {
  process.stdout.write(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
}
`;

const WORKER_PROGRAM = String.raw`
const { parentPort, workerData } = require('node:worker_threads');
const vm = require('node:vm');
(async () => {
  try {
    const context = vm.createContext(Object.assign(Object.create(null), {
      input: structuredClone(workerData.input),
      console: Object.freeze({ log() {}, warn() {}, error() {} }),
      TextEncoder,
      TextDecoder,
    }), { codeGeneration: { strings: false, wasm: false } });
    const script = new vm.Script('Promise.resolve((' + workerData.source + ')(input))');
    const value = await script.runInContext(context, { timeout: workerData.syncTimeoutMs });
    parentPort.postMessage({ ok: true, value });
  } catch (error) {
    parentPort.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
})();
`;

export interface NodeExecutionSandboxOptions {
  readonly containerCommand?: string;
  readonly containerImage?: string;
  readonly workspacePath?: string;
  readonly maxOutputBytes?: number;
}

interface SandboxReply {
  readonly ok: boolean;
  readonly value?: unknown;
  readonly error?: string;
}

export const makeNodeExecutionSandbox = (
  options: NodeExecutionSandboxOptions = {},
): ExecutionSandboxShape => {
  const queues = new Map<string, Promise<ScopedTaskQueue>>();
  const idleTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const children = new Map<string, Set<ChildProcess | Worker>>();
  let closed = false;

  const validatePolicy = (request: SandboxRequest): void => {
    if (
      request.policy.isolation !== 'container' &&
      (
        request.policy.filesystem !== 'none' ||
        request.policy.network !== 'none' ||
        request.policy.env !== 'none'
      )
    ) {
      throw new Error(
        `${request.policy.isolation} isolation only supports filesystem=none, network=none, and env=none; use a container policy for host access`,
      );
    }
  };

  const track = <A extends ChildProcess | Worker>(chatId: string, child: A): A => {
    const active = children.get(chatId) ?? new Set<ChildProcess | Worker>();
    active.add(child);
    children.set(chatId, active);
    return child;
  };

  const untrack = (chatId: string, child: ChildProcess | Worker) => {
    const active = children.get(chatId);
    active?.delete(child);
    if (active?.size === 0) children.delete(chatId);
  };

  const processReply = (request: SandboxRequest, reply: SandboxReply): unknown => {
    if (!reply.ok) throw new Error(reply.error ?? 'sandbox execution failed');
    return reply.value;
  };

  const runProcess = (request: SandboxRequest): Promise<unknown> =>
    new Promise((resolve, reject) => {
      const args = [
        `--max-old-space-size=${request.policy.memoryMb}`,
        '--permission',
        '--input-type=module',
        '--eval',
        SANDBOX_PROGRAM,
      ];
      const env = request.policy.env === 'none'
        ? {}
        : Object.fromEntries(request.policy.env.flatMap((key) =>
            process.env[key] === undefined ? [] : [[key, process.env[key]!]],
          ));
      const child = track(request.chatId, spawn(process.execPath, args, {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: request.policy.timeoutMs,
        windowsHide: true,
      }));
      let stdout = '';
      let stderr = '';
      let outputExceeded = false;
      const maxOutput = options.maxOutputBytes ?? 1024 * 1024;

      child.stdout?.on('data', (chunk) => {
        stdout += chunk.toString();
        if (stdout.length > maxOutput) {
          outputExceeded = true;
          child.kill();
        }
      });
      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
        if (stderr.length > maxOutput) {
          outputExceeded = true;
          child.kill();
        }
      });
      child.once('error', reject);
      child.once('close', () => {
        untrack(request.chatId, child);
        if (outputExceeded) {
          reject(new Error(`sandbox output exceeded ${maxOutput} bytes`));
          return;
        }
        try {
          resolve(processReply(request, JSON.parse(stdout) as SandboxReply));
        } catch (error) {
          reject(new Error(stderr || (error instanceof Error ? error.message : String(error))));
        }
      });
      child.stdin?.end(JSON.stringify({
        source: request.source,
        input: request.input,
        syncTimeoutMs: request.policy.timeoutMs,
      }));
    });

  const runWorker = (request: SandboxRequest): Promise<unknown> =>
    new Promise((resolve, reject) => {
      const worker = track(request.chatId, new Worker(WORKER_PROGRAM, {
        eval: true,
        workerData: {
          source: request.source,
          input: request.input,
          syncTimeoutMs: request.policy.timeoutMs,
        },
        resourceLimits: { maxOldGenerationSizeMb: request.policy.memoryMb },
      }));
      const timer = setTimeout(() => void worker.terminate(), request.policy.timeoutMs);
      worker.once('message', (reply: SandboxReply) => {
        clearTimeout(timer);
        untrack(request.chatId, worker);
        try {
          resolve(processReply(request, reply));
        } catch (error) {
          reject(error);
        }
      });
      worker.once('error', reject);
      worker.once('exit', (code) => {
        clearTimeout(timer);
        untrack(request.chatId, worker);
        if (code !== 0) reject(new Error(`sandbox worker exited with code ${code}`));
      });
    });

  const runContainer = (request: SandboxRequest): Promise<unknown> => {
    if (request.policy.network === 'allowlist') {
      return Promise.reject(new Error('container network allowlists require an external network policy adapter'));
    }

    return new Promise((resolve, reject) => {
      const command = options.containerCommand ?? 'docker';
      const args = [
        'run', '--rm', '-i', '--network=none', '--read-only',
        `--memory=${request.policy.memoryMb}m`, '--cpus=1', '--pids-limit=64',
        '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m',
      ];
      if (request.policy.filesystem !== 'none') {
        const workspace = options.workspacePath ?? process.cwd();
        args.push('--mount', `type=bind,src=${workspace},dst=/workspace${request.policy.filesystem === 'read-only' ? ',readonly' : ''}`);
      }
      if (request.policy.env !== 'none') {
        for (const key of request.policy.env) {
          if (process.env[key] !== undefined) args.push('--env', `${key}=${process.env[key]}`);
        }
      }
      args.push(options.containerImage ?? 'node:22-alpine', 'node', '--input-type=module', '--eval', SANDBOX_PROGRAM);

      const child = track(request.chatId, spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: request.policy.timeoutMs,
        windowsHide: true,
      }));
      let stdout = '';
      let stderr = '';
      child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
      child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
      child.once('error', reject);
      child.once('close', () => {
        untrack(request.chatId, child);
        try {
          resolve(processReply(request, JSON.parse(stdout) as SandboxReply));
        } catch (error) {
          reject(new Error(stderr || (error instanceof Error ? error.message : String(error))));
        }
      });
      child.stdin?.end(JSON.stringify({
        source: request.source,
        input: request.input,
        syncTimeoutMs: request.policy.timeoutMs,
      }));
    });
  };

  const closeChat = (chatId: string) => Effect.promise(async () => {
    const timer = idleTimers.get(chatId);
    if (timer) clearTimeout(timer);
    idleTimers.delete(chatId);
    const queue = queues.get(chatId);
    queues.delete(chatId);
    for (const child of children.get(chatId) ?? []) {
      if (child instanceof Worker) await child.terminate();
      else child.kill();
    }
    children.delete(chatId);
    if (queue) await (await queue).close();
  });

  return {
    execute: (request) => Effect.tryPromise({
      try: async () => {
        if (closed) throw new Error('execution sandbox is closed');
        if (!request.policy.chats) throw new Error('chat sandboxing is disabled');
        validatePolicy(request);
        const queue = queues.get(request.chatId) ?? ScopedTaskQueue.make({
          name: `sandbox.chat.${request.chatId}`,
          capacity: 64,
          concurrency: request.policy.concurrency,
          overload: 'backpressure',
          timeoutMs: request.policy.timeoutMs + 1000,
        });
        queues.set(request.chatId, queue);
        const timer = idleTimers.get(request.chatId);
        if (timer) clearTimeout(timer);

        const value = await (await queue).submit(() => {
          switch (request.policy.isolation) {
            case 'worker': return runWorker(request);
            case 'container': return runContainer(request);
            default: return runProcess(request);
          }
        });
        idleTimers.set(request.chatId, setTimeout(
          () => void Effect.runPromise(closeChat(request.chatId)),
          request.policy.idleTimeoutMs,
        ));
        return value;
      },
      catch: (cause) => new SandboxExecutionError({
        chatId: request.chatId,
        isolation: request.policy.isolation,
        cause,
      }),
    }),
    closeChat,
    close: Effect.promise(async () => {
      closed = true;
      await Promise.all([...queues.keys()].map((chatId) => Effect.runPromise(closeChat(chatId))));
    }),
  };
};
