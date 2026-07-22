import { performance } from 'node:perf_hooks';
import { Effect } from 'effect';
import { runStartupGraph } from '../packages/runtime-core/dist/index.mjs';

const phases = [
  ['transport', 70],
  ['patch-preload', 50],
  ['license-preflight', 30],
];
const task = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs));

const measure = async (run) => {
  const rssStart = process.memoryUsage.rss();
  let rssPeak = rssStart;
  const sampler = setInterval(() => {
    rssPeak = Math.max(rssPeak, process.memoryUsage.rss());
  }, 2);
  const startedAt = performance.now();
  const value = await run();
  clearInterval(sampler);
  rssPeak = Math.max(rssPeak, process.memoryUsage.rss());
  return {
    value,
    durationMs: performance.now() - startedAt,
    rssStartMb: Number((rssStart / 1024 / 1024).toFixed(1)),
    rssPeakMb: Number((rssPeak / 1024 / 1024).toFixed(1)),
    rssDeltaMb: Number(((rssPeak - rssStart) / 1024 / 1024).toFixed(1)),
  };
};

const sequentialSession = async () => {
  for (const [, durationMs] of phases) await task(durationMs);
};

const parallelSession = () => Effect.runPromise(runStartupGraph(phases.map(([id, durationMs]) => ({
  id,
  run: () => Effect.promise(() => task(durationMs)),
}))));

const sequential = await measure(sequentialSession);
const parallel = await measure(parallelSession);
const sequentialThreeSessions = await measure(async () => {
  for (let index = 0; index < 3; index += 1) await sequentialSession();
});
const parallelThreeSessions = await measure(() => Promise.all([
  parallelSession(),
  parallelSession(),
  parallelSession(),
]));

console.log(JSON.stringify({
  benchmark: 'effect-startup-independent-phases',
  singleSession: {
    before: { ...sequential, value: undefined, durationMs: Math.round(sequential.durationMs) },
    after: {
      ...parallel,
      value: undefined,
      durationMs: Math.round(parallel.durationMs),
      graphCriticalPathMs: parallel.value.criticalPathMs,
    },
    speedup: Number((sequential.durationMs / parallel.durationMs).toFixed(2)),
  },
  threeConcurrentSessions: {
    before: {
      ...sequentialThreeSessions,
      value: undefined,
      durationMs: Math.round(sequentialThreeSessions.durationMs),
    },
    after: {
      ...parallelThreeSessions,
      value: undefined,
      durationMs: Math.round(parallelThreeSessions.durationMs),
    },
    speedup: Number((sequentialThreeSessions.durationMs / parallelThreeSessions.durationMs).toFixed(2)),
  },
}, null, 2));
