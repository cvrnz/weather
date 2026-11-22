import {Button, Spinner, ToggleButton, ToggleButtonGroup} from '@heroui/react';
import {LocateFixed, RefreshCw} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {CurrentConditions} from './components/CurrentConditions';
import {DailyForecast} from './components/DailyForecast';
import {HourlyForecast} from './components/HourlyForecast';
import {LocationSearch} from './components/LocationSearch';
import {SolarTime} from './components/SolarTime';
import {useNow, useStoredState} from './lib/hooks';
import {formatDate, placeNow} from './lib/time';
import {fetchForecast, type Forecast, nameForCoordinates, type Place, type Units} from './lib/weather';
import {SsoAccount} from './lib/SsoAccount';

/** Refetch the forecast this often while the page is open. */
const REFRESH_MS = 15 * 60_000;

interface SavedPlace {
  place: Place;
  /** Came from the device's location, so it's looked up again on the next visit. */
  fromDevice: boolean;
}

const placeKey = (place: Place) => `${place.latitude},${place.longitude}`;

const defaultUnits = (): Units => (/^en-(US|LR|MM)$/.test(navigator.language) ? 'imperial' : 'metric');

export const App = () => {
  const [units, setUnits] = useStoredState<Units>('weather-units', defaultUnits);
  const [saved, setSaved] = useStoredState<SavedPlace | null>('weather-place', () => null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<{key: string; data: Forecast; fetchedAt: number} | null>(null);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const place = saved?.place ?? null;

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocateError('Location isn’t available on this device. Search for a city instead.');
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      async position => {
        const found = await nameForCoordinates(position.coords.latitude, position.coords.longitude);
        setSaved({place: found, fromDevice: true});
        setLocating(false);
      },
      error => {
        setLocating(false);
        setLocateError(
          error.code === error.PERMISSION_DENIED
            ? 'Location access is off. Search for a city instead.'
            : 'Couldn’t find your location. Search for a city instead.',
        );
      },
      {timeout: 10_000, maximumAge: 5 * 60_000},
    );
  }, [setSaved]);

  // On load, use the device's location unless the last place was one the user searched for.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (!saved || saved.fromDevice) locate();
  }, [saved, locate]);

  useEffect(() => {
    if (!place) return;
    const controller = new AbortController();
    setForecastError(null);
    fetchForecast(place, units, controller.signal)
      .then(data => setForecast({key: placeKey(place), data, fetchedAt: Date.now()}))
      .catch(() => {
        if (!controller.signal.aborted) setForecastError('Couldn’t load the forecast. Check your connection.');
      });
    return () => controller.abort();
    // The place's coordinates are what matter, not the object's identity.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.latitude, place?.longitude, units, reloadCount]);

  // Keep the forecast fresh: on a timer, and when coming back to a tab left open.
  const fetchedAtRef = useRef(0);
  fetchedAtRef.current = forecast?.fetchedAt ?? 0;
  useEffect(() => {
    const reloadIfStale = () => {
      if (document.visibilityState === 'visible' && Date.now() - fetchedAtRef.current > REFRESH_MS) {
        setReloadCount(count => count + 1);
      }
    };
    const timer = setInterval(reloadIfStale, 60_000);
    document.addEventListener('visibilitychange', reloadIfStale);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', reloadIfStale);
    };
  }, []);

  // Data for another place is never shown under this place's name.
  const data = place && forecast?.key === placeKey(place) ? forecast.data : null;
  const now = useNow(60_000);

  return (
    <div className='mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6'>
      <header className='flex flex-wrap items-center gap-x-3 gap-y-3'>
        <div className='min-w-0 flex-1'>
          <h1 className='truncate text-2xl font-semibold'>{place?.name ?? 'Weather'}</h1>
          <p className='truncate text-sm text-muted'>
            {[place?.region, data && formatDate(placeNow(now, data.utcOffsetSeconds))].filter(Boolean).join(' · ') ||
              ' '}
          </p>
        </div>
        <SsoAccount />
        <div className='order-last w-full sm:order-none sm:w-72'>
          <LocationSearch onSelect={found => setSaved({place: found, fromDevice: false})} />
        </div>
        <Button
          isIconOnly
          variant='ghost'
          aria-label='Use my location'
          onPress={locate}
          isPending={locating}
        >
          <LocateFixed size={18} />
        </Button>
        <ToggleButtonGroup
          aria-label='Units'
          size='sm'
          selectionMode='single'
          disallowEmptySelection
          selectedKeys={[units]}
          onSelectionChange={keys => {
            const [next] = keys;
            if (next === 'imperial' || next === 'metric') setUnits(next);
          }}
        >
          <ToggleButton id='imperial'>°F</ToggleButton>
          <ToggleButton id='metric'>°C</ToggleButton>
        </ToggleButtonGroup>
      </header>

      {locateError && !place && <p className='text-sm text-muted'>{locateError}</p>}

      {!place ? (
        <div className='flex flex-col items-center gap-3 py-24 text-center text-muted'>
          {locating ? (
            <>
              <Spinner />
              <p className='text-sm'>Finding your location…</p>
            </>
          ) : (
            <p className='text-sm'>Search for a city to see its weather and solar time.</p>
          )}
        </div>
      ) : forecastError && !data ? (
        <div className='flex flex-col items-center gap-3 py-24 text-center'>
          <p className='text-sm text-muted'>{forecastError}</p>
          <Button
            variant='secondary'
            onPress={() => setReloadCount(count => count + 1)}
          >
            <RefreshCw size={16} />
            Try again
          </Button>
        </div>
      ) : !data ? (
        <div className='flex justify-center py-24'>
          <Spinner />
        </div>
      ) : (
        <>
          <div className='grid gap-4 md:grid-cols-2'>
            <CurrentConditions forecast={data} />
            <SolarTime
              place={place}
              forecast={data}
            />
          </div>
          <HourlyForecast forecast={data} />
          <DailyForecast forecast={data} />
          <p className='text-center text-xs text-muted'>
            Weather data by{' '}
            <a
              href='https://open-meteo.com/'
              className='underline hover:text-(--foreground)'
              target='_blank'
              rel='noreferrer'
            >
              Open-Meteo
            </a>
          </p>
        </>
      )}
    </div>
  );
};
