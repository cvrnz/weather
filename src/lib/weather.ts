export type Units = 'imperial' | 'metric';

export interface Place {
  name: string;
  /** State or country, shown after the name. */
  region?: string;
  latitude: number;
  longitude: number;
}

export interface Forecast {
  utcOffsetSeconds: number;
  timezone: string;
  units: {temperature: string; windSpeed: string; precipitation: string};
  current: {
    time: string;
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    precipitation: number;
    weatherCode: number;
    isDay: boolean;
  };
  hourly: {time: string; temperature: number; weatherCode: number; isDay: boolean; precipitationChance: number}[];
  daily: {
    date: string;
    weatherCode: number;
    max: number;
    min: number;
    sunrise: string;
    sunset: string;
    precipitationChance: number;
  }[];
}

interface ForecastResponse {
  utc_offset_seconds: number;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    precipitation: number;
    weather_code: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    is_day: number[];
    precipitation_probability: (number | null)[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max: (number | null)[];
  };
}

const getJson = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(url, {signal});
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return (await response.json()) as T;
};

/** Current conditions, the next 24 hours and 7 days, from Open-Meteo (free, no key). */
export const fetchForecast = async (place: Place, units: Units, signal?: AbortSignal): Promise<Forecast> => {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    timezone: 'auto',
    forecast_days: '7',
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'precipitation',
      'weather_code',
      'is_day',
    ].join(','),
    hourly: 'temperature_2m,weather_code,is_day,precipitation_probability',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max',
    temperature_unit: units === 'imperial' ? 'fahrenheit' : 'celsius',
    wind_speed_unit: units === 'imperial' ? 'mph' : 'kmh',
    precipitation_unit: units === 'imperial' ? 'inch' : 'mm',
  });
  const data = await getJson<ForecastResponse>(`https://api.open-meteo.com/v1/forecast?${params}`, signal);

  // Hourly data starts at local midnight; keep the 24 hours from the current one.
  const currentHour = `${data.current.time.slice(0, 13)}:00`;
  const start = Math.max(0, data.hourly.time.indexOf(currentHour));
  const hourly = data.hourly.time.slice(start, start + 24).map((time, offset) => {
    const i = start + offset;
    return {
      time,
      temperature: data.hourly.temperature_2m[i],
      weatherCode: data.hourly.weather_code[i],
      isDay: data.hourly.is_day[i] === 1,
      precipitationChance: data.hourly.precipitation_probability[i] ?? 0,
    };
  });

  return {
    utcOffsetSeconds: data.utc_offset_seconds,
    timezone: data.timezone,
    // Open-Meteo's own labels read "mp/h", so name the units here.
    units:
      units === 'imperial'
        ? {temperature: '°F', windSpeed: 'mph', precipitation: 'in'}
        : {temperature: '°C', windSpeed: 'km/h', precipitation: 'mm'},
    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
    },
    hourly,
    daily: data.daily.time.map((date, i) => ({
      date,
      weatherCode: data.daily.weather_code[i],
      max: data.daily.temperature_2m_max[i],
      min: data.daily.temperature_2m_min[i],
      sunrise: data.daily.sunrise[i],
      sunset: data.daily.sunset[i],
      precipitationChance: data.daily.precipitation_probability_max[i] ?? 0,
    })),
  };
};

interface GeocodingResponse {
  results?: {name: string; latitude: number; longitude: number; admin1?: string; country?: string}[];
}

/** Places matching a name, from Open-Meteo's geocoding API. */
export const searchPlaces = async (query: string, signal?: AbortSignal): Promise<Place[]> => {
  const params = new URLSearchParams({name: query, count: '6', language: 'en', format: 'json'});
  const data = await getJson<GeocodingResponse>(`https://geocoding-api.open-meteo.com/v1/search?${params}`, signal);
  return (data.results ?? []).map(result => ({
    name: result.name,
    region: [result.admin1, result.country].filter(Boolean).join(', ') || undefined,
    latitude: result.latitude,
    longitude: result.longitude,
  }));
};

interface ReverseGeocodeResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
}

/** A name for coordinates (Open-Meteo has no reverse lookup). Falls back to "Current location". */
export const nameForCoordinates = async (latitude: number, longitude: number): Promise<Place> => {
  const place: Place = {name: 'Current location', latitude, longitude};
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: 'en',
    });
    const data = await getJson<ReverseGeocodeResponse>(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`,
    );
    const name = data.city || data.locality;
    if (name) return {...place, name, region: data.principalSubdivision || data.countryName};
  } catch {
    /* Keep the generic name */
  }
  return place;
};

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** "NW" for a wind direction in degrees (the direction the wind comes from). */
export const compassPoint = (degrees: number): string => COMPASS[Math.round(degrees / 45) % 8];
