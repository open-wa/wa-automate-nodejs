import { ContactId } from "./aliases";
import { Message, MessageAck } from "./message";
export type Reaction = {
    aggregateEmoji: string;
    id: string;
    hasReactionByMe: boolean;
    senders: ReactionRecord[];
};
export type ReactionRecord = {
    ack: MessageAck;
    id: string;
    msgKey: string;
    parentMsgKey: string;
    orphan: number;
    reactionText: string;
    read: boolean;
    senderUserJid: ContactId;
    timestamp: number;
};
export type ReactionEvent = {
    message: Message;
    reactionByMe: Reaction;
    reactions: Reaction[];
    type: 'add' | 'change';
};
//# sourceMappingURL=reactions.d.ts.map