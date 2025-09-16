import { normalize, similarity } from '@/lib/fuzzy';
import { getAllStreets, getStreets, getVillages, suggestStreets } from '@/lib/streets';

export type SpeechExtraction = {
  city?: string;
  street?: string;
  number?: number;
  time?: string;
};

const STREET_KEYWORDS = [
  'rue',
  'avenue',
  'boulevard',
  'route',
  'chemin',
  'impasse',
  'place',
  'square',
  'allée',
  'allee',
  'voie',
  'passage',
  'sentier',
  'quai'
];

const streetPattern = new RegExp(
  `(?:${STREET_KEYWORDS.join('|')})\\s+([a-zàâçéèêëîïôûùüÿñæœ0-9' -]+)`,
  'i'
);

const numberPattern = new RegExp(
  `\\b(\\d{1,4})\\s*(?:bis|ter)?\\s*(?=(?:${STREET_KEYWORDS.join('|')})\\b)`,
  'i'
);

const timePattern = /(\d{1,2})\s*(?:h|:|heures?)\s*(\d{1,2})?/i;

export function extractFromSpeech(text: string): SpeechExtraction {
  const result: SpeechExtraction = {};
  if (!text) return result;

  const villages = getVillages();
  const normalizedText = normalize(text);

  let bestCity: { name: string; score: number } | null = null;

  for (const city of villages) {
    const normalizedCity = normalize(city);
    let score = 0;
    if (normalizedCity && normalizedText.includes(normalizedCity)) {
      score = 1;
    } else {
      score = similarity(normalizedText, normalizedCity);
    }

    if (!bestCity || score > bestCity.score) {
      bestCity = { name: city, score };
    }
  }

  if (bestCity && bestCity.score >= 0.55) {
    result.city = bestCity.name;
  }

  const timeMatch = text.match(timePattern);
  if (timeMatch) {
    const hour = Math.min(23, Math.max(0, parseInt(timeMatch[1] ?? '0', 10)));
    const minuteRaw = timeMatch[2] ?? '0';
    const minute = Math.min(59, Math.max(0, parseInt(minuteRaw.padStart(2, '0').slice(0, 2), 10)));
    result.time = `${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;
  }

  const numberMatch = text.match(numberPattern);
  if (numberMatch) {
    const parsed = parseInt(numberMatch[1], 10);
    if (Number.isFinite(parsed)) {
      result.number = parsed;
    }
  }

  const streetMatch = text.match(streetPattern);
  let streetQuery = streetMatch ? streetMatch[1] : '';
  if (streetQuery && result.city) {
    streetQuery = streetQuery.replace(new RegExp(result.city, 'i'), '').trim();
  }
  streetQuery = streetQuery.replace(/\bà\b.*/i, '').trim();

  if (streetQuery) {
    if (result.city) {
      const suggestions = suggestStreets(result.city, streetQuery, 1);
      if (suggestions.length) {
        result.street = suggestions[0];
      }
    }

    if (!result.street) {
      const normalizedQuery = normalize(streetQuery);
      let bestStreet: { name: string; score: number } | null = null;
      for (const street of getAllStreets()) {
        const normalizedStreet = normalize(street);
        let score = 0;
        if (normalizedStreet && normalizedQuery && normalizedStreet.includes(normalizedQuery)) {
          score = normalizedQuery.length / normalizedStreet.length;
        } else {
          score = similarity(normalizedStreet, normalizedQuery);
        }
        if (!bestStreet || score > bestStreet.score) {
          bestStreet = { name: street, score };
        }
      }

      if (bestStreet && bestStreet.score >= 0.45) {
        result.street = bestStreet.name;
      }
    }
  }

  return result;
}
