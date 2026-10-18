/**
 * The skill graph: what to teach, in what order, and what unlocks what.
 *
 *   root:<id>      one per headword. A primal needs `form:root`; a compound
 *                  needs both its parts and the `compound` concept.
 *   concept:<id>   one per grammar concept, with the concept's own prereqs.
 *   pattern:<id>   "compounds built on X", for a headword at least
 *                  PATTERN_MIN compounds use. Needs X and `compound`.
 *
 * The default order is derived, never written by hand:
 * - a unit opens with the next grammar concept whose prerequisites are
 *   taught, the one the most sentences exercise first;
 * - then up to `rootsPerUnit` roots: the most frequent available root seeds
 *   the unit and draws others of its theme from near the top of the ranking,
 *   so units are thematic without pulling rare words forward;
 * - frequency is corpus occurrences (weighted) plus example occurrences plus
 *   how many compounds use the root;
 * - a root that occurs nowhere is `advanced` and comes after every core root.
 * The author's pins come first and levels override the derived level.
 */
import { formConcept, COMPOUND } from './concepts';
import type { LearnData, NodeId, Overrides, SkillGraph, SkillNode, Unit } from './types';

export const PATTERN_MIN = 4;

export interface GraphOptions {
  rootsPerUnit: number;
  /** How far down the ranking a unit looks for roots of its theme. */
  themeWindow: number;
  /** Weight of a corpus occurrence against an example occurrence. */
  corpusWeight: number;
}

export const DEFAULT_GRAPH_OPTIONS: GraphOptions = {
  rootsPerUnit: 8,
  themeWindow: 120,
  corpusWeight: 3,
};

export const rootNode = (id: string): NodeId => `root:${id}`;
export const conceptNode = (id: string): NodeId => `concept:${id}`;
export const patternNode = (id: string): NodeId => `pattern:${id}`;

interface Draft {
  id: NodeId;
  kind: SkillNode['kind'];
  ref: string;
  prereqs: NodeId[];
  level: 'core' | 'advanced';
  score: number;
  theme: string | null;
  members?: string[];
}

export function buildSkillGraph(
  data: LearnData,
  overrides: Overrides,
  options: Partial<GraphOptions> = {},
): SkillGraph {
  const opt = { ...DEFAULT_GRAPH_OPTIONS, ...options };
  const drafts = new Map<NodeId, Draft>();
  const pinRank = new Map(overrides.pins.map((id, i) => [id, i]));

  /* concept nodes: ranked by how many sentences exercise them */
  const usage = new Map<string, number>();
  for (const e of data.examples) for (const c of e.concepts) usage.set(c, (usage.get(c) ?? 0) + 1);
  const excluded = new Set(overrides.exclude);
  for (const c of data.concepts.values()) {
    if (excluded.has(c.id)) continue;
    drafts.set(conceptNode(c.id), {
      id: conceptNode(c.id),
      kind: 'concept',
      ref: c.id,
      prereqs: c.prereqs.map(conceptNode),
      level: overrides.levels[c.id] ?? 'core',
      score: usage.get(c.id) ?? 0,
      theme: null,
    });
  }

  /* root nodes */
  for (const item of data.items.values()) {
    if (item.kind !== 'root' && item.kind !== 'compound') continue;
    const f = data.frequency.get(item.id) ?? { corpus: 0, examples: 0 };
    const occurs = f.corpus + f.examples > 0;
    // a part that is not a headword (a colour base, 2.0:G38) teaches nothing first
    const parts = (item.components ?? []).filter((c) => {
      const k = data.items.get(c)?.kind;
      return k === 'root' || k === 'compound';
    });
    const prereqs =
      item.components !== null
        ? [...parts.map(rootNode), conceptNode(COMPOUND)]
        : [conceptNode(formConcept('root'))];
    drafts.set(rootNode(item.id), {
      id: rootNode(item.id),
      kind: 'root',
      ref: item.id,
      prereqs: [...new Set(prereqs)],
      level: overrides.levels[item.id] ?? (occurs ? 'core' : 'advanced'),
      score: f.corpus * opt.corpusWeight + f.examples + item.usedIn.length * 0.5,
      theme: item.theme,
    });
    if (item.usedIn.length >= PATTERN_MIN) {
      drafts.set(patternNode(item.id), {
        id: patternNode(item.id),
        kind: 'pattern',
        ref: item.id,
        prereqs: [rootNode(item.id), conceptNode(COMPOUND)],
        level: 'core',
        score: item.usedIn.length,
        theme: item.theme,
        members: [...item.usedIn],
      });
    }
  }

  /* a core root's parts are core too: they must be taught before it */
  const promote = (id: NodeId): void => {
    const d = drafts.get(id);
    if (d === undefined || d.kind !== 'root') return;
    for (const p of d.prereqs) {
      const pre = drafts.get(p);
      if (
        pre?.kind === 'root' &&
        pre.level === 'advanced' &&
        overrides.levels[pre.ref] === undefined
      ) {
        pre.level = 'core';
        promote(p);
      }
    }
  };
  for (const d of [...drafts.values()]) if (d.kind === 'root' && d.level === 'core') promote(d.id);

  /* ranking: pins, then core before advanced, then score, then id for determinism */
  const rank = (a: Draft, b: Draft): number => {
    const pa = pinRank.get(a.id) ?? Infinity;
    const pb = pinRank.get(b.id) ?? Infinity;
    if (pa !== pb) return pa - pb;
    if (a.level !== b.level) return a.level === 'core' ? -1 : 1;
    if (a.score !== b.score) return b.score - a.score;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };
  const byKind = (kind: Draft['kind']): Draft[] =>
    [...drafts.values()].filter((d) => d.kind === kind).sort(rank);
  const pending = {
    concept: byKind('concept'),
    root: byKind('root'),
    pattern: byKind('pattern'),
  };

  const placed = new Set<NodeId>();
  const ready = (d: Draft): boolean => d.prereqs.every((p) => placed.has(p) || !drafts.has(p));
  const order: NodeId[] = [];
  const unitOf = new Map<NodeId, number>();
  const units: Unit[] = [];

  const take = (list: Draft[], d: Draft, unit: number, nodes: NodeId[]): void => {
    list.splice(list.indexOf(d), 1);
    placed.add(d.id);
    order.push(d.id);
    unitOf.set(d.id, unit);
    nodes.push(d.id);
  };

  while (pending.concept.length + pending.root.length + pending.pattern.length > 0) {
    const index = units.length;
    const nodes: NodeId[] = [];

    // a pinned root or concept goes first, with whatever it needs
    const concept = pending.concept.find(ready);
    if (concept !== undefined) take(pending.concept, concept, index, nodes);

    const available = pending.root.filter(ready);
    const seed = available[0];
    if (seed !== undefined) {
      const chosen: Draft[] = [];
      const pinned = available.filter((d) => pinRank.has(d.id));
      for (const d of pinned) if (chosen.length < opt.rootsPerUnit) chosen.push(d);
      const theme = (chosen[0] ?? seed).theme;
      for (const d of available.slice(0, opt.themeWindow)) {
        if (chosen.length >= opt.rootsPerUnit) break;
        if (d.theme === theme && d.level === seed.level && !chosen.includes(d)) chosen.push(d);
      }
      for (const d of available) {
        if (chosen.length >= opt.rootsPerUnit) break;
        if (d.level === seed.level && !chosen.includes(d)) chosen.push(d);
      }
      for (const d of chosen) take(pending.root, d, index, nodes);
    }

    const pattern = pending.pattern.find(ready);
    if (pattern !== undefined) take(pending.pattern, pattern, index, nodes);

    if (nodes.length === 0) break; // nothing can be placed: the validator reports it
    const themes = new Map<string, number>();
    for (const id of nodes) {
      const t = drafts.get(id)?.theme;
      if (t !== undefined && t !== null) themes.set(t, (themes.get(t) ?? 0) + 1);
    }
    const theme = [...themes].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    units.push({ id: `unit:${String(index + 1)}`, index, theme, nodes });
  }

  const position = new Map(order.map((id, i) => [id, i]));
  const nodes = new Map<NodeId, SkillNode>();
  for (const d of drafts.values()) {
    nodes.set(d.id, {
      id: d.id,
      kind: d.kind,
      ref: d.ref,
      prereqs: d.prereqs,
      level: d.level,
      unit: unitOf.get(d.id) ?? -1,
      order: position.get(d.id) ?? -1,
      ...(d.members !== undefined ? { members: d.members } : {}),
    });
  }
  return { edition: data.edition, nodes, units, order };
}

/** A node unlocks when every prerequisite has reached the mastery threshold. */
export function isUnlocked(
  graph: SkillGraph,
  id: NodeId,
  mastery: (id: NodeId) => number,
  threshold = 0.8,
): boolean {
  const node = graph.nodes.get(id);
  if (node === undefined) return false;
  return node.prereqs.every((p) => !graph.nodes.has(p) || mastery(p) >= threshold);
}
