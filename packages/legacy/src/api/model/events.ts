
/**
 * An enum of all the "simple listeners". A simple listener is a listener that just takes one parameter which is the callback function to handle the event.
 */
 export enum SimpleListener {
    /**
     * Represents [[onMessage]]
     */
    Message = 'onMessage',
    /**
     * Represents [[onAnyMessage]]
     */
    AnyMessage = 'onAnyMessage',
    /**
     * Represents [[onMessageDeleted]]
     */
    MessageDeleted = 'onMessageDeleted',
    /**
     * Represents [[onAck]]
     */
    Ack = 'onAck',
    /**
     * Represents [[onAddedToGroup]]
     */
    AddedToGroup = 'onAddedToGroup',
    /**
     * Represents [[onChatDeleted]]
     */
    ChatDeleted = 'onChatDeleted',
    /**
     * Represents [[onBattery]]
     */
    Battery = 'onBattery',
    /**
     * Represents [[onChatOpened]]
     */
    ChatOpened = 'onChatOpened',
    /**
     * Represents [[onIncomingCall]]
     */
    IncomingCall = 'onIncomingCall',
    /**
     * Represents [[onIncomingCall]]
     */
    CallState = 'onCallState',
    /**
     * Represents [[onGlobalParticipantsChanged]]
     */
    GlobalParticipantsChanged = 'onGlobalParticipantsChanged',
    /**
     * Represents [[onGroupApprovalRequest]]
     */
    GroupApprovalRequest = 'onGroupApprovalRequest',
    /**
     * Represents [[onChatState]]
     */
    ChatState = 'onChatState',
    /**
     * Represents [[onLogout]]
     */
    Logout = 'onLogout',
    // Next two require extra params so not available to use via webhook register
    // LiveLocation = 'onLiveLocation',
    // ParticipantsChanged = 'onParticipantsChanged',
    /**
     * Represents [[onPlugged]]
     */
    Plugged = 'onPlugged',
    /**
     * Represents [[onStateChanged]]
     */
    StateChanged = 'onStateChanged',
    /**
     * Represents [[onButton]]
     */
    Button = 'onButton',
    /**
     * Represents [[onButton]]
     */
    PollVote = 'onPollVote',
    /**
     * Represents [[onBroadcast]]
     */
    Broadcast = 'onBroadcast',
    /**
     * Represents [[onLabel]]
     */
    Label = 'onLabel',
    /**
     * Requires licence
     * Represents [[onStory]]
     */
    Story = 'onStory',
    /**
     * Requires licence
     * Represents [[onRemovedFromGroup]]
     */
    RemovedFromGroup = 'onRemovedFromGroup',
    /**
     * Requires licence
     * Represents [[onContactAdded]]
     */
    ContactAdded = 'onContactAdded',
    /**
     * Requires licence
     * Represents [[onContactAdded]]
     */
    Order = 'onOrder',
    /**
     * Requires licence
     * Represents [[onNewProduct]]
     */
    NewProduct = 'onNewProduct',
    /**
     * Requires licence
     * Represents [[onReaction]]
     */
    Reaction = 'onReaction',
    /**
     * Requires licence
     * Represents [[onGroupChange]]
     */
    GroupChange = 'onGroupChange'
  }