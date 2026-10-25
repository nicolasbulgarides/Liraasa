/**
 * The English → Liraasa translator (2.5, ADR-0020), a pipeline in which each
 * stage can be checked:
 *
 *   1 English → meaning frame        english.ts (rule-based; an LLM may fill
 *                                     the frame instead, never the Liraasa)
 *   2 frame → Liraasa structure      toLiraasa.ts, by the 2.5 rulings
 *   3 words from the dictionary only lexchoice.ts; a gap is reported
 *   4 the strict checker             src/core/grammar; on a failure another
 *                                     valid rendering is tried, and if none
 *                                     passes the reasons are returned, not the
 *                                     broken Liraasa
 *   5 back-translation               the output is parsed back to a frame and
 *                                     compared with the one it was built from
 *   6 the work shown                 an interlinear gloss, rule ids, flags
 */
import {
  createChecker,
  type Checker,
  type GlossRow,
  type GrammarSource,
  type SentenceResult,
} from '../grammar';
import { createEnglishReader, type EnglishData, type MeaningSentence } from './english';
import type { LClause, LNP, LSentence, LWord } from './frame';
import { fromParse } from './fromParse';
import { buildEnglishIndex } from './lexchoice';
import { realize } from './realize';
import { buildLSentence, type Built } from './toLiraasa';

export interface TranslateSource {
  grammar: GrammarSource;
  english: EnglishData;
  numerals: Record<string, string>;
  synonyms?: Record<string, string[]>;
}

export interface SentenceTranslation {
  english: string;
  /** null when no rendering passes the checker */
  liraasa: string | null;
  ok: boolean;
  frame: MeaningSentence;
  structure: LSentence | null;
  check: SentenceResult | null;
  gloss: GlossRow[];
  backTranslation: { english: string; matches: boolean; differences: string[] };
  /** gaps, unruled constructions, predicted forms, defaults chosen */
  flags: string[];
  gaps: Built['gaps'];
  alternatives: Record<string, LWord[]>;
  /** renderings tried and why each failed */
  tried: { liraasa: string; failures: string[] }[];
}

/** What a clause says, for comparing a frame with its parse: roles and words in order. */
export function signature(c: LClause): string[] {
  const out: string[] = [];
  const npSig = (n: LNP | undefined | null, role: string): void => {
    if (n === undefined || n === null) return;
    out.push(`${role}:${n.head.form}`);
    for (const a of n.adjectives) out.push(`${role}.adj:${a.adj.form}`);
    if (n.det !== undefined) out.push(`${role}.det:${n.det.form}`);
    if (n.num !== undefined) out.push(`${role}.num:${n.num.form}`);
    if (n.de !== undefined) npSig(n.de, `${role}.de`);
    if (n.relative !== undefined)
      for (const s of signature(n.relative)) out.push(`${role}.rel.${s}`);
  };
  if (c.subject === 'hortative') out.push('subject:yava');
  else npSig(c.subject, 'subject');
  for (const o of c.ops) out.push(`op:${o.form}`);
  const p = c.pred;
  if (p.kind === 'verb') out.push(`verb:${p.verb.form}`);
  else if (p.kind === 'copula') out.push(`copula:${p.cop.form}`);
  else if (p.kind === 'valency') {
    out.push(`valency:${p.op.form}`, `verb:${p.verb.form}`);
    npSig(p.actor, 'actor');
  } else if (p.kind === 'passive') out.push(`passive:${p.verb.form}`);
  else if (p.kind === 'exist') npSig(p.np, 'exists');
  npSig(c.recipient, 'recipient');
  npSig(c.object, 'object');
  if (c.objectClause !== undefined)
    for (const s of signature(c.objectClause)) out.push(`clause.${s}`);
  for (const w of c.closing) out.push(`closing:${w.form}`);
  if (c.ki) out.push('ki');
  return out;
}

export function createTranslator(src: TranslateSource): {
  checker: Checker;
  translate(english: string): SentenceTranslation[];
} {
  const checker = createChecker(src.grammar);
  const en = buildEnglishIndex(
    checker.index,
    src.synonyms ?? {},
    src.english.aliases,
    src.english.rule_words ?? {},
  );
  const reader = createEnglishReader(src.english, {
    isVerb: (l) => en.choose('verb', l).word !== null,
    isNoun: (l) => en.choose('noun', l).word !== null,
    isAdj: (l) => en.choose('adj', l).word !== null,
    isName: (w) => checker.index.names.has(w.toLowerCase()),
  });
  const ctx = { ix: checker.index, en, data: src.english, numerals: src.numerals };

  const glossText = (s: SentenceResult): string =>
    s.gloss
      .map((g) => (g.gloss.split(/[;(]/)[0] ?? g.word).trim())
      .filter((x) => x !== '')
      .join(' ');

  /** A whole sentence with a fixed Liraasa formula (3.0:G133): So be it. → Ola-modo pifu. */
  function formula(ms: MeaningSentence): SentenceTranslation | null {
    const key = ms.english
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const text = src.english.formulas?.[key];
    if (text === undefined) return null;
    const r = checker.checkLine(text);
    const s = r.sentences[0] ?? null;
    if (s === null || r.findings.some((f) => f.severity === 'error')) return null;
    return {
      english: ms.english,
      liraasa: text,
      ok: true,
      frame: ms,
      structure: fromParse(s),
      check: s,
      gloss: s.gloss,
      backTranslation: { english: glossText(s), matches: true, differences: [] },
      flags: ['a fixed liturgical formula (3.0:G133)'],
      gaps: [],
      alternatives: {},
      tried: [],
    };
  }

  function one(ms: MeaningSentence): SentenceTranslation {
    const fixed = formula(ms);
    if (fixed !== null) return fixed;
    const tried: SentenceTranslation['tried'] = [];
    // the renderings to try, the preferred first
    const variants: { lasting?: boolean; recipientAla?: boolean }[] = [
      {},
      { recipientAla: true },
      { lasting: false },
      { lasting: true },
    ];
    let first: Built | null = null;
    for (const v of variants) {
      const built = buildLSentence(ctx, ms, v);
      first ??= built;
      const text = realize(built.sentence);
      const r = checker.checkLine(text);
      const s = r.sentences[0] ?? null;
      const failures = r.findings
        .filter((f) => f.severity === 'error')
        .map((f) => `${f.rule}: ${f.message}`);
      // an English word that was not read: no listed word for it, or a construction the reader does not know
      for (const w of ms.unread) {
        const lw = w.toLowerCase();
        const listed =
          ['noun', 'verb', 'adj'].some((want) => en.choose(want as 'noun', lw).word !== null) ||
          reader.verbOf(lw) !== null ||
          reader.nounLemma(lw) !== null;
        failures.push(
          listed ? `could not read "${w}" in this construction` : `no listed word for "${w}"`,
        );
      }
      if (built.gaps.length > 0)
        failures.push(
          ...built.gaps.map(
            (g) =>
              `no listed ${g.want} for "${g.english}"${g.nearest.length > 0 ? `; nearest: ${g.nearest.map((w) => `${w.form} (${w.gloss ?? ''})`).join(', ')}` : ''}`,
          ),
        );
      if (failures.length > 0 || s === null) {
        tried.push({ liraasa: text, failures });
        continue;
      }
      // back-translate: parse the output to a frame and compare it with the one it was built from
      const back = fromParse(s);
      const want = signature(built.sentence.main);
      const got = signature(back.main);
      const differences = [
        ...want.filter((x) => !got.includes(x)).map((x) => `lost ${x}`),
        ...got.filter((x) => !want.includes(x)).map((x) => `gained ${x}`),
      ];
      const matches = differences.length === 0 && realize(back) === text;
      if (!matches) {
        tried.push({
          liraasa: text,
          failures: [
            `the back-translation differs: ${differences.join('; ') || 'the regenerated text differs'}`,
          ],
        });
        continue;
      }
      const flags = [
        ...built.flags,
        ...s.findings
          .filter((f) => f.severity !== 'error')
          .map((f) => `${f.severity} ${f.rule}: ${f.message}`),
        ...ms.unread.map((w) => `not read: "${w}"`),
      ];
      return {
        english: ms.english,
        liraasa: text,
        ok: true,
        frame: ms,
        structure: built.sentence,
        check: s,
        gloss: s.gloss,
        backTranslation: { english: glossText(s), matches: true, differences: [] },
        flags,
        gaps: [],
        alternatives: built.alternatives,
        tried,
      };
    }
    return {
      english: ms.english,
      liraasa: null,
      ok: false,
      frame: ms,
      structure: first?.sentence ?? null,
      check: null,
      gloss: [],
      backTranslation: { english: '', matches: false, differences: [] },
      flags: [...(first?.flags ?? []), ...ms.unread.map((w) => `not read: "${w}"`)],
      gaps: first?.gaps ?? [],
      alternatives: first?.alternatives ?? {},
      tried,
    };
  }

  return { checker, translate: (english) => reader.read(english).map(one) };
}
