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
                { id: "bp", conditions: (module) => (module.default&&module.default.toString().includes('bp_unknown_version')) ? module.default : null },
                { id: "MsgKey", conditions: (module) => (module.default&&module.default.toString().includes('MsgKey error: obj is null/undefined')) ? module.default : null },
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
        formattedTitle: obj.formattedTitle,
        contact: obj['contact'] ? window.WAPI._serializeContactObj(obj['contact']) : null,
        groupMetadata: obj["groupMetadata"] ? window.WAPI._serializeRawObj(obj["groupMetadata"]) : null,
        presence: obj["presence"] ? window.WAPI._serializeRawObj(obj["presence"]) : null,
        msgs: null
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


window.WAPI.getAllContacts = function () {
    return window.Store.Contact.map((contact) => WAPI._serializeContactObj(contact));
};

/**
 * Fetches all contact objects from store, filters them
 *
 * @returns {Array|*} List of contacts
 */
window.WAPI.getMyContacts = function () {
    return window.Store.Contact.filter((contact) => contact.isMyContact === true).map((contact) => WAPI._serializeContactObj(contact));
};

/**
 * Fetches contact object from store by ID
 *
 * @param id ID of contact
 * @returns {T|*} Contact object
 */
window.WAPI.getContact = function (id) {
    const found = window.Store.Contact.get(id);
    return window.WAPI._serializeContactObj(found);
};

window.WAPI.syncContacts = function() {
    Store.Contact.sync()
    return true;
}

/**
 * Fetches all chat objects from store
 *
 * @returns {Array|*} List of chats
 */
window.WAPI.getAllChats = function () {
    return window.Store.Chat.map((chat) => WAPI._serializeChatObj(chat));
};

window.WAPI.haveNewMsg = function (chat) {
    return chat.unreadCount > 0;
};

window.WAPI.getAllChatsWithNewMsg = function () {
    return window.Store.Chat.filter(window.WAPI.haveNewMsg).map((chat) => WAPI._serializeChatObj(chat));
};

/**
 * Fetches all chat IDs from store
 *
 * @returns {Array|*} List of chat id's
 */
window.WAPI.getAllChatIds = function () {
    return window.Store.Chat.map((chat) => chat.id._serialized || chat.id);
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

window.WAPI.getAllChatsWithMessages = async function (onlyNew) {
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
 * @returns {Array|*} List of chats
 */
window.WAPI.getAllGroups = function () {
    return window.Store.Chat.filter((chat) => chat.isGroup);
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
 * @returns {T|*} Chat object
 */
window.WAPI.getChat = function (id) {
    id = typeof id == "string" ? id : id._serialized;
    const found = window.Store.Chat.get(id);
    if (found) found.sendMessage = (found.sendMessage) ? found.sendMessage : function () { return window.Store.sendMessage.apply(this, arguments); };
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

window.WAPI.getChatByName = function (name) {
    return window.Store.Chat.find((chat) => chat.name === name);
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

/**
 * Automatically sends a link with the auto generated link preview. You can also add a custom message to be added.
 * @param chatId 
 * @param url string A link, for example for youtube. e.g https://www.youtube.com/watch?v=61O-Galzc5M
 * @param text string Custom text as body of the message, this needs to include the link or it will be appended after the link.
 */
window.WAPI.sendLinkWithAutoPreview = async function (chatId, url, text) {
    var chatSend = WAPI.getChat(chatId);
    if (chatSend === undefined) {
        return false;
    }
    const linkPreview = await Store.WapQuery.queryLinkPreview(url);
    return (await chatSend.sendMessage(text.includes(url) ? text : `${url}\n${text}`, {linkPreview}))=='success'
}

window.WAPI.sendMessageWithThumb = function (thumb, url, title, description, text, chatId) {
    var chatSend = WAPI.getChat(chatId);
    if (chatSend === undefined) {
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

window.WAPI.getChatById = function (id) {
    let found = WAPI.getChat(id);
    if (found) {
        found = WAPI._serializeChatObj(found);
    } else {
        found = false;
    }
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
 * :returns: list of unread messages from asked chat
 * :rtype: object
 */
window.WAPI.getUnreadMessagesInChat = function (id, includeMe, includeNotifications) {
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
    // return result list
    return output;
};


/**
 * Load more messages in chat object from server. Use this in a while loop
 *
 * @param id ID of chat
 * @returns None
 */
window.WAPI.loadEarlierMessages = async function (id) {
    const chat = WAPI.getChat(id);
    if(chat){
        const someEarlierMessages = await chat.loadEarlierMsgs(); 
        if(someEarlierMessages) return someEarlierMessages.map(WAPI._serializeMessageObj);
    }
    return false;
};

/**
 * Load more messages in chat object from store by ID
 *
 * @param id ID of chat
 * @returns None
 */
window.WAPI.loadAllEarlierMessages = async function (id) {
    const found = WAPI.getChat(id);
    while (!found.msgs.msgLoadState.noEarlierMsgs) {
        console.log('loading more messages')
        await found.loadEarlierMsgs();
    }
    return true
};

window.WAPI.asyncLoadAllEarlierMessages = async function (id) {
    return await window.WAPI.loadAllEarlierMessages(id);
};

window.WAPI.areAllMessagesLoaded = function (id) {
    const found = WAPI.getChat(id);
    if (!found.msgs.msgLoadState.noEarlierMsgs) {
        return false
    }
    return true
};

/**
 * Load more messages in chat object from store by ID till a particular date
 *
 * @param id ID of chat
 * @param lastMessage UTC timestamp of last message to be loaded
 * @returns None
 */

window.WAPI.loadEarlierMessagesTillDate = async function (id, lastMessage) {
    const found = WAPI.getChat(id);
    x = async function () {
        if (found.msgs.models[0].t > lastMessage && !found.msgs.msgLoadState.noEarlierMsgs) {
            return await found.loadEarlierMsgs().then(x);
        } else {
            return true
        }
    };
    return await x();
};


/**
 * Fetches all group metadata objects from store
 *
 * @returns {Array|*} List of group metadata
 */
window.WAPI.getAllGroupMetadata = function () {
    return window.Store.GroupMetadata.map((groupData) => groupData.all);
};

/**
 * Fetches group metadata object from store by ID
 *
 * @param id ID of group
 * @returns {T|*} Group metadata object
 */
window.WAPI.getGroupMetadata = async function (id) {
    return window.Store.GroupMetadata.find(id);
};


/**
 * Fetches group participants
 *
 * @param id ID of group
 * @returns {Promise.<*>} Yields group metadata
 * @private
 */
window.WAPI._getGroupParticipants = async function (id) {
    return (await WAPI.getGroupMetadata(id)).participants;
};

/**
 * Fetches IDs of group participants
 *
 * @param id ID of group
 * @returns {Promise.<Array|*>} Yields list of IDs
 */
window.WAPI.getGroupParticipantIDs = async function (id) {
    return (await WAPI._getGroupParticipants(id))
        .map((participant) => participant.id);
};

window.WAPI.getGroupAdmins = async function (id) {
    return (await WAPI._getGroupParticipants(id))
        .filter((participant) => participant.isAdmin)
        .map((admin) => admin.id);
};

/**
 * Returns an object with all of your host device details
 */
window.WAPI.getMe = function(){
    return Store.Me.attributes;
}

window.WAPI.isLoggedIn = function () {
    // Contact always exists when logged in
    const isLogged = window.Store.Contact && window.Store.Contact.checksum !== undefined;
    return isLogged;
};

window.WAPI.isConnected = function () {
    // Phone Disconnected icon appears when phone is disconnected from the tnternet
    const isConnected = document.querySelector('*[data-icon="alert-phone"]') !== null ? false : true;
    return isConnected;
};

//I dont think this will work for group chats.
window.WAPI.isChatOnline = async function (id) {
    return Store.Chat.get(id)?await Store.Chat.get(id).presence.subscribe().then(_=>Store.Chat.get(id).presence.attributes.isOnline):false;
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

window.WAPI.getAllMessagesInChat = function (id, includeMe, includeNotifications) {
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
    return WAPI.quickClean(output);
};

window.WAPI.loadAndGetAllMessagesInChat = function (id, includeMe, includeNotifications) {
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
        return output;
    })
};

window.WAPI.getAllMessageIdsInChat = function (id, includeMe, includeNotifications) {
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
    return output;
};

window.WAPI.getMessageById = function (id) {
    let result = false;
    try {
        let msg = window.Store.Msg.get(id);
        if (msg) {
            result = WAPI.processMessageObj(msg, true, true);
        }
    } catch (err) { }
        return result;
};

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


window.WAPI.sendMessage = async function (id, message) {
    if(id==='status@broadcast') return false;
    let chat = WAPI.getChat(id);
    if(!chat && !id.includes('g')) {
        var contact = WAPI.getContact(id)
        if(!contact) return false;
        await Store.Chat.find(contact.id)
        chat = WAPI.getChat(id);
    }
    if (chat !== undefined) {
            // return WAPI.sendMessageReturnId(chat,message).then(id=>{return id})
            return await chat.sendMessage(message).then(_=>chat.lastReceivedKey._serialized);
    } 
    return false;
    };

window.WAPI.sendMessage2 = function (id, message) {
    var chat = WAPI.getChat(id);
    if (chat !== undefined) {
        try {
                chat.sendMessage(message);
            return true;
        } catch (error) {
            return false;
        }
    }
    return false;
};

window.WAPI.sendSeen = async function (id) {
    var chat = window.WAPI.getChat(id);
    if (chat !== undefined) {
            await Store.SendSeen(chat, false);
            return true;
    }
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

window.WAPI.getUnreadMessages = function (includeMe, includeNotifications, use_unread_count) {
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
    return output;
};

window.WAPI.getGroupOwnerID = async function (id) {
    const output = (await WAPI.getGroupMetadata(id)).owner.id;
    return output;

};

window.WAPI.getCommonGroups = async function (id) {
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
    return output;
};

window.WAPI.getProfilePicFromServer = function (id) {
    return Store.WapQuery.profilePicFind(id).then(x => x.eurl);
}

window.WAPI.getProfilePicSmallFromId = async function (id) {
    return await window.Store.ProfilePicThumb.find(id).then(async d=> {
        if (d.img !== undefined) {
            return await window.WAPI.downloadFileWithCredentials(d.img);
        } else {
            return false
        }
    }, function (e) {
        return false
    })
};

window.WAPI.getProfilePicFromId = async function (id) {
    return await window.Store.ProfilePicThumb.find(id).then(async d => {
        if (d.imgFull !== undefined) {
            return await window.WAPI.downloadFileWithCredentials(d.imgFull);
        } else {
            return false
        }
    }, function (e) {
        return false
    })
};

window.WAPI.downloadFileWithCredentials = async function (url) {
    return await new Promise((resolve,reject) => {
        let xhr = new XMLHttpRequest();
        xhr.onload = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    let reader = new FileReader();
                    reader.readAsDataURL(xhr.response);
                    reader.onload = function (e) {
                        resolve(reader.result.substr(reader.result.indexOf(',') + 1));
                    };
                } else {
                    console.error(xhr.statusText);
                }
            } else {
                console.log(err);
                resolve(false);
            }
        };
        xhr.open("GET", url, true);
        xhr.withCredentials = true;
        xhr.responseType = 'blob';
        xhr.send(null);
    })
};


window.WAPI.downloadFile = async function (url) {
    return await new Promise((resolve,reject) => {
    let xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                let reader = new FileReader();
                reader.readAsDataURL(xhr.response);
                reader.onload = function (e) {
                    resolve(reader.result.substr(reader.result.indexOf(',') + 1))
                };
            } else {
                console.error(xhr.statusText);
            }
        } else {
            console.log(err);
            resolve(false);
        }
    };

    xhr.open("GET", url, true);
    xhr.responseType = 'blob';
    xhr.send(null);
})
};

window.WAPI.getBatteryLevel = function () {
    return Store.Conn.battery;
};

window.WAPI.getIsPlugged = function () {
    return Store.Conn.plugged;
};

window.WAPI.deleteConversation = async function (chatId) {
    let userId = new window.Store.UserConstructor(chatId, { intentionallyUsePrivateConstructor: true });
    let conversation = WAPI.getChat(userId);
    if (!conversation) {
        return false;
    }
    return await window.Store.sendDelete(conversation, false).then(() => {
        return true;
    }).catch(() => {
        return false;
    });
};

window.WAPI.smartDeleteMessages = async function (chatId, messageArray, onlyLocal) {
    var userId = new Store.WidFactory.createWid(chatId);
    let conversation = WAPI.getChat(userId);
    if (!conversation) return false;

    if (!Array.isArray(messageArray)) {
        messageArray = [messageArray];
    }

    let messagesToDelete = messageArray.map(msgId => (typeof msgId == 'string')?window.Store.Msg.get(msgId):msgId).filter(x=>x);
    if(messagesToDelete.length==0) return true;
    let jobs = onlyLocal ? [conversation.sendDeleteMsgs(messagesToDelete,conversation)] :[
        conversation.sendRevokeMsgs(messagesToDelete.filter(msg=>msg.isSentByMe),conversation),
        conversation.sendDeleteMsgs(messagesToDelete.filter(msg=>!msg.isSentByMe),conversation)
    ]
    return Promise.all(jobs).then(_=>true)
};

window.WAPI.deleteMessage = async function (chatId, messageArray, revoke = false) {
    let userId = new window.Store.UserConstructor(chatId, { intentionallyUsePrivateConstructor: true });
    let conversation = WAPI.getChat(userId);

    if (!conversation)return false;

    if (!Array.isArray(messageArray)) {
        messageArray = [messageArray];
    }

    let messagesToDelete = messageArray.map(msgId => window.Store.Msg.get(msgId));

    if (revoke) {
        conversation.sendRevokeMsgs(messagesToDelete, conversation);
    } else {
        conversation.sendDeleteMsgs(messagesToDelete, conversation);
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

window.WAPI.checkNumberStatus = async function (id) {
    try {
        const result = await window.Store.WapQuery.queryExist(id);
        if (result.jid === undefined) throw 404;
        const data = window.WAPI._serializeNumberStatusObj(result);
        if (data.status == 200) data.numberExists = true
        return data;
    } catch (e) {
            return window.WAPI._serializeNumberStatusObj({
                status: e,
                jid: id
            });
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
    if (newMessage && newMessage.isNewMsg && !newMessage.isSentByMe && !newMessage.isStatusV3) {
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
 * @param callback - function - Callback function to be called when a new message arrives.
 * @returns {boolean}
 */
window.WAPI.waitNewMessages = function (rmCallbackAfterUse = true, callback) {
    window.WAPI._newMessagesCallbacks.push({ callback, rmAfterUse: rmCallbackAfterUse });
    return true;
};


window.WAPI.addAllNewMessagesListener = callback => window.Store.Msg.on('add', (newMessage) => {
    if (newMessage && newMessage.isNewMsg) {
    if(!newMessage.clientUrl && (newMessage.mediaKeyTimestamp || newMessage.filehash)){
        const cb = (msg) => {
            if(msg.id._serialized === newMessage.id._serialized && msg.clientUrl) {
                callback(WAPI.processMessageObj(msg, true, false));
                Store.Msg.off('change:isUnsentMedia',cb);
            }
        };
        Store.Msg.on('change:isUnsentMedia',cb);
    } else {
        let message = window.WAPI.processMessageObj(newMessage, true, false);
        if (message) {
            callback(message)
        }
    }}
});

/**
 * Registers a callback to be called when a the acknowledgement state of the phone connection.
 * @param callback - function - Callback function to be called when the device state changes. this returns 'CONNECTED' or 'TIMEOUT'
 * @returns {boolean}
 */
window.WAPI.onStateChanged = function (callback) {
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
window.WAPI.onParticipantsChanged = function (groupId, callback) {
    const subtypeEvents = [
        "invite" , 
        "add" , 
        "remove" ,
        "leave" ,
        "promote" ,
        "demote"
    ];
    const events = [
        'change:isAdmin',
        'remove',
        'add'
    ]
    const chat = window.Store.Chat.get(groupId);
    chat.groupMetadata.participants.on('all', (eventName, eventData, extra) => {
        if(events.includes(eventName)) {
            let action = eventName;
            if(eventName=='change:isAdmin') {
                action = extra ? 'promote' : 'demote';
            }
        callback({
            by: undefined,
            action: action,
            who: eventData.id._serialized
        });
        }
    })
}

/**
 * Registers a callback to participant changes on a certain, specific group
 * @param groupId - string - The id of the group that you want to attach the callback to.
 * @param callback - function - Callback function to be called when a message acknowledgement changes. The callback returns 3 variables
 * @returns {boolean}
 */
var groupParticpiantsEvents = {};
window.WAPI._onParticipantsChanged = function (groupId, callback) {
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
                const { subtype, author, recipients } = previewMessage;
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
                        groupParticpiantsEvents[groupId][rec] = { subtype, author };
                        //fire the callback
                        // // previewMessage.from.toString()
                        // x removed y
                        // x added y
                        callback({
                            by: author.toString(),
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
    Store.Chat.on('change:previewMessage', async event => {
        if(event.isGroup && event.previewMessage && event.previewMessage.type=='gp2' && event.previewMessage.subtype =='add' && event.previewMessage.recipients && event.previewMessage.recipients.map(x=>x._serialized).includes(Store.Me.wid._serialized)) {
            const tdiff = (Date.now()-Store.Msg.get(event.previewMessage.id._serialized).t*1000)/1000;
            if(tdiff<10.0) {
                console.log('added', tdiff,'seconds ago')
                await WAPI.sendSeen(event.id);
                callback(WAPI._serializeChatObj(Store.Chat.get(event.id)));
            } else console.log('Not a new group add', event.id._serialized)
        }
    })
    return true;
}

/**
 * Reads buffered new messages.
 * @returns {Array}
 */
window.WAPI.getBufferedNewMessages = function () {
    let bufferedMessages = window.WAPI._newMessagesBuffer;
    window.WAPI._newMessagesBuffer = [];
    return bufferedMessages;
};
/** End new messages observable functions **/

/** Joins a group via the invite link, code, or message
 * @param link This param is the string which includes the invite link or code. The following work:
 * - Follow this link to join my WhatsApp group: https://chat.whatsapp.com/DHTGJUfFJAV9MxOpZO1fBZ
 * - https://chat.whatsapp.com/DHTGJUfFJAV9MxOpZO1fBZ
 * - DHTGJUfFJAV9MxOpZO1fBZ
 * @returns Promise<string | boolean> Either false if it didn't work, or the group id.
 */
window.WAPI.joinGroupViaLink = async function(link){
    let code = link;
    //is it a link? if not, assume it's a code, otherwise, process the link to get the code.
    if(link.includes('chat.whatsapp.com')) {
        if(!link.match(/chat.whatsapp.com\/([\w\d]*)/g).length) return false;
        code = link.match(/chat.whatsapp.com\/([\w\d]*)/g)[0].replace('chat.whatsapp.com\/','');
    }
    const group = await Store.GroupInvite.joinGroupViaInvite(code);
    if(!group.id) return false;
    return group.id._serialized
}

window.WAPI.sendImage = async function (imgBase64, chatid, filename, caption, quotedMsg, waitForKey) {
    const startSendImage = (Date.now()/1000)-1;
    let extras = {};
    if(quotedMsg){
        if (typeof quotedMsg !== "object") quotedMsg = Store.Msg.get(quotedMsg);
        extras = {
            quotedMsg,
            quotedParticipant: quotedMsg.author || quotedMsg.from,
            quotedStanzaID:quotedMsg.id.id
        };
    }
    return await Store.Chat.find(chatid).then(async (chat) => {
        var mediaBlob = window.WAPI.base64ImageToFile(imgBase64, filename);
        return await window.WAPI.procFiles(chat,mediaBlob).then(async mc => {
            var media = mc.models[0];
            await media.sendToChat(chat, { caption,...extras });
            return waitForKey ? await new Promise(async (resolve,reject) => {
                const cb = msg=>{
                    if(media.attributes.file.size === msg.size) resolve(msg.id._serialized);
                    Store.Msg.off('change:clientUrl',cb);
                };
                Store.Msg.on('change:clientUrl',cb);
            }) : true
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

/** Change the icon for the group chat
 * @param groupId 123123123123_1312313123@g.us The id of the group
 * @param imgData 'data:image/jpeg;base64,...` The base 64 data uri
 * @returns boolean true if it was set, false if it didn't work. It usually doesn't work if the image file is too big.
 */
window.WAPI.setGroupIcon = async function(groupId, imgData) {
    const {status} = await Store.WapQuery.sendSetPicture(groupId,imgData,imgData);
    return status==200;
}

/**
* Update your status
*   @param newStatus string new Status
*/
window.WAPI.setMyStatus = function (newStatus) {
    return Store.MyStatus.setMyStatus(newStatus)
}

window.WAPI.sendVideoAsGif = async function (imgBase64, chatid, filename, caption, quotedMsg) {
    let extras = {};
    if(quotedMsg){
        if (typeof quotedMsg !== "object") quotedMsg = Store.Msg.get(quotedMsg);
        extras = {
            quotedMsg,
            quotedParticipant: quotedMsg.author || quotedMsg.from,
            quotedStanzaID:quotedMsg.id.id
        };
    }
    // create new chat
    return await Store.Chat.find(chatid).then(async (chat) => {
        var mediaBlob = window.WAPI.base64ImageToFile(imgBase64, filename);
        var mc = new Store.MediaCollection(chat);
        return await window.WAPI.procFiles(chat,mediaBlob).then(async mc => {
            var media = mc.models[0];
            media.mediaPrep._mediaData.isGif = true;
            media.mediaPrep._mediaData.gifAttribution = 1;
            await media.mediaPrep.sendToChat(chat, { caption,...extras });
            return chat.lastReceivedKey._serialized;
        });
    });
}


/**
 * Find any product listings of the given number. Use this to query a catalog
 *
 * @param id id of buseinss profile (i.e the number with @c.us)
 * @returns None
 */
window.WAPI.getBusinessProfilesProducts = async function (id) {
    return await Store.Catalog.find(id).then(resp => {
        if (resp.msgProductCollection && resp.msgProductCollection._models.length)
        return resp.productCollection._models;
    }).catch(error => {
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
 * @returns 
 */
window.WAPI.sendImageWithProduct = async function (imgBase64, chatid, caption, bizNumber, productId) {
    return await Store.Catalog.findCarouselCatalog(bizNumber).then(async cat => {
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

            return Store.Chat.find(chatid).then(async (chat) => {
                var mediaBlob = window.WAPI.base64ImageToFile(imgBase64, filename);
                // var mc = new Store.MediaCollection(chat);
                // mc.processFiles([mediaBlob], chat, 1)
                return await window.WAPI.procFiles(chat,mediaBlob).then(async mc => {
                    var media = mc.models[0];
                    Object.entries(temp.productMsgOptions).map(([k, v]) => media.mediaPrep._mediaData[k] = v)
                    await media.mediaPrep.sendToChat(chat, temp);
                    return chat.lastReceivedKey._serialized;
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
 * Ghost forwarding is like a normal forward but as if it were sent from the host phone.
 */
window.WAPI.ghostForward = async function(chatId, messageId) {
    var chat = Store.Chat.get(chatId);
    if(!Store.Msg.get(messageId)) return false;
    var tempMsg = Object.create(Store.Msg.get(messageId));
    var newId = window.WAPI.getNewMessageId(chatId);
    var extend = {
        ...JSON.parse(JSON.stringify(tempMsg)),
        ack: 0,
        id: newId,
        local: !0,
        self: "out",
        t: parseInt(new Date().getTime() / 1000),
        to: new Store.WidFactory.createWid(chatId),
        from: Store.Me.wid,
        isNewMsg: true
    };
    Object.assign(tempMsg, extend);
    const res = await Promise.all(Store.addAndSendMsgToChat(chat, extend))
    return res[1]=='success';
}


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
    newMsgId.remote = new Store.WidFactory.createWid(chatId);
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
    if (on) Store.ChatStates.sendChatStateComposing(chatId)
    else Store.ChatStates.sendChatStatePaused(chatId)
    return true
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
    if(!chat) return false;
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

window.WAPI.reply = async function (chatId, body, quotedMsg) {
    if (typeof quotedMsg !== "object") quotedMsg = Store.Msg.get(quotedMsg)
    var chat = Store.Chat.get(chatId);
    if(!chat) return false;
        let extras = {};
        if(quotedMsg) {
            extras = {
                quotedParticipant: quotedMsg.author || quotedMsg.from,
                quotedStanzaID:quotedMsg.id.id
            };
        }
    var tempMsg = Object.create(Store.Msg.models.filter(msg => msg.__x_isSentByMe && !msg.quotedMsg)[0]);
    var newId = window.WAPI.getNewMessageId(chatId);
    var extend = {
        ack: 0,
        id: newId,
        local: !0,
        self: "out",
        t: parseInt(new Date().getTime() / 1000),
        to:  new Store.WidFactory.createWid(chatId),
        isNewMsg: !0,
        type: "chat",
        quotedMsg,
        body,
        ...extras
    };
    Object.assign(tempMsg, extend);
    const res = await Promise.all(await Store.addAndSendMsgToChat(chat, tempMsg));
    if(res[1]!='success') return false;
    return res[0].id._serialized
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
 */
window.WAPI.removeParticipant = async function (idGroup, idParticipant) {
    const chat = Store.Chat.get(idGroup);
    const rm = chat.groupMetadata.participants.get(idParticipant);
    await window.Store.Participants.removeParticipants(chat, [rm]);
    return true;
}


/**
 * Add participant to Group
 * @param {*} idGroup '0000000000-00000000@g.us'
 * @param {*} idParticipant '000000000000@c.us'
 */
window.WAPI.addParticipant = async function (idGroup, idParticipant) {
    const chat = Store.Chat.get(idGroup);
    const add = Store.Contact.get(idParticipant);
    await window.Store.Participants.addParticipants(chat, [add]);
    return true;
}

/**
 * Promote Participant to Admin in Group
 * @param {*} idGroup '0000000000-00000000@g.us'
 * @param {*} idParticipant '000000000000@c.us'
 */
window.WAPI.promoteParticipant = async function (idGroup, idParticipant) {
    const chat = Store.Chat.get(idGroup);
    const promote = chat.groupMetadata.participants.get(idParticipant);
    await window.Store.Participants.promoteParticipants(chat, [promote]);
    return true;
}

/**
 * Demote Admin of Group
 * @param {*} idGroup '0000000000-00000000@g.us'
 * @param {*} idParticipant '000000000000@c.us'
 */
window.WAPI.demoteParticipant = async function (idGroup, idParticipant) {
    await window.Store.WapQuery.demoteParticipants(idGroup, [idParticipant])
    const chat = Store.Chat.get(idGroup);
    const demote = chat.groupMetadata.participants.get(idParticipant);
    await window.Store.Participants.demoteParticipants(chat, [demote])
    return true
   
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


window.WAPI.getLastSeen = async function (id) {
    if(!Store.Chat.get(id)) return false;
    let {presence} = Store.Chat.get(id)
    await presence.subscribe();
    return presence.chatstate.t;
  }

window.WAPI.postStatus = function(){return false;}
window.WAPI.deleteAllStatus = function(){return false;}
window.WAPI.getMyStatusArray = function(){return false;}
window.WAPI.deleteStatus = function(){return false;}
window.WAPI.setGroupToAdminsOnly = function(){return false;}

window.WAPI.quickClean = function (ob) {return JSON.parse(JSON.stringify(ob))};

window.WAPI.pyFunc = async function (fn, done) {
    return done(await fn())
}