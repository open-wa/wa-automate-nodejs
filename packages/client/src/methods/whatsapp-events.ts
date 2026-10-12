import { Schema } from 'effect';
import {
  EventPageSchema, EventListOptionsSchema, validateEventInput, validateEventUpdate,
  decodeWhatsAppEvent, decodeEventResponse, chatIdCodec, messageIdCodec, MessageIdSchema,
  type EventInput, type EventUpdate, type WhatsAppEvent, type EventResponse,
  type EventResponseType, type EventPage, type EventListOptions, type MessageId,
} from '@open-wa/schema';
import type { Client } from '../Client';
import { invokePatch } from '../patchRuntime';

export interface WhatsAppEventMethods {
  sendEvent(to: string, event: EventInput): Promise<MessageId>;
  getEvent(eventId: string): Promise<WhatsAppEvent | null>;
  getEvents(chatId: string, options?: EventListOptions): Promise<EventPage>;
  getEventResponses(eventId: string): Promise<EventResponse[]>;
  editEvent(eventId: string, changes: EventUpdate): Promise<boolean>;
  cancelEvent(eventId: string): Promise<boolean>;
  respondToEvent(eventId: string, response: Exclude<EventResponseType, 'unknown'>): Promise<boolean>;
}

export function whatsappEventMethods(client: Client): WhatsAppEventMethods {
  const mutation = async (method: string, args: unknown[]): Promise<boolean> => {
    const result = await invokePatch<unknown>(client, method, args);
    if (result !== true) throw new Error(`${method} did not confirm native submission.`);
    return true;
  };
  return {
    async sendEvent(to, event) {
      const result = await invokePatch<unknown>(client, 'sendEvent', [chatIdCodec.decode(to), validateEventInput(event)]);
      if (typeof result !== 'string' || !/^(true|false)_.+_.+$/.test(result)) throw new Error('sendEvent did not return a submitted message ID. Inspect the chat before retrying.');
      return MessageIdSchema.parse(result);
    },
    async getEvent(eventId) {
      const result = await invokePatch<unknown>(client, 'getEvent', [messageIdCodec.decode(eventId)]);
      return result === null ? null : decodeWhatsAppEvent(result);
    },
    async getEvents(chatId, options = {}) {
      const params = Schema.decodeUnknownSync(EventListOptionsSchema)(options);
      return Schema.decodeUnknownSync(EventPageSchema)(await invokePatch(client, 'getEvents', [chatIdCodec.decode(chatId), params]));
    },
    async getEventResponses(eventId) {
      const result = await invokePatch<unknown>(client, 'getEventResponses', [messageIdCodec.decode(eventId)]);
      if (!Array.isArray(result)) throw new Error('Invalid event response list.');
      return result.map(value => decodeEventResponse(value));
    },
    async editEvent(eventId, changes) {
      return mutation('editEvent', [messageIdCodec.decode(eventId), validateEventUpdate(changes)]);
    },
    async cancelEvent(eventId) { return mutation('cancelEvent', [messageIdCodec.decode(eventId)]); },
    async respondToEvent(eventId, response) {
      if (!['going', 'notGoing', 'maybe'].includes(response)) throw new Error('Choose going, notGoing or maybe.');
      return mutation('respondToEvent', [messageIdCodec.decode(eventId), response]);
    },
  };
}
