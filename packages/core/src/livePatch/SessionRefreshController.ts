import { randomUUID } from 'node:crypto';
import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { SessionRefreshOptions, SessionRefreshSnapshot, SessionRefreshResult } from '@open-wa/schema';
import type { SessionManager } from '../sessionmanager';
import type { OpenWAEventMap } from '../events/eventMap';
import type { Transport, LivePatchPreloadResult, LicensePreloadResult, SessionDebugInfo } from '../transport/Transport';
import { installDocumentRuntime } from './installDocument';

export class SessionRefreshRequestError extends Error {
  constructor(readonly code: string, readonly status: number, message: string) { super(message); }
}

/** Session-owned single-flight coordinator, adapted from the existing live-patch implementation. */
export class SessionRefreshController {
  private current: Promise<SessionRefreshResult> | null = null;
  private candidateKey?: string;
  private effectiveKey?: string;
  private stopped = false;
  private installedPatches: LivePatchPreloadResult | null = null;
  private authResume: Promise<void> | null = null;
  private authCandidate?: string;
  private snapshot: SessionRefreshSnapshot = {
    operationId: null, reason: 'manual_refresh', phase: 'idle', running: false,
    startedAt: null, finishedAt: null, patchTag: null, runtimeUsable: false, restored: false, error: null,
  };
  constructor(private readonly options: { transport: Transport; session: SessionManager; events: HyperEmitter<OpenWAEventMap>; sessionId: string; logger: Logger }) {
    options.transport.setRuntimeRefreshHandler(() => this.refresh());
  }
  getStatus(): SessionRefreshSnapshot {
    const runtimeUsable = (!this.snapshot.running || this.snapshot.phase === 'preparing')
      && this.options.session.getReadinessSnapshot(this.options.transport.getOperationalReadinessSnapshot()).ready;
    return { ...this.snapshot, runtimeUsable, patchTag: this.snapshot.patchTag ?? this.options.transport.getActiveLivePatchPreload()?.tag ?? null,
      error: this.snapshot.error && { ...this.snapshot.error } };
  }
  stop(): void { this.stopped = true; }
  private ensureActive(): void {
    if (this.stopped || this.options.session.getState() === 'STOPPED') throw new Error('SESSION_REFRESH_STOPPED');
  }
  request(options: SessionRefreshOptions = {}): { operationId: string } {
    if (!options || typeof options !== 'object' || Array.isArray(options)
      || Object.keys(options).some(key => key !== 'licenseKey')
      || (options.licenseKey !== undefined && (typeof options.licenseKey !== 'string' || !options.licenseKey.trim() || options.licenseKey.length > 2048))) {
      throw new SessionRefreshRequestError('INVALID_REFRESH_REQUEST', 400, 'Provide a non-empty license key or omit it.');
    }
    const candidate = options.licenseKey?.trim();
    if (this.current || this.authResume) {
      if (candidate !== (this.authResume ? this.authCandidate : this.candidateKey)) throw new SessionRefreshRequestError('SESSION_REFRESH_BUSY', 409, 'Another session refresh is in progress.');
      return { operationId: this.snapshot.operationId! };
    }
    this.ensureActive();
    const { transport, session } = this.options;
    if (!transport.getPage() || !['READY', 'DISCONNECTED'].includes(session.getState())) {
      throw new SessionRefreshRequestError('SESSION_NOT_READY', 409, 'Refresh requires a ready authenticated session.');
    }
    this.options.logger.warn('Warning: refreshing reloads WhatsApp. You may miss messages during the refresh.');
    this.candidateKey = candidate;
    this.snapshot = { operationId: randomUUID(), reason: candidate === undefined ? 'manual_refresh' : 'license_activation',
      phase: 'preparing', running: true, startedAt: Date.now(), finishedAt: null,
      patchTag: transport.getActiveLivePatchPreload()?.tag ?? null, runtimeUsable: true, restored: false, error: null };
    // Defer work so acceptance always precedes installation and concurrent callers see ownership.
    this.current = Promise.resolve().then(() => this.run(candidate)).finally(() => { this.current = null; this.candidateKey = undefined; });
    this.publish();
    return { operationId: this.snapshot.operationId! };
  }
  async refresh(options: SessionRefreshOptions = {}): Promise<SessionRefreshResult> {
    this.request(options);
    return this.current ?? this.getStatus();
  }
  private publish(): void {
    // A user listener must not turn a completed durable handoff into a failed operation.
    try { this.options.events.emit('session.refresh.progress', { ctx: { correlationId: this.snapshot.operationId!, ts: Date.now() }, refresh: this.getStatus() }); } catch { /* Operation ownership remains here. */ }
  }
  private phase(phase: SessionRefreshSnapshot['phase']): void {
    this.ensureActive();
    this.snapshot.phase = phase;
    if (phase !== 'preparing') this.snapshot.runtimeUsable = false;
    this.publish();
  }
  private async license(key: string | undefined, account: SessionDebugInfo): Promise<LicensePreloadResult> {
    return this.options.transport.preloadLicenseArtifact({ sessionId: this.options.sessionId, licenseKey: key, sessionInfo: account, strict: true });
  }
  private async install(patches: LivePatchPreloadResult, expected: SessionDebugInfo, key?: string): Promise<boolean> {
    const { transport, session } = this.options;
    this.ensureActive();
    this.phase('reloading');
    session.resetRuntime();
    await session.setState('STARTING', 'session_refresh');
    await transport.reloadPage();
    this.ensureActive();
    if (!(await transport.waitForInjectableSession())) throw new Error('SESSION_REFRESH_NEEDS_AUTH');
    if (!(await transport.injectWapi({ reuseCachedPatches: false }))) throw new Error('SESSION_REFRESH_INJECTION_FAILED');
    if (!(await transport.reconcilePostAuthRuntime({ freshAuth: false })).ripeSessionLoaded || !(await transport.waitForStoreMsg())) throw new Error('SESSION_REFRESH_NEEDS_AUTH');
    this.phase('installing');
    const documentId = transport.getDocumentGeneration().documentId;
    const current = await transport.getSessionDebugInfo();
    if (current.WA_VERSION !== expected.WA_VERSION) patches = await transport.preloadLivePatchArtifacts({ sessionInfo: current, fresh: true });
    if (patches.blockingFailure) throw new Error('SESSION_REFRESH_PATCH_DOWNLOAD_FAILED');
    const result = await installDocumentRuntime(transport, patches, async () => {
      this.ensureActive();
      if (transport.getDocumentGeneration().documentId !== documentId) throw new Error('SESSION_REFRESH_DOCUMENT_CHANGED');
      const account = await transport.getSessionDebugInfo();
      if (!account.hostNumber || account.hostNumber !== expected.hostNumber) throw new Error('SESSION_REFRESH_ACCOUNT_CHANGED');
      return this.license(key, account);
    });
    this.ensureActive();
    const validation = await transport.validateRuntimeUsability('post_overlay');
    if (transport.getDocumentGeneration().documentId !== documentId) throw new Error('SESSION_REFRESH_DOCUMENT_CHANGED');
    if (!validation.usable) throw new Error('SESSION_REFRESH_RUNTIME_UNAVAILABLE');
    session.updateReadiness('runtimeUsable', 'satisfied', 'Refreshed document is usable');
    session.updateReadiness('patchLifecycle', 'satisfied', 'Public patches and initialization installed');
    session.updateReadiness('licenseLifecycle', result.licenseCheck.status === 'valid' ? 'satisfied' : 'non_blocking', result.licenseCheck.detail);
    transport.completeRuntimeReplacement();
    const operational = await transport.waitForOperationalReadiness();
    this.ensureActive();
    session.setFinalization('ready', 'Refreshed document is operational');
    if (!session.getReadinessSnapshot(operational).exposureSafe) throw new Error('SESSION_REFRESH_READINESS_BLOCKED');
    await session.setState('READY', 'session_refresh_complete');
    this.ensureActive();
    this.snapshot.patchTag = patches.tag;
    return !key || (result.licenseApply?.status === 'valid' && result.licenseApply.applied === true);
  }
  private completeInstallation(key: string | undefined, previousKey: string | undefined, licenseAccepted: boolean): void {
    this.effectiveKey = licenseAccepted ? key : previousKey;
    this.options.transport.commitEffectiveLicenseKey(this.effectiveKey);
    this.installedPatches = this.options.transport.getActiveLivePatchPreload();
    this.snapshot.phase = licenseAccepted ? 'ready' : 'failed';
    this.snapshot.runtimeUsable = true;
    this.snapshot.error = licenseAccepted ? null : {
      code: 'SESSION_REFRESH_LICENSE_REJECTED',
      message: 'The license could not be applied. The session is ready with public functionality; check the key and try again.',
    };
  }
  private async run(candidate?: string): Promise<SessionRefreshResult> {
    const { transport, session } = this.options;
    const previous = this.installedPatches ?? transport.getActiveLivePatchPreload();
    const previousKey = this.effectiveKey ?? transport.getEffectiveLicenseKey();
    const key = candidate ?? previousKey;
    let navigated = false;
    let account: SessionDebugInfo | undefined;
    let expectedDocument: string | null = null;
    let preparedPatches: LivePatchPreloadResult | null = null;
    try {
      account = await transport.getSessionDebugInfo();
      expectedDocument = transport.getDocumentGeneration().documentId;
      if (!account.hostNumber || !/\d/.test(account.hostNumber)) throw new Error('SESSION_REFRESH_ACCOUNT_UNAVAILABLE');
      const patches = await transport.preloadLivePatchArtifacts({ sessionInfo: account, fresh: true });
      preparedPatches = patches;
      this.ensureActive();
      if (patches.blockingFailure || patches.source !== 'remote') throw new Error('SESSION_REFRESH_PATCH_DOWNLOAD_FAILED');
      let licenseAccepted = false;
      await transport.runPlannedRuntimeMutation(async () => {
        this.ensureActive();
        if (transport.getDocumentGeneration().documentId !== expectedDocument) throw new Error('SESSION_REFRESH_DOCUMENT_CHANGED');
        navigated = true;
        licenseAccepted = await this.install(patches, account!, key);
      });
      this.ensureActive();
      this.completeInstallation(key, previousKey, licenseAccepted);
    } catch (error) {
      const code = error instanceof Error && /^SESSION_REFRESH_[A-Z_]+$/.test(error.message) ? error.message : 'SESSION_REFRESH_FAILED';
      this.snapshot.error = { code, message: this.message(code) };
      if (!this.stopped && !navigated) {
        this.snapshot.runtimeUsable = session.getReadinessSnapshot(transport.getOperationalReadinessSnapshot()).ready;
      } else if (!this.stopped && previous && account && code !== 'SESSION_REFRESH_ACCOUNT_CHANGED' && code !== 'SESSION_REFRESH_NEEDS_AUTH') {
        try {
          this.phase('restoring');
          await transport.runPlannedRuntimeMutation(async () => {
            await this.install(previous, account!, previousKey);
          });
          this.snapshot.restored = true; this.snapshot.runtimeUsable = true;
        } catch { this.snapshot.runtimeUsable = false; }
      }
      this.effectiveKey = previousKey;
      transport.commitEffectiveLicenseKey(previousKey);
      this.installedPatches = previous;
      if (navigated && !this.snapshot.runtimeUsable && !this.stopped) {
        session.setFinalization('failed', 'Refresh could not restore the expected runtime');
        await session.setState('DISCONNECTED', 'session_refresh_failed');
      }
      this.snapshot.phase = code === 'SESSION_REFRESH_NEEDS_AUTH' ? 'needs_auth' : 'failed';
      if (code === 'SESSION_REFRESH_NEEDS_AUTH' && preparedPatches && account && !this.stopped) {
        const operationId = this.snapshot.operationId;
        const target = { patches: preparedPatches, account, key };
        this.authCandidate = candidate;
        this.authResume = new Promise<void>(resolve => setTimeout(resolve, 0)).then(async () => {
          if (this.stopped || this.snapshot.operationId !== operationId) return;
          await this.resumeAfterPairing(target);
        }).finally(() => { this.authResume = null; this.authCandidate = undefined; });
      }
    } finally {
      this.snapshot.running = this.authResume !== null && !this.stopped;
      this.snapshot.finishedAt = this.snapshot.running ? null : Date.now();
      this.publish();
    }
    return this.getStatus();
  }
  private async resumeAfterPairing(target: { patches: LivePatchPreloadResult; account: SessionDebugInfo; key?: string }): Promise<void> {
    const { transport, session } = this.options;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await transport.runPlannedRuntimeMutation(async () => {
        const auth = await Promise.race([transport.waitForAuthentication(), new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('SESSION_REFRESH_NEEDS_AUTH')), 120_000);
        })]);
        clearTimeout(timer);
        this.ensureActive();
        if (auth.outcome !== 'authenticated') return;
        this.snapshot.running = true; this.snapshot.finishedAt = null; this.snapshot.error = null;
        const previousKey = this.effectiveKey ?? transport.getEffectiveLicenseKey();
        const licenseAccepted = await this.install(target.patches, target.account, target.key);
        this.completeInstallation(target.key, previousKey, licenseAccepted);
      });
    } catch {
      if (!this.stopped) {
        this.snapshot.phase = 'needs_auth'; this.snapshot.runtimeUsable = false;
        this.snapshot.error = { code: 'SESSION_REFRESH_NEEDS_AUTH', message: 'Pairing or restoration could not finish. Read session readiness before refreshing again.' };
        session.setFinalization('failed', 'Pairing did not restore the requested runtime');
      }
    } finally {
      clearTimeout(timer); transport.stopQrWatcher();
      this.snapshot.running = false; this.snapshot.finishedAt = Date.now(); this.publish();
    }
  }
  private message(code: string): string {
    if (code === 'SESSION_REFRESH_NEEDS_AUTH') return 'The refreshed page needs pairing. Reconnect using the session QR code.';
    if (code === 'SESSION_REFRESH_ACCOUNT_CHANGED') return 'The connected account changed. Licensed code was not installed.';
    return 'Refresh could not complete. Check session readiness before retrying.';
  }
}
