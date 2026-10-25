import {Card} from '@heroui/react';
import {formatHour, parseLocal} from '../lib/time';
import type {Forecast} from '../lib/weather';
import {describeWeather} from '../lib/weatherCodes';

export const HourlyForecast = ({forecast}: {forecast: Forecast}) => (
  <Card>
    <Card.Header>
      <Card.Title className='text-sm font-medium text-muted'>Next 24 hours</Card.Title>
    </Card.Header>
    <Card.Content>
      <ol className='flex gap-1 overflow-x-auto pb-2 -mx-1 [scrollbar-width:thin]'>
        {forecast.hourly.map((hour, i) => {
          const {label, Icon} = describeWeather(hour.weatherCode, hour.isDay);
          return (
            <li
              key={hour.time}
              className='flex flex-col items-center gap-1.5 min-w-14 px-1 py-1'
            >
              <span className='text-xs text-muted whitespace-nowrap'>
                {i === 0 ? 'Now' : formatHour(parseLocal(hour.time))}
              </span>
              <Icon
                size={22}
                strokeWidth={1.5}
                aria-label={label}
              />
              <span className='text-sm tabular-nums'>{Math.round(hour.temperature)}°</span>
              <span className='text-xs tabular-nums text-accent h-4'>
                {hour.precipitationChance >= 10 ? `${Math.round(hour.precipitationChance)}%` : ''}
              </span>
            </li>
          );
        })}
      </ol>
    </Card.Content>
  </Card>
);
