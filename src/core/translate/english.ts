/**
 * English → meaning frame (2.5, ADR-0020). Rule-based and deterministic: the
 * English is read into a MeaningClause (clause type, subject, verb, object,
 * recipient, tense, aspect, modal, negation, adjuncts, the links between
 * clauses). The frame is never Liraasa text; toLiraasa.ts lays it out by the
 * rulings, and the strict checker has the last word.
 *
 * What it cannot read it reports (the `unread` list) instead of guessing.
 */
import type { MeaningAdjunct, MeaningClause, MeaningNP, Tense } from './frame';

export interface EnglishData {
  pronouns: Record<string, { form: string; case: string; inanimate?: string }>;
  determiners: Record<string, string>;
  quantifiers: Record<string, string>;
  degree: Record<string, string>;
  irregular_comparatives: Record<string, [string, string]>;
  prepositions: Record<
    string,
    { word: string; sense: string; ruling?: string; tool?: string; article?: boolean }
  >;
  modals: Record<string, string>;
  frame_words: Record<string, string>;
  attitude: Record<string, string>;
  scope: Record<string, string>;
  reciprocal: Record<string, string>;
  time_adverbs: Record<string, string>;
  place_adverbs: Record<string, string>;
  manner_adverbs: Record<string, string>;
  pronoun_words: Record<string, string>;
  question_words: Record<string, { word: string; role: string }>;
  subordinators: Record<string, { word: string; link: string; own_tense?: boolean }>;
  coordinators: Record<string, string>;
  relativizers: string[];
  interjections: Record<string, string>;
  causatives: Record<string, string>;
  copula: { be: string[]; become: string[] };
  have: string[];
  do: string[];
  state_adjectives: { words: string[] };
  numbers: Record<string, number>;
  ordinals: Record<string, number>;
  fractions: Record<string, [number, number]>;
  negative_number: { words: string[] };
  approximately: { words: string[] };
  irregular_verbs: Record<string, string>;
  irregular_plurals: Record<string, string>;
  not_plural: string[];
  chain_verbs: { words: string[] };
  say_verbs: { words: string[] };
  aliases: {
    verb: Record<string, string>;
    noun: Record<string, string>;
    adj: Record<string, string>;
  };
  phrasal_verbs: Record<string, string>;
  now_cues: { phrases: string[] };
  no_longer: { phrases: string[] };
  always_cues: { phrases: string[] };
  tool_classes: string[];
  operators: {
    tense: { past: string; future: string };
    counterfactual: string;
    negation: string;
    aspect: Record<string, string>;
    approach: Record<string, string>;
    phase: Record<string, string>;
    effort: Record<string, string>;
    iteration: Record<string, string>;
  };
}

/** What the dictionary knows of an English lemma. */
export interface EnglishLexicon {
  isVerb(lemma: string): boolean;
  isNoun(lemma: string): boolean;
  isAdj(lemma: string): boolean;
  isName(word: string): boolean;
}

export interface MeaningSentence {
  english: string;
  clause: MeaningClause;
  end: '.' | '?' | '!';
  /** words the reader could not place: reported, never guessed */
  unread: string[];
}

interface Tok {
  text: string;
  lower: string;
  punct: boolean;
}

const MODALS = ['can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must'];
const ADVERB_OPS: Record<string, string> = {};

const emptyClause = (): MeaningClause => ({
  type: 'statement',
  subject: null,
  verb: null,
  tense: 'present',
  adjuncts: [],
  subordinates: [],
});

/** English tokens, with contractions expanded. */
function tokenize(text: string): Tok[] {
  const s = text
    .replace(/[’‘]/g, "'")
    .replace(/\bcan't\b/gi, 'can not')
    .replace(/\bwon't\b/gi, 'will not')
    .replace(/\bshan't\b/gi, 'shall not')
    .replace(/\blet's\b/gi, 'let us')
    .replace(/n't\b/gi, ' not')
    .replace(/'m\b/gi, ' am')
    .replace(/'re\b/gi, ' are')
    .replace(/'ll\b/gi, ' will')
    .replace(/'ve\b/gi, ' have')
    .replace(/'d\b/gi, ' would');
  const out: Tok[] = [];
  for (const m of s.matchAll(/[A-Za-z]+(?:-[A-Za-z]+)*(?:'s)?|[0-9]+|[.,;:!?…—–()"]/g)) {
    const text = m[0];
    out.push({ text, lower: text.toLowerCase(), punct: !/[A-Za-z0-9]/.test(text) });
  }
  return out;
}

export function createEnglishReader(data: EnglishData, lex: EnglishLexicon) {
  const irregular = data.irregular_verbs;
  const verbLemmas = (w: string): string[] => {
    const out: string[] = [];
    const add = (x: string): void => {
      if (x.length > 1 && !out.includes(x)) out.push(x);
    };
    if (irregular[w] !== undefined) add(irregular[w]);
    add(w);
    if (w.endsWith('ies')) add(`${w.slice(0, -3)}y`);
    if (w.endsWith('es')) add(w.slice(0, -2));
    if (w.endsWith('s')) add(w.slice(0, -1));
    if (w.endsWith('ied')) add(`${w.slice(0, -3)}y`);
    if (w.endsWith('ed')) {
      add(w.slice(0, -2));
      add(w.slice(0, -1));
      if (w.length > 5 && w[w.length - 3] === w[w.length - 4]) add(w.slice(0, -3));
    }
    if (w.endsWith('ing')) {
      add(w.slice(0, -3));
      add(`${w.slice(0, -3)}e`);
      if (w.length > 5 && w[w.length - 4] === w[w.length - 5]) add(w.slice(0, -4));
    }
    return out;
  };
  /** The verb lemma of an English word, if the dictionary has it as a verb. */
  const verbOf = (w: string): string | null => {
    for (const l of verbLemmas(w))
      if (
        lex.isVerb(l) ||
        lex.isVerb(data.aliases.verb[l] ?? '') ||
        ['be', 'have', 'do', 'become'].includes(l) ||
        l in data.causatives
      )
        return l;
    return null;
  };
  const isPastForm = (w: string): boolean =>
    (irregular[w] !== undefined &&
      !w.endsWith('ing') &&
      !['am', 'is', 'are', 'be', 'being', 'has', 'have', 'does', 'do'].includes(w)) ||
    w.endsWith('ed');
  const nounLemma = (w: string): { lemma: string; plural: boolean } | null => {
    const ir = data.irregular_plurals[w];
    if (ir !== undefined && lex.isNoun(ir)) return { lemma: ir, plural: ir !== w };
    if (lex.isNoun(w)) return { lemma: w, plural: false };
    if (!data.not_plural.includes(w)) {
      for (const [end, rep] of [
        ['ies', 'y'],
        ['ves', 'f'],
        ['ves', 'fe'],
        ['es', ''],
        ['s', ''],
      ] as const) {
        if (w.endsWith(end)) {
          const l = w.slice(0, -end.length) + rep;
          if (lex.isNoun(l)) return { lemma: l, plural: true };
        }
      }
    }
    return null;
  };
  const adjLemma = (w: string): { lemma: string; degree?: string } | null => {
    const ir = data.irregular_comparatives[w];
    if (ir !== undefined) return { lemma: ir[0], degree: ir[1] };
    if (lex.isAdj(w)) return { lemma: w };
    for (const [end, deg] of [
      ['est', 'mosa'],
      ['er', 'kasi'],
    ] as const) {
      if (!w.endsWith(end)) continue;
      const stem = w.slice(0, -end.length);
      for (const l of [
        stem,
        `${stem}e`,
        stem.endsWith('i') ? `${stem.slice(0, -1)}y` : '',
        stem.length > 2 && stem.endsWith(stem[stem.length - 2] ?? '#') ? stem.slice(0, -1) : '',
      ]) {
        if (l !== '' && lex.isAdj(l)) return { lemma: l, degree: deg };
      }
    }
    return null;
  };
  /** an -ly adverb → its adjective (gently → gentle) */
  const adverbAdj = (w: string): string | null => {
    if (!w.endsWith('ly') || w.length < 5) return null;
    const stem = w.slice(0, -2);
    for (const l of [
      stem,
      `${stem}e`,
      stem.endsWith('i') ? `${stem.slice(0, -1)}y` : '',
      `${stem}le`,
      w.endsWith('ally') ? w.slice(0, -4) : '',
    ])
      if (l !== '' && lex.isAdj(l)) return l;
    return null;
  };

  function readSentence(english: string): MeaningSentence {
    const toks = tokenize(english);
    const unread: string[] = [];
    let i = 0;
    const lastPunct = [...toks].reverse().find((t) => t.punct && /[.!?]/.test(t.text))?.text ?? '.';
    const end: MeaningSentence['end'] = lastPunct === '?' ? '?' : lastPunct === '!' ? '!' : '.';
    const words = toks.filter((t) => !t.punct);

    const at = (k = i): string => toks[k]?.lower ?? '';
    const raw = (k = i): string => toks[k]?.text ?? '';
    const isPunct = (k = i, p?: string): boolean =>
      toks[k]?.punct === true && (p === undefined || toks[k]?.text === p);
    const done = (k = i): boolean => k >= toks.length || (isPunct(k) && /^[.!?]$/.test(raw(k)));
    /** a multi-word key starting here (longest first) */
    const phrase = (table: Record<string, unknown>, k = i): string | null => {
      for (let n = 4; n >= 1; n--) {
        const words = toks.slice(k, k + n);
        if (words.length < n || words.some((t) => t.punct)) continue;
        const key = words.map((t) => t.lower).join(' ');
        if (key in table) return key;
      }
      return null;
    };
    const skip = (key: string): void => {
      i += key.split(' ').length;
    };

    // --------------------------------------------------------- noun phrase
    function readNP(opts: { object?: boolean; noRelative?: boolean } = {}): MeaningNP | null {
      const start = i;
      const np: MeaningNP = { head: '', kind: 'noun', adjectives: [] };
      const focus = phrase(data.scope);
      if (focus !== null && !['too'].includes(focus)) {
        const save = i;
        skip(focus);
        const inner = readNP(opts);
        if (inner !== null)
          return {
            ...inner,
            focus:
              focus === 'also'
                ? 'also'
                : focus === 'even'
                  ? 'even'
                  : focus === 'only'
                    ? 'only'
                    : 'exactly',
          };
        i = save;
      }
      if (at() === 'not' && !done(i + 1)) {
        const save = i;
        i += 1;
        const inner = readNP(opts);
        if (inner !== null) return { ...inner, negated: true };
        i = save;
      }
      // pronouns
      const w = at();
      const pron = data.pronouns[w];
      if (pron !== undefined && pron.case !== 'owner' && !(w === 'her' && nounStart(i + 1))) {
        i += 1;
        const out: MeaningNP = {
          head: w,
          kind: pron.case === 'reflexive' ? 'reflexive' : 'pronoun',
          adjectives: [],
        };
        if (at() === "'s") i += 1;
        return out;
      }
      const pw = phrase(data.pronoun_words);
      if (
        pw !== null &&
        !nounStart(i + pw.split(' ').length) &&
        !(['this', 'that', 'these', 'those'].includes(pw) && adjLemma(at(i + 1)) !== null)
      ) {
        skip(pw);
        return {
          head: pw,
          kind: ['this', 'that', 'these', 'those'].includes(pw) ? 'demonstrative' : 'pronoun',
          adjectives: [],
        };
      }
      // all the N
      if (w === 'all' && at(i + 1) === 'the') {
        np.quantifier = 'all';
        i += 1;
      }
      // determiners and owners
      const own = data.pronouns[at()];
      if (
        own !== undefined &&
        (own.case === 'owner' || own.case === 'object-or-owner') &&
        nounStart(i + 1)
      ) {
        np.owner = { head: at(), kind: 'pronoun', adjectives: [] };
        i += 1;
      } else if (at() in data.determiners && !(at() === 'that' && !nounStart(i + 1))) {
        np.definite = at() as NonNullable<MeaningNP['definite']>;
        i += 1;
      }
      // a name or noun with 's owns what follows: father's bread
      if (
        np.owner === undefined &&
        np.definite === undefined &&
        raw().endsWith("'s") &&
        nounStart(i + 1)
      ) {
        const ownerWord = raw().replace(/'s$/, '');
        const nl = nounLemma(ownerWord.toLowerCase());
        np.owner =
          lex.isName(ownerWord) || nl === null
            ? { head: ownerWord, kind: 'name', adjectives: [] }
            : { head: nl.lemma, kind: 'noun', adjectives: [] };
        i += 1;
      }
      const q = phrase(data.quantifiers);
      if (q !== null && np.quantifier === undefined && nounStart(i + q.split(' ').length)) {
        np.quantifier = q;
        skip(q);
      }
      // more N (an amount, 2.5:G106)
      if (
        (at() === 'more' || at() === 'less' || at() === 'fewer') &&
        nounLemma(at(i + 1)) !== null &&
        adjLemma(at(i + 1)) === null
      ) {
        np.quantifier = at() === 'more' ? 'more' : 'less';
        i += 1;
      }
      const ord = data.ordinals[at()];
      if (ord !== undefined && nounStart(i + 1)) {
        np.ordinal = ord;
        i += 1;
      }
      if (
        data.negative_number.words.includes(at()) &&
        (data.numbers[at(i + 1)] !== undefined || /^\d+$/.test(at(i + 1)))
      ) {
        np.negativeNumber = true;
        i += 1;
      }
      if (
        data.approximately.words.includes(at()) &&
        (data.numbers[at(i + 1)] !== undefined || /^\d+$/.test(at(i + 1)))
      ) {
        np.approximately = true;
        i += 1;
      }
      const num = data.numbers[at()] ?? (/^\d+$/.test(at()) ? Number(at()) : undefined);
      if (num !== undefined) {
        np.number = num;
        i += 1;
        // a fraction: three quarters
        const fr = data.fractions[at()];
        if (fr !== undefined) {
          i += 1;
          return {
            head: String(fr[1]),
            kind: 'number',
            number: num,
            adjectives: [],
            of: { head: String(fr[1]), kind: 'number', number: fr[1], adjectives: [] },
            partitive: true,
          };
        }
        // one of the two
        if (
          at() === 'of' &&
          (at(i + 1) === 'the' ||
            data.pronouns[at(i + 1)] !== undefined ||
            data.numbers[at(i + 1)] !== undefined)
        ) {
          i += 1;
          const of = readNP();
          return {
            head: String(num),
            kind: 'number',
            number: num,
            adjectives: [],
            ...(of === null ? {} : { of, partitive: true }),
          };
        }
      }
      // adjectives, with their degree words
      for (;;) {
        const k = i;
        let degree: string | undefined;
        if (
          at() in data.degree &&
          ['very', 'more', 'most', 'less', 'least', 'too'].includes(at()) &&
          adjLemma(at(i + 1)) !== null &&
          nounStart(i + 2)
        ) {
          degree = data.degree[at()];
          i += 1;
        }
        const a = adjLemma(at());
        // an adjective, unless it is the noun itself (the last noun-like word)
        if (
          a !== null &&
          (nounStart(i + 1) ||
            (np.definite !== undefined && !nounStart(i + 1) && nounLemma(at()) === null))
        ) {
          if (nounLemma(at()) !== null && !nounStart(i + 1)) break;
          np.adjectives.push({
            lemma: a.lemma,
            ...((degree ?? a.degree) ? { degree: degree ?? a.degree ?? '' } : {}),
          });
          i += 1;
          continue;
        }
        i = k;
        break;
      }
      // the noun
      const nw = at();
      const n = nounLemma(nw);
      if (n !== null) {
        np.head = n.lemma;
        np.plural = n.plural;
        i += 1;
        // a noun before a noun: the first describes the second
        const n2 = nounLemma(at());
        if (
          n2 !== null &&
          !done() &&
          !isPunct() &&
          verbOf(at()) === null &&
          !(at() in data.prepositions) &&
          data.pronouns[at()] === undefined
        ) {
          np.adjectives.push({ lemma: n.lemma });
          np.head = n2.lemma;
          np.plural = n2.plural;
          i += 1;
        }
      } else if (
        np.adjectives.length > 0 &&
        (np.definite !== undefined || np.quantifier !== undefined)
      ) {
        // the brave (an adjective standing as a noun)
        const last = np.adjectives.pop();
        np.head = last?.lemma ?? '';
        np.kind = 'adjective';
      } else if (np.number !== undefined) {
        np.head = String(np.number);
        np.kind = 'number';
      } else if (
        raw() !== '' &&
        /^[A-Z]/.test(raw()) &&
        !isPunct() &&
        (i !== 0 || lex.isName(raw()))
      ) {
        np.head = raw().replace(/'s$/, '');
        np.kind = 'name';
        i += 1;
      } else if (
        np.definite === 'this' ||
        np.definite === 'that' ||
        np.definite === 'these' ||
        np.definite === 'those'
      ) {
        np.head = np.definite;
        np.kind = 'demonstrative';
        delete np.definite;
      } else {
        i = start;
        return null;
      }
      // of + noun phrase: the X of Y
      if (at() === 'of' && nounStart(i + 1)) {
        i += 1;
        const of = readNP();
        if (of !== null) np.of = of;
      }
      // a relative clause
      if (data.relativizers.includes(at()) && !done(i + 1) && np.kind !== 'pronoun') {
        const rel = readRelative();
        if (rel !== null) np.relative = rel;
      } else if (
        opts.noRelative !== true &&
        np.kind === 'noun' &&
        data.pronouns[at()]?.case === 'subject' &&
        verbOf(at(i + 1)) !== null
      ) {
        // the song I love: a relative with no relativizer
        const rel = readClauseBody({ gapObject: true });
        np.relative = { ...rel, link: 'relative' };
      }
      // and / or + a second noun phrase, when no clause follows
      if ((at() === 'and' || at() === 'or') && nounStart(i + 1)) {
        const save = i;
        const link = at() as 'and' | 'or';
        i += 1;
        const second = readNP(opts);
        if (second !== null && !verbGroupAhead()) np.and = { linker: link, np: second };
        else i = save;
      }
      return np;
    }

    function nounStart(k: number): boolean {
      const w = toks[k]?.lower ?? '';
      if (toks[k] === undefined || toks[k]?.punct) return false;
      if (
        w in data.determiners ||
        data.pronouns[w] !== undefined ||
        w in data.quantifiers ||
        w in data.pronoun_words
      )
        return true;
      if (
        data.approximately.words.includes(w) &&
        (data.numbers[toks[k + 1]?.lower ?? ''] !== undefined ||
          /^\d+$/.test(toks[k + 1]?.lower ?? ''))
      )
        return true;
      if (
        data.negative_number.words.includes(w) &&
        data.numbers[toks[k + 1]?.lower ?? ''] !== undefined
      )
        return true;
      if (data.numbers[w] !== undefined || /^\d+$/.test(w) || data.ordinals[w] !== undefined)
        return true;
      if (nounLemma(w) !== null) return true;
      if (adjLemma(w) !== null && nounLemma(toks[k + 1]?.lower ?? '') !== null) return true;
      if (/^[A-Z]/.test(toks[k]?.text ?? '') && k > 0) return true;
      return false;
    }

    function verbGroupAhead(k = i): boolean {
      const w = toks[k]?.lower ?? '';
      return (
        MODALS.includes(w) ||
        data.copula.be.includes(w) ||
        data.have.includes(w) ||
        data.do.includes(w) ||
        (verbOf(w) !== null && nounLemma(w) === null) ||
        w === 'not'
      );
    }

    // ---------------------------------------------------------- the verb
    interface VG {
      lemma: string | null;
      tense: Tense;
      aspect?: MeaningClause['aspect'];
      modal?: MeaningClause['modal'];
      counterfactual?: boolean;
      negated?: boolean;
      passive?: boolean;
      phase?: MeaningClause['phase'];
      effort?: MeaningClause['effort'];
      approach?: MeaningClause['approach'];
      iteration?: MeaningClause['iteration'];
      be?: boolean;
      have?: boolean;
      become?: boolean;
      timeAdverb?: string;
    }
    function readVerbGroup(inverted?: { aux: string }): VG | null {
      const vg: VG = { lemma: null, tense: 'present' };
      // what the verb group has seen (an object, so the closure below can set it)
      const saw = { be: false, have: false, do: false };
      const aux = inverted?.aux;
      const noteAux = (w: string): void => {
        if (w === 'will' || w === 'shall') vg.tense = 'future';
        else if (MODALS.includes(w)) {
          const m = data.modals[w];
          vg.modal =
            w === 'could' || w === 'can'
              ? 'can'
              : w === 'might'
                ? 'might'
                : w === 'may'
                  ? 'may'
                  : w === 'must'
                    ? 'must'
                    : w === 'should'
                      ? 'should'
                      : w === 'would'
                        ? 'would'
                        : undefined;
          void m;
        } else if (data.do.includes(w)) {
          saw.do = true;
          if (w === 'did') vg.tense = 'past';
        } else if (data.copula.be.includes(w)) {
          saw.be = true;
          if (w === 'was' || w === 'were') vg.tense = 'past';
        } else if (data.have.includes(w)) {
          saw.have = true;
          if (w === 'had') vg.tense = 'past';
        }
      };
      if (aux !== undefined) noteAux(aux);
      const start = i;
      for (let guard = 0; guard < 12; guard++) {
        const w = at();
        if (done() || isPunct()) break;
        if (w === 'not' || w === 'never') {
          vg.negated = true;
          if (w === 'never') vg.timeAdverb = 'never';
          i += 1;
          continue;
        }
        if (
          [
            'always',
            'often',
            'sometimes',
            'rarely',
            'seldom',
            'usually',
            'just',
            'really',
            'also',
          ].includes(w) &&
          verbGroupAhead(i + 1)
        ) {
          if (['always', 'often', 'sometimes', 'rarely', 'seldom'].includes(w)) vg.timeAdverb = w;
          i += 1;
          continue;
        }
        if (w === 'still' || w === 'again' || w === 'already') {
          vg.iteration = w;
          i += 1;
          continue;
        }
        if ((w === 'almost' || w === 'nearly') && verbGroupAhead(i + 1)) {
          vg.approach = 'almost';
          i += 1;
          continue;
        }
        if (w === 'about' && at(i + 1) === 'to') {
          vg.approach = 'about to';
          i += 2;
          continue;
        }
        if (
          w === 'going' &&
          at(i + 1) === 'to' &&
          (saw.be || vg.tense !== 'present' || i > start)
        ) {
          vg.tense = vg.tense === 'past' ? 'past' : 'future';
          saw.be = false;
          i += 2;
          continue;
        }
        if (w === 'used' && at(i + 1) === 'to') {
          vg.tense = 'past';
          vg.aspect = 'habitual';
          i += 2;
          continue;
        }
        if ((w === 'have' || w === 'has' || w === 'had') && at(i + 1) === 'to') {
          vg.modal = 'must';
          if (w === 'had') vg.tense = 'past';
          i += 2;
          continue;
        }
        if ((w === 'able' || w === 'allowed') && at(i + 1) === 'to' && saw.be) {
          vg.modal = w === 'able' ? 'can' : 'may';
          saw.be = false;
          i += 2;
          continue;
        }
        if (['try', 'tries', 'tried', 'trying'].includes(w) && at(i + 1) === 'to') {
          vg.effort = 'try';
          if (w === 'tried') vg.tense = 'past';
          i += 2;
          continue;
        }
        if (['manage', 'manages', 'managed'].includes(w) && at(i + 1) === 'to') {
          vg.effort = 'manage';
          if (w === 'managed') vg.tense = 'past';
          i += 2;
          continue;
        }
        if (['fail', 'fails', 'failed'].includes(w) && at(i + 1) === 'to') {
          vg.effort = 'fail';
          if (w === 'failed') vg.tense = 'past';
          i += 2;
          continue;
        }
        if (
          ['begin', 'begins', 'began', 'start', 'starts', 'started'].includes(w) &&
          (at(i + 1) === 'to' || at(i + 1).endsWith('ing'))
        ) {
          vg.phase = 'begin';
          if (w === 'began' || w === 'started') vg.tense = 'past';
          i += at(i + 1) === 'to' ? 2 : 1;
          continue;
        }
        if (
          ['stop', 'stops', 'stopped', 'cease', 'ceased'].includes(w) &&
          at(i + 1).endsWith('ing')
        ) {
          vg.phase = 'stop';
          if (w.endsWith('ed')) vg.tense = 'past';
          i += 1;
          continue;
        }
        if (['keep', 'keeps', 'kept'].includes(w) && at(i + 1).endsWith('ing')) {
          vg.iteration = 'still';
          if (w === 'kept') vg.tense = 'past';
          i += 1;
          continue;
        }
        if (['hope', 'hopes', 'hoped'].includes(w) && at(i + 1) === 'to') {
          vg.modal = 'hope';
          if (w === 'hoped') vg.tense = 'past';
          i += 2;
          continue;
        }
        if (
          MODALS.includes(w) ||
          data.do.includes(w) ||
          data.copula.be.includes(w) ||
          data.have.includes(w)
        ) {
          // have/be/do as the main verb: decided below by what follows
          const next = at(i + 1);
          const nextIsVerbish =
            MODALS.includes(next) ||
            data.copula.be.includes(next) ||
            data.have.includes(next) ||
            next === 'not' ||
            next === 'never' ||
            (verbOf(next) !== null &&
              (/(ed|en|ing)$/.test(next) ||
                irregular[next] !== undefined ||
                data.do.includes(w) ||
                MODALS.includes(w)));
          if (
            MODALS.includes(w) ||
            data.do.includes(w) ||
            nextIsVerbish ||
            [
              'always',
              'still',
              'already',
              'just',
              'really',
              'often',
              'again',
              'almost',
              'nearly',
              'going',
              'able',
              'allowed',
              'used',
              'about',
            ].includes(next)
          ) {
            // would have + participle: counterfactual (2.5:G114); could / should have likewise (1.0:G6)
            if (
              data.have.includes(w) &&
              (vg.modal === 'would' ||
                vg.modal === 'can' ||
                vg.modal === 'should' ||
                vg.modal === 'must' ||
                vg.modal === 'might')
            ) {
              vg.counterfactual = true;
              vg.tense = 'past';
              i += 1;
              continue;
            }
            if (
              data.have.includes(w) &&
              vg.modal === undefined &&
              verbOf(next) !== null &&
              (/(ed|en)$/.test(next) || irregular[next] !== undefined || next === 'been')
            ) {
              // the perfect: completed (tefa), past when had
              vg.aspect = 'completed';
              if (w === 'had') vg.tense = 'past';
              saw.have = true;
              i += 1;
              continue;
            }
            noteAux(w);
            i += 1;
            continue;
          }
        }
        // the main verb
        const lemma = verbOf(w);
        if (lemma !== null) {
          if (lemma === 'be') {
            saw.be = true;
            if (w === 'was' || w === 'were') vg.tense = 'past';
            i += 1;
            continue;
          }
          if (lemma === 'have' && vg.lemma === null) {
            saw.have = true;
            if (w === 'had') vg.tense = 'past';
            i += 1;
            // have + object: possession; have + participle handled above
            vg.lemma = 'have';
            vg.have = true;
            break;
          }
          if (lemma === 'do' && vg.lemma === null && saw.do) {
            vg.lemma = 'do';
            i += 1;
            break;
          }
          if (data.copula.become.includes(w)) {
            vg.become = true;
            if (w === 'became') vg.tense = 'past';
            i += 1;
            break;
          }
          if (saw.be && adjLemma(w) !== null && at(i + 1) !== 'by' && !w.endsWith('ing')) {
            vg.be = true;
            break;
          }
          // a phrasal verb: come back → return
          const ph = data.phrasal_verbs[`${lemma} ${at(i + 1)}`];
          if (ph !== undefined && lex.isVerb(ph)) {
            vg.lemma = ph;
            if (
              !saw.do &&
              !saw.have &&
              vg.modal === undefined &&
              vg.tense === 'present' &&
              isPastForm(w)
            )
              vg.tense = 'past';
            i += 2;
            break;
          }
          vg.lemma = lemma;
          if (saw.be && w.endsWith('ing')) vg.aspect = 'progressive';
          else if (saw.be && (/(ed|en)$/.test(w) || irregular[w] !== undefined)) vg.passive = true;
          else if (
            !saw.do &&
            !saw.have &&
            vg.modal === undefined &&
            vg.tense === 'present' &&
            isPastForm(w)
          )
            vg.tense = 'past';
          i += 1;
          break;
        }
        break;
      }
      if (vg.lemma === null && !vg.become && !vg.have) {
        if (saw.be) vg.be = true;
        else if (saw.have) {
          vg.lemma = 'have';
          vg.have = true;
        } else if (i === start && aux === undefined) return null;
      }
      void ADVERB_OPS;
      return vg;
    }

    // ------------------------------------------------------- adjuncts
    function readAdjunct(): MeaningAdjunct | null {
      const w = at();
      if (done() || isPunct()) return null;
      const tw = phrase(data.time_adverbs);
      if (tw !== null && !(tw === 'then' && at(i + 1) === ',')) {
        skip(tw);
        return { role: 'time', word: tw };
      }
      const pw = phrase(data.place_adverbs);
      if (pw !== null) {
        skip(pw);
        return { role: 'place', word: pw };
      }
      const rec =
        phrase(data.reciprocal) ??
        (w === 'to' || w === 'with'
          ? phrase(data.reciprocal, i + 1) === null
            ? null
            : `${w} ${phrase(data.reciprocal, i + 1) ?? ''}`
          : null);
      if (rec !== null) {
        skip(rec);
        return { role: 'manner', word: rec.replace(/^(to|with) /, '') };
      }
      // N ago (2.5:G108), in N days (2.1:G55)
      const save = i;
      if (data.numbers[w] !== undefined || /^\d+$/.test(w)) {
        const np = readNP();
        if (np !== null && at() === 'ago') {
          i += 1;
          return { role: 'ago', np };
        }
        if (np !== null) {
          i = save;
        } else i = save;
      }
      // a manner adverb: gently → la molusan (2.5:G105); more gently than
      if (w === 'more' || w === 'less') {
        const a = adverbAdj(at(i + 1));
        if (a !== null) {
          i += 2;
          const adj: MeaningAdjunct = {
            role: 'manner',
            word: a,
            degree: w === 'more' ? 'kasi' : 'menu',
          };
          if (at() === 'than') {
            i += 1;
            const np = readNP({ object: true });
            if (np !== null) adj.np = np;
          }
          return adj;
        }
      }
      if (w === 'very' || w === 'so' || w === 'too') {
        const a = adverbAdj(at(i + 1));
        if (a !== null) {
          i += 2;
          return { role: 'manner', word: a, degree: data.degree[w] ?? 'ruli' };
        }
      }
      const adv = adverbAdj(w);
      if (adv !== null) {
        i += 1;
        return { role: 'manner', word: adv };
      }
      // than NP, like NP
      if (w === 'than') {
        i += 1;
        const np = readNP({ object: true });
        return np === null ? null : { role: 'comparison', np };
      }
      if (w === 'like' && nounStart(i + 1)) {
        i += 1;
        const np = readNP({ object: true });
        return np === null ? null : { role: 'simile', np };
      }
      // a preposition + a noun phrase
      const prep = phrase(data.prepositions);
      if (prep !== null && prep !== 'of') {
        skip(prep);
        // a stranded preposition (the place I came from): the relative keeps it, with ito in place (2.5:G120)
        if (done() || isPunct())
          return { role: 'place', word: prep, np: { head: 'it', kind: 'pronoun', adjectives: [] } };
        // in + N days: from now (2.1:G55)
        if (prep === 'in' && (data.numbers[at()] !== undefined || /^\d+$/.test(at()))) {
          const np = readNP();
          if (np !== null) return { role: 'time', word: 'in', np };
        }
        // for + a measure of time: a duration (not ruled yet, I-17)
        if (prep === 'for' && (data.numbers[at()] !== undefined || /^\d+$/.test(at()))) {
          const np = readNP();
          if (np !== null) return { role: 'duration', word: 'for', np };
        }
        const pt = phrase(data.place_adverbs);
        if (pt !== null) {
          skip(pt);
          return { role: 'place', word: prep, np: { head: pt, kind: 'pronoun', adjectives: [] } };
        }
        const np = readNP({ object: true });
        if (np === null) {
          i = save;
          return null;
        }
        const sense = data.prepositions[prep]?.sense ?? '';
        const role: MeaningAdjunct['role'] =
          prep === 'with'
            ? 'companion'
            : prep === 'using' || prep === 'by means of'
              ? 'means'
              : prep === 'to' || prep === 'toward' || prep === 'towards'
                ? 'goal'
                : prep === 'from'
                  ? 'source'
                  : prep === 'for'
                    ? 'beneficiary'
                    : sense.includes('about')
                      ? 'comparison'
                      : 'place';
        return { role, word: prep, np };
      }
      return null;
    }

    // -------------------------------------------------------- clauses
    function readRelative(): MeaningClause | null {
      const rel = at();
      i += 1;
      if (rel === 'whose') {
        // the singer whose song I love: a possessor relative (2.5:G120)
        const owned = readNP({ noRelative: true });
        const body = readClauseBody({ gapObject: true });
        if (owned !== null) body.object = owned;
        return { ...body, link: 'relative', question: { word: 'whose', role: 'owner' } };
      }
      if (rel === 'where' || rel === 'when') {
        const body = readClauseBody({});
        return {
          ...body,
          link: 'relative',
          question: { word: rel, role: rel === 'where' ? 'place' : 'time' },
        };
      }
      // who / which / that: the gap is the subject when a verb follows, else the object
      const subjectGap = verbGroupAhead();
      const body = readClauseBody(subjectGap ? { gapSubject: true } : { gapObject: true });
      return { ...body, link: 'relative' };
    }

    function readClauseBody(opts: {
      gapSubject?: boolean;
      gapObject?: boolean;
      noSubject?: boolean;
      inverted?: string;
    }): MeaningClause {
      const c = emptyClause();
      const lead = phrase(data.attitude);
      if (lead !== null && nounStart(i + lead.split(' ').length)) {
        c.attitude =
          data.attitude[lead] === 'seye'
            ? 'certainly'
            : data.attitude[lead] === 'mufe'
              ? 'probably'
              : 'perhaps';
        skip(lead);
      }
      // there is / there are
      if (at() === 'there' && data.copula.be.includes(at(i + 1))) {
        i += 1;
        const vg0 = readVerbGroup();
        c.verb = { lemma: 'be', kind: 'exist' };
        c.tense = vg0?.tense ?? 'present';
        if (vg0?.negated === true) c.negated = true;
        const np = readNP();
        if (np !== null) c.object = np;
        for (let guard = 0; guard < 6 && !done() && !isPunct(); guard++) {
          const a = readAdjunct();
          if (a === null) break;
          c.adjuncts.push(a);
        }
        return c;
      }
      // a wh-word or an inverted auxiliary (questions)
      if (!opts.gapSubject && !opts.noSubject) {
        const subj = readNP();
        if (subj !== null) c.subject = subj;
      }
      const vg = readVerbGroup(opts.inverted === undefined ? undefined : { aux: opts.inverted });
      if (vg === null) {
        return c;
      }
      c.tense = vg.tense;
      if (vg.aspect !== undefined) c.aspect = vg.aspect;
      if (vg.modal !== undefined) c.modal = vg.modal;
      if (vg.counterfactual === true) c.counterfactual = true;
      if (vg.negated === true) c.negated = true;
      if (vg.phase !== undefined) c.phase = vg.phase;
      if (vg.effort !== undefined) c.effort = vg.effort;
      if (vg.approach !== undefined) c.approach = vg.approach;
      if (vg.iteration !== undefined) c.iteration = vg.iteration;
      if (vg.timeAdverb !== undefined && vg.timeAdverb !== 'never')
        c.adjuncts.push({ role: 'time', word: vg.timeAdverb });
      if (vg.timeAdverb === 'never') {
        c.negated = false;
        c.adjuncts.push({ role: 'time', word: 'never' });
      }
      if (vg.be === true || vg.become === true) {
        c.verb = {
          lemma: vg.become === true ? 'become' : 'be',
          kind: vg.become === true ? 'become' : 'be',
        };
        // there is / there are: existence
        if (
          c.subject?.head === 'there' ||
          (c.subject === null && at() === 'there') ||
          c.subject?.head === 'ola-pago'
        ) {
          c.verb = { lemma: 'be', kind: 'exist' };
          c.subject = null;
          const np = readNP();
          if (np !== null) c.object = np;
        } else readComplement(c);
      } else if (vg.lemma !== null) {
        c.verb = { lemma: vg.lemma, kind: vg.lemma === 'have' ? 'have' : 'action' };
        if (vg.passive === true) {
          c.passive = {};
        }
        readObjects(c, opts);
      }
      // adjuncts
      for (let guard = 0; guard < 10; guard++) {
        if (done() || isPunct()) break;
        if (
          (at() === 'again' || at() === 'still' || at() === 'already') &&
          c.iteration === undefined
        ) {
          c.iteration = at() as 'again' | 'still' | 'already';
          i += 1;
          continue;
        }
        const cue = [...data.now_cues.phrases, ...data.always_cues.phrases].find(
          (ph) =>
            toks
              .slice(i, i + ph.split(' ').length)
              .map((t) => t.lower)
              .join(' ') === ph,
        );
        if (cue !== undefined) {
          c.lasting = data.always_cues.phrases.includes(cue);
          i += cue.split(' ').length;
          continue;
        }
        if (c.passive !== undefined && at() === 'by') {
          i += 1;
          const ag = readNP({ object: true });
          if (ag !== null) c.passive = { agent: ag };
          continue;
        }
        const att = phrase(data.attitude);
        if (
          att !== null &&
          (done(i + att.split(' ').length) || isPunct(i + att.split(' ').length))
        ) {
          c.attitude =
            data.attitude[att] === 'seye'
              ? 'certainly'
              : data.attitude[att] === 'mufe'
                ? 'probably'
                : 'perhaps';
          skip(att);
          continue;
        }
        const a = readAdjunct();
        if (a === null) break;
        c.adjuncts.push(a);
      }
      return c;
    }

    function readComplement(c: MeaningClause): void {
      if (done() || isPunct()) return;
      // so ADJ that …; more ADJ than; as ADJ as; ADJ to VERB; ADJer than
      let degree: string | undefined;
      if (
        ['very', 'more', 'most', 'less', 'least', 'too', 'so', 'as'].includes(at()) &&
        adjLemma(at(i + 1)) !== null
      ) {
        degree = at();
        i += 1;
      }
      const a = adjLemma(at());
      if (a !== null && !(nounStart(i + 1) && nounLemma(at(i + 1)) !== null)) {
        i += 1;
        const comp: {
          kind: 'adjective';
          lemma: string;
          degree?: string;
          than?: MeaningNP;
          as?: MeaningNP;
        } = { kind: 'adjective', lemma: a.lemma };
        const d = degree ?? a.degree;
        if (d !== undefined) comp.degree = d;
        if (at() === 'than') {
          i += 1;
          const np = readNP({ object: true });
          if (np !== null) comp.than = np;
        }
        if (degree === 'as' && at() === 'as') {
          i += 1;
          const np = readNP({ object: true });
          if (np !== null) comp.as = np;
        }
        c.complement = comp;
        // ADJ to VERB: easy to resist (2.5:G111)
        if (at() === 'to' && verbOf(at(i + 1)) !== null) {
          i += 1;
          const chain = emptyClause();
          const v = verbOf(at()) ?? at();
          i += 1;
          chain.verb = { lemma: v, kind: 'action' };
          chain.link = 'purpose';
          c.chain = chain;
        }
        // so ADJ that CLAUSE: the result (2.2:G62)
        if (degree === 'so' && at() === 'that') {
          i += 1;
          const res = readClauseBody({});
          c.subordinates.push({ ...res, link: 'that' });
        }
        return;
      }
      const pt = phrase(data.place_adverbs);
      if (pt !== null) {
        skip(pt);
        c.complement = { kind: 'place', adjunct: { role: 'place', word: pt } };
        return;
      }
      const prep = phrase(data.prepositions);
      if (prep !== null) {
        const ad = readAdjunct();
        if (ad !== null) {
          c.complement = { kind: 'place', adjunct: ad };
          return;
        }
      }
      const np = readNP({ object: true });
      if (np !== null) c.complement = { kind: 'np', np };
    }

    function readObjects(c: MeaningClause, opts: { gapObject?: boolean }): void {
      const lemma = c.verb?.lemma ?? '';
      // make / let / prevent + ACTOR + VERB (2.5:G109)
      const caus = data.causatives[lemma];
      if (caus !== undefined && nounStart(i)) {
        const save = i;
        const actor = readNP({ object: true });
        if (at() === 'from' && at(i + 1).endsWith('ing')) i += 1;
        const inner = actor === null ? null : verbOf(at());
        if (actor !== null && inner !== null) {
          const kind = caus === 'vaku' ? 'make' : caus === 'lesvu' ? 'let' : 'prevent';
          c.causative = { kind, actor };
          c.verb = { lemma: inner, kind: 'action' };
          i += 1;
          const obj = nounStart(i) ? readNP({ object: true }) : null;
          if (obj !== null) c.object = obj;
          return;
        }
        i = save;
      }
      // that + clause, whether + clause, a wh-word + clause: an object clause
      if (
        at() === 'that' &&
        (!nounStart(i + 1) ||
          data.pronouns[at(i + 1)] !== undefined ||
          verbGroupAheadAfterNP(i + 1))
      ) {
        i += 1;
        c.objectClause = { ...readClauseBody({}), link: 'that' };
        return;
      }
      if (at() === 'whether' || (at() === 'if' && data.say_verbs.words.includes(lemma))) {
        i += 1;
        c.objectClause = { ...readClauseBody({}), link: 'whether' };
        return;
      }
      // what you love, after a verb that does not ask: a headless relative, raho (2.2:G64)
      if (
        at() === 'what' &&
        !data.say_verbs.words.includes(lemma) &&
        !opts.gapObject &&
        !done(i + 1) &&
        nounStart(i + 1)
      ) {
        i += 1;
        c.objectClause = { ...readClauseBody({ gapObject: true }), link: 'relative' };
        return;
      }
      const qw = phrase(data.question_words);
      if (qw !== null && data.say_verbs.words.includes(lemma) && !opts.gapObject) {
        skip(qw);
        if (done() || isPunct()) {
          // I asked why: an embedded question with its clause understood
          c.objectClause = {
            ...emptyClause(),
            link: 'question',
            question: { word: qw, role: data.question_words[qw]?.role ?? '' },
          };
          return;
        }
        const body = readClauseBody({
          gapSubject: (qw === 'who' || qw === 'what') && verbGroupAhead(),
        });
        c.objectClause = {
          ...body,
          link: 'question',
          question: { word: qw, role: data.question_words[qw]?.role ?? '' },
        };
        return;
      }
      // each other: the reciprocal, not an object
      const recip = phrase(data.reciprocal);
      if (recip !== null) {
        skip(recip);
        c.adjuncts.push({ role: 'manner', word: recip });
        return;
      }
      // the object (a pronoun recipient may come first: give me the book)
      const approx =
        data.approximately.words.includes(at()) &&
        (data.numbers[at(i + 1)] !== undefined || /^\d+$/.test(at(i + 1)));
      if (
        !opts.gapObject &&
        nounStart(i) &&
        (approx || !(at() in data.prepositions && !(data.pronouns[at()] !== undefined)))
      ) {
        const first = readNP({ object: true });
        if (first !== null) {
          if (nounStart(i) && first.kind === 'pronoun' && !done()) {
            const second = readNP({ object: true });
            if (second !== null) {
              c.recipient = first;
              c.object = second;
            } else c.object = first;
          } else c.object = first;
        }
      }
      // N days ago: not an object (2.5:G108)
      if (c.object !== undefined && at() === 'ago') {
        i += 1;
        c.adjuncts.push({ role: 'ago', np: c.object });
        delete c.object;
      }
      // I asked my colleague why: an embedded question after the object (2.3:G77)
      const qw2 = phrase(data.question_words);
      if (
        qw2 !== null &&
        data.say_verbs.words.includes(lemma) &&
        (done(i + qw2.split(' ').length) || isPunct(i + qw2.split(' ').length))
      ) {
        skip(qw2);
        c.objectClause = {
          ...emptyClause(),
          link: 'question',
          question: { word: qw2, role: data.question_words[qw2]?.role ?? '' },
        };
        return;
      }
      // want you to stay: a different subject (2.1:G50); want to sing: a chain (0.8:G6)
      if (at() === 'to' && verbOf(at(i + 1)) !== null) {
        i += 1;
        const body = readClauseBody({ noSubject: true });
        if (c.object !== undefined && data.chain_verbs.words.includes(lemma)) {
          c.objectClause = { ...body, subject: c.object, link: 'that' };
          delete c.object;
        } else if (data.chain_verbs.words.includes(lemma) && c.object === undefined) {
          c.chain = body;
        } else {
          c.subordinates.push({ ...body, link: 'purpose' });
        }
      }
      // give X to Y: the recipient after the theme
      if (
        c.object !== undefined &&
        at() === 'to' &&
        nounStart(i + 1) &&
        c.recipient === undefined
      ) {
        i += 1;
        const r = readNP({ object: true });
        if (r !== null) c.recipient = r;
      }
    }

    /** One sentence: the edges before the clause, the clause, what follows it. */
    function readTop(): MeaningClause {
      const c = emptyClause();
      const before: MeaningClause[] = [];
      const front: MeaningAdjunct[] = [];
      let type: MeaningClause['type'] = end === '?' ? 'question' : 'statement';
      let please = false;
      // interjections, therefore, perhaps, frame words, fronted time / place, topics, preposed clauses
      for (let guard = 0; guard < 8; guard++) {
        const w = at();
        if (w === 'please') {
          please = true;
          i += 1;
          if (isPunct(i, ',')) i += 1;
          continue;
        }
        if (w === 'as' && at(i + 1) === 'for') {
          i += 2;
          const t = readNP();
          if (t !== null) c.topic = t;
          if (isPunct(i, ',')) i += 1;
          continue;
        }
        if (w === 'therefore' || w === 'nevertheless') {
          c.link = 'therefore';
          i += isPunct(i + 1, ',') ? 2 : 1;
          continue;
        }
        // a lone linker as a fragment question: And?
        if ((w === 'and' || w === 'but' || w === 'or' || w === 'so') && done(i + 1)) {
          c.link = w === 'so' ? 'therefore' : w;
          i += 1;
          continue;
        }
        const att = phrase(data.attitude);
        if (
          att !== null &&
          (isPunct(i + att.split(' ').length, ',') || nounStart(i + att.split(' ').length))
        ) {
          c.attitude =
            data.attitude[att] === 'seye'
              ? 'certainly'
              : data.attitude[att] === 'mufe'
                ? 'probably'
                : 'perhaps';
          skip(att);
          if (isPunct(i, ',')) i += 1;
          continue;
        }
        const fw = phrase(data.frame_words);
        if (fw !== null) {
          front.push({ role: 'time', word: fw, fronted: true });
          skip(fw);
          if (isPunct(i, ',')) i += 1;
          continue;
        }
        const sub = phrase(data.subordinators);
        if (
          sub !== null &&
          sub !== 'that' &&
          sub !== 'whether' &&
          !(sub === 'when' && end === '?') &&
          !(['before', 'after', 'until'].includes(sub) && !verbGroupAheadAfterNP(i + 1))
        ) {
          skip(sub);
          const body = readClauseBody({});
          before.push({
            ...body,
            link: (data.subordinators[sub]?.link ?? 'condition') as NonNullable<
              MeaningClause['link']
            >,
          });
          if (isPunct(i, ',')) i += 1;
          continue;
        }
        // a fronted time or place adverbial, or a prepositional phrase before a comma
        const tw = phrase(data.time_adverbs) ?? phrase(data.place_adverbs);
        if (tw !== null && !(tw === 'there' && data.copula.be.includes(at(i + 1)))) {
          const a = readAdjunct();
          if (a !== null) {
            front.push({ ...a, fronted: true });
            if (isPunct(i, ',')) i += 1;
            continue;
          }
        }
        if (phrase(data.prepositions) !== null && end !== '?') {
          const save = i;
          const a = readAdjunct();
          if (a !== null && isPunct(i, ',')) {
            front.push({ ...a, fronted: true });
            i += 1;
            continue;
          }
          i = save;
        }
        break;
      }
      // a vocative before a command: Lina, sing!
      if (/^[A-Z]/.test(raw()) && isPunct(i + 1, ',') && verbOf(at(i + 2)) !== null) {
        c.vocative = { head: raw(), kind: 'name', adjectives: [] };
        i += 2;
      }

      // commands and hortatives
      const imperative =
        (at() === 'let' && at(i + 1) === 'us') ||
        (at() === 'do' && at(i + 1) === 'not' && verbOf(at(i + 2)) !== null) ||
        (at() === 'never' && verbOf(at(i + 1)) !== null) ||
        (verbOf(at()) !== null &&
          nounLemma(at()) === null &&
          data.pronouns[at()] === undefined &&
          !(at() in data.determiners) &&
          !MODALS.includes(at()) &&
          !data.do.includes(at()) &&
          !data.copula.be.includes(at()) &&
          end !== '?') ||
        (verbOf(at()) !== null &&
          (end === '!' || please) &&
          i === 0 &&
          !/^[A-Z]/.test(raw(i + 1))) ||
        (verbOf(at()) !== null &&
          i === 0 &&
          data.pronouns[at(i + 1)] !== undefined &&
          data.pronouns[at(i + 1)]?.case !== 'subject' &&
          !verbGroupAhead(i + 1)) ||
        (verbOf(at()) !== null &&
          i === 0 &&
          at(i + 1) in data.determiners &&
          !data.copula.be.includes(at()));
      let main: MeaningClause;
      if (imperative && end !== '?') {
        if (at() === 'let' && at(i + 1) === 'us') {
          i += 2;
          type = 'hortative';
        } else type = 'command';
        let neg = false;
        if (at() === 'do' && at(i + 1) === 'not') {
          neg = true;
          i += 2;
        } else if (at() === 'never') {
          neg = true;
          i += 1;
        } else if (at() === 'not') {
          neg = true;
          i += 1;
        }
        main = readClauseBody({ noSubject: true });
        main.tense = 'present';
        if (neg) main.negated = true;
      } else if (end === '?' && phrase(data.question_words) !== null) {
        // a content question: what / who / where … (2.5:G88)
        const qw = phrase(data.question_words) ?? '';
        skip(qw);
        const role = data.question_words[qw]?.role ?? '';
        let qnp: MeaningNP | null = null;
        if (role === 'determiner' || role === 'quantity' || role === 'owner') {
          qnp = readNP();
          if (qnp !== null)
            qnp = {
              ...qnp,
              definite: qw === 'which' ? 'which' : qw === 'whose' ? 'whose' : 'how many',
            };
        }
        const aux = at();
        const inverted =
          MODALS.includes(aux) ||
          data.do.includes(aux) ||
          data.copula.be.includes(aux) ||
          data.have.includes(aux);
        if (inverted && nounStart(i + 1)) {
          i += 1;
          main = readClauseBody({
            inverted: aux,
            gapObject: role === 'thing' || role === 'person' || qnp !== null,
          });
          if (qnp !== null && main.object === undefined && main.verb?.kind !== 'be')
            main.object = qnp;
          else if (qnp !== null && main.verb?.kind === 'be')
            main.complement = { kind: 'np', np: qnp };
          else if (role === 'thing' || role === 'person') {
            if (main.verb?.kind === 'be' && main.complement === undefined)
              main.complement = { kind: 'np', np: { head: qw, kind: 'question', adjectives: [] } };
            else main.object = { head: qw, kind: 'question', adjectives: [] };
          } else main.adjuncts.unshift({ role: 'question', word: qw });
        } else {
          // the ki-word is the subject: Who sings?
          main = readClauseBody({ gapSubject: true });
          main.subject = qnp ?? { head: qw, kind: 'question', adjectives: [] };
        }
        main.question = { word: qw, role };
      } else if (
        end === '?' &&
        (MODALS.includes(at()) ||
          data.do.includes(at()) ||
          data.copula.be.includes(at()) ||
          data.have.includes(at())) &&
        nounStart(i + 1)
      ) {
        // a yes/no question: the auxiliary first
        const aux = at();
        i += 1;
        main = readClauseBody({ inverted: aux });
      } else if (at() === 'what' && (at(i + 1) === 'a' || at(i + 1) === 'an') && end === '!') {
        // What a night! (2.2:G61)
        i += 2;
        const np = readNP();
        main = emptyClause();
        main.type = 'exclamation';
        if (np !== null) main.subject = { ...np, definite: 'which' };
        main.question = { word: 'what', role: 'exclamation' };
      } else if (at() === 'how' && adjLemma(at(i + 1)) !== null && end === '!') {
        // How beautiful the night is! (2.2:G61)
        const a = adjLemma(at(i + 1));
        i += 2;
        const np = readNP();
        main = emptyClause();
        main.type = 'exclamation';
        main.subject = np;
        main.verb = { lemma: 'be', kind: 'be' };
        main.lasting = true;
        main.complement = { kind: 'adjective', lemma: a?.lemma ?? '', degree: 'ki-modo' };
        while (!done()) i += 1;
      } else if (at() === 'may' && nounStart(i + 1) && end !== '?') {
        // May the light hold you: a blessing (2.1:G48)
        i += 1;
        main = readClauseBody({});
        main.type = 'wish';
        main.attitude = 'hope';
      } else if (at() === 'if' && at(i + 1) === 'only') {
        i += 2;
        main = readClauseBody({});
        main.type = 'wish';
        main.attitude = 'hope';
        main.counterfactual = true;
      } else {
        main = readClauseBody({});
      }
      if (main.type === 'statement') main.type = type;
      if (please) main.please = true;
      if (c.topic !== undefined) main.topic = c.topic;
      if (c.vocative !== undefined) main.vocative = c.vocative;
      if (c.attitude !== undefined && main.attitude === undefined) main.attitude = c.attitude;
      if (c.link !== undefined) main.link = c.link;
      main.adjuncts = [...front, ...main.adjuncts];
      main.subordinates = [
        ...before.map((b) => ({ ...b, fronted: true }) as MeaningClause),
        ...main.subordinates,
      ];

      // what follows: a vocative, subordinate and coordinate clauses
      for (let guard = 0; guard < 8 && !done(); guard++) {
        if (isPunct(i, ',') || isPunct(i, ';') || isPunct(i, '—')) {
          const p = raw();
          i += 1;
          // a vocative at the end: …, my love?
          const save = i;
          const v = readNP();
          if (v !== null && done()) {
            main.vocative = v;
            continue;
          }
          i = save;
          if (p === ';') {
            const next = readClauseBody({});
            main.subordinates.push({ ...next, link: 'and', semicolon: true });
            continue;
          }
          continue;
        }
        const w = at();
        const sub = phrase(data.subordinators);
        if (sub !== null && sub !== 'that') {
          skip(sub);
          const link = (data.subordinators[sub]?.link ?? 'condition') as NonNullable<
            MeaningClause['link']
          >;
          // so that perhaps: hopeful purpose (2.5:G116); in order to + verb: same subject (2.5:G113)
          if (link === 'purpose' && at() === 'to') i += 1;
          const body = readClauseBody(
            link === 'purpose' && verbOf(at()) !== null && !nounStart(i) ? { noSubject: true } : {},
          );
          if (body.attitude === 'perhaps' && link === 'purpose') {
            delete body.attitude;
            body.modal = 'might';
          }
          main.subordinates.push({ ...body, link });
          continue;
        }
        // …, and no longer are: was, and no longer is (2.5:G94)
        const nl = data.no_longer.phrases.find(
          (ph) =>
            toks
              .slice(i + 1, i + 1 + ph.split(' ').length)
              .map((t) => t.lower)
              .join(' ') === ph,
        );
        if (w === 'and' && nl !== undefined && main.verb?.kind === 'be') {
          main.noLonger = true;
          while (!done()) i += 1;
          continue;
        }
        if (w === 'and' || w === 'but' || w === 'or') {
          i += 1;
          if (isPunct(i, ',')) i += 1;
          const shared = verbGroupAhead();
          const body = readClauseBody(shared ? { noSubject: true } : {});
          main.subordinates.push({ ...body, link: w });
          continue;
        }
        if (w === 'to' && verbOf(at(i + 1)) !== null) {
          i += 1;
          const body = readClauseBody({ noSubject: true });
          main.subordinates.push({ ...body, link: 'purpose' });
          continue;
        }
        // anything else could not be read
        unread.push(raw());
        i += 1;
      }
      return main;
    }

    function verbGroupAheadAfterNP(k: number): boolean {
      const save = i;
      i = k;
      const np = readNP();
      const ok = np !== null && verbGroupAhead();
      i = save;
      return ok;
    }

    const clause = readTop();
    void words;
    return { english, clause, end, unread };
  }

  /** Every sentence of a text. */
  function read(text: string): MeaningSentence[] {
    const parts = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s !== '');
    return parts.map(readSentence);
  }

  return { read, readSentence, verbOf, nounLemma, adjLemma, adverbAdj };
}

export type EnglishReader = ReturnType<typeof createEnglishReader>;
