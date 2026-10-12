import { WhatsAppEventRegistrySchema, EventResponseRegistrySchema } from '../whatsapp-event-registry';
import { defineListenerV2 } from './registry';

export const whatsappEvent = defineListenerV2('event', {
  legacyName: 'onEvent',
  meta: { namespace: 'events', license: 'none', status: 'beta', description: 'A native event added or changed in the synced message store, including this account’s events.' },
  payload: WhatsAppEventRegistrySchema, defaultQueueOptions: { concurrency: 1 },
});
export const eventResponseEvent = defineListenerV2('eventResponse', {
  legacyName: 'onEventResponse',
  meta: { namespace: 'events', license: 'none', status: 'beta', description: 'A decrypted RSVP added or changed in WhatsApp’s dedicated event-response collection. History loads may emit responses too; deduplicate by id and timestamp.' },
  payload: EventResponseRegistrySchema, defaultQueueOptions: { concurrency: 1 },
});
