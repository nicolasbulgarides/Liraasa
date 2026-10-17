/**
 * The grammar guide's view of the handoff lexicon: typed access, the indexes
 * the chapters need, and the word check that keeps the guide honest.
 *
 * Nothing here writes. The lexicon is read as the handoff JSON stores it, so
 * the guide follows the data on every rebuild.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FORM_SLOTS,
  SLOT_RAW_KEY,
  isUnusedGloss,
  type FormSlot,
} from '../../src/core/config/slots';

export interface Headword {
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
}

export interface FunctionWord {
  form: string;
  meaning: string;
  position: string;
  class: string | null;
  example: string;
  example_gloss: string;
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
  examples: Example[];
  rhyme_families: { ending: string; members: string[]; count: number }[];
  legacy: {
    retired_roots: { old: string; replacement: string }[];
    respelled_roots: { old: string; new: string }[];
  };
}

export function loadLexicon(path: string): Lexicon {
  return JSON.parse(readFileSync(resolve(path), 'utf8')) as Lexicon;
}

/** id → spelling, from the 1.0 id sidecar. */
export function loadIdIndex(path: string): Map<string, string> {
  const raw = JSON.parse(readFileSync(resolve(path), 'utf8')) as {
    minted: { headword: Record<string, string> };
  };
  return new Map(Object.entries(raw.minted.headword).map(([spelling, id]) => [id, spelling]));
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
  readonly compoundsBy = new Map<string, { asModifier: Headword[]; asHead: Headword[] }>();

  constructor(readonly lex: Lexicon) {
    for (const h of lex.headwords) {
      this.byRoot.set(h.root, h);
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
    ];
    for (const f of closedForms) for (const t of tokenize(f)) this.closed.add(t);

    // Every token of every live example, ruling example and particle example
    // is canon text; names (Kipo, Dorin, Melodia …) come in this way.
    const texts = [
      ...liveExamples(lex).map((e) => e.liraasa),
      ...[...lex.rulings_1_0, ...lex.rulings_1_2, ...lex.rulings_0_8_carried].flatMap((r) =>
        (r.examples ?? []).map(([l]) => l),
      ),
      ...lex.discourse_particles.flatMap((p) => p.examples.map((e) => e.liraasa)),
      ...lex.function_words.map((w) => w.example),
      ...lex.pronouns.flatMap((p) => [p.possessive, p.reflexive]),
    ];
    for (const text of texts) for (const t of tokenize(text)) this.attested.add(t);

    for (const r of lex.legacy.retired_roots) this.retired.add(r.old);
    for (const r of lex.legacy.respelled_roots) this.retired.add(r.old);
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
    // -ri, -ti, -tiri on a known form or closed word.
    for (const suffix of ['tiri', 'ri', 'ti']) {
      if (token.endsWith(suffix)) {
        const stem = token.slice(0, -suffix.length);
        if (this.forms.has(stem) || this.closed.has(stem)) return true;
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
    return false;
  }

  /** The unused-slot readings of a token, if any reading of it is unused. */
  unusedReadings(token: string): FormHit[] {
    const hits = this.forms.get(token) ?? [];
    if (hits.length === 0 || this.closed.has(token) || this.attested.has(token)) return [];
    return hits.every((h) => !isUsed(h.headword, h.slot)) ? hits : [];
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
