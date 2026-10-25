/**
 * The changesets that build Liraasa 3.5 from the frozen 3.4 (ADR-0025), in
 * order, made by scripts/make_changeset_3_5.ts.
 */
export const CHANGESETS_3_5 = [
  // the author ratifies 3.0, 3.3 and 3.4 (2026-10-25)
  'data/changes/2026-10-25-lexicon-3-5-ratify.json',
  // Essentials, archetypes and domain packs: every module
  'data/changes/2026-10-25-lexicon-3-5.json',
  // the author ratifies 3.5, rules on maivori (3.5:G152), and keeps zefrolalfo as levitation
  'data/changes/2026-10-25-lexicon-3-5-author.json',
] as const;
