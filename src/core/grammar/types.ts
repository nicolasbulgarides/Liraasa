/**
 * The strict checker's types (2.5, ADR-0020).
 *
 * One checker for the grammar editor and the translator: every word is read
 * into its possible readings, the sentence is parsed against the 2.5 clause
 * and noun-phrase templates, and every finding names its rule.
 */

/** What a word can be, for the parser. */
export type Pos =
  | 'noun'
  | 'verb'
  | 'adj'
  | 'pron'
  | 'name'
  | 'num'
  | 'ord'
  | 'det'
  | 'owner'
  | 'refl'
  | 'prep'
  | 'side'
  | 'comparison'
  | 'coord'
  | 'clauseAdv'
  | 'sub'
  | 'kiword'
  | 'quant'
  | 'degree'
  | 'chain'
  | 'hortative'
  | 'interjection'
  /** iya, opening a vocative noun phrase (3.0:G129). */
  | 'vocative'
  | 'timeAdv'
  | 'placeAdv'
  | 'mannerAdv'
  | 'op'
  | 'copula'
  | 'valency'
  | 'passive'
  | 'la'
  | 'adjunctHead'
  | 'recip'
  | 'status'
  | 'attitude'
  | 'ki'
  | 'frame'
  | 'topic'
  | 'scope'
  | 'sign'
  | 'discourse'
  | 'colour';

/** The seven form slots, by the reference's role codes. */
export type FormRole = 'n' | 'an' | 'nn' | 'v' | 'na' | 'a' | 'aa';

export interface Reading {
  pos: Pos;
  /** The spelling read (without -ti / -ri). */
  form: string;
  /** The headword, for an open-class form. */
  root?: string;
  role?: FormRole;
  gloss: string;
  /** For an operator: its slot name (TENSE, MODAL …). */
  slot?: string;
  /** How the reading was found. */
  source:
    | 'listed'
    | 'image'
    | 'image-predicted'
    | 'derivation'
    | 'derivation-listed'
    | 'diminutive-listed'
    | 'prefix'
    | 'closed'
    | 'numeral'
    | 'correlative'
    | 'name'
    /** 3.3:G148: the -san of a compound or listed derivation, by rule. */
    | 'relational';
  /** A correlative's concept, a function word's class … */
  detail?: string;
}

export interface WordAnalysis {
  text: string;
  lower: string;
  readings: Reading[];
  /** -ti / -ri found on the word, in order. */
  suffixes: ('ti' | 'ri')[];
  /** A motion prefix (2.5:G121). */
  prefix?: string;
  /** Not a reading: why the word is not a word of Liraasa today. */
  problem?:
    | { kind: 'unknown' }
    | { kind: 'unused'; root: string; role: FormRole }
    | { kind: 'legacy'; to: string; edition: string | null }
    | { kind: 'hyphenated-fraction' };
}

export interface Token {
  kind: 'word' | 'punct';
  text: string;
  start: number;
  end: number;
  word?: WordAnalysis;
  /** Capitalised and not the first word of its sentence. */
  capital?: boolean;
  /** Inside quotation marks, not after a colon: a word mentioned, not used. */
  quoted?: boolean;
}

export type Severity = 'error' | 'warn' | 'unruled' | 'note';

export interface Finding {
  severity: Severity;
  /** An edition-qualified ruling id, ADR-0011, or a reference path. */
  rule: string;
  message: string;
  /** Token indices (into the sentence's tokens) the finding is about. */
  at: number[];
  fix?: string;
}

/** The role a token plays in its clause, for the gloss. */
export type Role =
  | 'LINKER'
  | 'FRAME'
  | 'TOPIC'
  | 'KI-WORD'
  | 'SUBJECT'
  | 'TENSE'
  | 'REALITY'
  | 'NEGATION'
  | 'MODAL'
  | 'APPROACH'
  | 'PHASE'
  | 'EFFORT'
  | 'ASPECT'
  | 'ITERATION'
  | 'EVIDENTIAL'
  | 'VERB'
  | 'COPULA'
  | 'PREDICATE'
  | 'ACTOR'
  | 'RECIPIENT'
  | 'OBJECT'
  | 'ADJUNCT'
  | 'RECIPROCAL'
  | 'STATUS'
  | 'ATTITUDE'
  | 'QUESTION'
  | 'VOCATIVE'
  | 'SUBORDINATE'
  | 'INTERJECTION'
  | 'PUNCT';

export interface GlossRow {
  word: string;
  /** e.g. "lira + verb", "li (article)", "maivo (pronoun)". */
  analysis: string;
  gloss: string;
  role: Role | '';
  /** Which clause, counted from 0, and its kind. */
  clause: number;
  rules: string[];
  flags: string[];
}

export interface SentenceResult {
  text: string;
  /** Character offset of the sentence in its line. */
  offset: number;
  tokens: Token[];
  findings: Finding[];
  gloss: GlossRow[];
  /** Statement, question, command, exclamation, wish, fragment. */
  type: 'statement' | 'question' | 'command' | 'exclamation' | 'wish' | 'fragment';
  /** The parsed structure, for back-translation. */
  clauses: Clause[];
  /** Each token's role, by token index. */
  roleAt: (Role | '')[];
}

/** One noun phrase, as parsed. */
export interface NounPhrase {
  start: number;
  end: number;
  head: number | null;
  /** pronoun, name, noun, adjective-as-noun, correlative, number, demonstrative */
  headKind: 'pron' | 'name' | 'noun' | 'adj' | 'correlative' | 'num' | 'demonstrative' | 'kiword';
  det: number | null;
  quant: number | null;
  ord: number | null;
  num: number | null;
  adjectives: number[];
  degrees: number[];
  /** de + NP, grouped from the left (2.5:G96). */
  de: NounPhrase | null;
  /** Partitive or ownership; for the gloss. */
  deKind?: 'owner-left' | 'owner-right' | 'partitive';
  relative: Clause | null;
  refl: number | null;
  plural: boolean;
  /** A ata B, A oro B */
  and?: { linker: number; np: NounPhrase };
  /** gagu + the maker, after a noun naming a made work (3.0:G136). */
  maker?: NounPhrase;
  /** A title before a name: zilenela Peta (3.2:G145). */
  title?: number;
}

export interface Adjunct {
  kind:
    | 'pp'
    | 'la'
    | 'time'
    | 'place'
    | 'manner'
    | 'cause'
    | 'times'
    | 'comparison'
    | 'simile'
    | 'measure'
    | 'chain'
    | 'purpose'
    | 'iteration'
    | 'kiword';
  start: number;
  end: number;
  head: number;
  np: NounPhrase | null;
  clause: Clause | null;
  /** la [DEGREE] ADJ; gase ADJ gase NP */
  degree?: number;
  adj?: number;
  /** set off from what precedes it by a comma */
  commaBefore?: boolean;
}

/** A predicate after a copula; several are joined by ata / oro (parts). */
export interface Predicate {
  kind: 'adj' | 'np' | 'pp' | 'adv' | 'kiword';
  start: number;
  end: number;
  degree: number | null;
  tonsi: number | null;
  np?: NounPhrase | null;
  prep?: number;
  parts?: Predicate[];
  /** ne before the predicate: ka ne vanisan */
  ne?: number;
}

export interface Clause {
  kind: 'main' | 'relative' | 'content' | 'adverbial' | 'chain' | 'coordinate';
  /** The word that opens a subordinate or coordinate clause. */
  linker: number | null;
  start: number;
  end: number;
  frame: number[];
  topic: NounPhrase | null;
  kiFront: number | null;
  subject: NounPhrase | null;
  /** Operator token → its slot name. */
  ops: { at: number; slot: string }[];
  verb: number | null;
  /** copula, verb, valency, passive, bare-adjective, existential, become, none */
  predKind:
    | 'verb'
    | 'copula'
    | 'valency'
    | 'passive'
    | 'bare-adjective'
    | 'existential'
    | 'become'
    | 'none';
  actor: NounPhrase | null;
  actorOps: { at: number; slot: string }[];
  innerVerb: number | null;
  recipient: NounPhrase | null;
  object: NounPhrase | null;
  objectClause: Clause | null;
  predicate: Predicate | null;
  agent: NounPhrase | null;
  adjuncts: Adjunct[];
  closing: { at: number; slot: string }[];
  vocative: NounPhrase | null;
  /** iya vocatives opening the sentence, before the clause (3.0:G129). */
  address?: NounPhrase[];
  /** Clauses joined after this one (ata, nara, a comma …) or subordinate to it. */
  subordinates: Clause[];
  /** A scope operator before the clause's linker: yesta si …, doli si … (1.0:G10). */
  scope?: number;
  /** The FRAME phrases, by span (a noun phrase or a prepositional phrase). */
  frameItems?: { start: number; end: number; np?: NounPhrase | null; prep?: number }[];
  /** Interjections set off at the end (…, fisa.). */
  trailing?: number[];
  /** Closing words set off by a comma (…, zoke ki?). */
  closingComma?: boolean;
}
