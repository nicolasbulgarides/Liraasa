/**
 * The author's curriculum overrides (data/lessons/overrides.json): pins,
 * core/advanced levels, notes, custom lessons and ruling links. Kept apart
 * from the lexicon and keyed by id. Parsing is forgiving about missing
 * sections and strict about shape, so a hand-edited file fails loudly.
 */
import type { CustomLesson, Overrides } from './types';

export const EMPTY_OVERRIDES: Overrides = {
  version: 1,
  pins: [],
  levels: {},
  notes: {},
  lessons: [],
  rulingLinks: {},
  exclude: [],
  rulingExamples: {},
};

export class OverridesError extends Error {}

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const strings = (x: unknown, where: string): string[] => {
  if (x === undefined) return [];
  if (!Array.isArray(x) || x.some((s) => typeof s !== 'string')) {
    throw new OverridesError(`${where} must be a list of strings`);
  }
  return x as string[];
};

export function parseOverrides(input: unknown): Overrides {
  if (input === undefined || input === null) return EMPTY_OVERRIDES;
  if (!isRecord(input)) throw new OverridesError('overrides must be an object');
  if (input.version !== undefined && input.version !== 1) {
    throw new OverridesError(`overrides version ${JSON.stringify(input.version)} is not supported`);
  }

  const levels: Record<string, 'core' | 'advanced'> = {};
  for (const [id, level] of Object.entries(isRecord(input.levels) ? input.levels : {})) {
    if (level !== 'core' && level !== 'advanced') {
      throw new OverridesError(`levels.${id} must be "core" or "advanced"`);
    }
    levels[id] = level;
  }

  const notes: Record<string, { explanation?: string; mnemonic?: string }> = {};
  for (const [id, note] of Object.entries(isRecord(input.notes) ? input.notes : {})) {
    if (!isRecord(note)) throw new OverridesError(`notes.${id} must be an object`);
    notes[id] = {
      ...(typeof note.explanation === 'string' ? { explanation: note.explanation } : {}),
      ...(typeof note.mnemonic === 'string' ? { mnemonic: note.mnemonic } : {}),
    };
  }

  const lessons: CustomLesson[] = [];
  const rawLessons = input.lessons ?? [];
  if (!Array.isArray(rawLessons)) throw new OverridesError('lessons must be a list');
  for (const [i, l] of rawLessons.entries()) {
    if (!isRecord(l) || typeof l.id !== 'string' || typeof l.title !== 'string') {
      throw new OverridesError(`lessons[${String(i)}] needs an id and a title`);
    }
    lessons.push({
      id: l.id,
      title: l.title,
      ...(typeof l.after === 'string' ? { after: l.after } : {}),
      refs: strings(l.refs, `lessons[${String(i)}].refs`),
      body: typeof l.body === 'string' ? l.body : '',
    });
  }

  const rulingLinks: Record<string, string[]> = {};
  for (const [ref, ids] of Object.entries(isRecord(input.rulingLinks) ? input.rulingLinks : {})) {
    rulingLinks[ref] = strings(ids, `rulingLinks.${ref}`);
  }

  return {
    version: 1,
    pins: strings(input.pins, 'pins'),
    levels,
    notes,
    lessons,
    rulingLinks,
    exclude: strings(input.exclude, 'exclude'),
    rulingExamples: Object.fromEntries(
      Object.entries(isRecord(input.rulingExamples) ? input.rulingExamples : {}).map(
        ([ref, keys]) => [ref, strings(keys, `rulingExamples.${ref}`)],
      ),
    ),
  };
}
