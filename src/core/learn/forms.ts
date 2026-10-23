/**
 * The forms engine (Training Hall Phase 1): given an entry id, every form of
 * the word, with the rule that builds it and whether the word obeys it.
 *
 * The rules are read from the lexicon's own `morphology` section at load, not
 * from `config/morphology.ts`, so an edition that changes a marker changes
 * every table and drill with no code change:
 *
 *   seven_forms   "R", "R+asa", … "VERB"     one pattern per slot, canonical order
 *   verb_rule     "n-initial": "R+nia", …    the four classes; any other key is a word
 *                 "opi": "opioa"             listed irregular: the word → its verb
 *   lexicalised_derivations                  "gloss: base + -suffix", fixed meanings
 *
 * The stored form is canon (every headword is `protected`), so the engine
 * always shows it. It computes what the rule alone would give beside it: a
 * form is irregular when the two differ. A word the data lists as irregular is
 * expected; a difference the data does not list is a finding, reported as a
 * gap and never corrected.
 *
 * Nothing here holds Liraasa. Every spelling comes from the data.
 */
import { VOWELS } from '../config/morphology';
import { FORM_SLOTS, type FormSlot } from '../config/slots';
import type { RawMorphology } from '../model/raw';
import type { EntryId } from '../model/types';
import { formConcept, suffixConcept } from './concepts';
import type { EditionSnapshot } from './diff';
import { glossLine, type GlossedToken } from './lessons';
import type { ConceptId, ExampleSource, Gap, ItemKind, LearnData, Overrides } from './types';

/* ------------------------------------------------------------------ rules */

/** One of the four verb classes the data defines, or a word it lists. */
export type VerbClass = 'n-initial' | 's-initial' | 'vowel-initial' | 'otherwise' | 'listed';

/** The classes in the order they are checked; the data's own keys. */
export const VERB_CLASSES = ['n-initial', 's-initial', 'vowel-initial', 'otherwise'] as const;

/** How one slot is built: a fixed suffix on the root, or the verb rule. */
export type SlotRule =
  | { slot: FormSlot; pattern: string; kind: 'suffix'; suffix: string }
  | { slot: FormSlot; pattern: string; kind: 'verb' }
  /** A pattern the engine cannot read: the slot shows its stored form only. */
  | { slot: FormSlot; pattern: string; kind: 'unknown' };

export interface VerbClassRule {
  cls: (typeof VERB_CLASSES)[number];
  /** The data's own wording, e.g. "R+nia". */
  pattern: string;
  /** `n-initial` and `s-initial`: the letter that selects the class. */
  letter?: string;
  /** The ending after the root; for `otherwise`, after the root's first consonant. */
  ending: string;
}

export interface FormRules {
  edition: string;
  slots: readonly SlotRule[];
  verb: readonly VerbClassRule[];
  /** Word → its verb, as `verb_rule` lists it. */
  irregularVerbs: Readonly<Record<string, string>>;
  vowels: string;
  lexicalised: readonly LexicalisedDerivation[];
  /** The suffixes, as `morphology.suffixes` lists them: `-ri` → "plural (always last)". */
  suffixes: readonly { spelling: string; meaning: string }[];
}

/** A derivation whose meaning is fixed by the data, not composed (1.0:G20). */
export interface LexicalisedDerivation {
  spelling: string;
  base: string;
  suffix: string;
  gloss: string;
}

const CLASS_LETTER: Readonly<Record<string, string>> = { 'n-initial': 'n', 's-initial': 's' };

/** `R+asa` → `asa`; `R` → ``; anything else → null. */
function suffixOf(pattern: string): string | null {
  const m = /^R(?:\s*\+\s*([a-z]+))?$/.exec(pattern.trim());
  return m === null ? null : (m[1] ?? '');
}

/** The vowels as the data lists them: "a e i o u (pure); …". */
function vowelsOf(phonology: unknown): string | null {
  const raw = (phonology as { vowels?: unknown } | undefined)?.vowels;
  if (typeof raw !== 'string') return null;
  const letters = (raw.split('(')[0] ?? '').match(/\b[a-z]\b/g);
  return letters === null ? null : letters.join('');
}

/**
 * Read the form rules from one edition's `morphology` (and `phonology` for
 * the vowels). Anything unreadable is a gap; the slot it governs then shows
 * its stored form with no rule beside it.
 */
export function readFormRules(
  morphology: RawMorphology,
  edition: string,
  phonology?: unknown,
): { rules: FormRules; gaps: Gap[] } {
  const gaps: Gap[] = [];
  const gap = (code: string, ref: string, message: string): void => {
    gaps.push({ severity: 'error', code, ref, message });
  };

  const patterns = morphology.seven_forms;
  if (patterns.length !== FORM_SLOTS.length) {
    gap(
      'forms-rule-shape',
      'morphology.seven_forms',
      `seven_forms lists ${String(patterns.length)} patterns; the engine reads them in the order ${FORM_SLOTS.join(', ')}.`,
    );
  }
  const slots: SlotRule[] = FORM_SLOTS.map((slot, i) => {
    const pattern = patterns[i] ?? '';
    if (pattern.trim() === 'VERB') return { slot, pattern, kind: 'verb' };
    const suffix = suffixOf(pattern);
    if (suffix !== null) return { slot, pattern, kind: 'suffix', suffix };
    gap(
      'forms-rule-unreadable',
      `form:${slot}`,
      `The ${slot} pattern "${pattern}" is not R, R+suffix or VERB.`,
    );
    return { slot, pattern, kind: 'unknown' };
  });

  const verb: VerbClassRule[] = [];
  const irregularVerbs: Record<string, string> = {};
  const known = new Set<string>(VERB_CLASSES);
  for (const [key, value] of Object.entries(morphology.verb_rule)) {
    if (!known.has(key)) {
      irregularVerbs[key] = value;
      continue;
    }
    const cls = key as (typeof VERB_CLASSES)[number];
    const ending =
      cls === 'otherwise'
        ? /^R\s*\+\s*first consonant\s*\+\s*([a-z]+)$/.exec(value.trim())?.[1]
        : (suffixOf(value) ?? undefined);
    if (ending === undefined) {
      gap(
        'verb-rule-unreadable',
        `verb_rule.${key}`,
        `The verb rule "${key}: ${value}" cannot be read.`,
      );
      continue;
    }
    const letter = CLASS_LETTER[cls];
    verb.push({ cls, pattern: value, ending, ...(letter !== undefined ? { letter } : {}) });
  }
  verb.sort((a, b) => VERB_CLASSES.indexOf(a.cls) - VERB_CLASSES.indexOf(b.cls));
  for (const cls of VERB_CLASSES) {
    if (!verb.some((v) => v.cls === cls)) {
      gap('verb-rule-missing', `verb_rule.${cls}`, `verb_rule has no "${cls}" class.`);
    }
  }

  const vowels = vowelsOf(phonology);
  if (vowels === null && phonology !== undefined) {
    gaps.push({
      severity: 'warn',
      code: 'vowels-unreadable',
      ref: 'phonology.vowels',
      message: `phonology.vowels could not be read; using ${VOWELS}.`,
    });
  }

  const lexicalised: LexicalisedDerivation[] = [];
  // 2.5:G122: the lexicalised -ti words are read with the derivations
  for (const [spelling, text] of Object.entries({
    ...morphology.lexicalised_derivations,
    ...(morphology.lexicalised_diminutives ?? {}),
  })) {
    const cut = text.lastIndexOf(': ');
    const m = /^([a-z]+)\s*\+\s*-([a-z]+)$/.exec(cut < 0 ? '' : text.slice(cut + 2).trim());
    const base = m?.[1];
    const suffix = m?.[2];
    if (base === undefined || suffix === undefined || base + suffix !== spelling) {
      gaps.push({
        severity: 'warn',
        code: 'lexicalised-unreadable',
        ref: spelling,
        message: `lexicalised_derivations.${spelling} ("${text}") is not "gloss: base + -suffix" spelling ${spelling}.`,
      });
      continue;
    }
    lexicalised.push({ spelling, base, suffix, gloss: text.slice(0, cut).trim() });
  }

  return {
    rules: {
      edition,
      slots,
      verb,
      irregularVerbs,
      vowels: vowels ?? VOWELS,
      lexicalised,
      suffixes: Object.entries(morphology.suffixes).map(([key, meaning]) => ({
        spelling: key.replace(/^-/, ''),
        meaning,
      })),
    },
    gaps,
  };
}

/* ----------------------------------------------------------- building one */

/** A piece of a form, for marking the morpheme boundary: root·marker. */
export interface Morph {
  text: string;
  role: 'root' | 'marker' | 'whole';
}

export interface RuleResult {
  /** What the rule alone produces; null when the slot's rule is unreadable. */
  form: string | null;
  parts: readonly Morph[];
  /** The data's pattern for the slot, e.g. "R+asa" or the verb class's "R+nia". */
  pattern: string;
  /** The verb class the rule chose, for the verb slot. */
  verbClass?: (typeof VERB_CLASSES)[number];
}

/** The verb class the rule gives a spelling, ignoring the listed irregulars. */
export function verbClassFor(rules: FormRules, spelling: string): VerbClassRule | undefined {
  const first = spelling[0] ?? '';
  return rules.verb.find((v) =>
    v.letter !== undefined
      ? first === v.letter
      : v.cls === 'vowel-initial'
        ? rules.vowels.includes(first)
        : v.cls === 'otherwise',
  );
}

/** Build one slot of a spelling by the rule alone. Listed irregulars are not consulted. */
export function ruleForm(rules: FormRules, spelling: string, slot: FormSlot): RuleResult {
  const rule = rules.slots.find((s) => s.slot === slot);
  if (rule === undefined || rule.kind === 'unknown') {
    return { form: null, parts: [{ text: spelling, role: 'root' }], pattern: rule?.pattern ?? '' };
  }
  const root: Morph = { text: spelling, role: 'root' };
  if (rule.kind === 'suffix') {
    const parts =
      rule.suffix === '' ? [root] : [root, { text: rule.suffix, role: 'marker' as const }];
    return { form: spelling + rule.suffix, parts, pattern: rule.pattern };
  }
  const cls = verbClassFor(rules, spelling);
  if (cls === undefined) return { form: null, parts: [root], pattern: rule.pattern };
  const ending = cls.cls === 'otherwise' ? (spelling[0] ?? '') + cls.ending : cls.ending;
  return {
    form: spelling + ending,
    parts: [root, { text: ending, role: 'marker' }],
    pattern: cls.pattern,
    verbClass: cls.cls,
  };
}

/* -------------------------------------------------------------- the view */

export type IrregularReason =
  /** The data lists this word's form as an exception (`verb_rule`). */
  | 'listed'
  /** The stored form differs from the rule and the data does not say why: a finding. */
  | 'unexplained';

export interface WordForm {
  /** The slot: `root`, `ascended`, … `verb`, … */
  category: FormSlot;
  /** The stored, canonical form. */
  form: string;
  /** The English the data gives this form; `— (unused)` when it has none. */
  gloss: string;
  /** False for a slot the data glosses `— (unused)`. */
  meaningful: boolean;
  /** The concept that teaches this form: `form:<slot>`, links into the Loom. */
  ruleId: ConceptId;
  /** The data's pattern for this slot (or verb class). */
  pattern: string;
  /** The form split at the morpheme boundary; one `whole` piece when irregular. */
  parts: readonly Morph[];
  irregular: boolean;
  irregularReason: IrregularReason | null;
  /** The author's note on this form (`overrides.formNotes`), if any. */
  irregularNote: string | null;
  /** For an irregular: what the rule alone would produce. */
  regularWouldBe: string | null;
  /** The verb class, for the verb slot. */
  verbClass?: VerbClass;
  /**
   * For a compound's verb: the class comes from the whole word's first letter,
   * so from the modifier, and differs from the class the head alone would take.
   */
  classFromModifier?: { headClass: (typeof VERB_CLASSES)[number] };
  /** Set when a previous edition is given and this form's gloss changed since. */
  glossWas?: string;
}

export interface WordRef {
  id: EntryId;
  spelling: string;
  meaning: string;
}

export interface WordExample {
  key: string;
  liraasa: string;
  english: string | null;
  source: ExampleSource;
  where?: string;
  /** Which of the word's forms the sentence uses. */
  slots: readonly FormSlot[];
  /** The sentence word by word, for an interlinear gloss. */
  gloss: readonly GlossedToken[];
}

export interface WordForms {
  root: {
    id: EntryId;
    kind: ItemKind;
    spelling: string;
    /** The primary meaning, as the data words it (every sense of the root gloss). */
    gloss: string;
    /** The first sense of the root gloss: the headline when `altMeanings` lists the rest. */
    sense: string;
    /** The root gloss's other senses, where it lists several separated by `;`. */
    altMeanings: readonly string[];
    theme: string;
    register: string | null;
    /** The edition the word arrived in, as the data records it. */
    version: string;
    /** NEW / REGLOSSED in the current edition. */
    status: string | null;
    /** Set when a previous edition is given and the word was spelled differently there. */
    spellingWas?: string;
    /** For a compound: its parts, modifier then head. */
    parts: readonly WordRef[] | null;
  };
  /** The forms that apply: every form with a meaning, in canonical order. */
  forms: readonly WordForm[];
  /** Slots the data glosses `— (unused)`; empty with `includeUnused`. */
  unused: readonly FormSlot[];
  /** Compounds built on this word. */
  compounds: readonly WordRef[];
  /** Lexicalised derivations on this word, with their fixed meanings. */
  derivations: readonly (LexicalisedDerivation & { ruleId: ConceptId })[];
  examples: readonly WordExample[];
  hasIrregular: boolean;
}

export interface FormsOptions {
  /** Also return slots glossed `— (unused)` (default false). */
  includeUnused?: boolean;
  /** How many example sentences (default 3). Corpus lines come first. */
  examples?: number;
  /** The previous edition, for "changed since" notes. */
  previous?: EditionSnapshot;
}

export interface FormsEngine {
  rules: FormRules;
  /** Every form of an entry; null for an id that is not in this edition. */
  getForms: (id: EntryId, options?: FormsOptions) => WordForms | null;
  /** Whether a headword has an irregular form (cheap; for draw filters). */
  isIrregular: (id: EntryId) => boolean;
  /** Ids of every headword with an irregular form. */
  irregularIds: () => readonly EntryId[];
  /**
   * Words that go their own way: an irregular form, a compound whose
   * meaningful verb takes its class from the modifier, or the base of a
   * lexicalised derivation (whose meaning is not the sum of its parts).
   */
  surprisingIds: () => readonly EntryId[];
  /** Rule problems and every unexplained mismatch, summarised per slot. */
  gaps: readonly Gap[];
}

const SOURCE_ORDER: Readonly<Record<ExampleSource, number>> = {
  corpus: 0,
  examples: 1,
  ruling: 2,
  functionWord: 3,
  particle: 4,
};

export interface FormsInput {
  data: LearnData;
  /** The edition's `morphology` section, as stored. */
  morphology: RawMorphology;
  /** The edition's `phonology` section, for the vowels. */
  phonology?: unknown;
  overrides?: Overrides;
}

export function createFormsEngine(input: FormsInput): FormsEngine {
  const { data } = input;
  const read = readFormRules(input.morphology, data.edition, input.phonology);
  const { rules } = read;
  const notes = input.overrides?.formNotes ?? {};
  const bySpelling = new Map<string, EntryId>();
  for (const item of data.items.values()) {
    if (item.forms.length > 0) bySpelling.set(item.spelling, item.id);
  }

  /** Per slot: is each stored form what the rule makes, and if not, why. */
  const verdict = (
    spelling: string,
    slot: FormSlot,
    stored: string,
  ): { rule: RuleResult; reason: IrregularReason | null } => {
    const rule = ruleForm(rules, spelling, slot);
    if (rule.form === null || rule.form === stored) return { rule, reason: null };
    const listed = slot === 'verb' && rules.irregularVerbs[spelling] === stored;
    return { rule, reason: listed ? 'listed' : 'unexplained' };
  };

  /* audit every headword once: the irregular set and the findings */
  const irregular = new Set<EntryId>();
  const unexplained = new Map<FormSlot, string[]>();
  for (const item of data.items.values()) {
    for (const f of item.forms) {
      const { reason } = verdict(item.spelling, f.slot, f.form);
      if (reason === null) continue;
      irregular.add(item.id);
      if (reason === 'unexplained') {
        const list = unexplained.get(f.slot) ?? [];
        list.push(item.id);
        unexplained.set(f.slot, list);
      }
    }
  }
  for (const [word, form] of Object.entries(rules.irregularVerbs)) {
    const id = bySpelling.get(word);
    const stored =
      id === undefined ? undefined : data.items.get(id)?.forms.find((f) => f.slot === 'verb');
    if (stored === undefined || stored.form !== form) {
      read.gaps.push({
        severity: 'error',
        code: 'irregular-unmatched',
        ref: `verb_rule.${word}`,
        message:
          stored === undefined
            ? `verb_rule lists ${word} → ${form}, but ${word} is no headword in ${data.edition}.`
            : `verb_rule lists ${word} → ${form}, but the stored verb is ${stored.form}.`,
      });
    }
  }
  for (const [slot, ids] of unexplained) {
    read.gaps.push({
      severity: 'error',
      code: 'form-off-rule',
      ref: formConcept(slot),
      message: `${String(ids.length)} stored ${slot} forms differ from the rule ${rules.slots.find((s) => s.slot === slot)?.pattern ?? ''} and the data does not list them as irregular: ${ids.slice(0, 12).join(', ')}${ids.length > 12 ? ', …' : ''}. If the rule changed, the forms need a changeset; if the forms are right, the rule needs one.`,
    });
  }

  const ref = (id: EntryId): WordRef | null => {
    const i = data.items.get(id);
    return i === undefined ? null : { id, spelling: i.spelling, meaning: i.meaning };
  };
  const derivationsOf = new Map<string, LexicalisedDerivation[]>();
  // a derivation built on a derivation (lavbupago + -ti) shows on the headword under both
  const lexicalisedBySpelling = new Map(rules.lexicalised.map((d) => [d.spelling, d]));
  const rootOf = (base: string, seen = new Set<string>()): string => {
    const inner = lexicalisedBySpelling.get(base);
    if (bySpelling.has(base) || inner === undefined || seen.has(base)) return base;
    seen.add(base);
    return rootOf(inner.base, seen);
  };
  for (const d of rules.lexicalised) {
    const home = rootOf(d.base);
    if (!bySpelling.has(home)) {
      read.gaps.push({
        severity: 'warn',
        code: 'lexicalised-no-base',
        ref: d.spelling,
        message: `The lexicalised derivation ${d.spelling} is built on ${d.base}, which is no headword in ${data.edition}; no study card shows it.`,
      });
    }
    const list = derivationsOf.get(home) ?? [];
    list.push(d);
    derivationsOf.set(home, list);
  }

  const getForms = (id: EntryId, options: FormsOptions = {}): WordForms | null => {
    const item = data.items.get(id);
    if (item === undefined) return null;
    const was = options.previous?.items[id];
    const head = item.components !== null ? data.items.get(item.components[1]) : undefined;

    const forms: WordForm[] = [];
    const unused: FormSlot[] = [];
    for (const [i, f] of item.forms.entries()) {
      if (!f.meaningful && options.includeUnused !== true) {
        unused.push(f.slot);
        continue;
      }
      const { rule, reason } = verdict(item.spelling, f.slot, f.form);
      const off = reason !== null;
      const note = notes[`${id}|${f.slot}`];
      const verbClass: VerbClass | undefined =
        f.slot !== 'verb' ? undefined : reason === 'listed' ? 'listed' : rule.verbClass;
      const headClass =
        f.slot === 'verb' && head !== undefined && rule.verbClass !== undefined
          ? verbClassFor(rules, head.spelling)?.cls
          : undefined;
      const glossWas = was?.[3][i];
      forms.push({
        category: f.slot,
        form: f.form,
        gloss: f.gloss,
        meaningful: f.meaningful,
        ruleId: formConcept(f.slot),
        pattern: rule.pattern,
        parts: off ? [{ text: f.form, role: 'whole' }] : rule.parts,
        irregular: off,
        irregularReason: reason,
        irregularNote: note ?? null,
        regularWouldBe: off ? rule.form : null,
        ...(verbClass !== undefined ? { verbClass } : {}),
        ...(headClass !== undefined && headClass !== rule.verbClass && !off
          ? { classFromModifier: { headClass } }
          : {}),
        ...(glossWas !== undefined && glossWas !== f.gloss ? { glossWas } : {}),
      });
    }

    const root = item.forms.find((f) => f.slot === 'root');
    const senses = (root?.meaningful === true ? root.gloss : item.meaning)
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s !== '');
    // the other forms' glosses are in the table already: only the root's own senses
    const alt = new Set<string>(senses.slice(1));
    alt.delete(item.meaning);

    const limit = options.examples ?? 3;
    const examples = data.examples
      .filter((e) => e.ids.includes(id))
      .sort((a, b) => SOURCE_ORDER[a.source] - SOURCE_ORDER[b.source])
      .slice(0, limit)
      .map((e): WordExample => {
        const slots = new Set<FormSlot>();
        for (const t of e.tokens) {
          if (t.link.kind !== 'entry') continue;
          for (const r of t.link.refs) if (r.id === id && r.slot !== undefined) slots.add(r.slot);
        }
        return {
          key: e.key,
          liraasa: e.liraasa,
          english: e.english,
          source: e.source,
          ...(e.where !== undefined ? { where: e.where } : {}),
          slots: FORM_SLOTS.filter((s) => slots.has(s)),
          gloss: glossLine(data, e.tokens),
        };
      });

    return {
      root: {
        id,
        kind: item.kind,
        spelling: item.spelling,
        gloss: item.meaning,
        sense: alt.size > 0 ? (senses[0] ?? item.meaning) : item.meaning,
        altMeanings: [...alt],
        theme: item.theme,
        register: item.register,
        version: item.since,
        status: item.status,
        ...(was !== undefined && was[0] !== item.spelling ? { spellingWas: was[0] } : {}),
        parts:
          item.components === null
            ? null
            : item.components.map(ref).filter((r): r is WordRef => r !== null),
      },
      forms,
      unused,
      compounds: item.usedIn.map(ref).filter((r): r is WordRef => r !== null),
      derivations: (derivationsOf.get(item.spelling) ?? []).map((d) => ({
        ...d,
        ruleId: suffixConcept(d.suffix),
      })),
      examples,
      hasIrregular: irregular.has(id),
    };
  };

  let surprising: EntryId[] | null = null;
  const surprisingIds = (): readonly EntryId[] => {
    if (surprising !== null) return surprising;
    const out = new Set<EntryId>(irregular);
    for (const item of data.items.values()) {
      if (item.forms.length === 0) continue;
      const w = getForms(item.id, { examples: 0 });
      if (w === null) continue;
      if (w.derivations.length > 0) out.add(item.id);
      if (w.forms.some((f) => f.classFromModifier !== undefined)) out.add(item.id);
    }
    surprising = [...out];
    return surprising;
  };

  return {
    rules,
    getForms,
    isIrregular: (id) => irregular.has(id),
    irregularIds: () => [...irregular],
    surprisingIds,
    gaps: read.gaps,
  };
}
