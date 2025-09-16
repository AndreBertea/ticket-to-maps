import type { Origin } from '@/lib/maps';

type Position = Origin;

type WatchHandle = () => void;

type WatchCallback = (position: Position | null) => void;

const defaultOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 60_000
};

export function getCurrentPosition(): Promise<Position | null> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (result) => {
        resolve({ lat: result.coords.latitude, lng: result.coords.longitude });
      },
      () => {
        resolve(null);
      },
      defaultOptions
    );
  });
}

export function watchPosition(callback: WatchCallback): WatchHandle {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    callback(null);
    return () => {};
  }

  const id = navigator.geolocation.watchPosition(
    (result) => {
      callback({ lat: result.coords.latitude, lng: result.coords.longitude });
    },
    () => {
      callback(null);
    },
    defaultOptions
  );

  return () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(id);
    }
  };
}
