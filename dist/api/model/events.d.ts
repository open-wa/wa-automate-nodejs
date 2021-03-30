/**
 * An enum of all the "simple listeners". A simple listener is a listener that just takes one parameter which is the callback function to handle the event.
 */
export declare enum SimpleListener {
    /**
     * Represents [[onMessage]]
     */
    Message = "onMessage",
    /**
     * Represents [[onAnyMessage]]
     */
    AnyMessage = "onAnyMessage",
    /**
     * Represents [[onMessageDeleted]]
     */
    MessageDeleted = "onMessageDeleted",
    /**
     * Represents [[onAck]]
     */
    Ack = "onAck",
    /**
     * Represents [[onAddedToGroup]]
     */
    AddedToGroup = "onAddedToGroup",
    /**
     * Represents [[onChatDeleted]]
     */
    ChatDeleted = "onChatDeleted",
    /**
     * Represents [[onBattery]]
     */
    Battery = "onBattery",
    /**
     * Represents [[onChatOpened]]
     */
    ChatOpened = "onChatOpened",
    /**
     * Represents [[onIncomingCall]]
     */
    IncomingCall = "onIncomingCall",
    /**
     * Represents [[onGlobalParticipantsChanged]]
     */
    GlobalParticipantsChanged = "onGlobalParticipantsChanged",
    /**
     * Represents [[onChatState]]
     */
    ChatState = "onChatState",
    /**
     * Represents [[onPlugged]]
     */
    Plugged = "onPlugged",
    /**
     * Represents [[onStateChanged]]
     */
    StateChanged = "onStateChanged",
    /**
     * Requires licence
     * Represents [[onStory]]
     */
    Story = "onStory",
    /**
     * Requires licence
     * Represents [[onRemovedFromGroup]]
     */
    RemovedFromGroup = "onRemovedFromGroup",
    /**
     * Requires licence
     * Represents [[onContactAdded]]
     */
    ContactAdded = "onContactAdded"
}
