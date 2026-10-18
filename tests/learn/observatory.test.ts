import { beforeAll, describe, expect, it } from 'vitest';
import {
  EMPTY_OVERRIDES,
  acknowledgeRetired,
  activeProfile,
  buildLearnSource,
  buildSkillGraph,
  cardId,
  changedCards,
  changesFor,
  createFormsEngine,
  createStore,
  exportStore,
  importStore,
  introduce,
  reconcile,
  recordReview,
  respellRoot,
  retireRoot,
  rulesLit,
  skyOf,
  streakOf,
  type FormsEngine,
  type LearnData,
  type LearnInput,
  type Profile,
  type SkillGraph,
} from '@core/learn';
import { loadLearnInput } from '../../scripts/learn_inputs';

/** The Observatory (Hall Phase 7): the sky, the rules, the rhythm, the changes. */

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 9, 18, 9);
const good = { verdict: 'correct' as const, rating: 3 as const };

let input: LearnInput;
let data: LearnData;
let graph: SkillGraph;
let forms: FormsEngine;

beforeAll(() => {
  input = loadLearnInput();
  const source = buildLearnSource(input);
  data = source.data;
  graph = buildSkillGraph(data, EMPTY_OVERRIDES);
  forms = createFormsEngine({ data, morphology: input.lexicon.morphology });
});

const fresh = (): Profile => activeProfile(createStore(data.edition, T0));
const idOf = (spelling: string): string =>
  [...data.items.values()].find((i) => i.kind === 'root' && i.spelling === spelling)?.id ?? '';
const heads = () =>
  [...data.items.values()].filter((i) => i.kind === 'root' || i.kind === 'compound');

describe('the sky', () => {
  it('holds every headword met, oldest first, and brightens as it is learned', () => {
    const p = fresh();
    const [a, b] = heads();
    introduce(p, data, graph, `root:${a?.id ?? ''}`, T0);
    introduce(p, data, graph, `root:${b?.id ?? ''}`, T0 + DAY);
    let sky = skyOf(p, data, forms, T0 + DAY);
    expect(sky.map((s) => s.id)).toEqual([a?.id, b?.id]);
    expect(sky[0]?.mastery).toBe(0);
    for (let d = 0; d < 3; d += 1) {
      for (const c of Object.values(p.cards).filter((x) => x.target === a?.id)) {
        recordReview(p, data, c.id, good, 'recall', T0 + d * DAY);
      }
    }
    sky = skyOf(p, data, forms, T0 + 3 * DAY);
    expect(sky[0]?.mastery).toBeGreaterThan(0.5);
  });

  it('marks the word that goes its own way, and leaves out closed-class words', () => {
    const p = fresh();
    const irregular = forms.irregularIds()[0] ?? '';
    introduce(p, data, graph, `root:${irregular}`, T0);
    const fw = [...data.items.values()].find((i) => i.kind === 'functionWord');
    recordReview(p, data, cardId(fw?.id ?? '', 'meaning', 'recognize'), good, 'recall', T0);
    const sky = skyOf(p, data, forms, T0);
    expect(sky.map((s) => [s.id, s.irregular])).toEqual([[irregular, true]]);
  });
});

describe('rules and rhythm', () => {
  it('lights the rules practised, best known first', () => {
    const p = fresh();
    const [x, y] = [...data.concepts.keys()];
    recordReview(p, data, cardId(x ?? '', 'grammar', 'produce'), good, 'cloze', T0);
    recordReview(
      p,
      data,
      cardId(y ?? '', 'grammar', 'produce'),
      { verdict: 'wrong', rating: 1 },
      'cloze',
      T0,
    );
    const lit = rulesLit(p, data, T0 + 1000);
    expect(lit.map((r) => r.id)).toEqual([x, y]);
    expect(lit[0]?.reviews).toBe(1);
  });

  it('counts days in a row up to today or yesterday, and nothing after a break', () => {
    const p = fresh();
    const card = cardId(heads()[0]?.id ?? '', 'meaning', 'recognize');
    for (const d of [0, 1, 2, 4, 5]) recordReview(p, data, card, good, 'recall', T0 + d * DAY);
    expect(streakOf(p, T0 + 5 * DAY)).toBe(2);
    expect(streakOf(p, T0 + 6 * DAY)).toBe(2);
    expect(streakOf(p, T0 + 9 * DAY)).toBe(0);
    expect(streakOf(fresh(), T0)).toBe(0);
  });
});

describe('what changed', () => {
  it('a respelled word is one note, its cards badged, and a review clears it', () => {
    const p = fresh();
    const id = idOf('sirla');
    introduce(p, data, graph, `root:${id}`, T0);
    for (const c of Object.keys(p.cards)) recordReview(p, data, c, good, 'recall', T0);
    const r = respellRoot(input.lexicon, id, 'burla', 'restore the 0.8 spelling (test)');
    if (!r.ok) throw new Error(r.problems.join('; '));
    const after = buildLearnSource({ ...input, lexicon: r.lexicon, corpus: [] });
    reconcile(
      p,
      after.data,
      buildSkillGraph(after.data, EMPTY_OVERRIDES),
      T0 + DAY,
      after.replacementFor,
    );
    const notes = changesFor(p, after.data);
    expect(notes).toEqual([
      expect.objectContaining({
        kind: 'renamed',
        target: id,
        from: 'sirla',
        to: 'burla',
        was: 'sirla',
      }),
    ]);
    expect(changedCards(p).length).toBe(notes[0]?.cards.length);
    for (const c of changedCards(p)) recordReview(p, after.data, c, good, 'recall', T0 + 2 * DAY);
    expect(changesFor(p, after.data)).toEqual([]);
  });

  it('a retired word is said once, with its replacement, until acknowledged', () => {
    const p = fresh();
    const id = idOf('sirla');
    const replacement = heads().find((i) => i.kind === 'compound');
    introduce(p, data, graph, `root:${id}`, T0);
    const r = retireRoot(input.lexicon, id, replacement?.id ?? '', 'test');
    if (!r.ok) throw new Error(r.problems.join('; '));
    const after = buildLearnSource({ ...input, lexicon: r.lexicon, corpus: [] });
    reconcile(
      p,
      after.data,
      buildSkillGraph(after.data, EMPTY_OVERRIDES),
      T0 + DAY,
      after.replacementFor,
    );
    const retired = changesFor(p, after.data).filter((n) => n.kind === 'retired');
    expect(retired).toEqual([
      expect.objectContaining({ target: id, was: 'sirla', replacement: replacement?.id }),
    ]);
    expect(skyOf(p, after.data, forms, T0 + DAY).map((s) => s.id)).not.toContain(id);
    acknowledgeRetired(p, [id]);
    expect(changesFor(p, after.data).filter((n) => n.kind === 'retired')).toEqual([]);
    // and the acknowledgement travels with the export
    const store = createStore(data.edition, T0);
    store.profiles[store.active] = p;
    const back = activeProfile(importStore(exportStore(store)));
    expect(changesFor(back, after.data).filter((n) => n.kind === 'retired')).toEqual([]);
  });
});
