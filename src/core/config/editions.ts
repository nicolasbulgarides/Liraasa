/**
 * Editions and ruling identity.
 *
 * 1.0 is released and frozen; work happens in 1.1-draft with 1.0 as baseline
 * (ADR-0008). Ruling ids are edition-qualified because `G1`-`G8` are defined in
 * both ruling sets with different content (ADR-0004).
 */

export const EDITION_1_0 = '1.0';
export const EDITION_0_8 = '0.8';
export const EDITION_1_1_DRAFT = '1.1-draft';

export const RELEASED_EDITIONS = [EDITION_0_8, EDITION_1_0] as const;

/** The edition whose lexicon the app edits. */
export const WORKING_EDITION = EDITION_1_1_DRAFT;

/** The released edition the working edition is diffed against. */
export const BASELINE_EDITION = EDITION_1_0;

export type EditionId = string;

/** A ruling reference, always `<edition>:<id>`. */
export type RulingRef = `${string}:${string}`;

export function rulingRef(edition: EditionId, id: string): RulingRef {
  return `${edition}:${id}`;
}

export function parseRulingRef(ref: string): { edition: EditionId; id: string } | null {
  const at = ref.indexOf(':');
  if (at <= 0 || at === ref.length - 1) return null;
  return { edition: ref.slice(0, at), id: ref.slice(at + 1) };
}

/**
 * Ruling ids defined in both `rulings_1_0` and `rulings_0_8_carried` with
 * different content. A bare id in this set is ambiguous and is never guessed.
 */
export const AMBIGUOUS_RULING_IDS: readonly string[] = [
  'G1',
  'G2',
  'G3',
  'G4',
  'G5',
  'G6',
  'G7',
  'G8',
];

export function isAmbiguousRulingId(id: string): boolean {
  return AMBIGUOUS_RULING_IDS.includes(id);
}

/**
 * Decisions the author has deferred to 1.1. Surfaced by the Open questions
 * module; never acted on by the tool (SPEC §14).
 */
export const PENDING_1_1_DECISIONS: readonly {
  id: string;
  question: string;
  roots: readonly string[];
  reason: string;
}[] = [
  {
    id: 'restore-lalma-sanlu',
    question: 'Restore lalma and sanlu?',
    roots: ['lalma', 'sanlu'],
    reason: 'Needed for Bumrepago.',
  },
  {
    id: 'restore-rohu-sabire-sonsa',
    question: 'Possibly restore rohu, sabire and sonsa?',
    roots: ['rohu', 'sabire', 'sonsa'],
    reason: 'Would avoid re-recording songs.',
  },
];
