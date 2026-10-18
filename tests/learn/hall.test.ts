import { beforeAll, describe, expect, it } from 'vitest';
import {
  DEFAULT_HALL_SETTINGS,
  HALL_SCHEMA,
  HALL_SETTING_VALUES,
  activeProfile,
  buildLearnSource,
  cardId,
  createStore,
  exportStore,
  greeting,
  hallOf,
  hallSummary,
  importStore,
  readHallSettings,
  recordReview,
  recordVisit,
  setHall,
  updateHallSettings,
  type LearnData,
} from '@core/learn';
import { loadLearnInput } from '../../scripts/learn_inputs';

/** The Training Hall's state (Hall Phase 2): settings, visits, the hub's numbers. */

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 9, 18, 9);

let data: LearnData;
beforeAll(() => {
  data = buildLearnSource(loadLearnInput()).data;
});

const fresh = () => activeProfile(createStore('1.2', T0));

describe('Hall settings', () => {
  it('start at the defaults on a profile that has never opened the Hall', () => {
    const state = hallOf(fresh());
    expect(state).toEqual({
      schema: HALL_SCHEMA,
      settings: DEFAULT_HALL_SETTINGS,
      lastVisit: null,
      previousVisit: null,
    });
  });

  it('replace an invalid or unknown value with the default, and keep the valid ones', () => {
    expect(readHallSettings({ stars: 7, drill: 30, gloss: 'never', hints: 'always' })).toEqual({
      ...DEFAULT_HALL_SETTINGS,
      drill: 30,
      hints: 'always',
    });
    expect(readHallSettings('nonsense')).toEqual(DEFAULT_HALL_SETTINGS);
  });

  it('change only what the patch makes valid', () => {
    const p = fresh();
    updateHallSettings(p, { stars: 15, loom: 'deep' });
    const after = updateHallSettings(p, { stars: 11, leniency: 'lenient' });
    expect(after).toEqual({
      ...DEFAULT_HALL_SETTINGS,
      stars: 15,
      loom: 'deep',
      leniency: 'lenient',
    });
  });

  it('list every allowed value, the default among them', () => {
    for (const [key, values] of Object.entries(HALL_SETTING_VALUES)) {
      expect(values).toContain(DEFAULT_HALL_SETTINGS[key as keyof typeof DEFAULT_HALL_SETTINGS]);
    }
  });

  it('travel with the progress export, byte for byte', () => {
    const store = createStore('1.2', T0);
    const p = activeProfile(store);
    updateHallSettings(p, { stars: 20, gloss: 'hidden' });
    recordVisit(p, T0);
    const json = exportStore(store);
    const back = importStore(json);
    expect(exportStore(back)).toBe(json);
    expect(hallOf(activeProfile(back)).settings.stars).toBe(20);
  });

  it('refuse a Hall schema newer than this code, and keep unknown fields', () => {
    const p = fresh();
    setHall(p, { ...hallOf(p), schema: HALL_SCHEMA + 1 });
    expect(() => hallOf(p)).toThrow(/newer/);
    const q = fresh();
    (q as unknown as { hall: unknown }).hall = { schema: 0, futureField: 1 };
    expect(hallOf(q)).toMatchObject({ schema: HALL_SCHEMA, futureField: 1 });
  });
});

describe('the greeting', () => {
  it('is "first" on the first visit and stays so all that day', () => {
    const p = fresh();
    expect(greeting(recordVisit(p, T0))).toBe('first');
    expect(greeting(recordVisit(p, T0 + 3_600_000))).toBe('first');
  });

  it('is "again" the next day and "back" after a break, never a count of missed days', () => {
    const p = fresh();
    recordVisit(p, T0);
    expect(greeting(recordVisit(p, T0 + DAY))).toBe('again');
    expect(greeting(recordVisit(p, T0 + 9 * DAY))).toBe('back');
    expect(greeting(recordVisit(p, T0 + 9 * DAY + 60_000))).toBe('back');
  });
});

describe('the hub summary', () => {
  it('counts words met and steady, rules practised, and time this week', () => {
    const p = fresh();
    expect(hallSummary(p, data, T0)).toEqual({
      wordsMet: 0,
      wordsSteady: 0,
      rulesPracticed: 0,
      minutesThisWeek: 0,
      daysThisWeek: 0,
      due: 0,
    });
    const word = [...data.items.values()].find((i) => i.kind === 'root');
    const concept = [...data.concepts.values()][0];
    if (word === undefined || concept === undefined) throw new Error('no data');
    const good = { verdict: 'correct' as const, rating: 3 as const };
    recordReview(p, data, cardId(word.id, 'meaning', 'recognize'), good, 'recognition', T0, 90_000);
    recordReview(
      p,
      data,
      cardId(concept.id, 'grammar', 'recognize'),
      good,
      'cloze',
      T0 + DAY,
      30_000,
    );
    const s = hallSummary(p, data, T0 + DAY);
    expect(s.wordsMet).toBe(1);
    expect(s.rulesPracticed).toBe(1);
    expect(s.minutesThisWeek).toBe(2);
    expect(s.daysThisWeek).toBe(2);
    // a week later, that time is no longer this week
    expect(hallSummary(p, data, T0 + 8 * DAY).minutesThisWeek).toBe(0);
  });
});
