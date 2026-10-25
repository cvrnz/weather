import {Card} from '@heroui/react';
import {Droplets, Thermometer, Umbrella, Wind} from 'lucide-react';
import type {ReactNode} from 'react';
import {compassPoint, type Forecast} from '../lib/weather';
import {describeWeather} from '../lib/weatherCodes';

const Detail = ({icon, label, value}: {icon: ReactNode; label: string; value: string}) => (
  <div className='flex items-center gap-2.5'>
    <span className='text-muted'>{icon}</span>
    <div className='min-w-0'>
      <p className='text-xs text-muted'>{label}</p>
      <p className='text-sm tabular-nums'>{value}</p>
    </div>
  </div>
);

const degrees = (value: number) => `${Math.round(value)}°`;

export const CurrentConditions = ({forecast}: {forecast: Forecast}) => {
  const {current, daily, units} = forecast;
  const {label, Icon} = describeWeather(current.weatherCode, current.isDay);
  const today = daily[0];

  return (
    <Card className='h-full'>
      <Card.Header>
        <Card.Title className='text-sm font-medium text-muted'>Now</Card.Title>
      </Card.Header>
      <Card.Content className='flex flex-col gap-5'>
        <div className='flex items-center gap-4'>
          <Icon
            className='size-16 shrink-0 text-accent'
            strokeWidth={1.25}
            aria-hidden
          />
          <div>
            <p className='text-5xl font-light tabular-nums tracking-tight'>
              {degrees(current.temperature)}
              <span className='text-2xl text-muted'>{units.temperature.replace('°', '')}</span>
            </p>
            <p className='text-sm'>{label}</p>
          </div>
        </div>
        <p className='text-sm text-muted'>
          High {degrees(today.max)} · Low {degrees(today.min)}
        </p>
        <div className='grid grid-cols-2 gap-4'>
          <Detail
            icon={<Thermometer size={18} />}
            label='Feels like'
            value={degrees(current.apparentTemperature)}
          />
          <Detail
            icon={<Wind size={18} />}
            label='Wind'
            value={`${Math.round(current.windSpeed)} ${units.windSpeed} ${compassPoint(current.windDirection)}`}
          />
          <Detail
            icon={<Droplets size={18} />}
            label='Humidity'
            value={`${Math.round(current.humidity)}%`}
          />
          <Detail
            icon={<Umbrella size={18} />}
            label='Chance of rain today'
            value={`${Math.round(today.precipitationChance)}%`}
          />
        </div>
      </Card.Content>
    </Card>
  );
};
