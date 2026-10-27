/**
 * The changeset that builds Liraasa 4.0 from the frozen 3.6 (ADR-0029), made by
 * scripts/make_changeset_4_0.ts.
 */
export const CHANGESETS_4_0 = [
  // what translating 2100 Dreams needed
  'data/changes/2026-10-26-lexicon-4-0.json',
  // the author ratifies 3.6 and 4.0 (2026-10-27)
  'data/changes/2026-10-27-lexicon-4-0-ratify.json',
] as const;
