/**
 * One-time tool: the two changesets `npm run integrate:3.4` applies to frozen
 * 3.3 (ADR-0024), in order:
 *
 *   1. 2026-10-25-lexicon-3-4            "Abstraction and the human condition"
 *   2. 2026-10-25-lexicon-3-4-decisions  the four 3.3 sentences the author left to the editor
 *
 *   npx tsx scripts/make_changeset_3_4.ts           # write both
 *   npx tsx scripts/make_changeset_3_4.ts --check   # build, write nothing
 *
 * The 3.4 patch (archived whole in archive/patch_3_4/, with its checksums)
 * adds no roots: 94 compounds, 18 derivations, 3 diminutives, 1 restored
 * form, 50 English aliases and ruling 3.4:G149, built by 3.0's
 * makeAdditionsChangeset with the same checks. Its recipes go into the guide.
 *
 * The author asked the editor to settle the four 3.3 sentences that broke an
 * earlier ruling "by best judgement" (2026-10-25). Three are recipes and a
 * test sentence, fixed where they live (scripts/grammar_guide/chapters.ts,
 * tests/grammar/patch_3_3.test.ts). One is a ruling's example, lexicon data:
 * 3.2:G147's "Peta da Amerika" becomes "li lira de Amerika", the form the
 * ruling's own text gives ("de + the name means from the place"), and the old
 * example is archived whole (op archive_text). The ruling's text is not
 * touched.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LexiconChangeset } from '../src/core/change/apply';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { type AdditionsConfig, makeAdditionsChangeset, recorder } from './make_changeset_3_0';
import { WORD_BUILDING_3_3 } from './make_changeset_3_3';

export const ID_3_4 = '2026-10-25-lexicon-3-4';
export const ID_DECISIONS = '2026-10-25-lexicon-3-4-decisions';
export const FILES_3_4 = [
  `data/changes/${ID_3_4}.json`,
  `data/changes/${ID_DECISIONS}.json`,
] as const;
const BASELINE = 'data/lexicon/liraasa_3_3.json';
const AT = '2026-10-25T20:00:00Z';
const EDITION = '3.4';

export const CONFIG_3_4: AdditionsConfig = {
  patch: 'archive/patch_3_4/patches/liraasa_3_4_patch.json',
  baseline: BASELINE,
  edition: EDITION,
  previous: '3.3',
  at: AT,
  id: ID_3_4,
  name: 'Liraasa 3.4 patch (Abstraction and the human condition)',
  wordBuilding: WORD_BUILDING_3_3,
  summary: (patch) =>
    `Liraasa 3.4, "Abstraction and the human condition" (ADR-0024), from the author's 3.4 patch. PROPOSED: ${patch.status}. ` +
    `Additions only, no new roots: ruling 3.4:G149; ${String(patch.compounds_add.length)} compounds, ` +
    `${String(patch.listed_derivations_add.length)} listed derivations, ${String(patch.lexicalised_diminutives_add.length)} lexicalised diminutives, ` +
    `${String(patch.restored_forms_add.length)} restored form and ${String((patch.english_aliases_add ?? []).length)} English aliases, each entry noted with its tier. ` +
    'No 3.3 word, spelling or ruling changes.',
};

/** 3.2:G147's second example, settled as the ruling's own text gives it. */
const G147_FROM = 'Peta da Amerika';
const G147_TO = 'li lira de Amerika';

export function decisions3_4(): LexiconChangeset {
  const lex = JSON.parse(readFileSync(resolve(BASELINE), 'utf8')) as RawLexicon;
  const rec = recorder({ edition: EDITION, at: AT });
  const g147 = (
    (lex as unknown as Record<string, { id: string; examples?: [string, string][] }[]>)
      .rulings_3_2 ?? []
  ).find((r) => r.id === 'G147');
  const i = g147?.examples?.findIndex(([l]) => l === G147_FROM) ?? -1;
  if (i < 0) throw new Error(`3.2:G147 has no example "${G147_FROM}"`);
  return {
    id: ID_DECISIONS,
    edition: EDITION,
    created: AT,
    author: 'nicolas',
    summary:
      'The editor\'s decisions on the four 3.3 sentences that broke an earlier ruling, which the author left to best judgement (2026-10-25, review/questions_3_3.md). In the lexicon, one: 3.2:G147\'s example "Peta da Amerika" reads "li lira de Amerika", as the ruling\'s text gives it; the old example is archived.',
    ops: [
      rec(
        'archive_text',
        '3.2:G147',
        G147_FROM,
        G147_TO,
        '3.2:G147',
        'The author left this to the editor (2026-10-25). 3.2:G147 says "de + the name means from the place", and a noun phrase takes de, not a prepositional phrase, after it (2.5:G98): "a song from America" is li lira de Amerika. Peta da Amerika had neither a verb nor a place for its da phrase. For a person, Peta ka da Amerika (Peta is from America) also reads clean.',
        { field: `example:${String(i)}` },
      ),
    ],
  };
}

export const makeChangesets3_4 = (): LexiconChangeset[] => [
  makeAdditionsChangeset(CONFIG_3_4),
  decisions3_4(),
];

function main(): void {
  const { booleans } = parseArgs(process.argv.slice(2), []);
  const all = makeChangesets3_4();
  for (const cs of all) {
    const tally = new Map<string, number>();
    for (const o of cs.ops) tally.set(o.op, (tally.get(o.op) ?? 0) + 1);
    console.log(
      `${cs.id}: ${String(cs.ops.length)} ops ${JSON.stringify(Object.fromEntries(tally))}`,
    );
  }
  if (booleans.has('check')) return;
  all.forEach((cs, i) => {
    writeFileSync(resolve(FILES_3_4[i] ?? ''), `${JSON.stringify(cs, null, 1)}\n`, 'utf8');
    console.log(`wrote ${FILES_3_4[i] ?? ''}`);
  });
}

if (process.argv[1]?.endsWith('make_changeset_3_4.ts')) main();
