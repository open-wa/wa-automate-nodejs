import { z } from '@open-wa/plugin-sdk';

const invalid = (field: string, message: string): never => { throw new z.ZodError([{ code: 'custom', path: ['booking', field], message }]); };

/** Convert civil appointment time using the timezone rules on that date, not today's offset. */
export function bookingInstant(date: string, time: string, timeZone: string, utcOffset?: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let formatter: Intl.DateTimeFormat;
  try { formatter = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }); }
  catch { return invalid('timeZone', 'Use a valid IANA timezone such as Europe/London.'); }
  const offsetAt = (instant: number) => {
    const parts = Object.fromEntries(formatter.formatToParts(instant).map(part => [part.type, part.value]));
    return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second)) - instant;
  };
  // Both sides of a possible DST transition are needed to detect repeated or missing times.
  const offsets = new Set([-86_400_000, 0, 86_400_000].map(delta => offsetAt(target + delta)));
  let candidates = [...offsets].map(offset => target - offset).filter(instant => instant + offsetAt(instant) === target);
  if (!candidates.length) return invalid('time', 'This local time does not exist because the clocks change. Ask for a different time.');
  if (utcOffset) {
    const minutes = (Number(utcOffset.slice(1, 3)) * 60 + Number(utcOffset.slice(4))) * (utcOffset.startsWith('-') ? -1 : 1);
    candidates = candidates.filter(instant => offsetAt(instant) === minutes * 60_000);
    if (!candidates.length) return invalid('utcOffset', 'That UTC offset does not match the timezone on this date.');
  }
  if (candidates.length !== 1) return invalid('time', 'This local time occurs twice because the clocks change. Ask which UTC offset applies and supply utcOffset.');
  return new Date(candidates[0]).toISOString();
}
