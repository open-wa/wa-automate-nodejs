import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { toParam, messageIdParam } from '../parameters';
import { EventInputRegistrySchema, EventUpdateRegistrySchema, WhatsAppEventRegistrySchema, EventResponseRegistrySchema, EventListOptionsRegistrySchema, EventPageRegistrySchema } from '../whatsapp-event-registry';

const meta = { namespace: 'events', license: 'none', functionality: 'both' } as const;

export const sendEvent = defineMethodV2('sendEvent', {
  meta: { ...meta, action: 'send', httpMethod: 'POST', description: 'Send a native WhatsApp event with Unix-second times. Returns its submitted message ID; delivery is observed through ACKs.' },
  input: z.object({ to: toParam, event: EventInputRegistrySchema }), parameterOrder: ['to', 'event'], output: messageIdParam,
});
export const getEvent = defineMethodV2('getEvent', {
  meta: { ...meta, action: 'read', httpMethod: 'GET', description: 'Retrieve an event by message ID from WhatsApp local history. Returns null when absent.' },
  input: z.object({ eventId: messageIdParam }), parameterOrder: ['eventId'], output: WhatsAppEventRegistrySchema.nullable(),
});
export const getEvents = defineMethodV2('getEvents', {
  meta: { ...meta, action: 'read', httpMethod: 'GET', description: 'Page through a chat’s locally synced event history, newest first. Pass nextCursor as options.before to retrieve the next page.' },
  input: z.object({ chatId: toParam, options: EventListOptionsRegistrySchema.optional() }), parameterOrder: ['chatId', 'options'], output: EventPageRegistrySchema,
});
export const getEventResponses = defineMethodV2('getEventResponses', {
  meta: { ...meta, action: 'read', httpMethod: 'GET', description: 'Get the latest decrypted RSVP per participant, including responses persisted in WhatsApp local history.' },
  input: z.object({ eventId: messageIdParam }), parameterOrder: ['eventId'], output: EventResponseRegistrySchema.array(),
});
export const editEvent = defineMethodV2('editEvent', {
  meta: { ...meta, action: 'update', httpMethod: 'POST', description: 'Edit an event created by this account. Unspecified fields retain their current values; endTime: null removes the end time.' },
  input: z.object({ eventId: messageIdParam, changes: EventUpdateRegistrySchema }), parameterOrder: ['eventId', 'changes'], output: z.boolean(),
});
export const cancelEvent = defineMethodV2('cancelEvent', {
  meta: { ...meta, action: 'update', httpMethod: 'POST', description: 'Cancel an event created by this account using WhatsApp’s encrypted event edit action.' },
  input: z.object({ eventId: messageIdParam }), parameterOrder: ['eventId'], output: z.boolean(),
});
export const respondToEvent = defineMethodV2('respondToEvent', {
  meta: { ...meta, action: 'send', httpMethod: 'POST', description: 'RSVP through WhatsApp’s native encrypted event-response action.' },
  input: z.object({ eventId: messageIdParam, response: z.enum(['going', 'notGoing', 'maybe']).meta({ examples: ['going'] }) }), parameterOrder: ['eventId', 'response'], output: z.boolean(),
});
