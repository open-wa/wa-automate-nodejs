import { Effect, Layer, Semaphore } from 'effect';
import { SessionAdmissionError } from './errors.js';
import {
  SessionAdmission,
  type SessionAdmissionShape,
  type RuntimeObservabilityShape,
} from './services.js';

export interface SessionAdmissionOptions {
  readonly memoryCapacityMb: number;
  readonly maxConcurrentLaunches: number;
  readonly observability?: RuntimeObservabilityShape;
}

export const makeSessionAdmission = (
  options: SessionAdmissionOptions,
): Effect.Effect<SessionAdmissionShape> =>
  Effect.gen(function* () {
    const memory = yield* Semaphore.make(options.memoryCapacityMb);
    const launches = yield* Semaphore.make(options.maxConcurrentLaunches);
    let activeSessions = 0;
    let availableMemoryMb = options.memoryCapacityMb;

    return {
      acquire: (memoryMb) =>
        Effect.gen(function* () {
          if (memoryMb > options.memoryCapacityMb) {
            return yield* Effect.fail(
              new SessionAdmissionError({
                requestedMemoryMb: memoryMb,
                availableMemoryMb,
              }),
            );
          }
          yield* Semaphore.take(memory, memoryMb);
          yield* Semaphore.take(launches, 1);
          availableMemoryMb -= memoryMb;
          activeSessions += 1;
          if (options.observability) {
            yield* options.observability.gauge(
              'session_browser_memory_mb',
              options.memoryCapacityMb - availableMemoryMb,
            );
          }
          let released = false;
          return {
            memoryMb,
            release: Effect.suspend(() => {
              if (released) return Effect.void;
              released = true;
              activeSessions = Math.max(0, activeSessions - 1);
              availableMemoryMb = Math.min(
                options.memoryCapacityMb,
                availableMemoryMb + memoryMb,
              );
              return Effect.all([
                Semaphore.release(memory, memoryMb),
                Semaphore.release(launches, 1),
                ...(options.observability
                  ? [options.observability.gauge(
                      'session_browser_memory_mb',
                      options.memoryCapacityMb - availableMemoryMb,
                    )]
                  : []),
              ]).pipe(Effect.asVoid);
            }),
          };
        }),
      snapshot: Effect.sync(() => ({
        capacityMemoryMb: options.memoryCapacityMb,
        availableMemoryMb,
        activeSessions,
      })),
    };
  });

export const sessionAdmissionLayer = (options: SessionAdmissionOptions) =>
  Layer.effect(SessionAdmission, makeSessionAdmission(options));
