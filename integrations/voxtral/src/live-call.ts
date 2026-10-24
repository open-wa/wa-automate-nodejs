import WebSocket from 'ws';
import type { Call, CallSnapshot, CallAudioObserver } from '@open-wa/schema';
import type { PluginRuntime } from '@open-wa/plugin-sdk';
import type { Settings } from './config';
import { normalizeSettings } from './config';
import { CallPlayback } from './audio';
import type { ChatTurn, MistralProvider } from './provider';

type LiveOptions = {
  runtime: PluginRuntime;
  provider: MistralProvider;
  key: () => string | undefined;
  settings: () => Settings;
  signal: AbortSignal;
  canRespond: () => boolean;
  history: () => ChatTurn[];
  user: (text: string) => void;
  assistant: (text: string, interrupted: boolean) => void;
  changed: () => void;
};

export class LiveCall {
  call?: CallSnapshot;
  owner: 'assistant' | 'human' = 'assistant';
  stage = 'Connecting audio';
  error?: string;
  interim = '';
  muted = false;
  private playback = new CallPlayback();
  private ws?: WebSocket;
  private observer?: CallAudioObserver;
  private controller = new AbortController();
  private response?: AbortController;
  private endTimer?: ReturnType<typeof setTimeout>;
  private configured = false;
  private stopped = false;
  private greeted = false;
  private generation = 0;
  private abortListener = () => this.close();

  constructor(private options: LiveOptions, greet = true) {
    this.greeted = !greet;
    options.signal.addEventListener('abort', this.abortListener, { once: true });
  }
  snapshot() { return { call: this.call, owner: this.owner, stage: this.stage, error: this.error, interim: this.interim, muted: this.muted }; }
  private change(stage?: string) { if (stage) this.stage = stage; this.options.changed(); }
  private signal() { return AbortSignal.any([this.controller.signal, this.options.signal]); }
  async connect() {
    const key = this.options.key();
    if (!key) throw new Error('Set MISTRAL_API_KEY on the Easy API host.');
    const settings = normalizeSettings(this.options.settings());
    const ws = this.ws = new WebSocket(`wss://api.mistral.ai/v1/audio/transcriptions/realtime?model=${encodeURIComponent(settings.models.realtimeTranscription)}`, { headers: { Authorization: `Bearer ${key}` }, maxPayload: 2 * 1024 * 1024 });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => { reject(new Error('Mistral realtime audio did not connect.')); ws.close(); }, 15_000);
      const abort = () => { clearTimeout(timeout); ws.close(); reject(new Error('AI audio connection cancelled.')); };
      this.controller.signal.addEventListener('abort', abort, { once: true });
      ws.on('message', raw => {
        try {
          const event = JSON.parse(String(raw));
          if (event.type === 'session.created') {
            ws.send(JSON.stringify({ type: 'session.update', session: {
              audio_format: { encoding: 'pcm_s16le', sample_rate: 16000 }, target_streaming_delay_ms: 480,
              turn_detection: {}, context_bias: settings.contextBias,
              ...(settings.language !== 'auto' ? { language: settings.language } : {}),
            } }));
          } else if (event.type === 'session.updated') {
            clearTimeout(timeout); this.controller.signal.removeEventListener('abort', abort);
            this.configured = true; this.change('Listening'); resolve();
          } else if (event.type === 'transcription.text.delta') {
            this.interim += typeof event.text === 'string' ? event.text : '';
            if (this.interim.length > 32_000) throw new Error('The current spoken turn is too long.');
            this.change();
          } else if (event.type === 'turn.start' || event.type === 'turn.resume') {
            clearTimeout(this.endTimer); this.interrupt();
          } else if (event.type === 'turn.end') {
            clearTimeout(this.endTimer);
            this.endTimer = setTimeout(() => void this.finishTurn(), 160);
          } else if (event.type === 'error') {
            throw new Error('Mistral realtime transcription failed. Check the key, selected model, and account limits.');
          }
        } catch (error) { clearTimeout(timeout); reject(error); this.failed(error); }
      });
      ws.on('error', () => { clearTimeout(timeout); const error = new Error('Mistral realtime audio connection failed.'); reject(error); this.failed(error); });
      ws.on('close', () => { clearTimeout(timeout); reject(new Error('Mistral audio connection closed.')); if (!this.stopped) this.failed(new Error('AI audio disconnected. Reconnect the assistant or take over this call.')); });
    });
  }
  media() {
    return { microphone: this.playback.stream, speaker: this.receiver(), onMediaFailure: 'keep-open' as const };
  }
  private receiver() {
    return new WritableStream<Uint8Array>({ write: bytes => {
      if (!this.configured || this.stopped || this.ws?.readyState !== WebSocket.OPEN) return;
      if (this.ws.bufferedAmount > 64_000) { this.failed(new Error('AI audio could not keep up with the call. Reconnect the assistant.')); return; }
      this.ws.send(JSON.stringify({ type: 'input_audio.append', audio: Buffer.from(bytes).toString('base64') }));
    } });
  }
  update(call: CallSnapshot) {
    this.call = call;
    if (call.terminal) {
      this.close(); this.interim = ''; this.muted = false; this.change('Call ended'); return;
    }
    if (call.state === 'active' && !this.greeted && this.owner === 'assistant' && this.options.canRespond() && !this.muted) {
      this.greeted = true;
      const greeting = this.options.settings().calls.greeting;
      if (greeting) void this.greet(greeting);
    }
    this.change();
  }
  private async current(): Promise<Call> {
    const call = await this.options.runtime.invoke<Call | null>('getActiveCall');
    if (!call || !this.call || call.id !== this.call.id || call.generation !== this.call.generation || call.terminal) throw new Error('This call is no longer current.');
    return call;
  }
  interrupt() {
    this.generation++;
    this.response?.abort(); this.response = undefined;
    this.playback.clear();
    if (this.call && !this.call.terminal && this.owner === 'assistant') {
      void this.current().then(call => call.clearAudio()).catch(() => {});
    }
    this.change(this.owner === 'human' ? 'Human takeover' : !this.options.canRespond() ? 'AI paused · listening' : this.muted ? 'Muted · listening' : 'Listening');
  }
  private async greet(text: string) {
    const controller = this.response = new AbortController();
    try { await this.speak(text, this.options.settings(), AbortSignal.any([controller.signal, this.signal()])); this.options.assistant(text, false); }
    catch (error) { if (!controller.signal.aborted && !this.stopped) this.failed(error); }
    finally { if (this.response === controller && !this.error && !this.stopped) this.change('Listening'); }
  }
  private async speak(text: string, settings: Settings, signal: AbortSignal) {
    this.change(this.muted ? 'Muted · listening' : 'Speaking');
    for await (const bytes of this.options.provider.speechStream(text, settings, signal)) {
      if (!this.muted) await this.playback.write24k(bytes, signal);
    }
    if (!this.muted) await this.playback.drain(signal);
  }
  private async finishTurn() {
    const text = this.interim.trim(); this.interim = '';
    if (!text || this.stopped) return;
    this.options.user(text);
    if (this.owner !== 'assistant' || !this.options.canRespond() || this.muted) {
      this.change(this.owner === 'human' ? 'Human takeover' : this.muted ? 'Muted · listening' : 'AI paused · listening'); return;
    }
    const revision = this.options.settings();
    const controller = this.response = new AbortController();
    const signal = AbortSignal.any([controller.signal, this.signal()]);
    const generation = ++this.generation;
    let pending = ''; let spoken = ''; let generated = '';
    this.change('Thinking');
    let speech = Promise.resolve();
    const enqueue = (phrase: string) => {
      speech = speech.then(async () => {
        signal.throwIfAborted();
        await this.speak(phrase, revision, signal);
        spoken += phrase;
      });
      // Streaming language generation may continue while speech is playing.
      speech.catch(() => {});
    };
    try {
      for await (const delta of this.options.provider.answerStream(this.options.history(), revision, signal)) {
        generated += delta; pending += delta;
        const match = /^([\s\S]*?[.!?؟。]\s+)([\s\S]*)$/.exec(pending);
        if (match) { enqueue(match[1]); pending = match[2]; }
      }
      if (pending.trim()) enqueue(pending);
      await speech;
      if (!generated.trim()) throw new Error('Mistral did not return an answer.');
      this.options.assistant(generated.trim(), false);
    } catch (error) {
      const interrupted = signal.aborted;
      controller.abort();
      await speech.catch(() => {});
      if (spoken.trim()) this.options.assistant(spoken.trim(), true);
      if (!interrupted && !this.stopped) this.failed(error);
    } finally {
      if (generation === this.generation && !this.stopped && !this.error) this.change('Listening');
    }
  }
  async takeover() {
    const call = await this.current();
    this.owner = 'human'; this.interrupt();
    // A receive-only observer keeps the caller's words without taking over the microphone.
    const result = await call.observeAudio(this.receiver());
    if (result.ok) this.observer = result;
    this.change('Human takeover');
  }
  async mute(muted: boolean) {
    this.muted = muted;
    if (muted) this.interrupt();
    this.change(muted ? 'Muted · listening' : 'Listening');
  }
  private failed(error: unknown) {
    if (this.stopped || this.error) return;
    this.error = error instanceof Error ? error.message : 'AI audio disconnected.';
    this.response?.abort(); this.playback.clear(); this.ws?.close();
    this.change('Audio disconnected');
  }
  close() {
    if (this.stopped) return;
    this.stopped = true; clearTimeout(this.endTimer); this.response?.abort(); this.controller.abort();
    this.options.signal.removeEventListener('abort', this.abortListener);
    this.playback.close(); this.ws?.terminate();
    void this.observer?.stop().catch(() => {});
  }
}
