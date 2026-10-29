import { expect, test } from 'bun:test';
import { candidateSpans, groundedBooking, resolveDate, type DateDecision } from '../src/facts';
const reference = Date.parse('2026-10-25T23:30:00Z');
const date = (patch: Partial<DateDecision> = {}): DateDecision => ({ mode: 'relative', month: 'absent', day: 'absent', year: 'absent', anchor: 'tomorrow', weekday: 'absent', week: 'absent', turnId: 'utterance-1', referenceInstant: reference, ...patch });
test('spoken meridiem punctuation stays attached to the literal appointment time', () => {
 for (const [content, expected] of [['8:00 P-M', '20:00'], ['2 P M', '14:00'], ['eight p.m.', '20:00'], ['8:00 A-M', '08:00']]) {
  const spans = candidateSpans([{ role: 'user', content, id: 'speech', at: reference }]);
  const times = spans.filter(span => span.kind === 'time');
  expect(times).toHaveLength(1);
  expect(times[0].normalized).toBe(expected);
  expect(content.slice(times[0].start, times[0].end)).toBe(times[0].text);
 }
});
test('literal candidates retain exact offsets and source identity while normalizing explicit values', () => {
 const content = 'Tomorrow at 2 pm London time for 30 minutes; call +44 7738 001345; see https://example.com/book. Reference ABC-123.';
 const spans = candidateSpans([{ role: 'user', content, id: 'utterance-1', at: reference }]);
 for (const span of spans) { expect(content.slice(span.start, span.end)).toBe(span.text); expect(span.turnId).toBe('utterance-1'); expect(span.at).toBe(reference); }
 expect(spans.find(span => span.kind === 'time')?.normalized).toBe('14:00');
 expect(spans.find(span => span.kind === 'zone')?.normalized).toBe('Europe/London');
 expect(spans.find(span => span.kind === 'phone')?.normalized).toBe('+447738001345');
 expect(spans.find(span => span.kind === 'reference')?.normalized).toBe('ABC-123');
});
test('tomorrow uses the reference utterance in the agreed timezone across midnight', () => {
 expect(resolveDate(date(), 'Europe/London')).toBe('2026-10-26');
 expect(resolveDate(date(), 'Pacific/Auckland')).toBe('2026-10-27');
});
test('weekday rules distinguish bare, this and next in Monday-based calendar weeks', () => {
 const values = { anchor: 'weekday', weekday: 'w1', referenceInstant: Date.parse('2026-10-27T12:00:00Z') };
 expect(resolveDate(date({ ...values, week: 'bare' }), 'Europe/London')).toBe('2026-11-02');
 expect(resolveDate(date({ ...values, week: 'this' }), 'Europe/London')).toBe('2026-10-26');
 expect(resolveDate(date({ ...values, week: 'next' }), 'Europe/London')).toBe('2026-11-02');
});
test('calendar arithmetic rejects impossible dates and finds the next valid leap day', () => {
 expect(() => resolveDate(date({ mode: 'absolute', month: 'm2', day: 'd30', year: 'y2027' }), 'Europe/London')).toThrow('does not exist');
 expect(resolveDate(date({ mode: 'absolute', month: 'm2', day: 'd29' }), 'Europe/London')).toBe('2028-02-29');
});
test('a correction cannot silently retain an unresolved field that Jev marked as changed', () => {
 expect(() => groundedBooking({ time: '02:00', location: 'New office' }, { referenceInstant: reference, spans: [], selected: {}, correctionFields: ['time', 'location'], date: date({ mode: 'absent' }) }, true, { timeZone: 'Europe/London', time: '20:00' })).toThrow('unambiguous appointment time');
});
