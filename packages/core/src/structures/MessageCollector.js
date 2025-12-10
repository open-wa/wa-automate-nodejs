"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageCollector = void 0;
const events_1 = require("../api/model/events");
const Collector_1 = require("./Collector");
class MessageCollector extends Collector_1.Collector {
    constructor(sessionId, instanceId, chat, filter, options = {}, openWaEventEmitter) {
        super(filter, options);
        this.ev = openWaEventEmitter;
        this.sessionId = sessionId;
        this.instanceId = instanceId;
        this.chat = chat;
        this.received = 0;
        this._handleChatDeletion = this._handleChatDeletion.bind(this);
        this._handleGuildDeletion = this._handleGuildDeletion.bind(this);
        const collectHandler = this.wrapHandler(this.handleCollect);
        const disposeHandler = this.wrapHandler(this.handleDispose);
        const deleteHandler = this.wrapHandler(this._handleChatDeletion);
        const groupRemovalHandler = this.wrapHandler(this._handleGroupRemoval);
        this.incrementMaxListeners();
        this.ev.on(this.eventSignature(events_1.SimpleListener.Message), collectHandler);
        this.ev.on(this.eventSignature(events_1.SimpleListener.MessageDeleted), disposeHandler);
        this.ev.on(this.eventSignature(events_1.SimpleListener.ChatDeleted), deleteHandler);
        this.ev.on(this.eventSignature(events_1.SimpleListener.RemovedFromGroup), groupRemovalHandler);
        this.once('end', () => {
            this.ev.removeListener(this.eventSignature(events_1.SimpleListener.Message), collectHandler);
            this.ev.removeListener(this.eventSignature(events_1.SimpleListener.MessageDeleted), disposeHandler);
            this.ev.removeListener(this.eventSignature(events_1.SimpleListener.ChatDeleted), deleteHandler);
            this.ev.removeListener(this.eventSignature(events_1.SimpleListener.RemovedFromGroup), groupRemovalHandler);
            this.decrementMaxListeners();
        });
    }
    collect(message) {
        if (message.chat.id !== this.chat)
            return null;
        this.received++;
        return message.id;
    }
    dispose(message) {
        return message.chat.id === this.chat ? message.id : null;
    }
    endReason() {
        if (this.options.max && this.collected.size >= this.options.max)
            return 'limit';
        if (this.options.maxProcessed && this.received === this.options.maxProcessed)
            return 'processedLimit';
        return null;
    }
    _handleChatDeletion(chat) {
        if (chat.id === this.chat) {
            this.stop('chatDelete');
        }
    }
    _handleGroupRemoval(chat) {
        if (chat.id === this.chat) {
            this.stop('groupRemoval');
        }
    }
    _handleGuildDeletion(guild) {
        console.error('This does not relate to WA', guild);
    }
    eventSignature(event) {
        return `${event}.${this.sessionId}.${this.instanceId}`;
    }
    wrapHandler(handler) {
        return ({ data }) => handler(data);
    }
}
exports.MessageCollector = MessageCollector;
//# sourceMappingURL=MessageCollector.js.map