import { Effect, Exit, Scope } from 'effect';

export type SessionFinalizerReason =
  | 'auth-timeout'
  | 'browser-crash'
  | 'failure'
  | 'interruption'
  | 'normal-stop'
  | 'plugin-failure'
  | 'signal'
  | 'startup-failure';

export class SessionScope {
  private readonly finalizerNames = new Set<string>();
  private closed = false;

  private constructor(private readonly scope: Scope.Closeable) {}

  static async make(): Promise<SessionScope> {
    return new SessionScope(await Effect.runPromise(Scope.make()));
  }

  async addFinalizer(
    name: string,
    finalizer: () => void | Promise<void>,
  ): Promise<() => void> {
    if (this.closed) throw new Error('session scope is already closed');
    this.finalizerNames.add(name);
    let active = true;
    await Effect.runPromise(
      Scope.addFinalizer(
        this.scope,
        Effect.promise(async () => {
          if (!active) return;
          active = false;
          this.finalizerNames.delete(name);
          await finalizer();
        }),
      ),
    );
    return () => {
      active = false;
      this.finalizerNames.delete(name);
    };
  }

  snapshot() {
    return {
      closed: this.closed,
      finalizers: [...this.finalizerNames],
    } as const;
  }

  async fork<A, E>(effect: Effect.Effect<A, E>): Promise<void> {
    if (this.closed) throw new Error('session scope is already closed');
    await Effect.runPromise(Effect.forkIn(effect, this.scope));
  }

  async close(reason: SessionFinalizerReason = 'normal-stop'): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await Effect.runPromise(
      Scope.close(
        this.scope,
        reason === 'normal-stop'
          ? Exit.void
          : Exit.fail(new Error(`session scope closed: ${reason}`)),
      ),
    );
  }
}
