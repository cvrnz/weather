// Open-Meteo returns times in the place's own time zone, without an offset
// ("2026-10-25T07:25"). These helpers keep such times as Dates whose UTC
// fields read the place's clock, and format them with timeZone 'UTC'.

/** Parse a zone-less Open-Meteo time so its UTC fields read the local clock. */
export const parseLocal = (value: string): Date => new Date(`${value.length === 10 ? `${value}T00:00` : value}Z`);

/** The current time at a place, as a Date whose UTC fields read its clock. */
export const placeNow = (now: Date, utcOffsetSeconds: number): Date =>
  new Date(now.getTime() + utcOffsetSeconds * 1000);

const clockFormat = new Intl.DateTimeFormat(undefined, {hour: 'numeric', minute: '2-digit', timeZone: 'UTC'});
const hourFormat = new Intl.DateTimeFormat(undefined, {hour: 'numeric', timeZone: 'UTC'});
const weekdayFormat = new Intl.DateTimeFormat(undefined, {weekday: 'short', timeZone: 'UTC'});
const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

/** "7:25 AM" (or "07:25" where the locale uses a 24-hour clock). */
export const formatClock = (date: Date): string => clockFormat.format(date);
export const formatHour = (date: Date): string => hourFormat.format(date);
export const formatWeekday = (date: Date): string => weekdayFormat.format(date);
export const formatDate = (date: Date): string => dateFormat.format(date);

/** "11 h 19 min" */
export const formatDuration = (minutes: number): string => {
  const rounded = Math.round(Math.abs(minutes));
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};
