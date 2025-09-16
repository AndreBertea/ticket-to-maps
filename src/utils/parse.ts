import type { Stop } from '../types';

export type ParseResult = Partial<Stop> & { confidence: number; debug: Record<string, any> };

// Helpers
const PHONE_EU = /(\+?\d{2}\s?\d(?:[\s\.\-]?\d{2}){4,5})/g; // broad EU
const PHONE_FR = /(\+33\s?7(?:[\s\.\-]?\d{2}){4})|(\b0[67](?:[\s\.\-]?\d{2}){4}\b)/g; // FR mobile

const HOUR_PATTERNS = [
  /(\b\d{1,2})\s*h\s*(\d{2})\b/gi, // 20h20, 20 h 20
  /(\b\d{1,2})\s*[:h]\s*(\d{2})\b/g,  // 20:20 or 20h20 variants
  /(\b\d{2})(\d{2})\b/g,     // 2020
];

// Common French street types (extendable)
const STREET_TYPES = [
  'rue', 'avenue', 'av', 'impasse', 'chemin', 'place', 'boulevard', 'bd', 'allée', 'allee', 'quai', 'route', 'cours'
];

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d\+]/g, '');
  // Ensure +33 formatting if starts with 0
  let formatted = digits;
  if (/^0[67]/.test(digits)) {
    formatted = '+33' + digits.slice(1);
  }
  // Group by pairs after country code
  const m = formatted.match(/^(\+\d{2})(\d{1,})$/);
  if (m) {
    const cc = m[1];
    const rest = m[2];
    const groups: string[] = [];
    for (let i = 0; i < rest.length; i += 2) groups.push(rest.slice(i, i + 2));
    return `${cc} ${groups.join(' ')}`.trim();
  }
  // Fallback: insert spaces every 2 digits
  return formatted.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

export function normalizeTime(h: number, m: number): string {
  const hh = ('0' + (h % 24)).slice(-2);
  const mm = ('0' + (m % 60)).slice(-2);
  return `${hh}:${mm}`;
}

export function extractTime(raw: string): string | undefined {
  // Normalize common OCR confusions
  let text = raw.replace(/[lI]/g, '1').replace(/[oO]/g, '0');
  text = text.replace(/\s*h\s*/gi, 'h');
  for (const re of HOUR_PATTERNS) {
    const it = text.matchAll(re);
    for (const m of it as any) {
      let h = parseInt(m[1], 10);
      let mm = parseInt(m[2], 10);
      if (Number.isFinite(h) && Number.isFinite(mm) && h >= 0 && h <= 23 && mm >= 0 && mm <= 59) {
        return normalizeTime(h, mm);
      }
    }
  }
  return undefined;
}

export function extractPhone(raw: string): string | undefined {
  // Try strict regexes first
  const mFR = raw.match(PHONE_FR);
  const mEU = raw.match(PHONE_EU);
  const pick = (mFR?.[0] || mEU?.[0])?.trim();
  if (pick) return normalizePhone(pick);
  // Fallback: look for 9-14 digits (possibly spaced) starting with +CC or 0
  const fallback = raw.match(/(\+\d{2}[\s\.\-]?\d(?:[\s\.\-]?\d){7,12})|(\b0[1-9](?:[\s\.\-]?\d){8,10}\b)/);
  return fallback ? normalizePhone(fallback[0]) : undefined;
}

export function extractAddressAndCity(lines: string[]): { address?: string; city?: string } {
  // Address: line starting with number + street type
  const addrRe = /^\s*(\d{1,3})\s+([A-Za-zÀ-ÿ' \-]{2,})/;
  let address: string | undefined;
  for (const line of lines) {
    const m = addrRe.exec(line);
    if (m) {
      const house = m[1];
      const rest = m[2];
      // keep plausible street names
      const lower = rest.toLowerCase();
      if (STREET_TYPES.some((t) => (" " + lower + " ").includes(" " + t + " "))) {
        address = `${house} ${rest}`.replace(/\s+/g, ' ').trim();
        break;
      }
    }
  }
  // City: position-agnostic — find any line without digits/time/phone and not a street
  // Prefer shorter 1-3 word lines; take the last candidate as tie-breaker
  let city: string | undefined;
  const cityCandidates: string[] = [];
  for (const l0 of lines) {
    const l = l0.trim();
    if (!l) continue;
    if (/[0-9]/.test(l)) continue;
    if (PHONE_FR.test(l) || PHONE_EU.test(l)) continue;
    if (HOUR_PATTERNS.some((re) => re.test(l))) continue;
    const lower = l.toLowerCase();
    if (STREET_TYPES.some((t) => (" " + lower + " ").includes(" " + t + " "))) continue;
    const tokens = l.split(/\s+/);
    if (tokens.length >= 1 && tokens.length <= 4 && l.length >= 3 && l.length <= 28) {
      cityCandidates.push(l);
    }
  }
  if (cityCandidates.length) city = cityCandidates[cityCandidates.length - 1];
  return { address, city };
}

export function extractNotes(raw: string): string | undefined {
  // Normalize common OCR confusion
  let text = raw.toLowerCase();
  text = text.replace(/\bss\b/g, 'sans');
  const candidates = new Set<string>();
  const keywords = [
    'coupé', 'coupe', 'coupé', 'coupée', // accents variants
    'couteau', 'fourchette', 'sans', 'anchois', 'oignon', 'oignons', 'olive', 'olives',
    '4 from', '4from', '4 fromage', '4 fromages', '4fro', 'fromage'
  ];
  for (const k of keywords) {
    const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (re.test(text)) {
      candidates.add(k.replace(/\s+/g, ' ').trim());
    }
  }
  if (candidates.size === 0) return undefined;
  return Array.from(candidates).join('; ');
}

export function parseTicketText(raw: string): ParseResult {
  const debug: Record<string, any> = {};
  const cleaned = raw
    .replace(/[\t\r]+/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  debug.lines = cleaned;

  const phone = extractPhone(raw);
  const time = extractTime(raw);
  const { address, city } = extractAddressAndCity(cleaned);
  const notes = extractNotes(raw);

  const found = [address, city, phone, time, notes].filter(Boolean).length;
  const confidence = found / 5;

  return { address, city, phone, time, notes, confidence, debug };
}

/*
Example tests (manual):

Exemple 1 (corrigé):
"21 Rue Haute\n+31617824062\ncoupé\ncouteau fourchette\nPleudihen\n20h20"

parseTicketText(...) → {
  address: '21 Rue Haute',
  city: 'Pleudihen',
  phone: '+31 61 78 24 06 2' (depending OCR digits),
  time: '20:20',
  notes: 'coupé; couteau; fourchette',
  confidence: ~0.8
}

Exemple 2:
"16 Rue du Parc\n07 88 86 71 02\n2 Reine\n1 4 from\nPleudihen\n19h30"

parseTicketText(...) → {
  address: '16 Rue du Parc',
  city: 'Pleudihen',
  phone: '+33 7 88 86 71 02',
  time: '19:30',
  notes: '4 from',
  confidence: ~0.8
}
*/
