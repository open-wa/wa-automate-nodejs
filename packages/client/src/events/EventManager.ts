import PQueue from 'p-queue';
import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { OpenWAEventMap, STATE } from '@open-wa/core';
import { eventRegistry, type QueueOptions } from '@open-wa/schema';
import type { Message, MessageId } from '@open-wa/schema';

export interface EventContext {
  sessionId: string;
  timestamp: number;
  raw?: unknown;
}

export interface ListenerHandle {
  id: string;
  event: string;
  off: () => void;
  active: boolean;
}

export interface ListenerManagerConfig {
  sessionId: string;
  events: HyperEmitter<OpenWAEventMap>;
}

type EventPayloadMap = {
  message: Message;
  anyMessage: Message;
  messageDeleted: { messageId: string; chatId: string; by?: string };
  ack: { id: MessageId; chatId: string; ack: number; timestamp?: number };
  stateChanged: { state: STATE; previousState?: STATE };
  logout: { reason?: string; timestamp: number };
};

type EventName = keyof EventPayloadMap;
type EventHandler<K extends EventName> = (payload: EventPayloadMap[K], ctx: EventContext) => void | Promise<void>;

type RuntimeBridge<K extends EventName> = {
  runtimeEvent: keyof OpenWAEventMap;
  transform: (payload: OpenWAEventMap[keyof OpenWAEventMap]) => EventPayloadMap[K] | null;
};

const EVENT_BRIDGES: { [K in EventName]: RuntimeBridge<K> } = {
  message: {
    runtimeEvent: 'message.received',
    transform: (payload) => (payload as OpenWAEventMap['message.received'])?.message as Message,
  },
  anyMessage: {
    runtimeEvent: 'message.any',
    transform: (payload) => (payload as OpenWAEventMap['message.any'])?.message as Message,
  },
  messageDeleted: {
    runtimeEvent: 'message.deleted',
    transform: (payload) => {
      const deleted = payload as OpenWAEventMap['message.deleted'];
      return {
        messageId: deleted.messageId,
        chatId: deleted.chatId,
        by: deleted.by,
      };
    },
  },
  ack: {
    runtimeEvent: 'ack.changed',
    transform: (payload) => {
      const ackPayload = (payload as OpenWAEventMap['ack.changed'])?.ack as Record<string, unknown> | undefined;
      if (!ackPayload) {
        return null;
      }

      return {
        id: String(ackPayload.id ?? ackPayload.messageId ?? '') as MessageId,
        chatId: String(ackPayload.chatId ?? ''),
        ack: Number(ackPayload.ack ?? 0),
        timestamp: typeof ackPayload.timestamp === 'number' ? ackPayload.timestamp : undefined,
      };
    },
  },
  stateChanged: {
    runtimeEvent: 'session.state.changed',
    transform: (payload) => {
      const details = (payload as OpenWAEventMap['session.state.changed'])?.details;
      if (!details?.next) {
        return null;
      }

      return {
        state: details.next,
        previousState: details.prev,
      };
    },
  },
  logout: {
    runtimeEvent: 'session.logout',
    transform: (payload) => {
      const details = (payload as OpenWAEventMap['session.logout'])?.details;
      return {
        reason: details?.reason,
        timestamp: Date.now(),
      };
    },
  },
};

export class ListenerManager {
  private readonly events: HyperEmitter<OpenWAEventMap>;
  private readonly sessionId: string;
  private readonly handles = new Map<string, ListenerHandle>();
  private readonly queues = new Map<string, PQueue>();
  private readonly listeners = new Map<EventName, Map<string, EventHandler<EventName>>>();
  private readonly bridgeHandlers = new Map<EventName, (rawPayload: OpenWAEventMap[keyof OpenWAEventMap]) => void | Promise<void>>();
  private handleCounter = 0;

  constructor(config: ListenerManagerConfig) {
    this.events = config.events;
    this.sessionId = config.sessionId;
  }

  on<K extends EventName>(eventName: K, handler: EventHandler<K>, options?: QueueOptions): ListenerHandle {
    const eventDef = eventRegistry.get(eventName);

    if (!eventDef || !EVENT_BRIDGES[eventName]) {
      throw new Error(`Unsupported listener event: ${eventName}`);
    }

    this.ensureAutobind(eventName);

    const id = `listener_${++this.handleCounter}`;
    const mergedOptions = {
      ...eventDef.meta.defaultQueueOptions,
      ...options,
    };

    let queue: PQueue | undefined;
    if (mergedOptions && Object.keys(mergedOptions).length > 0) {
      const queueKey = `${eventName}_${id}`;
      const queueConfig: ConstructorParameters<typeof PQueue>[0] = {
        concurrency: mergedOptions.concurrency ?? 1,
        ...(typeof mergedOptions.intervalCap === 'number' ? { intervalCap: mergedOptions.intervalCap } : {}),
        ...(typeof mergedOptions.interval === 'number' ? { interval: mergedOptions.interval } : {}),
        ...(typeof mergedOptions.timeout === 'number' ? { timeout: mergedOptions.timeout } : {}),
      };

      queue = new PQueue(queueConfig);
      this.queues.set(queueKey, queue);
    }

    const wrappedHandler: EventHandler<K> = async (validatedPayload, ctx) => {
      const execute = async () => {
        await handler(validatedPayload, ctx);
      };

      if (queue) {
        await queue.add(execute, { priority: mergedOptions.priority ?? 0 });
      } else {
        await execute();
      }
    };

    const eventListeners = this.listeners.get(eventName) ?? new Map<string, EventHandler<EventName>>();
    eventListeners.set(id, wrappedHandler as EventHandler<EventName>);
    this.listeners.set(eventName, eventListeners);

    const handle: ListenerHandle = {
      id,
      event: eventName,
      active: true,
      off: () => {
        const boundListeners = this.listeners.get(eventName);
        boundListeners?.delete(id);
        if (boundListeners && boundListeners.size === 0) {
          this.listeners.delete(eventName);
        }
        this.queues.delete(`${eventName}_${id}`);
        handle.active = false;
        this.handles.delete(id);
      },
    };

    this.handles.set(id, handle);
    return handle;
  }

  autobindAll(): void {
    for (const eventName of Object.keys(EVENT_BRIDGES) as EventName[]) {
      this.ensureAutobind(eventName);
    }
  }

  async waitForQueuesToDrain(): Promise<void> {
    const queues = [...this.queues.values()];
    for (const queue of queues) {
      await queue.onEmpty();
      await queue.onIdle();
    }
  }

  private ensureAutobind<K extends EventName>(eventName: K): void {
    if (this.bridgeHandlers.has(eventName)) {
      return;
    }

    const eventDef = eventRegistry.get(eventName);
    const bridge = EVENT_BRIDGES[eventName];

    if (!eventDef || !bridge) {
      throw new Error(`Unsupported listener event: ${eventName}`);
    }

    const runtimeHandler = async (rawPayload: OpenWAEventMap[keyof OpenWAEventMap]) => {
      const ctx: EventContext = {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        raw: rawPayload,
      };

      const transformed = bridge.transform(rawPayload);
      if (!transformed) {
        return;
      }

      let validatedPayload: EventPayloadMap[K];
      try {
        validatedPayload = eventDef.meta.payloadSchema.parse(transformed) as EventPayloadMap[K];
      } catch {
        return;
      }

      const listeners = [...(this.listeners.get(eventName)?.values() ?? [])] as Array<EventHandler<K>>;
      for (const listener of listeners) {
        await listener(validatedPayload, ctx);
      }
    };

    this.bridgeHandlers.set(eventName, runtimeHandler as (rawPayload: OpenWAEventMap[keyof OpenWAEventMap]) => void | Promise<void>);
    this.events.on(bridge.runtimeEvent, runtimeHandler as (payload: OpenWAEventMap[typeof bridge.runtimeEvent]) => void | Promise<void>);
  }
}
