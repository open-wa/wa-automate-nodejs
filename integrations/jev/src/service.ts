import type { PluginInput } from '@open-wa/plugin-sdk';
import { InteractiveResponseSchema } from '@open-wa/schema';
import { configSchema, mergeSettings, type AgentSettings, type JevConfig } from './config';
import { ActionAgent } from './engine';
import { ConversationHub } from './hub';
import { MistralChatProvider } from './provider';
import { AgentStore, type StoredState } from './store';
import { selectionText } from './actions';
import type { Conversation, Turn } from './conversation';

type Message = { id: string; from: string; body?: string; type: string; fromMe?: boolean; isGroupMsg?: boolean; isNotification?: boolean; sender?: { name?: string; pushname?: string } };
export class JevService {
  private store: AgentStore;
  private state!: StoredState;
  private base: AgentSettings;
  private effective!: AgentSettings;
  private apiKey?: string;
  private jevApiKey?: string;
  private ready = false;
  private stopped = false;
  private error?: string;
  private tasks = new Set<Promise<void>>();
  private pending = new Map<string, { peer: string; controller: AbortController }>();
  private work = new Map<string, AbortController>();
  private timer?: ReturnType<typeof setInterval>;
  hub!: ConversationHub;
  agent!: ActionAgent;
  provider: MistralChatProvider;
  private constructor(readonly input: PluginInput<JevConfig>) {
    const { apiKey, jevApiKey, ...settings } = configSchema.parse(input.config);
    this.apiKey = apiKey; this.jevApiKey = jevApiKey; this.base = settings;
    this.store = new AgentStore(input.sessionId);
    this.provider = new MistralChatProvider(() => this.key(), usage => { for (const key of ['inputTokens', 'outputTokens'] as const) this.state.usage[key] += usage[key] ?? 0; this.state.usage.requests++; this.persist(); });
  }
  static async create(input: PluginInput<JevConfig>) {
    const service = new JevService(input); service.hub = await ConversationHub.acquire(input);
    service.state = await service.store.load(); service.effective = mergeSettings(service.base, service.state.overrides);
    service.agent = new ActionAgent(input, service.hub, () => service.jevKey(), { settings: () => service.effective, ready: () => service.ready, canRespond: person => service.canRespond(person), report: error => service.report(error) });
    service.hub.adapters.set('text', { active: () => false, cancel: peer => { for (const work of service.pending.values()) if (work.peer === peer) work.controller.abort(new Error('Conversation changed.')); } });
    input.events.on('interactive.response', payload => { void service.selection((payload as { response: unknown }).response).catch(error => service.report(error)); });
    input.events.on('ack.changed', payload => service.hub.ack((payload as { ack: unknown }).ack));
    input.events.on('session.state.changed', payload => { service.ready = (payload as { details?: { next?: string } }).details?.next === 'READY'; if (!service.ready) service.cancel(); service.hub.changed(); });
    input.signal.addEventListener('abort', () => service.cancel(), { once: true });
    service.timer = setInterval(() => service.expire(), 30_000); service.timer.unref?.();
    return service;
  }
  private key() { return this.apiKey?.trim() || process.env.MISTRAL_API_KEY?.trim(); }
  private jevKey() { return this.jevApiKey?.trim() || process.env.JEV_API_KEY?.trim(); }
  private canRespond(person: Conversation) { return !this.stopped && !this.hub.state.paused && !this.hub.state.pausedPeople.includes(person.peer); }
  private async save() { await this.store.save(this.state); await this.hub.persist(); }
  private persist() { void this.save().catch(error => this.report(error)); }
  private report(error: unknown) { this.error = error instanceof Error ? error.message : String(error); this.input.logger.error('Jev operation failed', { reason: this.error }); this.hub.changed(); }
  clientReady() { this.ready = true; this.hub.changed(); }
  settings() { return this.effective; }
  settingsView() { return { settings: this.effective, revision: this.state.revision, keyConfigured: Boolean(this.key()), jevConfigured: Boolean(this.jevKey()) }; }
  status() { return { ready: this.ready, configured: Boolean(this.key() && this.jevKey()), paused: this.hub.state.paused, error: this.error, processing: this.work.size, actions: this.effective.actions, classifier: { configured: this.agent.router.configured(), error: this.agent.error }, voice: this.hub.adapters.has('voice') }; }
  list() { return [...this.hub.conversations.values()].sort((a, b) => b.updatedAt - a.updatedAt).map(({ history, turns, ...person }) => ({ ...person, lastText: turns.at(-1)?.text ?? '', turnCount: turns.length, paused: this.hub.state.pausedPeople.includes(person.peer) })); }
  conversation(id: string) { const person = this.hub.conversations.get(id); if (!person) throw new Error('This conversation has expired.'); return { ...person, history: undefined, paused: this.hub.state.pausedPeople.includes(person.peer) }; }
  openChat(peer: string) { if (!/^\d+@(?:c\.us|lid)$/.test(peer)) throw new Error('Jev supports individual chats.'); const existing = [...this.hub.conversations.values()].find(person => person.peer === peer); return this.conversation((existing ?? this.hub.person(peer, 'text')).id); }
  usage() { return this.state.usage; }
  subscribe(listener: () => void) { this.hub.listeners.add(listener); return () => this.hub.listeners.delete(listener); }
  async updateSettings(patch: Record<string, unknown>, revision: number) {
    if (revision !== this.state.revision) throw new Error('Settings changed in another view. Reload them before saving.');
    const next = mergeSettings(this.effective, patch); this.effective = next;
    for (const [key, value] of Object.entries(patch)) this.state.overrides[key] = value && typeof value === 'object' && !Array.isArray(value) ? { ...this.state.overrides[key] as object, ...value as object } : value;
    this.state.revision++; await this.save(); this.hub.changed(); return this.settingsView();
  }
  async resetSettings() { this.effective = structuredClone(this.base); this.state.overrides = {}; this.state.revision++; await this.save(); this.hub.changed(); return this.settingsView(); }
  async pause(paused: boolean, id?: string) {
    if (id) { const person = this.hub.conversations.get(id); if (!person) throw new Error('Conversation not found.'); this.hub.state.pausedPeople = [...this.hub.state.pausedPeople.filter(peer => peer !== person.peer), ...(paused ? [person.peer] : [])]; if (paused) this.hub.cancelPeer(person.peer); }
    else { this.hub.state.paused = paused; if (paused) for (const person of this.hub.conversations.values()) this.hub.cancelPeer(person.peer); }
    await this.save(); this.hub.changed();
  }
  resetConversation(id: string) { const person = this.hub.conversations.get(id); if (!person) throw new Error('Conversation not found.'); this.hub.cancelPeer(person.peer); person.turns = []; person.history = []; person.state = 'Waiting'; person.updatedAt = Date.now(); this.hub.changed(); }
  async previewAction(text: string, signal: AbortSignal) { return this.agent.previewAction(text, signal); }
  private async selection(value: unknown) {
    const parsed = InteractiveResponseSchema.safeParse(value); if (!parsed.success) return;
    const response = parsed.data;
    const person = [...this.hub.conversations.values()].find(person => person.peer === response.chatId);
    const original = person?.turns.find(turn => turn.textId && turn.interactive && (turn.textId === response.originalMessageId || turn.textId.slice(turn.textId.lastIndexOf('_') + 1) === response.originalMessageId));
    if (!person || !original?.interactive || this.hub.selectionOwner(person.peer, original) !== 'text') return;
    const text = selectionText(original.interactive, response); if (text) await this.message({ id: response.messageId, from: person.peer, body: text, type: 'chat' }, true);
  }
  async message(value: unknown, selection = false) {
    const message = value as Message | null;
    if (!message?.id || !message.from || message.type !== 'chat' || !message.body?.trim() || message.fromMe || message.isGroupMsg || message.isNotification || !/^\d+@(?:c\.us|lid)$/.test(message.from)) return;
    const person = this.hub.person(message.from, 'text', message.sender?.name || message.sender?.pushname);
    if (!this.canRespond(person) || !this.key() || !this.jevKey() || this.hub.state.journal[message.id]) return;
    if (message.body.length > 32_000) { this.report(new Error('The message is too long for one assistant turn.')); return; }
    if (this.tasks.size >= 100) { this.report(new Error('The assistant queue is full.')); return; }
    this.hub.state.journal[message.id] = 'processing';
    await this.save();
    const controller = new AbortController(); const signal = AbortSignal.any([controller.signal, this.input.signal, this.hub.signal]);
    this.pending.set(message.id, { peer: person.peer, controller });
    const task = this.hub.run(person.peer, signal, async () => {
      // Typed replies wait for the live-call owner to release this conversation.
      while (this.hub.callActive(person.peer)) await this.waitForChange(signal);
      if (!this.ready || !this.canRespond(person)) throw new Error('The assistant is paused or WhatsApp is unavailable.');
      this.work.set(person.id, controller); person.channel = 'text';
      const turn = this.hub.addTurn(person, 'user', message.body!.trim(), 'Thinking', message.id); turn.messageId = message.id; turn.selection = selection;
      this.hub.remember(person, 'user', turn.text, turn); this.hub.changed();
      let reply: Turn | undefined, dispatched = false;
      try {
        const settings = structuredClone(this.effective);
        const actions = await this.agent.actions(person, turn.id, settings, () => !this.hub.callActive(person.peer), signal);
        const text = await this.provider.answer(person.history, settings, signal, actions);
        signal.throwIfAborted(); if (!this.canRespond(person)) throw new Error('AI responses have been paused.');
        reply = this.hub.addTurn(person, 'assistant', text, 'Sending'); this.hub.changed();
        dispatched = true;
        const id = await this.input.runtime.invoke<string>('sendText', [person.peer, text]);
        if (typeof id !== 'string' || !id) throw new Error('WhatsApp did not confirm text submission.');
        reply.textId = id; reply.textState = this.hub.deliveryState(id); reply.state = 'Submitted';
        this.hub.remember(person, 'assistant', text); this.hub.state.journal[message.id] = 'sent'; turn.state = 'Processed'; person.state = 'Waiting'; this.error = undefined;
      } catch (error) {
        this.hub.state.journal[message.id] = dispatched ? 'unknown' : 'failed'; turn.state = signal.aborted ? 'Cancelled' : 'Failed';
        if (reply) { reply.state = dispatched ? 'Send outcome unknown' : turn.state; reply.error = error instanceof Error ? error.message : String(error); }
        if (!signal.aborted) this.report(error);
      } finally { this.work.delete(person.id); await this.save(); this.hub.changed(); }
    }).catch(error => { this.hub.state.journal[message.id] = 'failed'; if (!signal.aborted) this.report(error); this.persist(); });
    this.tasks.add(task); void task.finally(() => { this.tasks.delete(task); this.pending.delete(message.id); });
  }
  private waitForChange(signal: AbortSignal): Promise<void> {
    signal.throwIfAborted(); return new Promise((resolve, reject) => {
      const done = () => { this.hub.listeners.delete(done); signal.removeEventListener('abort', abort); resolve(); };
      const abort = () => { this.hub.listeners.delete(done); reject(signal.reason); };
      this.hub.listeners.add(done); signal.addEventListener('abort', abort, { once: true });
    });
  }
  private expire() { const before = Date.now() - this.effective.conversation.idleTimeoutSeconds * 1000; for (const [id, person] of this.hub.conversations) if (person.updatedAt < before && !this.work.has(id) && !this.hub.callActive(person.peer) && !this.hub.adapters.has('voice')) this.hub.conversations.delete(id); }
  private cancel() { for (const work of this.pending.values()) work.controller.abort(new Error('WhatsApp session stopped.')); }
  async dispose() { this.stopped = true; clearInterval(this.timer); this.cancel(); await Promise.allSettled([...this.tasks]); await this.agent.dispose(); await this.save(); this.hub.adapters.delete('text'); this.hub.changed(); }
}
