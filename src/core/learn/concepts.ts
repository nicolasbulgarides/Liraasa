/**
 * Grammar concepts, derived from the grammar sections of the data:
 *
 *   form:<slot>     the seven forms          morphology.seven_forms, verb_rule
 *   suffix:<x>      -ti -ri -yo -vu -pago    morphology.suffixes, suffix_order
 *   compound        MODIFIER+HEAD            morphology.compounding
 *   nounPhrase      the noun phrase          grammar.noun_phrase
 *   clause          the clause template      grammar.clause_template
 *   slot:<NAME>     one per clause slot      grammar.slots
 *   numbers         0–999                    numbers
 *   rule:<ref>      one per ruling           rulings_1_0, rulings_0_8_carried, rulings_1_2
 *
 * Titles and descriptions are the data's own words. The only structure added
 * here is the dependency skeleton (forms before the clause, the clause before
 * its slots), and the links from a ruling to the concepts it is about, which
 * are read from the ruling's `refines` and from the slot names and words its
 * text mentions. A ruling that links to nothing is reported, and the author's
 * `rulingLinks` override wins over anything derived.
 */
import { FORM_SLOTS, type FormSlot } from '../config/slots';
import { resolveSpelling, type LexiconIndexes } from '../model/indexes';
import type { RawLexicon } from '../model/raw';
import type { Lexicon } from '../model/types';
import type { Concept, ConceptId, Gap, Overrides } from './types';

/** Closed-class namespaces a slot's word list may name. */
const CLOSED = new Set(['functionWord', 'pronoun', 'correlative', 'discourseParticle', 'timeWord']);

interface RawSlot {
  n: number;
  slot: string;
  words?: string[];
  notes?: string;
}

interface RawMorphology {
  seven_forms?: string[];
  verb_rule?: Record<string, string>;
  suffix_order?: string;
  suffixes?: Record<string, string>;
  compounding?: string;
}

interface RawMotion {
  canon?: Record<string, string>;
  rule?: string;
}

interface RawGrammarSections {
  clause_template?: string;
  noun_phrase?: string;
  slots?: RawSlot[];
}

/** `negativeAdjective` → `negative adjective`; `TENSE` → `tense`. */
export function humanize(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase();
}

export const formConcept = (slot: FormSlot): ConceptId => `form:${slot}`;
export const slotConcept = (name: string): ConceptId => `slot:${name}`;
export const suffixConcept = (suffix: string): ConceptId => `suffix:${suffix.replace(/^-/, '')}`;
export const rulingConcept = (ref: string): ConceptId => `rule:${ref}`;
export const CLAUSE: ConceptId = 'clause';
export const COMPOUND: ConceptId = 'compound';
export const NOUN_PHRASE: ConceptId = 'nounPhrase';
export const NUMBERS: ConceptId = 'numbers';
export const MOTION: ConceptId = 'motion';

/** The closed-class entries a slot's description names. */
function slotWords(indexes: LexiconIndexes, descriptions: readonly string[]): string[] {
  const out: string[] = [];
  for (const d of descriptions) {
    // a parenthesis gives examples (2.5: "prepositional phrases of place (En li nimu, …)"), not the slot's words
    for (const w of d
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .match(/[a-z]+(?:-[a-z]+)*/g) ?? []) {
      for (const r of resolveSpelling(indexes, w).refs) {
        if (CLOSED.has(r.namespace) && !out.includes(r.entryId)) out.push(r.entryId);
      }
    }
  }
  return out;
}

export function deriveConcepts(
  lexicon: Lexicon,
  raw: RawLexicon,
  indexes: LexiconIndexes,
  overrides: Overrides,
): { concepts: Map<ConceptId, Concept>; gaps: Gap[] } {
  const concepts = new Map<ConceptId, Concept>();
  const gaps: Gap[] = [];
  const add = (c: Omit<Concept, 'words' | 'prereqs'> & Partial<Concept>): void => {
    concepts.set(c.id, { words: [], prereqs: [], ...c });
  };
  const morphology = raw.morphology as RawMorphology;
  const grammar = raw.grammar as RawGrammarSections;

  /* the seven forms, in canonical order; morphology.seven_forms lists their builds in the same order */
  const builds = morphology.seven_forms ?? [];
  const verbRule = Object.entries(morphology.verb_rule ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
  FORM_SLOTS.forEach((slot, i) => {
    const build = builds[i] ?? '';
    add({
      id: formConcept(slot),
      kind: 'form',
      title: `The ${humanize(slot)} form`,
      description: slot === 'verb' && verbRule ? `${build} — verb rule: ${verbRule}` : build,
      source: `morphology.seven_forms[${String(i)}]`,
      formSlot: slot,
      prereqs: slot === 'root' ? [] : [formConcept('root')],
    });
  });

  for (const [suffix, meaning] of Object.entries(morphology.suffixes ?? {})) {
    add({
      id: suffixConcept(suffix),
      kind: 'suffix',
      title: `${suffix}: ${meaning}`,
      description: [meaning, morphology.suffix_order].filter(Boolean).join(' — '),
      source: `morphology.suffixes.${suffix}`,
      prereqs: [formConcept('root')],
    });
  }

  add({
    id: COMPOUND,
    kind: 'compound',
    title: 'Compounds',
    description: morphology.compounding ?? '',
    source: 'morphology.compounding',
    prereqs: [formConcept('root')],
  });
  add({
    id: NOUN_PHRASE,
    kind: 'nounPhrase',
    title: 'The noun phrase',
    description: grammar.noun_phrase ?? '',
    source: 'grammar.noun_phrase',
    // the closed words the pattern spells out: its articles, de, raho …
    words: slotWords(indexes, [grammar.noun_phrase ?? '']),
    prereqs: [formConcept('adjective')],
  });
  const motion = raw.motion_prefixes as RawMotion;
  if (motion.canon !== undefined) {
    add({
      id: MOTION,
      kind: 'motion',
      title: 'Motion prefixes',
      description: [
        Object.entries(motion.canon)
          .map(([p, m]) => `${p} ${m}`)
          .join('; '),
        motion.rule,
      ]
        .filter(Boolean)
        .join(' — '),
      source: 'motion_prefixes',
      prereqs: [formConcept('verb')],
    });
  }
  add({
    id: CLAUSE,
    kind: 'clause',
    title: 'The clause',
    description: grammar.clause_template ?? '',
    source: 'grammar.clause_template',
    prereqs: [formConcept('verb')],
  });

  for (const s of grammar.slots ?? []) {
    const words = slotWords(indexes, s.words ?? []);
    add({
      id: slotConcept(s.slot),
      kind: 'slot',
      title: `Slot ${String(s.n)}: ${humanize(s.slot)}`,
      description: [(s.words ?? []).join(', '), s.notes].filter(Boolean).join(' — '),
      source: `grammar.slots[${String(s.n - 1)}]`,
      slot: s.n,
      words,
      prereqs: [CLAUSE],
    });
  }

  if ((raw.numbers as { lookup_0_999?: unknown } | undefined)?.lookup_0_999 !== undefined) {
    add({
      id: NUMBERS,
      kind: 'numbers',
      title: 'Numbers',
      description: 'The number words 0–999 from the data’s number table.',
      source: 'numbers',
      prereqs: [formConcept('root')],
    });
  }

  /* rulings: link each to the concepts it is about */
  const slotNames = (grammar.slots ?? []).map((s) => s.slot);
  const wordToSlot = new Map<string, ConceptId>();
  for (const c of concepts.values()) {
    if (c.kind !== 'slot') continue;
    for (const id of c.words) wordToSlot.set(id, c.id);
  }
  const suffixes = Object.keys(morphology.suffixes ?? {});
  const rulingRefs = new Set(lexicon.rulings.map((r) => r.ref));

  for (const r of lexicon.rulings) {
    const id = rulingConcept(r.ref);
    const links = new Set<ConceptId>();
    const override = overrides.rulingLinks[r.ref];
    if (override !== undefined) {
      for (const c of override) links.add(c);
    } else {
      for (const ref of r.refines) {
        const slot = slotNames.find((name) => new RegExp(`\\b${name}\\b`).test(ref));
        if (slot !== undefined) links.add(slotConcept(slot));
        if (rulingRefs.has(ref)) links.add(rulingConcept(ref));
      }
      const text = `${r.topic} ${r.ruling}`;
      for (const name of slotNames) {
        if (new RegExp(`\\b${name}\\b`).test(text)) links.add(slotConcept(name));
      }
      for (const w of text.toLowerCase().match(/[a-z]+(?:-[a-z]+)*/g) ?? []) {
        for (const ref of resolveSpelling(indexes, w).refs) {
          const slot = wordToSlot.get(ref.entryId);
          if (slot !== undefined) links.add(slot);
        }
      }
      for (const suffix of suffixes) {
        if (text.includes(suffix)) links.add(suffixConcept(suffix));
      }
      if (/\bcompound/i.test(text)) links.add(COMPOUND);
      if (/\bnoun phrase/i.test(text)) links.add(NOUN_PHRASE);
    }
    links.delete(id);
    const prereqs = [...links].filter((c) => c !== id);
    if (prereqs.length === 0 && !overrides.exclude.includes(id)) {
      gaps.push({
        severity: 'note',
        code: 'ruling-unlinked',
        ref: r.ref,
        message: `${r.ref} (“${r.topic}”) mentions no slot, closed word or suffix, so it is taught after the clause. Link it with rulingLinks to place it.`,
      });
    }
    add({
      id,
      kind: 'ruling',
      title: `${r.ref} — ${r.topic}`,
      description: r.ruling,
      source: `rulings (${r.edition})`,
      ruleRef: r.ref,
      prereqs: prereqs.length > 0 ? prereqs : [CLAUSE],
    });
  }

  /* an override may name a concept that does not exist */
  for (const [ref, ids] of Object.entries(overrides.rulingLinks)) {
    if (!rulingRefs.has(ref)) {
      gaps.push({
        severity: 'error',
        code: 'override-unknown-ruling',
        ref,
        message: `rulingLinks names ${ref}, which is not a ruling in ${lexicon.version}.`,
      });
    }
    for (const c of ids) {
      if (!concepts.has(c)) {
        gaps.push({
          severity: 'error',
          code: 'override-unknown-concept',
          ref,
          message: `rulingLinks for ${ref} names concept ${c}, which does not exist.`,
        });
      }
    }
  }

  // a ruling may refine another that refines it back: drop the edge that closes the loop
  for (const c of concepts.values()) {
    const kept = c.prereqs.filter((p) => !reaches(concepts, p, c.id));
    if (kept.length !== c.prereqs.length) concepts.set(c.id, { ...c, prereqs: kept });
  }
  return { concepts, gaps };
}

/** Whether `to` is reachable from `from` through prerequisites. */
function reaches(
  concepts: ReadonlyMap<ConceptId, Concept>,
  from: ConceptId,
  to: ConceptId,
): boolean {
  const seen = new Set<ConceptId>();
  const stack = [from];
  while (stack.length > 0) {
    const c = stack.pop();
    if (c === undefined) break;
    if (c === to) return true;
    if (seen.has(c)) continue;
    seen.add(c);
    for (const p of concepts.get(c)?.prereqs ?? []) stack.push(p);
  }
  return false;
}
