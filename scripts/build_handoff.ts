/**
 * CLI: build the complete lexicon for the grammar-guide handoff.
 *
 *   npm run build:handoff
 *
 * Writes handoff/liraasa_3_6_complete.json: the canonical 3.6 lexicon (built
 * from 3.5 by `npm run integrate:3.6`, ADR-0027; everything up to 3.5 ratified, 3.6 proposed), with what a guide needs that
 * the lexicon records elsewhere:
 *
 * - each example a changeset revised keeps its earlier text beside it: the
 *   1.2 grammar revisions as `liraasa_1_1`, the 2.0 canon fixes as
 *   `liraasa_1_2`, the 2.1 question rewrites (2.1:G46) as `liraasa_2_0`
 *   (with `revised_in` and `revision_reason`);
 * - the changesets themselves, as `changesets_1_2_full`, `changesets_2_0_full`
 *   `changesets_2_1_full`, `changesets_2_2_full`, `changesets_2_3_full` and `changesets_2_5_full`, with each build's counts, so the guide's
 *   changelog is generated from the record rather than written beside it.
 *
 * The canonical files are only read.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LexiconChangeset } from '../src/core/change/apply';
import { CHANGESETS_1_2 } from './changesets_1_2';
import { CHANGESETS_2_0 } from './changesets_2_0';
import { CHANGESETS_2_1 } from './changesets_2_1';
import { CHANGESETS_2_2 } from './changesets_2_2';
import { CHANGESETS_2_3 } from './changesets_2_3';
import { CHANGESETS_2_5 } from './changesets_2_5';
import { CHANGESETS_3_0 } from './changesets_3_0';
import { CHANGESETS_3_1 } from './changesets_3_1';
import { CHANGESETS_3_3 } from './changesets_3_3';
import { CHANGESETS_3_4 } from './changesets_3_4';
import { CHANGESETS_3_5 } from './changesets_3_5';
import { CHANGESETS_3_6 } from './changesets_3_6';

const LEXICON = 'data/lexicon/liraasa_3_6.json';
const REPORT_1_2 = 'data/lexicon/integration_report_1_2.json';
const REPORT_2_0 = 'data/lexicon/integration_report_2_0.json';
const REPORT_2_1 = 'data/lexicon/integration_report_2_1.json';
const REPORT_2_2 = 'data/lexicon/integration_report_2_2.json';
const REPORT_2_3 = 'data/lexicon/integration_report_2_3.json';
const REPORT_2_5 = 'data/lexicon/integration_report_2_5.json';
const REPORT_3_0 = 'data/lexicon/integration_report_3_0.json';
const REPORT_3_1 = 'data/lexicon/integration_report_3_1.json';
const REPORT_3_3 = 'data/lexicon/integration_report_3_3.json';
const REPORT_3_4 = 'data/lexicon/integration_report_3_4.json';
const REPORT_3_5 = 'data/lexicon/integration_report_3_5.json';
const OUT_DIR = 'handoff';
const OUT = 'liraasa_3_6_complete.json';

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
  const v21 = CHANGESETS_2_1.map((p) => load(p) as LexiconChangeset);
  const report21 = load(REPORT_2_1) as { counts: unknown };
  const v22 = CHANGESETS_2_2.map((p) => load(p) as LexiconChangeset);
  const report22 = load(REPORT_2_2) as { counts: unknown };
  const v23 = CHANGESETS_2_3.map((p) => load(p) as LexiconChangeset);
  const report23 = load(REPORT_2_3) as { counts: unknown };
  const v25 = CHANGESETS_2_5.map((p) => load(p) as LexiconChangeset);
  const report25 = load(REPORT_2_5) as { counts: unknown };
  const v30 = CHANGESETS_3_0.map((p) => load(p) as LexiconChangeset);
  const report30 = load(REPORT_3_0) as { counts: unknown };
  const v31 = CHANGESETS_3_1.map((p) => load(p) as LexiconChangeset);
  const report31 = load(REPORT_3_1) as { counts: unknown };
  const v33 = CHANGESETS_3_3.map((p) => load(p) as LexiconChangeset);
  const report33 = load(REPORT_3_3) as { counts: unknown };
  const v34 = CHANGESETS_3_4.map((p) => load(p) as LexiconChangeset);
  const report34 = load(REPORT_3_4) as { counts: unknown };
  const v35 = CHANGESETS_3_5.map((p) => load(p) as LexiconChangeset);
  const v36 = CHANGESETS_3_6.map((p) => load(p) as LexiconChangeset);
  const report35 = load(REPORT_3_5) as { counts: unknown };

  const examples = lexicon.examples.map((e) => ({ ...e }));
  let revised = 0;
  // the edition each revision belongs to, and the key its earlier text is kept under
  for (const [sets, keep] of [
    [v12, 'liraasa_1_1'],
    [v20, 'liraasa_1_2'],
    [v21, 'liraasa_2_0'],
    [v22, 'liraasa_2_1'],
    [v23, 'liraasa_2_2'],
    [v25, 'liraasa_2_3'],
  ] as const) {
    for (const cs of sets) {
      for (const op of cs.ops) {
        if (op.op !== 'edit_example' || op.field === 'english') continue;
        const index = Number(op.entry.replace('example:', ''));
        const example = examples[index];
        // a later edition may have respelled the sentence since (2.1:G58)
        if (
          example === undefined ||
          ((sets === v23 || sets === v25) && example.liraasa !== op.to)
        ) {
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
      'Liraasa 3.6 (everything up to 3.5 ratified, 3.6 proposed): all of 1.0, the 1.1 vocabulary supplement, the 1.2 changesets ' +
      `${v12.map((c) => c.id).join(' and ')}, the 2.0 changesets ${v20.map((c) => c.id).join(' and ')} ` +
      '(word-building rulings 2.0:G37–G45, new vocabulary, the image-compound pattern), and the 2.1 changeset ' +
      `${v21.map((c) => c.id).join(' and ')} (rulings 2.1:G46–G59, 30 roots respelled), and the 2.2 changeset ` +
      `${v22.map((c) => c.id).join(' and ')} (rulings 2.2:G60–G68, silro restored, the album), and the 2.3 changeset ` +
      `${v23.map((c) => c.id).join(' and ')} (rulings 2.3:G69–G86, the sound pass and the grammar audit), and the 2.5 changesets ` +
      `${v25.map((c) => c.id).join(', ')} (rulings 2.5:G87–G128, the author's decisions on the 2.3 audit; the album is no longer canon), and the 3.0 changeset ` +
      `${v30.map((c) => c.id).join(', ')} (rulings 3.0:G129–G141, Devotion, Music and Measure), and the 3.1 changeset ` +
      `${v31.map((c) => c.id).join(', ')} (Everyday and Fiction, vocabulary only, ratified 2026-10-25), and the 3.3 changesets ` +
      `${v33.map((c) => c.id).join(', ')} (the ratification of 3.1, then Archetypes and the top 2,000: rulings 3.2:G142–G147 and 3.3:G148), and the 3.4 changesets ` +
      `${v34.map((c) => c.id).join(', ')} (Abstraction and the human condition, ruling 3.4:G149, and the editor's decisions on four 3.3 sentences), and the 3.5 changesets ` +
      `${v35.map((c) => c.id).join(', ')} (the ratification of 3.0, 3.3 and 3.4, then Essentials, archetypes and domain packs, rulings 3.5:G150–G151, then the author's ratification of 3.5 and ruling 3.5:G152), and the 3.6 changeset ` +
      `${v36.map((c) => c.id).join(', ')} (the 2100 Dreams patch: robots, the mind, the neocity, rulings 3.6:G153–G155); 3.6 is proposed, awaiting the author's ratification. Revised examples keep ` +
      'their earlier text in liraasa_1_1 (1.2), liraasa_1_2 (2.0), liraasa_2_0 (2.1), liraasa_2_1 (2.2), liraasa_2_2 (2.3) or liraasa_2_3 (2.5). Ruling ids are edition-qualified: ' +
      '0.8:R1, 1.0:G7, 1.2:G24, 2.0:G40, 2.1:G46, 2.2:G60, 2.3:G69, 2.5:G88, 3.0:G129, 3.2:G142, 3.3:G148, 3.4:G149, 3.5:G150, 3.6:G153. Built by scripts/build_handoff.ts from data/lexicon/liraasa_3_6.json.',
    examples,
    counts_1_1_to_1_2: report12.counts,
    changesets_1_2_full: v12,
    counts_1_2_to_2_0: report20.counts,
    changesets_2_0_full: v20,
    counts_2_0_to_2_1: report21.counts,
    changesets_2_1_full: v21,
    counts_2_1_to_2_2: report22.counts,
    changesets_2_2_full: v22,
    counts_2_2_to_2_3: report23.counts,
    changesets_2_3_full: v23,
    counts_2_3_to_2_5: report25.counts,
    changesets_2_5_full: v25,
    counts_2_5_to_3_0: report30.counts,
    changesets_3_0_full: v30,
    counts_3_0_to_3_1: report31.counts,
    changesets_3_1_full: v31,
    counts_3_1_to_3_3: report33.counts,
    changesets_3_3_full: v33,
    counts_3_3_to_3_4: report34.counts,
    changesets_3_4_full: v34,
    counts_3_4_to_3_5: report35.counts,
    changesets_3_5_full: v35,
    changesets_3_6_full: v36,
  };

  mkdirSync(resolve(OUT_DIR), { recursive: true });
  writeFileSync(resolve(OUT_DIR, OUT), JSON.stringify(complete, null, 1), 'utf8');
  console.log(`wrote ${OUT_DIR}/${OUT}`);
  console.log(`  ${String(lexicon.headwords.length)} headwords`);
  console.log(`  ${String(examples.length)} examples, ${String(revised)} revised`);
}

main();
