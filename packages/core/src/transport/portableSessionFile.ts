import { constants } from 'node:fs';
import { open, mkdir, rename, unlink, lstat, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Effect, Semaphore } from 'effect';
import type { PortableSessionLease } from './portableSession';
import { normalizePortablePayload, portableFailure, portableIO, runPortable, validatePortablePayload, type PortableSessionFailure } from './portableSessionEffects';

const missing = (error: unknown): boolean => (error as NodeJS.ErrnoException)?.code === 'ENOENT';

const codeOf = (error: unknown) => (error as NodeJS.ErrnoException)?.code;

/** Shared local store: another process can open the same session immediately. */
export function acquirePortableSessionFile(path: string, onRecovery?: (reason: string) => void): Promise<PortableSessionLease> {
  return runPortable(Effect.uninterruptible(Effect.gen(function* () {
    const destination = resolve(path);
    const directory = dirname(destination);
    const operations = yield* Semaphore.make(1);
    let closed = false;
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
        // Stop this handle's queued/new operations and let its current IO settle.
        closed = true;
        return runPortable(operations.withPermit(Effect.void));
      },
    } satisfies PortableSessionLease;
  })));
}
