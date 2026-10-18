/**
 * The Loom, the grammar wing (Hall Phase 5): rule cards, the rule map, and
 * exercises generated from the data and checked by the grammar checker.
 *
 * The checker (editor/checker, ADR-0014) is the engine. The core cannot
 * import it — it is a browser script — so it is passed in as a `LineCheck`:
 * a function from a line of Liraasa to its problems. The page hands it the
 * live checker; the tests hand it the same checker loaded into Node.
 *
 * Nothing is written from nothing. Every exercise starts from a sentence of the
 * data or the corpus that the checker passes, and changes it in one way:
 *
 *   weave       its words, shuffled → put them in order            (assemble)
 *   transform   add a slot's word (po, ne, ki…) where it belongs:   every place
 *               the checker accepts is an answer; when it accepts too many,
 *               the item is dropped, because then it is not checking
 *   mend        one small word moved, or one word given another of its own
 *               forms, that the checker flags → mend it
 *   unravel     each word ↔ its gloss                               (pairs)
 *   choose      the sentence and two broken ones → the grammatical one
 *   translate   the English → the Liraasa                           (translateTo)
 *   reverse     the Liraasa → the English, from three
 *
 * `gradeLoom` accepts another order of the same words when the checker
 * passes it and the content words keep their order (so only particles have
 * moved, never subject and object), and is honest when it cannot judge: a
 * grammatical translation in other words is "the checker cannot tell whether
 * it means the same", with the reference shown.
 */
import type { EntryId } from '../model/types';
import { NOUN_PHRASE, CLAUSE } from './concepts';
import {
  assemble,
  cardId,
  translateTo,
  type Choice,
  type Exercise,
  type ExerciseContext,
} from './exercises';
import { gradeExercise, type Diagnosis, type Grade, type Response } from './grade';
import { glossLine, type GlossedToken } from './lessons';
import { linkWord, type LinkContext } from './link';
import type { Rng } from './rng';
import { normalize, unique } from './text';
import type { Concept, ConceptId, LearnData, LearnExample, Overrides } from './types';

/* ------------------------------------------------------------- the engine */

export interface CheckProblem {
  rule: string;
  token: string | null;
  message: string;
  severity: string;
}

/** A line of Liraasa → what the grammar checker finds wrong with it. */
export type LineCheck = (line: string) => readonly CheckProblem[];

const SERIOUS = new Set(['error', 'warn']);
export const seriousProblems = (ps: readonly CheckProblem[]): CheckProblem[] =>
  ps.filter((p) => SERIOUS.has(p.severity));

export interface LoomContext {
  exercise: ExerciseContext;
  link: LinkContext;
  check: LineCheck;
}

const memo = new WeakMap<LineCheck, Map<string, CheckProblem[]>>();
/** The checker's serious problems with a line, remembered per checker. */
export function problemsOf(check: LineCheck, line: string): CheckProblem[] {
  let m = memo.get(check);
  if (m === undefined) {
    m = new Map();
    memo.set(check, m);
  }
  const hit = m.get(line);
  if (hit !== undefined) return hit;
  const out = seriousProblems(check(line));
  m.set(line, out);
  return out;
}
const isClean = (check: LineCheck, line: string): boolean => problemsOf(check, line).length === 0;

/* ------------------------------------------------------------ sentences */

/** Closed classes: the small words that may move without changing who did what. */
const CLOSED = new Set(['functionWord', 'correlative', 'timeWord', 'particle']);
const HEADWORD = new Set(['root', 'compound', 'imageCompound']);
/** What a clause's subject can begin with. */
const SUBJECTISH = new Set(['root', 'compound', 'imageCompound', 'pronoun']);

interface Sentence {
  words: string[];
  end: string;
}

/**
 * A sentence as words and its final mark, when it has no punctuation inside
 * (commas and dashes carry meaning the exercises cannot move). The first word
 * is lowered unless it is a name; `render` capitalises again.
 */
function sentenceOf(e: LearnExample): Sentence | null {
  let rest = e.liraasa;
  for (const t of [...e.tokens].reverse()) rest = rest.slice(0, t.start) + rest.slice(t.end);
  // what is left once the words are gone: nothing, or one closing mark
  const leftover = rest.replace(/\s+/g, '');
  if (leftover !== '' && !/^[.!?]$/.test(leftover)) return null;
  if (leftover !== '' && !/[.!?]\s*$/.test(e.liraasa)) return null;
  const end = leftover === '' ? '.' : leftover;
  const words = e.tokens.map((t, i) =>
    i === 0 && t.link.kind !== 'name' ? t.text.charAt(0).toLowerCase() + t.text.slice(1) : t.text,
  );
  return { words, end };
}

export function renderSentence(words: readonly string[], end: string): string {
  const line = words.join(' ');
  return line.charAt(0).toUpperCase() + line.slice(1) + end;
}

const unknownHeadwords = (ctx: ExerciseContext, e: LearnExample): number =>
  ctx.known === undefined
    ? 0
    : e.ids.filter((id) => HEADWORD.has(ctx.data.items.get(id)?.kind ?? '') && !ctx.known?.has(id))
        .length;

/**
 * Sentences that exercise a concept and that the checker passes: built from
 * words the learner knows first, shorter first. Only sentences with English
 * and without inner punctuation, every word linked.
 */
export function loomSentences(ctx: LoomContext, concept: ConceptId, limit = 12): LearnExample[] {
  const ex = ctx.exercise;
  const list = unique(
    ex.data.examples.filter(
      (e) =>
        e.concepts.includes(concept) &&
        e.english !== null &&
        e.tokens.length >= 2 &&
        e.tokens.length <= 12 &&
        e.tokens.every((t) => t.link.kind !== 'unknown') &&
        sentenceOf(e) !== null,
    ),
    (e) => e.liraasa,
  );
  return list
    .map((e) => ({ e, u: unknownHeadwords(ex, e) }))
    .sort(
      (a, b) => a.u - b.u || a.e.tokens.length - b.e.tokens.length || (a.e.key < b.e.key ? -1 : 1),
    )
    .map((x) => x.e)
    .filter((e) => isClean(ctx.check, e.liraasa))
    .slice(0, limit);
}

/* ------------------------------------------------------------ rule cards */

export interface RuleCard {
  concept: Concept;
  title: string;
  /** The pattern, as the data writes it (before its dash), or null. */
  pattern: string | null;
  /** The data's explanation (after the dash, or all of it for a ruling). */
  explanation: string;
  note: { explanation?: string; mnemonic?: string } | null;
  /** The edition a ruling belongs to; the data's edition otherwise. */
  version: string;
  prereqs: readonly { id: ConceptId; title: string }[];
  /** Concepts that build on this one. */
  leadsTo: readonly { id: ConceptId; title: string }[];
  /** The closed-class words the concept is about (a slot's words). */
  words: readonly { id: EntryId; spelling: string; meaning: string }[];
  /** Two to four sentences the checker passes, with their word-by-word gloss. */
  examples: readonly {
    key: string;
    liraasa: string;
    english: string | null;
    gloss: readonly GlossedToken[];
  }[];
}

const DASH = ' — ';

export function ruleCard(
  ctx: LoomContext,
  id: ConceptId,
  overrides: Overrides,
  limit = 4,
): RuleCard | null {
  const data = ctx.exercise.data;
  const concept = data.concepts.get(id);
  if (concept === undefined) return null;
  const cut = concept.description.indexOf(DASH);
  const patterned =
    concept.kind !== 'ruling' && concept.kind !== 'numbers' && concept.kind !== 'motion';
  const pattern = !patterned
    ? null
    : cut < 0
      ? concept.description
      : concept.description.slice(0, cut);
  const explanation = !patterned
    ? concept.description
    : cut < 0
      ? ''
      : concept.description.slice(cut + DASH.length);
  const title = (c: ConceptId): { id: ConceptId; title: string } => ({
    id: c,
    title: data.concepts.get(c)?.title ?? c,
  });
  const note =
    overrides.notes[id] ??
    (concept.ruleRef !== undefined ? overrides.notes[concept.ruleRef] : undefined);
  return {
    concept,
    title: concept.title,
    pattern,
    explanation,
    note: note ?? null,
    version: concept.ruleRef?.split(':')[0] ?? data.edition,
    prereqs: concept.prereqs.map(title),
    leadsTo: [...data.concepts.values()]
      .filter((c) => c.prereqs.includes(id))
      .map((c) => title(c.id)),
    words: unique(
      concept.words.map((w) => {
        const it = data.items.get(w);
        return { id: w, spelling: it?.spelling ?? w, meaning: it?.meaning ?? '' };
      }),
      (w) => w.spelling,
    ),
    examples: loomSentences(ctx, id, limit).map((e) => ({
      key: e.key,
      liraasa: e.liraasa,
      english: e.english,
      gloss: glossLine(data, e.tokens),
    })),
  };
}

/* -------------------------------------------------------------- the map */

export type RuleGroup = 'forms' | 'clause' | 'phrase' | 'rulings';

export interface MapEntry {
  id: ConceptId;
  title: string;
  group: RuleGroup;
  /** How far down the prerequisites it sits: foundations are 0. */
  depth: number;
  prereqs: readonly ConceptId[];
  /** Sentences the checker passes that exercise it: 0 means no exercises yet. */
  sentences: number;
  version: string;
}

/**
 * Every concept the curriculum keeps, with its depth in the prerequisites,
 * grouped as threads: forms, the clause and its slots, the noun phrase, the
 * rulings. Nothing is gated; depth only orders the map.
 */
export function ruleMap(ctx: LoomContext, overrides: Overrides): MapEntry[] {
  const data = ctx.exercise.data;
  const excluded = new Set(overrides.exclude);
  const depth = new Map<ConceptId, number>();
  const depthOf = (id: ConceptId, seen = new Set<ConceptId>()): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    if (seen.has(id)) return 0;
    seen.add(id);
    const c = data.concepts.get(id);
    const d =
      c === undefined || c.prereqs.length === 0
        ? 0
        : 1 + Math.max(...c.prereqs.map((p) => depthOf(p, seen)));
    depth.set(id, d);
    return d;
  };
  const groupOf = (c: Concept): RuleGroup =>
    c.kind === 'ruling'
      ? 'rulings'
      : c.kind === 'slot' || c.id === CLAUSE
        ? 'clause'
        : c.id === NOUN_PHRASE
          ? 'phrase'
          : 'forms';
  const slotN = (c: Concept): number => c.slot ?? 0;
  return [...data.concepts.values()]
    .filter((c) => !excluded.has(c.id))
    .map((c) => ({
      id: c.id,
      title: c.title,
      group: groupOf(c),
      depth: depthOf(c.id),
      prereqs: c.prereqs,
      sentences: loomSentences(ctx, c.id, 99).length,
      version: c.ruleRef?.split(':')[0] ?? data.edition,
      n: slotN(c),
    }))
    .sort((a, b) => a.depth - b.depth || a.n - b.n || (a.id < b.id ? -1 : 1))
    .map(({ n: _n, ...rest }) => rest);
}

/* ------------------------------------------------------------ exercises */

export type LoomType =
  | 'weave'
  | 'transform'
  | 'mend'
  | 'unravel'
  | 'choose'
  | 'translate'
  | 'reverse';

export const LOOM_TYPES: readonly LoomType[] = [
  'weave',
  'transform',
  'mend',
  'unravel',
  'choose',
  'translate',
  'reverse',
];

const closedAt = (data: LearnData, e: LearnExample, i: number): boolean => {
  const t = e.tokens[i];
  if (t?.link.kind !== 'entry') return false;
  return t.link.refs.some((r) => CLOSED.has(data.items.get(r.id)?.kind ?? ''));
};

/** The clause slots a word can fill, by number, from the data's slot lists. */
function slotNumbers(data: LearnData, t: LearnExample['tokens'][number]): number[] {
  if (t.link.kind !== 'entry') return [];
  const ids = new Set(t.link.refs.map((r) => r.id));
  const out: number[] = [];
  for (const c of data.concepts.values()) {
    if (c.kind === 'slot' && c.slot !== undefined && c.words.some((w) => ids.has(w)))
      out.push(c.slot);
  }
  return out;
}

/**
 * Add one of a slot's words where it belongs. Every place the checker accepts
 * and the template's slot order allows is right.
 */
export function transform(
  ctx: LoomContext,
  e: LearnExample,
  slot: ConceptId,
  rng: Rng,
): Exercise | null {
  const data = ctx.exercise.data;
  const concept = data.concepts.get(slot);
  const base = sentenceOf(e);
  if (concept?.kind !== 'slot' || concept.words.length === 0 || base === null) return null;
  const present = new Set(e.ids);
  if (concept.words.some((w) => present.has(w))) return null;
  const word = rng.pick(
    concept.words
      .map((w) => data.items.get(w))
      .filter((w) => w !== undefined && w.kind === 'functionWord'),
  );
  if (word === undefined) return null;
  // The template puts SUBJECT before every operator slot. The checker lets a
  // tense or negation word open the sentence (a gap, reported in
  // TRAINING_DECISIONS D25), so the template is applied here: a word from a
  // slot after the subject may not stand before a clause that starts with one.
  const subjectSlot = [...data.concepts.values()].find((c) => c.id === 'slot:SUBJECT')?.slot ?? 0;
  const first = e.tokens[0];
  const opensWithSubject =
    first !== undefined &&
    first.link.kind === 'entry' &&
    first.link.refs.some((r) => SUBJECTISH.has(data.items.get(r.id)?.kind ?? ''));
  const from = (concept.slot ?? 0) > subjectSlot && opensWithSubject ? 1 : 0;
  // and the template's slot order among the operators around the new word
  const n = concept.slot ?? 0;
  const slotsAt = e.tokens.map((t) => slotNumbers(data, t));
  const inOrder = (at: number): boolean =>
    slotsAt.slice(0, at).every((s) => s.length === 0 || s.some((m) => m <= n)) &&
    slotsAt.slice(at).every((s) => s.length === 0 || s.some((m) => m >= n));
  const answers: string[] = [];
  for (let at = from; at <= base.words.length; at += 1) {
    if (!inOrder(at)) continue;
    const words = [...base.words.slice(0, at), word.spelling, ...base.words.slice(at)];
    const line = renderSentence(words, base.end);
    if (isClean(ctx.check, line)) answers.push(line);
  }
  // when the checker allows the word almost anywhere, it is not checking this: leave it out
  if (answers.length === 0 || answers.length > 2) return null;
  const original = renderSentence(base.words, base.end);
  return {
    id: `transform:${e.key}:${word.id}`,
    type: 'transform',
    skill: 'grammar',
    direction: 'produce',
    card: cardId(slot, 'grammar', 'produce'),
    target: slot,
    items: [...e.ids, word.id],
    concepts: [slot],
    instruction: `Add “${word.spelling}” (${word.meaning}) where it belongs.`,
    prompt: { liraasa: original, english: e.english ?? '', tokens: glossLine(data, e.tokens) },
    prefill: original,
    answer: { kind: 'typed', lang: 'liraasa', accepted: answers },
    source: e.key,
  };
}

interface Mutant {
  line: string;
  problem: CheckProblem;
}

/**
 * Broken versions of a sentence, each one change away and each flagged by the
 * checker: a small word moved, or a word given another of its own forms.
 */
export function mutants(ctx: LoomContext, e: LearnExample, rng: Rng, want = 3): Mutant[] {
  const data = ctx.exercise.data;
  const base = sentenceOf(e);
  if (base === null) return [];
  const tries: string[][] = [];
  base.words.forEach((_, i) => {
    if (!closedAt(data, e, i)) return;
    for (let to = 0; to < base.words.length; to += 1) {
      if (to === i) continue;
      const words = [...base.words];
      const [moved] = words.splice(i, 1);
      if (moved === undefined) continue;
      words.splice(to, 0, moved);
      tries.push(words);
    }
  });
  e.tokens.forEach((t, i) => {
    if (t.link.kind !== 'entry' || t.link.refs.length !== 1) return;
    const ref = t.link.refs[0];
    const item = ref === undefined ? undefined : data.items.get(ref.id);
    if (item === undefined || ref?.slot === undefined || t.link.via !== undefined) return;
    if (!HEADWORD.has(item.kind)) return;
    for (const f of item.forms) {
      if (!f.meaningful || f.slot === ref.slot) continue;
      const words = [...base.words];
      words[i] = f.form;
      tries.push(words);
    }
  });
  const original = renderSentence(base.words, base.end);
  const out: Mutant[] = [];
  const seen = new Set<string>([original]);
  for (const words of rng.shuffle(tries)) {
    const line = renderSentence(words, base.end);
    if (seen.has(line)) continue;
    seen.add(line);
    const problem = problemsOf(ctx.check, line)[0];
    if (problem === undefined) continue;
    out.push({ line, problem });
    if (out.length >= want) break;
  }
  return out;
}

export function mend(
  ctx: LoomContext,
  e: LearnExample,
  rng: Rng,
  target: ConceptId,
): Exercise | null {
  const base = sentenceOf(e);
  const [m] = mutants(ctx, e, rng, 1);
  if (base === null || m === undefined) return null;
  const original = renderSentence(base.words, base.end);
  return {
    id: `mend:${e.key}:${m.line}`,
    type: 'mend',
    skill: 'grammar',
    direction: 'produce',
    card: cardId(target, 'grammar', 'produce'),
    target,
    items: [...e.ids],
    concepts: [...e.concepts],
    instruction: 'One thing is wrong. Mend the sentence.',
    prompt: { liraasa: m.line, english: e.english ?? '' },
    prefill: m.line,
    answer: { kind: 'typed', lang: 'liraasa', accepted: [original] },
    explain: { wrong: m.problem.message },
    source: e.key,
  };
}

export function choose(
  ctx: LoomContext,
  e: LearnExample,
  rng: Rng,
  target: ConceptId,
): Exercise | null {
  const base = sentenceOf(e);
  const ms = mutants(ctx, e, rng, 2);
  if (base === null || ms.length < 2) return null;
  const choices: Choice[] = rng.shuffle([
    { id: 'ok', text: renderSentence(base.words, base.end), liraasa: true },
    ...ms.map((m, i) => ({ id: `m${String(i)}`, text: m.line, liraasa: true })),
  ]);
  return {
    id: `choose:${e.key}`,
    type: 'choose',
    skill: 'grammar',
    direction: 'recognize',
    card: cardId(target, 'grammar', 'recognize'),
    target,
    items: [...e.ids],
    concepts: [...e.concepts],
    instruction: 'Which one is grammatical?',
    prompt: { english: e.english ?? '' },
    choices,
    answer: { kind: 'choice', correct: 'ok' },
    explain: Object.fromEntries(ms.map((m, i) => [`m${String(i)}`, m.problem.message])),
    source: e.key,
  };
}

/** Each word against its gloss: interlinear glossing as a matching game. */
export function unravel(
  ctx: LoomContext,
  e: LearnExample,
  rng: Rng,
  target: ConceptId,
): Exercise | null {
  const gloss = glossLine(ctx.exercise.data, e.tokens);
  const picked: { i: number; t: GlossedToken; label: string }[] = [];
  const labels = new Set<string>();
  const texts = new Set<string>();
  gloss.forEach((t, i) => {
    if (t.kind !== 'entry' || t.gloss === '') return;
    const label = t.tags.length > 0 ? `${t.gloss} · ${t.tags.join(' · ')}` : t.gloss;
    const key = normalize(t.text);
    if (labels.has(label) || texts.has(key)) return;
    labels.add(label);
    texts.add(key);
    picked.push({ i, t, label });
  });
  if (picked.length < 3) return null;
  const chosen = picked.slice(0, 5);
  return {
    id: `unravel:${e.key}`,
    type: 'unravel',
    skill: 'grammar',
    direction: 'recognize',
    card: cardId(target, 'grammar', 'recognize'),
    target,
    items: [...e.ids],
    concepts: [...e.concepts],
    instruction: 'Gloss each word.',
    prompt: { liraasa: e.liraasa, english: e.english ?? '' },
    answer: {
      kind: 'pairs',
      left: chosen.map((c) => ({ id: `u:${String(c.i)}`, text: c.t.text, liraasa: true })),
      right: rng.shuffle(
        chosen.map((c) => ({ id: `g:${String(c.i)}`, text: c.label, liraasa: false })),
      ),
      pairs: Object.fromEntries(chosen.map((c) => [`u:${String(c.i)}`, `g:${String(c.i)}`])),
    },
    source: e.key,
  };
}

/** The Liraasa → its English, from three: the others from sentences that share words. */
export function reverse(
  ctx: LoomContext,
  e: LearnExample,
  rng: Rng,
  target: ConceptId,
): Exercise | null {
  const data = ctx.exercise.data;
  if (e.english === null) return null;
  const mine = normalize(e.english);
  const ids = new Set(e.ids);
  const others = unique(
    rng
      .shuffle(data.examples.filter((x) => x.english !== null && normalize(x.english) !== mine))
      .sort(
        (a, b) => b.ids.filter((i) => ids.has(i)).length - a.ids.filter((i) => ids.has(i)).length,
      ),
    (x) => normalize(x.english ?? ''),
  ).slice(0, 2);
  if (others.length < 2) return null;
  return {
    id: `reverse:${e.key}`,
    type: 'reverse',
    skill: 'grammar',
    direction: 'recognize',
    card: cardId(target, 'grammar', 'recognize'),
    target,
    items: [...e.ids],
    concepts: [...e.concepts],
    instruction: 'What does it mean?',
    prompt: { liraasa: e.liraasa, tokens: glossLine(data, e.tokens) },
    choices: rng.shuffle([
      { id: 'ok', text: e.english, liraasa: false },
      ...others.map((o, i) => ({ id: `o${String(i)}`, text: o.english ?? '', liraasa: false })),
    ]),
    answer: { kind: 'choice', correct: 'ok' },
    source: e.key,
  };
}

/* -------------------------------------------------------------- session */

export interface LoomOptions {
  length: number;
  types: readonly LoomType[];
}

/** Sentences for a transform: clauses that lack the slot's words. */
const transformSentences = (ctx: LoomContext, slot: Concept): LearnExample[] =>
  loomSentences(ctx, CLAUSE, 60).filter((e) => !slot.words.some((w) => e.ids.includes(w)));

/** The exercises one concept can give, by type. */
export function exercisesForRule(
  ctx: LoomContext,
  id: ConceptId,
  rng: Rng,
  types: readonly LoomType[] = LOOM_TYPES,
): Map<LoomType, Exercise[]> {
  const out = new Map<LoomType, Exercise[]>();
  const add = (type: LoomType, ex: Exercise | null): void => {
    if (ex === null || !types.includes(type)) return;
    out.set(type, [...(out.get(type) ?? []), ex]);
  };
  const concept = ctx.exercise.data.concepts.get(id);
  if (concept === undefined) return out;
  const sentences = loomSentences(ctx, id, 8);
  for (const e of sentences) {
    const asWeave = assemble(ctx.exercise, e, rng, id);
    add('weave', asWeave === null ? null : { ...asWeave, card: cardId(id, 'grammar', 'produce') });
    if (types.includes('mend')) add('mend', mend(ctx, e, rng, id));
    if (types.includes('choose')) add('choose', choose(ctx, e, rng, id));
    add('unravel', unravel(ctx, e, rng, id));
    const asTranslate = translateTo(ctx.exercise, e, id);
    add(
      'translate',
      asTranslate === null ? null : { ...asTranslate, card: cardId(id, 'grammar', 'produce') },
    );
    add('reverse', reverse(ctx, e, rng, id));
  }
  if (concept.kind === 'slot' && concept.words.length > 0 && types.includes('transform')) {
    let made = 0;
    for (const e of rng.shuffle(transformSentences(ctx, concept))) {
      const t = transform(ctx, e, id, rng);
      if (t === null) continue;
      add('transform', t);
      made += 1;
      if (made >= 4) break;
    }
  }
  return out;
}

/**
 * A Loom session over some rules: the exercise types take turns, rules take
 * turns within them, no exercise repeats, and no sentence comes twice in a row
 * when that can be helped.
 */
export function loomSession(
  ctx: LoomContext,
  rules: readonly ConceptId[],
  rng: Rng,
  options: LoomOptions,
): Exercise[] {
  const byType = new Map<LoomType, Exercise[]>();
  for (const id of rules) {
    for (const [type, list] of exercisesForRule(ctx, id, rng, options.types)) {
      byType.set(type, [...(byType.get(type) ?? []), ...list]);
    }
  }
  const queues = rng.shuffle([...byType.values()].map((q) => rng.shuffle(q)));
  const out: Exercise[] = [];
  const seen = new Set<string>();
  while (out.length < options.length && queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      const next = q.shift();
      if (next === undefined || seen.has(next.id)) continue;
      seen.add(next.id);
      out.push(next);
      if (out.length >= options.length) break;
    }
  }
  for (let i = 1; i < out.length; i += 1) {
    if (out[i]?.source === undefined || out[i]?.source !== out[i - 1]?.source) continue;
    const j = out.findIndex((x, k) => k > i && x.source !== out[i - 1]?.source);
    if (j < 0) break;
    const a = out[i];
    const b = out[j];
    if (a === undefined || b === undefined) break;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/** Rules a learner can practise together: one, it and what it builds on, or many. */
export function withPrereqs(data: LearnData, id: ConceptId): ConceptId[] {
  const out: ConceptId[] = [];
  const walk = (c: ConceptId): void => {
    if (out.includes(c)) return;
    out.push(c);
    for (const p of data.concepts.get(c)?.prereqs ?? []) walk(p);
  };
  walk(id);
  return out;
}

/* -------------------------------------------------------------- grading */

/** The words of a line, normalised. */
const wordsOf = (line: string): string[] =>
  normalize(line)
    .split(/\s+/)
    .filter((w) => w !== '');

/** The content words of a line, in order: what must not move. */
function contentOf(link: LinkContext, data: LearnData, line: string): string[] {
  return wordsOf(line).filter((w) => {
    const l = linkWord(link, w);
    if (l.kind !== 'entry') return true;
    return !l.refs.every((r) => CLOSED.has(data.items.get(r.id)?.kind ?? ''));
  });
}

const sameBag = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && [...a].sort().join(' ') === [...b].sort().join(' ');

const typedOf = (ex: Exercise, r: Response): string | null => {
  if (r.kind === 'typed') return r.text;
  if (r.kind === 'order' && ex.answer.kind === 'order') {
    const tiles = ex.answer.tiles;
    return r.ids.map((id) => tiles.find((t) => t.id === id)?.text ?? '').join(' ');
  }
  return null;
};

export function gradeLoom(ctx: LoomContext, ex: Exercise, response: Response, ms: number): Grade {
  const data = ctx.exercise.data;
  const g = gradeExercise({ data, link: ctx.link }, ex, response, ms);
  const explain = (id: string): Diagnosis[] => {
    const why = ex.explain?.[id];
    return why === undefined ? [] : [{ kind: 'checker', message: why }];
  };
  if (g.verdict === 'correct') return g;

  if (ex.type === 'choose' && response.kind === 'choice') {
    return { ...g, diagnoses: [...g.diagnoses, ...explain(response.id)] };
  }

  const text = typedOf(ex, response);
  const a = ex.answer;
  const reference =
    a.kind === 'typed'
      ? (a.accepted[0] ?? '')
      : a.kind === 'order'
        ? a.correct.map((id) => a.tiles.find((t) => t.id === id)?.text ?? '').join(' ')
        : '';
  if (text === null || text.trim() === '' || reference === '') return g;
  if (!['assemble', 'transform', 'mend', 'translateTo'].includes(ex.type)) return g;

  const problems = problemsOf(ctx.check, renderLine(text));
  if (problems.length === 0) {
    const mine = wordsOf(text);
    const want = wordsOf(reference);
    const sameOrder =
      contentOf(ctx.link, data, text).join(' ') === contentOf(ctx.link, data, reference).join(' ');
    if (sameBag(mine, want) && sameOrder) {
      return {
        verdict: 'correct',
        score: 1,
        expected: reference,
        rating: 3,
        diagnoses: [
          {
            kind: 'other-order',
            message: `Also right. The reference has: “${reference}”.`,
            expected: reference,
          },
        ],
      };
    }
    if (ex.type === 'translateTo') {
      return {
        verdict: 'almost',
        score: 0.5,
        expected: reference,
        rating: 2,
        diagnoses: [
          {
            kind: 'unverified',
            message: `The checker finds nothing wrong, but cannot tell whether it means the same. Compare: “${reference}”.`,
            expected: reference,
          },
        ],
      };
    }
    return g;
  }
  return {
    ...g,
    // each thing said once: the checker's notes on the answer, then why the original was broken
    diagnoses: unique(
      [
        ...g.diagnoses,
        ...problems.slice(0, 2).map((p): Diagnosis => ({ kind: 'checker', message: p.message })),
        ...(ex.type === 'mend' ? explain('wrong') : []),
      ],
      (d) => d.message,
    ),
  };
}

/** A typed line made checkable: capitalised, with a full stop when it has no final mark. */
function renderLine(text: string): string {
  const t = text.trim();
  const ended = /[.!?]$/.test(t) ? t : `${t}.`;
  return ended.charAt(0).toUpperCase() + ended.slice(1);
}
