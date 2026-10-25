/**
 * The sentence parser of the strict checker (2.5, ADR-0020).
 *
 * It reads one sentence against the 2.5 clause (2.5:G126) and noun-phrase
 * (2.5:G98) templates, left to right, with the edge positions before the
 * clause (a line linker, FRAME, TOPIC, a fronted ki-word) and after it (a
 * vocative). Every position checks that the word's form fits it: a noun form
 * where a noun stands, a verb form in the verb slot, an adjective form before
 * a noun. What does not fit is recorded with its rule, and the parse goes on,
 * so one error does not hide the next.
 *
 * Word lists come from the index (the 2.5 reference and its overlay); the
 * structure is the template's. Sentence-level rules (questions, commands, the
 * closing order …) run on the parse in rules.ts.
 */
import type { Index } from './lexicon';
import type {
  Adjunct,
  Clause,
  Finding,
  NounPhrase,
  Pos,
  Predicate,
  Reading,
  Role,
  Token,
} from './types';

const OP_ORDER = [
  'TENSE',
  'REALITY',
  'NEGATION',
  'MODAL',
  'APPROACH',
  'PHASE',
  'EFFORT',
  'ASPECT',
  'ITERATION',
  'EVIDENTIAL',
];

export interface Parsed {
  clauses: Clause[];
  findings: Finding[];
  roles: Map<number, { role: Role; clause: number }>;
  /** Tokens that took part in nothing. */
  unplaced: number[];
}

const emptyClause = (kind: Clause['kind'], start: number, linker: number | null): Clause => ({
  kind,
  linker,
  start,
  end: start,
  frame: [],
  topic: null,
  kiFront: null,
  subject: null,
  ops: [],
  verb: null,
  predKind: 'none',
  actor: null,
  actorOps: [],
  innerVerb: null,
  recipient: null,
  object: null,
  objectClause: null,
  predicate: null,
  agent: null,
  adjuncts: [],
  closing: [],
  vocative: null,
  subordinates: [],
});

export class SentenceParser {
  private i = 0;
  private readonly findings: Finding[] = [];
  private readonly roles = new Map<number, { role: Role; clause: number }>();
  private clauseNo = 0;
  private readonly clauses: Clause[] = [];

  constructor(
    private readonly ix: Index,
    private readonly t: Token[],
  ) {}

  // ------------------------------------------------------------ token helpers

  private w(i: number): string {
    const t = this.t[i];
    return t === undefined ? '' : t.kind === 'punct' ? t.text : (t.word?.lower ?? '');
  }
  private readings(i: number): Reading[] {
    return this.t[i]?.word?.readings ?? [];
  }
  private is(i: number, pos: Pos): boolean {
    return this.readings(i).some((r) => r.pos === pos);
  }
  private only(i: number, pos: Pos): boolean {
    const rs = this.readings(i);
    return rs.length > 0 && rs.every((r) => r.pos === pos);
  }
  private reading(i: number, pos: Pos): Reading | undefined {
    return this.readings(i).find((r) => r.pos === pos);
  }
  private isPunct(i: number, text?: string): boolean {
    const t = this.t[i];
    return t?.kind === 'punct' && (text === undefined || t.text === text);
  }
  private isWord(i: number): boolean {
    return this.t[i]?.kind === 'word';
  }
  private atEnd(i: number = this.i): boolean {
    for (let k = i; k < this.t.length; k++)
      if (!this.isPunct(k) || /[,;:—–-]/.test(this.w(k))) return false;
    return true;
  }
  /** Sentence-final punctuation only remains. */
  private onlyEndPunct(i: number = this.i): boolean {
    for (let k = i; k < this.t.length; k++)
      if (!this.isPunct(k) || !/^[.!?…"”'’)]+$/.test(this.w(k))) return false;
    return true;
  }
  private opSlot(i: number): string | undefined {
    return this.reading(i, 'op')?.slot;
  }
  private find(
    rule: string,
    message: string,
    at: number[],
    severity: Finding['severity'] = 'error',
    fix?: string,
  ): void {
    this.findings.push({ severity, rule, message, at, ...(fix === undefined ? {} : { fix }) });
  }
  private role(i: number, role: Role): void {
    if (!this.roles.has(i)) this.roles.set(i, { role, clause: this.clauseNo });
  }
  private roleSpan(start: number, end: number, role: Role): void {
    for (let k = start; k < end; k++) if (this.isWord(k)) this.role(k, role);
  }

  // --------------------------------------------------------------- word kinds

  /** A word that can stand at the head of a noun phrase. */
  private nounish(i: number): boolean {
    return this.is(i, 'noun') || this.is(i, 'name') || this.is(i, 'pron') || this.kiNoun(i);
  }
  /** ki-coda, ki-nela: question words that stand as a noun phrase. */
  private kiNoun(i: number): boolean {
    return (
      this.is(i, 'kiword') &&
      (/^ki-(coda|nela)$/.test(this.w(i)) ||
        this.readings(i).some((r) => r.pos === 'kiword' && /^(coda|nela)$/.test(r.detail ?? '')))
    );
  }
  private side(i: number): boolean {
    return this.w(i) in this.ix.source.flags.side_nouns_as_prepositions;
  }
  private adjish(i: number): boolean {
    return this.is(i, 'adj') || this.is(i, 'colour');
  }
  /** A word that can open a noun phrase. */
  private npStart(i: number): boolean {
    return (
      this.isWord(i) &&
      (this.nounish(i) ||
        this.adjish(i) ||
        this.is(i, 'det') ||
        this.is(i, 'quant') ||
        this.is(i, 'num') ||
        this.is(i, 'ord') ||
        this.is(i, 'sign') ||
        (this.is(i, 'degree') &&
          (this.adjish(i + 1) ||
            this.is(i + 1, 'quant') ||
            this.is(i + 1, 'num') ||
            this.nounish(i + 1))) ||
        (this.is(i, 'scope') && this.w(i) !== 'ne' && this.npStart(i + 1)) ||
        (this.w(i) === 'sidu' && this.verbish(i + 1)))
    );
  }
  private verbish(i: number): boolean {
    return this.is(i, 'verb');
  }
  private predicateStart(i: number): boolean {
    if (this.is(i, 'scope') && this.w(i) !== 'ne' && (this.verbish(i + 1) || this.is(i + 1, 'op')))
      return true;
    return (
      this.is(i, 'op') ||
      this.is(i, 'copula') ||
      this.is(i, 'valency') ||
      this.is(i, 'passive') ||
      this.verbish(i) ||
      this.w(i) === 'ne'
    );
  }

  // ------------------------------------------------------------- noun phrase

  /**
   * [QUANTIFIER] [DETERMINER] [ORDINAL] [NUMBER] {[DEGREE] ADJECTIVE} NOUN[-ti][-ri]
   * [de NP] [raho CLAUSE] (2.5:G98), with de grouped from the left (2.5:G96).
   */
  parseNP(
    opts: {
      allowBareAdj?: boolean;
      noRelative?: boolean;
      noDe?: boolean;
      adverbHead?: boolean;
    } = {},
  ): NounPhrase | null {
    const start = this.i;
    // tu, yesta, pendi, vinto, doli (and ne) before the constituent they scope over (1.0:G1)
    if (this.is(start, 'scope') && this.npStart(start + 1)) {
      this.i += 1;
      const inner = this.parseNP(opts);
      if (inner === null) {
        this.i = start;
        return null;
      }
      this.role(start, this.roles.get(inner.start)?.role ?? 'ADJUNCT');
      return { ...inner, start };
    }
    const np = this.parseNPCore(opts);
    if (np === null) {
      this.i = start;
      return null;
    }
    let cur = np;
    // de chains group from the left: (X de Y) de Z
    while (!opts.noDe && this.w(this.i) === 'de') {
      const deAt = this.i;
      this.i += 1;
      const right = this.parseNPCore({ ...opts, noRelative: true, adverbHead: true });
      if (right === null) {
        this.find('0.8:G7', 'de with no noun phrase after it', [deAt]);
        break;
      }
      this.role(deAt, this.roles.get(cur.start)?.role ?? 'OBJECT');
      const leftKind = cur.headKind;
      const title = cur.de === null && this.titleAsName(cur);
      const deKind: NounPhrase['deKind'] =
        leftKind === 'num' || (cur.quant !== null && cur.head === cur.quant)
          ? 'partitive'
          : leftKind === 'pron' || leftKind === 'name' || title
            ? 'owner-left'
            : 'owner-right';
      if (title) {
        const text = this.t[cur.head ?? -1]?.text ?? '';
        this.find(
          this.ix.source.rules.titles?.ruling ?? '3.0:G131',
          `${text}, capitalised with no article, is a name: it owns what follows de (${text}’s …); a descriptive epithet keeps li and lower case (li ${text.toLowerCase()} de …)`,
          [cur.head ?? deAt],
          'note',
        );
      }
      // X de Y de Z groups from the left (2.5:G96); the chain is kept in its written order
      const attach = (n: NounPhrase): NounPhrase =>
        n.de === null ? { ...n, de: right, deKind } : { ...n, de: attach(n.de) };
      cur = { ...attach(cur), end: right.end };
    }
    // gagu + the maker after a noun naming a made work (3.0:G136); elsewhere gagu is the passive agent
    const au = this.ix.source.rules.authorship;
    if (au !== undefined && this.w(this.i) === au.word && this.npStart(this.i + 1)) {
      const g = this.i;
      if (this.workNoun(cur.head)) {
        this.i += 1;
        const maker = this.parseNP({ ...opts, noRelative: true });
        if (maker === null) this.i = g;
        else cur = { ...cur, end: maker.end, maker };
      } else if (
        !this.t.slice(0, g).some((t) => t.word?.lower === this.ix.source.rules.passive.word)
      )
        this.find(
          au.ruling,
          `${au.word} names the maker after a made work (li lira ${au.word} …), or the agent after a passive verb (gome …): ${this.w(cur.head ?? g)} is neither`,
          [g],
        );
    }
    if (!opts.noRelative && this.w(this.i) === 'raho') {
      const rel = this.parseSubClause('relative');
      cur = { ...cur, end: this.i, relative: rel };
    }
    // a coordinated noun phrase: A ata B, A oro B (1.0:G13, 1.2:G25), when no clause follows
    if ((this.w(this.i) === 'ata' || this.w(this.i) === 'oro') && this.npStart(this.i + 1)) {
      const save = this.i;
      this.i += 1;
      const second = this.parseNP({ ...opts, noRelative: true });
      if (second === null || this.predicateStart(this.i)) this.i = save;
      else cur = { ...cur, end: second.end, plural: true, and: { linker: save, np: second } };
    }
    return cur;
  }

  private parseNPCore(opts: {
    allowBareAdj?: boolean;
    noRelative?: boolean;
    adverbHead?: boolean;
  }): NounPhrase | null {
    const start = this.i;
    const np: NounPhrase = {
      start,
      end: start,
      head: null,
      headKind: 'noun',
      det: null,
      quant: null,
      ord: null,
      num: null,
      adjectives: [],
      degrees: [],
      de: null,
      relative: null,
      refl: null,
      plural: false,
    };
    const i0 = this.i;
    // sidu + a verb phrase is a noun phrase (0.8:G6): Sidu lisrola ka livna de taivo.
    if (this.w(i0) === 'sidu' && this.verbish(i0 + 1)) {
      this.i += 2;
      const vp = emptyClause('chain', i0 + 1, i0);
      vp.verb = i0 + 1;
      vp.predKind = 'verb';
      this.parseObject(vp, {});
      this.parseAdjuncts(vp);
      np.head = i0 + 1;
      np.end = this.i;
      return np;
    }
    // a time or place adverbial after de or a preposition: nullo de deyaapo, en eli-pago
    if (
      opts.adverbHead &&
      (this.is(i0, 'timeAdv') || this.is(i0, 'placeAdv')) &&
      !this.nounish(i0)
    ) {
      np.head = i0;
      np.headKind = 'correlative';
      this.i += 1;
      np.end = this.i;
      return np;
    }
    // a pronoun, a name, a ki-noun or a correlative noun stands alone
    if (this.is(i0, 'pron') && !this.is(i0, 'det')) {
      np.head = i0;
      np.headKind = 'pron';
      np.plural = this.w(i0).endsWith('ri');
      this.i += 1;
      if (this.w(this.i) === 'sela') {
        np.refl = this.i;
        this.i += 1;
      }
      np.end = this.i;
      return np;
    }
    if (this.is(i0, 'name') && !this.is(i0, 'noun')) {
      np.head = i0;
      np.headKind = 'name';
      this.i += 1;
      // a name + sela: emphatic, herself (3.0:G134)
      if (this.w(this.i) === 'sela') {
        np.refl = this.i;
        this.i += 1;
      }
      np.end = this.i;
      return np;
    }
    if (this.kiNoun(i0)) {
      np.head = i0;
      np.headKind = 'kiword';
      this.i += 1;
      np.end = this.i;
      return np;
    }
    // [QUANTIFIER] (diba + a quantifier is excess, 2.3; kasi / menu + a noun is an amount, 2.5:G106)
    if (this.w(this.i) === 'diba' && this.is(this.i + 1, 'quant')) {
      np.degrees.push(this.i);
      this.i += 1;
    }
    // kasi / menu + a quantifier + a noun (kasi muya patuti): 2.5:G106 rules kasi + a noun only
    if (
      this.ix.source.rules.comparison.amount_words.includes(this.w(this.i)) &&
      this.is(this.i + 1, 'quant') &&
      this.nounish(this.i + 2)
    ) {
      this.find(
        '2.5:G106',
        `${this.w(this.i)} + a quantifier (${this.w(this.i)} ${this.w(this.i + 1)} …) is not ruled: 2.5:G106 rules ${this.w(this.i)} + a noun`,
        [this.i, this.i + 1],
        'unruled',
      );
      np.degrees.push(this.i);
      this.i += 1;
    }
    if (this.is(this.i, 'quant') && !this.is(this.i, 'kiword')) {
      np.quant = this.i;
      this.i += 1;
    } else if (this.is(this.i, 'kiword') && this.w(this.i) === 'ki-muya') {
      np.quant = this.i;
      this.i += 1;
    } else if (
      this.ix.source.rules.comparison.amount_words.includes(this.w(this.i)) &&
      this.nounish(this.i + 1) &&
      !this.adjish(this.i + 1)
    ) {
      np.quant = this.i;
      this.i += 1;
    }
    // a quantifier before a pronoun or a name that owns: toda maivo de cono
    if (
      np.quant !== null &&
      (this.is(this.i, 'pron') || this.is(this.i, 'name')) &&
      this.w(this.i + 1) === 'de'
    ) {
      const owner = this.parseNPCore(opts);
      if (owner !== null) return { ...owner, start, quant: np.quant };
    }
    // [DETERMINER]
    if (this.is(this.i, 'det')) {
      np.det = this.i;
      this.i += 1;
    }
    // [ORDINAL] [NUMBER]
    if (this.is(this.i, 'ord')) {
      np.ord = this.i;
      this.i += 1;
    }
    if (this.is(this.i, 'sign')) {
      if (!this.is(this.i + 1, 'num'))
        this.find('2.5:G125', `${this.w(this.i)} stands directly before a number`, [this.i]);
      this.i += 1;
    }
    if (['lusu', 'mosa', 'gase', 'pendi'].includes(this.w(this.i)) && this.is(this.i + 1, 'num')) {
      np.degrees.push(this.i);
      this.i += 1;
    }
    if (this.is(this.i, 'num')) {
      np.num = this.i;
      this.i += 1;
    }
    // {[DEGREE] ADJECTIVE}
    for (;;) {
      const k = this.i;
      if (this.is(k, 'degree') && this.adjish(k + 1)) {
        np.degrees.push(k);
        np.adjectives.push(k + 1);
        this.i += 2;
        continue;
      }
      if (this.adjish(k) && !this.nounish(k) && this.isWord(k)) {
        np.adjectives.push(k);
        this.i += 1;
        continue;
      }
      // a noun before a noun: ADR-0011 (the first becomes its adjective)
      break;
    }
    // NOUN
    const h = this.i;
    if (this.nounish(h) && this.isWord(h) && !(this.is(h, 'pron') && this.is(h, 'det'))) {
      np.head = h;
      np.headKind = this.is(h, 'noun')
        ? 'noun'
        : this.is(h, 'name')
          ? 'name'
          : this.is(h, 'pron')
            ? 'pron'
            : 'kiword';
      this.i += 1;
      // a second bare noun right after: a noun does not modify a noun (ADR-0011)
      const n2 = this.i;
      if (
        this.only(n2, 'noun') &&
        !this.is(n2, 'name') &&
        this.t[n2]?.word?.problem === undefined
      ) {
        const adj = this.adjectiveOf(h);
        this.find(
          'ADR-0011',
          `two nouns side by side: ${this.w(h)} ${this.w(n2)}; the first becomes its adjective${adj === null ? ' (none is listed: use a compound or a de phrase)' : ` (${adj})`}`,
          [h, n2],
          'error',
          adj ?? undefined,
        );
        np.head = n2;
        this.i += 1;
      }
    } else if (
      np.adjectives.length > 0 &&
      (np.det !== null || np.quant !== null || np.num !== null || np.ord !== null)
    ) {
      // an adjective standing as a noun after a determiner (1.2:G29, 2.3:G82)
      const last = np.adjectives.pop() ?? h;
      np.head = last;
      np.headKind = 'adj';
    } else if (np.adjectives.length > 0) {
      if (!opts.allowBareAdj) {
        const last = np.adjectives[np.adjectives.length - 1] ?? h;
        const noun = this.nounOf(last);
        this.find(
          '1.2:G29',
          `${this.w(last)} is an adjective; an adjective stands as a noun only after a determiner (li ${this.w(last)})${noun === null ? '' : `, or use the noun ${noun}`}`,
          [last],
          'error',
          noun ?? `li ${this.w(last)}`,
        );
        np.head = last;
        np.headKind = 'adj';
        np.adjectives.pop();
      } else {
        this.i = start;
        return null;
      }
    } else if (np.num !== null) {
      np.head = np.num;
      np.headKind = 'num';
    } else if (np.det !== null && ['eli', 'ola', 'eliri', 'olari'].includes(this.w(np.det))) {
      np.head = np.det;
      np.headKind = 'demonstrative';
      np.det = null;
    } else if (np.quant !== null && (this.w(this.i) === 'de' || this.is(np.quant, 'kiword'))) {
      np.head = np.quant;
      np.headKind = 'num';
    } else if ((np.det !== null || np.quant !== null) && this.verbish(h) && this.isWord(h)) {
      // a verb form where a noun stands
      const noun = this.nounOf(h);
      this.find(
        '0.8:G7',
        `${this.w(h)} is a verb form; the head of a noun phrase is a noun${noun === null ? '' : ` (${noun})`}`,
        [h],
        'error',
        noun ?? undefined,
      );
      np.head = h;
      this.i += 1;
    } else if (np.det !== null || np.quant !== null) {
      this.find('0.8:G7', `${this.w(np.det ?? np.quant ?? h)} needs a noun after it`, [
        np.det ?? np.quant ?? h,
      ]);
      np.end = this.i;
      return np.det === null && np.quant === null ? null : np;
    } else {
      this.i = start;
      return null;
    }
    // an adjective after its noun: adjectives come before the noun (2.5:G98)
    if (
      !(opts.allowBareAdj ?? false) &&
      np.headKind !== 'adj' &&
      this.only(this.i, 'adj') &&
      !this.nounish(this.i + 1) &&
      !this.is(this.i + 1, 'degree')
    ) {
      this.find(
        '2.5:G98',
        `${this.w(this.i)} is an adjective after its noun: adjectives come before the noun (${this.w(this.i)} ${this.w(np.head)})`,
        [np.head, this.i],
      );
      np.adjectives.push(this.i);
      this.i += 1;
    }
    // a noun phrase + sela: emphatic, itself (3.0:G134)
    if (this.w(this.i) === 'sela' && np.headKind !== 'adj') {
      np.refl = this.i;
      this.i += 1;
    }
    const head = np.head;
    {
      const sfx = this.t[head]?.word?.suffixes ?? [];
      np.plural = sfx.includes('ri') || this.w(np.det ?? -1).endsWith('ri');
      // 2.5:G101: -ri never on a bare adjective or a verb; eli / ola take a singular noun
      if (sfx.includes('ri') && np.headKind === 'adj' && np.det === null && np.quant === null)
        this.find('2.5:G101', `-ri on a bare adjective: ${this.w(head)}`, [head]);
      if (
        np.det !== null &&
        this.ix.source.rules.plural.singular_demonstratives.includes(this.w(np.det)) &&
        sfx.includes('ri')
      )
        this.find(
          '2.5:G101',
          `${this.w(np.det)} takes a singular noun (${this.w(np.det)}ri for plural)`,
          [np.det, head],
          'error',
          `${this.w(np.det)}ri`,
        );
      // more than one adjective before the noun: the order is not ruled (A4.22)
      if (np.adjectives.length > 1)
        this.find(
          'A4.22',
          'the order of two or more adjectives before one noun is not ruled yet',
          np.adjectives,
          'unruled',
        );
    }
    np.end = this.i;
    return np;
  }

  /** The listed adjective of a noun form (ADR-0011): -san, -asasan, -nasan. */
  private adjectiveOf(i: number): string | null {
    const r = this.reading(i, 'noun');
    if (r?.root === undefined || r.role === undefined) return null;
    const map: Record<string, string> = this.ix.source.flags.noun_to_adjective_role;
    const role = map[r.role];
    return role === undefined ? null : this.ix.formOf(r.root, role as 'a');
  }
  private nounOf(i: number): string | null {
    const r = this.readings(i).find((x) => x.root !== undefined);
    return r?.root === undefined ? null : this.ix.formOf(r.root, 'n');
  }
  private verbOfWord(i: number): string | null {
    const r = this.readings(i).find((x) => x.root !== undefined);
    return r?.root === undefined ? null : this.ix.formOf(r.root, 'v');
  }

  // ---------------------------------------------- 3.0: address and naming

  /** A noun naming a made work (3.0:G136): one listed, or a compound whose head is one. */
  private workNoun(i: number | null): boolean {
    const list = this.ix.source.rules.authorship?.work_nouns ?? [];
    if (i === null) return false;
    return this.readings(i).some(
      (r) => r.pos === 'noun' && list.some((n) => r.form === n || r.form.endsWith(n)),
    );
  }

  /** A capitalised ascended noun with no article: a title used as a name (3.0:G131). */
  private titleAsName(np: NounPhrase): boolean {
    const h = np.head;
    if (h === null || np.det !== null || np.quant !== null || np.adjectives.length > 0)
      return false;
    if (this.ix.source.rules.titles === undefined) return false;
    const text = this.t[h]?.text ?? '';
    return (
      /^[A-Z]/.test(text) &&
      !this.is(h, 'pron') &&
      !this.is(h, 'name') &&
      this.readings(h).some((r) => r.pos === 'noun' && r.role === 'an')
    );
  }

  /**
   * iya + a noun phrase: a vocative (3.0:G129). iya belongs to its noun
   * phrase, so a comma after it is an error. Names or noun phrases set off by
   * commas may follow, each another address: a litany (3.0:G130).
   */
  private parseIyaVocative(): NounPhrase | null {
    const k = this.i;
    if (!this.is(k, 'vocative')) return null;
    const rule = this.ix.source.rules.vocative?.ruling ?? '3.0:G129';
    this.role(k, 'VOCATIVE');
    this.i += 1;
    if (this.isPunct(this.i, ',') && this.npStart(this.i + 1)) {
      this.find(
        rule,
        `${this.w(k)} belongs to its noun phrase: no comma after it`,
        [k, this.i],
        'error',
        `${this.w(k)} ${this.t[this.i + 1]?.text ?? ''}`,
      );
      this.role(this.i, 'PUNCT');
      this.i += 1;
    }
    const np = this.parseNP();
    if (np === null) {
      this.find(rule, `${this.w(k)} is followed by the noun phrase it addresses`, [k]);
      return null;
    }
    this.roleSpan(np.start, np.end, 'VOCATIVE');
    let voc: NounPhrase = { ...np, start: k };
    for (;;) {
      if (!this.isPunct(this.i, ',') || this.is(this.i + 1, 'vocative')) break;
      const save = this.i;
      const mark = this.findings.length;
      this.i += 1;
      const ap = this.npStart(this.i) && !this.clauseAhead(this.i) ? this.parseNP() : null;
      if (ap !== null && (this.isPunct(this.i, ',') || this.onlyEndPunct())) {
        this.role(save, 'PUNCT');
        this.roleSpan(ap.start, ap.end, 'VOCATIVE');
        voc = { ...voc, end: ap.end };
        continue;
      }
      this.findings.length = mark;
      this.i = save;
      for (let x = save; x < this.t.length; x++) this.roles.delete(x);
      break;
    }
    return voc;
  }

  /**
   * Noun phrases set off by commas that rename the subject just read, the last
   * comma closing them before the predicate (3.0:G130). Nothing is consumed
   * unless the whole pattern holds.
   */
  private parseAppositions(role: Role): boolean {
    const save = this.i;
    const mark = this.findings.length;
    let n = 0;
    while (
      this.isPunct(this.i, ',') &&
      this.npStart(this.i + 1) &&
      !this.is(this.i + 1, 'vocative')
    ) {
      const c = this.i;
      this.i += 1;
      const np = this.parseNP();
      // a relative closed by its own comma has taken that comma (2.5:G115)
      const closed =
        np !== null &&
        (this.isPunct(this.i, ',') || (np.relative !== null && this.isPunct(this.i - 1, ',')));
      if (np === null || !closed) {
        this.i = c;
        break;
      }
      this.role(c, 'PUNCT');
      this.roleSpan(np.start, np.end, role);
      n += 1;
      if (!this.isPunct(this.i, ',')) break;
    }
    if (n > 0 && this.isPunct(this.i, ',') && this.predicateStart(this.i + 1)) {
      this.role(this.i, 'PUNCT');
      this.i += 1;
      return true;
    }
    if (n > 0 && this.isPunct(this.i - 1, ',') && this.predicateStart(this.i)) return true;
    this.findings.length = mark;
    this.i = save;
    for (let x = save; x < this.t.length; x++) this.roles.delete(x);
    return false;
  }

  /** ola-modo [TENSE] miyo: the liturgical formula, opened without a comma (3.0:G133). */
  private formulaAt(k: number): boolean {
    const f = this.ix.source.rules.formula;
    if (f === undefined || this.w(k) !== f.opener) return false;
    const n = this.opSlot(k + 1) === 'TENSE' ? k + 2 : k + 1;
    return this.w(n) === f.word;
  }

  /** X krotiapo X: one X after another, a bare noun or number repeated (3.0:G140). */
  private distributiveAt(k: number): boolean {
    const d = this.ix.source.rules.distributive;
    return (
      d !== undefined &&
      this.isWord(k) &&
      this.w(k + 1) === d.word &&
      this.w(k + 2) === this.w(k) &&
      (this.is(k, 'noun') || this.is(k, 'num'))
    );
  }

  // --------------------------------------------------------------- operators

  /** A run of preverbal operators, in the order of the template (1.0:G1, 1.0:G16). */
  private parseOps(clause: Clause, into: 'ops' | 'actorOps'): void {
    const run: { at: number; slot: string }[] = [];
    for (;;) {
      const k = this.i;
      let slot = this.opSlot(k);
      if (
        slot === undefined &&
        this.is(k, 'scope') &&
        (this.verbish(k + 1) || this.is(k + 1, 'op'))
      )
        slot = 'SCOPE';
      // fututi is APPROACH before a verb, "soon" elsewhere (1.0:G7)
      if (slot === undefined) break;
      // reve / loki closing a clause are not operators (2.5:G126)
      if (slot === 'ITERATION' && !this.predicateStart(k + 1)) break;
      if (slot === 'APPROACH' && !this.predicateStart(k + 1)) break;
      run.push({ at: k, slot });
      this.i += 1;
    }
    for (const o of run) this.role(o.at, o.slot === 'SCOPE' ? 'ADJUNCT' : (o.slot as Role));
    // order and one per slot; ne floats before any later operator or the verb
    let last = -1;
    const seen = new Map<string, number>();
    for (const o of run) {
      const rank = OP_ORDER.indexOf(o.slot);
      if (seen.has(o.slot) && o.slot !== 'NEGATION')
        this.find('1.0:G16', `two ${o.slot.toLowerCase()} words in one clause`, [
          seen.get(o.slot) ?? o.at,
          o.at,
        ]);
      seen.set(o.slot, o.at);
      if (o.slot === 'NEGATION' || o.slot === 'SCOPE') continue;
      if (rank < last)
        this.find(
          '1.0:G1',
          `${this.w(o.at)} (${o.slot.toLowerCase()}) is out of the template's order`,
          [o.at],
        );
      last = Math.max(last, rank);
    }
    // ne before the tense or noma: ne follows them (1.0:G1, 0.8:G2)
    const ne = run.find((o) => o.slot === 'NEGATION');
    const tense = run.find((o) => o.slot === 'TENSE' || o.slot === 'REALITY');
    if (ne !== undefined && tense !== undefined && ne.at < tense.at)
      this.find(
        '1.0:G1',
        `ne stands after ${this.w(tense.at)}`,
        [ne.at, tense.at],
        'error',
        `${this.w(tense.at)} ne`,
      );
    // the excluded pairs (1.0:G16)
    const words = run.map((o) => this.w(o.at));
    for (const [a, b] of this.ix.exclusions) {
      if (words.includes(a) && words.includes(b))
        this.find(
          '1.0:G16',
          `${a} and ${b} never share a clause`,
          run.filter((o) => [a, b].includes(this.w(o.at))).map((o) => o.at),
        );
    }
    const preverbal = run.filter((o) => o.slot !== 'NEGATION' && o.slot !== 'SCOPE').length;
    if (preverbal > this.ix.maxOps)
      this.find(
        '1.0:G16',
        `${String(preverbal)} operators before one verb; at most ${String(this.ix.maxOps)} are recommended`,
        run.map((o) => o.at),
        'warn',
      );
    // 'would have' is po noma viki; po viki alone is not a form (2.5:G114)
    const po = run.find((o) => this.w(o.at) === 'po');
    const viki = run.find((o) => this.w(o.at) === 'viki');
    if (po !== undefined && viki !== undefined && !run.some((o) => this.w(o.at) === 'noma'))
      this.find(
        '2.5:G114',
        "'would have' is po noma viki: po viki without noma is not a form",
        [po.at, viki.at],
        'error',
        'po noma viki',
      );
    clause[into].push(...run);
  }

  // ---------------------------------------------------------------- clauses

  /** One clause's core: [ki-word] SUBJECT OPERATORS PREDICATE [OBJECT] ADJUNCTS CLOSING. */
  parseClauseCore(
    clause: Clause,
    ctx: { gap?: boolean; noSubject?: boolean; subjectFound?: NounPhrase | null },
  ): void {
    // a fronted ki-word (2.5:G88): ki-pago taivo pagopa?
    const k0 = this.i;
    if (
      this.is(k0, 'kiword') &&
      !this.predicateStart(k0 + 1) &&
      this.npStart(k0 + 1) &&
      !(this.w(k0) === 'ki-eli' || this.w(k0) === 'ki-muya')
    ) {
      const save = this.i;
      this.i += 1;
      const subj = this.parseNP();
      if (
        subj !== null &&
        (this.predicateStart(this.i) || this.is(this.i, 'prep') || this.is(this.i, 'scope'))
      ) {
        clause.kiFront = k0;
        this.role(k0, 'KI-WORD');
        clause.subject = subj;
        this.roleSpan(subj.start, subj.end, 'SUBJECT');
      } else {
        this.i = save;
      }
    }
    // raho opening a main clause stands as its subject: who, what (2.3:G74, 2.2:G64)
    if (
      clause.kind === 'main' &&
      clause.subject === null &&
      clause.kiFront === null &&
      this.w(this.i) === 'raho' &&
      !this.predicateStart(this.i + 1) &&
      this.clauseAhead(this.i + 1)
    ) {
      clause.kiFront = this.i;
      this.role(this.i, 'KI-WORD');
      this.i += 1;
    }
    if (
      clause.kind === 'main' &&
      clause.subject === null &&
      this.w(this.i) === 'raho' &&
      this.predicateStart(this.i + 1)
    ) {
      const r = this.i;
      this.role(r, 'SUBJECT');
      clause.subject = {
        start: r,
        end: r + 1,
        head: r,
        headKind: 'kiword',
        det: null,
        quant: null,
        ord: null,
        num: null,
        adjectives: [],
        degrees: [],
        de: null,
        relative: null,
        refl: null,
        plural: false,
      };
      this.i += 1;
    }
    // ola-modo [TENSE] miyo: the formula's opener, with no comma (3.0:G133)
    let formula = false;
    if (clause.subject === null && this.formulaAt(this.i)) {
      this.role(this.i, 'FRAME');
      clause.frame.push(this.i);
      this.i += 1;
      formula = true;
    }
    // SUBJECT
    const emph = this.ix.source.rules.emphatic;
    if (clause.subject === null && ctx.subjectFound !== undefined && ctx.subjectFound !== null) {
      clause.subject = ctx.subjectFound;
    } else if (clause.subject === null && !ctx.noSubject && !formula) {
      if (emph !== undefined && this.w(this.i) === emph.word) {
        // sela never stands alone as a subject (3.0:G134)
        this.find(
          emph.ruling,
          `${emph.word} needs a pronoun or noun phrase before it (saivo ${emph.word} …)`,
          [this.i],
        );
        this.role(this.i, 'SUBJECT');
        this.i += 1;
      } else if (this.w(this.i) === this.ix.source.rules.command.hortative) {
        this.role(this.i, 'SUBJECT');
        this.i += 1;
      } else if (
        this.w(this.i) === 'ne' &&
        this.npStart(this.i + 1) &&
        !this.is(this.i + 1, 'op') &&
        !this.verbish(this.i + 1)
      ) {
        const neAt = this.i;
        this.i += 1;
        const subj = this.parseNP();
        if (subj !== null && this.predicateStart(this.i)) {
          this.role(neAt, 'NEGATION');
          clause.subject = { ...subj, start: neAt };
          this.roleSpan(subj.start, subj.end, 'SUBJECT');
        } else this.i = neAt;
      } else if (
        (this.is(this.i, 'timeAdv') || this.is(this.i, 'placeAdv')) &&
        this.is(this.i + 1, 'copula')
      ) {
        const a = this.i;
        clause.subject = {
          start: a,
          end: a + 1,
          head: a,
          headKind: 'correlative',
          det: null,
          quant: null,
          ord: null,
          num: null,
          adjectives: [],
          degrees: [],
          de: null,
          relative: null,
          refl: null,
          plural: false,
        };
        this.role(a, 'SUBJECT');
        this.i += 1;
      } else if (this.npStart(this.i) && !this.verbStartsHere()) {
        const save = this.i;
        const subj = this.parseNP({ allowBareAdj: true });
        if (subj !== null) {
          clause.subject = subj;
          this.roleSpan(subj.start, subj.end, 'SUBJECT');
        } else this.i = save;
      }
    }
    // an apposition: noun phrases set off by commas that rename the subject (3.0:G130)
    const ap = this.ix.source.rules.apposition;
    if (clause.subject !== null && ap !== undefined && this.isPunct(this.i, ','))
      this.parseAppositions('SUBJECT');
    else if (
      clause.subject !== null &&
      ap !== undefined &&
      this.is(this.i, 'det') &&
      this.npStart(this.i)
    ) {
      // a second noun phrase with its own determiner right after the subject: an apposition without its commas
      const save = this.i;
      const mark = this.findings.length;
      const np2 = this.parseNP();
      if (np2 !== null && this.predicateStart(this.i)) {
        this.findings.length = mark;
        this.find(
          ap.ruling,
          'an apposition is set off by commas: a second noun phrase renaming the subject stands between commas',
          [np2.start],
          'error',
          ',',
        );
        this.roleSpan(np2.start, np2.end, 'SUBJECT');
      } else {
        this.findings.length = mark;
        this.i = save;
        for (let x = save; x < this.t.length; x++) this.roles.delete(x);
      }
    }
    // a time adverbial between the subject and the verb (Maivo nuna-krono lirala): canon has it,
    // the template does not (2.5:G126 puts time words in FRAME or among the adjuncts)
    if (
      clause.subject !== null &&
      this.is(this.i, 'timeAdv') &&
      (this.predicateStart(this.i + 1) || this.verbish(this.i + 1))
    ) {
      this.find(
        '2.5:G126',
        `${this.w(this.i)} between the subject and the ${this.is(this.i + 1, 'op') ? 'operators' : 'verb'} has no slot in the template: a time word opens the clause as its FRAME or stands among the closing adjuncts`,
        [this.i],
        'error',
      );
      this.role(this.i, 'ADJUNCT');
      clause.adjuncts.push({
        kind: 'time',
        start: this.i,
        end: this.i + 1,
        head: this.i,
        np: null,
        clause: null,
      });
      this.i += 1;
    }
    // OPERATORS
    this.parseOps(clause, 'ops');
    // la + adjective stands among the adjuncts, after the verb and object (2.5:G105)
    if (
      this.w(this.i) === 'la' &&
      (this.adjish(this.i + 1) || this.is(this.i + 1, 'degree')) &&
      this.verbish(this.i + (this.is(this.i + 1, 'degree') ? 3 : 2))
    ) {
      const la = this.i;
      this.i += this.is(this.i + 1, 'degree') ? 3 : 2;
      this.roleSpan(la, this.i, 'ADJUNCT');
      this.find(
        '2.5:G105',
        'la + adjective stands among the adjuncts, after the verb and the object',
        [la],
        'error',
      );
      clause.adjuncts.push({
        kind: 'la',
        start: la,
        end: this.i,
        head: la,
        np: null,
        clause: null,
      });
    }
    // PREDICATE
    const v = this.i;
    if (this.is(v, 'copula')) {
      clause.verb = v;
      this.role(v, 'COPULA');
      this.i += 1;
      const w = this.w(v);
      clause.predKind = w === 'loya' ? 'become' : w === 'miyo' ? 'existential' : 'copula';
      const being = this.ix.source.rules.absolute_being;
      if (clause.predKind === 'existential') {
        const np = this.parseNP();
        // SUBJECT [TENSE] miyo with nothing after it: the subject exists (3.0:G132); and the formula (3.0:G133)
        if (np === null && being !== undefined && (clause.subject !== null || formula)) {
          /* absolute being */
        } else if (np === null) this.find('0.8:G7', 'miyo needs a noun phrase after it', [v]);
        else {
          clause.object = np;
          this.roleSpan(np.start, np.end, 'OBJECT');
        }
      } else if (
        being !== undefined &&
        !ctx.gap &&
        // a place or time word as the subject keeps its own diagnosis (2.5:G93)
        clause.subject?.headKind !== 'correlative' &&
        being.copulas_needing_a_predicate.includes(w) &&
        (this.atEnd() || this.isPunct(this.i, ','))
      ) {
        this.find(
          being.ruling,
          `${w} needs a predicate; bare being is ${being.word} (… ${being.word})`,
          [v],
          'error',
          being.word,
        );
      } else {
        this.parsePredicate(clause, v);
      }
    } else if (this.is(v, 'valency')) {
      this.parseValency(clause, v);
    } else if (this.is(v, 'passive')) {
      clause.verb = v;
      clause.predKind = 'passive';
      this.role(v, 'VERB');
      this.i += 1;
      if (this.verbish(this.i)) {
        clause.innerVerb = this.i;
        this.role(this.i, 'VERB');
        this.checkPassiveVerb(this.i);
        this.i += 1;
      } else this.find('2.5:G110', 'gome is followed by a verb', [v]);
      if (this.w(this.i) === this.ix.source.rules.passive.agent) {
        const g = this.i;
        this.role(g, 'ADJUNCT');
        this.i += 1;
        const ag = this.parseNP();
        if (ag === null) this.find('0.8:G7', 'gagu needs the agent after it', [g]);
        else {
          clause.agent = ag;
          this.roleSpan(ag.start, ag.end, 'ADJUNCT');
        }
      }
    } else if (this.verbish(v) && this.isWord(v)) {
      clause.verb = v;
      clause.predKind = 'verb';
      this.role(v, 'VERB');
      this.i += 1;
      this.parseObject(clause, ctx);
    } else if (clause.subject !== null && this.is(v, 'prep') && !this.verbish(v)) {
      // a place or other prepositional predicate needs a copula (2.5:G128)
      const pp = this.parsePP();
      if (pp !== null && this.predicateStart(this.i)) {
        // the subject's noun phrase takes de or a raho clause, not a prepositional phrase (2.5:G98)
        this.find(
          '2.5:G98',
          `a ${this.w(v)} phrase stands between the subject and the verb: a noun phrase takes de or a raho clause after it (… raho ke ${this.w(v)} …)`,
          [v],
        );
        this.roleSpan(pp.start, pp.end, 'SUBJECT');
        clause.adjuncts.push(pp);
        this.parseOps(clause, 'ops');
        const v2 = this.i;
        if (this.is(v2, 'copula')) {
          clause.verb = v2;
          this.role(v2, 'COPULA');
          this.i += 1;
          clause.predKind = 'copula';
          this.parsePredicate(clause, v2);
        } else if (this.verbish(v2)) {
          clause.verb = v2;
          clause.predKind = 'verb';
          this.role(v2, 'VERB');
          this.i += 1;
          this.parseObject(clause, ctx);
        }
      } else if (pp !== null) {
        // NP ala NP!: a verbless acclamation, a liturgical fragment (3.0:G137)
        const ac = this.ix.source.rules.acclamation;
        const acclaimed =
          ac !== undefined && this.w(v) === ac.preposition && this.acclamationEnds(ac.mark);
        if (!acclaimed)
          this.find(
            '2.5:G128',
            `a ${this.w(v)} phrase as the predicate needs ke or ka (SUBJECT ke ${this.w(v)} …)`,
            [v],
            'error',
            `ke ${this.w(v)}`,
          );
        this.roleSpan(pp.start, pp.end, 'PREDICATE');
        clause.predicate = {
          kind: 'pp',
          start: pp.start,
          end: pp.end,
          degree: null,
          tonsi: null,
          np: pp.np,
          prep: pp.head,
        };
        clause.predKind = 'copula';
      }
    } else if (clause.subject !== null && this.adjish(v)) {
      // a bare adjective predicate: present only, no operators (2.5:G128)
      clause.predKind = 'bare-adjective';
      const s = this.i;
      this.parseAdjP(clause);
      // an object after it: the adjective stands where the verb belongs
      const objectAhead =
        this.w(this.i) === 'raho' ||
        this.w(this.i) === 'fime' ||
        (this.npStart(this.i) &&
          !this.is(this.i, 'prep') &&
          !this.is(this.i, 'timeAdv') &&
          !this.is(this.i, 'placeAdv'));
      const verb = this.verbOfWord(s);
      if (objectAhead && verb !== null && clause.predicate?.degree === null) {
        this.find(
          '2.5:G126',
          `${this.w(s)} is an adjective where the verb belongs: ${verb}`,
          [s],
          'error',
          verb,
        );
        clause.predKind = 'verb';
        clause.verb = s;
        this.parseObject(clause, {});
      }
      if (clause.ops.length > 0)
        this.find(
          '2.5:G128',
          'a bare adjective predicate takes no operators: use ke or ka',
          [...clause.ops.map((o) => o.at), s],
          'error',
          `${clause.ops.map((o) => this.w(o.at)).join(' ')} ke`,
        );
    } else if (v < this.t.length && this.isWord(v)) {
      // something stands where the verb belongs
      const r = this.readings(v);
      const neFragment =
        clause.subject === null &&
        clause.ops.length > 0 &&
        clause.ops.every((o) => o.slot === 'NEGATION');
      if (
        !neFragment &&
        (clause.ops.length > 0 || clause.subject !== null) &&
        r.some((x) => x.pos === 'noun' || x.pos === 'adj')
      ) {
        const verb = this.verbOfWord(v);
        if (clause.ops.length > 0 || clause.subject !== null) {
          if (verb !== null && clause.ops.length > 0) {
            this.find(
              '2.5:G126',
              `${this.w(v)} is not a verb form; the verb slot takes a verb (${verb})`,
              [v],
              'error',
              verb,
            );
            clause.verb = v;
            clause.predKind = 'verb';
            this.role(v, 'VERB');
            this.i += 1;
            this.parseObject(clause, ctx);
          } else if (clause.subject !== null && this.nounish(v) && !this.is(v, 'verb')) {
            // SUBJECT NOUN with no copula
            const np = this.parseNP();
            if (np !== null) {
              this.find(
                '2.5:G128',
                'a noun-phrase predicate needs ke or ka',
                [np.start],
                'error',
                'ke',
              );
              clause.predicate = {
                kind: 'np',
                start: np.start,
                end: np.end,
                degree: null,
                tonsi: null,
                np,
              };
              clause.predKind = 'copula';
              this.roleSpan(np.start, np.end, 'PREDICATE');
            }
          }
        }
      }
    }
    const onlyNe = clause.ops.length > 0 && clause.ops.every((o) => o.slot === 'NEGATION');
    if (
      clause.predKind === 'none' &&
      onlyNe &&
      (this.npStart(this.i) ||
        this.w(this.i) === 'la' ||
        this.is(this.i, 'attitude') ||
        this.is(this.i, 'timeAdv') ||
        this.is(this.i, 'placeAdv') ||
        this.is(this.i, 'mannerAdv') ||
        this.adjish(this.i) ||
        this.atEnd() ||
        this.isPunct(this.i, ','))
    ) {
      // ne before a contrasted constituent or a fragment (0.8:G2)
      if (this.npStart(this.i)) {
        const np = this.parseNP({ adverbHead: true });
        if (np !== null) {
          this.roleSpan(np.start, np.end, clause.subject === null ? 'PREDICATE' : 'OBJECT');
          if (clause.subject === null)
            clause.predicate = {
              kind: 'np',
              start: np.start,
              end: np.end,
              degree: null,
              tonsi: null,
              np,
            };
          else clause.object = np;
        }
      } else if (this.adjish(this.i)) this.parseAdjP(clause);
      else if (this.is(this.i, 'attitude')) this.parseClosing(clause);
      else if (this.w(this.i) === 'la') this.parseAdjuncts(clause);
      else if (!this.atEnd() && !this.isPunct(this.i)) {
        this.role(this.i, 'ADJUNCT');
        clause.adjuncts.push({
          kind: 'time',
          start: this.i,
          end: this.i + 1,
          head: this.i,
          np: null,
          clause: null,
        });
        this.i += 1;
      }
    } else if (
      clause.ops.length > 0 &&
      clause.predKind === 'none' &&
      !this.isPunct(this.i, '—') &&
      !this.isPunct(this.i, '–')
    )
      this.find(
        '2.5:G126',
        'the operators have no verb after them',
        clause.ops.map((o) => o.at),
      );
    // ADJUNCTS and CLOSING
    this.parseAdjuncts(clause);
    this.parseClosing(clause);
    clause.end = this.i;
  }

  /** The sentence ends here with the mark, or after a comma-set iya vocative (3.0:G137). */
  private acclamationEnds(mark: string): boolean {
    const last = [...this.t].reverse().find((t) => t.kind === 'punct')?.text ?? '';
    if (!last.includes(mark)) return false;
    return this.onlyEndPunct() || (this.isPunct(this.i, ',') && this.is(this.i + 1, 'vocative'));
  }

  /** A verb starts here (so the word is not a subject): ne + verb, or a verb with no noun reading. */
  private verbStartsHere(): boolean {
    const k = this.i;
    if (this.w(k) === 'ne' && (this.verbish(k + 1) || this.is(k + 1, 'op'))) return true;
    return this.verbish(k) && !this.nounish(k) && !this.adjish(k);
  }

  private checkPassiveVerb(i: number): void {
    const form = this.w(i);
    if (this.ix.transitive.size > 0 && !this.ix.transitive.has(form))
      this.find(
        '2.5:G110',
        `gome passivises a verb attested with an object; ${form} is not attested with one in the data`,
        [i],
        'warn',
      );
  }

  private parseValency(clause: Clause, v: number): void {
    clause.verb = v;
    clause.predKind = 'valency';
    this.role(v, 'VERB');
    this.i += 1;
    const actor = this.parseNP();
    if (actor === null) {
      this.find(
        '2.5:G109',
        `${this.w(v)} needs its actor and a verb: CAUSER ${this.w(v)} ACTOR VERB`,
        [v],
      );
      return;
    }
    clause.actor = actor;
    this.roleSpan(actor.start, actor.end, 'ACTOR');
    const before = clause.actorOps.length;
    this.parseOps(clause, 'actorOps');
    // the actor takes only its own ne, approach, phase and effort (2.5:G109)
    const allowed = this.ix.source.rules.valency.actor_slots;
    for (const o of clause.actorOps.slice(before)) {
      if (!allowed.includes(o.slot))
        this.find('2.5:G109', `${this.w(o.at)} belongs to the main clause, before ${this.w(v)}`, [
          o.at,
        ]);
    }
    if (this.is(this.i, 'copula')) {
      clause.innerVerb = this.i;
      this.role(this.i, 'COPULA');
      this.i += 1;
      const inner = emptyClause('chain', this.i, null);
      this.parsePredicate(inner, this.i - 1);
      clause.predicate = inner.predicate;
    } else if (this.verbish(this.i)) {
      clause.innerVerb = this.i;
      this.role(this.i, 'VERB');
      this.i += 1;
      const inner = emptyClause('chain', this.i, null);
      this.parseObject(inner, {});
      clause.object = inner.object;
      clause.objectClause = inner.objectClause;
      clause.recipient = inner.recipient;
    } else {
      this.find('2.5:G109', `${this.w(v)} ACTOR is followed by the actor's verb`, [v]);
    }
  }

  /** After a copula: one predicate, or several joined by ata / oro (and commas before the last). */
  private parsePredicate(clause: Clause, cop: number): void {
    this.parsePredicateOne(clause, cop);
    const first = clause.predicate;
    const parts: Predicate[] = first === null ? [] : [first];
    for (let guard = 0; guard < 8; guard++) {
      const k = this.i;
      const joined =
        (this.w(k) === 'ata' || this.w(k) === 'oro') &&
        (this.adjish(k + 1) || this.npStart(k + 1)) &&
        !this.clauseAhead(k + 1);
      const listed =
        (this.isPunct(k, ',') &&
          (this.adjish(k + 1) || this.npStart(k + 1)) &&
          /^(ata|oro)$/.test(this.w(k + 2))) ||
        (this.isPunct(k, ',') &&
          (this.adjish(k + 1) || this.nounish(k + 1)) &&
          (this.w(k + 2) === 'ata' || this.w(k + 2) === 'oro' || this.isPunct(k + 2, ',')));
      if (!joined && !listed) break;
      this.role(k, joined ? 'LINKER' : 'PUNCT');
      this.i += 1;
      this.parsePredicateOne(clause, cop);
      if (clause.predicate !== null && clause.predicate !== parts[parts.length - 1])
        parts.push(clause.predicate);
    }
    if (first !== null && clause.predicate !== null)
      clause.predicate = {
        ...first,
        end: clause.predicate.end,
        ...(parts.length > 1 ? { parts } : {}),
      };
  }

  private parsePredicateOne(clause: Clause, cop: number): void {
    const k = this.i;
    if (this.w(k) === 'sidu' && this.verbish(k + 1))
      this.find(
        'open_questions',
        `${this.w(cop)} sidu + verb ("destined to") is an open question: hold until a second use`,
        [cop, k],
        'unruled',
      );
    let ne: number | undefined;
    if (this.w(k) === 'ne' && (this.adjish(k + 1) || this.npStart(k + 1))) {
      this.role(k, 'NEGATION');
      ne = k;
      this.i += 1;
    }
    const s = this.i;
    this.parsePredicateBody(clause, cop, s);
    if (ne !== undefined && clause.predicate !== null)
      clause.predicate = { ...clause.predicate, ne };
  }

  private parsePredicateBody(clause: Clause, cop: number, s: number): void {
    if (this.is(s, 'kiword') && this.w(s) === 'ki-modo') {
      this.role(s, 'PREDICATE');
      this.i += 1;
      this.parseAdjP(clause);
      clause.predicate = { kind: 'kiword', start: s, end: this.i, degree: s, tonsi: null };
      return;
    }
    if (this.is(s, 'kiword') && !this.npStart(s)) {
      this.role(s, 'PREDICATE');
      this.i += 1;
      clause.predicate = { kind: 'kiword', start: s, end: this.i, degree: null, tonsi: null };
      return;
    }
    if (
      this.is(s, 'degree') &&
      !this.adjish(s + 1) &&
      this.nounish(s + 1) &&
      !this.ix.source.rules.comparison.amount_words.includes(this.w(s))
    ) {
      const adj = this.adjectiveOf(s + 1);
      this.find(
        '2.5:G98',
        `${this.w(s)} is a degree word: it stands before an adjective, and ${this.w(s + 1)} is a noun${adj === null ? '' : ` (its adjective is ${adj})`}`,
        [s, s + 1],
        'error',
        adj ?? undefined,
      );
      this.roleSpan(s, s + 2, 'PREDICATE');
      this.i += 2;
      clause.predicate = { kind: 'adj', start: s, end: this.i, degree: s, tonsi: null };
      return;
    }
    if (this.w(s) === 'tonsi' || this.adjish(s) || (this.is(s, 'degree') && this.adjish(s + 1))) {
      // an adjective unless a noun follows (then it is a noun phrase: ka vanisan lira)
      const save = this.i;
      const probe = this.parseAdjP(clause);
      if (probe && !this.nounish(this.i)) return;
      this.i = save;
      clause.predicate = null;
    }
    if (this.is(s, 'prep') || this.is(s, 'side')) {
      const a = this.parsePP();
      if (a !== null) {
        clause.predicate = {
          kind: 'pp',
          start: a.start,
          end: a.end,
          degree: null,
          tonsi: null,
          np: a.np,
          prep: a.head,
        };
        this.roleSpan(a.start, a.end, 'PREDICATE');
        return;
      }
    }
    if (this.is(s, 'placeAdv') || this.is(s, 'timeAdv')) {
      this.role(s, 'PREDICATE');
      this.i += 1;
      clause.predicate = { kind: 'adv', start: s, end: this.i, degree: null, tonsi: null };
      return;
    }
    const np = this.parseNP();
    if (np !== null) {
      clause.predicate = {
        kind: 'np',
        start: np.start,
        end: np.end,
        degree: null,
        tonsi: null,
        np,
      };
      this.roleSpan(np.start, np.end, 'PREDICATE');
      return;
    }
    if (clause.kiFront !== null || clause.kind === 'relative') return;
    if (this.verbish(s))
      this.find(
        '2.5:G93',
        `${this.w(cop)} is followed by an adjective, a noun phrase or a place, not a verb`,
        [s],
      );
    else this.find('2.5:G93', `${this.w(cop)} needs its predicate`, [cop]);
  }

  /** [tonsi] [DEGREE] ADJECTIVE, with tamo / gase / fime / sidu after it. */
  private parseAdjP(clause: Clause): boolean {
    const s = this.i;
    let tonsi: number | null = null;
    if (this.w(s) === 'tonsi' && (this.adjish(s + 1) || this.is(s + 1, 'degree'))) {
      tonsi = s;
      this.role(s, 'PREDICATE');
      this.i += 1;
    }
    let degree: number | null = null;
    if (this.is(this.i, 'degree') && this.adjish(this.i + 1)) {
      degree = this.i;
      this.role(this.i, 'PREDICATE');
      this.i += 1;
    }
    if (!this.adjish(this.i)) {
      this.i = s;
      return false;
    }
    this.role(this.i, 'PREDICATE');
    this.i += 1;
    clause.predicate = { kind: 'adj', start: s, end: this.i, degree, tonsi };
    // ADJECTIVE sidu VERB: the thing described is the understood object (2.5:G111)
    if (this.w(this.i) === 'sidu' && this.verbish(this.i + 1)) {
      const sd = this.i;
      this.role(sd, 'ADJUNCT');
      this.i += 1;
      this.role(this.i, 'VERB');
      const vb = this.i;
      this.i += 1;
      const chain = emptyClause('chain', vb, sd);
      chain.verb = vb;
      chain.predKind = 'verb';
      if (this.npStart(this.i)) {
        const obj = this.parseNP();
        if (obj !== null) {
          chain.object = obj;
          this.roleSpan(obj.start, obj.end, 'OBJECT');
          const dummy = this.ix.source.rules.adjective_sidu.dummy;
          if (clause.subject !== null && this.w(clause.subject.head ?? -1) === dummy)
            this.find(
              '2.5:G111',
              `no dummy ${dummy}: the thing described is the subject and the verb's understood object (${this.w(obj.head ?? obj.start)} ke … sidu ${this.w(vb)})`,
              [clause.subject.start, obj.start],
            );
        }
      }
      clause.subordinates.push(chain);
    }
    return true;
  }

  /** OBJECT after a verb: a recipient pronoun + theme, a noun phrase, or a clause. */
  private parseObject(clause: Clause, ctx: { gap?: boolean }): void {
    const k = this.i;
    // sidu + verb: a verb chain, directly after the first verb (0.8:G6, 2.5:G113)
    if (this.w(k) === 'sidu') {
      this.parseChain(clause);
      return;
    }
    if (this.w(k) === 'fime' || this.w(k) === 'ki-oro') {
      clause.objectClause = this.parseSubClause('content');
      return;
    }
    if (this.w(k) === 'raho') {
      // a headless relative as the object (2.2:G64)
      clause.objectClause = this.parseSubClause('relative');
      return;
    }
    if (this.is(k, 'kiword') && this.w(k) !== 'ki-oro' && this.clauseAhead(k + 1)) {
      const sub = this.parseSubClause('content');
      clause.objectClause = sub;
      return;
    }
    if (this.is(k, 'kiword') && !this.npStart(k)) return; // a ki-word in place: an adjunct
    // ne before a contrasted object (0.8:G2): po bumreba ne tressa, nara cuara
    if (this.w(k) === 'ne' && this.npStart(k + 1)) {
      this.role(k, 'NEGATION');
      this.i += 1;
      const np = this.parseNP();
      if (np !== null) {
        clause.object = { ...np, start: k };
        this.roleSpan(np.start, np.end, 'OBJECT');
      }
      return;
    }
    if (!this.npStart(k) || (this.is(k, 'prep') && !this.nounish(k))) return;
    // a bare time noun after a verb is its object (2.5:G103); a time adverbial is not
    if (this.is(k, 'timeAdv') && !this.is(k, 'noun')) return;
    if (this.is(k, 'placeAdv') || this.is(k, 'mannerAdv')) return;
    if (this.side(k) && this.npStart(k + 1)) return;
    const first = this.parseNP();
    if (first === null) return;
    // a second bare noun phrase: a recipient pronoun + the theme (2.5:G112)
    if (
      this.npStart(this.i) &&
      this.w(this.i) !== 'sidu' &&
      !this.is(this.i, 'prep') &&
      !this.is(this.i, 'timeAdv') &&
      !this.is(this.i, 'placeAdv') &&
      first.headKind !== 'adj'
    ) {
      const save = this.i;
      const second = this.parseNP();
      if (second !== null) {
        clause.recipient = first;
        clause.object = second;
        this.roleSpan(first.start, first.end, 'RECIPIENT');
        this.roleSpan(second.start, second.end, 'OBJECT');
        this.checkRecipient(clause, first);
        return;
      }
      this.i = save;
    }
    clause.object = first;
    this.roleSpan(first.start, first.end, 'OBJECT');
    const subj = clause.subject;
    if (
      subj !== null &&
      subj.headKind === 'pron' &&
      first.headKind === 'pron' &&
      first.refl === null &&
      first.de === null &&
      this.w(subj.head ?? -1) === this.w(first.head ?? -2)
    )
      this.find(
        'function_words:sela',
        `the object is the subject itself: a reflexive takes sela (${this.w(first.head ?? -1)} sela)`,
        [first.start],
        'warn',
        `${this.w(first.head ?? -1)} sela`,
      );
    void ctx;
  }

  private checkRecipient(clause: Clause, rec: NounPhrase): void {
    const verb = this.w(clause.innerVerb ?? clause.verb ?? -1).replace(/^[a-z]+-/, '');
    if (rec.headKind !== 'pron') {
      this.find(
        '2.5:G112',
        'a recipient that is not a pronoun takes ala after the theme: VERB THEME ala RECIPIENT',
        [rec.start],
        'error',
      );
      return;
    }
    const approved = verb in this.ix.source.flags.give_type;
    if (!approved) {
      const draft = this.ix.source.rules.recipient.draft_tags.verbs.includes(verb);
      this.find(
        '2.5:G112',
        `a bare pronoun recipient after ${verb}: the verbs whose meaning has a recipient are awaiting the author's approval${draft ? ' (drafted)' : ' (not in the draft)'}`,
        [rec.start],
        'unruled',
      );
    }
  }

  private parseChain(clause: Clause): void {
    const sd = this.i;
    this.role(sd, 'ADJUNCT');
    this.i += 1;
    if (this.is(this.i, 'copula')) {
      this.find('0.8:G6', 'sidu joins two verbs; it is never followed by a copula', [sd, this.i]);
    }
    const chain = emptyClause('chain', this.i, sd);
    this.parseOps(chain, 'ops');
    if (this.verbish(this.i)) {
      chain.verb = this.i;
      chain.predKind = 'verb';
      this.role(this.i, 'VERB');
      this.i += 1;
      this.parseObject(chain, {});
    } else {
      this.find('0.8:G6', 'sidu needs a verb after it', [sd]);
    }
    chain.end = this.i;
    clause.adjuncts.push({
      kind: 'chain',
      start: sd,
      end: this.i,
      head: sd,
      np: null,
      clause: chain,
    });
  }

  private parsePP(): Adjunct | null {
    const p = this.i;
    const side = this.w(p) in this.ix.source.flags.side_nouns_as_prepositions;
    if (!(this.is(p, 'prep') || side)) return null;
    // a side noun stands bare before a noun phrase as a preposition (2.2:G67)
    if (side && !this.npStart(p + 1)) return null;
    this.i += 1;
    const np = this.parseNP({ adverbHead: true });
    if (np === null) {
      if (side) {
        this.i = p;
        return null;
      }
      // kroti, krotiapo alone: before, afterwards (an adverb)
      if (
        this.ix.source.rules.measure.heads.includes(this.w(p)) &&
        (this.isPunct(this.i) || this.i >= this.t.length)
      )
        return { kind: 'time', start: p, end: this.i, head: p, np: null, clause: null };
      this.find('0.8:G7', `${this.w(p)} has no noun phrase after it`, [p]);
      return { kind: 'pp', start: p, end: this.i, head: p, np: null, clause: null };
    }
    // li may not be dropped after a side noun (2.5:G99)
    if (side && np.det === null && np.quant === null && np.headKind === 'noun')
      this.find(
        '2.5:G99',
        `li is not dropped after ${this.w(p)}, a side noun used as a preposition`,
        [p, np.start],
        'error',
        `${this.w(p)} li ${this.w(np.start)}`,
      );
    if (this.ix.source.rules.measure.heads.includes(this.w(p)) && np.quant !== null)
      this.find(
        '2.5:G108',
        `a measure after ${this.w(p)} with a quantifier: the listed quantifiers are awaiting the author`,
        [p, np.quant],
        'unruled',
      );
    return { kind: 'pp', start: p, end: this.i, head: p, np, clause: null };
  }

  /** ADJUNCTS: prepositional phrases, la + adjective, time, place, comparison … */
  private parseAdjuncts(clause: Clause): void {
    for (;;) {
      const k = this.i;
      if (k >= this.t.length || !this.isWord(k)) return;
      const w = this.w(k);
      if (
        this.isClosing(k) ||
        this.startsSubordinate(k) ||
        w === 'ata' ||
        w === 'nara' ||
        w === 'oro'
      )
        return;
      if (w === 'la') {
        this.role(k, 'ADJUNCT');
        this.i += 1;
        let degree: number | undefined;
        let adj: number | undefined;
        if (this.is(this.i, 'degree')) {
          degree = this.i;
          this.role(this.i, 'ADJUNCT');
          this.i += 1;
        }
        if (this.adjish(this.i)) {
          adj = this.i;
          this.role(this.i, 'ADJUNCT');
          this.i += 1;
        } else this.find('2.5:G105', 'la is followed by an adjective', [k]);
        clause.adjuncts.push({
          kind: 'la',
          start: k,
          end: this.i,
          head: k,
          np: null,
          clause: null,
          ...(degree === undefined ? {} : { degree }),
          ...(adj === undefined ? {} : { adj }),
        });
        // la + adjective + tamo NP (2.5:G106)
        if (this.w(this.i) === 'tamo') this.parseTamo(clause);
        continue;
      }
      // a degree word outside la (2.5:G105): ruli la molusan
      if (this.is(k, 'degree') && this.w(k + 1) === 'la') {
        this.find(
          '2.5:G105',
          `a degree word goes between la and the adjective: la ${w} …`,
          [k],
          'error',
        );
        this.role(k, 'ADJUNCT');
        this.i += 1;
        continue;
      }
      // bare kasi / menu after the verb is not licensed (2.5:G106)
      if (this.ix.source.rules.comparison.amount_words.includes(w) && this.w(k + 1) === 'tamo') {
        this.find(
          '2.5:G106',
          `${w} needs a noun (${w} + noun … tamo) or la + an adjective (la ${w} + adjective … tamo)`,
          [k],
        );
        this.role(k, 'ADJUNCT');
        this.i += 1;
        continue;
      }
      if (w === 'tamo') {
        this.parseTamo(clause);
        continue;
      }
      if (w === 'gase') {
        this.role(k, 'ADJUNCT');
        this.i += 1;
        // gase ADJ gase NP: as ADJ as NP (0.8:G8)
        let adj: number | undefined;
        if (this.adjish(this.i) && this.w(this.i + 1) === 'gase') {
          adj = this.i;
          this.role(this.i, 'ADJUNCT');
          this.role(this.i + 1, 'ADJUNCT');
          this.i += 2;
        }
        const np = this.parseNP();
        if (np !== null) this.roleSpan(np.start, np.end, 'ADJUNCT');
        clause.adjuncts.push({
          kind: 'simile',
          start: k,
          end: this.i,
          head: k,
          np,
          clause: null,
          ...(adj === undefined ? {} : { adj }),
        });
        if (np === null)
          this.find('0.8:G8', 'gase needs a noun phrase or an adjective after it', [k]);
        continue;
      }
      if (w === 'sidu') {
        // sidu stays for verb chains, directly after the verb: not for purpose (2.5:G113)
        this.find(
          '2.5:G113',
          'sidu joins a verb directly to the verb before it; purpose is kopisa',
          [k],
          'error',
          'kopisa',
        );
        this.parseChain(clause);
        continue;
      }
      // kroti / krotiapo + a measure (2.1:G55, 2.5:G108)
      if (
        this.ix.source.rules.measure.heads.includes(w) &&
        (this.is(k + 1, 'num') || this.is(k + 1, 'quant'))
      ) {
        this.role(k, 'ADJUNCT');
        this.i += 1;
        if (this.is(this.i, 'quant'))
          this.find(
            '2.5:G108',
            `a measure after ${w} with a quantifier: the listed quantifiers are awaiting the author`,
            [k, this.i],
            'unruled',
          );
        const np = this.parseNP();
        if (np !== null) this.roleSpan(np.start, np.end, 'ADJUNCT');
        clause.adjuncts.push({ kind: 'measure', start: k, end: this.i, head: k, np, clause: null });
        continue;
      }
      if (this.is(k, 'prep') || w in this.ix.source.flags.side_nouns_as_prepositions) {
        const a = this.parsePP();
        if (a !== null) {
          this.role(k, 'ADJUNCT');
          if (a.np !== null) this.roleSpan(a.np.start, a.np.end, 'ADJUNCT');
          clause.adjuncts.push(a);
          continue;
        }
      }
      if (
        this.is(k, 'timeAdv') ||
        this.is(k, 'placeAdv') ||
        this.is(k, 'mannerAdv') ||
        (this.is(k, 'kiword') && !this.npStart(k))
      ) {
        this.role(k, 'ADJUNCT');
        this.i += 1;
        clause.adjuncts.push({
          kind: this.is(k, 'kiword')
            ? 'kiword'
            : this.is(k, 'timeAdv')
              ? 'time'
              : this.is(k, 'placeAdv')
                ? 'place'
                : 'manner',
          start: k,
          end: this.i,
          head: k,
          np: null,
          clause: null,
        });
        continue;
      }
      // reve / loki closing the clause, among the adjuncts (2.5:G126)
      if (this.ix.source.rules.closing_order.iteration_may_close.includes(w)) {
        this.role(k, 'ADJUNCT');
        this.i += 1;
        clause.adjuncts.push({
          kind: 'iteration',
          start: k,
          end: this.i,
          head: k,
          np: null,
          clause: null,
        });
        continue;
      }
      // a tense or iteration word is never a closing time word (2.5:G127)
      if (this.ix.source.rules.closing_order.never_closing.words.includes(w)) {
        this.find(
          '2.5:G127',
          `${w} is a tense or iteration word, not a closing time word: it stands before the verb`,
          [k],
        );
        this.role(k, 'ADJUNCT');
        this.i += 1;
        continue;
      }
      // a scope operator before its constituent (1.0:G1)
      if (this.is(k, 'scope') && w !== 'ne') {
        this.role(k, 'ADJUNCT');
        clause.adjuncts.push({
          kind: 'time',
          start: k,
          end: k + 1,
          head: k,
          np: null,
          clause: null,
        });
        this.i += 1;
        continue;
      }
      // NUMBER + a time unit after the verb: a duration, not yet ruled (I-17)
      if (
        this.is(k, 'num') &&
        this.ix.timeNouns.has((this.t[k + 1]?.word?.lower ?? '').replace(/ri$/, ''))
      ) {
        const np = this.parseNP();
        if (np !== null) {
          this.find(
            'I-17',
            'a duration (NUMBER + a time unit after the verb) is not ruled yet: a bare noun after a verb is its object (2.5:G103)',
            [np.start],
            'unruled',
          );
          this.roleSpan(np.start, np.end, 'ADJUNCT');
          clause.adjuncts.push({
            kind: 'measure',
            start: np.start,
            end: np.end,
            head: np.start,
            np,
            clause: null,
          });
          continue;
        }
      }
      // a noun phrase after the adjuncts, with no object yet: the object stands right after the verb
      if (
        this.npStart(k) &&
        clause.object === null &&
        clause.objectClause === null &&
        clause.adjuncts.length > 0 &&
        (clause.predKind === 'verb' || clause.predKind === 'valency')
      ) {
        const np = this.parseNP();
        if (np !== null) {
          const pp = clause.adjuncts[clause.adjuncts.length - 1];
          const ala = pp !== undefined && this.w(pp.head) === 'ala';
          this.find(
            ala ? '2.5:G112' : '2.5:G126',
            ala
              ? 'the theme comes first and the recipient after it: VERB THEME ala RECIPIENT'
              : 'the object stands right after the verb, before the adjuncts',
            [np.start],
            'error',
          );
          clause.object = np;
          this.roleSpan(np.start, np.end, 'OBJECT');
          continue;
        }
      }
      // a bare noun phrase among the adjuncts: a second object
      if (this.npStart(k) && clause.object !== null) {
        const np = this.parseNP();
        if (np !== null) {
          this.find(
            '2.5:G112',
            'a second noun phrase after the object: a recipient that is not a pronoun takes ala (VERB THEME ala RECIPIENT)',
            [np.start],
          );
          this.roleSpan(np.start, np.end, 'OBJECT');
          continue;
        }
      }
      return;
    }
  }

  private parseTamo(clause: Clause): void {
    const k = this.i;
    this.role(k, 'ADJUNCT');
    this.i += 1;
    const np = this.parseNP();
    if (np === null) this.find('0.8:G8', 'tamo needs what is compared after it', [k]);
    else this.roleSpan(np.start, np.end, 'ADJUNCT');
    clause.adjuncts.push({ kind: 'comparison', start: k, end: this.i, head: k, np, clause: null });
  }

  private isClosing(k: number): boolean {
    return (
      this.is(k, 'recip') || this.is(k, 'status') || this.is(k, 'attitude') || this.is(k, 'ki')
    );
  }

  /** CLOSING: [fuyi] [hoyo | yasmo] [ATTITUDE] [ki], in this order (2.5:G126). */
  private parseClosing(clause: Clause): void {
    const rank: Record<string, number> = { RECIPROCAL: 0, STATUS: 1, ATTITUDE: 2, QUESTION: 3 };
    let last = -1;
    for (;;) {
      const k = this.i;
      if (!this.isClosing(k)) break;
      const slot = this.is(k, 'recip')
        ? 'RECIPROCAL'
        : this.is(k, 'status')
          ? 'STATUS'
          : this.is(k, 'attitude')
            ? 'ATTITUDE'
            : 'QUESTION';
      const r = rank[slot] ?? 0;
      if (r <= last && slot !== 'QUESTION')
        this.find(
          '2.5:G126',
          `${this.w(k)} is out of the closing order: … ADJUNCTS fuyi hoyo|yasmo ATTITUDE ki`,
          [k],
        );
      last = Math.max(last, r);
      this.role(k, slot as Role);
      clause.closing.push({ at: k, slot });
      this.i += 1;
      // adjuncts after fuyi: a closing time word stands before fuyi (2.5:G126)
      if (
        slot === 'RECIPROCAL' &&
        (this.is(this.i, 'timeAdv') || this.is(this.i, 'placeAdv') || this.is(this.i, 'prep'))
      ) {
        this.find('2.5:G126', `${this.w(this.i)} stands among the adjuncts, before fuyi`, [this.i]);
        const before = clause.adjuncts.length;
        this.parseAdjuncts(clause);
        if (clause.adjuncts.length === before) this.i += 1;
      }
    }
    // zoke excludes the other attitude words (1.0:G16) is in the exclusions
    const words = clause.closing.map((c) => this.w(c.at));
    for (const [a, b] of this.ix.exclusions)
      if (words.includes(a) && words.includes(b))
        this.find(
          '1.0:G16',
          `${a} and ${b} never share a clause`,
          clause.closing.map((c) => c.at),
        );
  }

  private startsSubordinate(k: number): boolean {
    const w = this.w(k);
    if (this.is(k, 'sub') && w !== 'raho') {
      // nevi / tuni + a noun phrase is a preposition (1.0:G11, 2.3:G79)
      if (w in this.ix.source.flags.subordinators_taking_a_noun_phrase && !this.clauseAhead(k + 1))
        return false;
      return true;
    }
    // kroti / krotiapo + a clause: before / after (2.2:G66)
    if (this.ix.source.rules.measure.heads.includes(w) && this.clauseAhead(k + 1)) return true;
    return false;
  }

  /** A clause starts here: a subject then a predicate, or a predicate. */
  private clauseAhead(k: number): boolean {
    const save = this.i;
    this.i = k;
    const mute = this.findings.length;
    const roles = new Map(this.roles);
    let ok = false;
    if (this.predicateStart(k) || this.formulaAt(k)) ok = true;
    else if (this.npStart(k)) {
      const np = this.parseNP({ noRelative: true });
      ok =
        np !== null &&
        (this.predicateStart(this.i) || (np.headKind !== 'adj' && this.adjish(this.i)));
    }
    this.findings.length = mute;
    this.roles.clear();
    for (const [a, b] of roles) this.roles.set(a, b);
    this.i = save;
    return ok;
  }

  /** A subordinate clause after its linker (or a relative after raho). */
  parseSubClause(kind: Clause['kind']): Clause {
    const linker = this.i;
    this.role(linker, kind === 'relative' ? 'SUBORDINATE' : 'SUBORDINATE');
    this.i += 1;
    this.clauseNo += 1;
    const c = emptyClause(kind, this.i, linker);
    this.clauses.push(c);
    const word = this.w(linker);
    if (kind === 'relative') {
      // a relative: its subject may be the gap (li nela raho lirala), or it has its own
      const subjectGap = this.predicateStart(this.i) && !this.npStart(this.i);
      this.parseClauseCore(c, { noSubject: subjectGap, gap: true });
      // 2.5:G115: closed by a comma when it has its own object or adjunct and the sentence goes on
      const hasMore = c.object !== null || c.objectClause !== null || c.adjuncts.length > 0;
      if (hasMore && !this.isPunct(this.i) && this.i < this.t.length && !this.onlyEndPunct())
        this.find(
          '2.5:G115',
          'a raho clause with its own object or adjunct is closed by a comma when the sentence goes on',
          [linker, this.i],
          'error',
          ',',
        );
      if (this.isPunct(this.i, ',') && !this.atEnd(this.i + 1)) {
        this.role(this.i, 'PUNCT');
        this.i += 1;
      }
    } else {
      this.parseClauseCore(c, {});
      const pronounClause =
        c.subject !== null &&
        c.subject.headKind === 'demonstrative' &&
        c.subject.end === c.subject.start + 1;
      if (c.predKind === 'none' && pronounClause)
        this.find(
          'I-54',
          `${word} ${this.w(c.subject?.start ?? linker)}: a demonstrative standing for a whole clause is not ruled`,
          [linker],
          'note',
        );
      else if (c.predKind === 'none' && c.subject === null && this.adjish(this.i)) {
        this.parseAdjP(c);
        this.find(
          '2.5:G128',
          `the ${word} clause has an adjective and no verb: a predicate adjective needs a subject and ke or ka`,
          [linker],
        );
      } else if (c.predKind === 'none' && (c.subject === null || this.w(linker) !== 'nevi'))
        this.find('2.5:G126', `the ${word} clause has no verb`, [linker]);
      // sige clauses always mark their own tense (2.5:G118)
      if (
        this.ix.source.rules.tense.own_tense.includes(word) &&
        !c.ops.some((o) => o.slot === 'TENSE')
      )
        this.find('2.5:G118', `a ${word} clause marks its own tense`, [linker], 'error');
    }
    c.end = this.i;
    this.clauseNo -= 1;
    return c;
  }

  // ---------------------------------------------------------------- sentence

  parse(): Parsed {
    const main = emptyClause('main', 0, null);
    this.clauses.push(main);
    this.parseEdgesBefore(main);
    const start = this.i;
    this.parseClauseCore(main, {});
    main.start = start;
    // a list with no verb: noun phrases, or attitude words, separated by commas
    if (main.predKind === 'none' && main.ops.length === 0) {
      while (
        this.isPunct(this.i, ',') &&
        (this.npStart(this.i + 1) || this.is(this.i + 1, 'attitude') || this.is(this.i + 1, 'op'))
      ) {
        this.role(this.i, 'PUNCT');
        this.i += 1;
        if (this.npStart(this.i)) {
          const np = this.parseNP();
          if (np !== null) this.roleSpan(np.start, np.end, 'SUBJECT');
          else this.i += 1;
        } else {
          this.role(this.i, 'INTERJECTION');
          this.i += 1;
        }
      }
    }
    if (main.predKind === 'none' && main.subject === null && this.i < this.t.length) {
      // a fragment: an adjective, a phrase or an adverb on its own (an answer, a word)
      if (this.adjish(this.i) || this.is(this.i, 'degree')) {
        const mark = this.i;
        if (!this.parseAdjP(main)) this.i = mark;
      }
      this.parseAdjuncts(main);
      this.parseClosing(main);
    }
    this.parseAfter(main);
    // whatever is left took part in nothing
    const unplaced: number[] = [];
    for (let k = 0; k < this.t.length; k++) {
      const tk = this.t[k];
      if (tk?.kind === 'word' && !this.roles.has(k)) unplaced.push(k);
    }
    return { clauses: this.clauses, findings: this.findings, roles: this.roles, unplaced };
  }

  /** LINKER, interjections, clause adverbs, FRAME, TOPIC and preposed clauses (2.5:G126). */
  private parseEdgesBefore(main: Clause, inner = false): void {
    const r = this.ix.source.rules;
    const first = this.i;
    for (let guard = 0; guard < 12; guard++) {
      const k = this.i;
      const w = this.w(k);
      if (
        (k === 0 || (inner && k === first)) &&
        r.edges.line_linkers.includes(w) &&
        this.isWord(k + 1)
      ) {
        this.role(k, 'LINKER');
        main.linker = k;
        this.i += 1;
        continue;
      }
      // iya + a noun phrase opening the sentence, or standing alone (3.0:G129)
      if (this.is(k, 'vocative')) {
        const voc = this.parseIyaVocative();
        if (voc !== null) main.address = [...(main.address ?? []), voc];
        if (this.isPunct(this.i, ',')) {
          this.role(this.i, 'PUNCT');
          this.i += 1;
        }
        continue;
      }
      // X krotiapo X: one after another, as a FRAME (3.0:G140)
      if (this.distributiveAt(k)) {
        this.roleSpan(k, k + 3, 'FRAME');
        main.frame.push(k);
        this.i = k + 3;
        if (this.isPunct(this.i, ',')) this.i += 1;
        else
          this.find(
            '2.5:G127',
            `a FRAME (${this.w(k)} krotiapo ${this.w(k)}) is set off by a comma`,
            [k],
            'warn',
          );
        continue;
      }
      if (
        (this.is(k, 'interjection') || this.is(k, 'discourse')) &&
        (this.isPunct(k + 1, ',') ||
          this.isPunct(k + 1, '…') ||
          this.isPunct(k + 1, '...') ||
          this.isPunct(k + 1, '!'))
      ) {
        this.role(k, 'INTERJECTION');
        this.i += 2;
        continue;
      }
      // fisa directly before a command (fisa lirala)
      if (w === 'fisa' && this.predicateStart(k + 1)) {
        this.role(k, 'INTERJECTION');
        this.i += 1;
        continue;
      }
      // an attitude word answering on its own: Poye, nara maivo follufa.
      if (this.is(k, 'attitude') && this.isPunct(k + 1, ',') && k === first) {
        this.role(k, 'INTERJECTION');
        this.i += 2;
        continue;
      }
      // la + a word before a comma: a manner frame (La vera, …); la takes an adjective (2.5:G105)
      if (w === 'la' && this.isWord(k + 1) && this.isPunct(k + 2, ',')) {
        if (!this.adjish(k + 1)) {
          const adj = this.adjectiveOf(k + 1);
          this.find(
            '2.5:G105',
            `la + adjective: ${this.w(k + 1)} is not an adjective${adj === null ? '' : ` (${adj})`}`,
            [k, k + 1],
            'error',
            adj === null ? undefined : `la ${adj}`,
          );
        }
        this.roleSpan(k, k + 2, 'FRAME');
        main.frame.push(k);
        this.i += 3;
        continue;
      }
      // a lone interjection, discourse particle or ne, or one before a phrase (Lorejuba ala taivo.)
      if (
        (this.is(k, 'interjection') || this.is(k, 'discourse') || w === 'ne') &&
        (this.onlyEndPunct(k + 1) || this.is(k + 1, 'prep'))
      ) {
        this.role(k, 'INTERJECTION');
        this.i += 1;
        continue;
      }
      if (this.is(k, 'clauseAdv')) {
        this.role(k, 'LINKER');
        main.linker = main.linker === null || this.isPunct(main.linker) ? k : main.linker;
        this.i += 1;
        if (this.isPunct(this.i, ',')) this.i += 1;
        else if (r.edges.clause_adverbs.comma_required.includes(w))
          this.find(
            '2.5:G117',
            `clause-initial ${w} is followed by a comma`,
            [k],
            'error',
            `${w},`,
          );
        continue;
      }
      if (this.is(k, 'frame')) {
        main.frame.push(k);
        this.role(k, 'FRAME');
        this.i += 1;
        if (this.isPunct(this.i, ',')) this.i += 1;
        else
          this.find(
            '2.5:G127',
            `${w} opens its clause and is set off by a comma`,
            [k],
            'warn',
            `${w},`,
          );
        continue;
      }
      // a time or place adverbial opening the clause is its FRAME, with a comma (2.5:G127)
      if (
        (this.is(k, 'timeAdv') || this.is(k, 'placeAdv')) &&
        (this.isWord(k + 1) || this.isPunct(k + 1, ',')) &&
        !this.is(k + 1, 'copula')
      ) {
        if (this.isPunct(k + 1, ',')) {
          main.frame.push(k);
          this.role(k, 'FRAME');
          this.i += 2;
          continue;
        }
        if (this.npStart(k + 1) || this.predicateStart(k + 1)) {
          main.frame.push(k);
          this.role(k, 'FRAME');
          this.find('2.5:G127', `a FRAME (${w}) is set off by a comma`, [k], 'warn', `${w},`);
          this.i += 1;
          continue;
        }
      }
      // a prepositional phrase of place before a comma: FRAME (2.5:G127, derived)
      if (this.is(k, 'prep') && !this.startsSubordinate(k)) {
        const save = this.i;
        const pp = this.parsePP();
        if (pp !== null && this.isPunct(this.i, ',')) {
          for (let x = pp.start; x < pp.end; x++) this.roles.delete(x);
          this.roleSpan(pp.start, pp.end, 'FRAME');
          main.frame.push(pp.start);
          main.frameItems = [
            ...(main.frameItems ?? []),
            { start: pp.start, end: pp.end, np: pp.np, prep: pp.head },
          ];
          this.i += 1;
          continue;
        }
        if (pp !== null && this.clauseAhead(this.i)) {
          for (let x = pp.start; x < pp.end; x++) this.roles.delete(x);
          this.roleSpan(pp.start, pp.end, 'FRAME');
          main.frame.push(pp.start);
          main.frameItems = [
            ...(main.frameItems ?? []),
            { start: pp.start, end: pp.end, np: pp.np, prep: pp.head },
          ];
          this.find(
            '2.5:G127',
            `a FRAME (${this.w(pp.start)} …) is set off by a comma`,
            [pp.start],
            'warn',
          );
          continue;
        }
        this.i = save;
        for (let x = save; x < this.t.length; x++) this.roles.delete(x);
      }
      // TOPIC: NP hozi, (2.5:G119); or a time or place noun phrase before a comma, a FRAME
      if (this.npStart(k)) {
        const save = this.i;
        const mark = this.findings.length;
        const np = this.parseNP();
        const head = np?.head ?? -1;
        const placeOrTime =
          np !== null &&
          (this.ix.timeNouns.has(this.w(head)) ||
            this.side(head) ||
            ['place'].includes(this.ix.source.flags.noun_class[this.w(head)] ?? '') ||
            (np.de !== null && this.ix.timeNouns.has(this.w(np.de.head ?? -1))));
        if (
          np !== null &&
          placeOrTime &&
          this.isPunct(this.i, ',') &&
          this.clauseAhead(this.i + 1)
        ) {
          for (let x = np.start; x < np.end; x++) this.roles.delete(x);
          this.roleSpan(np.start, np.end, 'FRAME');
          main.frame.push(np.start);
          main.frameItems = [...(main.frameItems ?? []), { start: np.start, end: np.end, np }];
          this.i += 1;
          continue;
        }
        if (np !== null && this.w(this.i) === 'hozi') {
          this.roleSpan(np.start, np.end, 'TOPIC');
          this.role(this.i, 'TOPIC');
          main.topic = np;
          this.i += 1;
          if (this.isPunct(this.i, ',')) this.i += 1;
          continue;
        }
        this.findings.length = mark;
        this.i = save;
        for (let x = save; x < this.t.length; x++) this.roles.delete(x);
      }
      // a scope operator before a clause: yesta si …, doli si … (1.0:G10)
      if (this.is(k, 'scope') && this.startsSubordinate(k + 1)) {
        this.role(k, 'SUBORDINATE');
        this.i += 1;
        const sub = this.parseSubClause('adverbial');
        sub.scope = k;
        main.subordinates.push(sub);
        if (this.isPunct(this.i, ',')) this.i += 1;
        continue;
      }
      // a vocative before a command: Lina, lirala!
      if (this.npStart(k)) {
        const save = this.i;
        const mark = this.findings.length;
        const np = this.parseNP();
        if (
          np !== null &&
          this.isPunct(this.i, ',') &&
          (this.predicateStart(this.i + 1) || this.w(this.i + 1) === 'fisa') &&
          !this.npStart(this.i + 1)
        ) {
          this.roleSpan(np.start, np.end, 'VOCATIVE');
          main.vocative = np;
          this.i += 1;
          continue;
        }
        if (
          np !== null &&
          k === first &&
          this.isPunct(this.i, ',') &&
          np.headKind !== 'pron' &&
          this.clauseAhead(this.i + 1) &&
          this.npStart(this.i + 1)
        ) {
          this.roleSpan(np.start, np.end, 'VOCATIVE');
          main.vocative = np;
          this.find(
            '2.5:G126',
            'a vocative before the clause: 2.5:G126 places the vocative after it',
            [np.start],
            'unruled',
          );
          this.i += 1;
          continue;
        }
        this.findings.length = mark;
        this.i = save;
        for (let x = save; x < this.t.length; x++) this.roles.delete(x);
      }
      // a preposed subordinate clause: Si …, … / Kureli …, …
      if (this.startsSubordinate(k)) {
        const sub = this.parseSubClause('adverbial');
        main.subordinates.push(sub);
        if (this.isPunct(this.i, ',')) this.i += 1;
        continue;
      }
      break;
    }
  }

  /** After the clause: subordinate and coordinate clauses, a vocative, a quotation. */
  private parseAfter(main: Clause): void {
    let apposed = false;
    for (let guard = 0; guard < 24 && this.i < this.t.length; guard++) {
      const k = this.i;
      const w = this.w(k);
      if (this.isPunct(k) && /^[.!?…"”')]+$/.test(w)) {
        this.i += 1;
        continue;
      }
      // a comma
      if (
        this.isPunct(k, ',') ||
        this.isPunct(k, ';') ||
        this.isPunct(k, '—') ||
        this.isPunct(k, '–')
      ) {
        this.role(k, 'PUNCT');
        const n = k + 1;
        // iya + a noun phrase: a vocative, closing the sentence or set off by commas (3.0:G129)
        if (this.is(n, 'vocative')) {
          this.i = n;
          const voc = this.parseIyaVocative();
          if (voc !== null && this.onlyEndPunct()) main.vocative = voc;
          else if (voc !== null) main.address = [...(main.address ?? []), voc];
          continue;
        }
        // a vocative: a noun phrase that ends the sentence (2.5:G126); after an apposition, another one
        if (this.npStart(n)) {
          const save = this.i;
          this.i = n;
          const mark = this.findings.length;
          const np = this.parseNP();
          if (
            np !== null &&
            (this.onlyEndPunct() || (this.isPunct(this.i, ':') && this.onlyEndPunct(this.i + 1)))
          ) {
            if (apposed) this.roleSpan(np.start, np.end, this.roles.get(k - 1)?.role ?? 'OBJECT');
            else {
              main.vocative = np;
              this.roleSpan(np.start, np.end, 'VOCATIVE');
            }
            continue;
          }
          // an apposition: a noun phrase set off by commas renaming the one before it (3.0:G130)
          if (
            np !== null &&
            this.ix.source.rules.apposition !== undefined &&
            this.isPunct(this.i, ',') &&
            (this.nounish(k - 1) || this.w(k - 1) === 'sela') &&
            !this.clauseAhead(n)
          ) {
            this.roleSpan(np.start, np.end, this.roles.get(k - 1)?.role ?? 'OBJECT');
            apposed = true;
            continue;
          }
          this.findings.length = mark;
          this.i = save;
          for (let x = n; x < this.t.length; x++) this.roles.delete(x);
        }
        this.i += 1;
        const n2 = this.i;
        const w2 = this.w(n2);
        // fime after a comma at the end of a clause is not a content clause (2.5:G116)
        if (w2 === 'fime' && main.objectClause === null) {
          this.find(
            '2.5:G116',
            'fime introduces a content clause ("that"); hopeful purpose is kopisa + a clause with nosi',
            [n2],
            'error',
            'kopisa',
          );
        }
        // an attitude word set off by a comma closes the clause: …, zoke ki?
        if (this.isClosing(n2)) {
          main.closingComma = true;
          this.parseClosing(main);
          continue;
        }
        // fisa, an interjection, a discourse particle, a lone ne: set off by commas
        if (
          (this.is(n2, 'interjection') || this.is(n2, 'discourse') || w2 === 'ne') &&
          (this.isPunct(n2 + 1) || n2 + 1 >= this.t.length)
        ) {
          this.role(n2, 'INTERJECTION');
          if (this.onlyEndPunct(n2 + 1)) main.trailing = [...(main.trailing ?? []), n2];
          this.i += 1;
          continue;
        }
        // a semicolon or dash: a new clause, with its own edges (Kipo hozi, …; Dorin hozi, …)
        if (w === ';' || w === '—' || w === '–') {
          this.clauseNo += 1;
          const c = emptyClause('coordinate', this.i, k);
          this.clauses.push(c);
          this.parseEdgesBefore(c, true);
          this.parseClauseCore(c, {});
          main.subordinates.push(c);
          this.clauseNo -= 1;
          continue;
        }
        // a list: another noun phrase after a comma (… doli cono, cono, cono)
        if (main.object !== null && this.npStart(n2) && !this.clauseAhead(n2)) {
          const save2 = this.i;
          const np2 = this.parseNP();
          if (np2 !== null && (this.isPunct(this.i, ',') || this.onlyEndPunct())) {
            this.roleSpan(np2.start, np2.end, 'OBJECT');
            continue;
          }
          this.i = save2;
          for (let x = save2; x < this.t.length; x++) this.roles.delete(x);
        }
        // an adjunct set off by a comma: , gase Dorin / , kroti li merno / , eli-pago
        if (
          !this.startsSubordinate(n2) &&
          !['ata', 'nara', 'oro'].includes(w2) &&
          (this.is(n2, 'prep') ||
            this.is(n2, 'comparison') ||
            this.is(n2, 'timeAdv') ||
            this.is(n2, 'placeAdv') ||
            this.is(n2, 'mannerAdv') ||
            w2 === 'la') &&
          !this.clauseAhead(n2)
        ) {
          const before = this.i;
          const count = main.adjuncts.length;
          this.parseAdjuncts(main);
          const added = main.adjuncts[count];
          if (added !== undefined) main.adjuncts[count] = { ...added, commaBefore: true };
          if (this.i > before) continue;
        }
        // a contrasted constituent after nara / ata / oro with no verb: …, nara molusan / nara Kipo / nara cuara bumreri
        if (
          ['ata', 'nara', 'oro'].includes(w2) &&
          !this.clauseAhead(n2 + 1) &&
          (this.npStart(n2 + 1) || this.adjish(n2 + 1))
        ) {
          this.role(n2, 'LINKER');
          this.i += 1;
          const c = emptyClause('coordinate', this.i, n2);
          const np =
            this.adjish(this.i) && !this.nounish(this.i)
              ? null
              : this.parseNP({ adverbHead: true });
          if (np !== null) {
            this.roleSpan(np.start, np.end, 'OBJECT');
            c.predicate = {
              kind: 'np',
              start: np.start,
              end: np.end,
              degree: null,
              tonsi: null,
              np,
            };
          } else if (!this.parseAdjP(c)) this.i += 1;
          c.end = this.i;
          main.subordinates.push(c);
          continue;
        }
        continue;
      }
      if (this.isPunct(k, ':')) {
        this.role(k, 'PUNCT');
        this.i += 1;
        // a direct quotation after a verb of saying (2.3:G83) is read as its own sentence; ki may follow it
        if (this.isPunct(this.i, '«q»')) {
          this.i += 1;
          this.parseClosing(main);
          continue;
        }
        // otherwise what follows explains what came before: a clause or a noun phrase
        this.clauseNo += 1;
        const c = emptyClause('coordinate', this.i, k);
        this.clauses.push(c);
        this.parseEdgesBefore(c, true);
        this.parseClauseCore(c, {});
        if (c.predKind === 'none' && c.subject !== null)
          this.roleSpan(c.subject.start, c.subject.end, 'OBJECT');
        main.subordinates.push(c);
        this.clauseNo -= 1;
        continue;
      }
      if (this.isClosing(k)) {
        this.parseClosing(main);
        continue;
      }
      if (this.startsSubordinate(k) || w === 'fime' || w === 'ki-oro') {
        const sub = this.parseSubClause(w === 'fime' || w === 'ki-oro' ? 'content' : 'adverbial');
        main.subordinates.push(sub);
        continue;
      }
      if (w === 'ata' || w === 'nara' || w === 'oro' || this.is(k, 'clauseAdv')) {
        this.role(k, 'LINKER');
        this.i += 1;
        if (this.isPunct(this.i, ',')) this.i += 1;
        else if (this.ix.source.rules.edges.clause_adverbs.comma_required.includes(w))
          this.find(
            '2.5:G117',
            `clause-initial ${w} is followed by a comma`,
            [k],
            'error',
            `${w},`,
          );
        this.clauseNo += 1;
        const c = emptyClause('coordinate', this.i, k);
        this.clauses.push(c);
        // a coordinate clause may share the subject: … ata po surusia …
        this.parseClauseCore(c, this.predicateStart(this.i) ? { noSubject: true } : {});
        main.subordinates.push(c);
        this.clauseNo -= 1;
        continue;
      }
      // a new clause with no linker after a complete one
      if (
        this.isWord(k) &&
        (this.npStart(k) || this.predicateStart(k) || this.formulaAt(k)) &&
        this.clauseAhead(k) &&
        (main.predKind !== 'none' || this.isPunct(k - 1))
      ) {
        const prev = this.t[k - 1];
        if (prev?.kind !== 'punct')
          this.find(
            '2.5:G126',
            'a second clause with no linker: join it with ata, nara, a comma or a subordinator',
            [k],
          );
        this.clauseNo += 1;
        const c = emptyClause('coordinate', k, null);
        this.clauses.push(c);
        this.parseClauseCore(c, {});
        main.subordinates.push(c);
        this.clauseNo -= 1;
        continue;
      }
      // an apposition after a comma a relative clause has taken (2.5:G115, 3.0:G130)
      if (
        this.isWord(k) &&
        this.isPunct(k - 1, ',') &&
        this.ix.source.rules.apposition !== undefined &&
        this.npStart(k) &&
        !this.clauseAhead(k)
      ) {
        const save = this.i;
        const mark = this.findings.length;
        const np = this.parseNP();
        if (np !== null && (this.isPunct(this.i, ',') || this.onlyEndPunct())) {
          this.roleSpan(np.start, np.end, this.roles.get(k - 2)?.role ?? 'OBJECT');
          apposed = true;
          continue;
        }
        this.findings.length = mark;
        this.i = save;
        for (let x = save; x < this.t.length; x++) this.roles.delete(x);
      }
      // words with no place in the template: one finding for the run
      if (this.isWord(k)) {
        const run: number[] = [];
        while (
          this.isWord(this.i) &&
          !this.isClosing(this.i) &&
          !(run.length > 0 && this.startsSubordinate(this.i))
        ) {
          run.push(this.i);
          this.role(this.i, 'ADJUNCT');
          this.i += 1;
        }
        const firstR = this.readings(k)[0];
        let msg = `${run.map((x) => this.t[x]?.text ?? '').join(' ')}: no place in the clause template`;
        if (firstR?.pos === 'verb')
          msg += '; a second verb needs a linker (sidu, fime, kopisa, ata …)';
        else if (
          firstR !== undefined &&
          (firstR.pos === 'noun' ||
            firstR.pos === 'adj' ||
            firstR.pos === 'det' ||
            firstR.pos === 'pron')
        )
          msg += ` after the ${main.object !== null ? 'object' : main.predicate !== null ? 'predicate' : 'verb'}: a second noun phrase needs de, a preposition or a linker`;
        this.find('2.5:G126', msg, run);
        continue;
      }
      this.i += 1;
    }
  }
}
