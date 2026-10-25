import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  type LucideIcon,
  Moon,
  Snowflake,
  Sun,
} from 'lucide-react';

interface Condition {
  label: string;
  icon: LucideIcon;
  nightIcon?: LucideIcon;
}

// WMO weather interpretation codes, as used by Open-Meteo.
const CONDITIONS: Record<number, Condition> = {
  0: {label: 'Clear', icon: Sun, nightIcon: Moon},
  1: {label: 'Mostly clear', icon: Sun, nightIcon: Moon},
  2: {label: 'Partly cloudy', icon: CloudSun, nightIcon: CloudMoon},
  3: {label: 'Overcast', icon: Cloud},
  45: {label: 'Fog', icon: CloudFog},
  48: {label: 'Freezing fog', icon: CloudFog},
  51: {label: 'Light drizzle', icon: CloudDrizzle},
  53: {label: 'Drizzle', icon: CloudDrizzle},
  55: {label: 'Heavy drizzle', icon: CloudDrizzle},
  56: {label: 'Freezing drizzle', icon: CloudDrizzle},
  57: {label: 'Freezing drizzle', icon: CloudDrizzle},
  61: {label: 'Light rain', icon: CloudRain},
  63: {label: 'Rain', icon: CloudRain},
  65: {label: 'Heavy rain', icon: CloudRain},
  66: {label: 'Freezing rain', icon: CloudRain},
  67: {label: 'Freezing rain', icon: CloudRain},
  71: {label: 'Light snow', icon: CloudSnow},
  73: {label: 'Snow', icon: CloudSnow},
  75: {label: 'Heavy snow', icon: Snowflake},
  77: {label: 'Snow grains', icon: CloudSnow},
  80: {label: 'Light showers', icon: CloudRain},
  81: {label: 'Showers', icon: CloudRain},
  82: {label: 'Heavy showers', icon: CloudRain},
  85: {label: 'Snow showers', icon: CloudSnow},
  86: {label: 'Heavy snow showers', icon: CloudSnow},
  95: {label: 'Thunderstorm', icon: CloudLightning},
  96: {label: 'Thunderstorm with hail', icon: CloudHail},
  99: {label: 'Thunderstorm with hail', icon: CloudHail},
};

const UNKNOWN: Condition = {label: 'Unknown', icon: Cloud};

export const describeWeather = (code: number, isDay = true): {label: string; Icon: LucideIcon} => {
  const condition = CONDITIONS[code] ?? UNKNOWN;
  return {label: condition.label, Icon: !isDay && condition.nightIcon ? condition.nightIcon : condition.icon};
};
