import { Data, Effect, Schema } from 'effect';
import type { IPage } from '@open-wa/driver-interface';
import type { Logger } from '@open-wa/logger';
import { SessionScope, ScopedTaskQueue } from '@open-wa/runtime-core';
import { DEFAULT_MIC, DEFAULT_SPEAKER, DEFAULT_CAM, MediaDescriptorSchema, CallMediaOptionsSchema, describeCallMediaFailure } from '@open-wa/schema';
import type { CallActionResult, CallCapabilities, CallEndReason, CallIdentity, CallMediaOptions, CallingOptions, CallSnapshot } from '@open-wa/schema';
import { runToPromise } from '../effect/errors';
import type { AudioFrame, CallMediaHost, CallingProviderEvent, CallingProviderInfo, PreparedCallMedia } from './ports';
import { RemoteMediaReservation, type RemoteMediaRequest, type RemoteAudioConnection } from './RemoteMedia';

const LICENSE_MESSAGE = 'Calling needs a calling-enabled license. Set licenseKey or --license-key.';
class CallingFailure extends Data.TaggedError('CallingFailure')<{ code: string; message: string; status: number; outcome?: 'unavailable' | 'failed' | 'unknown' }> {}
type Attachment = { id: string; scope: SessionScope; media: PreparedCallMedia; options: CallMediaOptions; receiveQueue: ScopedTaskQueue; started?: boolean; remoteId?: string; };

export class CallingService {
  private licensed = false;
  private provider?: CallingProviderInfo;
  private active: CallSnapshot | null = null;
  private generation = '';
  private bindingPages = new WeakSet<IPage>();
  private attachment?: Attachment;
  private pending?: Attachment;
  private writing = false;
  private expiryTimer?: ReturnType<typeof setTimeout>;
  private seenIncoming = new Set<string>();
  private remotes = new Map<string, RemoteMediaReservation>();
  private warnedListeners = new Set<string>();
  private observers = new Map<string, { attachment: Attachment; queue: ScopedTaskQueue; call: CallIdentity }>();
  private stateQueue?: ScopedTaskQueue;
  private reconciling = false;
  private ending?: { callId: string; reason: CallEndReason };

  constructor(private readonly options: {
    sessionId: string; logger: Logger; config?: CallingOptions; mediaHost?: CallMediaHost;
    page: () => IPage | null; generation: () => string;
    emit: (type: 'incoming' | 'state', snapshot: CallSnapshot) => void;
  }) {}

  /** Called only after normal server-confirmed licence patch application. */
  async install(): Promise<void> {
    const info = await this.invoke<CallingProviderInfo | null>('describe', {}).catch(() => null);
    if (!this.isProviderInfo(info)) {
      if (this.licensed) await this.revoke();
      else await this.invalidate();
      this.licensed = false;
      return;
    }
    const sameProvider = this.licensed && this.generation === this.options.generation()
      && this.provider?.artifactRevision === info.artifactRevision;
    if (!sameProvider) {
      if (this.active) {
        this.ending = { callId: this.active.id, reason: { code: 'CALL_PROVIDER_CHANGED', message: 'The calling implementation changed and its media was closed.', source: 'session' } };
        await this.invoke('command', { action: 'end', id: this.active.id }).catch(() => undefined);
      }
      await this.invalidate();
    }
    this.licensed = true;
    await this.bind();
  }

  get licenseExpiresAt(): number | undefined { return this.provider?.expiresAt; }

  private isProviderInfo(info: CallingProviderInfo | null): info is CallingProviderInfo {
    return !!info && info.protocolVersion === 1 && typeof info.artifactRevision === 'string' && !!info.artifactRevision
      && Number.isFinite(info.expiresAt) && info.expiresAt > Date.now()
      && typeof info.control === 'boolean' && typeof info.audio === 'boolean' && typeof info.video === 'boolean';
  }

  async revoke(): Promise<void> { await this.expire(); }

  async bind(): Promise<void> {
    const page = this.options.page();
    this.generation = this.options.generation();
    if (!page || !this.generation || !this.licensed) return;
    this.stateQueue ??= await ScopedTaskQueue.make({ name: 'calling-state', capacity: 64, concurrency: 1, overload: 'dropping', timeoutMs: 15_000 });
    if (!this.bindingPages.has(page)) {
      await page.exposeFunction('__openwaCallsHost', (event: CallingProviderEvent, generation: string) => this.dispatch(event, generation));
      this.bindingPages.add(page);
    }
    const info = await this.invoke<CallingProviderInfo | null>('install', { generation: this.generation });
    if (!this.isProviderInfo(info)) {
      this.provider = undefined;
      await this.expire();
      this.options.logger.warn('The licensed calling patch is unavailable or expired. Refresh the calling-enabled licence.');
      return;
    }
    this.provider = info;
    this.scheduleExpiry();
    if (info.audio) await page.grantMediaPermissions?.(new URL(page.url()).origin).catch(error => {
      this.options.logger.warn('Calling device permission is unavailable', { message: String(error) });
    });
  }

  private scheduleExpiry(): void {
    clearTimeout(this.expiryTimer);
    if (!this.provider) return;
    this.expiryTimer = setTimeout(() => { void this.expire().catch(error => this.options.logger.warn('Calling cleanup failed', { message: String(error) })); }, Math.max(0, Math.min(this.provider.expiresAt - Date.now(), 2_147_483_647)));
    this.expiryTimer.unref?.();
  }

  async capabilities(): Promise<CallCapabilities> {
    const reason = this.availability('calls.control');
    return {
      control: !reason, audio: !this.availability('calls.audio'), video: !this.availability('calls.video'),
      ...(reason ? { reason: { code: reason.code, message: reason.message, status: reason.status } } : {}),
    };
  }

  async getActive(): Promise<CallSnapshot | null> { return this.active; }
  logListenerAvailability(): void { const reason = this.availability('calls.control'); if (reason && !this.warnedListeners.has(reason.code)) { this.warnedListeners.add(reason.code); this.options.logger.warn(reason.message); } }

  async admitRemote(request: RemoteMediaRequest): Promise<{ ok: true; ticket: string; expiresAt: number; media: CallMediaOptions } | CallActionResult> {
    const reason = this.availability('calls.audio');
    if (request.mode === 'start' && !request.to?.trim()) return { ok: false, status: 'failed', reason: { code: 'CALL_RECIPIENT_REQUIRED', message: 'Choose a recipient before starting a call.', status: 422 } };
    if (request.mode !== 'start' && !request.call) return { ok: false, status: 'failed', reason: { code: 'CALL_IDENTITY_REQUIRED', message: 'Use a current Call object for this action.', status: 422 } };
    if (reason) { this.options.logger.warn(reason.message); return { ok: false, status: 'unavailable', reason: { code: reason.code, message: reason.message, status: reason.status } }; }
    try { this.require('calls.audio', request.call); } catch { return { ok: false, status: 'unavailable', reason: { code: 'STALE_CALL', message: 'This call is no longer active.', status: 409 } }; }
    const owner = [this.attachment?.options.microphone, this.attachment?.options.speaker].find(value => value && typeof value === 'object' && 'remoteId' in value);
    const ownedRemote = owner && typeof owner === 'object' && 'remoteId' in owner ? owner.remoteId : undefined;
    if (this.remotes.size >= 12 || (request.mode === 'observe' && (request.microphone || !request.speaker)) || (!['replace', 'observe'].includes(request.mode) && (this.attachment || this.pending || this.writing)) || (request.mode === 'replace' && (this.writing || this.pending || (this.attachment && (!ownedRemote || ownedRemote !== request.replacesId))))) return { ok: false, status: 'unavailable', reason: { code: 'MEDIA_OWNED', message: 'This call already has a media owner, or the observer request is invalid.', status: 409 } };
    const reservation = await RemoteMediaReservation.make(request, this.generation, stats => {
      this.options.logger.warn('Call audio input trimmed stale samples; the call remains open.', { callId: this.active?.id, ...stats });
    });
    this.remotes.set(reservation.id, reservation);
    await reservation.scope.addFinalizer('reservation', () => { this.remotes.delete(reservation.id); });
    return { ok: true, ticket: reservation.id, expiresAt: reservation.expiresAt, media: reservation.media };
  }

  connectRemote(ticket: string, connection: RemoteAudioConnection): RemoteMediaReservation {
    this.require('calls.audio');
    const reservation = this.remotes.get(ticket);
    if (!reservation || reservation.generation !== this.generation) throw new Error('Invalid call media admission.');
    reservation.attach(connection);
    return reservation;
  }

  async remoteDisconnected(ticket: string, message = 'The calling media client disconnected.'): Promise<void> {
    const remote = this.remotes.get(ticket);
    if (!remote) return;
    const owner = [this.attachment?.options.microphone, this.attachment?.options.speaker, this.pending?.options.microphone, this.pending?.options.speaker].some(value => value && typeof value === 'object' && 'remoteId' in value && value.remoteId === ticket);
    if (remote.claimed && owner) await this.mediaFailure(message);
    for (const observer of this.observers.values()) if (observer.attachment.remoteId === ticket) await this.closeScope(observer.attachment.scope, 'interruption');
    await this.closeScope(remote.scope, 'interruption');
  }

  async control(action: 'reject' | 'end' | 'mute' | 'clear', call: CallIdentity, value?: boolean): Promise<CallActionResult> {
    return this.action(async () => {
      this.require('calls.control', call);
      const ending = action === 'end' || action === 'reject' ? { callId: call.id, reason: { code: action === 'reject' ? 'CALL_REJECTED_LOCALLY' : 'CALL_ENDED_LOCALLY', message: action === 'reject' ? 'The call was rejected from this session.' : 'The call was ended from this session.', source: 'local' as const } } : undefined;
      if (ending) this.ending = ending;
      const result = await this.invoke<CallActionResult>('command', { action, id: call.id, value });
      if (ending && !result?.ok && this.ending === ending) this.ending = undefined;
      if (result?.ok && action === 'mute') await this.attachment?.media.mute(value === true);
      if (result?.ok && action === 'clear') await this.attachment?.media.clear();
      return result ?? this.unavailableResult();
    }, call.id);
  }

  async accept(call: CallIdentity, media: CallMediaOptions = {}): Promise<CallActionResult> {
    return this.action(async () => {
      this.require('calls.audio', call);
      if (this.writing || this.attachment || this.pending) throw new CallingFailure({ code: 'MEDIA_OWNED', message: 'This call already has a media owner.', status: 409 });
      this.writing = true;
      let prepared: Attachment | undefined;
      try {
        prepared = await this.prepare(media, this.active?.video === true, { mode: 'accept', call });
        this.require('calls.audio', call);
        await this.prepareProvider({ id: call.id, attachmentId: prepared.id, ...this.providerMedia(prepared.media) });
        await this.commitProvider(prepared.id);
        this.attachment = prepared;
        const result = await this.invoke<CallActionResult>('command', { action: 'accept', id: call.id, video: prepared.media.camera !== 'disabled', microphone: prepared.media.microphone !== 'disabled' });
        if (!result?.ok) { if (this.attachment === prepared) this.attachment = undefined; await this.closeScope(prepared.scope, 'failure'); return result ?? this.unavailableResult(); }
        this.require('calls.audio', call);
        await this.activate(prepared);
        return result;
      } catch (error) { if (this.attachment === prepared) this.attachment = undefined; await this.closeScope(prepared?.scope, 'failure'); throw error; }
      finally { this.writing = false; }
    }, call.id);
  }

  async start(to: string, media: CallMediaOptions = {}): Promise<CallActionResult> {
    return this.action(async () => {
      this.require('calls.audio');
      if (this.active || this.pending || this.writing) throw new CallingFailure({ code: 'CALL_BUSY', message: 'A call is already active or preparing.', status: 409 });
      this.writing = true;
      let prepared: Attachment | undefined;
      try {
        prepared = await this.prepare(media, media.camera !== undefined && media.camera !== null, { mode: 'start', to });
        this.pending = prepared;
        this.require('calls.audio');
        await this.prepareProvider({ attachmentId: prepared.id, ...this.providerMedia(prepared.media) });
        await this.commitProvider(prepared.id);
        const result = await this.invoke<CallActionResult>('command', { action: 'start', to, video: prepared.media.camera !== 'disabled' });
        if (!result?.ok) { if (this.pending === prepared) this.pending = undefined; if (this.attachment === prepared) this.attachment = undefined; await this.closeScope(prepared.scope, 'failure'); return result ?? this.unavailableResult(); }
        if (this.active?.direction === 'outgoing') { this.attachment = prepared; this.pending = undefined; }
        await this.activate(prepared);
        return result;
      } catch (error) { if (this.pending === prepared) this.pending = undefined; if (this.attachment === prepared) this.attachment = undefined; await this.closeScope(prepared?.scope, 'failure'); throw error; }
      finally { this.writing = false; }
    });
  }

  async replace(call: CallIdentity, media: CallMediaOptions): Promise<CallActionResult> {
    return this.action(async () => {
      this.require('calls.audio', call);
      if (this.writing || this.pending) throw new CallingFailure({ code: 'MEDIA_OWNED', message: 'This call’s media is already being prepared.', status: 409 });
      this.writing = true;
      const previous = this.attachment;
      if (previous?.remoteId && ![media.microphone, media.speaker].some(source => source && typeof source === 'object' && 'remoteId' in source && source.remoteId)) { this.writing = false; throw new CallingFailure({ code: 'MEDIA_OWNED', message: 'Change this call’s media from its owning helper.', status: 409 }); }
      let replacement: Attachment | undefined;
      try {
        replacement = await this.prepare({ ...previous?.options, ...media }, this.active?.video === true, { mode: 'replace', call });
        this.require('calls.audio', call);
        await this.prepareProvider({ id: call.id, attachmentId: replacement.id, ...this.providerMedia(replacement.media) });
        this.require('calls.audio', call);
        await this.commitProvider(replacement.id);
        this.attachment = replacement;
        await this.activate(replacement);
        await this.closeScope(previous?.scope);
        return { ok: true, status: 'requested', callId: call.id };
      } catch (error) {
        if (this.attachment === replacement) {
          this.attachment = previous;
          if (previous) await this.commitProvider(previous.id).catch(() => this.mediaFailure('The previous media source could not be restored.'));
        }
        await this.closeScope(replacement?.scope, 'failure'); throw error;
      }
      finally { this.writing = false; }
    }, call.id);
  }

  async invalidate(reason = 'The calling browser changed. Attach fresh media after the session recovers.'): Promise<void> {
    clearTimeout(this.expiryTimer);
    if (this.active && (this.attachment || this.pending)) this.options.emit('state', { ...this.active, media: { state: 'ended', reason }, observedAt: Date.now() });
    this.generation = '';
    this.provider = undefined;
    this.active = null;
    this.seenIncoming.clear();
    await this.closeObservers();
    await this.closeScope(this.attachment?.scope, 'interruption');
    await this.closeScope(this.pending?.scope, 'interruption');
    this.attachment = undefined; this.pending = undefined;
    for (const remote of this.remotes.values()) await this.closeScope(remote.scope, 'interruption');
  }

  async close(): Promise<void> { await this.invalidate('The calling session closed.'); this.licensed = false; await this.stateQueue?.close(); this.stateQueue = undefined; }

  private availability(feature: 'calls.control' | 'calls.audio' | 'calls.video'): CallingFailure | undefined {
    if (!this.licensed) return new CallingFailure({ code: 'CALLING_LICENSE_REQUIRED', message: LICENSE_MESSAGE, status: 403 });
    if (this.provider && this.provider.expiresAt <= Date.now()) return new CallingFailure({ code: 'CALLING_LICENSE_EXPIRED', message: 'Calling access has expired. Refresh the calling-enabled license.', status: 403 });
    if (!this.provider || this.generation !== this.options.generation()) return new CallingFailure({ code: 'CALLING_SESSION_NOT_READY', message: 'Calling is still connecting to the WhatsApp session. Try again when the session is ready.', status: 503 });
    if (!this.provider[feature.split('.')[1] as 'control' | 'audio' | 'video']) return new CallingFailure({ code: 'CALLING_UNAVAILABLE', message: `${feature === 'calls.video' ? 'Video calling' : feature === 'calls.audio' ? 'Audio calling' : 'Calling'} is unavailable in this WhatsApp session.`, status: 503 });
  }

  private require(feature: 'calls.control' | 'calls.audio' | 'calls.video', call?: CallIdentity): void {
    const failure = this.availability(feature); if (failure) throw failure;
    if (call && (call.sessionId !== this.options.sessionId || call.generation !== this.generation || call.id !== this.active?.id || this.active.terminal)) throw new CallingFailure({ code: 'STALE_CALL', message: 'This call is no longer active. Use the current call callback.', status: 409 });
  }

  private async prepare(media: CallMediaOptions, video: boolean, action: { mode: 'accept' | 'start' | 'replace' | 'observe'; call?: CallIdentity; to?: string }): Promise<Attachment> {
    try { Schema.decodeUnknownSync(CallMediaOptionsSchema)(media); } catch { throw new CallingFailure({ code: 'MEDIA_SOURCE_INVALID', message: 'Call media options are invalid. Use positional microphone, speaker and camera sources or a media options object.', status: 422, outcome: 'failed' }); }
    if (action.mode === 'accept' && !video && media.camera != null) throw new CallingFailure({ code: 'CALL_VIDEO_NOT_OFFERED', message: 'This incoming call offered audio only. Accept it without a camera.', status: 422, outcome: 'failed' });
    const scope = await SessionScope.make();
    const generation = this.generation;
    const id = crypto.randomUUID();
    const defaults = this.options.config?.defaults ?? {};
    const options: CallMediaOptions = {
      ...defaults, ...media,
      microphone: media.microphone === undefined ? defaults.microphone ?? DEFAULT_MIC : media.microphone,
      speaker: media.speaker === undefined ? defaults.speaker ?? DEFAULT_SPEAKER : media.speaker,
      camera: video ? (media.camera === undefined ? (this.availability('calls.video') ? null : defaults.camera ?? DEFAULT_CAM) : media.camera) : null,
    };
    try {
      for (const [role, source] of Object.entries({ microphone: options.microphone, speaker: options.speaker, camera: options.camera })) {
        if (source === null || source === undefined || typeof source === 'string' || source instanceof Blob) continue;
        if (typeof source === 'object' && ((role === 'microphone' && 'getReader' in source) || (role === 'speaker' && 'getWriter' in source))) continue;
        try { Schema.decodeUnknownSync(MediaDescriptorSchema)(source); } catch { throw new CallingFailure({ code: 'MEDIA_SOURCE_INVALID', message: `The ${role} source is invalid. Use a file, URL, device or stream.`, status: 422, outcome: 'failed' }); }
      }
      if (options.camera !== null) this.require('calls.video');
      if (!this.options.mediaHost) throw new CallingFailure({ code: 'MEDIA_HOST_UNAVAILABLE', message: 'The selected runtime cannot provide calling media.', status: 503 });
      let localOptions = options;
      const remoteId = options.microphone && typeof options.microphone === 'object' && 'remoteId' in options.microphone ? options.microphone.remoteId
        : options.speaker && typeof options.speaker === 'object' && 'remoteId' in options.speaker ? options.speaker.remoteId : undefined;
      if (remoteId) {
        const remote = this.remotes.get(remoteId);
        if (!remote?.connection || remote.claimed || remote.generation !== this.generation || (remote.request.call && remote.request.call.id !== this.active?.id)) throw new CallingFailure({ code: 'MEDIA_ADMISSION_INVALID', message: 'Call media admission is invalid or no longer current.', status: 403 });
        if (remote.request.mode !== action.mode || remote.request.to !== action.to || (action.call && (!remote.request.call || remote.request.call.id !== action.call.id || remote.request.call.generation !== action.call.generation || remote.request.call.sessionId !== action.call.sessionId))) throw new CallingFailure({ code: 'MEDIA_ADMISSION_INVALID', message: 'This media admission belongs to a different call action.', status: 403 });
        remote.claimed = true;
        await scope.addFinalizer('remote-media', () => this.closeScope(remote.scope));
        localOptions = { ...options, microphone: remote.request.microphone ? remote.input : null, speaker: remote.request.speaker ? remote.output : null };
      }
      const prepared = await this.options.mediaHost.prepare(localOptions, scope, error => {
        if (action.mode !== 'observe' && generation === this.generation) void this.mediaFailure(describeCallMediaFailure(error), id).catch(failure => this.options.logger.warn('Calling media cleanup failed', { message: String(failure) }));
      }, remoteId ? { encoding: 'pcm16le', sampleRate: 16_000, channels: 1 } : undefined);
      const receiveQueue = await ScopedTaskQueue.make({ name: 'calling-receive', capacity: 10, concurrency: 1, overload: 'dropping', timeoutMs: 1000 });
      await scope.addFinalizer('receive-queue', async () => { await receiveQueue.waitForIdle(); await receiveQueue.close(); });
      await scope.addFinalizer('provider-media', async () => {
        if (this.options.page() && generation === this.options.generation()) await this.invoke('closeMedia', { attachmentId: id }).catch(() => undefined);
      });
      return { id, scope, media: prepared, options, remoteId, receiveQueue };
    } catch (error) { await this.closeScope(scope, 'failure'); throw error; }
  }

  private providerMedia(media: PreparedCallMedia) { return { microphone: media.microphone, speaker: media.speaker, camera: media.camera, deviceIds: media.deviceIds }; }

  private async activate(attachment: Attachment): Promise<void> {
    if (attachment.started || this.active?.state !== 'active' || this.attachment !== attachment) return;
    const callId = this.active.id;
    attachment.started = true;
    await attachment.media.start(frame => this.invoke('writeAudio', { attachmentId: attachment.id, frame }));
    if (this.attachment !== attachment || this.active?.id !== callId) return;
    this.active = { ...this.active, media: { state: 'attached' }, observedAt: Date.now() };
    this.options.emit('state', this.active);
    if (attachment.remoteId) this.remotes.get(attachment.remoteId)?.connection?.activate(callId);
  }

  private unavailableResult(): CallActionResult { return { ok: false, status: 'unavailable', reason: { code: 'CALLING_UNAVAILABLE', message: 'The calling provider is unavailable in this browser document.', status: 503 } }; }

  async observeAudio(call: CallIdentity, speaker: CallMediaOptions['speaker']): Promise<CallActionResult & { observerId?: string }> {
    return this.action(async () => {
      this.require('calls.audio', call);
      if (!this.attachment || this.observers.size >= 8 || speaker === null || speaker === undefined || speaker === DEFAULT_SPEAKER) throw new CallingFailure({ code: 'MEDIA_OBSERVER_UNAVAILABLE', message: 'Attach a recording or WritableStream to an owned audio call. At most eight observers are supported.', status: 409 });
      const attachment = await this.prepare({ microphone: null, speaker, camera: null }, false, { mode: 'observe', call });
      try {
        if (attachment.media.speaker !== 'captured') throw new CallingFailure({ code: 'MEDIA_OBSERVER_UNAVAILABLE', message: 'An observer needs a recording or WritableStream sink.', status: 422 });
        this.require('calls.audio', call);
        const queue = await ScopedTaskQueue.make({ name: 'calling-observer', capacity: 10, concurrency: 1, overload: 'dropping', timeoutMs: 1000 });
        this.observers.set(attachment.id, { attachment, queue, call });
        await attachment.scope.addFinalizer('observer-queue', async () => { this.observers.delete(attachment.id); await queue.close(); });
        return { ok: true, status: 'requested', callId: call.id, observerId: attachment.id };
      } catch (error) { await this.closeScope(attachment.scope, 'failure'); throw error; }
    }, call.id);
  }

  async stopObserver(call: CallIdentity, observerId: string): Promise<CallActionResult> {
    return this.action(async () => {
      this.require('calls.audio', call);
      const observer = this.observers.get(observerId);
      if (!observer || observer.call.id !== call.id || observer.call.generation !== call.generation) throw new CallingFailure({ code: 'STALE_OBSERVER', message: 'This audio observer is no longer attached.', status: 409 });
      await this.closeScope(observer.attachment.scope);
      return { ok: true, status: 'requested', callId: call.id };
    }, call.id);
  }

  private async closeObservers(): Promise<void> { await Promise.all([...this.observers.values()].map(observer => this.closeScope(observer.attachment.scope))); }

  private async commitProvider(attachmentId: string): Promise<void> {
    const result = await this.invoke<{ ready: boolean; message?: string }>('commitMedia', { attachmentId });
    if (!result?.ready) throw new CallingFailure({ code: 'MEDIA_DEVICE_UNAVAILABLE', message: result?.message ?? 'Prepared media is no longer current.', status: 409 });
  }

  private async prepareProvider(options: unknown): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const result = await Promise.race([this.invoke<{ ready: boolean; message?: string } | null>('prepareMedia', options), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new CallingFailure({ code: 'MEDIA_PREPARATION_TIMEOUT', message: 'Calling media did not become ready. Check device permissions or choose a file or stream.', status: 422, outcome: 'failed' })), this.options.config?.preparationTimeoutMs ?? 15_000); })]).finally(() => clearTimeout(timer));
    if (!result?.ready) throw new CallingFailure({ code: 'MEDIA_DEVICE_UNAVAILABLE', message: result?.message ?? 'Calling media could not be prepared in this browser.', status: 422, outcome: 'failed' });
  }

  private async dispatch(event: CallingProviderEvent, generation: string): Promise<void> {
    if (event.type === 'audio') return this.observe(event, generation);
    try { await this.stateQueue?.submit(() => this.observe(event, generation)); }
    catch {
      if (generation !== this.generation || this.reconciling) return;
      this.reconciling = true;
      try {
        await this.mediaFailure('Calling state processing fell behind; attach fresh media after checking the current call.');
        const snapshot = await this.invoke<Omit<CallSnapshot, 'sessionId' | 'generation'> | null>('current', {});
        await this.observe({ type: 'state', snapshot }, generation);
      } catch { this.options.logger.warn('Calling state could not be reconciled. Wait for the session to recover.'); }
      finally { this.reconciling = false; }
    }
  }

  private async observe(event: CallingProviderEvent, generation: string): Promise<void> {
    if (generation !== this.generation || generation !== this.options.generation()) return;
    if (event.type === 'audio') {
      const target = this.attachment ?? this.pending;
      if (!Array.isArray(event.frame.samples) || event.frame.samples.length > 3840 || !Number.isFinite(event.frame.sampleRate) || event.frame.sampleRate < 8000 || event.frame.sampleRate > 192000 || event.frame.samples.length > event.frame.sampleRate * 0.12 || !event.frame.samples.every(Number.isFinite)) return;
      if (target?.id === event.attachmentId && event.callId === this.active?.id && this.active.state === 'active') {
        for (const observer of this.observers.values()) if (observer.call.id === event.callId) void observer.queue.submit(() => observer.attachment.media.receive(event.frame)).catch(async () => { this.options.logger.warn('An audio observer fell behind or failed; its sink was closed.'); await this.closeScope(observer.attachment.scope, 'failure'); });
        try { await target.receiveQueue.submit(() => target.media.receive(event.frame)); } catch (error) { await this.mediaFailure(describeCallMediaFailure(error), target.id); }
      }
      return;
    }
    if (event.type === 'media-error') {
      if (event.callId !== this.active?.id || (event.attachmentId && event.attachmentId !== this.attachment?.id && event.attachmentId !== this.pending?.id)) return;
      await this.mediaFailure(event.message, event.attachmentId); return;
    }
    const raw = event.snapshot ?? event.terminal;
    const snapshot = raw ? { ...raw,
      ...(raw.terminal ? { endReason: this.ending?.callId === raw.id ? this.ending.reason : raw.endReason ?? { code: 'WHATSAPP_CALL_ENDED', message: 'WhatsApp ended the call without reporting a cause.', source: 'whatsapp' as const } } : {}),
      ...(this.active?.id === raw.id && this.active.media ? { media: this.active.media } : {}),
    } : undefined;
    if (!event.snapshot || (snapshot && this.active && snapshot.id !== this.active.id)) {
      // Retire ownership before closing the socket; a normal end must not be
      // reported by its close callback as a new media failure.
      const attachment = this.attachment; this.attachment = undefined;
      const pending = !event.snapshot ? this.pending : undefined;
      if (!event.snapshot) this.pending = undefined;
      await this.closeObservers();
      await this.closeScope(attachment?.scope);
      await this.closeScope(pending?.scope);
    }
    if (generation !== this.generation || generation !== this.options.generation()) return;
    this.active = event.snapshot && snapshot ? { ...snapshot, sessionId: this.options.sessionId, generation } : null;
    if (snapshot) {
      const bound = { ...snapshot, sessionId: this.options.sessionId, generation };
      this.options.logger.info('Calling state changed', { callId: bound.id, state: bound.state, video: bound.video, ...(bound.endReason ? { endReason: bound.endReason } : {}) });
      this.options.emit('state', bound);
      if (bound.direction === 'incoming' && bound.state === 'ringing' && !this.seenIncoming.has(bound.id)) {
        if (this.seenIncoming.size >= 128) this.seenIncoming.delete(this.seenIncoming.values().next().value!);
        this.seenIncoming.add(bound.id); this.options.emit('incoming', bound);
      }
      if (this.pending && bound.direction === 'outgoing' && !bound.terminal) { this.attachment = this.pending; this.pending = undefined; }
      if (bound.terminal) { const attachment = this.attachment; this.attachment = undefined; await this.closeScope(attachment?.scope); }
      else if (this.attachment) await this.activate(this.attachment);
    }
  }

  private async expire(): Promise<void> {
    const call = this.active;
    if (call) this.ending = { callId: call.id, reason: { code: 'CALLING_LICENSE_EXPIRED', message: 'Calling access expired or was withdrawn.', source: 'license' } };
    if (call) await this.invoke('command', { action: 'end', id: call.id }).catch(() => undefined);
    await this.invalidate('Calling access expired or was withdrawn. Refresh the calling-enabled license before attaching media.'); this.licensed = false;
    this.options.logger.warn('Calling access expired or was withdrawn; call media was closed. Messaging remains available.');
  }

  private async mediaFailure(message: string, attachmentId?: string): Promise<void> {
    const failed = this.attachment ?? this.pending;
    if (!failed || (attachmentId && failed.id !== attachmentId)) return;
    message = message.trim() || 'Call media failed without reporting a cause.';
    this.options.logger.warn('Calling media failed', { callId: this.active?.id, attachmentId: failed.id, message });
    const call = this.active;
    if (this.attachment === failed) this.attachment = undefined;
    if (this.pending === failed) this.pending = undefined;
    if (call) {
      if (failed.options.onMediaFailure !== 'keep-open') this.ending = { callId: call.id, reason: { code: 'CALL_MEDIA_FAILED', message, source: 'media' } };
      this.active = { ...call, media: { state: 'ended', reason: message }, observedAt: Date.now() };
      this.options.emit('state', this.active);
    }
    if (failed.options.onMediaFailure !== 'keep-open' && call) await this.invoke('command', { action: 'end', id: call.id }).catch(() => undefined);
    // The failure may originate in a fiber owned by this scope. Close from a
    // separate task so that finalization never waits for its own failing pump.
    void this.closeScope(failed.scope, 'failure');
  }

  private async closeScope(scope?: SessionScope, reason?: Parameters<SessionScope['close']>[0]): Promise<void> {
    try { await scope?.close(reason); }
    catch (error) { this.options.logger.warn('Calling media cleanup failed', { message: String(error) }); }
  }

  private async invoke<T = unknown>(method: string, args: unknown): Promise<T> {
    const page = this.options.page();
    if (!page || page.isClosed()) throw new CallingFailure({ code: 'CALLING_UNAVAILABLE', message: 'Calling browser is unavailable.', status: 503 });
    return page.evaluate(({ method, args }) => {
      const provider = (globalThis as any).__OPENWA_CALLS__;
      if (!provider || typeof provider[method] !== 'function') return null;
      return provider[method](args);
    }, { method, args }).catch(error => {
      throw new CallingFailure({ code: method === 'command' ? 'CALL_ACTION_UNKNOWN' : 'CALLING_UNAVAILABLE', message: method === 'command' ? 'The calling action outcome is unknown. Check the current call state before retrying.' : 'The calling provider is unavailable in the current browser document.', status: 503, outcome: method === 'command' ? 'unknown' : 'unavailable' });
    });
  }

  private action(work: () => Promise<CallActionResult>, callId?: string): Promise<CallActionResult> {
    return runToPromise(Effect.tryPromise({ try: work, catch: error => error }).pipe(Effect.catch((error) => {
      if (error instanceof Error && 'code' in error && String(error.code).startsWith('MEDIA_')) {
        this.options.logger.warn(error.message, { code: String(error.code) });
        return Effect.succeed({ ok: false as const, status: 'failed' as const, reason: { code: String(error.code), message: error.message, status: 422 }, ...(callId ? { callId } : {}) });
      }
      if (error instanceof CallingFailure) {
        this.options.logger.warn(error.message, { code: error.code });
        return Effect.succeed({ ok: false as const, status: error.outcome ?? 'unavailable' as const, reason: { code: error.code, message: error.message, status: error.status }, ...(callId ? { callId } : {}) });
      }
      return Effect.fail(error);
    })));
  }
}
