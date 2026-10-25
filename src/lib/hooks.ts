import {useEffect, useState} from 'react';

/** State saved in localStorage. Falls back to `initial()` when storage is empty, unreadable or blocked. */
export const useStoredState = <T>(key: string, initial: () => T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      /* Use the initial value */
    }
    return initial();
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Not saved; fine for this session */
    }
  }, [key, value]);
  return [value, setValue] as const;
};

/** The current time, updated every `intervalMs`, on the boundary so seconds tick in step with the clock. */
export const useNow = (intervalMs = 1000): Date => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(new Date());
      timer = setTimeout(tick, intervalMs - (Date.now() % intervalMs));
    };
    timer = setTimeout(tick, intervalMs - (Date.now() % intervalMs));
    return () => clearTimeout(timer);
  }, [intervalMs]);
  return now;
};
