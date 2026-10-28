/**
 * One-time tool: the changeset `npm run integrate:4.2` applies to frozen 4.1
 * (ADR-0032).
 *
 *   npx tsx scripts/make_changeset_4_2.ts           # write it
 *   npx tsx scripts/make_changeset_4_2.ts --check   # build, write nothing
 *
 * Liraasa 4.2 is the exact words whose meaning shifted in the 2100 Dreams draft, named by the
 * scorer's notes (the author, 2026-10-27: "Do everything you can to get the meaning to 85%"). The
 * patch, data/proposals/liraasa_4_2_patch.json, is written by translation/tools/vocab_4_2.py:
 * compounds of existing headwords (no new roots) and English aliases for existing words. It
 * builds through the same additions builder as 3.x, 4.0 and 4.1.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LexiconChangeset } from '../src/core/change/apply';
import { parseArgs } from './args';
import { type AdditionsConfig, makeAdditionsChangeset } from './make_changeset_3_0';
import { WORD_BUILDING_4_1 } from './make_changeset_4_1';

export const ID_4_2 = '2026-10-27-lexicon-4-2';
export const FILES_4_2 = [`data/changes/${ID_4_2}.json`] as const;
const BASELINE = 'data/lexicon/liraasa_4_1.json';

/** 4.2 builds words as 4.1 does. */
export const WORD_BUILDING_4_2 = WORD_BUILDING_4_1;
const AT = '2026-10-27T23:00:00Z';
const EDITION = '4.2';

export const CONFIG_4_2: AdditionsConfig = {
  patch: 'data/proposals/liraasa_4_2_patch.json',
  baseline: BASELINE,
  edition: EDITION,
  previous: '4.1',
  at: AT,
  id: ID_4_2,
  name: 'Liraasa 4.2 (the exact words whose meaning shifted in the 2100 Dreams draft)',
  wordBuilding: WORD_BUILDING_4_2,
  summary: (patch) =>
    `Liraasa 4.2, "the exact words whose meaning shifted in the 2100 Dreams draft" (ADR-0032), made by the editor at the author's request. PROPOSED: ${patch.status}. ` +
    `Additions only, no new roots: ${String(patch.compounds_add.length)} compounds of existing headwords and ${String((patch.english_aliases_add ?? []).length)} English aliases. No 4.1 word, spelling or ruling changes.`,
};

export function makeChangesets4_2(): LexiconChangeset[] {
  return [makeAdditionsChangeset(CONFIG_4_2)];
}

function main(): void {
  const { booleans } = parseArgs(process.argv.slice(2), []);
  const all = makeChangesets4_2();
  for (const cs of all) {
    const tally = new Map<string, number>();
    for (const o of cs.ops) tally.set(o.op, (tally.get(o.op) ?? 0) + 1);
    console.log(
      `${cs.id}: ${String(cs.ops.length)} ops ${JSON.stringify(Object.fromEntries(tally))}`,
    );
  }
  if (booleans.has('check')) return;
  all.forEach((cs, i) => {
    writeFileSync(resolve(FILES_4_2[i] ?? ''), `${JSON.stringify(cs, null, 1)}\n`, 'utf8');
    console.log(`wrote ${FILES_4_2[i] ?? ''}`);
  });
}

if (process.argv[1]?.endsWith('make_changeset_4_2.ts')) main();
