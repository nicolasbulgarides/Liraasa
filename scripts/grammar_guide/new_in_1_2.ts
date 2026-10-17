/**
 * What 1.2 adds: the new vocabulary with its seven-form tables, and the
 * changelog generated from the 1.2 changesets (ADR-0012, ADR-0013).
 *
 * Nothing here is written by hand about the data: every word, gloss, count
 * and change is read from the handoff lexicon and the changesets it carries.
 */
import { formsTable, sound } from './core_words';
import { glossOf, type Headword, type Index } from './data';
import { callout, cell, esc, h3, h4, lir, md, morph, p, paras, part, table } from './html';

interface Op {
  entry: string;
  op: string;
  slot?: string;
  from: string | null;
  to: string | null;
  ruling?: string;
  reason: string;
}

export interface FullChangeset {
  id: string;
  summary: string;
  ops: Op[];
  rulings?: { id: string; topic: string }[];
  motion_metaphors?: Record<string, string>;
  lexicalised_derivations?: Record<string, string>;
}

type Counts = Record<string, number>;

const n = (x: number): string => x.toLocaleString('en-US');
const SLOT_NAME: Record<string, string> = {
  root: 'root',
  ascended: 'ascended',
  negative: 'negative',
  verb: 'verb',
  negativeAdjective: 'negative adjective',
  adjective: 'adjective',
  ascendedAdjective: 'ascended adjective',
};
const RAW: Record<string, string> = {
  negativeAdjective: 'negative_adjective',
  ascendedAdjective: 'ascended_adjective',
};

function changesets(index: Index): FullChangeset[] {
  return (
    (index.lex as unknown as { changesets_1_2_full?: FullChangeset[] }).changesets_1_2_full ?? []
  );
}

/** The new headword whose root gloss starts with `gloss`: spellings are read, never assumed. */
function rootGlossed(index: Index, gloss: string): Headword {
  const h = index.lex.headwords.find(
    (x) => x.since === '1.2' && (x.glosses.root ?? '').startsWith(gloss),
  );
  if (h === undefined) throw new Error(`no 1.2 headword glossed "${gloss}"`);
  return h;
}

function byId(index: Index, id: string): Headword | undefined {
  return index.lex.headwords.find((h) => (h as unknown as { id?: string }).id === id);
}

function kinship(index: Index): string {
  const female = rootGlossed(index, 'woman');
  const male = rootGlossed(index, 'man; the masculine');
  const marriage = rootGlossed(index, 'kinship by marriage');
  const word = (root: string): string => {
    const h = index.byRoot.get(root);
    if (h === undefined) throw new Error(`${root} is not a headword`);
    return root;
  };
  const adj = (h: Headword): string => h.forms.adjective ?? '';
  const rows: [string, string, string][] = [
    ['mother · father', `${lir(word('mare'))} · ${lir(word('pilo'))}`, 'roots, unchanged'],
    ['parent', lir(word('purma')), 'neutral root'],
    ['sibling', lir(word('famli')), 'neutral root'],
    ['child', lir(word('linu')), 'neutral root'],
    [
      'daughter, girl · son, boy',
      `${lir(female.root + 'linu')} · ${lir(male.root + 'linu')}`,
      'FEMALE / MALE + child',
    ],
    [
      'sister · brother',
      `${lir(female.root + 'famli')} · ${lir(male.root + 'famli')}`,
      'FEMALE / MALE + sibling',
    ],
    ['grandparent', lir(word('purmapurma')), 'parent + parent'],
    [
      'grandmother · grandfather',
      `${lir('purmamare')} · ${lir('purmapilo')}`,
      'parent + mother / father: the parent’s mother',
    ],
    ['aunt or uncle', lir(word('purmafamli')), 'parent + sibling'],
    [
      'aunt · uncle',
      `${lir(`${adj(female)} purmafamli`)} · ${lir(`${adj(male)} purmafamli`)}`,
      'adjective + noun: a phrase, not a compound',
    ],
    ['spouse', lir(word('devorivo')), 'faith + companion'],
    ['widow, widower', lir('nemerivo'), 'sorrow + companion'],
    ['parent-in-law', lir(marriage.root + 'purma'), 'BY MARRIAGE + parent'],
    [
      'mother-in-law · father-in-law',
      `${lir(marriage.root + 'mare')} · ${lir(marriage.root + 'pilo')}`,
      'BY MARRIAGE + mother / father',
    ],
    ['sibling-in-law', lir(marriage.root + 'famli'), 'BY MARRIAGE + sibling'],
    [
      'sister-in-law · brother-in-law',
      `${lir(`${adj(female)} ${marriage.root}famli`)} · ${lir(`${adj(male)} ${marriage.root}famli`)}`,
      'adjective + noun',
    ],
    ['child-in-law', lir(marriage.root + 'linu'), 'BY MARRIAGE + child'],
    [
      'daughter-in-law · son-in-law',
      `${lir(`${adj(female)} ${marriage.root}linu`)} · ${lir(`${adj(male)} ${marriage.root}linu`)}`,
      'adjective + noun',
    ],
  ];
  return `${h3('Kinship and gender')}
${paras(
  `Liraasa kinship is neutral: \`purma\` is a parent of any sex, \`famli\` a sibling, \`linu\` a child. 1.2 adds \`${female.root}\`, woman, and \`${male.root}\`, man, so that gender can be said when it matters, and \`${marriage.root}\`, kinship by marriage [[1.2:G36]].`,
  'Neither gender root is the negative of the other: their `-na` slots stay unused. Where a two-part compound exists, use it; everywhere else the adjective stands before the neutral noun, as ADR-0011 has it. `mare` and `pilo`, mother and father, are unchanged.',
)}
${table(
  ['English', 'Liraasa', 'Built from'],
  rows.map(([en, l, how]) => [cell(esc(en)), cell(l), cell(esc(how))]),
)}
${callout(
  'singing',
  `The compounds are one word with one stress: \`${female.root}linu\` is ${esc(
    sound(female.root + 'linu')
      .replace(/<[^>]+>/g, '')
      .split(' ')[0] ?? '',
  )}. The phrases keep two stresses, which can carry a longer line.`,
)}`;
}

export function newWordsPart(index: Index): string {
  const lex = index.lex;
  const added = lex.headwords.filter((h) => h.since === '1.2');
  const roots = added.filter((h) => h.type === 'Primal');
  const compounds = added.filter((h) => h.type === 'Compound');
  const cs = changesets(index);

  const domains = [...new Set(roots.map((h) => h.domain))];
  const rootSections = domains
    .map((d) => {
      const words = roots.filter((h) => h.domain === d);
      return `${h3(`${d}: ${words.map((h) => `\`${h.root}\``).join(', ')}`)}
${words
  .map(
    (h) => `<article class="core-word new-word">
${h4(`\`${h.root}\`: ${glossOf(h, 'root')}`)}
<p class="muted">${sound(h.root)} · ${esc(h.register)}</p>
${formsTable(h)}
</article>`,
  )
  .join('\n')}`;
    })
    .join('\n');

  const compoundTable = table(
    ['Compound', 'Built from', 'Meaning'],
    compounds.map((h) => {
      const [a, b] = h.components ?? ['', ''];
      return [
        cell(lir(h.root), 'form'),
        cell(`${lir(a)} + ${lir(b)}`),
        cell(esc(glossOf(h, 'root'))),
      ];
    }),
  );

  const newDerivations = cs.flatMap((c) => Object.entries(c.lexicalised_derivations ?? {}));
  const derivationTable = table(
    ['Word', 'Built from', 'Meaning'],
    newDerivations.map(([word, gloss]) => {
      const [meaning, built] = gloss.split(': ');
      const [base, suffix] = (built ?? '').split(' + ');
      return [
        cell(lir(word), 'form'),
        cell(`${lir(base ?? '')} + ${morph(suffix ?? '')}`),
        cell(esc(meaning ?? '')),
      ];
    }),
  );

  const fws = lex.function_words.filter((f) => f.since === '1.2');
  const correlatives = lex.correlatives.filter((c) => (c as { since?: string }).since === '1.2');
  const metaphors = cs.flatMap((c) => Object.entries(c.motion_metaphors ?? {}));

  return part(
    '5',
    'New words in 1.2',
    `1.2 adds **${n(roots.length)} primal roots** and **${n(compounds.length)} compounds**, ${n(fws.length)} function words, ${n(correlatives.length)} correlatives and ${n(newDerivations.length)} lexicalised derivations. Every spelling was checked by the sound checker (scripts/check_sounds.py) against every active and reserved word before it was chosen.`,
    `${kinship(index)}
${h3('Small words')}
${table(
  ['Word', 'Meaning', 'Use'],
  [
    ...fws.map((f) => [cell(lir(f.form), 'form'), cell(esc(f.meaning)), cell(esc(f.position))]),
    ...correlatives.map((c) => [
      cell(lir(c.form), 'form'),
      cell(esc(c.gloss)),
      cell(md('quantifier + `krono` [[1.2:G34]]')),
    ]),
    ...metaphors.map(([form, gloss]) => [
      cell(lir(form), 'form'),
      cell(esc(gloss)),
      cell(md('curated motion metaphor [[1.2:G35]]')),
    ]),
  ],
)}
${callout('parsing', '`yuta` is the instrument and `ko` the companion: `yuta li kemye`, with the key; `ko saivo`, with him. `diba` is excess and `tu` is “also”.')}
${h3('Compounds')}
${p('Each is two active headwords, modifier first, head last, with no nesting.')}
${compoundTable}
${h3('Lexicalised derivations')}
${p('Regular derivations with a fixed meaning [[1.0:G20]]. The suffix attaches to the root spelling, so a compound can take one too, as `tisebitivu` already does.')}
${derivationTable}
${h3('The new roots')}
${p('Each root with all seven forms. A slot marked unused has no meaning and is never used [[0.8:R2]].')}
${rootSections}`,
  );
}

export function changelogPart(index: Index): string {
  const cs = changesets(index);
  const counts = (index.lex as unknown as { counts_1_1_to_1_2?: { before: Counts; after: Counts } })
    .counts_1_1_to_1_2;
  const label: Record<string, string> = {
    headwords: 'Headwords',
    primalRoots: 'Primal roots',
    compounds: 'Compounds',
    forms: 'Word forms',
    functionWords: 'Function words',
    correlatives: 'Correlatives',
    lexicalisedDerivations: 'Lexicalised derivations',
    rhymeFamilies: 'Rhyme families',
  };
  const countTable =
    counts === undefined
      ? ''
      : table(
          ['', '1.1', '1.2'],
          Object.entries(label).map(([k, l]) => [
            cell(esc(l)),
            cell(n(counts.before[k] ?? 0), 'num'),
            cell(n(counts.after[k] ?? 0), 'num'),
          ]),
          { cls: 'compact' },
        );

  const spelling = (op: Op): string => byId(index, op.entry)?.root ?? op.entry;
  const glossChanges = cs
    .flatMap((c) => c.ops)
    .filter((o) => o.op === 'edit_gloss' || o.op === 'activate_slot');
  const glossTable = table(
    ['Form', 'Before', 'After', 'Why'],
    glossChanges.map((o) => {
      const h = byId(index, o.entry);
      const form = h?.forms[RAW[o.slot ?? ''] ?? o.slot ?? 'root'] ?? spelling(o);
      return [
        cell(
          `${lir(form)}<span class="gloss">${esc(SLOT_NAME[o.slot ?? ''] ?? '')} of ${esc(h?.root ?? '')}</span>`,
        ),
        cell(esc(o.from ?? '')),
        cell(esc(o.to ?? '')),
        cell(`${esc(o.reason)}${o.ruling === undefined ? '' : ' ' + md(`[[${o.ruling}]]`)}`),
      ];
    }),
  );

  const sections = cs
    .map((c) => {
      const tally = new Map<string, number>();
      for (const o of c.ops) tally.set(o.op, (tally.get(o.op) ?? 0) + 1);
      const rulings = c.rulings ?? [];
      return `${h4(`Changeset ${c.id}`)}
${p(esc(c.summary))}
${table(
  ['Operation', 'Count'],
  [...tally.entries()].map(([op, k]) => [cell(`<code>${esc(op)}</code>`), cell(n(k), 'num')]),
  { cls: 'compact' },
)}
${rulings.length === 0 ? '' : p(rulings.map((r) => md(`[[1.2:${r.id}]] ${r.topic}`)).join(' · '))}`;
    })
    .join('\n');

  return part(
    '12',
    'Changelog 1.2',
    'What changed from 1.1, generated from the two 1.2 changesets. 1.1 stays frozen; 1.2 is rebuilt from it by npm run integrate:1.2, which halts unless every change lands on exactly what it says it replaces.',
    `${h3('At a glance')}
${countTable}
${ul12([
  'Rulings 1.2:G24–G31 (ADR-0012) and G32–G36 (ADR-0013).',
  'New roots, compounds, function words, correlatives, derivations and motion metaphors: see Part 5.',
  'Three examples revised for ADR-0011: see Part 9.',
  'The protected-exceptions label now counts 39 `amor` compounds, not 36 roots.',
  'Rhyme families are rebuilt over every headword, as 1.0 built them; 1.1 had carried the 1.0 families unchanged.',
  'Every entry now carries its stable id inline (ADR-0008).',
])}
${h3('Reglossed and newly glossed forms')}
${p('An unused slot gains a gloss only when its meaning is predictable [[0.8:R2]]. Old senses that moved are archived in the lexicon’s legacy section.')}
${glossTable}
${h3('The changesets')}
${sections}`,
  );
}

function ul12(items: readonly string[]): string {
  return `<ul>${items.map((i) => `<li>${md(i)}</li>`).join('')}</ul>`;
}
