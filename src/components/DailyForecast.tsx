import {Card} from '@heroui/react';
import {formatWeekday, parseLocal} from '../lib/time';
import type {Forecast} from '../lib/weather';
import {describeWeather} from '../lib/weatherCodes';

export const DailyForecast = ({forecast}: {forecast: Forecast}) => {
  const {daily} = forecast;
  // Each day's bar spans its low to high, on a scale shared by the whole week.
  const weekMin = Math.min(...daily.map(day => day.min));
  const weekMax = Math.max(...daily.map(day => day.max));
  const span = Math.max(1, weekMax - weekMin);

  return (
    <Card>
      <Card.Header>
        <Card.Title className='text-sm font-medium text-muted'>7 days</Card.Title>
      </Card.Header>
      <Card.Content>
        <ol className='divide-y divide-(--separator)'>
          {daily.map((day, i) => {
            const {label, Icon} = describeWeather(day.weatherCode);
            return (
              <li
                key={day.date}
                className='grid grid-cols-[3.5rem_1.75rem_2.75rem_2.5rem_1fr_2.5rem] items-center gap-2 py-2'
              >
                <span className='text-sm'>{i === 0 ? 'Today' : formatWeekday(parseLocal(day.date))}</span>
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  aria-label={label}
                  className='justify-self-center'
                />
                <span className='text-xs tabular-nums text-accent'>
                  {day.precipitationChance >= 10 ? `${Math.round(day.precipitationChance)}%` : ''}
                </span>
                <span className='text-sm tabular-nums text-muted text-right'>{Math.round(day.min)}°</span>
                <span className='relative h-1.5 rounded-full bg-default'>
                  <span
                    className='absolute inset-y-0 rounded-full bg-linear-to-r from-accent to-warning'
                    style={{
                      left: `${((day.min - weekMin) / span) * 100}%`,
                      right: `${((weekMax - day.max) / span) * 100}%`,
                    }}
                  />
                </span>
                <span className='text-sm tabular-nums'>{Math.round(day.max)}°</span>
              </li>
            );
          })}
        </ol>
      </Card.Content>
    </Card>
  );
};
