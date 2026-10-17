/**
 * Text helpers shared by the exercise generators and the grader: answer
 * normalisation and edit distance. Liraasa defines no diacritics or alternate
 * spellings, so normalising is case, whitespace, punctuation and stray
 * accents; old spellings are handled by the grader through the legacy forms.
 */

/** Lowercase, accents stripped, punctuation dropped, spaces collapsed. Hyphens are kept. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[.,!?;:"“”'‘’()[\]{}…—–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Edit distance with adjacent transpositions (optimal string alignment): a
 * swapped pair of letters is one slip, as typists make them. Exits early
 * once it exceeds `max`.
 */
export function editDistance(a: string, b: string, max = Infinity): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min((prev[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, (prev2[j - 2] ?? 0) + 1);
      }
      row.push(v);
      if (v < best) best = v;
    }
    if (best > max) return max + 1;
    prev2 = prev;
    prev = row;
  }
  return prev[b.length] ?? 0;
}

/** How many edits still count as a typo for a word of this length. */
export const typoBudget = (length: number): number => (length <= 4 ? 1 : length <= 9 ? 2 : 3);

/** The first of each group of items sharing a key, in order. */
export function unique<T>(list: readonly T[], key: (x: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of list) {
    const k = key(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

/** English words that carry no meaning for answer comparison. */
const STOP = new Set(
  'a an the to of in on at for with and or but is are am was were be been being it its this that these those my your his her our their i you he she we they me him us them do does did not no so as by from'.split(
    ' ',
  ),
);

/** Content words of an English answer, crudely stemmed. */
export function englishContent(text: string): string[] {
  return normalize(text)
    .replace(/-/g, ' ')
    .split(' ')
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => w.replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, '') || w);
}
