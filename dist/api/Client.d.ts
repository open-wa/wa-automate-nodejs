import { Page } from 'puppeteer';
import { Chat, LiveLocationChangedEvent, ChatState } from './model/chat';
import { Contact } from './model/contact';
import { Message } from './model/message';
import { ParticipantChangedEventModel } from './model/group-metadata';
import { ConfigObject } from './model';
import { SessionInfo } from './model/sessionInfo';
import { ChatId, GroupChatId, Content, Base64, MessageId, ContactId, DataURL, FilePath } from './model/aliases';
export declare enum namespace {
    Chat = "Chat",
    Msg = "Msg",
    Contact = "Contact",
    GroupMetadata = "GroupMetadata"
}
export declare enum SimpleListener {
    Message = "onMessage",
    AnyMessage = "onAnyMessage",
    Ack = "onAck",
    AddedToGroup = "onAddedToGroup",
    Battery = "onBattery",
    ChatOpened = "onChatOpened",
    IncomingCall = "onIncomingCall",
    GlobalParicipantsChanged = "onGlobalParicipantsChanged",
    ChatState = "onChatState",
    Plugged = "onPlugged",
    StateChanged = "onStateChanged",
    Story = "onStory",
    RemovedFromGroup = "onRemovedFromGroup",
    ContactAdded = "onContactAdded"
}
export declare class Client {
    private _loadedModules;
    private _registeredWebhooks;
    private _webhookQueue;
    private _createConfig;
    private _sessionInfo;
    private _listeners;
    private _page;
    constructor(page: Page, createConfig: ConfigObject, sessionInfo: SessionInfo);
    getPage(): Page;
    private _setOnClose;
    private _reInjectWapi;
    private _reRegisterListeners;
    refresh(): Promise<boolean>;
    getSessionInfo(): SessionInfo;
    getConfig(): {
        [x: string]: any;
        useStealth?: boolean;
        sessionDataPath?: string;
        bypassCSP?: boolean;
        chromiumArgs?: string[];
        skipBrokenMethodsCheck?: boolean;
        sessionId?: string;
        licenseKey?: string | string[];
        customUserAgent?: string;
        blockCrashLogs?: boolean;
        cacheEnabled?: boolean;
        browserRevision?: string;
        throwErrorOnTosBlock?: boolean;
        headless?: boolean;
        autoRefresh?: boolean;
        qrRefreshS?: number;
        qrTimeout?: number;
        executablePath?: string;
        useChrome?: boolean;
        qrLogSkip?: boolean;
        disableSpins?: boolean;
        logConsole?: boolean;
        logConsoleErrors?: boolean;
        authTimeout?: number;
        killProcessOnBrowserClose?: boolean;
        safeMode?: boolean;
        skipSessionSave?: boolean;
        popup?: number | boolean;
        inDocker?: boolean;
        qrQuality?: import("./model").QRQuality;
        qrFormat?: import("./model").QRFormat;
        hostNotificationLang?: import("./model").NotificationLanguage;
        blockAssets?: boolean;
    };
    private pup;
    private registerListener;
    onMessage(fn: (message: Message) => void): Promise<any>;
    onAnyMessage(fn: (message: Message) => void): Promise<any>;
    onBattery(fn: (battery: number) => void): Promise<any>;
    onPlugged(fn: (plugged: boolean) => void): Promise<any>;
    onStory(fn: (story: any) => void): Promise<any>;
    onStateChanged(fn: (state: string) => void): Promise<any>;
    onIncomingCall(fn: (call: any) => void): Promise<any>;
    onChatState(fn: (chatState: any) => void): Promise<any>;
    onAck(fn: (message: Message) => void): Promise<any>;
    onGlobalParicipantsChanged(fn: (participantChangedEvent: ParticipantChangedEventModel) => void): Promise<any>;
    onAddedToGroup(fn: (chat: Chat) => any): Promise<any>;
    onRemovedFromGroup(fn: (chat: Chat) => any): Promise<any>;
    onChatOpened(fn: (chat: Chat) => any): Promise<any>;
    onContactAdded(fn: (chat: Chat) => any): Promise<any>;
    onParticipantsChanged(groupId: GroupChatId, fn: (participantChangedEvent: ParticipantChangedEventModel) => void, useLegancyMethod?: boolean): Promise<any>;
    onLiveLocation(chatId: ChatId, fn: (liveLocationChangedEvent: LiveLocationChangedEvent) => void): Promise<any>;
    setPresence(available: boolean): Promise<any>;
    setMyStatus(newStatus: string): Promise<any>;
    addLabel(label: string, id: string): Promise<any>;
    removeLabel(label: string, id: string): Promise<any>;
    sendVCard(chatId: ChatId, vcard: string, contactName: string, contactNumber?: string): Promise<any>;
    setMyName(newName: string): Promise<any>;
    setChatState(chatState: ChatState, chatId: ChatId): Promise<any>;
    getConnectionState(): Promise<string>;
    getChatWithNonContacts(): Promise<Contact[]>;
    kill(): Promise<boolean>;
    forceRefocus(): Promise<unknown>;
    forceUpdateLiveLocation(chatId: ChatId): Promise<any>;
    sendText(to: ChatId, content: Content): Promise<any>;
    sendTextWithMentions(to: ChatId, content: Content): Promise<any>;
    sendReplyWithMentions(to: ChatId, content: Content, replyMessageId: MessageId): Promise<any>;
    tagEveryone(groupId: GroupChatId, content: Content): Promise<any>;
    sendMessageWithThumb(thumb: string, url: string, title: string, description: string, text: Content, chatId: ChatId): Promise<any>;
    sendLocation(to: ChatId, lat: any, lng: any, loc: string): Promise<any>;
    getGeneratedUserAgent(userA?: string): Promise<any>;
    sendImage(to: ChatId, file: DataURL | FilePath, filename: string, caption: Content, quotedMsgId?: MessageId, waitForId?: boolean, ptt?: boolean): Promise<any>;
    sendYoutubeLink(to: ChatId, url: string, text?: Content): Promise<any>;
    sendLinkWithAutoPreview(to: ChatId, url: string, text?: Content): Promise<any>;
    reply(to: ChatId, content: Content, quotedMsgId: MessageId, sendSeen?: boolean): Promise<any>;
    sendFile(to: ChatId, file: DataURL | FilePath, filename: string, caption: Content, quotedMsgId?: MessageId, waitForId?: boolean): Promise<any>;
    sendPtt(to: ChatId, file: DataURL | FilePath, quotedMsgId: MessageId): Promise<any>;
    sendVideoAsGif(to: ChatId, file: DataURL | FilePath, filename: string, caption: Content, quotedMsgId?: MessageId): Promise<any>;
    sendGiphy(to: ChatId, giphyMediaUrl: string, caption: Content): Promise<any>;
    sendFileFromUrl(to: ChatId, url: string, filename: string, caption: Content, quotedMsgId?: MessageId, requestConfig?: any, waitForId?: boolean): Promise<any>;
    getMe(): Promise<any>;
    iAmAdmin(): Promise<any>;
    syncContacts(): Promise<any>;
    getAmountOfLoadedMessages(): Promise<any>;
    getBusinessProfilesProducts(id: ContactId): Promise<any>;
    sendImageWithProduct(to: ChatId, base64: Base64, caption: Content, bizNumber: ContactId, productId: string): Promise<any>;
    sendContact(to: ChatId, contactId: ContactId | ContactId[]): Promise<any>;
    simulateTyping(to: ChatId, on: boolean): Promise<any>;
    archiveChat(id: ChatId, archive: boolean): Promise<any>;
    forwardMessages(to: ChatId, messages: MessageId | MessageId[], skipMyMessages: boolean): Promise<any>;
    ghostForward(to: ChatId, messageId: MessageId): Promise<any>;
    getAllContacts(): Promise<any>;
    getWAVersion(): Promise<any>;
    isConnected(): Promise<any>;
    getBatteryLevel(): Promise<any>;
    getIsPlugged(): Promise<any>;
    getHostNumber(): Promise<any>;
    getAllChats(withNewMessageOnly?: boolean): Promise<any>;
    getAllChatIds(): Promise<any>;
    getBlockedIds(): Promise<any>;
    getAllChatsWithMessages(withNewMessageOnly?: boolean): Promise<any>;
    getAllGroups(withNewMessagesOnly?: boolean): Promise<any>;
    getGroupMembersId(groupId: GroupChatId): Promise<any>;
    joinGroupViaLink(link: string): Promise<any>;
    contactBlock(id: ContactId): Promise<any>;
    contactUnblock(id: ContactId): Promise<any>;
    leaveGroup(groupId: GroupChatId): Promise<any>;
    getVCards(msgId: MessageId): Promise<any>;
    getGroupMembers(groupId: GroupChatId): Promise<[unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown]>;
    getContact(contactId: ContactId): Promise<any>;
    getChatById(contactId: ContactId): Promise<any>;
    getMessageById(messageId: MessageId): Promise<any>;
    getStickerDecryptable(messageId: MessageId): Promise<any>;
    forceStaleMediaUpdate(messageId: MessageId): Promise<any>;
    getChat(contactId: ContactId): Promise<any>;
    getCommonGroups(contactId: ContactId): Promise<any>;
    getLastSeen(chatId: ChatId): Promise<any>;
    getProfilePicFromServer(chatId: ChatId): Promise<any>;
    sendSeen(chatId: ChatId): Promise<any>;
    markAsUnread(chatId: ChatId): Promise<any>;
    isChatOnline(chatId: ChatId): Promise<any>;
    loadEarlierMessages(contactId: ContactId): Promise<any>;
    getStatus(contactId: ContactId): Promise<any>;
    loadAllEarlierMessages(contactId: ContactId): Promise<any>;
    deleteChat(chatId: ChatId): Promise<any>;
    clearChat(chatId: ChatId): Promise<any>;
    getGroupInviteLink(chatId: ChatId): Promise<any>;
    inviteInfo(link: string): Promise<any>;
    revokeGroupInviteLink(chatId: ChatId): Promise<any>;
    deleteMessage(contactId: ContactId, messageId: MessageId[] | MessageId, onlyLocal?: boolean): Promise<any>;
    checkNumberStatus(contactId: ContactId): Promise<any>;
    getUnreadMessages(includeMe: boolean, includeNotifications: boolean, use_unread_count: boolean): Promise<any>;
    getAllNewMessages(): Promise<any>;
    getAllUnreadMessages(): Promise<any>;
    getIndicatedNewMessages(): Promise<any>;
    getAllMessagesInChat(chatId: ChatId, includeMe: boolean, includeNotifications: boolean): Promise<any>;
    loadAndGetAllMessagesInChat(chatId: ChatId, includeMe: boolean, includeNotifications: boolean): Promise<any>;
    createGroup(groupName: string, contacts: ContactId | ContactId[]): Promise<any>;
    removeParticipant(groupId: GroupChatId, participantId: ContactId): Promise<any>;
    setGroupIcon(groupId: GroupChatId, b64: Base64): Promise<any>;
    setGroupIconByUrl(groupId: GroupChatId, url: string, requestConfig?: any): Promise<any>;
    addParticipant(groupId: GroupChatId, participantId: ContactId): Promise<any>;
    promoteParticipant(groupId: GroupChatId, participantId: ContactId): Promise<any>;
    demoteParticipant(groupId: GroupChatId, participantId: ContactId): Promise<any>;
    setGroupToAdminsOnly(groupId: GroupChatId, onlyAdmins: boolean): Promise<any>;
    setGroupEditToAdminsOnly(groupId: GroupChatId, onlyAdmins: boolean): Promise<any>;
    setGroupDescription(groupId: GroupChatId, description: string): Promise<any>;
    setGroupTitle(groupId: GroupChatId, title: string): Promise<any>;
    getGroupAdmins(groupId: GroupChatId): Promise<any>;
    setChatBackgroundColourHex(hex: string): Promise<any>;
    darkMode(activate: boolean): Promise<any>;
    sendStickerfromUrl(to: ChatId, url: string, requestConfig?: any): Promise<any>;
    getSingleProperty(namespace: namespace, id: string, property: string): Promise<any>;
    sendImageAsSticker(to: ChatId, b64: DataURL): Promise<any>;
    sendRawWebpAsSticker(to: ChatId, webpBase64: Base64): Promise<any>;
    sendGiphyAsSticker(to: ChatId, giphyMediaUrl: URL): Promise<any>;
    postTextStatus(text: Content, textRgba: string, backgroundRgba: string, font: number): Promise<any>;
    postImageStatus(data: DataURL, caption: Content): Promise<any>;
    postVideoStatus(data: DataURL, caption: Content): Promise<any>;
    deleteStatus(statusesToDelete: string | string[]): Promise<any>;
    deleteAllStatus(): Promise<any>;
    getMyStatusArray(): Promise<any>;
    getStoryViewers(id: string): Promise<any>;
    clearAllChats(): Promise<any>;
    cutMsgCache(): Promise<any>;
    downloadProfilePicFromMessage(message: Message): Promise<any>;
    downloadFileWithCredentials(url: string): Promise<any>;
    setProfilePic(data: DataURL): Promise<any>;
    middleware: (useSessionIdInPath?: boolean) => (req: any, res: any, next: any) => Promise<any>;
    registerWebhook(event: SimpleListener, url: string, requestConfig?: any, concurrency?: number): Promise<any>;
}
export { useragent } from '../config/puppeteer.config';
