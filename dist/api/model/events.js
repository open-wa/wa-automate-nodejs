"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleListener = void 0;
/**
 * An enum of all the "simple listeners". A simple listener is a listener that just takes one parameter which is the callback function to handle the event.
 */
var SimpleListener;
(function (SimpleListener) {
    /**
     * Represents [[onMessage]]
     */
    SimpleListener["Message"] = "onMessage";
    /**
     * Represents [[onAnyMessage]]
     */
    SimpleListener["AnyMessage"] = "onAnyMessage";
    /**
     * Represents [[onMessageDeleted]]
     */
    SimpleListener["MessageDeleted"] = "onMessageDeleted";
    /**
     * Represents [[onAck]]
     */
    SimpleListener["Ack"] = "onAck";
    /**
     * Represents [[onAddedToGroup]]
     */
    SimpleListener["AddedToGroup"] = "onAddedToGroup";
    /**
     * Represents [[onChatDeleted]]
     */
    SimpleListener["ChatDeleted"] = "onChatDeleted";
    /**
     * Represents [[onBattery]]
     */
    SimpleListener["Battery"] = "onBattery";
    /**
     * Represents [[onChatOpened]]
     */
    SimpleListener["ChatOpened"] = "onChatOpened";
    /**
     * Represents [[onIncomingCall]]
     */
    SimpleListener["IncomingCall"] = "onIncomingCall";
    /**
     * Represents [[onGlobalParticipantsChanged]]
     */
    SimpleListener["GlobalParticipantsChanged"] = "onGlobalParticipantsChanged";
    /**
     * Represents [[onChatState]]
     */
    SimpleListener["ChatState"] = "onChatState";
    // Next two require extra params so not available to use via webhook register
    // LiveLocation = 'onLiveLocation',
    // ParticipantsChanged = 'onParticipantsChanged',
    /**
     * Represents [[onPlugged]]
     */
    SimpleListener["Plugged"] = "onPlugged";
    /**
     * Represents [[onStateChanged]]
     */
    SimpleListener["StateChanged"] = "onStateChanged";
    /**
     * Requires licence
     * Represents [[onStory]]
     */
    SimpleListener["Story"] = "onStory";
    /**
     * Requires licence
     * Represents [[onRemovedFromGroup]]
     */
    SimpleListener["RemovedFromGroup"] = "onRemovedFromGroup";
    /**
     * Requires licence
     * Represents [[onContactAdded]]
     */
    SimpleListener["ContactAdded"] = "onContactAdded";
})(SimpleListener = exports.SimpleListener || (exports.SimpleListener = {}));
