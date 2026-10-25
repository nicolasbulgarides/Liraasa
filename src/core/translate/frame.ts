/**
 * The translator's two frames (2.5, ADR-0020).
 *
 * - MeaningFrame: what an English sentence means, in English lemmas and
 *   features (clause type, tense, aspect, modal, negation, roles, links). An
 *   LLM may help fill it; it is never Liraasa text.
 * - LSentence: the same meaning laid out in the 2.5 templates with Liraasa
 *   words chosen from the dictionary. realize() writes it; fromParse() reads it
 *   back from the strict checker's parse, which is how a translation is
 *   back-translated and a golden sentence round-tripped.
 */

/** One Liraasa word chosen for a slot. */
export interface LWord {
  form: string;
  /** The headword, for an open-class form. */
  root?: string;
  /** n, v, a … for an open-class form. */
  role?: string;
  gloss?: string;
  /** The English it translates, when it came from English. */
  english?: string;
  /** predicted image-compound form, compositional prefix, no listed word … */
  flags?: string[];
  /** -ti, -ri on the word. */
  suffixes?: ('ti' | 'ri')[];
}

export interface LNP {
  kind:
    | 'noun'
    | 'pron'
    | 'name'
    | 'num'
    | 'adj'
    | 'demonstrative'
    | 'kiword'
    | 'correlative'
    | 'sidu';
  head: LWord;
  scope?: LWord;
  /** diba before a quantifier: diba muya lirari */
  degreeQuant?: LWord;
  quant?: LWord;
  det?: LWord;
  ord?: LWord;
  sign?: LWord;
  num?: LWord;
  degreeNum?: LWord;
  adjectives: { degree?: LWord; adj: LWord }[];
  refl?: LWord;
  de?: LNP;
  relative?: LClause;
  /** a comma closing the relative clause (2.5:G115) */
  relativeComma?: boolean;
  /** ata / oro + a second noun phrase. */
  and?: { linker: LWord; np: LNP };
  /** sidu + a verb phrase (0.8:G6). */
  vp?: LClause;
  /** iya opening a vocative noun phrase (3.0:G129). */
  iya?: LWord;
  /** a title before a name: zilenela Peta (3.2:G145). */
  title?: LWord;
  /** gagu + the maker, after a made work (3.0:G136). */
  maker?: { gagu: LWord; np: LNP };
}

export interface LAdjunct {
  kind:
    | 'pp'
    | 'la'
    | 'adv'
    | 'tamo'
    | 'gase'
    | 'chain'
    | 'measure'
    | 'kiword'
    | 'iteration'
    | 'scope'
    /** X krotiapo X: one after another (3.0:G140) */
    | 'distributive';
  commaBefore?: boolean;
  word?: LWord;
  np?: LNP | null;
  degree?: LWord;
  adj?: LWord;
  clause?: LClause;
}

export type LPredicate =
  | {
      kind: 'adj';
      ne?: LWord;
      tonsi?: LWord;
      degree?: LWord;
      adj: LWord;
      tamo?: LNP;
      gase?: LNP;
      sidu?: LClause;
      and?: LPredicate[];
    }
  | { kind: 'np'; ne?: LWord; np: LNP; and?: LPredicate[] }
  | { kind: 'pp'; ne?: LWord; prep: LWord; np: LNP | null; and?: LPredicate[] }
  | { kind: 'adv'; word: LWord }
  | { kind: 'kiword'; word: LWord; adj?: LWord }
  | { kind: 'gap' };

export interface LClause {
  /** yesta, doli … before the linker (1.0:G10) */
  scope?: LWord;
  linker?: LWord;
  /** a comma after the linker (tonsi,) */
  linkerComma?: boolean;
  frame: { adjunct: LAdjunct; comma: boolean }[];
  interjections: { word: LWord; comma: boolean }[];
  topic?: LNP;
  kiFront?: LWord;
  /** null: no subject (a command, an ellipsis); 'hortative': yava. */
  subject: LNP | null | 'hortative';
  /** a comma between a vocative opening the sentence and the clause */
  vocativeBefore?: LNP;
  ops: LWord[];
  pred:
    | { kind: 'verb'; verb: LWord }
    | { kind: 'copula'; cop: LWord; predicate: LPredicate }
    | {
        kind: 'valency';
        op: LWord;
        actor: LNP;
        actorOps: LWord[];
        verb: LWord;
        cop?: LWord;
        predicate?: LPredicate;
      }
    | { kind: 'passive'; gome: LWord; verb: LWord; agent?: { gagu: LWord; np: LNP } }
    /** miyo + a noun phrase (there is), or with no noun phrase after a subject: it exists (3.0:G132) */
    | { kind: 'exist'; miyo: LWord; np?: LNP }
    | { kind: 'bare-adj'; predicate: LPredicate }
    | { kind: 'none' };
  recipient?: LNP;
  object?: LNP;
  objectClause?: LClause;
  /** the embedded-question word opening an object clause (… sabesia ki-pago taivo pagopa) */
  adjuncts: LAdjunct[];
  /** a comma before the closing words (…, zoke) */
  closingComma?: boolean;
  closing: LWord[];
  ki: boolean;
  /** interjections set off at the end (…, fisa) */
  trailing?: LWord[];
  /** subordinate clauses before the main clause (Si …, …) and after it */
  before: { clause: LClause; comma: boolean }[];
  after: { clause: LClause; comma: boolean; punct?: string }[];
  vocative?: LNP;
}

export interface LSentence {
  main: LClause;
  end: '.' | '?' | '!' | '…' | ',' | '';
}

// ------------------------------------------------------------ meaning frame

export type Tense = 'past' | 'present' | 'future';

export interface MeaningNP {
  /** an English lemma, a pronoun person/number, a name, a number */
  head: string;
  kind:
    | 'noun'
    | 'pronoun'
    | 'name'
    | 'number'
    | 'adjective'
    | 'question'
    | 'demonstrative'
    | 'reflexive';
  definite?:
    | 'the'
    | 'a'
    | 'this'
    | 'that'
    | 'these'
    | 'those'
    | 'which'
    | 'whose'
    | 'how many'
    | 'no'
    | null;
  plural?: boolean;
  quantifier?: string;
  number?: number;
  ordinal?: number;
  negativeNumber?: boolean;
  approximately?: boolean;
  adjectives: { lemma: string; degree?: string }[];
  owner?: MeaningNP;
  of?: MeaningNP;
  partitive?: boolean;
  relative?: MeaningClause;
  diminutive?: boolean;
  focus?: 'also' | 'even' | 'only' | 'exactly' | 'it is';
  negated?: boolean;
  and?: { linker: 'and' | 'or'; np: MeaningNP };
  /** she herself: emphatic sela (3.0:G134) */
  emphatic?: boolean;
  /** Mr, Father … before a name (3.2:G145) */
  title?: string;
  /** by + the maker, after a made work (3.0:G136) */
  maker?: MeaningNP;
}

export interface MeaningAdjunct {
  role:
    | 'time'
    | 'place'
    | 'manner'
    | 'means'
    | 'companion'
    | 'medium'
    | 'goal'
    | 'source'
    | 'beneficiary'
    | 'comparison'
    | 'simile'
    | 'purpose'
    | 'frequency'
    | 'ago'
    | 'duration'
    | 'question'
    /** one by one, star by star (3.0:G140) */
    | 'distributive';
  /** a preposition, an adverb, a time word (English) */
  word?: string;
  np?: MeaningNP;
  degree?: string;
  clause?: MeaningClause;
  /** the English put it first ("Yesterday, …") */
  fronted?: boolean;
}

export interface MeaningClause {
  link?:
    | 'relative'
    | 'that'
    | 'whether'
    | 'question'
    | 'purpose'
    | 'condition'
    | 'unless'
    | 'cause'
    | 'when'
    | 'while'
    | 'until'
    | 'since'
    | 'as soon as'
    | 'before'
    | 'after'
    | 'although'
    | 'and'
    | 'but'
    | 'or'
    | 'therefore';
  type: 'statement' | 'question' | 'command' | 'exclamation' | 'wish' | 'hortative';
  subject: MeaningNP | null;
  verb: { lemma: string; kind: 'action' | 'be' | 'become' | 'exist' | 'have' } | null;
  /** be + an adjective, a noun phrase or a place */
  complement?:
    | { kind: 'adjective'; lemma: string; degree?: string; than?: MeaningNP; as?: MeaningNP }
    | { kind: 'np'; np: MeaningNP }
    | { kind: 'place'; adjunct: MeaningAdjunct };
  /** the copula sense: now / for a time, or lasting (2.5:G93) */
  lasting?: boolean;
  object?: MeaningNP;
  recipient?: MeaningNP;
  objectClause?: MeaningClause;
  tense: Tense;
  aspect?: 'progressive' | 'completed' | 'habitual';
  modal?: 'can' | 'might' | 'must' | 'should' | 'would' | 'may' | 'hope';
  counterfactual?: boolean;
  negated?: boolean;
  evidential?: string;
  phase?: 'begin' | 'stop';
  effort?: 'try' | 'manage' | 'fail';
  approach?: 'almost' | 'about to';
  iteration?: 'again' | 'still' | 'already';
  passive?: { agent?: MeaningNP };
  causative?: { kind: 'make' | 'let' | 'prevent'; actor: MeaningNP };
  chain?: MeaningClause;
  adjuncts: MeaningAdjunct[];
  question?: { word: string; role: string };
  attitude?: 'certainly' | 'probably' | 'perhaps' | 'hope' | 'irony';
  reciprocal?: boolean;
  vocative?: MeaningNP;
  /** the vocative is opened by O: iya (3.0:G129) */
  vocativeIya?: boolean;
  /** the vocative comes first, before the clause */
  vocativeFirst?: boolean;
  /** NP to NP!: an acclamation, the second noun phrase (3.0:G137) */
  acclamation?: MeaningNP;
  topic?: MeaningNP;
  please?: boolean;
  /** was, and no longer is: kapoki (2.5:G94) */
  noLonger?: boolean;
  /** joined by a semicolon */
  semicolon?: boolean;
  /** joined by a comma alone: she was, she is, she will be (3.0:G132) */
  commaJoined?: boolean;
  subordinates: MeaningClause[];
}
