import { createHash, randomUUID } from 'node:crypto';
import type { PluginInput } from '@open-wa/plugin-sdk';
import { AgentStore, type StoredState } from './store';
import type { Conversation, Turn } from './conversation';
import type { ChatTurn } from './provider';

type Adapter = { active: (peer: string) => boolean; cancel: (peer: string) => void; acceptsNotes?: () => boolean };
/** One instance per session host, including separately loaded plugin package copies. */
export class ConversationHub {
  readonly conversations = new Map<string, Conversation>();
  readonly listeners = new Set<() => void>();
  readonly adapters = new Map<'text' | 'voice', Adapter>();
  readonly acknowledgements = new Map<string, number>();
  private lanes = new Map<string, Promise<void>>();
  readonly store: AgentStore;
  state!: StoredState;
  private constructor(readonly sessionId: string, readonly signal: AbortSignal) { this.store = new AgentStore(sessionId, 'jev-conversations'); }
  static acquire(input: PluginInput): Promise<ConversationHub> {
    return input.services.getOrCreate('@open-wa/jev/conversations', async signal => {
      const hub = new ConversationHub(input.sessionId, signal); hub.state = await hub.store.load();
      return { value: hub, dispose: async () => { await Promise.allSettled([...hub.lanes.values()]); await hub.store.save(hub.state); hub.listeners.clear(); } };
    });
  }
  changed() { for (const listener of this.listeners) listener(); }
  async persist() { await this.store.save(this.state); }
  person(peer: string, channel: Conversation['channel'], name?: string) {
    const id = createHash('sha256').update(`${this.sessionId}\0${peer}`).digest('hex').slice(0, 24);
    let person = this.conversations.get(id);
    if (!person) { person = { id, peer, channel, name: name || peer, state: 'Waiting', updatedAt: Date.now(), turns: [], history: [] }; this.conversations.set(id, person); }
    person.updatedAt = Date.now(); if (name) person.name = name;
    return person;
  }
  addTurn(person: Conversation, role: Turn['role'], text: string, state: string, id: string = randomUUID()) {
    const turn: Turn = { id, role, text, state, at: Date.now(), channel: person.channel };
    person.turns.push(turn); person.turns = person.turns.slice(-60); person.updatedAt = turn.at;
    return turn;
  }
  remember(person: Conversation, role: ChatTurn['role'], content: string, sourceTurn?: Pick<Turn, 'id' | 'at'>) {
    const source = sourceTurn ?? person.turns.findLast(turn => turn.role === role && turn.text === content);
    person.history.push({ role, content, id: source?.id ?? randomUUID(), at: source?.at ?? Date.now() }); person.history = person.history.slice(-40);
    while (person.history.length > 2 && person.history.reduce((size, turn) => size + turn.content.length, 0) > 32_000) person.history.shift();
  }
  latestBooking(person: Conversation) { return person.turns.findLast(turn => turn.bookingInput && turn.textId && !turn.replacedByMessageId && turn.interactive?.type === 'booking' && turn.state === 'Submitted'); }
  selectionOwner(peer: string, original: Turn) {
    if (this.adapters.get('voice')?.active(peer)) return 'voice';
    if (this.adapters.has('text') && (original.channel !== 'voice-notes' || !this.adapters.get('voice')?.acceptsNotes?.())) return 'text';
    return this.adapters.has('voice') ? 'voice' : 'text';
  }
  async idle(peer: string) { await this.lanes.get(peer); }
  busy(peer: string) { return this.lanes.has(peer); }
  callActive(peer: string) { return this.adapters.get('voice')?.active(peer) === true; }
  cancelPeer(peer: string) { for (const adapter of this.adapters.values()) adapter.cancel(peer); }
  async run<T>(peer: string, signal: AbortSignal, work: () => Promise<T>): Promise<T> {
    const previous = this.lanes.get(peer) ?? Promise.resolve();
    const task = previous.catch(() => {}).then(async () => {
      signal.throwIfAborted(); this.signal.throwIfAborted();
      return work();
    });
    const settled = task.then(() => {}, () => {}); this.lanes.set(peer, settled);
    try { return await task; } finally { if (this.lanes.get(peer) === settled) this.lanes.delete(peer); }
  }
  deliveryState(id?: string) { const ack = id ? this.acknowledgements.get(id) : undefined; return ack === undefined ? 'Submitted' : ack >= 3 ? 'Read' : ack === 2 ? 'Delivered' : ack >= 0 ? 'Submitted' : 'Failed'; }
  ack(value: unknown) {
    const ack = value as { id?: string; messageId?: string; ack?: number } | null; const id = ack?.id || ack?.messageId;
    if (!id || typeof ack?.ack !== 'number') return;
    this.acknowledgements.delete(id); this.acknowledgements.set(id, ack.ack);
    if (this.acknowledgements.size > 4000) this.acknowledgements.delete(this.acknowledgements.keys().next().value!);
    for (const person of this.conversations.values()) for (const turn of person.turns) { if (turn.audioId === id) turn.audioState = this.deliveryState(id); if (turn.textId === id) turn.textState = this.deliveryState(id); }
    this.changed();
  }
}
