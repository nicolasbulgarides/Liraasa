/**
 * Liraasa 3.0: The Grammar in Lessons. The twenty 2.5 lessons, unchanged and
 * in their numbers (so a learner's "studied" marks still mean the same
 * lessons), and a sixth part for the 3.0 rulings, proposed until the author
 * ratifies them (ADR-0021). `npm run build:lessons` renders and checks it as
 * before: every example and answer reads clean under the strict checker, and
 * every "watch out" is rejected for the rule it cites.
 *
 * Every Liraasa sentence in the new part is an example of a 3.0 ruling or a
 * line of the patch's prayer: none is composed here.
 */
import { PARTS as PARTS_2_5, type Lesson, type Part } from './lessons_2_5';

export type { Lesson, Part };

export const INTRO = [
  'Liraasa is a language built for singing: every vowel rings, every word ends open, and the grammar keeps a fixed, calm order so the words can be sung without tripping.',
  'These lessons take you through the whole grammar, one small idea at a time. Each takes about ten minutes. Read the idea, say the examples aloud, then try the practice lines before you open the answers. Each lesson uses only what came before it.',
  'Every Liraasa sentence here has been checked against the 3.1 grammar, so you can trust it as a model. The last part, on devotion, music and measure, teaches the 3.0 rulings, which are **proposed**: the author has not yet ratified them. The rule numbers at the foot of each lesson (2.5:G88, 3.0:G129 and so on) point into the Reference Grammar.',
];

const DEVOTION: Part = {
  title: 'Devotion, music and measure (proposed in 3.0)',
  lessons: [
    {
      title: 'Calling on someone: iya, names and titles',
      welcome:
        'In prayer and in song you often speak *to* someone. Liraasa marks the call with one small word, and lets names gather into a litany.',
      points: [
        '`iya` + a name or noun phrase is *O …*: a call to someone. It opens the sentence, set off by a comma, or closes it after one: `Iya Deviasa, lenila maivo!` O Great Goddess, hear me!',
        '`iya` belongs to its noun phrase, so no comma follows it. It may also stand alone, as an invocation: `Iya Lumimare!`',
        'A second noun phrase set off by commas **renames** the first: an *apposition*. It keeps its own `li` and takes no `ke`. Several in a row make a **litany**.',
        'A title of the Goddess used as a **name** is capitalised and takes no `li`: `Deviasa`, `Lumimare`. As a name it owns before `de`, like any name: `Deviasa de lira`, the Great Goddess’s song. A description keeps `li` and stays lower-case: `li mareasa de li lumi`, the mother of light.',
        '`Taivo` and `Saivo` may be capitalised when they mean the Goddess. That is a habit of devotional writing, and changes nothing in the grammar.',
      ],
      examples: [
        ['Iya Deviasa, lenila maivo!', 'O Great Goddess, hear me!'],
        ['Iya Lumimare!', 'O Mother of Light!'],
        [
          'Deviasa, li mare de li veluri, lirala.',
          'The Great Goddess, the mother of the stars, sings.',
        ],
        [
          'Iya Deviasa, Velumare, Lumimare, Liramare!',
          'O Great Goddess, Mother of the Stars, Mother of Light, Mother of Song!',
        ],
        ['Lumimare lirala.', 'The Mother of Light sings.'],
        [
          'Taivo viki pagopa ligo maivo ki, iya maivo de amor?',
          'Would you come near me, O my love?',
        ],
      ],
      watch: [
        [
          'Iya, Deviasa, lenila maivo!',
          '`iya` belongs to its noun phrase: no comma after it.',
          '3.0:G129',
        ],
        ['Deviasa li mare de li veluri lirala.', 'An apposition is set off by commas.', '3.0:G130'],
      ],
      practice: [
        ['“O Mother of Light!”', 'Iya Lumimare!'],
        [
          '“O mother of light, I sing for you.”',
          'Iya li mare de li lumi, maivo lirala vobi taivo.',
        ],
      ],
      rules: ['3.0:G129', '3.0:G130', '3.0:G131', '3.0:G138'],
    },
    {
      title: 'Being, letting be, and asking',
      welcome:
        'Three small turns let Liraasa say *She is*, *Let there be light*, and *please* to the divine.',
      points: [
        '`miyo` after a subject, with nothing after it, says that the subject **exists**: `Saivo miyo.` She is. It takes a tense like any verb: `Saivo po miyo.` She was.',
        '`ke` and `ka` still always need something after them. For bare being, use `miyo`.',
        '`miyo` + a noun phrase with `!` is a **fiat**, *let there be*: `Miyo lumi!` With `pifu` it is a wish: *may there be*. Without either it stays a plain statement: `Miyo lumi.` There is light.',
        'Two set formulas: `Ola-modo po miyo, ola-modo miyo, ola-modo futu miyo.` So it was, so it is, so it shall be. And `Ola-modo pifu.` So be it: amen.',
        '`sela` after the subject is emphatic, *herself*: `Saivo sela po lirala.` After the verb it is still the reflexive, *herself* as the object. `sela` never stands alone as the subject.',
        'A **petition** is a command opened by a call, softened with `fisa`. A command may carry `ne`, `reve` or `loki`, but never a tense, a modal or an evidential.',
      ],
      examples: [
        ['Saivo miyo.', 'She is. (She exists.)'],
        ['Saivo po miyo, saivo miyo, saivo futu miyo.', 'She was, she is, she will be.'],
        ['Miyo lumi!', 'Let there be light!'],
        ['Miyo sove en li nimu pifu.', 'May there be peace in the home.'],
        ['Ola-modo pifu.', 'So be it. (Amen.)'],
        ['Saivo sela po lirala.', 'She herself sang.'],
        [
          'Iya Deviasa, fisa, ne pagopa vofa maivo!',
          'O Great Goddess, please, do not go far from me!',
        ],
        ['Reve lirala!', 'Sing again!'],
      ],
      watch: [
        [
          'Saivo po ke.',
          'A copula needs something after it: for bare being, `Saivo po miyo`.',
          '3.0:G132',
        ],
        ['Sela po lirala.', '`sela` needs a pronoun or noun phrase before it.', '3.0:G134'],
        ['Po lirala!', 'A command carries no tense.', '3.0:G135'],
      ],
      practice: [
        ['“I am.”', 'Maivo miyo.'],
        ['“Let there be light!”', 'Miyo lumi!'],
        ['“Sing again!”', 'Reve lirala!'],
      ],
      rules: ['3.0:G132', '3.0:G133', '3.0:G134', '3.0:G135'],
    },
    {
      title: 'Music, makers and measure',
      welcome:
        'A singing language can now name a note, a beat and a cadence, say who made a song, and count things one by one.',
      points: [
        'Words of music: `lirvi` a note, `dobo` a beat, `monve` a drone, `melopuku` a cadence, `sonbunulu` a scale, `sonbulekta` a chord, `vinye` a lute. Of measure: `lenda` a line, `gaki` an angle, `pidi` a tip, `tiku` precision.',
        '`gagu` after a made work names its **maker**, with no passive verb: `li lira gagu Peta`, the song by Peta. It follows the work, never comes before it.',
        'An **acclamation** needs no verb: a noun phrase, `ala`, a noun phrase, and `!`: `Lumisirmo ala Deviasa!` Glory to the Great Goddess!',
        '`en rinbakrono` is *for ever*. `toda-krono`, always, is unchanged.',
        'A bare noun or number on both sides of `krotiapo` is *one after another*, opening the sentence like a scene-setter: `una krotiapo una`, one by one; `velu krotiapo velu`, star after star.',
        'A matter of style, not grammar: keep the ascended forms for what is truly divine, and let a change of form mark a change of nearness.',
      ],
      examples: [
        ['li lira gagu Peta', 'the song by Peta'],
        ['Lumisirmo ala Deviasa!', 'Glory to the Great Goddess!'],
        ['Benaseno ala taivo, iya Lumimare!', 'Praise to you, O Mother of Light!'],
        ['Saivo futu lirala en rinbakrono.', 'She will sing for ever.'],
        ['Una krotiapo una, li veluri po hiro lirala.', 'One by one, the stars began to sing.'],
        ['Maivo lirajubala ala taivo.', 'I offer you a song.'],
      ],
      watch: [['Peta gagu li lira', '`gagu` follows the work, never precedes it.', '3.0:G136']],
      practice: [
        ['“She will sing for ever.”', 'Saivo futu lirala en rinbakrono.'],
        ['“Glory to the Great Goddess!”', 'Lumisirmo ala Deviasa!'],
      ],
      rules: ['3.0:G136', '3.0:G137', '3.0:G139', '3.0:G140', '3.0:G141'],
    },
  ],
};

export const PARTS: Part[] = [...PARTS_2_5, DEVOTION];

/** The whole clause on one page, for review after the last lesson. */
export const MAP = {
  title: 'The whole sentence on one page',
  lines: [
    '[iya VOCATIVE,] [ata · oro · nara] [FRAME,] [TOPIC hozi,] [ki-word]',
    'SUBJECT [, apposition,]  [po · futu] [noma] [ne] [povi · nosi · musi …] [tavki] [hiro · teki] [telvo …] [roni · tefa · sahi] [reve · loki · bodu]',
    'VERB  [OBJECT]  [adjuncts: en …, la …, tamo …, time words]  [fuyi]  [seye · mufe · poye · pifu]  [ki]  [, (iya) vocative]',
  ],
  np: '[toda · muya …] [li · baba · eli · OWNER de] [una-ne] [dossa] [ruli] [adjective] NOUN-ti-ri [sela] [de …] [gagu …] [raho …]',
};

export const OPEN = [
  'The order of two adjectives before one noun.',
  'How to say *for two days* (a duration): `en rinbakrono` covers only *for ever*.',
  'How to compare actions with no adjective (*I sing more than you*).',
  '`kasi` before a quantifier (`kasi muya`, *more*): only `kasi` + a noun is ruled.',
];
