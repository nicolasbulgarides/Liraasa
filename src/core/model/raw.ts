/**
 * The raw JSON shapes, exactly as the author's file stores them.
 *
 * These types describe `liraasa_1_0.json` and nothing else. Nothing outside
 * the mapping layer should import them — the rest of the app uses the internal
 * types in `types.ts`.
 *
 * Every interface carries an index signature so unknown fields survive a
 * round-trip (ADR-0002). Key order is preserved by never rebuilding these
 * objects; see `exportLexicon.ts`.
 */

export interface RawSlots {
  root: string;
  ascended: string;
  negative: string;
  verb: string;
  negative_adjective: string;
  adjective: string;
  ascended_adjective: string;
}

export interface RawHistory08 {
  status: string;
  editorial_note: string;
  [key: string]: unknown;
}

export interface RawHeadword {
  root: string;
  type: string;
  components: string[] | null;
  forms: RawSlots;
  glosses: RawSlots;
  register: string;
  domain: string;
  english_synonyms: string[] | string;
  status_1_0: string;
  since: string;
  replaces?: string;
  history_0_8: RawHistory08 | null;
  notes: string;
  protected: boolean;
  /** Additive, written from 1.1 on. Absent in the released 1.0 file. */
  id?: string;
  [key: string]: unknown;
}

export interface RawFunctionWord {
  form: string;
  meaning: string;
  position: string;
  example: string;
  example_gloss: string;
  class: string | null;
  status_1_0: string;
  since: string;
  notes?: string;
  examples?: { liraasa: string; english: string }[];
  id?: string;
  [key: string]: unknown;
}

export interface RawPronoun {
  form: string;
  person: string;
  number: string;
  possessive: string;
  reflexive: string;
  id?: string;
  [key: string]: unknown;
}

export interface RawCorrelative {
  form: string;
  determiner: string;
  concept: string;
  gloss: string;
  id?: string;
  [key: string]: unknown;
}

export interface RawTimeWord {
  form: string;
  english: string;
  id?: string;
  [key: string]: unknown;
}

/** Still keyed by workbook column names. */
export interface RawColor {
  Family: string;
  'Base color': string;
  'Dark + narvo': string;
  'Life + bio': string;
  'Gem + juba': string;
  'Light + lumi': string;
  'Example meanings / notes': string;
  id?: string;
  [key: string]: unknown;
}

export interface RawDiscourseParticle {
  form: string;
  function: string;
  positions: string;
  register: string;
  examples: { liraasa: string; english: string }[];
  id?: string;
  [key: string]: unknown;
}

export interface RawExample {
  liraasa: string;
  english: string;
  feature: string;
  status: string;
  source: string;
  changes?: string[];
  [key: string]: unknown;
}

export interface RawRuling {
  id: string;
  topic: string;
  ruling: string;
  [key: string]: unknown;
}

export interface RawRhymeFamily {
  ending: string;
  members: string[];
  count: number;
  [key: string]: unknown;
}

/** Still keyed by workbook column names. */
export interface RawNumberRule {
  Group: string;
  Value: string | number;
  Liraasa: string;
  'Construction rule': string;
  'English interpretation': string;
  'Usage / comment': string;
  [key: string]: unknown;
}

export interface RawNumbers {
  rules: RawNumberRule[];
  lookup_0_999: Record<string, string>;
  [key: string]: unknown;
}

export interface RawMigrationForm {
  to: string;
  slot: string;
  via: string;
  kind: string;
  [key: string]: unknown;
}

export interface RawRetiredRoot {
  old: string;
  replacement: string;
  components: string[];
  old_forms: RawSlots;
  old_glosses: RawSlots;
  new_forms: RawSlots;
  new_glosses: RawSlots;
  slot_fate: Record<string, string>;
  reason: string;
  tier?: string;
  reserved: unknown;
  [key: string]: unknown;
}

export interface RawRespelledRoot {
  old: string;
  new: string;
  old_forms: RawSlots;
  glosses: RawSlots;
  reason: string;
  reserved: unknown;
  [key: string]: unknown;
}

export interface RawRetiredCompound {
  old: string;
  disposition: string;
  new?: string;
  old_glosses: RawSlots;
  note: string;
  phrase?: string;
  [key: string]: unknown;
}

export interface RawLegacy {
  policy: string;
  retired_roots: RawRetiredRoot[];
  respelled_roots: RawRespelledRoot[];
  retired_compounds: RawRetiredCompound[];
  archived_senses: Record<string, unknown>[];
  migration_forms: Record<string, RawMigrationForm>;
  editorial_notes_0_7: Record<string, unknown>[];
  data_fixes_0_8: Record<string, unknown>[];
  rulings_0_8: RawRuling[];
  [key: string]: unknown;
}

export interface RawDisposition {
  disposition: string;
  result: string | null;
  reason: string;
  root?: string;
  word?: string;
  id?: string;
  tier?: string;
  audit_fusion?: string;
  concept?: string;
  type?: string;
  proposed?: string;
  [key: string]: unknown;
}

export interface RawDispositions {
  retirement_candidates: RawDisposition[];
  storytelling: RawDisposition[];
  root_review: RawDisposition[];
  unresolved_compounds: RawDisposition[];
  [key: string]: unknown;
}

export interface RawSoundLedgerEntry {
  spelling: string;
  state: string;
  replacement: string;
  reusable_from: string;
  why_reserved: string;
  [key: string]: unknown;
}

export interface RawChangelogEntry {
  stage: string;
  item: string;
  detail: string;
  [key: string]: unknown;
}

export interface RawSettledQuestion {
  q: string;
  answer: string;
  [key: string]: unknown;
}

export interface RawPhonology {
  vowels: string;
  consonants_core: string;
  consonants_other: string;
  stress: string;
  new_root_template: string;
  function_word_template: string;
  protected_exceptions: string[];
  declared_distance_1_pairs: [string, string][];
  [key: string]: unknown;
}

export interface RawMorphology {
  seven_forms: string[];
  verb_rule: Record<string, string>;
  suffix_order: string;
  suffixes: Record<string, string>;
  compounding: string;
  lexicalised_derivations: Record<string, string>;
  [key: string]: unknown;
}

export interface RawGrammarSlot {
  n: number;
  slot: string;
  words: string[];
  notes: string;
  [key: string]: unknown;
}

export interface RawGrammar {
  clause_template: string;
  slots: RawGrammarSlot[];
  scope_operators: { words: string[]; rule: string };
  stacking: {
    one_per_slot: boolean;
    exclusions: [string, string][];
    max_preverbal_operators_recommended: number;
    scope: string;
  };
  valency: Record<string, string>;
  noun_phrase: string;
  [key: string]: unknown;
}

export interface RawSnapshot08 {
  source_file: string;
  source_version: string;
  source_sha256: string;
  headwords: number;
  primal_roots: number;
  compounds: number;
  function_words: number;
  [key: string]: unknown;
}

/** The whole file. The 26 keys, in the order they appear. */
/**
 * The image-compound pattern (2.0:G40): any listed modifier + any listed head
 * is a word. Modifiers and heads are keyed by headword id; `attested` holds the
 * 391 former headwords, whole and with their ids, whose glosses are the
 * canonical readings of those pairs.
 */
export interface RawImageCompounds {
  name: string;
  ruling: string;
  rule: string;
  why: string;
  capacity: number;
  modifiers: Record<string, { as_modifier: string; sense: string }>;
  heads: Record<string, { template: string }>;
  kept_as_headwords: Record<string, string>;
  attested: RawHeadword[];
}

export interface RawLexicon {
  language: string;
  version: string;
  built_utc: string;
  source: string;
  snapshot_0_8: RawSnapshot08;
  phonology: RawPhonology;
  morphology: RawMorphology;
  motion_prefixes: {
    canon: Record<string, string>;
    retired: Record<string, string>;
    rule: string;
  };
  settled_open_questions_0_8: RawSettledQuestion[];
  headwords: RawHeadword[];
  function_words: RawFunctionWord[];
  pronouns: RawPronoun[];
  correlatives: RawCorrelative[];
  numbers: RawNumbers;
  time_and_dates: RawTimeWord[];
  colors: RawColor[];
  discourse_particles: RawDiscourseParticle[];
  grammar: RawGrammar;
  rulings_1_0: RawRuling[];
  rulings_0_8_carried: RawRuling[];
  /** From 1.2 on (ADR-0012): the rulings the changesets add, with examples. */
  rulings_1_2?: RawRuling[];
  rulings_2_0?: RawRuling[];
  /** 2.1 (ADR-0017): grammar rulings G46–G56 and the respelling rulings G57–G59. */
  rulings_2_1?: RawRuling[];
  /** The image-compound pattern (2.0:G40, ADR-0016). */
  image_compounds?: RawImageCompounds;
  examples: RawExample[];
  rhyme_families: RawRhymeFamily[];
  legacy: RawLegacy;
  sound_ledger: RawSoundLedgerEntry[];
  dispositions: RawDispositions;
  changelog_1_0: RawChangelogEntry[];
  [key: string]: unknown;
}

/** The order the 26 top-level keys must be written in. */
export const TOP_LEVEL_KEY_ORDER: readonly string[] = [
  'language',
  'version',
  'built_utc',
  'source',
  'snapshot_0_8',
  'phonology',
  'morphology',
  'motion_prefixes',
  'settled_open_questions_0_8',
  'headwords',
  'function_words',
  'pronouns',
  'correlatives',
  'numbers',
  'time_and_dates',
  'colors',
  'discourse_particles',
  'grammar',
  'rulings_1_0',
  'rulings_0_8_carried',
  'examples',
  'rhyme_families',
  'legacy',
  'sound_ledger',
  'dispositions',
  'changelog_1_0',
];
