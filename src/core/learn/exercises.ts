/**
 * The exercise engine (Learn Phase 3). Every exercise is generated from the
 * live data with a seeded RNG: the same seed and data give the same
 * exercise. Nothing here contains Liraasa; every word shown comes from an
 * item, a form or a sentence of the data.
 *
 *   recognition    Liraasa → English, multiple choice        meaning · recognize
 *   recall         English → Liraasa, typed                  meaning · produce
 *   formBuild      root → a named form, typed                morphology · produce
 *   formIdentify   a form → which form it is                 morphology · recognize
 *   decompose      a compound → its two parts, tiles         morphology · recognize
 *   compoundBuild  a meaning → the compound, from parts      morphology · produce
 *   assemble       English → order the sentence's tiles      grammar · produce
 *   translateFrom  a sentence → English, typed, tolerant     grammar · recognize
 *   translateTo    English → the sentence, typed             grammar · produce
 *   cloze          a sentence with a gap, typed or choice    grammar · produce
 *   matching       spellings ↔ meanings                      meaning · recognize
 *   listen         an audio clip → its meaning or its text   (only when a clip exists)
 *
 * Distractors are never random: they share the target's theme, sound like
 * it, or are the same kind of word, and never mean the same thing.
 */
import { FORM_SLOTS, type FormSlot } from '../config/slots';
import { humanize } from './concepts';
import { glossLine, type GlossedToken } from './lessons';
import type { Rng } from './rng';
import { editDistance, normalize } from './text';
import type { ConceptId, LearnData, LearnExample, LearnItem, NodeId, SkillGraph } from './types';

export type ExerciseType =
  | 'recognition'
  | 'recall'
  | 'formBuild'
  | 'formIdentify'
  | 'decompose'
  | 'compoundBuild'
  | 'assemble'
  | 'translateFrom'
  | 'translateTo'
  | 'cloze'
  | 'matching'
  | 'listen';

export const EXERCISE_TYPES: readonly ExerciseType[] = [
  'recognition',
  'recall',
  'formBuild',
  'formIdentify',
  'decompose',
  'compoundBuild',
  'assemble',
  'translateFrom',
  'translateTo',
  'cloze',
  'matching',
  'listen',
];

export type Skill = 'meaning' | 'morphology' | 'grammar';
export type Direction = 'recognize' | 'produce';

export interface Choice {
  id: string;
  text: string;
  /** Whether the text is Liraasa (drawn in the serif face) or English. */
  liraasa: boolean;
}

export interface Tile {
  id: string;
  text: string;
}

export type Answer =
  | { kind: 'choice'; correct: string }
  | {
      kind: 'typed';
      lang: 'liraasa' | 'english';
      /** Every answer the data supports. */
      accepted: readonly string[];
    }
  | { kind: 'order'; tiles: readonly Tile[]; correct: readonly string[] }
  | {
      kind: 'pairs';
      left: readonly Choice[];
      right: readonly Choice[];
      /** left id → right id */
      pairs: Readonly<Record<string, string>>;
    };

export interface Exercise {
  id: string;
  type: ExerciseType;
  skill: Skill;
  direction: Direction;
  /** The spaced-repetition card this exercise trains. */
  card: string;
  /** The item or concept the exercise is about. */
  target: string;
  /** Entry ids the exercise shows or asks for. */
  items: readonly string[];
  concepts: readonly ConceptId[];
  /** What to do, in English. */
  instruction: string;
  prompt: {
    liraasa?: string;
    english?: string;
    tokens?: readonly GlossedToken[];
    /** For a cloze: the sentence with its gap, as text before and after. */
    gap?: { before: string; after: string };
  };
  /** Multiple choice; for a cloze, an optional easier mode. */
  choices?: readonly Choice[];
  answer: Answer;
  /** The audio key to play, when the author has recorded one. */
  audio?: string;
  /** The sentence an exercise is drawn from. */
  source?: string;
}

export interface ExerciseContext {
  data: LearnData;
  graph?: SkillGraph;
  /** Audio keys the author has recorded: item ids and sentence keys. */
  audio?: ReadonlySet<string>;
  /**
   * Headwords the learner has met. Sentence exercises prefer sentences whose
   * headwords are all known (closed words are taught by their concepts).
   */
  known?: ReadonlySet<string>;
}

export const cardId = (target: string, skill: Skill, direction: Direction): string =>
  `${target}|${skill}|${direction}`;

/* ------------------------------------------------------------ helpers */

const HEADWORD = new Set(['root', 'compound']);
const meaningful = (item: LearnItem): FormSlot[] =>
  item.forms.filter((f) => f.meaningful).map((f) => f.slot);
const formOf = (item: LearnItem, slot: FormSlot): string =>
  item.forms.find((f) => f.slot === slot)?.form ?? item.spelling;
const glossOf = (item: LearnItem, slot: FormSlot): string => {
  const f = item.forms.find((x) => x.slot === slot);
  return f?.meaningful === true ? f.gloss : item.meaning;
};

/** Meanings that are the same answer: normalised text, or a shared synonym. */
function sameMeaning(a: LearnItem, b: LearnItem): boolean {
  if (normalize(a.meaning) === normalize(b.meaning)) return true;
  const syn = new Set(a.synonyms.map(normalize));
  return b.synonyms.some((s) => syn.has(normalize(s)));
}

/**
 * Plausible wrong answers for an item: same theme, a similar sound, the same
 * kind of word. Ranked by that score; the RNG only breaks ties and orders.
 */
export function distractorItems(
  ctx: ExerciseContext,
  item: LearnItem,
  n: number,
  rng: Rng,
  accept: (other: LearnItem) => boolean = () => true,
): LearnItem[] {
  const group = HEADWORD.has(item.kind)
    ? (k: string): boolean => HEADWORD.has(k)
    : (k: string): boolean => k === item.kind;
  const scored: { item: LearnItem; score: number }[] = [];
  for (const other of ctx.data.items.values()) {
    if (other.id === item.id || !group(other.kind) || !accept(other)) continue;
    if (normalize(other.spelling) === normalize(item.spelling) || sameMeaning(item, other))
      continue;
    let score = 0;
    if (other.theme === item.theme) score += 3;
    const d = editDistance(other.spelling, item.spelling, 3);
    if (d <= 2) score += 3;
    else if (d <= 3) score += 1;
    if (other.kind === item.kind) score += 1;
    if (other.register === item.register) score += 0.5;
    if (Math.abs(other.spelling.length - item.spelling.length) <= 1) score += 0.5;
    if (score > 0) scored.push({ item: other, score: score + rng.next() * 0.1 });
  }
  scored.sort((a, b) => b.score - a.score);
  const pool = scored.slice(0, Math.max(n * 3, n));
  const chosen: LearnItem[] = [];
  for (const { item: other } of rng.shuffle(pool)) {
    if (chosen.length >= n) break;
    if (
      chosen.some(
        (c) => sameMeaning(c, other) || normalize(c.spelling) === normalize(other.spelling),
      )
    ) {
      continue;
    }
    chosen.push(other);
  }
  return chosen;
}

/**
 * Up to `n` choices with distinct texts: the correct one exactly once, no
 * wrong one equal to it or to any other accepted answer, shuffled.
 */
function choicesOf(
  rng: Rng,
  correct: Choice,
  wrong: readonly Choice[],
  n = 4,
  forbidden: readonly string[] = [],
): Choice[] {
  const seen = new Set([normalize(correct.text), ...forbidden.map(normalize)]);
  const out = [correct];
  for (const c of wrong) {
    if (out.length >= n) break;
    const key = normalize(c.text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return rng.shuffle(out);
}

/** Sentences fit for an exercise: translated, linked, of a learnable length. */
const usable = (e: LearnExample, min = 2, max = 10): boolean =>
  e.english !== null &&
  e.tokens.length >= min &&
  e.tokens.length <= max &&
  e.tokens.every((t) => t.link.kind !== 'unknown');

/* --------------------------------------------------------- generators */

export function recognition(
  ctx: ExerciseContext,
  id: string,
  rng: Rng,
  slot?: FormSlot,
): Exercise | null {
  const item = ctx.data.items.get(id);
  if (item === undefined || item.meaning === '') return null;
  const s = slot ?? 'root';
  const form = item.forms.length > 0 ? formOf(item, s) : item.spelling;
  const meaning = item.forms.length > 0 ? glossOf(item, s) : item.meaning;
  const wrong = distractorItems(ctx, item, 6, rng).map((d) => ({
    id: d.id,
    text: d.forms.length > 0 ? glossOf(d, s) : d.meaning,
    liraasa: false,
  }));
  const choices = choicesOf(rng, { id: item.id, text: meaning, liraasa: false }, wrong, 4, [
    ...item.synonyms,
    item.meaning,
  ]);
  if (choices.length < 3) return null;
  return {
    id: `recognition:${id}:${s}`,
    type: 'recognition',
    skill: 'meaning',
    direction: 'recognize',
    card: cardId(id, 'meaning', 'recognize'),
    target: id,
    items: [id, ...choices.filter((c) => c.id !== id).map((c) => c.id)],
    concepts: s === 'root' ? [] : [`form:${s}`],
    instruction: 'What does this mean?',
    prompt: { liraasa: form },
    choices,
    answer: { kind: 'choice', correct: item.id },
    ...(ctx.audio?.has(id) === true ? { audio: id } : {}),
  };
}

export function recall(ctx: ExerciseContext, id: string): Exercise | null {
  const item = ctx.data.items.get(id);
  if (item === undefined || item.meaning === '') return null;
  // other entries that mean the same thing are right answers too
  const accepted = [item.spelling];
  for (const other of ctx.data.items.values()) {
    if (other.id !== id && normalize(other.meaning) === normalize(item.meaning))
      accepted.push(other.spelling);
  }
  return {
    id: `recall:${id}`,
    type: 'recall',
    skill: 'meaning',
    direction: 'produce',
    card: cardId(id, 'meaning', 'produce'),
    target: id,
    items: [id],
    concepts: [],
    instruction: 'Write this in Liraasa.',
    prompt: { english: item.meaning },
    answer: { kind: 'typed', lang: 'liraasa', accepted },
  };
}

export function formBuild(
  ctx: ExerciseContext,
  id: string,
  rng: Rng,
  slot?: FormSlot,
): Exercise | null {
  const item = ctx.data.items.get(id);
  if (item === undefined || item.forms.length === 0) return null;
  const options: FormSlot[] = meaningful(item).filter((s) => s !== 'root');
  const s = slot ?? rng.pick(options);
  if (s === undefined || !options.includes(s)) return null;
  return {
    id: `formBuild:${id}:${s}`,
    type: 'formBuild',
    skill: 'morphology',
    direction: 'produce',
    card: cardId(id, 'morphology', 'produce'),
    target: id,
    items: [id],
    concepts: [`form:${s}`],
    instruction: `Give the ${humanize(s)} form.`,
    prompt: { liraasa: item.spelling, english: glossOf(item, s) },
    answer: { kind: 'typed', lang: 'liraasa', accepted: [formOf(item, s)] },
  };
}

export function formIdentify(
  ctx: ExerciseContext,
  id: string,
  rng: Rng,
  slot?: FormSlot,
): Exercise | null {
  const item = ctx.data.items.get(id);
  if (item === undefined || item.forms.length === 0) return null;
  const options: FormSlot[] = meaningful(item).filter((s) => s !== 'root');
  const s = slot ?? rng.pick(options);
  if (s === undefined || !options.includes(s)) return null;
  const others = rng.shuffle(FORM_SLOTS.filter((x) => x !== s)).slice(0, 3);
  const choices = rng.shuffle(
    [s, ...others].map((x) => ({ id: x, text: humanize(x), liraasa: false })),
  );
  return {
    id: `formIdentify:${id}:${s}`,
    type: 'formIdentify',
    skill: 'morphology',
    direction: 'recognize',
    card: cardId(id, 'morphology', 'recognize'),
    target: id,
    items: [id],
    concepts: [`form:${s}`],
    instruction: 'Which form is this?',
    prompt: { liraasa: formOf(item, s), english: glossOf(item, s) },
    choices,
    answer: { kind: 'choice', correct: s },
  };
}

/** Parts plus plausible wrong parts, as tiles. */
function partTiles(
  ctx: ExerciseContext,
  compound: LearnItem,
  rng: Rng,
): { tiles: Tile[]; correct: string[] } | null {
  if (compound.components === null) return null;
  const parts = compound.components.map((p) => ctx.data.items.get(p));
  const [a, b] = parts;
  if (a === undefined || b === undefined) return null;
  const wrong = [
    ...distractorItems(ctx, a, 2, rng, (o) => o.kind === 'root'),
    ...distractorItems(ctx, b, 2, rng, (o) => o.kind === 'root'),
  ].filter((d) => d.id !== a.id && d.id !== b.id && compound.spelling !== d.spelling + b.spelling);
  const tiles: Tile[] = [];
  const seen = new Set<string>();
  for (const it of [a, b, ...wrong]) {
    if (seen.has(it.spelling)) continue;
    seen.add(it.spelling);
    tiles.push({ id: it.id, text: it.spelling });
  }
  return { tiles: rng.shuffle(tiles.slice(0, 5)), correct: [a.id, b.id] };
}

export function decompose(ctx: ExerciseContext, id: string, rng: Rng): Exercise | null {
  const item = ctx.data.items.get(id);
  if (item?.kind !== 'compound') return null;
  const t = partTiles(ctx, item, rng);
  if (t === null) return null;
  return {
    id: `decompose:${id}`,
    type: 'decompose',
    skill: 'morphology',
    direction: 'recognize',
    card: cardId(id, 'morphology', 'recognize'),
    target: id,
    items: [id, ...t.tiles.map((x) => x.id)],
    concepts: ['compound'],
    instruction: 'Break this word into its two parts, modifier first.',
    prompt: { liraasa: item.spelling, english: item.meaning },
    answer: { kind: 'order', tiles: t.tiles, correct: t.correct },
  };
}

export function compoundBuild(ctx: ExerciseContext, id: string, rng: Rng): Exercise | null {
  const item = ctx.data.items.get(id);
  if (item?.kind !== 'compound') return null;
  const t = partTiles(ctx, item, rng);
  if (t === null) return null;
  return {
    id: `compoundBuild:${id}`,
    type: 'compoundBuild',
    skill: 'morphology',
    direction: 'produce',
    card: cardId(id, 'morphology', 'produce'),
    target: id,
    items: [id, ...t.tiles.map((x) => x.id)],
    concepts: ['compound'],
    instruction: 'Build the word for this meaning from two parts: modifier, then head.',
    prompt: { english: item.meaning },
    answer: { kind: 'order', tiles: t.tiles, correct: t.correct },
  };
}

const sentenceCard = (target: string, e: LearnExample, dir: Direction): string =>
  cardId(target !== '' ? target : (e.concepts[0] ?? e.key), 'grammar', dir);

export function assemble(
  ctx: ExerciseContext,
  e: LearnExample,
  rng: Rng,
  target = '',
): Exercise | null {
  if (!usable(e, 3, 9)) return null;
  const tiles = e.tokens.map((t, i) => ({ id: `t${String(i)}`, text: t.text }));
  let shuffled = rng.shuffle(tiles);
  for (let i = 0; i < 4 && shuffled.every((t, j) => t.text === tiles[j]?.text); i += 1) {
    shuffled = rng.shuffle(tiles);
  }
  if (shuffled.every((t, j) => t.text === tiles[j]?.text)) return null;
  return {
    id: `assemble:${e.key}`,
    type: 'assemble',
    skill: 'grammar',
    direction: 'produce',
    card: sentenceCard(target, e, 'produce'),
    target: target || (e.concepts[0] ?? e.key),
    items: [...e.ids],
    concepts: [...e.concepts],
    instruction: 'Put the words in order.',
    prompt: { english: e.english ?? '' },
    answer: { kind: 'order', tiles: shuffled, correct: tiles.map((t) => t.id) },
    source: e.key,
    ...(ctx.audio?.has(e.key) === true ? { audio: e.key } : {}),
  };
}

export function translateFrom(ctx: ExerciseContext, e: LearnExample, target = ''): Exercise | null {
  if (!usable(e)) return null;
  return {
    id: `translateFrom:${e.key}`,
    type: 'translateFrom',
    skill: 'grammar',
    direction: 'recognize',
    card: sentenceCard(target, e, 'recognize'),
    target: target || (e.concepts[0] ?? e.key),
    items: [...e.ids],
    concepts: [...e.concepts],
    instruction: 'Translate into English.',
    prompt: { liraasa: e.liraasa, tokens: glossLine(ctx.data, e.tokens) },
    answer: { kind: 'typed', lang: 'english', accepted: [e.english ?? ''] },
    source: e.key,
    ...(ctx.audio?.has(e.key) === true ? { audio: e.key } : {}),
  };
}

export function translateTo(_ctx: ExerciseContext, e: LearnExample, target = ''): Exercise | null {
  if (!usable(e)) return null;
  return {
    id: `translateTo:${e.key}`,
    type: 'translateTo',
    skill: 'grammar',
    direction: 'produce',
    card: sentenceCard(target, e, 'produce'),
    target: target || (e.concepts[0] ?? e.key),
    items: [...e.ids],
    concepts: [...e.concepts],
    instruction: 'Translate into Liraasa.',
    prompt: { english: e.english ?? '' },
    answer: { kind: 'typed', lang: 'liraasa', accepted: [e.liraasa] },
    source: e.key,
  };
}

/**
 * A sentence with one word missing. `want` picks the word: a given entry, or
 * one of a concept's words; otherwise any headword.
 */
export function cloze(
  ctx: ExerciseContext,
  e: LearnExample,
  rng: Rng,
  want?: { item?: string; words?: readonly string[] },
  target = '',
): Exercise | null {
  if (!usable(e, 3, 14)) return null;
  const candidates = e.tokens
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => {
      if (t.link.kind !== 'entry') return false;
      const ids = t.link.refs.map((r) => r.id);
      if (want?.item !== undefined) return ids.includes(want.item);
      if (want?.words !== undefined) return ids.some((id) => want.words?.includes(id));
      return ids.some((id) => HEADWORD.has(ctx.data.items.get(id)?.kind ?? ''));
    });
  const gap = rng.pick(candidates);
  if (gap === undefined || gap.t.link.kind !== 'entry') return null;
  const answer = gap.t.text;
  const ref = gap.t.link.refs[0];
  const item = ref === undefined ? undefined : ctx.data.items.get(ref.id);
  if (item === undefined) return null;
  const slot = ref?.slot;
  const wrong = distractorItems(ctx, item, 6, rng).map((d) => ({
    id: d.id,
    text: slot !== undefined && d.forms.length > 0 ? formOf(d, slot) : d.spelling,
    liraasa: true,
  }));
  const choices = choicesOf(rng, { id: 'answer', text: answer, liraasa: true }, wrong);
  const before = e.liraasa.slice(0, gap.t.start);
  const after = e.liraasa.slice(gap.t.end);
  return {
    id: `cloze:${e.key}:${String(gap.i)}`,
    type: 'cloze',
    skill: 'grammar',
    direction: 'produce',
    card:
      target !== '' ? cardId(target, 'grammar', 'produce') : cardId(item.id, 'meaning', 'produce'),
    target: target || item.id,
    items: [...e.ids, ...choices.filter((c) => c.id !== 'answer').map((c) => c.id)],
    concepts: [...e.concepts],
    instruction: 'Fill the gap.',
    prompt: { english: e.english ?? '', gap: { before, after } },
    choices,
    answer: { kind: 'typed', lang: 'liraasa', accepted: [answer] },
    source: e.key,
  };
}

export function matching(ctx: ExerciseContext, ids: readonly string[], rng: Rng): Exercise | null {
  const items: LearnItem[] = [];
  for (const id of ids) {
    const item = ctx.data.items.get(id);
    if (item === undefined || item.meaning === '') continue;
    if (items.some((x) => sameMeaning(x, item) || x.spelling === item.spelling)) continue;
    items.push(item);
  }
  if (items.length < 3) return null;
  const chosen = items.slice(0, 5);
  const left = chosen.map((i) => ({ id: i.id, text: i.spelling, liraasa: true }));
  const right = rng.shuffle(
    chosen.map((i) => ({ id: `m:${i.id}`, text: i.meaning, liraasa: false })),
  );
  return {
    id: `matching:${chosen.map((i) => i.id).join(',')}`,
    type: 'matching',
    skill: 'meaning',
    direction: 'recognize',
    card: cardId(chosen[0]?.id ?? '', 'meaning', 'recognize'),
    target: chosen[0]?.id ?? '',
    items: chosen.map((i) => i.id),
    concepts: [],
    instruction: 'Match each word to its meaning.',
    prompt: {},
    answer: {
      kind: 'pairs',
      left,
      right,
      pairs: Object.fromEntries(chosen.map((i) => [i.id, `m:${i.id}`])),
    },
  };
}

/** An audio exercise: only when the author has recorded the item or sentence. */
export function listen(ctx: ExerciseContext, key: string, rng: Rng): Exercise | null {
  if (ctx.audio?.has(key) !== true) return null;
  const item = ctx.data.items.get(key);
  if (item !== undefined) {
    const base = recognition(ctx, key, rng);
    if (base === null) return null;
    const { prompt: _prompt, ...rest } = base;
    return {
      ...rest,
      id: `listen:${key}`,
      type: 'listen',
      instruction: 'Listen. What does it mean?',
      prompt: {},
      audio: key,
    };
  }
  const e = ctx.data.examples.find((x) => x.key === key);
  if (e === undefined || !usable(e)) return null;
  const base = translateTo(ctx, e);
  if (base === null) return null;
  return {
    ...base,
    id: `listen:${key}`,
    type: 'listen',
    direction: 'recognize',
    card: cardId(base.target, 'grammar', 'recognize'),
    instruction: 'Listen, and write what you hear.',
    prompt: {},
    audio: key,
  };
}

/* -------------------------------------------------- per node, per session */

/** How many of a sentence's headwords the learner has not met yet. */
function unknownCount(ctx: ExerciseContext, e: LearnExample): number {
  if (ctx.known === undefined) return 0;
  let n = 0;
  for (const id of e.ids) {
    if (HEADWORD.has(ctx.data.items.get(id)?.kind ?? '') && !ctx.known.has(id)) n += 1;
  }
  return n;
}

/**
 * Sentences for a concept: those built from known words first, then the
 * fewest unknown words, then the shortest.
 */
function examplesOf(ctx: ExerciseContext, concept: ConceptId): LearnExample[] {
  const list = ctx.data.examples.filter((e) => e.concepts.includes(concept) && usable(e, 2, 12));
  if (ctx.known === undefined) return list;
  const scored = list.map((e) => ({ e, u: unknownCount(ctx, e) }));
  const best = Math.min(...scored.map((x) => x.u));
  return scored
    .filter((x) => x.u <= best)
    .sort((a, b) => a.e.tokens.length - b.e.tokens.length)
    .map((x) => x.e);
}

/** Every exercise a skill-graph node can offer. */
export function exercisesForNode(ctx: ExerciseContext, node: NodeId, rng: Rng): Exercise[] {
  const out: (Exercise | null)[] = [];
  const [kind, ...rest] = node.split(':');
  const ref = rest.join(':');
  if (kind === 'root') {
    const item = ctx.data.items.get(ref);
    if (item === undefined) return [];
    out.push(
      recognition(ctx, ref, rng),
      recall(ctx, ref),
      formBuild(ctx, ref, rng),
      formIdentify(ctx, ref, rng),
    );
    if (item.kind === 'compound') out.push(decompose(ctx, ref, rng), compoundBuild(ctx, ref, rng));
    const usage = rng.pick(
      ctx.data.examples.filter((e) => e.ids.includes(ref) && usable(e, 3, 14)),
    );
    if (usage !== undefined) out.push(cloze(ctx, usage, rng, { item: ref }));
    out.push(listen(ctx, ref, rng));
  } else if (kind === 'concept') {
    const concept = ctx.data.concepts.get(ref);
    if (concept === undefined) return [];
    const sentences = rng.shuffle(examplesOf(ctx, ref).slice(0, 12)).slice(0, 6);
    for (const [i, e] of sentences.entries()) {
      if (i % 3 === 0) out.push(assemble(ctx, e, rng, ref));
      if (i % 3 === 1) out.push(translateFrom(ctx, e, ref));
      if (i % 3 === 2) out.push(translateTo(ctx, e, ref));
      if (concept.words.length > 0) out.push(cloze(ctx, e, rng, { words: concept.words }, ref));
    }
    if (concept.formSlot !== undefined && concept.formSlot !== 'root') {
      const slot = concept.formSlot;
      const items = [...ctx.data.items.values()].filter((i) =>
        i.forms.some((f) => f.slot === slot && f.meaningful),
      );
      for (const item of rng.shuffle(items).slice(0, 3)) {
        out.push(formBuild(ctx, item.id, rng, slot), formIdentify(ctx, item.id, rng, slot));
      }
    }
  } else if (kind === 'pattern') {
    const item = ctx.data.items.get(ref);
    for (const m of rng.shuffle(item?.usedIn ?? []).slice(0, 4)) {
      out.push(rng.next() < 0.5 ? compoundBuild(ctx, m, rng) : decompose(ctx, m, rng));
    }
  }
  return out.filter((x): x is Exercise => x !== null);
}

/**
 * A session over several nodes that mixes formats: exercises are dealt round
 * robin by type, so no two neighbours share a type when it can be helped.
 */
export function mixedSession(
  ctx: ExerciseContext,
  nodes: readonly NodeId[],
  rng: Rng,
  length: number,
  types?: ReadonlySet<ExerciseType>,
): Exercise[] {
  const byType = new Map<ExerciseType, Exercise[]>();
  for (const node of nodes) {
    for (const ex of exercisesForNode(ctx, node, rng)) {
      if (types !== undefined && !types.has(ex.type)) continue;
      byType.set(ex.type, [...(byType.get(ex.type) ?? []), ex]);
    }
  }
  const items = nodes.filter((n) => n.startsWith('root:')).map((n) => n.slice('root:'.length));
  if (items.length >= 3 && (types === undefined || types.has('matching'))) {
    const m = matching(ctx, rng.shuffle(items), rng);
    if (m !== null) byType.set('matching', [m]);
  }
  const queues = rng.shuffle([...byType.values()].map((list) => rng.shuffle(list)));
  const out: Exercise[] = [];
  const seen = new Set<string>();
  while (out.length < length && queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      const ex = q.shift();
      if (ex === undefined || seen.has(ex.id)) continue;
      seen.add(ex.id);
      out.push(ex);
      if (out.length >= length) break;
    }
  }
  return out;
}

/**
 * An exercise that trains one spaced-repetition card. Formats rotate with the
 * RNG among those that train the same item, skill and direction, so reviews
 * are not one drill repeated.
 */
export function exerciseForCard(ctx: ExerciseContext, card: string, rng: Rng): Exercise | null {
  const [target = '', skill, direction] = card.split('|');
  const item = ctx.data.items.get(target);
  const tries: (() => Exercise | null)[] = [];
  if (item !== undefined) {
    const usage = (): LearnExample | undefined =>
      rng.pick(ctx.data.examples.filter((e) => e.ids.includes(target) && usable(e, 3, 14)));
    if (skill === 'meaning' && direction === 'recognize') {
      tries.push(() => recognition(ctx, target, rng));
      if (ctx.audio?.has(target) === true) tries.push(() => listen(ctx, target, rng));
    } else if (skill === 'meaning') {
      tries.push(() => recall(ctx, target));
      tries.push(() => {
        const e = usage();
        return e === undefined ? null : cloze(ctx, e, rng, { item: target });
      });
    } else if (skill === 'morphology' && direction === 'produce') {
      tries.push(() =>
        item.kind === 'compound' ? compoundBuild(ctx, target, rng) : formBuild(ctx, target, rng),
      );
      tries.push(() => formBuild(ctx, target, rng));
    } else {
      tries.push(() =>
        item.kind === 'compound' ? decompose(ctx, target, rng) : formIdentify(ctx, target, rng),
      );
      tries.push(() => formIdentify(ctx, target, rng));
    }
  } else if (ctx.data.concepts.has(target)) {
    const concept = ctx.data.concepts.get(target);
    const e = rng.pick(examplesOf(ctx, target).slice(0, 12));
    if (e !== undefined) {
      if (direction === 'recognize') tries.push(() => translateFrom(ctx, e, target));
      else {
        tries.push(() => assemble(ctx, e, rng, target));
        tries.push(() => translateTo(ctx, e, target));
        if (concept !== undefined && concept.words.length > 0) {
          tries.push(() => cloze(ctx, e, rng, { words: concept.words }, target));
        }
      }
    }
  }
  for (const make of rng.shuffle(tries)) {
    const ex = make();
    if (ex !== null) return { ...ex, card };
  }
  return null;
}
