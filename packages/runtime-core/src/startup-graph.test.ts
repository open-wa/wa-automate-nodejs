import { Deferred, Effect, Exit, Fiber } from 'effect';
import { describe, expect, it } from 'vitest';
import { StartupGraphError } from './errors.js';
import { runStartupGraph, validateStartupGraph } from './startup-graph.js';

describe('startup graph', () => {
  it('starts independent nodes concurrently and waits for dependencies', async () => {
    const program = Effect.gen(function* () {
      const firstStarted = yield* Deferred.make<void>();
      const secondStarted = yield* Deferred.make<void>();
      const release = yield* Deferred.make<void>();
      const graph = yield* Effect.forkChild(
        runStartupGraph([
          {
            id: 'first',
            run: () => Deferred.succeed(firstStarted, undefined).pipe(
              Effect.andThen(Deferred.await(release)),
              Effect.as('one'),
            ),
          },
          {
            id: 'second',
            run: () => Deferred.succeed(secondStarted, undefined).pipe(
              Effect.andThen(Deferred.await(release)),
              Effect.as('two'),
            ),
          },
          {
            id: 'dependent',
            dependsOn: ['first', 'second'],
            run: (completed) => Effect.succeed(
              `${completed.get('first')}:${completed.get('second')}`,
            ),
          },
        ]),
      );

      yield* Deferred.await(firstStarted);
      yield* Deferred.await(secondStarted);
      yield* Deferred.succeed(release, undefined);
      return yield* Fiber.join(graph);
    });

    const result = await Effect.runPromise(program);
    expect(result.values.get('dependent')).toBe('one:two');
    expect(result.phases.map((phase) => phase.id)).toEqual([
      'first',
      'second',
      'dependent',
    ]);
  });

  it('rejects cycles before running any nodes', async () => {
    const exit = await Effect.runPromise(
      Effect.exit(
        validateStartupGraph([
          { id: 'a', dependsOn: ['b'], run: () => Effect.void },
          { id: 'b', dependsOn: ['a'], run: () => Effect.void },
        ]),
      ),
    );

    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(exit.cause.toString()).toContain(StartupGraphError.name);
    }
  });
});
