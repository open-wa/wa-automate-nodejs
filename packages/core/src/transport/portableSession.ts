import { randomUUID } from 'node:crypto';
import { Effect, Exit, Scope, Semaphore } from 'effect';
import { portableFailure, portableIO, runPortable, validatePortablePayload, type PortableSessionFailure } from './portableSessionEffects';
import type { IPage } from '@open-wa/driver-interface';
import { resolveSessionEncryption, type SessionEncryptionOptions, type SessionEncryptionCredentials } from './sessionEncryption';

/** Opaque, encrypted values. Only the baked pre-init patch interprets them. */
export interface PortableSessionPayload { auth: string; data: string }

/** A session storage handle, held until the browser has closed. */
export interface PortableSessionLease {
  read(): Promise<string | null>;
  /** Resolve only after durable storage accepts the entire replacement. */
  write(payload: string): Promise<void>;
  /** Invalidate the stored credentials after logout. */
  remove(): Promise<void>;
  release(): Promise<void>;
}

interface SessionPersistence {
  onError?(error: unknown): void;
  /** Open session storage without excluding other processes using the same session. */
  acquire(sessionId: string): Promise<PortableSessionLease>;
}

/** Host-only opaque persistence. WhatsApp owns message delivery. */
export class PortableSessionController {
  private readonly leaseScope = Scope.makeUnsafe();
  private readonly writes = Semaphore.makeUnsafe(1);
  private lease?: PortableSessionLease;
  private payload: string | null = null;
  private revision = 0;
  private documentId = '';
  private invalidated = false;
  private flushing = false;
  private releasing = false;
  private leaseCloseResult?: Exit.Exit<void, never>;
  private installAttempted = false;
  private page?: IPage;
  #encryption?: SessionEncryptionCredentials;

  get hasCheckpoint(): boolean { return this.payload !== null; }

  constructor(private readonly persistence: SessionPersistence, private readonly sessionId: string,
    private readonly encryptionOptions: SessionEncryptionOptions = {}) {}

  private serial<A>(effect: Effect.Effect<A, PortableSessionFailure>): Promise<A> {
    // These providers have a Promise contract, not cancellation support. Never free
    // the permit while an underlying filesystem/remote write can still complete.
    return runPortable(this.writes.withPermit(Effect.uninterruptible(effect)));
  }

  install(page: IPage, origin: string, script: string): Promise<void> {
    return this.serial(Effect.gen({ self: this }, function* () {
      if (this.releasing) return yield* Effect.fail(portableFailure('PORTABLE_SESSION_FENCED'));
      if (this.installAttempted) return yield* Effect.fail(portableFailure('PORTABLE_SESSION_ALREADY_INSTALLED'));
      this.installAttempted = true;
      this.page = page;
      yield* this.installEffect(page, origin, script).pipe(Effect.onExit(exit => {
        if (Exit.isSuccess(exit)) return Effect.void;
        // Installation precedes navigation. No authenticated browser can own this
        // lease yet, so a partial setup releases it immediately and fences bindings.
        this.invalidated = true;
        this.releasing = true;
        return this.closeLeaseScope(exit);
      }));
    }));
  }

  private installEffect(page: IPage, origin: string, script: string): Effect.Effect<void, PortableSessionFailure> {
    return Effect.gen({ self: this }, function* () {
      this.#encryption = yield* resolveSessionEncryption(this.encryptionOptions);
      const lease = this.lease ?? (yield* Effect.acquireRelease(
        portableIO('PORTABLE_SESSION_PROVISION_FAILED', () => this.persistence.acquire(this.sessionId)),
        lease => portableIO('PORTABLE_SESSION_RELEASE_FAILED', () => lease.release()).pipe(Effect.orDie),
      ).pipe(Scope.provide(this.leaseScope)));
      this.lease = lease;
      this.payload = yield* portableIO('PORTABLE_SESSION_PROVISION_FAILED', () => lease.read());
      this.invalidated = false;
      if (this.payload !== null) yield* validatePortablePayload(this.payload);
      if (typeof script !== 'string' || !script.trim()) return yield* Effect.fail(portableFailure('PORTABLE_SESSION_PATCH_REQUIRED'));
      const capability = randomUUID();
      const authorize = (token: unknown, documentId?: unknown) => Effect.suspend(() =>
        token !== capability || this.invalidated || this.releasing
          || (documentId !== undefined && documentId !== this.documentId)
          ? Effect.fail(portableFailure('PORTABLE_SESSION_FENCED')) : Effect.void);

      yield* portableIO('PORTABLE_SESSION_PROVISION_FAILED', () => page.exposeFunction('OpenWA_PortableBootstrap', (token: unknown) =>
        this.serial(Effect.gen({ self: this }, function* () {
          yield* authorize(token);
          if (this.flushing) return yield* Effect.fail(portableFailure('PORTABLE_SESSION_FENCED'));
          this.documentId = randomUUID();
          yield* authorize(token);
          if (this.flushing) return yield* Effect.fail(portableFailure('PORTABLE_SESSION_FENCED'));
          return { sessionId: this.sessionId, documentId: this.documentId, revision: this.revision,
            checkpoint: this.payload, mode: this.payload === null ? 'pair' : 'restore',
            encryption: this.#encryption && { key: this.#encryption.key } };
        }))));
      yield* portableIO('PORTABLE_SESSION_PROVISION_FAILED', () => page.exposeFunction('OpenWA_PortableCommit',
        (token: unknown, documentId: unknown, expected: unknown, payload: string) =>
          this.serial(Effect.gen({ self: this }, function* () {
            yield* authorize(token, documentId);
            if (expected !== this.revision) return yield* Effect.fail(portableFailure('PORTABLE_SESSION_REVISION_CONFLICT'));
            yield* validatePortablePayload(payload);
            yield* portableIO('PORTABLE_SESSION_SAVE_FAILED', () => lease.write(payload));
            this.payload = payload;
            return ++this.revision;
          }))));
      // Credentials are provisioned only to the intended top-level origin. The
      // private artifact receives keys through the lexical bridge, never on window.
      yield* portableIO('PORTABLE_SESSION_PROVISION_FAILED', () => page.addInitScript(`(() => {
        if (globalThis.top !== globalThis || globalThis.location.origin !== ${JSON.stringify(origin)}) return;
        const token = ${JSON.stringify(capability)};
        const bridge = Object.freeze({
          bootstrap: () => globalThis.OpenWA_PortableBootstrap(token),
          commit: (documentId, revision, payload) => globalThis.OpenWA_PortableCommit(token, documentId, revision, payload)
        });
        ${script}
      })();`));
    });
  }

  private currentPage(): Effect.Effect<IPage, PortableSessionFailure> {
    return Effect.suspend(() => this.page && !this.releasing
      ? Effect.succeed(this.page) : Effect.fail(portableFailure('PORTABLE_SESSION_NOT_INSTALLED')));
  }

  activate(): Promise<void> {
    // Page evaluation may call back into commit. Never hold the write permit here.
    return runPortable(Effect.gen({ self: this }, function* () {
      const page = yield* this.currentPage();
      const documentId = this.documentId;
      yield* portableIO('PORTABLE_SESSION_ACTIVATE_FAILED', () => page.evaluateScript(`(async () => {
        const runtime = globalThis.OpenWA_PortableSession;
        if (!runtime) throw new Error('PORTABLE_SESSION_PATCH_MISSING');
        await runtime.activate();
      })()`));
      if (this.invalidated || this.flushing || this.releasing || documentId !== this.documentId) {
        return yield* Effect.fail(portableFailure('PORTABLE_SESSION_FENCED'));
      }
    }));
  }

  async beginPairing(): Promise<void> {
    const revision = await this.serial(Effect.gen({ self: this }, function* () {
      if (this.lease) yield* portableIO('PORTABLE_SESSION_REMOVE_FAILED', () => this.lease!.remove().catch(error => { this.persistence.onError?.(error); }));
      this.payload = null;
      return ++this.revision;
    }));
    if (this.page) await this.page.evaluateScript(`globalThis.OpenWA_PortableSession.beginPairing(${revision})`);
  }

  /** Fence the old document immediately, retaining the storage handle and listeners. */
  preparePairing(): Promise<void> {
    this.invalidated = true;
    return this.serial(Effect.gen({ self: this }, function* () {
      if (this.releasing) return yield* Effect.fail(portableFailure('PORTABLE_SESSION_FENCED'));
      if (this.lease) yield* portableIO('PORTABLE_SESSION_REMOVE_FAILED', () => this.lease!.remove().catch(error => { this.persistence.onError?.(error); }));
      this.payload = null;
      this.documentId = '';
      this.revision++;
      this.installAttempted = false;
      this.page = undefined;
    }));
  }

  flush(): Promise<void> {
    this.flushing = true;
    return runPortable(Effect.gen({ self: this }, function* () {
      if (this.page && this.documentId && !this.invalidated && !this.releasing) {
        const page = this.page;
        yield* portableIO('PORTABLE_SESSION_FLUSH_FAILED', () => page.evaluateScript('globalThis.OpenWA_PortableSession.flush()'));
      }
    }).pipe(Effect.ensuring(this.writes.withPermit(Effect.void))));
  }

  /** Called only after the transport has confirmed browser closure. */
  release(): Promise<void> {
    this.invalidated = true;
    this.releasing = true;
    return this.serial(this.closeLeaseScope(Exit.void));
  }

  private closeLeaseScope(exit: Exit.Exit<unknown, unknown>): Effect.Effect<void, PortableSessionFailure> {
    return Effect.gen({ self: this }, function* () {
      if (!this.leaseCloseResult) this.leaseCloseResult = yield* Effect.exit(Scope.close(this.leaseScope, exit));
      // Scope.close is idempotent, including after a failed finalizer. Remember
      // that failure so a second release cannot incorrectly report success.
      if (Exit.isFailure(this.leaseCloseResult)) return yield* Effect.fail(portableFailure('PORTABLE_SESSION_RELEASE_FAILED'));
    }).pipe(Effect.ensuring(Effect.sync(() => {
      this.lease = undefined;
      this.page = undefined;
      this.payload = null;
      this.#encryption = undefined;
    })));
  }
}
