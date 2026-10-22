/**
 * The changesets that build Liraasa 2.5 from the frozen 2.3, in the order they
 * apply (ADR-0020). All three are made from the author's 2.5 grammar patch by
 * scripts/make_changeset_2_5.ts, in the order its README sets.
 */
export const CHANGESETS_2_5 = [
  // D-00: 2.5:G87, the album is not grammar canon
  'data/changes/2026-10-22-lexicon-2-5-album.json',
] as const;
