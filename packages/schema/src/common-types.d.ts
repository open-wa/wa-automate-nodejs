import { z } from 'zod';
export declare const ContactIdSchema: z.ZodBranded<z.ZodString, "ContactId">;
export type ContactId = z.infer<typeof ContactIdSchema>;
export declare const ChatIdSchema: z.ZodBranded<z.ZodString, "ChatId">;
export type ChatId = z.infer<typeof ChatIdSchema>;
export declare const MessageIdSchema: z.ZodBranded<z.ZodString, "MessageId">;
export type MessageId = z.infer<typeof MessageIdSchema>;
export declare const GroupChatIdSchema: z.ZodBranded<z.ZodString, "GroupChatId">;
export type GroupChatId = z.infer<typeof GroupChatIdSchema>;
export declare const IdSchema: z.ZodObject<{
    server: z.ZodString;
    user: z.ZodString;
    _serialized: z.ZodString;
}, "strip", z.ZodTypeAny, {
    user?: string;
    server?: string;
    _serialized?: string;
}, {
    user?: string;
    server?: string;
    _serialized?: string;
}>;
export type Id = z.infer<typeof IdSchema>;
export declare enum MessageTypes {
    TEXT = "chat",
    AUDIO = "audio",
    VOICE = "ptt",
    IMAGE = "image",
    VIDEO = "video",
    DOCUMENT = "document",
    STICKER = "sticker",
    LOCATION = "location",
    CONTACT_CARD = "vcard",
    CONTACT_CARD_MULTI = "multi_vcard",
    REVOKED = "revoked",
    ORDER = "order",
    BUTTONS_RESPONSE = "buttons_response",
    LIST_RESPONSE = "list_response",
    UNKNOWN = "unknown"
}
export declare enum MessageAck {
    ACK_ERROR = -1,
    ACK_PENDING = 0,
    ACK_SERVER = 1,
    ACK_DEVICE = 2,
    ACK_READ = 3,
    ACK_PLAYED = 4
}
export declare const ContactSchema: z.ZodObject<{
    id: z.ZodBranded<z.ZodString, "ContactId">;
    name: z.ZodOptional<z.ZodString>;
    shortName: z.ZodOptional<z.ZodString>;
    pushname: z.ZodOptional<z.ZodString>;
    formattedName: z.ZodOptional<z.ZodString>;
    isBusiness: z.ZodOptional<z.ZodBoolean>;
    isEnterprise: z.ZodOptional<z.ZodBoolean>;
    isMe: z.ZodOptional<z.ZodBoolean>;
    isMyContact: z.ZodOptional<z.ZodBoolean>;
    isPSA: z.ZodOptional<z.ZodBoolean>;
    isUser: z.ZodOptional<z.ZodBoolean>;
    isWAContact: z.ZodOptional<z.ZodBoolean>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    profilePicThumbObj: z.ZodOptional<z.ZodObject<{
        eurl: z.ZodOptional<z.ZodString>;
        id: z.ZodOptional<z.ZodObject<{
            server: z.ZodString;
            user: z.ZodString;
            _serialized: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            user?: string;
            server?: string;
            _serialized?: string;
        }, {
            user?: string;
            server?: string;
            _serialized?: string;
        }>>;
        img: z.ZodOptional<z.ZodString>;
        imgFull: z.ZodOptional<z.ZodString>;
        tag: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: {
            user?: string;
            server?: string;
            _serialized?: string;
        };
        eurl?: string;
        img?: string;
        imgFull?: string;
        tag?: string;
    }, {
        id?: {
            user?: string;
            server?: string;
            _serialized?: string;
        };
        eurl?: string;
        img?: string;
        imgFull?: string;
        tag?: string;
    }>>;
    statusMute: z.ZodOptional<z.ZodBoolean>;
    type: z.ZodOptional<z.ZodString>;
    verifiedLevel: z.ZodOptional<z.ZodNumber>;
    verifiedName: z.ZodOptional<z.ZodString>;
    isOnline: z.ZodOptional<z.ZodBoolean>;
    lastSeen: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodBranded<z.ZodString, "ContactId">;
    name: z.ZodOptional<z.ZodString>;
    shortName: z.ZodOptional<z.ZodString>;
    pushname: z.ZodOptional<z.ZodString>;
    formattedName: z.ZodOptional<z.ZodString>;
    isBusiness: z.ZodOptional<z.ZodBoolean>;
    isEnterprise: z.ZodOptional<z.ZodBoolean>;
    isMe: z.ZodOptional<z.ZodBoolean>;
    isMyContact: z.ZodOptional<z.ZodBoolean>;
    isPSA: z.ZodOptional<z.ZodBoolean>;
    isUser: z.ZodOptional<z.ZodBoolean>;
    isWAContact: z.ZodOptional<z.ZodBoolean>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    profilePicThumbObj: z.ZodOptional<z.ZodObject<{
        eurl: z.ZodOptional<z.ZodString>;
        id: z.ZodOptional<z.ZodObject<{
            server: z.ZodString;
            user: z.ZodString;
            _serialized: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            user?: string;
            server?: string;
            _serialized?: string;
        }, {
            user?: string;
            server?: string;
            _serialized?: string;
        }>>;
        img: z.ZodOptional<z.ZodString>;
        imgFull: z.ZodOptional<z.ZodString>;
        tag: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: {
            user?: string;
            server?: string;
            _serialized?: string;
        };
        eurl?: string;
        img?: string;
        imgFull?: string;
        tag?: string;
    }, {
        id?: {
            user?: string;
            server?: string;
            _serialized?: string;
        };
        eurl?: string;
        img?: string;
        imgFull?: string;
        tag?: string;
    }>>;
    statusMute: z.ZodOptional<z.ZodBoolean>;
    type: z.ZodOptional<z.ZodString>;
    verifiedLevel: z.ZodOptional<z.ZodNumber>;
    verifiedName: z.ZodOptional<z.ZodString>;
    isOnline: z.ZodOptional<z.ZodBoolean>;
    lastSeen: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodBranded<z.ZodString, "ContactId">;
    name: z.ZodOptional<z.ZodString>;
    shortName: z.ZodOptional<z.ZodString>;
    pushname: z.ZodOptional<z.ZodString>;
    formattedName: z.ZodOptional<z.ZodString>;
    isBusiness: z.ZodOptional<z.ZodBoolean>;
    isEnterprise: z.ZodOptional<z.ZodBoolean>;
    isMe: z.ZodOptional<z.ZodBoolean>;
    isMyContact: z.ZodOptional<z.ZodBoolean>;
    isPSA: z.ZodOptional<z.ZodBoolean>;
    isUser: z.ZodOptional<z.ZodBoolean>;
    isWAContact: z.ZodOptional<z.ZodBoolean>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    profilePicThumbObj: z.ZodOptional<z.ZodObject<{
        eurl: z.ZodOptional<z.ZodString>;
        id: z.ZodOptional<z.ZodObject<{
            server: z.ZodString;
            user: z.ZodString;
            _serialized: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            user?: string;
            server?: string;
            _serialized?: string;
        }, {
            user?: string;
            server?: string;
            _serialized?: string;
        }>>;
        img: z.ZodOptional<z.ZodString>;
        imgFull: z.ZodOptional<z.ZodString>;
        tag: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: {
            user?: string;
            server?: string;
            _serialized?: string;
        };
        eurl?: string;
        img?: string;
        imgFull?: string;
        tag?: string;
    }, {
        id?: {
            user?: string;
            server?: string;
            _serialized?: string;
        };
        eurl?: string;
        img?: string;
        imgFull?: string;
        tag?: string;
    }>>;
    statusMute: z.ZodOptional<z.ZodBoolean>;
    type: z.ZodOptional<z.ZodString>;
    verifiedLevel: z.ZodOptional<z.ZodNumber>;
    verifiedName: z.ZodOptional<z.ZodString>;
    isOnline: z.ZodOptional<z.ZodBoolean>;
    lastSeen: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export type Contact = z.infer<typeof ContactSchema>;
export declare const ChatSchema: z.ZodObject<{
    id: z.ZodUnion<[z.ZodBranded<z.ZodString, "ContactId">, z.ZodBranded<z.ZodString, "GroupChatId">]>;
    name: z.ZodOptional<z.ZodString>;
    formattedTitle: z.ZodOptional<z.ZodString>;
    isGroup: z.ZodBoolean;
    contact: z.ZodObject<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>;
    groupMetadata: z.ZodOptional<z.ZodAny>;
    presence: z.ZodOptional<z.ZodAny>;
    t: z.ZodOptional<z.ZodNumber>;
    unreadCount: z.ZodOptional<z.ZodNumber>;
    lastReceivedKey: z.ZodOptional<z.ZodAny>;
    msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    isReadOnly: z.ZodOptional<z.ZodBoolean>;
    muteExpiration: z.ZodOptional<z.ZodNumber>;
    notSpam: z.ZodOptional<z.ZodBoolean>;
    pin: z.ZodOptional<z.ZodNumber>;
    ack: z.ZodOptional<z.ZodAny>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodUnion<[z.ZodBranded<z.ZodString, "ContactId">, z.ZodBranded<z.ZodString, "GroupChatId">]>;
    name: z.ZodOptional<z.ZodString>;
    formattedTitle: z.ZodOptional<z.ZodString>;
    isGroup: z.ZodBoolean;
    contact: z.ZodObject<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>;
    groupMetadata: z.ZodOptional<z.ZodAny>;
    presence: z.ZodOptional<z.ZodAny>;
    t: z.ZodOptional<z.ZodNumber>;
    unreadCount: z.ZodOptional<z.ZodNumber>;
    lastReceivedKey: z.ZodOptional<z.ZodAny>;
    msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    isReadOnly: z.ZodOptional<z.ZodBoolean>;
    muteExpiration: z.ZodOptional<z.ZodNumber>;
    notSpam: z.ZodOptional<z.ZodBoolean>;
    pin: z.ZodOptional<z.ZodNumber>;
    ack: z.ZodOptional<z.ZodAny>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodUnion<[z.ZodBranded<z.ZodString, "ContactId">, z.ZodBranded<z.ZodString, "GroupChatId">]>;
    name: z.ZodOptional<z.ZodString>;
    formattedTitle: z.ZodOptional<z.ZodString>;
    isGroup: z.ZodBoolean;
    contact: z.ZodObject<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>;
    groupMetadata: z.ZodOptional<z.ZodAny>;
    presence: z.ZodOptional<z.ZodAny>;
    t: z.ZodOptional<z.ZodNumber>;
    unreadCount: z.ZodOptional<z.ZodNumber>;
    lastReceivedKey: z.ZodOptional<z.ZodAny>;
    msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    isReadOnly: z.ZodOptional<z.ZodBoolean>;
    muteExpiration: z.ZodOptional<z.ZodNumber>;
    notSpam: z.ZodOptional<z.ZodBoolean>;
    pin: z.ZodOptional<z.ZodNumber>;
    ack: z.ZodOptional<z.ZodAny>;
}, z.ZodTypeAny, "passthrough">>;
export type Chat = z.infer<typeof ChatSchema>;
export declare const MessageSchema: z.ZodObject<z.objectUtil.extendShape<{
    id: z.ZodBranded<z.ZodString, "MessageId">;
    body: z.ZodString;
    type: z.ZodNativeEnum<typeof MessageTypes>;
    t: z.ZodNumber;
    notifyName: z.ZodOptional<z.ZodString>;
    from: z.ZodBranded<z.ZodString, "ChatId">;
    to: z.ZodBranded<z.ZodString, "ChatId">;
    self: z.ZodEnum<["in", "out"]>;
    ack: z.ZodNativeEnum<typeof MessageAck>;
    invis: z.ZodOptional<z.ZodBoolean>;
    isNewMsg: z.ZodOptional<z.ZodBoolean>;
    star: z.ZodOptional<z.ZodBoolean>;
    recvFresh: z.ZodOptional<z.ZodBoolean>;
    broadcast: z.ZodOptional<z.ZodBoolean>;
    isForwarded: z.ZodOptional<z.ZodBoolean>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    mentionedJidList: z.ZodOptional<z.ZodArray<z.ZodBranded<z.ZodString, "ContactId">, "many">>;
    caption: z.ZodOptional<z.ZodString>;
    sender: z.ZodAny;
    timestamp: z.ZodNumber;
    content: z.ZodString;
    isGroupMsg: z.ZodBoolean;
    isMMS: z.ZodOptional<z.ZodBoolean>;
    isMedia: z.ZodBoolean;
    isNotification: z.ZodBoolean;
    isPSA: z.ZodOptional<z.ZodBoolean>;
    fromMe: z.ZodBoolean;
    chat: z.ZodAny;
    chatId: z.ZodBranded<z.ZodString, "ChatId">;
    author: z.ZodOptional<z.ZodString>;
    clientUrl: z.ZodOptional<z.ZodString>;
    deprecatedMms3Url: z.ZodOptional<z.ZodString>;
    isQuotedMsgAvailable: z.ZodBoolean;
    quotedMsg: z.ZodOptional<z.ZodAny>;
    quotedMsgObj: z.ZodOptional<z.ZodAny>;
    senderId: z.ZodOptional<z.ZodString>;
}, {
    sender: z.ZodObject<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>;
    chat: z.ZodObject<{
        id: z.ZodUnion<[z.ZodBranded<z.ZodString, "ContactId">, z.ZodBranded<z.ZodString, "GroupChatId">]>;
        name: z.ZodOptional<z.ZodString>;
        formattedTitle: z.ZodOptional<z.ZodString>;
        isGroup: z.ZodBoolean;
        contact: z.ZodObject<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>;
        groupMetadata: z.ZodOptional<z.ZodAny>;
        presence: z.ZodOptional<z.ZodAny>;
        t: z.ZodOptional<z.ZodNumber>;
        unreadCount: z.ZodOptional<z.ZodNumber>;
        lastReceivedKey: z.ZodOptional<z.ZodAny>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        isReadOnly: z.ZodOptional<z.ZodBoolean>;
        muteExpiration: z.ZodOptional<z.ZodNumber>;
        notSpam: z.ZodOptional<z.ZodBoolean>;
        pin: z.ZodOptional<z.ZodNumber>;
        ack: z.ZodOptional<z.ZodAny>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodUnion<[z.ZodBranded<z.ZodString, "ContactId">, z.ZodBranded<z.ZodString, "GroupChatId">]>;
        name: z.ZodOptional<z.ZodString>;
        formattedTitle: z.ZodOptional<z.ZodString>;
        isGroup: z.ZodBoolean;
        contact: z.ZodObject<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>;
        groupMetadata: z.ZodOptional<z.ZodAny>;
        presence: z.ZodOptional<z.ZodAny>;
        t: z.ZodOptional<z.ZodNumber>;
        unreadCount: z.ZodOptional<z.ZodNumber>;
        lastReceivedKey: z.ZodOptional<z.ZodAny>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        isReadOnly: z.ZodOptional<z.ZodBoolean>;
        muteExpiration: z.ZodOptional<z.ZodNumber>;
        notSpam: z.ZodOptional<z.ZodBoolean>;
        pin: z.ZodOptional<z.ZodNumber>;
        ack: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodUnion<[z.ZodBranded<z.ZodString, "ContactId">, z.ZodBranded<z.ZodString, "GroupChatId">]>;
        name: z.ZodOptional<z.ZodString>;
        formattedTitle: z.ZodOptional<z.ZodString>;
        isGroup: z.ZodBoolean;
        contact: z.ZodObject<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>;
        groupMetadata: z.ZodOptional<z.ZodAny>;
        presence: z.ZodOptional<z.ZodAny>;
        t: z.ZodOptional<z.ZodNumber>;
        unreadCount: z.ZodOptional<z.ZodNumber>;
        lastReceivedKey: z.ZodOptional<z.ZodAny>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        isReadOnly: z.ZodOptional<z.ZodBoolean>;
        muteExpiration: z.ZodOptional<z.ZodNumber>;
        notSpam: z.ZodOptional<z.ZodBoolean>;
        pin: z.ZodOptional<z.ZodNumber>;
        ack: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">>;
}>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
    id: z.ZodBranded<z.ZodString, "MessageId">;
    body: z.ZodString;
    type: z.ZodNativeEnum<typeof MessageTypes>;
    t: z.ZodNumber;
    notifyName: z.ZodOptional<z.ZodString>;
    from: z.ZodBranded<z.ZodString, "ChatId">;
    to: z.ZodBranded<z.ZodString, "ChatId">;
    self: z.ZodEnum<["in", "out"]>;
    ack: z.ZodNativeEnum<typeof MessageAck>;
    invis: z.ZodOptional<z.ZodBoolean>;
    isNewMsg: z.ZodOptional<z.ZodBoolean>;
    star: z.ZodOptional<z.ZodBoolean>;
    recvFresh: z.ZodOptional<z.ZodBoolean>;
    broadcast: z.ZodOptional<z.ZodBoolean>;
    isForwarded: z.ZodOptional<z.ZodBoolean>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    mentionedJidList: z.ZodOptional<z.ZodArray<z.ZodBranded<z.ZodString, "ContactId">, "many">>;
    caption: z.ZodOptional<z.ZodString>;
    sender: z.ZodAny;
    timestamp: z.ZodNumber;
    content: z.ZodString;
    isGroupMsg: z.ZodBoolean;
    isMMS: z.ZodOptional<z.ZodBoolean>;
    isMedia: z.ZodBoolean;
    isNotification: z.ZodBoolean;
    isPSA: z.ZodOptional<z.ZodBoolean>;
    fromMe: z.ZodBoolean;
    chat: z.ZodAny;
    chatId: z.ZodBranded<z.ZodString, "ChatId">;
    author: z.ZodOptional<z.ZodString>;
    clientUrl: z.ZodOptional<z.ZodString>;
    deprecatedMms3Url: z.ZodOptional<z.ZodString>;
    isQuotedMsgAvailable: z.ZodBoolean;
    quotedMsg: z.ZodOptional<z.ZodAny>;
    quotedMsgObj: z.ZodOptional<z.ZodAny>;
    senderId: z.ZodOptional<z.ZodString>;
}, {
    sender: z.ZodObject<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>;
    chat: z.ZodObject<{
        id: z.ZodUnion<[z.ZodBranded<z.ZodString, "ContactId">, z.ZodBranded<z.ZodString, "GroupChatId">]>;
        name: z.ZodOptional<z.ZodString>;
        formattedTitle: z.ZodOptional<z.ZodString>;
        isGroup: z.ZodBoolean;
        contact: z.ZodObject<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>;
        groupMetadata: z.ZodOptional<z.ZodAny>;
        presence: z.ZodOptional<z.ZodAny>;
        t: z.ZodOptional<z.ZodNumber>;
        unreadCount: z.ZodOptional<z.ZodNumber>;
        lastReceivedKey: z.ZodOptional<z.ZodAny>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        isReadOnly: z.ZodOptional<z.ZodBoolean>;
        muteExpiration: z.ZodOptional<z.ZodNumber>;
        notSpam: z.ZodOptional<z.ZodBoolean>;
        pin: z.ZodOptional<z.ZodNumber>;
        ack: z.ZodOptional<z.ZodAny>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodUnion<[z.ZodBranded<z.ZodString, "ContactId">, z.ZodBranded<z.ZodString, "GroupChatId">]>;
        name: z.ZodOptional<z.ZodString>;
        formattedTitle: z.ZodOptional<z.ZodString>;
        isGroup: z.ZodBoolean;
        contact: z.ZodObject<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>;
        groupMetadata: z.ZodOptional<z.ZodAny>;
        presence: z.ZodOptional<z.ZodAny>;
        t: z.ZodOptional<z.ZodNumber>;
        unreadCount: z.ZodOptional<z.ZodNumber>;
        lastReceivedKey: z.ZodOptional<z.ZodAny>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        isReadOnly: z.ZodOptional<z.ZodBoolean>;
        muteExpiration: z.ZodOptional<z.ZodNumber>;
        notSpam: z.ZodOptional<z.ZodBoolean>;
        pin: z.ZodOptional<z.ZodNumber>;
        ack: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodUnion<[z.ZodBranded<z.ZodString, "ContactId">, z.ZodBranded<z.ZodString, "GroupChatId">]>;
        name: z.ZodOptional<z.ZodString>;
        formattedTitle: z.ZodOptional<z.ZodString>;
        isGroup: z.ZodBoolean;
        contact: z.ZodObject<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>;
        groupMetadata: z.ZodOptional<z.ZodAny>;
        presence: z.ZodOptional<z.ZodAny>;
        t: z.ZodOptional<z.ZodNumber>;
        unreadCount: z.ZodOptional<z.ZodNumber>;
        lastReceivedKey: z.ZodOptional<z.ZodAny>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        isReadOnly: z.ZodOptional<z.ZodBoolean>;
        muteExpiration: z.ZodOptional<z.ZodNumber>;
        notSpam: z.ZodOptional<z.ZodBoolean>;
        pin: z.ZodOptional<z.ZodNumber>;
        ack: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">>;
}>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
    id: z.ZodBranded<z.ZodString, "MessageId">;
    body: z.ZodString;
    type: z.ZodNativeEnum<typeof MessageTypes>;
    t: z.ZodNumber;
    notifyName: z.ZodOptional<z.ZodString>;
    from: z.ZodBranded<z.ZodString, "ChatId">;
    to: z.ZodBranded<z.ZodString, "ChatId">;
    self: z.ZodEnum<["in", "out"]>;
    ack: z.ZodNativeEnum<typeof MessageAck>;
    invis: z.ZodOptional<z.ZodBoolean>;
    isNewMsg: z.ZodOptional<z.ZodBoolean>;
    star: z.ZodOptional<z.ZodBoolean>;
    recvFresh: z.ZodOptional<z.ZodBoolean>;
    broadcast: z.ZodOptional<z.ZodBoolean>;
    isForwarded: z.ZodOptional<z.ZodBoolean>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    mentionedJidList: z.ZodOptional<z.ZodArray<z.ZodBranded<z.ZodString, "ContactId">, "many">>;
    caption: z.ZodOptional<z.ZodString>;
    sender: z.ZodAny;
    timestamp: z.ZodNumber;
    content: z.ZodString;
    isGroupMsg: z.ZodBoolean;
    isMMS: z.ZodOptional<z.ZodBoolean>;
    isMedia: z.ZodBoolean;
    isNotification: z.ZodBoolean;
    isPSA: z.ZodOptional<z.ZodBoolean>;
    fromMe: z.ZodBoolean;
    chat: z.ZodAny;
    chatId: z.ZodBranded<z.ZodString, "ChatId">;
    author: z.ZodOptional<z.ZodString>;
    clientUrl: z.ZodOptional<z.ZodString>;
    deprecatedMms3Url: z.ZodOptional<z.ZodString>;
    isQuotedMsgAvailable: z.ZodBoolean;
    quotedMsg: z.ZodOptional<z.ZodAny>;
    quotedMsgObj: z.ZodOptional<z.ZodAny>;
    senderId: z.ZodOptional<z.ZodString>;
}, {
    sender: z.ZodObject<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodBranded<z.ZodString, "ContactId">;
        name: z.ZodOptional<z.ZodString>;
        shortName: z.ZodOptional<z.ZodString>;
        pushname: z.ZodOptional<z.ZodString>;
        formattedName: z.ZodOptional<z.ZodString>;
        isBusiness: z.ZodOptional<z.ZodBoolean>;
        isEnterprise: z.ZodOptional<z.ZodBoolean>;
        isMe: z.ZodOptional<z.ZodBoolean>;
        isMyContact: z.ZodOptional<z.ZodBoolean>;
        isPSA: z.ZodOptional<z.ZodBoolean>;
        isUser: z.ZodOptional<z.ZodBoolean>;
        isWAContact: z.ZodOptional<z.ZodBoolean>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        profilePicThumbObj: z.ZodOptional<z.ZodObject<{
            eurl: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodObject<{
                server: z.ZodString;
                user: z.ZodString;
                _serialized: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                user?: string;
                server?: string;
                _serialized?: string;
            }, {
                user?: string;
                server?: string;
                _serialized?: string;
            }>>;
            img: z.ZodOptional<z.ZodString>;
            imgFull: z.ZodOptional<z.ZodString>;
            tag: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }, {
            id?: {
                user?: string;
                server?: string;
                _serialized?: string;
            };
            eurl?: string;
            img?: string;
            imgFull?: string;
            tag?: string;
        }>>;
        statusMute: z.ZodOptional<z.ZodBoolean>;
        type: z.ZodOptional<z.ZodString>;
        verifiedLevel: z.ZodOptional<z.ZodNumber>;
        verifiedName: z.ZodOptional<z.ZodString>;
        isOnline: z.ZodOptional<z.ZodBoolean>;
        lastSeen: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>;
    chat: z.ZodObject<{
        id: z.ZodUnion<[z.ZodBranded<z.ZodString, "ContactId">, z.ZodBranded<z.ZodString, "GroupChatId">]>;
        name: z.ZodOptional<z.ZodString>;
        formattedTitle: z.ZodOptional<z.ZodString>;
        isGroup: z.ZodBoolean;
        contact: z.ZodObject<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>;
        groupMetadata: z.ZodOptional<z.ZodAny>;
        presence: z.ZodOptional<z.ZodAny>;
        t: z.ZodOptional<z.ZodNumber>;
        unreadCount: z.ZodOptional<z.ZodNumber>;
        lastReceivedKey: z.ZodOptional<z.ZodAny>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        isReadOnly: z.ZodOptional<z.ZodBoolean>;
        muteExpiration: z.ZodOptional<z.ZodNumber>;
        notSpam: z.ZodOptional<z.ZodBoolean>;
        pin: z.ZodOptional<z.ZodNumber>;
        ack: z.ZodOptional<z.ZodAny>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodUnion<[z.ZodBranded<z.ZodString, "ContactId">, z.ZodBranded<z.ZodString, "GroupChatId">]>;
        name: z.ZodOptional<z.ZodString>;
        formattedTitle: z.ZodOptional<z.ZodString>;
        isGroup: z.ZodBoolean;
        contact: z.ZodObject<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>;
        groupMetadata: z.ZodOptional<z.ZodAny>;
        presence: z.ZodOptional<z.ZodAny>;
        t: z.ZodOptional<z.ZodNumber>;
        unreadCount: z.ZodOptional<z.ZodNumber>;
        lastReceivedKey: z.ZodOptional<z.ZodAny>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        isReadOnly: z.ZodOptional<z.ZodBoolean>;
        muteExpiration: z.ZodOptional<z.ZodNumber>;
        notSpam: z.ZodOptional<z.ZodBoolean>;
        pin: z.ZodOptional<z.ZodNumber>;
        ack: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodUnion<[z.ZodBranded<z.ZodString, "ContactId">, z.ZodBranded<z.ZodString, "GroupChatId">]>;
        name: z.ZodOptional<z.ZodString>;
        formattedTitle: z.ZodOptional<z.ZodString>;
        isGroup: z.ZodBoolean;
        contact: z.ZodObject<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodBranded<z.ZodString, "ContactId">;
            name: z.ZodOptional<z.ZodString>;
            shortName: z.ZodOptional<z.ZodString>;
            pushname: z.ZodOptional<z.ZodString>;
            formattedName: z.ZodOptional<z.ZodString>;
            isBusiness: z.ZodOptional<z.ZodBoolean>;
            isEnterprise: z.ZodOptional<z.ZodBoolean>;
            isMe: z.ZodOptional<z.ZodBoolean>;
            isMyContact: z.ZodOptional<z.ZodBoolean>;
            isPSA: z.ZodOptional<z.ZodBoolean>;
            isUser: z.ZodOptional<z.ZodBoolean>;
            isWAContact: z.ZodOptional<z.ZodBoolean>;
            labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            profilePicThumbObj: z.ZodOptional<z.ZodObject<{
                eurl: z.ZodOptional<z.ZodString>;
                id: z.ZodOptional<z.ZodObject<{
                    server: z.ZodString;
                    user: z.ZodString;
                    _serialized: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }, {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                }>>;
                img: z.ZodOptional<z.ZodString>;
                imgFull: z.ZodOptional<z.ZodString>;
                tag: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }, {
                id?: {
                    user?: string;
                    server?: string;
                    _serialized?: string;
                };
                eurl?: string;
                img?: string;
                imgFull?: string;
                tag?: string;
            }>>;
            statusMute: z.ZodOptional<z.ZodBoolean>;
            type: z.ZodOptional<z.ZodString>;
            verifiedLevel: z.ZodOptional<z.ZodNumber>;
            verifiedName: z.ZodOptional<z.ZodString>;
            isOnline: z.ZodOptional<z.ZodBoolean>;
            lastSeen: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>;
        groupMetadata: z.ZodOptional<z.ZodAny>;
        presence: z.ZodOptional<z.ZodAny>;
        t: z.ZodOptional<z.ZodNumber>;
        unreadCount: z.ZodOptional<z.ZodNumber>;
        lastReceivedKey: z.ZodOptional<z.ZodAny>;
        msgs: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        isReadOnly: z.ZodOptional<z.ZodBoolean>;
        muteExpiration: z.ZodOptional<z.ZodNumber>;
        notSpam: z.ZodOptional<z.ZodBoolean>;
        pin: z.ZodOptional<z.ZodNumber>;
        ack: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">>;
}>, z.ZodTypeAny, "passthrough">>;
export type Message = z.infer<typeof MessageSchema>;
export declare const MessageIdReturnSchema: z.ZodObject<{
    _serialized: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    _serialized: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    _serialized: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=common-types.d.ts.map