import { z } from 'zod';
export declare const sendText: import("./registry").CapabilityDefinition<z.ZodObject<{
    to: z.ZodString;
    content: z.ZodString;
    options: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    options?: any;
    content?: string;
    to?: string;
}, {
    options?: any;
    content?: string;
    to?: string;
}>, z.ZodUnion<[z.ZodUnion<[z.ZodObject<{
    _serialized: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    _serialized: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    _serialized: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodBoolean]>, z.ZodString]>>;
export declare const sendImage: import("./registry").CapabilityDefinition<z.ZodObject<{
    to: z.ZodString;
    imgData: z.ZodString;
    filename: z.ZodOptional<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
    id: z.ZodOptional<z.ZodString>;
    waitForId: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    to?: string;
    caption?: string;
    imgData?: string;
    filename?: string;
    waitForId?: boolean;
}, {
    id?: string;
    to?: string;
    caption?: string;
    imgData?: string;
    filename?: string;
    waitForId?: boolean;
}>, z.ZodUnion<[z.ZodUnion<[z.ZodObject<{
    _serialized: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    _serialized: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    _serialized: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodBoolean]>, z.ZodString]>>;
export declare const getAllMessages: import("./registry").CapabilityDefinition<z.ZodObject<{
    chatId: z.ZodOptional<z.ZodString>;
    includeMe: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeNotifications: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    chatId?: string;
    includeMe?: boolean;
    includeNotifications?: boolean;
}, {
    chatId?: string;
    includeMe?: boolean;
    includeNotifications?: boolean;
}>, z.ZodArray<z.ZodObject<z.objectUtil.extendShape<{
    id: z.ZodBranded<z.ZodString, "MessageId">;
    body: z.ZodString;
    type: z.ZodNativeEnum<typeof import("./common-types").MessageTypes>;
    t: z.ZodNumber;
    notifyName: z.ZodOptional<z.ZodString>;
    from: z.ZodBranded<z.ZodString, "ChatId">;
    to: z.ZodBranded<z.ZodString, "ChatId">;
    self: z.ZodEnum<["in", "out"]>;
    ack: z.ZodNativeEnum<typeof import("./common-types").MessageAck>;
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
    type: z.ZodNativeEnum<typeof import("./common-types").MessageTypes>;
    t: z.ZodNumber;
    notifyName: z.ZodOptional<z.ZodString>;
    from: z.ZodBranded<z.ZodString, "ChatId">;
    to: z.ZodBranded<z.ZodString, "ChatId">;
    self: z.ZodEnum<["in", "out"]>;
    ack: z.ZodNativeEnum<typeof import("./common-types").MessageAck>;
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
    type: z.ZodNativeEnum<typeof import("./common-types").MessageTypes>;
    t: z.ZodNumber;
    notifyName: z.ZodOptional<z.ZodString>;
    from: z.ZodBranded<z.ZodString, "ChatId">;
    to: z.ZodBranded<z.ZodString, "ChatId">;
    self: z.ZodEnum<["in", "out"]>;
    ack: z.ZodNativeEnum<typeof import("./common-types").MessageAck>;
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
}>, z.ZodTypeAny, "passthrough">>, "many">>;
export declare const getAllChats: import("./registry").CapabilityDefinition<z.ZodObject<{
    withNewMessagesOnly: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    withNewMessagesOnly?: boolean;
}, {
    withNewMessagesOnly?: boolean;
}>, z.ZodArray<z.ZodObject<{
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
}, z.ZodTypeAny, "passthrough">>, "many">>;
export declare const getAllContacts: import("./registry").CapabilityDefinition<z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>, z.ZodArray<z.ZodObject<{
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
}, z.ZodTypeAny, "passthrough">>, "many">>;
export declare const getMessageById: import("./registry").CapabilityDefinition<z.ZodObject<{
    messageId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    messageId?: string;
}, {
    messageId?: string;
}>, z.ZodObject<z.objectUtil.extendShape<{
    id: z.ZodBranded<z.ZodString, "MessageId">;
    body: z.ZodString;
    type: z.ZodNativeEnum<typeof import("./common-types").MessageTypes>;
    t: z.ZodNumber;
    notifyName: z.ZodOptional<z.ZodString>;
    from: z.ZodBranded<z.ZodString, "ChatId">;
    to: z.ZodBranded<z.ZodString, "ChatId">;
    self: z.ZodEnum<["in", "out"]>;
    ack: z.ZodNativeEnum<typeof import("./common-types").MessageAck>;
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
    type: z.ZodNativeEnum<typeof import("./common-types").MessageTypes>;
    t: z.ZodNumber;
    notifyName: z.ZodOptional<z.ZodString>;
    from: z.ZodBranded<z.ZodString, "ChatId">;
    to: z.ZodBranded<z.ZodString, "ChatId">;
    self: z.ZodEnum<["in", "out"]>;
    ack: z.ZodNativeEnum<typeof import("./common-types").MessageAck>;
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
    type: z.ZodNativeEnum<typeof import("./common-types").MessageTypes>;
    t: z.ZodNumber;
    notifyName: z.ZodOptional<z.ZodString>;
    from: z.ZodBranded<z.ZodString, "ChatId">;
    to: z.ZodBranded<z.ZodString, "ChatId">;
    self: z.ZodEnum<["in", "out"]>;
    ack: z.ZodNativeEnum<typeof import("./common-types").MessageAck>;
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
}>, z.ZodTypeAny, "passthrough">>>;
export declare const deleteMessage: import("./registry").CapabilityDefinition<z.ZodObject<{
    chatId: z.ZodString;
    messageId: z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodString]>;
    onlyLocal: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    chatId?: string;
    messageId?: string | string[];
    onlyLocal?: boolean;
}, {
    chatId?: string;
    messageId?: string | string[];
    onlyLocal?: boolean;
}>, z.ZodBoolean>;
export declare const forwardMessages: import("./registry").CapabilityDefinition<z.ZodObject<{
    to: z.ZodString;
    messages: z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodString]>;
    skipMyMessages: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    to?: string;
    messages?: string | string[];
    skipMyMessages?: boolean;
}, {
    to?: string;
    messages?: string | string[];
    skipMyMessages?: boolean;
}>, z.ZodUnion<[z.ZodArray<z.ZodObject<{
    _serialized: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    _serialized: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    _serialized: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, "many">, z.ZodBoolean]>>;
export declare const sendLocation: import("./registry").CapabilityDefinition<z.ZodObject<{
    to: z.ZodString;
    lat: z.ZodAny;
    lng: z.ZodAny;
    loc: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    to?: string;
    lat?: any;
    lng?: any;
    loc?: string;
}, {
    to?: string;
    lat?: any;
    lng?: any;
    loc?: string;
}>, z.ZodUnion<[z.ZodObject<{
    _serialized: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    _serialized: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    _serialized: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodBoolean]>>;
export declare const getGroupMembers: import("./registry").CapabilityDefinition<z.ZodObject<{
    groupId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    groupId?: string;
}, {
    groupId?: string;
}>, z.ZodArray<z.ZodObject<{
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
}, z.ZodTypeAny, "passthrough">>, "many">>;
//# sourceMappingURL=methods.d.ts.map