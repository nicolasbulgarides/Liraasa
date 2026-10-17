/**
 * What changed between two editions (Learn Phase 5), by id:
 *
 *   renamed     same id, new spelling
 *   reglossed   same id, new meaning
 *   added       new ids
 *   removed     ids gone, with the replacement the legacy record names
 *   rules       rulings added, removed or rewritten
 *
 * Diffs run on compact snapshots, so the build can ship the previous
 * edition's snapshot beside the current data and the browser can show
 * "What changed in 1.2" without the old lexicon.
 */
import type { LearnData } from './types';

export interface EditionSnapshot {
  edition: string;
  /** id → [spelling, meaning, kind, the seven form glosses in canonical order] */
  items: Record<string, [string, string, string, string[]]>;
  /** concept id → [title, description] */
  concepts: Record<string, [string, string]>;
}

export function snapshotEdition(data: LearnData): EditionSnapshot {
  const items: EditionSnapshot['items'] = {};
  for (const i of data.items.values())
    items[i.id] = [i.spelling, i.meaning, i.kind, i.forms.map((f) => f.gloss)];
  const concepts: EditionSnapshot['concepts'] = {};
  for (const c of data.concepts.values()) concepts[c.id] = [c.title, c.description];
  return { edition: data.edition, items, concepts };
}

export interface EditionDiff {
  from: string;
  to: string;
  renamed: { id: string; from: string; to: string; meaning: string }[];
  /** Meaning or form glosses changed; `slots` lists each changed form's gloss. */
  reglossed: {
    id: string;
    spelling: string;
    from: string;
    to: string;
    slots: { slot: number; from: string; to: string }[];
  }[];
  added: { id: string; spelling: string; meaning: string; kind: string }[];
  removed: { id: string; spelling: string; meaning: string; replacement?: string }[];
  rulesAdded: { id: string; title: string }[];
  rulesChanged: { id: string; title: string; from: string; to: string }[];
  rulesRemoved: { id: string; title: string }[];
}

export function diffSnapshots(
  prev: EditionSnapshot,
  curr: EditionSnapshot,
  replacementFor: (spelling: string) => string | undefined = () => undefined,
): EditionDiff {
  const d: EditionDiff = {
    from: prev.edition,
    to: curr.edition,
    renamed: [],
    reglossed: [],
    added: [],
    removed: [],
    rulesAdded: [],
    rulesChanged: [],
    rulesRemoved: [],
  };
  const byId = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
  for (const id of Object.keys(curr.items).sort(byId)) {
    const now = curr.items[id];
    const was = prev.items[id];
    if (now === undefined) continue;
    if (was === undefined) {
      d.added.push({ id, spelling: now[0], meaning: now[1], kind: now[2] });
      continue;
    }
    if (was[0] !== now[0]) {
      d.renamed.push({ id, from: was[0], to: now[0], meaning: now[1] });
      continue;
    }
    const slots = now[3]
      .map((to, slot) => ({ slot, from: was[3][slot] ?? '', to }))
      .filter((x) => x.from !== x.to);
    if (was[1] !== now[1] || slots.length > 0) {
      d.reglossed.push({ id, spelling: now[0], from: was[1], to: now[1], slots });
    }
  }
  for (const id of Object.keys(prev.items).sort(byId)) {
    const was = prev.items[id];
    if (was === undefined || curr.items[id] !== undefined) continue;
    const replacement = replacementFor(was[0]);
    d.removed.push({
      id,
      spelling: was[0],
      meaning: was[1],
      ...(replacement !== undefined ? { replacement } : {}),
    });
  }
  const rule = (id: string): boolean => id.startsWith('rule:');
  for (const id of Object.keys(curr.concepts).filter(rule).sort(byId)) {
    const now = curr.concepts[id];
    const was = prev.concepts[id];
    if (now === undefined) continue;
    if (was === undefined) d.rulesAdded.push({ id, title: now[0] });
    else if (was[1] !== now[1])
      d.rulesChanged.push({ id, title: now[0], from: was[1], to: now[1] });
  }
  for (const id of Object.keys(prev.concepts).filter(rule).sort(byId)) {
    const was = prev.concepts[id];
    if (was !== undefined && curr.concepts[id] === undefined)
      d.rulesRemoved.push({ id, title: was[0] });
  }
  return d;
}

export const diffIsEmpty = (d: EditionDiff): boolean =>
  d.renamed.length +
    d.reglossed.length +
    d.added.length +
    d.removed.length +
    d.rulesAdded.length +
    d.rulesChanged.length +
    d.rulesRemoved.length ===
  0;
