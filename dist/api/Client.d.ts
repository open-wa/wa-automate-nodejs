/// <reference types="node" />
import { Page } from 'puppeteer';
import { Chat, LiveLocationChangedEvent, ChatState, ChatMuteDuration } from './model/chat';
import { Contact } from './model/contact';
import { Message } from './model/message';
import { AxiosRequestConfig } from 'axios';
import { ParticipantChangedEventModel } from './model/group-metadata';
import { ConfigObject, STATE, LicenseType, Webhook } from './model';
import { SessionInfo } from './model/sessionInfo';
import { ChatId, GroupChatId, Content, Base64, MessageId, ContactId, DataURL, FilePath } from './model/aliases';
import { CustomProduct } from './model/product';
import { Mp4StickerConversionProcessOptions, StickerMetadata } from './model/media';
import { SimpleListener } from './model/events';
import { CollectorOptions } from '../structures/Collector';
import { MessageCollector } from '../structures/MessageCollector';
import { Listener } from 'eventemitter2';
export declare enum namespace {
    Chat = "Chat",
    Msg = "Msg",
    Contact = "Contact",
    GroupMetadata = "GroupMetadata"
}
export declare class Client {
    private _loadedModules;
    private _registeredWebhooks;
    private _registeredEvListeners;
    private _webhookQueue;
    private _createConfig;
    private _sessionInfo;
    private _listeners;
    private _page;
    private _currentlyBeingKilled;
    private _refreshing;
    private _l;
    /**
     * This is used to track if a listener is already used via webhook. Before, webhooks used to be set once per listener. Now a listener can be set via multiple webhooks, or revoked from a specific webhook.
     * For this reason, listeners assigned to a webhook are only set once and map through all possible webhooks to and fire only if the specific listener is assigned.
     *
     * Note: This would be much simpler if eventMode was the default (and only) listener strategy.
     */
    private _registeredWebhookListeners;
    /**
     * @ignore
     * @param page [Page] [Puppeteer Page]{@link https://pptr.dev/#?product=Puppeteer&version=v2.1.1&show=api-class-page} running WA Web
     */
    constructor(page: Page, createConfig: ConfigObject, sessionInfo: SessionInfo);
    /**
     * @private
     *
     * DO NOT USE THIS.
     *
     * Run all tasks to set up client AFTER init is fully completed
     */
    loaded(): Promise<void>;
    private registerAllSimpleListenersOnEv;
    getSessionId(): string;
    getPage(): Page;
    private _setOnClose;
    private _reInjectWapi;
    private _reRegisterListeners;
    /**
     * A convinience method to download the [[DataURL]] of a file
     * @param url The url
     * @param optionsOverride You can use this to override the [axios request config](https://github.com/axios/axios#request-config)
     * @returns Promise<DataURL>
     */
    download(url: string, optionsOverride?: any): Promise<DataURL>;
    /**
     * Grab the logger for this session/process
     */
    logger(): any;
    /**
     * Refreshes the page and reinjects all necessary files. This may be useful for when trying to save memory
     * This will attempt to re register all listeners EXCEPT onLiveLocation and onParticipantChanged
     */
    refresh(): Promise<boolean>;
    /**
     * Get the session info
     *
     * @returns SessionInfo
     */
    getSessionInfo(): SessionInfo;
    /**
     * Get the config which was used to set up the client. Sensitive details (like devTools username and password, and browserWSEndpoint) are scrubbed
     *
     * @returns SessionInfo
     */
    getConfig(): ConfigObject;
    private pup;
    /**
     * ////////////////////////  LISTENERS
     */
    /**
     *
     */
    private registerListener;
    /**
     * Listens to messages received
     *
     * @event
     * @fires Observable stream of messages
     */
    onMessage(fn: (message: Message) => void): Promise<Listener | boolean>;
    /**
    * Listens to all new messages
    *
    * @event
    * @param to callback
    * @fires [[Message]]
    */
    onAnyMessage(fn: (message: Message) => void): Promise<Listener | boolean>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Listens to when a message is deleted by a recipient or the host account
     * @event
     * @param fn callback
     * @fires [[Message]]
     */
    onMessageDeleted(fn: (message: Message) => void): Promise<Listener | boolean>;
    /**
     * Listens to when a chat is deleted by the host account
     * @event
     * @param fn callback
     * @fires [[Chat]]
     */
    onChatDeleted(fn: (chat: Chat) => void): Promise<Listener | boolean>;
    /**
     * Listens to battery changes
     *
     * @event
     * @param fn callback
     * @fires number
     */
    onBattery(fn: (battery: number) => void): Promise<Listener | boolean>;
    /**
     * Listens to when host device is plugged/unplugged
     * @event
     *
     * @param fn callback
     * @fires boolean true if plugged, false if unplugged
     */
    onPlugged(fn: (plugged: boolean) => void): Promise<Listener | boolean>;
    /**
     * Requires a Story License Key
     * Listens to when a contact posts a new story.
     * @event
     *
     * @param fn callback
     * @fires e.g
     *
     * ```javascript
     * {
     * from: '123456789@c.us'
     * id: 'false_132234234234234@status.broadcast'
     * }
     * ```
     */
    onStory(fn: (story: any) => void): Promise<Listener | boolean>;
    /**
     * Listens to changes in state
     *
     * @event
     * @fires STATE observable sream of states
     */
    onStateChanged(fn: (state: string) => void): Promise<Listener | boolean>;
    /**
     * Listens to new incoming calls
     * @event
     * @returns Observable stream of call request objects
     */
    onIncomingCall(fn: (call: any) => void): Promise<Listener | boolean>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Listens to chat state, including when a specific user is recording and typing within a group chat.
     *
     * @event
     *
     * Here is an example of the fired object:
     *
     * @fires ```javascript
     * {
     * "chat": "00000000000-1111111111@g.us", //the chat in which this state is occuring
     * "user": "22222222222@c.us", //the user that is causing this state
     * "state": "composing, //can also be 'available', 'unavailable', 'recording' or 'composing'
     * }
     * ```
     */
    onChatState(fn: (chatState: any) => void): Promise<Listener | boolean>;
    /**
     * Listens to messages acknowledgement Changes
     *
     * @param fn callback function that handles a [[Message]] as the first and only parameter.
     * @event
     * @returns `true` if the callback was registered
     */
    onAck(fn: (message: Message) => void): Promise<Listener | boolean>;
    /**
     * Listens to add and remove events on Groups on a global level. It is memory efficient and doesn't require a specific group id to listen to.
     *
     * @event
     * @param fn callback function that handles a [[ParticipantChangedEventModel]] as the first and only parameter.
     * @returns `true` if the callback was registered
     */
    onGlobalParticipantsChanged(fn: (participantChangedEvent: ParticipantChangedEventModel) => void): Promise<Listener | boolean>;
    /**
     * Fires callback with Chat object every time the host phone is added to a group.
     *
     * @event
     * @param fn callback function that handles a [[Chat]] (group chat) as the first and only parameter.
     * @returns `true` if the callback was registered
     */
    onAddedToGroup(fn: (chat: Chat) => any): Promise<Listener | boolean>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Fires callback with Chat object every time the host phone is removed to a group.
     *
     * @event
     * @param fn callback function that handles a [[Chat]] (group chat) as the first and only parameter.
     * @returns `true` if the callback was registered
     */
    onRemovedFromGroup(fn: (chat: Chat) => any): Promise<Listener | boolean>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Fires callback with the relevant chat id every time the user clicks on a chat. This will only work in headful mode.
     *
     * @event
     * @param fn callback function that handles a [[ChatId]] as the first and only parameter.
     * @returns `true` if the callback was registered
     */
    onChatOpened(fn: (chat: Chat) => any): Promise<Listener | boolean>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Fires callback with contact id when a new contact is added on the host phone.
     *
     * @event
     * @param fn callback function that handles a [[Chat]] as the first and only parameter.
     * @returns `true` if the callback was registered
     */
    onContactAdded(fn: (chat: Chat) => any): Promise<Listener | boolean>;
    /**
     * @event
     * Listens to add and remove events on Groups. This can no longer determine who commited the action and only reports the following events add, remove, promote, demote
     * @param to group id: xxxxx-yyyy@c.us
     * @param to callback
     * @returns Observable stream of participantChangedEvent
     */
    onParticipantsChanged(groupId: GroupChatId, fn: (participantChangedEvent: ParticipantChangedEventModel) => void, legacy?: boolean): Promise<Listener | boolean>;
    /**
     * @event Listens to live locations from a chat that already has valid live locations
     * @param chatId the chat from which you want to subscribes to live location updates
     * @param fn callback that takes in a LiveLocationChangedEvent
     * @returns boolean, if returns false then there were no valid live locations in the chat of chatId
     * @emits <LiveLocationChangedEvent> LiveLocationChangedEvent
     */
    onLiveLocation(chatId: ChatId, fn: (liveLocationChangedEvent: LiveLocationChangedEvent) => void): Promise<boolean>;
    /**
     * Set presence to available or unavailable.
     * @param available if true it will set your presence to 'online', false will set to unavailable (i.e no 'online' on recipients' phone);
     */
    setPresence(available: boolean): Promise<boolean | void>;
    /**
     * set your about me
     * @param newStatus String new profile status
     */
    setMyStatus(newStatus: string): Promise<boolean | void>;
    /**
     * Adds label from chat, message or contact. Only for business accounts.
     * @param label: either the id or the name of the label. id will be something simple like anhy nnumber from 1-10, name is the label of the label if that makes sense.
     * @param id The Chat, message or contact id to which you want to add a label
     */
    addLabel(label: string, chatId: ChatId): Promise<boolean>;
    /**
     * Removes label from chat, message or contact. Only for business accounts.
     * @param label: either the id or the name of the label. id will be something simple like anhy nnumber from 1-10, name is the label of the label if that makes sense.
     * @param id The Chat, message or contact id to which you want to add a label
     */
    removeLabel(label: string, chatId: ChatId): Promise<boolean>;
    /**
     * Get an array of chats that match the label parameter. For example, if you want to get an array of chat objects that have the label "New customer".
     *
     * This method is case insenstive and only works on business host accounts.
     *
     * @label The label name
     */
    getChatsByLabel(label: string): Promise<Chat[]>;
    /**
     * Send VCARD
     *
     * @param {string} chatId '000000000000@c.us'
     * @param {string} vcard vcard as a string
     * @param {string} contactName The display name for the contact. CANNOT BE NULL OTHERWISE IT WILL SEND SOME RANDOM CONTACT FROM YOUR ADDRESS BOOK.
     * @param {string} contactNumber If supplied, this will be injected into the vcard (VERSION 3 ONLY FROM VCARDJS) with the WA id to make it show up with the correct buttons on WA. The format of this param should be including country code, without any other formating. e.g:
     * `4477777777777`
     */
    sendVCard(chatId: ChatId, vcard: string, contactName: string, contactNumber?: string): Promise<boolean>;
    /**
     * Set your profile name
     *
     * Please note, this does not work on business accounts!
     *
     * @param newName String new name to set for your profile
     */
    setMyName(newName: string): Promise<boolean>;
    /**
     * Sets the chat state
     * @param {ChatState|0|1|2} chatState The state you want to set for the chat. Can be TYPING (0), RECRDING (1) or PAUSED (2).
     * @param {String} chatId
     */
    setChatState(chatState: ChatState, chatId: ChatId): Promise<boolean>;
    /**
     * Returns the connection state
     */
    getConnectionState(): Promise<STATE>;
    /**
     * Forces the session to update the connection state. This will take a few seconds to determine the 'correct' state.
     * @returns updated connection state
     */
    forceUpdateConnectionState(): Promise<STATE>;
    /**
     * Returns a list of contact with whom the host number has an existing chat who are also not contacts.
     */
    getChatWithNonContacts(): Promise<Contact[]>;
    /**
     * Shuts down the page and browser
     * @returns true
     */
    kill(): Promise<boolean>;
    /**
     * This is a convinient method to click the `Use Here` button in the WA web session.
     *
     * Use this when [[STATE]] is `CONFLICT`. You can read more about managing state here:
     *
     * [[Detecting Logouts]]
     */
    forceRefocus(): Promise<any>;
    /**
     * A list of participants in the chat who have their live location on. If the chat does not exist, or the chat does not have any contacts actively sharing their live locations, it will return false. If it's a chat with a single contact, there will be only 1 value in the array if the contact has their livelocation on.
     * Please note. This should only be called once every 30 or so seconds. This forces the phone to grab the latest live location data for the number. This can be used in conjunction with onLiveLocation (this will trigger onLiveLocation).
     * @param chatId string Id of the chat you want to force the phone to get the livelocation data for.
     * @returns Promise<LiveLocationChangedEvent []> | boolean
     */
    forceUpdateLiveLocation(chatId: ChatId): Promise<LiveLocationChangedEvent[] | boolean>;
    private link;
    /**
     * Sends a text message to given chat
     * If you need to send a message to new numbers please see [these instructions:](https://docs.openwa.dev/pages/The%20Client/licensed-features.html#sending-messages-to-non-contact-numbers)
     * @param to chat id: `xxxxx@c.us`
     * @param content text message
     */
    sendText(to: ChatId, content: Content): Promise<boolean | MessageId>;
    /**
     * Sends a text message to given chat that includes mentions.
     * In order to use this method correctly you will need to send the text like this:
     * "@4474747474747 how are you?"
     * Basically, add a @ symbol before the number of the contact you want to mention.
     *
     * Please note that the hideTag parameter only works with an Insider's License Key
     *
     * @param to chat id: `xxxxx@c.us`
     * @param content text message
     * @param hideTags Removes all tags within the message
     */
    sendTextWithMentions(to: ChatId, content: Content, hideTags?: boolean): Promise<boolean | MessageId>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Sends a reply to given chat that includes mentions, replying to the provided replyMessageId.
     * In order to use this method correctly you will need to send the text like this:
     * "@4474747474747 how are you?"
     * Basically, add a @ symbol before the number of the contact you want to mention.
     * @param to chat id: `xxxxx@c.us`
     * @param content text message
     * @param replyMessageId id of message to reply to
     */
    sendReplyWithMentions(to: ChatId, content: Content, replyMessageId: MessageId): Promise<boolean | MessageId>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Tags everyone in the group with a message
     *
     * @param groupId group chat id: `xxxxx@g.us`
     * @param content text message to add under all of the tags
     * @param hideTags Removes all tags within the message
     * @returns Promise<MessageId>
     */
    tagEveryone(groupId: GroupChatId, content: Content, hideTags?: boolean): Promise<boolean | MessageId>;
    /**
     * @deprecated Use [[sendLinkWithAutoPreview]] instead
     * Sends a link to a chat that includes a link preview.
     * @param thumb The base 64 data of the image you want to use as the thunbnail. This should be no more than 200x200px. Note: Dont need data url on this param
     * @param url The link you want to send
     * @param title The title of the link
     * @param description The long description of the link preview
     * @param text The text you want to inslude in the message section. THIS HAS TO INCLUDE THE URL otherwise the url will be prepended to the text automatically.
     * @param chatId The chat you want to send this message to.
     *
     */
    sendMessageWithThumb(thumb: string, url: string, title: string, description: string, text: Content, chatId: ChatId): Promise<MessageId | string | boolean>;
    /**
     * Sends a location message to given chat
     * @param to chat id: `xxxxx@c.us`
     * @param lat latitude: '51.5074'
     * @param lng longitude: '0.1278'
     * @param loc location text: 'LONDON!'
     */
    sendLocation(to: ChatId, lat: any, lng: any, loc: string): Promise<boolean | MessageId>;
    /**
     * Get the generated user agent, this is so you can send it to the decryption module.
     * @returns String useragent of wa-web session
     */
    getGeneratedUserAgent(userA?: string): Promise<string>;
    /**
     * Decrypts a media message.
     * @param message This can be the serialized [[MessageId]] or the whole [[Message]] object. It is advised to just use the serialized message ID.
     * @returns Promise<[[DataURL]]>
     */
    decryptMedia(message: Message | MessageId): Promise<DataURL>;
    /**
     * Sends a image to given chat, with caption or not, using base64
     * @param to chat id `xxxxx@c.us`
     * @param file DataURL data:image/xxx;base64,xxx or the RELATIVE (should start with `./` or `../`) path of the file you want to send. With the latest version, you can now set this to a normal URL (for example [GET] `https://file-examples-com.github.io/uploads/2017/10/file_example_JPG_2500kB.jpg`).
     * @param filename string xxxxx
     * @param caption string xxxxx
     * @param waitForKey boolean default: false set this to true if you want to wait for the id of the message. By default this is set to false as it will take a few seconds to retrieve to the key of the message and this waiting may not be desirable for the majority of users.
     * @param hideTags boolean default: false [INSIDERS] set this to try silent tag someone in the caption
     * @returns Promise <boolean | string> This will either return true or the id of the message. It will return true after 10 seconds even if waitForId is true
     */
    sendImage(to: ChatId, file: DataURL | FilePath, filename: string, caption: Content, quotedMsgId?: MessageId, waitForId?: boolean, ptt?: boolean, withoutPreview?: boolean, hideTags?: boolean): Promise<MessageId | boolean>;
    /**
     * Automatically sends a youtube link with the auto generated link preview. You can also add a custom message.
     * @param chatId
     * @param url string A youtube link.
     * @param text string Custom text as body of the message, this needs to include the link or it will be appended after the link.
     * @param thumbnail string Base64 of the jpeg/png which will be used to override the automatically generated thumbnail.
     */
    sendYoutubeLink(to: ChatId, url: string, text?: Content, thumbnail?: Base64): Promise<boolean | MessageId>;
    /**
     * Automatically sends a link with the auto generated link preview. You can also add a custom message.
     * @param chatId
     * @param url string A link.
     * @param text string Custom text as body of the message, this needs to include the link or it will be appended after the link.
     * @param thumbnail Base64 of the jpeg/png which will be used to override the automatically generated thumbnail.
     */
    sendLinkWithAutoPreview(to: ChatId, url: string, text?: Content, thumbnail?: Base64): Promise<boolean | MessageId>;
    /**
     *
     * Sends a reply to a given message. Please note, you need to have at least sent one normal message to a contact in order for this to work properly.
     *
     * @param to string chatid
     * @param content string reply text
     * @param quotedMsgId string the msg id to reply to.
     * @param sendSeen boolean If set to true, the chat will 'blue tick' all messages before sending the reply
     * @returns Promise<MessageId | false> false if didn't work, otherwise returns message id.
     */
    reply(to: ChatId, content: Content, quotedMsgId: MessageId, sendSeen?: boolean): Promise<boolean | MessageId>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Check if a recipient has read receipts on.
     *
     * This will only work if you have chats sent back and forth between you and the contact 1-1.
     *
     * @param contactId The Id of the contact with which you have an existing conversation with messages already.
     * @returns Promise<string | boolean> true or false or a string with an explaintaion of why it wasn't able to determine the read receipts.
     *
     */
    checkReadReceipts(contactId: ContactId): Promise<string | boolean>;
    /**
     * Sends a file to given chat, with caption or not, using base64. This is exactly the same as sendImage
     * @param to chat id `xxxxx@c.us`
     * @param file DataURL data:image/xxx;base64,xxx or the RELATIVE (should start with `./` or `../`) path of the file you want to send. With the latest version, you can now set this to a normal URL (for example [GET] `https://file-examples-com.github.io/uploads/2017/10/file_example_JPG_2500kB.jpg`).
     * @param filename string xxxxx
     * @param caption string xxxxx With an [INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program) you can also tag people in groups with `@[number]`. For example if you want to mention the user with the number `44771234567`, just add `@44771234567` in the caption.
     * @param quotedMsgId string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message
     * @param waitForId boolean default: false set this to true if you want to wait for the id of the message. By default this is set to false as it will take a few seconds to retrieve to the key of the message and this waiting may not be desirable for the majority of users.
     * @param ptt boolean default: false set this to true if you want to send the file as a push to talk file.
     * @param withoutPreview boolean default: false set this to true if you want to send the file without a preview (i.e as a file). This is useful for preventing auto downloads on recipient devices.
     * @param hideTags boolean default: false [INSIDERS] set this to try silent tag someone in the caption
     * @returns Promise <boolean | MessageId> This will either return true or the id of the message. It will return true after 10 seconds even if waitForId is true
     */
    sendFile(to: ChatId, file: DataURL | FilePath, filename: string, caption: Content, quotedMsgId?: MessageId, waitForId?: boolean, ptt?: boolean, withoutPreview?: boolean, hideTags?: boolean): Promise<MessageId | boolean>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Checks whether or not the group id provided is known to be unsafe by the contributors of the library.
     * @param groupChatId The group chat you want to deteremine is unsafe
     * @returns Promise <boolean | string> This will either return a boolean indiciating whether this group chat id is considered unsafe or an error message as a string
     */
    isGroupIdUnsafe(groupChatId: GroupChatId): Promise<string | boolean>;
    /**
     * Attempts to send a file as a voice note. Useful if you want to send an mp3 file.
     * @param to chat id `xxxxx@c.us`
     * @param base64 base64 data:image/xxx;base64,xxx or the path of the file you want to send.
     * @param quotedMsgId string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message
     * @returns Promise <boolean | string> This will either return true or the id of the message. It will return true after 10 seconds even if waitForId is true
     */
    sendPtt(to: ChatId, file: DataURL | FilePath, quotedMsgId: MessageId): Promise<MessageId>;
    /**
     * Alias for [[sendPtt]]
     */
    sendAudio(to: ChatId, file: DataURL | FilePath, quotedMsgId: MessageId): Promise<MessageId>;
    /**
     * Sends a video to given chat as a gif, with caption or not, using base64
     * @param to chat id `xxxxx@c.us`
     * @param file DataURL data:image/xxx;base64,xxx or the RELATIVE (should start with `./` or `../`) path of the file you want to send. With the latest version, you can now set this to a normal URL (for example [GET] `https://file-examples-com.github.io/uploads/2017/10/file_example_JPG_2500kB.jpg`).
     * @param filename string xxxxx
     * @param caption string xxxxx
     * @param quotedMsgId string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message
     * @param requestConfig {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
     */
    sendVideoAsGif(to: ChatId, file: DataURL | FilePath, filename: string, caption: Content, quotedMsgId?: MessageId, requestConfig?: AxiosRequestConfig): Promise<MessageId>;
    /**
     * Sends a video to given chat as a gif by using a giphy link, with caption or not, using base64
     * @param to chat id `xxxxx@c.us`
     * @param giphyMediaUrl string https://media.giphy.com/media/oYtVHSxngR3lC/giphy.gif => https://i.giphy.com/media/oYtVHSxngR3lC/200w.mp4
     * @param caption string xxxxx
     */
    sendGiphy(to: ChatId, giphyMediaUrl: string, caption: Content): Promise<MessageId>;
    /**
     * Sends a file by Url or custom options
     * @param to chat id `xxxxx@c.us`
     * @param url string https://i.giphy.com/media/oYtVHSxngR3lC/200w.mp4
     * @param filename string 'video.mp4'
     * @param caption string xxxxx
     * @param quotedMsgId string true_0000000000@c.us_JHB2HB23HJ4B234HJB to send as a reply to a message
     * @param requestConfig {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
     * @param waitForId boolean default: false set this to true if you want to wait for the id of the message. By default this is set to false as it will take a few seconds to retrieve to the key of the message and this waiting may not be desirable for the majority of users.
     * @param ptt boolean default: false set this to true if you want to send the file as a push to talk file.
     * @param withoutPreview boolean default: false set this to true if you want to send the file without a preview (i.e as a file). This is useful for preventing auto downloads on recipient devices.
     */
    sendFileFromUrl(to: ChatId, url: string, filename: string, caption: Content, quotedMsgId?: MessageId, requestConfig?: AxiosRequestConfig, waitForId?: boolean, ptt?: boolean, withoutPreview?: boolean, hideTags?: boolean): Promise<MessageId | boolean>;
    /**
     * Returns an object with all of your host device details
     */
    getMe(): Promise<any>;
    /**
     * Returns a PNG DataURL screenshot of the session
     * @returns Promise<DataURL>
     */
    getSnapshot(): Promise<DataURL>;
    /**
     * Returns an array of group ids where the host device is admin
     */
    iAmAdmin(): Promise<GroupChatId[]>;
    /**
     * Syncs contacts with phone. This promise does not resolve so it will instantly return true.
     */
    syncContacts(): Promise<boolean>;
    /**
     * Easily get the amount of messages loaded up in the session. This will allow you to determine when to clear chats/cache.
     */
    getAmountOfLoadedMessages(): Promise<number>;
    /**
     * Find any product listings of the given number. Use this to query a catalog
     *
     * @param id id of buseinss profile (i.e the number with @c.us)
     * @returns None
     */
    getBusinessProfilesProducts(id: ContactId): Promise<any>;
    /**
     * Sends product with image to chat
     * @param imgBase64 Base64 image data
     * @param chatid string the id of the chat that you want to send this product to
     * @param caption string the caption you want to add to this message
     * @param bizNumber string the @c.us number of the business account from which you want to grab the product
     * @param productId string the id of the product within the main catalog of the aforementioned business
     * @returns
     */
    sendImageWithProduct(to: ChatId, image: Base64, caption: Content, bizNumber: ContactId, productId: string): Promise<boolean | MessageId>;
    /**
     * Feature Currently only available with Premium License accounts.
     *
     * Send a custom product to a chat. Please see [[CustomProduct]] for details.
     *
     * Caveats:
     * - URL will not work (unable to click), you will have to send another message with the URL.
     * - Recipient will see a thin banner under picture that says "Something went wrong"
     * - This will only work if you have at least 1 product already in your catalog
     * - Only works on Business accounts
     */
    sendCustomProduct(to: ChatId, image: DataURL, productData: CustomProduct): Promise<MessageId | boolean>;
    /**
     * Sends contact card to given chat id. You can use this to send multiple contacts but they will show up as multiple single-contact messages.
     * @param {string} to 'xxxx@c.us'
     * @param {string|array} contact 'xxxx@c.us' | ['xxxx@c.us', 'yyyy@c.us', ...]
     */
    sendContact(to: ChatId, contactId: ContactId | ContactId[]): Promise<MessageId | boolean>;
    /**
     *
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Sends multiple contacts as a single message
     *
     * @param  to 'xxxx@c.us'
     * @param contact ['xxxx@c.us', 'yyyy@c.us', ...]
     */
    sendMultipleContacts(to: ChatId, contactIds: ContactId[]): Promise<MessageId | boolean>;
    /**
     * Simulate '...typing' in chat
     * @param {string} to 'xxxx@c.us'
     * @param {boolean} on turn on similated typing, false to turn it off you need to manually turn this off.
     */
    simulateTyping(to: ChatId, on: boolean): Promise<boolean>;
    /**
     * @param id The id of the conversation
     * @param archive boolean true => archive, false => unarchive
     * @return boolean true: worked, false: didnt work (probably already in desired state)
     */
    archiveChat(id: ChatId, archive: boolean): Promise<boolean>;
    /**
     *
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Mutes a conversation for a given duration. If already muted, this will update the muted duration. Mute durations are relative from when the method is called.
     * @param chatId The id of the conversation you want to mute
     * @param muteDuration ChatMuteDuration enum of the time you want this chat to be muted for.
     * @return boolean true: worked or error code or message
     */
    muteChat(chatId: ChatId, muteDuration: ChatMuteDuration): Promise<boolean | string | number>;
    /**
     * Checks if a chat is muted
     * @param chatId The id of the chat you want to check
     * @returns boolean. `false` if the chat does not exist.
     */
    isChatMuted(chatId: ChatId): Promise<boolean>;
    /**
     *
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Unmutes a conversation.
     * @param id The id of the conversation you want to mute
     * @return boolean true: worked or error code or message
     */
    unmuteChat(chatId: ChatId): Promise<boolean | string | number>;
    /**
     * Forward an array of messages to a specific chat using the message ids or Objects
     *
     * @param to '000000000000@c.us'
     * @param messages this can be any mixture of message ids or message objects
     * @param skipMyMessages This indicates whether or not to skip your own messages from the array
     */
    forwardMessages(to: ChatId, messages: MessageId | MessageId[], skipMyMessages: boolean): Promise<boolean | string>;
    /**
     * Ghost forwarding is like a normal forward but as if it were sent from the host phone [i.e it doesn't show up as forwarded.]
     * Any potential abuse of this method will see it become paywalled.
     * @param to: Chat id to forward the message to
     * @param messageId: message id of the message to forward. Please note that if it is not loaded, this will return false - even if it exists.
     * @returns Promise<boolean>
     */
    ghostForward(to: ChatId, messageId: MessageId): Promise<boolean>;
    /**
     * Retrieves all contacts
     * @returns array of [Contact]
     */
    getAllContacts(): Promise<Contact[]>;
    getWAVersion(): Promise<string>;
    /**
     * Retrieves if the phone is online. Please note that this may not be real time.
     * @returns Boolean
     */
    isConnected(): Promise<boolean>;
    /**
     * Retrieves Battery Level
     * @returns Number
     */
    getBatteryLevel(): Promise<number>;
    /**
     * Retrieves whether or not phone is plugged in (i.e on charge)
     * @returns Number
     */
    getIsPlugged(): Promise<boolean>;
    /**
     * Retrieves the host device number. Use this number when registering for a license key
     * @returns Number
     */
    getHostNumber(): Promise<string>;
    /**
     * Returns the the type of license key used by the session.
     * @returns
     */
    getLicenseType(): Promise<LicenseType | false>;
    /**
     * Retrieves all chats
     * @returns array of [Chat]
     */
    getAllChats(withNewMessageOnly?: boolean): Promise<Chat[]>;
    /**
     * retrieves all Chat Ids
     * @returns array of [ChatId]
     */
    getAllChatIds(): Promise<ChatId[]>;
    /**
     * retrieves an array of IDs of accounts blocked by the host account.
     * @returns Promise<ChatId[]>
     */
    getBlockedIds(): Promise<ChatId[]>;
    /**
     * @deprecated
     *
     * Retrieves all chats with messages
     *
     * Please use `getAllUnreadMessages` instead of this to see all messages indicated by the green dots in the chat.
     *
     * @returns array of [Chat]
     */
    getAllChatsWithMessages(withNewMessageOnly?: boolean): Promise<Chat[]>;
    /**
     * Retrieve all groups
     * @returns array of groups
     */
    getAllGroups(withNewMessagesOnly?: boolean): Promise<Chat[]>;
    /**
     * Retrieves group members as [Id] objects
     * @param groupId group id
     */
    getGroupMembersId(groupId: GroupChatId): Promise<ContactId[]>;
    /**
     * Returns the title and description of a given group id.
     * @param groupId group id
     */
    getGroupInfo(groupId: GroupChatId): Promise<any>;
    /** Joins a group via the invite link, code, or message
     * @param link This param is the string which includes the invite link or code. The following work:
     * - Follow this link to join my WA group: https://chat.whatsapp.com/DHTGJUfFJAV9MxOpZO1fBZ
     * - https://chat.whatsapp.com/DHTGJUfFJAV9MxOpZO1fBZ
     * - DHTGJUfFJAV9MxOpZO1fBZ
     *
     * If you have been removed from the group previously, it will return `401`
     *
     * @returns Promise<string | boolean | number> Either false if it didn't work, or the group id.
     */
    joinGroupViaLink(link: string): Promise<string | boolean | number>;
    /**
     * Block contact
     * @param {string} id '000000000000@c.us'
     */
    contactBlock(id: ContactId): Promise<boolean>;
    /**
     * Report a contact for spam, block them and attempt to clear chat.
     *
     * [This is a restricted feature and requires a restricted key.](https://gum.co/open-wa?tier=1%20Restricted%20License%20Key)
     *
     * @param {string} id '000000000000@c.us'
     */
    reportSpam(id: ContactId | ChatId): Promise<boolean>;
    /**
     * Unblock contact
     * @param {string} id '000000000000@c.us'
     */
    contactUnblock(id: ContactId): Promise<boolean>;
    /**
     * Removes the host device from the group
     * @param groupId group id
     */
    leaveGroup(groupId: GroupChatId): Promise<boolean>;
    /**
     * Extracts vcards from a message.This works on messages of typ `vcard` or `multi_vcard`
     * @param msgId string id of the message to extract the vcards from
     * @returns [vcard]
     * ```
     * [
     * {
     * displayName:"Contact name",
     * vcard: "loong vcard string"
     * }
     * ]
     * ```
     * or false if no valid vcards found.
     *
     * Please use [vcf](https://www.npmjs.com/package/vcf) to convert a vcard string into a json object
     */
    getVCards(msgId: MessageId): Promise<string[]>;
    /**
     * Returns group members [Contact] objects
     * @param groupId
     */
    getGroupMembers(groupId: GroupChatId): Promise<Contact[]>;
    /**
     * Retrieves contact detail object of given contact id
     * @param contactId
     * @returns contact detial as promise
     */
    getContact(contactId: ContactId): Promise<Contact>;
    /**
     * Retrieves chat object of given contact id
     * @param contactId
     * @returns contact detial as promise
     */
    getChatById(contactId: ContactId): Promise<Chat>;
    /**
     * Retrieves message object of given message id
     * @param messageId
     * @returns message object
     */
    getMessageById(messageId: MessageId): Promise<Message>;
    /**
     * Retrieves the last message sent by the host account in any given chat or globally.
     * @param chatId This is optional. If no chat Id is set then the last message sent by the host account will be returned.
     * @returns message object
     */
    getMyLastMessage(chatId?: ChatId): Promise<Message>;
    /**
     *
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Retrieves a message object which results in a valid sticker instead of a blank one. This also works with animated stickers.
     *
     * If you run this without a valid insiders key, it will return false and cause an error upon decryption.
     *
     * @param messageId The message ID `message.id`
     * @returns message object OR `false`
     */
    getStickerDecryptable(messageId: MessageId): Promise<Message | boolean>;
    /**
     *
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * If a file is old enough, it will 404 if you try to decrypt it. This will allow you to force the host account to re upload the file and return a decryptable message.
     *
     * if you run this without a valid insiders key, it will return false and cause an error upon decryption.
     *
     * @param messageId
     * @returns [[Message]] OR `false`
     */
    forceStaleMediaUpdate(messageId: MessageId): Promise<Message | false>;
    /**
     * Retrieves chat object of given contact id
     * @param contactId
     * @returns contact detial as promise
     */
    getChat(contactId: ContactId): Promise<Chat>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Retrieves the groups that you have in common with a contact
     * @param contactId
     * @returns Promise returning an array of common groups {
     * id:string,
     * title:string
     * }
     */
    getCommonGroups(contactId: ContactId): Promise<{
        id: string;
        title: string;
    }[]>;
    /**
     * Retrieves the epoch timestamp of the time the contact was last seen. This will not work if:
     * 1. They have set it so you cannot see their last seen via privacy settings.
     * 2. You do not have an existing chat with the contact.
     * 3. The chatId is for a group
     * In both of those instances this method will return undefined.
     * @param chatId The id of the chat.
     * @returns number timestamp when chat was last online or undefined.
     */
    getLastSeen(chatId: ChatId): Promise<number | boolean>;
    /**
     * Retrieves chat picture
     * @param chatId
     * @returns Url of the chat picture or undefined if there is no picture for the chat.
     */
    getProfilePicFromServer(chatId: ChatId): Promise<string>;
    /**
     * Sets a chat status to seen. Marks all messages as ack: 3
     * @param chatId chat id: `xxxxx@c.us`
     */
    sendSeen(chatId: ChatId): Promise<boolean>;
    /**
     * Sets a chat status to unread. May be useful to get host's attention
     * @param chatId chat id: `xxxxx@c.us`
     */
    markAsUnread(chatId: ChatId): Promise<boolean>;
    /**
     * Checks if a chat contact is online. Not entirely sure if this works with groups.
     *
     * It will return `true` if the chat is `online`, `false` if the chat is `offline`, `PRIVATE` if the privacy settings of the contact do not allow you to see their status and `NO_CHAT` if you do not currently have a chat with that contact.
     *
     * @param chatId chat id: `xxxxx@c.us`
     */
    isChatOnline(chatId: ChatId): Promise<boolean | string>;
    /**
      * Load more messages in chat object from server. Use this in a while loop. This should return up to 50 messages at a time
     * @param contactId
     * @returns Message []
     */
    loadEarlierMessages(contactId: ContactId): Promise<Message[]>;
    /**
     * Get the status of a contact
     * @param contactId {string} to '000000000000@c.us'
     * returns: {id: string,status: string}
     */
    getStatus(contactId: ContactId): Promise<{
        id: string;
        status: string;
    }>;
    /**
      * Load all messages in chat object from server.
     * @param contactId
     * @returns contact detial as promise
     */
    loadAllEarlierMessages(contactId: ContactId): Promise<Message>;
    /**
      * Delete the conversation from your WA
     * @param chatId
     * @returns boolean
     */
    deleteChat(chatId: ChatId): Promise<boolean>;
    /**
      * Delete all messages from the chat.
     * @param chatId
     * @returns boolean
     */
    clearChat(chatId: ChatId): Promise<boolean>;
    /**
      * Retrieves an invite link for a group chat. returns false if chat is not a group.
     * @param chatId
     * @returns Promise<string>
     */
    getGroupInviteLink(chatId: ChatId): Promise<string>;
    /**
      * Get the details of a group through the invite link
     * @param link This can be an invite link or invite code
     * @returns
     */
    inviteInfo(link: string): Promise<any>;
    /**
      * Revokes the current invite link for a group chat. Any previous links will stop working
     * @param chatId
     * @returns Promise<boolean>
     */
    revokeGroupInviteLink(chatId: ChatId): Promise<boolean | string>;
    /**
     * Deletes message of given message id
     * @param chatId The chat id from which to delete the message.
     * @param messageId The specific message id of the message to be deleted
     * @param onlyLocal If it should only delete locally (message remains on the other recipienct's phone). Defaults to false.
     * @returns nothing
     */
    deleteMessage(chatId: ChatId, messageId: MessageId[] | MessageId, onlyLocal?: boolean): Promise<void>;
    /**
     * Checks if a number is a valid WA number
     * @param contactId, you need to include the @c.us at the end.
     * @returns contact detial as promise
     */
    checkNumberStatus(contactId: ContactId): Promise<Contact>;
    /**
     * Retrieves all undread Messages
     * @param includeMe
     * @param includeNotifications
     * @param use_unread_count
     * @returns any
     */
    getUnreadMessages(includeMe: boolean, includeNotifications: boolean, use_unread_count: boolean): Promise<Message[]>;
    /**
     * Retrieves all new Messages. where isNewMsg==true
     * @returns list of messages
     */
    getAllNewMessages(): Promise<Message[]>;
    /**
     * Retrieves all unread Messages. where ack==-1
     * @returns list of messages
     */
    getAllUnreadMessages(): Promise<Message[]>;
    /**
     * Retrieves all unread Messages as indicated by the red dots in WA web. This returns an array of objects and are structured like so:
     * ```javascript
     * [{
     * "id": "000000000000@g.us", //the id of the chat
     * "indicatedNewMessages": [] //array of messages, not including any messages by the host phone
     * }]
     * ```
     * @returns list of messages
     */
    getIndicatedNewMessages(): Promise<Message[]>;
    /**
     * Retrieves all Messages in a chat that have been loaded within the WA web instance.
     *
     * This does not load every single message in the chat history.
     *
     * @param chatId, the chat to get the messages from
     * @param includeMe, include my own messages? boolean
     * @param includeNotifications
     * @returns Message[]
     */
    getAllMessagesInChat(chatId: ChatId, includeMe: boolean, includeNotifications: boolean): Promise<Message[]>;
    /**
     * loads and Retrieves all Messages in a chat
     * @param chatId, the chat to get the messages from
     * @param includeMe, include my own messages? boolean
     * @param includeNotifications
     * @returns any
     */
    loadAndGetAllMessagesInChat(chatId: ChatId, includeMe: boolean, includeNotifications: boolean): Promise<Message[]>;
    /**
     * Create a group and add contacts to it
     *
     * @param to group name: 'New group'
     * @param contacts: A single contact id or an array of contact ids.
     * @returns Promise<GroupCreationResponse> :
     * ```javascript
     * {
     *   status: 200,
     *   gid: {
     *     server: 'g.us',
     *     user: '447777777777-1583678870',
     *     _serialized: '447777777777-1583678870@g.us'
     *   },
     *   participants: [
     *     { '447777777777@c.us': [Object] },
     *     { '447444444444@c.us': [Object] }
     *   ]
     * }
     * ```
     */
    createGroup(groupName: string, contacts: ContactId | ContactId[]): Promise<any>;
    /**
     * Remove participant of Group
     *
     * If not a group chat, returns `NOT_A_GROUP_CHAT`.
     *
     * If the chat does not exist, returns `GROUP_DOES_NOT_EXIST`
     *
     * If the participantId does not exist in the group chat, returns `NOT_A_PARTICIPANT`
     *
     * @param {*} groupId `0000000000-00000000@g.us`
     * @param {*} participantId `000000000000@c.us`
     */
    removeParticipant(groupId: GroupChatId, participantId: ContactId): Promise<boolean>;
    /** Change the icon for the group chat
     * @param groupId 123123123123_1312313123@g.us The id of the group
     * @param imgData 'data:image/jpeg;base64,...` The base 64 data url. Make sure this is a small img (128x128), otherwise it will fail.
     * @returns boolean true if it was set, false if it didn't work. It usually doesn't work if the image file is too big.
     */
    setGroupIcon(groupId: GroupChatId, image: DataURL): Promise<boolean>;
    /** Change the icon for the group chat
     * @param groupId 123123123123_1312313123@g.us The id of the group
     * @param url'https://upload.wikimedia.org/wikipedia/commons/3/38/JPEG_example_JPG_RIP_001.jpg' The url of the image. Make sure this is a small img (128x128), otherwise it will fail.
     * @param requestConfig {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
     * @returns boolean true if it was set, false if it didn't work. It usually doesn't work if the image file is too big.
     */
    setGroupIconByUrl(groupId: GroupChatId, url: string, requestConfig?: AxiosRequestConfig): Promise<boolean>;
    /**
    * Add participant to Group
    *
    * If not a group chat, returns `NOT_A_GROUP_CHAT`.
    *
    * If the chat does not exist, returns `GROUP_DOES_NOT_EXIST`
    *
    * If the participantId does not exist in the contacts, returns `NOT_A_CONTACT`
    *
    * @param {*} groupId '0000000000-00000000@g.us'
    * @param {*} participantId '000000000000@c.us'
    *
    */
    addParticipant(groupId: GroupChatId, participantId: ContactId | ContactId[]): Promise<boolean>;
    /**
    * Promote Participant to Admin in Group
    *
    *
    * If not a group chat, returns `NOT_A_GROUP_CHAT`.
    *
    * If the chat does not exist, returns `GROUP_DOES_NOT_EXIST`
    *
    * If the participantId does not exist in the group chat, returns `NOT_A_PARTICIPANT`
    *
    * @param {*} groupId '0000000000-00000000@g.us'
    * @param {*} participantId '000000000000@c.us'
    */
    promoteParticipant(groupId: GroupChatId, participantId: ContactId | ContactId[]): Promise<boolean>;
    /**
    * Demote Admin of Group
    *
    * If not a group chat, returns `NOT_A_GROUP_CHAT`.
    *
    * If the chat does not exist, returns `GROUP_DOES_NOT_EXIST`
    *
    * If the participantId does not exist in the group chat, returns `NOT_A_PARTICIPANT`
    *
    * @param {*} groupId '0000000000-00000000@g.us'
    * @param {*} participantId '000000000000@c.us'
    */
    demoteParticipant(groupId: GroupChatId, participantId: ContactId | ContactId[]): Promise<boolean>;
    /**
    *
    * Change who can and cannot speak in a group
    * @param groupId '0000000000-00000000@g.us' the group id.
    * @param onlyAdmins boolean set to true if you want only admins to be able to speak in this group. false if you want to allow everyone to speak in the group
    * @returns boolean true if action completed successfully.
    */
    setGroupToAdminsOnly(groupId: GroupChatId, onlyAdmins: boolean): Promise<boolean>;
    /**
     *
    * Change who can and cannot edit a groups details
    * @param groupId '0000000000-00000000@g.us' the group id.
    * @param onlyAdmins boolean set to true if you want only admins to be able to speak in this group. false if you want to allow everyone to speak in the group
    * @returns boolean true if action completed successfully.
    */
    setGroupEditToAdminsOnly(groupId: GroupChatId, onlyAdmins: boolean): Promise<boolean>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
    * Change the group chant description
    * @param groupId '0000000000-00000000@g.us' the group id.
    * @param description string The new group description
    * @returns boolean true if action completed successfully.
    */
    setGroupDescription(groupId: GroupChatId, description: string): Promise<boolean>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
    * Change the group chat title
    * @param groupId '0000000000-00000000@g.us' the group id.
    * @param title string The new group title
    * @returns boolean true if action completed successfully.
    */
    setGroupTitle(groupId: GroupChatId, title: string): Promise<boolean>;
    /**
    * Get Admins of a Group
    * @param {*} groupId '0000000000-00000000@g.us'
    */
    getGroupAdmins(groupId: GroupChatId): Promise<ContactId[]>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Set the wallpaper background colour
     * @param {string} hex '#FFF123'
    */
    setChatBackgroundColourHex(hex: string): Promise<boolean>;
    /**
     *
     * Start dark mode [NOW GENERALLY AVAILABLE]
     * @param {boolean} activate true to activate dark mode, false to deactivate
    */
    darkMode(activate: boolean): Promise<boolean>;
    /**
     * Returns an array of contacts that have read the message. If the message does not exist, it will return an empty array. If the host account has disabled read receipts this may not work!
     * Each of these contact objects have a property `t` which represents the time at which that contact read the message.
     * @param messageId The message id
     */
    getMessageReaders(messageId: MessageId): Promise<Contact[]>;
    /**
     * Sends a sticker (including GIF) from a given URL
     * @param to: The recipient id.
     * @param url: The url of the image
     * @param requestConfig {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
     *
     * @returns Promise<MessageId | boolean>
     */
    sendStickerfromUrl(to: ChatId, url: string, requestConfig?: AxiosRequestConfig, stickerMetadata?: StickerMetadata): Promise<string | MessageId | boolean>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Sends a sticker from a given URL
     * @param to The recipient id.
     * @param url The url of the image
     * @param messageId The id of the message to reply to
     * @param requestConfig {} By default the request is a get request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
     *
     * @returns Promise<MessageId | boolean>
     */
    sendStickerfromUrlAsReply(to: ChatId, url: string, messageId: MessageId, requestConfig?: AxiosRequestConfig, stickerMetadata?: StickerMetadata): Promise<MessageId | boolean>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * This function takes an image and sends it as a sticker to the recipient as a reply to another message.
     *
     *
     * @param to  The recipient id.
     * @param image: [[DataURL]], [[Base64]], URL (string GET), Relative filepath (string), or Buffer of the image
     * @param messageId  The id of the message to reply to
     * @param stickerMetadata  Sticker metadata
     */
    sendImageAsStickerAsReply(to: ChatId, image: DataURL | Buffer | Base64 | string, messageId: MessageId, stickerMetadata?: StickerMetadata): Promise<MessageId | boolean | string>;
    /**
     * This allows you to get a single property of a single object from the session. This limints the amouunt of data you need to sift through, reduces congestion between your process and the session and the flexibility to build your own specific getters.
     *
     * Example - get message read state (ack):
     *
     * ```javascript
     * const ack  = await client.getSingleProperty('Msg',"true_12345678912@c.us_9C4D0965EA5C09D591334AB6BDB07FEB",'ack')
     * ```
     * @param namespace
     * @param id id of the object to get from the specific namespace
     * @param property the single property key to get from the object.
     * @returns any If the property or the id cannot be found, it will return a 404
     */
    getSingleProperty(namespace: namespace, id: string, property: string): Promise<any>;
    private stickerServerRequest;
    private prepareWebp;
    /**
     * This function takes an image (including animated GIF) and sends it as a sticker to the recipient. This is helpful for sending semi-ephemeral things like QR codes.
     * The advantage is that it will not show up in the recipients gallery. This function automatiicaly converts images to the required webp format.
     * @param to: The recipient id.
     * @param image: [[DataURL]], [[Base64]], URL (string GET), Relative filepath (string), or Buffer of the image
     */
    sendImageAsSticker(to: ChatId, image: DataURL | Buffer | Base64 | string, stickerMetadata?: StickerMetadata): Promise<MessageId | string | boolean>;
    /**
     * [ALPHA]
     * Use this to send an mp4 file as a sticker. This can also be used to convert GIFs from the chat because GIFs in WA are actually tiny mp4 files.
     *
     * You need to make sure you have ffmpeg (with libwebp) installed for this to work.
     *
     * @param to ChatId The chat id you want to send the webp sticker to
     * @param file [[DataURL]], [[Base64]], URL (string GET), Relative filepath (string), or Buffer of the mp4 file
     * @param messageId message id of the message you want this sticker to reply to. [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     */
    sendMp4AsSticker(to: ChatId, file: DataURL | Buffer | Base64 | string, processOptions?: Mp4StickerConversionProcessOptions, stickerMetadata?: StickerMetadata, messageId?: MessageId): Promise<MessageId | string | boolean>;
    /**
     * You can use this to send a raw webp file.
     * @param to ChatId The chat id you want to send the webp sticker to
     * @param webpBase64 Base64 The base64 string of the webp file. Not DataURl
     * @param animated Boolean Set to true if the webp is animated. Default `false`
     */
    sendRawWebpAsSticker(to: ChatId, webpBase64: Base64, animated?: boolean): Promise<MessageId | string | boolean>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * You can use this to send a raw webp file.
     * @param to ChatId The chat id you want to send the webp sticker to
     * @param messageId MessageId Message ID of the message to reply to
     * @param webpBase64 Base64 The base64 string of the webp file. Not DataURl
     * @param animated Boolean Set to true if the webp is animated. Default `false`
     */
    sendRawWebpAsStickerAsReply(to: ChatId, messageId: MessageId, webpBase64: Base64, animated?: boolean): Promise<MessageId | string | boolean>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Turn the ephemeral setting in a chat to on or off
     * @param chatId The ID of the chat
     * @param ephemeral `true` to turn on the ephemeral setting, `false` to turn off the ephemeral setting. Please note, if the setting is already on the requested setting, this method will return `true`.
     * @returns Promise<boolean> true if the setting was set, `false` if the chat does not exist
     */
    setChatEphemeral(chatId: ChatId, ephemeral: boolean): Promise<boolean>;
    /**
     * Send a giphy GIF as an animated sticker.
     * @param to ChatId
     * @param giphyMediaUrl URL | string This is the giphy media url and has to be in the format `https://media.giphy.com/media/RJKHjCAdsAfQPn03qQ/source.gif` or it can be just the id `RJKHjCAdsAfQPn03qQ`
     */
    sendGiphyAsSticker(to: ChatId, giphyMediaUrl: URL | string): Promise<MessageId | string | boolean>;
    /**
     * [REQUIRES A TEXT STORY LICENSE-KEY](https://gum.co/open-wa)
     *
     * Sends a formatted text story.
     * @param text The text to be displayed in the story
     * @param textRgba The colour of the text in the story in hex format, make sure to add the alpha value also. E.g "#FF00F4F2"
     * @param backgroundRgba  The colour of the background in the story in hex format, make sure to add the alpha value also. E.g "#4FF31FF2"
     * @param font The font of the text to be used in the story. This has to be a number. Each number refers to a specific predetermined font. Here are the fonts you can choose from:
     * 0: Sans Serif
     * 1: Serif
     * 2: [Norican Regular](https://fonts.google.com/specimen/Norican)
     * 3: [Bryndan Write](https://www.dafontfree.net/freefonts-bryndan-write-f160189.htm)
     * 4: [Bebasneue Regular](https://www.dafont.com/bebas-neue.font)
     * 5: [Oswald Heavy](https://www.fontsquirrel.com/fonts/oswald)
     * @returns Promise<string | boolean> returns status id if it worked, false if it didn't
     */
    postTextStatus(text: Content, textRgba: string, backgroundRgba: string, font: number): Promise<MessageId | string | boolean>;
    /**
     * [REQUIRES AN IMAGE STORY LICENSE-KEY](https://gum.co/open-wa)
     *
     * Posts an image story.
     * @param data data url string `data:[<MIME-type>][;charset=<encoding>][;base64],<data>`
     * @param caption The caption for the story
     * @returns Promise<string | boolean> returns status id if it worked, false if it didn't
     */
    postImageStatus(data: DataURL, caption: Content): Promise<MessageId | string | boolean>;
    /**
     * [REQUIRES A VIDEO STORY LICENSE-KEY](https://gum.co/open-wa)
     *
     * Posts a video story.
     * @param data data url string `data:[<MIME-type>][;charset=<encoding>][;base64],<data>`
     * @param caption The caption for the story
     * @returns Promise<string | boolean> returns status id if it worked, false if it didn't
     */
    postVideoStatus(data: DataURL, caption: Content): Promise<MessageId | string | boolean>;
    /**
     * Consumes a list of id strings of statuses to delete.
     * @param statusesToDelete string [] | stringan array of ids of statuses to delete.
     * @returns boolean. True if it worked.
     */
    deleteStatus(statusesToDelete: string | string[]): Promise<boolean>;
    /**
     * Deletes all your existing statuses.
     * @returns boolean. True if it worked.
     */
    deleteAllStatus(): Promise<boolean>;
    /**
     * retrieves all existing statuses.
     *
     * Only works with a Story License Key
     */
    getMyStatusArray(): Promise<Message[]>;
    /**
       * Retrieves an array of user ids that have 'read' your story.
       *
       * @param id string The id of the story
       *
       * Only works with a Story License Key
       */
    getStoryViewers(id: string): Promise<ContactId[]>;
    /**
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     *
     * Clears all chats of all messages. This does not delete chats. Please be careful with this as it will remove all messages from whatsapp web and the host device. This feature is great for privacy focussed bots.
     */
    clearAllChats(): Promise<boolean>;
    /**
     * This simple function halves the amount of messages in your session message cache. This does not delete messages off your phone. If over a day you've processed 4000 messages this will possibly result in 4000 messages being present in your session.
     * Calling this method will cut the message cache to 2000 messages, therefore reducing the memory usage of your process.
     * You should use this in conjunction with `getAmountOfLoadedMessages` to intelligently control the session message cache.
     */
    cutMsgCache(): Promise<number>;
    /**
     * This simple function halves the amount of chats in your session message cache. This does not delete messages off your phone. If over a day you've processed 4000 messages this will possibly result in 4000 messages being present in your session.
     * Calling this method will cut the message cache to 2000 messages, therefore reducing the memory usage of your process.
     * You should use this in conjunction with `getAmountOfLoadedMessages` to intelligently control the session message cache.
     */
    cutChatCache(): Promise<{
        before: {
            msgs: number;
            chats: number;
        };
        after: {
            msgs: number;
            chats: number;
        };
    }>;
    /**
     * Deletes chats from a certain index (default 1000). E.g if this startingFrom param is `100` then all chats from index `100` onwards will be deleted.
     *
     * @param startingFrom the chat index to start from. Please do not set this to anything less than 10 @default: `1000`
     */
    deleteStaleChats(startingFrom?: number): Promise<boolean>;
    /**
     * Download profile pics from the message object.
     * ```javascript
     *  const filename = `profilepic_${message.from}.jpeg`;
     *  const data = await client.downloadProfilePicFromMessage(message);
     *  const dataUri = `data:image/jpeg;base64,${data}`;
     *  fs.writeFile(filename, mData, 'base64', function(err) {
     *    if (err) {
     *      return console.log(err);
     *    }
     *    console.log('The file was saved!');
     *  });
     * ```
     */
    downloadProfilePicFromMessage(message: Message): Promise<Base64>;
    /**
     * Download via the browsers authenticated session via URL.
     * @returns base64 string (non-data url)
     */
    downloadFileWithCredentials(url: string): Promise<Base64>;
    /**
     *
     * Sets the profile pic of the host number.
     * @param data string data url image string.
     * @returns Promise<boolean> success if true
     */
    setProfilePic(data: DataURL): Promise<boolean>;
    /**
     * This exposes a simple express middlware that will allow users to quickly boot up an api based off this client. Checkout demo/index.ts for an example
     * How to use the middleware:
     *
     * ```javascript
     *
     * import { create } from '@open-wa/wa-automate';
     * const express = require('express')
     * const app = express()
     * app.use(express.json())
     * const PORT = 8082;
     *
     * function start(client){
     *   app.use(client.middleware()); //or client.middleware(true) if you require the session id to be part of the path (so localhost:8082/sendText beccomes localhost:8082/sessionId/sendText)
     *   app.listen(PORT, function () {
     *     console.log(`\n• Listening on port ${PORT}!`);
     *   });
     *   ...
     * }
     *
     *
     * create({
     *   sessionId:'session1'
     * }).then(start)
     *
     * ```
     *
     * All requests need to be `POST` requests. You use the API the same way you would with `client`. The method can be the path or the method param in the post body. The arguments for the method should be properly ordered in the args array in the JSON post body.
     *
     * Example:
     *
     * ```javascript
     *   await client.sendText('4477777777777@c.us','test')
     *   //returns "true_4477777777777@c.us_3EB0645E623D91006252"
     * ```
     * as a request with a path:
     *
     * ```javascript
     * const axios = require('axios').default;
     * axios.post('localhost:8082/sendText', {
     *     args: [
     *        "4477777777777@c.us",
     *        "test"
     *         ]
     *   })
     * ```
     *
     * or as a request without a path:
     *
     * ```javascript
     * const axios = require('axios').default;
     * axios.post('localhost:8082', {
     *     method:'sendText',
     *     args: [
     *        "4477777777777@c.us",
     *        "test"
     *         ]
     * })
     * ```
     *
     * As of 1.9.69, you can also send the argyments as an object with the keys mirroring the paramater names of the relative client functions
     *
     * Example:
     *
     * ```javascript
     * const axios = require('axios').default;
     * axios.post('localhost:8082', {
     *     method:'sendText',
     *     args: {
     *        "to":"4477777777777@c.us",
     *        "content":"test"
     *         }
     * })
     * ```
     * @param useSessionIdInPath boolean Set this to true if you want to keep each session in it's own path.
     *
     * For example, if you have a session with id  `host` if you set useSessionIdInPath to true, then all requests will need to be prefixed with the path `host`. E.g `localhost:8082/sendText` becomes `localhost:8082/host/sendText`
     */
    middleware: (useSessionIdInPath?: boolean) => (req: any, res: any, next: any) => Promise<any>;
    /**
     * Retreives an array of webhook objects
     */
    listWebhooks(): Promise<Webhook[]>;
    /**
     * Removes a webhook.
     *
     * Returns `true` if the webhook was found and removed. `false` if the webhook was not found and therefore could not be removed. This does not unregister any listeners off of other webhooks.
     *
     *
     * @param webhookId The ID of the webhook
     * @retruns boolean
     */
    removeWebhook(webhookId: string): Promise<boolean>;
    /**
     * Update registered events for a specific webhook. This will override all existing events. If you'd like to remove all listeners from a webhook, consider using [[removeWebhook]].
     *
     * In order to update authentication details for a webhook, remove it completely and then reregister it with the correct credentials.
     */
    updateWebhook(webhookId: string, events: SimpleListener[] | 'all'): Promise<Webhook | false>;
    /**
     * The client can now automatically handle webhooks. Use this method to register webhooks.
     *
     * @param event use [[SimpleListener]] enum
     * @param url The webhook url
     * @param requestConfig {} By default the request is a post request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
     * @param concurrency the amount of concurrent requests to be handled by the built in queue. Default is 5.
     */
    private _setupWebhooksOnListeners;
    /**
     * The client can now automatically handle webhooks. Use this method to register webhooks.
     *
     * @param url The webhook url
     * @param events An array of [[SimpleListener]] enums or `all` (to register all possible listeners)
     * @param requestConfig {} By default the request is a post request, however you can override that and many other options by sending this parameter. You can read more about this parameter here: https://github.com/axios/axios#request-config
     * @param concurrency the amount of concurrent requests to be handled by the built in queue. Default is 5.
     * @returns A webhook object. This will include a webhook ID and an array of all successfully registered Listeners.
     */
    registerWebhook(url: string, events: SimpleListener[] | 'all', requestConfig?: AxiosRequestConfig, concurrency?: number): Promise<Webhook | false>;
    private prepEventData;
    private registerEv;
    /**
     * Returns a new message collector for the chat which is related to the first parameter c
     * @param c The Mesasge/Chat or Chat Id to base this message colletor on
     * @param filter A function that consumes a [Message] and returns a boolean which determines whether or not the message shall be collected.
     * @param options The options for the collector. For example, how long the collector shall run for, how many messages it should collect, how long between messages before timing out, etc.
     */
    createMessageCollector(c: Message | ChatId | Chat, filter: (args: any[] | any) => boolean | Promise<boolean>, options: CollectorOptions): MessageCollector;
}
export { useragent } from '../config/puppeteer.config';
