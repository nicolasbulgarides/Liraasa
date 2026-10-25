/**
 * One-time tool: turn the author's Liraasa 3.0 patch, "Devotion, Music and
 * Measure" (archive/patch_3_0/liraasa_3_0_patch.json, with its README
 * LIRAASA_3_0_README.md and the analysis Liraasa_3_0_Devotional_Analysis.md),
 * into the changeset `npm run integrate:3.0` applies (ADR-0021).
 *
 *   npx tsx scripts/make_changeset_3_0.ts           # write the changeset
 *   npx tsx scripts/make_changeset_3_0.ts --check   # build, write nothing
 *
 * The patch is additions only: 15 roots, 112 compounds, 17 listed
 * derivations, one lexicalised diminutive, 33 restored forms on 2.5
 * headwords, the vocative iya, and rulings 3.0:G129-G141. Its README's step 4
 * (carry the rulings into the rest of the reference) is done here where the
 * text is lexicon data (the clause template, the edges, the miyo, sela and
 * gagu rows) and in scripts/build_llm_json.ts and the grammar guide's
 * chapters where it is a summary the build writes.
 *
 * Every addition is PROPOSED: each ruling carries `status: "proposed"` and
 * each new entry says so in its notes, until the author ratifies it.
 *
 * The generator applies its own changeset to frozen 2.5 and halts unless every
 * form the patch lists is the form the seven-form rules build for its slot,
 * glossed as the patch glosses it, and the counts are the patch's.
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
import { SLOT_RAW_KEY, isUnusedGloss, type FormSlot } from '../src/core/config/slots';
import { senses } from '../src/core/integrate/synonyms';
import { IdAssigner, type IdMapFile } from '../src/core/model/ids';
import type { RawLexicon, RawSlots } from '../src/core/model/raw';
import { sevenForms } from '../src/core/morphology/sevenForms';
import { parseArgs } from './args';
import { WORD_BUILDING_2_0, idsAfter } from './integrate_2_0';

const PATCH = 'archive/patch_3_0/liraasa_3_0_patch.json';
const BASELINE = 'data/lexicon/liraasa_2_5.json';
const EDITION = '3.0';
const AT = '2026-10-25T12:00:00Z';
const AUTHOR = 'nicolas';
export const ID_3_0 = '2026-10-25-lexicon-3-0';
export const FILE_3_0 = `data/changes/${ID_3_0}.json`;
const UNUSED = '— (unused)';

/** The patch's slot codes are the LLM reference's (scripts/build_llm_json.ts). */
const SLOT: Readonly<Record<string, FormSlot>> = {
  n: 'root',
  an: 'ascended',
  nn: 'negative',
  v: 'verb',
  na: 'negativeAdjective',
  a: 'adjective',
  aa: 'ascendedAdjective',
};

interface PatchForm {
  form: string;
  meaning: string;
}
interface PatchRoot {
  headword: string;
  domain: string;
  forms: Record<string, PatchForm>;
  /** 3.1 on: 1 = ratify first, 2 = item by item. */
  tier?: number;
}
interface PatchCompound extends PatchRoot {
  parts: [string, string];
  image_compound: boolean;
  title: boolean;
  note: string | null;
}
export interface Patch {
  status: string;
  base_counts: { headwords: number; meaningful_forms: number };
  counts: Record<string, number>;
  function_words_add: {
    form: string;
    meaning: string;
    use: string;
    example_liraasa: string;
    example_english: string;
  }[];
  roots_add: PatchRoot[];
  compounds_add: PatchCompound[];
  listed_derivations_add: { form: string; base: string; suffix: string; meaning: string }[];
  lexicalised_diminutives_add: { form: string; base: string; meaning: string }[];
  restored_forms_add: { headword: string; slot: string; form: string; meaning: string }[];
  rulings_add?: {
    id: string;
    topic: string;
    rule: string;
    motivation?: string;
    resolves?: string;
    examples?: [string, string][];
    ungrammatical?: [string, string][];
  }[];
}

interface Head {
  id: string;
  root: string;
  type: string;
  forms: Record<string, string>;
  glosses: Record<string, string>;
}

export interface AdditionsConfig {
  patch: string;
  baseline: string;
  edition: string;
  /** The edition the patch is built on, as reasons and notes name it. */
  previous: string;
  at: string;
  id: string;
  /** The patch's name, opening every op's reason. */
  name: string;
  summary: (patch: Patch, lexicalised: string[]) => string;
  /** Ops the patch's README asks for beyond its lists (3.0: the rulings carried into the clause). */
  extraOps?: (lex: RawLexicon) => ChangeRecord[];
}

/** A change record stamped with the config's edition and time. */
export const recorder =
  (cfg: { edition: string; at: string }) =>
  (
    op: ChangeRecord['op'],
    entry: string,
    from: string | null,
    to: string | null,
    ruling: string | undefined,
    reason: string,
    extra: Partial<ChangeRecord> = {},
  ): ChangeRecord => ({
    entry,
    op,
    ...extra,
    from,
    to,
    ...(ruling === undefined ? {} : { ruling: ruling as NonNullable<ChangeRecord['ruling']> }),
    reason,
    addedIn: cfg.edition,
    at: cfg.at,
    author: AUTHOR,
  });

const record = (
  op: ChangeRecord['op'],
  entry: string,
  from: string | null,
  to: string | null,
  ruling: string | undefined,
  reason: string,
  extra: Partial<ChangeRecord> = {},
): ChangeRecord => ({
  entry,
  op,
  ...extra,
  from,
  to,
  ...(ruling === undefined ? {} : { ruling: ruling as NonNullable<ChangeRecord['ruling']> }),
  reason,
  addedIn: EDITION,
  at: AT,
  author: AUTHOR,
});

const RULING_REF = /\b(\d\.\d):([GR]\d+)\b/g;
const refsIn = (text: string): string[] => [...text.matchAll(RULING_REF)].map((m) => m[0]);

/** The patch's own words, as the reason every op gives. */
const why = (what: string): string => `Liraasa 3.0 patch (Devotion, Music and Measure): ${what}.`;

/** Synonyms from the listed glosses, in slot order, as the 1.1 integration derived them. */
function synonyms(glosses: Record<string, string>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const g of Object.values(glosses)) {
    if (isUnusedGloss(g)) continue;
    const found = senses(g);
    for (const s of found.length > 0 ? found : [g]) {
      if (seen.has(s.toLowerCase())) continue;
      seen.add(s.toLowerCase());
      out.push(s);
    }
  }
  return out;
}

/** What the clause, the edges and three function-word rows say after 3.0 (README step 4). */
function propagationOps(lex: RawLexicon): ChangeRecord[] {
  const ops: ChangeRecord[] = [];
  const template = lex.grammar.clause_template;
  const after = template.replace(/^\[LINKER\]/, '[iya VOCATIVE,] [LINKER]');
  if (after === template || !after.endsWith('[, VOCATIVE]'))
    throw new Error('the 2.5 clause template is not the one the 3.0 patch extends');
  ops.push(
    record(
      'edit_text',
      'text:grammar.clause_template',
      template,
      after.replace(/\[, VOCATIVE\]$/, '[, [iya] VOCATIVE]'),
      '3.0:G129',
      why('an iya vocative may open the sentence, set off by a comma, or close it after ki'),
    ),
  );
  const edges = (lex.grammar as unknown as { edges: Record<string, unknown> }).edges;
  const before = edges.before_the_clause as Record<string, unknown>[];
  ops.push(
    record(
      'edit_value',
      'value:grammar.edges.before_the_clause',
      JSON.stringify(before),
      JSON.stringify([
        {
          position: 'VOCATIVE',
          words: ['iya + a noun phrase or name'],
          notes:
            'set off by a comma; expected in prayer, invocation and litany, and required where a comma-set noun phrase could be read as an apposition (3.0:G129, 3.0:G130)',
        },
        ...before,
      ]),
      '3.0:G129',
      why('the vocative edge before the clause, opened by iya'),
    ),
  );
  const closing = edges.after_the_clause as Record<string, unknown>[];
  const voc = closing[0];
  if (voc?.position !== 'VOCATIVE') throw new Error('edges.after_the_clause: no VOCATIVE row');
  ops.push(
    record(
      'edit_value',
      'value:grammar.edges.after_the_clause',
      JSON.stringify(closing),
      JSON.stringify([
        {
          ...voc,
          words: ['a noun phrase or name', 'iya + a noun phrase or name'],
          notes: 'set off by a comma; may follow ki (2.5:G89); iya marks it in prayer (3.0:G129)',
        },
        ...closing.slice(1),
      ]),
      '3.0:G129',
      why('the closing vocative may be opened by iya'),
    ),
  );
  ops.push(
    record(
      'edit_value',
      'value:grammar.edges.apposition',
      null,
      JSON.stringify({
        position: 'after any noun phrase',
        words: ['a second noun phrase that renames it'],
        notes:
          'set off by commas, with its own determiner and no copula; it starts a new phrase, so it never joins a de-chain; several in a row form a litany (3.0:G130)',
      }),
      '3.0:G130',
      why('apposition: a noun phrase renamed by a second, comma-set noun phrase'),
    ),
  );
  const row = (form: string) => {
    const f = (
      lex.function_words as unknown as { form: string; id: string; [k: string]: unknown }[]
    ).find((x) => x.form === form);
    if (f === undefined) throw new Error(`${form}: not a 2.5 function word`);
    return f;
  };
  const fw = (form: string, field: 'meaning' | 'position', to: string, ruling: string) => {
    const f = row(form);
    ops.push(
      record(
        'edit_function_word',
        f.id,
        String(f[field]),
        to,
        ruling,
        why(`the ${form} row follows ${ruling}`),
        { field },
      ),
    );
  };
  fw(
    'miyo',
    'meaning',
    'existential there is / are; after a subject, absolute being: exists (3.0:G132)',
    '3.0:G132',
  );
  fw(
    'miyo',
    'position',
    'miyo + noun phrase (+ location): there is; SUBJECT [TENSE] miyo with nothing after it: the subject exists (3.0:G132); miyo + noun phrase + ! = let there be, + pifu = may there be (3.0:G133); agreement invariant',
    '3.0:G133',
  );
  fw('sela', 'meaning', 'oneself / reflexive; emphatic -self (3.0:G134)', '3.0:G134');
  fw(
    'sela',
    'position',
    'pronoun + sela: reflexive in object position; pronoun or noun phrase + sela in subject position or as an apposition is emphatic, herself or itself (3.0:G134); never alone as a subject',
    '3.0:G134',
  );
  fw(
    'gagu',
    'position',
    'Introduces optional external actor after passive verb; after a noun naming a made work, gagu + noun phrase names its maker, with no passive verb (3.0:G136)',
    '3.0:G136',
  );
  return ops;
}

/**
 * A changeset from an additions-only patch in the author's 3.x patch shape:
 * rulings, function words, roots, compounds, restored forms, derivations and
 * diminutives, each checked against the rules that build it. Used for 3.0 and
 * 3.1 (scripts/make_changeset_3_1.ts).
 */
export function makeAdditionsChangeset(cfg: AdditionsConfig): LexiconChangeset {
  const proposed = `Proposed in ${cfg.edition}: awaiting the author's ratification.`;
  const rec = recorder(cfg);
  const say = (what: string): string => `${cfg.name}: ${what}.`;
  const patch = JSON.parse(readFileSync(resolve(cfg.patch), 'utf8')) as Patch;
  const lex = JSON.parse(readFileSync(resolve(cfg.baseline), 'utf8')) as RawLexicon;
  const ids = idsAfter(
    lex,
    JSON.parse(readFileSync(resolve('data/lexicon/ids.json'), 'utf8')) as IdMapFile,
  );
  const heads = lex.headwords as unknown as Head[];
  if (heads.length !== patch.base_counts.headwords)
    throw new Error(
      `the patch is for ${String(patch.base_counts.headwords)} headwords, ${cfg.previous} has ${String(heads.length)}`,
    );
  const byRoot = new Map(heads.map((h) => [h.root, h]));
  const minting = new IdAssigner(ids);
  for (const h of heads) minting.assign('headword', h.root, h.id);

  const ops: ChangeRecord[] = [];
  const problems: string[] = [];

  // 1. the rulings, first, so every op below may cite them
  const rulings: (ChangesetRuling & { status: string })[] = (patch.rulings_add ?? []).map((r) => {
    const [, id] = r.id.split(':');
    const refines = [...new Set(refsIn(r.rule))].filter((x) => !x.startsWith(`${cfg.edition}:`));
    return {
      id: id ?? '',
      topic: r.topic,
      ruling: r.rule,
      ...(refines.length > 0 ? { refines } : {}),
      examples: r.examples ?? [],
      ...(r.ungrammatical === undefined || r.ungrammatical.length === 0
        ? {}
        : { examples_ungrammatical: r.ungrammatical }),
      ...(r.resolves === undefined ? {} : { settles_open_questions: [r.resolves] }),
      ...(r.motivation === undefined ? {} : { notes: r.motivation }),
      status: 'proposed',
    };
  });
  for (const r of patch.rulings_add ?? [])
    ops.push(rec('add_ruling', r.id, null, r.topic, r.id, `${say(r.topic)} ${proposed}`));

  // 2. the vocative iya (3.0:G129)
  const fwMint = new IdAssigner(ids);
  for (const f of lex.function_words as unknown as { form: string; id: string }[])
    fwMint.assign('functionWord', f.form, f.id);
  const functionWords = patch.function_words_add.map((f) => ({
    form: f.form,
    meaning: f.meaning,
    position: f.use,
    example: f.example_liraasa,
    example_gloss: f.example_english,
    class: 'vocative',
    status_1_0: 'NEW',
    [`status_${cfg.edition.replace('.', '_')}`]: 'NEW',
    since: cfg.edition,
    id: fwMint.assign('functionWord', f.form),
  }));
  for (const f of functionWords)
    ops.push(
      rec(
        'add_function_word',
        f.id,
        null,
        f.form,
        '3.0:G129',
        `${say(`${f.form}, ${f.meaning}`)} ${proposed}`,
      ),
    );

  // 3. roots, then compounds, in the patch's order: only the listed slots carry meaning
  const newHeads: NewHeadword[] = [];
  const newIds = new Map<string, string>();
  const attested = new Map(
    ((lex.image_compounds?.attested ?? []) as unknown as (Head & { domain: string })[]).map((h) => [
      h.root,
      h,
    ]),
  );
  const lexicalised: string[] = [];
  const entry = (e: PatchRoot, compound: PatchCompound | null): void => {
    const built = sevenForms(e.headword);
    const glosses: Record<string, string> = {};
    for (const [code, f] of Object.entries(e.forms)) {
      const slot = SLOT[code];
      if (slot === undefined) {
        problems.push(`${e.headword}: unknown slot ${code}`);
        continue;
      }
      if (built[slot] !== f.form)
        problems.push(
          `${e.headword} ${code}: the patch lists ${f.form}, the rules build ${built[slot]}`,
        );
      glosses[SLOT_RAW_KEY[slot]] = f.meaning;
    }
    if (glosses.root === undefined) problems.push(`${e.headword}: no noun meaning`);
    // an image compound 2.0 kept whole in the pattern is already a word of 2.5: it comes back
    // as a headword, with its id, and takes the patch's meaning; its 2.5 reading is archived
    const was = attested.get(e.headword);
    if (was !== undefined) {
      lexicalised.push(e.headword);
      newIds.set(e.headword, was.id);
      const back = `${was.root}, an attested image compound of ${cfg.previous} ("${was.glosses.root ?? ''}")`;
      ops.push(
        rec(
          'lexicalise_from_pattern',
          was.id,
          was.root,
          was.root,
          '2.0:G40',
          `${say(`${back}, lexicalised as a headword`)} The patch lists it as new; it keeps its ${cfg.previous} id. ${proposed}`,
        ),
      );
      for (const [raw, meaning] of Object.entries(glosses)) {
        const from = was.glosses[raw] ?? UNUSED;
        const slot = (Object.keys(SLOT_RAW_KEY) as FormSlot[]).find((s) => SLOT_RAW_KEY[s] === raw);
        if (slot === undefined) throw new Error(`${was.root}: no slot ${raw}`);
        ops.push(
          rec(
            from === UNUSED ? 'activate_slot' : 'edit_gloss',
            was.id,
            from,
            meaning,
            '0.8:R2',
            `${say(`${was.forms[raw] ?? ''}, "${meaning}"`)} ${from === UNUSED ? '' : `Its ${cfg.previous} reading "${from}" is archived. `}${proposed}`,
            {
              slot,
              ...(from === UNUSED ? {} : { archive: true }),
            },
          ),
        );
      }
      if (was.domain !== e.domain)
        ops.push(
          rec(
            'edit_metadata',
            was.id,
            was.domain,
            e.domain,
            undefined,
            say(`${was.root} moves to the domain ${e.domain}`),
            { field: 'domain' },
          ),
        );
      return;
    }
    const id = minting.assign('headword', e.headword);
    newIds.set(e.headword, id);
    const said = [
      compound?.title === true
        ? 'A title of the Goddess: used as a name it is capitalised, takes no article and owns before de (3.0:G131).'
        : '',
      compound?.image_compound === true
        ? 'Also a modifier + head of the image-compound pattern (2.0:G40), lexicalised with the meanings listed.'
        : '',
      compound?.note ?? '',
    ].filter((s) => s.length > 0);
    newHeads.push({
      id,
      root: e.headword,
      type: compound === null ? 'Primal' : 'Compound',
      components: compound === null ? null : compound.parts,
      glosses: glosses as unknown as RawSlots,
      register: 'everyday',
      domain: e.domain,
      english_synonyms: synonyms(glosses),
      notes:
        `Added in ${cfg.edition} (changeset ${cfg.id}). ${proposed}` +
        (compound === null ? '' : ` Components: ${compound.parts.join(' + ')}.`) +
        (said.length > 0 ? ` ${said.join(' ')}` : '') +
        (e.tier === undefined ? '' : ` Tier ${String(e.tier)} in the patch.`),
    });
    const ruling =
      compound?.title === true ? '3.0:G131' : e.headword === 'rinbakrono' ? '3.0:G139' : undefined;
    ops.push(
      rec(
        compound === null ? 'add_root' : 'add_compound',
        id,
        null,
        e.headword,
        ruling,
        say(
          `${glosses.root ?? ''}${compound === null ? '' : `: ${compound.parts.join(' + ')}`} (domain ${e.domain})`,
        ),
        { slot: 'root' },
      ),
    );
  };
  for (const r of patch.roots_add) entry(r, null);
  for (const c of patch.compounds_add) entry(c, c);

  // 4. restored forms: an empty slot of a 2.5 headword gets a meaning (0.8:R2)
  for (const r of patch.restored_forms_add) {
    const h = byRoot.get(r.headword);
    const slot = SLOT[r.slot];
    if (h === undefined || slot === undefined) {
      problems.push(
        `restored ${r.form}: no ${cfg.previous} headword ${r.headword} with slot ${r.slot}`,
      );
      continue;
    }
    const raw = SLOT_RAW_KEY[slot];
    if (h.forms[raw] !== r.form)
      problems.push(`restored ${r.form}: ${r.headword}'s ${raw} is ${String(h.forms[raw])}`);
    if (h.glosses[raw] !== UNUSED)
      problems.push(`restored ${r.form}: the slot is already "${String(h.glosses[raw])}"`);
    ops.push(
      rec(
        'activate_slot',
        h.id,
        UNUSED,
        r.meaning,
        '0.8:R2',
        `${say(`${r.form}, "${r.meaning}", restored on ${r.headword}`)} ${proposed}`,
        { slot },
      ),
    );
  }

  // 5. listed derivations and the diminutive
  const idOf = (root: string): string | undefined => byRoot.get(root)?.id ?? newIds.get(root);
  const derivations: Record<string, string> = {};
  for (const d of patch.listed_derivations_add) {
    const base = idOf(d.base);
    if (base === undefined) {
      problems.push(`derivation ${d.form}: ${d.base} is not a headword`);
      continue;
    }
    if (d.base + d.suffix.replace(/^-/, '') !== d.form)
      problems.push(`derivation ${d.form}: not ${d.base} + ${d.suffix}`);
    derivations[d.form] = `${d.meaning}: ${d.base} + ${d.suffix}`;
    ops.push(
      rec(
        'add_derivation',
        `derivation:${base}:${d.suffix}`,
        null,
        d.form,
        d.meaning.includes('(epithet)') ? '3.0:G130' : undefined,
        `${say(`${d.form}, "${d.meaning}", listed`)} ${proposed}`,
      ),
    );
  }
  for (const d of patch.lexicalised_diminutives_add) {
    // the base is a headword, or a listed derivation (taradapago, tarada + -pago)
    const listed = d.base in lex.morphology.lexicalised_derivations;
    if ((idOf(d.base) === undefined && !listed) || d.base + 'ti' !== d.form)
      problems.push(`diminutive ${d.form}: not ${d.base} + -ti`);
    ops.push(
      rec(
        'edit_value',
        `value:morphology.lexicalised_diminutives.${d.form}`,
        null,
        JSON.stringify(`${d.meaning}: ${d.base} + -ti`),
        '2.5:G122',
        `${say(`${d.form}, "${d.meaning}", a lexicalised diminutive`)} ${proposed}`,
      ),
    );
  }

  // 6. README step 4: the rulings carried into the clause and the rows they change
  ops.push(...(cfg.extraOps?.(lex) ?? []));

  const changeset: LexiconChangeset = {
    id: cfg.id,
    edition: cfg.edition,
    created: cfg.at,
    author: AUTHOR,
    summary: cfg.summary(patch, lexicalised),
    rulings,
    headwords: newHeads,
    function_words: functionWords,
    lexicalised_derivations: derivations,
    ops,
  };

  // verify: everything the patch lists, as it lists it
  const built = applyChangesets(lex, [changeset], {
    version: cfg.edition,
    builtUtc: cfg.at,
    source: '',
    ids,
    wordBuilding: WORD_BUILDING_2_0,
  }).lexicon;
  const builtHeads = built.headwords as unknown as Head[];
  const builtByRoot = new Map(builtHeads.map((h) => [h.root, h]));
  for (const e of [...patch.roots_add, ...patch.compounds_add]) {
    const h = builtByRoot.get(e.headword);
    for (const [code, f] of Object.entries(e.forms)) {
      const raw = SLOT_RAW_KEY[SLOT[code] ?? 'root'];
      if (h?.forms[raw] !== f.form || h.glosses[raw] !== f.meaning)
        problems.push(`${f.form}: not built as "${f.meaning}"`);
    }
    // only the listed slots exist
    const listed = Object.keys(e.forms).length;
    const used = Object.values(h?.glosses ?? {}).filter((g) => !isUnusedGloss(g)).length;
    if (used !== listed)
      problems.push(
        `${e.headword}: ${String(used)} meaningful forms, the patch lists ${String(listed)}`,
      );
  }
  for (const r of patch.restored_forms_add) {
    const raw = SLOT_RAW_KEY[SLOT[r.slot] ?? 'root'];
    if (builtByRoot.get(r.headword)?.glosses[raw] !== r.meaning)
      problems.push(`restored ${r.form}: not glossed`);
  }
  const meaningful = builtHeads
    .flatMap((h) => Object.values(h.glosses))
    .filter((g) => !isUnusedGloss(g)).length;
  const counts = { headwords: builtHeads.length, meaningful_forms: meaningful };
  if (counts.headwords !== patch.counts.headwords_after)
    problems.push(
      `headwords: built ${String(counts.headwords)}, patch ${String(patch.counts.headwords_after)}`,
    );
  if (counts.meaningful_forms !== patch.counts.meaningful_forms_after)
    problems.push(
      `meaningful forms: built ${String(counts.meaningful_forms)}, patch ${String(patch.counts.meaningful_forms_after)}`,
    );
  if (problems.length > 0) {
    for (const p of problems) console.error(`  ${p}`);
    throw new Error(`${String(problems.length)} patch items did not build as listed`);
  }
  console.log(
    `verified: ${String(patch.roots_add.length)} roots, ${String(patch.compounds_add.length)} compounds, ` +
      `${String(patch.restored_forms_add.length)} restored forms, ${String(patch.listed_derivations_add.length)} derivations, ` +
      `${String(rulings.length)} rulings; ${JSON.stringify(counts)}; lexicalised from the pattern: ${lexicalised.join(', ')}`,
  );
  return changeset;
}

export const CONFIG_3_0: AdditionsConfig = {
  patch: PATCH,
  baseline: BASELINE,
  edition: EDITION,
  previous: '2.5',
  at: AT,
  id: ID_3_0,
  name: 'Liraasa 3.0 patch (Devotion, Music and Measure)',
  summary: (patch, lexicalised) =>
    `Liraasa 3.0, "Devotion, Music and Measure" (ADR-0021), from the author's 3.0 patch. PROPOSED: ${patch.status}. ` +
    `Additions only: rulings 3.0:G129-G141; the vocative iya; ${String(patch.roots_add.length)} roots and ${String(patch.compounds_add.length)} compounds; ` +
    `${String(patch.listed_derivations_add.length)} listed derivations and ${String(patch.lexicalised_diminutives_add.length)} lexicalised diminutive; ` +
    `${String(patch.restored_forms_add.length)} restored forms on 2.5 headwords; the clause template, its edges and the miyo, sela and gagu rows follow the rulings. No 2.5 spelling or ruling changes. ${lexicalised.length === 0 ? '' : `${lexicalised.join(', ')} were already 2.5 words, attested image compounds: each comes back as a headword with its id and takes the patch's meaning, its 2.5 reading archived (for the author's review).`}`,
  extraOps: propagationOps,
};

export const makeChangeset3_0 = (): LexiconChangeset => makeAdditionsChangeset(CONFIG_3_0);

function main(): void {
  const { booleans } = parseArgs(process.argv.slice(2), []);
  const cs = makeChangeset3_0();
  const tally = new Map<string, number>();
  for (const o of cs.ops) tally.set(o.op, (tally.get(o.op) ?? 0) + 1);
  console.log(
    `${cs.id}: ${String(cs.ops.length)} ops ${JSON.stringify(Object.fromEntries(tally))}`,
  );
  if (booleans.has('check')) return;
  writeFileSync(resolve(FILE_3_0), `${JSON.stringify(cs, null, 1)}\n`, 'utf8');
  console.log(`wrote ${FILE_3_0}`);
}

if (process.argv[1]?.endsWith('make_changeset_3_0.ts')) main();
