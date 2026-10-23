/**
 * The changesets that build Liraasa 2.5 from the frozen 2.3, in the order they
 * apply (ADR-0020). All three are made from the author's 2.5 grammar patch by
 * scripts/make_changeset_2_5.ts, in the order its README sets.
 */
export const CHANGESETS_2_5 = [
  // D-00: 2.5:G87, the album is not grammar canon
  'data/changes/2026-10-22-lexicon-2-5-album.json',
  // the author's decisions on the 2.3 audit: rulings 2.5:G88-G128, in the patch's order
  'data/changes/2026-10-22-lexicon-2-5.json',
  // the housekeeping the author approved (I-26, I-27, I-33, I-40, I-41, I-44)
  'data/changes/2026-10-22-lexicon-2-5-housekeeping.json',
] as const;
