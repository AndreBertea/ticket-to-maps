import villages from '@/data/villages.json';
import streetsData from '@/data/streets.json';
import { normalize, similarity } from '@/lib/fuzzy';

export type StreetsMap = Record<string, string[]>;

const streetsByCity: StreetsMap = streetsData as StreetsMap;
const villagesList = villages as string[];

export function getVillages() {
  return [...villagesList];
}

export function getStreets(city: string) {
  return [...(streetsByCity[city] ?? [])];
}

export function suggestStreets(city: string, query: string, limit = 8) {
  const streets = getStreets(city);
  if (!query) {
    return streets.slice(0, limit);
  }

  const normalizedQuery = normalize(query);

  return streets
    .map((street) => {
      const normalizedStreet = normalize(street);
      const startsWith = normalizedStreet.startsWith(normalizedQuery);
      const includes = normalizedStreet.includes(normalizedQuery);
      const score = similarity(normalizedStreet, normalizedQuery);
      let rank = score;
      if (startsWith) rank += 0.3;
      else if (includes) rank += 0.1;
      return { street, rank };
    })
    .filter((entry) => entry.rank > 0.15)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)
    .map((entry) => entry.street);
}

export function getAllStreets() {
  return Object.values(streetsByCity).flat();
}
