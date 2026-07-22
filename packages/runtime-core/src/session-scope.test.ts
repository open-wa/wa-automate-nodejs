import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { SessionScope } from './session-scope';

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
    let releases = 0;
    await scope.addFinalizer('resource', () => {
      releases += 1;
    });

    await scope.close(reason);

    expect(releases).toBe(1);
    expect(scope.snapshot().closed).toBe(true);
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
});
