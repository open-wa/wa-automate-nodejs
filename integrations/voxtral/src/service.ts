import { createHash } from 'node:crypto';
import { InteractiveResponseSchema, type Call, type CallActionResult, type CallSnapshot } from '@open-wa/schema';
import type { PluginInput } from '@open-wa/plugin-sdk';
import { configSchema, mergeSettings, settingsSchema, type Settings, type SettingsPatch, type VoxtralConfig } from './config';
import { MistralProvider, type ChatTurn } from './provider';
import { encodeVoiceNote } from './audio';
import { LiveCall } from './live-call';
import { VoxtralStore, type StoredState } from './store';
import { selectionText } from '@open-wa/integration-jev/agent';

type Message = { id: string; from: string; type: string; body?: string; mimetype?: string; fromMe?: boolean; isGroupMsg?: boolean; isNotification?: boolean; sender?: { pushname?: string; name?: string } };
export type { Turn, Conversation } from '@open-wa/integration-jev/agent';
import { ConversationHub, ActionAgent, type Turn, type Conversation } from '@open-wa/integration-jev/agent';
type Job = { conversation: Conversation; message: Message; turn: Turn; controller: AbortController };
const failure = (error: unknown) => error instanceof Error ? error.message : String(error);

export class VoxtralService {
  private store: VoxtralStore;
  private state!: StoredState;
  private base: Settings;
  private effective!: Settings;
  private explicitKey?: string;
  private explicitJevKey?: string;
  private hub!: ConversationHub;
  private agent!: ActionAgent;
  get router() { return this.agent.router; }
  private get classifierError() { return this.agent.error; }
  private get conversations() { return this.hub.conversations; }
  private get listeners() { return this.hub.listeners; }
  private jobs: Job[] = [];
  private tasks = new Set<Promise<void>>();
  private running = new Map<string, Job>();
  private live?: LiveCall;
  private callBusy = false;
  private reconnecting = false;
  private reconnectAttempts = new Map<string, { count: number; at: number }>();
  private ready = false;
  private lastError?: string;
  private stopped = false;
  private timer?: ReturnType<typeof setInterval>;
  readonly provider: MistralProvider;

  private constructor(readonly input: PluginInput<VoxtralConfig>) {
    this.store = new VoxtralStore(input.sessionId);
    const { apiKey, jevApiKey, ...settings } = configSchema.parse(input.config);
    this.explicitKey = apiKey?.trim();
    this.explicitJevKey = jevApiKey?.trim();
    this.base = settingsSchema.parse(settings);
    this.provider = new MistralProvider(() => this.key(), usage => {
      const counters = this.state.usage;
      for (const [key, value] of Object.entries(usage)) {
        if (typeof value === 'number' && Number.isFinite(value) && value >= 0) counters[key as 'audioSeconds'] += value;
      }
      counters.requests++; this.changed(); this.persist();
    });
  }
  static async create(input: PluginInput<VoxtralConfig>) {
    const service = new VoxtralService(input);
    service.hub = await ConversationHub.acquire(input);
    service.agent = new ActionAgent(input, service.hub, () => service.jevKey(), { settings: () => service.effective, ready: () => service.ready, canRespond: person => service.canRespond(person), report: error => service.report(error) });

    service.state = await service.store.load();
    service.effective = mergeSettings(service.base, service.state.overrides);
    service.hub.adapters.set('voice', { acceptsNotes: () => service.effective.mode !== 'calls', active: peer => service.live?.call?.peer === peer && !service.live.call.terminal, cancel: peer => { for (const job of service.running.values()) if (job.conversation.peer === peer) job.controller.abort(new Error('Conversation changed.')); if (service.live?.call?.peer === peer) service.live.interrupt(); } });
    service.timer = setInterval(() => service.expire(), 30_000); service.timer.unref?.();
    input.signal.addEventListener('abort', () => service.cancelWork(), { once: true });
    input.events.on('call.incoming', payload => { void service.incoming((payload as { call: CallSnapshot }).call).catch(error => service.report(error)); });
    input.events.on('call.state', payload => service.callState((payload as { state: CallSnapshot }).state));
    input.events.on('interactive.response', payload => { void service.interactiveResponse((payload as { response: unknown }).response).catch(error => service.report(error)); });
    input.events.on('ack.changed', payload => service.ack((payload as { ack: unknown }).ack));
    input.events.on('session.state.changed', payload => {
      const next = (payload as { details?: { next?: string } }).details?.next;
      service.ready = next === 'READY';
      if (!service.ready) service.cancelWork();
      service.changed();
    });
    return service;
  }
  key() { return this.explicitKey || process.env.MISTRAL_API_KEY?.trim() || undefined; }
  private jevKey() { return this.explicitJevKey || process.env.JEV_API_KEY?.trim() || undefined; }
  settings() { return this.effective; }
  settingsView() { return { settings: this.effective, revision: this.state.revision, overrides: Object.keys(this.state.overrides), keyConfigured: Boolean(this.key()), keySource: this.explicitKey ? 'config file' : this.key() ? 'MISTRAL_API_KEY' : 'missing', jevConfigured: this.router.configured(), jevKeySource: this.explicitJevKey ? 'config file' : this.jevKey() ? 'JEV_API_KEY' : 'missing' }; }
  status() {
    return { sessionId: this.input.sessionId, ready: this.ready, configured: Boolean(this.key()), mode: this.effective.mode, paused: this.hub.state.paused,
      error: this.lastError, call: this.live?.snapshot() ?? null, reconnecting: this.reconnecting, queued: this.jobs.length, processing: this.running.size,
      voiceNotes: this.effective.mode !== 'calls', calls: this.effective.mode !== 'voice-notes', actions: this.effective.actions, textPlugin: this.hub.adapters.has('text'), classifier: { configured: this.router.configured(), model: this.effective.actions.classifierModel, error: this.classifierError } };
  }
  list() {
    return [...this.conversations.values()].sort((a, b) => b.updatedAt - a.updatedAt).map(({ history, turns, ...conversation }) => ({ ...conversation,
      paused: this.hub.state.pausedPeople.includes(conversation.peer), lastText: turns.at(-1)?.text ?? '', turnCount: turns.length }));
  }
  conversation(id: string) {
    const value = this.conversations.get(id);
    if (!value) throw new Error('This conversation has expired or is no longer available.');
    return { ...value, history: undefined, paused: this.hub.state.pausedPeople.includes(value.peer) };
  }
  openChat(peer: string) {
    if (!/^[0-9]+@(?:c\.us|lid)$/.test(peer)) throw new Error('Voxtral is available for individual conversations.');
    const id = createHash('sha256').update(`${this.input.sessionId}\0${peer}`).digest('hex').slice(0, 24);
    if (!this.conversations.has(id)) this.person(peer, 'voice-notes');
    return this.conversation(id);
  }
  usage() { return this.state.usage; }
  subscribe(listener: () => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private changed() { this.hub.changed(); }
  private async save() { await this.store.save(this.state); await this.hub.persist(); }
  private persist() { void this.save().catch(error => this.report(error)); }
  report(error: unknown) { this.lastError = failure(error); this.input.logger.error('Voxtral operation failed', { reason: this.lastError }); this.changed(); }
  clientReady() { this.ready = true; this.changed(); this.pump(); }
  private person(peer: string, channel: Conversation['channel'], name?: string) { return this.hub.person(peer, channel, name); }
  private addTurn(person: Conversation, role: Turn['role'], text: string, state: string, id?: string) { return this.hub.addTurn(person, role, text, state, id); }
  private remember(person: Conversation, role: ChatTurn['role'], content: string, source?: Turn) { this.hub.remember(person, role, content, source); }
  private canRespond(person: Conversation) { return !this.stopped && !this.hub.state.paused && !this.hub.state.pausedPeople.includes(person.peer); }
  async previewAction(text: string, signal: AbortSignal) { return this.agent.previewAction(text, signal); }
  private actions(person: Conversation, scope: string, settings: Settings, current: () => boolean, signal: AbortSignal) { return this.agent.actions(person, scope, settings, current, signal); }
  private async interactiveResponse(value: unknown) {
    const parsed = InteractiveResponseSchema.safeParse(value);
    if (!parsed.success) return;
    const response = parsed.data;
    if (!response.originalMessageId || this.hub.state.journal[response.messageId]) return;
    const person = [...this.conversations.values()].find(person => person.peer === response.chatId);
    if (!person || !this.canRespond(person)) return;
    const original = person.turns.find(turn => turn.textId && turn.interactive && (turn.textId === response.originalMessageId || turn.textId.slice(turn.textId.lastIndexOf('_') + 1) === response.originalMessageId));
    if (!original?.interactive || this.hub.selectionOwner(person.peer, original) !== 'voice') return;
    const text = selectionText(original.interactive, response);
    if (!text) return;
    const live = this.live?.call?.peer === person.peer && !this.live.call.terminal ? this.live : undefined;
    if (live || this.effective.mode === 'calls') {
      this.hub.state.journal[response.messageId] = 'processing';
      this.hub.state.journal = Object.fromEntries(Object.entries(this.hub.state.journal).slice(-4000));
      await this.save();
      const task = (async () => {
        if (live) await live.respondToSelection(text, response.messageId);
        else { person.channel = 'calls'; const turn = this.addTurn(person, 'user', text, 'Received', response.messageId); this.remember(person, 'user', text, turn); turn.messageId = response.messageId; turn.selection = true; }
      })().finally(() => { this.hub.state.journal[response.messageId] = 'sent'; this.tasks.delete(task); this.persist(); this.changed(); });
      this.tasks.add(task); await task;
    } else await this.message({ id: response.messageId, from: person.peer, type: 'chat', body: text }, true);
  }
  async message(value: unknown, selection = false) {
    if (!value || typeof value !== 'object') return;
    const message = value as Message;
    if (!message.id || !message.from || message.fromMe || message.isGroupMsg || message.isNotification || !/@(c\.us|lid)$/.test(message.from)) return;
    if (this.effective.mode === 'calls' || !this.key()) return;
    if (!selection && message.type === 'chat' && this.hub.adapters.has('text')) return;
    if (message.type !== 'ptt' && !((selection || this.effective.voiceNotes.acceptText) && message.type === 'chat' && message.body?.trim())) return;
    const person = this.person(message.from, 'voice-notes', message.sender?.name || message.sender?.pushname);
    if (!this.canRespond(person) || this.hub.state.journal[message.id]) return;
    if (this.jobs.length >= 100 || this.jobs.filter(job => job.conversation.id === person.id).length >= 4) {
      person.state = 'Queue full'; this.addTurn(person, 'user', '', 'Not queued: too many pending voice notes.', message.id); this.changed(); return;
    }
    this.hub.state.journal[message.id] = 'processing';
    this.hub.state.journal = Object.fromEntries(Object.entries(this.hub.state.journal).slice(-4000));
    await this.save();
    const turn = this.addTurn(person, 'user', message.type === 'chat' ? message.body!.trim() : '', 'Queued', message.id);
    turn.channel = 'voice-notes'; turn.messageId = message.id; turn.selection = selection;
    person.state = 'Queued';
    this.jobs.push({ conversation: person, message, turn, controller: new AbortController() });
    this.changed(); this.pump();
  }
  private pump() {
    if (this.stopped || this.hub.state.paused || !this.ready) return;
    while (this.running.size < 4) {
      const index = this.jobs.findIndex(job => !this.running.has(job.conversation.id) && this.canRespond(job.conversation)
        && !(this.live?.call && !this.live.call.terminal && this.live.call.peer === job.conversation.peer));
      if (index < 0) break;
      const job = this.jobs.splice(index, 1)[0]; this.running.set(job.conversation.id, job);
      const task = this.hub.run(job.conversation.peer, AbortSignal.any([this.input.signal, job.controller.signal]), () => this.process(job)).catch(error => { job.turn.state = 'Cancelled'; job.turn.error = failure(error); this.hub.state.journal[job.message.id] = 'failed'; this.persist(); this.changed(); }).finally(() => { this.running.delete(job.conversation.id); this.tasks.delete(task); this.pump(); });
      this.tasks.add(task);
    }
  }
  private async process(job: Job) {
    const { conversation: person, turn, message } = job;
    person.channel = 'voice-notes';
    const settings = structuredClone(this.effective);
    const signal = AbortSignal.any([this.input.signal, this.hub.signal, job.controller.signal]);
    let reply: Turn | undefined;
    let sending = false;
    const stage = (state: string) => { person.state = state; turn.state = state; this.changed(); };
    try {
      let text = message.body?.trim() || '';
      if (message.type === 'ptt') {
        stage('Transcribing');
        const data = await this.input.runtime.invoke<string>('decryptMedia', [message]);
        signal.throwIfAborted(); text = await this.provider.transcribe(data, settings, signal);
      }
      turn.text = text;
      if (text.length > 32_000) throw new Error('This voice note is too long for one conversation turn.');
      if (text) this.remember(person, 'user', text, turn);
      stage('Thinking');
      const actions = text ? await this.actions(person, message.id, settings, () => !(this.live?.call?.peer === person.peer && !this.live.call.terminal), signal) : undefined;
      const answer = text ? await this.provider.answer(person.history, settings, signal, actions) : "I couldn't hear any speech. Please send that again, or type your message.";
      person.channel = 'voice-notes';
      reply = this.addTurn(person, 'assistant', answer, 'Generating voice');
      stage('Generating voice');
      const pcm = await this.provider.speech(answer, settings, signal);
      const audio = await encodeVoiceNote(pcm, signal);
      signal.throwIfAborted();
      if (!this.canRespond(person)) throw new Error('AI responses have been paused.');
      stage('Sending'); reply.state = 'Sending'; sending = true;
      const audioId = await this.input.runtime.invoke<string | boolean>('sendPtt', [person.peer, `data:audio/ogg;base64,${audio.toString('base64')}`, { quotedMsgId: message.id }]);
      if (!audioId) throw new Error('WhatsApp did not confirm voice-note submission. Check the chat before sending again.');
      reply.audioId = typeof audioId === 'string' ? audioId : undefined; reply.audioState = this.deliveryState(reply.audioId);
      this.hub.state.journal[message.id] = 'sent';
      // Record accepted speech before an optional text send can fail.
      if (text) this.remember(person, 'assistant', answer);
      if (settings.voiceNotes.includeText) {
        reply.textState = 'Sending'; this.changed();
        const textId = await this.input.runtime.invoke<string | boolean>('reply', [person.peer, answer, message.id]);
        if (!textId) throw new Error('WhatsApp did not confirm text submission.');
        reply.textId = typeof textId === 'string' ? textId : undefined; reply.textState = this.deliveryState(reply.textId);
      }
      reply.state = 'Submitted'; turn.state = 'Processed'; person.state = 'Waiting'; this.lastError = undefined;
    } catch (error) {
      const cancelled = signal.aborted;
      this.hub.state.journal[message.id] = sending ? this.hub.state.journal[message.id] === 'sent' ? 'sent' : 'unknown' : 'failed';
      const status = cancelled ? 'Cancelled' : sending ? 'Send outcome unknown' : 'Failed';
      person.state = status; turn.state = status; turn.error = failure(error);
      if (reply) { reply.state = status; reply.error = failure(error); if (reply.textState === 'Sending') reply.textState = 'Outcome unknown'; }
      if (!cancelled) this.report(error);
    } finally { this.persist(); this.changed(); }
  }
  private deliveryState(id?: string) { return this.hub.deliveryState(id); }
  private ack(value: unknown) { this.hub.ack(value); }
  async updateSettings(patch: SettingsPatch, revision: number) {
    if (revision !== this.state.revision) throw new Error('Settings changed in another view. Reload them before saving.');
    const next = mergeSettings(this.effective, patch);
    const overrides = { ...this.state.overrides };
    for (const [key, value] of Object.entries(patch)) overrides[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? { ...overrides[key] as object, ...value as object } : value;
    this.effective = next; this.state.overrides = overrides; this.state.revision++; this.lastError = undefined;
    if (next.mode === 'calls') {
      for (const job of this.jobs.splice(0)) { job.turn.state = 'Cancelled by mode change'; this.hub.state.journal[job.message.id] = 'failed'; }
    }
    await this.save(); this.changed(); return this.settingsView();
  }
  async resetSettings() { this.effective = structuredClone(this.base); this.state.overrides = {}; this.state.revision++; await this.save(); this.changed(); return this.settingsView(); }
  exportConfig() {
    return `export default {\n  sessionId: ${JSON.stringify(this.input.sessionId)},\n  host: '127.0.0.1',\n  port: 8080,\n  dashboard: true,\n  licenseKey: process.env.OPENWA_LICENSE_KEY,\n  plugins: ['@open-wa/integration-voxtral'],\n  pluginConfig: { voxtral: ${JSON.stringify(this.effective, null, 2)} },\n};\n`;
  }
  async pause(paused: boolean, id?: string) {
    if (id) {
      const person = this.conversations.get(id); if (!person) throw new Error('Conversation not found.');
      this.hub.state.pausedPeople = [...new Set([...this.hub.state.pausedPeople.filter(peer => peer !== person.peer), ...(paused ? [person.peer] : [])])];
      if (paused) this.hub.cancelPeer(person.peer);
      if (paused && this.live?.call?.peer === person.peer) this.live.interrupt();
    } else {
      this.hub.state.paused = paused;
      if (paused) for (const person of this.conversations.values()) this.hub.cancelPeer(person.peer);
    }
    await this.save(); this.changed(); this.pump();
  }
  resetConversation(id: string) {
    const person = this.conversations.get(id); if (!person) throw new Error('Conversation not found.');
    this.hub.cancelPeer(person.peer);
    this.jobs = this.jobs.filter(job => { if (job.conversation.id !== id) return true; this.hub.state.journal[job.message.id] = 'failed'; return false; });
    if (this.live?.call?.peer === person.peer) this.live.interrupt();
    person.history = []; person.turns = []; person.state = 'Waiting'; person.updatedAt = Date.now(); this.persist(); this.changed();
  }
  private liveOptions(person: Conversation) {
    return { runtime: this.input.runtime, provider: this.provider, key: () => this.key(), settings: () => structuredClone(this.effective), signal: this.input.signal,
      canRespond: () => this.canRespond(person), history: () => person.history.slice(),
      actions: (turnId: string, current: () => boolean, signal: AbortSignal) => this.actions(person, turnId, this.effective, current, signal),
      user: (text: string, selectionId?: string) => { person.channel = 'calls'; const turn = this.addTurn(person, 'user', text, selectionId ? 'Selected in chat' : 'Recognized', selectionId); this.remember(person, 'user', text, turn); turn.selection = Boolean(selectionId); turn.messageId = selectionId; this.changed(); return turn.id; },
      assistant: (text: string, interrupted: boolean) => { person.channel = 'calls'; this.remember(person, 'assistant', interrupted ? `${text} [interrupted]` : text); this.addTurn(person, 'assistant', text, interrupted ? 'Interrupted' : 'Sent to call audio').interrupted = interrupted; this.changed(); },
      failed: (message: string, turnId?: string) => {
        const turn = turnId && person.turns.find(turn => turn.id === turnId);
        if (turn) { turn.state = 'Answer failed'; turn.error = message; }
        this.input.logger.error('Voxtral call response failed', { reason: message });
        this.persist(); this.changed();
      },
      changed: () => { person.state = this.live?.stage ?? 'Connecting audio'; person.updatedAt = Date.now(); this.changed(); this.reconnectAudio(); },
    };
  }
  private reconnectAudio() {
    const live = this.live, call = live?.call;
    if (!live?.error || !live.reconnectable || !call || call.terminal || live.owner !== 'assistant' || this.reconnecting || this.callBusy || !this.ready || this.stopped || this.effective.mode === 'voice-notes') return;
    const person = [...this.conversations.values()].find(person => person.peer === call.peer);
    if (!person || !this.canRespond(person)) return;
    const key = `${call.generation}:${call.id}`, previous = this.reconnectAttempts.get(key);
    const count = previous && Date.now() - previous.at < 60_000 ? previous.count : 0;
    if (count >= 3) return;
    this.reconnectAttempts.set(key, { count: count + 1, at: Date.now() });
    this.reconnecting = true; live.stage = 'Reconnecting audio'; this.changed();
    const task = (async () => {
      await new Promise(resolve => setTimeout(resolve, 500 * (count + 1)));
      if (this.stopped || this.live !== live || live.call?.terminal || live.owner !== 'assistant' || !this.ready || !this.canRespond(person)) return;
      try { await this.attachCall(call.id, 'reconnect', call.generation); }
      catch { /* attachCall reports the failure; retries stay bounded below. */ }
    })();
    this.tasks.add(task);
    void task.finally(() => { this.tasks.delete(task); this.reconnecting = false; this.changed(); if (!this.stopped) this.reconnectAudio(); });
  }
  async incoming(snapshot: CallSnapshot) {
    if (!snapshot || this.effective.mode === 'voice-notes' || this.effective.calls.answer !== 'auto' || this.hub.state.paused || !this.key()) return;
    const person = this.person(snapshot.peer, 'calls');
    if (!this.canRespond(person)) return;
    await this.attachCall(snapshot.id, 'answer', snapshot.generation);
  }
  callState(snapshot: CallSnapshot) {
    if (!snapshot || !this.live) return;
    if (!this.live.call && snapshot.direction === 'outgoing') this.live.call = snapshot;
    if (this.live.call?.id !== snapshot.id) return;
    if (this.live.call.generation !== snapshot.generation) { this.live.close(); this.live = undefined; this.changed(); return; }
    this.live.update(snapshot);
    if (snapshot.terminal) { this.reconnectAttempts.delete(`${snapshot.generation}:${snapshot.id}`); const person = this.person(snapshot.peer, 'calls'); person.state = 'Call ended'; this.changed(); this.pump(); }
  }
  private assertAction(result: CallActionResult) { if (!result.ok) throw new Error(result.reason.message); }
  async attachCall(id: string, action: 'answer' | 'reconnect' | 'resume', generation: string, summary?: string) {
    if (this.callBusy) throw new Error('Another call audio action is in progress.');
    if (this.effective.mode === 'voice-notes') throw new Error('Choose Calls or Both mode first.');
    this.callBusy = true;
    let next: LiveCall | undefined;
    let person: Conversation | undefined;
    try {
      const call = await this.input.runtime.invoke<Call | null>('getActiveCall');
      if (!call || call.id !== id || call.generation !== generation || call.terminal) throw new Error('This call is no longer current.');
      person = this.person(call.peer, 'calls'); person.channel = 'calls';
      if (!this.canRespond(person)) throw new Error('Resume AI for this conversation before attaching the assistant.');
      this.hub.cancelPeer(person.peer); await this.hub.idle(person.peer);
      next = new LiveCall(this.liveOptions(person), action === 'answer'); next.call = call;
      await next.connect();
      const result = action === 'answer' ? await call.accept(next.media()) : await call.setMedia({ ...next.media(), takeover: true });
      this.assertAction(result);
      const previous = this.live; this.live = next; previous?.close();
      if (summary?.trim()) this.remember(person, 'user', `Human handoff summary: ${summary.trim().slice(0, 4000)}`);
      const current = await this.input.runtime.invoke<Call | null>('getActiveCall');
      if (!current || current.id !== id || current.generation !== generation) throw new Error('The call ended while audio was being attached.');
      next.update(current); this.lastError = undefined; this.changed();
      return { ok: true, status: 'requested' };
    } catch (error) { next?.close(); if (this.live === next) this.live = undefined; if (person) person.state = 'Call failed'; this.report(error); throw error; }
    finally { this.callBusy = false; }
  }
  async startCall(to: string) {
    if (this.callBusy) throw new Error('Another call audio action is in progress.');
    if (this.effective.mode === 'voice-notes') throw new Error('Choose Calls or Both mode first.');
    this.callBusy = true;
    let next: LiveCall | undefined;
    let person: Conversation | undefined;
    try {
      if ((this.live && !this.live.call) || await this.input.runtime.invoke('getActiveCall')) throw new Error('A call is already active or requested. Check Calls before starting another.');
      person = this.person(to, 'calls'); person.channel = 'calls';
      if (!this.canRespond(person)) throw new Error('Resume AI for this person before calling.');
      this.hub.cancelPeer(person.peer); await this.hub.idle(person.peer);
      next = new LiveCall(this.liveOptions(person)); await next.connect();
      this.live?.close(); this.live = next;
      const result = await this.input.runtime.invoke<CallActionResult>('startCall', [to, next.media()]);
      this.assertAction(result);
      const call = await this.input.runtime.invoke<Call | null>('getActiveCall');
      if (call) next.update(call);
      else { next.stage = 'Call requested · waiting for WhatsApp state'; this.changed(); }
      this.lastError = undefined; this.changed(); return result;
    } catch (error) { next?.close(); if (this.live === next) this.live = undefined; if (person) person.state = 'Call failed'; this.report(error); throw error; }
    finally { this.callBusy = false; }
  }
  async takeover(id: string, generation: string) {
    if (!this.live?.call || this.live.call.id !== id || this.live.call.generation !== generation) throw new Error('No matching current AI call.');
    await this.live.takeover(); this.changed(); return { ok: true, status: 'requested' };
  }
  async muteCall(id: string, generation: string, muted: boolean) {
    if (!this.live?.call || this.live.call.id !== id || this.live.call.generation !== generation) throw new Error('No matching current AI call.');
    await this.live.mute(muted); return { ok: true, status: 'requested' };
  }
  clearCall(id: string, generation: string) {
    if (!this.live?.call || this.live.call.id !== id || this.live.call.generation !== generation) throw new Error('No matching current AI call.');
    this.live.interrupt(); return { ok: true, status: 'requested' };
  }
  private expire() {
    const before = Date.now() - this.effective.conversation.idleTimeoutSeconds * 1000;
    for (const [id, person] of this.conversations) if (person.updatedAt < before && !this.running.has(id) && !this.jobs.some(job => job.conversation.id === id)
      && !(this.live?.call?.peer === person.peer && !this.live.call.terminal) && !this.hub.busy(person.peer)) this.conversations.delete(id);
    this.changed();
  }
  private cancelWork() {
    for (const job of this.running.values()) job.controller.abort(new Error('WhatsApp session stopped or recovered.'));
    this.live?.close(); this.live = undefined;
    for (const job of this.jobs.splice(0)) { job.turn.state = 'Cancelled'; this.hub.state.journal[job.message.id] = 'failed'; }
    this.persist(); this.changed();
  }
  async dispose() { this.stopped = true; clearInterval(this.timer); this.cancelWork(); await Promise.allSettled([...this.tasks]); await this.agent.dispose(); await this.save(); this.hub.adapters.delete('voice'); this.changed(); }
}
