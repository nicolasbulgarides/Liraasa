/**
 * One-time tool: turn the author's Liraasa 2.2 patch
 * (data/proposals/liraasa_2_2_patch.json, with LIRAASA_2_2_PATCH.md) into the
 * 2.2 changeset that `npm run integrate:2.2` applies (ADR-0018).
 *
 *   npx tsx scripts/make_changeset_2_2.ts            # write the changeset
 *   npx tsx scripts/make_changeset_2_2.ts --check    # build it, write nothing
 *   npx tsx scripts/make_changeset_2_2.ts --step 1   # only the patch's step 1 (rulings)
 *
 * 2.2 brings the grammar in line with the album: rulings 2.2:G60–G68, three
 * earlier rulings superseded (kept, marked, never reworded), the 2.1
 * respelling silro → puzu undone, and two empty forms filled with the glosses
 * the author confirmed on 2026-10-19. The generator applies its own changeset
 * to frozen 2.1 and halts unless every pair the patch lists comes out so.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  applyChangesets,
  type ChangesetRuling,
  type LexiconChangeset,
} from '../src/core/change/apply';
import type { ChangeRecord } from '../src/core/change/changelog';
import type { RulingRef } from '../src/core/config/editions';
import { SLOT_RAW_KEY, type FormSlot } from '../src/core/config/slots';
import type { IdMapFile } from '../src/core/model/ids';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { WORD_BUILDING_2_0, idsAfter } from './integrate_2_0';

const PATCH = 'data/proposals/liraasa_2_2_patch.json';
const BASELINE = 'data/lexicon/liraasa_2_1.json';
const OUT = 'data/changes/2026-10-19-lexicon-2-2.json';
const ID = '2026-10-19-lexicon-2-2';
const EDITION = '2.2';
const AT = '2026-10-19T12:00:00Z';
const AUTHOR = 'nicolas';

interface Revert {
  from_2_1: string;
  restore: string;
  forms?: { role: string; from_2_1: string; restore: string }[];
}
interface Patch {
  rulings: { id: string; topic: string; status: string; rule: string; examples: string[] }[];
  superseded: Record<string, string>;
  lexicon: {
    fill_slots: { headword: string; role: string; form: string; gloss: string; source: string }[];
    revert_silro: {
      root: Revert & { restore_2_0: string; forms: { from_2_1: string; restore: string }[] };
      compounds: Revert[];
      image_engine: { modifier: Revert; attested: Revert[] };
    };
  };
  edition_note: string;
}

/** The patch's role codes, as the LLM reference writes them. */
const ROLE: Record<string, FormSlot> = {
  n: 'root',
  an: 'ascended',
  nn: 'negative',
  v: 'verb',
  na: 'negativeAdjective',
  a: 'adjective',
  aa: 'ascendedAdjective',
};

/** The author's answers of 2026-10-19 to the patch's `confirm_with_author` glosses. */
const CONFIRMED: Record<string, string> = {
  soloasa: 'the living stone; a jewel of countless faces',
  tarnulinusan: 'boyish; like a son',
};

/** The project's own topic of each ruling the patch supersedes, and the clause, when partial. */
const SUPERSEDED: Record<string, { entry: string; clause?: string }> = {
  '2.1:G46': { entry: '2.1:G46' },
  '2.1:G47': { entry: '2.1:G47' },
  '2.1:G54': { entry: '2.1:G54' },
  '0.8:G4 (embedded wh-word stays in place)': {
    entry: '0.8:G4',
    clause: 'embedded wh-word stays in place',
  },
};

interface Head {
  id: string;
  root: string;
  forms: Record<string, string>;
  glosses: Record<string, string>;
}

const load = (p: string): unknown => JSON.parse(readFileSync(resolve(p), 'utf8'));

/** A ruling by its edition-qualified id, from the lexicon. */
function rulingOf(lex: RawLexicon, ref: string): { topic: string } | undefined {
  const [edition, id] = ref.split(':');
  const key = `rulings_${(edition ?? '').replace('.', '_')}${edition === '0.8' ? '_carried' : ''}`;
  const set = (lex as unknown as Record<string, { id: string; topic: string }[] | undefined>)[key];
  return set?.find((r) => r.id === id);
}

function main(): void {
  const { flags, booleans } = parseArgs(process.argv.slice(2), ['step']);
  const through = Number(flags.step ?? '2');
  const patch = load(PATCH) as Patch;
  const baseline = load(BASELINE) as RawLexicon;
  const ids = idsAfter(baseline, load('data/lexicon/ids.json') as IdMapFile);
  const heads = baseline.headwords as unknown as Head[];
  const byRoot = new Map(heads.map((h) => [h.root, h]));

  const ops: ChangeRecord[] = [];
  const op = (o: Omit<ChangeRecord, 'addedIn' | 'at' | 'author'>): void => {
    ops.push({ ...o, addedIn: EDITION, at: AT, author: AUTHOR });
  };

  // 1. the rulings, and what they supersede
  const supersedes = new Map<string, string[]>();
  for (const [old, by] of Object.entries(patch.superseded)) {
    const s = SUPERSEDED[old];
    if (s === undefined) throw new Error(`${old}: not mapped to a ruling of the lexicon`);
    supersedes.set(by, [...(supersedes.get(by) ?? []), s.entry]);
  }
  const rulings: ChangesetRuling[] = patch.rulings.map((r) => {
    const id = r.id.replace(/^2\.2:/, '');
    const replaces = supersedes.get(r.id) ?? [];
    return {
      id,
      topic: r.topic,
      ruling: r.rule,
      refines: [],
      ...(replaces.length > 0 ? { supersedes: replaces } : {}),
      // the patch gives no English, and none is invented (LIRAASA_2_2_PATCH.md, "Don't")
      examples: r.examples.map((e): [string, string] => [e, '']),
    };
  });
  for (const r of rulings) {
    op({
      entry: `2.2:${r.id}`,
      op: 'add_ruling',
      from: null,
      to: r.topic,
      ruling: `2.2:${r.id}`,
      reason: `Liraasa 2.2 patch, rulings: ${r.topic}.`,
    });
  }
  for (const [old, by] of Object.entries(patch.superseded)) {
    const s = SUPERSEDED[old];
    const ruling = s === undefined ? undefined : rulingOf(baseline, s.entry);
    if (s === undefined || ruling === undefined) throw new Error(`${old}: no such ruling`);
    op({
      entry: s.entry,
      op: 'supersede_ruling',
      ...(s.clause !== undefined ? { field: s.clause } : {}),
      from: ruling.topic,
      to: by,
      ruling: by as RulingRef,
      reason:
        s.clause === undefined
          ? `Liraasa 2.2 patch: ${by} supersedes ${s.entry}; the ruling is kept and marked, never reworded.`
          : `Liraasa 2.2 patch: ${by} supersedes only the clause of ${s.entry} that an embedded wh-word stays in place; its quotation clause stands.`,
    });
  }

  // 2. the lexicon: silro restored, two forms filled
  const revert = patch.lexicon.revert_silro;
  const opsBefore = ops.length;
  const puzu = byRoot.get(revert.root.from_2_1);
  if (puzu === undefined) throw new Error(`${revert.root.from_2_1}: not a 2.1 root`);
  op({
    entry: puzu.id,
    op: 'respell_root',
    slot: 'root',
    from: revert.root.from_2_1,
    to: revert.root.restore_2_0,
    ruling: '2.2:G68',
    reason: `Liraasa 2.2 patch: the 2.1 respelling ${revert.root.restore_2_0} → ${revert.root.from_2_1} is undone, so the album's ${revert.root.restore_2_0} is the word again; ${revert.root.from_2_1} becomes a retired spelling, and every compound and image compound follows.`,
  });
  for (const f of patch.lexicon.fill_slots) {
    const h = byRoot.get(f.headword);
    const slot = ROLE[f.role];
    const gloss = CONFIRMED[f.form];
    if (h === undefined || slot === undefined)
      throw new Error(`${f.headword}: cannot fill ${f.role}`);
    if (gloss === undefined || gloss !== f.gloss)
      throw new Error(`${f.form}: the gloss is not the one the author confirmed`);
    if (h.forms[SLOT_RAW_KEY[slot]] !== f.form)
      throw new Error(`${f.form}: not ${f.headword}'s ${f.role}`);
    op({
      entry: h.id,
      op: 'activate_slot',
      slot,
      from: h.glosses[SLOT_RAW_KEY[slot]] ?? null,
      to: gloss,
      ruling: '2.2:G68',
      reason: `Liraasa 2.2 patch: ${f.form} is sung on the album (${f.source}); the gloss is the patch's, confirmed by the author on 2026-10-19.`,
    });
  }

  if (through < 2) ops.splice(opsBefore);
  const changeset: LexiconChangeset = {
    id: ID,
    edition: EDITION,
    created: AT,
    author: AUTHOR,
    summary: patch.edition_note,
    rulings,
    ops,
  };

  // verify: every pair the patch lists, and nothing of puzu left alive
  const built = applyChangesets(baseline, [changeset], {
    version: EDITION,
    builtUtc: AT,
    source: '',
    ids,
    wordBuilding: WORD_BUILDING_2_0,
  }).lexicon;
  const problems: string[] = [];
  const mig = built.legacy.migration_forms as unknown as Record<string, { to: string }>;
  const live = new Set(
    [
      ...(built.headwords as unknown as Head[]),
      ...((built.image_compounds?.attested ?? []) as unknown as Head[]),
    ].flatMap((h) => Object.values(h.forms)),
  );
  const pairs =
    through < 2
      ? []
      : [
          ...revert.root.forms,
          ...revert.compounds.flatMap((c) => c.forms ?? []),
          ...revert.image_engine.attested,
          revert.image_engine.modifier,
        ];
  for (const p of pairs) {
    if (mig[p.from_2_1]?.to !== p.restore)
      problems.push(`${p.from_2_1} → ${p.restore} expected, built ${String(mig[p.from_2_1]?.to)}`);
    if (!live.has(p.restore)) problems.push(`${p.restore}: not a live form`);
    if (mig[p.restore] !== undefined) problems.push(`${p.restore}: still a retired spelling`);
  }
  if (through >= 2) for (const f of live) if (f.includes('puzu')) problems.push(`${f}: alive`);
  for (const f of through < 2 ? [] : patch.lexicon.fill_slots) {
    const h = (built.headwords as unknown as Head[]).find((x) => x.root === f.headword);
    const slot = ROLE[f.role];
    if (slot === undefined || h?.glosses[SLOT_RAW_KEY[slot]] !== CONFIRMED[f.form])
      problems.push(`${f.form}: not filled`);
  }
  if (problems.length > 0) {
    for (const p of problems) console.error(`  ${p}`);
    throw new Error(`${String(problems.length)} problems`);
  }
  console.log(
    `verified (through step ${String(through)}): ${String(revert.root.forms.length)} root forms, ${String(revert.compounds.length)} compounds, ` +
      `${String(revert.image_engine.attested.length)} image compounds restored; ${String(patch.lexicon.fill_slots.length)} forms filled`,
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
