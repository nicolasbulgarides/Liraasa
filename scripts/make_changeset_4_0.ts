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
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LexiconChangeset } from '../src/core/change/apply';
import type { ChangeRecord } from '../src/core/change/changelog';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { type AdditionsConfig, makeAdditionsChangeset, recorder } from './make_changeset_3_0';
import { WORD_BUILDING_3_6 } from './make_changeset_3_6';

export const ID_4_0 = '2026-10-26-lexicon-4-0';
export const ID_RATIFY_4_0 = '2026-10-27-lexicon-4-0-ratify';
export const FILES_4_0 = [
  `data/changes/${ID_4_0}.json`,
  `data/changes/${ID_RATIFY_4_0}.json`,
] as const;
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

/**
 * The author ratifies 3.6 and 4.0 (2026-10-27: "Ratify 3.6 and 4.0"): every proposed ruling of
 * 3.6 and 4.0 is marked ratified (its text and examples unchanged), and every 3.6 and 4.0
 * headword's note says it is ratified. With this, every edition is canon.
 */
export function ratify4_0(additions: LexiconChangeset): LexiconChangeset {
  const lex = JSON.parse(readFileSync(BASELINE, 'utf8')) as RawLexicon & Record<string, unknown>;
  const rec = recorder({ edition: EDITION, at: '2026-10-27T12:00:00Z' });
  const why = 'The author ratified 3.6 and 4.0 on 2026-10-27.';
  const ops: ChangeRecord[] = [];
  const rulings: string[] = [
    ...((lex.rulings_3_6 ?? []) as { id: string; status?: string }[])
      .filter((r) => r.status === 'proposed')
      .map((r) => `3.6:${r.id}`),
    ...(additions.rulings ?? []).map((r) => `4.0:${r.id}`),
  ];
  for (const r of rulings)
    ops.push(
      rec(
        'ratify_ruling',
        r,
        'proposed',
        'ratified',
        r,
        `${why} The ruling's text and examples do not change.`,
      ),
    );
  const notes = (h: { id: string; root: string; notes: string }, edition: string): void => {
    const marker = `Proposed in ${edition}: awaiting the author's ratification.`;
    if (!h.notes.includes(marker)) return;
    ops.push(
      rec(
        'edit_metadata',
        h.id,
        h.notes,
        h.notes.replace(
          marker,
          `Ratified by the author on 2026-10-27 (changeset ${ID_RATIFY_4_0}).`,
        ),
        undefined,
        `${why} ${h.root} is canon.`,
        { field: 'notes' },
      ),
    );
  };
  for (const h of lex.headwords as unknown as { id: string; root: string; notes: string }[])
    notes(h, '3.6');
  for (const h of additions.headwords ?? []) notes(h, '4.0');
  return {
    id: ID_RATIFY_4_0,
    edition: EDITION,
    created: '2026-10-27T12:00:00Z',
    author: 'nicolas',
    summary:
      'The author ratifies Liraasa 3.6 and 4.0 (2026-10-27): every proposed ruling of 3.6 (G153-G155) and 4.0 (G156-G161) is marked ratified, its text unchanged, and every 3.6 and 4.0 headword note says it is ratified. Every edition is canon.',
    ops,
  };
}

export function makeChangesets4_0(): LexiconChangeset[] {
  const additions = makeAdditionsChangeset(CONFIG_4_0);
  return [additions, ratify4_0(additions)];
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
