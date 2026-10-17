/**
 * What the grammar guide contains, in one place.
 *
 * Edit this file — not the generator — to change which words get a full
 * breakdown, how big the reference table is, or where the guide is written.
 * Then `npm run build:guide`.
 *
 * Words are named by their stable id from `data/lexicon/ids.json`, never by
 * spelling, so a respelling in a later edition carries through (CLAUDE.md).
 */

export interface CoreGroup {
  title: string;
  /** One or two sentences introducing the group. */
  blurb: string;
  ids: readonly string[];
}

export const GUIDE = {
  /** Read only. Rebuilt by `npm run build:handoff`. */
  lexicon: 'handoff/liraasa_1_2_complete.json',
  ids: 'data/lexicon/ids.json',
  outDir: 'handoff',
  /** The file stem; `.html` and `.pdf` are added. */
  outName: 'Liraasa_1_2_Grammar_Guide',
  title: 'Liraasa 1.2 Grammar Guide',
  subtitle: 'A language built for singing',

  /**
   * The four words under the cover emblem, one per motif: sun, heart, moon,
   * song. Each must be a canon spelling; the build's word check enforces it.
   */
  coverMotif: [
    ['sulba', 'sun'],
    ['lore', 'heart'],
    ['luno', 'moon'],
    ['lira', 'song'],
  ] as const,

  /** Featured words: every form, sound, derivation, compound, rhyme and canon example. */
  coreGroups: [
    {
      title: 'Light and darkness',
      blurb: 'The sky words that carry most of the imagery in the songs.',
      ids: ['lx_lumi_0302', 'lx_narvo_0460', 'lx_sulba_0853', 'lx_luno_0310', 'lx_velu_0989'],
    },
    {
      title: 'The heart',
      blurb: 'Feeling, from love to grief. `opi` is here because it owns the one irregular verb.',
      ids: ['lx_amor_0001', 'lx_lore_0286', 'lx_lavi_0228', 'lx_neme_0470', 'lx_opi_0581'],
    },
    {
      title: 'Life and its edges',
      blurb: 'Living, dying, dreaming and the peace between.',
      ids: ['lx_bio_0034', 'lx_daigo_0065', 'lx_noru_0545', 'lx_sove_0823'],
    },
    {
      title: 'Song, truth and time',
      blurb: 'The words a songwriter reaches for about the work itself.',
      ids: [
        'lx_lira_0272',
        'lx_melo_0369',
        'lx_vani_0940',
        'lx_vera_1019',
        'lx_krono_0193',
        'lx_nimu_0526',
      ],
    },
  ] satisfies readonly CoreGroup[],

  /**
   * The reference table: the next most productive primal roots (ranked by how
   * many compounds use them), shown with four of their seven forms.
   */
  referenceCount: 60,

  /** Canon examples shown per featured word, and compounds listed per side. */
  examplesPerWord: 4,
  compoundsPerSide: 10,
  rhymesPerWord: 12,
} as const;
