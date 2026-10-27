/**
 * The grammar guide's view of the handoff lexicon: typed access, the indexes
 * the chapters need, and the word check that keeps the guide honest.
 *
 * Nothing here writes. The lexicon is read as the handoff JSON stores it, so
 * the guide follows the data on every rebuild.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** The copied names of foreign things the strict checker reads (3.5:G151): data/checker/rules_3_0.json. */
const COPIED_WORDS: ReadonlySet<string> = new Set(
  (
    JSON.parse(readFileSync(resolve('data/checker/rules_3_0.json'), 'utf8')) as {
      copied_words?: { words: string[] };
    }
  ).copied_words?.words ?? [],
);
import {
  FORM_SLOTS,
  SLOT_RAW_KEY,
  isUnusedGloss,
  type FormSlot,
} from '../../src/core/config/slots';

export interface Headword {
  id?: string;
  root: string;
  type: 'Primal' | 'Compound';
  components: [string, string] | null;
  forms: Record<string, string>;
  glosses: Record<string, string>;
  register: string;
  domain: string;
  english_synonyms: string[];
  status_1_0: string;
  since: string;
}

export interface Ruling {
  id: string;
  topic: string;
  ruling: string;
  refines?: string[];
  examples?: [string, string][];
  /** 2.2 on (ADR-0018): kept, never reworded, and marked when a later ruling replaces it. */
  supersedes?: string[];
  superseded_by?: string;
  superseded_in_part?: { clause: string; by: string }[];
}

export interface FunctionWord {
  form: string;
  meaning: string;
  position: string;
  class: string | null;
  example: string | null;
  example_gloss: string | null;
  since: string;
}

export interface Example {
  liraasa: string;
  english: string;
  feature: string;
  status: string;
  liraasa_1_1?: string;
  revision_reason?: string;
}

export interface Lexicon {
  language: string;
  version: string;
  built_utc: string;
  phonology: {
    vowels: string;
    consonants_core: string;
    consonants_other: string;
    stress: string;
    new_root_template: string;
    function_word_template: string;
    protected_exceptions: string[];
    declared_distance_1_pairs: [string, string][];
  };
  morphology: {
    seven_forms: string[];
    verb_rule: Record<string, string>;
    suffix_order: string;
    suffixes: Record<string, string>;
    compounding: string;
    lexicalised_derivations: Record<string, string>;
    lexicalised_diminutives?: Record<string, string>;
    derivation_defaults?: Record<string, string>;
  };
  motion_prefixes: { canon: Record<string, string>; retired: Record<string, string>; rule: string };
  settled_open_questions_0_8: { q: string; answer: string }[];
  headwords: Headword[];
  function_words: FunctionWord[];
  pronouns: {
    form: string;
    person: string;
    number: string;
    possessive: string;
    reflexive: string;
  }[];
  correlatives: { form: string; determiner: string; concept: string; gloss: string }[];
  numbers: { rules: Record<string, string | number>[]; lookup_0_999: Record<string, string> };
  time_and_dates: { form: string; english: string }[];
  colors: Record<string, string>[];
  discourse_particles: {
    form: string;
    function: string;
    positions: string;
    register: string;
    examples: { liraasa: string; english: string }[];
  }[];
  grammar: {
    clause_template: string;
    slots: { n: number; slot: string; words: string[]; notes: string }[];
    scope_operators: { words: string[]; rule: string };
    stacking: {
      exclusions: [string, string][];
      max_preverbal_operators_recommended: number;
      scope: string;
    };
    valency: Record<string, string>;
    noun_phrase: string;
  };
  rulings_1_0: Ruling[];
  rulings_0_8_carried: Ruling[];
  rulings_1_2: Ruling[];
  rulings_2_0?: Ruling[];
  rulings_2_1?: Ruling[];
  rulings_2_2?: Ruling[];
  rulings_2_3?: Ruling[];
  rulings_2_5?: Ruling[];
  rulings_3_0?: Ruling[];
  rulings_3_2?: Ruling[];
  rulings_3_3?: Ruling[];
  rulings_3_4?: Ruling[];
  rulings_4_0?: Ruling[];
  rulings_3_6?: Ruling[];
  rulings_3_5?: Ruling[];
  /** 2.0: the image-compound pattern, with the attested pairs whole (ADR-0016). */
  image_compounds?: {
    rule: string;
    capacity: number;
    modifiers: Record<string, { as_modifier: string; sense: string }>;
    heads: Record<string, { template: string }>;
    attested: Headword[];
  };
  examples: Example[];
  rhyme_families: { ending: string; members: string[]; count: number }[];
  legacy: {
    retired_roots: { old: string; replacement: string }[];
    /** `reverted`: a respelling a later edition undid (2.2: silro → puzu, then back). */
    respelled_roots: { old: string; new: string; reverted?: boolean }[];
    /** Every retired or respelled spelling, with the form that replaces it. */
    migration_forms: Record<string, { to: string; slot: string; via: string; kind: string }>;
  };
}

/**
 * The current spelling of a word an older text spells otherwise (2.1:G58: a
 * 2.0 text is read under its 2.0 spellings), a -ri / -ti ending kept as
 * respell.ts `correctText` keeps it (lenrari → zarkuri, 2.3:G69). Only
 * respellings: a retired word has a replacement, not a new spelling.
 */
export function respelledAs(lex: Lexicon, word: string): string | undefined {
  const m = lex.legacy.migration_forms[word];
  if (m !== undefined) return m.kind === 'respelled' ? m.to : undefined;
  for (const suffix of ['tiri', 'ri', 'ti']) {
    const stem = lex.legacy.migration_forms[word.slice(0, -suffix.length)];
    if (word.endsWith(suffix) && stem?.kind === 'respelled') return stem.to + suffix;
  }
  return undefined;
}

export function loadLexicon(path: string): Lexicon {
  return JSON.parse(readFileSync(resolve(path), 'utf8')) as Lexicon;
}

export function formOf(h: Headword, slot: FormSlot): string {
  return h.forms[SLOT_RAW_KEY[slot]] ?? '';
}

export function glossOf(h: Headword, slot: FormSlot): string {
  return h.glosses[SLOT_RAW_KEY[slot]] ?? '';
}

export function isUsed(h: Headword, slot: FormSlot): boolean {
  return !isUnusedGloss(glossOf(h, slot));
}

/** Runs of letters with internal hyphens and apostrophes kept, as the checker tokenises. */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]+(?:['-][a-z]+)*/g) ?? []).filter((t) => t.length > 0);
}

/** Every example that is still read as canon (HISTORICAL ones are not). */
export function liveExamples(lex: Lexicon): Example[] {
  return lex.examples.filter((e) => e.status !== 'HISTORICAL');
}

/**
 * The data capitalises glosses unevenly ("Light", "sun", "Person"). The guide
 * lowercases them as it renders, keeping only names: "I", the Goddess, the
 * Divine Light. The lexicon is not touched.
 */
const KEEP_CAPITALS = [
  'Her Divine Light',
  'Divine Light',
  'Holy One',
  'Goddess',
  'God',
  'Muse',
  'I',
];

export function normGloss(gloss: string): string {
  const kept: string[] = [];
  let out = gloss;
  for (const k of KEEP_CAPITALS) {
    out = out.replace(new RegExp(`\\b${k}\\b`, 'g'), () => {
      kept.push(k);
      return `{${String(kept.length - 1)}}`;
    });
  }
  out = out.replace(/\b([A-Z])([a-z])/g, (_m, a: string, b: string) => a.toLowerCase() + b);
  return out.replace(/\{(\d+)\}/g, (_m, i: string) => kept[Number(i)] ?? '').trim();
}

/** A ruling by its edition-qualified id (`2.0:G43`), or undefined. */
export function rulingById(lex: Lexicon, id: string): Ruling | undefined {
  const [edition, rid] = id.split(':');
  const sets: Record<string, readonly Ruling[] | undefined> = {
    '4.0': lex.rulings_4_0,
    '3.6': lex.rulings_3_6,
    '3.5': lex.rulings_3_5,
    '3.4': lex.rulings_3_4,
    '3.3': lex.rulings_3_3,
    '3.2': lex.rulings_3_2,
    '3.0': lex.rulings_3_0,
    '2.5': lex.rulings_2_5,
    '2.3': lex.rulings_2_3,
    '2.2': lex.rulings_2_2,
    '2.1': lex.rulings_2_1,
    '2.0': lex.rulings_2_0,
    '1.2': lex.rulings_1_2,
    '1.0': lex.rulings_1_0,
    '0.8': lex.rulings_0_8_carried,
  };
  return sets[edition ?? '']?.find((r) => r.id === rid);
}

/** The first sense of a gloss: up to the first semicolon, without a leading "to ". */
export function firstSense(gloss: string): string {
  return (gloss.split(';')[0] ?? '').trim();
}

/** One pair of the image-compound pattern: MODIFIER + HEAD, read by rule. */
export interface PatternPair {
  spelling: string;
  modifier: Headword;
  head: Headword;
  /** The attested gloss, or "<modifier adjective> <head>; <template> <sense>". */
  reading: string;
  attested: boolean;
}

/** Spelling → headword plus slot, for every used and unused form. */
export interface FormHit {
  headword: Headword;
  slot: FormSlot;
}

export class Index {
  readonly byRoot = new Map<string, Headword>();
  readonly forms = new Map<string, FormHit[]>();
  /** Spellings that some closed class or attested text vouches for. */
  readonly closed = new Set<string>();
  readonly attested = new Set<string>();
  readonly retired = new Set<string>();
  readonly byId = new Map<string, Headword>();
  /** Every pair of the 2.0 image-compound pattern, attested or not (2.0:G40). */
  readonly patterns = new Map<string, PatternPair>();
  readonly compoundsBy = new Map<string, { asModifier: Headword[]; asHead: Headword[] }>();

  constructor(readonly lex: Lexicon) {
    for (const h of lex.headwords) {
      this.byRoot.set(h.root, h);
      if (h.id !== undefined) this.byId.set(h.id, h);
      for (const slot of FORM_SLOTS) {
        const f = formOf(h, slot);
        const list = this.forms.get(f) ?? [];
        list.push({ headword: h, slot });
        this.forms.set(f, list);
      }
      if (h.components !== null) {
        const [mod, head] = h.components;
        this.compoundSide(mod).asModifier.push(h);
        this.compoundSide(head).asHead.push(h);
      }
    }

    // 2.0: the attested image compounds are words of Liraasa too (2.0:G40)
    for (const h of lex.image_compounds?.attested ?? []) {
      for (const slot of FORM_SLOTS) {
        const f = formOf(h, slot);
        const list = this.forms.get(f) ?? [];
        list.push({ headword: h, slot });
        this.forms.set(f, list);
      }
    }

    const ic = lex.image_compounds;
    if (ic !== undefined) {
      const attested = new Map(ic.attested.map((h) => [h.root, h]));
      for (const [modId, mod] of Object.entries(ic.modifiers)) {
        for (const [headId, head] of Object.entries(ic.heads)) {
          const m = this.byId.get(modId);
          const hd = this.byId.get(headId);
          if (m === undefined || hd === undefined) continue;
          const spelling = m.root + hd.root;
          const seen = attested.get(spelling);
          const noun = firstSense(glossOf(hd, 'root')).toLowerCase();
          this.patterns.set(spelling, {
            spelling,
            modifier: m,
            head: hd,
            reading:
              seen === undefined
                ? `${mod.as_modifier} ${noun}; ${head.template} ${mod.sense}`
                : glossOf(seen, 'root'),
            attested: seen !== undefined,
          });
        }
      }
    }

    const closedForms = [
      ...lex.function_words.map((w) => w.form),
      ...lex.pronouns.flatMap((p) => [p.form]),
      ...lex.correlatives.map((c) => c.form),
      ...lex.time_and_dates.map((t) => t.form),
      ...lex.discourse_particles.map((p) => p.form),
      ...Object.values(lex.numbers.lookup_0_999),
      ...lex.numbers.rules.map((r) => String(r.Liraasa)),
      ...lex.colors.flatMap((c) =>
        Object.entries(c)
          .filter(([k]) => k !== 'Family' && k !== 'Example meanings / notes')
          .map(([, v]) => v),
      ),
      ...Object.keys(lex.morphology.lexicalised_derivations),
      ...Object.keys(lex.morphology.lexicalised_diminutives ?? {}),
    ];
    for (const f of closedForms) for (const t of tokenize(f)) this.closed.add(t);

    // Every token of every live example, ruling example and particle example
    // is canon text; names (Kipo, Dorin, Melodia …) come in this way.
    const texts = [
      ...liveExamples(lex).map((e) => e.liraasa),
      ...[
        ...lex.rulings_1_0,
        ...lex.rulings_1_2,
        ...(lex.rulings_2_0 ?? []),
        ...(lex.rulings_2_1 ?? []),
        ...(lex.rulings_2_2 ?? []),
        ...(lex.rulings_2_3 ?? []),
        ...(lex.rulings_2_5 ?? []),
        ...(lex.rulings_3_0 ?? []),
        ...(lex.rulings_3_2 ?? []),
        ...(lex.rulings_3_3 ?? []),
        ...(lex.rulings_3_4 ?? []),
        ...(lex.rulings_3_5 ?? []),
        ...(lex.rulings_3_6 ?? []),
        ...(lex.rulings_4_0 ?? []),
        ...lex.rulings_0_8_carried,
      ].flatMap((r) => (r.examples ?? []).map(([l]) => l)),
      ...lex.discourse_particles.flatMap((p) => p.examples.map((e) => e.liraasa)),
      ...lex.function_words.flatMap((w) => (w.example === null ? [] : [w.example])),
      ...lex.pronouns.flatMap((p) => [p.possessive, p.reflexive]),
    ];
    for (const text of texts) for (const t of tokenize(text)) this.attested.add(t);

    for (const r of lex.legacy.retired_roots) this.retired.add(r.old);
    for (const r of lex.legacy.respelled_roots) if (r.reverted !== true) this.retired.add(r.old);
  }

  private compoundSide(root: string): { asModifier: Headword[]; asHead: Headword[] } {
    let side = this.compoundsBy.get(root);
    if (side === undefined) {
      side = { asModifier: [], asHead: [] };
      this.compoundsBy.set(root, side);
    }
    return side;
  }

  /** Is this one token a word of Liraasa, by form, closed class, inflection or attestation? */
  isWord(token: string): boolean {
    if (this.forms.has(token) || this.closed.has(token) || this.attested.has(token)) return true;
    // a foreign dish, product or drug copied like a name (3.5:G151), as the checker lists them
    if (COPIED_WORDS.has(token)) return true;
    if (this.patterns.has(token)) return true;
    // -ri, -ti, -tiri on a known form or closed word.
    for (const suffix of ['tiri', 'ri', 'ti']) {
      if (token.endsWith(suffix)) {
        const stem = token.slice(0, -suffix.length);
        if (this.forms.has(stem) || this.closed.has(stem) || this.patterns.has(stem)) return true;
      }
    }
    // A motion prefix on a verb form.
    for (const prefix of Object.keys(this.lex.motion_prefixes.canon)) {
      const p = prefix.replace('-', '');
      if (token.startsWith(p)) {
        const rest = token.slice(p.length).replace(/^-/, '');
        if (this.forms.get(rest)?.some((hit) => hit.slot === 'verb') === true) return true;
      }
    }
    // Hyphenated numerals and ordinals: each part a numeral, optionally -ne.
    const parts = token.split('-');
    if (parts.length > 1 && parts.every((p) => this.closed.has(p) || p === 'ne' || p === 'de')) {
      return true;
    }
    // N times: a number, or ki-muya, joined to krono (2.1:G49)
    if (token.endsWith('-krono') && rulingById(this.lex, '2.1:G49') !== undefined) {
      const count = token.slice(0, -'-krono'.length);
      if (count === 'ki-muya' || Object.values(this.lex.numbers.lookup_0_999).includes(count))
        return true;
    }
    return false;
  }

  /** A compound part's first sense: a headword's root gloss, or a colour base's family. */
  senseOf(root: string): string {
    const h = this.byRoot.get(root);
    if (h !== undefined) return firstSense(glossOf(h, 'root')).toLowerCase();
    const colour = this.lex.colors.find((c) => c['Base color'] === root);
    return (colour?.Family ?? '').toLowerCase();
  }

  /** The unused-slot readings of a token, if any reading of it is unused. */
  unusedReadings(token: string): FormHit[] {
    const hits = this.forms.get(token) ?? [];
    if (hits.length === 0 || this.closed.has(token) || this.attested.has(token)) return [];
    // a compound's -san is an adjective by rule, once 3.3:G148 is in force
    const relational = (this.lex.rulings_3_3 ?? []).some((r) => r.id === 'G148');
    const unused = (h: FormHit): boolean =>
      !isUsed(h.headword, h.slot) &&
      !(relational && h.slot === 'adjective' && h.headword.components !== null);
    return hits.every(unused) ? hits : [];
  }

  /**
   * Live canon examples containing any form of this headword (or its
   * inflections), one per distinct Liraasa line: canon repeats a few lines.
   */
  examplesFor(h: Headword): Example[] {
    const mine = new Set(FORM_SLOTS.map((s) => formOf(h, s)));
    const seen = new Set<string>();
    return liveExamples(this.lex).filter((e) => {
      if (seen.has(e.liraasa)) return false;
      seen.add(e.liraasa);
      return tokenize(e.liraasa).some((t) => {
        if (mine.has(t)) return true;
        for (const suffix of ['tiri', 'ri', 'ti']) {
          if (t.endsWith(suffix) && mine.has(t.slice(0, -suffix.length))) return true;
        }
        return false;
      });
    });
  }

  /** `-yo` / `-vu` / `-pago` derivations of a root that canon actually uses. */
  attestedDerivations(
    h: Headword,
  ): { word: string; suffix: string; meaning: string; source: string }[] {
    const out: { word: string; suffix: string; meaning: string; source: string }[] = [];
    for (const suffix of ['yo', 'vu', 'pago']) {
      const word = h.root + suffix;
      const headword = this.byRoot.get(word);
      const lexicalised = this.lex.morphology.lexicalised_derivations[word];
      const example = liveExamples(this.lex).find((e) => tokenize(e.liraasa).includes(word));
      if (headword !== undefined) {
        out.push({ word, suffix, meaning: headword.glosses.root ?? '', source: 'headword' });
      } else if (lexicalised !== undefined) {
        out.push({ word, suffix, meaning: lexicalised, source: 'lexicalised (1.0:G20)' });
      } else if (example !== undefined) {
        const whole = tokenize(example.liraasa).length === 1;
        out.push({
          word,
          suffix,
          meaning: whole ? example.english : `attested in “${example.liraasa}”`,
          source: 'canon example',
        });
      }
    }
    return out;
  }

  rhymesOf(h: Headword): string[] {
    const family = this.lex.rhyme_families.find((f) => f.members.includes(h.root));
    return family === undefined ? [] : family.members.filter((m) => m !== h.root);
  }
}

/** Liraasa text as its run of tokens, for comparing sentences: “Fisa, lisrola.” → “fisa lisrola”. */
function tokenRun(text: string): string {
  return ` ${tokenize(text).join(' ')} `;
}

/**
 * Every text canon vouches for, as token runs: live examples, function-word,
 * ruling and particle examples, the pronouns' possessive and reflexive forms,
 * and the ruling texts themselves, which quote phrases (“nevi li zeldo”).
 */
export function canonTexts(lex: Lexicon): string[] {
  const rulings = [
    ...lex.rulings_1_0,
    ...lex.rulings_1_2,
    ...(lex.rulings_2_0 ?? []),
    ...(lex.rulings_2_1 ?? []),
    ...(lex.rulings_2_2 ?? []),
    ...(lex.rulings_2_3 ?? []),
    ...(lex.rulings_2_5 ?? []),
    ...(lex.rulings_3_0 ?? []),
    ...(lex.rulings_3_2 ?? []),
    ...(lex.rulings_3_3 ?? []),
    ...(lex.rulings_3_4 ?? []),
    ...(lex.rulings_3_5 ?? []),
    ...(lex.rulings_3_6 ?? []),
    ...(lex.rulings_4_0 ?? []),
    ...lex.rulings_0_8_carried,
  ];
  return [
    ...liveExamples(lex).map((e) => e.liraasa),
    ...lex.function_words.flatMap((w) => (w.example === null ? [] : [w.example])),
    ...rulings.flatMap((r) => [r.ruling, ...(r.examples ?? []).map(([l]) => l)]),
    ...lex.discourse_particles.flatMap((p) => p.examples.map((e) => e.liraasa)),
    ...lex.pronouns.flatMap((p) => [p.possessive, p.reflexive]),
  ].map(tokenRun);
}

/**
 * Is this example canon? Each part (split at “ / ” and “ — ”) must be a canon
 * text or a whole-word stretch of one. A sentence that is not, however canon
 * its words, is new language and waits for the author's review.
 */
export function isCanonText(canon: readonly string[], text: string): boolean {
  return text
    .split(/ \/ | — /)
    .map(tokenRun)
    .every((part) => part.trim() === '' || canon.some((c) => c.includes(part)));
}
