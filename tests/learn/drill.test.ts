import { beforeAll, describe, expect, it } from 'vitest';
import {
  DEFAULT_DRAW,
  DRILL_MODES,
  activeProfile,
  buildLearnSource,
  createFormsEngine,
  createRng,
  createStore,
  drawStars,
  drillResults,
  formBuild,
  formMatch,
  gradeExercise,
  gradeStars,
  normalize,
  spotPattern,
  starsDrill,
  type DrillContext,
  type Exercise,
  type GradeContext,
  type LearnData,
  type Response,
} from '@core/learn';
import { loadLearnInput } from '../../scripts/learn_inputs';

/** Ten Stars' drill and its grading (Hall Phase 4). */

const T0 = Date.UTC(2026, 9, 18, 9);

let data: LearnData;
let ctx: DrillContext;
let gctx: GradeContext;

beforeAll(() => {
  const input = loadLearnInput();
  const source = buildLearnSource(input);
  data = source.data;
  const forms = createFormsEngine({ data, morphology: input.lexicon.morphology });
  ctx = { exercise: { data }, forms };
  gctx = { data, link: source.context };
});

const draw = (seed: string): string[] => [
  ...drawStars(
    { data, forms: ctx.forms, profile: activeProfile(createStore(data.edition, T0)), now: T0 },
    DEFAULT_DRAW,
    seed,
  ).ids,
];

/** The response that answers an exercise exactly as the data would. */
function rightAnswer(ex: Exercise): Response {
  const a = ex.answer;
  if (a.kind === 'choice') return { kind: 'choice', id: a.correct };
  if (a.kind === 'typed') return { kind: 'typed', text: a.accepted[0] ?? '' };
  if (a.kind === 'order') return { kind: 'order', ids: a.correct };
  if (a.kind === 'multi') return { kind: 'multi', ids: a.correct };
  return { kind: 'pairs', pairs: a.pairs };
}

const irregularId = (): string => ctx.forms.irregularIds()[0] ?? '';

describe('a drill', () => {
  it('fills its length from the drawn words, with no repeat, and grades its own answers right', () => {
    for (let s = 0; s < 40; s += 1) {
      const ids = draw(`d${String(s)}`);
      const drill = starsDrill(ctx, ids, createRng(s), { length: 20, modes: DRILL_MODES });
      expect(drill.length).toBeGreaterThanOrEqual(15);
      expect(new Set(drill.map((e) => e.id)).size).toBe(drill.length);
      for (const ex of drill) {
        // every exercise is about a drawn word, except a pattern grid's other verbs
        if (ex.type !== 'spotPattern') expect(ids).toContain(ex.target);
        expect(gradeStars(gctx, ctx.forms, ex, rightAnswer(ex), 3000, 'exact').verdict, ex.id).toBe(
          'correct',
        );
      }
    }
  });

  it('is the same for the same seed', () => {
    const ids = draw('same');
    const a = starsDrill(ctx, ids, createRng('x'), { length: 20, modes: DRILL_MODES });
    const b = starsDrill(ctx, ids, createRng('x'), { length: 20, modes: DRILL_MODES });
    expect(b.map((e) => e.id)).toEqual(a.map((e) => e.id));
  });

  it('keeps to the modes chosen', () => {
    const ids = draw('modes');
    const only = starsDrill(ctx, ids, createRng(1), { length: 20, modes: ['forge'] });
    expect(only.every((e) => e.type === 'formBuild')).toBe(true);
    const recog = starsDrill(ctx, ids, createRng(1), { length: 10, modes: ['recognize'] });
    expect(recog.every((e) => e.type === 'recognition')).toBe(true);
  });

  it('mixes modes, and rarely puts the same word twice in a row', () => {
    const ids = draw('mix');
    const drill = starsDrill(ctx, ids, createRng(2), { length: 20, modes: DRILL_MODES });
    expect(new Set(drill.map((e) => e.type)).size).toBeGreaterThanOrEqual(4);
    const repeats = drill.filter((e, i) => i > 0 && drill[i - 1]?.target === e.target).length;
    expect(repeats).toBeLessThanOrEqual(2);
  });

  it('asks for listening only when there is a recording', () => {
    const ids = draw('listen');
    const none = starsDrill(ctx, ids, createRng(3), { length: 40, modes: DRILL_MODES });
    expect(none.some((e) => e.type === 'listen')).toBe(false);
    const withAudio = starsDrill(
      { ...ctx, exercise: { data, audio: new Set([ids[0] ?? '']) } },
      ids,
      createRng(3),
      { length: 40, modes: ['listen'] },
    );
    expect(withAudio.map((e) => e.target)).toEqual([ids[0]]);
  });
});

describe('spot the pattern', () => {
  it('asks for every verb built by one class, and the answer is exactly those', () => {
    const ids = draw('pattern');
    let made = 0;
    for (let s = 0; s < 30; s += 1) {
      const ex = spotPattern(ctx, ids, createRng(s));
      if (ex === null || ex.answer.kind !== 'multi') continue;
      made += 1;
      const correct = new Set(ex.answer.correct);
      expect(correct.size).toBeGreaterThan(0);
      expect(correct.size).toBeLessThan(ex.choices?.length ?? 0);
      for (const c of ex.choices ?? []) {
        const verb = ctx.forms.getForms(c.id)?.forms.find((f) => f.category === 'verb');
        expect(verb?.form).toBe(c.text);
      }
    }
    expect(made).toBeGreaterThan(20);
  });

  it('can ask which verbs go their own way, when an irregular is drawn', () => {
    const ids = [
      irregularId(),
      ...draw('irr')
        .filter((id) => id !== irregularId())
        .slice(0, 5),
    ];
    const ex = spotPattern(ctx, ids, createRng(1), 'irregular');
    expect(ex?.answer).toEqual({ kind: 'multi', correct: [irregularId()] });
  });

  it('grades a partly right selection as almost or wrong, and names what was missed', () => {
    const ids = draw('partial');
    const ex = [...Array(30).keys()]
      .map((s) => spotPattern(ctx, ids, createRng(s)))
      .find((e) => e?.answer.kind === 'multi' && e.answer.correct.length >= 2);
    if (ex === undefined || ex === null || ex.answer.kind !== 'multi') throw new Error('no grid');
    const g = gradeExercise(gctx, ex, { kind: 'multi', ids: ex.answer.correct.slice(1) });
    expect(g.verdict).toBe('almost');
    expect(g.diagnoses.map((d) => d.kind)).toEqual(['missed-choice']);
  });
});

describe('form match', () => {
  it('pairs each form with its name', () => {
    const id = [...data.items.values()].find(
      (i) => i.forms.filter((f) => f.meaningful).length >= 4,
    )?.id;
    const ex = formMatch(ctx, id ?? '', createRng(1));
    if (ex === null || ex.answer.kind !== 'pairs') throw new Error('no form match');
    expect(ex.answer.left.length).toBe(4);
    const wrong = Object.fromEntries(
      Object.keys(ex.answer.pairs).map((l, i, all) => [
        l,
        ex.answer.kind === 'pairs' ? (ex.answer.pairs[all[(i + 1) % all.length] ?? ''] ?? '') : '',
      ]),
    );
    const g = gradeExercise(gctx, ex, { kind: 'pairs', pairs: wrong });
    expect(g.verdict).toBe('wrong');
    for (const d of g.diagnoses) expect(d.message).toMatch(/goes with/);
  });
});

describe('near misses', () => {
  it('names the regular rule applied to a word that goes its own way', () => {
    const id = irregularId();
    const ex = formBuild(ctx.exercise, id, createRng(1), 'verb');
    if (ex === null) throw new Error('no exercise');
    const verb = ctx.forms.getForms(id)?.forms.find((f) => f.category === 'verb');
    const g = gradeStars(
      gctx,
      ctx.forms,
      ex,
      { kind: 'typed', text: verb?.regularWouldBe ?? '' },
      3000,
      'exact',
    );
    expect(g.verdict).toBe('almost');
    expect(g.diagnoses[0]?.kind).toBe('rule-for-irregular');
    expect(g.diagnoses[0]?.expected).toBe(verb?.form);
  });

  it('forgives a single vowel for a doubled one only when checking is lenient', () => {
    const item = [...data.items.values()].find((i) =>
      i.forms.some((f) => f.slot === 'ascended' && f.meaningful && /([aeiou])\1/.test(f.form)),
    );
    const ex = formBuild(ctx.exercise, item?.id ?? '', createRng(1), 'ascended');
    if (ex === null || ex.answer.kind !== 'typed') throw new Error('no exercise');
    const form = ex.answer.accepted[0] ?? '';
    const single = form.replace(/([aeiou])\1/, '$1');
    expect(normalize(single)).not.toBe(normalize(form));
    const lenient = gradeStars(
      gctx,
      ctx.forms,
      ex,
      { kind: 'typed', text: single },
      3000,
      'lenient',
    );
    expect(lenient.verdict).toBe('correct');
    expect(lenient.diagnoses[0]?.kind).toBe('vowel-length');
    const exact = gradeStars(gctx, ctx.forms, ex, { kind: 'typed', text: single }, 3000, 'exact');
    expect(exact.verdict).not.toBe('correct');
  });
});

describe('reflect', () => {
  it('scores each word by its own exercises', () => {
    const ids = draw('reflect');
    const drill = starsDrill(ctx, ids, createRng(9), { length: 20, modes: DRILL_MODES });
    const results = drill.map((ex, i) => ({
      ex,
      grade:
        i % 2 === 0
          ? { verdict: 'correct' as const, score: 1 }
          : { verdict: 'wrong' as const, score: 0 },
    }));
    const words = drillResults(ids, results);
    expect(words.map((w) => w.id)).toEqual(ids);
    expect(words.reduce((n, w) => n + w.asked, 0)).toBe(
      drill.filter((e) => ids.includes(e.target)).length,
    );
    for (const w of words) {
      expect(w.score).toBeGreaterThanOrEqual(0);
      expect(w.score).toBeLessThanOrEqual(1);
    }
  });
});

describe('reflect brightness', () => {
  it('follows the verdicts: right 1, nearly a half, not yet 0', () => {
    const ex = { target: 'w' } as unknown as Exercise;
    const [w] = drillResults(
      ['w'],
      [
        { ex, grade: { verdict: 'correct' } },
        { ex, grade: { verdict: 'almost' } },
        { ex, grade: { verdict: 'wrong' } },
        { ex, grade: { verdict: 'correct' } },
      ],
    );
    expect(w).toEqual({ id: 'w', asked: 4, right: 2, score: 2.5 / 4 });
  });
});

describe('coverage', () => {
  it('asks every drawn word at least once when the drill is long enough', () => {
    for (let s = 0; s < 40; s += 1) {
      const ids = draw(`cover${String(s)}`);
      const drill = starsDrill(ctx, ids, createRng(s), { length: 20, modes: DRILL_MODES });
      const asked = new Set(drill.map((e) => e.target));
      for (const id of ids) expect(asked, id).toContain(id);
      const ten = starsDrill(ctx, ids, createRng(s), { length: 10, modes: DRILL_MODES });
      expect(new Set(ten.map((e) => e.target)).size).toBe(10);
    }
  });
});

describe('pattern-only drills', () => {
  it('offer several distinct grids when the drawn words have verbs', () => {
    const c = {
      data,
      forms: ctx.forms,
      profile: activeProfile(createStore(data.edition, T0)),
      now: T0,
    };
    const ids = [...drawStars(c, { ...DEFAULT_DRAW, senses: ['verb'] }, 'verbs').ids];
    const drill = starsDrill(ctx, ids, createRng(4), { length: 10, modes: ['pattern'] });
    expect(drill.length).toBeGreaterThanOrEqual(4);
    expect(drill.every((e) => e.type === 'spotPattern')).toBe(true);
  });
});
