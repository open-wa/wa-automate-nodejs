import { EventEmitter2 } from 'eventemitter2';
import { Chat, ChatId, Message, MessageId } from '../api/model';
import { SimpleListener } from '../api/model/events';
import { Collector, CollectorOptions } from './Collector';
export declare class MessageCollector extends Collector {
    chat: ChatId;
    received: number;
    sessionId: string;
    instanceId: string;
    ev: EventEmitter2;
    constructor(sessionId: string, instanceId: string, chat: ChatId, filter: (...args: any[]) => boolean | Promise<boolean>, options: CollectorOptions, openWaEventEmitter: EventEmitter2);
    collect(message: Message): MessageId;
    dispose(message: Message): MessageId | null;
    endReason(): string | null;
    _handleChatDeletion(chat: Chat): void;
    _handleGroupRemoval(chat: Chat): void;
    _handleGuildDeletion(guild: string): void;
    eventSignature(event: SimpleListener): string;
    wrapHandler(handler: (data: any) => any): ({ data }: {
        data: any;
    }) => any;
}
//# sourceMappingURL=MessageCollector.d.ts.map