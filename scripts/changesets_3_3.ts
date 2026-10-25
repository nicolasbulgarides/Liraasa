/**
 * The changesets that build Liraasa 3.3 from the frozen 3.1 (ADR-0023), in
 * order, made by scripts/make_changeset_3_3.ts.
 */
export const CHANGESETS_3_3 = [
  // the author ratifies all of 3.1 (2026-10-25)
  'data/changes/2026-10-25-lexicon-3-3-ratify-3-1.json',
  // Archetypes and the top 2,000: the combined 3.2 + 3.3 patch, proposed
  'data/changes/2026-10-25-lexicon-3-3.json',
] as const;
