/**
 * One-time tool: turn the author's Liraasa 3.1 patch, "Everyday and Fiction"
 * (archive/patch_3_1/liraasa_3_1_patch.json, with its README
 * README_3_1_CLAUDE_CODE.md and the review Liraasa_3_1_Review_and_Patch.md),
 * into the changeset `npm run integrate:3.1` applies (ADR-0022).
 *
 *   npx tsx scripts/make_changeset_3_1.ts           # write the changeset
 *   npx tsx scripts/make_changeset_3_1.ts --check   # build, write nothing
 *
 * A lexical patch on 3.0: 5 roots, 69 compounds, 4 listed derivations, 6
 * lexicalised diminutives and 4 restored forms, no grammar. Each entry keeps
 * the patch's tier in its note (1: ratify first; 2: item by item), and every
 * one is proposed. The six recipes the patch adds are already sayable: they
 * go into the guide's recipes (scripts/grammar_guide/chapters.ts), not the
 * lexicon. The generator is 3.0's (makeAdditionsChangeset), with the same
 * checks: every listed form is the one the rules build, glossed as listed,
 * and the counts are the patch's.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LexiconChangeset } from '../src/core/change/apply';
import { parseArgs } from './args';
import { type AdditionsConfig, makeAdditionsChangeset } from './make_changeset_3_0';

export const ID_3_1 = '2026-10-25-lexicon-3-1';
export const FILE_3_1 = `data/changes/${ID_3_1}.json`;

export const CONFIG_3_1: AdditionsConfig = {
  patch: 'archive/patch_3_1/liraasa_3_1_patch.json',
  baseline: 'data/lexicon/liraasa_3_0.json',
  edition: '3.1',
  previous: '3.0',
  at: '2026-10-25T16:00:00Z',
  id: ID_3_1,
  name: 'Liraasa 3.1 patch (Everyday and Fiction)',
  summary: (patch) =>
    `Liraasa 3.1, "Everyday and Fiction" (ADR-0022), from the author's 3.1 patch. PROPOSED: ${patch.status}. ` +
    `Lexical only, no grammar: ${String(patch.roots_add.length)} roots and ${String(patch.compounds_add.length)} compounds, ` +
    `${String(patch.listed_derivations_add.length)} listed derivations, ${String(patch.lexicalised_diminutives_add.length)} lexicalised diminutives ` +
    `and ${String(patch.restored_forms_add.length)} restored forms, each noted with its tier. No 3.0 word, spelling or ruling changes.`,
};

export const makeChangeset3_1 = (): LexiconChangeset => makeAdditionsChangeset(CONFIG_3_1);

function main(): void {
  const { booleans } = parseArgs(process.argv.slice(2), []);
  const cs = makeChangeset3_1();
  const tally = new Map<string, number>();
  for (const o of cs.ops) tally.set(o.op, (tally.get(o.op) ?? 0) + 1);
  console.log(
    `${cs.id}: ${String(cs.ops.length)} ops ${JSON.stringify(Object.fromEntries(tally))}`,
  );
  if (booleans.has('check')) return;
  writeFileSync(resolve(FILE_3_1), `${JSON.stringify(cs, null, 1)}\n`, 'utf8');
  console.log(`wrote ${FILE_3_1}`);
}

if (process.argv[1]?.endsWith('make_changeset_3_1.ts')) main();
