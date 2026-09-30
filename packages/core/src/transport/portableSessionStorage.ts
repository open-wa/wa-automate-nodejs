import { lstat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { Effect, Exit, Scope, Semaphore } from 'effect';
import type { PortableSessionLease } from './portableSession';
import { acquirePortableSessionFile } from './portableSessionFile';
import { normalizePortablePayload, portableFailure, portableIO, runPortable, validatePortablePayload, type PortableSessionFailure } from './portableSessionEffects';

export interface PortableSessionSnapshot {
  /** An existing logout marker has exists=true and payload=null. */
  exists: boolean;
  payload: string | null;
}

export interface PortableSessionRemoteLease extends Omit<PortableSessionLease, 'read'> {
  read(): Promise<PortableSessionSnapshot>;
}

export interface PortableSessionStorageOptions {
  sessionId?: string;
  sessionDataPath?: string;
  /** Encrypted pair, JSON, base64 JSON, or NUKE to explicitly invalidate it. */
  sessionData?: unknown;
  /** Disable the local copy. A durable remote provider is then required. */
  skipSessionSave?: boolean;
  acquireRemote?(filename: string): Promise<PortableSessionRemoteLease>;
}

const io = <A>(operation: () => PromiseLike<A>) => portableIO('PORTABLE_SESSION_STORE_FAILED', operation);
const exists = (path: string) => io(async () => {
  try { await lstat(path); return true; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; }
});

const filenameFor = (sessionId: string) => Effect.try({
  try: () => {
    if (!sessionId || /[\x00-\x1f\x7f/\\:*?"<>|]/.test(sessionId) || ['.', '..'].includes(sessionId)) throw new Error();
    return `${sessionId}.data.json`;
  },
  catch: () => portableFailure('PORTABLE_SESSION_CONFIG_INVALID'),
});

const pathFor = (sessionId: string, sessionDataPath = '') => Effect.gen(function* () {
  const filename = yield* filenameFor(sessionId);
  const configured = sessionDataPath === '~' ? homedir()
    : sessionDataPath.startsWith('~/') ? resolve(homedir(), sessionDataPath.slice(2)) : sessionDataPath;
  const candidate = (base: string) => configured.includes('.data.json')
    ? resolve(base, configured) : resolve(base, configured, filename);
  const primary = candidate(process.cwd());
  if (yield* exists(primary)) return primary;
  // process.argv also works in ESM, where require.main is unavailable.
  const main = typeof require !== 'undefined' ? require.main?.path : undefined;
  const entryDirectory = main ?? (process.argv[1] ? dirname(resolve(process.argv[1])) : undefined);
  if (entryDirectory) {
    const alternate = candidate(entryDirectory);
    if (alternate !== primary && (yield* exists(alternate))) return alternate;
  }
  return primary;
});

/** Resolve once, then read and write the same location, including the v4 entry-script fallback. */
export function resolvePortableSessionPath(sessionId = 'session', sessionDataPath = ''): Promise<string> {
  return runPortable(pathFor(sessionId, sessionDataPath));
}

/** Compose local persistence and an optional authoritative remote store without interpreting ciphertext. */
export function acquirePortableSessionStorage(options: PortableSessionStorageOptions = {}): Promise<PortableSessionLease> {
  return runPortable(Effect.uninterruptible(Effect.gen(function* () {
    if (options.skipSessionSave && !options.acquireRemote) {
      return yield* Effect.fail(portableFailure('PORTABLE_SESSION_DURABLE_STORE_REQUIRED'));
    }
    const sessionId = options.sessionId || 'session';
    const filename = yield* filenameFor(sessionId);
    const scope = yield* Scope.make();
    const operations = yield* Semaphore.make(1);
    let local: PortableSessionLease | undefined;
    let remote: PortableSessionRemoteLease | undefined;
    let payload: string | null = null;
    let closed = false;
    let failed = false;
    let closeResult: Exit.Exit<void, never> | undefined;
    const localPath = options.skipSessionSave ? undefined : yield* pathFor(sessionId, options.sessionDataPath);

    const provision = Effect.gen(function* () {
      if (localPath) {
        local = yield* Effect.acquireRelease(
          io(() => acquirePortableSessionFile(localPath)),
          lease => io(() => lease.release()).pipe(Effect.orDie),
        );
      }
      if (options.acquireRemote) {
        remote = yield* Effect.acquireRelease(
          io(() => options.acquireRemote!(filename)),
          lease => io(() => lease.release()).pipe(Effect.orDie),
        );
      }
      const snapshot = remote ? yield* io(() => remote!.read()) : undefined;
      const localExists = localPath ? yield* exists(localPath) : false;
      const seed = process.env[`${sessionId.toUpperCase()}_DATA_JSON`] ?? options.sessionData;
      if (seed === 'NUKE' || seed === '"NUKE"') {
        if (remote) yield* io(() => remote!.remove());
        if (local) yield* io(() => local!.remove());
        return;
      }
      // A remote checkpoint (including logout) wins over any stale local replica or seed.
      if (snapshot?.exists) {
        payload = snapshot.payload === null ? null : yield* normalizePortablePayload(snapshot.payload);
      } else if (local && localExists) {
        payload = yield* io(() => local!.read());
      } else if (seed !== undefined) {
        payload = yield* normalizePortablePayload(seed);
      }
      if (payload !== null) {
        yield* validatePortablePayload(payload);
        if (remote && !snapshot?.exists) yield* io(() => remote!.write(payload!));
        if (local) yield* io(() => local!.write(payload!));
      } else {
        if (remote && !snapshot?.exists && localExists) yield* io(() => remote!.remove());
        if (snapshot?.exists && local) yield* io(() => local!.remove());
      }
    }).pipe(Scope.provide(scope));
    yield* provision.pipe(Effect.onExit(exit => Exit.isFailure(exit) ? Scope.close(scope, exit) : Effect.void));

    const owned = <A>(effect: Effect.Effect<A, PortableSessionFailure>) => runPortable(
      operations.withPermit(Effect.uninterruptible(Effect.suspend(() => closed || failed
        ? Effect.fail(portableFailure('PORTABLE_SESSION_STORE_CLOSED')) : effect))),
    );
    const mutation = (effect: Effect.Effect<void, PortableSessionFailure>) => owned(effect.pipe(
      Effect.tapError(() => Effect.sync(() => { failed = true; })),
    ));
    return {
      read: () => owned(Effect.sync(() => payload)),
      write: next => mutation(Effect.gen(function* () {
        yield* validatePortablePayload(next);
        if (remote) yield* io(() => remote!.write(next));
        if (local) yield* io(() => local!.write(next));
        payload = next;
      })),
      remove: () => mutation(Effect.gen(function* () {
        if (remote) yield* io(() => remote!.remove());
        if (local) yield* io(() => local!.remove());
        payload = null;
      })),
      release: () => {
        closed = true;
        return runPortable(operations.withPermit(Effect.uninterruptible(Effect.gen(function* () {
          if (!closeResult) closeResult = yield* Effect.exit(Scope.close(scope, Exit.void));
          if (Exit.isFailure(closeResult)) return yield* Effect.fail(portableFailure('PORTABLE_SESSION_RELEASE_FAILED'));
        }))));
      },
    } satisfies PortableSessionLease;
  })));
}
