/**
 * The changesets that build Liraasa 2.0 from the frozen 1.2, in the order they
 * apply (ADR-0016). The 2.0 changeset is made from the author's patch by
 * scripts/make_changeset_2_0.ts; the review changeset is written by hand.
 */
export const CHANGESETS_2_0 = [
  'data/changes/2026-10-18-lexicon-2-0.json',
  // the author's answers from the grammar-guide review: 2.0:G43–G45, lumiasa, two typos
  'data/changes/2026-10-18-lexicon-2-0-review.json',
] as const;
