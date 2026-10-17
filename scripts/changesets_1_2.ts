/**
 * The changesets that build Liraasa 1.2 from 1.1, in the order they apply:
 * the grammar rulings first (ADR-0012), then the lexicon update (ADR-0013).
 */
export const CHANGESETS_1_2 = [
  'data/changes/2026-10-17-grammar-rulings.json',
  'data/changes/2026-10-17-lexicon-1-2.json',
] as const;
