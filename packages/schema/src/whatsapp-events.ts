import { Schema } from 'effect';

const id = Schema.String.check(Schema.isMinLength(1));
const seconds = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0), Schema.isLessThanOrEqualTo(2147483647));
const milliseconds = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0));

/** Native WhatsApp event input. All event times are Unix seconds. */
export const EventInputSchema = Schema.Struct({
  name: Schema.String.check(Schema.isMinLength(1)),
  startTime: seconds,
  endTime: Schema.optional(seconds),
  description: Schema.optional(Schema.String),
  location: Schema.optional(Schema.String),
  extraGuestsAllowed: Schema.optional(Schema.Boolean),
  callType: Schema.optional(Schema.Literals(['voice', 'video'])),
  isScheduledCall: Schema.optional(Schema.Boolean),
  requireApproval: Schema.optional(Schema.Boolean),
  quotedMsgId: Schema.optional(id),
});
export type EventInput = typeof EventInputSchema.Type;

export function validateEventInput(input: unknown): EventInput {
  const event = Schema.decodeUnknownSync(EventInputSchema)(input);
  if (!event.name.trim()) throw new Error('An event needs a name.');
  if (event.endTime !== undefined && event.endTime < event.startTime) throw new Error('Event endTime must be at or after startTime.');
  if (event.isScheduledCall && !event.callType) throw new Error('A scheduled call needs a callType.');
  return event;
}

export const EventUpdateSchema = Schema.Struct({
  name: Schema.optional(Schema.String.check(Schema.isMinLength(1))),
  startTime: Schema.optional(seconds),
  endTime: Schema.optional(Schema.NullOr(seconds)),
  description: Schema.optional(Schema.String),
  location: Schema.optional(Schema.String),
});
export type EventUpdate = typeof EventUpdateSchema.Type;

export function validateEventUpdate(input: unknown): EventUpdate {
  const changes = Schema.decodeUnknownSync(EventUpdateSchema)(input);
  if (changes.name !== undefined && !changes.name.trim()) throw new Error('An event needs a name.');
  if (changes.startTime !== undefined && changes.endTime != null && changes.endTime < changes.startTime) throw new Error('Event endTime must be at or after startTime.');
  return changes;
}

/** A JSON-safe event snapshot. Message secrets and encrypted RSVP data stay private. */
export const WhatsAppEventSchema = Schema.Struct({
  id, chatId: id, creatorId: id,
  name: Schema.String,
  startTime: seconds,
  endTime: Schema.optional(seconds),
  description: Schema.optional(Schema.String),
  location: Schema.optional(Schema.Struct({
    name: Schema.optional(Schema.String),
    latitude: Schema.optional(Schema.Number.check(Schema.isGreaterThanOrEqualTo(-90), Schema.isLessThanOrEqualTo(90))),
    longitude: Schema.optional(Schema.Number.check(Schema.isGreaterThanOrEqualTo(-180), Schema.isLessThanOrEqualTo(180))),
  })),
  joinLink: Schema.optional(Schema.String),
  isScheduledCall: Schema.optional(Schema.Boolean),
  extraGuestsAllowed: Schema.optional(Schema.Boolean),
  isCanceled: Schema.Boolean,
  fromMe: Schema.Boolean,
  timestamp: seconds,
});
export type WhatsAppEvent = typeof WhatsAppEventSchema.Type;

export const EventResponseTypeSchema = Schema.Literals(['going', 'notGoing', 'maybe', 'unknown']);
export type EventResponseType = typeof EventResponseTypeSchema.Type;
export const EventResponseSchema = Schema.Struct({
  id, eventId: id, chatId: id, senderId: id,
  response: EventResponseTypeSchema,
  /** Sender's monotonically increasing RSVP timestamp, in milliseconds. */
  timestamp: milliseconds,
  fromMe: Schema.Boolean,
});
export type EventResponse = typeof EventResponseSchema.Type;

export const EventListOptionsSchema = Schema.Struct({
  limit: Schema.optional(Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(100))),
  before: Schema.optional(id),
});
export type EventListOptions = typeof EventListOptionsSchema.Type;
export const EventPageSchema = Schema.Struct({ events: Schema.Array(WhatsAppEventSchema), nextCursor: Schema.NullOr(id) });
export type EventPage = typeof EventPageSchema.Type;

export const decodeWhatsAppEvent = Schema.decodeUnknownSync(WhatsAppEventSchema);
export const decodeEventResponse = Schema.decodeUnknownSync(EventResponseSchema);
export const serializeWhatsAppEvent = (event: WhatsAppEvent): string => JSON.stringify(Schema.encodeSync(WhatsAppEventSchema)(event));
export const deserializeWhatsAppEvent = (json: string): WhatsAppEvent => decodeWhatsAppEvent(JSON.parse(json));
export const serializeEventResponse = (response: EventResponse): string => JSON.stringify(Schema.encodeSync(EventResponseSchema)(response));
export const deserializeEventResponse = (json: string): EventResponse => decodeEventResponse(JSON.parse(json));
