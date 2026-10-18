/**
 * The grader (Learn Phase 3). Pure: an exercise and a response in, a verdict
 * and a diagnosis out.
 *
 * - Input is normalised (case, spaces, punctuation, stray accents).
 * - Every answer the data supports is accepted; a pre-1.0 spelling of the
 *   right word is "almost", with the current spelling shown.
 * - A near miss that is not a word is a typo ("almost"); a near miss that IS
 *   another word is a real error, because it means something else.
 * - Every error is named — wrong root, wrong form, word order, missing
 *   particle or word, extra word — and linked to the root card or the rule.
 * - English answers are graded on meaning: content words, with the data's
 *   own synonyms accepted.
 */
import { humanize } from './concepts';
import type { Exercise } from './exercises';
import { linkWord, words, type LinkContext } from './link';
import { editDistance, englishContent, normalize, typoBudget } from './text';
import type { LearnData, TokenLink } from './types';

export type Verdict = 'correct' | 'almost' | 'wrong';

export type ErrorKind =
  | 'typo'
  | 'old-spelling'
  | 'wrong-root'
  | 'wrong-form'
  | 'wrong-order'
  | 'missing-particle'
  | 'missing-word'
  | 'extra-word'
  | 'not-a-word'
  | 'wrong-choice'
  | 'wrong-part'
  | 'meaning-missing'
  /** The regular rule applied to a word that goes its own way (Ten Stars). */
  | 'rule-for-irregular'
  /** Right but for a doubled or single vowel, forgiven under lenient checking. */
  | 'vowel-length'
  /** Multiple choice where some, not all, of the right choices were picked. */
  | 'missed-choice'
  /** What the grammar checker says is wrong (The Loom). */
  | 'checker'
  /** Right, with the small words in another place the template allows. */
  | 'other-order'
  /** Grammatical, but the engine cannot tell whether it means the same. */
  | 'unverified';

export interface DiagnosisLink {
  kind: 'item' | 'concept';
  id: string;
}

export interface Diagnosis {
  kind: ErrorKind;
  message: string;
  expected?: string;
  got?: string;
  /** Where to look: a root card or a grammar concept. */
  link?: DiagnosisLink;
}

export interface Grade {
  verdict: Verdict;
  /** 0–1: how much of the answer was right. */
  score: number;
  /** The answer to show. */
  expected: string;
  diagnoses: readonly Diagnosis[];
  /** 1 again · 2 hard · 3 good · 4 easy, for the scheduler. */
  rating: 1 | 2 | 3 | 4;
}

export type Response =
  | { kind: 'choice'; id: string }
  | { kind: 'typed'; text: string }
  | { kind: 'order'; ids: readonly string[] }
  | { kind: 'pairs'; pairs: Readonly<Record<string, string>> }
  | { kind: 'multi'; ids: readonly string[] };

export interface GradeContext {
  data: LearnData;
  link: LinkContext;
}

/** Closed classes: leaving one out is a missing particle, not a missing word. */
const PARTICLE = new Set(['functionWord', 'correlative', 'discourseParticle', 'timeWord']);

const rating = (verdict: Verdict, fast: boolean): Grade['rating'] =>
  verdict === 'wrong' ? 1 : verdict === 'almost' ? 2 : fast ? 4 : 3;

function grade(
  verdict: Verdict,
  score: number,
  expected: string,
  diagnoses: Diagnosis[],
  fast: boolean,
): Grade {
  return { verdict, score, expected, diagnoses, rating: rating(verdict, fast) };
}

const itemLink = (id: string): DiagnosisLink => ({ kind: 'item', id });
const conceptLink = (id: string): DiagnosisLink => ({ kind: 'concept', id });

function meaningOf(data: LearnData, link: TokenLink): string {
  if (link.kind !== 'entry') return '';
  const ref = link.refs[0];
  const item = ref === undefined ? undefined : data.items.get(ref.id);
  if (item === undefined) return '';
  const form = item.forms.find((f) => f.slot === ref?.slot);
  return form?.meaningful === true ? form.gloss : item.meaning;
}

/* --------------------------------------------------------- one word */

/** Compare one written word with the expected one. Null when they match. */
function diagnoseWord(ctx: GradeContext, got: string, expected: string): Diagnosis | null {
  const g = normalize(got);
  const e = normalize(expected);
  if (g === e) return null;
  const want = linkWord(ctx.link, e);
  const have = linkWord(ctx.link, g);
  const wantRef = want.kind === 'entry' ? want.refs[0] : undefined;
  const wantId = wantRef?.id;

  if (have.kind === 'entry') {
    const ids = have.refs.map((r) => r.id);
    if (have.via === 'legacy' && wantId !== undefined && ids.includes(wantId)) {
      return {
        kind: 'old-spelling',
        message: `“${got}” is the pre-1.0 spelling; it is now “${expected}”.`,
        expected,
        got,
        link: itemLink(wantId),
      };
    }
    if (wantId !== undefined && ids.includes(wantId)) {
      const slot = have.refs.find((r) => r.id === wantId)?.slot;
      const wantSlot = wantRef?.slot;
      const what =
        slot !== undefined && wantSlot !== undefined && slot !== wantSlot
          ? `the ${humanize(slot)} form; this needs the ${humanize(wantSlot)} form`
          : 'the right word with the wrong ending';
      return {
        kind: 'wrong-form',
        message: `“${got}” is ${what}: “${expected}”.`,
        expected,
        got,
        link: wantSlot !== undefined ? conceptLink(`form:${wantSlot}`) : itemLink(wantId),
      };
    }
    return {
      kind: 'wrong-root',
      message: `“${got}” is a different word (“${meaningOf(ctx.data, have)}”). The answer is “${expected}”${wantId !== undefined ? ` (“${meaningOf(ctx.data, want)}”)` : ''}.`,
      expected,
      got,
      ...(wantId !== undefined ? { link: itemLink(wantId) } : {}),
    };
  }
  if (editDistance(g, e, typoBudget(e.length)) <= typoBudget(e.length)) {
    return {
      kind: 'typo',
      message: `Almost: check the spelling. It is “${expected}”.`,
      expected,
      got,
      ...(wantId !== undefined ? { link: itemLink(wantId) } : {}),
    };
  }
  return {
    kind: 'not-a-word',
    message: `“${got}” is not a word of Liraasa. The answer is “${expected}”.`,
    expected,
    got,
    ...(wantId !== undefined ? { link: itemLink(wantId) } : {}),
  };
}

function gradeWord(
  ctx: GradeContext,
  typed: string,
  accepted: readonly string[],
  fast: boolean,
): Grade {
  const first = accepted[0] ?? '';
  if (accepted.some((a) => normalize(a) === normalize(typed)))
    return grade('correct', 1, first, [], fast);
  // diagnose against the closest accepted answer
  const best = [...accepted].sort(
    (a, b) =>
      editDistance(normalize(typed), normalize(a)) - editDistance(normalize(typed), normalize(b)),
  )[0];
  const d = diagnoseWord(ctx, typed, best ?? first);
  const soft = d !== null && (d.kind === 'typo' || d.kind === 'old-spelling');
  return grade(
    soft ? 'almost' : 'wrong',
    soft ? 0.8 : 0,
    best ?? first,
    d === null ? [] : [d],
    false,
  );
}

/* ------------------------------------------------------- a sentence */

/** Longest common subsequence of two word lists, as index pairs. */
function lcs(a: readonly string[], b: readonly string[]): [number, number][] {
  const t = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      const row = t[i];
      if (row === undefined) continue;
      row[j] =
        a[i] === b[j]
          ? (t[i + 1]?.[j + 1] ?? 0) + 1
          : Math.max(t[i + 1]?.[j] ?? 0, row[j + 1] ?? 0);
    }
  }
  const out: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push([i, j]);
      i += 1;
      j += 1;
    } else if ((t[i + 1]?.[j] ?? 0) >= (t[i]?.[j + 1] ?? 0)) i += 1;
    else j += 1;
  }
  return out;
}

export function gradeSentence(
  ctx: GradeContext,
  typed: string,
  expected: string,
  fast = false,
): Grade {
  const got = words(typed).map((w) => w.text);
  const want = words(expected).map((w) => w.text);
  const g = got.map(normalize);
  const w = want.map(normalize);
  if (g.join(' ') === w.join(' ')) return grade('correct', 1, expected, [], fast);

  const diagnoses: Diagnosis[] = [];
  const sorted = (x: string[]): string => [...x].sort().join(' ');
  if (sorted(g) === sorted(w)) {
    diagnoses.push({
      kind: 'wrong-order',
      message:
        'All the right words, in the wrong order. Liraasa order is fixed by the clause template.',
      expected,
      got: typed,
      link: conceptLink('clause'),
    });
    return grade('wrong', 0.5, expected, diagnoses, false);
  }

  const matched = lcs(g, w);
  const usedG = new Set(matched.map(([i]) => i));
  const usedW = new Set(matched.map(([, j]) => j));
  const restG = g.map((x, i) => ({ x, i, raw: got[i] ?? x })).filter(({ i }) => !usedG.has(i));
  let soft = true;

  for (const [j, e] of w.entries()) {
    if (usedW.has(j)) continue;
    // pair the missing word with the closest leftover written word, if any is close
    let best: { x: string; i: number; raw: string } | undefined;
    let bestScore = Infinity;
    for (const r of restG) {
      const sameEntry = (() => {
        const a = linkWord(ctx.link, r.x);
        const b = linkWord(ctx.link, e);
        if (a.kind !== 'entry' || b.kind !== 'entry') return false;
        return a.refs.some((x) => b.refs.some((y) => y.id === x.id));
      })();
      const score = sameEntry ? 0 : editDistance(r.x, e, 4);
      if (score < bestScore) {
        bestScore = score;
        best = r;
      }
    }
    if (best !== undefined && bestScore <= Math.max(2, typoBudget(e.length))) {
      restG.splice(restG.indexOf(best), 1);
      const d = diagnoseWord(ctx, best.raw, want[j] ?? e);
      if (d !== null) {
        diagnoses.push(d);
        if (d.kind !== 'typo' && d.kind !== 'old-spelling') soft = false;
      }
      continue;
    }
    soft = false;
    const link = linkWord(ctx.link, e);
    const ref = link.kind === 'entry' ? link.refs[0] : undefined;
    const particle = ref !== undefined && PARTICLE.has(ref.namespace);
    diagnoses.push({
      kind: particle ? 'missing-particle' : 'missing-word',
      message: `Missing ${particle ? 'the particle' : 'the word'} “${want[j] ?? e}”${ref !== undefined ? ` (“${meaningOf(ctx.data, link)}”)` : ''}.`,
      expected: want[j] ?? e,
      ...(ref !== undefined ? { link: itemLink(ref.id) } : {}),
    });
  }
  for (const r of restG) {
    soft = false;
    const link = linkWord(ctx.link, r.x);
    diagnoses.push({
      kind: link.kind === 'unknown' ? 'not-a-word' : 'extra-word',
      message:
        link.kind === 'unknown'
          ? `“${r.raw}” is not a word of Liraasa.`
          : `“${r.raw}” does not belong in this sentence.`,
      got: r.raw,
    });
  }
  const score = matched.length / Math.max(1, w.length);
  return grade(soft ? 'almost' : 'wrong', score, expected, diagnoses, false);
}

/* --------------------------------------------------------- English */

/** English content words an exercise's items let the learner use instead. */
function synonymsFor(data: LearnData, ids: readonly string[]): Map<string, Set<string>> {
  const groups = new Map<string, Set<string>>();
  for (const id of ids) {
    const item = data.items.get(id);
    if (item === undefined) continue;
    const words = new Set(
      [
        item.meaning,
        ...item.synonyms,
        ...item.forms.filter((f) => f.meaningful).map((f) => f.gloss),
      ].flatMap(englishContent),
    );
    for (const w of words) groups.set(w, new Set([...(groups.get(w) ?? []), ...words]));
  }
  return groups;
}

export function gradeEnglish(
  data: LearnData,
  typed: string,
  accepted: readonly string[],
  itemIds: readonly string[],
  fast = false,
): Grade {
  const expected = accepted[0] ?? '';
  const want = englishContent(expected);
  const got = new Set(englishContent(typed));
  if (want.length === 0)
    return grade(
      normalize(typed) === normalize(expected) ? 'correct' : 'wrong',
      1,
      expected,
      [],
      fast,
    );
  const syn = synonymsFor(data, itemIds);
  const missed: string[] = [];
  for (const w of want) {
    const ok = got.has(w) || [...(syn.get(w) ?? [])].some((s) => got.has(s));
    if (!ok) missed.push(w);
  }
  const score = 1 - missed.length / want.length;
  const verdict: Verdict = score >= 0.75 ? 'correct' : score >= 0.45 ? 'almost' : 'wrong';
  const diagnoses: Diagnosis[] =
    missed.length === 0 || verdict === 'correct'
      ? []
      : [
          {
            kind: 'meaning-missing',
            message: `Your translation misses: ${missed.join(', ')}. A full answer: “${expected}”.`,
            expected,
            got: typed,
          },
        ];
  return grade(verdict, score, expected, diagnoses, fast && verdict === 'correct');
}

/* ------------------------------------------------------- dispatcher */

export function gradeExercise(
  ctx: GradeContext,
  ex: Exercise,
  response: Response,
  ms = Infinity,
): Grade {
  const fast = ms < 6000;
  const a = ex.answer;

  if (a.kind === 'choice') {
    const expected = ex.choices?.find((c) => c.id === a.correct)?.text ?? a.correct;
    if (response.kind !== 'choice') return grade('wrong', 0, expected, [], false);
    if (response.id === a.correct) return grade('correct', 1, expected, [], fast);
    const chosen = ex.choices?.find((c) => c.id === response.id);
    const item = ctx.data.items.get(response.id);
    const message =
      ex.type === 'formIdentify'
        ? `That is not the ${chosen?.text ?? response.id} form: it is the ${expected} form.`
        : item !== undefined
          ? `“${chosen?.text ?? ''}” is what “${item.spelling}” means. The answer is “${expected}”.`
          : `The answer is “${expected}”.`;
    return grade(
      'wrong',
      0,
      expected,
      [
        {
          kind: 'wrong-choice',
          message,
          expected,
          ...(chosen !== undefined ? { got: chosen.text } : {}),
          link:
            ex.type === 'formIdentify'
              ? conceptLink(`form:${a.correct}`)
              : itemLink(item !== undefined ? item.id : ex.target),
        },
      ],
      false,
    );
  }

  if (a.kind === 'typed') {
    const text =
      response.kind === 'typed'
        ? response.text
        : response.kind === 'choice'
          ? (ex.choices?.find((c) => c.id === response.id)?.text ?? '')
          : '';
    if (a.lang === 'english') return gradeEnglish(ctx.data, text, a.accepted, ex.items, fast);
    const multi = a.accepted.some((x) => words(x).length > 1);
    if (multi) {
      const best = [...a.accepted]
        .map((x) => gradeSentence(ctx, text, x, fast))
        .sort((p, q) => q.score - p.score);
      return best[0] ?? gradeSentence(ctx, text, a.accepted[0] ?? '', fast);
    }
    const g = gradeWord(ctx, text, a.accepted, fast);
    return g;
  }

  if (a.kind === 'order') {
    const textOf = (id: string): string => a.tiles.find((t) => t.id === id)?.text ?? id;
    const want = a.correct.map(textOf);
    const expected = ex.type === 'assemble' ? want.join(' ') : want.join(' + ');
    if (response.kind !== 'order') return grade('wrong', 0, expected, [], false);
    const got = response.ids.map(textOf);
    if (got.map(normalize).join(' ') === want.map(normalize).join(' ')) {
      return grade('correct', 1, expected, [], fast);
    }
    if (ex.type === 'assemble') {
      const g = gradeSentence(ctx, got.join(' '), want.join(' '));
      return { ...g, expected };
    }
    const diagnoses: Diagnosis[] = [];
    if ([...got].sort().join() === [...want].sort().join()) {
      diagnoses.push({
        kind: 'wrong-order',
        message: 'The right parts, the wrong way round: the modifier comes first, the head last.',
        expected,
        link: conceptLink('compound'),
      });
    } else {
      for (const id of response.ids) {
        if (a.correct.includes(id)) continue;
        const item = ctx.data.items.get(id);
        diagnoses.push({
          kind: 'wrong-part',
          message: `“${textOf(id)}” means “${item?.meaning ?? ''}”, which is not part of this word.`,
          got: textOf(id),
          link: itemLink(id),
        });
      }
    }
    const right = response.ids.filter((id, i) => a.correct[i] === id).length;
    return grade('wrong', right / a.correct.length, expected, diagnoses, false);
  }

  if (a.kind === 'multi') {
    const text = (id: string): string => ex.choices?.find((c) => c.id === id)?.text ?? id;
    const expected = a.correct.map(text).join(', ');
    if (response.kind !== 'multi') return grade('wrong', 0, expected, [], false);
    const want = new Set(a.correct);
    const got = new Set(response.ids);
    const hits = [...got].filter((id) => want.has(id)).length;
    const extra = [...got].filter((id) => !want.has(id));
    const missed = a.correct.filter((id) => !got.has(id));
    if (extra.length === 0 && missed.length === 0) return grade('correct', 1, expected, [], fast);
    const diagnoses: Diagnosis[] = [
      ...extra.map(
        (id): Diagnosis => ({
          kind: 'wrong-choice',
          message: `“${text(id)}” does not fit.`,
          got: text(id),
        }),
      ),
      ...missed.map(
        (id): Diagnosis => ({
          kind: 'missed-choice',
          message: `“${text(id)}” fits too.`,
          expected: text(id),
        }),
      ),
    ];
    const score = Math.max(0, (hits - extra.length) / want.size);
    const verdict: Verdict = extra.length + missed.length === 1 ? 'almost' : 'wrong';
    return grade(verdict, score, expected, diagnoses, false);
  }

  // pairs
  const expected = a.left
    .map((l) => `${l.text} = ${a.right.find((r) => r.id === a.pairs[l.id])?.text ?? ''}`)
    .join('; ');
  if (response.kind !== 'pairs') return grade('wrong', 0, expected, [], false);
  const diagnoses: Diagnosis[] = [];
  let right = 0;
  for (const l of a.left) {
    if (response.pairs[l.id] === a.pairs[l.id]) {
      right += 1;
      continue;
    }
    const item = ctx.data.items.get(l.id);
    const partner = a.right.find((r) => r.id === a.pairs[l.id])?.text ?? '';
    diagnoses.push(
      item !== undefined
        ? {
            kind: 'wrong-choice',
            message: `“${l.text}” means “${item.meaning}”.`,
            expected: item.meaning,
            link: itemLink(l.id),
          }
        : {
            // a pair that is not a word, e.g. a form and its name (Form Match)
            kind: 'wrong-choice',
            message: `“${l.text}” goes with “${partner}”.`,
            expected: partner,
          },
    );
  }
  const score = right / a.left.length;
  const verdict: Verdict =
    score === 1 ? 'correct' : a.left.length - right <= 1 ? 'almost' : 'wrong';
  return grade(verdict, score, expected, diagnoses, fast && verdict === 'correct');
}
