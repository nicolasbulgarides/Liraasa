/**
 * The word index of the strict checker (2.5, ADR-0020), built entirely from
 * the data: the LLM reference (handoff/liraasa_2_5_llm.json), the checker's
 * overlay (data/checker/lexicon_flags.json), its rule parameters
 * (data/checker/rules_3_0.json), the legacy spellings and the known names.
 * Nothing here names a Liraasa word.
 */
import type { FormRole, Pos, Reading } from './types';

/** The parts of the LLM reference the checker reads. */
export interface Reference {
  title: string;
  dictionary: { role_codes: Record<string, string>; by_domain: Record<string, string[]> };
  word_building: {
    seven_forms: { slots: { slot: string; build: string }[] };
    verb_rule: Record<string, string>;
    suffix_order: string;
    suffixes: Record<string, string>;
    derivation_defaults?: Record<string, string>;
    lexicalised_derivations: Record<string, string>;
    lexicalised_diminutives?: Record<string, string>;
    image_compounds?: {
      modifiers: Record<string, { as_modifier: string; sense: string }>;
      heads: Record<string, { template: string }>;
      attested: Record<string, string>;
    };
    motion_prefixes: {
      canon: Record<string, string>;
      retired: Record<string, string>;
      rule: string;
    };
  };
  clause: {
    template: string;
    slots: { n: number; slot: string; words: string[]; notes: string }[];
    scope_operators: { words: string[]; rule: string };
    stacking: {
      exclusions: [string, string][];
      max_preverbal_operators_recommended: number;
    };
  };
  small_words: {
    function_words: { columns: string[]; rows: (string | null)[][] };
    historical_and_formulae?: { columns: string[]; rows: (string | null)[][] };
    pronouns: { form: string; person: string; number: string }[];
    correlatives: { rows: [string, string, string][] };
    numbers: {
      rules: { value: unknown; liraasa: unknown }[];
      examples: Record<string, string>;
      ordinals_and_fractions: string;
    };
    time_words: { rows: (string | null)[][] };
    colours: Record<string, string | null>[];
    discourse_particles: { form: string; function: string }[];
  };
  rulings: {
    id: string;
    topic: string;
    rule: string;
    examples?: { liraasa: string; english?: string }[];
  }[];
  examples?: { sentences: [string, string][] };
}

export interface Flags {
  word_class: Record<string, string>;
  side_nouns_as_prepositions: Record<string, string>;
  subordinators_taking_a_noun_phrase: Record<string, string>;
  correlative_role: Record<string, string>;
  noun_to_adjective_role: Record<string, string>;
  give_type: Record<string, string>;
  say_type: Record<string, string>;
  not_causative: Record<string, string>;
  preposition_sense: Record<string, string>;
  ko_combines: Record<string, string>;
  noun_class: Record<string, string>;
}

/** data/checker/rules_3_0.json (2.5's, plus the 3.0 parameters), as the checker reads it. */
export interface RuleParams {
  question: {
    fragment?: string;
    fronted_may_drop_ki: string[];
    always_ki: { ruling: string; determiners: string[]; degree: string };
    exclamation_without_ki: { ruling: string; words: string[] };
  };
  edges: {
    line_linkers: string[];
    clause_adverbs: { words: string[]; comma_required: string[] };
    frame_words: { words: string[] };
  };
  closing_order: { iteration_may_close: string[]; never_closing: { words: string[] } };
  noun_phrase: { degree_words: string[]; quantifier_extra: string[] };
  plural: { singular_demonstratives: string[] };
  means: { tool_classes: string[] };
  comparison: { amount_words: string[] };
  measure: { heads: string[] };
  valency: { operators: string[]; actor_slots: string[]; main_clause_slots: string[] };
  passive: {
    word: string;
    agent: string;
    change_of_state_verbs: { status: string; verbs: string[] };
  };
  recipient: { draft_tags: { status: string; verbs: string[] } };
  tense: { own_tense: string[] };
  command: {
    hortative: string;
    marks: string[];
    /** 3.0:G135: what a command may and may not carry. */
    operators?: { ruling: string; never: string[]; allowed_words: string[] };
  };
  /** 3.0 (proposed, ADR-0021). */
  vocative?: { ruling: string; particle: string };
  apposition?: { ruling: string };
  titles?: { ruling: string };
  absolute_being?: { ruling: string; word: string; copulas_needing_a_predicate: string[] };
  formula?: { ruling: string; opener: string; word: string };
  emphatic?: { ruling: string; word: string };
  authorship?: { ruling: string; word: string; work_nouns: string[] };
  acclamation?: { ruling: string; preposition: string; mark: string };
  distributive?: { ruling: string; word: string };
  /** 3.2 / 3.3 (proposed, ADR-0023). */
  honorific?: { ruling: string; titles: string[]; noun_classes: string[] };
  nationality?: { ruling: string };
  relational_adjectives?: { ruling: string };
  adjective_sidu: { dummy: string };
  negative_number: { word: string };
  [key: string]: unknown;
}

export interface GrammarSource {
  ref: Reference;
  flags: Flags;
  rules: RuleParams;
  /** Retired or respelled spellings: old → { to, edition }. */
  legacy: Record<string, { to: string; kind?: string; edition?: string | null }>;
  names: string[];
  /** Verbs attested with an object in the data (2.5:G110), computed at build time. */
  transitive?: string[];
}

export interface Headword {
  root: string;
  parts: [string, string] | null;
  domain: string;
  roles: Partial<Record<FormRole, Reading>>;
  image: boolean;
}

export interface Index {
  source: GrammarSource;
  forms: Map<string, Reading[]>;
  headwords: Map<string, Headword>;
  /** A form the rules would build but the dictionary does not list (0.8:R2). */
  unlisted: Map<string, { root: string; role: FormRole }>;
  closed: Map<string, Reading[]>;
  /** Multi-word closed entries ("ki-nela de"). */
  phrases: Map<string, Reading[]>;
  numerals: Map<string, number | string>;
  ordinalSuffix: string;
  timesHead: string | null;
  timesQuestion: string | null;
  derivations: string[];
  inflections: ('ti' | 'ri')[];
  blocked: Set<string>;
  lexicalised: Map<string, { gloss: string; base: string; suffix: string }>;
  prefixes: string[];
  curated: Set<string>;
  /** Clause slot of each operator word, from clause.slots. */
  slotOf: Map<string, string>;
  exclusions: [string, string][];
  maxOps: number;
  verbOf: (root: string) => string | null;
  /** Every spelling of a role, for fixes: root → role → form (listed only). */
  formOf: (root: string, role: FormRole) => string | null;
  minStripLength: number;
  names: Set<string>;
  transitive: Set<string>;
  timeNouns: Set<string>;
}

const LINE = /^([a-z]+)(?: \[([a-z]+)\+([a-z]+)(?:\+-([a-z]+))?\])?(?: \{([^}]*)\})?: (.*)$/;
const FORM = /^(?:([a-z]+) )?\(([a-z]+)\) (.*)$/;
const ROLE_POS: Record<FormRole, Pos> = {
  n: 'noun',
  an: 'noun',
  nn: 'noun',
  v: 'verb',
  na: 'adj',
  a: 'adj',
  aa: 'adj',
};

const push = <K, V>(m: Map<K, V[]>, k: K, v: V): void => {
  const list = m.get(k);
  if (list === undefined) m.set(k, [v]);
  else list.push(v);
};

/** The verb form by word_building.verb_rule, read from its own wording. */
export function verbRule(rule: Record<string, string>, word: string): string | null {
  const irregular = rule[word];
  if (typeof irregular === 'string') return irregular;
  const pick = (key: string): string | null => {
    const m = /^R\+([a-z]+)$/.exec(rule[key] ?? '');
    return m === null ? null : word + (m[1] ?? '');
  };
  const first = word[0] ?? '';
  if (first === 'n') return pick('n-initial');
  if (first === 's') return pick('s-initial');
  if ('aeiou'.includes(first)) return pick('vowel-initial');
  return (rule.otherwise ?? '').includes('first consonant + a') ? `${word}${first}a` : null;
}

/** The seven form rules of word_building.seven_forms, in role-code order. */
function formRules(ref: Reference): { role: FormRole; suffix: string | null }[] {
  const codes = Object.keys(ref.dictionary.role_codes) as FormRole[];
  return ref.word_building.seven_forms.slots.map((s, i) => {
    const m = /^R(?: \+ ([a-z]+))?$/.exec(s.build);
    return { role: codes[i] ?? 'n', suffix: m === null ? null : (m[1] ?? '') };
  });
}

/** What a function word is for the parser: its slot first, then its overlay class. */
function functionPos(
  form: string,
  ix: { slotOf: Map<string, string> },
  src: GrammarSource,
): { pos: Pos; slot?: string; detail?: string }[] {
  const out: { pos: Pos; slot?: string; detail?: string }[] = [];
  const slot = ix.slotOf.get(form);
  const r = src.rules;
  if (slot !== undefined) {
    const bySlot: Record<string, Pos> = {
      FRAME: 'frame',
      TOPIC: 'topic',
      TENSE: 'op',
      REALITY: 'op',
      NEGATION: 'op',
      MODAL: 'op',
      APPROACH: 'op',
      PHASE: 'op',
      EFFORT: 'op',
      ASPECT: 'op',
      ITERATION: 'op',
      EVIDENTIAL: 'op',
      RECIPROCAL: 'recip',
      STATUS: 'status',
      ATTITUDE: 'attitude',
      QUESTION: 'ki',
      ADJUNCTS: form === 'la' ? 'la' : 'prep',
      VERB: r.valency.operators.includes(form) || form === r.passive.word ? 'valency' : 'copula',
    };
    const p =
      slot === 'VERB' && !(r.valency.operators.includes(form) || form === r.passive.word)
        ? 'copula'
        : slot === 'VERB'
          ? undefined
          : bySlot[slot];
    if (p !== undefined) out.push({ pos: p, slot });
  }
  if (r.valency.operators.includes(form)) out.push({ pos: 'valency', slot: 'VERB' });
  if (form === r.passive.word) out.push({ pos: 'passive', slot: 'VERB' });
  if (form === r.negative_number.word) out.push({ pos: 'sign' });
  if (r.edges.clause_adverbs.words.includes(form)) out.push({ pos: 'clauseAdv' });
  const cls = src.flags.word_class[form];
  const byClass: Record<string, Pos> = {
    determiner: 'det',
    owner: 'owner',
    reflexive: 'refl',
    preposition: 'prep',
    comparison: 'comparison',
    coordinator: 'coord',
    subordinator: 'sub',
    'question word': 'kiword',
    quantifier: 'quant',
    degree: 'degree',
    chain: 'chain',
    hortative: 'hortative',
    interjection: 'interjection',
    time: 'timeAdv',
    vocative: 'vocative',
  };
  if (cls !== undefined) {
    const p = byClass[cls];
    // a clause adverb listed as a coordinator is read once, as a clause adverb
    if (p !== undefined && !(p === 'coord' && out.some((o) => o.pos === 'clauseAdv')))
      out.push({ pos: p, detail: cls });
  }
  if (r.noun_phrase.degree_words.includes(form) && !out.some((o) => o.pos === 'degree'))
    out.push({ pos: 'degree' });
  if (r.noun_phrase.quantifier_extra.includes(form) && !out.some((o) => o.pos === 'quant'))
    out.push({ pos: 'quant' });
  if (src.ref.clause.scope_operators.words.includes(form)) out.push({ pos: 'scope' });
  // the subordinators that may take a bare noun phrase are also prepositions (1.0:G11, 2.3:G79)
  if (form in src.flags.subordinators_taking_a_noun_phrase && !out.some((o) => o.pos === 'prep'))
    out.push({ pos: 'prep' });
  return out;
}

export function buildIndex(src: GrammarSource): Index {
  const ref = src.ref;
  const forms = new Map<string, Reading[]>();
  const headwords = new Map<string, Headword>();
  const roles = ref.dictionary.role_codes;

  for (const [domain, lines] of Object.entries(ref.dictionary.by_domain)) {
    for (const line of lines) {
      const m = LINE.exec(line);
      if (m === null) throw new Error(`cannot read dictionary line: ${line}`);
      const root = m[1] ?? '';
      const h: Headword = {
        root,
        parts: m[2] !== undefined && m[3] !== undefined ? [m[2], m[3]] : null,
        domain,
        roles: {},
        image: false,
      };
      for (const part of (m[6] ?? '').split(' | ')) {
        const f = FORM.exec(part);
        if (f === null) throw new Error(`cannot read form "${part}" in ${line}`);
        const role = (f[2] ?? '') as FormRole;
        if (!(role in roles)) throw new Error(`unknown role ${role} in ${line}`);
        const form = f[1] ?? root;
        const reading: Reading = {
          pos: ROLE_POS[role],
          form,
          root,
          role,
          gloss: f[3] ?? '',
          source: 'listed',
        };
        h.roles[role] = reading;
        push(forms, form, reading);
      }
      headwords.set(root, h);
    }
  }

  const wb = ref.word_building;
  const rules = formRules(ref);
  const verbOf = (root: string): string | null => verbRule(wb.verb_rule, root);
  const build = (root: string, suffix: string | null): string | null =>
    suffix === null ? verbOf(root) : root + suffix;

  // image compounds: every modifier + head is a word with all seven forms (2.0:G40, 2.5:G124)
  const ic = wb.image_compounds;
  if (ic !== undefined) {
    for (const [mod, m] of Object.entries(ic.modifiers)) {
      if (!headwords.has(mod)) continue;
      for (const head of Object.keys(ic.heads)) {
        const hw = headwords.get(head);
        const word = mod + head;
        if (hw === undefined || headwords.has(word)) continue;
        const attested = ic.attested[word];
        const sense = (hw.roles.n?.gloss ?? head).split(';')[0]?.trim().toLowerCase() ?? head;
        const noun = attested ?? `${m.as_modifier} ${sense}`;
        const h: Headword = {
          root: word,
          parts: [mod, head],
          domain: 'image compounds',
          roles: {},
          image: true,
        };
        for (const { role, suffix } of rules) {
          const form = build(word, suffix);
          if (form === null || forms.has(form)) continue;
          const gloss = role === 'n' ? noun : `${noun} (${roles[role] ?? role}, predicted)`;
          const reading: Reading = {
            pos: ROLE_POS[role],
            form,
            root: word,
            role,
            gloss,
            source: role === 'n' && attested !== undefined ? 'image' : 'image-predicted',
          };
          h.roles[role] = reading;
          push(forms, form, reading);
        }
        headwords.set(word, h);
      }
    }
  }

  // the forms the rules would build for a headword and the dictionary leaves unlisted
  const unlisted = new Map<string, { root: string; role: FormRole }>();
  for (const h of headwords.values()) {
    if (h.image) continue;
    for (const { role, suffix } of rules) {
      const form = build(h.root, suffix);
      if (form !== null && !forms.has(form) && h.roles[role] === undefined)
        unlisted.set(form, { root: h.root, role });
    }
  }

  // clause slots: each operator word's slot
  const slotOf = new Map<string, string>();
  const fwForms = new Set([
    ...ref.small_words.function_words.rows.map((r) => String(r[0])),
    ...ref.small_words.discourse_particles.map((d) => d.form),
  ]);
  for (const s of ref.clause.slots) {
    for (const w of s.words) {
      // FRAME lists descriptions ("prepositional phrases of place (En li nimu …)"): only its single words
      if (s.slot === 'FRAME' && !/^[a-z-]+$/.test(w)) continue;
      for (const t of w.replace(/\([^)]*\)/g, ' ').split(/[\s,+]+/)) {
        if (/^[a-z-]+$/.test(t) && fwForms.has(t) && !slotOf.has(t)) slotOf.set(t, s.slot);
      }
    }
  }

  const closed = new Map<string, Reading[]>();
  const phrases = new Map<string, Reading[]>();
  const ixPartial = { slotOf };
  const cols = ref.small_words.function_words.columns;
  const col = (name: string): number => cols.indexOf(name);
  const fwRows = [
    ...ref.small_words.function_words.rows,
    ...(ref.small_words.historical_and_formulae?.rows ?? []),
  ];
  for (const row of fwRows) {
    const form = String(row[col('form')]);
    if (form.startsWith('-')) continue;
    const gloss = String(row[col('meaning')]);
    const readings = functionPos(form, ixPartial, src).map(
      (p): Reading => ({
        pos: p.pos,
        form,
        gloss,
        source: 'closed',
        ...(p.slot === undefined ? {} : { slot: p.slot }),
        ...(p.detail === undefined ? {} : { detail: p.detail }),
      }),
    );
    if (readings.length === 0)
      readings.push({
        pos: 'interjection',
        form,
        gloss,
        source: 'closed',
        detail: 'function word',
      });
    for (const r of readings) push(form.includes(' ') ? phrases : closed, form, r);
  }
  for (const p of ref.small_words.pronouns) {
    push(closed, p.form, {
      pos: 'pron',
      form: p.form,
      gloss: `${p.person} ${p.number}`.toLowerCase(),
      source: 'closed',
    });
  }
  for (const [form, built, gloss] of ref.small_words.correlatives.rows) {
    const concept = /\+ ([a-z]+)/.exec(built)?.[1] ?? '';
    const role = src.flags.correlative_role[concept];
    const pos: Pos = form.startsWith('ki-')
      ? 'kiword'
      : role === 'noun'
        ? 'pron'
        : concept === 'pago'
          ? 'placeAdv'
          : concept === 'krono'
            ? 'timeAdv'
            : 'mannerAdv';
    if (!(closed.get(form) ?? []).some((r) => r.pos === pos))
      push(closed, form, { pos, form, gloss, source: 'correlative', detail: concept });
  }
  for (const row of ref.small_words.time_words.rows) {
    const [form, gloss, cls] = [String(row[0]), String(row[1]), String(row[2] ?? '')];
    if (form.includes(' ') || cls === 'operator') continue;
    const pos: Pos = cls === 'noun' ? 'noun' : cls === 'place_adverbial' ? 'placeAdv' : 'timeAdv';
    // a time noun that is also a headword is read as the headword
    if (pos === 'noun' && forms.has(form)) continue;
    if (!(closed.get(form) ?? []).some((r) => r.pos === pos))
      push(closed, form, { pos, form, gloss, source: 'closed', detail: `time word (${cls})` });
  }
  for (const c of ref.small_words.colours) {
    for (const k of ['base', 'dark', 'vivid', 'gem', 'light']) {
      const w = c[k];
      if (typeof w === 'string' && w !== '')
        push(closed, w, {
          pos: 'colour',
          form: w,
          gloss: `${String(c.family).toLowerCase()}${k === 'base' ? '' : ` (${k})`}`,
          source: 'closed',
        });
    }
  }
  for (const d of ref.small_words.discourse_particles) {
    const slot = slotOf.get(d.form);
    if (slot === 'ATTITUDE')
      push(closed, d.form, {
        pos: 'attitude',
        form: d.form,
        gloss: d.function,
        source: 'closed',
        slot,
      });
    push(closed, d.form, { pos: 'discourse', form: d.form, gloss: d.function, source: 'closed' });
  }
  // time nouns: plain nouns that take en as "when" (2.5:G103), and may open a FRAME phrase
  const timeNouns = new Set(
    ref.small_words.time_words.rows
      .filter((r) => String(r[2] ?? '') === 'noun')
      .map((r) => String(r[0])),
  );

  // numerals
  const numerals = new Map<string, number | string>();
  for (const r of ref.small_words.numbers.rules) {
    const w = typeof r.liraasa === 'string' ? r.liraasa : '';
    if (/^[a-z]+$/.test(w)) numerals.set(w, r.value as number);
  }
  for (const [value, w] of Object.entries(ref.small_words.numbers.examples))
    if (/^[a-z]+$/.test(w)) numerals.set(w, Number(value));
  const ordinalSuffix =
    /add (-[a-z]+)/.exec(ref.small_words.numbers.ordinals_and_fractions)?.[1] ?? '-ne';

  // N times (2.1:G49)
  let timesHead: string | null = null;
  let timesQuestion: string | null = null;
  for (const r of ref.rulings) {
    const head = /\bNUMBER-([a-z]+) = N times/.exec(r.rule);
    if (head === null) continue;
    timesHead = head[1] ?? null;
    timesQuestion =
      new RegExp(`\\b(ki-[a-z]+)-${timesHead ?? ''} = how many times`).exec(r.rule)?.[1] ?? null;
    break;
  }

  const inflections = (wb.suffix_order.match(/-[a-z]+/g) ?? []).map((s) => s.slice(1)) as (
    | 'ti'
    | 'ri'
  )[];
  const derivations = Object.keys(wb.suffixes)
    .map((s) => s.replace(/^-/, ''))
    .filter((s) => !inflections.includes(s as 'ti'));
  const blocked = new Set<string>();
  for (const text of Object.values(wb.suffixes))
    for (const m of text.matchAll(/([a-z]+)\+([a-z]+) blocked/g))
      blocked.add((m[1] ?? '') + (m[2] ?? ''));
  const lexicalised = new Map<string, { gloss: string; base: string; suffix: string }>();
  for (const [word, text] of Object.entries({
    ...wb.lexicalised_derivations,
    ...(wb.lexicalised_diminutives ?? {}),
  })) {
    const m = /^(.*): ([a-z]+) \+ -([a-z]+)$/.exec(text);
    if (m !== null)
      lexicalised.set(word, { gloss: m[1] ?? '', base: m[2] ?? '', suffix: m[3] ?? '' });
  }
  const prefixes = Object.keys(wb.motion_prefixes.canon);
  const curated = new Set<string>();
  for (const text of Object.values(wb.motion_prefixes.canon)) {
    const m = /curated metaphors?: ([^)]*)/.exec(text);
    if (m !== null) for (const w of (m[1] ?? '').split(',')) curated.add(w.trim());
  }

  const order =
    (
      src.ref as unknown as { how_to_translate?: { how_a_reader_parses_one_word?: string[] } }
    ).how_to_translate?.how_a_reader_parses_one_word?.join(' ') ?? '';
  const longer = /longer than (\d+)/.exec(order);

  return {
    source: src,
    forms,
    headwords,
    unlisted,
    closed,
    phrases,
    numerals,
    ordinalSuffix,
    timesHead,
    timesQuestion,
    derivations,
    inflections,
    blocked,
    lexicalised,
    prefixes,
    curated,
    slotOf,
    exclusions: ref.clause.stacking.exclusions,
    maxOps: ref.clause.stacking.max_preverbal_operators_recommended,
    verbOf,
    formOf: (root, role) => headwords.get(root)?.roles[role]?.form ?? null,
    minStripLength: longer === null ? 4 : Number(longer[1]),
    names: new Set(src.names.map((n) => n.toLowerCase())),
    transitive: new Set(src.transitive ?? []),
    timeNouns,
  };
}
