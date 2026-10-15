import { constants } from 'node:fs';
import { open, mkdir, rename, unlink, lstat, link, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { Effect, Exit, Scope, Semaphore } from 'effect';
import type { PortableSessionLease } from './portableSession';
import { normalizePortablePayload, portableFailure, portableIO, runPortable, validatePortablePayload, type PortableSessionFailure } from './portableSessionEffects';

const missing = (error: unknown): boolean => (error as NodeJS.ErrnoException)?.code === 'ENOENT';

const codeOf = (error: unknown) => (error as NodeJS.ErrnoException)?.code;

/** Local exclusive store with automatic recovery of dead or corrupt lock owners. */
export function acquirePortableSessionFile(path: string, onRecovery?: (reason: string) => void): Promise<PortableSessionLease> {
  return runPortable(Effect.uninterruptible(Effect.gen(function* () {
    const destination = resolve(path);
    const directory = dirname(destination);
    const scope = yield* Scope.make();
    const operations = yield* Semaphore.make(1);
    let closed = false;
    let closeResult: Exit.Exit<void, never> | undefined;
    const lockPath = `${destination}.lock`;
    const owner = { pid: process.pid, host: hostname(), token: randomUUID() };
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

    const claimLock = async () => {
      // Publish complete owner metadata atomically, so another starter never
      // mistakes an owner that is still writing its metadata for a corrupt lock.
      const temporary = `${lockPath}.${owner.token}.tmp`;
      const handle = await open(temporary, 'wx', 0o600);
      try {
        await handle.writeFile(JSON.stringify(owner), 'utf8');
        await handle.sync();
        for (let attempt = 0; attempt < 3; attempt++) {
          try { await link(temporary, lockPath); return handle; }
          catch (error) { if (codeOf(error) !== 'EEXIST') throw error; }
          let previous;
          try { previous = await lstat(lockPath); }
          catch (error) { if (missing(error)) continue; throw error; }
          let live = false;
          if (previous.isFile() && previous.size <= 4096) {
            const existing = await open(lockPath, constants.O_RDONLY | constants.O_NOFOLLOW).catch(error => {
              if (missing(error)) return null;
              throw error;
            });
            if (!existing) continue;
            try {
              let value: { pid?: unknown; host?: unknown } | null = null;
              try { value = JSON.parse(await existing.readFile('utf8')); } catch { /* Corrupt lock. */ }
              if (value && Number.isSafeInteger(value.pid) && Number(value.pid) > 0 && typeof value.host === 'string') {
                live = value.host !== owner.host;
                if (!live) {
                  try { process.kill(Number(value.pid), 0); live = true; }
                  catch (error) { live = codeOf(error) !== 'ESRCH'; }
                }
              }
            } finally { await existing.close(); }
          }
          if (live) throw portableFailure('PORTABLE_SESSION_STORE_LOCKED');
          try {
            const current = await lstat(lockPath);
            if (current.dev !== previous.dev || current.ino !== previous.ino) continue;
            if (current.isDirectory()) await rm(lockPath, { recursive: true });
            else await unlink(lockPath);
            onRecovery?.('stale_session_lock_removed');
          } catch (error) { if (!missing(error)) throw error; }
        }
        throw portableFailure('PORTABLE_SESSION_STORE_LOCKED');
      } catch (error) {
        await handle.close();
        throw error;
      } finally {
        await unlink(temporary);
      }
    };

    // Keep the writer lease across browser replacement and fresh pairing.
    const acquire = Effect.gen(function* () {
      yield* io(async () => {
        try { await mkdir(directory, { recursive: true, mode: 0o700 }); }
        catch (error) {
          if (codeOf(error) !== 'EEXIST') throw error;
          const entry = await lstat(directory);
          if (entry.isDirectory()) throw error;
          await unlink(directory);
          await mkdir(directory, { recursive: true, mode: 0o700 });
          onRecovery?.('session_directory_repaired');
        }
      });
      yield* Effect.acquireRelease(
        portableIO('PORTABLE_SESSION_STORE_FAILED', claimLock),
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
      yield* io(async () => {
        try { await rename(temporary, destination); }
        catch (error) {
          if (!['EISDIR', 'ENOTEMPTY', 'EEXIST'].includes(codeOf(error) ?? '')) throw error;
          // Only the exact credential filename can be replaced recursively.
          // Other sessions and the containing directory remain untouched.
          const entry = await lstat(destination);
          if (!entry.isDirectory()) throw error;
          await rm(destination, { recursive: true });
          await rename(temporary, destination);
        }
      });
      yield* syncDirectory();
    }));

    return {
      read: () => owned(Effect.acquireUseRelease(
        io(async () => {
          try {
            if (!(await lstat(destination)).isFile()) return null;
            return await open(destination, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
          }
          catch (error) { if (missing(error) || ['ELOOP', 'EISDIR'].includes(codeOf(error) ?? '')) return null; throw error; }
        }),
        handle => Effect.gen(function* () {
          if (handle === null) return null;
          const stat = yield* io(() => handle.stat());
          if (!stat.isFile() || stat.size > 64 * 1024 * 1024) {
            return null;
          }
          const payload = yield* io(() => handle.readFile('utf8'));
          if (payload === 'LOGGED OUT') return null;
          return yield* normalizePortablePayload(payload).pipe(Effect.match({
            onFailure: () => null,
            onSuccess: value => value,
          }));
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
