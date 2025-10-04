import { ContactId } from "./aliases";
import { Message, MessageAck } from "./message";

/**
 * A reaction is identified the specific emoji.
 */
export type Reaction = {
    /**
     * The aggregate emoji used for the reaction.
     */
    aggregateEmoji: string;
    /**
     * The identifier of the reaction
     */
    id: string;
    /**
     * If the reaction is also sent by the host account
     */
    hasReactionByMe: boolean;
    /**
     * The senders of this spefcific reaction
     */
    senders: ReactionRecord[];
}

/**
 * The specific reaction by a user
 */
export type ReactionRecord = {
    /**
     * The acknowledgement of the reaction
     */
    ack: MessageAck;
    /**
     * The ID of the reaction
     */
    id: string;

    msgKey: string;
    parentMsgKey: string;
    orphan: number;
    /**
     * The text of the reaction
     */
    reactionText: string;
    /**
     * If the reaction has been read
     */
    read: boolean;
    /**
     * The ID of the reaction sender
     */
    senderUserJid: ContactId;
    /**
     * The timestamp of the reaction
     */
    timestamp: number;
}

/**
 * Emitted by onReaction
 */
export type ReactionEvent = {
    /**
     * The message being reacted to
     */
    message: Message;
    /**
     * The reaction sent by the host account
     */
    reactionByMe: Reaction;
    /**
     * An array of all reactions
     */
    reactions: Reaction[];
    /**
     * The type of the reaction event.
     */
    type: 'add' | 'change';
}