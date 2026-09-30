import { constants } from 'node:fs';
import { open, mkdir, rename, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Effect, Exit, Scope, Semaphore } from 'effect';
import type { PortableSessionLease } from './portableSession';
import { normalizePortablePayload, portableFailure, portableIO, runPortable, validatePortablePayload, type PortableSessionFailure } from './portableSessionEffects';

const missing = (error: unknown): boolean => (error as NodeJS.ErrnoException)?.code === 'ENOENT';

/** Local exclusive store. A stale lock is deliberately not stolen automatically. */
export function acquirePortableSessionFile(path: string): Promise<PortableSessionLease> {
  return runPortable(Effect.uninterruptible(Effect.gen(function* () {
    const destination = resolve(path);
    const directory = dirname(destination);
    const scope = yield* Scope.make();
    const operations = yield* Semaphore.make(1);
    let closed = false;
    let closeResult: Exit.Exit<void, never> | undefined;
    const lockPath = `${destination}.lock`;
    const io = <A>(operation: () => PromiseLike<A>) => portableIO('PORTABLE_SESSION_STORE_FAILED', operation);
    const removeIfPresent = (file: string) => io(async () => {
      try { await unlink(file); } catch (error) { if (!missing(error)) throw error; }
    });
    const syncDirectory = () => Effect.acquireUseRelease(
      io(() => open(directory, constants.O_RDONLY)),
      handle => io(() => handle.sync()),
      handle => io(() => handle.close()),
    );
    const owned = <A>(effect: Effect.Effect<A, PortableSessionFailure>): Promise<A> => runPortable(
      operations.withPermit(Effect.uninterruptible(Effect.suspend(() => closed
        ? Effect.fail(portableFailure('PORTABLE_SESSION_STORE_CLOSED')) : effect))),
    );

    // The scope owns the lock across Promise calls; each operation separately
    // brackets its handles. An acquisition failure never unlinks another owner's lock.
    const acquire = Effect.gen(function* () {
      yield* io(() => mkdir(directory, { recursive: true, mode: 0o700 }));
      yield* Effect.acquireRelease(
        Effect.tryPromise({
          try: () => open(lockPath, 'wx', 0o600),
          catch: error => portableFailure((error as NodeJS.ErrnoException)?.code === 'EEXIST'
            ? 'PORTABLE_SESSION_STORE_LOCKED' : 'PORTABLE_SESSION_STORE_FAILED'),
        }),
        handle => Effect.gen(function* () {
          // If close fails, keep the lock instead of admitting a second writer.
          yield* portableIO('PORTABLE_SESSION_RELEASE_FAILED', () => handle.close());
          yield* portableIO('PORTABLE_SESSION_RELEASE_FAILED', () => unlink(lockPath));
        }).pipe(Effect.orDie),
      );
    }).pipe(Scope.provide(scope));
    yield* acquire.pipe(Effect.onExit(exit => Exit.isFailure(exit) ? Scope.close(scope, exit) : Effect.void));

    const replace = (payload: string) => Effect.scoped(Effect.gen(function* () {
      const temporary = `${destination}.${randomUUID()}.tmp`;
      yield* Effect.acquireUseRelease(
        io(() => open(temporary, 'wx', 0o600)),
        handle => Effect.gen(function* () {
          yield* Effect.addFinalizer(() => removeIfPresent(temporary).pipe(Effect.orDie));
          yield* io(() => handle.writeFile(payload, 'utf8'));
          yield* io(() => handle.sync());
        }),
        handle => io(() => handle.close()),
      );
      yield* io(() => rename(temporary, destination));
      yield* syncDirectory();
    }));

    return {
      read: () => owned(Effect.acquireUseRelease(
        io(async () => {
          try { return await open(destination, constants.O_RDONLY | constants.O_NOFOLLOW); }
          catch (error) { if (missing(error)) return null; throw error; }
        }),
        handle => Effect.gen(function* () {
          if (handle === null) return null;
          const stat = yield* io(() => handle.stat());
          if (!stat.isFile() || stat.size > 64 * 1024 * 1024) {
            return yield* Effect.fail(portableFailure('PORTABLE_SESSION_PAYLOAD_INVALID'));
          }
          const payload = yield* io(() => handle.readFile('utf8'));
          if (payload === 'LOGGED OUT') return null;
          return yield* normalizePortablePayload(payload);
        }),
        handle => handle === null ? Effect.void : io(() => handle.close()),
      )),
      write: payload => owned(Effect.gen(function* () {
        yield* validatePortablePayload(payload);
        yield* replace(payload);
      })),
      // Keep a credential-free marker so a stale configured seed cannot resurrect logout.
      remove: () => owned(replace('LOGGED OUT')),
      release: () => {
        // Fence queued/new operations immediately, but let the current IO settle
        // before releasing the lock. Retain failed finalization across repeated calls.
        closed = true;
        return runPortable(operations.withPermit(Effect.uninterruptible(Effect.gen(function* () {
          if (!closeResult) closeResult = yield* Effect.exit(Scope.close(scope, Exit.void));
          if (Exit.isFailure(closeResult)) return yield* Effect.fail(portableFailure('PORTABLE_SESSION_RELEASE_FAILED'));
        }))));
      },
    } satisfies PortableSessionLease;
  })));
}
