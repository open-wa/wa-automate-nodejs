/**
 * This script contains WAPI functions that need to be run in the context of the webpage
 */

/**
 * Auto discovery the webpack object references of instances that contains all functions used by the WAPI
 * functions and creates the Store object.
 */
if (!window.Store) {
    (function () {
        function getStore(modules) {
            let foundCount = 0;
            let neededObjects = [
                { id: "Store", conditions: (module) => (module.Chat && module.Msg) ? module : null },
                { id: "MediaCollection", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.processFiles !== undefined) ? module.default : null },
                { id: "ChatClass", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.Collection !== undefined && module.default.prototype.Collection === "Chat") ? module : null },
                { id: "MediaProcess", conditions: (module) => (module.BLOB) ? module : null },
                { id: "Wap", conditions: (module) => (module.createGroup) ? module : null },
                { id: "ServiceWorker", conditions: (module) => (module.default && module.default.killServiceWorker) ? module : null },
                { id: "State", conditions: (module) => (module.STATE && module.STREAM) ? module : null },
                { id: "WapDelete", conditions: (module) => (module.sendConversationDelete && module.sendConversationDelete.length == 2) ? module : null },
                { id: "Conn", conditions: (module) => (module.default && module.default.ref && module.default.refTTL) ? module.default : null },
                { id: "WapQuery", conditions: (module) => (module.queryExist) ? module : ((module.default && module.default.queryExist) ? module.default : null) },
                { id: "CryptoLib", conditions: (module) => (module.decryptE2EMedia) ? module : null },
                { id: "OpenChat", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.openChat) ? module.default : null },
                { id: "UserConstructor", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.isServer && module.default.prototype.isUser) ? module.default : null },
                { id: "SendTextMsgToChat", conditions: (module) => (module.sendTextMsgToChat) ? module.sendTextMsgToChat : null },
                { id: "SendSeen", conditions: (module) => (module.sendSeen) ? module.sendSeen : null },
                { id: "sendDelete", conditions: (module) => (module.sendDelete) ? module.sendDelete : null }
            ];
            for (let idx in modules) {
                if ((typeof modules[idx] === "object") && (modules[idx] !== null)) {
                    let first = Object.values(modules[idx])[0];
                    if ((typeof first === "object") && (first.exports)) {
                        for (let idx2 in modules[idx]) {
                            let module = modules(idx2);
                            if (!module) {
                                continue;
                            }
                            neededObjects.forEach((needObj) => {
                                if (!needObj.conditions || needObj.foundedModule)
                                    return;
                                let neededModule = needObj.conditions(module);
                                if (neededModule !== null) {
                                    foundCount++;
                                    needObj.foundedModule = neededModule;
                                }
                            });
                            if (foundCount == neededObjects.length) {
                                break;
                            }
                        }

                        let neededStore = neededObjects.find((needObj) => needObj.id === "Store");
                        window.Store = neededStore.foundedModule ? neededStore.foundedModule : {};
                        neededObjects.splice(neededObjects.indexOf(neededStore), 1);
                        neededObjects.forEach((needObj) => {
                            if (needObj.foundedModule) {
                                window.Store[needObj.id] = needObj.foundedModule;
                            }
                        });
                        window.Store.ChatClass.default.prototype.sendMessage = function (e) {
                            return window.Store.SendTextMsgToChat(this, ...arguments);
                        }
                        return window.Store;
                    }
                }
            }
        }

        webpackJsonp([], { 'parasite': (x, y, z) => getStore(z) }, ['parasite']);
    })();
}

window.WAPI = {
    lastRead: {}
};

window.WAPI._serializeRawObj = (obj) => {
    if (obj) {
        return obj.toJSON();
    }
    return {}
};

/**
 * Serializes a chat object
 *
 * @param rawChat Chat object
 * @returns {{}}
 */

window.WAPI._serializeChatObj = (obj) => {
    if (obj == undefined) {
        return null;
    }

    return Object.assign(window.WAPI._serializeRawObj(obj), {
        kind         : obj.kind,
        isGroup      : obj.isGroup,
        contact      : obj['contact'] ? window.WAPI._serializeContactObj(obj['contact'])        : null,
        groupMetadata: obj["groupMetadata"] ? window.WAPI._serializeRawObj(obj["groupMetadata"]): null,
        presence     : obj["presence"] ? window.WAPI._serializeRawObj(obj["presence"])          : null,
        msgs         : null
    });
};

window.WAPI._serializeContactObj = (obj) => {
    if (obj == undefined) {
        return null;
    }

    return Object.assign(window.WAPI._serializeRawObj(obj), {
        formattedName      : obj.formattedName,
        isHighLevelVerified: obj.isHighLevelVerified,
        isMe               : obj.isMe,
        isMyContact        : obj.isMyContact,
        isPSA              : obj.isPSA,
        isUser             : obj.isUser,
        isVerified         : obj.isVerified,
        isWAContact        : obj.isWAContact,
        profilePicThumbObj : obj.profilePicThumb ? WAPI._serializeProfilePicThumb(obj.profilePicThumb): {},
        statusMute         : obj.statusMute,
        msgs               : null
    });
};

window.WAPI._serializeMessageObj = (obj) => {
    if (obj == undefined) {
        return null;
    }

    return Object.assign(window.WAPI._serializeRawObj(obj), {
        id            : obj.id._serialized,
        sender        : obj["senderObj"] ? WAPI._serializeContactObj(obj["senderObj"]): null,
        timestamp     : obj["t"],
        content       : obj["body"],
        isGroupMsg    : obj.isGroupMsg,
        isLink        : obj.isLink,
        isMMS         : obj.isMMS,
        isMedia       : obj.isMedia,
        isNotification: obj.isNotification,
        isPSA         : obj.isPSA,
        type          : obj.type,
        chat          : WAPI._serializeChatObj(obj['chat']),
        chatId        : obj.id.remote,
        quotedMsgObj  : WAPI._serializeMessageObj(obj['_quotedMsgObj']),
        mediaData     : window.WAPI._serializeRawObj(obj['mediaData'])
    });
};

window.WAPI._serializeNumberStatusObj = (obj) => {
    if (obj == undefined) {
        return null;
    }

    return Object.assign({}, {
        id               : obj.jid,
        status           : obj.status,
        isBusiness       : (obj.biz === true),
        canReceiveMessage: (obj.status === 200)
    });
};

window.WAPI._serializeProfilePicThumb = (obj) => {
    if (obj == undefined) {
        return null;
    }

    return Object.assign({}, {
        eurl   : obj.eurl,
        id     : obj.id,
        img    : obj.img,
        imgFull: obj.imgFull,
        raw    : obj.raw,
        tag    : obj.tag
    });
}

window.WAPI.createGroup = function (name, contactsId) {
    if (!Array.isArray(contactsId)) {
        contactsId = [contactsId];
    }

    return window.Store.Wap.createGroup(name, contactsId);
};

window.WAPI.leaveGroup = function (groupId) {
    groupId = typeof groupId == "string" ? groupId : groupId._serialized;
    var group = WAPI.getChat(groupId);
    return group.sendExit()
};


window.WAPI.getAllContacts = function (done) {
    const contacts = window.Store.Contact.map((contact) => WAPI._serializeContactObj(contact));

    if (done !== undefined) done(contacts);
    return contacts;
};

/**
 * Fetches all contact objects from store, filters them
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of contacts
 */
window.WAPI.getMyContacts = function (done) {
    const contacts = window.Store.Contact.filter((contact) => contact.isMyContact === true).map((contact) => WAPI._serializeContactObj(contact));
    if (done !== undefined) done(contacts);
    return contacts;
};

/**
 * Fetches contact object from store by ID
 *
 * @param id ID of contact
 * @param done Optional callback function for async execution
 * @returns {T|*} Contact object
 */
window.WAPI.getContact = function (id, done) {
    const found = window.Store.Contact.get(id);

    if (done !== undefined) done(window.WAPI._serializeContactObj(found))
    return window.WAPI._serializeContactObj(found);
};

/**
 * Fetches all chat objects from store
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of chats
 */
window.WAPI.getAllChats = function (done) {
    const chats = window.Store.Chat.map((chat) => WAPI._serializeChatObj(chat));

    if (done !== undefined) done(chats);
    return chats;
};

window.WAPI.haveNewMsg = function (chat) {
    return chat.unreadCount > 0;
};

window.WAPI.getAllChatsWithNewMsg = function (done) {
    const chats = window.Store.Chat.filter(window.WAPI.haveNewMsg).map((chat) => WAPI._serializeChatObj(chat));

    if (done !== undefined) done(chats);
    return chats;
};

/**
 * Fetches all chat IDs from store
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of chat id's
 */
window.WAPI.getAllChatIds = function (done) {
    const chatIds = window.Store.Chat.map((chat) => chat.id._serialized || chat.id);

    if (done !== undefined) done(chatIds);
    return chatIds;
};

/**
 * Fetches all groups objects from store
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of chats
 */
window.WAPI.getAllGroups = function (done) {
    const groups = window.Store.Chat.filter((chat) => chat.isGroup);

    if (done !== undefined) done(groups);
    return groups;
};

/**
 * Fetches chat object from store by ID
 *
 * @param id ID of chat
 * @param done Optional callback function for async execution
 * @returns {T|*} Chat object
 */
window.WAPI.getChat = function (id, done) {
    id = typeof id == "string" ? id : id._serialized;
    const found = window.Store.Chat.get(id);
    if (done !== undefined) done(found);
    return found;
}

window.WAPI.getChatByName = function (name, done) {
    const found = window.Store.Chat.find((chat) => chat.name === name);
    if (done !== undefined) done(found);
    return found;
};

window.WAPI.sendMessageWithThumb = function (thumb, url, title, description, chatId, done) {
    var chatSend = WAPI.getChat(chatId);
    if (chatSend === undefined) {
        if (done !== undefined) done(false);
        return false;
    }
    var linkPreview = {
        canonicalUrl: url,
        description : description,
        matchedText : url,
        title       : title,
        thumbnail   : thumb
    };
    chatSend.sendMessage(url, { linkPreview: linkPreview, mentionedJidList: [], quotedMsg: null, quotedMsgAdminGroupJid: null });
    if (done !== undefined) done(true);
    return true;
};

window.WAPI.getNewId = function () {
    var text     = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 20; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
};

window.WAPI.getChatById = function (id, done) {
    let found = WAPI.getChat(id);
    if (found) {
        found = WAPI._serializeChatObj(found);
    } else {
        found = false;
    }

    if (done !== undefined) done(found);
    return found;
};


/**
 * I return all unread messages from an asked chat and mark them as read.
 *
 * :param id: chat id
 * :type  id: string
 *
 * :param includeMe: indicates if user messages have to be included
 * :type  includeMe: boolean
 *
 * :param includeNotifications: indicates if notifications have to be included
 * :type  includeNotifications: boolean
 *
 * :param done: callback passed by selenium
 * :type  done: function
 *
 * :returns: list of unread messages from asked chat
 * :rtype: object
 */
window.WAPI.getUnreadMessagesInChat = function (id, includeMe, includeNotifications, done) {
    // get chat and its messages
    let chat     = WAPI.getChat(id);
    let messages = chat.msgs._models;

    // initialize result list
    let output = [];

    // look for unread messages, newest is at the end of array
    for (let i = messages.length - 1; i >= 0; i--) {
        // system message: skip it
        if (i === "remove") {
            continue;
        }

        // get message
        let messageObj = messages[i];

        // found a read message: stop looking for others
        if (typeof (messageObj.isNewMsg) !== "boolean" || messageObj.isNewMsg === false) {
            continue;
        } else {
            messageObj.isNewMsg = false;
            // process it
            let message = WAPI.processMessageObj(messageObj,
                    includeMe,
                    includeNotifications);

            // save processed message on result list
            if (message)
                output.push(message);
        }
    }
    // callback was passed: run it
    if (done !== undefined) done(output);
    // return result list
    return output;
}
;


/**
 * Load more messages in chat object from store by ID
 *
 * @param id ID of chat
 * @param done Optional callback function for async execution
 * @returns None
 */
window.WAPI.loadEarlierMessages = function (id, done) {
    const found = WAPI.getChat(id);
    if (done !== undefined) {
        found.loadEarlierMsgs().then(function () {
            done()
        });
    } else {
        found.loadEarlierMsgs();
    }
};

/**
 * Load more messages in chat object from store by ID
 *
 * @param id ID of chat
 * @param done Optional callback function for async execution
 * @returns None
 */
window.WAPI.loadAllEarlierMessages = function (id, done) {
    const found = WAPI.getChat(id);
    x = function () {
        if (!found.msgs.msgLoadState.noEarlierMsgs) {
            found.loadEarlierMsgs().then(x);
        } else if (done) {
            done();
        }
    };
    x();
};

window.WAPI.asyncLoadAllEarlierMessages = function (id, done) {
    done();
    window.WAPI.loadAllEarlierMessages(id);
};

window.WAPI.areAllMessagesLoaded = function (id, done) {
    const found = WAPI.getChat(id);
    if (!found.msgs.msgLoadState.noEarlierMsgs) {
        if (done) done(false);
        return false
    }
    if (done) done(true);
    return true
};

/**
 * Load more messages in chat object from store by ID till a particular date
 *
 * @param id ID of chat
 * @param lastMessage UTC timestamp of last message to be loaded
 * @param done Optional callback function for async execution
 * @returns None
 */

window.WAPI.loadEarlierMessagesTillDate = function (id, lastMessage, done) {
    const found = WAPI.getChat(id);
    x = function () {
        if (found.msgs.models[0].t > lastMessage) {
            found.loadEarlierMsgs().then(x);
        } else {
            done();
        }
    };
    x();
};


/**
 * Fetches all group metadata objects from store
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of group metadata
 */
window.WAPI.getAllGroupMetadata = function (done) {
    const groupData = window.Store.GroupMetadata.map((groupData) => groupData.all);

    if (done !== undefined) done(groupData);
    return groupData;
};

/**
 * Fetches group metadata object from store by ID
 *
 * @param id ID of group
 * @param done Optional callback function for async execution
 * @returns {T|*} Group metadata object
 */
window.WAPI.getGroupMetadata = async function (id, done) {
    let output = window.Store.GroupMetadata.get(id);

    if (output !== undefined) {
        if (output.stale) {
            await output.update();
        }
    }

    if (done !== undefined) done(output);
    return output;

};


/**
 * Fetches group participants
 *
 * @param id ID of group
 * @returns {Promise.<*>} Yields group metadata
 * @private
 */
window.WAPI._getGroupParticipants = async function (id) {
    const metadata = await WAPI.getGroupMetadata(id);
    return metadata.participants;
};

/**
 * Fetches IDs of group participants
 *
 * @param id ID of group
 * @param done Optional callback function for async execution
 * @returns {Promise.<Array|*>} Yields list of IDs
 */
window.WAPI.getGroupParticipantIDs = async function (id, done) {
    const output = (await WAPI._getGroupParticipants(id))
            .map((participant) => participant.id);

    if (done !== undefined) done(output);
    return output;
};

window.WAPI.getGroupAdmins = async function (id, done) {
    const output = (await WAPI._getGroupParticipants(id))
            .filter((participant) => participant.isAdmin)
            .map((admin) => admin.id);

    if (done !== undefined) done(output);
    return output;
};

/**
 * Gets object representing the logged in user
 *
 * @returns {Array|*|$q.all}
 */
window.WAPI.getMe = function (done) {
    const rawMe = window.Store.Contact.get(window.Store.Conn.me);

    if (done !== undefined) done(rawMe.all);
    return rawMe.all;
};

window.WAPI.isLoggedIn = function (done) {
    // Contact always exists when logged in
    const isLogged = window.Store.Contact && window.Store.Contact.checksum !== undefined;

    if (done !== undefined) done(isLogged);
    return isLogged;
};

window.WAPI.processMessageObj = function (messageObj, includeMe, includeNotifications) {
    if (messageObj.isNotification) {
        if (includeNotifications)
            return WAPI._serializeMessageObj(messageObj);
        else
            return;
        // System message
        // (i.e. "Messages you send to this chat and calls are now secured with end-to-end encryption...")
    } else if (messageObj.id.fromMe === false || includeMe) {
        return WAPI._serializeMessageObj(messageObj);
    }
    return;
};

window.WAPI.getAllMessagesInChat = function (id, includeMe, includeNotifications, done) {
    const chat     = WAPI.getChat(id);
    let   output   = [];
    const messages = chat.msgs._models;

    for (const i in messages) {
        if (i === "remove") {
            continue;
        }
        const messageObj = messages[i];

        let message = WAPI.processMessageObj(messageObj, includeMe, includeNotifications)
        if (message)
            output.push(message);
    }
    if (done !== undefined) done(output);
    return output;
};

window.WAPI.getAllMessageIdsInChat = function (id, includeMe, includeNotifications, done) {
    const chat     = WAPI.getChat(id);
    let   output   = [];
    const messages = chat.msgs._models;

    for (const i in messages) {
        if ((i === "remove")
                || (!includeMe && messages[i].isMe)
                || (!includeNotifications && messages[i].isNotification)) {
            continue;
        }
        output.push(messages[i].id._serialized);
    }
    if (done !== undefined) done(output);
    return output;
};

window.WAPI.getMessageById = function (id, done) {
    let result = false;
    try {
        let msg = window.Store.Msg.get(id);
        if (msg) {
            result = WAPI.processMessageObj(msg, true, true);
        }
    } catch (err) { }

    if (done !== undefined) {
        done(result);
    } else {
        return result;
    }
};

window.WAPI.ReplyMessage = function (idMessage, message, done) {
    var messageObject = window.Store.Msg.get(idMessage);
    if (messageObject === undefined) {
        if (done !== undefined) done(false);
        return false;
    }
    messageObject = messageObject.value();

    const chat = WAPI.getChat(messageObject.chat.id)
    if (chat !== undefined) {
        if (done !== undefined) {
            chat.sendMessage(message, null, messageObject).then(function () {
                function sleep(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }

                var trials = 0;

                function check() {
                    for (let i = chat.msgs.models.length - 1; i >= 0; i--) {
                        let msg = chat.msgs.models[i];

                        if (!msg.senderObj.isMe || msg.body != message) {
                            continue;
                        }
                        done(WAPI._serializeMessageObj(msg));
                        return True;
                    }
                    trials += 1;
                    console.log(trials);
                    if (trials > 30) {
                        done(true);
                        return;
                    }
                    sleep(500).then(check);
                }
                check();
            });
            return true;
        } else {
            chat.sendMessage(message, null, messageObject);
            return true;
        }
    } else {
        if (done !== undefined) done(false);
        return false;
    }
};

window.WAPI.sendMessageToID = function (id, message, done) {
    try {
        window.getContact = (id) => {
            return Store.WapQuery.queryExist(id);
        }
        window.getContact(id).then(contact => {
            if (contact.status === 404) {
                done(true);
            } else {
                Store.Chat.find(contact.jid).then(chat => {
                    chat.sendMessage(message);
                    return true;
                }).catch(reject => {
                    if (WAPI.sendMessage(id, message)) {
                        done(true);
                        return true;
                    }else{
                        done(false);
                        return false;
                    }
                });
            }
        });
    } catch (e) {
        if (window.Store.Chat.length === 0)
            return false;

        firstChat = Store.Chat.models[0];
        var originalID = firstChat.id;
        firstChat.id = typeof originalID === "string" ? id : new window.Store.UserConstructor(id, { intentionallyUsePrivateConstructor: true });
        if (done !== undefined) {
            firstChat.sendMessage(message).then(function () {
                firstChat.id = originalID;
                done(true);
            });
            return true;
        } else {
            firstChat.sendMessage(message);
            firstChat.id = originalID;
            return true;
        }
    }
    if (done !== undefined) done(false);
    return false;
}

window.WAPI.sendMessage = function (id, message, done) {
    var chat = WAPI.getChat(id);
    if (chat !== undefined) {
        if (done !== undefined) {
            chat.sendMessage(message).then(function () {
                function sleep(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }

                var trials = 0;

                function check() {
                    for (let i = chat.msgs.models.length - 1; i >= 0; i--) {
                        let msg = chat.msgs.models[i];

                        if (!msg.senderObj.isMe || msg.body != message) {
                            continue;
                        }
                        done(WAPI._serializeMessageObj(msg));
                        return True;
                    }
                    trials += 1;
                    console.log(trials);
                    if (trials > 30) {
                        done(true);
                        return;
                    }
                    sleep(500).then(check);
                }
                check();
            });
            return true;
        } else {
            chat.sendMessage(message);
            return true;
        }
    } else {
        if (done !== undefined) done(false);
        return false;
    }
};

window.WAPI.sendMessage2 = function (id, message, done) {
    var chat = WAPI.getChat(id);
    if (chat !== undefined) {
        try {
            if (done !== undefined) {
                chat.sendMessage(message).then(function () {
                    done(true);
                });
            } else {
                chat.sendMessage(message);
            }
            return true;
        } catch (error) {
            if (done !== undefined) done(false)
            return false;
        }
    }
    if (done !== undefined) done(false)
    return false;
};

window.WAPI.sendSeen = function (id, done) {
    var chat = window.WAPI.getChat(id);
    if (chat !== undefined) {
        if (done !== undefined) {
            Store.SendSeen(Store.Chat.models[0], false).then(function () {
                done(true);
            });
            return true;
        } else {
            Store.SendSeen(Store.Chat.models[0], false);
            return true;
        }
    }
    if (done !== undefined) done();
    return false;
};

function isChatMessage(message) {
    if (message.isSentByMe) {
        return false;
    }
    if (message.isNotification) {
        return false;
    }
    if (!message.isUserCreatedType) {
        return false;
    }
    return true;
}


window.WAPI.getUnreadMessages = function (includeMe, includeNotifications, use_unread_count, done) {
    const chats  = window.Store.Chat.models;
    let   output = [];

    for (let chat in chats) {
        if (isNaN(chat)) {
            continue;
        }

        let messageGroupObj = chats[chat];
        let messageGroup    = WAPI._serializeChatObj(messageGroupObj);

        messageGroup.messages = [];

        const messages = messageGroupObj.msgs._models;
        for (let i = messages.length - 1; i >= 0; i--) {
            let messageObj = messages[i];
            if (typeof (messageObj.isNewMsg) != "boolean" || messageObj.isNewMsg === false) {
                continue;
            } else {
                messageObj.isNewMsg = false;
                let message = WAPI.processMessageObj(messageObj, includeMe, includeNotifications);
                if (message) {
                    messageGroup.messages.push(message);
                }
            }
        }

        if (messageGroup.messages.length > 0) {
            output.push(messageGroup);
        } else { // no messages with isNewMsg true
            if (use_unread_count) {
                let n = messageGroupObj.unreadCount; // will use unreadCount attribute to fetch last n messages from sender
                for (let i = messages.length - 1; i >= 0; i--) {
                    let messageObj = messages[i];
                    if (n > 0) {
                        if (!messageObj.isSentByMe) {
                            let message = WAPI.processMessageObj(messageObj, includeMe, includeNotifications);
                            messageGroup.messages.unshift(message);
                            n -= 1;
                        }
                    } else if (n === -1) { // chat was marked as unread so will fetch last message as unread
                        if (!messageObj.isSentByMe) {
                            let message = WAPI.processMessageObj(messageObj, includeMe, includeNotifications);
                            messageGroup.messages.unshift(message);
                            break;
                        }
                    } else { // unreadCount = 0
                        break;
                    }
                }
                if (messageGroup.messages.length > 0) {
                    messageGroupObj.unreadCount = 0; // reset unread counter
                    output.push(messageGroup);
                }
            }
        }
    }
    if (done !== undefined) {
        done(output);
    }
    return output;
};

window.WAPI.getGroupOwnerID = async function (id, done) {
    const output = (await WAPI.getGroupMetadata(id)).owner.id;
    if (done !== undefined) {
        done(output);
    }
    return output;

};

window.WAPI.getCommonGroups = async function (id, done) {
    let output = [];

    groups = window.WAPI.getAllGroups();

    for (let idx in groups) {
        try {
            participants = await window.WAPI.getGroupParticipantIDs(groups[idx].id);
            if (participants.filter((participant) => participant == id).length) {
                output.push(groups[idx]);
            }
        } catch (err) {
            console.log("Error in group:");
            console.log(groups[idx]);
            console.log(err);
        }
    }

    if (done !== undefined) {
        done(output);
    }
    return output;
};


window.WAPI.getProfilePicSmallFromId = function (id, done) {
    window.Store.ProfilePicThumb.find(id).then(function (d) {
        if (d.img !== undefined) {
            window.WAPI.downloadFileWithCredentials(d.img, done);
        } else {
            done(false);
        }
    }, function (e) {
        done(false);
    })
};

window.WAPI.getProfilePicFromId = function (id, done) {
    window.Store.ProfilePicThumb.find(id).then(function (d) {
        if (d.imgFull !== undefined) {
            window.WAPI.downloadFileWithCredentials(d.imgFull, done);
        } else {
            done(false);
        }
    }, function (e) {
        done(false);
    })
};

window.WAPI.downloadFileWithCredentials = function (url, done) {
    let xhr = new XMLHttpRequest();

    xhr.onload = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                let reader = new FileReader();
                reader.readAsDataURL(xhr.response);
                reader.onload = function (e) {
                    done(reader.result.substr(reader.result.indexOf(',') + 1))
                };
            } else {
                console.error(xhr.statusText);
            }
        } else {
            console.log(err);
            done(false);
        }
    };

    xhr.open("GET", url, true);
    xhr.withCredentials = true;
    xhr.responseType = 'blob';
    xhr.send(null);
};


window.WAPI.downloadFile = function (url, done) {
    let xhr = new XMLHttpRequest();


    xhr.onload = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                let reader = new FileReader();
                reader.readAsDataURL(xhr.response);
                reader.onload = function (e) {
                    done(reader.result.substr(reader.result.indexOf(',') + 1))
                };
            } else {
                console.error(xhr.statusText);
            }
        } else {
            console.log(err);
            done(false);
        }
    };

    xhr.open("GET", url, true);
    xhr.responseType = 'blob';
    xhr.send(null);
};

window.WAPI.getBatteryLevel = function (done) {
    if (window.Store.Conn.plugged) {
        if (done !== undefined) {
            done(100);
        }
        return 100;
    }
    output = window.Store.Conn.battery;
    if (done !== undefined) {
        done(output);
    }
    return output;
};

window.WAPI.deleteConversation = function (chatId, done) {
    let userId       = new window.Store.UserConstructor(chatId, {intentionallyUsePrivateConstructor: true});
    let conversation = WAPI.getChat(userId);

    if (!conversation) {
        if (done !== undefined) {
            done(false);
        }
        return false;
    }

    window.Store.sendDelete(conversation, false).then(() => {
        if (done !== undefined) {
            done(true);
        }
    }).catch(() => {
        if (done !== undefined) {
            done(false);
        }
    });

    return true;
};

window.WAPI.deleteMessage = function (chatId, messageArray, revoke=false, done) {
    let userId       = new window.Store.UserConstructor(chatId, {intentionallyUsePrivateConstructor: true});
    let conversation = WAPI.getChat(userId);

    if(!conversation) {
        if(done !== undefined) {
            done(false);
        }
        return false;
    }

    if (!Array.isArray(messageArray)) {
        messageArray = [messageArray];
    }

    if (revoke) {
        conversation.sendRevokeMsgs(messageArray, conversation);    
    } else {
        conversation.sendDeleteMsgs(messageArray, conversation);    
    }


    if (done !== undefined) {
        done(true);
    }

    return true;
};

window.WAPI.checkNumberStatus = function (id, done) {
    window.Store.WapQuery.queryExist(id).then((result) => {
        if( done !== undefined) {
            if (result.jid === undefined) throw 404;
            done(window.WAPI._serializeNumberStatusObj(result));
        }
    }).catch((e) => {
        if (done !== undefined) {
            done(window.WAPI._serializeNumberStatusObj({
                status: e,
                jid   : id
            }));
        }
    });

    return true;
};

/**
 * New messages observable functions.
 */
window.WAPI._newMessagesQueue     = [];
window.WAPI._newMessagesBuffer    = (sessionStorage.getItem('saved_msgs') != null) ? JSON.parse(sessionStorage.getItem('saved_msgs')) : [];
window.WAPI._newMessagesDebouncer = null;
window.WAPI._newMessagesCallbacks = [];

window.Store.Msg.off('add');
sessionStorage.removeItem('saved_msgs');

window.WAPI._newMessagesListener = window.Store.Msg.on('add', (newMessage) => {
    if (newMessage && newMessage.isNewMsg && !newMessage.isSentByMe) {
        let message = window.WAPI.processMessageObj(newMessage, false, false);
        if (message) {
            window.WAPI._newMessagesQueue.push(message);
            window.WAPI._newMessagesBuffer.push(message);
        }

        // Starts debouncer time to don't call a callback for each message if more than one message arrives
        // in the same second
        if (!window.WAPI._newMessagesDebouncer && window.WAPI._newMessagesQueue.length > 0) {
            window.WAPI._newMessagesDebouncer = setTimeout(() => {
                let queuedMessages = window.WAPI._newMessagesQueue;

                window.WAPI._newMessagesDebouncer = null;
                window.WAPI._newMessagesQueue     = [];

                let removeCallbacks = [];

                window.WAPI._newMessagesCallbacks.forEach(function (callbackObj) {
                    if (callbackObj.callback !== undefined) {
                        callbackObj.callback(queuedMessages);
                    }
                    if (callbackObj.rmAfterUse === true) {
                        removeCallbacks.push(callbackObj);
                    }
                });

                // Remove removable callbacks.
                removeCallbacks.forEach(function (rmCallbackObj) {
                    let callbackIndex = window.WAPI._newMessagesCallbacks.indexOf(rmCallbackObj);
                    window.WAPI._newMessagesCallbacks.splice(callbackIndex, 1);
                });
            }, 1000);
        }
    }
});

window.WAPI._unloadInform = (event) => {
    // Save in the buffer the ungot unreaded messages
    window.WAPI._newMessagesBuffer.forEach((message) => {
        Object.keys(message).forEach(key => message[key] === undefined ? delete message[key] : '');
    });
    sessionStorage.setItem("saved_msgs", JSON.stringify(window.WAPI._newMessagesBuffer));

    // Inform callbacks that the page will be reloaded.
    window.WAPI._newMessagesCallbacks.forEach(function (callbackObj) {
        if (callbackObj.callback !== undefined) {
            callbackObj.callback({ status: -1, message: 'page will be reloaded, wait and register callback again.' });
        }
    });
};

window.addEventListener("unload", window.WAPI._unloadInform, false);
window.addEventListener("beforeunload", window.WAPI._unloadInform, false);
window.addEventListener("pageunload", window.WAPI._unloadInform, false);

/**
 * Registers a callback to be called when a new message arrives the WAPI.
 * @param rmCallbackAfterUse - Boolean - Specify if the callback need to be executed only once
 * @param done - function - Callback function to be called when a new message arrives.
 * @returns {boolean}
 */
window.WAPI.waitNewMessages = function (rmCallbackAfterUse = true, done) {
    window.WAPI._newMessagesCallbacks.push({ callback: done, rmAfterUse: rmCallbackAfterUse });
    return true;
};

/**
 * Reads buffered new messages.
 * @param done - function - Callback function to be called contained the buffered messages.
 * @returns {Array}
 */
window.WAPI.getBufferedNewMessages = function (done) {
    let bufferedMessages = window.WAPI._newMessagesBuffer;
    window.WAPI._newMessagesBuffer = [];
    if (done !== undefined) {
        done(bufferedMessages);
    }
    return bufferedMessages;
};
/** End new messages observable functions **/

window.WAPI.sendImage = function (imgBase64, chatid, filename, caption, done) {
//var idUser = new window.Store.UserConstructor(chatid);
var idUser = new window.Store.UserConstructor(chatid, { intentionallyUsePrivateConstructor: true });
// create new chat
return Store.Chat.find(idUser).then((chat) => {
    var mediaBlob = window.WAPI.base64ImageToFile(imgBase64, filename);
    var mc = new Store.MediaCollection();
    mc.processFiles([mediaBlob], chat, 1).then(() => {
        var media = mc.models[0];
        media.sendToChat(chat, { caption: caption });
        if (done !== undefined) done(true);
    });
});
}

window.WAPI.base64ImageToFile = function (b64Data, filename) {
    var arr   = b64Data.split(',');
    var mime  = arr[0].match(/:(.*?);/)[1];
    var bstr  = atob(arr[1]);
    var n     = bstr.length;
    var u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, {type: mime});
};

/**
 * Send contact card to a specific chat using the chat ids
 *
 * @param {string} to '000000000000@c.us'
 * @param {string|array} contact '111111111111@c.us' | ['222222222222@c.us', '333333333333@c.us, ... 'nnnnnnnnnnnn@c.us']
 */
window.WAPI.sendContact = function (to, contact) {
    if (!Array.isArray(contact)) {
        contact = [contact];
    }
    contact = contact.map((c) => {
        return WAPI.getChat(c).__x_contact;
    });

    if (contact.length > 1) {
        window.WAPI.getChat(to).sendContactList(contact);
    } else if (contact.length === 1) {
        window.WAPI.getChat(to).sendContact(contact[0]);
    }
};

/**
 * Create an chat ID based in a cloned one
 *
 * @param {string} chatId '000000000000@c.us'
 */
window.WAPI.getNewMessageId = function (chatId) {
    var newMsgId = Store.Msg.models[0].__x_id.clone();

    newMsgId.fromMe      = true;
    newMsgId.id          = WAPI.getNewId().toUpperCase();
    newMsgId.remote      = chatId;
    newMsgId._serialized = `${newMsgId.fromMe}_${newMsgId.remote}_${newMsgId.id}`

    return newMsgId;
};

/**
 * Send Customized VCard without the necessity of contact be a Whatsapp Contact
 *
 * @param {string} chatId '000000000000@c.us'
 * @param {object|array} vcard { displayName: 'Contact Name', vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Contact Name;;;\nEND:VCARD' } | [{ displayName: 'Contact Name 1', vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Contact Name 1;;;\nEND:VCARD' }, { displayName: 'Contact Name 2', vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Contact Name 2;;;\nEND:VCARD' }]
 */
window.WAPI.sendVCard = function (chatId, vcard) {
    var chat    = Store.Chat.get(chatId);
    var tempMsg = Object.create(Store.Msg.models.filter(msg => msg.__x_isSentByMe)[0]);
    var newId   = window.WAPI.getNewMessageId(chatId);

    var extend = {
        ack     : 0,
        id      : newId,
        local   : !0,
        self    : "out",
        t       : parseInt(new Date().getTime() / 1000),
        to      : chatId,
        isNewMsg: !0,
    };

    if (Array.isArray(vcard)) {
        Object.assign(extend, {
            type     : "multi_vcard",
            vcardList: vcard
        });

        delete extend.body;
    } else {
        Object.assign(extend, {
            type   : "vcard",
            subtype: vcard.displayName,
            body   : vcard.vcard
        });

        delete extend.vcardList;
    }

    Object.assign(tempMsg, extend);

    chat.addAndSendMsg(tempMsg);
};
/**
 * Block contact 
 * @param {string} id '000000000000@c.us'
 * @param {*} done - function - Callback function to be called when a new message arrives.
 */
window.WAPI.contactBlock = function (id, done) {
    const contact = window.Store.Contact.get(id);
    if (contact !== undefined) {
        contact.setBlock(!0);
        done(true);
        return true;
    }
    done(false);
    return false;
}
/**
 * unBlock contact 
 * @param {string} id '000000000000@c.us'
 * @param {*} done - function - Callback function to be called when a new message arrives.
 */
window.WAPI.contactUnblock = function (id, done) {
    const contact = window.Store.Contact.get(id);
    if (contact !== undefined) {
        contact.setBlock(!1);
        done(true);
        return true;
    }
    done(false);
    return false;
}

/**
 * Remove participant of Group
 * @param {*} idGroup '0000000000-00000000@g.us'
 * @param {*} idParticipant '000000000000@c.us'
 * @param {*} done - function - Callback function to be called when a new message arrives.
 */
window.WAPI.removeParticipantGroup = function (idGroup, idParticipant, done) {
    window.Store.WapQuery.removeParticipants(idGroup, [idParticipant]).then(() => {
        const metaDataGroup = window.Store.GroupMetadata.get(id)
        checkParticipant = metaDataGroup.participants._index[idParticipant];
        if (checkParticipant === undefined) {
            done(true); return true;
        }
    })
}

/**
 * Promote Participant to Admin in Group
 * @param {*} idGroup '0000000000-00000000@g.us'
 * @param {*} idParticipant '000000000000@c.us'
 * @param {*} done - function - Callback function to be called when a new message arrives.
 */
window.WAPI.promoteParticipantAdminGroup = function (idGroup, idParticipant, done) {
    window.Store.WapQuery.promoteParticipants(idGroup, [idParticipant]).then(() => {
        const metaDataGroup = window.Store.GroupMetadata.get(id)
        checkParticipant = metaDataGroup.participants._index[idParticipant];
        if (checkParticipant !== undefined && checkParticipant.isAdmin) {
            done(true); return true;
        }
        done(false); return false;
    })
}

/**
 * Demote Admin of Group
 * @param {*} idGroup '0000000000-00000000@g.us'
 * @param {*} idParticipant '000000000000@c.us'
 * @param {*} done - function - Callback function to be called when a new message arrives.
 */
window.WAPI.demoteParticipantAdminGroup = function (idGroup, idParticipant, done) {
    window.Store.WapQuery.demoteParticipants(idGroup, [idParticipant]).then(() => {
        const metaDataGroup = window.Store.GroupMetadata.get(id)
        if (metaDataGroup === undefined) {
            done(false); return false;
        }
        checkParticipant = metaDataGroup.participants._index[idParticipant];
        if (checkParticipant !== undefined && checkParticipant.isAdmin) {
            done(false); return false;
        }
        done(true); return true;
    })
}