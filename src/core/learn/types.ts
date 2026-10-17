/**
 * The learning module's read-only view of the language (Learn Phase 1).
 *
 * Everything here is derived at load time from the lexicon, its grammar
 * sections and the corpus. Nothing is stored by spelling: items, concepts and
 * skill-graph nodes are keyed by the lexicon's stable ids and by
 * edition-qualified ruling ids, so a respelled root keeps its progress and
 * every lesson shows the new spelling on the next load.
 */
import type { FormSlot } from '../config/slots';
import type { EntryId } from '../model/types';

/* ------------------------------------------------------------------ items */

/** Which part of the lexicon an item comes from. */
export type ItemKind =
  | 'root'
  | 'compound'
  | 'functionWord'
  | 'pronoun'
  | 'correlative'
  | 'timeWord'
  | 'color'
  | 'particle';

/** One of a headword's seven forms. */
export interface LearnForm {
  slot: FormSlot;
  form: string;
  gloss: string;
  /** False for a slot glossed "— (unused)": never quizzed for a meaning. */
  meaningful: boolean;
}

/** Anything a learner can know: a headword or a closed-class word. */
export interface LearnItem {
  id: EntryId;
  kind: ItemKind;
  /** The current spelling. Display only: never a key. */
  spelling: string;
  /** The primary English meaning, as the data words it. */
  meaning: string;
  /** The lexicon's `domain` for a headword; the section for a closed word. */
  theme: string;
  register: string | null;
  /** Seven forms for a headword; empty for a closed-class word. */
  forms: readonly LearnForm[];
  /** English synonyms the data accepts for this item. */
  synonyms: readonly string[];
  /** `[modifier, head]` ids for a compound; null otherwise. */
  components: readonly [EntryId, EntryId] | null;
  /** Compounds that use this headword as a part. */
  usedIn: readonly EntryId[];
  /** The edition the item arrived in, as the data records it. */
  since: string;
  /** NEW / REGLOSSED in the current edition, when the data says so. */
  status: string | null;
}

/* ----------------------------------------------------------------- tokens */

/** What a word in a text resolved to. */
export type TokenLink =
  | {
      kind: 'entry';
      refs: readonly { id: EntryId; namespace: string; slot?: FormSlot; derivation?: string }[];
      /** How it was reached when not by exact spelling. */
      via?: 'legacy' | 'plural' | 'diminutive' | 'motion';
      /** For `via: 'legacy'`, the spelling written in the text. */
      legacyFrom?: string;
      /** For `via: 'motion'`, the motion prefix, e.g. as the data spells it. */
      prefix?: string;
    }
  | { kind: 'number'; value: number; form?: 'ordinal' | 'fraction' }
  | { kind: 'name' }
  | { kind: 'unknown' };

export interface LinkedToken {
  text: string;
  start: number;
  end: number;
  link: TokenLink;
}

/* --------------------------------------------------------------- examples */

export type ExampleSource = 'examples' | 'ruling' | 'functionWord' | 'particle' | 'corpus';

/** A sentence a lesson can show or an exercise can draw on. */
export interface LearnExample {
  /** Stable while the text is unchanged: `ex:` plus a hash of the text. */
  key: string;
  liraasa: string;
  english: string | null;
  source: ExampleSource;
  /** The ruling a ruling example illustrates. */
  ruleRef?: string;
  /** Where a corpus line comes from: `text-id:line`. */
  where?: string;
  tokens: readonly LinkedToken[];
  /** Every entry id the sentence uses. */
  ids: readonly EntryId[];
  /** Concepts the sentence exercises. */
  concepts: readonly ConceptId[];
}

/* ----------------------------------------------------------------- corpus */

export interface CorpusLine {
  n: number;
  liraasa: string;
  english: string | null;
  tokens: readonly LinkedToken[];
}

export interface CorpusText {
  id: string;
  title: string;
  /** File path or store key it was read from. */
  source: string;
  lines: readonly CorpusLine[];
}

/** A raw corpus file before linking. */
export interface CorpusFile {
  id: string;
  title: string;
  source: string;
  text: string;
}

/* --------------------------------------------------------------- concepts */

/** `form:verb`, `slot:TENSE`, `suffix:ri`, `rule:1.2:G24`, `clause`, … */
export type ConceptId = string;

export type ConceptKind =
  | 'form'
  | 'suffix'
  | 'compound'
  | 'nounPhrase'
  | 'clause'
  | 'slot'
  | 'numbers'
  | 'motion'
  | 'ruling';

/** A grammar concept, derived from the grammar sections of the data. */
export interface Concept {
  id: ConceptId;
  kind: ConceptKind;
  /** An English title, from the data's own labels. */
  title: string;
  /** The data's own description, verbatim. */
  description: string;
  /** Where in the data it comes from, for the author. */
  source: string;
  /** Edition-qualified ruling id, for a ruling. */
  ruleRef?: string;
  /** Clause slot number, for a slot. */
  slot?: number;
  /** Form slot, for a form concept. */
  formSlot?: FormSlot;
  /** Closed-class words that belong to the concept (a slot's words). */
  words: readonly EntryId[];
  /** Concepts this one builds on. */
  prereqs: readonly ConceptId[];
}

/* ------------------------------------------------------------------- data */

export interface LearnData {
  /** The lexicon's version, e.g. `1.2`. */
  edition: string;
  items: ReadonlyMap<EntryId, LearnItem>;
  concepts: ReadonlyMap<ConceptId, Concept>;
  examples: readonly LearnExample[];
  texts: readonly CorpusText[];
  /** How often each item occurs: corpus lines and example sentences. */
  frequency: ReadonlyMap<EntryId, { corpus: number; examples: number }>;
  /** Number words, spelling to value, from the data's own table. */
  numbers: ReadonlyMap<string, number>;
  /** Proper names attested in texts. */
  names: ReadonlySet<string>;
  /** Problems found while deriving all of this, for the author. */
  gaps: readonly Gap[];
}

/* -------------------------------------------------------------- the graph */

export type NodeKind = 'root' | 'concept' | 'pattern';

/** `root:<entry id>`, `concept:<concept id>`, `pattern:<entry id>`. */
export type NodeId = string;

export interface SkillNode {
  id: NodeId;
  kind: NodeKind;
  /** The item id or concept id the node teaches. */
  ref: string;
  prereqs: readonly NodeId[];
  level: 'core' | 'advanced';
  /** Index into `SkillGraph.units`. */
  unit: number;
  /** Position in the whole path. */
  order: number;
  /** For a pattern: the compounds built on its root. */
  members?: readonly EntryId[];
}

export interface Unit {
  id: string;
  index: number;
  /** The theme most of the unit's roots share, if any. */
  theme: string | null;
  nodes: readonly NodeId[];
}

export interface SkillGraph {
  edition: string;
  nodes: ReadonlyMap<NodeId, SkillNode>;
  units: readonly Unit[];
  /** Every node in path order. */
  order: readonly NodeId[];
}

/* -------------------------------------------------------------- overrides */

/** An author-written lesson that sits alongside the generated ones. */
export interface CustomLesson {
  id: string;
  title: string;
  /** Placed right after this node in the path. */
  after?: NodeId;
  /** Item ids, concept ids or ruling ids the lesson is about. */
  refs: readonly string[];
  /** Markdown, written by the author. */
  body: string;
}

/**
 * The author's curriculum overrides. Stored apart from the lexicon and keyed
 * by id, never by spelling, so a respelling leaves them valid.
 */
export interface Overrides {
  version: 1;
  /** Nodes to teach first, in this order (prerequisites still come before). */
  pins: readonly NodeId[];
  /** Item or concept id → core (taught early) or advanced (taught last). */
  levels: Readonly<Record<string, 'core' | 'advanced'>>;
  /** Item, concept or ruling id → hand-written explanation and mnemonic. */
  notes: Readonly<Record<string, { explanation?: string; mnemonic?: string }>>;
  lessons: readonly CustomLesson[];
  /** Ruling id → the concepts it belongs to, overriding the derived link. */
  rulingLinks: Readonly<Record<string, readonly ConceptId[]>>;
  /** Concepts left out of the curriculum: project policy rather than grammar. */
  exclude: readonly ConceptId[];
  /**
   * Ruling id → sentences (by example key) the author confirmed illustrate it.
   * For the rulings the data gives no examples; candidates come from
   * `candidateExamples`, never from invented text.
   */
  rulingExamples: Readonly<Record<string, readonly string[]>>;
}

/* ------------------------------------------------------------------- gaps */

export type GapSeverity = 'error' | 'warn' | 'note';

/** Something the data or the overrides lack, surfaced to the author. */
export interface Gap {
  severity: GapSeverity;
  code: string;
  /** The id, concept or text the gap is about. */
  ref: string;
  message: string;
}
