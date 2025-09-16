export type Origin = {
  lat: number;
  lng: number;
};

export type DirectionsOptions = {
  origin?: Origin | null;
  city?: string;
  street?: string;
  number?: string | number;
};

export function formatDestination(options: DirectionsOptions) {
  const parts: string[] = [];
  if (options.number) {
    parts.push(String(options.number).trim());
  }
  if (options.street) {
    parts.push(options.street.trim());
  }
  if (options.city) {
    parts.push(options.city.trim());
  }
  return parts.join(', ');
}

export function buildDirectionsUrl(options: DirectionsOptions) {
  const { origin } = options;
  const destination = formatDestination(options);
  const originParam = origin
    ? `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`
    : 'Current+Location';

  const params = new URLSearchParams({
    api: '1',
    origin: originParam,
    travelmode: 'driving',
    hl: 'fr',
    region: 'FR'
  });

  if (destination) {
    params.set('destination', destination);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function tryOpenInApp(url: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const appUrl = url.replace('https://www.google.com/maps', 'comgooglemaps://');
  const fallback = window.setTimeout(() => {
    window.location.href = url;
  }, 400);

  try {
    window.location.href = appUrl;
  } catch (error) {
    window.clearTimeout(fallback);
    window.location.href = url;
  }
}
