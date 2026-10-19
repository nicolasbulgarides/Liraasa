/**
 * One field map per section (ADR-0002).
 *
 * Both the importer and the exporter are derived from these; neither direction
 * is hand-written.
 */
import { FORM_SLOTS, SLOT_RAW_KEY, type FormSlot } from '../config/slots';
import { enumField, mapped, optional, plain, type FieldSpec, type SectionMap } from './fieldMap';
import type {
  RawColor,
  RawCorrelative,
  RawDiscourseParticle,
  RawExample,
  RawFunctionWord,
  RawHeadword,
  RawPronoun,
  RawSlots,
  RawTimeWord,
} from './raw';
import type {
  Color,
  Correlative,
  DiscourseParticle,
  Example,
  FunctionWord,
  Headword,
  Pronoun,
  TimeWord,
} from './types';

/* ------------------------------------------------------------------ helpers */

/** Decode a seven-slot block to internal slot names. */
function decodeSlots(raw: RawSlots): Record<FormSlot, string> {
  const out = {} as Record<FormSlot, string>;
  for (const slot of FORM_SLOTS) {
    out[slot] = (raw as unknown as Record<string, string>)[SLOT_RAW_KEY[slot]] ?? '';
  }
  return out;
}

/**
 * Re-encode a seven-slot block **into a clone of the original**, so each
 * entry's own key order survives. 80 of 1099 headwords store `verb` second
 * (ADR-0002); rebuilding in canonical order would diff the author's file.
 */
function encodeSlots(value: Record<FormSlot, string>, raw: RawSlots): Record<string, string> {
  const out: Record<string, string> = { ...(raw as unknown as Record<string, string>) };
  for (const slot of FORM_SLOTS) out[SLOT_RAW_KEY[slot]] = value[slot];
  return out;
}

function slotsField<Raw extends object>(rawKey: string, key: string): FieldSpec<Raw, never> {
  return mapped<Raw, Record<FormSlot, string>>(
    rawKey,
    key,
    (raw) => decodeSlots((raw as Record<string, unknown>)[rawKey] as RawSlots),
    (value, raw) => encodeSlots(value, (raw as Record<string, unknown>)[rawKey] as RawSlots),
  ) as unknown as FieldSpec<Raw, never>;
}

function f<Raw, V>(spec: FieldSpec<Raw, V>): FieldSpec<Raw, never> {
  return spec as unknown as FieldSpec<Raw, never>;
}

/* ---------------------------------------------------------------- headwords */

const HEADWORD_TYPE = { Primal: 'primal', Compound: 'compound' } as const;

const HEADWORD_STATUS = {
  CARRIED: 'carried',
  NEW: 'new',
  REPLACED: 'replaced',
  REDEFINED: 'redefined',
  REWRITTEN: 'rewritten',
  MERGED: 'merged',
} as const;

export const headwordMap: SectionMap<RawHeadword, Headword> = {
  name: 'headwords',
  fields: [
    f(plain<RawHeadword, string>('root', 'spelling')),
    f(enumField<RawHeadword>('type', 'type', HEADWORD_TYPE)),
    f(
      mapped<RawHeadword, readonly [string, string] | null>(
        'components',
        'components',
        (raw) => {
          const c = raw.components;
          if (c === null) return null;
          const [modifier, head] = c;
          if (c.length !== 2 || modifier === undefined || head === undefined) {
            throw new Error(`${raw.root}: expected 2 components, got ${String(c.length)}`);
          }
          return [modifier, head] as const;
        },
        (value) => (value === null ? null : [...value]),
      ),
    ),
    slotsField<RawHeadword>('forms', 'forms'),
    slotsField<RawHeadword>('glosses', 'glosses'),
    f(plain<RawHeadword, string>('register')),
    f(plain<RawHeadword, string>('domain')),
    f(
      /**
       * An array on all 1099 entries in 1.0. The string branch exists only for
       * a future 0.8 reader, where it was semicolon-separated on 888 entries
       * (ADR-0001, finding 7); each entry exports back in its original shape.
       */
      mapped<RawHeadword, readonly string[]>(
        'english_synonyms',
        'englishSynonyms',
        (raw) =>
          typeof raw.english_synonyms === 'string'
            ? raw.english_synonyms
                .split(';')
                .map((s) => s.trim())
                .filter((s) => s.length > 0)
            : raw.english_synonyms,
        (value, raw) => (typeof raw.english_synonyms === 'string' ? value.join('; ') : [...value]),
      ),
    ),
    f(enumField<RawHeadword>('status_1_0', 'status', HEADWORD_STATUS)),
    f(plain<RawHeadword, string>('since')),
    f(optional<RawHeadword, string>('replaces')),
    f(
      mapped<RawHeadword, { status: string; editorialNote: string } | null>(
        'history_0_8',
        'history08',
        (raw) =>
          raw.history_0_8 === null
            ? null
            : { status: raw.history_0_8.status, editorialNote: raw.history_0_8.editorial_note },
        (value, raw) =>
          value === null
            ? null
            : { ...raw.history_0_8, status: value.status, editorial_note: value.editorialNote },
      ),
    ),
    f(plain<RawHeadword, string>('notes')),
    f(plain<RawHeadword, boolean>('protected')),
  ],
};

/* ----------------------------------------------------------- function words */

export const functionWordMap: SectionMap<RawFunctionWord, FunctionWord> = {
  name: 'function_words',
  fields: [
    f(plain<RawFunctionWord, string>('form')),
    f(plain<RawFunctionWord, string>('meaning')),
    f(plain<RawFunctionWord, string>('position')),
    f(plain<RawFunctionWord, string | null>('example')),
    f(plain<RawFunctionWord, string | null>('example_gloss', 'exampleGloss')),
    f(plain<RawFunctionWord, string | null>('class', 'slotClass')),
    f(plain<RawFunctionWord, string>('status_1_0', 'status')),
    f(plain<RawFunctionWord, string>('since')),
    f(optional<RawFunctionWord, string>('notes')),
    f(optional<RawFunctionWord, { liraasa: string; english: string }[]>('examples')),
  ],
};

/* ----------------------------------------------------- other closed classes */

export const pronounMap: SectionMap<RawPronoun, Pronoun> = {
  name: 'pronouns',
  fields: [
    f(plain<RawPronoun, string>('form')),
    f(plain<RawPronoun, string>('person')),
    f(plain<RawPronoun, string>('number')),
    f(plain<RawPronoun, string>('possessive')),
    f(plain<RawPronoun, string>('reflexive')),
  ],
};

export const correlativeMap: SectionMap<RawCorrelative, Correlative> = {
  name: 'correlatives',
  fields: [
    f(plain<RawCorrelative, string>('form')),
    f(plain<RawCorrelative, string>('determiner')),
    f(plain<RawCorrelative, string>('concept')),
    f(plain<RawCorrelative, string>('gloss')),
  ],
};

export const timeWordMap: SectionMap<RawTimeWord, TimeWord> = {
  name: 'time_and_dates',
  fields: [f(plain<RawTimeWord, string>('form')), f(plain<RawTimeWord, string>('english'))],
};

/** Still keyed by workbook column names (SCHEMA §1.6). */
export const colorMap: SectionMap<RawColor, Color> = {
  name: 'colors',
  fields: [
    f(plain<RawColor, string>('Family', 'family')),
    f(plain<RawColor, string>('Base color', 'base')),
    f(plain<RawColor, string>('Dark + narvo', 'dark')),
    f(plain<RawColor, string>('Life + bio', 'life')),
    f(plain<RawColor, string>('Gem + juba', 'gem')),
    f(plain<RawColor, string>('Light + lumi', 'light')),
    f(plain<RawColor, string>('Example meanings / notes', 'notes')),
  ],
};

export const discourseParticleMap: SectionMap<RawDiscourseParticle, DiscourseParticle> = {
  name: 'discourse_particles',
  fields: [
    f(plain<RawDiscourseParticle, string>('form')),
    f(plain<RawDiscourseParticle, string>('function', 'pragmaticFunction')),
    f(plain<RawDiscourseParticle, string>('positions')),
    f(plain<RawDiscourseParticle, string>('register')),
    f(plain<RawDiscourseParticle, { liraasa: string; english: string }[]>('examples')),
  ],
};

/* ----------------------------------------------------------------- examples */

const EXAMPLE_STATUS = {
  CARRIED: 'carried',
  NEW: 'new',
  MIGRATED: 'migrated',
  HISTORICAL: 'historical',
  FORMULA: 'formula',
} as const;

export const exampleMap: SectionMap<RawExample, Example> = {
  name: 'examples',
  fields: [
    f(plain<RawExample, string>('liraasa')),
    f(plain<RawExample, string>('english')),
    f(plain<RawExample, string>('feature')),
    f(enumField<RawExample>('status', 'status', EXAMPLE_STATUS)),
    f(plain<RawExample, string>('source')),
    f(
      mapped<RawExample, readonly string[]>(
        'changes',
        'changes',
        (raw) => raw.changes ?? [],
        // 412 of 452 examples carry `changes`; the other 40 must stay absent.
        (value, raw) => (raw.changes === undefined && value.length === 0 ? undefined : [...value]),
        { optional: true },
      ),
    ),
  ],
};
