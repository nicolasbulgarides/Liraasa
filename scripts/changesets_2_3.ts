/**
 * The changesets that build Liraasa 2.3 from the frozen 2.2, in the order they
 * apply (ADR-0019). The 2.3 changeset is made from the author's sound-pass
 * patch by scripts/make_changeset_2_3.ts; the review changeset is written by hand.
 */
export const CHANGESETS_2_3 = [
  'data/changes/2026-10-19-lexicon-2-3.json',
  // the author's answers to the 2.3 integration review: a ruling example and three notes archived
  'data/changes/2026-10-19-lexicon-2-3-review.json',
] as const;
