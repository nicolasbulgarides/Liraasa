/**
 * Meaning frame → LSentence, by the 2.5 rulings (ADR-0020). Deterministic:
 * every choice is a ruling or a translator preference the patch states, and a
 * choice made by default (ke or ka, a word among several) is flagged.
 *
 *   questions        statement order, final ki always; a lone adverbial
 *                    ki-word fronted (2.5:G88)
 *   ke / ka          now or for a time / lasting (2.5:G93, G94)
 *   possession       a pronoun owner first; otherwise NOUN de OWNER (2.5:G95);
 *                    no three-part de chain grouped from the right (G96)
 *   purpose          kopisa (2.5:G113); hopeful: kopisa + nosi (G116)
 *   would have       po noma viki (2.5:G114)
 *   relatives        raho, a resumptive pronoun for a possessor, time or
 *                    place (2.5:G120), a comma when it goes on (G115)
 *   recipients       a pronoun after a give-type verb, else theme + ala (G112)
 *   commands         '!' or fisa (2.5:G90)
 *   Self             li maivo (2.5:G100); a simile with li (G107); a
 *                    partitive with li (G97)
 */
import type { Index } from '../grammar';
import type { EnglishData, MeaningSentence } from './english';
import type {
  LAdjunct,
  LClause,
  LNP,
  LPredicate,
  LSentence,
  LWord,
  MeaningAdjunct,
  MeaningClause,
  MeaningNP,
} from './frame';
import type { EnglishIndex, Want } from './lexchoice';

export interface Realizing {
  ix: Index;
  en: EnglishIndex;
  data: EnglishData;
  /** 0–999 → the numeral (numbers.lookup_0_999) */
  numerals: Record<string, string>;
}

export interface Built {
  sentence: LSentence;
  flags: string[];
  /** English words with no listed Liraasa word */
  gaps: { english: string; want: Want; nearest: LWord[] }[];
  /** for each chosen content word, the other listed words */
  alternatives: Record<string, LWord[]>;
}

const fw = (form: string, english?: string): LWord => ({
  form,
  ...(english === undefined ? {} : { english }),
});

export function buildLSentence(
  ctx: Realizing,
  ms: MeaningSentence,
  choice: { lasting?: boolean; recipientAla?: boolean } = {},
): Built {
  const flags: string[] = [];
  const gaps: Built['gaps'] = [];
  const alternatives: Record<string, LWord[]> = {};
  const { data, en, ix } = ctx;

  const content = (want: Want, lemma: string): LWord => {
    const c = en.choose(want, lemma);
    if (c.word !== null) {
      if (c.alternatives.length > 0) alternatives[lemma] = c.alternatives;
      for (const f of c.word.flags ?? []) flags.push(`${c.word.form}: ${f}`);
      return c.word;
    }
    gaps.push({ english: lemma, want, nearest: c.nearest });
    return { form: `⟨${lemma}⟩`, english: lemma, flags: ['no listed word'] };
  };
  const nounClass = (w: LWord): string => ix.source.flags.noun_class[w.root ?? w.form] ?? '';

  const numeral = (n: number): LWord => {
    const w = ctx.numerals[String(n)];
    if (w === undefined) {
      gaps.push({ english: String(n), want: 'noun', nearest: [] });
      return { form: `⟨${String(n)}⟩` };
    }
    return fw(w, String(n));
  };

  // ------------------------------------------------------------ noun phrase
  function np(m: MeaningNP, role: 'subject' | 'object' | 'pp' = 'object'): LNP {
    if (m.kind === 'pronoun' || m.kind === 'reflexive') {
      const p = data.pronouns[m.head];
      const pw = data.pronoun_words[m.head];
      if (p !== undefined) {
        const out: LNP = { kind: 'pron', head: fw(p.form, m.head), adjectives: [] };
        if (m.kind === 'reflexive') out.refl = fw('sela', 'self');
        return wrap(out, m);
      }
      if (pw !== undefined)
        return wrap(
          {
            kind: ['eli', 'ola', 'eliri', 'olari'].includes(pw) ? 'demonstrative' : 'correlative',
            head: fw(pw, m.head),
            adjectives: [],
          },
          m,
        );
    }
    if (m.kind === 'demonstrative') {
      const d = data.pronoun_words[m.head] ?? data.determiners[m.head] ?? m.head;
      return wrap({ kind: 'demonstrative', head: fw(d, m.head), adjectives: [] }, m);
    }
    if (m.kind === 'question') {
      const q = data.question_words[m.head]?.word ?? 'ki-coda';
      return wrap({ kind: 'kiword', head: fw(q, m.head), adjectives: [] }, m);
    }
    if (m.kind === 'name') return wrap({ kind: 'name', head: fw(m.head), adjectives: [] }, m);
    if (m.kind === 'number' && m.partitive === true && m.of !== undefined) {
      // a fraction or a partitive: NUMBER de NUMBER, or NUMBER de li … (2.5:G97)
      const out: LNP = { kind: 'num', head: numeral(m.number ?? 1), adjectives: [] };
      const of = np(m.of, 'pp');
      if (m.of.kind !== 'number' || m.of.definite !== undefined) out.de = withArticle(of);
      else out.de = of;
      return wrap(out, m);
    }
    if (m.kind === 'number')
      return wrap(
        {
          kind: 'num',
          head: numeral(m.number ?? 0),
          adjectives: [],
          ...(m.negativeNumber === true ? { sign: fw('antizi', 'minus') } : {}),
          ...(m.approximately === true ? { degreeNum: fw('gase', 'about') } : {}),
        },
        m,
      );
    // Self: li maivo (2.5:G100)
    const isSelf = m.head === 'self' && m.kind === 'noun';
    const head = isSelf
      ? fw('maivo', 'Self')
      : m.kind === 'adjective'
        ? content('adj', m.head)
        : content('noun', m.head);
    const out: LNP = { kind: m.kind === 'adjective' ? 'adj' : 'noun', head, adjectives: [] };
    if (isSelf) out.det = fw('li', 'the');
    // quantifier, determiner
    if (m.quantifier !== undefined) {
      const q =
        m.quantifier === 'more'
          ? 'kasi'
          : m.quantifier === 'less'
            ? 'menu'
            : data.quantifiers[m.quantifier];
      if (q !== undefined) out.quant = fw(q, m.quantifier);
      if (m.quantifier === 'all' && m.definite === 'the') out.det = fw('li', 'the');
    }
    if (m.definite === 'how many') out.quant = fw('ki-muya', 'how many');
    else if (m.definite === 'whose') {
      // whose N: ki-nela de N
      return wrap(
        { kind: 'kiword', head: fw('ki-nela', 'who'), adjectives: [], de: { ...out } },
        m,
      );
    } else if (m.definite !== undefined && m.definite !== null && !(m.quantifier === 'all')) {
      const d = data.determiners[m.definite];
      if (d !== undefined) out.det = fw(d, m.definite);
    }
    if (m.ordinal !== undefined)
      out.ord = { ...numeral(m.ordinal), form: `${numeral(m.ordinal).form}${ix.ordinalSuffix}` };
    if (m.negativeNumber === true) out.sign = fw('antizi', 'minus');
    if (m.approximately === true) out.degreeNum = fw('gase', 'about');
    if (m.number !== undefined) out.num = numeral(m.number);
    // adjectives: a noun used as a modifier becomes its adjective (ADR-0011)
    for (const a of m.adjectives) {
      let adj = en.choose('adj', a.lemma).word;
      if (adj === null) {
        const asNoun = en.choose('noun', a.lemma).word;
        const san = asNoun?.root === undefined ? null : ix.formOf(asNoun.root, 'a');
        if (san !== null)
          adj = { form: san, root: asNoun?.root ?? '', role: 'a', english: a.lemma };
      }
      const word = adj ?? content('adj', a.lemma);
      const degree =
        a.degree === undefined
          ? undefined
          : fw(a.degree in data.degree ? (data.degree[a.degree] ?? a.degree) : a.degree, a.degree);
      out.adjectives.push({ ...(degree === undefined ? {} : { degree }), adj: word });
    }
    // plural: -ri, optional after a number (2.5:G101): left off after a number
    if (
      m.plural === true &&
      m.number === undefined &&
      !(out.det?.form === 'eli' || out.det?.form === 'ola')
    )
      out.head = { ...out.head, suffixes: ['ri'] };
    if (m.diminutive === true)
      out.head = { ...out.head, suffixes: ['ti', ...(out.head.suffixes ?? [])] };
    // the owner: a pronoun first (taivo de lira); a noun or a name after de (li bumre de pilo, 2.5:G95)
    let result: LNP = out;
    if (m.owner !== undefined) {
      const owner = np(m.owner, 'pp');
      if (owner.kind === 'pron') {
        result = { ...owner, de: stripArticle(out) };
      } else {
        if (out.det === undefined && out.quant === undefined) out.det = fw('li', 'the');
        result = { ...out, de: owner };
      }
    }
    // of: the X of the Y; avoid a three-part chain that groups from the right (2.5:G96)
    if (m.of !== undefined) {
      const of = np(m.of, 'pp');
      if (of.de !== undefined && of.kind === 'pron') {
        // the warmth of my body → maivo de yugesan suma: the owner's noun becomes an adjective
        const inner = of.de;
        const adjForm = inner.head.root === undefined ? null : ix.formOf(inner.head.root, 'a');
        if (adjForm !== null) {
          result = {
            ...of,
            de: {
              ...stripArticle(out),
              adjectives: [
                { adj: { form: adjForm, root: inner.head.root ?? '', role: 'a' } },
                ...out.adjectives,
              ],
            },
          };
          flags.push(
            `2.5:G96: "${m.head} of ${m.of.head}" rephrased with an adjective, so no de chain groups from the right`,
          );
        } else {
          result = { ...result, de: of };
          flags.push(
            `2.5:G96: a three-part de chain reads from the left: (X de ${of.head.form}) de ${inner.head.form}; check the meaning`,
          );
        }
      } else result = { ...result, de: of };
    }
    // a relative clause
    if (m.relative !== undefined) {
      const rel = clause(m.relative, { relativeHead: m });
      rel.linker = fw('raho', 'who / which');
      result = { ...result, relative: rel };
      // closed by a comma when it has its own object or adjunct and the sentence goes on (2.5:G115)
      if (
        role === 'subject' &&
        (rel.object !== undefined || rel.adjuncts.length > 0 || rel.objectClause !== undefined)
      )
        result.relativeComma = true;
    }
    if (m.and !== undefined)
      result = {
        ...result,
        and: {
          linker: fw(m.and.linker === 'and' ? 'ata' : 'oro', m.and.linker),
          np: np(m.and.np, role),
        },
      };
    return wrap(result, m);
  }
  const wrap = (out0: LNP, m: MeaningNP): LNP => {
    let out = out0;
    // she herself: emphatic sela (3.0:G134)
    if (m.emphatic === true) out = { ...out, refl: fw('sela', 'self') };
    // Mr Peta: a title before the name (3.2:G145)
    if (m.title !== undefined) {
      const t = data.titles?.[m.title];
      if (t !== undefined) out = { ...out, title: fw(t, m.title) };
    }
    // the song by Peta: gagu + the maker after a made work (3.0:G136)
    if (m.maker !== undefined) out = { ...out, maker: { gagu: fw('gagu', 'by'), np: np(m.maker) } };
    if (m.focus !== undefined) {
      const s = data.scope[m.focus] ?? (m.focus === 'it is' ? 'vinto' : undefined);
      if (s !== undefined) return { ...out, scope: fw(s, m.focus) };
    }
    if (m.negated === true) return { ...out, scope: fw('ne', 'not') };
    return out;
  };
  const stripArticle = (x: LNP): LNP => {
    if (x.det?.form !== 'li') return x;
    const { det: _det, ...rest } = x;
    void _det;
    return rest;
  };
  const withArticle = (x: LNP): LNP =>
    x.det === undefined && x.kind !== 'pron' ? { ...x, det: fw('li', 'the') } : x;

  // ------------------------------------------------------------ adjuncts
  function adjunct(a: MeaningAdjunct, c: MeaningClause): LAdjunct | null {
    switch (a.role) {
      case 'distributive': {
        // one by one, star by star: X krotiapo X (3.0:G140)
        const n = data.numbers[a.word ?? ''];
        const w = n !== undefined ? numeral(n) : content('noun', a.word ?? '');
        return { kind: 'distributive', word: w };
      }
      case 'time': {
        // forever: en rinbakrono, in eternity (3.0:G139)
        if (a.word !== undefined && (data.forever ?? []).includes(a.word))
          return {
            kind: 'pp',
            word: fw('en', 'in'),
            np: np({ head: 'eternity', kind: 'noun', adjectives: [] }, 'pp'),
          };
        if (a.word === 'in' && a.np !== undefined)
          return { kind: 'measure', word: fw('krotiapo', 'in'), np: np(a.np, 'pp') };
        const t = data.time_adverbs[a.word ?? ''];
        if (t !== undefined) return { kind: 'adv', word: fw(t, a.word) };
        const f = data.frame_words[a.word ?? ''];
        if (f !== undefined) return { kind: 'adv', word: fw(f, a.word) };
        if (a.np !== undefined) return { kind: 'pp', word: fw('en', 'in'), np: np(a.np, 'pp') };
        return null;
      }
      case 'place': {
        if (a.word !== undefined && a.np === undefined) {
          const p = data.place_adverbs[a.word];
          if (p !== undefined) return { kind: 'adv', word: fw(p, a.word) };
        }
        return pp(a);
      }
      case 'manner': {
        if (a.word === 'each other' || a.word === 'one another') return null; // the reciprocal closes the clause
        const adj = content('adj', a.word ?? '');
        const degree = a.degree === undefined ? undefined : fw(a.degree, a.degree);
        const out: LAdjunct = { kind: 'la', adj, ...(degree === undefined ? {} : { degree }) };
        if (a.np !== undefined) out.np = np(a.np, 'pp');
        return out;
      }
      case 'ago':
        return a.np === undefined
          ? null
          : { kind: 'measure', word: fw('kroti', 'ago'), np: np(a.np, 'pp') };
      case 'duration':
        // en + NUMBER + a time noun (4.0:G158); with no noun phrase there is nothing to say
        if (a.np === undefined) return null;
        return { kind: 'pp', word: fw('en', 'for'), np: stripArticle(np(a.np, 'pp')) };
      case 'comparison':
        if (a.word === 'about' && a.np !== undefined)
          return { kind: 'pp', word: fw('de', 'about'), np: np(a.np, 'pp') };
        return a.np === undefined ? null : { kind: 'tamo', np: np(a.np, 'pp') };
      case 'simile':
        // a simile takes the article (2.5:G107)
        return a.np === undefined ? null : { kind: 'gase', np: withArticle(np(a.np, 'pp')) };
      case 'question': {
        const q = data.question_words[a.word ?? '']?.word;
        return q === undefined ? null : { kind: 'kiword', word: fw(q, a.word) };
      }
      case 'means':
      case 'companion':
      case 'medium':
      case 'goal':
      case 'source':
      case 'beneficiary':
      case 'purpose':
      case 'frequency':
        void c;
        return pp(a);
    }
  }
  function pp(a: MeaningAdjunct): LAdjunct | null {
    const prep = data.prepositions[a.word ?? ''];
    if (prep === undefined || a.np === undefined) return null;
    const obj = np(a.np, 'pp');
    let word = prep.word;
    // with: a tool or substance takes yuta, a companion or a feeling ko (2.5:G104)
    if (a.word === 'with' && data.tool_classes.includes(nounClass(obj.head)))
      word = prep.tool ?? 'yuta';
    // a side noun keeps its article (2.5:G99); a time noun after en takes none (2.5:G103)
    const timeNoun =
      word === 'en' && ix.timeNouns.has(obj.head.form) && obj.adjectives.length === 0;
    const np2 = prep.article === true ? withArticle(obj) : timeNoun ? stripArticle(obj) : obj;
    return { kind: 'pp', word: fw(word, a.word), np: np2 };
  }

  // -------------------------------------------------------------- clause
  function ops(m: MeaningClause, opts: { inherit?: boolean } = {}): LWord[] {
    const o = data.operators;
    const out: LWord[] = [];
    if (m.counterfactual === true) {
      out.push(fw('po', 'past'), fw(o.counterfactual, 'contrary to fact'));
    } else if (m.tense === 'past' && opts.inherit !== true && m.noLonger !== true)
      out.push(fw(o.tense.past, 'past'));
    else if (m.tense === 'future' && opts.inherit !== true) out.push(fw(o.tense.future, 'will'));
    if (m.negated === true) out.push(fw(o.negation, 'not'));
    if (m.modal !== undefined) {
      const key = m.modal === 'can' ? 'can' : m.modal === 'hope' ? 'hope to' : m.modal;
      const w = data.modals[key];
      if (w !== undefined) out.push(fw(w, m.modal));
    }
    if (m.approach !== undefined) {
      const w = o.approach[m.approach];
      if (w !== undefined) out.push(fw(w, m.approach));
    }
    if (m.phase !== undefined) out.push(fw(o.phase[m.phase] ?? '', m.phase));
    if (m.effort !== undefined) out.push(fw(o.effort[m.effort] ?? '', m.effort));
    if (m.aspect !== undefined && !(m.aspect === 'completed' && m.counterfactual === true))
      out.push(fw(o.aspect[m.aspect] ?? '', m.aspect));
    // still / again before the verb; already too (2.5:G126 lets reve / loki close the clause; the translator keeps them before it)
    if (m.iteration !== undefined) out.push(fw(o.iteration[m.iteration] ?? '', m.iteration));
    return out;
  }

  function predicateOf(m: MeaningClause): LPredicate {
    const comp = m.complement;
    if (comp === undefined) return { kind: 'gap' };
    if (comp.kind === 'adjective') {
      if (comp.degree === 'ki-modo')
        return { kind: 'kiword', word: fw('ki-modo', 'how'), adj: content('adj', comp.lemma) };
      const deg =
        comp.degree === undefined
          ? undefined
          : fw(data.degree[comp.degree] ?? comp.degree, comp.degree);
      const out: LPredicate = {
        kind: 'adj',
        adj: content('adj', comp.lemma),
        ...(deg === undefined ? {} : deg.form === 'tonsi' ? { tonsi: deg } : { degree: deg }),
      };
      if (comp.than !== undefined) out.tamo = np(comp.than, 'pp');
      if (comp.as !== undefined) out.gase = np(comp.as, 'pp');
      if (m.chain?.verb !== null && m.chain?.verb !== undefined) {
        const sb: LClause = emptyClause();
        sb.pred = { kind: 'verb', verb: content('verb', m.chain.verb.lemma) };
        out.sidu = sb;
      }
      return out;
    }
    if (comp.kind === 'np') return { kind: 'np', np: np(comp.np, 'object') };
    const a = comp.adjunct;
    if (a.np === undefined && a.word !== undefined) {
      const p = data.place_adverbs[a.word];
      if (p !== undefined) return { kind: 'adv', word: fw(p, a.word) };
    }
    const ad = pp(a);
    return ad === null
      ? { kind: 'gap' }
      : { kind: 'pp', prep: ad.word ?? fw('en'), np: ad.np ?? null };
  }

  /** ke or ka (2.5:G93, G94): now / for a time, or lasting. */
  function copula(m: MeaningClause): LWord {
    const comp = m.complement;
    if (m.noLonger === true) return fw('kapoki', 'was, and no longer is');
    if (m.lasting === true) return fw('ka', 'is (lasting)');
    if (m.lasting === false) return fw('ke', 'is (now)');
    if (choice.lasting !== undefined) return fw(choice.lasting ? 'ka' : 'ke', 'is');
    const timeCue = m.adjuncts.some((a) =>
      ['now', 'today', 'tonight', 'this morning', 'this evening'].includes(a.word ?? ''),
    );
    if (comp?.kind === 'place') return fw('ke', 'is (now)');
    if (m.tense === 'past' || timeCue) return fw('ke', 'was (at that time)');
    if (comp?.kind === 'adjective') {
      if (data.state_adjectives.words.includes(comp.lemma)) return fw('ke', 'is (now)');
      flags.push(
        `2.5:G93: "${comp.lemma}" read as lasting (ka); write ke if it holds only now or for a time`,
      );
      return fw('ka', 'is (lasting)');
    }
    return fw('ka', 'is (lasting)');
  }

  function clause(
    m: MeaningClause,
    opts: { relativeHead?: MeaningNP; inherit?: boolean; main?: boolean } = {},
  ): LClause {
    const c = emptyClause();
    const fronted = m.adjuncts.filter((a) => a.fronted === true);
    const rest = m.adjuncts.filter((a) => a.fronted !== true);
    // subordinate clauses that came first
    for (const s0 of m.subordinates.filter((x) => (x as { fronted?: boolean }).fronted === true)) {
      // If I had asked, you would have answered: the condition is counterfactual too (2.5:G114)
      const s =
        s0.link === 'condition' && m.counterfactual === true && s0.aspect === 'completed'
          ? { ...s0, counterfactual: true, aspect: undefined }
          : s0;
      if (s.aspect === undefined) delete (s as { aspect?: unknown }).aspect;
      const sc = clause(s as MeaningClause, {
        inherit: s.tense === m.tense && s.link !== 'since' && s.counterfactual !== true,
      });
      sc.linker = fw(linkWord(s.link), s.link);
      c.before.push({ clause: sc, comma: true });
    }
    for (const a of fronted) {
      const la = adjunct(a, m);
      if (la !== null) c.frame.push({ adjunct: la, comma: true });
    }
    if (m.link === 'therefore' && (m.subject !== null || m.verb !== null)) {
      c.linker = fw('tonsi', 'therefore');
      c.linkerComma = true; // clause-initial tonsi takes a comma (2.5:G117)
    } else if (
      m.link !== undefined &&
      m.subject === null &&
      m.verb === null &&
      opts.main === true
    ) {
      // a fragment: And? → Ata ki? (2.5:G91)
      c.linker = fw(linkWord(m.link), m.link);
    }
    if (m.please === true) c.interjections.push({ word: fw('fisa', 'please'), comma: true });
    if (m.topic !== undefined) c.topic = np(m.topic, 'subject');
    // the subject
    if (m.type === 'command') c.subject = null;
    else if (m.type === 'hortative') c.subject = 'hortative';
    else if (m.subject !== null) c.subject = np(m.subject, 'subject');
    // the operators
    c.ops = ops(m, { inherit: opts.inherit === true });
    // the predicate
    const v = m.verb;
    if (v === null && m.acclamation !== undefined) {
      // NP ala NP!: an acclamation, a liturgical fragment (3.0:G137)
      c.pred = {
        kind: 'bare-adj',
        predicate: { kind: 'pp', prep: fw('ala', 'to'), np: np(m.acclamation, 'pp') },
      };
    } else if (v === null) {
      c.pred = { kind: 'none' };
    } else if (v.kind === 'exist') {
      // with a subject and nothing after it: the subject exists (3.0:G132)
      c.pred =
        m.object === undefined
          ? { kind: 'exist', miyo: fw('miyo', 'exists') }
          : { kind: 'exist', miyo: fw('miyo', 'there is'), np: np(m.object) };
    } else if (v.kind === 'be') {
      c.pred = { kind: 'copula', cop: copula(m), predicate: predicateOf(m) };
    } else if (v.kind === 'become') {
      c.pred = { kind: 'copula', cop: fw('loya', 'become'), predicate: predicateOf(m) };
    } else if (m.causative !== undefined) {
      const opWord = data.causatives[m.causative.kind] ?? 'vaku';
      c.pred = {
        kind: 'valency',
        op: fw(opWord, m.causative.kind),
        actor: np(m.causative.actor),
        actorOps: [],
        verb: content('verb', v.lemma),
      };
    } else if (m.passive !== undefined) {
      const verb = content('verb', v.lemma);
      if (ix.transitive.size > 0 && !ix.transitive.has(verb.form))
        flags.push(
          `2.5:G110: ${verb.form} is not attested with an object; gome may not passivise it`,
        );
      c.pred = {
        kind: 'passive',
        gome: fw('gome', 'is … -ed'),
        verb,
        ...(m.passive.agent === undefined
          ? {}
          : { agent: { gagu: fw('gagu', 'by'), np: np(m.passive.agent) } }),
      };
    } else {
      c.pred = { kind: 'verb', verb: content('verb', v.lemma === 'have' ? 'have' : v.lemma) };
    }
    // a relative closes with a comma only when the sentence goes on after it (2.5:G115)
    if (
      c.pred.kind === 'none' &&
      c.subject !== null &&
      c.subject !== 'hortative' &&
      c.subject.relativeComma === true
    )
      delete c.subject.relativeComma;
    // the object and the recipient
    if (m.object !== undefined && v?.kind !== 'exist') c.object = np(m.object);
    if (m.recipient !== undefined) {
      const r = np(m.recipient);
      const verbForm = c.pred.kind === 'verb' ? c.pred.verb.form : '';
      const give = verbForm in ix.source.flags.give_type;
      // only a bare pronoun may stand as the recipient right after the verb (2.5:G112)
      if (
        m.recipient.kind === 'pronoun' &&
        give &&
        choice.recipientAla !== true &&
        c.object !== undefined
      )
        c.recipient = r;
      else c.adjuncts.push({ kind: 'pp', word: fw('ala', 'to'), np: r }); // VERB THEME ala RECIPIENT (2.5:G112)
    }
    if (m.objectClause !== undefined) {
      const oc = clause(m.objectClause, { inherit: m.objectClause.tense === m.tense });
      const link = m.objectClause.link;
      if (link === 'whether') oc.linker = fw('ki-oro', 'whether');
      else if (link === 'relative')
        oc.linker = fw('raho', 'what'); // a headless relative (2.2:G64)
      else if (link === 'question') {
        const q = data.question_words[m.objectClause.question?.word ?? '']?.word ?? 'ki-coda';
        // an embedded question keeps its ki-word first and never takes ki (2.3:G77)
        oc.linker = fw(q, m.objectClause.question?.word);
      } else oc.linker = fw('fime', 'that');
      c.objectClause = oc;
    }
    // a chain: want to sing (0.8:G6)
    if (m.chain !== undefined && m.complement === undefined) {
      const ch = clause(m.chain, { inherit: true });
      c.adjuncts.push({ kind: 'chain', clause: ch });
    }
    // adjuncts
    for (const a of rest) {
      const la = adjunct(a, m);
      if (la !== null) c.adjuncts.push(la);
    }
    // a relative on a time or a place keeps the preposition and ito in place (2.5:G120)
    if (
      opts.relativeHead !== undefined &&
      (m.question?.word === 'where' || m.question?.word === 'when')
    ) {
      c.adjuncts.push({
        kind: 'pp',
        word: fw('en', 'in'),
        np: { kind: 'pron', head: fw('ito', 'it'), adjectives: [] },
      });
    }
    if (opts.relativeHead !== undefined && m.question?.word === 'whose' && c.object !== undefined) {
      // whose: PRONOUN de NOUN in place (2.5:G120)
      const owner =
        opts.relativeHead.kind === 'noun' &&
        ix.source.flags.noun_class[en.choose('noun', opts.relativeHead.head).word?.form ?? ''] ===
          'person'
          ? 'saivo'
          : 'saivo';
      const { scope: _scope, ...owned } = c.object;
      void _scope;
      c.object = {
        kind: 'pron',
        head: fw(owner, 'whose'),
        adjectives: [],
        de: stripArticle(owned),
      };
    }
    // the closing words: fuyi, attitude, ki
    if (m.adjuncts.some((a) => a.word === 'each other' || a.word === 'one another'))
      c.closing.push(fw('fuyi', 'each other'));
    if (m.attitude !== undefined) {
      const at =
        m.attitude === 'certainly'
          ? 'seye'
          : m.attitude === 'probably'
            ? 'mufe'
            : m.attitude === 'perhaps'
              ? 'poye'
              : m.attitude === 'hope'
                ? 'pifu'
                : 'zoke';
      c.closing.push(fw(at, m.attitude));
    }
    // questions: a lone adverbial ki-word opens the clause; every direct question ends in ki (2.5:G88)
    if (m.type === 'question' && opts.main === true) {
      c.ki = true;
      const kiAdj = c.adjuncts.findIndex((a) => a.kind === 'kiword');
      const kiAdjunct = c.adjuncts[kiAdj];
      if (kiAdj >= 0 && kiAdjunct?.word !== undefined && c.subject !== null) {
        c.kiFront = kiAdjunct.word;
        c.adjuncts.splice(kiAdj, 1);
      }
    }
    // subordinate and coordinate clauses after the main one
    for (const s of m.subordinates.filter((x) => (x as { fronted?: boolean }).fronted !== true)) {
      const shared =
        s.subject === null && (s.link === 'and' || s.link === 'but' || s.link === 'or');
      const sameSubjectPurpose = s.link === 'purpose' && s.subject === null;
      const sc = clause(s, {
        inherit:
          (s.tense === m.tense || (s.link === 'purpose' && s.tense === 'future')) &&
          s.link !== 'since' &&
          s.link !== 'and' &&
          s.link !== 'but' &&
          s.link !== 'or',
      });
      if (shared || sameSubjectPurpose) sc.subject = null;
      sc.linker = fw(linkWord(s.link), s.link);
      // hopeful purpose (2.5:G116) after a comma, as canon writes it; a semicolon keeps its place
      const comma =
        (s.link === 'purpose' && s.modal === 'might') ||
        s.semicolon === true ||
        s.commaJoined === true;
      if (s.semicolon === true || s.commaJoined === true) delete sc.linker;
      c.after.push({ clause: sc, comma, ...(s.semicolon === true ? { punct: ';' } : {}) });
    }
    if (m.vocative !== undefined) {
      const v0 = np(m.vocative);
      // O …: iya opens the vocative (3.0:G129)
      const voc = m.vocativeIya === true ? { ...v0, iya: fw('iya', 'O') } : v0;
      if (m.vocativeFirst === true) c.vocativeBefore = voc;
      else c.vocative = voc;
    }
    return c;
  }

  const linkWord = (link: MeaningClause['link']): string => {
    if (link === undefined) return '';
    const sub = Object.values(data.subordinators).find((s) => s.link === link);
    if (sub !== undefined) return sub.word;
    if (link === 'and') return 'ata';
    if (link === 'but') return 'nara';
    if (link === 'or') return 'oro';
    if (link === 'therefore') return 'tonsi';
    return '';
  };

  const main = clause(ms.clause, { main: true });
  // a command is marked: '!' (2.5:G90)
  // fisa marks a command by itself (2.5:G90): Fisa, lisrola.
  const end: LSentence['end'] =
    (ms.clause.type === 'command' && ms.clause.please !== true) ||
    ms.clause.type === 'hortative' ||
    ms.clause.type === 'exclamation' ||
    // O Mother of Light!: an address standing alone keeps its mark (3.0:G129)
    (ms.end === '!' && ms.clause.verb === null && ms.clause.vocative !== undefined)
      ? '!'
      : ms.clause.type === 'question'
        ? '?'
        : '.';
  // What a night! — the noun phrase alone (2.2:G61)
  if (ms.clause.type === 'exclamation' && ms.clause.question?.role === 'exclamation')
    main.ki = false;
  return { sentence: { main, end }, flags, gaps, alternatives };
}

export function emptyClause(): LClause {
  return {
    frame: [],
    interjections: [],
    subject: null,
    ops: [],
    pred: { kind: 'none' },
    adjuncts: [],
    closing: [],
    ki: false,
    before: [],
    after: [],
  };
}
