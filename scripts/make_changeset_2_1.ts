/**
 * One-time tool: turn the author's Liraasa 2.1 patch
 * (data/proposals/liraasa_2_1_patch.json) into the 2.1 changeset that
 * `npm run integrate:2.1` applies (ADR-0017).
 *
 *   npx tsx scripts/make_changeset_2_1.ts            # write the changeset
 *   npx tsx scripts/make_changeset_2_1.ts --check    # build it, write nothing
 *
 * The patch respells 28 roots, replaces two by compounds, and adds rulings
 * 2.1:G46–G59. Every form, compound, image compound and derivation it lists is
 * what the respelling code (src/core/change/respell.ts) produces, not copied:
 * the generator applies its own changeset to frozen 2.0 and halts unless every
 * old → new pair the patch lists comes out exactly so. The ruling 2.1:G46
 * ("every direct question ends in ki", question words in place) is applied to
 * the lexicon's own fronted questions, each op naming the sentence it rewrites.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  applyChangesets,
  type ChangesetRuling,
  type LexiconChangeset,
} from '../src/core/change/apply';
import type { ChangeRecord } from '../src/core/change/changelog';
import type { IdMapFile } from '../src/core/model/ids';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { WORD_BUILDING_2_0, idsAfter } from './integrate_2_0';

const PATCH = 'data/proposals/liraasa_2_1_patch.json';
const BASELINE = 'data/lexicon/liraasa_2_0.json';
const OUT = 'data/changes/2026-10-18-lexicon-2-1.json';
const ID = '2026-10-18-lexicon-2-1';
const EDITION = '2.1';
const AT = '2026-10-18T20:00:00Z';
const AUTHOR = 'nicolas';

interface PatchForm {
  role: string;
  old: string;
  new: string;
}
interface Patch {
  summary: Record<string, unknown>;
  rule: string;
  roots: {
    old: string;
    new: string;
    meaning: string;
    becomes_compound: string | null;
    forms: PatchForm[];
  }[];
  compounds: { old: string; new: string; old_parts: string; forms: PatchForm[] }[];
  listed_derivations: { old: string; new: string; entry_2_0: string }[];
  image_engine: {
    modifiers_renamed: Record<string, string>;
    heads_renamed: Record<string, string>;
    attested_renamed: { old: string; new: string; gloss: string }[];
  };
  example_sentences_respelled: { old: string; new: string; english: string }[];
  rulings: { id: string; topic: string; rule: string }[];
  open_questions: string[];
  closed_open_questions: Record<string, string>;
}

/**
 * 2.1:G46 applied to the lexicon's own direct questions: the question word
 * stands where its answer would, and the question ends in ki. A ki-word of
 * time may stay first as a frame. Spelled as 2.1 spells them. The two
 * elliptical questions (examples 241 "Ata?" and 280 "… Ata taivo?") are left
 * for the author (review/2_1_integration.md).
 */
const QUESTIONS_FW: Record<string, string> = {
  fw_kicoda_0054: 'taivo vimova ki-coda ki?',
  fw_kipago_0055: 'taivo pagopa ki-pago ki?',
  fw_kikrono_0056: 'ki-krono maivo lirala ki?',
  fw_kikasa_0057: 'taivo somusia ki-kasa ki?',
  fw_kimodo_0059: 'taivo lirala ki-modo ki?',
  fw_kinelade_0060: 'ki-nela de lira ki?',
  fw_kimuya_0061: 'ki-muya lirari ki?',
  fw_kieli_0103: 'Taivo amora ki-eli lira ki?',
  fw_kinela_0104: 'Ki-nela lirala ki?',
};
const QUESTIONS_EX: Record<number, string> = {
  11: 'Taivo pagopa ki-pago ki?', // the patch's own example (2.1:G46)
  13: 'Taivo somusia ki-kasa ki?',
  73: 'Taivo amora ki-eli lira ki?',
  74: 'Taivo sarbisia ki-eli lira ki?',
  75: 'Ki-nela lirala ki?',
  76: 'Ki-nela melvama maivo ki?',
  312: 'Ki-nela po hifaha li bumre ki?',
  354: 'Li bumre ka bezinasan. Li bezi ka ki-pago ki?',
  363: 'Li cemopaturi ka ki-coda ki?',
  373: 'Li tisebiti ka ki-pago ki?',
};

/** Where the patch's own text names an earlier ruling, the ruling refines it. */
const REFINES: Record<string, string[]> = {
  G46: ['1.0:G22'],
  G50: ['0.8:R6'],
  G53: ['1.2:G27', '1.2:G32'],
  G56: ['1.2:G31'],
};

const load = (p: string): unknown => JSON.parse(readFileSync(resolve(p), 'utf8'));

interface Head {
  id: string;
  root: string;
  type: string;
  components: string[] | null;
}

function main(): void {
  const { booleans } = parseArgs(process.argv.slice(2), []);
  const patch = load(PATCH) as Patch;
  const baseline = load(BASELINE) as RawLexicon;
  const ids = idsAfter(baseline, load('data/lexicon/ids.json') as IdMapFile);
  const heads = baseline.headwords as unknown as Head[];
  const byRoot = new Map(heads.map((h) => [h.root, h]));

  const ops: ChangeRecord[] = [];
  const op = (o: Omit<ChangeRecord, 'addedIn' | 'at' | 'author'>): void => {
    ops.push({ ...o, addedIn: EDITION, at: AT, author: AUTHOR });
  };

  // 1. the rulings
  const rulings: ChangesetRuling[] = patch.rulings.map((r) => {
    const id = r.id.replace(/^2\.1:/, '');
    return { id, topic: r.topic, ruling: r.rule, refines: REFINES[id] ?? [], examples: [] };
  });
  for (const r of rulings) {
    op({
      entry: `2.1:${r.id}`,
      op: 'add_ruling',
      from: null,
      to: r.topic,
      ruling: `2.1:${r.id}`,
      reason: `Liraasa 2.1 patch, rulings: ${r.topic}.`,
    });
  }

  // 2. the respellings, in the patch's order (a later root may build on an earlier one)
  const bank = baseline.reserved_root_bank as Record<string, unknown> | undefined;
  const banked = new Set(
    Object.values(bank ?? {}).flatMap((g) =>
      typeof g === 'object' && g !== null && Array.isArray((g as { roots?: unknown }).roots)
        ? (g as { roots: string[] }).roots
        : [],
    ),
  );
  for (const r of patch.roots) {
    const h = byRoot.get(r.old);
    if (h === undefined || h.type !== 'Primal') throw new Error(`${r.old}: not a 2.0 primal root`);
    if (r.becomes_compound === null) {
      op({
        entry: h.id,
        op: 'respell_root',
        slot: 'root',
        from: r.old,
        to: r.new,
        ruling: '2.1:G58',
        reason: `Liraasa 2.1 patch: ${r.old} ("${r.meaning}") is respelled ${r.new}; every meaning and empty slot is kept, and every form, compound, image compound and derivation follows (2.1:G58).`,
      });
      if (banked.has(r.new)) {
        op({
          entry: `bank:${r.new}`,
          op: 'spend_bank_root',
          from: r.new,
          to: h.id,
          ruling: '2.1:G58',
          reason: `${r.new} now spells ${r.old}'s meaning ("${r.meaning}"), so it leaves the bank of unassigned roots.`,
        });
      }
    } else {
      op({
        entry: h.id,
        op: 'respell_as_compound',
        slot: 'root',
        from: r.old,
        to: r.becomes_compound,
        ruling: '2.1:G59',
        reason: `Liraasa 2.1 patch: ${r.old} ("${r.meaning}") is replaced by the compound ${r.new} (${r.becomes_compound.replace('+', ' + ')}); the entry keeps its id and glosses (2.1:G59).`,
      });
    }
  }

  // 3. 2.1:G46 on the lexicon's own questions, against the respelled text
  const partial: LexiconChangeset = {
    id: ID,
    edition: EDITION,
    created: AT,
    author: AUTHOR,
    summary: '',
    rulings,
    ops: [...ops],
  };
  const mid = applyChangesets(baseline, [partial], {
    version: EDITION,
    builtUtc: AT,
    source: '',
    ids,
    wordBuilding: WORD_BUILDING_2_0,
  }).lexicon;
  const fws = mid.function_words as unknown as { id: string; example?: string }[];
  for (const [id, to] of Object.entries(QUESTIONS_FW)) {
    const from = fws.find((f) => f.id === id)?.example;
    if (from === undefined) throw new Error(`${id}: no example`);
    op({
      entry: id,
      op: 'edit_function_word',
      field: 'example',
      from,
      to,
      ruling: '2.1:G46',
      reason:
        'A question word stands where its answer would stand and every direct question ends in ki (2.1:G46), replacing the fronted example.',
    });
  }
  for (const [i, to] of Object.entries(QUESTIONS_EX)) {
    const from = mid.examples[Number(i)]?.liraasa;
    if (from === undefined) throw new Error(`example ${i}: missing`);
    op({
      entry: `example:${i}`,
      op: 'edit_example',
      from,
      to,
      ruling: '2.1:G46',
      reason:
        'A question word stands where its answer would stand and every direct question ends in ki (2.1:G46).',
    });
  }

  const roots = patch.roots.filter((r) => r.becomes_compound === null).length;
  const changeset: LexiconChangeset = {
    id: ID,
    edition: EDITION,
    created: AT,
    author: AUTHOR,
    summary:
      `Liraasa 2.1 (ADR-0017), from the author's patch "Liraasa 2.1": rulings 2.1:G46–G59 ` +
      `(questions in place, exclamatives, blessings, N times, different-subject complements, evidentials, ` +
      `relatives on a prepositional object, partitive de, result clauses, duration, prohibitions, sound follows meaning, respelling); ` +
      `${String(roots)} roots respelled and 2 replaced by compounds, with every form, compound, image compound and derivation built on them; ` +
      `the lexicon's fronted questions rewritten under 2.1:G46.`,
    rulings,
    ops,
  };

  // 4. verify against every pair the patch lists
  const built = applyChangesets(baseline, [changeset], {
    version: EDITION,
    builtUtc: AT,
    source: '',
    ids,
    wordBuilding: WORD_BUILDING_2_0,
  }).lexicon;
  const mig = built.legacy.migration_forms as unknown as Record<string, { to: string }>;
  const problems: string[] = [];
  const expect = (from: string, to: string, what: string): void => {
    const got = mig[from]?.to;
    if (got !== to) problems.push(`${what}: ${from} → ${to} expected, built ${String(got)}`);
  };
  for (const r of patch.roots) for (const f of r.forms) expect(f.old, f.new, `root ${r.old}`);
  for (const c of patch.compounds)
    for (const f of c.forms) expect(f.old, f.new, `compound ${c.old}`);
  for (const d of patch.listed_derivations) {
    expect(d.old, d.new, 'derivation');
    if (!(d.new in built.morphology.lexicalised_derivations))
      problems.push(`derivation ${d.new} missing`);
  }
  const attested = new Set(
    ((built.image_compounds?.attested ?? []) as unknown as Head[]).map((a) => a.root),
  );
  for (const a of patch.image_engine.attested_renamed) {
    expect(a.old, a.new, 'image compound');
    if (!attested.has(a.new)) problems.push(`image compound ${a.new} missing`);
  }
  const builtRoots = new Map(
    (built.headwords as unknown as Head[]).map((h) => [h.id, h.root] as const),
  );
  for (const [old, now] of [
    ...Object.entries(patch.image_engine.modifiers_renamed),
    ...Object.entries(patch.image_engine.heads_renamed),
  ]) {
    const id = byRoot.get(old)?.id ?? '';
    if (builtRoots.get(id) !== now)
      problems.push(`pattern part ${old} → ${now}: built ${String(builtRoots.get(id))}`);
  }
  const sentences = new Set(built.examples.map((e) => e.liraasa));
  const rewritten = new Set(Object.keys(QUESTIONS_EX).map((i) => mid.examples[Number(i)]?.liraasa));
  for (const e of patch.example_sentences_respelled) {
    if (!sentences.has(e.new) && !rewritten.has(e.new))
      problems.push(`example not respelled as listed: ${e.new}`);
  }
  const counts = {
    headwords: built.headwords.length,
    roots: built.headwords.filter((h) => h.type === 'Primal').length,
    compounds: built.headwords.filter((h) => h.type === 'Compound').length,
  };
  if (counts.headwords !== patch.summary.headwords_after)
    problems.push(`headwords ${String(counts.headwords)}`);
  if (counts.roots !== patch.summary.roots_after) problems.push(`roots ${String(counts.roots)}`);
  if (counts.compounds !== patch.summary.compounds_after)
    problems.push(`compounds ${String(counts.compounds)}`);
  if (problems.length > 0) {
    for (const p of problems) console.error(`  ${p}`);
    throw new Error(`${String(problems.length)} patch pairs did not build as listed`);
  }
  console.log(
    `verified: ${String(patch.roots.length)} roots, ${String(patch.compounds.length)} compounds, ` +
      `${String(patch.listed_derivations.length)} derivations, ${String(patch.image_engine.attested_renamed.length)} image compounds, ` +
      `${String(patch.example_sentences_respelled.length)} examples; ${JSON.stringify(counts)}`,
  );

  const tally = new Map<string, number>();
  for (const o of ops) tally.set(o.op, (tally.get(o.op) ?? 0) + 1);
  console.log(`${String(ops.length)} ops`);
  for (const [k, v] of tally) console.log(`  ${k.padEnd(22)} ${String(v)}`);
  if (booleans.has('check')) return;
  writeFileSync(resolve(OUT), `${JSON.stringify(changeset, null, 1)}\n`, 'utf8');
  console.log(`wrote ${OUT}`);
}

main();
