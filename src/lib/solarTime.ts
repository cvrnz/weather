// Solar time is the time told by the sun: 12:00 is when the sun is highest in the sky.
// Clock time is set by time zones, so the two can differ by an hour or more.

/**
 * Equation of time in minutes for a date: how far the sun runs ahead of (+)
 * or behind (−) a perfectly even clock, because Earth's orbit is elliptical
 * and its axis is tilted. Varies through the year by about ±16 minutes.
 */
export const equationOfTime = (date: Date): number => {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / 86_400_000);
  const b = ((2 * Math.PI) / 365) * (dayOfYear - 81);
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
};

/** Minutes solar time at this longitude runs ahead of UTC (4 minutes per degree east). */
export const solarOffsetMinutes = (date: Date, longitude: number): number => longitude * 4 + equationOfTime(date);

/** A Date whose UTC fields read the solar time at this longitude. */
export const toSolarTime = (date: Date, longitude: number): Date =>
  new Date(date.getTime() + solarOffsetMinutes(date, longitude) * 60_000);

/**
 * Minutes solar time runs ahead of the local clock, given the place's UTC
 * offset. Negative means the sun is behind the clock (solar noon after 12:00).
 */
export const solarMinusClockMinutes = (date: Date, longitude: number, utcOffsetSeconds: number): number =>
  solarOffsetMinutes(date, longitude) - utcOffsetSeconds / 60;
