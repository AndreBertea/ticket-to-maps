const collator = new Intl.Collator('fr', { sensitivity: 'base', ignorePunctuation: true });

export function normalize(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  const v0 = new Array(lb + 1).fill(0);
  const v1 = new Array(lb + 1).fill(0);

  for (let i = 0; i <= lb; i++) {
    v0[i] = i;
  }

  for (let i = 0; i < la; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < lb; j++) {
      const cost = a[i] === b[j] ? 0 : collator.compare(a[i], b[j]) === 0 ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= lb; j++) {
      v0[j] = v1[j];
    }
  }

  return v0[lb];
}

export function similarity(a: string, b: string) {
  const left = normalize(a);
  const right = normalize(b);
  if (!left.length && !right.length) return 1;
  if (!left.length || !right.length) return 0;
  const distance = levenshtein(left, right);
  const max = Math.max(left.length, right.length);
  return 1 - distance / max;
}
