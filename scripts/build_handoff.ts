/**
 * CLI: build the complete lexicon for the grammar-guide handoff.
 *
 *   npm run build:handoff
 *
 * Writes handoff/liraasa_1_2_complete.json: the canonical 1.2 lexicon (built
 * from 1.1 by `npm run integrate:1.2`, ADR-0013), with two things a guide
 * needs that the lexicon records elsewhere:
 *
 * - each example the 1.2 grammar changeset revised keeps its 1.1 text beside
 *   it (`liraasa_1_1`, `revised_in`, `revision_reason`);
 * - the 1.2 changesets themselves, as `changesets_1_2_full`, so the guide's
 *   changelog is generated from the record rather than written beside it.
 *
 * The canonical files are only read.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LexiconChangeset } from '../src/core/change/apply';
import { CHANGESETS_1_2 } from './changesets_1_2';

const LEXICON = 'data/lexicon/liraasa_1_2.json';
const REPORT = 'data/lexicon/integration_report_1_2.json';
const OUT_DIR = 'handoff';
const OUT = 'liraasa_1_2_complete.json';

function main(): void {
  const lexicon = JSON.parse(readFileSync(resolve(LEXICON), 'utf8')) as Record<string, unknown> & {
    examples: Record<string, unknown>[];
    headwords: unknown[];
  };
  const changesets = CHANGESETS_1_2.map(
    (p) => JSON.parse(readFileSync(resolve(p), 'utf8')) as LexiconChangeset,
  );
  const report = JSON.parse(readFileSync(resolve(REPORT), 'utf8')) as { counts: unknown };

  const examples = lexicon.examples.map((e) => ({ ...e }));
  let revised = 0;
  for (const cs of changesets) {
    for (const op of cs.ops) {
      if (op.op !== 'edit_example') continue;
      const index = Number(op.entry.replace('example:', ''));
      const example = examples[index];
      if (example?.liraasa !== op.to) {
        throw new Error(`${op.entry}: expected "${String(op.to)}" in the 1.2 lexicon`);
      }
      examples[index] = {
        ...example,
        liraasa_1_1: op.from,
        revised_in: op.addedIn,
        revision_reason: op.reason,
      };
      revised += 1;
    }
  }

  const complete = {
    ...lexicon,
    handoff_note:
      'Liraasa 1.2: all of 1.0, the 1.1 vocabulary supplement, and the 1.2 changesets ' +
      `${changesets.map((c) => c.id).join(' and ')} (rulings_1_2, new vocabulary, reglosses). ` +
      'Revised examples keep their 1.1 text in liraasa_1_1. Ruling ids are edition-qualified: ' +
      '0.8:R1, 1.0:G7, 1.2:G24. Built by scripts/build_handoff.ts from data/lexicon/liraasa_1_2.json.',
    examples,
    counts_1_1_to_1_2: report.counts,
    changesets_1_2_full: changesets,
  };

  mkdirSync(resolve(OUT_DIR), { recursive: true });
  writeFileSync(resolve(OUT_DIR, OUT), JSON.stringify(complete, null, 1), 'utf8');
  console.log(`wrote ${OUT_DIR}/${OUT}`);
  console.log(`  ${String(lexicon.headwords.length)} headwords`);
  console.log(`  ${String(examples.length)} examples, ${String(revised)} revised`);
}

main();
