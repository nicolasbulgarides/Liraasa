/**
 * CLI: build the complete lexicon for the grammar-guide handoff.
 *
 *   npm run build:handoff
 *
 * Writes handoff/liraasa_2_0_complete.json: the canonical 2.0 lexicon (built
 * from 1.2 by `npm run integrate:2.0`, ADR-0016), with what a guide needs that
 * the lexicon records elsewhere:
 *
 * - each example a changeset revised keeps its earlier text beside it: the
 *   1.2 grammar revisions as `liraasa_1_1`, the 2.0 canon fixes as
 *   `liraasa_1_2` (with `revised_in` and `revision_reason`);
 * - the changesets themselves, as `changesets_1_2_full` and
 *   `changesets_2_0_full`, with each build's counts, so the guide's changelog
 *   is generated from the record rather than written beside it.
 *
 * The canonical files are only read.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LexiconChangeset } from '../src/core/change/apply';
import { CHANGESETS_1_2 } from './changesets_1_2';
import { CHANGESETS_2_0 } from './changesets_2_0';

const LEXICON = 'data/lexicon/liraasa_2_0.json';
const REPORT_1_2 = 'data/lexicon/integration_report_1_2.json';
const REPORT_2_0 = 'data/lexicon/integration_report_2_0.json';
const OUT_DIR = 'handoff';
const OUT = 'liraasa_2_0_complete.json';

const load = (path: string): unknown => JSON.parse(readFileSync(resolve(path), 'utf8'));

function main(): void {
  const lexicon = load(LEXICON) as Record<string, unknown> & {
    examples: Record<string, unknown>[];
    headwords: unknown[];
  };
  const v12 = CHANGESETS_1_2.map((p) => load(p) as LexiconChangeset);
  const v20 = CHANGESETS_2_0.map((p) => load(p) as LexiconChangeset);
  const report12 = load(REPORT_1_2) as { counts: unknown };
  const report20 = load(REPORT_2_0) as { counts: unknown };

  const examples = lexicon.examples.map((e) => ({ ...e }));
  let revised = 0;
  // the edition each revision belongs to, and the key its earlier text is kept under
  for (const [sets, keep] of [
    [v12, 'liraasa_1_1'],
    [v20, 'liraasa_1_2'],
  ] as const) {
    for (const cs of sets) {
      for (const op of cs.ops) {
        if (op.op !== 'edit_example' || op.field === 'english') continue;
        const index = Number(op.entry.replace('example:', ''));
        const example = examples[index];
        if (example?.liraasa !== op.to) {
          throw new Error(
            `${op.entry}: expected "${String(op.to)}" in the ${String(lexicon.version)} lexicon`,
          );
        }
        examples[index] = {
          ...example,
          [keep]: op.from,
          revised_in: op.addedIn,
          revision_reason: op.reason,
        };
        revised += 1;
      }
    }
  }

  const complete = {
    ...lexicon,
    handoff_note:
      'Liraasa 2.0: all of 1.0, the 1.1 vocabulary supplement, the 1.2 changesets ' +
      `${v12.map((c) => c.id).join(' and ')}, and the 2.0 changeset ${v20.map((c) => c.id).join(' and ')} ` +
      '(word-building rulings 2.0:G37–G42, new vocabulary, the image-compound pattern). Revised examples keep ' +
      'their earlier text in liraasa_1_1 (1.2) or liraasa_1_2 (2.0). Ruling ids are edition-qualified: ' +
      '0.8:R1, 1.0:G7, 1.2:G24, 2.0:G40. Built by scripts/build_handoff.ts from data/lexicon/liraasa_2_0.json.',
    examples,
    counts_1_1_to_1_2: report12.counts,
    changesets_1_2_full: v12,
    counts_1_2_to_2_0: report20.counts,
    changesets_2_0_full: v20,
  };

  mkdirSync(resolve(OUT_DIR), { recursive: true });
  writeFileSync(resolve(OUT_DIR, OUT), JSON.stringify(complete, null, 1), 'utf8');
  console.log(`wrote ${OUT_DIR}/${OUT}`);
  console.log(`  ${String(lexicon.headwords.length)} headwords`);
  console.log(`  ${String(examples.length)} examples, ${String(revised)} revised`);
}

main();
