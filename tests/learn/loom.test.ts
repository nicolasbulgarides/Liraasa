import { beforeAll, describe, expect, it } from 'vitest';
import {
  EMPTY_OVERRIDES,
  LOOM_TYPES,
  buildLearnSource,
  choose,
  createRng,
  exercisesForRule,
  gradeLoom,
  loomSentences,
  loomSession,
  mend,
  problemsOf,
  ruleCard,
  ruleMap,
  transform,
  translateTo,
  withPrereqs,
  type Exercise,
  type LearnData,
  type LineCheck,
  type LoomContext,
  type Response,
} from '@core/learn';
import { loadChecker } from '../checker/loadChecker';
import { loadLearnInput } from '../../scripts/learn_inputs';

/**
 * The Loom (Hall Phase 5), on the real 1.2 data and the real grammar checker:
 * every exercise starts from a sentence the checker passes, every broken
 * sentence is one the checker flags, and every answer is graded by it.
 */

let data: LearnData;
let ctx: LoomContext;
let check: LineCheck;

beforeAll(() => {
  const source = buildLearnSource(loadLearnInput());
  data = source.data;
  const { checker } = loadChecker();
  check = (line) => checker.checkLine(line, 1, undefined, { register: 'poetic' });
  ctx = { exercise: { data }, link: source.context, check };
});

const clean = (line: string): boolean => problemsOf(check, line).length === 0;

function rightAnswer(ex: Exercise): Response {
  const a = ex.answer;
  if (a.kind === 'choice') return { kind: 'choice', id: a.correct };
  if (a.kind === 'typed') return { kind: 'typed', text: a.accepted[0] ?? '' };
  if (a.kind === 'order') return { kind: 'order', ids: a.correct };
  if (a.kind === 'multi') return { kind: 'multi', ids: a.correct };
  return { kind: 'pairs', pairs: a.pairs };
}

const RULES = [
  'slot:TENSE',
  'slot:NEGATION',
  'slot:QUESTION',
  'slot:MODAL',
  'form:verb',
  'nounPhrase',
  'rule:1.2:G24',
];

describe('the rule map', () => {
  it('holds every concept, with each prerequisite above what builds on it', () => {
    const map = ruleMap(ctx, EMPTY_OVERRIDES);
    expect(map.length).toBe(data.concepts.size);
    const depth = new Map(map.map((m) => [m.id, m.depth]));
    for (const m of map)
      for (const p of m.prereqs) expect(depth.get(p) ?? -1).toBeLessThan(m.depth);
    expect(new Set(map.map((m) => m.group))).toEqual(
      new Set(['forms', 'clause', 'phrase', 'rulings']),
    );
  });

  it('leaves out excluded concepts and counts the sentences each can use', () => {
    const map = ruleMap(ctx, { ...EMPTY_OVERRIDES, exclude: ['slot:TENSE'] });
    expect(map.some((m) => m.id === 'slot:TENSE')).toBe(false);
    const q = map.find((m) => m.id === 'slot:QUESTION');
    expect(q?.sentences).toBe(loomSentences(ctx, 'slot:QUESTION', 99).length);
  });
});

describe('rule cards', () => {
  it('split the data’s own description into pattern and explanation, and list each word once', () => {
    const card = ruleCard(ctx, 'slot:TENSE', EMPTY_OVERRIDES);
    const c = data.concepts.get('slot:TENSE');
    expect(`${card?.pattern ?? ''} — ${card?.explanation ?? ''}`).toBe(c?.description);
    const spellings = card?.words.map((w) => w.spelling) ?? [];
    expect(new Set(spellings).size).toBe(spellings.length);
    expect(card?.examples.length).toBeGreaterThanOrEqual(2);
    for (const e of card?.examples ?? []) expect(clean(e.liraasa)).toBe(true);
  });

  it('give a ruling its text as the explanation, its edition as the version', () => {
    const card = ruleCard(ctx, 'rule:1.2:G24', EMPTY_OVERRIDES);
    expect(card?.pattern).toBeNull();
    expect(card?.explanation).toBe(data.concepts.get('rule:1.2:G24')?.description);
    expect(card?.version).toBe('1.2');
  });
});

describe('every exercise', () => {
  it('starts from a sentence the checker passes and grades its own answer as right', () => {
    let n = 0;
    for (const id of RULES) {
      for (const [, list] of exercisesForRule(ctx, id, createRng(id))) {
        for (const ex of list) {
          n += 1;
          const source = data.examples.find((e) => e.key === ex.source);
          if (source !== undefined) expect(clean(source.liraasa), source.liraasa).toBe(true);
          expect(gradeLoom(ctx, ex, rightAnswer(ex), 3000).verdict, ex.id).toBe('correct');
        }
      }
    }
    expect(n).toBeGreaterThan(150);
  });

  it('is built the same way from the same seed', () => {
    const a = loomSession(ctx, RULES, createRng(5), { length: 25, types: LOOM_TYPES });
    const b = loomSession(ctx, RULES, createRng(5), { length: 25, types: LOOM_TYPES });
    expect(b.map((e) => e.id)).toEqual(a.map((e) => e.id));
    expect(new Set(a.map((e) => e.id)).size).toBe(a.length);
  });

  it('keeps to the types chosen', () => {
    const only = loomSession(ctx, RULES, createRng(6), { length: 10, types: ['mend'] });
    expect(only.length).toBe(10);
    expect(only.every((e) => e.type === 'mend')).toBe(true);
  });
});

describe('transform', () => {
  it('adds a word of the slot, every answer passes the checker, and none puts it before the subject', () => {
    for (const id of ['slot:TENSE', 'slot:NEGATION', 'slot:QUESTION', 'slot:MODAL']) {
      const list = exercisesForRule(ctx, id, createRng(id), ['transform']).get('transform') ?? [];
      expect(list.length, id).toBeGreaterThan(0);
      const slotWords = new Set(
        (data.concepts.get(id)?.words ?? []).map((w) => data.items.get(w)?.spelling),
      );
      for (const ex of list) {
        if (ex.answer.kind !== 'typed') throw new Error('typed');
        const added = ex.items[ex.items.length - 1] ?? '';
        expect(slotWords).toContain(data.items.get(added)?.spelling);
        for (const a of ex.answer.accepted) {
          expect(clean(a), a).toBe(true);
          const first = a.split(' ')[0]?.toLowerCase();
          if (id !== 'slot:QUESTION' && first === data.items.get(added)?.spelling) {
            // a slot after the subject opens the sentence only when it had no subject
            expect(['root', 'compound', 'pronoun'], a).not.toContain(firstKind(ex));
          }
        }
      }
    }
  });

  it('is dropped when the sentence already has a word of that slot', () => {
    const e = loomSentences(ctx, 'slot:TENSE', 50).find((x) =>
      (data.concepts.get('slot:TENSE')?.words ?? []).some((w) => x.ids.includes(w)),
    );
    if (e === undefined) throw new Error('no tensed sentence');
    expect(transform(ctx, e, 'slot:TENSE', createRng(1))).toBeNull();
  });

  it('accepts either place when the template allows two', () => {
    const list =
      exercisesForRule(ctx, 'slot:NEGATION', createRng(3), ['transform']).get('transform') ?? [];
    const two = list.find((ex) => ex.answer.kind === 'typed' && ex.answer.accepted.length === 2);
    if (two === undefined || two.answer.kind !== 'typed') return;
    for (const a of two.answer.accepted) {
      expect(gradeLoom(ctx, two, { kind: 'typed', text: a }, 3000).verdict).toBe('correct');
    }
  });
});

describe('mend and choose', () => {
  it('break a sentence in one place the checker flags, and explain it in the checker’s words', () => {
    let n = 0;
    for (const e of loomSentences(ctx, 'clause', 30)) {
      const m = mend(ctx, e, createRng(e.key), 'clause');
      if (m === null || m.answer.kind !== 'typed') continue;
      n += 1;
      expect(problemsOf(check, m.prompt.liraasa ?? '').length, m.prompt.liraasa).toBeGreaterThan(0);
      expect(m.prefill).toBe(m.prompt.liraasa);
      expect(clean(m.answer.accepted[0] ?? '')).toBe(true);
      expect(m.explain?.wrong).toBe(problemsOf(check, m.prompt.liraasa ?? '')[0]?.message);
      const left = gradeLoom(ctx, m, { kind: 'typed', text: m.prompt.liraasa ?? '' }, 3000);
      expect(left.verdict).not.toBe('correct');
      expect(left.diagnoses.some((d) => d.kind === 'checker')).toBe(true);
    }
    expect(n).toBeGreaterThan(15);
  });

  it('choose offers exactly one grammatical sentence', () => {
    for (const e of loomSentences(ctx, 'clause', 20)) {
      const c = choose(ctx, e, createRng(e.key), 'clause');
      if (c === null) continue;
      const ok = (c.choices ?? []).filter((x) => clean(x.text));
      expect(ok.map((x) => x.id)).toEqual(['ok']);
      const wrong = (c.choices ?? []).find((x) => x.id !== 'ok');
      const g = gradeLoom(ctx, c, { kind: 'choice', id: wrong?.id ?? '' }, 3000);
      expect(g.diagnoses.some((d) => d.kind === 'checker')).toBe(true);
    }
  });
});

describe('grading what the engine can and cannot judge', () => {
  it('never accepts a sentence with its content words reordered, even when it is grammatical', () => {
    let tried = 0;
    for (const e of loomSentences(ctx, 'clause', 80)) {
      const heads = e.tokens
        .map((t, i) => ({ t, i }))
        .filter(
          ({ t }) =>
            t.link.kind === 'entry' &&
            t.link.refs.some((r) =>
              ['root', 'compound', 'pronoun'].includes(data.items.get(r.id)?.kind ?? ''),
            ),
        );
      const a = heads[0];
      const b = heads[heads.length - 1];
      if (a === undefined || b === undefined || a.i === b.i) continue;
      const words = e.tokens.map((t) => t.text.toLowerCase());
      [words[a.i], words[b.i]] = [words[b.i] ?? '', words[a.i] ?? ''];
      const swapped = words.join(' ');
      if (normalizeSame(swapped, e.liraasa)) continue;
      const ex = translateTo(ctx.exercise, e, 'clause');
      if (ex === null) continue;
      tried += 1;
      expect(gradeLoom(ctx, ex, { kind: 'typed', text: swapped }, 3000).verdict).not.toBe(
        'correct',
      );
    }
    expect(tried).toBeGreaterThan(10);
  });

  it('says it cannot tell when a translation is grammatical but in other words', () => {
    const [e, other] = loomSentences(ctx, 'clause', 40).filter((x) => x.english !== null);
    if (e === undefined || other === undefined) throw new Error('no sentences');
    const ex = translateTo(ctx.exercise, e, 'clause');
    if (ex === null) throw new Error('no exercise');
    const g = gradeLoom(ctx, ex, { kind: 'typed', text: other.liraasa }, 3000);
    expect(g.verdict).toBe('almost');
    expect(g.diagnoses[0]?.kind).toBe('unverified');
  });

  it('a rule and its prerequisites, for a focused session', () => {
    const rules = withPrereqs(data, 'slot:TENSE');
    expect(rules[0]).toBe('slot:TENSE');
    expect(rules).toContain('clause');
    expect(rules).toContain('form:root');
  });
});

/** The kind of the first word of the sentence an exercise was made from. */
function firstKind(ex: Exercise): string | undefined {
  const link = data.examples.find((e) => e.key === ex.source)?.tokens[0]?.link;
  return link?.kind === 'entry' ? data.items.get(link.refs[0]?.id ?? '')?.kind : undefined;
}

const normalizeSame = (a: string, b: string): boolean =>
  a.toLowerCase().replace(/[.!?]/g, '').trim() === b.toLowerCase().replace(/[.!?]/g, '').trim();
