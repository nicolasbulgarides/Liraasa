/**
 * The teaching chapters of the grammar guide.
 *
 * The guide teaches the language; governance, storage and edition history
 * live elsewhere (the full rulings are written beside it as Markdown). Prose
 * is written here, as short as it can be while still teaching; every table,
 * count, ruling and example is read from the lexicon at build time.
 */
import { FORM_SLOTS, SLOT_BUILD, isUnusedGloss, type FormSlot } from '../../src/core/config/slots';
import { sound } from './sound';
import {
  canonTexts,
  formOf,
  glossOf,
  isCanonText,
  isUsed,
  liveExamples,
  normGloss,
  rulingById,
  type Headword,
  type Index,
  type Lexicon,
} from './data';
import { GUIDE } from './config';
import {
  badge,
  calloutHtml,
  cell,
  composedGloss,
  esc,
  forReview,
  examples,
  h3,
  lir,
  md,
  morph,
  p,
  part,
  table,
  ul,
} from './html';

function n(x: number): string {
  return x.toLocaleString('en-US');
}

/** A function word's form: a suffix is a morpheme, anything else is Liraasa. */
function fwForm(form: string): string {
  return form.startsWith('-') ? morph(form) : lir(form);
}

function fw(lex: Lexicon, form: string) {
  const w = lex.function_words.find((f) => f.form === form);
  if (w === undefined) throw new Error(`function word ${form} is missing from the lexicon`);
  return w;
}

/** A function word's position, without the data's provenance note (“| v0.5: author correction”). */
function usage(position: string): string {
  return position.replace(/\s*\|\s*v\d[^|]*$/, '').trim();
}

/** `ke` temporary is / are · `ka` enduring is / are …, in the guide's markup. */
function wordList(lex: Lexicon, forms: readonly string[]): string {
  return forms.map((f) => `\`${fw(lex, f).form}\` ${fw(lex, f).meaning}`).join(' · ');
}

/** A ruling's text, read from the lexicon; the build fails if it is missing. */
function rulingText(lex: Lexicon, id: string): string {
  const r = rulingById(lex, id);
  if (r === undefined) throw new Error(`ruling ${id} is missing from the lexicon`);
  return r.ruling;
}

function headword(index: Index, root: string): Headword {
  const h = index.byRoot.get(root);
  if (h === undefined) throw new Error(`${root} is not a headword`);
  return h;
}

/** The English of a canon example, found by its exact Liraasa. */
function canonEnglish(lex: Lexicon, liraasa: string): string {
  const e = liveExamples(lex).find((x) => x.liraasa === liraasa);
  if (e === undefined) throw new Error(`"${liraasa}" is not a canon example`);
  return e.english;
}

// ------------------------------------------------------------ 1. What it is

export function welcome(index: Index): string {
  const lex = index.lex;
  const h = lex.headwords;
  const primal = h.filter((x) => x.type === 'Primal').length;
  const lira = headword(index, 'lira');
  const thanks = 'Lorejuba ala taivo.';

  const first = ['yeko', 'voge', 'zabo', 'kepi', 'fisa', 'yade', 'lorejuba']
    .map((f) => `<li>${lir(f)} <span class="gloss">${esc(fw(lex, f).meaning)}</span></li>`)
    .join('');

  return part(
    '1',
    'What Liraasa is',
    `\`${formOf(lira, 'ascended')}\` is the ascended form of \`lira\`, song: “${glossOf(lira, 'ascended')}”. A goddess-centric language, built for singing.`,
    `${p(`${n(h.length)} headwords: ${n(primal)} roots and ${n(h.length - primal)} compounds.`)}
${h3('The grammar in eight lines')}
<ol class="essentials">${[
      'Every vowel is its own syllable; stress falls on the second-to-last. Spelling is sound.',
      'Every headword has **seven slots** by rule: a noun, its ascended and negative nouns, an adjective for each, and a verb.',
      'A compound is two headwords written as one, **head last**: `luno` + `lumi` = `lunolumi`, moonlight.',
      'Word order is **subject, verb, object**; tense and every operator stand before the verb.',
      '**Adjectives come before the noun**, and a noun never modifies a noun: make the first an adjective.',
      'Two copulas: `ke` for what is so now, `ka` for what is so by nature.',
      'A question keeps statement order and ends in `ki`.',
      '`-ri` makes a plural, `-ti` a little or dear thing. In X `de` Y, Y owns X, unless X is a pronoun or a name.',
    ]
      .map((s) => `<li>${md(s)}</li>`)
      .join('')}</ol>
<aside class="first-words" aria-labelledby="first-words-h"><h3 id="first-words-h" data-toc="First words">First words</h3>
<ul>${first}<li>${lir(thanks)} <span class="gloss">${esc(canonEnglish(lex, thanks))}</span></li></ul></aside>`,
  );
}

// --------------------------------------------------------- 2. Sound and song

/**
 * 0.8:R5 holds two rules: li may be dropped in everyday speech as well as in
 * verse, and baba only in verse. The guide teaches them in different places.
 */
function omission(lex: Lexicon): [string, string, string] {
  const text = rulingText(lex, '0.8:R5');
  const m = /^(li [^.]*\.)\s*(baba [^.]*\.)$/.exec(text);
  if (m === null) throw new Error('0.8:R5 no longer reads "li … . baba … ." : revise the guide');
  return [text, m[1] ?? '', m[2] ?? ''];
}

/**
 * A word's rhyme: from its stressed vowel to the end. Every vowel is its own
 * syllable and stress falls on the second-to-last, so the rhyme starts at
 * the second-to-last vowel (a one-vowel word rhymes on its vowel).
 */
export function rhymeOf(word: string): string {
  const vowels = [...word.matchAll(/[aeiou]/g)].map((m) => m.index);
  const at = vowels.length >= 2 ? vowels[vowels.length - 2] : vowels[0];
  return word.slice(at ?? 0);
}

/**
 * Rhyme families: the headwords, pronouns and single small words that share
 * a rhyme, counted by the root they end in. A compound ends in its head, so
 * `daigolira` counts as `lira`: two words with the same final root are an
 * identity rhyme, not two members. A small word built on another member
 * (`futupago` on `pago`) is the same rhyme again and is left out too.
 */
export function rhymeFamilies(index: Index): Map<string, string[]> {
  const lex = index.lex;
  const finalRoot = (root: string): string => {
    let h = index.byRoot.get(root);
    let at = root;
    while (h?.components) {
      at = h.components[1];
      h = index.byRoot.get(at);
    }
    return at;
  };
  const byRhyme = new Map<string, Set<string>>();
  const add = (word: string): void => {
    const r = rhymeOf(word);
    const set = byRhyme.get(r) ?? new Set<string>();
    set.add(word);
    byRhyme.set(r, set);
  };
  for (const h of lex.headwords) add(finalRoot(h.root));
  const closed = [
    ...lex.function_words.map((w) => w.form),
    ...lex.pronouns.map((x) => x.form),
  ].filter((f) => /^[a-z-]+$/.test(f) && !f.startsWith('-') && !f.endsWith('-'));
  const isHeadword = (w: string): boolean => index.byRoot.has(w);
  for (const f of closed) add(f.split('-').pop() ?? f);

  const families = new Map<string, string[]>();
  for (const [r, set] of byRhyme) {
    const words = [...set];
    const kept = words.filter(
      (w) => isHeadword(w) || !words.some((o) => o !== w && w.length > o.length && w.endsWith(o)),
    );
    if (kept.length > 1) families.set(r, kept);
  }
  return families;
}

export function soundPart(index: Index): string {
  const lex = index.lex;
  const ph = lex.phonology;
  const sample = ['lira', 'maivo', 'opioa', 'benaasa', 'lunolumi'];

  const rhymes = rhymeFamilies(index);
  const families = GUIDE.rhymeShowcase
    .map((r) => {
      const members = rhymes.get(r);
      if (members === undefined) throw new Error(`config: -${r} no longer joins two roots`);
      return `<li><strong>-${esc(r)}</strong>: ${members.map((m) => lir(m)).join(', ')}</li>`;
    })
    .join('');

  // the rhyme of an adjective is the vowel before -san, plus -san
  const sanSets = ['a', 'e', 'i', 'o', 'u'].map((v) => {
    const count = lex.headwords.filter(
      (h) => isUsed(h, 'adjective') && formOf(h, 'adjective').endsWith(`${v}san`),
    ).length;
    const chosen = GUIDE.sanShowcase
      .map((id) => index.byId.get(id))
      .filter((h): h is Headword => h !== undefined && formOf(h, 'adjective').endsWith(`${v}san`))
      .map((h) => `\`${formOf(h, 'adjective')}\``);
    return `\`-${v}san\` ${n(count)} (${chosen.join(', ')})`;
  });

  const g31 = rulingText(lex, '1.2:G31');
  const narrative = /In verse[^.]*\./.exec(g31)?.[0];
  if (narrative === undefined) throw new Error('1.2:G31 no longer states the narrative present');
  const [, , babaRule] = omission(lex);

  return part(
    '2',
    'Sound and singing',
    'The spelling is phonetic: what you see is what you sing.',
    `${table(
      ['Aspect', 'Rule'],
      [
        ['Vowels', esc(ph.vowels)],
        ['Letters', `${esc(ph.consonants_core)}; ${esc(ph.consonants_other)}`],
        ['Stress', esc(ph.stress)],
      ].map(([a, b]) => [cell(esc(a ?? '')), cell(b ?? '')]),
      { cls: 'compact' },
    )}
${p(`${rulingText(lex, '2.0:G43')} [[2.0:G43]]`)}
${p('Adjacent vowels never merge. A consonant between vowels starts the next syllable; of two, the first closes the syllable before. Capitals mark the stress:')}
${table(
  ['Word', 'Syllables and stress'],
  sample.map((w) => [cell(lir(w)), cell(sound(w))]),
  { cls: 'compact' },
)}
${h3('Writing for song')}
${ul([
  '**Stress and the beat.** Every word falls from its stressed syllable to a light last one: set the stressed syllable on a strong beat and let the last fall on a weak one. The small words are short and unstressed; let them fill the weak beats.',
  `**Neighbouring vowels.** ${rulingText(lex, '2.0:G44')} [[2.0:G44]] [[0.8:R8]]`,
  `**Rhyme.** A rhyme runs from the stressed vowel to the end of the word: \`devi\`, \`nevi\` and \`jurevi\` rhyme on -evi. A compound ends in its head, so \`lira\` and \`daigolira\` share the whole rhyme: an identity rhyme, the same word sounding twice, and a family counts it once. Counted by the root each word ends in, across headwords, pronouns and small words, there are ${n(rhymes.size)} rhyme families. Five of them:`,
])}
<ul class="families">${families}</ul>
${p(`Every adjective ends in \`-san\`, so adjectives at the ends of lines rhyme in five sets, by the vowel before it: ${sanSets.join(' · ')}.`)}
${h3('Licences of verse')}
${ul([
  `${babaRule} [[0.8:R5]]`,
  `${narrative} [[1.2:G31]]`,
  'After a number or quantifier the plural `-ri` is optional: choose by sound and meter [[1.2:G28]].',
])}
${h3('Sound follows meaning')}
${p(`For new and respelled roots: ${rulingText(lex, '2.1:G57').replace(/^Guidance for new and respelled roots: /, '')} [[2.1:G57]]`)}
${h3('Names')}
${p(`${rulingText(lex, '2.0:G45')} [[2.0:G45]] A name may take the affectionate \`-ti\` [[0.8:R12]].`)}
<p>${GUIDE.names.map(([en, li]) => `${esc(en)} becomes ${lir(li, 'name')}`).join('; ')}.</p>`,
  );
}

// ------------------------------------------------------------------ 3. Words

const GRID: readonly (readonly [string, FormSlot, FormSlot])[] = [
  ['Plain', 'root', 'adjective'],
  ['Ascended', 'ascended', 'ascendedAdjective'],
  ['Negative', 'negative', 'negativeAdjective'],
];

/** One cell of the seven-form grid: the form, its meaning, or its emptiness. */
function formCell(h: Headword, slot: FormSlot, rules: boolean): string {
  const used = isUsed(h, slot);
  const rule = rules ? `<span class="build">${morph(SLOT_BUILD[slot])}</span>` : '';
  return `${lir(formOf(h, slot), used ? 'text' : 'unused-slot')}${rule}<span class="gloss">${
    used ? esc(normGloss(glossOf(h, slot))) : '<em>empty</em>'
  }</span>`;
}

/** The seven forms as a grid: plain, ascended, negative × noun, adjective; the verb below. */
function formGrid(h: Headword, rules: boolean): string {
  return table(
    ['', 'Noun', 'Adjective'],
    [
      ...GRID.map(([label, noun, adj]) => [
        cell(`<strong>${esc(label)}</strong>`),
        cell(formCell(h, noun, rules)),
        cell(formCell(h, adj, rules)),
      ]),
      [cell('<strong>Verb</strong>'), cell(formCell(h, 'verb', rules)), cell('')],
    ],
    { cls: 'forms grid7' },
  );
}

export function wordsPart(index: Index): string {
  const lex = index.lex;
  const bena = headword(index, 'bena');
  const daigo = headword(index, 'daigo');
  const lumi = headword(index, 'lumi');
  const narvo = headword(index, 'narvo');
  const devi = headword(index, 'devi');
  if (isUsed(devi, 'verb')) throw new Error('devi now has a verb: choose another empty form');
  const total = lex.headwords.length * FORM_SLOTS.length;
  const empty = lex.headwords.reduce(
    (acc, x) => acc + FORM_SLOTS.filter((s) => isUnusedGloss(glossOf(x, s))).length,
    0,
  );

  const verbExamples = ['lira', 'sabe', 'nedu', 'amor', 'opi']
    .map((r) => index.byRoot.get(r))
    .filter((h) => h !== undefined);
  const verbRule = table(
    ['Root begins with', 'Verb', 'Example'],
    Object.entries(lex.morphology.verb_rule).map(([k, v]) => {
      const ex = verbExamples.find((h) =>
        k === 'opi'
          ? h.root === 'opi'
          : k === 'n-initial'
            ? h.root.startsWith('n')
            : k === 's-initial'
              ? h.root.startsWith('s')
              : k === 'vowel-initial'
                ? /^[aeiu]/.test(h.root)
                : h.root === 'lira',
      );
      return [
        cell(k === 'opi' ? lir('opi') : esc(k)),
        cell(k === 'opi' ? lir(v) : esc(v)),
        cell(ex === undefined ? '' : `${lir(ex.root)} → ${lir(formOf(ex, 'verb'))}`),
      ];
    }),
    { cls: 'compact' },
  );

  const defaults = lex.morphology.derivation_defaults ?? {};
  const suffixes = table(
    ['Suffix', 'Meaning', 'Default reading'],
    Object.entries(lex.morphology.suffixes).map(([k, v]) => [
      cell(morph(k)),
      // the data's asides belong to Appendix B and 2.0:G41, not to this table
      cell(esc(v.replace(/\s*\(.*\)$/, ''))),
      cell(esc(defaults[k] ?? '')),
    ]),
    { cls: 'compact' },
  );

  const soulbond = index.byId.get('lx_mavolumitilma_1591');
  if (soulbond === undefined) throw new Error('lx_mavolumitilma_1591 is gone');
  const [sbA, sbB] = soulbond.components ?? ['', ''];
  const motion = Object.entries(lex.motion_prefixes.canon)
    .map(([k, v]) => `\`${k}\` ${v}`)
    .join(' · ');

  return part(
    '3',
    'Words',
    'Seven forms by rule, and meanings that are often the word’s own.',
    `${h3('The seven forms')}
${p('Every headword fills the same grid. Here it is for `bena`, good, with the rule for each cell:')}
${formGrid(bena, true)}
${p(`**Ascended** is the ultimate, cosmic degree, for good or ill: \`${formOf(lumi, 'ascended')}\` ${normGloss(glossOf(lumi, 'ascended'))}; \`${formOf(narvo, 'ascended')}\` ${normGloss(glossOf(narvo, 'ascended'))}, \`${formOf(narvo, 'ascendedAdjective')}\` ${normGloss(glossOf(narvo, 'ascendedAdjective'))}. **Negative** is the absence or the reversal.`)}
<p>${md(`**Many cells are empty.** ${n(empty)} of the ${n(total)} forms have no meaning: the lexicon marks them unused, and this guide strikes them through. \`devi\`, goddess, has no verb:`)} ${lir(formOf(devi, 'verb'), 'unused-slot')} ${md('is an empty form, and an empty form is not a word.')}</p>
${p('**Meanings are lexicalized.** The ascended and negative meanings are fixed by the lexicon, not summed from the parts: `daigo`, death, has resurrection as its negative.')}
${formGrid(daigo, false)}
${h3('The verb rule')}
${verbRule}
${p('A compound takes the verb class of its first letter. `opi`, hope, owns the one irregular verb.')}
${h3('Derivations')}
${p(`Order: **${esc(lex.morphology.suffix_order)}**. Derivations attach to any root or compound, with these default readings; a listed meaning (Appendix B) overrides the default [[2.0:G41]] [[1.0:G20]].`)}
${suffixes}
${h3('Compounds')}
${ul([
  'MODIFIER + HEAD, written as one word, head last; the spelling is the two joined. A compound is one word, never two nouns side by side.',
  `Either part may itself be a compound [[2.0:G42]]: \`${soulbond.root}\` = \`${sbA}\` ${index.senseOf(sbA)} + \`${sbB}\` ${index.senseOf(sbB)}, ${normGloss(glossOf(soulbond, 'root'))}. A colour base may be the modifier, and a compound may be lexicalised with \`-ti\` [[2.0:G38]].`,
  'Image compounds are a pattern, not a list: any listed modifier with any listed head [[2.0:G40]] (Part 9).',
])}
${h3('Motion prefixes')}
${p(`Written with a hyphen before the verb: \`revo-sabesia\`, recognize [[1.2:G35]]. A ${lex.motion_prefixes.rule}: ${motion}.`)}
${h3('Registers')}
${p('Entries are everyday or poetic. A headword whose root meaning is inherently sacred may be marked sacred after review; none has been yet [[0.8:R10]].')}`,
  );
}

// ------------------------------------------------------------- 4. Small words

/** Which letters only a closed class uses: checked, so the sentence stays true. */
function digraphLine(index: Index): string {
  const lex = index.lex;
  const colours = new Set(
    lex.colors.flatMap((c) =>
      Object.entries(c)
        .filter(([k]) => k !== 'Family' && k !== 'Example meanings / notes' && k !== 'id')
        .map(([, v]) => v),
    ),
  );
  const numbers = new Set([
    ...Object.values(lex.numbers.lookup_0_999),
    ...lex.numbers.rules.map((r) => String(r.Liraasa)),
  ]);
  const words = [
    ...lex.headwords.flatMap((h) => Object.values(h.forms)),
    ...lex.function_words.map((w) => w.form),
    ...colours,
    ...numbers,
  ];
  const sh = words.filter((w) => w.includes('sh'));
  const ch = words.filter((w) => w.includes('ch'));
  if (!sh.every((w) => colours.has(w)) || !ch.every((w) => numbers.has(w))) {
    throw new Error('sh or ch now occurs outside the colour and number words: revise the guide');
  }
  return 'sh is written only in colour words (`shada`), and ch only in `ocha`, eight, and the numbers built on it.';
}

export function smallWordsPart(index: Index): string {
  const lex = index.lex;
  const G67A = example(lex, '2.2:G67', 'Li lavra semnesia nazru li nimu.');
  const G67B = example(
    lex,
    '2.2:G67',
    'saivo de melonulu venreva nazru gase baba lira de ruhesonbu.',
  );
  const gl67 = (l: string, english: string): string =>
    composedGloss(l, english, 'Reference, The small words: 2.2:G67');
  const pronouns = table(
    ['Form', 'Person', 'Number'],
    lex.pronouns.map((x) => [cell(lir(x.form), 'form'), cell(esc(x.person)), cell(esc(x.number))]),
    { cls: 'compact' },
  );

  const dets = [...new Set(lex.correlatives.map((c) => c.determiner))];
  const concepts = [...new Set(lex.correlatives.map((c) => c.concept))];
  const grid = table(
    ['', ...concepts],
    dets.map((d) => [
      cell(lir(d), 'form'),
      ...concepts.map((c) => {
        const x = lex.correlatives.find((r) => r.determiner === d && r.concept === c);
        return x === undefined
          ? cell('')
          : cell(`${lir(x.form)}<span class="gloss">${esc(x.gloss)}</span>`);
      }),
    ]),
    { cls: 'grid' },
  );

  const digits = Object.entries(lex.numbers.lookup_0_999)
    .slice(0, 10)
    .map(([v, w]) => `${esc(v)} ${lir(w)}`)
    .join(' · ');

  const colours = table(
    ['Family', 'Base', '+narvo dark', '+bio life', '+juba gem', '+lumi light'],
    lex.colors.map((c) => [
      cell(esc(c.Family ?? '')),
      ...['Base color', 'Dark + narvo', 'Life + bio', 'Gem + juba', 'Light + lumi'].map((k) =>
        cell(lir(c[k] ?? '')),
      ),
    ]),
    { cls: 'compact' },
  );

  return part(
    '4',
    'The small words',
    'Closed classes, each with its own pattern.',
    `${h3('Pronouns')}
${pronouns}
${p('Possessive: PRONOUN `de` X, `maivo de lira`, my song. Reflexive: PRONOUN `sela`, `maivo sela`, myself.')}
${h3('Correlatives: determiner + concept')}
${grid}
${p(`Beside the grid: ${wordList(lex, ['ki-eli', 'ki-muya', 'ki-oro'])}.`)}
${p('Place, time, manner and cause (`-pago`, `-krono`, `-modo`, `-kasa`) work as adverbials; thing and person (`-coda`, `-nela`) as nouns. `muya-krono` often, `poka-krono` rarely, `rada-krono` each time [[1.2:G34]].')}
${p('A number joined to `krono` counts the times: `una-krono` once, `dossa-krono` twice; `ki-muya-krono` how many times; `una-ne krono` the first time. `una-krono` never means “formerly”: that is `somi-krono` [[2.1:G49]].')}
${p('A bare measure after the object is a duration; `kroti` + a measure, with no article, is “ago”; `krotiapo` + a measure is “in, after”. With `li` + a noun, `kroti` and `krotiapo` are “before” and “after” it [[2.1:G55]].')}
${h3('Side nouns as prepositions')}
${p(`\`nazru\` (behind), \`zavme\` (in front of), \`silda\` (beside), \`cemnu\` (in the middle of), \`lizma\` (left of) and \`rizno\` (right of) may stand bare before a noun phrase as prepositions, or after a verb as adverbs: \`${G67A}\` ${gl67(G67A, 'The bird sits behind the home.')} \`${G67B}\` ${gl67(G67B, 'Her melody comes behind, like a song of thunder.')} [[2.2:G67]]`)}
${h3('Numbers')}
<p class="chips">${digits}</p>
${p('Ten is `unzira`; 11–19 add the unit with a hyphen: `unzira-una`, 11. Tens 20–50 contract (`dozira`, `trezira`, `cuazira`, `penzira`); from 60 they are the digit + `zira`: `sesazira`, `nivazira`. Hundreds are the digit + `centa`, and the rest joins with hyphens: `dossacenta-unzira-penta`, 215. `centa` is one hundred, `mililumi` a thousand. Ordinals take `-ne` (`una-ne`, first); fractions are N `de` N (`tressa de cuara`). A `ne` after a number is never negation.')}
${h3('Colours')}
${p(`Nine families, a base and four shades each. ${digraphLine(index)} A colour base may lead a compound [[2.0:G38]]; \`aurumijuba\` and \`vanajuba\` are also headwords [[2.0:G39]].`)}
${colours}
${h3('Discourse particles')}
${table(
  ['Particle', 'Function', 'Where', 'Example'],
  lex.discourse_particles.map((d) => {
    const e = d.examples[0];
    return [
      cell(lir(d.form), 'form'),
      cell(esc(d.function)),
      cell(esc(d.positions)),
      cell(e === undefined ? '' : `${lir(e.liraasa)}<span class="gloss">${esc(e.english)}</span>`),
    ];
  }),
  { cls: 'compact' },
)}`,
  );
}

// ---------------------------------------------------------------- 5. Clause

/** A sentence quoted from a ruling's own text; the build fails if the ruling no longer has it. */
function quoted(lex: Lexicon, id: string, sentence: string): string {
  if (!rulingText(lex, id).includes(sentence))
    throw new Error(`${id} no longer quotes "${sentence}"`);
  return sentence;
}

/** A ruling's own example sentence (2.2 lists them apart from the text); the build fails if it is gone. */
function example(lex: Lexicon, id: string, sentence: string): string {
  if (!(rulingById(lex, id)?.examples ?? []).some(([l]) => l === sentence))
    throw new Error(`${id} no longer has the example "${sentence}"`);
  return sentence;
}

export function clausePart(index: Index): string {
  const lex = index.lex;
  const g = lex.grammar;
  // the 2.1 and 2.2 rulings' own sentences; their English is the guide's, awaiting the author
  const G60A = example(lex, '2.2:G60', 'Ki-pago taivo pagopa ki?');
  const G60C = example(lex, '2.2:G60', 'maivori ne sabesia ki-coda maivori ramura.');
  const G61A = example(lex, '2.2:G61', 'Li nullo ka ki-modo vanisan!');
  const G61B = example(lex, '2.2:G61', 'Ki-eli nullo!');
  const G61C = example(lex, '2.2:G61', 'Li nullo ka ki-modo vanisan ki?');
  const G62A = example(
    lex,
    '2.2:G62',
    'taivo ke tonsi corvisan fime taivo viki savalisia maivo ki?',
  );
  const G62B = example(lex, '2.2:G62', 'si maivo ke tonsi lukasan, maivo futu ne salrusia.');
  const G116 = example(lex, '2.5:G116', 'Maivo lirala, kopisa taivo nosi rilura.');
  const G113A = example(lex, '2.5:G113', 'Maivo po venreva eli-pago kopisa lirala.');
  const G113B = example(lex, '2.5:G113', 'Maivo lirala kopisa taivo rilura.');
  const G88A = example(lex, '2.5:G88', 'Ki-kasa taivo po amora maivo?');
  const G88B = example(lex, '2.5:G88', 'Taivo pagopa ki-pago ki?');
  const G93A = example(lex, '2.5:G93', 'Li kavbikova ke su li tabu.');
  const G93B = example(lex, '2.5:G93', 'Maivo ka lirayo.');
  const G94 = example(lex, '2.5:G94', 'Saivo kapoki benasan.');
  const G128 = example(lex, '2.5:G128', 'Nela vanisan.');
  const G90 = example(lex, '2.5:G90', 'Fisa, ne lirala.');
  const G115 = example(lex, '2.5:G115', 'Li sabeyo raho vismava eli, ne yehu vimova li vordu.');
  const G120 = example(lex, '2.5:G120', 'li krono raho maivo po lirala en ito');
  const G121 = example(lex, '2.5:G121', 'Maivo revo-sabesia taivo.');
  const G64A = example(lex, '2.2:G64', 'Maivo lirala raho taivo amora.');
  const G64B = example(lex, '2.2:G64', 'saivo po farufasbifa kube saivo ramura raho maivo po ke.');
  const G72 = example(lex, '2.3:G72', 'ata maivo lemula saivo de sizosan lumi.');
  const G73 = example(lex, '2.3:G73', 'saivo po senosia en baba melosan valla.');
  const G74 = example(lex, '2.3:G74', 'raho povi sabesia baba kasi polvasan sove ki?');
  const G75 = example(lex, '2.3:G75', 'taivo ne taro-pagopa, nara lalfola hupi li lelde,');
  const G76 = example(lex, '2.3:G76', 'Taivo amora ki-eli lira ki?');
  const G111 = example(lex, '2.5:G111', 'Trana ke ruli levasan sidu zeldoza.');
  const G66 = example(lex, '2.2:G66', 'kroti maivo lesvu taivo ke li sevusan ruhe.');
  const G48A = quoted(lex, '2.1:G48', 'Li lumi tivrota taivo pifu.');
  const G48B = quoted(lex, '2.1:G48', 'Taivo po noma lisrola pifu.');
  const G50 = quoted(lex, '2.1:G50', 'Maivo desida fime taivo lisrola.');
  const G52 = quoted(lex, '2.1:G52', 'Li nimu raho maivo po lirala en ito, ka vanisan.');
  const G53 = quoted(lex, '2.1:G53', 'Una de maivori futu relnura.');
  const gl = (l: string, english: string, id: string): string =>
    composedGloss(l, english, `Reference, The clause: ${id}`);

  const slotTable = table(
    ['#', 'Slot', 'Words', 'Notes'],
    g.slots.map((s) => [
      cell(String(s.n), 'num'),
      cell(`<strong>${esc(s.slot)}</strong>`),
      cell(
        s.words.map((w) => (/^[a-z]+$/.test(w) && index.isWord(w) ? lir(w) : esc(w))).join(', '),
      ),
      cell(esc(s.notes)),
    ]),
    { cls: 'slots-table' },
  );

  const [, liRule] = omission(lex);
  const exclusions = g.stacking.exclusions.map(([a, b]) => `\`${a}\` + \`${b}\``).join(' · ');

  return part(
    '5',
    'The clause',
    'A fixed order, anchored on the verb. Only the subject and the verb are required.',
    `${h3('The core order')}
<pre class="template core-order"><code>FRAME · SUBJECT · TENSE · ne · MODAL · VERB · OBJECT · ADJUNCTS · ATTITUDE · ki</code></pre>
${examples([
  ['Eli-krono, maivo lirala.', 'Now I sing.'],
  ['Maivo po ne somusia.', 'I did not sleep.'],
  ['Taivo futu relnura ki?', 'Will you come back?'],
  ['Maivo lirala poye.', 'Perhaps I sing.'],
])}
${ul([
  `Operators stand before the verb, in the order of the full table below. ${g.scope_operators.words.map((w) => `\`${w}\``).join(' ')} stand ${esc(g.scope_operators.rule)}. Scope runs left over right [[1.0:G1]]: \`ne\` negates what follows it.`,
  `One word per slot, at most ${String(g.stacking.max_preverbal_operators_recommended)} before the verb. These never share a clause [[1.0:G16]]: ${exclusions}.`,
])}
${calloutHtml(
  'caution',
  p(
    'In X `de` Y, **Y owns X**: `li bumre de li cilni`, the bread of the city. **But a pronoun or a personal name on the left is the owner**: `taivo de lira`, your song [[1.2:G27]]. A kinship noun (`pilo`, `mare` …) is never a name for this: father’s bread is `li bumre de pilo` [[2.5:G95]]. A pronoun owns wherever it stands: `Pilo de maivo po lirala.` My father sang [[1.2:G32]]. With two names, the left one owns. Chains group from the left: X `de` Y `de` Z is (X `de` Y) `de` Z [[2.5:G96]].',
  ),
)}
${h3('Copulas')}
${p(wordList(lex, ['ke', 'ka', 'kapoki', 'loya', 'miyo']))}
${p(`\`ke\` and \`ka\` mark one contrast for every kind of predicate, adjective, noun phrase or place: \`ke\` holds now or for a time, \`ka\` is lasting, defining, by nature: \`${G93A}\` ${gl(G93A, 'The basket is on the table (right now).', '2.5:G93')} \`${G93B}\` ${gl(G93B, 'I am a singer (it’s who I am).', '2.5:G93')} [[2.5:G93]] \`po ke\` is “was, at that time”, \`po ka\` “was”, with no claim about now, and \`kapoki\` “was, and no longer is”: \`${G94}\` ${gl(G94, 'They were good, and no longer are.', '2.5:G94')} [[2.5:G94]]`)}
${p(`A predicate adjective may stand bare, with no copula, only in the present and with no operators: \`${G128}\` ${gl(G128, 'The person is beautiful.', '2.5:G128')} Anything more needs \`ke\` or \`ka\` [[2.5:G128]]. \`gome\` passivises any verb attested with an object; without it the subject is the doer, except for the listed change-of-state verbs [[2.5:G110]]. Valency: CAUSER [TENSE] [noma] [ne] [MODAL] … \`vaku\`/\`lesvu\`/\`tekvu\` ACTOR [ne] [APPROACH] [PHASE] [EFFORT] VERB [OBJECT] [[2.5:G109]].`)}
${h3('The noun phrase')}
<pre class="template"><code>${esc(g.noun_phrase)}</code></pre>
${p('Adjectives before the noun; a noun never modifies a noun [[0.8:G7]]. `toda` N is every N; `toda li` N is all the N.')}
${p(`${liRule} [[0.8:R5]]`)}
${p(`**Partitive** \`de\`. After a number, a quantifier or a superlative, \`de\` means of / among, and the ownership rules do not apply: \`${G53}\` ${gl(G53, 'One of us will return.', '2.1:G53')} Fractions are the same construction [[2.1:G53]].`)}
${h3('Linking clauses')}
${p(
  wordList(lex, [
    'ata',
    'nara',
    'oro',
    'si',
    'sina',
    'kasa',
    'kopisa',
    'nevi',
    'fime',
    'raho',
    'sidu',
    'kube',
    'nayo',
    'tuni',
    'sige',
    'kureli',
  ]),
)}
${p(`A clause with its own verb needs a linker. \`fime\` opens “that …” (the demonstrative is \`ola\`); \`raho\` opens a relative, and one that does not end the sentence is closed by a comma when it has its own object or adjunct: \`${G115}\` ${gl(G115, 'The sage who studies this did not witness the word.', '2.5:G115')} [[2.5:G115]] \`sidu\` joins two verbs sharing a subject and never takes a copula; purpose is always \`kopisa\` [[2.5:G113]]; \`ala\` is toward, **never** the infinitive “to”.`)}
${examples([
  ['Maivo sabesia fime taivo lirala.', 'I know that you sing.'],
  ['Li nela raho lirala ka benasan.', 'The person who sings is good.'],
  ['Maivo desida sidu lirala.', 'I want to sing.'],
  [G50, gl(G50, 'I want you to stay.', '2.1:G50')],
])}
${ul([
  '`sidu` keeps one subject; a second verb with **its own subject** goes in a `fime` clause [[2.1:G50]]. An unmarked subordinate clause takes the main clause’s tense, whatever its linker; `sige` clauses always mark their own [[2.5:G118]].',
  `**Purpose.** \`kopisa\` + a bare verb phrase with the same subject, + a clause with a different one: \`${G113A}\` ${gl(G113A, 'I came here to sing.', '2.5:G113')} \`${G113B}\` ${gl(G113B, 'I sing so that you dance.', '2.5:G113')} [[2.5:G113]]`,
  `A relative on a prepositional object: \`raho\` opens the clause and the preposition keeps its place, followed by a resumptive pronoun (\`ito\`/\`itori\`, \`saivo\`/\`saivori\`): \`${G52}\` ${gl(G52, 'The home in which I sang is beautiful.', '2.1:G52')} [[2.1:G52]] So for a possessor (PRONOUN \`de\` NOUN) and a time or place (the preposition + \`ito\`): \`${G120}\` ${gl(G120, 'the time when I sang', '2.5:G120')} [[2.5:G120]]`,
  'Evidentials: with none, the sentence makes no claim about its source. Inside `fime`, the evidential reports the main-clause subject’s evidence; in a question it asks for the listener’s source [[2.1:G51]].',
  `**Hopeful purpose.** \`kopisa\` + a clause whose verb carries \`nosi\`: \`${G116}\` ${gl(G116, 'I sing, so that perhaps you’ll dance.', '2.5:G116')} \`fime\` always introduces a content clause, “that” [[2.5:G116]].`,
  `**Headless relatives.** With no noun before it, \`raho\` is “the one who, that which”, as subject, object or complement: \`${G64A}\` ${gl(G64A, 'I sing what you love.', '2.2:G64')} \`${G64B}\` ${gl(G64B, 'She blushed when she remembered what I had been.', '2.2:G64')} A direct question may also open with \`raho\`, “who, what”, and then ends in \`ki\`, as the album asks: \`${G74}\` ${gl(G74, 'Who can know a more powerful peace?', '2.3:G74')} \`ki-nela\` and \`ki-coda\` stay the ordinary question words [[2.3:G74]].`,
  `**Easy to …, ready to ….** An adjective may take \`sidu\` + verb; the thing the adjective describes is the subject of the clause and the verb’s understood object, with no dummy \`ito\`: \`${G111}\` ${gl(G111, 'Change is very easy to resist.', '2.5:G111')} [[2.5:G111]]`,
  `**Before and after a clause.** \`kroti\` and \`krotiapo\` may open a clause, “before …” and “after …”; the clause inherits tense as after \`kube\` [[0.8:R6]]: \`${G66}\` ${gl(G66, 'Before I let you be the ocean storm.', '2.2:G66')} Before a measure they keep [[2.1:G55]]; before \`li\` + a noun, their older meaning [[2.2:G66]].`,
  `**A line that continues.** \`ata\` may open a line that carries on from the one before, “And …”, as \`oro\` may: \`${G72}\` ${gl(G72, 'And I learn his shimmering light.', '2.3:G72')} [[2.3:G72]] [[1.2:G25]]`,
  `**Means, medium, company, manner.** One test per word: \`yuta\` a tool, means or substance handled or used up; \`en\` a medium or state one is in (a manner seen as a medium): \`${G73}\` ${gl(G73, 'She spoke in a musical voice.', '2.3:G73')} \`ko\` a companion, or a feeling that goes with the act (\`ko amor\`, with love); \`la\` + adjective the quality of the action, after the verb and object [[2.5:G104]] [[2.5:G105]].`,
  `**Motion prefixes.** \`va-\`, \`du-\`, \`taro-\`, \`yave-\` and \`revo-\` go on any verb, with compositional meanings; a listed meaning wins: \`${G121}\` ${gl(G121, 'I recognize you.', '2.5:G121')} So \`pagopa\` takes them too: \`${G75}\` ${gl(G75, 'you do not go across, but float above the edge,', '2.3:G75')} [[2.5:G121]]`,
])}
${h3('Questions, exclamations, wishes')}
${p('A **yes/no question** keeps statement order and ends in `ki`. A **content question** ends in `ki` unless its `ki-` word is the first word of the sentence; a `ki-` word left where its answer would stand needs the final `ki`. The fronting exception covers `ki-coda`, `ki-pago`, `ki-krono`, `ki-nela`, `ki-nela de`, `ki-kasa`, `ki-modo` of manner and `ki-muya-krono` only. A `ki-` word in place in a clause without `ki` is an embedded question or part of a statement, never a direct question. Embedded questions never take `ki`; an embedded yes/no question uses `ki-oro` [[2.5:G88]] [[2.3:G77]]. A final `ki` belongs to the main clause and is the last word, but for a vocative set off by a comma [[2.5:G89]]. A fragment question ends in `ki` too: `Ata ki?` And? [[2.5:G91]]')}
${examples([
  ['Taivo lirala ki?', 'Do you sing?'],
  [G60A, gl(G60A, 'Where are you going?', '2.2:G60')],
  [G88B, gl(G88B, 'Where are you going?', '2.5:G88')],
  [G88A, gl(G88A, 'Why did you love me?', '2.5:G88')],
  ['Maivo ne sabesia ki-pago taivo futu pagopa.', 'I don’t know where you will go.'],
  [G60C, gl(G60C, 'We do not know what we remember.', '2.2:G60')],
])}
${p('Earlier rulings on questions are kept as they were ruled, not deleted; 2.5:G88 amends 2.2:G60, and the 2.1 rulings it overtook were superseded in 2.2 [[2.5:G88]] [[2.2:G61]].')}
${ul([
  `**Exclamations.** Only \`ki-modo\` + adjective (how …!), \`ki-eli\` + noun (what a …!) and \`ki-muya\` + noun (so many …!) make an exclamation, and only when the clause does not end in \`ki\`: \`${G61A}\` ${gl(G61A, 'How beautiful the night is!', '2.2:G61')} \`${G61B}\` ${gl(G61B, 'What a night!', '2.2:G61')} Any other \`ki-\` clause without \`ki\` is a question, and a degree question must end in \`ki\`: \`${G61C}\` ${gl(G61C, 'How beautiful is the night?', '2.2:G61')} [[2.2:G61]] So must a question with \`ki-eli\` or \`ki-muya\` + a noun, which without \`ki\` is an exclamation: \`${G76}\` ${gl(G76, 'Which song do you love?', '2.3:G76')} [[2.3:G76]]`,
  `**So … that.** \`tonsi\` meaning “so” stands only before a predicate adjective, after a copula, and a \`fime\` clause after it gives the result: \`${G62A}\` ${gl(G62A, 'Are you so brave that you would kiss me?', '2.2:G62')} \`${G62B}\` ${gl(G62B, 'If I am so lucky, I will not rise.', '2.2:G62')} Opening its clause, \`tonsi\` means “therefore” and takes a comma [[2.5:G117]].`,
  `**Blessings and wishes.** \`pifu\` with any subject is the blessing form: \`${G48A}\` ${gl(G48A, 'May the Light hold you.', '2.1:G48')} With \`noma\`, it is “if only”: \`${G48B}\` ${gl(G48B, 'If only you had stayed.', '2.1:G48')} [[2.1:G48]]`,
  `**Commands and prohibitions.** A command is marked: it ends in \`!\` or contains \`fisa\` (in speech, \`fisa\` or command intonation); a subjectless, tenseless clause with neither is an elliptical statement. \`ne\` + a command forbids; \`yava ne\` + verb is “let us not”: \`Ne senobakosia maivo!\` Don’t interrupt me! \`${G90}\` ${gl(G90, 'Please don’t sing.', '2.5:G90')} [[2.5:G90]] [[2.1:G56]]`,
])}
${h3('Reference: all twenty slots')}
${slotTable}`,
  );
}

// --------------------------------------------------------------- 6. Recipes

/**
 * The recipes, simplest first: what a learner needs on day one (did, will,
 * not, is, questions), then the noun phrase, comparison, modals, linked
 * clauses, and the rarer machinery. Liraasa in a pattern is in backticks.
 * Every example is a canon example, a canon function-word example or a
 * phrase quoted in its ruling; the build tags any other for review.
 */
/**
 * Recipe sentences the author has ruled on that are not canon examples: the
 * 2.5 patch writes recipes[61] itself (2.5:G116), and clears the review status
 * of recipes[24] (ADR-0011) and recipes[68] (vaku, 2.5:G109) (I-52).
 */
export const RULED_RECIPES: ReadonlySet<string> = new Set([
  'maivo futu donuda ito biti de lalfo, kopisa taivo nosi semnesia ko maivo en moluvaye.',
  'lirasan lavra',
  'Taivo vaku maivo lirala.',
]);

export const RECIPES: readonly (readonly [string, string, string, string, string])[] = [
  ['did / -ed', '`po` + verb', 'maivo po lirala', 'I sang', 'slot 4'],
  ['will', '`futu` + verb', 'Taivo futu relnura ki?', 'Will you come back?', 'slot 4'],
  ['not', '`ne` before what it negates', 'Maivo po ne somusia.', 'I did not sleep.', '1.0:G1'],
  [
    'cannot / can … not',
    '`ne` before a modal negates the modal; after it, the action',
    'Maivo ne povi lirala. / Maivo povi ne lirala.',
    'I cannot sing. / I am able not to sing.',
    '1.0:G15',
  ],
  [
    'is (now) / is (always)',
    '`ke` / `ka`',
    'li nela ke benasan',
    'the person is good right now',
    'copulas',
  ],
  ['do you …?', 'statement order, `ki` last', 'Taivo lirala ki?', 'Do you sing?', '2.5:G88'],
  [
    'where / who / which …?',
    'the question word first, `ki` last optional; or in its answer’s place, `ki` last required',
    'Ki-pago taivo pagopa ki?',
    'Where are you going?',
    '2.5:G88',
  ],
  [
    'how …!',
    '`ki-modo` ADJ, no final `ki`',
    'Li nullo ka ki-modo vanisan!',
    'How beautiful the night is!',
    '2.2:G61',
  ],
  [
    'may … / bless …',
    'clause + `pifu`',
    'Li lumi tivrota taivo pifu.',
    'May the Light hold you.',
    '2.1:G48',
  ],
  [
    'if only …',
    '`noma` … `pifu`',
    'Taivo po noma lisrola pifu.',
    'If only you had stayed.',
    '2.1:G48',
  ],
  [
    'yes / no',
    '`zabo` / `kepi`, or tense + verb',
    'Taivo po sapusia ki? — Zabo. / Po sapusia. / Zabo, maivo po sapusia.',
    'Did you eat? — Yes. / (I) ate. / Yes, I ate.',
    '0.8:G3',
  ],
  ["let's", '`yava` + verb', 'Yava lirala!', 'Let us sing!', ''],
  [
    'command',
    'no subject; marked by `!` or `fisa` (please)',
    'Fisa, lisrola.',
    'Please stay.',
    '2.5:G90',
  ],
  [
    "don't …",
    '`ne` + command; `yava ne` = let us not',
    'Ne senobakosia maivo!',
    'Don’t interrupt me!',
    '2.1:G56',
  ],
  [
    'addressing someone',
    'set off by commas',
    'Taivo viki pagopa ligo maivo ki, maivo de amor?',
    'Would you come near me, my love?',
    '1.2:G31',
  ],
  ['I have X', '`tovota` + object', 'Maivo tovota baba lira.', 'I have a song.', ''],
  [
    'there is',
    '`miyo` + noun phrase',
    'Miyo baba sora en li nimu.',
    'There is a friend in the home.',
    '',
  ],
  [
    'become',
    '`loya` + adjective or noun',
    'Li nullo po loya sovesan.',
    'The night became peaceful.',
    '',
  ],
  [
    'this / that, standing alone',
    '`eli` / `ola` as pronouns; `eli-nela` for a person',
    'Maivo desida eli, ne ola.',
    'I want this, not that.',
    '0.8:G1',
  ],
  ['my / your X', 'PRONOUN `de` X', 'taivo de lira', 'your song', '1.2:G27'],
  [
    "Father's X",
    'X `de` NOUN: the noun after `de` owns (a kinship noun is not a name)',
    'li bumre de pilo',
    "father's bread",
    '2.5:G95',
  ],
  [
    'the X of the Y',
    '`li` X `de` `li` Y',
    'li bumre de li cilni',
    'the bread of the city',
    '1.2:G27',
  ],
  [
    'my father',
    'a pronoun outranks a name',
    'Pilo de maivo po lirala.',
    'My father sang.',
    '1.2:G32',
  ],
  ['a song about love', 'X `de` Y', 'li lira de amor', 'the song of love', '1.2:G30'],
  ['songbird (noun + noun)', 'first noun → its adjective', 'lirasan lavra', 'songbird', 'ADR-0011'],
  ['the forgotten', 'article + adjective', 'li ramumomvisan', 'the forgotten', '1.2:G29'],
  ['my daughter', 'FEMALE + `linu`', 'Maivo de minvalinu lirala.', 'My daughter sings.', '1.2:G36'],
  ['aunt', 'gender adjective + neutral noun', 'minvasan purmafamli', 'aunt', '1.2:G36'],
  [
    '-ly (adverb)',
    '`la` + adjective, after the verb and object',
    'Maivo lirala la molusan.',
    'I sing gently.',
    '2.5:G105',
  ],
  ['very X', '`ruli` ADJ', 'ruli vanisan', 'very beautiful', ''],
  ['less X', '`menu` ADJ', 'menu vanisan', 'less beautiful', ''],
  ['the most X', '`mosa` ADJ', 'mosa vanisan', 'most beautiful', ''],
  [
    'more X than Y',
    '`kasi` ADJ `tamo` Y',
    'Li lira ka kasi vanisan tamo li seno.',
    'The song is more beautiful than the speech.',
    '',
  ],
  ['as X as Y', '`gase` ADJ `gase` Y', 'gase vanisan gase taivo', 'as beautiful as you', '0.8:G8'],
  ['like Y', '`gase` + noun phrase', 'Taivo lirala gase pilo.', 'You sing like father.', '0.8:G8'],
  [
    'the same as / different from',
    'X `ka sambasan ko` Y / X `ka sambanasan da` Y',
    'Eli bumre ka sambasan ko pilo de bumre.',
    "This bread is the same as father's bread.",
    '0.8:G8',
  ],
  ['also, too', '`tu` before what it adds', 'Tu Kipo po bumreba.', 'Kipo baked too.', '1.0:G13'],
  ['too many songs', '`diba` + quantifier or adjective', 'diba muya lirari', 'too many songs', ''],
  ['two coins', 'NUMBER NOUN, `-ri` optional', 'dossa cono', 'two coins', '1.2:G28'],
  [
    'at least / at most / about / exactly',
    '`lusu` / `mosa` / `gase` / `pendi` + number',
    'Taivo guraga maivo pendi dossa cono.',
    'You owe me exactly two coins.',
    '1.0:G9',
  ],
  ['often / rarely', 'quantifier-`krono`', 'Maivo lirala muya-krono.', 'I sing often.', '1.2:G34'],
  ['twice', 'NUMBER-`krono`', 'dossa-krono', 'twice', '2.1:G49'],
  [
    'now I sing',
    'time word first (a FRAME, with its comma) or among the closing adjuncts',
    'Eli-krono, maivo lirala.',
    'Now I sing.',
    '2.5:G127',
  ],
  [
    'suddenly, …',
    'frame word first, with a comma',
    'Zafra, li dorbi po lallela.',
    'Suddenly the door opened.',
    'slot 1',
  ],
  ['can', '`povi` (ability)', 'maivo povi lirala', 'I can sing', '1.0:G3'],
  ['might', '`nosi` (it may be so)', 'saivo nosi lirala', 'they might sing', '1.0:G3'],
  ['may (allowed)', '`dagi` (permission)', 'Taivo dagi lisrola.', 'You may stay.', '1.0:G3'],
  ['must (have to)', '`musi`', 'maivo musi pagopa', 'I must go', '1.0:G4'],
  [
    'must (surely)',
    '`tosu` + verb … `seye`',
    'Kipo po tosu bumreba seye.',
    'Kipo must have baked (I can tell from the evidence).',
    '1.0:G4',
  ],
  [
    'should / could / would have',
    '`po noma suvi` / `po noma povi` / `po noma viki` + verb',
    'Maivo po noma suvi lirala.',
    "I should have sung (but I didn't).",
    '1.0:G6',
  ],
  [
    'if … would have',
    '`si` … `po noma` …, … `po noma viki` …',
    'Si maivo po noma masuma, taivo po noma viki relsira.',
    'If I had asked, you would have answered.',
    '2.5:G114',
  ],
  ['water or food', 'A `oro` B', 'miru oro nami', 'water or food', '1.2:G25'],
  [
    'either / neither / only if / even if',
    '`oro` A `oro` B · `ne` A `ne` B · `doli si` · `yesta si`',
    'Yesta si taivo tavreta, maivo futu pagopa.',
    'Even if you refuse, I will go.',
    '1.0:G10',
  ],
  [
    'despite',
    '`nevi` + noun phrase (+ clause: although)',
    'nevi li zeldo',
    'despite the resistance',
    '1.0:G11',
  ],
  [
    'I know that …',
    '`fime` + clause',
    'Maivo sabesia fime taivo lirala.',
    'I know that you sing.',
    '',
  ],
  [
    'the person who sings',
    '`raho` + clause',
    'Li nela raho lirala ka benasan.',
    'The person who sings is good.',
    '1.0:G21',
  ],
  ['want to sing', 'VERB `sidu` VERB', 'Maivo desida sidu lirala.', 'I want to sing.', '0.8:G6'],
  [
    'want you to stay',
    'VERB `fime` SUBJECT VERB',
    'Maivo desida fime taivo lisrola.',
    'I want you to stay.',
    '2.1:G50',
  ],
  [
    'the home in which …',
    '`raho` … preposition + resumptive pronoun',
    'Li nimu raho maivo po lirala en ito, ka vanisan.',
    'The home in which I sang is beautiful.',
    '2.1:G52',
  ],
  [
    'one of us',
    'NUMBER `de` PRONOUN (partitive)',
    'Una de maivori futu relnura.',
    'One of us will return.',
    '2.1:G53',
  ],
  [
    'so … that …',
    '`tonsi` ADJ … `fime` CLAUSE',
    'taivo ke tonsi corvisan fime taivo viki savalisia maivo ki?',
    'Are you so brave that you would kiss me?',
    '2.2:G62',
  ],
  [
    'so that perhaps …',
    'main clause, `kopisa` … `nosi` VERB',
    'maivo futu donuda ito biti de lalfo, kopisa taivo nosi semnesia ko maivo en moluvaye.',
    'I will give it a tool of floating, so that perhaps you may sit with me in the breeze.',
    '2.5:G116',
  ],
  [
    'what you love',
    '`raho` with no noun before it',
    'Maivo lirala raho taivo amora.',
    'I sing what you love.',
    '2.2:G64',
  ],
  [
    'easy to …',
    'THING `ke` ADJ `sidu` VERB: the thing is the verb’s understood object',
    'Trana ke ruli levasan sidu zeldoza.',
    'Change is very easy to resist.',
    '2.5:G111',
  ],
  [
    'before / after I …',
    '`kroti` / `krotiapo` + clause',
    'kroti maivo lesvu taivo ke li sevusan ruhe.',
    'Before I let you be the ocean storm.',
    '2.2:G66',
  ],
  [
    'behind the house',
    'side noun as a preposition',
    'Li lavra semnesia nazru li nimu.',
    'The bird sits behind the home.',
    '2.2:G67',
  ],
  [
    'perhaps …',
    'attitude word at the clause end',
    'Maivo lirala poye.',
    'Perhaps I sing.',
    '1.0:G22',
  ],
  [
    'is done by',
    '`gome` VERB `gagu` AGENT',
    'Li lira gome sarbisia gagu maivo.',
    'The song is written by me.',
    '',
  ],
  [
    'make someone do',
    'CAUSER `vaku` ACTOR VERB [OBJECT]',
    'Taivo vaku maivo lirala.',
    'You make me sing.',
    '2.5:G109',
  ],
  [
    'owe me two coins',
    'VERB PRONOUN THEME (a bare recipient is a pronoun)',
    'guraga maivo dossa cono',
    'owe me two coins',
    '2.5:G112',
  ],
  [
    'lend three coins to me',
    'VERB THEME `ala` RECIPIENT',
    'rimara tressa cono ala maivo',
    'lend three coins to me',
    '2.5:G112',
  ],
  [
    'open it with a key',
    '`yuta` + the instrument',
    'Maivo lallela li dorbi yuta li kemye.',
    'I open the door with the key.',
    '1.2:G33',
  ],
  [
    'recognize',
    'a listed motion-prefix meaning',
    'Maivo revo-sabesia taivo.',
    'I recognize you.',
    '2.5:G121',
  ],
  [
    'a tense for a whole passage',
    'a lone `Po` or `Futu` opening a paragraph sets its tense',
    'Po — Maivo semnesia ligo li tabu. Maivo pressa loki semnesia eli-pago.',
    'I sat by the table. Now I am still sitting here.',
    '0.8:R4',
  ],
  // 3.0, proposed: the recipes the 3.0 patch's README asks for, each a ruling's own example
  [
    'O … (addressing)',
    '`iya` + noun phrase, set off by a comma',
    'Iya Deviasa, lenila maivo!',
    'O Great Goddess, hear me!',
    '3.0:G129',
  ],
  [
    'Glory to …!',
    'noun phrase `ala` noun phrase!',
    'Lumisirmo ala Deviasa!',
    'Glory to the Great Goddess!',
    '3.0:G137',
  ],
  [
    'she is (she exists)',
    'subject [tense] `miyo`, nothing after it',
    'Saivo miyo.',
    'She is. (She exists.)',
    '3.0:G132',
  ],
  ['let there be …', '`miyo` + noun phrase + !', 'Miyo lumi!', 'Let there be light!', '3.0:G133'],
  [
    'so be it (amen)',
    '`ola-modo pifu` closes a prayer',
    'Ola-modo pifu.',
    'So be it. (Amen.)',
    '3.0:G133',
  ],
  [
    'she herself',
    'pronoun + `sela` as the subject',
    'Saivo sela po lirala.',
    'She herself sang.',
    '3.0:G134',
  ],
  [
    'by (an author)',
    'a made work + `gagu` + noun phrase',
    'li lira gagu Peta',
    'the song by Peta',
    '3.0:G136',
  ],
  [
    'one by one',
    'X `krotiapo` X, a bare noun or number repeated',
    'Una krotiapo una, li veluri po hiro lirala.',
    'One by one, the stars began to sing.',
    '3.0:G140',
  ],
  [
    'for ever',
    '`en rinbakrono`',
    'Saivo futu lirala en rinbakrono.',
    'She will sing for ever.',
    '3.0:G139',
  ],
];

export function recipesPart(index: Index): string {
  const canon = canonTexts(index.lex);
  return part(
    '6',
    'Patterns: English → Liraasa',
    'The recipes a translator follows, simplest first. Every example is canon, except any marked for review.',
    table(
      ['English', 'Pattern', 'Example', 'Ruling'],
      RECIPES.map(([en, pat, l, gloss, id]) => {
        const review = !isCanonText(canon, l) && !RULED_RECIPES.has(l);
        if (review) forReview(l, gloss, `Reference, Patterns: ${en}`);
        // a 2.1 or 2.2 ruling's sentence comes without English: the gloss is the guide's
        else if (
          (id.startsWith('2.1:') || id.startsWith('2.2:')) &&
          /[.!?]$/.test(l) &&
          !liveExamples(index.lex).some((e) => e.liraasa === l)
        )
          composedGloss(l, gloss, `Reference, Patterns: ${en}`);
        return [
          cell(esc(en)),
          cell(md(pat)),
          cell(
            `${lir(l)}${review ? '<span class="review-tag">for review</span>' : ''}<span class="gloss">${esc(gloss)}</span>`,
          ),
          cell(/^\d\.\d:|^ADR/.test(id) ? badge(id) : esc(id)),
        ];
      }),
      { cls: 'recipes' },
    ),
  );
}

// --------------------------------- Parsing (the LLM reference reads these)

export const READ_ORDER = [
  'Exact form in the form index → **lexical** (every reading kept; image compounds of the 2.0 pattern included).',
  'A closed-class word → its class.',
  'A numeral, plain or hyphenated, optionally with `-ne` (ordinal).',
  'A derivation (`-yo`, `-vu`, `-pago`).',
  'Suffix stripping (word longer than 4): strip `-ri`, then `-ti` if what remains is not known. The stem must be a known form, derivation or closed word; `-ti` may follow any form or derivation (2.5:G122).',
  'A motion prefix (`va-`, `du-`, `taro-`, `yave-`, `revo-`) on **any verb** form; a listed meaning overrides the compositional one (2.5:G121).',
  'A fraction is three words, NUMBER `de` NUMBER, written with spaces (`tressa de cuara`); there is no hyphenated fraction (2.5:G97).',
  'A legacy spelling → warn, naming the replacement.',
  'A name: capitalised, or in the known-name list.',
  'Otherwise: **“not a word of Liraasa”**, an error. Never guess a meaning.',
];

export const RULES: readonly (readonly [string, string, string])[] = [
  ['error', 'unknown word: “not a word of Liraasa”', 'never invent'],
  ['warn', 'a form whose slot is unused', '0.8:R2'],
  ['warn', 'a pre-1.0 spelling, with its replacement', '1.0:G19'],
  ['error', 'a token that cannot be placed in the slot template', 'slot'],
  ['error', 'a non-verb in the verb slot (with a hint naming its verb form)', 'slot'],
  ['error', 'a second verb in one clause with no linker', 'slot'],
  [
    'error',
    'a verbless clause, other than a bare adjective predicate in the present with no operators',
    '2.5:G128',
  ],
  ['warn', 'a give-type verb with a bare non-pronoun recipient', '1.2:G26'],
  ['error', 'two bare nouns side by side → adjective, compound or de phrase', 'ADR-0011'],
  ['error', 'de after a verb or adjective; de with nothing after it', 'noun phrase'],
  ['error', 'a stranded preposition; ala used as the infinitive “to”', 'noun phrase'],
  ['error', 'sidu between non-verbs, or followed by a copula', 'sidu'],
  ['error', 'fime followed by a copula or tense (the demonstrative “that” is ola)', 'fime'],
  ['error', 'zafra / finra / lanto / kenvi not opening its clause', 'slot 1'],
  ['warn', 'one of those four frame words without its comma', 'slot 1'],
  ['warn', 'a FRAME (time or place adverbial) opening a clause without its comma', '2.5:G127'],
  ['error', 'a tense or operator out of slot order, or after the verb', '1.0:G1'],
  ['error', 'excluded pairs in one clause; two evidentials', '1.0:G16'],
  [
    'error',
    'ki not the last word (only a comma-set vocative may follow); attitude words not clause-final',
    '2.5:G89',
  ],
  ['error', 'a question with the copula or tense moved to the front', 'ki'],
  [
    'error',
    'a question that does not end in ki, unless its ki-word is the first word of the sentence',
    '2.5:G88',
  ],
  [
    'note',
    'a ki- clause without ki is an exclamation only with ki-modo + adjective, ki-eli + noun or ki-muya + noun; otherwise a question',
    '2.2:G61',
  ],
  ['error', 'a question opened by raho that does not end in ki', '2.3:G74'],
  ['error', 'a ki-eli or ki-muya + noun question that does not end in ki', '2.3:G76'],
  [
    'note',
    'yuta = a tool or substance used; en = a medium or state; ko = a companion or accompanying feeling',
    '2.5:G104',
  ],
  ['warn', 'a saying-verb + su read as “about”', '1.2:G30'],
  ['warn', 'English gloss is passive but the line has no gome', 'passive'],
  ['note', '-na direction; hema as hesitation', ''],
  [
    'error',
    'a descriptive epithet keeps li; only a title used as a name drops it, and a name before de owns (Mareasa de li lumi is “the Mother’s light”)',
    '3.0:G131',
  ],
];

// ------------------------------------------------------------ Open questions

/** Not decided: presented as open, resolved nowhere (SPEC §14). Language only. */
export const OPEN_QUESTIONS: readonly string[] = [
  '**“To + verb” beyond purpose:** purpose is `kopisa` (2.5:G113); `sidu` (same subject), `fime` (a different subject, 2.1:G50) and adjective + `sidu` (2.5:G111) cover the other known cases; the general case remains open.',
  '`ke sidu` VERB **as “destined to”** (album 08): hold until a second use.',
  '**The order of two or more adjectives** before one noun.',
  'Whether `maivori` includes the listener.',
  '**Which quantifiers form a measure** with `kroti` and `krotiapo` (2.5:G108): until ruled, only NUMBER + unit.',
  '**Comparing an action with no manner adjective** (“I sing more than you”).',
  '**A duration** (“for two days”) in general, now that a bare noun after a verb is its object (2.5:G103); `en rinbakrono` covers only “for ever” (3.0:G139).',
  '**Decimals**: outside the language until ruled (2.5:G125).',
];

export function openQuestionsPart(no: string): string {
  return part(
    no,
    'Open questions',
    'Not decided. Nothing in this guide resolves them.',
    ul(OPEN_QUESTIONS),
  );
}

// ------------------------------------------------------------- Appendices

/** Rulings about the project, not the language: in the rulings file only. */
export const GOVERNANCE = ['0.8:R1', '0.8:R2', '0.8:R3', '0.8:R11'];
/** Rulings for reading pre-1.0 texts: in the rulings file only. */
export const LEGACY = ['1.0:G19', '0.8:R7'];

export interface EditionCounts {
  v10: number;
  v11: number;
  v12: number;
  v20: number;
  attested: number;
  /** 2.1 respells and replaces roots; it adds and removes no headword (2.1:G58, G59). */
  v21: number;
  respelled: number;
  becameCompounds: number;
  /** 2.2's edition note, the changeset's summary (the patch's edition_note, verbatim). */
  note22: string;
  /** Slots 2.2 filled: each adds one meaningful form. */
  filled22: number;
  /** 2.2's headword count, before 2.3 made frog a root (2.3:G70). */
  v22: number;
}

/** Every headword form whose slot has a meaning (the LLM reference counts the same). */
function meaningfulForms(lex: Lexicon): number {
  return lex.headwords.reduce(
    (total, h) => total + FORM_SLOTS.filter((slot) => isUsed(h, slot)).length,
    0,
  );
}

/**
 * Appendix A lists only the function words the guide has not already taught:
 * `isShown` says whether a word or phrase was rendered before the appendices.
 * The suffixes are taught with the seven forms and the derivations (Part 3),
 * and the day words are Appendix C's, so none of them is listed again.
 */
export function appendices(
  index: Index,
  isShown: (form: string) => boolean,
  counts: EditionCounts,
  rulingIndex: string,
): string {
  const lex = index.lex;
  const timeWords = new Set(lex.time_and_dates.map((t) => t.form));
  const rest = lex.function_words.filter(
    (w) => !isShown(w.form) && !w.form.startsWith('-') && !timeWords.has(w.form),
  );
  const fwTable = table(
    ['Form', 'Meaning', 'Position'],
    rest.map((w) => [
      cell(fwForm(w.form), 'form'),
      cell(esc(w.meaning)),
      cell(esc(usage(w.position))),
    ]),
    { cls: 'appendix' },
  );

  const derivations = Object.entries(lex.morphology.lexicalised_derivations)
    .map(([k, v]) => `${lir(k)} <span class="gloss">${esc(normGloss(v))}</span>`)
    .join(' · ');
  const asides = Object.entries(lex.morphology.suffixes)
    .map(([k, v]) => [k, /\((.*)\)$/.exec(v)?.[1]] as const)
    .filter(([, a]) => a !== undefined && !a.startsWith('on the root') && !a.startsWith('always'))
    .map(([k, a]) => `${k}: ${a ?? ''}`);

  // place words are filed with the time words in the data; they are taught as correlatives
  const place = new Set(lex.correlatives.filter((c) => c.concept === 'pago').map((c) => c.form));
  const time = lex.time_and_dates
    .filter((t, i, all) => !place.has(t.form) && all.findIndex((x) => x.form === t.form) === i)
    .map((t) => `${lir(t.form)} <span class="gloss">${esc(normGloss(t.english))}</span>`)
    .join(' · ');

  const added = counts.v20 - counts.v12 + counts.attested;
  return `<section class="part appendices" aria-labelledby="appendices">
<header class="part-head"><div class="part-num" aria-hidden="true">A–D</div><h2 id="appendices" data-toc="Appendices">Appendices</h2></header>
${h3('A. More function words')}
${p(`The ${n(rest.length)} function words not taught above.`)}
${fwTable}
${h3('B. Listed derivations')}
${p(`These meanings override the default reading of their suffix [[1.0:G20]] [[2.0:G41]].${asides.length > 0 ? ` Note ${asides.map((a) => esc(a)).join('; ')}.` : ''}`)}
<p class="chips">${derivations}</p>
${h3('C. Time words')}
<p class="chips">${time}</p>
${h3('D. Editions and rulings')}
${p(`Liraasa 1.0 (${n(counts.v10)} headwords) is the frozen base. 1.1 added vocabulary (${n(counts.v11)}); 1.2 added rulings 1.2:G24–G36 and words (${n(counts.v12)}). 2.0 added ${n(added)} headwords and moved ${n(counts.attested)} pattern-built compounds out of the dictionary into the image-compound pattern, hence ${n(counts.v12)} − ${n(counts.attested)} + ${n(added)} = ${n(counts.v20)}. The ${n(counts.attested)} keep their glosses as attested image compounds and are **not** counted in the ${n(counts.v20)}.`)}
${p(`2.1 added rulings 2.1:G46–G59 and respelled ${n(counts.respelled)} roots, ${n(counts.becameCompounds)} of them replaced by compounds, with every form, compound, image compound and derivation built on them; the headword count stays ${n(counts.v21)}. ${rulingText(lex, '2.1:G58')} [[2.1:G58]] ${rulingText(lex, '2.1:G59')} [[2.1:G59]]`)}
${p(`${esc(counts.note22)} [[2.2:G68]] The headword count stays ${n(counts.v22)}; the filled slots add ${n(counts.filled22)} meaningful forms.`)}
${p(`2.3 is a sound pass. ${rulingText(lex, '2.3:G69')} [[2.3:G69]] ${rulingText(lex, '2.3:G70')} [[2.3:G70]] ${rulingText(lex, '2.3:G71')} [[2.3:G71]] With frog a new root there are ${n(lex.headwords.length)} headwords, and ${n(meaningfulForms(lex))} meaningful forms in all.`)}
${rulingIndex}
</section>`;
}
