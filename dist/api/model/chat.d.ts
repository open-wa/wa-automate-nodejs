import { ChatId } from './aliases';
import { Contact } from './contact';
import { GroupMetadata } from './group-metadata';
export interface Chat {
    archive: boolean;
    changeNumberNewJid: any;
    changeNumberOldJid: any;
    contact: Contact;
    groupMetadata: GroupMetadata;
    id: ChatId;
    isAnnounceGrpRestrict: any;
    formattedTitle?: string;
    canSend?: boolean;
    isGroup: boolean;
    isReadOnly: boolean;
    kind: string;
    labels: any;
    lastReceivedKey: any;
    modifyTag: number;
    msgs: any;
    muteExpiration: number;
    name: string;
    notSpam: boolean;
    pendingMsgs: boolean;
    pin: number;
    presence: any;
    t: number;
    unreadCount: number;
    ack?: any;
    /**
     * @deprecated This is unreliable. Use the method [`isChatOnline`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#ischatonline) instead.
     */
    isOnline?: any;
    /**
     * @deprecated This is unreliable. Use the method [`getLastSeen`](https://open-wa.github.io/wa-automate-nodejs/classes/client.html#getlastseen) instead.
     */
    lastSeen?: any;
}
export interface LiveLocationChangedEvent {
    id: string;
    lat: number;
    lng: number;
    speed: number;
    lastUpdated: number;
    accuracy: number;
    degrees: any;
    /**
     * The message id that was sent when the liveLocation session was started.
     */
    msgId?: string;
}
/**
 * The ChatState represents the state you'd normally see represented under the chat name in the app.
 */
export declare enum ChatState {
    /**
     * `typing...`
     */
    TYPING = 0,
    /**
     * `recording audio...`
     */
    RECORDING = 1,
    /**
     * `online`
     */
    PAUSED = 2
}
/**
 * Chat types
 * @readonly
 * @enum {string}
 */
export declare enum ChatTypes {
    SOLO = "solo",
    GROUP = "group",
    UNKNOWN = "unknown"
}
/**
 * Valid durations for muting a chat using [[muteChat]]
 *
 * @readonly
 */
export declare enum ChatMuteDuration {
    /**
     * Mutes chat for 8 hours
     */
    EIGHT_HOURS = "EIGHT_HOURS",
    /**
     * Mutes chat for 1 week
     */
    ONE_WEEK = "ONE_WEEK",
    /**
     * Mutes chat forever
     */
    FOREVER = "FOREVER"
}
