/**
 * One-time tool: turn the author's Liraasa 2.0 patch (liraasa_2_0_patch.json)
 * into the 2.0 changeset that `npm run integrate:2.0` applies (ADR-0016).
 *
 *   npx tsx scripts/make_changeset_2_0.ts            # write the changeset
 *   npx tsx scripts/make_changeset_2_0.ts --check    # build it, write nothing
 *
 * It follows the patch's how_to_apply, step by step, with the four decisions
 * the author made on 2026-10-18 where the patch left a choice or contradicted
 * itself (DECISIONS below). The changeset it writes is the record: every op
 * names an id, says what it replaces, and why. Like build_1_0.py, this is a
 * migration, not the editor: later changes are changeset ops of their own.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ChangeRecord } from '../src/core/change/changelog';
import type { LexiconChangeset, NewHeadword } from '../src/core/change/apply';
import { FORM_SLOTS, SLOT_RAW_KEY, isUnusedGloss, type FormSlot } from '../src/core/config/slots';
import { deriveSynonyms } from '../src/core/integrate/synonyms';
import type { RawLexicon, RawSlots } from '../src/core/model/raw';
import { parseArgs } from './args';

const PATCH = 'liraasa_2_0_patch.json';
const BASELINE = 'data/lexicon/liraasa_1_2.json';
const OUT = 'data/changes/2026-10-18-lexicon-2-0.json';
const ID = '2026-10-18-lexicon-2-0';
const EDITION = '2.0';
const AT = '2026-10-18T12:00:00Z';
const AUTHOR = 'nicolas';
const UNUSED = '— (unused)';
/** The English of the rewritten zoke example: bumresan is "baked" in 1.2. */
const BAKED = 'That is baked. (Oh, sure.)';

/** The author's answers, 2026-10-18, where the patch left a choice or contradicted itself. */
const DECISIONS = {
  amorna:
    'Author decision 2026-10-18: follow the canon fix, not the dictionary line, which still read "enemy, one who is hated" (lenra is enemy; romza now carries hatred).',
  bumreasasan:
    'Author decision 2026-10-18: rewrite the example with bumre’s listed adjective and drop the li before it (the patch’s canon fix left the choice open).',
  nesting:
    'Author decision 2026-10-18: allow a compound to take a compound as one of its two parts (2.0:G42), so the patch’s nested compounds stand.',
  ambiguity:
    'Author decision 2026-10-18: kept, though scripts/check_sounds.py finds it makes a word read two ways; the ambiguity is recorded in ADR-0016.',
};

/** Words the sound checker finds make a reading ambiguous: kept by DECISIONS.ambiguity. */
const AMBIGUOUS = new Set(['benamavo', 'kronosarbi', 'ralelira', 'sevulumi', 'sevulumibiti']);

/** Domains filed as poetic register; the patch gives none (the filing is recorded in ADR-0016). */
const POETIC_DOMAINS = new Set(['Poetry & feeling', 'Devotional', 'Spiritual', 'Cosmos & light']);

/* -------------------------------------------------------------- the patch */

interface PatchEntry1 {
  tier: string;
  form: string;
  slot: string;
  headword: string;
  gloss: string;
  why: string;
}
interface PatchEntry2 {
  word: string;
  built_from: string[];
  kind: string;
  gloss: string;
  domain: string;
  tier: string;
  note: string;
}
interface Patch {
  rule_changes: { change: string; why: string }[];
  part_1_new_forms: { tiers: Record<string, string>; entries: PatchEntry1[] };
  part_2_new_words: { entries: PatchEntry2[] };
  dictionary_lines: {
    updated_existing: Record<string, string>;
    new_headwords: Record<string, string>;
    demoted_to_pattern: { headwords: string[] };
  };
  new_lexicalised_derivations: Record<string, string>;
  lexicalised_derivation_updates: Record<string, string>;
  reglosses: {
    entries: { form: string; headword: string; old_gloss: string; new_gloss: string }[];
  };
  sense_additions: { entries: { form: string; headword: string; was: string; adds: string }[] };
  differentiations: { entries: { form: string; headword: string; was: string; now: string }[] };
  canon_fixes: { form?: string; where: string; issue: string; fix?: string }[];
  new_roots: { roots: Record<string, string> };
  pattern_compounds: {
    name: string;
    rule: string;
    why: string;
    modifiers: Record<string, { root_meaning: string; as_modifier: string; sense: string }>;
    heads: Record<string, { root_meaning: string; template: string }>;
    capacity: number;
    kept_as_headwords: Record<string, string>;
  };
  derivation_defaults: Record<string, string>;
  reserved_root_bank: Record<string, unknown>;
}

const ABBR: Readonly<Record<string, string>> = {
  n: 'root',
  an: 'ascended',
  nn: 'negative',
  v: 'verb',
  na: 'negative_adjective',
  a: 'adjective',
  aa: 'ascended_adjective',
};
const RAW_KEYS = FORM_SLOTS.map((s) => SLOT_RAW_KEY[s]);
const slotOf = (rawKey: string): FormSlot => {
  const slot = FORM_SLOTS.find((s) => SLOT_RAW_KEY[s] === rawKey);
  if (slot === undefined) throw new Error(`no slot ${rawKey}`);
  return slot;
};

/** A dictionary line: `head [a+b] {new in 2.0}: (n) gloss | form (abbr) gloss | …` → raw key → gloss. */
function parseLine(line: string): {
  head: string;
  parts: string[] | null;
  glosses: Record<string, string>;
} {
  const m = /^([a-z-]+)(?: \[([^\]]+)\])?(?: \{[^}]+\})?: (.*)$/.exec(line);
  if (m === null) throw new Error(`line does not parse: ${line}`);
  const [, head = '', parts, body = ''] = m;
  const glosses: Record<string, string> = {};
  body.split(' | ').forEach((piece, i) => {
    const mm =
      i === 0 ? /^\(([a-z]+)\) (.*)$/.exec(piece) : /^[a-z-]+ \(([a-z]+)\) (.*)$/.exec(piece);
    const key = ABBR[mm?.[1] ?? ''];
    if (mm === null || key === undefined) throw new Error(`${head}: cannot read "${piece}"`);
    glosses[key] = mm[2] ?? '';
  });
  return {
    head,
    parts: parts === undefined ? null : parts.split('+').map((x) => x.trim()),
    glosses,
  };
}

/* ------------------------------------------------------------------- build */

function main(): void {
  const { booleans } = parseArgs(process.argv.slice(2), []);
  const patch = JSON.parse(readFileSync(resolve(PATCH), 'utf8')) as Patch;
  const lex = JSON.parse(readFileSync(resolve(BASELINE), 'utf8')) as RawLexicon;
  interface Head {
    id: string;
    root: string;
    type: string;
    components: string[] | null;
    forms: Record<string, string>;
    glosses: Record<string, string>;
  }
  const heads = lex.headwords as unknown as Head[];
  const byRoot = new Map(heads.map((h) => [h.root, h]));
  const p2 = new Map(patch.part_2_new_words.entries.map((e) => [e.word, e]));

  // ids: each kind continues after the highest number in 1.2 (ADR-0016)
  let nextHeadword = Math.max(...heads.map((h) => Number(h.id.split('_').pop()))) + 1;
  const mint = (root: string): string => `lx_${root}_${String(nextHeadword++).padStart(4, '0')}`;
  const idOf = new Map<string, string>(heads.map((h) => [h.root, h.id]));

  const ops: ChangeRecord[] = [];
  const op = (o: Omit<ChangeRecord, 'addedIn' | 'at' | 'author'>): void => {
    ops.push({ ...o, addedIn: EDITION, at: AT, author: AUTHOR });
  };

  /* 1b. the rulings (rule_changes), plus the nesting the author allowed */
  const rc = patch.rule_changes;
  const rulings = [
    {
      id: 'G37',
      topic: 'Two declared one-edit pairs',
      ruling: rc[0]?.change ?? '',
      why: rc[0]?.why ?? '',
    },
    {
      id: 'G38',
      topic: 'Colour bases in compounds; compounds lexicalised with -ti',
      ruling: rc[1]?.change ?? '',
      why: rc[1]?.why ?? '',
    },
    {
      id: 'G39',
      topic: 'Gold and silver as headwords',
      ruling: rc[2]?.change ?? '',
      why: rc[2]?.why ?? '',
    },
    { id: 'G40', topic: 'Image compounds', ruling: rc[3]?.change ?? '', why: rc[3]?.why ?? '' },
    {
      id: 'G41',
      topic: 'Productive derivations',
      ruling: rc[4]?.change ?? '',
      why: rc[4]?.why ?? '',
    },
    {
      id: 'G42',
      topic: 'Nested compounds',
      ruling:
        'A compound may take a compound as one of its two parts: MODIFIER + HEAD still joins exactly two headwords, either of which may itself be a compound (larbopago + safa = larbopagosafa). 1.2 avoided nesting; 2.0 allows it.',
      why: DECISIONS.nesting,
    },
  ];
  for (const r of rulings) {
    op({ entry: `2.0:${r.id}`, op: 'add_ruling', from: null, to: r.topic, reason: r.why });
  }
  for (const pair of [
    ['devo', 'devi'],
    ['nevi', 'devi'],
  ]) {
    op({
      entry: 'phonology.declared_distance_1_pairs',
      op: 'edit_metadata',
      slot: 'metadata',
      field: 'declared_distance_1_pairs',
      from: null,
      to: JSON.stringify(pair),
      ruling: '2.0:G37',
      reason: `${pair.join(' / ')}: declared one-edit pair (2.0:G37).`,
    });
  }

  /* the sections: the image-compound pattern, the derivation defaults, the root bank */
  const pc = patch.pattern_compounds;
  const byIdOrThrow = (sp: string): string => {
    const id = idOf.get(sp);
    if (id === undefined) throw new Error(`pattern: ${sp} is not a 1.2 headword`);
    return id;
  };
  const sections: Record<string, unknown> = {
    image_compounds: {
      name: pc.name,
      ruling: '2.0:G40',
      rule: pc.rule,
      why: pc.why,
      capacity: pc.capacity,
      modifiers: Object.fromEntries(
        Object.entries(pc.modifiers).map(([sp, m]) => [
          byIdOrThrow(sp),
          { as_modifier: m.as_modifier, sense: m.sense },
        ]),
      ),
      heads: Object.fromEntries(
        Object.entries(pc.heads).map(([sp, h]) => [byIdOrThrow(sp), { template: h.template }]),
      ),
      kept_as_headwords: Object.fromEntries(
        Object.entries(pc.kept_as_headwords).map(([sp, note]) => [byIdOrThrow(sp), note]),
      ),
      attested: [],
    },
    'morphology.derivation_defaults': { ruling: '2.0:G41', ...patch.derivation_defaults },
    reserved_root_bank: patch.reserved_root_bank,
  };
  op({
    entry: 'image_compounds',
    op: 'add_section',
    from: null,
    to: 'image compounds (2.0:G40)',
    ruling: '2.0:G40',
    reason: 'The pattern that replaces 391 template headwords (patch step 7).',
  });
  op({
    entry: 'morphology.derivation_defaults',
    op: 'add_section',
    from: null,
    to: 'default readings of -yo, -vu, -pago, -ti',
    ruling: '2.0:G41',
    reason:
      'Derivations are productive with these default readings; listed ones keep their fixed meaning (2.0:G41).',
  });
  op({
    entry: 'reserved_root_bank',
    op: 'add_section',
    from: null,
    to: 'reserved root bank',
    reason:
      'Short roots kept for future concepts. Unassigned: not part of the language until given a meaning (patch reserved_root_bank).',
  });

  /* rivla is reclaimed: its reservation ran until 2.0 */
  op({
    entry: 'ledger:rivla',
    op: 'edit_ledger',
    from: 'RECLAIMED-RESERVED',
    to: 'REUSED',
    reason:
      'rivla (retired 1.0, replaced by mirunulu) was reserved until 2.0; 2.0 reuses it as the root "flow; current". 0.8 texts still resolve through legacy.migration_forms.',
  });

  /* 3–4. new headwords, in dependency order */
  const newLines = Object.entries(patch.dictionary_lines.new_headwords).map(([w, l]) => ({
    w,
    ...parseLine(l),
  }));
  const headwordPayloads: NewHeadword[] = [];
  const pending = new Map(newLines.map((x) => [x.w, x]));
  const colourBases = new Set(
    (lex.colors as unknown as Record<string, unknown>[]).map((c) => String(c['Base color'])),
  );
  while (pending.size > 0) {
    const before = pending.size;
    for (const [w, line] of [...pending]) {
      const e = p2.get(w);
      if (e === undefined) throw new Error(`${w}: a dictionary line with no part_2 entry`);
      let parts = line.parts;
      let suffix: string | undefined;
      if (parts !== null && parts.length === 3 && parts[2]?.startsWith('-')) {
        suffix = parts[2].slice(1);
        parts = parts.slice(0, 2);
      }
      // a part is not added yet: come back to it on a later pass
      if (parts?.some((p) => !idOf.has(p) && !colourBases.has(p))) continue;
      pending.delete(w);
      const glosses = Object.fromEntries(
        RAW_KEYS.map((k) => [k, line.glosses[k] ?? UNUSED]),
      ) as unknown as RawSlots;
      const id = mint(w);
      idOf.set(w, id);
      const kind = e.kind === 'new root' ? 'add_root' : 'add_compound';
      headwordPayloads.push({
        id,
        root: w,
        type: kind === 'add_root' ? 'Primal' : 'Compound',
        components: parts === null ? null : (parts as [string, string]),
        ...(suffix !== undefined ? { suffix } : {}),
        glosses,
        register: POETIC_DOMAINS.has(e.domain) ? 'poetic' : 'everyday',
        domain: e.domain,
        english_synonyms: deriveSynonyms(glosses),
        notes: `Added in 2.0 (changeset ${ID}). Tier ${e.tier}${e.note ? `: ${e.note}` : ''}.`,
      });
      const ruling =
        e.kind === 'promoted colour word'
          ? '2.0:G39'
          : e.kind.includes('colour') || suffix !== undefined
            ? '2.0:G38'
            : parts?.some(
                  (p) =>
                    byRoot.get(p)?.type === 'Compound' || p2.get(p)?.kind.startsWith('compound'),
                )
              ? '2.0:G42'
              : undefined;
      const reasons = [
        `${e.gloss}: ${kind === 'add_root' ? 'new root' : `${(parts ?? []).join(' + ')}${suffix ? ` + -${suffix}` : ''}`} (patch tier ${e.tier}, domain ${e.domain}).`,
        ruling === '2.0:G42' ? DECISIONS.nesting : '',
        AMBIGUOUS.has(w) ? DECISIONS.ambiguity : '',
        w === 'rivla' ? 'Reuses the spelling reserved until 2.0 (sound_ledger).' : '',
      ].filter((r) => r !== '');
      op({
        entry: id,
        op: kind,
        from: null,
        to: w,
        ...(ruling ? { ruling } : {}),
        reason: reasons.join(' '),
      });
    }
    if (pending.size === before) throw new Error(`cannot place: ${[...pending.keys()].join(', ')}`);
  }

  /* 1, 3, 3b, 3c. glosses of existing headwords: the dictionary lines, with the canon fix for amorna */
  const sources = new Map<string, string[]>();
  const note = (hw: string, key: string, text: string): void => {
    const k = `${hw}|${key}`;
    sources.set(k, [...(sources.get(k) ?? []), text]);
  };
  const SLOTNAME: Readonly<Record<string, string>> = {
    noun: 'root',
    'ascended noun': 'ascended',
    'negative noun': 'negative',
    verb: 'verb',
    'negative adjective': 'negative_adjective',
    adjective: 'adjective',
    'ascended adjective': 'ascended_adjective',
  };
  for (const e of patch.part_1_new_forms.entries) {
    note(
      e.headword,
      SLOTNAME[e.slot] ?? e.slot,
      `Tier ${e.tier} (${patch.part_1_new_forms.tiers[e.tier] ?? 'closes a literary gap'}): ${e.why}`,
    );
  }
  const keyOf = (hw: string, form: string): string | undefined => {
    const h = byRoot.get(hw);
    return h === undefined ? undefined : RAW_KEYS.find((k) => h.forms[k] === form);
  };
  for (const e of patch.reglosses.entries)
    note(
      e.headword,
      keyOf(e.headword, e.form) ?? '',
      `Regloss: an ascended adjective that shared an empty gloss now matches its own ascended noun.`,
    );
  for (const e of patch.differentiations.entries)
    note(
      e.headword,
      keyOf(e.headword, e.form) ?? '',
      `Differentiation: one of several words that carried "${e.was}" now carries its own shade.`,
    );
  for (const e of patch.sense_additions.entries)
    note(
      e.headword,
      keyOf(e.headword, e.form) ?? '',
      `Sense addition: "${e.adds}" is a meaning the word already had under a narrower English gloss.`,
    );
  const archiveKinds = /^(Regloss|Differentiation)/;

  for (const [hw, lineText] of Object.entries(patch.dictionary_lines.updated_existing)) {
    const h = byRoot.get(hw);
    if (h === undefined) throw new Error(`${hw}: not a 1.2 headword`);
    const line = parseLine(lineText);
    for (const k of RAW_KEYS) {
      const from = h.glosses[k] ?? UNUSED;
      let to = line.glosses[k] ?? UNUSED;
      let why = sources.get(`${hw}|${k}`) ?? [];
      if (hw === 'amor' && k === 'negative') {
        to = 'lovelessness; the absence of love';
        why = [`Canon fix: amorna duplicated lenra (enemy). ${DECISIONS.amorna}`];
      }
      if (hw === 'amor' && k === 'negative_adjective')
        why = [...why, 'Canon fix: with romza for hatred, amornasan is the lack of love.'];
      if (to === from) continue;
      if (isUnusedGloss(to)) throw new Error(`${hw} ${k}: the line drops a meaningful gloss`);
      if (why.length === 0)
        throw new Error(`${hw} ${k}: no section of the patch accounts for "${from}" → "${to}"`);
      const activating = isUnusedGloss(from);
      op({
        entry: h.id,
        op: activating ? 'activate_slot' : 'edit_gloss',
        slot: slotOf(k),
        from,
        to,
        ...(activating ? { ruling: '0.8:R2' } : {}),
        ...(!activating &&
        (why.some((w) => archiveKinds.test(w)) || (hw === 'amor' && k === 'negative'))
          ? { archive: true }
          : {}),
        reason: why.join(' '),
      });
    }
  }

  /* 5. new lexicalised derivations, and the five updated ones */
  const derivationEntry = (base: string, suffix: string): string => {
    const id = idOf.get(base);
    if (id !== undefined) return `derivation:${id}:-${suffix}`;
    if (base in lex.morphology.lexicalised_derivations || base in patch.new_lexicalised_derivations)
      return `derivation:lexicalised:${base}:-${suffix}`;
    throw new Error(`derivation base ${base} is neither a headword nor a derivation`);
  };
  const parseDerivation = (text: string): { base: string; suffix: string } => {
    const m = /: ([a-z]+) \+ -([a-z]+)$/.exec(text);
    if (m === null) throw new Error(`derivation text "${text}"`);
    return { base: m[1] ?? '', suffix: m[2] ?? '' };
  };
  // derivations on a derivation go after their base
  const derivs = Object.entries(patch.new_lexicalised_derivations).sort(([, a], [, b]) => {
    const da = parseDerivation(a).base in patch.new_lexicalised_derivations ? 1 : 0;
    const db = parseDerivation(b).base in patch.new_lexicalised_derivations ? 1 : 0;
    return da - db;
  });
  for (const [word, text] of derivs) {
    const { base, suffix } = parseDerivation(text);
    const e = p2.get(word);
    op({
      entry: derivationEntry(base, suffix),
      op: 'add_derivation',
      from: null,
      to: word,
      ruling: '2.0:G41',
      reason: `${text}. Listed so it keeps this fixed meaning over the default reading (2.0:G41)${e ? `; patch tier ${e.tier}` : ''}.`,
    });
  }
  for (const [word, text] of Object.entries(patch.lexicalised_derivation_updates)) {
    const { base, suffix } = parseDerivation(text);
    const from = lex.morphology.lexicalised_derivations[word];
    if (from === undefined) throw new Error(`${word}: not lexicalised in 1.2`);
    op({
      entry: derivationEntry(base, suffix),
      op: 'edit_derivation',
      from,
      to: text,
      reason: 'Sense addition on a lexicalised derivation (patch lexicalised_derivation_updates).',
    });
  }

  /* 1. canon fixes in examples */
  const exIndex = lex.examples.findIndex((x) => x.liraasa === 'Ola ka li bumreasasan, zoke.');
  if (exIndex < 0) throw new Error('the bumreasasan example moved');
  op({
    entry: `example:${String(exIndex)}`,
    op: 'edit_example',
    from: 'Ola ka li bumreasasan, zoke.',
    to: 'Ola ka bumresan, zoke.',
    reason: `Canon fix: bumre has no ascended adjective. ${DECISIONS.bumreasasan}`,
  });
  const exEnglish = lex.examples[exIndex]?.english ?? '';
  op({
    entry: `example:${String(exIndex)}`,
    op: 'edit_example',
    field: 'english',
    from: exEnglish,
    to: BAKED,
    reason: 'The English follows the rewritten line: bumresan is "baked".',
  });
  const particle = (form: string): { id: string; examples: { liraasa: string }[] } => {
    const d = (
      lex.discourse_particles as unknown as {
        id: string;
        form: string;
        examples: { liraasa: string }[];
      }[]
    ).find((x) => x.form === form);
    if (d === undefined) throw new Error(`no particle ${form}`);
    return d;
  };
  const fixes: [string, string, string, string][] = [
    [
      'zoke',
      'Ola ka li bumreasasan, zoke.',
      'Ola ka bumresan, zoke.',
      `Canon fix: bumre has no ascended adjective. ${DECISIONS.bumreasasan}`,
    ],
    [
      'zoke',
      'Taivo ka ruli pamlonasan, zoke. — Ne zoke. Vera.',
      'Taivo ka ruli sulnosovenasan, zoke. — Ne zoke. Vera.',
      'Canon fix: pamlo is not a root; sulnosovenasan already means impatient. Only the word is replaced; the reply that follows is kept.',
    ],
    [
      'hema',
      'Maivo vurlova, hema, baba cupa de miru.',
      'Maivo vurlova, hema, baba buvokova de miru.',
      'Canon fix: cupa is not a word; buvokova already means cup.',
    ],
  ];
  for (const [form, from, to, reason] of fixes) {
    const d = particle(form) as { id: string; examples: { liraasa: string; english?: string }[] };
    const i = d.examples.findIndex((x) => x.liraasa === from);
    if (i < 0) throw new Error(`${form}: example "${from}" not found`);
    op({ entry: `particle:${d.id}:${String(i)}`, op: 'edit_particle_example', from, to, reason });
    if (from.includes('bumreasasan')) {
      op({
        entry: `particle:${d.id}:${String(i)}`,
        op: 'edit_particle_example',
        field: 'english',
        from: d.examples[i]?.english ?? '',
        to: BAKED,
        reason: 'The English follows the rewritten line: bumresan is "baked".',
      });
    }
  }

  /* 7. the template headwords move into the pattern, last, once nothing new builds on them */
  const kept = new Set(Object.keys(pc.kept_as_headwords));
  for (const w of patch.dictionary_lines.demoted_to_pattern.headwords) {
    if (kept.has(w)) throw new Error(`${w}: both kept and demoted`);
    const h = byRoot.get(w);
    if (h === undefined) throw new Error(`${w}: not a 1.2 headword`);
    op({
      entry: h.id,
      op: 'move_to_pattern',
      from: w,
      to: 'image_compounds.attested',
      ruling: '2.0:G40',
      reason: `${h.components?.join(' + ') ?? ''}: an instance of the image-compound pattern; kept whole, with its id and gloss, as an attested example (patch step 7).`,
    });
  }

  const changeset: LexiconChangeset = {
    id: ID,
    edition: EDITION,
    created: AT,
    author: AUTHOR,
    summary:
      `Liraasa 2.0 (ADR-0016), from the author's patch "Liraasa 2.0: the great lexicon expansion": rulings 2.0:G37–G42 (word-building only; no clause, order or inflection rule changes), ` +
      `${String(headwordPayloads.filter((h) => h.type === 'Primal').length)} roots and ${String(headwordPayloads.filter((h) => h.type === 'Compound').length)} compounds, ` +
      `${String(ops.filter((o) => o.op === 'activate_slot').length)} slots activated, ${String(ops.filter((o) => o.op === 'edit_gloss').length)} glosses edited, ` +
      `${String(ops.filter((o) => o.op === 'add_derivation').length)} lexicalised derivations, ${String(ops.filter((o) => o.op === 'move_to_pattern').length)} template headwords moved into the image-compound pattern.`,
    rulings: rulings.map(({ why: _why, ...r }) => ({ ...r, refines: [], examples: [] })),
    headwords: headwordPayloads,
    lexicalised_derivations: Object.fromEntries(derivs),
    sections,
    ops,
  };
  const counts = new Map<string, number>();
  for (const o of ops) counts.set(o.op, (counts.get(o.op) ?? 0) + 1);
  console.log(`${String(ops.length)} ops`);
  for (const [k, v] of counts) console.log(`  ${k.padEnd(22)} ${String(v)}`);
  if (booleans.has('check')) return;
  writeFileSync(resolve(OUT), `${JSON.stringify(changeset, null, 1)}\n`, 'utf8');
  console.log(`wrote ${OUT}`);
}

main();
