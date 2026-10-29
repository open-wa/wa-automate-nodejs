import { Schema, SchemaGetter } from 'effect';

const isoTimestamp = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/u;
const utcSeconds = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\dZ$/u;
const calendarDate = Schema.makeFilter<string>((value) => {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1] && Number.isFinite(Date.parse(value))
    || 'Use a real calendar date and an explicit UTC or numeric timezone';
}, {
  // Calendar arithmetic has no exact JSON Schema equivalent; retain the other
  // constraints and let the Effect decoder enforce the complete calendar rule.
  toJsonSchema: () => [{}, true],
});

const canonicalTimestamp = Schema.String.check(Schema.isPattern(utcSeconds), calendarDate).annotate({
  title: 'BookingTimestamp',
  description: 'Validated native booking timestamp, encoded as UTC ISO 8601 with whole seconds and no fractional seconds.',
  format: 'date-time',
  examples: ['2026-10-26T14:00:00Z'],
}).pipe(Schema.brand('BookingTimestamp'));

/** Effect owns validation, normalization and encoding for native booking dates. */
export const BookingTimestampSchema = Schema.String.check(Schema.isPattern(isoTimestamp), calendarDate).annotate({
  description: 'ISO 8601 booking timestamp with an explicit timezone. Decoding converts offsets and fractional seconds to UTC whole seconds for WhatsApp.',
  format: 'date-time',
  examples: ['2026-10-26T14:00:00Z', '2026-07-26T14:00:00.000+01:00'],
}).pipe(Schema.decodeTo(canonicalTimestamp, {
  decode: SchemaGetter.transform((value) => new Date(value).toISOString().replace(/\.\d{3}Z$/, 'Z')),
  encode: SchemaGetter.transform((value) => value),
}));

export type BookingTimestamp = typeof BookingTimestampSchema.Type;

/** Validate and normalize an external timestamp before constructing typed booking data. */
export const normalizeBookingTimestamp = Schema.decodeUnknownSync(BookingTimestampSchema);
