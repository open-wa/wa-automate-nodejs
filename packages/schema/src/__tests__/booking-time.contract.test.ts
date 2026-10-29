import { expect, test } from 'vitest';
import { Schema, SchemaGetter } from 'effect';
import { z } from 'zod';
import { BookingTimestampSchema, normalizeBookingTimestamp, type BookingTimestamp } from '../booking-time';
import { BookingTimestampRegistrySchema, InteractiveContentSchema, defineInteractiveMessage, type DecodedInteractiveContent } from '../interactive';
import { projectEffectSchema } from '../effect-projection';
import { CallSnapshotSchema } from '../calling';
import { EventInputRegistrySchema } from '../whatsapp-event-registry';

type Assert<T extends true> = T;
type Equal<A, B> = [A, B] extends [B, A] ? true : false;
export type RegistryAcceptsTimestampStrings = Assert<Equal<z.input<typeof BookingTimestampRegistrySchema>, string>>;
export type RegistryReturnsEffectBrand = Assert<Equal<z.output<typeof BookingTimestampRegistrySchema>, BookingTimestamp>>;
export type DecoderReturnsEffectBrand = Assert<Equal<ReturnType<typeof normalizeBookingTimestamp>, BookingTimestamp>>;
type ParsedBooking = Extract<DecodedInteractiveContent, { type: 'booking' }>;
export type ParsedBookingRequiresBrand = Assert<Equal<ParsedBooking['booking']['startAt'], BookingTimestamp>>;
export type RawStringsCannotBeParsedTimestamps = Assert<string extends BookingTimestamp ? false : true>;

test('Effect and the serving projection decode offsets and fractions and encode canonical UTC seconds', () => {
  const input = '2026-07-26T00:00:00.987+01:00';
  const expected = '2026-07-25T23:00:00Z';
  const decoded = normalizeBookingTimestamp(input);
  expect(decoded).toBe(expected);
  expect(Schema.encodeSync(BookingTimestampSchema)(decoded)).toBe(expected);
  expect(BookingTimestampRegistrySchema.parse(input)).toBe(expected);
  expect(z.encode(BookingTimestampRegistrySchema, decoded)).toBe(expected);
  expect(z.safeEncode(BookingTimestampRegistrySchema, input as BookingTimestamp).success).toBe(false);
});

test('invalid calendar dates and ambiguous timestamps fail in both Effect and the projection', () => {
  const invalid = ['2026-02-29T14:00:00Z', '2026-04-31T14:00:00Z', '2026-13-01T14:00:00Z',
    '2026-10-26T24:00:00Z', '2026-10-26T14:00:00+24:00', '2026-10-26T14:00:00', '2026-10-26', 'not a date'];
  for (const input of invalid) {
    expect(() => normalizeBookingTimestamp(input)).toThrow();
    expect(BookingTimestampRegistrySchema.safeParse(input).success).toBe(false);
  }
  expect(normalizeBookingTimestamp('2028-02-29T14:00:00Z')).toBe('2028-02-29T14:00:00Z');
});

test('builders normalize automatically and reject ranges collapsed by whole-second precision', () => {
  const content = { type: 'booking' as const, body: 'Booking', booking: {
    startAt: '2026-07-26T14:00:00.100+01:00', endAt: '2026-07-26T14:30:00.900+01:00', location: 'Office',
  } };
  const parsed = defineInteractiveMessage(content);
  expect(parsed.booking).toEqual({ startAt: '2026-07-26T13:00:00Z', endAt: '2026-07-26T13:30:00Z', location: 'Office' });
  expect(content.booking.startAt).toBe('2026-07-26T14:00:00.100+01:00');
  expect(() => InteractiveContentSchema.parse({ ...content, booking: {
    ...content.booking, endAt: '2026-07-26T14:00:00.500+01:00',
  } })).toThrow('after');
});

test('input and output JSON Schema retain their distinct patterns and Effect metadata', () => {
  const input = z.toJSONSchema(BookingTimestampRegistrySchema, { io: 'input' });
  const output = z.toJSONSchema(BookingTimestampRegistrySchema, { io: 'output' });
  expect(input).toMatchObject({ type: 'string', format: 'date-time', examples: ['2026-10-26T14:00:00Z', '2026-07-26T14:00:00.000+01:00'] });
  expect(input.description).toContain('Decoding converts');
  expect(output).toMatchObject({ type: 'string', format: 'date-time', title: 'BookingTimestamp', examples: ['2026-10-26T14:00:00Z'] });
  expect(output.description).toContain('whole seconds');
  expect(new RegExp(input.pattern!).test('2026-07-26T14:00:00.123+01:00')).toBe(true);
  expect(new RegExp(output.pattern!).test('2026-07-26T14:00:00.123Z')).toBe(false);
  expect(new RegExp(output.pattern!).test('2026-07-26T14:00:00Z')).toBe(true);
});

test('the bridge executes nested Effect transformations, refinements and encoders while retaining Struct.shape', () => {
  const count = Schema.String.pipe(Schema.decodeTo(Schema.Number, {
    decode: SchemaGetter.transform(Number), encode: SchemaGetter.transform(String),
  }));
  const effect = Schema.Struct({ count, until: Schema.optional(count) }).check(Schema.makeFilter(value =>
    value.until === undefined || value.until > value.count || 'until must follow count'));
  const projected = projectEffectSchema(effect);
  expect('shape' in projected).toBe(true);
  expect(projected.parse({ count: '2', until: '3' })).toEqual({ count: 2, until: 3 });
  expect(projected.parse({ count: '2' })).toEqual({ count: 2 });
  expect(z.encode(projected, { count: 2, until: 3 })).toEqual({ count: '2', until: '3' });
  expect(projected.safeParse({ count: '2', until: '1' }).success).toBe(false);
  expect(z.safeEncode(projected, { count: 2, until: 1 }).success).toBe(false);
});

test('existing call and event projections retain optional fields and validation', () => {
  const call = { id: 'id', sessionId: 'session', generation: 'generation', peer: 'peer', state: 'active', direction: 'incoming',
    video: false, terminal: false, observedAt: 1 };
  const projected = projectEffectSchema(CallSnapshotSchema);
  expect(projected.parse(call)).toEqual(call);
  expect(projected.safeParse({ ...call, direction: 'sideways' }).success).toBe(false);
  expect(EventInputRegistrySchema.parse({ name: 'Meetup', startTime: 100 })).toEqual({ name: 'Meetup', startTime: 100 });
  expect(EventInputRegistrySchema.safeParse({ name: 'Meetup', startTime: 1.5 }).success).toBe(false);
  expect(EventInputRegistrySchema.safeParse({ name: 'Meetup', startTime: 100, endTime: 99 }).success).toBe(false);
});
