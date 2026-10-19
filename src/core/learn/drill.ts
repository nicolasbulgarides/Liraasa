/**
 * Ten Stars' practice (Hall Phase 4): a short drill over the words just
 * studied, and the grading that goes with it.
 *
 *   recognize   the word (or one of its forms) → its meaning      recognition
 *   recall      the meaning → the word, typed                     recall
 *   forge       the root and a form's name → the form, typed      formBuild
 *   pattern     a grid of verbs → every one built a given way     spotPattern (new)
 *   match       forms ↔ their names; words ↔ their meanings       formMatch (new), matching
 *   listen      a recording → its meaning, when one exists        listen
 *   slot        a sentence with the word missing → the form       cloze
 *
 * Every exercise is built from the data and the forms engine; the answer is
 * whatever the data stores. `gradeStars` wraps the core grader with two things
 * the forms engine knows: an answer that is exactly what the regular rule
 * would make, for a word that goes its own way, is named as such (the moment
 * an irregular is learned); and, when the learner chose lenient checking, a
 * doubled or single vowel is forgiven, with the exact spelling shown.
 */
import { FORM_SLOTS, type FormSlot } from '../config/slots';
import type { EntryId } from '../model/types';
import { humanize } from './concepts';
import {
  cardId,
  cloze,
  formBuild,
  listen,
  matching,
  recall,
  recognition,
  type Choice,
  type Exercise,
  type ExerciseContext,
} from './exercises';
import { VERB_CLASSES, type FormsEngine, type WordForm } from './forms';
import { gradeExercise, type Grade, type GradeContext, type Response } from './grade';
import type { Leniency } from './hall';
import type { Rng } from './rng';
import { normalize } from './text';

export type DrillMode = 'recognize' | 'recall' | 'forge' | 'pattern' | 'match' | 'listen' | 'slot';

export const DRILL_MODES: readonly DrillMode[] = [
  'recognize',
  'recall',
  'forge',
  'pattern',
  'match',
  'listen',
  'slot',
];

export interface DrillContext {
  exercise: ExerciseContext;
  forms: FormsEngine;
}

const meaningfulForms = (forms: FormsEngine, id: EntryId): readonly WordForm[] =>
  forms.getForms(id, { examples: 0 })?.forms ?? [];

/* ------------------------------------------------------- spot the pattern */

/**
 * A grid of verbs; choose every one built a given way. With an irregular in
 * the grid, the question can instead be which verbs go their own way.
 */
export function spotPattern(
  ctx: DrillContext,
  ids: readonly EntryId[],
  rng: Rng,
  ask?: (typeof VERB_CLASSES)[number] | 'irregular',
): Exercise | null {
  const { data } = ctx.exercise;
  const verbOf = (id: EntryId): WordForm | undefined =>
    meaningfulForms(ctx.forms, id).find((f) => f.category === 'verb');
  const drawn = ids.filter((id) => verbOf(id) !== undefined);
  if (drawn.length === 0) return null;

  // fill to six with other verbs, so every class has a chance to appear
  const others = rng.shuffle(
    [...data.items.values()]
      .filter((i) => (i.kind === 'root' || i.kind === 'compound') && !ids.includes(i.id))
      .filter((i) => i.forms.some((f) => f.slot === 'verb' && f.meaningful))
      .map((i) => i.id),
  );
  const grid = rng.shuffle(
    [...new Set([...rng.shuffle(drawn).slice(0, 4), ...others.slice(0, 6)])].slice(0, 6),
  );
  const classOf = (id: EntryId): string | undefined => verbOf(id)?.verbClass;
  const irregular = grid.filter((id) => verbOf(id)?.irregular === true);

  const present = VERB_CLASSES.filter((c) => grid.some((id) => classOf(id) === c));
  const target =
    ask ??
    (irregular.length > 0 && rng.next() < 0.5
      ? 'irregular'
      : rng.pick(present.filter((c) => grid.some((id) => classOf(id) !== c))));
  if (target === undefined) return null;
  const correct = target === 'irregular' ? irregular : grid.filter((id) => classOf(id) === target);
  if (correct.length === 0 || correct.length === grid.length) return null;

  const pattern = ctx.forms.rules.verb.find((v) => v.cls === target)?.pattern ?? '';
  const choices: Choice[] = grid.map((id) => ({
    id,
    text: verbOf(id)?.form ?? '',
    liraasa: true,
  }));
  const first = correct.find((id) => ids.includes(id)) ?? drawn[0] ?? '';
  return {
    id: `spotPattern:${target}:${grid.join(',')}`,
    type: 'spotPattern',
    skill: 'morphology',
    direction: 'recognize',
    card: cardId(first, 'morphology', 'recognize'),
    target: first,
    items: grid,
    concepts: ['form:verb'],
    instruction:
      target === 'irregular'
        ? 'Which of these verbs go their own way, not the rule?'
        : `Which of these verbs follow the pattern “${pattern}”?`,
    prompt: {},
    choices,
    answer: { kind: 'multi', correct },
  };
}

/* ------------------------------------------------------------ form match */

/** A word's forms, scrambled against their names: pair them up. */
export function formMatch(ctx: DrillContext, id: EntryId, rng: Rng): Exercise | null {
  const forms = meaningfulForms(ctx.forms, id);
  if (forms.length < 3) return null;
  const chosen = rng.shuffle(forms).slice(0, 4);
  const left = chosen.map((f) => ({ id: `f:${f.category}`, text: f.form, liraasa: true }));
  const right = rng.shuffle(
    chosen.map((f) => ({ id: `n:${f.category}`, text: humanize(f.category), liraasa: false })),
  );
  return {
    id: `formMatch:${id}:${chosen.map((f) => f.category).join(',')}`,
    type: 'formMatch',
    skill: 'morphology',
    direction: 'recognize',
    card: cardId(id, 'morphology', 'recognize'),
    target: id,
    items: [id],
    concepts: chosen.map((f) => f.ruleId),
    instruction: 'Match each form to its name.',
    prompt: {},
    answer: {
      kind: 'pairs',
      left,
      right,
      pairs: Object.fromEntries(chosen.map((f) => [`f:${f.category}`, `n:${f.category}`])),
    },
  };
}

/* ---------------------------------------------------------------- drill */

export interface DrillOptions {
  length: number;
  modes: readonly DrillMode[];
}

/**
 * A drill over the given words. Every word is asked at least once (when the
 * drill is long enough); then modes take turns, and within a mode the words
 * are shuffled, so the drill moves between words and between kinds of
 * question. No exercise repeats; two in a row are never about the same word
 * when that can be helped.
 */
export function starsDrill(
  ctx: DrillContext,
  ids: readonly EntryId[],
  rng: Rng,
  options: DrillOptions,
): Exercise[] {
  const ex = ctx.exercise;
  const modes = new Set(options.modes);
  const buckets = new Map<DrillMode, Exercise[]>();
  const add = (mode: DrillMode, e: Exercise | null): void => {
    if (e === null || !modes.has(mode)) return;
    buckets.set(mode, [...(buckets.get(mode) ?? []), e]);
  };
  for (const id of ids) {
    const forms = meaningfulForms(ctx.forms, id);
    const slots: FormSlot[] = forms.map((f) => f.category).filter((s) => s !== 'root');
    add('recognize', recognition(ex, id, rng));
    for (const s of slots) add('recognize', recognition(ex, id, rng, s));
    add('recall', recall(ex, id));
    for (const s of slots) add('forge', formBuild(ex, id, rng, s));
    add('match', formMatch(ctx, id, rng));
    add('listen', listen(ex, id, rng));
    const sentences = ex.data.examples.filter((e) => e.ids.includes(id));
    for (const e of rng.shuffle(sentences).slice(0, 2))
      add('slot', cloze(ex, e, rng, { item: id }));
  }
  if (ids.length >= 3) add('match', matching(ex, rng.shuffle(ids), rng));
  // several grids, each from a different handful of the drawn words
  if (modes.has('pattern')) {
    const grids = new Set<string>();
    for (let k = 0; k < 24 && grids.size < 6; k += 1) {
      const e = spotPattern(ctx, ids, rng, VERB_CLASSES[k % VERB_CLASSES.length]);
      if (e === null || grids.has(e.id)) continue;
      grids.add(e.id);
      add('pattern', e);
    }
  }
  if (ids.some((id) => ctx.forms.isIrregular(id)))
    add('pattern', spotPattern(ctx, ids, rng, 'irregular'));

  const queues = rng.shuffle([...buckets.values()].map((list) => rng.shuffle(list)));
  const out: Exercise[] = [];
  const seen = new Set<string>();
  // first, one exercise for every word, the modes taking turns
  let turn = 0;
  for (const id of rng.shuffle(ids)) {
    if (out.length >= options.length) break;
    for (let k = 0; k < queues.length; k += 1) {
      const q = queues[(turn + k) % queues.length] ?? [];
      const at = q.findIndex((e) => e.target === id && !seen.has(e.id));
      const next = at < 0 ? undefined : q.splice(at, 1)[0];
      if (next === undefined) continue;
      seen.add(next.id);
      out.push(next);
      turn = (turn + k + 1) % queues.length;
      break;
    }
  }
  // then the rest, round the modes
  while (out.length < options.length && queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      const next = q.shift();
      if (next === undefined || seen.has(next.id)) continue;
      seen.add(next.id);
      out.push(next);
      if (out.length >= options.length) break;
    }
  }
  // spread the words: keep the order, but never put a word twice in a row while another is
  // left, and bring a word that holds more than half of what is left forward before it can
  // only end in a run
  const spread: Exercise[] = [];
  const left = [...out];
  while (left.length > 0) {
    const prev = spread[spread.length - 1]?.target;
    const counts = new Map<string, number>();
    for (const e of left) counts.set(e.target, (counts.get(e.target) ?? 0) + 1);
    const crowded = [...counts].find(([t, n]) => t !== prev && n * 2 > left.length)?.[0];
    const at =
      crowded !== undefined
        ? left.findIndex((e) => e.target === crowded)
        : left.findIndex((e) => e.target !== prev);
    spread.push(...left.splice(Math.max(at, 0), 1));
  }
  return spread;
}

/* -------------------------------------------------------------- grading */

/** What the learner typed, for a typed answer. */
function typedText(ex: Exercise, response: Response): string | null {
  if (ex.answer.kind !== 'typed' || ex.answer.lang !== 'liraasa') return null;
  if (response.kind === 'typed') return response.text;
  if (response.kind === 'choice')
    return ex.choices?.find((c) => c.id === response.id)?.text ?? null;
  return null;
}

/** The form a formBuild exercise asks for. */
const askedSlot = (ex: Exercise): FormSlot | undefined =>
  FORM_SLOTS.find((s) => ex.concepts.includes(`form:${s}`));

export function gradeStars(
  gctx: GradeContext,
  forms: FormsEngine,
  ex: Exercise,
  response: Response,
  ms: number,
  leniency: Leniency,
): Grade {
  const g = gradeExercise(gctx, ex, response, ms);
  if (g.verdict === 'correct') return g;
  const typed = typedText(ex, response);
  if (typed === null || ex.answer.kind !== 'typed') return g;
  const got = normalize(typed);

  // the rule, applied to a word that goes its own way
  const slot = ex.type === 'formBuild' ? askedSlot(ex) : undefined;
  if (slot !== undefined) {
    const f = forms
      .getForms(ex.target, { includeUnused: true, examples: 0 })
      ?.forms.find((x) => x.category === slot);
    if (f?.irregular === true && f.regularWouldBe !== null && normalize(f.regularWouldBe) === got) {
      return {
        ...g,
        verdict: 'almost',
        score: 0.5,
        rating: 2,
        diagnoses: [
          {
            kind: 'rule-for-irregular',
            message: `The rule (${f.pattern}) makes “${f.regularWouldBe}”, and this word goes its own way: “${f.form}”.`,
            expected: f.form,
            got: typed,
            link: { kind: 'concept', id: f.ruleId },
          },
        ],
      };
    }
  }

  // lenient: a doubled or single vowel is forgiven
  if (leniency === 'lenient') {
    const vowels = forms.rules.vowels;
    const squeeze = (s: string): string =>
      [...s].filter((ch, i) => !(vowels.includes(ch) && s[i - 1] === ch)).join('');
    const match = ex.answer.accepted.find((a) => squeeze(normalize(a)) === squeeze(got));
    if (match !== undefined) {
      return {
        verdict: 'correct',
        score: 1,
        expected: match,
        rating: 3,
        diagnoses: [
          {
            kind: 'vowel-length',
            message: `Forgiven: the exact spelling is “${match}”.`,
            expected: match,
            got: typed,
          },
        ],
      };
    }
  }
  return g;
}

/* -------------------------------------------------------------- reflect */

export interface WordResult {
  id: EntryId;
  asked: number;
  right: number;
  /** 0–1: how the word went: right counts 1, nearly ½, not yet 0. */
  score: number;
}

/** How each drawn word went: every exercise about it, by its target. */
export function drillResults(
  ids: readonly EntryId[],
  results: readonly { ex: Exercise; grade: Pick<Grade, 'verdict'> }[],
): WordResult[] {
  const worth = { correct: 1, almost: 0.5, wrong: 0 } as const;
  return ids.map((id) => {
    const mine = results.filter((r) => r.ex.target === id);
    const right = mine.filter((r) => r.grade.verdict === 'correct').length;
    const score =
      mine.length === 0
        ? 0
        : mine.reduce((sum, r) => sum + worth[r.grade.verdict], 0) / mine.length;
    return { id, asked: mine.length, right, score };
  });
}
