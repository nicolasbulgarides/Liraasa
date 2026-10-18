import { beforeAll, describe, expect, it } from 'vitest';
import {
  DEFAULT_DRAW,
  EMPTY_OVERRIDES,
  activeProfile,
  buildLearnSource,
  buildSkillGraph,
  cardId,
  createFormsEngine,
  createStore,
  drawPool,
  drawStars,
  exportStore,
  importStore,
  introduce,
  markKnown,
  recordReview,
  rerollAll,
  rerollOne,
  respellRoot,
  retireRoot,
  setStars,
  starsOf,
  togglePin,
  type DrawContext,
  type DrawOptions,
  type FormsEngine,
  type LearnData,
  type LearnInput,
  type SkillGraph,
} from '@core/learn';
import { loadLearnInput } from '../../scripts/learn_inputs';

/** Ten Stars, the draw (Hall Phase 3): seeded, distinct, current, by id. */

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 9, 18, 9);

let input: LearnInput;
let data: LearnData;
let forms: FormsEngine;
let graph: SkillGraph;

beforeAll(() => {
  input = loadLearnInput();
  data = buildLearnSource(input).data;
  forms = createFormsEngine({ data, morphology: input.lexicon.morphology });
  graph = buildSkillGraph(data, EMPTY_OVERRIDES);
});

const ctx = (over: Partial<DrawContext> = {}): DrawContext => ({
  data,
  forms,
  profile: activeProfile(createStore(data.edition, T0)),
  now: T0,
  ...over,
});
const opts = (o: Partial<DrawOptions> = {}): DrawOptions => ({ ...DEFAULT_DRAW, ...o });
const headwords = () =>
  [...data.items.values()].filter((i) => i.kind === 'root' || i.kind === 'compound');
const idOf = (spelling: string): string =>
  headwords().find((i) => i.spelling === spelling)?.id ?? '';

describe('a draw', () => {
  it('holds ten distinct current headwords', () => {
    for (let i = 0; i < 50; i += 1) {
      const d = drawStars(ctx(), opts(), `seed-${String(i)}`);
      expect(d.ids.length).toBe(10);
      expect(new Set(d.ids).size).toBe(10);
      for (const id of d.ids) expect(['root', 'compound']).toContain(data.items.get(id)?.kind);
    }
  });

  it('is the same for the same seed and different for another', () => {
    const a = drawStars(ctx(), opts(), 'night');
    expect(drawStars(ctx(), opts(), 'night').ids).toEqual(a.ids);
    expect(drawStars(ctx(), opts(), 'day').ids).not.toEqual(a.ids);
  });

  it('takes the count it is given', () => {
    for (const count of [5, 15, 20]) {
      expect(drawStars(ctx(), opts({ count }), 's').ids.length).toBe(count);
    }
  });

  it('is shorter, not padded, when the pool is smaller than the count', () => {
    const d = drawStars(ctx(), opts({ only: 'irregular' }), 's');
    expect(d.pool).toBe(forms.irregularIds().length);
    expect(d.ids).toEqual([...forms.irregularIds()]);
  });
});

describe('narrowing the pool', () => {
  it('by theme, edition, kind and sense', () => {
    const theme = headwords()[0]?.theme ?? '';
    for (const id of drawPool(ctx(), opts({ themes: [theme] })))
      expect(data.items.get(id)?.theme).toBe(theme);
    for (const id of drawPool(ctx(), opts({ since: ['1.2'] })))
      expect(data.items.get(id)?.since).toBe('1.2');
    for (const id of drawPool(ctx(), opts({ shape: 'compound' })))
      expect(data.items.get(id)?.kind).toBe('compound');
    const verbs = drawPool(ctx(), opts({ senses: ['verb'] }));
    expect(verbs.length).toBeGreaterThan(0);
    for (const id of verbs) {
      expect(data.items.get(id)?.forms.find((f) => f.slot === 'verb')?.meaningful).toBe(true);
    }
  });

  it('to words that go their own way', () => {
    const pool = drawPool(ctx(), opts({ only: 'surprising' }));
    expect(pool.length).toBeGreaterThan(forms.irregularIds().length);
    for (const id of forms.irregularIds()) expect(pool).toContain(id);
  });

  it('to words not met yet, and to words missed before', () => {
    const c = ctx();
    const word = headwords()[0]?.id ?? '';
    introduce(c.profile, data, graph, `root:${word}`, T0);
    expect(drawPool(c, opts({ only: 'unseen' }))).not.toContain(word);
    expect(drawPool(c, opts({ only: 'missed' }))).toEqual([]);
    recordReview(
      c.profile,
      data,
      cardId(word, 'meaning', 'recognize'),
      { verdict: 'wrong', rating: 1 },
      'recall',
      T0,
    );
    expect(drawPool(c, opts({ only: 'missed' }))).toEqual([word]);
  });
});

describe('weighting', () => {
  it('"due" draws every due word first, then fills from the rest', () => {
    const c = ctx();
    const due = headwords()
      .slice(100, 110)
      .map((h) => h.id);
    for (const id of due) {
      recordReview(
        c.profile,
        data,
        cardId(id, 'meaning', 'recognize'),
        { verdict: 'correct', rating: 3 },
        'recall',
        T0,
      );
    }
    const later = { ...c, now: T0 + 400 * DAY };
    expect([...drawStars(later, opts({ weighting: 'due' }), 's').ids].sort()).toEqual(
      [...due].sort(),
    );
  });

  it('"new" draws words not met before any word met', () => {
    const c = ctx();
    const met = headwords()
      .slice(0, 1400)
      .map((h) => h.id);
    for (const id of met) introduce(c.profile, data, graph, `root:${id}`, T0);
    const d = drawStars(c, opts({ weighting: 'new' }), 's');
    expect(d.ids.filter((id) => met.includes(id))).toEqual([]);
  });
});

describe('rerolling and pinning', () => {
  it('reroll one replaces that word only, with a word not already drawn', () => {
    const c = ctx();
    let d = drawStars(c, opts(), 's');
    for (let i = 0; i < 30; i += 1) {
      const target = d.ids[i % d.ids.length] ?? '';
      const next = rerollOne(c, d, target);
      expect(next.ids).not.toContain(target);
      expect(new Set(next.ids).size).toBe(next.ids.length);
      expect(next.ids.filter((id, k) => id !== d.ids[k]).length).toBe(1);
      d = next;
    }
  });

  it('a pinned word survives reroll-one and reroll-all', () => {
    const c = ctx();
    let d = drawStars(c, opts(), 's');
    const pin = d.ids[3] ?? '';
    d = togglePin(d, pin);
    expect(rerollOne(c, d, pin)).toBe(d);
    for (let i = 0; i < 10; i += 1) {
      d = rerollAll(c, d);
      expect(d.ids).toContain(pin);
      expect(d.ids.length).toBe(10);
      expect(new Set(d.ids).size).toBe(10);
    }
    expect(togglePin(d, pin).pinned).toEqual([]);
  });

  it('reroll-all with a seed is reproducible', () => {
    const c = ctx();
    const d = drawStars(c, opts(), 's');
    expect(rerollAll(c, d).ids).toEqual(rerollAll(c, d).ids);
    expect(rerollAll(c, d).ids).not.toEqual(d.ids);
  });

  it('reroll-one leaves the draw as it is when nothing else matches', () => {
    const c = ctx();
    const d = drawStars(c, opts({ only: 'irregular' }), 's');
    expect(rerollOne(c, d, d.ids[0] ?? '')).toBe(d);
  });
});

describe('across language changes', () => {
  it('never draws a retired root, and a saved draw drops it and says so', () => {
    const id = idOf('sirla');
    const replacement = headwords().find((i) => i.kind === 'compound');
    const r = retireRoot(input.lexicon, id, replacement?.id ?? '', 'test');
    if (!r.ok) throw new Error(r.problems.join('; '));
    const after = buildLearnSource({ ...input, lexicon: r.lexicon, corpus: [] }).data;
    const c = ctx({
      data: after,
      forms: createFormsEngine({ data: after, morphology: r.lexicon.morphology }),
    });
    expect(drawPool(c, opts())).not.toContain(id);
    for (let i = 0; i < 100; i += 1) expect(drawStars(c, opts(), String(i)).ids).not.toContain(id);

    const p = activeProfile(createStore(data.edition, T0));
    const saved = drawStars(ctx(), opts({ count: 3 }), 's', [id]);
    setStars(p, { options: saved.options, draw: saved, phase: 'study', index: 2, studied: [id] });
    const load = starsOf(p, after);
    expect(load.retired).toEqual([id]);
    expect(load.state.draw?.ids).not.toContain(id);
    expect(load.state.draw?.ids.length).toBe(2);
    expect(load.state.studied).toEqual([]);
    expect(load.state.index).toBeLessThanOrEqual(1);
  });

  it('keeps a respelled word in a saved draw: the id is the same, the spelling is new', () => {
    const id = idOf('sirla');
    const r = respellRoot(input.lexicon, id, 'burla', 'restore the 0.8 spelling (test)');
    if (!r.ok) throw new Error(r.problems.join('; '));
    const after = buildLearnSource({ ...input, lexicon: r.lexicon, corpus: [] }).data;
    const p = activeProfile(createStore(data.edition, T0));
    const saved = drawStars(ctx(), opts({ count: 4 }), 's', [id]);
    setStars(p, { options: saved.options, draw: saved, phase: 'preview', index: 0, studied: [] });
    const load = starsOf(p, after);
    expect(load.retired).toEqual([]);
    expect(load.state.draw?.ids).toContain(id);
    expect(after.items.get(id)?.spelling).toBe('burla');
  });
});

describe('saved state', () => {
  it('travels with the progress export and reads back the same', () => {
    const store = createStore(data.edition, T0);
    const p = activeProfile(store);
    const d = togglePin(drawStars(ctx(), opts({ count: 5 }), 'keep'), headwords()[0]?.id ?? '');
    setStars(p, {
      options: d.options,
      draw: d,
      phase: 'study',
      index: 3,
      studied: d.ids.slice(0, 2),
    });
    const back = activeProfile(importStore(exportStore(store)));
    expect(starsOf(back, data).state).toEqual(starsOf(p, data).state);
  });

  it('reads nonsense as a fresh start', () => {
    const p = activeProfile(createStore(data.edition, T0));
    (p as unknown as { hall: unknown }).hall = {
      schema: 1,
      stars: { draw: 'x', options: { count: 'many', only: 'nope' } },
    };
    expect(starsOf(p, data).state).toEqual({
      options: DEFAULT_DRAW,
      draw: null,
      phase: 'preview',
      index: 0,
      studied: [],
    });
  });
});

describe('"I already know this one"', () => {
  it('introduces the word and schedules every card well into the future', () => {
    const p = activeProfile(createStore(data.edition, T0));
    const id =
      headwords().find((h) => h.forms.some((f) => f.slot === 'verb' && f.meaningful))?.id ?? '';
    markKnown(p, data, graph, id, T0);
    const cards = Object.values(p.cards).filter((c) => c.target === id);
    expect(cards.length).toBeGreaterThan(1);
    for (const c of cards) {
      expect(c.state.reps).toBe(1);
      expect(c.state.due).toBeGreaterThan(T0 + DAY);
    }
    expect(p.seen[`root:${id}`]).toBe(T0);
  });
});

describe('weighting by shakiness', () => {
  it('"weak" draws met words below the threshold first, and fills with the rest', () => {
    const c = ctx();
    const shaky = headwords()
      .slice(200, 204)
      .map((h) => h.id);
    for (const id of shaky) {
      recordReview(
        c.profile,
        data,
        cardId(id, 'meaning', 'recognize'),
        { verdict: 'wrong', rating: 1 },
        'recall',
        T0,
      );
    }
    const d = drawStars({ ...c, now: T0 + DAY }, DEFAULT_DRAW, 's');
    const weak = drawStars({ ...c, now: T0 + DAY }, { ...DEFAULT_DRAW, weighting: 'weak' }, 's');
    expect([...weak.ids.slice(0, 4)].sort()).toEqual([...shaky].sort());
    expect(weak.ids.length).toBe(10);
    expect(d.ids.filter((id) => shaky.includes(id)).length).toBeLessThan(4);
  });
});
