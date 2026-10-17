/**
 * Lesson content (Learn Phase 2): the view models the Learn UI draws. Pure
 * functions of the data, so a respelled root shows its new spelling on the
 * next build, and every Liraasa string on screen comes from the lexicon or
 * the corpus.
 *
 *   glossToken      a token's interlinear gloss
 *   rootCard        a headword: forms, parts, compounds, real usages
 *   explainer       a grammar concept: the data's own text, words, examples
 *   reading         a corpus text, line by line with tokens and glosses
 *   unitLesson      the blocks of one unit of the path, in order
 */
import { humanize } from './concepts';
import { unique } from './text';
import type {
  Concept,
  ConceptId,
  CorpusText,
  LearnData,
  LearnExample,
  LearnItem,
  LinkedToken,
  NodeId,
  Overrides,
  SkillGraph,
} from './types';

/** Closed-class readings win over a headword of the same spelling (maivo: I, not Self). */
const PREFER = ['pronoun', 'functionWord', 'correlative', 'discourseParticle', 'timeWord', 'color'];

export interface GlossedToken {
  text: string;
  start: number;
  end: number;
  /** The entry the token most likely is; null for numbers, names, unknowns. */
  id: string | null;
  /** All entries the spelling could be. */
  ids: readonly string[];
  gloss: string;
  /** Grammatical tags: PL, DIM, the form slot, a motion prefix. */
  tags: readonly string[];
  kind: 'entry' | 'number' | 'name' | 'unknown';
}

export function glossToken(data: LearnData, token: LinkedToken): GlossedToken {
  const base = { text: token.text, start: token.start, end: token.end };
  const link = token.link;
  if (link.kind === 'number') {
    const tag = link.form ?? 'number';
    return { ...base, id: null, ids: [], gloss: String(link.value), tags: [tag], kind: 'number' };
  }
  if (link.kind === 'name')
    return { ...base, id: null, ids: [], gloss: token.text, tags: ['name'], kind: 'name' };
  if (link.kind === 'unknown')
    return { ...base, id: null, ids: [], gloss: '?', tags: [], kind: 'unknown' };

  const refs = [...link.refs].sort(
    (a, b) =>
      (PREFER.includes(a.namespace) ? PREFER.indexOf(a.namespace) : 99) -
      (PREFER.includes(b.namespace) ? PREFER.indexOf(b.namespace) : 99),
  );
  const ref = refs[0];
  const item = ref === undefined ? undefined : data.items.get(ref.id);
  const tags: string[] = [];
  let gloss = item?.meaning ?? '?';
  if (item !== undefined && ref?.slot !== undefined) {
    const form = item.forms.find((f) => f.slot === ref.slot);
    if (form?.meaningful === true) gloss = form.gloss;
    if (ref.slot !== 'root') tags.push(humanize(ref.slot));
  }
  // a pronoun's meaning carries its person and number; the line only needs the word
  if (item?.kind === 'pronoun') gloss = gloss.replace(/\s*\(.*\)$/, '');
  if (ref?.derivation !== undefined) tags.push('-' + ref.derivation);
  if (link.via === 'plural') tags.push('PL');
  if (link.via === 'diminutive') tags.push('DIM');
  if (link.via === 'motion' && link.prefix !== undefined) tags.push(link.prefix);
  if (link.via === 'legacy' && link.legacyFrom !== undefined)
    tags.push(`pre-1.0 ${link.legacyFrom}`);
  return {
    ...base,
    id: ref?.id ?? null,
    ids: refs.map((r) => r.id),
    gloss,
    tags,
    kind: 'entry',
  };
}

export const glossLine = (data: LearnData, tokens: readonly LinkedToken[]): GlossedToken[] =>
  tokens.map((t) => glossToken(data, t));

/* ------------------------------------------------------------- usages */

/** Sentences that use an entry, the most useful first: translated, short, varied in source. */
export function usagesOf(data: LearnData, id: string, limit = 6): LearnExample[] {
  const rank = (e: LearnExample): number =>
    (e.english === null ? 100 : 0) + (e.source === 'corpus' ? 0 : 5) + e.liraasa.length / 40;
  return unique(
    data.examples.filter((e) => e.ids.includes(id)),
    (e) => e.liraasa,
  )
    .sort((a, b) => rank(a) - rank(b) || (a.key < b.key ? -1 : 1))
    .slice(0, limit);
}

export interface InterlinearLine {
  liraasa: string;
  english: string | null;
  source: string;
  where?: string;
  tokens: readonly GlossedToken[];
}

const interlinear = (data: LearnData, e: LearnExample): InterlinearLine => ({
  liraasa: e.liraasa,
  english: e.english,
  source: e.source,
  ...(e.where !== undefined ? { where: e.where } : {}),
  tokens: glossLine(data, e.tokens),
});

/* ---------------------------------------------------------- root card */

export interface ItemRef {
  id: string;
  spelling: string;
  meaning: string;
}

export interface RootCard {
  item: LearnItem;
  parts: readonly ItemRef[];
  compounds: readonly ItemRef[];
  usages: readonly InterlinearLine[];
  note: { explanation?: string; mnemonic?: string } | null;
}

const refOf = (data: LearnData, id: string): ItemRef => {
  const item = data.items.get(id);
  return { id, spelling: item?.spelling ?? id, meaning: item?.meaning ?? '' };
};

export function rootCard(data: LearnData, id: string, overrides: Overrides): RootCard | null {
  const item = data.items.get(id);
  if (item === undefined) return null;
  return {
    item,
    parts: (item.components ?? []).map((p) => refOf(data, p)),
    compounds: item.usedIn.map((c) => refOf(data, c)),
    usages: usagesOf(data, id).map((e) => interlinear(data, e)),
    note: overrides.notes[id] ?? null,
  };
}

/* ---------------------------------------------------------- explainer */

export interface Explainer {
  concept: Concept;
  prereqs: readonly { id: ConceptId; title: string }[];
  words: readonly ItemRef[];
  examples: readonly InterlinearLine[];
  note: { explanation?: string; mnemonic?: string } | null;
}

export function explainer(
  data: LearnData,
  id: ConceptId,
  overrides: Overrides,
  limit = 6,
): Explainer | null {
  const concept = data.concepts.get(id);
  if (concept === undefined) return null;
  // a ruling's own examples lead on the ruling; elsewhere the lexicon's examples do
  const order =
    concept.kind === 'ruling'
      ? ({ ruling: 0, examples: 1, functionWord: 2, particle: 3, corpus: 4 } as const)
      : ({ examples: 0, functionWord: 1, particle: 2, corpus: 3, ruling: 4 } as const);
  const examples = unique(
    data.examples.filter((e) => e.concepts.includes(id)),
    (e) => e.liraasa,
  )
    .sort(
      (a, b) =>
        order[a.source] - order[b.source] ||
        (a.english === null ? 1 : 0) - (b.english === null ? 1 : 0) ||
        a.liraasa.length - b.liraasa.length,
    )
    .slice(0, limit);
  const note =
    overrides.notes[id] ??
    (concept.ruleRef !== undefined ? overrides.notes[concept.ruleRef] : undefined);
  return {
    concept,
    prereqs: concept.prereqs.map((p) => ({ id: p, title: data.concepts.get(p)?.title ?? p })),
    words: concept.words.map((w) => refOf(data, w)),
    examples: examples.map((e) => interlinear(data, e)),
    note: note ?? null,
  };
}

/* ------------------------------------------------------------ reading */

export interface Reading {
  text: CorpusText;
  lines: readonly InterlinearLine[];
  /** Entry ids the text uses, most frequent first. */
  vocabulary: readonly string[];
}

export function reading(data: LearnData, textId: string): Reading | null {
  const text = data.texts.find((t) => t.id === textId);
  if (text === undefined) return null;
  const counts = new Map<string, number>();
  const lines = text.lines.map((l) => {
    const tokens = glossLine(data, l.tokens);
    for (const t of tokens) if (t.id !== null) counts.set(t.id, (counts.get(t.id) ?? 0) + 1);
    return {
      liraasa: l.liraasa,
      english: l.english,
      source: 'corpus',
      where: `${text.id}:${String(l.n)}`,
      tokens,
    };
  });
  const vocabulary = [...counts]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([id]) => id);
  return { text, lines, vocabulary };
}

/* ---------------------------------------------------------------- unit */

export type LessonBlock =
  | { kind: 'explainer'; node: NodeId; explainer: Explainer }
  | { kind: 'card'; node: NodeId; card: RootCard }
  | { kind: 'pattern'; node: NodeId; root: ItemRef; members: readonly ItemRef[] }
  | { kind: 'custom'; id: string; title: string; body: string; refs: readonly string[] };

export function unitLesson(
  data: LearnData,
  graph: SkillGraph,
  overrides: Overrides,
  unitIndex: number,
): LessonBlock[] {
  const unit = graph.units[unitIndex];
  if (unit === undefined) return [];
  const blocks: LessonBlock[] = [];
  for (const id of unit.nodes) {
    const node = graph.nodes.get(id);
    if (node === undefined) continue;
    if (node.kind === 'concept') {
      const e = explainer(data, node.ref, overrides);
      if (e !== null) blocks.push({ kind: 'explainer', node: id, explainer: e });
    } else if (node.kind === 'root') {
      const card = rootCard(data, node.ref, overrides);
      if (card !== null) blocks.push({ kind: 'card', node: id, card });
    } else {
      blocks.push({
        kind: 'pattern',
        node: id,
        root: refOf(data, node.ref),
        members: (node.members ?? []).map((m) => refOf(data, m)),
      });
    }
    for (const l of overrides.lessons) {
      if (l.after === id)
        blocks.push({ kind: 'custom', id: l.id, title: l.title, body: l.body, refs: l.refs });
    }
  }
  return blocks;
}
