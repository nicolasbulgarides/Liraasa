/**
 * The strict checker (2.5, ADR-0020): one line of Liraasa in, every sentence
 * parsed, every finding with its rule, and an interlinear gloss out.
 *
 * Used by the grammar editor and by the translator alike. Nothing exempts a
 * sentence: no album reading, earlier approval or author flag makes a failing
 * sentence pass (2.5:G87). What the author has not ruled is reported as
 * `unruled`, never passed or failed.
 */
import { buildIndex, type GrammarSource, type Index } from './lexicon';
import { SentenceParser } from './parser';
import { readWord } from './reader';
import type { Finding, GlossRow, Reading, Role, SentenceResult, Token } from './types';

const WORD = /[A-Za-zÀ-ÿ]+(?:-[A-Za-zÀ-ÿ]+)*/y;
const PUNCT = /[,.;:!?…—–"“”'‘’()[\]]/y;

export interface LineResult {
  line: string;
  sentences: SentenceResult[];
  /** Every finding of the line, with character offsets. */
  findings: (Finding & { start: number; end: number; sentence: number })[];
  ok: boolean;
}

export interface Checker {
  index: Index;
  checkLine(line: string): LineResult;
  checkSentence(text: string, offset?: number): SentenceResult;
}

/** Split a line into tokens with offsets. */
export function tokenize(line: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < line.length) {
    const c = line[i] ?? '';
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }
    WORD.lastIndex = i;
    const m = WORD.exec(line);
    if (m !== null) {
      out.push({ kind: 'word', text: m[0], start: i, end: i + m[0].length });
      i += m[0].length;
      continue;
    }
    PUNCT.lastIndex = i;
    const p = PUNCT.exec(line);
    // a run of dots is one ellipsis
    if (p !== null) {
      let text = p[0];
      if (text === '.' && line.slice(i, i + 3) === '...') text = '...';
      out.push({ kind: 'punct', text, start: i, end: i + text.length });
      i += text.length;
      continue;
    }
    out.push({ kind: 'punct', text: c, start: i, end: i + 1 });
    i += 1;
  }
  return out;
}

/**
 * Sentences of a line: split after . ! ? … (and an utterance dash " — "), a
 * direct quotation read as its own sentence (2.3:G83), and a lone tense
 * opening a passage (Po —, 0.8:R4) set apart.
 */
function sentencesOf(tokens: Token[]): { tokens: Token[]; quote: boolean }[] {
  const out: { tokens: Token[]; quote: boolean }[] = [];
  let cur: Token[] = [];
  let inQuote = false;
  let quote: Token[] = [];
  const flush = (): void => {
    if (cur.some((t) => t.kind === 'word')) out.push({ tokens: cur, quote: false });
    cur = [];
  };
  let afterColon = false;
  let mention = false;
  for (const t of tokens) {
    const opening = t.kind === 'punct' && (t.text === '“' || (t.text === '"' && !inQuote));
    if (opening && afterColon) {
      inQuote = true;
      quote = [];
      continue;
    }
    // quotation marks around a word mentioned (ne "juba", nara "donu"): the word is a mention
    if (t.kind === 'punct' && /^["“”]$/.test(t.text) && !inQuote) {
      mention = !mention;
      continue;
    }
    if (mention && t.kind === 'word') {
      cur.push({ ...t, quoted: true });
      continue;
    }
    if (inQuote) {
      if (t.kind === 'punct' && (t.text === '”' || t.text === '"')) {
        inQuote = false;
        // the quotation is its own sentence or sentences; its place is marked
        for (const s of sentencesOf(quote)) out.push({ tokens: s.tokens, quote: true });
        cur.push({ kind: 'punct', text: '«q»', start: t.start, end: t.end });
        continue;
      }
      quote.push(t);
      continue;
    }
    afterColon = t.kind === 'punct' && t.text === ':';
    if (t.kind === 'punct' && t.text === '/') {
      flush();
      continue;
    }
    if (t.kind === 'punct' && (t.text === '—' || t.text === '–')) {
      // an utterance dash after a finished sentence, or a lone tense frame (Po —)
      const words = cur.filter((x) => x.kind === 'word');
      if (words.length === 1 && /^(po|futu)$/i.test(words[0]?.text ?? '')) {
        cur = [];
        continue;
      }
      const prev = cur[cur.length - 1];
      if (prev === undefined || (prev.kind === 'punct' && /[.!?…]/.test(prev.text))) {
        flush();
        continue;
      }
      // an interrupted sentence ends with its dash
      cur.push(t);
      flush();
      continue;
    }
    cur.push(t);
    if (t.kind === 'punct' && /^[.!?…]+$/.test(t.text)) flush();
  }
  if (inQuote) cur.push(...quote);
  flush();
  return out;
}

const REALISED: Partial<Record<Role, Reading['pos'][]>> = {
  VERB: ['verb', 'valency', 'passive'],
  COPULA: ['copula'],
  SUBJECT: [
    'pron',
    'noun',
    'name',
    'det',
    'quant',
    'num',
    'ord',
    'adj',
    'degree',
    'kiword',
    'owner',
    'refl',
    'colour',
    'sign',
  ],
  OBJECT: [
    'pron',
    'noun',
    'name',
    'det',
    'quant',
    'num',
    'ord',
    'adj',
    'degree',
    'kiword',
    'owner',
    'refl',
    'colour',
    'sign',
  ],
  PREDICATE: [
    'adj',
    'noun',
    'pron',
    'det',
    'degree',
    'prep',
    'placeAdv',
    'timeAdv',
    'kiword',
    'clauseAdv',
    'colour',
    'owner',
  ],
  ADJUNCT: [
    'prep',
    'side',
    'la',
    'adj',
    'degree',
    'timeAdv',
    'placeAdv',
    'mannerAdv',
    'kiword',
    'comparison',
    'noun',
    'pron',
    'det',
    'num',
    'name',
    'owner',
    'chain',
    'scope',
    'op',
    'quant',
  ],
};

function choose(token: Token, role: Role | ''): Reading | undefined {
  const rs = token.word?.readings ?? [];
  if (role === '') return rs[0];
  const want = REALISED[role];
  if (want !== undefined)
    for (const pos of want) {
      const r = rs.find((x) => x.pos === pos);
      if (r !== undefined) return r;
    }
  const bySlot = rs.find((r) => r.slot === role);
  return bySlot ?? rs[0];
}

function analysisOf(r: Reading | undefined, token: Token): string {
  if (r === undefined) return token.word?.problem?.kind ?? '';
  const sfx = (token.word?.suffixes ?? []).map((s) => ` + -${s}`).join('');
  const names: Record<string, string> = {
    n: 'noun',
    an: 'ascended noun',
    nn: 'negative noun',
    v: 'verb',
    na: 'negative adjective',
    a: 'adjective',
    aa: 'ascended adjective',
  };
  if (r.root !== undefined && r.role !== undefined)
    return `${r.root} (${names[r.role] ?? r.role})${token.word?.prefix === undefined ? '' : ` + ${token.word.prefix}`}${sfx}`;
  if (r.root !== undefined) return `${r.root} ${r.detail ?? ''}${sfx}`.trim();
  return `${r.form} (${r.slot?.toLowerCase() ?? r.detail ?? r.pos})${sfx}`;
}

export function createChecker(source: GrammarSource): Checker {
  const ix = buildIndex(source);
  const p = source.rules;
  // the severities the reference's self_check gives (a form whose slot is unused: warn)
  const selfCheck =
    (source.ref as unknown as { self_check?: { severity: string; source: string }[] }).self_check ??
    [];
  const unusedSeverity = (selfCheck.find((r) => r.source === '0.8:R2')?.severity ??
    'warn') as Finding['severity'];

  function checkSentence(text: string, offset = 0, preTokens?: Token[]): SentenceResult {
    const base = preTokens ?? tokenize(text);
    const firstAt = base.findIndex((t) => t.kind === 'word');
    const tokens: Token[] = base.map((t, k) => {
      if (t.kind !== 'word') return t;
      const capital = /^[A-ZÀ-Ý]/.test(t.text);
      return {
        ...t,
        capital,
        word: readWord(ix, t.text, { capital, first: k === firstAt, quoted: t.quoted === true }),
      };
    });
    const parser = new SentenceParser(ix, tokens);
    const parsed = parser.parse();
    const findings: Finding[] = [...parsed.findings];
    const add = (
      rule: string,
      message: string,
      at: number[],
      severity: Finding['severity'] = 'error',
      fix?: string,
    ): void => {
      findings.push({ rule, message, at, severity, ...(fix === undefined ? {} : { fix }) });
    };
    const w = (k: number): string => tokens[k]?.word?.lower ?? tokens[k]?.text ?? '';
    const words = tokens.map((t, k) => ({ t, k })).filter((x) => x.t.kind === 'word');
    const main = parsed.clauses[0];

    // ---------------------------------------------------------- the words
    for (const { t, k } of words) {
      const a = t.word;
      if (a?.problem === undefined) {
        if (a?.readings.every((r) => r.source === 'image-predicted') === true)
          add(
            '2.5:G124',
            `${t.text} is a predicted image-compound form (${a.readings[0]?.gloss ?? ''}): prefer a listed word`,
            [k],
            'note',
          );
        if (a?.readings.some((r) => r.detail === 'unconfirmed') === true)
          add(
            'names',
            `${t.text} is read as a name (not a known name or a word of Liraasa)`,
            [k],
            'note',
          );
        continue;
      }
      switch (a.problem.kind) {
        case 'unknown':
          add('hard_rules[0]', `${t.text}: not a word of Liraasa`, [k]);
          break;
        case 'unused':
          add(
            '0.8:R2',
            `${t.text}: the ${a.problem.role} form of ${a.problem.root} is an unused slot; only listed forms have a meaning, and a slot is filled only by an approved change`,
            [k],
            unusedSeverity,
          );
          break;
        case 'legacy':
          add(
            '1.0:G19',
            `${t.text} is an older spelling: ${a.problem.to}${a.problem.edition === null ? '' : ` (since ${a.problem.edition})`}`,
            [k],
            'warn',
            a.problem.to,
          );
          break;
        case 'hyphenated-fraction':
          add(
            '2.5:G97',
            `a fraction is written with spaces: ${t.text.replace(/-de-/, ' de ')}`,
            [k],
            'error',
            t.text.replace(/-de-/, ' de '),
          );
          break;
      }
    }
    const loose = parsed.unplaced.filter(
      (k) => tokens[k]?.word?.problem === undefined && !findings.some((f) => f.at.includes(k)),
    );
    for (let n = 0; n < loose.length; ) {
      let m = n;
      while (m + 1 < loose.length && (loose[m + 1] ?? 0) - (loose[m] ?? 0) <= 2) m += 1;
      const run = loose.slice(n, m + 1);
      add(
        '2.5:G126',
        `${run.map(w).join(' ')}: ${run.length === 1 ? 'this word has' : 'these words have'} no place in the clause template`,
        run,
      );
      n = m + 1;
    }

    // ------------------------------------------------------------ -ri, -ti
    // -ri never goes on a bare adjective (2.5:G101)
    for (const { t, k } of words) {
      const rs = t.word?.readings ?? [];
      if (
        !(t.word?.suffixes ?? []).includes('ri') ||
        rs.length === 0 ||
        !rs.every((r) => r.pos === 'adj')
      )
        continue;
      const prev = tokens[k - 1]?.word?.readings ?? [];
      if (!prev.some((r) => r.pos === 'det' || r.pos === 'quant' || r.pos === 'num'))
        add(
          '2.5:G101',
          `-ri on a bare adjective: ${t.text} (an adjective takes -ri only standing as a noun after a determiner)`,
          [k],
        );
    }
    for (const [k, r] of parsed.roles) {
      const sfx = tokens[k]?.word?.suffixes ?? [];
      if (r.role === 'VERB' && sfx.includes('ri'))
        add('2.5:G101', `-ri never goes on a verb: ${w(k)}`, [k]);
    }

    // ----------------------------------------------------------- questions
    const last =
      [...tokens].reverse().find((t) => t.kind === 'punct' && /[.!?…]/.test(t.text))?.text ?? '';
    const endIdx = (() => {
      // the last word of the sentence before a comma-set vocative
      let k = tokens.length - 1;
      while (k >= 0 && tokens[k]?.kind === 'punct') k -= 1;
      if (main?.vocative !== null && main?.vocative !== undefined) {
        k = main.vocative.start - 1;
        while (k >= 0 && tokens[k]?.kind === 'punct') k -= 1;
      }
      return k;
    })();
    const endsKi = w(endIdx) === 'ki';
    const first = words[0]?.k ?? 0;
    const firstWord = w(first);
    const hasPred = parsed.clauses.some((c) => c.predKind !== 'none');
    const kiWords = words.filter(
      (x) => x.t.word?.readings.some((r) => r.pos === 'kiword') === true,
    );
    const always = p.question.always_ki;
    const degreeKi = (k: number): boolean =>
      w(k) === always.degree &&
      (tokens[k + 1]?.word?.readings.some((r) => r.pos === 'adj') ?? false);
    const detKi = (k: number): boolean => always.determiners.includes(w(k));
    let type: SentenceResult['type'] = 'statement';
    if (last.includes('?') || endsKi) type = 'question';
    const echoNP = main?.subject ?? null;
    if (type === 'question' && endsKi && !hasPred && echoNP !== null) {
      const np = echoNP;
      if (np.relative !== null || (np.de?.relative ?? null) !== null)
        add(
          '2.5:G92',
          'echo ki follows only a single word or a bare noun phrase; with a relative clause this needs a verb',
          [np.start],
        );
    }
    if (type === 'question') {
      if (!endsKi) {
        if (!hasPred && words.length <= 2)
          add(
            String(p.question.fragment ?? '2.5:G91'),
            'a fragment question ends in ki',
            [first],
            'error',
            `${firstWord} ki?`,
          );
        else if (firstWord === 'raho')
          add('2.3:G74', 'a question opened by raho ends in ki', [first], 'error', 'ki');
        else if (kiWords.some((x) => detKi(x.k) || degreeKi(x.k)))
          add(
            always.ruling,
            `a question with ${kiWords.map((x) => w(x.k)).find((x) => always.determiners.includes(x) || x === always.degree) ?? 'ki-eli'} + a noun or a degree ki-modo always ends in ki (2.5:G88)`,
            kiWords.map((x) => x.k),
            'error',
            'ki',
          );
        else if (
          !(
            p.question.fronted_may_drop_ki.includes(firstWord) ||
            (firstWord === 'ki-nela' && w(first + 1) === 'de')
          )
        )
          add(
            '2.5:G88',
            kiWords.length > 0
              ? `a ki-word left in its answer's place needs the final ki`
              : 'a question ends in ki',
            [kiWords[0]?.k ?? first],
            'error',
            'ki',
          );
      }
    } else if (last.includes('!')) {
      type = kiWords.some((x) => p.question.exclamation_without_ki.words.includes(w(x.k)))
        ? 'exclamation'
        : 'exclamation';
    }
    // ki is the last word; only a comma-set vocative may follow (2.5:G89, 0.8:G4)
    for (const { k } of words) {
      if (w(k) !== 'ki' || k === endIdx) continue;
      const next = tokens[k + 1];
      if (next?.kind === 'punct' && (next.text === ':' || next.text === ',')) {
        if (next.text === ',' && main?.vocative !== null) continue;
        if (next.text === ':') continue;
      }
      add(
        '2.5:G89',
        'ki is the last word of the sentence (only a vocative set off by a comma may follow)',
        [k],
      );
    }
    // attitude words close the clause (1.0:G22, 2.5:G89)
    const onlyAttitude = words.every(
      (x) => x.t.word?.readings.some((r) => r.pos === 'attitude') === true,
    );
    for (const [k, r] of parsed.roles) {
      if (r.role !== 'ATTITUDE' || onlyAttitude) continue;
      let n = k + 1;
      while (
        n < tokens.length &&
        (parsed.roles.get(n)?.role === 'ATTITUDE' || parsed.roles.get(n)?.role === 'QUESTION')
      )
        n += 1;
      const rest = tokens.slice(n);
      const ok =
        rest.every((t) => t.kind === 'punct') ||
        (rest[0]?.text === ',' && main?.vocative !== null) ||
        rest[0]?.text === ':' ||
        rest[0]?.text === ';';
      if (!ok && n <= endIdx)
        add('1.0:G22', `${w(k)} is an attitude word: it closes its clause`, [k]);
    }

    // ------------------------------------------------------------ commands
    const hasFisa = words.some((x) => w(x.k) === 'fisa');
    // 3.0:G135 rules what a command carries: ne, reve, loki and adjuncts, never tense, a modal or an evidential
    const allowed = p.command.operators;
    if (
      main !== undefined &&
      main.subject === null &&
      main.kiFront === null &&
      (allowed !== undefined || !main.ops.some((o) => o.slot === 'TENSE')) &&
      main.predKind !== 'none' &&
      main.predKind !== 'existential'
    ) {
      const hortative = words.some((x) => w(x.k) === p.command.hortative);
      if (last.includes('!') || hasFisa || hortative) {
        type = 'command';
        if (allowed !== undefined) {
          const never = main.ops.filter((o) => allowed.never.includes(o.slot));
          if (never.length > 0)
            add(
              allowed.ruling,
              `a command carries no tense, modal or evidential: ${never.map((o) => w(o.at)).join(' ')}`,
              never.map((o) => o.at),
            );
          const other = main.ops.filter(
            (o) => !allowed.never.includes(o.slot) && !allowed.allowed_words.includes(w(o.at)),
          );
          if (other.length > 0)
            add(
              'I-42',
              `whether a command may carry ${other.map((o) => w(o.at)).join(' ')} is not ruled: 3.0:G135 names ne, reve and loki`,
              other.map((o) => o.at),
              'unruled',
            );
        } else {
          const extra = main.ops.filter((o) => o.slot !== 'NEGATION');
          if (extra.length > 0)
            add(
              'I-42',
              'which operators a command may carry is not ruled yet',
              extra.map((o) => o.at),
              'unruled',
            );
          if (hortative && main.frame.length > 0)
            add(
              'I-42',
              'whether yava stands after a FRAME is not ruled yet',
              main.frame,
              'unruled',
            );
        }
      }
    }
    if (words.some((x) => w(x.k) === 'pifu')) type = type === 'question' ? type : 'wish';
    if (!hasPred && type === 'statement') type = 'fragment';

    // ------------------------------------------------------------- tonsi
    for (const { k } of words) {
      if (w(k) !== 'tonsi') continue;
      const role = parsed.roles.get(k)?.role;
      if (role !== 'LINKER' && role !== 'PREDICATE')
        add(
          '2.5:G117',
          'tonsi is "therefore" opening a clause (with a comma), or "so" before a predicate adjective after a copula',
          [k],
        );
    }

    // ------------------------------------------------------------- topics
    if (
      main?.topic !== null &&
      main?.topic !== undefined &&
      main.subject === null &&
      main.predKind !== 'none'
    )
      add(
        '2.5:G119',
        'a topic that is the subject is picked up by a pronoun',
        [main.topic.start],
        'error',
        'saivo',
      );

    // the same finding once
    const seen = new Set<string>();
    const unique = findings.filter((f) => {
      const key = `${f.rule}|${f.at.join(',')}|${f.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const gloss: GlossRow[] = words.map(({ t, k }) => {
      const r = parsed.roles.get(k);
      const role = r?.role ?? '';
      const reading = choose(t, role);
      const fs = unique.filter((f) => f.at.includes(k));
      const flags: string[] = [];
      if (reading?.source === 'image-predicted') flags.push('predicted image-compound form');
      if (reading?.source === 'prefix' && reading.detail === 'compositional')
        flags.push('compositional motion prefix');
      if (fs.some((f) => f.severity === 'unruled')) flags.push('unruled');
      if (t.word?.problem !== undefined) flags.push(t.word.problem.kind);
      return {
        word: t.text,
        analysis: analysisOf(reading, t),
        gloss: reading?.gloss ?? '',
        role,
        clause: r?.clause ?? 0,
        rules: [...new Set(fs.map((f) => f.rule))],
        flags,
      };
    });
    const roleAt = tokens.map((_, k) => parsed.roles.get(k)?.role ?? '');
    return {
      text,
      offset,
      tokens,
      findings: unique,
      gloss,
      type,
      clauses: parsed.clauses,
      roleAt,
    };
  }

  function checkLine(line: string): LineResult {
    const tokens = tokenize(line);
    const sentences = sentencesOf(tokens).map((s) => {
      const startChar = s.tokens[0]?.start ?? 0;
      const endChar = s.tokens[s.tokens.length - 1]?.end ?? startChar;
      return checkSentence(line.slice(startChar, endChar), startChar, s.tokens);
    });
    const findings = sentences.flatMap((s, n) =>
      s.findings.map((f) => {
        const ts = f.at.map((k) => s.tokens[k]).filter((t): t is Token => t !== undefined);
        return {
          ...f,
          start: ts.length === 0 ? s.offset : Math.min(...ts.map((t) => t.start)),
          end: ts.length === 0 ? s.offset : Math.max(...ts.map((t) => t.end)),
          sentence: n,
        };
      }),
    );
    return { line, sentences, findings, ok: !findings.some((f) => f.severity === 'error') };
  }

  return { index: ix, checkLine, checkSentence: (text, offset) => checkSentence(text, offset) };
}
