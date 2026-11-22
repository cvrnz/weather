# Weather

A simple weather app: current conditions, the next 24 hours, 7 days, and the
true solar time where you are.

Built with Vite, React, TypeScript and HeroUI, with the shadcn-blue
theme from [heroui-themes](https://github.com/cvrnz/heroui-themes) in `src/shadcn-blue.css`. Weather
comes from [Open-Meteo](https://open-meteo.com/), which is free and needs no
API key.

```sh
pnpm install
pnpm dev     # http://localhost:1777
pnpm build
```

## Solar time

Solar time is the time told by the sun: 12:00 is when the sun is highest in the
sky. Clocks follow time zones, so the two can be an hour or more apart. It's
computed from the place's longitude (4 minutes per degree) plus the equation of
time, which corrects for Earth's elliptical orbit and tilt (see
`src/lib/solarTime.ts`).

## Location

On first load the app asks for your location. If you search for a city instead,
it remembers that city. Use the location button to go back to where you are.
