/**
 * One-time tool: the changeset `npm run integrate:4.1` applies to frozen 4.0
 * (ADR-0031).
 *
 *   npx tsx scripts/make_changeset_4_1.ts           # write it
 *   npx tsx scripts/make_changeset_4_1.ts --check   # build, write nothing
 *
 * Liraasa 4.1 is the vocabulary the 2100 Dreams draft still had to paraphrase (the author,
 * 2026-10-27: "Do everything you can to get the meaning to 85%"). The patch,
 * data/proposals/liraasa_4_1_patch.json, is written by translation/tools/vocab_4_1.py: compounds
 * of existing headwords for the gaps (no new roots) and English aliases for the existing words
 * that already covered others. It builds through the same additions builder as 3.x and 4.0.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LexiconChangeset } from '../src/core/change/apply';
import { parseArgs } from './args';
import { type AdditionsConfig, makeAdditionsChangeset } from './make_changeset_3_0';
import { WORD_BUILDING_4_0 } from './make_changeset_4_0';

export const ID_4_1 = '2026-10-27-lexicon-4-1';
export const FILES_4_1 = [`data/changes/${ID_4_1}.json`] as const;
const BASELINE = 'data/lexicon/liraasa_4_0.json';

/** 4.1 builds words as 4.0 does. */
export const WORD_BUILDING_4_1 = WORD_BUILDING_4_0;
const AT = '2026-10-27T18:00:00Z';
const EDITION = '4.1';

export const CONFIG_4_1: AdditionsConfig = {
  patch: 'data/proposals/liraasa_4_1_patch.json',
  baseline: BASELINE,
  edition: EDITION,
  previous: '4.0',
  at: AT,
  id: ID_4_1,
  name: 'Liraasa 4.1 (the vocabulary the 2100 Dreams draft still paraphrased)',
  wordBuilding: WORD_BUILDING_4_1,
  summary: (patch) =>
    `Liraasa 4.1, "the vocabulary the 2100 Dreams draft still paraphrased" (ADR-0031), made by the editor at the author's request. PROPOSED: ${patch.status}. ` +
    `Additions only, no new roots: ${String(patch.compounds_add.length)} compounds of existing headwords and ${String((patch.english_aliases_add ?? []).length)} English aliases. No 4.0 word, spelling or ruling changes.`,
};

export function makeChangesets4_1(): LexiconChangeset[] {
  return [makeAdditionsChangeset(CONFIG_4_1)];
}

function main(): void {
  const { booleans } = parseArgs(process.argv.slice(2), []);
  const all = makeChangesets4_1();
  for (const cs of all) {
    const tally = new Map<string, number>();
    for (const o of cs.ops) tally.set(o.op, (tally.get(o.op) ?? 0) + 1);
    console.log(
      `${cs.id}: ${String(cs.ops.length)} ops ${JSON.stringify(Object.fromEntries(tally))}`,
    );
  }
  if (booleans.has('check')) return;
  all.forEach((cs, i) => {
    writeFileSync(resolve(FILES_4_1[i] ?? ''), `${JSON.stringify(cs, null, 1)}\n`, 'utf8');
    console.log(`wrote ${FILES_4_1[i] ?? ''}`);
  });
}

if (process.argv[1]?.endsWith('make_changeset_4_1.ts')) main();
