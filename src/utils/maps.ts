import type { Stop } from '../types';

function encodeAddress(s: string) {
  return encodeURIComponent(s.replace(/\s+/g, ' ').trim());
}

function joinAddress(stop: Stop) {
  const city = stop.city?.trim() || 'Verzenay';
  return [stop.address, city].filter(Boolean).join(', ');
}

export const DEFAULT_ORIGIN = 'Rue de la Crayère, Verzenay';

/**
 * Build a Google Maps directions URL.
 * - origin: "Current+Location" by default.
 * - destination: last stop
 * - waypoints: intermediate stops
 * - travelmode: driving
 * - language: fr
 */
export function buildGmapsUrl(stops: Stop[], origin?: string): string {
  if (!stops.length) return 'https://www.google.com/maps';
  const originParam = origin && origin.trim().length > 0 ? encodeAddress(origin) : encodeAddress(DEFAULT_ORIGIN);
  const last = stops[stops.length - 1];
  const dest = encodeAddress(joinAddress(last));
  const waypoints = stops.length > 1 ? stops.slice(0, -1).map((s) => encodeAddress(joinAddress(s))).join('|') : '';
  const params = new URLSearchParams({
    api: '1',
    origin: originParam,
    destination: dest,
    travelmode: 'driving',
    hl: 'fr',
    region: 'FR',
  });
  if (waypoints) params.set('waypoints', waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Try opening iOS Google Maps app, fallback to web URL.
 */
export function openMaps(stops: Stop[], origin?: string) {
  const webUrl = buildGmapsUrl(stops, origin || DEFAULT_ORIGIN);
  try {
    const last = stops[stops.length - 1];
    const daddr = encodeAddress(joinAddress(last));
    const saddr = origin && origin.trim().length > 0 ? encodeAddress(origin) : encodeAddress(DEFAULT_ORIGIN);
    const iosApp = `comgooglemaps://?saddr=${saddr}&daddr=${daddr}&directionsmode=driving`;
    // Attempt to open app; fallback shortly after
    const opened = window.open(iosApp, '_blank');
    setTimeout(() => {
      if (!opened || opened.closed) window.open(webUrl, '_blank');
    }, 500);
  } catch {
    window.open(webUrl, '_blank');
  }
}
