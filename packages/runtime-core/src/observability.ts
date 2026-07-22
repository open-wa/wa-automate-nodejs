import { Effect, Layer } from 'effect';
import {
  RuntimeObservability,
  type RuntimeObservabilityShape,
  type RuntimeMetric,
} from './services.js';

export const makeInMemoryObservability = (): RuntimeObservabilityShape => {
  const values = new Map<string, number>();

  const keyFor = (
    metric: RuntimeMetric,
    attributes?: Readonly<Record<string, string | number | boolean>>,
  ) => {
    if (!attributes || Object.keys(attributes).length === 0) return metric;
    const suffix = Object.entries(attributes)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(',');
    return `${metric}{${suffix}}`;
  };

  return {
    increment: (metric, value = 1, attributes) =>
      Effect.sync(() => {
        const key = keyFor(metric, attributes);
        values.set(key, (values.get(key) ?? 0) + value);
      }),
    gauge: (metric, value, attributes) =>
      Effect.sync(() => {
        values.set(keyFor(metric, attributes), value);
      }),
    snapshot: Effect.sync(() => Object.fromEntries(values)),
  };
};

export const InMemoryObservabilityLayer = Layer.sync(
  RuntimeObservability,
  makeInMemoryObservability,
);

export const queueMetricsObserver = (observability: RuntimeObservabilityShape) => {
  let previousDropped = 0;
  let previousFailed = 0;
  let previousRateLimited = 0;
  return (metrics: {
    readonly name: string;
    readonly depth: number;
    readonly active: number;
    readonly dropped: number;
    readonly failed: number;
    readonly rateLimited: number;
  }) => {
    const attributes = { queue: metrics.name };
    Effect.runSync(Effect.all([
      observability.gauge('queue_depth', metrics.depth, attributes),
      observability.gauge('queue_active', metrics.active, attributes),
      observability.gauge('active_fibers', metrics.active, attributes),
      observability.increment('queue_drops', Math.max(0, metrics.dropped - previousDropped), attributes),
      observability.increment('queue_failures', Math.max(0, metrics.failed - previousFailed), attributes),
      observability.increment('rate_decisions', Math.max(0, metrics.rateLimited - previousRateLimited), attributes),
    ]));
    previousDropped = metrics.dropped;
    previousFailed = metrics.failed;
    previousRateLimited = metrics.rateLimited;
  };
};
