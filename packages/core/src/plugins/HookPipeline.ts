import { HooksConfigSchema, type HostHooks, type EventHookContext, type ActionHookContext } from '@open-wa/config';
import { clientRegistry, parameterRegistry } from '@open-wa/schema';

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === 'object' ? value as RecordValue : {};
const normalizeChat = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return;
  if (/^\+?[0-9]+$/.test(value)) return `${value.replace(/^\+/, '')}@c.us`;
  return /^[0-9]+(?:-[0-9]+)?@(?:c\.us|lid|g\.us)$/.test(value) ? value : undefined;
};
const messageChat = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return;
  return normalizeChat(/^(?:true|false)_([^_]+)_/.exec(value)?.[1]);
};
const chatValue = (value: unknown): string | undefined => normalizeChat(value) ?? normalizeChat(record(value)._serialized);

function eventChat(event: string, payload: unknown): string | undefined {
  const root = record(payload), message = record(root.message);
  if (event.startsWith('message.') || event.startsWith('broadcast.') || event.startsWith('media.')) {
    return chatValue(message.chatId) ?? chatValue(record(message.chat).id)
      ?? chatValue(message.fromMe ? message.to : message.from) ?? messageChat(message.id)
      ?? chatValue(root.chatId);
  }
  const item = record(root.response ?? root.call ?? root.state ?? root.vote ?? root.event ?? root.reaction ?? root.chat ?? root.ack);
  return chatValue(root.chatId) ?? chatValue(root.groupId) ?? chatValue(item.chatId)
    ?? chatValue(item.peer) ?? chatValue(record(item.chat).id)
    ?? (event.startsWith('chat.') ? chatValue(item.id) : undefined)
    ?? (event === 'ack.changed' ? messageChat(item.id) : undefined)
    ?? chatValue(root.from);
}

export class HookRejectedError extends Error {
  readonly code = 'PLUGIN_HOOK_REJECTED';
  readonly outcome = 'not_sent';
  constructor() { super('The host hook blocked this plugin operation.'); }
}

/** Every plugin subscription and invocation passes through this boundary. */
export class HookPipeline {
  private allow?: Set<string>;
  private hooks: HostHooks;
  constructor(hooks: HostHooks = {}, private activeCall?: () => Promise<unknown>) {
    this.hooks = HooksConfigSchema.parse(hooks);
    this.allow = this.hooks.chatFilter ? new Set(this.hooks.chatFilter.allow) : undefined;
  }
  chatAllowed(peer: unknown): boolean { return !this.allow || this.allow.has(chatValue(peer) ?? ''); }
  private eventInScope(context: EventHookContext): boolean {
    if (!this.allow) return true;
    const chat = eventChat(context.event, context.payload);
    if (chat) return this.allow.has(chat);
    // Session/lifecycle events have no chat. Unidentified chat events are denied.
    return /^(?:core|client|auth|launch|session|device|error)\./.test(context.event);
  }
  async beforeEvent(context: EventHookContext): Promise<boolean> {
    const checked = Object.freeze({ ...context });
    if (!this.eventInScope(checked)) return false;
    if (await this.hooks.beforeEvent?.(checked) === false) return false;
    return this.eventInScope(checked);
  }
  private async actionInScope(context: ActionHookContext, boundPeer?: unknown): Promise<boolean> {
    if (!this.allow) return true;
    if (boundPeer !== undefined) return this.chatAllowed(boundPeer);
    if (['getLicenseFeatures', 'getActiveCall', 'getCallCapabilities'].includes(context.method)) return true;
    const definition = clientRegistry.resolve(context.method);
    if (!definition) return false;
    const { meta } = definition;
    const supplied = context.args;
    const args = Array.isArray(supplied)
      ? Object.fromEntries(meta.parameterOrder.map((key, index) => [key, supplied[index]]))
      : supplied;
    const targets: string[] = [];
    for (const [name, value] of Object.entries(args)) {
      const parameter = meta.inputSchema.shape[name];
      const brand = parameter && parameterRegistry.get(parameter)?.brandedType;
      if (['to', 'chatId', 'groupId'].includes(name) || brand === 'ChatId' || brand === 'GroupChatId') {
        for (const target of Array.isArray(value) ? value : [value]) {
          const chat = chatValue(target);
          if (!chat) return false;
          targets.push(chat);
        }
      } else if (brand === 'MessageId') {
        const chat = messageChat(value); if (chat) targets.push(chat);
      } else if (name === 'message' && value && typeof value === 'object') {
        const chat = eventChat('message.received', { message: value });
        if (!chat) return false;
        targets.push(chat);
      }
    }
    if (args.call !== undefined) {
      const active = record(await this.activeCall?.()), identity = record(args.call);
      if (!active.peer || active.id !== identity.id || active.generation !== identity.generation) return false;
      return this.chatAllowed(active.peer);
    }
    if (targets.length) return targets.every(chat => this.allow!.has(chat));
    // Chatless writes and unregistered operations cannot escape a chat scope.
    return meta.action === 'read';
  }
  async beforeAction(context: ActionHookContext, boundPeer?: unknown): Promise<void> {
    const checked = Object.freeze({ ...context });
    if (!await this.actionInScope(checked, boundPeer)) throw new HookRejectedError();
    if (await this.hooks.beforeAction?.(checked) === false) throw new HookRejectedError();
    if (!await this.actionInScope(checked, boundPeer)) throw new HookRejectedError();
  }
  result<T>(value: T, context: Omit<ActionHookContext, 'method' | 'args'>): T {
    if (!this.hooks.chatFilter && !this.hooks.beforeAction) return value;
    const call = record(value);
    if (!call.peer || !call.id || !call.generation) return value;
    const boundPeer = call.peer;
    if (!this.chatAllowed(boundPeer)) return null as T;
    // Hydrated call methods are non-configurable and non-writable. A Proxy
    // cannot return a replacement function for those properties. Copy their
    // descriptors to a facade and guard the methods before defining them.
    const guarded = Object.create(Object.getPrototypeOf(call));
    for (const name of Reflect.ownKeys(call)) {
      const descriptor = Object.getOwnPropertyDescriptor(call, name)!;
      const member = descriptor.value;
      if (typeof member === 'function') descriptor.value = async (...args: unknown[]) => {
        await this.beforeAction({ ...context, method: `call.${String(name)}`, args }, boundPeer);
        return Reflect.apply(member, call, args);
      };
      Object.defineProperty(guarded, name, descriptor);
    }
    return guarded as T;
  }
}
