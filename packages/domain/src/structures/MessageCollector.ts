import { HyperEmitter } from '@open-wa/hyperemitter';
import type { Message, MessageId, ChatId, Chat } from '@open-wa/schema';
import { Collector, CollectorFilter, CollectorOptions, Collection } from './Collector.js';

export interface MessageCollectorOptions extends CollectorOptions {
  maxProcessed?: number;
}

export interface MessageCollectorEvents {
  'message.received': { message: Message };
  'message.deleted': { messageId: string; chatId: string };
  'chat.deleted': { chatId: string };
  'group.removedFromGroup': { groupId: string };
}

export class MessageCollector extends Collector<Message> {
  public readonly chatId: ChatId;
  public readonly sessionId: string;
  public received: number;

  private readonly events: HyperEmitter<MessageCollectorEvents>;
  private readonly cleanupFns: Array<() => void> = [];

  constructor(
    sessionId: string,
    chatId: ChatId,
    filter: CollectorFilter<[Message]>,
    events: HyperEmitter<MessageCollectorEvents>,
    options: MessageCollectorOptions = {}
  ) {
    super(filter, options);

    this.events = events;
    this.sessionId = sessionId;
    this.chatId = chatId;
    this.received = 0;

    this.incrementMaxListeners();
    this.setupListeners();

    this.once('end', () => {
      this.teardownListeners();
      this.decrementMaxListeners();
    });
  }

  private setupListeners(): void {
    const collectHandler = (payload: { message: Message }): void => {
      void this.handleCollect(payload.message);
    };

    const disposeHandler = (payload: { messageId: string; chatId: string }): void => {
      if (payload.chatId === this.chatId) {
        void this.handleDispose({ id: payload.messageId } as Message);
      }
    };

    const chatDeleteHandler = (payload: { chatId: string }): void => {
      if (payload.chatId === this.chatId) {
        this.stop('chatDelete');
      }
    };

    const groupRemovalHandler = (payload: { groupId: string }): void => {
      if (payload.groupId === this.chatId) {
        this.stop('groupRemoval');
      }
    };

    this.events.on('message.received', collectHandler);
    this.events.on('message.deleted', disposeHandler);
    this.events.on('chat.deleted', chatDeleteHandler);
    this.events.on('group.removedFromGroup', groupRemovalHandler);

    this.cleanupFns.push(
      () => this.events.off('message.received', collectHandler),
      () => this.events.off('message.deleted', disposeHandler),
      () => this.events.off('chat.deleted', chatDeleteHandler),
      () => this.events.off('group.removedFromGroup', groupRemovalHandler)
    );
  }

  private teardownListeners(): void {
    for (const cleanup of this.cleanupFns) {
      cleanup();
    }
    this.cleanupFns.length = 0;
  }

  collect(message: Message): MessageId | null {
    if (message.chatId !== this.chatId) return null;
    this.received++;
    return message.id;
  }

  dispose(message: Message): MessageId | null {
    if (message.chatId !== this.chatId) return null;
    return message.id;
  }

  endReason(): string | null {
    if (this.options.max && this.collected.size >= this.options.max) {
      return 'limit';
    }
    const maxProcessed = (this.options as MessageCollectorOptions).maxProcessed;
    if (maxProcessed && this.received >= maxProcessed) {
      return 'processedLimit';
    }
    return null;
  }
}

export interface AwaitMessagesOptions extends MessageCollectorOptions {
  errors?: string[];
}

export async function awaitMessages(
  sessionId: string,
  chatId: ChatId,
  events: HyperEmitter<MessageCollectorEvents>,
  filter: CollectorFilter<[Message]>,
  options: AwaitMessagesOptions = {}
): Promise<Collection<string, Message>> {
  return new Promise((resolve, reject) => {
    const collector = new MessageCollector(sessionId, chatId, filter, events, options);

    collector.once('end', (collected, reason) => {
      if (options.errors?.includes(reason)) {
        reject(collected);
      } else {
        resolve(collected);
      }
    });
  });
}
