import { Page } from 'puppeteer';
import { EventManager } from './EventManager';

export interface WapiBridgeConfig {
    page: Page;
    events: EventManager;
    sessionId: string;
}

export class WapiBridge {
    private page: Page;
    private events: EventManager;
    private registered = new Set<string>();

    constructor(config: WapiBridgeConfig) {
        this.page = config.page;
        this.events = config.events;
    }

    async registerEvent(eventName: string, wapiCallbackName: string): Promise<void> {
        if (this.registered.has(eventName)) {
            throw new Error(`Event ${eventName} already registered`);
        }

        await this.page.exposeFunction(wapiCallbackName, (payload: any) => {
            this.events.emit(eventName, payload);
        });

        this.registered.add(eventName);
    }

    async registerCoreEvents(): Promise<void> {
        await this.registerEvent('message', '__onMessage');
        await this.registerEvent('anyMessage', '__onAnyMessage');
        await this.registerEvent('messageDeleted', '__onMessageDeleted');
        await this.registerEvent('ack', '__onAck');
        await this.registerEvent('reaction', '__onReaction');
        await this.registerEvent('stateChanged', '__onStateChanged');
        await this.registerEvent('chatState', '__onChatState');
        await this.registerEvent('logout', '__onLogout');
        await this.registerEvent('participantsChanged', '__onParticipantsChanged');
        await this.registerEvent('addedToGroup', '__onAddedToGroup');
    }

    isRegistered(eventName: string): boolean {
        return this.registered.has(eventName);
    }

    getRegisteredEvents(): string[] {
        return Array.from(this.registered);
    }
}
