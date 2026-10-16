/**
 * Phonology config. Mirrors `phonology` in the lexicon JSON.
 *
 * `sh` and `ch` appear only in colour and number words (`shada`, `ocha`).
 */

export const VOWEL_SET = ['a', 'e', 'i', 'o', 'u'] as const;
export const CONSONANTS_CORE = ['l', 'm', 'n', 'r', 's', 'v', 'y'] as const;
export const CONSONANTS_OTHER = ['b', 'd', 'p', 't', 'g', 'h', 'z', 'k', 'c', 'f', 'j'] as const;

/**
 * `sh` and `ch` are permitted only in colour and number words (`shada`,
 * `ocha`). The JSON states this as a parenthetical on `consonants_other`.
 */
export const RESTRICTED_DIGRAPHS = ['sh', 'ch'] as const;
export const RESTRICTED_DIGRAPH_NOTE = 'sh, ch only in colour/number words';

/** Penultimate. Adjacent vowels are separate syllables, so hiatus counts. */
export const STRESS = 'penultimate';

/** Grandfathered initial clusters. Nothing else may start with a cluster. */
export const ALLOWED_INITIAL_CLUSTERS = ['kr', 'tr'] as const;

/** Roots that may end in a consonant. Everything else must end in a vowel. */
export const CONSONANT_FINAL_EXEMPT_HEADS = ['amor', 'apok'] as const;

/**
 * Pairs one edit apart that are nonetheless both canon. Monosyllables may sit
 * one edit from another monosyllable only when declared here and positionally
 * distinct (check 19).
 */
export const DECLARED_DISTANCE_1_PAIRS: readonly (readonly [string, string])[] = [
  ['mavo', 'maivo'],
  ['lira', 'zira'],
  ['peli', 'eli'],
  ['somu', 'somi'],
  ['pensa', 'penta'],
  ['ka', 'ke'],
  ['ki', 'ka'],
  ['si', 'su'],
  ['da', 'de'],
  ['po', 'ko'],
  ['tu', 'su'],
];

/**
 * The 39 legacy `amor` compounds exempt from the new-root template: 20 ending
 * in `-amor` (consonant-final, with `aa` hiatus) and 19 beginning `amor-`
 * (vowel-initial).
 *
 * The JSON's `phonology.protected_exceptions` calls these "36 amor- double-a
 * roots (legacy canon)". That label is wrong twice over: they are compounds,
 * not roots, and 36 was the 0.8-rc2 count — 1.0 added `amorpeli`,
 * `amorserbu` and `amorvorba`, taking it to 39. Corrected here and recorded in
 * ADR-0007; the JSON label is scheduled for repair in 1.1 (Q7).
 */
export const AMOR_COMPOUNDS_SUFFIX: readonly string[] = [
  'devoamor',
  'humeamor',
  'laviamor',
  'lunoamor',
  'meraamor',
  'nemeamor',
  'nilvuamor',
  'nolsaamor',
  'noruamor',
  'ramuamor',
  'renliamor',
  'silroamor',
  'soveamor',
  'sulbaamor',
  'sumaamor',
  'vayeamor',
  'veboamor',
  'veluamor',
  'vorbaamor',
  'vureamor',
];

export const AMOR_COMPOUNDS_PREFIX: readonly string[] = [
  'amorbanu',
  'amorfasbi',
  'amorfolni',
  'amorganre',
  'amorhavli',
  'amorjomru',
  'amorlira',
  'amormanli',
  'amorpeli',
  'amorpomli',
  'amorrinba',
  'amorsamni',
  'amorsenru',
  'amorserbu',
  'amorsonbu',
  'amorvaye',
  'amorvilne',
  'amorvorba',
  'amorvulra',
];

/** All 39, plus the two primals and the one `-apok` compound. */
export const TEMPLATE_EXEMPT: readonly string[] = [
  ...CONSONANT_FINAL_EXEMPT_HEADS,
  'ralkaapok',
  ...AMOR_COMPOUNDS_SUFFIX,
  ...AMOR_COMPOUNDS_PREFIX,
];

/**
 * Syllabify. Every vowel is a syllable nucleus; adjacent vowels do not form
 * diphthongs, so `dorvaasa` is dor-va-a-sa (4), not dor-vaa-sa.
 */
export function syllableCount(word: string): number {
  let n = 0;
  for (const ch of word.toLowerCase()) {
    if ((VOWEL_SET as readonly string[]).includes(ch)) n += 1;
  }
  return n;
}

/** Levenshtein distance, with an optional early exit once `cap` is exceeded. */
export function editDistance(a: string, b: string, cap = Number.POSITIVE_INFINITY): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > cap) return cap + 1;

  let prev: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row: number[] = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min((row[j - 1] ?? 0) + 1, (prev[j] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      row.push(value);
      if (value < best) best = value;
    }
    if (best > cap) return cap + 1;
    prev = row;
  }
  return prev[b.length] ?? 0;
}
