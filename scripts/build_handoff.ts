/**
 * CLI: build the complete lexicon for the grammar-guide handoff.
 *
 *   npm run build:handoff
 *
 * Writes handoff/liraasa_1_1_complete.json: the 1.1 lexicon (every 1.0 entry,
 * every 1.1 addition, every section and ruling, untouched) plus the 1.2
 * grammar changeset applied on top — its rulings as `rulings_1_2`, its example
 * revisions in place with the 1.1 text kept beside them. The canonical files
 * are only read.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Changeset } from '../src/core/change/changelog';

const LEXICON = 'data/lexicon/liraasa_1_1.json';
const CHANGESET = 'data/changes/2026-10-17-grammar-rulings.json';
const OUT_DIR = 'handoff';
const OUT = 'liraasa_1_1_complete.json';

interface RulingsChangeset extends Changeset {
  rulings: Record<string, unknown>[];
}

function main(): void {
  const lexicon = JSON.parse(readFileSync(resolve(LEXICON), 'utf8')) as Record<string, unknown> & {
    examples: Record<string, unknown>[];
  };
  const changeset = JSON.parse(readFileSync(resolve(CHANGESET), 'utf8')) as RulingsChangeset;

  const examples = lexicon.examples.map((e) => ({ ...e }));
  for (const op of changeset.ops) {
    if (op.op !== 'edit_example') continue;
    const index = Number(op.entry.replace('example:', ''));
    const example = examples[index];
    if (example?.liraasa !== op.from) {
      throw new Error(`${op.entry}: expected "${String(op.from)}" in the 1.1 lexicon`);
    }
    examples[index] = {
      ...example,
      liraasa: op.to,
      liraasa_1_1: op.from,
      revised_in: op.addedIn,
      revision_reason: op.reason,
    };
  }

  const complete = {
    ...lexicon,
    handoff_note:
      'Liraasa 1.1 (all of 1.0 plus the 1.1 vocabulary supplement) with the 1.2 grammar changeset ' +
      `${changeset.id} applied: rulings_1_2 holds the new rulings, and revised examples keep their ` +
      '1.1 text in liraasa_1_1. Ruling ids are edition-qualified: 0.8:R1, 1.0:G7, 1.2:G24. ' +
      'Built by scripts/build_handoff.ts; the canonical files are data/lexicon/liraasa_1_1.json ' +
      `and ${CHANGESET}.`,
    examples,
    rulings_1_2: changeset.rulings,
    changeset_1_2: { id: changeset.id, summary: changeset.summary, ops: changeset.ops },
  };

  mkdirSync(resolve(OUT_DIR), { recursive: true });
  writeFileSync(resolve(OUT_DIR, OUT), JSON.stringify(complete, null, 1), 'utf8');
  console.log(`wrote ${OUT_DIR}/${OUT}`);
  console.log(`  ${String((lexicon.headwords as unknown[]).length)} headwords`);
  console.log(
    `  ${String(examples.length)} examples, ${String(changeset.ops.filter((o) => o.op === 'edit_example').length)} revised`,
  );
  console.log(`  ${String(changeset.rulings.length)} rulings added as rulings_1_2`);
}

main();
