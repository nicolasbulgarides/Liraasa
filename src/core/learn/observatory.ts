/**
 * The Observatory (Hall Phase 7): the learner's sky, their rules, their
 * rhythm, and what the language changed under them.
 *
 *   sky        every headword met, as a star: how well it is known, whether it
 *              goes its own way, when it was first met
 *   rules      every concept practised, by mastery
 *   rhythm     days in a row with practice, counted kindly: a run that ended
 *              is simply not mentioned
 *   changes    what reconcile recorded on the learner's own cards — renamed,
 *              reglossed, rewritten, retired — grouped by word; a retirement
 *              is said once and then set aside when the learner acknowledges it
 *
 * Pure: reads the profile; writes only `acknowledgeRetired`.
 */
import type { EntryId } from '../model/types';
import type { FormsEngine } from './forms';
import { hallOf, setHall } from './hall';
import { cardMastery, type Card, type Profile } from './progress';
import type { LearnData } from './types';

const DAY = 86_400_000;

export interface SkyStar {
  id: EntryId;
  spelling: string;
  meaning: string;
  theme: string;
  /** 0–1, the mean of the word's cards. */
  mastery: number;
  irregular: boolean;
  /** When the learner first met it. */
  met: number;
  /** Cards that train it. */
  cards: number;
}

const live = (profile: Profile): Card[] =>
  Object.values(profile.cards).filter((c) => c.retired === undefined);

/** Every headword the learner has met, oldest first. */
export function skyOf(
  profile: Profile,
  data: LearnData,
  forms: FormsEngine,
  now: number,
): SkyStar[] {
  const byTarget = new Map<EntryId, Card[]>();
  for (const c of live(profile)) {
    const list = byTarget.get(c.target) ?? [];
    list.push(c);
    byTarget.set(c.target, list);
  }
  const ids = new Set<EntryId>(byTarget.keys());
  for (const node of Object.keys(profile.seen))
    if (node.startsWith('root:')) ids.add(node.slice(5));
  const out: SkyStar[] = [];
  for (const id of ids) {
    const item = data.items.get(id);
    if (item === undefined || !['root', 'compound', 'imageCompound'].includes(item.kind)) continue;
    const cards = byTarget.get(id) ?? [];
    const mastery =
      cards.length === 0
        ? 0
        : cards.reduce((s, c) => s + cardMastery(profile, c, now), 0) / cards.length;
    const met = Math.min(profile.seen[`root:${id}`] ?? Infinity, ...cards.map((c) => c.added));
    out.push({
      id,
      spelling: item.spelling,
      meaning: item.meaning,
      theme: item.theme,
      mastery,
      irregular: forms.isIrregular(id),
      met: Number.isFinite(met) ? met : now,
      cards: cards.length,
    });
  }
  return out.sort((a, b) => a.met - b.met || (a.id < b.id ? -1 : 1));
}

export interface RuleLight {
  id: string;
  title: string;
  mastery: number;
  /** Answers given on its cards. */
  reviews: number;
}

/** Every concept the learner has practised, best known first. */
export function rulesLit(profile: Profile, data: LearnData, now: number): RuleLight[] {
  const by = new Map<string, Card[]>();
  for (const c of live(profile)) {
    if (!data.concepts.has(c.target) || c.state.reps === 0) continue;
    by.set(c.target, [...(by.get(c.target) ?? []), c]);
  }
  const reviews = new Map<string, number>();
  for (const l of profile.log) {
    const t = profile.cards[l.card]?.target;
    if (t !== undefined && by.has(t)) reviews.set(t, (reviews.get(t) ?? 0) + 1);
  }
  return [...by]
    .map(([id, cards]) => ({
      id,
      title: data.concepts.get(id)?.title ?? id,
      mastery: cards.reduce((s, c) => s + cardMastery(profile, c, now), 0) / cards.length,
      reviews: reviews.get(id) ?? 0,
    }))
    .sort((a, b) => b.mastery - a.mastery || (a.id < b.id ? -1 : 1));
}

/**
 * Days in a row with practice, ending today or yesterday. A run that ended
 * earlier is 0, and the Hall says nothing about it: a break is only ever a
 * welcome back.
 */
export function streakOf(profile: Profile, now: number): number {
  const days = new Set(profile.log.map((l) => Math.floor(l.at / DAY)));
  const today = Math.floor(now / DAY);
  let d = days.has(today) ? today : days.has(today - 1) ? today - 1 : null;
  if (d === null) return 0;
  let n = 0;
  while (days.has(d)) {
    n += 1;
    d -= 1;
  }
  return n;
}

/* --------------------------------------------------------------- changes */

export type ChangeKind = 'renamed' | 'reglossed' | 'rewritten' | 'retired';

export interface ChangeNote {
  kind: ChangeKind;
  /** The word or concept the change is about. */
  target: string;
  /** Its spelling as the learner last knew it. */
  was: string;
  /** For a rename or a regloss: what it is now. */
  from?: string;
  to?: string;
  /** For a retirement: the entry that takes its place, if any. */
  replacement?: EntryId;
  edition: string;
  /** The cards it touches: a review of them clears the "changed" badge. */
  cards: readonly string[];
}

/**
 * What the language changed under the learner's own cards, one note per word
 * and kind. Retirements the learner has acknowledged are left out.
 */
export function changesFor(profile: Profile, data: LearnData): ChangeNote[] {
  const seen = new Set(retiredSeen(profile));
  const notes = new Map<string, ChangeNote & { cards: string[] }>();
  const add = (key: string, make: () => ChangeNote, card: string): void => {
    const n = notes.get(key) ?? { ...make(), cards: [] };
    n.cards.push(card);
    notes.set(key, n);
  };
  for (const c of Object.values(profile.cards)) {
    if (c.retired !== undefined) {
      if (seen.has(c.target)) continue;
      const replacement = c.retired.replacement;
      add(
        `retired|${c.target}`,
        () => ({
          kind: 'retired',
          target: c.target,
          was: c.snapshot.spelling,
          ...(replacement !== undefined ? { replacement } : {}),
          edition: c.retired?.edition ?? data.edition,
          cards: [],
        }),
        c.id,
      );
      continue;
    }
    if (c.changed === undefined) continue;
    const ch = c.changed;
    add(
      `${ch.reason}|${c.target}`,
      () => ({
        kind: ch.reason,
        target: c.target,
        was: ch.reason === 'renamed' ? ch.from : c.snapshot.spelling,
        from: ch.from,
        to: ch.to,
        edition: ch.edition,
        cards: [],
      }),
      c.id,
    );
  }
  const order: Record<ChangeKind, number> = { retired: 0, renamed: 1, rewritten: 2, reglossed: 3 };
  return [...notes.values()].sort(
    (a, b) => order[a.kind] - order[b.kind] || (a.was < b.was ? -1 : 1),
  );
}

/** Live cards with a "changed" badge: the "review what changed" session. */
export const changedCards = (profile: Profile): string[] =>
  live(profile)
    .filter((c) => c.changed !== undefined)
    .map((c) => c.id);

function retiredSeen(profile: Profile): string[] {
  const raw = hallOf(profile).retiredSeen;
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
}

/** The learner has read about these retirements: say no more about them. */
export function acknowledgeRetired(profile: Profile, targets: readonly string[]): void {
  const state = hallOf(profile);
  setHall(profile, { ...state, retiredSeen: [...new Set([...retiredSeen(profile), ...targets])] });
}
