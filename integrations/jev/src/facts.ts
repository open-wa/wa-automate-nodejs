import { z } from '@open-wa/plugin-sdk';
import type { ChatTurn } from './provider';

export const bookingFields = ['date', 'time', 'timeZone', 'durationMinutes', 'utcOffset', 'location', 'url', 'managementUrl', 'phoneNumber', 'email', 'description'] as const;
export type BookingField = typeof bookingFields[number];
export type SpanKind = 'time' | 'phone' | 'url' | 'email' | 'reference' | 'offset' | 'duration' | 'zone';
export type SourceSpan = { id: string; kind: SpanKind; text: string; turnId: string; at: number; start: number; end: number; context: string; normalized?: string };
export type DateDecision = { mode: 'absolute' | 'relative' | 'absent'; month: string; day: string; year: string; anchor: string; weekday: string; week: string; turnId: string; sourceText?: string; referenceInstant: number };
export type GroundedFacts = { spans: SourceSpan[]; selected: Record<string, SourceSpan | undefined>; correctionFields: BookingField[]; date: DateDecision; referenceInstant: number };

const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
function timeValue(text: string): string | undefined {
  if (/^noon$/i.test(text)) return '12:00';
  if (/^midnight$/i.test(text)) return '00:00';
  const match = /^(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?::([0-5]\d))?\s*([ap][.\s-]*m\.?)?$/i.exec(text);
  if (!match) return;
  let hour = /^\d/.test(match[1]) ? Number(match[1]) : numberWords.indexOf(match[1].toLowerCase());
  const suffix = match[3]?.replace(/[.\s-]/g, '').toLowerCase();
  if (suffix && (hour < 1 || hour > 12) || hour > 23) return;
  // A bare twelve-hour clock value has two interpretations, so do not guess.
  if (!suffix && !match[2] && hour <= 12) return;
  if (suffix) hour = hour % 12 + (suffix === 'pm' ? 12 : 0);
  return `${String(hour).padStart(2, '0')}:${match[2] ?? '00'}`;
}
/** Recognizable literal values only; no generative completion of missing digits. */
export function candidateSpans(turns: ChatTurn[]): SourceSpan[] {
  const spans: SourceSpan[] = [];
  const zoneNames = new Map<string, string[]>();
  for (const zone of Intl.supportedValuesOf('timeZone')) {
    const city = zone.split('/').at(-1)!.replaceAll('_', ' ').toLowerCase();
    zoneNames.set(city, [...(zoneNames.get(city) ?? []), zone]);
  }
  const zoneValue = (text: string): string | undefined => {
    if (/^(?:utc|gmt)$/i.test(text)) return 'Etc/UTC';
    if (text.includes('/')) { try { return new Intl.DateTimeFormat('en', { timeZone: text }).resolvedOptions().timeZone; } catch { return; } }
    const city = text.replace(/\s+(?:time|timezone)$/i, '').replace(/^time in\s+/i, '').toLowerCase();
    const candidates = zoneNames.get(city); return candidates?.length === 1 ? candidates[0] : undefined;
  };
  const cityPattern = [...zoneNames.keys()].map(city => city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|');
  const patterns: Array<[SpanKind, RegExp, (text: string) => string | undefined]> = [
    ['zone', /\b[A-Za-z_]+\/[A-Za-z_+\/-]+\b/g, zoneValue],
    ['zone', /\b(?:UTC|GMT)\b/gi, zoneValue],
    ['zone', new RegExp(`\\b(?:(?:${cityPattern})\\s+(?:time|timezone)|time in\\s+(?:${cityPattern}))\\b`, 'gi'), zoneValue],
    ['url', /https?:\/\/[^\s<>"\]]+/gi, text => text.replace(/[.,;!?)]*$/, '')],
    ['email', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, text => text],
    ['phone', /(?<![\w:])\+?\d[\d ()-]{5,}\d(?![\w:])/g, text => { const value = text.replace(/[ ()-]/g, ''); return /^\+?\d{7,15}$/.test(value) && !/^\d{4}-\d{2}-\d{2}$/.test(text) ? value : undefined; }],
    ['time', /\b(?:\d{1,2}(?::[0-5]\d)?\s*[ap][.\s-]*m\.?|\d{1,2}:[0-5]\d|(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*[ap][.\s-]*m\.?|noon|midnight)\b/gi, timeValue],
    ['offset', /(?<!\d)[+-](?:[01]\d|2[0-3]):[0-5]\d\b/g, text => text],
    ['duration', /\b\d+\s*(?:minutes?|mins?|hours?|hrs?)\b/gi, text => { const value = Number.parseInt(text) * (/hours?|hrs?/i.test(text) ? 60 : 1); return value > 0 ? String(value) : undefined; }],
    ['reference', /\b(?:reference|ref|booking\s*(?:id|number)|order\s*(?:id|number))\s*[:#]?\s*([A-Z0-9][A-Z0-9_-]{2,})\b/gi, text => text],
  ];
  for (const [index, turn] of turns.entries()) {
    if (turn.role !== 'user') continue;
    for (const [kind, pattern, normalize] of patterns) for (const match of turn.content.matchAll(pattern)) {
      const text = kind === 'reference' ? match[1] : match[0];
      const start = match.index! + (kind === 'reference' ? match[0].lastIndexOf(text) : 0);
      const normalized = normalize(text);
      if (kind !== 'time' && normalized === undefined) continue;
      spans.push({ id: `s${spans.length}`, kind, text, turnId: turn.id ?? `turn-${index}`, at: turn.at ?? 0, start, end: start + text.length, context: turn.content.slice(Math.max(0, start - 100), start + text.length + 100), normalized });
    }
  }
  return spans;
}
const problem = (message: string, field = 'date') => new z.ZodError([{ code: 'custom', path: ['booking', field], message }]);
const civil = (instant: number, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant);
  return Object.fromEntries(parts.map(part => [part.type, part.value]));
};
/** Calendar dates are calculated in the agreed zone, never the host machine zone. */
export function resolveDate(decision: DateDecision, timeZone: string): string | undefined {
  if (decision.mode === 'absent') return;
  if (!decision.turnId) throw problem('Please specify the appointment date.');
  const local = civil(decision.referenceInstant, timeZone);
  const reference = new Date(Date.UTC(Number(local.year), Number(local.month) - 1, Number(local.day)));
  let result: Date;
  if (decision.mode === 'relative') {
    const offsets: Record<string, number> = { today: 0, tomorrow: 1, day_after: 2 };
    let offset = offsets[decision.anchor];
    if (decision.anchor === 'weekday') {
      if (decision.weekday === 'absent') throw problem('Which weekday is the appointment?');
      const weekday = Number(decision.weekday.slice(1));
      const mondayOffset = (reference.getUTCDay() + 6) % 7;
      offset = decision.week === 'this' || decision.week === 'next'
        ? -mondayOffset + (weekday + 6) % 7 + (decision.week === 'next' ? 7 : 0)
        : (weekday - reference.getUTCDay() + 7) % 7;
    }
    if (offset === undefined) throw problem('Please specify the appointment date.');
    result = new Date(reference); result.setUTCDate(result.getUTCDate() + offset);
  } else {
    if (decision.month === 'absent' || decision.day === 'absent') throw problem('Please specify the appointment month and day.');
    const month = Number(decision.month.slice(1)), day = Number(decision.day.slice(1));
    let year = decision.year === 'absent' ? reference.getUTCFullYear() : Number(decision.year.slice(1));
    const valid = (value: Date) => value.getUTCMonth() === month - 1 && value.getUTCDate() === day;
    if (!valid(new Date(Date.UTC(2000, month - 1, day)))) throw problem('That calendar date does not exist. Please clarify the date.');
    result = new Date(Date.UTC(year, month - 1, day));
    if (decision.year === 'absent') while (!valid(result) || result < reference) { year++; result = new Date(Date.UTC(year, month - 1, day)); }
    if (!valid(result)) throw problem('That calendar date does not exist in the supplied year. Please clarify the date.');
  }
  return result.toISOString().slice(0, 10);
}
export function groundedBooking(input: Record<string, unknown>, facts: GroundedFacts, correction: boolean, previous?: Record<string, unknown>, agreedZone?: string) {
  const output: Record<string, unknown> = correction ? Object.fromEntries(Object.entries(input).filter(([key]) => facts.correctionFields.includes(key as BookingField))) : { ...input };
  const permitted = (key: BookingField) => !correction || facts.correctionFields.includes(key);
  const selectedZone = facts.selected.timeZone?.normalized;
  const zone = permitted('timeZone') ? selectedZone ?? (correction ? undefined : agreedZone) : previous?.timeZone ?? agreedZone;
  if (!zone || typeof zone !== 'string') throw problem('Please specify the appointment timezone.', 'timeZone');
  if (permitted('timeZone')) output.timeZone = zone;
  if (permitted('date')) {
    const date = resolveDate(facts.date, zone);
    if (date) output.date = date;
    else throw problem('Please specify the appointment date.');
  }
  const roles: Array<[BookingField, string]> = [['time', 'time'], ['phoneNumber', 'phone'], ['url', 'url'], ['managementUrl', 'managementUrl'], ['email', 'email'], ['utcOffset', 'offset'], ['durationMinutes', 'duration']];
  for (const [field, role] of roles) {
    if (!permitted(field)) continue;
    const span = facts.selected[role];
    if (span?.normalized !== undefined) output[field] = field === 'durationMinutes' ? Number(span.normalized) : span.normalized;
    else {
      delete output[field];
      if (correction && field !== 'time') throw problem(`Please clarify the corrected ${field}.`, field);
      if (field === 'time') throw problem('Please specify an unambiguous appointment time, including am or pm.', 'time');
    }
  }
  if (correction && !Object.keys(output).length) throw problem('Please clarify which booking detail should change.');
  return output;
}
/** Copy the selected reference before compiling a template into message text. */
export function copyLiteralReferences(value: unknown, facts: GroundedFacts): void {
  if (!value || typeof value !== 'object') return;
  const labelled = value as { label?: unknown; value?: unknown };
  if (typeof labelled.label === 'string' && /\b(?:reference|ref|booking id|order id)\b/i.test(labelled.label) && typeof labelled.value === 'string' && facts.selected.reference?.normalized) labelled.value = facts.selected.reference.normalized;
  for (const entry of Object.values(value)) if (entry && typeof entry === 'object') copyLiteralReferences(entry, facts);
}
/** Exact destinations and references in generated controls must have a source. */
export function assertLiteralDestinations(value: unknown, facts: GroundedFacts): void {
  if (!value || typeof value !== 'object') return;
  const labelled = value as { label?: unknown; value?: unknown };
  if (typeof labelled.label === 'string' && /\b(?:reference|ref|booking id|order id)\b/i.test(labelled.label) && typeof labelled.value === 'string') {
    const reference = facts.selected.reference;
    if (!reference?.normalized) throw problem('No booking or order reference was supplied.', 'reference');
    labelled.value = reference.normalized;
  }
  for (const [key, entry] of Object.entries(value)) {
    const kind = /^(?:url|href|managementUrl)$/i.test(key) ? 'url' : /^(?:phoneNumber|phone)$/i.test(key) ? 'phone' : /^email$/i.test(key) ? 'email' : /^(?:reference|referenceId)$/i.test(key) ? 'reference' : undefined;
    if (kind && typeof entry === 'string' && !facts.spans.some(span => span.kind === kind && (entry === span.text || entry === span.normalized))) throw problem(`The ${key} must be copied from a supplied value. Ask for it or omit it when optional.`, key);
    if (entry && typeof entry === 'object') assertLiteralDestinations(entry, facts);
  }
}
