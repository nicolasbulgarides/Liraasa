/**
 * Respelling and retiring a root (SPEC §7 Root Lab; Learn Phase 5).
 *
 * The author decides the spelling; this only checks it and carries it
 * through. A respelling:
 *   - checks the new spelling against `phonology.new_root_template` and for
 *     collisions with every existing form (the template's own words: two
 *     syllables, consonant-initial, vowel-final, inventory letters, no
 *     initial cluster but the grandfathered ones, no three-consonant cluster,
 *     no doubled letter, at least two edits from every active word);
 *   - regenerates the root's seven forms by the verb rule, and those of every
 *     compound built on it, nested ones too, keeping each entry's key order
 *     (ADR-0002);
 *   - records the old spellings in `legacy` so old texts stay readable
 *     (ruling 1.0:G19), and migrates the lexicon's own example sentences;
 *   - rebuilds the rhyme families.
 * Retiring a root in favour of an existing compound records it in
 * `legacy.retired_roots` with the replacement, maps each old form to the
 * replacement's form in the same slot, and migrates the examples.
 *
 * Ids never change: progress, overrides and lessons keyed by id follow.
 */
import { FORM_SLOTS, SLOT_RAW_KEY, type FormSlot } from '../config/slots';
import type { RawHeadword, RawLexicon, RawRuling } from '../model/raw';
import { sevenForms, verbClassOf } from '../morphology/sevenForms';
import { rhymeFamilies } from './apply';

export interface RespellImpact {
  /** Old form → new form, for the root and every compound that moves. */
  forms: Record<string, string>;
  compounds: { id: string; from: string; to: string }[];
  /** The verb class changes when the first letter's class changes. */
  verbClass: { from: string; to: string } | null;
  /** Example sentences whose text changes. */
  examples: { from: string; to: string }[];
}

export type RespellResult =
  | { ok: true; lexicon: RawLexicon; impact: RespellImpact }
  | { ok: false; problems: string[] };

interface Phonology {
  vowels?: string;
  consonants_core?: string;
  consonants_other?: string;
  new_root_template?: string;
  declared_distance_1_pairs?: [string, string][];
}

type Head = Omit<RawHeadword, 'forms' | 'components' | 'root'> & {
  id?: string;
  root: string;
  components: string[] | null;
  forms: Record<string, string>;
};

/* -------------------------------------------------------- the template */

/** Single letters listed in a phonology string, before any parenthetical note. */
const lettersOf = (text = ''): string[] => (text.split('(')[0] ?? '').match(/\b[a-z]\b/g) ?? [];
const NUMBERS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 };

/** Problems with a proposed root spelling, in the words of the data's own template. */
export function rootTemplateProblems(lex: RawLexicon, spelling: string): string[] {
  const p = lex.phonology as Phonology;
  const template = p.new_root_template ?? '';
  const vowels = new Set(lettersOf(p.vowels));
  const consonants = new Set([...lettersOf(p.consonants_core), ...lettersOf(p.consonants_other)]);
  const grandfathered = [...template.matchAll(/\b([a-z]{2})-/g)].map((m) => m[1] ?? '');
  const syllables = NUMBERS[/(\w+) syllables?/.exec(template)?.[1] ?? ''];
  const w = spelling;
  const out: string[] = [];
  if (!/^[a-z]+$/.test(w)) return ['lowercase letters only'];
  const outside = [...w].filter((c) => !vowels.has(c) && !consonants.has(c));
  if (outside.length > 0)
    out.push(`letters outside the inventory: ${[...new Set(outside)].join(' ')}`);
  if (vowels.has(w[0] ?? '')) out.push('must begin with a consonant');
  if (!vowels.has(w[w.length - 1] ?? '')) out.push('must end with a vowel');
  const count = [...w].filter((c) => vowels.has(c)).length; // adjacent vowels are separate syllables
  if (syllables !== undefined && count !== syllables)
    out.push(`${String(count)} syllable(s), the template wants ${String(syllables)}`);
  if (!vowels.has(w[1] ?? '') && !grandfathered.includes(w.slice(0, 2)))
    out.push(`initial cluster ${w.slice(0, 2)}`);
  for (let i = 0; i + 2 < w.length; i += 1) {
    if (![...w.slice(i, i + 3)].some((c) => vowels.has(c)))
      out.push(`three-consonant cluster ${w.slice(i, i + 3)}`);
  }
  for (let i = 0; i + 1 < w.length; i += 1)
    if (w[i] === w[i + 1]) out.push(`doubled letter ${w.slice(i, i + 2)}`);
  return out;
}

const distance = (a: string, b: string): number => {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diag = prev[0] ?? 0;
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const up = prev[j] ?? 0;
      prev[j] = Math.min(up + 1, (prev[j - 1] ?? 0) + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length] ?? 0;
};

/** Every spelling the lexicon uses, with what uses it. */
function spellings(lex: RawLexicon, skip: ReadonlySet<string>): Map<string, string> {
  const out = new Map<string, string>();
  for (const h of lex.headwords as unknown as Head[]) {
    if (skip.has(String(h.id))) continue;
    for (const f of Object.values(h.forms)) out.set(f, `a form of ${h.root}`);
  }
  for (const [section, key] of [
    ['function_words', 'form'],
    ['pronouns', 'form'],
    ['correlatives', 'form'],
    ['time_and_dates', 'form'],
    ['discourse_particles', 'form'],
  ] as const) {
    for (const row of lex[section] as unknown as Record<string, unknown>[]) {
      const v = row[key];
      if (typeof v === 'string') out.set(v, `a ${section.replace(/_/g, ' ')} entry`);
    }
  }
  for (const n of Object.values(lex.numbers.lookup_0_999)) out.set(n, 'a number');
  return out;
}

/* ------------------------------------------------------------ helpers */

/** Regenerate forms in the entry's own key order (ADR-0002). */
function regenerate(h: Head): void {
  const forms = sevenForms(h.root);
  const out: Record<string, string> = {};
  const keyOf = new Map<string, FormSlot>(FORM_SLOTS.map((s) => [SLOT_RAW_KEY[s], s]));
  for (const key of Object.keys(h.forms)) {
    const slot = keyOf.get(key);
    out[key] = slot !== undefined ? forms[slot] : (h.forms[key] ?? '');
  }
  h.forms = out;
}

const WORD = /[A-Za-z]+(?:-[A-Za-z]+)*/g;

/**
 * Replace old spellings in a text: whole words, a `-ri` / `-ti` ending kept,
 * a capital kept. Returns the text and how many words changed.
 */
export function correctText(
  text: string,
  mapping: Readonly<Record<string, string>>,
): { text: string; changed: number } {
  let changed = 0;
  const out = text.replace(WORD, (word) => {
    const lower = word.toLowerCase();
    let hit: string | undefined;
    let rest = '';
    if (mapping[lower] !== undefined) hit = mapping[lower];
    else {
      for (const suffix of ['tiri', 'ri', 'ti']) {
        const stem = lower.slice(0, -suffix.length);
        if (lower.endsWith(suffix) && mapping[stem] !== undefined) {
          hit = mapping[stem];
          rest = suffix;
          break;
        }
      }
    }
    if (hit === undefined) return word;
    changed += 1;
    const next = hit + rest;
    return /^[A-Z]/.test(word) ? next.charAt(0).toUpperCase() + next.slice(1) : next;
  });
  return { text: out, changed };
}

/**
 * Rewrite the lexicon's own living text: example sentences, every edition's
 * rulings (text and examples), function-word and particle examples, headword
 * notes, the curated motion metaphors and the image-compound notes. Historical
 * records (`history_0_8`, `legacy`, the 0.8 snapshot, the 1.0 changelog) keep
 * the spellings of their time.
 */
function migrateExamples(
  lex: RawLexicon,
  mapping: Readonly<Record<string, string>>,
): { from: string; to: string }[] {
  const changes: { from: string; to: string }[] = [];
  const fix = (s: string): string => {
    const r = correctText(s, mapping);
    if (r.changed > 0) changes.push({ from: s, to: r.text });
    return r.text;
  };
  for (const e of lex.examples) {
    e.liraasa = fix(e.liraasa);
    // a vocabulary tag names the word it shows: `vocab:pomlileto`
    if (e.feature.startsWith('vocab:')) e.feature = correctText(e.feature, mapping).text;
  }
  const rulings = Object.entries(lex)
    .filter(([k]) => k.startsWith('rulings_'))
    .flatMap(([, v]) => (Array.isArray(v) ? (v as RawRuling[]) : []));
  for (const r of rulings) {
    r.ruling = fix(r.ruling);
    const ex = r.examples;
    if (Array.isArray(ex))
      r.examples = ex.map((pair: unknown) =>
        Array.isArray(pair) ? [fix(String(pair[0])), pair[1]] : pair,
      );
  }
  for (const w of lex.function_words as unknown as { example?: string; examples?: unknown[] }[]) {
    if (typeof w.example === 'string') w.example = fix(w.example);
    if (Array.isArray(w.examples))
      w.examples = w.examples.map((pair) =>
        Array.isArray(pair) ? [fix(String(pair[0])), pair[1]] : pair,
      );
  }
  for (const d of lex.discourse_particles as unknown as { examples?: { liraasa: string }[] }[]) {
    for (const e of d.examples ?? []) e.liraasa = fix(e.liraasa);
  }
  const notes = [
    ...(lex.headwords as unknown as { notes?: unknown }[]),
    ...((lex.image_compounds?.attested ?? []) as unknown as { notes?: unknown }[]),
  ];
  for (const h of notes) if (typeof h.notes === 'string') h.notes = fix(h.notes);
  const canon = lex.motion_prefixes.canon;
  for (const k of Object.keys(canon)) canon[k] = fix(canon[k] ?? '');
  const kept = lex.image_compounds?.kept_as_headwords ?? {};
  for (const k of Object.keys(kept)) kept[k] = fix(kept[k] ?? '');
  return changes;
}

interface LegacyRows {
  respelled_roots: Record<string, unknown>[];
  retired_roots: Record<string, unknown>[];
  migration_forms: Record<string, { to: string; slot: string; via: string; kind: string }>;
}

/** Point old forms at new ones, and earlier migrations that led to an old form on to the new one. */
function recordMigration(
  lex: RawLexicon,
  mapping: Readonly<Record<string, string>>,
  slots: Readonly<Record<string, string>>,
  via: string,
  kind: string,
): void {
  const legacy = lex.legacy as unknown as LegacyRows;
  for (const [key, row] of Object.entries(legacy.migration_forms)) {
    const next = mapping[row.to];
    if (next === undefined) continue;
    // a respelling undone (2.2: puzu → silro) leads a spelling back to itself: it is live again
    if (next === key) Reflect.deleteProperty(legacy.migration_forms, key);
    else row.to = next;
  }
  for (const [from, to] of Object.entries(mapping)) {
    legacy.migration_forms[from] = { to, slot: slots[from] ?? 'root', via, kind };
  }
}

/* ------------------------------------------------------------ respell */

/** A compound's spelling: its parts joined, then its lexicalising suffix if any (2.0:G38). */
const spellingOf = (c: Head & { suffix?: string }): string =>
  (c.components ?? []).join('') + (c.suffix ?? '');

/**
 * Lexicalised derivations whose base moved: the key is respelled in place
 * (the table keeps its order) and the base in its gloss line, which ends
 * `: <base> + -<suffix>`, follows (2.1:G58).
 */
function respellDerivations(
  lex: RawLexicon,
  renamed: ReadonlyMap<string, string>,
  mapping: Record<string, string>,
  slots: Record<string, string>,
): void {
  const table = lex.morphology.lexicalised_derivations;
  let moved = false;
  const next: Record<string, string> = {};
  for (const [word, gloss] of Object.entries(table)) {
    const m = /^(.*): ([a-z]+) \+ -([a-z]+)$/.exec(gloss);
    const base = m?.[2] ?? '';
    const to = renamed.get(base);
    if (m === null || to === undefined || word !== base + (m[3] ?? '')) {
      next[word] = gloss;
      continue;
    }
    const spelling = to + (m[3] ?? '');
    next[spelling] = `${m[1] ?? ''}: ${to} + -${m[3] ?? ''}`;
    mapping[word] = spelling;
    slots[word] = 'derivation';
    moved = true;
  }
  if (moved) lex.morphology.lexicalised_derivations = next;
}

/**
 * Move a primal root to a new spelling, or into a compound of two existing
 * headwords, and carry every compound, attested image compound and listed
 * derivation built on it (2.1:G58). Ids never change.
 */
function moveRoot(
  lex: RawLexicon,
  id: string,
  spelling: string,
  components: [string, string] | null,
  reason: string,
): RespellImpact {
  const heads = lex.headwords as unknown as Head[];
  const h = heads.find((x) => String(x.id) === id);
  if (h === undefined) throw new Error(`${id}: no headword has this id`);
  if (h.components !== null) throw new Error(`${h.root} is a compound: respell its parts`);
  if (components !== null) {
    if (components.join('') !== spelling)
      throw new Error(`${spelling} is not ${components.join(' + ')} joined`);
    for (const part of components) {
      if (part === h.root || !heads.some((x) => x.root === part))
        throw new Error(`${spelling}: component ${part} is not a headword`);
    }
  }
  const old = h.root;
  const oldForms = { ...h.forms };
  const mapping: Record<string, string> = {};
  const slots: Record<string, string> = {};

  h.root = spelling;
  if (components !== null) {
    h.type = 'Compound';
    h.components = [...components];
  }
  regenerate(h);
  for (const [k, f] of Object.entries(oldForms)) {
    const next = h.forms[k];
    if (next !== undefined && next !== f) {
      mapping[f] = next;
      slots[f] = k;
    }
  }

  // every compound built on it, to any depth, and the attested image compounds
  const attested = (lex.image_compounds?.attested ?? []) as unknown as Head[];
  const compounds: RespellImpact['compounds'] = [];
  const renamed = new Map([[old, spelling]]);
  let moved = true;
  while (moved) {
    moved = false;
    for (const c of [...heads, ...attested]) {
      if (!c.components?.some((p) => renamed.has(p))) continue;
      const before = c.root;
      const beforeForms = { ...c.forms };
      c.components = c.components.map((p) => renamed.get(p) ?? p);
      c.root = spellingOf(c);
      if (c.root === before) continue;
      regenerate(c);
      renamed.set(before, c.root);
      compounds.push({ id: String(c.id), from: before, to: c.root });
      for (const [k, f] of Object.entries(beforeForms)) {
        const next = c.forms[k];
        if (next !== undefined && next !== f) {
          mapping[f] = next;
          slots[f] = k;
        }
      }
      moved = true;
    }
  }
  respellDerivations(lex, renamed, mapping, slots);

  const legacy = lex.legacy as unknown as LegacyRows;
  // restoring a spelling an earlier respelling retired: that respelling no longer reserves it
  for (const row of legacy.respelled_roots) {
    if (row.old === spelling && row.new === old) row.reverted = true;
  }
  legacy.respelled_roots.push({
    old,
    new: spelling,
    ...(components !== null ? { components: [...components] } : {}),
    old_forms: oldForms,
    glosses: h.glosses,
    reason,
  });
  recordMigration(lex, mapping, slots, old, 'respelled');
  const examples = migrateExamples(lex, mapping);
  lex.rhyme_families = rhymeFamilies(heads.map((x) => x.root));
  const from = verbClassOf(old);
  const to = verbClassOf(spelling);
  return { forms: mapping, compounds, verbClass: from === to ? null : { from, to }, examples };
}

/** Respell a primal root in place. Throws on a problem; use `respellRoot` for checked use. */
export function respellRootInPlace(
  lex: RawLexicon,
  id: string,
  spelling: string,
  reason: string,
): RespellImpact {
  return moveRoot(lex, id, spelling, null, reason);
}

/**
 * Replace a primal root by a compound of two existing headwords, in place
 * (2.1:G59): the entry keeps its id, glosses and every empty slot, and
 * becomes that compound; its forms and everything built on it follow.
 */
export function respellAsCompoundInPlace(
  lex: RawLexicon,
  id: string,
  components: [string, string],
  reason: string,
): RespellImpact {
  return moveRoot(lex, id, components.join(''), components, reason);
}

/** Check, then respell, on a copy. The original lexicon is never touched. */
export function respellRoot(
  raw: RawLexicon,
  id: string,
  spelling: string,
  reason: string,
): RespellResult {
  const s = spelling.trim().toLowerCase();
  const heads = raw.headwords as unknown as Head[];
  const h = heads.find((x) => String(x.id) === id);
  if (h === undefined) return { ok: false, problems: [`${id}: no headword has this id`] };
  if (h.components !== null)
    return { ok: false, problems: [`${h.root} is a compound: respell its parts`] };
  if (reason.trim() === '') return { ok: false, problems: ['a change needs a reason'] };
  if (s === h.root) return { ok: false, problems: ['that is already its spelling'] };
  const problems = rootTemplateProblems(raw, s);

  const lex = structuredClone(raw);
  let impact: RespellImpact;
  try {
    impact = respellRootInPlace(lex, id, s, reason);
  } catch (e) {
    return { ok: false, problems: [...problems, (e as Error).message] };
  }
  // collisions: every new form against every other entry's spelling
  const moved = new Set([id, ...impact.compounds.map((c) => c.id)]);
  const taken = spellings(raw, moved);
  for (const f of Object.values(impact.forms)) {
    const owner = taken.get(f);
    if (owner !== undefined) problems.push(`${f} collides with ${owner}`);
  }
  // at least two edits from every active word
  const declared = (
    (raw.phonology as Phonology | undefined)?.declared_distance_1_pairs ?? []
  ).flat();
  for (const [word, owner] of taken) {
    if (word.includes('-') || declared.includes(s)) continue;
    if (Math.abs(word.length - s.length) <= 1 && word !== s && distance(word, s) < 2) {
      problems.push(`${s} is one edit from ${word} (${owner})`);
    }
  }
  if (problems.length > 0) return { ok: false, problems: [...new Set(problems)] };
  return { ok: true, lexicon: lex, impact };
}

/* ------------------------------------------------------------- retire */

export function retireRootInPlace(
  lex: RawLexicon,
  id: string,
  replacementId: string,
  reason: string,
): RespellImpact {
  const heads = lex.headwords as unknown as Head[];
  const index = heads.findIndex((x) => String(x.id) === id);
  const h = heads[index];
  const rep = heads.find((x) => String(x.id) === replacementId);
  if (h === undefined) throw new Error(`${id}: no headword has this id`);
  if (rep === undefined) throw new Error(`${replacementId}: no headword has this id`);
  if (rep === h) throw new Error('a root cannot replace itself');
  const users = heads.filter((c) => c.components?.includes(h.root) === true);
  if (users.length > 0) {
    throw new Error(
      `${h.root} is a part of ${users.map((u) => u.root).join(', ')}: rebuild or retire those first`,
    );
  }
  const mapping: Record<string, string> = {};
  const slots: Record<string, string> = {};
  for (const [k, f] of Object.entries(h.forms)) {
    const to = rep.forms[k];
    if (to !== undefined) {
      mapping[f] = to;
      slots[f] = k;
    }
  }
  heads.splice(index, 1);
  const legacy = lex.legacy as unknown as LegacyRows;
  legacy.retired_roots.push({
    old: h.root,
    replacement: rep.root,
    components: rep.components,
    old_forms: h.forms,
    old_glosses: h.glosses,
    new_forms: rep.forms,
    new_glosses: rep.glosses,
    reason,
  });
  recordMigration(lex, mapping, slots, h.root, 'retired');
  const examples = migrateExamples(lex, mapping);
  lex.rhyme_families = rhymeFamilies(heads.map((x) => x.root));
  return { forms: mapping, compounds: [], verbClass: null, examples };
}

export function retireRoot(
  raw: RawLexicon,
  id: string,
  replacementId: string,
  reason: string,
): RespellResult {
  if (reason.trim() === '') return { ok: false, problems: ['a change needs a reason'] };
  const lex = structuredClone(raw);
  try {
    return { ok: true, lexicon: lex, impact: retireRootInPlace(lex, id, replacementId, reason) };
  } catch (e) {
    return { ok: false, problems: [(e as Error).message] };
  }
}
