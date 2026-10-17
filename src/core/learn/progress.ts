/**
 * Learner progress (Learn Phases 4–5): profiles, cards, reviews, the daily
 * queue, mastery, checkpoints, and reconciling progress with a changed
 * language. Pure functions over a plain JSON store, so export → wipe →
 * import is exact and every rule here is unit-tested.
 *
 * A card is one item (or concept) × one skill × one direction, keyed by id:
 * `lx_amor_0001|meaning|recognize`. It remembers the edition it was learned
 * under and a snapshot of what it looked like then, which is how a renamed,
 * reglossed or retired entry is noticed — whether the change came from a new
 * edition or from the rename tool a minute ago.
 */
import { cardId, type Direction, type Skill } from './exercises';
import type { Grade } from './grade';
import { isUnlocked } from './graph';
import { schedulerFor, type CardState, type Rating, type Scheduler } from './scheduler';
import type { LearnData, NodeId, SkillGraph } from './types';

export const PROGRESS_SCHEMA = 1;
const DAY = 86_400_000;

export interface Settings {
  newPerDay: number;
  reviewsPerDay: number;
  scheduler: 'fsrs' | 'sm2';
  retention: number;
  /** Mastery a prerequisite needs before what depends on it unlocks. */
  threshold: number;
  /** Lapses after which a card is a leech. */
  leechLapses: number;
  /** Checkpoint score needed to pass a unit. */
  passMark: number;
}

export const DEFAULT_SETTINGS: Settings = {
  newPerDay: 10,
  reviewsPerDay: 200,
  scheduler: 'fsrs',
  retention: 0.9,
  threshold: 0.8,
  leechLapses: 6,
  passMark: 0.8,
};

export interface CardChange {
  reason: 'renamed' | 'reglossed' | 'rewritten';
  from: string;
  to: string;
  edition: string;
  at: number;
}

export interface Card {
  id: string;
  target: string;
  skill: Skill;
  direction: Direction;
  state: CardState;
  /** The edition the card was first learned under. */
  edition: string;
  /** What the target looked like when last reconciled. */
  snapshot: { spelling: string; meaning: string };
  added: number;
  changed?: CardChange;
  retired?: { reason: string; replacement?: string; edition: string; at: number };
  leech?: boolean;
}

export interface ReviewLog {
  at: number;
  card: string;
  type: string;
  verdict: Grade['verdict'];
  rating: Rating;
  ms: number;
}

export interface Checkpoint {
  unit: number;
  passed: boolean;
  score: number;
  at: number;
  /** Targets answered wrongly. */
  weak: string[];
}

export interface Profile {
  id: string;
  name: string;
  created: number;
  settings: Settings;
  /** The last edition this profile was reconciled with. */
  edition: string;
  cards: Record<string, Card>;
  log: ReviewLog[];
  checkpoints: Record<string, Checkpoint>;
  /** Node → when it was introduced. */
  seen: Record<string, number>;
}

export interface AudioRef {
  key: string;
  name: string;
  mime: string;
  size: number;
  added: number;
}

export interface ProgressStore {
  schema: number;
  active: string;
  profiles: Record<string, Profile>;
  /** Audio recordings attached to item ids and sentence keys (Phase 6). */
  audio: Record<string, AudioRef>;
}

/* --------------------------------------------------------- the store */

export function createProfile(id: string, name: string, edition: string, now: number): Profile {
  return {
    id,
    name,
    created: now,
    settings: { ...DEFAULT_SETTINGS },
    edition,
    cards: {},
    log: [],
    checkpoints: {},
    seen: {},
  };
}

export function createStore(edition: string, now: number, name = 'Me'): ProgressStore {
  const p = createProfile('p1', name, edition, now);
  return { schema: PROGRESS_SCHEMA, active: p.id, profiles: { [p.id]: p }, audio: {} };
}

export class ProgressError extends Error {}

/**
 * Bring any stored progress up to the current schema. Never drops data:
 * unknown fields are kept, and a newer schema than this code knows is refused
 * rather than half-read.
 */
export function migrateStore(raw: unknown): ProgressStore {
  if (typeof raw !== 'object' || raw === null)
    throw new ProgressError('progress must be an object');
  const r = raw as Partial<ProgressStore> & { schema?: number };
  const schema = r.schema ?? 0;
  if (schema > PROGRESS_SCHEMA) {
    throw new ProgressError(
      `progress schema ${String(schema)} is newer than this app (${String(PROGRESS_SCHEMA)})`,
    );
  }
  // schema 0: a bare profile map, before profiles had settings of their own
  const profiles: Record<string, Profile> = {};
  // older stores may lack any of these: read them as possibly missing
  for (const [id, p] of Object.entries(r.profiles ?? {}) as [string, Partial<Profile>][]) {
    profiles[id] = {
      ...(p as Profile),
      id,
      settings: { ...DEFAULT_SETTINGS, ...(p.settings as Partial<Settings> | undefined) },
      cards: p.cards ?? {},
      log: p.log ?? [],
      checkpoints: p.checkpoints ?? {},
      seen: p.seen ?? {},
    };
  }
  const first = Object.keys(profiles)[0];
  if (first === undefined) throw new ProgressError('progress has no profile');
  return {
    ...r,
    schema: PROGRESS_SCHEMA,
    active: r.active !== undefined && profiles[r.active] !== undefined ? r.active : first,
    profiles,
    audio: r.audio ?? {},
  };
}

/** Deterministic JSON: keys sorted at every level, so a round trip is byte-identical. */
export function exportStore(store: ProgressStore): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (typeof v === 'object' && v !== null) {
      return Object.fromEntries(
        Object.keys(v)
          .sort()
          .map((k) => [k, sort((v as Record<string, unknown>)[k])]),
      );
    }
    return v;
  };
  return JSON.stringify(sort(store), null, 1);
}

export function importStore(json: string): ProgressStore {
  return migrateStore(JSON.parse(json) as unknown);
}

export const activeProfile = (store: ProgressStore): Profile => {
  const p = store.profiles[store.active];
  if (p === undefined) throw new ProgressError('no active profile');
  return p;
};

/* ------------------------------------------------------------- cards */

function snapshotOf(data: LearnData, target: string): { spelling: string; meaning: string } {
  const item = data.items.get(target);
  if (item !== undefined) return { spelling: item.spelling, meaning: item.meaning };
  const concept = data.concepts.get(target);
  if (concept !== undefined) return { spelling: concept.title, meaning: concept.description };
  return { spelling: target, meaning: '' };
}

export function ensureCard(
  profile: Profile,
  data: LearnData,
  id: string,
  now: number,
  scheduler: Scheduler,
): Card {
  const existing = profile.cards[id];
  if (existing !== undefined) return existing;
  const [target = '', skill = 'meaning', direction = 'recognize'] = id.split('|');
  const card: Card = {
    id,
    target,
    skill: skill as Skill,
    direction: direction as Direction,
    state: scheduler.init(now),
    edition: data.edition,
    snapshot: snapshotOf(data, target),
    added: now,
  };
  profile.cards[id] = card;
  return card;
}

/** The cards a node introduces. */
export function cardsForNode(data: LearnData, graph: SkillGraph, node: NodeId): string[] {
  const n = graph.nodes.get(node);
  if (n === undefined) return [];
  if (n.kind === 'root') {
    const item = data.items.get(n.ref);
    if (item === undefined) return [];
    const out = [cardId(n.ref, 'meaning', 'recognize'), cardId(n.ref, 'meaning', 'produce')];
    if (item.forms.some((f) => f.meaningful && f.slot !== 'root'))
      out.push(cardId(n.ref, 'morphology', 'produce'));
    if (item.kind === 'compound') out.push(cardId(n.ref, 'morphology', 'recognize'));
    return out;
  }
  if (n.kind === 'concept') {
    const used = data.examples.some((e) => e.concepts.includes(n.ref));
    return used ? [cardId(n.ref, 'grammar', 'produce'), cardId(n.ref, 'grammar', 'recognize')] : [];
  }
  return (n.members ?? []).map((m) => cardId(m, 'morphology', 'produce'));
}

/** Introduce a node: mark it seen and create its cards. */
export function introduce(
  profile: Profile,
  data: LearnData,
  graph: SkillGraph,
  node: NodeId,
  now: number,
): void {
  const scheduler = schedulerFor(profile.settings.scheduler, profile.settings.retention);
  profile.seen[node] ??= now;
  for (const id of cardsForNode(data, graph, node)) ensureCard(profile, data, id, now, scheduler);
}

/** Record an answer: the card's schedule moves on, the review is logged. */
export function recordReview(
  profile: Profile,
  data: LearnData,
  card: string,
  grade: Pick<Grade, 'verdict' | 'rating'>,
  type: string,
  now: number,
  ms = 0,
): Card {
  const scheduler = schedulerFor(profile.settings.scheduler, profile.settings.retention);
  const c = ensureCard(profile, data, card, now, scheduler);
  c.state = scheduler.review(c.state, grade.rating, now);
  if (c.state.lapses >= profile.settings.leechLapses) c.leech = true;
  if (grade.verdict === 'correct' && c.changed !== undefined) delete c.changed;
  profile.log.push({ at: now, card, type, verdict: grade.verdict, rating: grade.rating, ms });
  return c;
}

/* ------------------------------------------------------------ mastery */

/** One card's mastery: recall probability, discounted until it has a streak. */
export function cardMastery(profile: Profile, card: Card, now: number): number {
  if (card.retired !== undefined || card.state.reps === 0) return 0;
  const scheduler = schedulerFor(profile.settings.scheduler, profile.settings.retention);
  return scheduler.retrievability(card.state, now) * Math.min(1, card.state.streak / 2);
}

function cardsOfNode(profile: Profile, graph: SkillGraph, node: NodeId): Card[] {
  const n = graph.nodes.get(node);
  if (n === undefined) return [];
  const targets = new Set(n.kind === 'pattern' ? (n.members ?? []) : [n.ref]);
  return Object.values(profile.cards).filter(
    (c) => targets.has(c.target) && (n.kind !== 'pattern' || c.skill === 'morphology'),
  );
}

export function nodeMastery(
  profile: Profile,
  graph: SkillGraph,
  node: NodeId,
  now: number,
): number {
  const cards = cardsOfNode(profile, graph, node);
  if (cards.length === 0) return 0;
  return cards.reduce((sum, c) => sum + cardMastery(profile, c, now), 0) / cards.length;
}

/**
 * A node a learner can start: its unit is open, and each prerequisite is
 * mastered, or sits in a passed unit, or is taught in the same unit and has
 * been introduced (or is being introduced in the same batch, `pending`): a
 * unit's lesson teaches its concept and its roots together.
 */
export function nodeAvailable(
  profile: Profile,
  graph: SkillGraph,
  node: NodeId,
  now: number,
  pending: ReadonlySet<NodeId> = new Set(),
): boolean {
  const n = graph.nodes.get(node);
  if (n === undefined || !unitOpen(profile, n.unit)) return false;
  return isUnlocked(
    graph,
    node,
    (p) => {
      const sameUnit = graph.nodes.get(p)?.unit === n.unit;
      if (sameUnit && (profile.seen[p] !== undefined || pending.has(p))) return 1;
      if (profile.seen[p] === undefined) return 0;
      return Math.max(nodeMastery(profile, graph, p, now), unitDone(profile, graph, p));
    },
    profile.settings.threshold,
  );
}

/** A prerequisite in a unit whose checkpoint was passed counts as mastered. */
function unitDone(profile: Profile, graph: SkillGraph, node: NodeId): number {
  const unit = graph.nodes.get(node)?.unit ?? -1;
  return profile.checkpoints[String(unit)]?.passed === true ? 1 : 0;
}

/** Unit 0 is open; each later unit opens when the one before it is passed. */
export function unitOpen(profile: Profile, unit: number): boolean {
  return unit <= 0 || profile.checkpoints[String(unit - 1)]?.passed === true;
}

/* -------------------------------------------------------------- queue */

const startOfDay = (now: number): number => now - (now % DAY);

export interface DailyQueue {
  due: Card[];
  /** Nodes to introduce today, in path order. */
  fresh: NodeId[];
  reviewedToday: number;
  introducedToday: number;
}

export function dailyQueue(profile: Profile, graph: SkillGraph, now: number): DailyQueue {
  const today = startOfDay(now);
  const reviewedToday = profile.log.filter((l) => l.at >= today).length;
  const introducedToday = Object.values(profile.seen).filter((t) => t >= today).length;
  const due = Object.values(profile.cards)
    .filter(
      (c) =>
        c.retired === undefined &&
        c.state.reps > 0 &&
        (c.state.due <= now || c.changed !== undefined),
    )
    .sort(
      (a, b) =>
        (a.changed !== undefined ? -1 : 0) - (b.changed !== undefined ? -1 : 0) ||
        a.state.due - b.state.due,
    )
    .slice(0, Math.max(0, profile.settings.reviewsPerDay - reviewedToday));
  const fresh: NodeId[] = [];
  const room = Math.max(0, profile.settings.newPerDay - introducedToday);
  for (const node of graph.order) {
    if (fresh.length >= room) break;
    if (profile.seen[node] !== undefined) continue;
    if (nodeAvailable(profile, graph, node, now, new Set(fresh))) fresh.push(node);
  }
  return { due, fresh, reviewedToday, introducedToday };
}

export const leeches = (profile: Profile): Card[] =>
  Object.values(profile.cards).filter((c) => c.leech === true && c.retired === undefined);

/** Cards falling due on each of the next `days` days. */
export function forecast(profile: Profile, now: number, days = 14): number[] {
  const out = new Array<number>(days).fill(0);
  const today = startOfDay(now);
  for (const c of Object.values(profile.cards)) {
    if (c.retired !== undefined || c.state.reps === 0) continue;
    const d = Math.max(0, Math.floor((c.state.due - today) / DAY));
    if (d < days) out[d] = (out[d] ?? 0) + 1;
  }
  return out;
}

/** Reviews per day over the last `days` days, oldest first. */
export function activity(profile: Profile, now: number, days = 30): number[] {
  const out = new Array<number>(days).fill(0);
  const today = startOfDay(now);
  for (const l of profile.log) {
    const ago = Math.floor((today - startOfDay(l.at)) / DAY);
    if (ago >= 0 && ago < days) out[days - 1 - ago] = (out[days - 1 - ago] ?? 0) + 1;
  }
  return out;
}

export interface MasteryGroup {
  key: string;
  mastery: number;
  started: number;
  total: number;
}

export function masteryByTheme(
  profile: Profile,
  data: LearnData,
  graph: SkillGraph,
  now: number,
): MasteryGroup[] {
  const groups = new Map<string, { sum: number; started: number; total: number }>();
  for (const n of graph.nodes.values()) {
    if (n.kind !== 'root') continue;
    const theme = data.items.get(n.ref)?.theme ?? '—';
    const g = groups.get(theme) ?? { sum: 0, started: 0, total: 0 };
    g.total += 1;
    if (profile.seen[n.id] !== undefined) {
      g.started += 1;
      g.sum += nodeMastery(profile, graph, n.id, now);
    }
    groups.set(theme, g);
  }
  return [...groups]
    .map(([key, g]) => ({
      key,
      mastery: g.started === 0 ? 0 : g.sum / g.started,
      started: g.started,
      total: g.total,
    }))
    .sort((a, b) => b.started - a.started || (a.key < b.key ? -1 : 1));
}

export function masteryByConcept(
  profile: Profile,
  data: LearnData,
  graph: SkillGraph,
  now: number,
): MasteryGroup[] {
  return [...graph.nodes.values()]
    .filter((n) => n.kind === 'concept')
    .map((n) => ({
      key: n.ref,
      mastery: nodeMastery(profile, graph, n.id, now),
      started: profile.seen[n.id] !== undefined ? 1 : 0,
      total: 1,
    }))
    .filter((g) => g.started > 0 || data.concepts.has(g.key));
}

/** The cards the learner holds least well: low recall, many lapses. */
export function weakest(profile: Profile, now: number, n = 12): Card[] {
  return Object.values(profile.cards)
    .filter((c) => c.retired === undefined && c.state.reps > 0)
    .map((c) => ({ c, m: cardMastery(profile, c, now) - c.state.lapses * 0.05 }))
    .sort((a, b) => a.m - b.m || (a.c.id < b.c.id ? -1 : 1))
    .slice(0, n)
    .map(({ c }) => c);
}

/* -------------------------------------------------------- checkpoints */

export function recordCheckpoint(
  profile: Profile,
  unit: number,
  results: readonly { target: string; score: number }[],
  now: number,
): Checkpoint {
  const score =
    results.length === 0 ? 0 : results.reduce((s, r) => s + r.score, 0) / results.length;
  const weak = [...new Set(results.filter((r) => r.score < 1).map((r) => r.target))];
  const prior = profile.checkpoints[String(unit)];
  const passed = score >= profile.settings.passMark || prior?.passed === true;
  const cp = { unit, passed, score, at: now, weak };
  profile.checkpoints[String(unit)] = cp;
  return cp;
}

/* ------------------------------------------------- learn from a writing */

/**
 * The nodes a text teaches, the least known first: its words' root nodes and
 * the concepts its sentences exercise, ordered by the learner's mastery, then
 * by the path.
 */
export function writingNodes(
  profile: Profile,
  graph: SkillGraph,
  ids: readonly string[],
  concepts: readonly string[],
  now: number,
): NodeId[] {
  const nodes = new Set<NodeId>();
  for (const id of ids) if (graph.nodes.has(`root:${id}`)) nodes.add(`root:${id}`);
  for (const c of concepts) if (graph.nodes.has(`concept:${c}`)) nodes.add(`concept:${c}`);
  return [...nodes].sort(
    (a, b) =>
      nodeMastery(profile, graph, a, now) - nodeMastery(profile, graph, b, now) ||
      (graph.nodes.get(a)?.order ?? 0) - (graph.nodes.get(b)?.order ?? 0),
  );
}

/* ---------------------------------------------- a language that changed */

export interface Reconciled {
  renamed: { card: string; target: string; from: string; to: string }[];
  reglossed: { card: string; target: string; from: string; to: string }[];
  retired: { card: string; target: string; spelling: string; replacement?: string }[];
}

/**
 * Bring a profile in line with the current data. Every card is checked
 * against its snapshot:
 * - same id, new spelling: renamed. The card keeps its schedule, is badged
 *   "changed" and comes back into review now.
 * - same id, new meaning (or a rule's text rewritten): the same, reglossed.
 * - id gone: retired, out of review. If the data's legacy record names a
 *   replacement (a cut root replaced by a compound), the replacement is
 *   introduced in its place.
 * `replacementFor` maps a retired spelling to the id that replaces it.
 */
export function reconcile(
  profile: Profile,
  data: LearnData,
  graph: SkillGraph,
  now: number,
  replacementFor: (spelling: string) => string | undefined,
): Reconciled {
  const out: Reconciled = { renamed: [], reglossed: [], retired: [] };
  for (const card of Object.values(profile.cards)) {
    if (card.retired !== undefined) continue;
    const exists = data.items.has(card.target) || data.concepts.has(card.target);
    if (!exists) {
      const replacement = data.items.has(card.target)
        ? undefined
        : replacementFor(card.snapshot.spelling);
      card.retired = {
        reason: replacement !== undefined ? 'replaced' : 'removed',
        ...(replacement !== undefined ? { replacement } : {}),
        edition: data.edition,
        at: now,
      };
      out.retired.push({
        card: card.id,
        target: card.target,
        spelling: card.snapshot.spelling,
        ...(replacement !== undefined ? { replacement } : {}),
      });
      if (replacement !== undefined && graph.nodes.has(`root:${replacement}`)) {
        introduce(profile, data, graph, `root:${replacement}`, now);
        const twin = profile.cards[cardId(replacement, card.skill, card.direction)];
        if (twin !== undefined) {
          twin.changed = {
            reason: 'rewritten',
            from: card.snapshot.spelling,
            to: snapshotOf(data, replacement).spelling,
            edition: data.edition,
            at: now,
          };
        }
      }
      continue;
    }
    const now_ = snapshotOf(data, card.target);
    if (now_.spelling !== card.snapshot.spelling && data.items.has(card.target)) {
      card.changed = {
        reason: 'renamed',
        from: card.snapshot.spelling,
        to: now_.spelling,
        edition: data.edition,
        at: now,
      };
      out.renamed.push({
        card: card.id,
        target: card.target,
        from: card.snapshot.spelling,
        to: now_.spelling,
      });
    } else if (now_.meaning !== card.snapshot.meaning) {
      const reason = data.items.has(card.target) ? 'reglossed' : 'rewritten';
      card.changed = {
        reason,
        from: card.snapshot.meaning,
        to: now_.meaning,
        edition: data.edition,
        at: now,
      };
      out.reglossed.push({
        card: card.id,
        target: card.target,
        from: card.snapshot.meaning,
        to: now_.meaning,
      });
    }
    card.snapshot = now_;
    if (card.changed !== undefined && card.state.reps > 0)
      card.state = { ...card.state, due: Math.min(card.state.due, now) };
  }
  profile.edition = data.edition;
  return out;
}
