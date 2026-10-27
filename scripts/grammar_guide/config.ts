/**
 * What the grammar guide contains, in one place.
 *
 * Edit this file — not the generator — to change the song the guide reads,
 * the treasury's words, the image-compound samples, or where the guide is
 * written. Then `npm run build:guide`.
 *
 * Words are named by their stable id (each entry's `id`), never by
 * spelling, so a respelling in a later edition carries through (CLAUDE.md).
 */

export interface Theme {
  title: string;
  ids: readonly string[];
}

export const GUIDE = {
  /** Read only. Rebuilt by `npm run build:handoff`. */
  lexicon: 'handoff/liraasa_4_1_complete.json',
  /** The frozen 1.0, read only for its headword count in the edition note. */
  lexicon10: 'data/lexicon/liraasa_1_0.json',
  outDir: 'handoff',
  /** The file stem; `.html` and `.pdf` are added. */
  outName: 'Liraasa_4_1_Reference_Grammar',
  title: 'Liraasa 4.1 Reference Grammar',
  subtitle: 'A language built for singing',

  /**
   * Rhyme families shown in Sound and singing, by their rhyme (the word from
   * its stressed vowel to the end). Each must still join two different roots.
   */
  rhymeShowcase: ['evi', 'era', 'ivo', 'igo', 'avu'],

  /** Adjectives shown for each `-san` rhyme set, by headword id: two per vowel. */
  sanShowcase: [
    'lx_lira_0272',
    'lx_bena_0030',
    'lx_lore_0286',
    'lx_sove_0823',
    'lx_vani_0940',
    'lx_lumi_0302',
    'lx_luno_0310',
    'lx_melo_0369',
    'lx_velu_0989',
    'lx_ramu_0621',
  ],

  /**
   * The four words under the cover emblem, one per motif: sun, heart, moon,
   * song, by id, so a respelling carries through (sun is `sola` from 2.1).
   */
  coverMotif: [
    ['lx_sulba_0853', 'sun'],
    ['lx_lore_0286', 'heart'],
    ['lx_luno_0310', 'moon'],
    ['lx_lira_0272', 'song'],
  ] as const,

  /** Foreign names as Liraasa copies them (2.0:G45): [the name, its Liraasa spelling]. */
  names: [
    ['Peter', 'Peta'],
    ['Pietri', 'Petri'],
  ],

  /** The author's song, read line by line in its own part: title, English title, then line pairs. */
  song: 'data/songs/Nemelira de devi.txt',

  /** The core roots of the treasury, each shown with every form it uses. */
  coreRoots: [
    'lx_lumi_0302',
    'lx_narvo_0460',
    'lx_sulba_0853',
    'lx_luno_0310',
    'lx_velu_0989',
    'lx_navu_0463',
    'lx_amor_0001',
    'lx_lore_0286',
    'lx_lavi_0228',
    'lx_neme_0470',
    'lx_opi_0581',
    'lx_bio_0034',
    'lx_daigo_0065',
    'lx_noru_0545',
    'lx_sove_0823',
    'lx_lira_0272',
    'lx_melo_0369',
    'lx_vani_0940',
    'lx_vera_1019',
    'lx_krono_0193',
    'lx_nimu_0526',
    'lx_devi_1592',
  ],

  /** Compounds chosen for their beauty, by theme. */
  treasury: [
    {
      title: 'Sky and light',
      ids: [
        'lx_mernolumi_0383',
        'lx_vesnolumi_1026',
        'lx_lunolumi_0323',
        'lx_velulamsa_0996',
        'lx_velumelo_1589',
        'lx_vamrisevu_1630',
        'lx_darnovelu_1829',
        'lx_lavlolumi_1610',
        'lx_mirulumi_1632',
        // renlisulba and nevlosulba are left out: their head comes first (a sunshower is rain)
        'lx_sevulumi_1633',
        'lx_navulalvu_0465',
        'lx_velulekta_1739',
      ],
    },
    {
      title: 'The heart',
      ids: [
        'lx_nemeamor_0471',
        'lx_lavineme_0238',
        'lx_momvilavi_0430',
        'lx_meraneme_0379',
        'lx_lorenerpo_1852',
        'lx_loterotelne_1607',
        'lx_vanineme_1604',
        'lx_balbuvani_1605',
        'lx_aurumimeyi_1606',
        'lx_sabesuru_0720',
        'lx_molulaso_0421',
        'lx_lorelumi_0288',
      ],
    },
    {
      title: 'Song',
      ids: [
        'lx_somulira_0817',
        'lx_vorbalira_1046',
        'lx_daigolira_1575',
        'lx_vemilira_1590',
        'lx_lasomambi_1838',
        'lx_melolavi_1844',
        'lx_savalilira_0745',
        'lx_ramulira_0626',
      ],
    },
    {
      title: 'Life, death and return',
      ids: [
        'lx_biorelnu_1578',
        'lx_benarelnu_1581',
        'lx_biokerso_1849',
        'lx_biokende_1835',
        'lx_daigoramu_1834',
        'lx_relnulomo_0648',
        'lx_lulfakova_1833',
        'lx_mavolumitilma_1591',
        'lx_fatotilma_1851',
        'lx_nimunulu_0528',
      ],
    },
    {
      title: 'Rain, wind and seasons',
      ids: [
        'lx_renlilaso_0661',
        'lx_ruhelaso_0702',
        'lx_vayebelda_0948',
        'lx_lavlosonbu_0247',
        'lx_renlifolni_0658',
        'lx_nilvunullo_1650',
        'lx_sovekrono_1828',
        'lx_mernomiru_0384',
        'lx_vesesonbu_1827',
        'lx_lunofolni_0315',
      ],
    },
  ] satisfies readonly Theme[],

  /** Image-compound pairs shown read by rule (2.0:G40): [modifier id, head id]. */
  patternSamples: [
    ['lx_velu_0989', 'lx_vilne_1030'],
    ['lx_sevu_0770', 'lx_havli_0158'],
    ['lx_noru_0545', 'lx_nulu_0572'],
    ['lx_ramu_0621', 'lx_belda_0026'],
    ['lx_nevlo_0491', 'lx_savali_0744'],
    ['lx_velu_0989', 'lx_vulra_1049'],
    ['lx_merno_0381', 'lx_pomli_0607'],
    ['lx_vesno_1023', 'lx_lira_0272'],
    ['lx_lumi_0302', 'lx_manli_0347'],
  ],
} as const;

/**
 * Where the published documents live for readers: the public repository, and
 * the branch `npm run publish:guide` commits them to after every rebuild. The
 * stable names do not change between editions, so a printed link keeps working.
 */
export const CODEX = {
  repoUrl: 'https://github.com/nicolasbulgarides/Liraasa',
  branch: 'codex-latest',
  stable: {
    reference: 'Liraasa_Reference_Grammar.pdf',
    referenceHtml: 'Liraasa_Reference_Grammar.html',
    lexicon: 'liraasa_lexicon.json',
  },
} as const;

/** A published file's page on GitHub. */
export function codexUrl(file: string): string {
  return `${CODEX.repoUrl}/blob/${CODEX.branch}/${file}`;
}

/**
 * The Invitation: a short, shareable introduction, built from the same
 * lexicon and checked the same way. Its prose is in `invitation.ts`; the
 * words it shows are chosen here, by id.
 */
export const INVITATION = {
  outName: 'Liraasa_Invitation',
  title: 'Liraasa: An Invitation',
  /** The album the opening and the last page point to. */
  album: 'Liraasa: Songs of the First Stars',
  albumUrl: 'https://music.apple.com/us/album/liraasa-songs-of-the-first-stars/6824147719',
  /** Who made Liraasa, as the credits name them. */
  author: 'Peter Pietri',

  /**
   * Glosses the booklet shows in place of the lexicon's, by spelling. Each is
   * listed for the author's review on every build; the lexicon is unchanged.
   */
  displayGlosses: {
    daigoda: 'to die',
    daigoasasan: 'of the final death',
    daigosan: 'mortal',
    raho: 'which',
    lunolumi: 'moonlight',
  } as Readonly<Record<string, string>>,

  /** The Lament phrase set on the beat grid; its strong beats must fall at even intervals. */
  beatLine: ['Kube taivo relnura', 'When you return'],

  /** Words English has no single word for: compounds shown as their two parts. */
  untranslatables: [
    'lx_loterotelne_1607',
    'lx_lorenerpo_1852',
    'lx_balbuvani_1605',
    'lx_aurumimeyi_1606',
    'lx_lasomambi_1838',
    'lx_nemeamor_0471',
    'lx_vanineme_1604',
    'lx_momvilavi_0430',
    'lx_sabesuru_0720',
    'lx_melolavi_1844',
  ],

  /** The root shown in all seven shapes, and a root with an empty cell. */
  sevenFormsRoot: 'lx_daigo_0065',
  emptyCellRoot: 'lx_garvu_1457',

  /** Image-engine pairs shown [modifier id, head id]; lunosavali is in the running text. */
  imageExamples: [
    ['lx_velu_0989', 'lx_vulra_1049'],
    ['lx_nevlo_0491', 'lx_savali_0744'],
    ['lx_velu_0989', 'lx_vilne_1030'],
    ['lx_sevu_0770', 'lx_havli_0158'],
    ['lx_noru_0545', 'lx_nulu_0572'],
    ['lx_ramu_0621', 'lx_belda_0026'],
    ['lx_vesno_1023', 'lx_lira_0272'],
    ['lx_lumi_0302', 'lx_manli_0347'],
  ],

  /** The “try it” pairs: the reader joins each modifier to its head. */
  tryPairs: [
    // merno + lira (mernolira) is a headword since 3.0, aubade: no longer a pattern example
    ['lx_merno_0381', 'lx_vaye_0945'],
    ['lx_noru_0545', 'lx_havli_0158'],
    ['lx_nevlo_0491', 'lx_belda_0026'],
  ],
} as const;
