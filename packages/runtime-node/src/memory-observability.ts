import type { RuntimeObservabilityShape } from '@open-wa/runtime-core';
import { Effect } from 'effect';

export const sampleMemory = (
  observability: RuntimeObservabilityShape,
  readMemoryMb: () => number | Promise<number>,
  attributes: Readonly<Record<string, string | number | boolean>> = {},
) => Effect.tryPromise(() => Promise.resolve(readMemoryMb())).pipe(
  Effect.flatMap((memoryMb) =>
    observability.gauge('session_browser_memory_mb', memoryMb, attributes),
  ),
);

export const observeMemory = (
  observability: RuntimeObservabilityShape,
  readMemoryMb: () => number | Promise<number>,
  options: {
    readonly intervalMs?: number;
    readonly attributes?: Readonly<Record<string, string | number | boolean>>;
  } = {},
) => sampleMemory(observability, readMemoryMb, options.attributes).pipe(
  Effect.andThen(Effect.sleep(options.intervalMs ?? 5_000)),
  Effect.forever(),
);
