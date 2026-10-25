/**
 * One-time tool: the two changesets `npm run integrate:3.3` applies to frozen
 * 3.1 (ADR-0023), in order:
 *
 *   1. 2026-10-25-lexicon-3-3-ratify-3-1  the author ratifies all of 3.1
 *   2. 2026-10-25-lexicon-3-3             "Archetypes and the top 2,000"
 *
 *   npx tsx scripts/make_changeset_3_3.ts           # write both
 *   npx tsx scripts/make_changeset_3_3.ts --check   # build, write nothing
 *
 * The ratification is the author's decision of 2026-10-25 ("ratify all of
 * 3.1"): each 3.1 headword's note stops saying it is proposed (op
 * edit_metadata, field notes), and nothing else about it changes.
 *
 * The 3.3 patch is the author's combined 3.2 + 3.3 patch (archived whole in
 * archive/patch_3_3/, with its checksums): rulings 3.2:G142-G147 and
 * 3.3:G148, the function word eho, 9 roots, 163 compounds, 43 derivations, 21
 * diminutives, 2 restored forms and 74 English aliases, built by 3.0's
 * makeAdditionsChangeset with the same checks. 3.2:G142 lets a time noun be a
 * compound's modifier (deyanole, date), so the build runs with that rule on.
 * Its recipes go into the guide (scripts/grammar_guide/chapters.ts).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LexiconChangeset, WordBuilding } from '../src/core/change/apply';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { WORD_BUILDING_2_0 } from './integrate_2_0';
import { type AdditionsConfig, makeAdditionsChangeset, recorder } from './make_changeset_3_0';

export const ID_RATIFY = '2026-10-25-lexicon-3-3-ratify-3-1';
export const ID_3_3 = '2026-10-25-lexicon-3-3';
export const FILES_3_3 = [`data/changes/${ID_RATIFY}.json`, `data/changes/${ID_3_3}.json`] as const;
const BASELINE = 'data/lexicon/liraasa_3_1.json';
const AT = '2026-10-25T18:00:00Z';
const EDITION = '3.3';

/** The word-building rulings in force from 3.3: 2.0's, and a time noun as a modifier (3.2:G142). */
export const WORD_BUILDING_3_3: WordBuilding = { ...WORD_BUILDING_2_0, timeModifiers: true };

const PROPOSED_3_1 = "Proposed in 3.1: awaiting the author's ratification.";
const RATIFIED_3_1 = 'Ratified by the author on 2026-10-25 (changeset ' + ID_RATIFY + ').';

/** The author ratifies all of 3.1: each 3.1 headword's note says so. */
export function ratify3_1(): LexiconChangeset {
  const lex = JSON.parse(readFileSync(resolve(BASELINE), 'utf8')) as RawLexicon;
  const rec = recorder({ edition: EDITION, at: AT });
  const heads = lex.headwords as unknown as {
    id: string;
    root: string;
    since: string;
    notes: string;
  }[];
  const ops = heads
    .filter((h) => h.since === '3.1')
    .map((h) => {
      if (!h.notes.includes(PROPOSED_3_1))
        throw new Error(`${h.root}: its note does not say it is proposed`);
      return rec(
        'edit_metadata',
        h.id,
        h.notes,
        h.notes.replace(PROPOSED_3_1, RATIFIED_3_1),
        undefined,
        `The author ratified all of 3.1 on 2026-10-25 (review/questions_3_1.md): ${h.root} is canon.`,
        { field: 'notes' },
      );
    });
  if (ops.length !== 74) throw new Error(`3.1 has 74 headwords; found ${String(ops.length)}`);
  return {
    id: ID_RATIFY,
    edition: EDITION,
    created: AT,
    author: 'nicolas',
    summary:
      'The author ratifies all of Liraasa 3.1, "Everyday and Fiction", tiers 1 and 2 (2026-10-25): each 3.1 headword\'s note says it is ratified. Its derivations, diminutives and restored forms carry no note and stand as built.',
    ops,
  };
}

export const CONFIG_3_3: AdditionsConfig = {
  patch: 'archive/patch_3_3/patches/liraasa_3_3_patch.json',
  baseline: BASELINE,
  edition: EDITION,
  previous: '3.1',
  at: AT,
  id: ID_3_3,
  name: 'Liraasa 3.3 patch (Archetypes and the top 2,000)',
  functionWordClass: { eho: null },
  wordBuilding: WORD_BUILDING_3_3,
  summary: (patch) =>
    `Liraasa 3.3, "Archetypes and the top 2,000" (ADR-0023), the author's combined 3.2 + 3.3 patch. PROPOSED: ${patch.status}. ` +
    `Additions only: rulings 3.2:G142-G147 and 3.3:G148; the function word eho; ${String(patch.roots_add.length)} roots and ${String(patch.compounds_add.length)} compounds; ` +
    `${String(patch.listed_derivations_add.length)} listed derivations, ${String(patch.lexicalised_diminutives_add.length)} lexicalised diminutives, ` +
    `${String(patch.restored_forms_add.length)} restored forms and ${String((patch.english_aliases_add ?? []).length)} English aliases, each entry noted with its tier. ` +
    'No 3.1 word, spelling or ruling changes.',
};

export const makeChangesets3_3 = (): LexiconChangeset[] => [
  ratify3_1(),
  makeAdditionsChangeset(CONFIG_3_3),
];

function main(): void {
  const { booleans } = parseArgs(process.argv.slice(2), []);
  const all = makeChangesets3_3();
  for (const cs of all) {
    const tally = new Map<string, number>();
    for (const o of cs.ops) tally.set(o.op, (tally.get(o.op) ?? 0) + 1);
    console.log(
      `${cs.id}: ${String(cs.ops.length)} ops ${JSON.stringify(Object.fromEntries(tally))}`,
    );
  }
  if (booleans.has('check')) return;
  all.forEach((cs, i) => {
    writeFileSync(resolve(FILES_3_3[i] ?? ''), `${JSON.stringify(cs, null, 1)}\n`, 'utf8');
    console.log(`wrote ${FILES_3_3[i] ?? ''}`);
  });
}

if (process.argv[1]?.endsWith('make_changeset_3_3.ts')) main();
