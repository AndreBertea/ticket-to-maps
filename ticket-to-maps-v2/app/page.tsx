'use client';

import * as React from 'react';
import { HeaderBar } from '@/components/HeaderBar';
import { CityCombobox } from '@/components/CityCombobox';
import { StreetCombobox } from '@/components/StreetCombobox';
import { TimeWheel } from '@/components/TimeWheel';
import { VoiceDictation } from '@/components/VoiceDictation';
import { MapsPreview } from '@/components/MapsPreview';
import { getStreets } from '@/lib/streets';
import { getCurrentPosition, watchPosition } from '@/lib/geoloc';
import type { Origin } from '@/lib/maps';
import type { SpeechExtraction } from '@/lib/speech-parse';

function formatTimeValue(date = new Date()) {
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

type GeoStatus = 'idle' | 'resolving' | 'ready' | 'denied';

export default function HomePage() {
  const [city, setCity] = React.useState('');
  const [street, setStreet] = React.useState('');
  const [number, setNumber] = React.useState('');
  const [time, setTime] = React.useState(() => formatTimeValue());
  const [origin, setOrigin] = React.useState<Origin | null>(null);
  const [geoStatus, setGeoStatus] = React.useState<GeoStatus>('idle');

  React.useEffect(() => {
    let cancelled = false;
    setGeoStatus('resolving');
    getCurrentPosition().then((position) => {
      if (cancelled) return;
      if (position) {
        setOrigin(position);
        setGeoStatus('ready');
      } else {
        setGeoStatus('denied');
      }
    });
    const stopWatch = watchPosition((position) => {
      if (cancelled) return;
      if (position) {
        setOrigin(position);
        setGeoStatus('ready');
      } else {
        setGeoStatus((current) => (current === 'ready' ? 'ready' : 'denied'));
      }
    });

    return () => {
      cancelled = true;
      stopWatch();
    };
  }, []);

  React.useEffect(() => {
    if (!city) {
      setStreet('');
      return;
    }
    if (street && !getStreets(city).includes(street)) {
      setStreet('');
    }
  }, [city, street]);

  const handleDictation = React.useCallback(
    (result: SpeechExtraction) => {
      if (result.city) {
        setCity(result.city);
      }
      if (result.street) {
        setStreet(result.street);
      }
      if (typeof result.number !== 'undefined') {
        setNumber(String(result.number));
      }
      if (result.time) {
        setTime(result.time);
      }
    },
    []
  );

  const geoMessage = React.useMemo(() => {
    switch (geoStatus) {
      case 'idle':
        return 'Position actuelle en attente…';
      case 'resolving':
        return 'Recherche de votre position…';
      case 'ready':
        return 'Position actuelle synchronisée.';
      case 'denied':
        return 'Localisation indisponible, lien "Position actuelle" utilisé.';
      default:
        return '';
    }
  }, [geoStatus]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col pb-12">
      <HeaderBar className="sticky top-0 z-20 bg-background/95 backdrop-blur" />
      <div className="flex flex-1 flex-col gap-6 px-4 pb-16">
        <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground" aria-live="polite">
          {geoMessage}
        </p>
        <CityCombobox value={city} onChange={setCity} />
        <StreetCombobox
          city={city}
          street={street}
          number={number}
          onStreetChange={setStreet}
          onNumberChange={setNumber}
        />
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-muted-foreground">Arrivée souhaitée</span>
          <TimeWheel value={time} onChange={setTime} />
        </div>
        <VoiceDictation onResult={handleDictation} />
        <MapsPreview origin={origin ?? undefined} city={city} street={street} number={number} time={time} />
      </div>
    </main>
  );
}
