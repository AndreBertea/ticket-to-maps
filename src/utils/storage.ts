import type { Stop, OrderMode } from '../types';

const K = {
  stops: 'ttm:stops',
  mode: 'ttm:mode',
  origin: 'ttm:origin',
} as const;

export function loadStops(): Stop[] {
  try {
    const raw = localStorage.getItem(K.stops);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Stop[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveStops(stops: Stop[]) {
  localStorage.setItem(K.stops, JSON.stringify(stops));
}

export function clearStops() {
  localStorage.removeItem(K.stops);
}

export function loadMode(): OrderMode {
  const m = localStorage.getItem(K.mode) as OrderMode | null;
  return m === 'time' ? 'time' : 'manual';
}

export function saveMode(m: OrderMode) {
  localStorage.setItem(K.mode, m);
}

export function loadOrigin(): string {
  return localStorage.getItem(K.origin) || '';
}

export function saveOrigin(o: string) {
  localStorage.setItem(K.origin, o);
}

