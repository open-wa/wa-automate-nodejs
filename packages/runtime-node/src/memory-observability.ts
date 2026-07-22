import type { RuntimeObservabilityShape } from '@open-wa/runtime-core';
import { execFile } from 'node:child_process';
import { Effect } from 'effect';

interface ProcessMemoryRow {
  readonly pid: number;
  readonly parentPid: number;
  readonly rssKb: number;
}

export const parseProcessMemoryRows = (output: string): ReadonlyArray<ProcessMemoryRow> =>
  output.split('\n').flatMap((line) => {
    const value = line.trim();
    if (!value) return [];
    const [pid, parentPid, rssKb] = value.split(/\s+/).map(Number);
    return Number.isFinite(pid) && Number.isFinite(parentPid) && Number.isFinite(rssKb)
      ? [{ pid: pid!, parentPid: parentPid!, rssKb: rssKb! }]
      : [];
  });

export const sumProcessTreeRssMb = (
  rootPid: number,
  rows: ReadonlyArray<ProcessMemoryRow>,
): number => {
  const included = new Set([rootPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of rows) {
      if (included.has(row.parentPid) && !included.has(row.pid)) {
        included.add(row.pid);
        changed = true;
      }
    }
  }
  const rssKb = rows.reduce(
    (total, row) => total + (included.has(row.pid) ? row.rssKb : 0),
    0,
  );
  return rssKb / 1024;
};

export const readProcessTreeRssMb = (rootPid: number): Promise<number> =>
  new Promise((resolve, reject) => {
    execFile('ps', ['-axo', 'pid=,ppid=,rss='], { maxBuffer: 4 * 1024 * 1024 }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(sumProcessTreeRssMb(rootPid, parseProcessMemoryRows(stdout)));
    });
  });

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

export const observeBrowserProcessMemory = (
  observability: RuntimeObservabilityShape,
  getBrowserProcessId: () => number | undefined,
  options: {
    readonly intervalMs?: number;
    readonly attributes?: Readonly<Record<string, string | number | boolean>>;
  } = {},
) => Effect.suspend(() => {
  const processId = getBrowserProcessId();
  return processId === undefined
    ? Effect.void
    : sampleMemory(
        observability,
        () => readProcessTreeRssMb(processId),
        { source: 'browser-process-tree-rss', ...options.attributes },
      );
}).pipe(
  Effect.andThen(Effect.sleep(options.intervalMs ?? 5_000)),
  Effect.forever(),
);
