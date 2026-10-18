/**
 * The Training Hall's own state (Hall Phase 2): the learner's Hall settings,
 * when they last visited, and the gentle numbers the hub shows. Pure, like the
 * rest of the core.
 *
 * The state lives on the profile (`profile.hall`), so it travels with
 * progress export and import and with the profile it belongs to. It carries
 * its own schema number: `hallOf` reads any stored state, fills what is
 * missing, replaces what is invalid with the default, and refuses a schema
 * newer than this code knows, as `migrateStore` does for the whole store.
 *
 * Display preferences (sky, text size, font, motion, sound) are per viewer and
 * stay in the browser; they are not here.
 */
import { cardMastery, type Profile } from './progress';
import type { LearnData } from './types';

export const HALL_SCHEMA = 1;
const DAY = 86_400_000;

export const STAR_COUNTS = [5, 10, 15, 20] as const;
export const DRILL_LENGTHS = [10, 20, 30] as const;
export const LOOM_LENGTHS = { quick: 5, standard: 10, deep: 25 } as const;

export type StarCount = (typeof STAR_COUNTS)[number];
export type DrillLength = (typeof DRILL_LENGTHS)[number];
export type LoomLength = keyof typeof LOOM_LENGTHS;
export type Leniency = 'exact' | 'lenient';
export type Visibility = 'always' | 'onRequest' | 'hidden';
export type Hints = 'off' | 'onRequest' | 'always';

export interface HallSettings {
  /** How many words a Ten Stars draw holds. */
  stars: StarCount;
  /** Prompts in a Ten Stars drill. */
  drill: DrillLength;
  /** Exercises in a Loom session. */
  loom: LoomLength;
  /** `lenient` forgives a doubled or single vowel where the other was meant. */
  leniency: Leniency;
  /** The interlinear gloss line. */
  gloss: Visibility;
  hints: Hints;
}

export const DEFAULT_HALL_SETTINGS: HallSettings = {
  stars: 10,
  drill: 20,
  loom: 'standard',
  leniency: 'exact',
  gloss: 'onRequest',
  hints: 'onRequest',
};

export interface HallState {
  schema: number;
  settings: HallSettings;
  /** When the learner last opened the Hall; null before the first visit. */
  lastVisit: number | null;
  /** The visit before `lastVisit`: what the greeting compares with. */
  previousVisit: number | null;
  /** Ten Stars' saved draw and place, read and checked by `starsOf`. */
  stars?: unknown;
  /** Retired words the learner has been told about (the Observatory). */
  retiredSeen?: unknown;
}

export class HallError extends Error {}

/** Every value each setting may take. */
export const HALL_SETTING_VALUES: {
  readonly [K in keyof HallSettings]: readonly HallSettings[K][];
} = {
  stars: STAR_COUNTS,
  drill: DRILL_LENGTHS,
  loom: Object.keys(LOOM_LENGTHS) as LoomLength[],
  leniency: ['exact', 'lenient'],
  gloss: ['always', 'onRequest', 'hidden'],
  hints: ['off', 'onRequest', 'always'],
};
const SETTING_KEYS = Object.keys(DEFAULT_HALL_SETTINGS) as (keyof HallSettings)[];
const valid = (key: keyof HallSettings, value: unknown): boolean =>
  (HALL_SETTING_VALUES[key] as readonly unknown[]).includes(value);
const time = (x: unknown): number | null =>
  typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null;

/** Read a stored settings object: unknown or invalid values fall back to `base`. */
export function readHallSettings(
  raw: unknown,
  base: HallSettings = DEFAULT_HALL_SETTINGS,
): HallSettings {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const out = { ...base };
  for (const key of SETTING_KEYS) if (valid(key, r[key])) Object.assign(out, { [key]: r[key] });
  return out;
}

/** The profile's Hall state, read and brought up to the current schema. Never mutates. */
export function hallOf(profile: Profile): HallState {
  const raw = (profile as Profile & { hall?: unknown }).hall;
  if (raw === undefined || raw === null) {
    return {
      schema: HALL_SCHEMA,
      settings: { ...DEFAULT_HALL_SETTINGS },
      lastVisit: null,
      previousVisit: null,
    };
  }
  if (typeof raw !== 'object') throw new HallError('hall state must be an object');
  const r = raw as Record<string, unknown>;
  const schema = typeof r.schema === 'number' ? r.schema : 0;
  if (schema > HALL_SCHEMA) {
    throw new HallError(
      `hall schema ${String(schema)} is newer than this app (${String(HALL_SCHEMA)})`,
    );
  }
  return {
    ...r,
    schema: HALL_SCHEMA,
    settings: readHallSettings(r.settings),
    lastVisit: time(r.lastVisit),
    previousVisit: time(r.previousVisit),
  };
}

/** Write the Hall state back onto the profile. */
export function setHall(profile: Profile, state: HallState): void {
  (profile as Profile & { hall?: HallState }).hall = state;
}

/** Change some settings; anything invalid in the patch keeps its current value. */
export function updateHallSettings(
  profile: Profile,
  patch: Partial<Record<keyof HallSettings, unknown>>,
): HallSettings {
  const state = hallOf(profile);
  const settings = readHallSettings(patch, state.settings);
  setHall(profile, { ...state, settings });
  return settings;
}

/**
 * Record a visit. Visits within the same day do not move `previousVisit`, so
 * the greeting stays the same all day.
 */
export function recordVisit(profile: Profile, now: number): HallState {
  const state = hallOf(profile);
  const sameDay = state.lastVisit !== null && dayOf(state.lastVisit) === dayOf(now);
  const next: HallState = {
    ...state,
    lastVisit: now,
    previousVisit: sameDay ? state.previousVisit : state.lastVisit,
  };
  setHall(profile, next);
  return next;
}

const dayOf = (t: number): number => Math.floor(t / DAY);

/**
 * How to greet the learner. Never a count of missed days: a break is only ever
 * a welcome back.
 *
 *   first      the first visit
 *   again      came back the next day, or later the same day
 *   back       came back after two days or more
 */
export type Greeting = 'first' | 'again' | 'back';

export function greeting(state: HallState): Greeting {
  if (state.previousVisit === null || state.lastVisit === null) return 'first';
  return dayOf(state.lastVisit) - dayOf(state.previousVisit) >= 2 ? 'back' : 'again';
}

export interface HallSummary {
  /** Headwords the learner has a card for. */
  wordsMet: number;
  /** Of those, the ones whose cards are all at or above the mastery threshold. */
  wordsSteady: number;
  /** Grammar concepts the learner has practised at least once. */
  rulesPracticed: number;
  /** Minutes spent answering over the last seven days. */
  minutesThisWeek: number;
  /** Of the last seven days, how many had any practice. */
  daysThisWeek: number;
  /** Cards due now. */
  due: number;
}

export function hallSummary(profile: Profile, data: LearnData, now: number): HallSummary {
  const byTarget = new Map<string, number[]>();
  let due = 0;
  for (const c of Object.values(profile.cards)) {
    if (c.retired !== undefined) continue;
    const list = byTarget.get(c.target) ?? [];
    list.push(cardMastery(profile, c, now));
    byTarget.set(c.target, list);
    if (c.state.reps > 0 && c.state.due <= now) due += 1;
  }
  let wordsMet = 0;
  let wordsSteady = 0;
  for (const [target, mastery] of byTarget) {
    const kind = data.items.get(target)?.kind;
    if (kind !== 'root' && kind !== 'compound' && kind !== 'imageCompound') continue;
    wordsMet += 1;
    if (mastery.every((m) => m >= profile.settings.threshold)) wordsSteady += 1;
  }
  const practised = new Set<string>();
  for (const l of profile.log) {
    const target = profile.cards[l.card]?.target;
    if (target !== undefined && data.concepts.has(target)) practised.add(target);
  }
  const weekStart = (dayOf(now) - 6) * DAY;
  let ms = 0;
  const days = new Set<number>();
  for (const l of profile.log) {
    if (l.at < weekStart || l.at > now) continue;
    ms += l.ms;
    days.add(dayOf(l.at));
  }
  return {
    wordsMet,
    wordsSteady,
    rulesPracticed: practised.size,
    minutesThisWeek: Math.round(ms / 60_000),
    daysThisWeek: days.size,
    due,
  };
}
