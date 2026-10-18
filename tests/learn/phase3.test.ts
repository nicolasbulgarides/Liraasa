import { beforeAll, describe, expect, it } from 'vitest';
import {
  EMPTY_OVERRIDES,
  EXERCISE_TYPES,
  buildLearnSource,
  buildSkillGraph,
  compoundBuild,
  createRng,
  exercisesForNode,
  gradeExercise,
  gradeSentence,
  matching,
  mixedSession,
  normalize,
  recall,
  recognition,
  translateFrom,
  type Exercise,
  type ExerciseContext,
  type GradeContext,
  type LearnData,
  type SkillGraph,
} from '@core/learn';
import { loadLearnInput } from '../../scripts/learn_inputs';

/**
 * Learn Phase 3: the exercise generators and the grader, on the real data.
 * Every Liraasa word below is a real headword or a real example sentence.
 */

let data: LearnData;
let graph: SkillGraph;
let ctx: ExerciseContext;
let gctx: GradeContext;

beforeAll(() => {
  const source = buildLearnSource(loadLearnInput());
  data = source.data;
  graph = buildSkillGraph(data, EMPTY_OVERRIDES);
  ctx = { data, graph };
  gctx = { data, link: source.context };
});

const idOf = (spelling: string): string => {
  const item = [...data.items.values()].find((i) => i.spelling === spelling && i.forms.length > 0);
  if (item === undefined) throw new Error(`${spelling} is not a headword`);
  return item.id;
};
const sentence = (text: string) => {
  const e = data.examples.find((x) => x.liraasa === text);
  if (e === undefined) throw new Error(`${text} is not an example`);
  return e;
};

/** 1000 exercises, deterministically, from the start of the path onwards. */
function thousand(seed: string): Exercise[] {
  const rng = createRng(seed);
  const out: Exercise[] = [];
  for (const node of graph.order) {
    out.push(...exercisesForNode(ctx, node, rng));
    if (out.length >= 1000) break;
  }
  return out.slice(0, 1000);
}

describe('generating 1000 exercises with a fixed seed', () => {
  let exercises: Exercise[] = [];
  beforeAll(() => {
    exercises = thousand('acceptance');
  });

  it('makes 1000, covering every type but audio', () => {
    expect(exercises).toHaveLength(1000);
    const types = new Set(exercises.map((e) => e.type));
    // matching comes from sessions; listen only exists once audio is recorded
    for (const t of EXERCISE_TYPES.filter((x) => x !== 'listen' && x !== 'matching')) {
      expect(types, t).toContain(t);
    }
  });

  it('references no id that does not exist', () => {
    for (const ex of exercises) {
      for (const id of ex.items) expect(data.items.has(id), `${ex.id}: ${id}`).toBe(true);
      for (const c of ex.concepts) expect(data.concepts.has(c), `${ex.id}: ${c}`).toBe(true);
      expect(data.items.has(ex.target) || data.concepts.has(ex.target), ex.id).toBe(true);
      if (ex.source !== undefined) {
        expect(data.examples.some((e) => e.key === ex.source)).toBe(true);
      }
    }
  });

  it('never offers a distractor equal to a correct answer', () => {
    for (const ex of exercises) {
      if (ex.choices === undefined) continue;
      const texts = ex.choices.map((c) => normalize(c.text));
      expect(new Set(texts).size, ex.id).toBe(texts.length);
      const a = ex.answer;
      const correct =
        a.kind === 'choice'
          ? [ex.choices.find((c) => c.id === a.correct)?.text ?? '']
          : a.kind === 'typed'
            ? a.accepted
            : [];
      const wrong = ex.choices.filter((c) =>
        a.kind === 'choice'
          ? c.id !== a.correct
          : !correct.map(normalize).includes(normalize(c.text)),
      );
      for (const w of wrong) {
        expect(correct.map(normalize), `${ex.id}: ${w.text}`).not.toContain(normalize(w.text));
      }
      expect(wrong.length).toBe(ex.choices.length - 1);
    }
  });

  it('never asks for the meaning of an unused slot', () => {
    for (const ex of exercises) {
      if (ex.type !== 'recognition' && ex.type !== 'formBuild' && ex.type !== 'formIdentify')
        continue;
      const item = data.items.get(ex.target);
      const shown = [ex.prompt.liraasa, ...(ex.answer.kind === 'typed' ? ex.answer.accepted : [])];
      for (const f of item?.forms ?? []) {
        if (!f.meaningful && f.slot !== 'root') expect(shown, ex.id).not.toContain(f.form);
      }
    }
  });

  it('is reproducible: the same seed gives the same exercises', () => {
    expect(thousand('acceptance').map((e) => JSON.stringify(e))).toEqual(
      exercises.map((e) => JSON.stringify(e)),
    );
    expect(thousand('another').map((e) => e.id)).not.toEqual(exercises.map((e) => e.id));
  });

  it('every typed and ordered exercise grades its own answer as correct', () => {
    for (const ex of exercises) {
      const a = ex.answer;
      const response =
        a.kind === 'choice'
          ? { kind: 'choice' as const, id: a.correct }
          : a.kind === 'typed'
            ? { kind: 'typed' as const, text: a.accepted[0] ?? '' }
            : a.kind === 'order'
              ? { kind: 'order' as const, ids: a.correct }
              : a.kind === 'multi'
                ? { kind: 'multi' as const, ids: a.correct }
                : { kind: 'pairs' as const, pairs: a.pairs };
      expect(gradeExercise(gctx, ex, response).verdict, ex.id).toBe('correct');
    }
  });
});

describe('plausible distractors', () => {
  it('draw on the same theme or a similar sound, never a random word', () => {
    const rng = createRng(1);
    const amor = idOf('amor');
    const ex = recognition(ctx, amor, rng);
    expect(ex).not.toBeNull();
    const item = data.items.get(amor);
    for (const c of ex?.choices ?? []) {
      if (c.id === amor) continue;
      const d = data.items.get(c.id);
      const related =
        d?.theme === item?.theme ||
        Math.abs((d?.spelling.length ?? 0) - (item?.spelling.length ?? 0)) <= 2;
      expect(related, d?.spelling).toBe(true);
    }
  });
});

describe('grading a word', () => {
  const recallOf = (spelling: string): Exercise => {
    const ex = recall(ctx, idOf(spelling));
    if (ex === null) throw new Error('no exercise');
    return ex;
  };
  const typed = (ex: Exercise, text: string) => gradeExercise(gctx, ex, { kind: 'typed', text });

  it('accepts any case and stray punctuation', () => {
    expect(typed(recallOf('amor'), '  Amor. ').verdict).toBe('correct');
  });

  it('calls a near miss that is no word a typo: almost, not a fail', () => {
    const g = typed(recallOf('amor'), 'amro');
    expect(g.verdict).toBe('almost');
    expect(g.diagnoses[0]?.kind).toBe('typo');
  });

  it('calls the right root with the wrong ending a wrong form, linked to the rule', () => {
    const g = typed(recallOf('amor'), 'amora');
    expect(g.verdict).toBe('wrong');
    expect(g.diagnoses[0]).toMatchObject({
      kind: 'wrong-form',
      link: { kind: 'concept', id: 'form:root' },
    });
  });

  it('calls a different real word a wrong root, even when it is one letter away', () => {
    const g = typed(recallOf('amor'), 'lira');
    expect(g.diagnoses[0]).toMatchObject({
      kind: 'wrong-root',
      link: { kind: 'item', id: idOf('amor') },
    });
  });

  it('calls a pre-1.0 spelling almost, and shows the current one', () => {
    const g = typed(recallOf('sirla'), 'burla');
    expect(g.verdict).toBe('almost');
    expect(g.diagnoses[0]?.kind).toBe('old-spelling');
  });

  it('calls gibberish not a word', () => {
    expect(typed(recallOf('amor'), 'qqqqqq').diagnoses[0]?.kind).toBe('not-a-word');
  });
});

describe('grading a sentence', () => {
  const g = (typedText: string, expected: string) => gradeSentence(gctx, typedText, expected);

  it('a right answer is right', () => {
    expect(g('maivo amora taivo', 'Maivo amora taivo.').verdict).toBe('correct');
  });

  it('names word order', () => {
    expect(g('Maivo taivo amora.', 'Maivo amora taivo.').diagnoses[0]).toMatchObject({
      kind: 'wrong-order',
      link: { id: 'clause' },
    });
  });

  it('names a wrong form inside a sentence', () => {
    expect(g('Maivo amorsan taivo.', 'Maivo amora taivo.').diagnoses[0]?.kind).toBe('wrong-form');
  });

  it('names a missing particle', () => {
    const d = g('Maivo lirala.', 'Maivo po lirala.').diagnoses[0];
    expect(d?.kind).toBe('missing-particle');
    expect(d?.link?.kind).toBe('item');
  });

  it('names an extra word', () => {
    expect(g('Maivo po po lirala.', 'Maivo po lirala.').diagnoses.map((d) => d.kind)).toContain(
      'extra-word',
    );
  });

  it('a typo inside a sentence is almost', () => {
    expect(g('Maivo po lirlaa.', 'Maivo po lirala.').verdict).toBe('almost');
  });
});

describe('grading English', () => {
  const ex = (): Exercise => {
    const e = translateFrom(ctx, sentence('Maivo amora taivo.'));
    if (e === null) throw new Error('no exercise');
    return e;
  };
  const typed = (text: string) => gradeExercise(gctx, ex(), { kind: 'typed', text });

  it('is tolerant: the data’s own synonyms are right', () => {
    expect(typed('I love you').verdict).toBe('correct');
    expect(typed('I care for you').verdict).toBe('correct');
  });

  it('a partial meaning is almost or wrong, and says what is missing', () => {
    const grade = typed('you');
    expect(grade.verdict).not.toBe('correct');
    expect(grade.diagnoses[0]?.kind).toBe('meaning-missing');
  });
});

describe('grading choices, tiles and pairs', () => {
  it('a wrong choice says what the chosen word means, and links to it', () => {
    const e = recognition(ctx, idOf('amor'), createRng(3));
    const wrong = e?.choices?.find((c) => c.id !== idOf('amor'));
    if (e === null || wrong === undefined) throw new Error('no exercise');
    const grade = gradeExercise(gctx, e, { kind: 'choice', id: wrong.id });
    expect(grade.verdict).toBe('wrong');
    expect(grade.diagnoses[0]).toMatchObject({ kind: 'wrong-choice', link: { id: wrong.id } });
  });

  it('compound parts the wrong way round are a word-order error', () => {
    const compound = [...data.items.values()].find((i) => i.kind === 'compound');
    const e = compound === undefined ? null : compoundBuild(ctx, compound.id, createRng(4));
    if (e === null || e.answer.kind !== 'order') throw new Error('no exercise');
    const grade = gradeExercise(gctx, e, { kind: 'order', ids: [...e.answer.correct].reverse() });
    expect(grade.diagnoses[0]).toMatchObject({ kind: 'wrong-order', link: { id: 'compound' } });
  });

  it('matching grades each pair, one slip is almost', () => {
    const ids = graph.order
      .filter((n) => n.startsWith('root:'))
      .slice(0, 5)
      .map((n) => n.slice(5));
    const e = matching(ctx, ids, createRng(5));
    if (e === null || e.answer.kind !== 'pairs') throw new Error('no exercise');
    const pairs = { ...e.answer.pairs };
    const [a, b] = Object.keys(pairs);
    if (a === undefined || b === undefined) throw new Error('too few pairs');
    [pairs[a], pairs[b]] = [pairs[b] ?? '', pairs[a] ?? ''];
    expect(gradeExercise(gctx, e, { kind: 'pairs', pairs }).verdict).toBe('wrong');
    expect(gradeExercise(gctx, e, { kind: 'pairs', pairs: e.answer.pairs }).verdict).toBe(
      'correct',
    );
  });
});

describe('sessions', () => {
  it('mix formats rather than drilling one', () => {
    const nodes = graph.units.slice(0, 3).flatMap((u) => u.nodes);
    const session = mixedSession(ctx, nodes, createRng('mix'), 20);
    expect(session).toHaveLength(20);
    let repeats = 0;
    for (let i = 1; i < session.length; i += 1) {
      if (session[i]?.type === session[i - 1]?.type) repeats += 1;
    }
    expect(repeats).toBeLessThanOrEqual(3);
    expect(new Set(session.map((e) => e.type)).size).toBeGreaterThanOrEqual(6);
  });

  it('hide audio exercises until a clip exists, then offer them', () => {
    const amor = idOf('amor');
    const without = exercisesForNode(ctx, `root:${amor}`, createRng(9));
    expect(without.some((e) => e.type === 'listen')).toBe(false);
    const withAudio = exercisesForNode(
      { ...ctx, audio: new Set([amor]) },
      `root:${amor}`,
      createRng(9),
    );
    expect(withAudio.find((e) => e.type === 'listen')?.audio).toBe(amor);
  });
});
