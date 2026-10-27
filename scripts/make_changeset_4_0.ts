/**
 * One-time tool: the changeset `npm run integrate:4.0` applies to frozen 3.6
 * (ADR-0029).
 *
 *   npx tsx scripts/make_changeset_4_0.ts           # write it
 *   npx tsx scripts/make_changeset_4_0.ts --check   # build, write nothing
 *
 * Liraasa 4.0 is what translating 2100 Dreams needed (the author, 2026-10-26: "document all
 * changes you make as a 4.0 patch so that Liraasa 4.0 is defined by what was necessary").
 * The patch, data/proposals/liraasa_4_0_patch.json, is written by
 * translation/tools/make_patch_4_0.py from the draft: the compounds its coinage registry used
 * (no new roots), English aliases its lookup missed, and rulings 4.0:G156-G161 from the grammar
 * defaults it relied on. It builds through the same additions builder as the 3.x patches.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LexiconChangeset } from '../src/core/change/apply';
import { parseArgs } from './args';
import { type AdditionsConfig, makeAdditionsChangeset } from './make_changeset_3_0';
import { WORD_BUILDING_3_6 } from './make_changeset_3_6';

export const ID_4_0 = '2026-10-26-lexicon-4-0';
export const FILES_4_0 = [`data/changes/${ID_4_0}.json`] as const;
const BASELINE = 'data/lexicon/liraasa_3_6.json';

/** 4.0 builds words as 3.6 does: nesting, colour bases and time nouns. */
export const WORD_BUILDING_4_0 = WORD_BUILDING_3_6;
const AT = '2026-10-26T23:00:00Z';
const EDITION = '4.0';

export const CONFIG_4_0: AdditionsConfig = {
  patch: 'data/proposals/liraasa_4_0_patch.json',
  baseline: BASELINE,
  edition: EDITION,
  previous: '3.6',
  at: AT,
  id: ID_4_0,
  name: 'Liraasa 4.0 (what translating 2100 Dreams needed)',
  wordBuilding: WORD_BUILDING_4_0,
  summary: (patch) =>
    `Liraasa 4.0, "what translating 2100 Dreams needed" (ADR-0029), made by the editor at the author's request from the draft translation. PROPOSED: ${patch.status}. ` +
    `Additions only, no new roots: rulings 4.0:G156-G161 (speech before its verb of saying, adjective order, durations, comparing actions, destiny, decimals); ` +
    `${String(patch.compounds_add.length)} compounds the draft used and ${String((patch.english_aliases_add ?? []).length)} English aliases. No 3.6 word, spelling or ruling changes.`,
};

export function makeChangesets4_0(): LexiconChangeset[] {
  return [makeAdditionsChangeset(CONFIG_4_0)];
}

function main(): void {
  const { booleans } = parseArgs(process.argv.slice(2), []);
  const all = makeChangesets4_0();
  for (const cs of all) {
    const tally = new Map<string, number>();
    for (const o of cs.ops) tally.set(o.op, (tally.get(o.op) ?? 0) + 1);
    console.log(
      `${cs.id}: ${String(cs.ops.length)} ops ${JSON.stringify(Object.fromEntries(tally))}`,
    );
  }
  if (booleans.has('check')) return;
  all.forEach((cs, i) => {
    writeFileSync(
      resolve(FILES_4_0[i] ?? ''),
      `${JSON.stringify(cs, null, 1)}
`,
      'utf8',
    );
    console.log(`wrote ${FILES_4_0[i] ?? ''}`);
  });
}

if (process.argv[1]?.endsWith('make_changeset_4_0.ts')) main();
