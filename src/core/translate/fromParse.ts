/**
 * The strict checker's parse → LSentence. With realize() this is the round
 * trip (a golden sentence parses to a frame and regenerates to itself) and
 * the back-translation of the translator's output (2.5, ADR-0020).
 */
import type {
  Adjunct,
  Clause,
  NounPhrase,
  Predicate,
  Reading,
  SentenceResult,
  Token,
} from '../grammar';
import type { LAdjunct, LClause, LNP, LPredicate, LSentence, LWord } from './frame';

export function fromParse(s: SentenceResult): LSentence {
  const t = s.tokens;
  const role = (k: number): string => s.roleAt[k] ?? '';
  const isPunct = (k: number, text?: string): boolean =>
    t[k]?.kind === 'punct' && (text === undefined || t[k]?.text === text);

  const lw = (k: number): LWord => {
    const tok: Token | undefined = t[k];
    const a = tok?.word;
    const r: Reading | undefined = a?.readings[0];
    const sfx = a?.suffixes ?? [];
    const lower = a?.lower ?? tok?.text ?? '';
    const isName =
      a?.readings.some((x) => x.pos === 'name') === true &&
      !a.readings.some((x) => x.pos !== 'name');
    const body = sfx.length > 0 ? lower.slice(0, lower.length - sfx.join('').length) : lower;
    return {
      form: isName ? (tok?.text ?? body) : body,
      ...(r?.root === undefined ? {} : { root: r.root }),
      ...(r?.role === undefined ? {} : { role: r.role }),
      ...(r?.gloss === undefined ? {} : { gloss: r.gloss }),
      ...(sfx.length > 0 ? { suffixes: [...sfx] } : {}),
    };
  };

  const np = (n: NounPhrase): LNP => {
    const head = n.head ?? n.start;
    const out: LNP = {
      kind:
        n.headKind === 'kiword'
          ? 'kiword'
          : n.headKind === 'demonstrative'
            ? 'demonstrative'
            : n.headKind === 'correlative'
              ? 'correlative'
              : n.headKind,
      head: lw(head),
      adjectives: [],
    };
    // a scope operator before the phrase
    if (n.start < (n.quant ?? n.det ?? n.ord ?? n.num ?? n.adjectives[0] ?? n.degrees[0] ?? head)) {
      const first = n.start;
      if (t[first]?.word?.readings.some((r) => r.pos === 'scope') === true) out.scope = lw(first);
      if (t[first]?.word?.lower === 'sidu') {
        out.kind = 'sidu';
        const vp: LClause = emptyLClause();
        vp.pred = { kind: 'verb', verb: lw(first + 1) };
        out.vp = vp;
        // the verb phrase's object, read back from the tokens' roles
        return out;
      }
    }
    if (n.quant !== null && n.quant !== head) {
      out.quant = lw(n.quant);
      if (n.degrees.includes(n.quant - 1)) out.degreeQuant = lw(n.quant - 1);
    }
    if (n.det !== null) out.det = lw(n.det);
    if (n.ord !== null) out.ord = lw(n.ord);
    if (n.num !== null) {
      if (n.num === head) out.kind = 'num';
      else out.num = lw(n.num);
    }
    for (let k = n.start; k < head; k++) {
      if (t[k]?.word?.readings.some((r) => r.pos === 'sign') === true) out.sign = lw(k);
      if (n.num !== null && k === n.num - 1 && n.degrees.includes(k)) out.degreeNum = lw(k);
    }
    for (const a of n.adjectives) {
      const d = n.degrees.includes(a - 1) && a - 1 !== (n.num ?? -5) - 1 ? lw(a - 1) : undefined;
      out.adjectives.push({ ...(d === undefined ? {} : { degree: d }), adj: lw(a) });
    }
    // adjectives after the noun (an error the checker reports) stay where they were
    if (n.refl !== null) out.refl = lw(n.refl);
    if (n.de !== null) out.de = np(n.de);
    // 3.x: iya opening a vocative (3.0:G129), a title (3.2:G145), gagu + the maker (3.0:G136)
    if (t[n.start]?.word?.lower === 'iya') out.iya = lw(n.start);
    if (n.title !== undefined) out.title = lw(n.title);
    if (n.maker !== undefined) out.maker = { gagu: lw(n.maker.start - 1), np: np(n.maker) };
    if (n.and !== undefined) out.and = { linker: lw(n.and.linker), np: np(n.and.np) };
    if (n.relative !== null) {
      out.relative = clause(n.relative);
      if (isPunct(n.relative.end - 1, ',') || isPunct(n.relative.end, ','))
        out.relativeComma = isPunct(n.relative.end - 1, ',');
    }
    return out;
  };

  const pred = (p: Predicate): LPredicate => {
    const one = (q: Predicate): LPredicate => {
      switch (q.kind) {
        case 'adj': {
          let k = q.start;
          const tonsi = q.tonsi === null ? undefined : lw(q.tonsi);
          if (q.tonsi !== null) k += 1;
          const degree = q.degree === null ? undefined : lw(q.degree);
          if (q.degree !== null) k = q.degree + 1;
          return {
            kind: 'adj',
            ...(tonsi === undefined ? {} : { tonsi }),
            ...(degree === undefined ? {} : { degree }),
            adj: lw(k),
          };
        }
        case 'np':
          return q.np === null || q.np === undefined
            ? { kind: 'gap' }
            : { kind: 'np', np: np(q.np) };
        case 'pp':
          return {
            kind: 'pp',
            prep: lw(q.prep ?? q.start),
            np: q.np === null || q.np === undefined ? null : np(q.np),
          };
        case 'adv':
          return { kind: 'adv', word: lw(q.start) };
        case 'kiword':
          return {
            kind: 'kiword',
            word: lw(q.start),
            ...(q.end > q.start + 1 ? { adj: lw(q.end - 1) } : {}),
          };
      }
    };
    const head0 = one(p.parts?.[0] ?? p);
    const head =
      p.ne !== undefined && (head0.kind === 'adj' || head0.kind === 'np' || head0.kind === 'pp')
        ? { ...head0, ne: lw(p.ne) }
        : head0;
    const rest = (p.parts ?? []).slice(1).map(one);
    if (rest.length > 0 && head.kind !== 'adv' && head.kind !== 'kiword' && head.kind !== 'gap')
      return { ...head, and: rest };
    return head;
  };

  const adjunct = (a: Adjunct): LAdjunct => {
    switch (a.kind) {
      case 'pp':
        return { kind: 'pp', word: lw(a.head), np: a.np === null ? null : np(a.np) };
      case 'la':
        return {
          kind: 'la',
          ...(a.degree === undefined ? {} : { degree: lw(a.degree) }),
          ...(a.adj === undefined ? {} : { adj: lw(a.adj) }),
        };
      case 'comparison':
        return { kind: 'tamo', np: a.np === null ? null : np(a.np) };
      case 'simile':
        return {
          kind: 'gase',
          np: a.np === null ? null : np(a.np),
          ...(a.adj === undefined ? {} : { adj: lw(a.adj) }),
        };
      case 'chain':
        return { kind: 'chain', ...(a.clause === null ? {} : { clause: body(a.clause) }) };
      case 'kiword':
      case 'time':
      case 'times':
      case 'place':
      case 'manner':
      case 'cause':
      case 'purpose':
      case 'iteration':
        return { kind: 'adv', word: lw(a.head) };
      case 'measure':
        return a.np !== null && a.np.start === a.start
          ? { kind: 'measure', np: np(a.np) }
          : { kind: 'measure', word: lw(a.head), np: a.np === null ? null : np(a.np) };
    }
  };

  function emptyLClause(): LClause {
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

  /** A clause's body: subject … closing (no edges). */
  function body(c: Clause): LClause {
    const out = emptyLClause();
    if (c.kiFront !== null) out.kiFront = lw(c.kiFront);
    if (c.subject !== null) out.subject = np(c.subject);
    else if (t[c.start]?.word?.lower === 'yava') out.subject = 'hortative';
    out.ops = c.ops
      .filter((o) => o.slot !== 'NEGATION' || c.verb === null || o.at < c.verb)
      .map((o) => lw(o.at));
    const v = c.verb;
    switch (c.predKind) {
      case 'verb':
        if (v !== null) out.pred = { kind: 'verb', verb: lw(v) };
        break;
      case 'copula':
      case 'become':
        if (v !== null)
          out.pred = {
            kind: 'copula',
            cop: lw(v),
            predicate: c.predicate === null ? { kind: 'gap' } : pred(c.predicate),
          };
        else if (c.predicate !== null)
          out.pred = { kind: 'bare-adj', predicate: pred(c.predicate) };
        break;
      case 'existential':
        if (v !== null && c.object !== null)
          out.pred = { kind: 'exist', miyo: lw(v), np: np(c.object) };
        // a subject and miyo with nothing after it: it exists (3.0:G132)
        else if (v !== null) out.pred = { kind: 'exist', miyo: lw(v) };
        break;
      case 'passive':
        if (v !== null && c.innerVerb !== null)
          out.pred = {
            kind: 'passive',
            gome: lw(v),
            verb: lw(c.innerVerb),
            ...(c.agent === null
              ? {}
              : { agent: { gagu: lw(c.agent.start - 1), np: np(c.agent) } }),
          };
        break;
      case 'valency':
        if (v !== null && c.actor !== null && c.innerVerb !== null) {
          const isCop = t[c.innerVerb]?.word?.readings.some((r) => r.pos === 'copula') === true;
          out.pred = {
            kind: 'valency',
            op: lw(v),
            actor: np(c.actor),
            actorOps: c.actorOps.map((o) => lw(o.at)),
            verb: lw(c.innerVerb),
            ...(isCop
              ? {
                  cop: lw(c.innerVerb),
                  predicate: c.predicate === null ? { kind: 'gap' } : pred(c.predicate),
                }
              : {}),
          };
        }
        break;
      case 'bare-adjective':
        if (c.predicate !== null) out.pred = { kind: 'bare-adj', predicate: pred(c.predicate) };
        break;
      case 'none':
        if (c.predicate !== null) out.pred = { kind: 'bare-adj', predicate: pred(c.predicate) };
        break;
    }
    if (c.recipient !== null) out.recipient = np(c.recipient);
    if (c.object !== null && c.predKind !== 'existential') out.object = np(c.object);
    if (c.objectClause !== null) out.objectClause = clause(c.objectClause);
    out.adjuncts = [...c.adjuncts]
      .sort((a, b) => a.start - b.start)
      .map((a) => ({ ...adjunct(a), ...(a.commaBefore === true ? { commaBefore: true } : {}) }));
    if (c.closingComma === true) out.closingComma = true;
    if (c.trailing !== undefined) out.trailing = c.trailing.map(lw);
    // adjective sidu VERB (2.5:G111) is kept on the predicate
    const chain = c.subordinates.find(
      (x) => x.kind === 'chain' && x.linker !== null && t[x.linker]?.word?.lower === 'sidu',
    );
    if (chain !== undefined && out.pred.kind === 'copula' && out.pred.predicate.kind === 'adj') {
      const sb = emptyLClause();
      if (chain.verb !== null) sb.pred = { kind: 'verb', verb: lw(chain.verb) };
      if (chain.object !== null) sb.object = np(chain.object);
      out.pred.predicate.sidu = sb;
    }
    for (const cl of c.closing) {
      if (cl.slot === 'QUESTION') out.ki = true;
      else out.closing.push(lw(cl.at));
    }
    return out;
  }

  /** A whole clause: its linker, edges, body and the clauses joined to it. */
  function clause(c: Clause): LClause {
    const out = body(c);
    if (c.scope !== undefined) out.scope = lw(c.scope);
    if (c.linker !== null && !isPunct(c.linker)) {
      out.linker = lw(c.linker);
      out.linkerComma = isPunct(c.linker + 1, ',');
    }
    // edges before the subject
    for (const f of c.frame) {
      const item = c.frameItems?.find((x) => x.start === f);
      if (item !== undefined) {
        const a: LAdjunct =
          item.prep !== undefined
            ? {
                kind: 'pp',
                word: lw(item.prep),
                np: item.np === null || item.np === undefined ? null : np(item.np),
              }
            : {
                kind: 'measure',
                np: item.np === null || item.np === undefined ? null : np(item.np),
              };
        out.frame.push({ adjunct: a, comma: isPunct(item.end, ',') });
        continue;
      }
      // X krotiapo X: one after another (3.0:G140)
      if (t[f + 1]?.word?.lower === 'krotiapo' && t[f + 2]?.word?.lower === t[f]?.word?.lower) {
        out.frame.push({
          adjunct: { kind: 'distributive', word: lw(f) },
          comma: isPunct(f + 3, ','),
        });
        continue;
      }
      let e = f + 1;
      while (role(e) === 'FRAME' && !isPunct(e)) e += 1;
      const span = e - f;
      const a: LAdjunct =
        span === 1
          ? { kind: 'adv', word: lw(f) }
          : t[f]?.word?.lower === 'la'
            ? { kind: 'la', adj: lw(f + 1) }
            : { kind: 'pp', word: lw(f), np: null };
      if (a.kind === 'pp' && span > 1) {
        // the phrase's noun phrase, word by word: keep it as one noun phrase of its words
        const words = Array.from({ length: span - 1 }, (_, i) => lw(f + 1 + i));
        const head = words[words.length - 1];
        if (head !== undefined)
          a.np = {
            kind: 'noun',
            head,
            adjectives: [],
            ...(words.length > 1 ? { det: words[0] } : {}),
          };
        if (words.length > 2)
          a.np = {
            kind: 'noun',
            head: words[words.length - 1] ?? head ?? lw(f),
            adjectives: words.slice(1, -1).map((adj) => ({ adj })),
            det: words[0] ?? lw(f),
          };
      }
      out.frame.push({ adjunct: a, comma: isPunct(e, ',') });
    }
    if (c.topic !== null) out.topic = np(c.topic);
    if (c.vocative !== null && c.vocative.start < (c.subject?.start ?? c.verb ?? c.end))
      out.vocativeBefore = np(c.vocative);
    else if (c.vocative !== null) out.vocative = np(c.vocative);
    // iya + a noun phrase opening the sentence (3.0:G129)
    const address = c.address?.[0];
    if (address !== undefined && out.vocativeBefore === undefined) {
      // standing alone (Iya Lumimare!), it is the sentence's vocative
      if (c.predKind === 'none' && c.subject === null && c.verb === null)
        out.vocative = np(address);
      else out.vocativeBefore = np(address);
    }
    for (const sub of c.subordinates) {
      if (sub.kind === 'chain') continue;
      const lc = clause(sub);
      if (
        sub.start < c.start ||
        (c.subject !== null && sub.start < c.subject.start) ||
        (c.subject === null && c.verb !== null && sub.start < c.verb && sub.kind !== 'coordinate')
      ) {
        out.before.push({ clause: lc, comma: isPunct(sub.end, ',') || isPunct(sub.end - 1, ',') });
      } else {
        const sep =
          sub.linker === null ? sub.start - 1 : isPunct(sub.linker) ? sub.linker : sub.linker - 1;
        const punct = isPunct(sep) ? t[sep]?.text : undefined;
        out.after.push({
          clause: lc,
          comma: punct !== undefined,
          ...(punct === undefined ? {} : { punct }),
        });
      }
    }
    return out;
  }

  // interjections before the clause
  const main = s.clauses[0];
  const out: LSentence = { main: main === undefined ? body({} as Clause) : clause(main), end: '' };
  for (let k = 0; k < t.length; k++) {
    if (role(k) !== 'INTERJECTION') continue;
    if (main !== undefined && k > (main.subject?.start ?? main.verb ?? main.start)) continue;
    out.main.interjections.push({ word: lw(k), comma: isPunct(k + 1, ',') });
  }
  const last = [...t].reverse().find((x) => x.kind === 'punct' && /[.!?]/.test(x.text));
  // ki and the attitude words at the end of the sentence belong to the main clause (2.5:G89)
  // the clause that ends the sentence: the last joined clause, or the object clause, all the way down
  const endClause = (c: LClause): LClause => {
    const a = c.after[c.after.length - 1]?.clause;
    if (a !== undefined) return endClause(a);
    if (c.objectClause !== undefined && c.adjuncts.length === 0 && c.closing.length === 0 && !c.ki)
      return endClause(c.objectClause);
    return c;
  };
  const tail = endClause(out.main);
  if (
    tail !== out.main &&
    (tail.ki || tail.closing.length > 0) &&
    !out.main.ki &&
    out.main.closing.length === 0
  ) {
    out.main.ki = tail.ki;
    out.main.closing = tail.closing;
    if (tail.closingComma === true) out.main.closingComma = true;
    tail.ki = false;
    tail.closing = [];
    delete tail.closingComma;
  }
  const lastAny = [...t].reverse().find((x) => x.kind === 'punct' && /[.!?…]/.test(x.text));
  out.end =
    lastAny === undefined
      ? ''
      : lastAny.text.includes('?')
        ? '?'
        : lastAny.text.includes('!')
          ? '!'
          : lastAny.text === '…'
            ? '…'
            : '.';
  void last;
  // a verse line that ends on a comma (it goes on in the next line)
  if (t[t.length - 1]?.kind === 'punct' && t[t.length - 1]?.text === ',') out.end = ',';
  return out;
}
