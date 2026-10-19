/**
 * The changesets that build Liraasa 2.1 from the frozen 2.0, in the order they
 * apply (ADR-0017). The 2.1 changeset is made from the author's patch by
 * scripts/make_changeset_2_1.ts; the review changeset is written by hand.
 */
export const CHANGESETS_2_1 = [
  'data/changes/2026-10-18-lexicon-2-1.json',
  // the author's answers to the 2.1 integration review: two examples deleted, one ki added
  'data/changes/2026-10-19-lexicon-2-1-review.json',
] as const;
