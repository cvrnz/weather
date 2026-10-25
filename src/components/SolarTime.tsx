import {Card} from '@heroui/react';
import {useNow} from '../lib/hooks';
import {solarMinusClockMinutes, toSolarTime} from '../lib/solarTime';
import {formatClock, formatDuration, parseLocal, placeNow} from '../lib/time';
import type {Forecast, Place} from '../lib/weather';

const MINUTE = 60_000;

/** Where the sun is in today's sky, from 0 (sunrise) to 1 (sunset), clamped. */
const dayProgress = (now: Date, sunrise: Date, sunset: Date) =>
  Math.min(1, Math.max(0, (now.getTime() - sunrise.getTime()) / (sunset.getTime() - sunrise.getTime())));

/** A half circle from sunrise to sunset with the sun's current position on it. */
const SunArc = ({progress, isUp}: {progress: number; isUp: boolean}) => {
  const angle = Math.PI * (1 - progress);
  const x = 50 + 40 * Math.cos(angle);
  const y = 48 - 40 * Math.sin(angle);
  return (
    <svg
      viewBox='0 0 100 54'
      className='w-full max-w-56 mx-auto'
      aria-hidden
    >
      <path
        d='M10 48 A40 40 0 0 1 90 48'
        fill='none'
        stroke='var(--border)'
        strokeWidth='1.5'
        strokeDasharray='3 3'
      />
      <line
        x1='4'
        y1='48'
        x2='96'
        y2='48'
        stroke='var(--border)'
        strokeWidth='1'
      />
      {isUp && (
        <circle
          cx={x}
          cy={y}
          r='5'
          fill='var(--warning)'
        />
      )}
    </svg>
  );
};

const Row = ({label, value}: {label: string; value: string}) => (
  <div className='flex items-baseline justify-between gap-4 py-1.5'>
    <dt className='text-sm text-muted'>{label}</dt>
    <dd className='text-sm tabular-nums'>{value}</dd>
  </div>
);

/** True solar time at the place: 12:00 is when the sun is highest, whatever the clocks say. */
export const SolarTime = ({place, forecast}: {place: Place; forecast: Forecast}) => {
  const now = useNow(1000);
  const solar = toSolarTime(now, place.longitude);
  const clock = placeNow(now, forecast.utcOffsetSeconds);
  const difference = solarMinusClockMinutes(now, place.longitude, forecast.utcOffsetSeconds);

  // Solar noon is 12:00 solar time; on the clock it's shifted by the difference.
  const clockMidnight = Date.UTC(clock.getUTCFullYear(), clock.getUTCMonth(), clock.getUTCDate());
  const solarNoon = new Date(clockMidnight + 12 * 60 * MINUTE - difference * MINUTE);

  const today = forecast.daily[0];
  const sunrise = parseLocal(today.sunrise);
  const sunset = parseLocal(today.sunset);
  const isUp = clock >= sunrise && clock <= sunset;
  const daylight = (sunset.getTime() - sunrise.getTime()) / MINUTE;

  const relation =
    Math.abs(difference) < 1
      ? 'The sun is in step with the clock here.'
      : `The sun runs ${formatDuration(difference)} ${difference > 0 ? 'ahead of' : 'behind'} the clock here.`;

  return (
    <Card className='h-full'>
      <Card.Header>
        <Card.Title className='text-sm font-medium text-muted'>Solar time</Card.Title>
      </Card.Header>
      <Card.Content className='flex flex-col gap-3'>
        <div>
          <p className='text-5xl font-light tabular-nums tracking-tight'>{formatClock(solar)}</p>
          <p className='mt-1 text-sm text-muted'>{relation}</p>
        </div>
        <div>
          <SunArc
            progress={dayProgress(clock, sunrise, sunset)}
            isUp={isUp}
          />
          {!isUp && <p className='text-center text-xs text-muted'>The sun is below the horizon</p>}
        </div>
        <dl className='divide-y divide-(--separator)'>
          <Row
            label='Clock time'
            value={formatClock(clock)}
          />
          <Row
            label='Solar noon'
            value={formatClock(solarNoon)}
          />
          <Row
            label='Sunrise'
            value={formatClock(sunrise)}
          />
          <Row
            label='Sunset'
            value={formatClock(sunset)}
          />
          <Row
            label='Daylight'
            value={formatDuration(daylight)}
          />
        </dl>
      </Card.Content>
    </Card>
  );
};
