/**
 * This script contains WAPI functions that need to be run in the context of the webpage
 */

/**
 * Auto discovery the webpack object references of instances that contains all functions used by the WAPI
 * functions and creates the Store object.
 */

if (!window.Store||!window.Store.Msg) {
    (function () {
        function getStore(modules) {
            let foundCount = 0;
            let neededObjects = [
                { id: "Store", conditions: (module) => (module.Chat && module.Msg) ? module : null },
                { id: "MediaCollection", conditions: (module) => (module.default && module.default.prototype && (module.default.prototype.processFiles !== undefined||module.default.prototype.processAttachments !== undefined)) ? module.default : null },
                { id: "MediaProcess", conditions: (module) => (module.BLOB) ? module : null },
                { id: "Archive", conditions: (module) => (module.setArchive) ? module : null },
                { id: "Block", conditions: (module) => (module.blockContact && module.unblockContact) ? module : null },
                { id: "ChatUtil", conditions: (module) => (module.sendClear) ? module : null },
                { id: "GroupInvite", conditions: (module) => (module.queryGroupInviteCode) ? module : null },
                { id: "Wap", conditions: (module) => (module.createGroup) ? module : null },
                { id: "ServiceWorker", conditions: (module) => (module.default && module.default.killServiceWorker) ? module : null },
                { id: "State", conditions: (module) => (module.STATE && module.STREAM) ? module : null },
                { id: "Presence", conditions: (module) => (module.setPresenceAvailable && module.setPresenceUnavailable) ? module : null },
                { id: "WapDelete", conditions: (module) => (module.sendConversationDelete && module.sendConversationDelete.length == 2) ? module : null },
                { id: "Conn", conditions: (module) => (module.default && module.default.ref && module.default.refTTL) ? module.default : null },
                { id: "WapQuery", conditions: (module) => (module.queryExist) ? module : ((module.default && module.default.queryExist) ? module.default : null) },
                { id: "CryptoLib", conditions: (module) => (module.decryptE2EMedia) ? module : null },
                { id: "OpenChat", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.openChat) ? module.default : null },
                { id: "UserConstructor", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.isServer && module.default.prototype.isUser) ? module.default : null },
                { id: "SendTextMsgToChat", conditions: (module) => (module.sendTextMsgToChat) ? module.sendTextMsgToChat : null },
                { id: "SendSeen", conditions: (module) => (module.sendSeen) ? module.sendSeen : null },
                { id: "sendDelete", conditions: (module) => (module.sendDelete) ? module.sendDelete : null },
                { id: "addAndSendMsgToChat", conditions: (module) => (module.addAndSendMsgToChat) ? module.addAndSendMsgToChat : null },
                { id: "sendMsgToChat", conditions: (module) => (module.sendMsgToChat) ? module.sendMsgToChat : null },
                { id: "Catalog", conditions: (module) => (module.Catalog) ? module.Catalog : null },
                { id: "bp", conditions: (module) => (module.default&&module.default.toString().includes('binaryProtocol deprecated version')) ? module.default : null },
                { id: "MsgKey", conditions: (module) => (module.default&&module.default.toString().includes('MsgKey error: id is already a MsgKey')) ? module.default : null },
                { id: "Parser", conditions: (module) => (module.convertToTextWithoutSpecialEmojis) ? module.default : null },
                { id: "Builders", conditions: (module) => (module.TemplateMessage && module.HydratedFourRowTemplate) ? module : null },
                { id: "Me", conditions: (module) => (module.PLATFORMS && module.Conn) ? module.default : null },
                { id: "CallUtils", conditions: (module) => (module.sendCallEnd && module.parseCall) ? module : null },
                { id: "Identity", conditions: (module) => (module.queryIdentity && module.updateIdentity) ? module : null },
                { id: "MyStatus", conditions: (module) => (module.getStatus && module.setMyStatus) ? module : null },
                { id: "ChatStates", conditions: (module) => (module.sendChatStatePaused && module.sendChatStateRecording && module.sendChatStateComposing) ? module : null },
                { id: "GroupActions", conditions: (module) => (module.sendExitGroup && module.localExitGroup) ? module : null },
                { id: "Features", conditions: (module) => (module.FEATURE_CHANGE_EVENT && module.features) ? module : null },
                { id: "MessageUtils", conditions: (module) => (module.storeMessages && module.appendMessage) ? module : null },
                { id: "WebMessageInfo", conditions: (module) => (module.WebMessageInfo && module.WebFeatures) ? module.WebMessageInfo : null },
                { id: "createMessageKey", conditions: (module) => (module.createMessageKey && module.createDeviceSentMessage) ? module.createMessageKey : null },
                { id: "Participants", conditions: (module) => (module.addParticipants && module.removeParticipants && module.promoteParticipants && module.demoteParticipants) ? module : null },
                { id: "WidFactory", conditions: (module) => (module.numberToWid && module.createWid && module.createWidFromWidLike) ? module : null },
                { id: "Base", conditions: (module) => (module.setSubProtocol && module.binSend && module.actionNode) ? module : null },
                { id: "Base2", conditions: (module) => (module.supportsFeatureFlags && module.parseMsgStubProto && module.binSend && module.subscribeLiveLocation) ? module : null },
                { id: "Versions", conditions: (module) => (module.loadProtoVersions && module.default["15"] && module.default["16"] && module.default["17"]) ? module : null },
		        { id: "Sticker", conditions: (module) => (module.default && module.default.Sticker) ? module.default.Sticker : null },
                { id: "MediaUpload", conditions: (module) => (module.default && module.default.mediaUpload) ? module.default : null },
                { id: "UploadUtils", conditions: (module) => (module.default && module.default.encryptAndUpload) ? module.default : null }
            ];
            for (let idx in modules) {
                if ((typeof modules[idx] === "object") && (modules[idx] !== null)) {
                    let first = Object.values(modules[idx])[0];
                    if ((typeof first === "object") && (first.exports)) {
                        for (let idx2 in modules[idx]) {
                            let module = modules(idx2);
                            // console.log("TCL: getStore -> module", module ? Object.getOwnPropertyNames(module.default || module).filter(item => typeof (module.default || module)[item] === 'function').length ? module.default || module : "":'')
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
                        window.Store.sendMessage = function (e) {
                            return window.Store.SendTextMsgToChat(this, ...arguments);
                        }
                        if(window.Store.MediaCollection) window.Store.MediaCollection.prototype.processFiles = window.Store.MediaCollection.prototype.processFiles || window.Store.MediaCollection.prototype.processAttachments;
                        return window.Store;
                    }
                }
            }
        }
        const parasite = `parasite${Date.now()}`
        // webpackJsonp([], { [parasite]: (x, y, z) => getStore(z) }, [parasite]);
        if (typeof webpackJsonp === 'function') webpackJsonp([], {[parasite]: (x, y, z) => getStore(z)}, [parasite]); 
        else webpackJsonp.push([[parasite],{[parasite]: (x, y, z) => getStore(z)},[[parasite]]]);
        
    })();
}

window.WAPI = {
    lastRead: {}
};


window.WAPI._serializeRawObj = (obj) => {
    if (obj && obj.toJSON) {
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
        kind: obj.kind,
        isGroup: obj.isGroup,
        contact: obj['contact'] ? window.WAPI._serializeContactObj(obj['contact']) : null,
        groupMetadata: obj["groupMetadata"] ? window.WAPI._serializeRawObj(obj["groupMetadata"]) : null,
        presence: obj["presence"] ? window.WAPI._serializeRawObj(obj["presence"]) : null,
        msgs: null,
        isOnline: obj.__x_presence.attributes.isOnline || null,
        lastSeen: (obj && obj.previewMessage && obj.previewMessage.__x_ephemeralStartTimestamp) ? obj.previewMessage.__x_ephemeralStartTimestamp * 1000 : null
    });
};

window.WAPI._serializeContactObj = (obj) => {
    if (obj == undefined) {
        return null;
    }
    return Object.assign(window.WAPI._serializeRawObj(obj), {
        formattedName: obj.formattedName,
        isHighLevelVerified: obj.isHighLevelVerified,
        isMe: obj.isMe,
        isMyContact: obj.isMyContact,
        isPSA: obj.isPSA,
        isUser: obj.isUser,
        isVerified: obj.isVerified,
        isWAContact: obj.isWAContact,
        profilePicThumbObj: obj.profilePicThumb ? WAPI._serializeProfilePicThumb(obj.profilePicThumb) : {},
        statusMute: obj.statusMute,
        msgs: null
    });
};


window.WAPI._serializeMessageObj = (obj) => {
    if (obj == undefined) {
        return null;
    }
    const _chat = obj['chat'] ? WAPI._serializeChatObj(obj['chat']) : {};
    if(obj.quotedMsg) obj.quotedMsgObj();
    return Object.assign(window.WAPI._serializeRawObj(obj), {
        id: obj.id._serialized,
        sender: obj["senderObj"] ? WAPI._serializeContactObj(obj["senderObj"]) : null,
        timestamp: obj["t"],
        content: obj["body"],
        isGroupMsg: obj.isGroupMsg,
        isLink: obj.isLink,
        isMMS: obj.isMMS,
        isMedia: obj.isMedia,
        isNotification: obj.isNotification,
        isPSA: obj.isPSA,
        type: obj.type,
        chat: _chat,
        isOnline: _chat.isOnline,
        lastSeen: _chat.lastSeen,
        chatId: obj.id.remote,
        quotedMsgObj: WAPI._serializeMessageObj(obj['_quotedMsgObj']),
        mediaData: window.WAPI._serializeRawObj(obj['mediaData']),
        reply: body => window.WAPI.reply(_chat.id._serialized, body, obj)
    });
};

window.WAPI._serializeNumberStatusObj = (obj) => {
    if (obj == undefined) {
        return null;
    }

    return Object.assign({}, {
        id: obj.jid,
        status: obj.status,
        isBusiness: (obj.biz === true),
        canReceiveMessage: (obj.status === 200)
    });
};

window.WAPI._serializeProfilePicThumb = (obj) => {
    if (obj == undefined) {
        return null;
    }

    return Object.assign({}, {
        eurl: obj.eurl,
        id: obj.id,
        img: obj.img,
        imgFull: obj.imgFull,
        raw: obj.raw,
        tag: obj.tag
    });
}

window.WAPI.createGroup = async function (name, contactsId) {
    if (!Array.isArray(contactsId)) {
        contactsId = [contactsId];
    }

    return await window.Store.WapQuery.createGroup(name, contactsId);
};

/**
 * Sends the command for your device to leave a group.
 * @param groupId stirng, the is for the group.
 * returns Promise<void>
 */
window.WAPI.leaveGroup = function (groupId) {
    groupId = typeof groupId == "string" ? groupId : groupId._serialized;
    var group = WAPI.getChat(groupId);
    return Store.GroupActions.sendExitGroup(group)
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

window.WAPI.getAllNewMessages = async function () {
    return JSON.stringify(WAPI.getAllChatsWithNewMsg().map(c => WAPI.getChat(c.id._serialized)).map(c => c.msgs._models.filter(x => x.isNewMsg)) || [])
}

// x.ack==-1
window.WAPI.getAllUnreadMessages = async function () {
    return JSON.stringify(WAPI.getAllChatsWithNewMsg().map(c => WAPI.getChat(c.id._serialized)).map(c => c.msgs._models.filter(x => x.ack == -1)).flatMap(x => x) || [])
}

window.WAPI.getIndicatedNewMessages = async function () {
    return JSON.stringify(Store.Chat.models.filter(chat=>chat.unreadCount).map(chat=>{return {id:chat.id,indicatedNewMessages: chat.msgs.models.slice(Math.max(chat.msgs.length - chat.unreadCount, 0)).filter(msg=>!msg.id.fromMe)}}))
}

window.WAPI.getAllChatsWithMessages = async function (onlyNew, done) {
    let x = [];
    if (onlyNew) { x.push(WAPI.getAllChatsWithNewMsg().map(c => WAPI.getChat(c.id._serialized))); }
    else {
        x.push(WAPI.getAllChatIds().map((c) => WAPI.getChat(c)));
    }
    const result = (await Promise.all(x)).flatMap(x => x);
    return JSON.stringify(result);
}

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
 * Sets the chat state
 * 
 * @param {0|1|2} chatState The state you want to set for the chat. Can be TYPING (1), RECRDING (2) or PAUSED (3);
 * returns {boolean}
 */
window.WAPI.sendChatstate = async function (state, chatId) {
    switch(state) {
        case 0:
            await window.Store.ChatStates.sendChatStateComposing(chatId);
            break;
        case 1:
            await window.Store.ChatStates.sendChatStateRecording(chatId);
            break;
        case 2:
            await window.Store.ChatStates.sendChatStatePaused(chatId);
            break;
        default:
            return false
    }
    return true;
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
    if (found) found.sendMessage = (found.sendMessage) ? found.sendMessage : function () { return window.Store.sendMessage.apply(this, arguments); };
    if (done !== undefined) done(found);
    return found;
}

/**
 * Get your status
 * @param {string} to '000000000000@c.us'
 * returns: {string,string} and string -"Hi, I am using WhatsApp"
 */
window.WAPI.getStatus = async (id) => {
return await Store.MyStatus.getStatus(id)
}

window.WAPI.getChatByName = function (name, done) {
    const found = window.Store.Chat.find((chat) => chat.name === name);
    if (done !== undefined) done(found);
    return found;
};

window.WAPI.sendImageFromDatabasePicBot = function (picId, chatId, caption) {
    var chatDatabase = window.WAPI.getChatByName('DATABASEPICBOT');
    var msgWithImg = chatDatabase.msgs.find((msg) => msg.caption == picId);

    if (msgWithImg === undefined) {
        return false;
    }
    var chatSend = WAPI.getChat(chatId);
    if (chatSend === undefined) {
        return false;
    }
    const oldCaption = msgWithImg.caption;

    msgWithImg.id.id = window.WAPI.getNewId();
    msgWithImg.id.remote = chatId;
    msgWithImg.t = Math.ceil(new Date().getTime() / 1000);
    msgWithImg.to = chatId;

    if (caption !== undefined && caption !== '') {
        msgWithImg.caption = caption;
    } else {
        msgWithImg.caption = '';
    }

    msgWithImg.collection.send(msgWithImg).then(function (e) {
        msgWithImg.caption = oldCaption;
    });

    return true;
};

window.WAPI.getGeneratedUserAgent = function (useragent) {
    if (!useragent.includes('WhatsApp')) return 'WhatsApp/0.4.315 ' + useragent;
    return useragent.replace(useragent.match(/WhatsApp\/([.\d])*/g)[0].match(/[.\d]*/g).find(x => x), window.Debug.VERSION)
}

window.WAPI.getWAVersion = function () {
    return window.Debug.VERSION;
}

window.WAPI.sendMessageWithThumb = function (thumb, url, title, description, text, chatId, done) {
    var chatSend = WAPI.getChat(chatId);
    if (chatSend === undefined) {
        if (done !== undefined) done(false);
        return false;
    }
    var linkPreview = {
        canonicalUrl: url,
        description: description,
        matchedText: url,
        title: title,
        thumbnail: thumb // Thumbnail max size allowed: 200x200
    };
    chatSend.sendMessage(text.includes(url) ? text : `${url}\n${text}`, { linkPreview: linkPreview, mentionedJidList: [], quotedMsg: null, quotedMsgAdminGroupJid: null });
    if (done !== undefined) done(true);
    return true;
};

window.WAPI.revokeGroupInviteLink = async function (chatId) {
    var chat = Store.Chat.get(chatId);
    if(!chat.isGroup) return false;
    await Store.GroupInvite.revokeGroupInvite(chat);
    return true;
}

window.WAPI.getGroupInviteLink = async function (chatId) {
    var chat = Store.Chat.get(chatId);
    if(!chat.isGroup) return false;
    await Store.GroupInvite.queryGroupInviteCode(chat);
    return `https://chat.whatsapp.com/${chat.inviteCode}`
}

window.WAPI.getNewId = function () {
    var text = "";
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
    let chat = WAPI.getChat(id);
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
};


/**
 * Load more messages in chat object from server. Use this in a while loop
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
window.WAPI.loadAllEarlierMessages = async function (id, done) {
    const found = WAPI.getChat(id);
    while (!found.msgs.msgLoadState.noEarlierMsgs) {
        console.log('loading more messages')
        await found.loadEarlierMsgs();
    }
    console.log('done');
    return true
    // x = function () {
    //     if (!found.msgs.msgLoadState.noEarlierMsgs) {
    //         console.log('loading more messages')
    //         found.loadEarlierMsgs().then(x);
    //     } else if (done) {
    //         done();
    //         return true
    //     }
    // };
    // return x();
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
        if (found.msgs.models[0].t > lastMessage && !found.msgs.msgLoadState.noEarlierMsgs) {
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
    let output = window.Store.GroupMetadata.find(id);
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
 * Returns an object with all of your host device details
 */
window.WAPI.getMe = function(){
    return Store.Me.attributes;
}

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

window.WAPI.isConnected = function (done) {
    // Phone Disconnected icon appears when phone is disconnected from the tnternet
    const isConnected = document.querySelector('*[data-icon="alert-phone"]') !== null ? false : true;

    if (done !== undefined) done(isConnected);
    return isConnected;
};

//I dont think this will work for group chats.
window.WAPI.isChatOnline = async function (id) {
    return await Store.Chat.get(id).presence.subscribe().then(_=>Store.Chat.get(id).presence.attributes.isOnline);
}

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
    const chat = WAPI.getChat(id);
    let output = [];
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

window.WAPI.loadAndGetAllMessagesInChat = function (id, includeMe, includeNotifications, done) {
    return WAPI.loadAllEarlierMessages(id).then(_ => {
        const chat = WAPI.getChat(id);
        let output = [];
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
    })
};

window.WAPI.getAllMessageIdsInChat = function (id, includeMe, includeNotifications, done) {
    const chat = WAPI.getChat(id);
    let output = [];
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
                    } else {
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


window.WAPI.sendMessageWithMentions = async function (ch, body) {
    var chat = ch.id ? ch : Store.Chat.get(ch);
    var chatId = chat.id._serialized;
    var msgIveSent = chat.msgs.filter(msg => msg.__x_isSentByMe)[0];
    if(!msgIveSent) return chat.sendMessage(body);
    var tempMsg = Object.create(msgIveSent);
    var newId = window.WAPI.getNewMessageId(chatId);
    var mentionedJidList = body.match(/@(\d*)/g).filter(x=>x.length>5).map(x=>new Store.WidFactory.createUserWid(x.replace("@",""))) || undefined;
    var extend = {
        ack: 0,
        id: newId,
        local: !0,
        self: "out",
        t: parseInt(new Date().getTime() / 1000),
        to: new Store.WidFactory.createWid(chatId),
        isNewMsg: !0,
        type: "chat",
        body,
        quotedMsg:null,
        mentionedJidList
    };
    Object.assign(tempMsg, extend);
    await Store.addAndSendMsgToChat(chat, tempMsg)
    return newId._serialized;
}

window.WAPI.sendMessageReturnId = async function (ch, body) {
    var chat = ch.id ? ch : Store.Chat.get(ch);
    var chatId = chat.id._serialized;
    var msgIveSent = chat.msgs.filter(msg => msg.__x_isSentByMe)[0];
    if(!msgIveSent) return chat.sendMessage(body);
    var tempMsg = Object.create(msgIveSent);
    var newId = window.WAPI.getNewMessageId(chatId);
    var extend = {
        ack: 0,
        id: newId,
        local: !0,
        self: "out",
        t: parseInt(new Date().getTime() / 1000),
        to: new Store.WidFactory.createWid(chatId),
        isNewMsg: !0,
        type: "chat",
        body,
        quotedMsg:null
    };
    Object.assign(tempMsg, extend);
    await Store.addAndSendMsgToChat(chat, tempMsg)
    return newId._serialized;
}


window.WAPI.sendMessage = function (id, message, done) {
    var chat = WAPI.getChat(id);
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    if (chat !== undefined) {
        if (done !== undefined) {
            chat.sendMessage(message).then(function () {

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
            // return WAPI.sendMessageReturnId(chat,message).then(id=>{return id})
            return chat.sendMessage(message).then(_=>chat.lastReceivedKey._serialized);
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
            Store.SendSeen(chat, false).then(function () {
                done(true);
            });
            return true;
        } else {
            Store.SendSeen(chat, false);
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

window.WAPI.setPresence = function (available) {
    if(available)Store.Presence.setPresenceAvailable();
    else Store.Presence.setPresenceUnavailable();
}
window.WAPI.getUnreadMessages = function (includeMe, includeNotifications, use_unread_count, done) {
    const chats = window.Store.Chat.models;
    let output = [];

    for (let chat in chats) {
        if (isNaN(chat)) {
            continue;
        }

        let messageGroupObj = chats[chat];
        let messageGroup = WAPI._serializeChatObj(messageGroupObj);

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

window.WAPI.getProfilePicFromServer = function (id) {
    return Store.WapQuery.profilePicFind(id).then(x => x.eurl);
}

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
    let userId = new window.Store.UserConstructor(chatId, { intentionallyUsePrivateConstructor: true });
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

window.WAPI.smartDeleteMessages = function (chatId, messageArray, onlyLocal, done) {
    var userId = new Store.WidFactory.createWid(chatId);
    let conversation = WAPI.getChat(userId);
    if (!conversation) {
        if (done !== undefined) {
            done(false);
        }
        return false;
    }

    if (!Array.isArray(messageArray)) {
        messageArray = [messageArray];
    }

    let messagesToDelete = messageArray.map(msgId => (typeof msgId == 'string')?window.Store.Msg.get(msgId):msgId).filter(x=>x);
    if(messagesToDelete.length==0) return true;
    let jobs = onlyLocal ? [conversation.sendDeleteMsgs(messagesToDelete,conversation)] :[
        conversation.sendRevokeMsgs(messagesToDelete.filter(msg=>msg.isSentByMe),conversation),
        conversation.sendDeleteMsgs(messagesToDelete.filter(msg=>!msg.isSentByMe),conversation)
    ]
    return Promise.all(jobs).then(_=>{
        if (done !== undefined) {
            done(true);
        }
        return true;
    })
};

window.WAPI.deleteMessage = function (chatId, messageArray, revoke = false, done) {
    let userId = new window.Store.UserConstructor(chatId, { intentionallyUsePrivateConstructor: true });
    let conversation = WAPI.getChat(userId);

    if (!conversation) {
        if (done !== undefined) {
            done(false);
        }
        return false;
    }

    if (!Array.isArray(messageArray)) {
        messageArray = [messageArray];
    }

    let messagesToDelete = messageArray.map(msgId => window.Store.Msg.get(msgId));

    if (revoke) {
        conversation.sendRevokeMsgs(messagesToDelete, conversation);
    } else {
        conversation.sendDeleteMsgs(messagesToDelete, conversation);
    }

    if (done !== undefined) {
        done(true);
    }

    return true;
};

window.WAPI.clearChat = async function (id) {
    return await Store.ChatUtil.sendClear(Store.Chat.get(id),true);
}

/**
 * @param id The id of the conversation
 * @param archive boolean true => archive, false => unarchive
 * @return boolean true: worked, false: didnt work (probably already in desired state)
 */
window.WAPI.archiveChat = async function (id, archive) {
    return await Store.Archive.setArchive(Store.Chat.get(id),archive).then(_=>true).catch(_=>false)
}

/**
 * Extracts vcards from a message
 * @param id string id of the message to extract the vcards from
 * @returns [vcard] 
 * ```
 * [
 * {
 * displayName:"Contact name",
 * vcard: "loong vcard string"
 * }
 * ]
 * ``` or false if no valid vcards found
 */
window.WAPI.getVCards = function(id) {
    var msg = Store.Msg.get(id);
    if(msg) {
        if(msg.type=='vcard') {
            return [
                {
                    displayName:msg.subtype,
                    vcard:msg.body
                }
            ]
        } else if (msg.type=='multi_vcard') {
            return msg.vcardList
        } else return false;
    } else {
        return false
    }
}

window.WAPI.checkNumberStatus = async function (id, done) {
    try {
        const result = await window.Store.WapQuery.queryExist(id);
        if (result.jid === undefined) throw 404;
        const data = window.WAPI._serializeNumberStatusObj(result);
        if (data.status == 200) data.numberExists = true
        if (done !== undefined) {
            done(window.WAPI._serializeNumberStatusObj(result));
            done(data);
        }
        return data;
    } catch (e) {
        if (done !== undefined) {
            done(window.WAPI._serializeNumberStatusObj({
                status: e,
                jid: id
            }));
        }
        return e;
    }
};

/**
 * New messages observable functions.
 */
window.WAPI._newMessagesQueue = [];
window.WAPI._newMessagesBuffer = (sessionStorage.getItem('saved_msgs') != null) ? JSON.parse(sessionStorage.getItem('saved_msgs')) : [];
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
                window.WAPI._newMessagesQueue = [];

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


window.WAPI.addAllNewMessagesListener = callback => window.Store.Msg.on('add', (newMessage) => {
    if (newMessage && newMessage.isNewMsg) {
        let message = window.WAPI.processMessageObj(newMessage, true, false);
        if (message) {
            callback(message)
        }
    }
});

/**
 * Registers a callback to be called when a the acknowledgement state of the phone connection.
 * @param callback - function - Callback function to be called when the device state changes. this returns 'CONNECTED' or 'TIMEOUT'
 * @returns {boolean}
 */
window.WAPI.onStateChanged = function (callback) {
    // (x,y)=>console.log('statechanged',x,x.state)
    window.Store.State.default.on('change:state', callback)
    return true;
}

/**
 * Registers a callback to be called when your phone receives a new call request.
 * @param callback - function - Callback function to be called upon a new call. returns a call object.
 * @returns {boolean}
 */
window.WAPI.onIncomingCall = function (callback) {
    window.Store.Call.on('add',callback);
    return true;
}

/**
 * @param label: either the id or the name of the label. id will be something simple like anhy nnumber from 1-10, name is the label of the label if that makes sense.
 * @param objectId The Chat, message or contact id to which you want to add a label
 * @param type The type of the action. It can be either "add" or "remove"
 * @returns boolean true if it worked otherwise false
 */
window.WAPI.addOrRemoveLabels = async function (label, objectId, type) {
    var {id} = Store.Label.models.find(x=>x.id==label||x.name==label)
    var to = Store.Chat.get(objectId) || Store.Msg.get(objectId) || Store.Contact.get(objectId);
    if(!id || !to) return false;
    const {status} = await Store.Label.addOrRemoveLabels([{id,type}],[to]);
    return status===200;
}

/**
 * Registers a callback to be called when a the acknowledgement state of a message changes.
 * @param callback - function - Callback function to be called when a message acknowledgement changes.
 * @returns {boolean}
 */
window.WAPI.waitNewAcknowledgements = function (callback) {
    Store.Msg.on("change:ack", callback);
    return true;
}

window.WAPI.onLiveLocation = function (chatId, callback) {
    var lLChat = Store.LiveLocation.get(chatId);
    if(lLChat) {
        var validLocs = lLChat.participants.validLocations();
        validLocs.map(x=>x.on('change:lastUpdated',(x,y,z)=>{console.log(x,y,z);
            const {id,lat,lng,accuracy,degrees,speed,lastUpdated}=x;
        const l = {
            id:id.toString(),lat,lng,accuracy,degrees,speed,lastUpdated};
        // console.log('newloc',l)
        callback(l);
        }));
        return true;
    } else {
        return false;
    }
}

window.WAPI.onBattery = function(callback) {
    window.Store.Conn.on('change:battery', ({battery}) =>  callback(battery));
    return true;
}

/**
 * Registers a callback to participant changes on a certain, specific group
 * @param groupId - string - The id of the group that you want to attach the callback to.
 * @param callback - function - Callback function to be called when a message acknowledgement changes. The callback returns 3 variables
 * @returns {boolean}
 */
var groupParticpiantsEvents = {};
window.WAPI.onParticipantsChanged = function (groupId, callback) {
    const subtypeEvents = [
        "invite" , 
        "add" , 
        "remove" ,
        "leave" ,
        "promote" ,
        "demote"
    ];
    const chat = window.Store.Chat.get(groupId);
    //attach all group Participants to the events object as 'add'
    const metadata = window.Store.GroupMetadata.get(groupId);
    if (!groupParticpiantsEvents[groupId]) {
        groupParticpiantsEvents[groupId] = {};
        metadata.participants.forEach(participant => {
            groupParticpiantsEvents[groupId][participant.id.toString()] = {
                subtype: "add",
                from: metadata.owner
            }
        });
    }
    let i = 0;
    chat.on("change:groupMetadata.participants",
        _ => chat.on("all", (x, y) => {
            const { isGroup, previewMessage } = y;
            if (isGroup && x === "change" && previewMessage && previewMessage.type === "gp2" && subtypeEvents.includes(previewMessage.subtype)) {
                const { subtype, from, recipients } = previewMessage;
                const rec = recipients[0].toString();
                if (groupParticpiantsEvents[groupId][rec] && groupParticpiantsEvents[groupId][recipients[0]].subtype == subtype) {
                    //ignore, this is a duplicate entry
                    // console.log('duplicate event')
                } else {
                    //ignore the first message
                    if (i == 0) {
                        //ignore it, plus 1,
                        i++;
                    } else {
                        groupParticpiantsEvents[groupId][rec] = { subtype, from };
                        //fire the callback
                        // // previewMessage.from.toString()
                        // x removed y
                        // x added y
                        callback({
                            by: from.toString(),
                            action: subtype,
                            who: recipients
                        });
                        chat.off("all", this)
                        i = 0;
                    }
                }
            }
        })
    )
    return true;
}


/**
 * Registers a callback that fires when your host phone is added to a group.
 * @param callback - function - Callback function to be called when a message acknowledgement changes. The callback returns 3 variables
 * @returns {boolean}
 */
window.WAPI.onAddedToGroup = function(callback){
    Store.Chat.on('add',(chatObject)=>{
        if(chatObject&&chatObject.isGroup){
            callback(chatObject)
        };
    });
    return true;
}

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
    // var idUser = new Store.WidFactory.createWid(chatid);
    // create new chat
    return Store.Chat.find(chatid).then((chat) => {
        var mediaBlob = window.WAPI.base64ImageToFile(imgBase64, filename);
        return window.WAPI.procFiles(chat,mediaBlob).then(mc => {
            var media = mc.models[0];
            media.sendToChat(chat, { caption });
            if (done !== undefined) done(true);
            return chat.lastReceivedKey._serialized;
        });
    });
}

/**
 * This function sts the profile name of the number. For future reference, setProfilePic is for profile pic,
 * @param newName - string the new name to set as profile name
 */
window.WAPI.setMyName = async function (newName) {
    if(!Store.Versions.default[11].BinaryProtocol) Store.Versions.default[11].BinaryProtocol=new Store.bp(11);
    return await Store.Versions.default[11].setPushname(newName);
}

/**
* Update your status
*   @param newStatus string new Status
*/
window.WAPI.setMyStatus = function (newStatus) {
    return Store.MyStatus.setMyStatus(newStatus)
}

window.WAPI.sendVideoAsGif = function (imgBase64, chatid, filename, caption, done) {
    // var idUser = new Store.WidFactory.createWid(chatid);
    // create new chat
    return Store.Chat.find(chatid).then((chat) => {
        var mediaBlob = window.WAPI.base64ImageToFile(imgBase64, filename);
        var mc = new Store.MediaCollection(chat);
        window.WAPI.procFiles(chat,mediaBlob).then(mc => {
            var media = mc.models[0];
            media.mediaPrep._mediaData.isGif = true;
            media.mediaPrep._mediaData.gifAttribution = 1;
            media.mediaPrep.sendToChat(chat, { caption: caption });
            if (done !== undefined) done(true);
        });
    });
}


/**
 * Find any product listings of the given number. Use this to query a catalog
 *
 * @param id id of buseinss profile (i.e the number with @c.us)
 * @param done Optional callback function for async execution
 * @returns None
 */
window.WAPI.getBusinessProfilesProducts = function (id, done) {
    return Store.Catalog.find(id).then(resp => {
        if (resp.msgProductCollection && resp.msgProductCollection._models.length)
            done();
        return resp.productCollection._models;
    }).catch(error => {
        done();
        return error.model._products;
    })
};


window.WAPI.procFiles= async function(chat, blobs) {
    if (!Array.isArray(blobs)) {
        blobs = [blobs];
    }
    var mc = new Store.MediaCollection(chat);
    await mc.processFiles((Debug.VERSION === '0.4.613')?blobs:blobs.map(blob=>{return{file:blob}}) , chat, 1);
    return mc
}
/**
 * Sends product with image to chat
 * @param imgBase64 Base64 image data
 * @param chatid string the id of the chat that you want to send this product to
 * @param caption string the caption you want to add to this message
 * @param bizNumber string the @c.us number of the business account from which you want to grab the product
 * @param productId string the id of the product within the main catalog of the aforementioned business
 * @param done - function - Callback function to be called contained the buffered messages.
 * @returns 
 */
window.WAPI.sendImageWithProduct = function (imgBase64, chatid, caption, bizNumber, productId, done) {
    Store.Catalog.findCarouselCatalog(bizNumber).then(cat => {
        if (cat && cat[0]) {
            const product = cat[0].productCollection.get(productId);
            const temp = {
                productMsgOptions: {
                    businessOwnerJid: product.catalogWid.toString({
                        legacy: !0
                    }),
                    productId: product.id.toString(),
                    url: product.url,
                    productImageCount: product.productImageCollection.length,
                    title: product.name,
                    description: product.description,
                    currencyCode: product.currency,
                    priceAmount1000: product.priceAmount1000,
                    type: "product"
                },
                caption
            }

            // var idUser = new Store.WidFactory.createWid(chatid);

            return Store.Chat.find(chatid).then((chat) => {
                var mediaBlob = window.WAPI.base64ImageToFile(imgBase64, filename);
                // var mc = new Store.MediaCollection(chat);
                // mc.processFiles([mediaBlob], chat, 1)
                window.WAPI.procFiles(chat,mediaBlob).then(mc => {
                    var media = mc.models[0];
                    Object.entries(temp.productMsgOptions).map(([k, v]) => media.mediaPrep._mediaData[k] = v)
                    media.mediaPrep.sendToChat(chat, temp);
                    if (done !== undefined) done(true);
                });
            });
        }
    })
}

window.WAPI.base64ImageToFile = function (b64Data, filename) {
    var arr = b64Data.split(',');
    var mime = arr[0].match(/:(.*?);/)[1];
    var bstr = atob(arr[1]);
    var n = bstr.length;
    var u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
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
 * Forward an array of messages to a specific chat using the message ids or Objects
 *
 * @param {string} to '000000000000@c.us'
 * @param {string|array[Message | string]} messages this can be any mixture of message ids or message objects
 * @param {boolean} skipMyMessages This indicates whether or not to skip your own messages from the array
 */
window.WAPI.forwardMessages = async function (to, messages, skipMyMessages) {
    if (!Array.isArray(messages)) {
        messages = [messages];
    }
    const finalForwardMessages = messages.map(msg => {
        if (typeof msg == 'string') {
            //msg is string, get the message object
            return window.Store.Msg.get(msg);
        } else {
            return window.Store.Msg.get(msg.id);
        }
    }).filter(msg => skipMyMessages ? !msg.__x_isSentByMe : true);

    // let userId = new window.Store.UserConstructor(to);
    let conversation = window.Store.Chat.get(to);
    return await conversation.forwardMessages(finalForwardMessages)
};

/**
 * Create an chat ID based in a cloned one
 *
 * @param {string} chatId '000000000000@c.us'
 */
window.WAPI.getNewMessageId = function (chatId) {
    var newMsgId = new Store.MsgKey(Object.assign({}, Store.Msg.models[0].__x_id))
    // .clone();

    newMsgId.fromMe = true;
    newMsgId.id = WAPI.getNewId().toUpperCase();
    newMsgId.remote = chatId;
    newMsgId._serialized = `${newMsgId.fromMe}_${newMsgId.remote}_${newMsgId.id}`

    return newMsgId;
};


/**
 * Simulate '...typing' in the chat.
 *
 * @param {string} chatId '000000000000@c.us'
 * @param {boolean} on true to turn on similated typing, false to turn it off //you need to manually turn this off.
 */
window.WAPI.simulateTyping = async function (chatId, on) {
    if (on) await Store.ChatStates.sendChatStateComposing(chatId)
    else await Store.ChatStates.sendChatStatePaused(chatId)
};

/**
 * Send location
 *
 * @param {string} chatId '000000000000@c.us'
 * @param {string} lat latitude
 * @param {string} lng longitude
 * @param {string} loc Text to go with the location message
 */
window.WAPI.sendLocation = async function (chatId, lat, lng, loc) {
    var chat = Store.Chat.get(chatId);
    var tempMsg = Object.create(Store.Msg.models.filter(msg => msg.__x_isSentByMe && !msg.quotedMsg)[0]);
    var newId = window.WAPI.getNewMessageId(chatId);
    var extend = {
        ack: 0,
        id: newId,
        local: !0,
        self: "out",
        t: parseInt(new Date().getTime() / 1000),
        to: chatId,
        isNewMsg: !0,
        type: "location",
        lat,
        lng,
        loc,
        clientUrl:undefined,
        directPath:undefined,
        filehash:undefined,
        uploadhash:undefined,
        mediaKey:undefined,
        isQuotedMsgAvailable:false,
        invis:false,
        mediaKeyTimestamp:undefined,
        mimetype:undefined,
        height:undefined,
        width:undefined,
        ephemeralStartTimestamp:undefined,
        body:undefined,
        mediaData:undefined,
        isQuotedMsgAvailable: false
    };
    Object.assign(tempMsg, extend);
    return await Promise.all(Store.addAndSendMsgToChat(chat, tempMsg))
};

/**
 * Send VCARD
 *
 * @param {string} chatId '000000000000@c.us'
 * @param {string} vcard vcard as a string
 * @param {string} contactName The display name for the contact. CANNOT BE NULL OTHERWISE IT WILL SEND SOME RANDOM CONTACT FROM YOUR ADDRESS BOOK.
 * @param {string} contactNumber If supplied, this will be injected into the vcard (VERSION 3 ONLY FROM VCARDJS) with the whatsapp id to make it show up with the correct buttins on whatsapp.
 */
window.WAPI.sendVCard = async function (chatId, vcard, contactName, contactNumber) {
    var chat = Store.Chat.get(chatId);
    var tempMsg = Object.create(Store.Msg.models.filter(msg => msg.__x_isSentByMe && !msg.quotedMsg)[0]);
    var newId = window.WAPI.getNewMessageId(chatId);
    var extend = {
        ack: 0,
        id: newId,
        local: !0,
        self: "out",
        t: parseInt(new Date().getTime() / 1000),
        to: chatId,
        isNewMsg: !0,
        type: "vcard",
        clientUrl:undefined,
        directPath:undefined,
        filehash:undefined,
        uploadhash:undefined,
        mediaKey:undefined,
        isQuotedMsgAvailable:false,
        invis:false,
        mediaKeyTimestamp:undefined,
        mimetype:undefined,
        height:undefined,
        width:undefined,
        ephemeralStartTimestamp:undefined,
        body:contactNumber?vcard.replace('TEL;TYPE=WORK,VOICE:',`TEL;TYPE=WORK,VOICE;waid=${contactNumber}:`):vcard,
        mediaData:undefined,
        isQuotedMsgAvailable: false,
        subtype: contactName
    };
    Object.assign(tempMsg, extend);
    return (await Promise.all(Store.addAndSendMsgToChat(chat, tempMsg)))[1]=="success"
};

window.WAPI.sendButtons = async function(chatId){
    var chat = Store.Chat.get(chatId);
    var tempMsg = Object.create(Store.Msg.models.filter(msg => msg.__x_isSentByMe && !msg.quotedMsg)[0]);
    // var tempMsg = Object.create(Store.Msg.models.filter(msg => msg.to._serialized===chatId&&msg.__x_isSentByMe&& msg.type=='chat' && !msg.quotedStanzaID)[0])
    var t2 = Object.create(Store.Msg.filter(x=>x.type=='template'&!x.id.fromMe)[0]);
    var newId = window.WAPI.getNewMessageId(chatId);
    delete tempMsg.hasTemplateButtons;
    var extend = {
        ack: 0,
        id: newId,
        local: !0,
        self: "out",
        t: parseInt(new Date().getTime() / 1000),
        to: chat.id,
        isNewMsg: false,
        // isNewMsg: !0,
        type: "template",
        subtype:"text",
        body:'body text',
        isForwarded:false,
        broadcast:false,
        isQuotedMsgAvailable:false,
        shouldEnableHsm:true,
        __x_hasTemplateButtons:true,
        invis:true,
    };

    Object.assign(tempMsg, extend);

    var btns = new Store.Builders.HydratedFourRowTemplate({
hydratedButtons:[
    new Store.Builders.HydratedTemplateButton({quickReplyButton:new Store.Builders.HydratedQuickReplyButton({displayText:'test',id: "{\"eventName\":\"inform\"}",quickReplyButton:true}),index:0}),
    new Store.Builders.HydratedTemplateButton({callButton:new Store.Builders.HydratedCallButton({displayText:'test call',phoneNumber:"4477777777777"}),index:1}),
    new Store.Builders.HydratedTemplateButton({urlButton:new Store.Builders.HydratedURLButton({displayText:'test url',url:"https://google.com"}),index:2})
],
hydratedContentText:'hellllloooowww',
hydratedFooterText:"asdasd",
hydratedTitleText:"asdasd232"
});

    Store.Parser.parseTemplateMessage(t2,btns);
    tempMsg.buttons=t2.buttons;
    console.log('t2',t2.body);
    tempMsg.mediaData = undefined;
    tempMsg.mediaObject=undefined;
    tempMsg._minEphemeralExpirationTimestamp()
    tempMsg.senderObj.isBusiness=true;
    tempMsg.senderObj.isEnterprise=true;
    tempMsg.senderObj = {
      ...tempMsg.senderObj,
      isBusiness:true,
      isEnterprise:true,
      notifyName:"button test",
      mentionName:"Button Test",
      displayName:"Button Test",
      searchName:"button test",
      header:'b',
      formattedShortNameWithNonBreakingSpaces:"Button test",
      formattedShortName:"Button test",
      formattedName:"Button test",
      formattedUser:"Button test",
      
    }
    tempMsg.body=t2.body;
    tempMsg.to=tempMsg.from;
    tempMsg.caption=tempMsg.body;
    console.log('tempMsg',tempMsg)
    return chat.sendQueue.enqueue(chat.addQueue.enqueue(
        Store.MessageUtils.appendMessage(chat,tempMsg).then(()=>{
            var e = Store.Msg.add(tempMsg)[0];
            console.log('e ',e );
            if(e) {
                return e.waitForPrep().then(()=>{
                    return e;
                })
            }
        })
    ).then(t=>chat.msgs.add(t)).catch(e=>console.log(e))).then(t => {
        var e = t[0];
        const s = Store.Base2;
        if(!s.BinaryProtocol)
        window.Store.Base2.BinaryProtocol = new window.Store.bp(11);
        var idUser = new Store.WidFactory.createWid(chatId);
        var k = Store.createMessageKey({
            ...e,
            to:idUser,
            id:e.__x_id
            });
        console.log('key',k)
var wm = new Store.WebMessageInfo({
        message:new Store.Builders.Message({
            // conversation:'okhellowhi',
            templateMessage:new Store.Builders.TemplateMessage({hydratedFourRowTemplate:btns,hydratedTemplate:btns})
        }),
        key:k,
        messageTimestamp:e.t,
        multicast:undefined,
        url:undefined,
        urlNumber:undefined,
        clearMedia:undefined,
        ephemeralDuration:undefined
        });
console.log('wm',wm)
var action = s.actionNode('relay',[['message', null, Store.WebMessageInfo.encode(wm).readBuffer()]]);
console.log('action',action)
var a =e.id.id;
return new Promise(function(resolve, reject) {
    console.log('yo')
    return s.binSend("send", action, reject, {
        tag: a,
        onSend: s.wrap(_=>{console.log('onsend',_);resolve(_);}),
        onDrop: s.wrap(_=>{console.log('ondrop',_);reject(_);}),
        retryOn5xx: !0,
        resendGuard: function(_) {
            var t = Store.Msg.get(e.id);
            console.log('in resend', _)
            return "protocol" === e.type || t && t.id.equals(e.id)
        }
    }, {
        debugString: ["action", "message", e.type, e.subtype, a].join(),
        debugObj: {
            xml: action,
            pb: wm
        },
        metricName: "MESSAGE",
        ackRequest: !1
    })
})

    })
}

window.WAPI.sendButtons2 = async function(chatId){
    var chat = Store.Chat.get(chatId);
    var tempMsg = Object.create(Store.Msg.models.filter(msg => msg.to._serialized===chatId&&msg.__x_isSentByMe&& msg.type=='chat' && !msg.quotedStanzaID)[0])
    var t2 = Object.create(Store.Msg.models.filter(msg => msg.to._serialized===chatId&&msg.__x_isSentByMe&& msg.type=='chat' && !msg.quotedStanzaID)[0]);
    var newId = window.WAPI.getNewMessageId(chatId);
    delete tempMsg.hasTemplateButtons;
    var extend = {
        ack: 0,
        id: newId,
        local: !0,
        self: "out",
        t: parseInt(new Date().getTime() / 1000),
        to: Store.WidFactory.createWid(chatId),
        isNewMsg: !0,
        type: "template",
        subtype:"text",
        broadcast:false,
        isQuotedMsgAvailable:false,
        shouldEnableHsm:true,
        __x_hasTemplateButtons:true,
        invis:false,
    };

    Object.assign(tempMsg, extend);

    var btns = new Store.Builders.HydratedFourRowTemplate({
hydratedButtons:[
    new Store.Builders.HydratedTemplateButton({quickReplyButton:new Store.Builders.HydratedQuickReplyButton({displayText:'test',id: "{\"eventName\":\"inform\"}",quickReplyButton:true}),index:0}),
    new Store.Builders.HydratedTemplateButton({callButton:new Store.Builders.HydratedCallButton({displayText:'test call',phoneNumber:"4477777777777"}),index:1}),
    new Store.Builders.HydratedTemplateButton({callButton:new Store.Builders.HydratedCallButton({displayText:'test call',phoneNumber:"4477777777777"}),index:2}),
    new Store.Builders.HydratedTemplateButton({urlButton:new Store.Builders.HydratedURLButton({displayText:'test url',url:"https://google.com"}),index:3})
],
hydratedContentText:'hellllloooowww',
hydratedFooterText:"asdasd",
hydratedTitleText:"asdasd232"
});

    Store.Parser.parseTemplateMessage(t2,btns);
    tempMsg.buttons=t2.buttons;
    console.log('t2',t2.body);
    console.log('tempMsg',tempMsg)
    
    return chat.sendQueue.enqueue(chat.addQueue.enqueue(
        Store.MessageUtils.appendMessage(chat,tempMsg).then(()=>{
            var e = Store.Msg.add(tempMsg)[0];
            console.log('e ',e );
            if(e) {
                return e.waitForPrep().then(()=>{
                    return e;
                })
            }
        })
    ).then(t=>chat.msgs.add(t)).catch(e=>console.log(e))).then(t => {
        var e = t[0];
        console.log('e',e)
        const s = Store.Base2;
        if(!s.BinaryProtocol)
        window.Store.Base2.BinaryProtocol = new window.Store.bp(11);
        var idUser = new Store.WidFactory.createWid(chatId);
        var k = Store.createMessageKey({
            ...e,
            to:idUser,
            id:e.__x_id
            });
        console.log('key',k)
var wm = new Store.WebMessageInfo({
        message:new Store.Builders.Message({
            //if you uncomment the next line then the message gets sent properly as a text
            // conversation:'okhellowhi',
            templateMessage:new Store.Builders.TemplateMessage({hydratedFourRowTemplate:btns,hydratedTemplate:btns})
        }),
        key:k,
        messageTimestamp:e.t,
        });
console.log('wm',wm)
var action = s.actionNode('relay',[['message', null, Store.WebMessageInfo.encode(wm).readBuffer()]]);
console.log('action',action)
var a =e.id.id;
console.log('a',a);
return new Promise(function(resolve, reject) {
    console.log('yo')
    return s.binSend("send", action, reject, {
        tag: a,
        onSend: s.wrap(resolve),
        onDrop: s.wrap(reject),
        retryOn5xx: !0,
        resendGuard: function(_) {
            var t = Store.Msg.get(e.id);
            return "protocol" === e.type || t && t.id.equals(e.id)
        }
    }, {
        debugString: ["action", "message", 'chat', 'null', a].join(),
        debugObj: {
            xml: action,
            pb: wm
        },
        metricName: "MESSAGE",
        ackRequest: !1
    })
})
    })
}



window.WAPI.reply = async function (chatId, body, quotedMsg) {
    if (typeof quotedMsg !== "object") quotedMsg = Store.Msg.get(quotedMsg)
    var chat = Store.Chat.get(chatId);
    let extras = {
            quotedParticipant: quotedMsg.author || quotedMsg.from,
            quotedStanzaID:quotedMsg.id.id
        };
    var tempMsg = Object.create(Store.Msg.models.filter(msg => msg.__x_isSentByMe && !msg.quotedMsg)[0]);
    var newId = window.WAPI.getNewMessageId(chatId);
    var extend = {
        ack: 0,
        id: newId,
        local: !0,
        self: "out",
        t: parseInt(new Date().getTime() / 1000),
        to: chatId,
        isNewMsg: !0,
        type: "chat",
        quotedMsg,
        body,
        ...extras
    };
    Object.assign(tempMsg, extend);
    await Store.addAndSendMsgToChat(chat, tempMsg)
};

/**
 * Send Payment Request
 *
 * @param {string} chatId '000000000000@c.us'
 * @param {string} amount1000 The amount in base value / 10 (e.g 50000 in GBP = £50)
 * @param {string} currency Three letter currency code (e.g SAR, GBP, USD, INR, AED, EUR)
 * @param {string} note message to send with the payment request
 */
window.WAPI.sendPaymentRequest = async function (chatId, amount1000, currency, noteMessage) {
    var chat = Store.Chat.get(chatId);
    var tempMsg = Object.create(Store.Msg.models.filter(msg => msg.__x_isSentByMe && !msg.quotedMsg)[0]);
    var newId = window.WAPI.getNewMessageId(chatId);
    var extend = {
        ack: 0,
        id: newId,
        local: !0,
        self: "out",
        t: parseInt(new Date().getTime() / 1000),
        to: chatId,
        isNewMsg: !0,
        type: "payment",
        subtype: "request",
        amount1000,
        requestFrom: chatId,
        currency,
        noteMessage,
        expiryTimestamp: parseInt(new Date(new Date().setDate(new Date().getDate() + 1)).getTime() / 1000)
    };
    Object.assign(tempMsg, extend);
    await Store.addAndSendMsgToChat(chat, tempMsg)
};



/**
 * Send Customized VCard without the necessity of contact be a Whatsapp Contact
 *
 * @param {string} chatId '000000000000@c.us'
 * @param {object|array} vcard { displayName: 'Contact Name', vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Contact Name;;;\nEND:VCARD' } | [{ displayName: 'Contact Name 1', vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Contact Name 1;;;\nEND:VCARD' }, { displayName: 'Contact Name 2', vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Contact Name 2;;;\nEND:VCARD' }]
 */
window.WAPI._sendVCard = function (chatId, vcard) {
    var chat = Store.Chat.get(chatId);
    var tempMsg = Object.create(Store.Msg.models.filter(msg => msg.__x_isSentByMe && !msg.quotedMsg)[0]);
    var newId = window.WAPI.getNewMessageId(chatId);

    var extend = {
        ack: 0,
        id: newId,
        local: !0,
        self: "out",
        t: parseInt(new Date().getTime() / 1000),
        to: chatId,
        isNewMsg: !0,
        isQuotedMsgAvailable:false,
    };

    if (Array.isArray(vcard)) {
        Object.assign(extend, {
            type: "multi_vcard",
            vcardList: vcard
        });

        delete extend.body;
    } else {
        Object.assign(extend, {
            type: "vcard",
            subtype: vcard.displayName,
            body: vcard.vcard
        });

        delete extend.vcardList;
    }

    Object.assign(tempMsg, extend);

    Store.addAndSendMsgToChat(chat, tempMsg)
};

/**
 * Block contact 
 * @param {string} id '000000000000@c.us'
 */
window.WAPI.contactBlock = async function (id) {
    const contact = window.Store.Contact.get(id);
    if (contact !== undefined) {
        await Store.Block.blockContact(contact)
        return true;
    }
    return false;
}
/**
 * Unblock contact 
 * @param {string} id '000000000000@c.us'
 */
window.WAPI.contactUnblock = async function (id) {
    const contact = window.Store.Contact.get(id);
    if (contact !== undefined) {
        await Store.Block.unblockContact(contact)
        return true;
    }
    return false;
}

/**
 * Remove participant of Group
 * @param {*} idGroup '0000000000-00000000@g.us'
 * @param {*} idParticipant '000000000000@c.us'
 * @param {*} done - function - Callback function to be called when a new message arrives.
 */
window.WAPI.removeParticipant = function (idGroup, idParticipant, done) {
    const chat = Store.Chat.get(idGroup);
    const rm = chat.groupMetadata.participants.get(idParticipant);
    window.Store.Participants.removeParticipants(chat, [rm]).then(() => {
        done(true); return true;
    })
}


/**
 * Add participant to Group
 * @param {*} idGroup '0000000000-00000000@g.us'
 * @param {*} idParticipant '000000000000@c.us'
 * @param {*} done - function - Callback function to be called when a new message arrives.
 */
window.WAPI.addParticipant = function (idGroup, idParticipant, done) {
    const chat = Store.Chat.get(idGroup);
    const add = Store.Contact.get(idParticipant);
    window.Store.Participants.addParticipants(chat, [add]).then(() => {
        done(true); return true;
    })
}

/**
 * Promote Participant to Admin in Group
 * @param {*} idGroup '0000000000-00000000@g.us'
 * @param {*} idParticipant '000000000000@c.us'
 * @param {*} done - function - Callback function to be called when a new message arrives.
 */
window.WAPI.promoteParticipant = function (idGroup, idParticipant, done) {
    const chat = Store.Chat.get(idGroup);
    const promote = chat.groupMetadata.participants.get(idParticipant);
    window.Store.Participants.promoteParticipants(chat, [promote]).then(() => {
        done(true); return true;
    })
}

/**
 * Demote Admin of Group
 * @param {*} idGroup '0000000000-00000000@g.us'
 * @param {*} idParticipant '000000000000@c.us'
 * @param {*} done - function - Callback function to be called when a new message arrives.
 */
window.WAPI.demoteParticipant = function (idGroup, idParticipant, done) {
    window.Store.WapQuery.demoteParticipants(idGroup, [idParticipant]).then(() => {
        const chat = Store.Chat.get(idGroup);
        const demote = chat.groupMetadata.participants.get(idParticipant);
        window.Store.Participants.demoteParticipants(chat, [demote]).then(() => {
            done(true); return true;
        })
    })
}

/**
 * @private
 * Send Sticker
 * @param {*} sticker 
 * @param {*} chatId '000000000000@c.us'
 * @param metadata about the image. Based on [sharp metadata](https://sharp.pixelplumbing.com/api-input#metadata)
 */
window.WAPI._sendSticker = async function (sticker, chatId, metadata) {
    var chat = Store.Chat.get(chatId)
        let stick = new window.Store.Sticker.modelClass();
		stick.__x_clientUrl = sticker.clientUrl;
		stick.__x_filehash = sticker.filehash;
		stick.__x_id = sticker.filehash;
		stick.__x_uploadhash = sticker.uploadhash;
		stick.__x_mediaKey = sticker.mediaKey;
		stick.__x_initialized = false;
		stick.__x_mediaData.mediaStage = 'INIT';
		stick.mimetype = 'image/webp';
		stick.height = (metadata && metadata.height) ?  metadata.height : 512;
		stick.width = (metadata && metadata.width) ?  metadata.width : 512;
		await stick.initialize();
		return await stick.sendToChat(chat);
};

window.WAPI.getFileHash = async (data) => {
	let buffer = await data.arrayBuffer();
	var sha = new jsSHA("SHA-256", "ARRAYBUFFER");
	sha.update(buffer);
	return sha.getHash("B64");
};

window.WAPI.generateMediaKey = async (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

/**
 * @param type: The type of file.  {'audio' | 'sticker' | 'video' | 'product' | 'document' | 'gif' | 'image' | 'ptt' | 'template' | 'history' | 'ppic'}
 * @param blob: file
 */
window.WAPI.encryptAndUploadFile = async function (type, blob) {	
    let filehash = await window.WAPI.getFileHash(blob);	
    let mediaKey = await window.WAPI.generateMediaKey(32);
    let controller = new AbortController();
    let signal = controller.signal;
    let encrypted = await window.Store.UploadUtils.encryptAndUpload({
        blob,
        type,
        signal,
        mediaKey
    });
    return {
        ...encrypted,
        clientUrl: encrypted.url,
        filehash,
        id: filehash,
        uploadhash: encrypted.encFilehash,
    };
};

/**
 * Send Image As Sticker
 * @param {*} imageBase64 A valid webp image is required.
 * @param {*} chatId '000000000000@c.us'
 * @param metadata about the image. Based on [sharp metadata](https://sharp.pixelplumbing.com/api-input#metadata)
 */
window.WAPI.sendImageAsSticker = async function (imageBase64,chatId, metadata) {
    let mediaBlob = await window.WAPI.base64ImageToFile(
        'data:image/webp;base64,'+imageBase64,
        'file.webp'
    );
    let encrypted = await window.WAPI.encryptAndUploadFile("sticker", mediaBlob);
    return await window.WAPI._sendSticker(encrypted, chatId, metadata);
};

/**
This will dump all possible stickers into the chat. ONLY FOR TESTING. THIS IS REALLY ANNOYING!!
 */
window.WAPI._STICKERDUMP = async function (chatId) {
    var chat = Store.Chat.get(chatId);
	let prIdx = await Store.StickerPack.pageWithIndex(0);
	await Store.StickerPack.fetchAt(0);        
	await Store.StickerPack._pageFetchPromises[prIdx];
    return await Promise.race(Store.StickerPack.models.forEach(pack=>pack.stickers.fetch().then(_=>pack.stickers.models.forEach(stkr => stkr.sendToChat(chat))))).catch(e=>{})
}

window.WAPI.postStatus = function(){return false;}
window.WAPI.deleteAllStatus = function(){return false;}
window.WAPI.getMyStatusArray = function(){return false;}
window.WAPI.deleteStatus = function(){return false;}
window.WAPI.setGroupToAdminsOnly = function(){return false;}

/**
 * This next line is jsSha
 */
'use strict';(function(I){function w(c,a,d){var l=0,b=[],g=0,f,n,k,e,h,q,y,p,m=!1,t=[],r=[],u,z=!1;d=d||{};f=d.encoding||"UTF8";u=d.numRounds||1;if(u!==parseInt(u,10)||1>u)throw Error("numRounds must a integer >= 1");if(0===c.lastIndexOf("SHA-",0))if(q=function(b,a){return A(b,a,c)},y=function(b,a,l,f){var g,e;if("SHA-224"===c||"SHA-256"===c)g=(a+65>>>9<<4)+15,e=16;else throw Error("Unexpected error in SHA-2 implementation");for(;b.length<=g;)b.push(0);b[a>>>5]|=128<<24-a%32;a=a+l;b[g]=a&4294967295;b[g-1]=a/4294967296|0;l=b.length;for(a=0;a<l;a+=e)f=A(b.slice(a,a+e),f,c);if("SHA-224"===c)b=[f[0],f[1],f[2],f[3],f[4],f[5],f[6]];else if("SHA-256"===c)b=f;else throw Error("Unexpected error in SHA-2 implementation");return b},p=function(b){return b.slice()},"SHA-224"===c)h=512,e=224;else if("SHA-256"===c)h=512,e=256;else throw Error("Chosen SHA variant is not supported");else throw Error("Chosen SHA variant is not supported");k=B(a,f);n=x(c);this.setHMACKey=function(b,a,g){var e;if(!0===m)throw Error("HMAC key already set");if(!0===z)throw Error("Cannot set HMAC key after calling update");f=(g||{}).encoding||"UTF8";a=B(a,f)(b);b=a.binLen;a=a.value;e=h>>>3;g=e/4-1;if(e<b/8){for(a=y(a,b,0,x(c));a.length<=g;)a.push(0);a[g]&=4294967040}else if(e>b/8){for(;a.length<=g;)a.push(0);a[g]&=4294967040}for(b=0;b<=g;b+=1)t[b]=a[b]^909522486,r[b]=a[b]^1549556828;n=q(t,n);l=h;m=!0};this.update=function(a){var c,f,e,d=0,p=h>>>5;c=k(a,b,g);a=c.binLen;f=c.value;c=a>>>5;for(e=0;e<c;e+=p)d+h<=a&&(n=q(f.slice(e,e+p),n),d+=h);l+=d;b=f.slice(d>>>5);g=a%h;z=!0};this.getHash=function(a,f){var d,h,k,q;if(!0===m)throw Error("Cannot call getHash after setting HMAC key");k=C(f);switch(a){case"HEX":d=function(a){return D(a,e,k)};break;case"B64":d=function(a){return E(a,e,k)};break;case"BYTES":d=function(a){return F(a,e)};break;case"ARRAYBUFFER":try{h=new ArrayBuffer(0)}catch(v){throw Error("ARRAYBUFFER not supported by this environment");}d=function(a){return G(a,e)};break;default:throw Error("format must be HEX, B64, BYTES, or ARRAYBUFFER");}q=y(b.slice(),g,l,p(n));for(h=1;h<u;h+=1)q=y(q,e,0,x(c));return d(q)};this.getHMAC=function(a,f){var d,k,t,u;if(!1===m)throw Error("Cannot call getHMAC without first setting HMAC key");t=C(f);switch(a){case"HEX":d=function(a){return D(a,e,t)};break;case"B64":d=function(a){return E(a,e,t)};break;case"BYTES":d=function(a){return F(a,e)};break;case"ARRAYBUFFER":try{d=new ArrayBuffer(0)}catch(v){throw Error("ARRAYBUFFER not supported by this environment");}d=function(a){return G(a,e)};break;default:throw Error("outputFormat must be HEX, B64, BYTES, or ARRAYBUFFER");}k=y(b.slice(),g,l,p(n));u=q(r,x(c));u=y(k,e,h,u);return d(u)}}function m(){}function D(c,a,d){var l="";a/=8;var b,g;for(b=0;b<a;b+=1)g=c[b>>>2]>>>8*(3+b%4*-1),l+="0123456789abcdef".charAt(g>>>4&15)+"0123456789abcdef".charAt(g&15);return d.outputUpper?l.toUpperCase():l}function E(c,a,d){var l="",b=a/8,g,f,n;for(g=0;g<b;g+=3)for(f=g+1<b?c[g+1>>>2]:0,n=g+2<b?c[g+2>>>2]:0,n=(c[g>>>2]>>>8*(3+g%4*-1)&255)<<16|(f>>>8*(3+(g+1)%4*-1)&255)<<8|n>>>8*(3+(g+2)%4*-1)&255,f=0;4>f;f+=1)8*g+6*f<=a?l+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(n>>>6*(3-f)&63):l+=d.b64Pad;return l}function F(c,a){var d="",l=a/8,b,g;for(b=0;b<l;b+=1)g=c[b>>>2]>>>8*(3+b%4*-1)&255,d+=String.fromCharCode(g);return d}function G(c,a){var d=a/8,l,b=new ArrayBuffer(d),g;g=new Uint8Array(b);for(l=0;l<d;l+=1)g[l]=c[l>>>2]>>>8*(3+l%4*-1)&255;return b}function C(c){var a={outputUpper:!1,b64Pad:"=",shakeLen:-1};c=c||{};a.outputUpper=c.outputUpper||!1;!0===c.hasOwnProperty("b64Pad")&&(a.b64Pad=c.b64Pad);if("boolean"!==typeof a.outputUpper)throw Error("Invalid outputUpper formatting option");if("string"!==typeof a.b64Pad)throw Error("Invalid b64Pad formatting option");return a}function B(c,a){var d;switch(a){case"UTF8":case"UTF16BE":case"UTF16LE":break;default:throw Error("encoding must be UTF8, UTF16BE, or UTF16LE");}switch(c){case"HEX":d=function(a,b,c){var f=a.length,d,k,e,h,q;if(0!==f%2)throw Error("String of HEX type must be in byte increments");b=b||[0];c=c||0;q=c>>>3;for(d=0;d<f;d+=2){k=parseInt(a.substr(d,2),16);if(isNaN(k))throw Error("String of HEX type contains invalid characters");h=(d>>>1)+q;for(e=h>>>2;b.length<=e;)b.push(0);b[e]|=k<<8*(3+h%4*-1)}return{value:b,binLen:4*f+c}};break;case"TEXT":d=function(c,b,d){var f,n,k=0,e,h,q,m,p,r;b=b||[0];d=d||0;q=d>>>3;if("UTF8"===a)for(r=3,e=0;e<c.length;e+=1)for(f=c.charCodeAt(e),n=[],128>f?n.push(f):2048>f?(n.push(192|f>>>6),n.push(128|f&63)):55296>f||57344<=f?n.push(224|f>>>12,128|f>>>6&63,128|f&63):(e+=1,f=65536+((f&1023)<<10|c.charCodeAt(e)&1023),n.push(240|f>>>18,128|f>>>12&63,128|f>>>6&63,128|f&63)),h=0;h<n.length;h+=1){p=k+q;for(m=p>>>2;b.length<=m;)b.push(0);b[m]|=n[h]<<8*(r+p%4*-1);k+=1}else if("UTF16BE"===a||"UTF16LE"===a)for(r=2,n="UTF16LE"===a&&!0||"UTF16LE"!==a&&!1,e=0;e<c.length;e+=1){f=c.charCodeAt(e);!0===n&&(h=f&255,f=h<<8|f>>>8);p=k+q;for(m=p>>>2;b.length<=m;)b.push(0);b[m]|=f<<8*(r+p%4*-1);k+=2}return{value:b,binLen:8*k+d}};break;case"B64":d=function(a,b,c){var f=0,d,k,e,h,q,m,p;if(-1===a.search(/^[a-zA-Z0-9=+\/]+$/))throw Error("Invalid character in base-64 string");k=a.indexOf("=");a=a.replace(/\=/g,"");if(-1!==k&&k<a.length)throw Error("Invalid '=' found in base-64 string");b=b||[0];c=c||0;m=c>>>3;for(k=0;k<a.length;k+=4){q=a.substr(k,4);for(e=h=0;e<q.length;e+=1)d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(q[e]),h|=d<<18-6*e;for(e=0;e<q.length-1;e+=1){p=f+m;for(d=p>>>2;b.length<=d;)b.push(0);b[d]|=(h>>>16-8*e&255)<<8*(3+p%4*-1);f+=1}}return{value:b,binLen:8*f+c}};break;case"BYTES":d=function(a,b,c){var d,n,k,e,h;b=b||[0];c=c||0;k=c>>>3;for(n=0;n<a.length;n+=1)d=a.charCodeAt(n),h=n+k,e=h>>>2,b.length<=e&&b.push(0),b[e]|=d<<8*(3+h%4*-1);return{value:b,binLen:8*a.length+c}};break;case"ARRAYBUFFER":try{d=new ArrayBuffer(0)}catch(l){throw Error("ARRAYBUFFER not supported by this environment");}d=function(a,b,c){var d,n,k,e,h;b=b||[0];c=c||0;n=c>>>3;h=new Uint8Array(a);for(d=0;d<a.byteLength;d+=1)e=d+n,k=e>>>2,b.length<=k&&b.push(0),b[k]|=h[d]<<8*(3+e%4*-1);return{value:b,binLen:8*a.byteLength+c}};break;default:throw Error("format must be HEX, TEXT, B64, BYTES, or ARRAYBUFFER");}return d}function r(c,a){return c>>>a|c<<32-a}function J(c,a,d){return c&a^~c&d}function K(c,a,d){return c&a^c&d^a&d}function L(c){return r(c,2)^r(c,13)^r(c,22)}function M(c){return r(c,6)^r(c,11)^r(c,25)}function N(c){return r(c,7)^r(c,18)^c>>>3}function O(c){return r(c,17)^r(c,19)^c>>>10}function P(c,a){var d=(c&65535)+(a&65535);return((c>>>16)+(a>>>16)+(d>>>16)&65535)<<16|d&65535}function Q(c,a,d,l){var b=(c&65535)+(a&65535)+(d&65535)+(l&65535);return((c>>>16)+(a>>>16)+(d>>>16)+(l>>>16)+(b>>>16)&65535)<<16|b&65535}function R(c,a,d,l,b){var g=(c&65535)+(a&65535)+(d&65535)+(l&65535)+(b&65535);return((c>>>16)+(a>>>16)+(d>>>16)+(l>>>16)+(b>>>16)+(g>>>16)&65535)<<16|g&65535}function x(c){var a=[],d;if(0===c.lastIndexOf("SHA-",0))switch(a=[3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428],d=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],c){case"SHA-224":break;case"SHA-256":a=d;break;case"SHA-384":a=[new m,new m,new m,new m,new m,new m,new m,new m];break;case"SHA-512":a=[new m,new m,new m,new m,new m,new m,new m,new m];break;default:throw Error("Unknown SHA variant");}else throw Error("No SHA variants supported");return a}function A(c,a,d){var l,b,g,f,n,k,e,h,m,r,p,w,t,x,u,z,A,B,C,D,E,F,v=[],G;if("SHA-224"===d||"SHA-256"===d)r=64,w=1,F=Number,t=P,x=Q,u=R,z=N,A=O,B=L,C=M,E=K,D=J,G=H;else throw Error("Unexpected error in SHA-2 implementation");d=a[0];l=a[1];b=a[2];g=a[3];f=a[4];n=a[5];k=a[6];e=a[7];for(p=0;p<r;p+=1)16>p?(m=p*w,h=c.length<=m?0:c[m],m=c.length<=m+1?0:c[m+1],v[p]=new F(h,m)):v[p]=x(A(v[p-2]),v[p-7],z(v[p-15]),v[p-16]),h=u(e,C(f),D(f,n,k),G[p],v[p]),m=t(B(d),E(d,l,b)),e=k,k=n,n=f,f=t(g,h),g=b,b=l,l=d,d=t(h,m);a[0]=t(d,a[0]);a[1]=t(l,a[1]);a[2]=t(b,a[2]);a[3]=t(g,a[3]);a[4]=t(f,a[4]);a[5]=t(n,a[5]);a[6]=t(k,a[6]);a[7]=t(e,a[7]);return a}var H;H=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];"function"===typeof define&&define.amd?define(function(){return w}):"undefined"!==typeof exports?("undefined"!==typeof module&&module.exports&&(module.exports=w),exports=w):I.jsSHA=w})(this);
