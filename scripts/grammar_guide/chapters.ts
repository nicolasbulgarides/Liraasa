/**
 * The teaching chapters of the grammar guide.
 *
 * Prose is written here; every table, count, ruling and example is read from
 * the lexicon at build time, so a new ruling or a new function word appears
 * in the next build without touching this file. The prose follows
 * `handoff/HANDOFF.md`, which is the brief and the grammar reference.
 */
import { FORM_SLOTS, SLOT_BUILD, isUnusedGloss } from '../../src/core/config/slots';
import { sound } from './core_words';
import { formOf, glossOf, liveExamples, type Index, type Lexicon, type Ruling } from './data';
import {
  badge,
  callout,
  cell,
  esc,
  examples,
  h3,
  lir,
  md,
  morph,
  p,
  paras,
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

function fwRows(lex: Lexicon, forms: readonly string[]) {
  return forms.map((f) => {
    const w = fw(lex, f);
    return [cell(lir(w.form)), cell(esc(w.meaning)), cell(esc(w.position))];
  });
}

// ---------------------------------------------------------------- 1. Welcome

export function welcome(index: Index): string {
  const lex = index.lex;
  const h = lex.headwords;
  const primal = h.filter((x) => x.type === 'Primal').length;
  const isNew = h.filter((x) => x.since === lex.version).length;
  const forms = h.length * FORM_SLOTS.length;
  const unused = h.reduce(
    (acc, x) => acc + FORM_SLOTS.filter((s) => isUnusedGloss(glossOf(x, s))).length,
    0,
  );
  const live = liveExamples(lex).length;
  const colourWords = lex.colors.length * 5;

  const glance = table(
    ['', 'Count'],
    [
      [
        'Headwords',
        `**${n(h.length)}**: ${n(primal)} primal roots, ${n(h.length - primal)} compounds (${n(isNew)} new in ${lex.version})`,
      ],
      [
        'Word forms',
        `${n(forms)}, seven per headword; ${n(unused)} are unused and have no meaning`,
      ],
      ['Function words', n(lex.function_words.length)],
      ['Pronouns', n(lex.pronouns.length)],
      [
        'Correlatives',
        `${n(lex.correlatives.length)}: a 6 × 6 grid, plus ${n(lex.correlatives.length - 36)} frequency words [[1.2:G34]]`,
      ],
      [
        'Time words',
        `${n(lex.time_and_dates.length)} rows, ${n(new Set(lex.time_and_dates.map((t) => t.form)).size)} distinct forms`,
      ],
      ['Colours', `${n(lex.colors.length)} families, ${n(colourWords)} words; none is a headword`],
      ['Discourse particles', n(lex.discourse_particles.length)],
      ['Rhyme families', n(lex.rhyme_families.length)],
      [
        'Examples',
        `${n(lex.examples.length)} (${n(live)} live, ${n(lex.examples.length - live)} historical)`,
      ],
      [
        'Rulings',
        `0.8: ${n(lex.rulings_0_8_carried.length)} carried · 1.0: ${n(lex.rulings_1_0.length)} · 1.2: ${n(lex.rulings_1_2.length)} · plus ADR-0011`,
      ],
    ],
    { cls: 'glance' },
  );

  return part(
    '1',
    'Welcome',
    'Liraasa is a constructed language **built for singing**: open syllables, pure vowels, penultimate stress and a regular morphology, so lyrics scan and rhyme predictably.',
    `${h3('What this guide covers')}
${paras(
  `This is the grammar of Liraasa ${lex.version}: all of 1.0, the 1.1 vocabulary supplement, and the 1.2 update, its grammar rulings and its new words. It starts with the sound, moves to words, the core vocabulary and what 1.2 adds, then the small words and the clause, then recipes for turning English into Liraasa, every ruling, how a machine reads a line, and the 1.2 changelog.`,
  'It is written for three readers at once: the songwriter who writes and sings in Liraasa, a learner coming from English, and anyone rebuilding the parser, who needs the rules stated exactly.',
)}
${h3('At a glance')}
${glance}
${h3('How to read it')}
${ul([
  'Liraasa is set in a serif face and its own colour, like `lira`, and is never re-spelled or hyphenated for display. Every example is a Liraasa line with its English underneath.',
  'Each ruling carries a badge with its **edition-qualified id**, such as [[1.0:G7]] or [[1.2:G27]]. G1–G8 exist in both the 0.8 and 1.0 ruling sets with different content, so a bare id is never used.',
  'Two notes recur: a **Singing note** for meter, rhyme and free choices, and a **Parsing note** for how a machine decides.',
  'Every example is canon, taken from the lexicon. Nothing here invents a word.',
])}
${callout('singing', 'Every vowel is its own syllable and stress falls on the second-to-last. Once you know that, you can scan any line by counting vowels.')}
${callout('parsing', 'Where this guide and the lexicon JSON disagree, the JSON wins.')}`,
  );
}

// ------------------------------------------------------------------ 2. Sound

export function soundPart(index: Index): string {
  const ph = index.lex.phonology;
  const sample = ['lira', 'maivo', 'opioa', 'benaasasan', 'krono', 'amor'];

  return part(
    '2',
    'Sound',
    'The spelling is phonetic: what you see is what you sing.',
    `${h3('Letters')}
${table(
  ['Aspect', 'Rule'],
  [
    ['Vowels', esc(ph.vowels)],
    ['Core consonants', esc(ph.consonants_core)],
    ['Other consonants', esc(ph.consonants_other)],
    ['Stress', esc(ph.stress)],
  ].map(([a, b]) => [cell(esc(a ?? '')), cell(b ?? '')]),
)}
${h3('Syllables and stress')}
${paras(
  'Every vowel is its own syllable, because adjacent vowels never merge. A consonant between vowels starts the next syllable; of two consonants, the first closes the syllable before. Stress falls on the second-to-last syllable. The capitals below mark it.',
)}
${table(
  ['Word', 'Syllables and stress'],
  sample.map((w) => [cell(lir(w)), cell(sound(w))]),
  { cls: 'compact' },
)}
${callout(
  'singing',
  '`maivo` is ma-i-vo, three syllables, not two. `opioa` is o-pi-o-a, four. Hiatus vowels may glide in fast singing without changing the spelling.',
)}
${h3('Templates for new words')}
${table(
  ['Kind', 'Template'],
  [
    [cell('New root'), cell(esc(ph.new_root_template))],
    [cell('Function word'), cell(esc(ph.function_word_template))],
    [cell('Protected exceptions'), cell(esc(ph.protected_exceptions.join('; ')))],
    [
      cell('Declared one-edit pairs'),
      cell(ph.declared_distance_1_pairs.map(([a, b]) => `${lir(a)} / ${lir(b)}`).join('; ')),
    ],
  ],
)}
${callout(
  'parsing',
  'Until 1.2 the protected-exceptions label read “36 amor- double-a roots”, the 0.8 count. They are compounds, and there are **39** of them: 20 ending in `amor`, 19 beginning with it. 1.2 repaired the label.',
)}
${h3('Rhyme')}
${p(`Every headword belongs to a rhyme family by its ending: ${n(index.lex.rhyme_families.length)} families in all. Each featured word in Part 4 lists its rhymes.`)}`,
  );
}

// ------------------------------------------------------------------ 3. Words

export function wordsPart(index: Index): string {
  const lex = index.lex;
  const bena = index.byRoot.get('bena');
  if (bena === undefined) throw new Error('bena is missing');
  const forms = table(
    ['#', 'Slot', 'Rule', bena.root, 'Meaning'],
    FORM_SLOTS.map((s, i) => [
      cell(String(i + 1), 'num'),
      cell(esc(s.replace(/([A-Z])/g, ' $1').toLowerCase())),
      cell(morph(SLOT_BUILD[s])),
      cell(lir(formOf(bena, s)), 'form'),
      cell(esc(glossOf(bena, s))),
    ]),
    { cls: 'forms' },
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
  );

  const suffixes = table(
    ['Suffix', 'Meaning'],
    Object.entries(lex.morphology.suffixes).map(([k, v]) => [cell(morph(k)), cell(esc(v))]),
  );

  const lexicalised = table(
    ['Word', 'Meaning'],
    Object.entries(lex.morphology.lexicalised_derivations).map(([k, v]) => [
      cell(lir(k)),
      cell(esc(v)),
    ]),
  );

  const motion = table(
    ['Prefix', 'Meaning'],
    Object.entries(lex.motion_prefixes.canon).map(([k, v]) => [cell(morph(k)), cell(esc(v))]),
  );
  const retiredMotion = Object.entries(lex.motion_prefixes.retired)
    .map(([k, v]) => `${morph(k)} → ${esc(v)}`)
    .join('; ');

  return part(
    '3',
    'Words',
    'Every content word is a headword with seven forms, built by rule. Learn the seven suffixes once and you can read every word in the lexicon.',
    `${h3('The seven forms')}
${p('Every headword has exactly seven forms, built from its root R. Here they are for `bena`, good:')}
${forms}
${callout('parsing', 'The forms object is stored in two key orders (80 entries put the verb second). Read forms by key, never by position.')}
${callout('singing', 'The ascended forms in `-asa` and `-asasan` make a line sacred in register. Choose them for hymn-like moments; they add two syllables.')}
${h3('The verb rule')}
${p('The verb is the only form that is not a plain suffix. It depends on the first letter of the word:')}
${verbRule}
${p('`opi`, hope, is a real headword, so `opioa` is live data, not a reserved case. A compound takes the verb class of its first letter.')}
${h3('Suffixes and derivations')}
${p(`Order: **${esc(lex.morphology.suffix_order)}**. A word takes one form or one derivation, then \`-ti\`, then \`-ri\` (settled question 4).`)}
${suffixes}
${p('Some derivations carry fixed meanings [[1.0:G20]]:')}
${lexicalised}
${h3('Compounds')}
${paras(
  'A compound is MODIFIER + HEAD written together, head last: `lunolumi` is moon-light. Both components must be active headwords, and every compound has exactly two components, so its spelling is just the two joined. One compound is nested: `mudusomubiti` = `mudu` + `somubiti`.',
  'A compound is **one word**, never two nouns side by side (ADR-0011). Its verb class follows its first letter.',
)}
${h3('Motion prefixes')}
${p(`${esc(lex.motion_prefixes.rule)}.`)}
${motion}
${p(`Retired: ${retiredMotion}.`)}
${h3('Registers')}
${ul([
  'Entries are everyday or poetic only. There is no sacred word list [[0.8:R10]].',
  'Texts are everyday, poetic or sacred. Sacred is a property of the form (`-asa`, `-asasan`), not of the entry.',
  'Irreverent is an optional tone flag on a text, never on a lexicon entry.',
])}
${h3('Retired spellings')}
${p(
  `${n(lex.legacy.retired_roots.length)} roots were retired and ${n(lex.legacy.respelled_roots.length)} respelled in 1.0. Retired spellings are reserved until 2.0. A pre-1.0 text is read with the 0.8 lexicon [[1.0:G19]], and a parser warns on a pre-1.0 spelling and names its replacement.`,
)}`,
  );
}

// ------------------------------------------------------------- 5. Small words

export function smallWordsPart(index: Index): string {
  const lex = index.lex;
  const pronouns = table(
    ['Form', 'Person', 'Number', 'Possessive', 'Reflexive'],
    lex.pronouns.map((x) => [
      cell(lir(x.form), 'form'),
      cell(esc(x.person)),
      cell(esc(x.number)),
      cell(withGloss(x.possessive)),
      cell(withGloss(x.reflexive)),
    ]),
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
    .map(([v, w]) => [cell(v, 'num'), cell(lir(w))]);

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
    '6',
    'The small words',
    'Pronouns, correlatives, numbers, colours and particles: closed classes, each with its own pattern. The full tables are in the appendices.',
    `${h3('Pronouns')}
${pronouns}
${callout('parsing', '`maivo` is both a pronoun and a root. A spelling can belong to more than one namespace, so a word index maps a spelling to a list, never to one entry.')}
${h3('Correlatives: determiner + concept')}
${grid}
${p('Correlatives of place, time, manner and cause (`-pago`, `-krono`, `-modo`, `-kasa`) work as adverbials. Those of thing and person (`-coda`, `-nela`) work as nouns.')}
${p('Since 1.2 three quantifiers join `krono` and only `krono`: `muya-krono` often, `poka-krono` rarely, `rada-krono` each time [[1.2:G34]].')}
${h3('Numbers')}
${table(['Value', 'Word'], digits, { cls: 'compact digits' })}
${paras(
  'Ten is `unzira`, and the tens to fifty are contracted: `dozira`, `trezira`, `cuazira`, `penzira`. A unit joins with a hyphen: `dozira-cuara`, 24. One hundred is `centa`; a thousand `mililumi`.',
  'Ordinals take `-ne`: `una-ne`, first. Fractions are NUMBER `de` NUMBER: `tressa de cuara`, three quarters. A `ne` after a number is never negation (settled question 6).',
)}
${h3('Colours')}
${p('Nine families, each a base and four shades. They are a closed class of their own: no colour is a headword. They are the only words that use sh and ch.')}
${colours}
${h3('Discourse particles')}
${table(
  ['Particle', 'Function', 'Where'],
  lex.discourse_particles.map((d) => [
    cell(lir(d.form), 'form'),
    cell(esc(d.function)),
    cell(esc(d.positions)),
  ]),
)}`,
  );
}

/** `maivo de lira (my song)` → the Liraasa set apart, the gloss plain. */
function withGloss(text: string): string {
  const m = /^(.*?)\s*\((.*)\)$/.exec(text);
  return m === null
    ? lir(text)
    : `${lir(m[1] ?? '')} <span class="gloss">${esc(m[2] ?? '')}</span>`;
}

// ---------------------------------------------------------------- 6. Clause

export function clausePart(index: Index): string {
  const lex = index.lex;
  const g = lex.grammar;
  const required = new Set(['SUBJECT', 'VERB']);

  const diagram = `<figure class="slots" aria-label="The 20-slot clause template">
<ol class="slot-row">${g.slots
    .map(
      (s) =>
        `<li class="slot${required.has(s.slot) ? ' req' : ''}"><span class="slot-n">${String(s.n)}</span><span class="slot-name">${
          required.has(s.slot) ? esc(s.slot) : `[${esc(s.slot)}]`
        }</span></li>`,
    )
    .join('')}</ol>
<figcaption>The 20 slots in order. SUBJECT and VERB are required (solid); every bracketed slot is optional. The order is fixed.</figcaption>
</figure>`;

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
  );

  const exclusions = g.stacking.exclusions.map(([a, b]) => `${lir(a)} + ${lir(b)}`).join(' · ');
  const copulas = table(
    ['Word', 'Meaning', 'Use'],
    fwRows(lex, ['ke', 'ka', 'kapoki', 'loya', 'miyo', 'gome']),
  );
  const linkers = table(
    ['Word', 'Meaning', 'Use'],
    fwRows(lex, [
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
  );

  return part(
    '7',
    'The clause',
    'A Liraasa clause is a row of twenty slots in a fixed order, anchored on the verb. Only the subject and the verb are required.',
    `${h3('The 20-slot template')}
${diagram}
<pre class="template"><code>${esc(g.clause_template)}</code></pre>
${slotTable}
${callout('parsing', 'SPEC §5.4 quotes an older 10-slot template. The 20-slot template above is the canon.')}
${h3('Scope operators')}
${p(`${g.scope_operators.words.map((w) => `\`${w}\``).join(' ')} stand ${esc(g.scope_operators.rule)}. Scope runs left over right [[1.0:G1]]; \`ne\` negates everything to its right, up to the verb.`)}
${examples([['Maivo po ne somusia.', 'I did not sleep.']])}
${h3('Stacking')}
${p(`One word per slot. These pairs cannot share a clause [[1.0:G16]]:`)}
<p class="pairs">${exclusions}</p>
${p(`At most ${String(g.stacking.max_preverbal_operators_recommended)} pre-verbal operators are recommended.`)}
${callout('singing', 'Operators are short and unstressed in the line, so they are good for filling a beat. But four before a verb is the comfortable limit.')}
${h3('Copulas and the verb slot')}
${copulas}
${ul([
  '`ke` is a temporary state or a location now: `li nela ke benasan`, the person is good right now. `ka` is a permanent identity or quality.',
  'A predicate adjective may also stand bare, with no copula: `lira benasan`.',
  'Transitivity is usage-based (settled question 5): `gome` can passivise any verb used with an object. There is no transitive flag.',
  'Valency operators `vaku` (make), `lesvu` (let) and `tekvu` (prevent) follow CAUSER [TENSE…] OP ACTOR [ne] [APPROACH] [PHASE] [EFFORT] VERB [OBJECT] [[1.0:G14]].',
])}
${h3('The noun phrase')}
<pre class="template"><code>${esc(g.noun_phrase)}</code></pre>
${ul([
  'Order: quantifier, then article or owner, then number, then adjectives, then the noun with `-ti` and `-ri`, then the `de` phrase, then the relative clause [[0.8:G7]].',
  '**Adjectives come before the noun**, and a noun does not modify a noun (ADR-0011).',
  '`toda` N is every N; `toda li` N is all the N.',
])}
${h3('Linking clauses')}
${p('A clause with its own verb is opened by a linker. Two verbs in one clause with no linker is an error.')}
${linkers}
${ul([
  '`fime` opens a content clause, “that …”. The demonstrative “that” is `ola`.',
  '`raho` opens a relative clause. If it does not end the sentence, a comma closes it [[1.0:G21]].',
  '`sidu` joins two verbs that share a subject. It never takes a copula: “hope to become” is `kopi loya`.',
  '`ala` means toward, **never** the infinitive “to”.',
])}
${examples([
  ['Maivo sabesia fime taivo lirala.', 'I know that you sing.'],
  ['Li nela raho lirala ka benasan.', 'The person who sings is good.'],
  ['Maivo vurlova sidu lirala.', 'I want to sing.'],
])}
${h3('Questions')}
${p('A question keeps **statement order** and adds `ki` as the last word of the clause. Question words are `ki-` correlatives that stay in place; an embedded yes/no question uses `si` [[0.8:G4]]. The copula is never moved to the front.')}
${examples([['Taivo futu relnura ki?', 'Will you come back?']])}`,
  );
}

// --------------------------------------------------------------- 7. Recipes

export const RECIPES: readonly (readonly [string, string, string, string, string])[] = [
  ['my / your X', 'PRONOUN de X', 'taivo de lira', 'your song', '1.2:G27'],
  ["Father's X", 'NAME de X', 'pilo de bumre', "father's bread", '1.2:G27'],
  ['the X of the Y', 'li X de li Y', 'li bumre de li cilni', 'the bread of the city', '1.2:G27'],
  ['a song about love', 'X de Y', 'li lira de amor', 'the song of love', '1.2:G30'],
  ['songbird (noun + noun)', 'first noun → its adjective', 'lirasan lavra', 'songbird', 'ADR-0011'],
  ['two coins', 'NUMBER NOUN, -ri optional', 'dossa cono', 'two coins', '1.2:G28'],
  ['the forgotten', 'article + adjective', 'li ramumomvisan', 'the forgotten', '1.2:G29'],
  [
    'owe me two coins',
    'VERB PRONOUN THEME',
    'guraga maivo dossa cono',
    'owe me two coins',
    '1.2:G26',
  ],
  [
    'lend three coins to me',
    'VERB THEME ala RECIPIENT',
    'rimara tressa cono ala maivo',
    'lend three coins to me',
    '1.2:G26',
  ],
  ['now I sing', 'time word first or last', 'Eli-krono, maivo lirala.', 'Now I sing.', '1.2:G24'],
  [
    'suddenly, …',
    'frame word first, with a comma',
    'Zafra, li dorbi po lallela.',
    'Suddenly the door opened.',
    'slot 1',
  ],
  ['water or food', 'A oro B', 'miru oro nami', 'water or food', '1.2:G25'],
  [
    'open it with a key',
    'yuta + the instrument',
    'Maivo lallela li dorbi yuta li kemye.',
    'I open the door with the key.',
    '1.2:G33',
  ],
  ['often / rarely', 'quantifier-krono', 'Maivo lirala muya-krono.', 'I sing often.', '1.2:G34'],
  ['too many songs', 'diba + quantifier or adjective', 'diba muya lirari', 'too many songs', ''],
  [
    'my father',
    'a pronoun outranks a name',
    'Pilo de maivo po lirala.',
    'My father sang.',
    '1.2:G32',
  ],
  ['my daughter', 'FEMALE + linu', 'Maivo de minvalinu lirala.', 'My daughter sings.', '1.2:G36'],
  ['aunt', 'gender adjective + neutral noun', 'minvasan purmafamli', 'aunt', '1.2:G36'],
  [
    'recognize',
    'curated motion metaphor',
    'Maivo revo-sabesia taivo.',
    'I recognize you.',
    '1.2:G35',
  ],
  ['did / -ed', 'po + verb', 'Saivo po venreva.', 'They arrived.', 'slot 4'],
  ['will', 'futu + verb', 'Taivo futu relnura ki?', 'Will you come back?', 'slot 4'],
  ['not', 'ne before what it negates', 'Maivo po ne somusia.', 'I did not sleep.', '1.0:G1'],
  [
    'is (now) / is (always)',
    'ke / ka',
    'li nela ke benasan',
    'the person is good right now',
    'copulas',
  ],
  [
    'I know that …',
    'fime + clause',
    'Maivo sabesia fime taivo lirala.',
    'I know that you sing.',
    '',
  ],
  [
    'the person who sings',
    'raho + clause',
    'Li nela raho lirala ka benasan.',
    'The person who sings is good.',
    '1.0:G21',
  ],
  ['want to sing', 'VERB sidu VERB', 'Maivo vurlova sidu lirala.', 'I want to sing.', '0.8:G6'],
  [
    'command',
    'no subject; fisa = please',
    'Vulravelmava maivo de yendo, fisa.',
    'Bandage my palm, please.',
    '1.2:G31',
  ],
  [
    'addressing someone',
    'set off by commas',
    'Taivo viki pagopa ligo maivo ki, maivo de amor?',
    'Would you come near me, my love?',
    '1.2:G31',
  ],
  [
    'perhaps …',
    'attitude word at the clause end',
    'Maivo lirala poye.',
    'Perhaps I sing.',
    '1.0:G22',
  ],
];

export function recipesPart(): string {
  return part(
    '8',
    'Patterns: English → Liraasa',
    'The recipes a translator follows. Every example is canon.',
    table(
      ['English', 'Pattern', 'Example', 'Ruling'],
      RECIPES.map(([en, pat, l, gloss, id]) => [
        cell(esc(en)),
        cell(esc(pat)),
        cell(`${lir(l)}<span class="gloss">${esc(gloss)}</span>`),
        cell(/^\d\.\d:|^ADR/.test(id) ? badge(id) : esc(id)),
      ]),
      { cls: 'recipes' },
    ),
  );
}

// ---------------------------------------------------------------- 8. Rulings

function rulingTable(edition: string, rs: readonly Ruling[]): string {
  return table(
    ['Id', 'Topic', 'Ruling'],
    rs.map((r) => [
      cell(badge(`${edition}:${r.id}`)),
      cell(`<strong>${esc(r.topic)}</strong>`),
      cell(esc(r.ruling)),
    ]),
    { cls: 'rulings' },
  );
}

export function rulingsPart(index: Index): string {
  const lex = index.lex;
  const r12 = lex.rulings_1_2
    .map(
      (r) => `<article class="ruling" aria-labelledby="r12-${r.id}">
<h4 id="r12-${r.id}">${badge(`1.2:${r.id}`)} ${esc(r.topic)}</h4>
<p>${esc(r.ruling)}${r.refines === undefined || r.refines.length === 0 ? '' : ` <em class="refines">Refines ${esc(r.refines.join(', '))}.</em>`}</p>
${r.examples === undefined ? '' : examples(r.examples)}
</article>`,
    )
    .join('\n');

  const settled = table(
    ['Question', 'Answer'],
    lex.settled_open_questions_0_8.map((q) => [cell(esc(q.q)), cell(esc(q.answer))]),
  );

  const revised = lex.examples.filter((e) => e.liraasa_1_1 !== undefined);
  const revisedTable = table(
    ['Before (1.1)', 'After (1.2)', 'English'],
    revised.map((e) => [
      cell(lir(e.liraasa_1_1 ?? '', 'retired')),
      cell(lir(e.liraasa)),
      cell(esc(e.english)),
    ]),
  );

  return part(
    '9',
    'Every ruling',
    'Verbatim from the lexicon, grouped by edition, newest first. 1.2:G24–G31 come from the open-questions review of 2026-10-17 (ADR-0012), G32–G36 from the 1.2 lexicon update (ADR-0013).',
    `${h3(`Rulings 1.2 (${lex.rulings_1_2[0]?.id ?? ''}–${lex.rulings_1_2.at(-1)?.id ?? ''})`)}
${r12}
${h3('Rulings 1.0')}
${rulingTable('1.0', lex.rulings_1_0)}
${h3('Rulings carried from 0.8')}
${rulingTable('0.8', lex.rulings_0_8_carried)}
${h3('ADR-0011: a noun does not modify a noun')}
${p('Of two nouns side by side, the first becomes its adjective, and that adjective describes the second: `lira` + `lavra` → `lirasan lavra`, a songbird. The adjective depends on the form of the first noun:')}
${table(
  ['Noun form', 'Adjective', 'Example'],
  [
    [cell('root'), cell(morph('-san')), cell(`${lir('sizo')} → ${lir('sizosan')}`)],
    [
      cell('ascended'),
      cell(morph('-asasan')),
      cell(`${lir('mavopagoasa')} → ${lir('mavopagoasasan')}`),
    ],
    [cell('negative'), cell(morph('-nasan')), cell(`${lir('melona')} → ${lir('melonasan')}`)],
  ],
)}
${p('If that adjective slot is unused, it cannot be used. Then take the lexicon’s compound of the two nouns if one exists, or else a `de` phrase. Compounds are untouched by this rule.')}
${h3('Settled questions from 0.8')}
${settled}
${h3('Revised examples')}
${p(`These ${String(revised.length)} canon examples broke ADR-0011 and are revised in 1.2. The lexicon keeps the old text.`)}
${revisedTable}`,
  );
}

// ---------------------------------------------------------------- 9. Parsing

export const READ_ORDER = [
  'Exact form in the form index → **lexical** (every reading kept).',
  'A closed-class word → its class.',
  'A numeral, plain or hyphenated, optionally with `-ne` (ordinal).',
  'A derivation (`-yo`, `-vu`, `-pago`).',
  'Suffix stripping (word longer than 4): strip `-ri`, then `-ti` if what remains is not known. The stem must be a known form, derivation or closed word.',
  'A motion prefix (`va-`, `du-`, `taro-`, `yave-`, `revo-`) on a **verb** form.',
  'A fraction, N-de-N.',
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
  ['error', 'a second noun phrase but the clause has no verb or copula', 'slot'],
  ['warn', 'a give-type verb with a bare non-pronoun recipient', '1.2:G26'],
  ['error', 'two bare nouns side by side → adjective, compound or de phrase', 'ADR-0011'],
  ['error', 'de after a verb or adjective; de with nothing after it', 'noun phrase'],
  ['error', 'a stranded preposition; ala used as the infinitive “to”', 'noun phrase'],
  ['error', 'sidu between non-verbs, or followed by a copula', 'sidu'],
  ['error', 'fime followed by a copula or tense (the demonstrative “that” is ola)', 'fime'],
  ['error', 'zafra / finra / lanto / kenvi not opening its clause', 'slot 1'],
  ['warn', 'one of those four frame words without its comma', 'slot 1'],
  ['note', 'a time word opening a clause: the comma is optional', '1.2:G24'],
  ['error', 'a tense or operator out of slot order, or after the verb', '1.0:G1'],
  ['error', 'excluded pairs in one clause; two evidentials', '1.0:G16'],
  ['error', 'ki not last; attitude words not clause-final', '1.0:G22'],
  ['error', 'a question with the copula or tense moved to the front', 'ki'],
  ['warn', 'a saying-verb + su read as “about”', '1.2:G30'],
  ['warn', 'English gloss is passive but the line has no gome', 'passive'],
  ['note', '-na direction; hema as hesitation', ''],
];

export function parsingPart(): string {
  const linkers =
    'ata nara oro si sina kasa kopisa nevi raho fime kube nayo tuni sige kureli sidu tonsi narli korsi krotiata yava gome ki-oro sabri';
  return part(
    '10',
    'Parsing: how a machine reads a line',
    'The reference implementation is the checker in the Workbench’s editor/index.html (parseWord, splitClauses, placeClause, checkLine, backTranslate). This part specifies it.',
    `${h3('Data built from the lexicon')}
${ul([
  '**Form index:** spelling → a **list** of readings. Some spellings belong to more than one namespace (`maivo` is a pronoun and a root).',
  '**Closed-class table:** function words, correlatives, time words, particles, pronouns, colours and numerals.',
  '**Derivations:** root + `-yo` / `-vu` / `-pago`; `mavopago` means only “society”.',
  '**Legacy table:** pre-1.0 spelling → replacement. migration_forms.kind has five values; for archived phrases the target is a phrase, not a form.',
  '**English index:** every glossed slot and every synonym.',
])}
${h3('Tokenising')}
${p('Tokens are runs of letters, with internal hyphens and apostrophes kept: `eli-krono`, `una-ne` and `dozira-cuara` are one token each. Punctuation splits phrases. A comma is a pause, which matters for frames, for closing a relative clause [[1.0:G21]] and for address [[1.2:G31]].')}
${h3('Reading one word, in order')}
${p('**Lexicon first:** many roots end in letters that look like suffixes (`navu`, `sevu`, `pago`), so a known spelling always beats a decomposition.')}
<ol class="steps">${READ_ORDER.map((s) => `<li>${md(s)}</li>`).join('')}</ol>
${h3('Roles')}
${ul([
  'From the word itself: tense, operator, copula, valency, determiner, quantifier, degree, focus, preposition, free, placed.',
  'Lexical readings: verb slot → **verb**; root, ascended and negative → **noun**; the three adjective slots → **adj**.',
  'Pronouns, names, derivations and fractions → noun. Place, time, manner and cause correlatives → adverb; the others → noun. Time words → adverb or noun.',
])}
${h3('Splitting clauses')}
${p('A new clause starts at a linker, or at any `ki-` question word. A coordinated clause has its own single verb; an embedded one runs on into the main predicate, so its verb is not counted as a second verb.')}
<p class="pairs">${linkers
      .split(' ')
      .map((w) => lir(w))
      .join(' ')}</p>
${h3('Placing tokens in slots')}
${paras(
  'The parser is a state machine, start → subject → verb → post, walking left to right. Focus words stand before their constituent; free and placed words are skipped. Tense and operators move the state to verb. A preposition consumes the noun phrase after it, and `la` + adjective is an adjunct.',
  'A time word opens or closes the clause freely [[1.2:G24]]; after `de` it is a noun. The verb slot takes a verb form, a copula, a valency operator or `gome`. A noun phrase before the verb is the subject; after it, the object or complement. Give-type verbs take two bare noun phrases only when the first is a pronoun [[1.2:G26]]. Anything left over is an error naming the token and the slot expected.',
)}
${h3('Reading de')}
${p('In X `de` Y, Y is the owner, “X of Y”, **unless** X is a pronoun or a personal name, in which case X is the owner, “X’s Y” [[1.2:G27]]. A pronoun is the owner on either side. NUMBER `de` NUMBER is a fraction. `de` needs a noun phrase on both sides.')}
${h3('The checker’s rules')}
${table(
  ['Severity', 'Rule', 'Id'],
  RULES.map(([sev, rule, id]) => [
    cell(`<span class="sev sev-${sev}">${esc(sev)}</span>`),
    cell(esc(rule)),
    cell(/^\d\.\d:|^ADR/.test(id) ? badge(id) : esc(id)),
  ]),
)}
${h3('Back-translation')}
${p('Back-translation is mechanical and judges nothing. Each word gets its first sense; a pronoun before `de` becomes a possessive and after `de` an object; `-ri` adds “s” and `-ti` adds “little”. It is shown beside the writer’s English so drift is visible.')}
${callout('parsing', 'Generated text is untrusted. Every machine-written Liraasa line must be tokenised, parsed and checked before it is shown, and a flagged line does not go in the guide.')}`,
  );
}

// --------------------------------------------------------- 10. Open questions

/** Not decided: presented as open, resolved nowhere (SPEC §14). */
export const OPEN_QUESTIONS: readonly string[] = [
  '**“Once”, “N times”:** no construction yet.',
  '**“To + verb”:** a general complement beyond `sidu` (shared subject) and `kopisa` (purpose).',
  '**Evidentials:** the meaning when absent, whose evidence counts inside a `fime` clause, and the meaning in a question.',
  '**Relative clauses on a prepositional object:** “the house in which …”.',
  '**Restoring retired roots** needed for *Bumrepago* and possibly others: deferred to the author.',
];

export function openQuestionsPart(): string {
  return part(
    '11',
    'Open questions',
    'These are not decided. They are presented as open, and nothing in this guide resolves them.',
    ul(OPEN_QUESTIONS),
  );
}

// ------------------------------------------------------------- Appendices

export function appendices(index: Index): string {
  const lex = index.lex;
  const fwTable = table(
    ['Form', 'Meaning', 'Position', 'Example', 'Since'],
    lex.function_words.map((w) => [
      cell(fwForm(w.form), 'form'),
      cell(esc(w.meaning)),
      cell(esc(w.position)),
      cell(`${lir(w.example)}<span class="gloss">${esc(w.example_gloss)}</span>`),
      cell(esc(w.since)),
    ]),
    { cls: 'appendix' },
  );

  const time = table(
    ['Form', 'English'],
    lex.time_and_dates.map((t) => [cell(lir(t.form)), cell(esc(t.english))]),
    { cls: 'compact two-up' },
  );

  const numberRules = table(
    ['Group', 'Value', 'Liraasa', 'Rule', 'Comment'],
    lex.numbers.rules.map((r) => {
      const word = String(r.Liraasa ?? '');
      return [
        cell(esc(String(r.Group ?? ''))),
        cell(esc(String(r.Value ?? '')), 'num'),
        cell(index.isWord(word.toLowerCase()) ? lir(word) : esc(word)),
        cell(esc(String(r['Construction rule'] ?? ''))),
        cell(esc(String(r['Usage / comment'] ?? ''))),
      ];
    }),
    { cls: 'appendix' },
  );

  const particles = lex.discourse_particles
    .map(
      (d) => `${h3(`\`${d.form}\``, `particle-${d.form}`, false)}
${p(`${esc(d.function)}. **Where:** ${esc(d.positions)}. **Register:** ${esc(d.register)}.`)}
${examples(d.examples.map((e) => [e.liraasa, e.english] as const))}`,
    )
    .join('\n');

  const colourNotes = table(
    ['Family', 'Notes'],
    lex.colors.map((c) => [
      cell(esc(c.Family ?? '')),
      cell(esc(c['Example meanings / notes'] ?? '')),
    ]),
  );

  return `<section class="part appendices" aria-labelledby="appendices">
<header class="part-head"><div class="part-num" aria-hidden="true">A–E</div><h2 id="appendices" data-toc="Appendices">Appendices</h2></header>
${h3('A. Function words')}
${fwTable}
${h3('B. Time and dates')}
${time}
${h3('C. Numbers: the construction rules')}
${numberRules}
${h3('D. Colours')}
${colourNotes}
${h3('E. Discourse particles')}
${particles}
</section>`;
}
