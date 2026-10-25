/**
 * The changesets that build Liraasa 3.4 from the frozen 3.3 (ADR-0024), in
 * order, made by scripts/make_changeset_3_4.ts.
 */
export const CHANGESETS_3_4 = [
  // Abstraction and the human condition: proposed, no new roots
  'data/changes/2026-10-25-lexicon-3-4.json',
  // the four 3.3 sentences the author left to the editor's judgement
  'data/changes/2026-10-25-lexicon-3-4-decisions.json',
] as const;
