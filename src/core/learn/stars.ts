/**
 * Ten Stars, the vocabulary wing (Hall Phase 3): the draw.
 *
 * A draw is a seeded, weighted sample without replacement from the pool of
 * current headwords. The pool is the lexicon as it is now, so a root cut in a
 * release can never be drawn; a saved draw that still names one drops it on
 * load and says so (`retired`). Words are ids, never spellings, so a draw
 * survives a respelling.
 *
 *   pool       headwords, narrowed by theme, edition, kind, senses and "only"
 *   weighting  random · weak (shaky words first) · new (unmet first) · due (spaced repetition)
 *   seed       the same seed, options and progress give the same draw
 *
 * Pure: the learner's profile is read, and written only by `markKnown` and
 * `setStars`.
 */
import { FORM_SLOTS, type FormSlot } from '../config/slots';
import type { EntryId } from '../model/types';
import type { FormsEngine } from './forms';
import { rootNode } from './graph';
import { hallOf, setHall } from './hall';
import { cardMastery, cardsForNode, introduce, recordReview, type Profile } from './progress';
import { createRng, type Rng } from './rng';
import type { LearnData, SkillGraph } from './types';

export type DrawOnly = 'all' | 'irregular' | 'surprising' | 'missed' | 'unseen';
export type DrawShape = 'any' | 'primal' | 'compound';
export type DrawWeighting = 'random' | 'weak' | 'new' | 'due';

export const DRAW_ONLY: readonly DrawOnly[] = [
  'all',
  'irregular',
  'surprising',
  'missed',
  'unseen',
];
export const DRAW_SHAPES: readonly DrawShape[] = ['any', 'primal', 'compound'];
export const DRAW_WEIGHTINGS: readonly DrawWeighting[] = ['random', 'weak', 'new', 'due'];

export interface DrawOptions {
  count: number;
  /** Themes (the lexicon's `domain`) to draw from; empty means every theme. */
  themes: readonly string[];
  /** Editions the word arrived in (`since`); empty means any. */
  since: readonly string[];
  shape: DrawShape;
  /** Form slots the word must have a meaning for, e.g. a verb sense. */
  senses: readonly FormSlot[];
  only: DrawOnly;
  weighting: DrawWeighting;
}

export const DEFAULT_DRAW: DrawOptions = {
  count: 10,
  themes: [],
  since: [],
  shape: 'any',
  senses: [],
  only: 'all',
  weighting: 'random',
};

export interface Draw {
  seed: string;
  options: DrawOptions;
  ids: readonly EntryId[];
  pinned: readonly EntryId[];
  /** How many rerolls this draw has had: each one draws from its own stream. */
  rerolls: number;
  /** How many words matched the options when the draw was made. */
  pool: number;
}

export interface DrawContext {
  data: LearnData;
  forms: FormsEngine;
  profile: Profile;
  now: number;
}

/* ----------------------------------------------------------------- pool */

interface WordStats {
  met: boolean;
  mastery: number;
  due: boolean;
  missed: boolean;
}

function statsOf(profile: Profile, now: number): Map<EntryId, WordStats> {
  const out = new Map<EntryId, WordStats & { sum: number; n: number }>();
  for (const c of Object.values(profile.cards)) {
    if (c.retired !== undefined) continue;
    const s = out.get(c.target) ?? {
      met: true,
      mastery: 0,
      due: false,
      missed: false,
      sum: 0,
      n: 0,
    };
    s.sum += cardMastery(profile, c, now);
    s.n += 1;
    s.mastery = s.sum / s.n;
    if (c.state.reps > 0 && c.state.due <= now) s.due = true;
    if (c.state.lapses > 0) s.missed = true;
    out.set(c.target, s);
  }
  for (const l of profile.log) {
    if (l.verdict === 'correct') continue;
    const s = out.get(profile.cards[l.card]?.target ?? '');
    if (s !== undefined) s.missed = true;
  }
  return out;
}

/** Every word the options allow, in id order. */
export function drawPool(ctx: DrawContext, options: DrawOptions): EntryId[] {
  const { data, forms, profile } = ctx;
  const stats = statsOf(profile, ctx.now);
  const themes = new Set(options.themes);
  const since = new Set(options.since);
  const irregular = new Set(options.only === 'irregular' ? forms.irregularIds() : []);
  const surprising = new Set(options.only === 'surprising' ? forms.surprisingIds() : []);
  const out: EntryId[] = [];
  for (const item of data.items.values()) {
    if (item.kind !== 'root' && item.kind !== 'compound') continue;
    if (themes.size > 0 && !themes.has(item.theme)) continue;
    if (since.size > 0 && !since.has(item.since)) continue;
    if (options.shape === 'primal' && item.kind !== 'root') continue;
    if (options.shape === 'compound' && item.kind !== 'compound') continue;
    if (!options.senses.every((s) => item.forms.some((f) => f.slot === s && f.meaningful)))
      continue;
    const st = stats.get(item.id);
    const met = st !== undefined || profile.seen[rootNode(item.id)] !== undefined;
    if (options.only === 'irregular' && !irregular.has(item.id)) continue;
    if (options.only === 'surprising' && !surprising.has(item.id)) continue;
    if (options.only === 'missed' && st?.missed !== true) continue;
    if (options.only === 'unseen' && met) continue;
    out.push(item.id);
  }
  return out.sort();
}

/**
 * Where a word stands under a weighting: a tier, then a weight within it.
 * Favoured words fill the draw first (tier 0); the rest of the pool fills
 * what is left (tier 1). A weight alone would not do it: against fifteen
 * hundred words, even a strong preference loses a few places in every draw.
 */
function rankOf(
  st: WordStats | undefined,
  weighting: DrawWeighting,
  threshold: number,
): { tier: number; weight: number } {
  switch (weighting) {
    case 'weak':
      // met words below the mastery threshold, the shakiest most likely first
      return st !== undefined && st.mastery < threshold
        ? { tier: 0, weight: 1 + 4 * (1 - st.mastery) }
        : { tier: 1, weight: 1 };
    case 'new':
      return { tier: st === undefined ? 0 : 1, weight: 1 };
    case 'due':
      return { tier: st?.due === true ? 0 : 1, weight: 1 };
    case 'random':
      return { tier: 0, weight: 1 };
  }
}

/** Weighted sampling without replacement (Efraimidis–Spirakis), tier by tier. */
function sample(
  pool: readonly EntryId[],
  k: number,
  rank: (id: EntryId) => { tier: number; weight: number },
  rng: Rng,
): EntryId[] {
  return pool
    .map((id) => {
      const r = rank(id);
      return { id, tier: r.tier, key: -Math.log(1 - rng.next()) / r.weight };
    })
    .sort((a, b) => a.tier - b.tier || a.key - b.key || (a.id < b.id ? -1 : 1))
    .slice(0, k)
    .map((x) => x.id);
}

/* ----------------------------------------------------------------- draw */

export function readDrawOptions(raw: unknown): DrawOptions {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const strings = (x: unknown): string[] =>
    Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string') : [];
  const count =
    typeof r.count === 'number' && Number.isInteger(r.count) ? r.count : DEFAULT_DRAW.count;
  return {
    count: Math.min(50, Math.max(1, count)),
    themes: strings(r.themes),
    since: strings(r.since),
    shape: DRAW_SHAPES.includes(r.shape as DrawShape) ? (r.shape as DrawShape) : DEFAULT_DRAW.shape,
    senses: strings(r.senses).filter((s): s is FormSlot =>
      (FORM_SLOTS as readonly string[]).includes(s),
    ),
    only: DRAW_ONLY.includes(r.only as DrawOnly) ? (r.only as DrawOnly) : DEFAULT_DRAW.only,
    weighting: DRAW_WEIGHTINGS.includes(r.weighting as DrawWeighting)
      ? (r.weighting as DrawWeighting)
      : DEFAULT_DRAW.weighting,
  };
}

/** Draw up to `options.count` distinct words. Fewer when the pool is smaller. */
export function drawStars(
  ctx: DrawContext,
  options: DrawOptions,
  seed: string,
  keep: readonly EntryId[] = [],
): Draw {
  const pool = drawPool(ctx, options);
  const stats = statsOf(ctx.profile, ctx.now);
  const kept = keep.filter((id) => ctx.data.items.has(id)).slice(0, options.count);
  const rest = pool.filter((id) => !kept.includes(id));
  const drawn = sample(
    rest,
    options.count - kept.length,
    (id) => rankOf(stats.get(id), options.weighting, ctx.profile.settings.threshold),
    createRng(seed),
  );
  return { seed, options, ids: [...kept, ...drawn], pinned: kept, rerolls: 0, pool: pool.length };
}

/**
 * Replace one word with another from the pool. A pinned word stays; when no
 * other word is left, the draw is returned unchanged.
 */
export function rerollOne(ctx: DrawContext, draw: Draw, id: EntryId): Draw {
  const at = draw.ids.indexOf(id);
  if (at < 0 || draw.pinned.includes(id)) return draw;
  const pool = drawPool(ctx, draw.options).filter((p) => !draw.ids.includes(p));
  const stats = statsOf(ctx.profile, ctx.now);
  const rerolls = draw.rerolls + 1;
  const [next] = sample(
    pool,
    1,
    (p) => rankOf(stats.get(p), draw.options.weighting, ctx.profile.settings.threshold),
    createRng(`${draw.seed}|reroll|${String(rerolls)}`),
  );
  if (next === undefined) return draw;
  const ids = [...draw.ids];
  ids[at] = next;
  return { ...draw, ids, rerolls };
}

/** Draw everything again except the pinned words. */
export function rerollAll(ctx: DrawContext, draw: Draw): Draw {
  const rerolls = draw.rerolls + 1;
  const next = drawStars(ctx, draw.options, `${draw.seed}|all|${String(rerolls)}`, draw.pinned);
  return { ...next, seed: draw.seed, rerolls };
}

export function togglePin(draw: Draw, id: EntryId): Draw {
  if (!draw.ids.includes(id)) return draw;
  const pinned = draw.pinned.includes(id)
    ? draw.pinned.filter((p) => p !== id)
    : [...draw.pinned, id];
  return { ...draw, pinned };
}

/* ---------------------------------------------------------------- state */

export type StarsPhase = 'preview' | 'study';

/** Ten Stars' saved state, on the profile's Hall state. */
export interface StarsState {
  /** The options last used: the next draw starts from them. */
  options: DrawOptions;
  draw: Draw | null;
  phase: StarsPhase;
  /** The study card showing. */
  index: number;
  /** Words studied in this draw (reached on a card). */
  studied: readonly EntryId[];
}

export interface StarsLoad {
  state: StarsState;
  /** Words a saved draw named that this edition no longer has. */
  retired: EntryId[];
}

/**
 * Ten Stars' state for this profile, checked against the data: a word that
 * was retired since the draw was saved is dropped, and returned in `retired`
 * so the UI can say so once.
 */
export function starsOf(
  profile: Profile,
  data: LearnData,
  defaults?: Partial<DrawOptions>,
): StarsLoad {
  const raw = hallOf(profile).stars;
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const options = readDrawOptions({
    ...DEFAULT_DRAW,
    ...defaults,
    ...(r.options as object | undefined),
  });
  const retired: EntryId[] = [];
  let draw: Draw | null = null;
  const d = r.draw as Partial<Draw> | null | undefined;
  if (d !== null && d !== undefined && typeof d.seed === 'string' && Array.isArray(d.ids)) {
    const ids = d.ids.filter((id): id is string => typeof id === 'string');
    for (const id of ids) if (!data.items.has(id)) retired.push(id);
    const live = ids.filter((id) => data.items.has(id));
    draw = {
      seed: d.seed,
      options: readDrawOptions(d.options),
      ids: live,
      pinned: (Array.isArray(d.pinned) ? d.pinned : []).filter(
        (id): id is string => typeof id === 'string' && live.includes(id),
      ),
      rerolls: typeof d.rerolls === 'number' ? d.rerolls : 0,
      pool: typeof d.pool === 'number' ? d.pool : live.length,
    };
    if (live.length === 0) draw = null;
  }
  const count = draw?.ids.length ?? 0;
  const index =
    typeof r.index === 'number' ? Math.min(Math.max(0, r.index), Math.max(0, count - 1)) : 0;
  const studied = (Array.isArray(r.studied) ? r.studied : []).filter(
    (id): id is string => typeof id === 'string' && (draw?.ids.includes(id) ?? false),
  );
  return {
    state: {
      options,
      draw,
      phase: r.phase === 'study' && draw !== null ? 'study' : 'preview',
      index,
      studied,
    },
    retired,
  };
}

export function setStars(profile: Profile, state: StarsState): void {
  setHall(profile, { ...hallOf(profile), stars: state });
}

/**
 * "I already know this one": introduce the word and answer each of its cards
 * as easy, so it goes straight to the review queue at a long interval.
 */
export function markKnown(
  profile: Profile,
  data: LearnData,
  graph: SkillGraph,
  id: EntryId,
  now: number,
): void {
  const node = rootNode(id);
  introduce(profile, data, graph, node, now);
  for (const card of cardsForNode(data, graph, node)) {
    if ((profile.cards[card]?.state.reps ?? 0) > 0) continue;
    recordReview(profile, data, card, { verdict: 'correct', rating: 4 }, 'known', now);
  }
}

/** Introduce the words of a finished study: their cards join the schedule. */
export function introduceStudied(
  profile: Profile,
  data: LearnData,
  graph: SkillGraph,
  ids: readonly EntryId[],
  now: number,
): void {
  for (const id of ids) introduce(profile, data, graph, rootNode(id), now);
}
