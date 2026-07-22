import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { SessionScope } from './session-scope';
import { makeInMemoryObservability } from './observability';

describe('SessionScope', () => {
  it.each([
    'normal-stop',
    'startup-failure',
    'auth-timeout',
    'browser-crash',
    'plugin-failure',
    'signal',
    'interruption',
  ] as const)('releases resources on %s', async (reason) => {
    const scope = await SessionScope.make();
    const resourceKinds = [
      'browser',
      'page',
      'process',
      'plugin',
      'queue',
      'listener',
      'timer',
    ] as const;
    const releases = new Map(resourceKinds.map((kind) => [kind, 0]));
    for (const kind of resourceKinds) {
      await scope.addFinalizer(kind, () => {
        releases.set(kind, (releases.get(kind) ?? 0) + 1);
      });
    }

    await scope.close(reason);
    await scope.close(reason);

    expect(Object.fromEntries(releases)).toEqual(Object.fromEntries(
      resourceKinds.map((kind) => [kind, 1]),
    ));
    expect(scope.snapshot().closed).toBe(true);
    expect(scope.snapshot().finalizers).toEqual([]);
  });

  it('runs finalizers in reverse acquisition order exactly once', async () => {
    const scope = await SessionScope.make();
    const finalized: string[] = [];
    await scope.addFinalizer('browser', () => {
      finalized.push('browser');
    });
    await scope.addFinalizer('plugin', () => {
      finalized.push('plugin');
    });

    await scope.close('browser-crash');
    await scope.close('normal-stop');

    expect(finalized).toEqual(['plugin', 'browser']);
    expect(scope.snapshot()).toEqual({ closed: true, finalizers: [] });
  });

  it('allows a finalizer to be removed before shutdown', async () => {
    const scope = await SessionScope.make();
    let called = false;
    const remove = await scope.addFinalizer('temporary', () => {
      called = true;
    });
    remove();

    await scope.close();
    expect(called).toBe(false);
  });

  it('interrupts daemon fibers when the session closes', async () => {
    const scope = await SessionScope.make();
    let interrupted = false;
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    await scope.fork(
      Effect.sync(markStarted).pipe(
        Effect.andThen(Effect.never),
        Effect.ensuring(Effect.sync(() => {
          interrupted = true;
        })),
      ),
    );
    await started;

    await scope.close('interruption');

    expect(interrupted).toBe(true);
  });

  it('reports actual session-owned fibers until scope interruption', async () => {
    const observability = makeInMemoryObservability();
    const scope = await SessionScope.make({
      observability,
      metricAttributes: { session: 'test-session' },
    });
    await scope.fork(Effect.never);

    await expect(Effect.runPromise(observability.snapshot)).resolves.toMatchObject({
      'active_fibers{owner=session-scope,session=test-session}': 1,
    });
    await scope.close('interruption');
    await vi.waitFor(async () => expect(
      (await Effect.runPromise(observability.snapshot))[
        'active_fibers{owner=session-scope,session=test-session}'
      ],
    ).toBe(0));
  });
});
