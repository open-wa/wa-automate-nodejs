import { projectEffectSchema } from './effect-projection';
import {
  EventInputSchema, EventUpdateSchema, WhatsAppEventSchema, EventResponseSchema,
  EventListOptionsSchema, EventPageSchema, validateEventInput, validateEventUpdate,
} from './whatsapp-events';

// Shared serving projections retain the Effect contracts' input/output types.
export const EventInputRegistrySchema = projectEffectSchema(EventInputSchema).superRefine((value, ctx) => {
  try { validateEventInput(value); } catch (error) { ctx.addIssue({ code: 'custom', message: String(error) }); }
}).meta({ examples: [{ name: 'Community meetup', startTime: 1893456000, description: 'Meet the community' }] });
export const EventUpdateRegistrySchema = projectEffectSchema(EventUpdateSchema).superRefine((value, ctx) => {
  try { validateEventUpdate(value); } catch (error) { ctx.addIssue({ code: 'custom', message: String(error) }); }
}).meta({ examples: [{ description: 'Updated meetup details' }] });
export const WhatsAppEventRegistrySchema = projectEffectSchema(WhatsAppEventSchema);
export const EventResponseRegistrySchema = projectEffectSchema(EventResponseSchema);
export const EventListOptionsRegistrySchema = projectEffectSchema(EventListOptionsSchema);
export const EventPageRegistrySchema = projectEffectSchema(EventPageSchema);
