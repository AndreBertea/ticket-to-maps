import baseStreets from '../data/streets.json';
import { VILLAGES } from '../data/localities';
import { similarity, normalize } from './match';

type StreetIndex = Record<string, string[]>; // city -> streets
export type Candidate = { city: string; street: string; score: number };

const USER_K = 'ttm:userStreets';

function loadUserStreets(): StreetIndex {
  try {
    const raw = localStorage.getItem(USER_K);
    if (!raw) return {};
    const obj = JSON.parse(raw) as StreetIndex;
    return obj && typeof obj === 'object' ? obj : {};
  } catch { return {}; }
}

function saveUserStreets(idx: StreetIndex) {
  localStorage.setItem(USER_K, JSON.stringify(idx));
}

export function addUserStreet(city: string, street: string) {
  const idx = loadUserStreets();
  idx[city] = Array.from(new Set([...(idx[city] || []), street]));
  saveUserStreets(idx);
}

export function getStreetIndex(): StreetIndex {
  const user = loadUserStreets();
  const merged: StreetIndex = JSON.parse(JSON.stringify(baseStreets));
  for (const city of Object.keys(user)) {
    merged[city] = Array.from(new Set([...(merged[city] || []), ...user[city]]));
  }
  return merged;
}

export function resolveCityFromStreet(streetGuess: string): Candidate[] {
  const index = getStreetIndex();
  const res: Candidate[] = [];
  for (const city of Object.keys(index)) {
    for (const street of index[city]) {
      const score = similarity(streetGuess, street);
      if (score >= 0.75) res.push({ city, street, score });
    }
  }
  return res.sort((a, b) => b.score - a.score).slice(0, 3);
}

export function isKnownVillage(name?: string) {
  if (!name) return false;
  return VILLAGES.map(normalize).includes(normalize(name));
}

export function scoreAddress({ address, city }: { address?: string; city?: string }, candidates: Candidate[]): number {
  let score = 0;
  if (isKnownVillage(city)) score += 0.5; // City detected
  const house = /\b\d{1,3}\b/.test(address || '') ? 1 : 0;
  if (house) score += 0.2;
  const top = candidates[0]?.score || 0;
  if (top >= 0.85) score += 0.4; // street high confidence
  if (candidates.length > 1) score -= 0.3; // ambiguous
  return Math.max(0, Math.min(1, score));
}

export function autoCompleteAddress(partial: { address?: string; city?: string }) {
  let { address = '', city = '' } = partial;
  const hasCity = isKnownVillage(city);
  let candidates: Candidate[] = [];
  let needsDisambiguation = false;
  let inferred = false;

  if (!hasCity && address) {
    const m = address.match(/^\s*\d{1,3}\s+(.*)$/);
    const streetOnly = (m ? m[1] : address).trim();
    candidates = resolveCityFromStreet(streetOnly);
    if (candidates.length === 1 && candidates[0].score > 0.85) {
      city = candidates[0].city; inferred = true;
    } else if (candidates.length > 1) {
      needsDisambiguation = true;
    }
  }

  if (!city) city = 'Verzenay';
  const score = scoreAddress({ address, city }, candidates);
  return { address, city, candidates, needsDisambiguation, inferred, score };
}

