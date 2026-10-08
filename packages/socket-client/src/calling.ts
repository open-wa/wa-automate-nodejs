import type { Call, CallIdentity, CallSnapshot, CallActionResult, CallMediaOptions, AudioInput, AudioOutput, VideoInput, CallAudioObserver } from '@open-wa/schema';
import { normalizeCallMedia, describeCallMediaFailure } from '@open-wa/schema/calling-media';
import { prepareLocalMedia } from '@open-wa/socket-client/calling-platform';
import { ScopedTaskQueue } from '@open-wa/runtime-core';

export type CallRpc = (method: string, args: unknown[]) => Promise<any>;
export class RemoteCalls {
  private attachments = new Map<string, { callId?: string; close: () => Promise<void>; ticket: string; observerId?: string; observer: boolean; mute: (value: boolean) => Promise<void>; clear: () => Promise<void> }>();
  constructor(private readonly url: string, private readonly apiKey: string, private readonly rpc: CallRpc) {}

  hydrate(snapshot: CallSnapshot): Call {
    const identity: CallIdentity = { id: snapshot.id, sessionId: snapshot.sessionId, generation: snapshot.generation };
    const call = { ...snapshot } as Call;
    const actions = {
      accept: (mic?: AudioInput | CallMediaOptions, speaker?: AudioOutput, camera?: VideoInput) => this.act('accept', identity, undefined, normalizeCallMedia(mic, speaker, camera)),
      reject: () => this.rpc('rejectCall', [identity]), end: () => this.rpc('endCall', [identity]),
      mute: () => this.mute(identity, true), unmute: () => this.mute(identity, false),
      clearAudio: async () => { await this.find(identity.id)?.clear(); return this.rpc('clearCallAudio', [identity]); },
      setMedia: (media: CallMediaOptions) => this.act('replace', identity, undefined, media),
      observeAudio: (speaker: AudioOutput) => this.observeAudio(identity, speaker),
    };
    for (const [name, value] of Object.entries(actions)) Object.defineProperty(call, name, { value, enumerable: false });
    return call;
  }

  async start(to: string, media: CallMediaOptions) { return this.act('start', undefined, to, media); }
  observe(snapshot: CallSnapshot) {
    for (const entry of this.attachments.values()) {
      if (!entry.callId && snapshot.direction === 'outgoing' && !snapshot.terminal) entry.callId = snapshot.id;
      if (entry.callId === snapshot.id && (snapshot.terminal || snapshot.media?.state === 'ended')) void entry.close();
    }
  }
  async close() { await Promise.all([...this.attachments.values()].map(entry => entry.close())); }
  private find(id: string) { return [...this.attachments.values()].find(entry => entry.callId === id && !entry.observer); }
  private async observeAudio(call: CallIdentity, speaker: AudioOutput): Promise<CallAudioObserver | Exclude<CallActionResult, { ok: true }>> {
    const result = await this.act('observe', call, undefined, { microphone: null, speaker, camera: null });
    if (!result.ok) return result;
    const entry = [...this.attachments.values()].find(value => value.observerId === result.observerId);
    return { ok: true, status: 'attached', stop: async () => { await entry?.close(); } };
  }
  private async mute(call: CallIdentity, value: boolean) { await this.find(call.id)?.mute(value); return this.rpc('muteCall', [call, value]); }

  private async act(mode: 'accept' | 'start' | 'replace' | 'observe', call: CallIdentity | undefined, to: string | undefined, media: CallMediaOptions): Promise<CallActionResult & { observerId?: string }> {
    let local: Awaited<ReturnType<typeof prepareLocalMedia>> | undefined;
    let socket: WebSocket | undefined;
    let ticket = '';
    let closed = false;
    let invoking = false;
    let pendingBytes = 0;
    let receiveQueue: ScopedTaskQueue | undefined;
    let closing: Promise<void> | undefined;
    const close = (failure?: string): Promise<void> => closing ??= (async () => {
      closed = true;
      this.attachments.delete(ticket);
      if (failure) {
        console.warn('Calling media failed:', failure);
        if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'error', message: failure.slice(0, 512) }));
      }
      socket?.close(1000, 'Media ended');
      try { await receiveQueue?.waitForIdle(); await receiveQueue?.close(); }
      finally {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try { await Promise.race([local?.close(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('The local audio sink did not close within three seconds.')), 3000); })]); }
        finally { clearTimeout(timer); }
      }
    })().catch(error => { console.warn('Calling media cleanup failed:', error instanceof Error ? error.message : String(error)); });
    const fail = (error: unknown) => close(describeCallMediaFailure(error));
    try {
      // Admission precedes permission prompts, decoders, files and network acquisition.
      const previous = mode === 'replace' && call ? this.find(call.id) : undefined;
      const response = await fetch(`${this.url.replace(/\/$/, '')}/api/calls/media`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {}) },
        body: JSON.stringify({ call, to, mode, microphone: media.microphone !== null, speaker: media.speaker !== null, replacesId: previous?.ticket }),
      });
      const admission = await response.json();
      if (response.status === 401) throw Object.assign(new Error('Calling media API authentication failed.'), { status: 401, code: 'UNAUTHORIZED' });
      if (!response.ok) throw Object.assign(new Error(admission.error ?? `Calling media API returned HTTP ${response.status}.`), { status: response.status });
      if (!admission.ok) return admission.reason ? admission : { ok: false, status: 'unavailable', reason: { code: 'CALLING_UNAVAILABLE', message: admission.error ?? 'Calling media is unavailable.', status: response.status } };
      ticket = admission.ticket;
      local = await prepareLocalMedia(media);
      receiveQueue = await ScopedTaskQueue.make({ name: 'remote-call-receive', capacity: 25, concurrency: 1, overload: 'dropping', timeoutMs: 1000 });
      const wsUrl = new URL(`${this.url.replace(/\/$/, '')}/api/calls/media/ws`); wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(wsUrl); socket.binaryType = 'arraybuffer';
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Call media did not become ready.')), 10_000);
        socket!.onopen = () => socket!.send(JSON.stringify({ type: 'start', version: 1, ticket, ...(this.apiKey ? { apiKey: this.apiKey } : {}) }));
        socket!.onmessage = ({ data }) => { if (typeof data !== 'string') return; try { const message = JSON.parse(data); if (message.type === 'ready') { clearTimeout(timer); resolve(); } else if (message.type === 'error') { clearTimeout(timer); reject(new Error(message.message ?? 'Call media admission failed.')); } } catch { clearTimeout(timer); reject(new Error('Invalid call media handshake.')); } };
        socket!.onerror = () => { clearTimeout(timer); reject(new Error('Call media connection failed.')); };
        socket!.onclose = () => { clearTimeout(timer); reject(new Error('Call media connection closed.')); };
      });
      let activated = false;
      socket.onmessage = ({ data }) => {
        if (data instanceof ArrayBuffer) {
          if (closed) return;
          if (data.byteLength > 3840 || data.byteLength % 2) { void fail(new Error('The received call audio frame is invalid.')); return; }
          if (pendingBytes + data.byteLength > 16_000) { void fail(new Error('Dashboard audio playback exceeded its 500 ms receive buffer.')); return; }
          pendingBytes += data.byteLength;
          void receiveQueue!.submit(() => local!.receive(new Uint8Array(data))).catch(fail).finally(() => { pendingBytes -= data.byteLength; });
        }
        else {
          try {
            const message = JSON.parse(data);
            if (message.type === 'error') { void fail(new Error(typeof message.message === 'string' ? message.message : 'The call media server reported a failure.')); return; }
            if (message.type === 'active' && !activated) {
              activated = true;
              void local!.start(bytes => { if (closed) return; if (socket!.readyState !== WebSocket.OPEN || socket!.bufferedAmount > 16_000) throw new Error('Dashboard microphone exceeded its 500 ms send buffer.'); socket!.send(bytes); }, error => { void fail(error); }).catch(fail);
            }
          } catch (error) { void fail(error); }
        }
      };
      socket.onclose = event => { if (!closed) void fail(new Error(`Call media connection closed (WebSocket ${event.code}${event.reason ? `: ${event.reason}` : ''}).`)); };
      socket.onerror = () => { if (!closed) void fail(new Error('The call media WebSocket connection failed.')); };
      this.attachments.set(ticket, { ticket, observer: mode === 'observe', callId: call?.id, close: () => close(), mute: local.mute, clear: local.clear });
      invoking = true;
      const result: CallActionResult & { observerId?: string } = mode === 'start' ? await this.rpc('startCall', [to, admission.media]) : mode === 'observe' ? await this.rpc('observeCallAudio', [call, admission.media.speaker]) : await this.rpc(mode === 'accept' ? 'acceptCall' : 'setCallMedia', [call, admission.media]);
      if (!result.ok) { await close(); return result; }
      const owned = this.attachments.get(ticket); if (owned && result.callId) owned.callId = result.callId;
      if (owned && result.observerId) owned.observerId = result.observerId;
      if (previous) await previous.close();
      return result;
    } catch (error) {
      await close();
      if (invoking || (error && typeof error === 'object' && 'status' in error)) throw error;
      return { ok: false, status: 'failed', reason: { code: 'MEDIA_SOURCE_FAILED', message: error instanceof Error ? error.message : String(error), status: 422 } };
    }
  }
}
