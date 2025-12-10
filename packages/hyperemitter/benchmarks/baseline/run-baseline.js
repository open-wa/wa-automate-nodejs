#!/usr/bin/env node
/**
 * Baseline benchmark runner for competitor event emitters.
 * Captures exact-match (3 args) and wildcard (if supported) throughput.
 * Designed to run before HyperEmitter lands, producing JSON baselines for regression checks.
 */

const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const args = process.argv.slice(2);
const ciMode = args.includes('--ci');
const iterationsArg = getArgValue(args, '--iterations');
const outputArg = getArgValue(args, '--output');

const ITERATIONS = iterationsArg ? Number(iterationsArg) : 500_000;
const WARMUP = 20_000;

const OUT_DIR = path.join(__dirname, 'results');
const OUT_FILE =
  outputArg ||
  path.join(OUT_DIR, `baseline-node-${process.versions.node}.json`);

ensureDir(OUT_DIR);

const competitors = [
  {
    name: 'node:events',
    supportsWildcard: false,
    setupExact: () => {
      const { EventEmitter } = require('node:events');
      const emitter = new EventEmitter();
      const handler = noop;
      emitter.on('test.event', handler);
      return () => emitter.emit('test.event', 1, 2, 3);
    }
  },
  {
    name: 'eventemitter3',
    module: 'eventemitter3',
    supportsWildcard: false,
    setupExact: (mod) => {
      const emitter = new mod();
      const handler = noop;
      emitter.on('test.event', handler);
      return () => emitter.emit('test.event', 1, 2, 3);
    }
  },
  {
    name: 'eventemitter2',
    module: 'eventemitter2',
    supportsWildcard: true,
    setupExact: (mod) => {
      const emitter = new mod();
      const handler = noop;
      emitter.on('test.event', handler);
      return () => emitter.emit('test.event', 1, 2, 3);
    },
    setupWildcard: (mod) => {
      const emitter = new mod({ wildcard: true, delimiter: '.' });
      const handler = noop;
      emitter.on('a.**', handler); // multi-level wildcard
      return () => emitter.emit('a.b.c', 1, 2, 3);
    }
  },
  {
    name: 'emittery',
    module: 'emittery',
    supportsWildcard: true,
    setupExact: (mod) => {
      const emitter = new mod();
      const handler = noop;
      emitter.on('test.event', handler);
      return () => emitter.emit('test.event', { args: [1, 2, 3] });
    },
    setupWildcard: (mod) => {
      const emitter = new mod();
      const handler = noop;
      emitter.on('a.*', handler);
      return () => emitter.emit('a.b', { args: [1, 2, 3] });
    }
  },
  {
    name: 'mitt',
    module: 'mitt',
    supportsWildcard: false,
    setupExact: (mod) => {
      const emitter = mod.default ? mod.default() : mod();
      const handler = noop;
      emitter.on('test.event', handler);
      return () => emitter.emit('test.event', { args: [1, 2, 3] });
    }
  },
  {
    name: 'tseep',
    module: 'tseep',
    supportsWildcard: false,
    setupExact: (mod) => {
      const emitter = new mod();
      const handler = noop;
      emitter.on('test.event', handler);
      return () => emitter.emit('test.event', 1, 2, 3);
    }
  }
];

const results = {
  meta: {
    nodeVersion: process.versions.node,
    date: new Date().toISOString(),
    iterations: ITERATIONS,
    warmup: WARMUP
  },
  exact: {},
  wildcard: {}
};

for (const competitor of competitors) {
  const mod = competitor.module ? tryRequire(competitor.module) : null;
  if (competitor.module && !mod) {
    results.exact[competitor.name] = skip('module not installed');
    if (competitor.supportsWildcard) {
      results.wildcard[competitor.name] = skip('module not installed');
    }
    continue;
  }

  // Exact match benchmark
  if (competitor.setupExact) {
    const runner = competitor.setupExact(mod);
    results.exact[competitor.name] = runBenchmark(runner);
  } else {
    results.exact[competitor.name] = skip('no exact benchmark');
  }

  // Wildcard benchmark
  if (competitor.supportsWildcard && competitor.setupWildcard) {
    const runner = competitor.setupWildcard(mod);
    results.wildcard[competitor.name] = runBenchmark(runner);
  } else if (competitor.supportsWildcard) {
    results.wildcard[competitor.name] = skip('no wildcard benchmark');
  }
}

fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));

if (!ciMode) {
  console.log('Baseline benchmarks complete.');
  console.log(`Saved to: ${OUT_FILE}`);
  console.table(formatTable(results.exact, 'exact ops/sec'));
  if (Object.keys(results.wildcard).length) {
    console.table(formatTable(results.wildcard, 'wildcard ops/sec'));
  }
}

function runBenchmark(fn) {
  // Warmup
  for (let i = 0; i < WARMUP; i++) {
    fn();
  }

  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    fn();
  }
  const end = performance.now();

  const durationMs = end - start;
  const opsPerSec = (ITERATIONS / durationMs) * 1000;
  const nsPerOp = (durationMs * 1_000_000) / ITERATIONS;

  return {
    opsPerSec,
    nsPerOp,
    durationMs
  };
}

function tryRequire(name) {
  try {
    return require(name);
  } catch (err) {
    if (!ciMode) {
      console.warn(`Skipping ${name}: ${err.message}`);
    }
    return null;
  }
}

function skip(reason) {
  return { skipped: true, reason };
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function getArgValue(argv, key) {
  const idx = argv.indexOf(key);
  if (idx === -1) return undefined;
  return argv[idx + 1];
}

function formatTable(map, label) {
  const table = {};
  for (const [name, result] of Object.entries(map)) {
    table[name] = result.skipped
      ? result.reason
      : `${result.opsPerSec.toFixed(2)} ops/s (${result.nsPerOp.toFixed(2)} ns/op)`;
  }
  return table;
}

function noop() {}
