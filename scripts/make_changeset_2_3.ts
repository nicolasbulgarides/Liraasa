/**
 * One-time tool: turn the author's Liraasa 2.3 sound-pass patch
 * (data/proposals/liraasa_2_3_patch.json) into the 2.3 changeset that
 * `npm run integrate:2.3` applies (ADR-0019).
 *
 *   npx tsx scripts/make_changeset_2_3.ts            # write the changeset
 *   npx tsx scripts/make_changeset_2_3.ts --check    # build it, write nothing
 *
 * The patch respells thirteen roots (2.3:G69), makes bear, cow and frog roots
 * (2.3:G70: two compounds become roots and a listed derivation gives way to a
 * new root), and rebuilds wolf on farvi (2.3:G71, superseding the wolf half of
 * 2.1:G59). Every form, compound and derivation it lists is what the
 * respelling code (src/core/change/respell.ts) produces, not copied: the
 * generator applies its own changeset to frozen 2.2 and halts unless every
 * pair, count, example and album line the patch lists comes out exactly so.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  applyChangesets,
  type ChangesetRuling,
  type LexiconChangeset,
  type NewHeadword,
} from '../src/core/change/apply';
import type { ChangeRecord } from '../src/core/change/changelog';
import { correctText } from '../src/core/change/respell';
import { isUnusedGloss } from '../src/core/config/slots';
import { IdAssigner, type IdMapFile } from '../src/core/model/ids';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { since20 } from './build_album';
import { WORD_BUILDING_2_0, idsAfter } from './integrate_2_0';

const PATCH = 'data/proposals/liraasa_2_3_patch.json';
const BASELINE = 'data/lexicon/liraasa_2_2.json';
const BEFORE_2_0 = 'data/lexicon/liraasa_2_0.json';
const OUT = 'data/changes/2026-10-19-lexicon-2-3.json';
const ID = '2026-10-19-lexicon-2-3';
const EDITION = '2.3';
const AT = '2026-10-19T18:00:00Z';
const AUTHOR = 'nicolas';

interface Patch {
  substitutions: { requested?: string; used?: string; for: string; reason: string }[];
  draft_rulings: { id: string; topic: string; rule: string }[];
  counts: Record<string, number>;
  root_respellings: { old: string; new: string; gloss: string }[];
  compounds_to_roots: { old: string; new: string; gloss: string; domain: string }[];
  derivation_to_root: { old: string; old_listing: string; new: string; domain: string }[];
  compound_restructures: { old: string; old_parts: string; new: string; new_parts: string }[];
  headword_migration: { old: string; new: string; new_parts: string | null }[];
  form_migration: { headword: string; old: string; new: string; role: string; gloss: string }[];
  lexicalised_derivations: { old: string; new: string | null; new_listing?: string }[];
  album_read_today: { track: string; line: number; current_after_patch: string }[];
  example_sentences: { path: string; before: string; after: string }[];
  rulings_left_verbatim: { path: string; text: string }[];
  token_map: Record<string, string>;
}

/** frog's new verb: the patch's dictionary line, `kerkuka (v) to croak` (2.3:G70). */
const KERKU_GLOSSES = { root: 'frog', verb: 'to croak' };

/** The clause of 2.1:G59 that 2.3:G71 supersedes; its taha → kezupago half stands. */
const G59_WOLF = 'volda -> larbopagobudi (larbopago + budi)';

interface Head {
  id: string;
  root: string;
  type: string;
  components: string[] | null;
  forms: Record<string, string>;
  glosses: Record<string, string>;
}

const load = (p: string): unknown => JSON.parse(readFileSync(resolve(p), 'utf8'));
const ruleId = (draft: string): string => (/^(G\d+)/.exec(draft)?.[1] ?? draft).trim();

function main(): void {
  const { booleans } = parseArgs(process.argv.slice(2), []);
  const patch = load(PATCH) as Patch;
  const baseline = load(BASELINE) as RawLexicon;
  const ids = idsAfter(baseline, load('data/lexicon/ids.json') as IdMapFile);
  const heads = baseline.headwords as unknown as Head[];
  const byRoot = new Map(heads.map((h) => [h.root, h]));
  const find = (root: string, kind: 'Primal' | 'Compound'): Head => {
    const h = byRoot.get(root);
    if (h?.type !== kind) throw new Error(`${root}: not a 2.2 ${kind.toLowerCase()} headword`);
    return h;
  };

  const ops: ChangeRecord[] = [];
  const op = (o: Omit<ChangeRecord, 'addedIn' | 'at' | 'author'>): void => {
    ops.push({ ...o, addedIn: EDITION, at: AT, author: AUTHOR });
  };

  // 1. the rulings: the patch's drafts, as 2.3:G69–G71
  const rulings: ChangesetRuling[] = patch.draft_rulings.map((r) => {
    const id = ruleId(r.id);
    return {
      id,
      topic: r.topic,
      ruling: r.rule,
      refines: id === 'G69' ? ['2.1:G58'] : [],
      ...(id === 'G71' ? { supersedes: ['2.1:G59'] } : {}),
      examples: [],
    };
  });
  if (rulings.map((r) => r.id).join() !== 'G69,G70,G71')
    throw new Error(`rulings ${rulings.map((r) => r.id).join()}: expected G69–G71`);
  for (const r of rulings) {
    op({
      entry: `2.3:${r.id}`,
      op: 'add_ruling',
      from: null,
      to: r.topic,
      ruling: `2.3:${r.id}`,
      reason: `Liraasa 2.3 sound-pass patch, draft ruling ${r.id}: ${r.topic}.`,
    });
  }
  const g59 = (baseline.rulings_2_1 ?? []).find((r) => r.id === 'G59');
  if (!g59?.ruling.startsWith(G59_WOLF))
    throw new Error('2.1:G59 is not the wolf-and-country ruling the patch supersedes in part');
  op({
    entry: '2.1:G59',
    op: 'supersede_ruling',
    field: G59_WOLF,
    from: g59.topic,
    to: '2.3:G71',
    ruling: '2.3:G71',
    reason:
      'Liraasa 2.3 patch: 2.3:G71 rebuilds wolf on farvi and supersedes the wolf half of 2.1:G59; its taha -> kezupago half stands. The ruling is kept as ruled, never reworded.',
  });

  // 2. thirteen roots respelled, in the patch's order (2.3:G69)
  for (const r of patch.root_respellings) {
    const h = find(r.old, 'Primal');
    op({
      entry: h.id,
      op: 'respell_root',
      slot: 'root',
      from: r.old,
      to: r.new,
      ruling: '2.3:G69',
      reason: `Liraasa 2.3 patch: ${r.old} ("${r.gloss}") is respelled ${r.new}; every meaning and empty slot is kept, and every form, compound, image compound and derivation follows (2.3:G69, 2.1:G58).`,
    });
  }

  // 3. wolf rebuilt on farvi (2.3:G71); werewolf follows as a compound built on it
  for (const c of patch.compound_restructures) {
    const h = find(c.old, 'Compound');
    if (h.components?.join('+') !== c.old_parts) throw new Error(`${c.old}: not ${c.old_parts}`);
    // a compound built on a restructured one (lunolarbopagobudi) follows its part
    if (h.components.some((p) => patch.compound_restructures.some((x) => x.old === p))) continue;
    op({
      entry: h.id,
      op: 'recompose_compound',
      slot: 'root',
      from: c.old,
      to: c.new_parts,
      ruling: '2.3:G71',
      reason: `Liraasa 2.3 patch: ${c.old} (${c.old_parts.replace('+', ' + ')}) is rebuilt as ${c.new} (${c.new_parts.replace('+', ' + ')}), "wild dog", read like farvilazu (wild animal); the entry keeps its id and glosses, and every compound built on it follows (2.3:G71).`,
    });
  }

  // 4. bear and cow become roots (2.3:G70)
  for (const c of patch.compounds_to_roots) {
    const h = find(c.old, 'Compound');
    op({
      entry: h.id,
      op: 'respell_compound_as_root',
      slot: 'root',
      from: c.old,
      to: c.new,
      ruling: '2.3:G70',
      reason: `Liraasa 2.3 patch: the compound ${c.old} ("${c.gloss}") is replaced by the root ${c.new}; the entry keeps its id and glosses, and ${c.old} is retired (2.3:G70).`,
    });
  }

  // 5. frog: a new root, and the listed derivation it replaces retired (2.3:G70)
  const minting = new IdAssigner(ids);
  for (const h of heads) minting.assign('headword', h.root, h.id);
  const newHeads: NewHeadword[] = [];
  for (const d of patch.derivation_to_root) {
    const listed = baseline.morphology.lexicalised_derivations[d.old];
    const m = /: ([a-z]+) \+ -([a-z]+)$/.exec(listed ?? '');
    const base = byRoot.get(m?.[1] ?? '');
    if (listed === undefined || base === undefined || m === null)
      throw new Error(`${d.old}: not a listed derivation of a 2.2 headword`);
    const id = minting.assign('headword', d.new);
    newHeads.push({
      id,
      root: d.new,
      type: 'Primal',
      components: null,
      glosses: KERKU_GLOSSES as NewHeadword['glosses'],
      register: 'everyday',
      domain: d.domain,
      english_synonyms: [KERKU_GLOSSES.root, KERKU_GLOSSES.verb],
      // named by its parts: the derivation's own spelling is rewritten to kerku once it is retired
      notes: `Added in 2.3 (changeset ${ID}). Replaces the listed derivation ${base.root} + -${m[2] ?? ''} (${listed.split(':')[0] ?? ''}), which is retired (2.3:G70).`,
    });
    op({
      entry: id,
      op: 'add_root',
      slot: 'root',
      from: null,
      to: d.new,
      ruling: '2.3:G70',
      reason: `Liraasa 2.3 patch: ${d.new} ("${KERKU_GLOSSES.root}") is a new root, with the verb ${d.new}ka "${KERKU_GLOSSES.verb}" (2.3:G70).`,
    });
    op({
      entry: `derivation:${base.id}:-${m[2] ?? ''}`,
      op: 'retire_derivation',
      from: listed,
      to: id,
      ruling: '2.3:G70',
      reason: `Liraasa 2.3 patch: frog is now the root ${d.new}, so ${d.old} leaves the listed derivations; old texts read it as ${d.new}, and it stays buildable by the default -${m[2] ?? ''} reading (2.3:G70).`,
    });
  }

  const changeset: LexiconChangeset = {
    id: ID,
    edition: EDITION,
    created: AT,
    author: AUTHOR,
    summary:
      `Liraasa 2.3 (ADR-0019), from the author's sound-pass patch: rulings 2.3:G69–G71; ` +
      `${String(patch.root_respellings.length)} roots respelled (${patch.root_respellings.map((r) => `${r.old} → ${r.new}`).join(', ')}); ` +
      `bear and cow made the roots bumbo and murmu, and frog the new root kerku (mirunululirayo retired); ` +
      `wolf rebuilt as farvibudi (farvi + budi), superseding the wolf half of 2.1:G59; ` +
      `every form, compound, image compound, derivation and example sentence built on them follows.`,
    rulings,
    headwords: newHeads,
    ops,
  };

  // verify: everything the patch lists
  const built = applyChangesets(baseline, [changeset], {
    version: EDITION,
    builtUtc: AT,
    source: '',
    ids,
    wordBuilding: WORD_BUILDING_2_0,
  }).lexicon;
  const problems: string[] = [];
  const mig = built.legacy.migration_forms as unknown as Record<string, { to: string }>;
  const builtHeads = built.headwords as unknown as Head[];
  const builtById = new Map(builtHeads.map((h) => [h.id, h]));
  const builtByRoot = new Map(builtHeads.map((h) => [h.root, h]));
  const expect = (from: string, to: string, what: string): void => {
    const got = mig[from]?.to;
    if (got !== to) problems.push(`${what}: ${from} → ${to} expected, built ${String(got)}`);
  };
  for (const [from, to] of Object.entries(patch.token_map)) expect(from, to, 'token_map');
  for (const f of patch.form_migration) {
    expect(f.old, f.new, `form of ${f.headword}`);
    const h = builtHeads.find((x) => Object.values(x.forms).includes(f.new));
    const slot = h && Object.entries(h.forms).find(([, v]) => v === f.new)?.[0];
    if (h === undefined || slot === undefined || h.glosses[slot] !== f.gloss)
      problems.push(`${f.new}: not glossed "${f.gloss}"`);
  }
  for (const hm of patch.headword_migration) {
    const was = byRoot.get(hm.old);
    const now = builtByRoot.get(hm.new);
    if (was === undefined || now === undefined || was.id !== now.id)
      problems.push(`headword ${hm.old} → ${hm.new}: not the same entry`);
    else if ((now.components?.join('+') ?? null) !== hm.new_parts)
      problems.push(
        `headword ${hm.new}: parts ${String(now.components?.join('+'))}, patch ${String(hm.new_parts)}`,
      );
  }
  for (const d of patch.lexicalised_derivations) {
    const table = built.morphology.lexicalised_derivations;
    if (d.old in table) problems.push(`derivation ${d.old}: still listed`);
    if (d.new !== null && table[d.new] !== d.new_listing)
      problems.push(
        `derivation ${d.new}: "${String(table[d.new])}", patch "${String(d.new_listing)}"`,
      );
  }
  const kerku = builtByRoot.get('kerku');
  if (kerku?.forms.verb !== 'kerkuka' || kerku.glosses.verb !== KERKU_GLOSSES.verb)
    problems.push('kerku: no verb kerkuka "to croak"');
  const sentences = new Set(built.examples.map((e) => e.liraasa));
  for (const e of patch.example_sentences) {
    const i = Number(e.path.split('/')[2]);
    if (built.examples[i]?.liraasa !== e.after && !sentences.has(e.after))
      problems.push(`example not respelled as listed: ${e.after}`);
  }
  // the album, read today: the patch's spelling of each line it lists
  const mapping = since20(built, load(BEFORE_2_0) as RawLexicon);
  const { songs } = load('data/corpus/album_2_0/liraasa_album_corpus.json') as {
    songs: { track: string; lines: { n: number; recorded: string }[] }[];
  };
  for (const a of patch.album_read_today) {
    const line = songs.find((s) => s.track === a.track)?.lines.find((l) => l.n === a.line);
    const live = line && correctText(line.recorded, mapping).text;
    if (live !== a.current_after_patch)
      problems.push(`album ${a.track}:${String(a.line)}: built "${String(live)}"`);
  }
  // nothing of the old spellings left alive
  const live = new Set(builtHeads.flatMap((h) => Object.values(h.forms)));
  for (const old of Object.keys(patch.token_map)) if (live.has(old)) problems.push(`${old}: alive`);
  const meaningful = builtHeads
    .flatMap((h) => Object.values(h.glosses))
    .filter((g) => !isUnusedGloss(g)).length;
  const counts = {
    headwords: builtHeads.length,
    roots: builtHeads.filter((h) => h.type === 'Primal').length,
    compounds: builtHeads.filter((h) => h.type === 'Compound').length,
    meaningful_forms: meaningful,
  };
  for (const [k, v] of Object.entries(counts)) {
    const want = patch.counts[`${k}_after`];
    if (want !== undefined && want !== v)
      problems.push(`${k}: built ${String(v)}, patch ${String(want)}`);
  }
  if (!builtById.has(kerku?.id ?? '')) problems.push('kerku: no id');
  if (problems.length > 0) {
    for (const p of problems) console.error(`  ${p}`);
    throw new Error(`${String(problems.length)} patch items did not build as listed`);
  }
  console.log(
    `verified: ${String(Object.keys(patch.token_map).length)} spellings, ${String(patch.headword_migration.length)} headwords, ` +
      `${String(patch.form_migration.length)} forms, ${String(patch.example_sentences.length)} examples, ` +
      `${String(patch.album_read_today.length)} album lines; ${JSON.stringify(counts)}`,
  );

  const tally = new Map<string, number>();
  for (const o of ops) tally.set(o.op, (tally.get(o.op) ?? 0) + 1);
  console.log(`${String(ops.length)} ops`);
  for (const [k, v] of tally) console.log(`  ${k.padEnd(24)} ${String(v)}`);
  if (booleans.has('check')) return;
  writeFileSync(resolve(OUT), `${JSON.stringify(changeset, null, 1)}\n`, 'utf8');
  console.log(`wrote ${OUT}`);
}

main();
