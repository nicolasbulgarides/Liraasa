/**
 * Editorial decisions on the 1.1 proposal.
 *
 * The integration prompt (§7) requires that where a proposed gloss is already
 * covered by 1.0 canon, or asserts a false equivalence, the candidate is
 * **skipped or narrowed, with the reason documented**. Those decisions are data
 * here rather than buried in the integration code, so the changelog can be
 * generated from them and each one can be argued with.
 *
 * Nothing here invents meaning. A narrowing either (a) resolves a
 * contradiction between a candidate's own `english_gloss` and its own
 * `meaning_scope`, or (b) adds the qualifier that keeps a 1.0 sense intact.
 */

export type DecisionKind = 'accept' | 'narrow' | 'reject';

export interface Decision {
  headword: string;
  kind: DecisionKind;
  /** Replacement root gloss. Only for `narrow`. */
  gloss?: string;
  /** Why, for the changelog. Required. */
  reason: string;
  /** The 1.0 entry whose sense is being protected, where that is the driver. */
  protects?: string;
}

/**
 * Candidates whose own `english_gloss` contradicts their own `meaning_scope`.
 * The scope is the more careful statement, so the gloss is brought into line.
 */
const SCOPE_CONTRADICTIONS: Decision[] = [
  {
    headword: 'germabiti',
    kind: 'narrow',
    gloss: 'metal tool; metal implement',
    reason:
      'Proposed gloss said "steel tool" while its own scope says it "does NOT always imply steel". Narrowed to the material the components actually name (germa, metal).',
  },
  {
    headword: 'lazuralka',
    kind: 'narrow',
    gloss: 'animal aggression; struggle between animals',
    reason:
      'Proposed gloss said "predatory aggression" while its own scope says it is "NOT always predation". Narrowed; predation proper needs no new word.',
  },
  {
    headword: 'folnitino',
    kind: 'narrow',
    gloss: 'flowering-plant species',
    reason:
      'Proposed gloss said "plant species" while its own scope restricts it to "Flowering plant type specifically; not all plants". Narrowed to match the folni component.',
  },
  {
    headword: 'yanolira',
    kind: 'narrow',
    gloss: 'chorus; a group-sung section',
    reason:
      'Proposed gloss said "chorus" while its own scope says it is "NOT necessarily repeated refrain". Narrowed so it does not shadow ralelirapatu.',
  },
];

/**
 * Candidates whose gloss collided with a 1.0 sense. In every case the collision
 * turned out to be an English homograph or 1.0 synonym padding rather than a
 * real duplicate, so none is rejected — but the four below are qualified so a
 * reader cannot mistake them for the 1.0 sense.
 */
const CANON_PROTECTIONS: Decision[] = [
  {
    headword: 'biotinosolma',
    kind: 'narrow',
    gloss: 'extinction of a species; the dying out of a kind of life',
    reason:
      'Bare "extinction" is already the gloss of faruna (faru.negative), which is a fire going out. Qualified so the two senses stay apart.',
    protects: 'faru',
  },
  {
    headword: 'telnenulu',
    kind: 'narrow',
    gloss: 'plot of a story; narrative line',
    reason:
      'Bare "plot" is a synonym of silrolordi, "conspiracy; secret plan". Qualified to the narrative sense.',
    protects: 'silrolordi',
  },
  {
    headword: 'fulepari',
    kind: 'narrow',
    gloss: 'surplus; quantity beyond what is needed',
    reason:
      'pari already means gain/profit and lists "surplus" among its synonyms. Qualified to quantity-in-excess, which profit does not cover.',
    protects: 'pari',
  },
  {
    headword: 'vamri',
    kind: 'narrow',
    gloss: 'space; spatial extent, independent of location',
    reason:
      'pago lists "space" among its synonyms in the sense of a location. Qualified to extent, as the candidate\'s own scope directs ("Distinguish physical extent from pago place").',
    protects: 'pago',
  },
];

export const DECISIONS: readonly Decision[] = [...SCOPE_CONTRADICTIONS, ...CANON_PROTECTIONS];

const BY_HEADWORD = new Map(DECISIONS.map((d) => [d.headword, d]));

export function decisionFor(headword: string): Decision | undefined {
  return BY_HEADWORD.get(headword);
}

/**
 * Overlaps checked and deliberately accepted without changing the gloss,
 * recorded so the changelog can show the work. Each is an English homograph or
 * 1.0 synonym padding, not a competing Liraasa sense.
 */
export interface AcceptedOverlap {
  headword: string;
  overlapsWith: string;
  on: string;
  why: string;
}

export const ACCEPTED_OVERLAPS: readonly AcceptedOverlap[] = [
  {
    headword: 'pavma',
    overlapsWith: 'coda',
    on: 'material',
    why: 'codasan is "material; conceptual" in the sense of pertaining to a thing or concept. pavma is physical substance. Different senses of one English word.',
  },
  {
    headword: 'ravmi',
    overlapsWith: 'ranfa',
    on: 'reason',
    why: 'ranfa is reason, the faculty and the act. ravmi is intelligence, the capacity. The word "reason" appears only inside ravmi\'s descriptive gloss, not as its sense.',
  },
  {
    headword: 'tilnu',
    overlapsWith: 'tavre',
    on: 'refuse',
    why: 'English homograph: tavre is to refuse (decline), tilnu is refuse (discarded matter). No Liraasa overlap.',
  },
  {
    headword: 'tibiteyo',
    overlapsWith: 'pelisupo',
    on: 'needle',
    why: 'English homograph: pelisupo lists "needle" meaning to tease. tibiteyo is the sewing implement.',
  },
  {
    headword: 'ralelirapatu',
    overlapsWith: 'lira',
    on: 'refrain',
    why: '1.0 synonym padding on lira (song). No 1.0 headword means a repeated song section.',
  },
  {
    headword: 'melonulu',
    overlapsWith: 'lira',
    on: 'melody',
    why: '1.0 synonym padding on lira (song). melonulu is the melodic contour, melo + nulu.',
  },
  {
    headword: 'navutrana',
    overlapsWith: 'folninevlo, fulemiru, galsarenli',
    on: 'weather',
    why: '1.0 synonym padding on three 0.6-era poetic weather images. No 1.0 headword means weather.',
  },
  {
    headword: 'sornimodo',
    overlapsWith: 'folninevlo, fulemiru, galsarenli',
    on: 'climate',
    why: 'Same padding. No 1.0 headword means climate.',
  },
  {
    headword: 'sumamelli',
    overlapsWith: 'yugefaru',
    on: 'temperature',
    why: 'English idiom: yugefaru is fever, which lists "temperature" as in running a temperature. sumamelli is the physical measure.',
  },
];

/**
 * The four new compounds whose spelling can also be read as a productive
 * `-pago` derivation. 1.0 already contains three of these (`larbopago`,
 * `mavopago`, `sasvapago`), and check 3 of the validator explicitly excuses the
 * case when the compound's declared components are exactly `[base, 'pago']` —
 * both analyses then agree on the morphemes. Recorded, not rejected.
 */
export const DUAL_ANALYSIS_PAGO: readonly string[] = [
  'zavmepago',
  'nazrupago',
  'lazupago',
  'tilnupago',
];
