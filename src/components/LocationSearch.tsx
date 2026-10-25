import {SearchField, Spinner} from '@heroui/react';
import {MapPin} from 'lucide-react';
import {type KeyboardEvent, useEffect, useRef, useState} from 'react';
import {type Place, searchPlaces} from '../lib/weather';

/** Search box for a city; matching places appear below as you type. */
export const LocationSearch = ({onSelect}: {onSelect: (place: Place) => void}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    // Wait for a pause in typing before searching.
    const timer = setTimeout(() => {
      searchPlaces(trimmed, controller.signal)
        .then(places => {
          setResults(places);
          setHighlighted(0);
          setLoading(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!(event.target instanceof Node && rootRef.current?.contains(event.target))) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [open]);

  const choose = (place: Place) => {
    onSelect(place);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setHighlighted(index => (index + step + results.length) % results.length);
    }
  };

  const showList = open && query.trim().length >= 2;

  return (
    <div
      ref={rootRef}
      className='relative'
      onKeyDown={handleKeyDown}
    >
      <SearchField
        aria-label='Search for a city'
        value={query}
        onChange={value => {
          setQuery(value);
          setOpen(true);
        }}
        onSubmit={() => {
          if (results[highlighted]) choose(results[highlighted]);
        }}
        fullWidth
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder='Search for a city' />
          {loading ? <Spinner size='sm' /> : <SearchField.ClearButton />}
        </SearchField.Group>
      </SearchField>
      {showList && (
        <ul
          role='listbox'
          aria-label='Matching places'
          className='absolute left-0 right-0 top-full z-20 mt-1 rounded border border-border bg-overlay py-1 shadow-lg'
        >
          {results.length === 0 && !loading ? (
            <li className='px-3 py-2 text-sm text-muted'>No places found</li>
          ) : (
            results.map((place, index) => (
              <li
                key={`${place.latitude},${place.longitude}`}
                role='option'
                aria-selected={index === highlighted}
              >
                <button
                  type='button'
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                    index === highlighted ? 'bg-default' : ''
                  }`}
                  onPointerEnter={() => setHighlighted(index)}
                  onClick={() => choose(place)}
                >
                  <MapPin
                    size={14}
                    className='shrink-0 text-muted'
                  />
                  <span className='truncate'>
                    {place.name}
                    {place.region && <span className='text-muted'> · {place.region}</span>}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
