import { useEffect, useState } from 'react';
import { useDebounce } from '~/hooks/use-debounce';

export type LocationPickerStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface LocationPrediction {
  id: string;
  /** Short display name shown in the input after selection (e.g. "Estadio Bernabéu") */
  shortName: string;
  /** Full description shown in the dropdown for disambiguation */
  description: string;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  placeId: string;
}

export interface SelectedLocation {
  shortName: string;
  description: string;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  placeId: string;
}

export interface UseLocationPickerReturn {
  query: string;
  setQuery: (value: string) => void;
  status: LocationPickerStatus;
  predictions: LocationPrediction[];
  selected: SelectedLocation | null;
  select: (prediction: LocationPrediction) => void;
  clear: () => void;
  clearPredictions: () => void;
}

interface PhotonProperties {
  osm_type: string;
  osm_id: number;
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: PhotonProperties;
}

interface PhotonResponse {
  features: PhotonFeature[];
}

function buildShortName(p: PhotonProperties): string {
  return p.name ?? p.street ?? p.city ?? p.country ?? '';
}

function buildDescription(p: PhotonProperties): string {
  return [p.name, p.street, p.city, p.state, p.country].filter(Boolean).join(', ');
}

function buildAddress(p: PhotonProperties): string {
  return [p.street, p.city, p.state, p.country].filter(Boolean).join(', ');
}

export function useLocationPicker(debounceMs = 300): UseLocationPickerReturn {
  const [query, setQueryRaw] = useState('');
  const [locked, setLocked] = useState(false);
  const [status, setStatus] = useState<LocationPickerStatus>('idle');
  const [predictions, setPredictions] = useState<LocationPrediction[]>([]);
  const [selected, setSelected] = useState<SelectedLocation | null>(null);

  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    if (locked || !debouncedQuery.trim()) {
      setStatus('idle');
      setPredictions([]);
      return;
    }

    const controller = new AbortController();
    setStatus('loading');

    fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(debouncedQuery)}&limit=5`,
      { signal: controller.signal },
    )
      .then((res) => res.json() as Promise<PhotonResponse>)
      .then((data) => {
        const seen = new Set<string>();
        const unique: LocationPrediction[] = [];
        for (const f of data.features) {
          const id = `${f.properties.osm_type}:${f.properties.osm_id}`;
          const description = buildDescription(f.properties);
          if (seen.has(id) || seen.has(description)) continue;
          seen.add(id);
          seen.add(description);
          unique.push({
            id,
            placeId: id,
            shortName: buildShortName(f.properties),
            description,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            address: buildAddress(f.properties),
            city: f.properties.city,
            state: f.properties.state,
            country: f.properties.country,
          });
        }
        setPredictions(unique);
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if ((err as Error).name !== 'AbortError') {
          setPredictions([]);
          setStatus('error');
        }
      });

    return () => controller.abort();
  }, [debouncedQuery, locked]);

  const setQuery = (value: string) => {
    setQueryRaw(value);
    if (locked) {
      setLocked(false);
      setSelected(null);
    }
  };

  const select = (prediction: LocationPrediction) => {
    setSelected({
      shortName: prediction.shortName,
      description: prediction.description,
      lat: prediction.lat,
      lng: prediction.lng,
      address: prediction.address,
      city: prediction.city,
      state: prediction.state,
      country: prediction.country,
      placeId: prediction.placeId,
    });
    setQueryRaw(prediction.shortName);
    setLocked(true);
    setPredictions([]);
    setStatus('idle');
  };

  const clear = () => {
    setQueryRaw('');
    setSelected(null);
    setLocked(false);
    setPredictions([]);
    setStatus('idle');
  };

  const clearPredictions = () => setPredictions([]);

  return {
    query,
    setQuery,
    status,
    predictions,
    selected,
    select,
    clear,
    clearPredictions,
  };
}
