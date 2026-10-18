/**
 * Import: the author's JSON to the internal model.
 *
 * Every record keeps its source object (ADR-0002), so the export side can
 * reproduce the file without a hand-written serialiser.
 */
import { rulingRef } from '../config/editions';
import { isEntryRegister } from '../config/registers';
import { decodeRecord, type SectionMap } from './fieldMap';
import { IdAssigner, emptyIdMap, type IdKind, type IdMapFile } from './ids';
import {
  colorMap,
  correlativeMap,
  discourseParticleMap,
  exampleMap,
  functionWordMap,
  headwordMap,
  pronounMap,
  timeWordMap,
} from './sections';
import type { RawLexicon, RawRuling } from './raw';
import {
  RAW,
  attachRaw,
  type Color,
  type Correlative,
  type DiscourseParticle,
  type Example,
  type FunctionWord,
  type Headword,
  type ImageCompounds,
  type Lexicon,
  type MigrationForm,
  type MigrationKind,
  type Pronoun,
  type ReservedSpelling,
  type RhymeFamily,
  type Ruling,
  type SettledQuestion,
  type TimeWord,
} from './types';

export interface ImportOptions {
  /** A previously saved id map. Ids in it are reused, never reassigned. */
  ids?: IdMapFile;
}

export interface ImportResult {
  lexicon: Lexicon;
  /** The id map to persist. Save it even when nothing else changed. */
  ids: IdMapFile;
  /** Ids minted during this import. 0 on a reload of an unchanged file. */
  newlyMinted: number;
  /** Non-fatal observations. Fatal problems throw. */
  warnings: string[];
}

export class ImportError extends Error {}

/** The five values `migration_forms.kind` actually takes. */
const MIGRATION_KINDS: readonly MigrationKind[] = [
  'retired',
  'respelled',
  'merged',
  'rewritten',
  'archived-phrase',
];

/** Decode a section, attach the raw object, and assign an id. */
function decodeSection<Raw extends object, Internal extends object>(
  map: SectionMap<Raw, Internal>,
  rows: readonly Raw[],
  kind: IdKind,
  naturalKey: (raw: Raw) => string,
  assigner: IdAssigner,
): Internal[] {
  return rows.map((raw) => {
    const decoded = decodeRecord(map, raw);
    const preexisting = (raw as Record<string, unknown>).id;
    decoded.id = assigner.assign(
      kind,
      naturalKey(raw),
      typeof preexisting === 'string' ? preexisting : undefined,
    );
    return attachRaw(decoded as unknown as Internal, raw);
  });
}

function decodeRulings(rows: readonly RawRuling[], edition: string): Ruling[] {
  return rows.map((raw) => {
    const refines = Array.isArray(raw.refines) ? raw.refines.map(String) : [];
    const examples = Array.isArray(raw.examples)
      ? (raw.examples as unknown[])
          .filter((e): e is [string, string] => Array.isArray(e) && typeof e[0] === 'string')
          .map(([liraasa, english]) => ({ liraasa, english }))
      : [];
    return {
      ref: rulingRef(edition, raw.id),
      edition,
      localId: raw.id,
      topic: raw.topic,
      ruling: raw.ruling,
      refines,
      examples,
    };
  });
}

/** The suffix a compound is lexicalised with (2.0:G38: viofuroti = vio + furo + -ti), or ''. */
export function compoundSuffix(h: Headword): string {
  const raw = (h as unknown as { [RAW]?: { suffix?: unknown } })[RAW];
  return typeof raw?.suffix === 'string' ? raw.suffix : '';
}

export function importLexicon(raw: RawLexicon, options: ImportOptions = {}): ImportResult {
  const warnings: string[] = [];
  const assigner = new IdAssigner(options.ids ?? emptyIdMap(raw.version));

  if (typeof raw.version !== 'string' || raw.version.length === 0) {
    throw new ImportError('lexicon has no version');
  }

  const headwords = decodeSection<RawLexicon['headwords'][number], Headword>(
    headwordMap,
    raw.headwords,
    'headword',
    (h) => h.root,
    assigner,
  );

  for (const h of headwords) {
    const register: string = h.register;
    if (!isEntryRegister(register)) {
      warnings.push(`${h.spelling}: unexpected entry register "${register}"`);
    }
    if (h.type === 'compound' && h.components === null) {
      warnings.push(`${h.spelling}: compound with no components`);
    }
    if (h.type === 'primal' && h.components !== null) {
      warnings.push(`${h.spelling}: primal with components`);
    }
    if (h.components !== null && h.components.join('') + compoundSuffix(h) !== h.spelling) {
      warnings.push(`${h.spelling}: spelling is not its components concatenated`);
    }
  }

  const functionWords = decodeSection<RawLexicon['function_words'][number], FunctionWord>(
    functionWordMap,
    raw.function_words,
    'functionWord',
    (f) => f.form,
    assigner,
  ).map((f) => Object.assign(f, { isMultiWord: f.form.includes(' ') }));

  const pronouns = decodeSection<RawLexicon['pronouns'][number], Pronoun>(
    pronounMap,
    raw.pronouns,
    'pronoun',
    (p) => p.form,
    assigner,
  );

  const correlatives = decodeSection<RawLexicon['correlatives'][number], Correlative>(
    correlativeMap,
    raw.correlatives,
    'correlative',
    (c) => c.form,
    assigner,
  );

  /**
   * `time_and_dates` has 43 rows but 40 distinct forms: `eli-krono`,
   * `toda-krono` and `nuna-krono` each appear twice. The row index keeps the
   * natural key unique so both rows survive a round-trip.
   */
  const seenTimeForms = new Set<string>();
  const timeWords = decodeSection<RawLexicon['time_and_dates'][number], TimeWord>(
    timeWordMap,
    raw.time_and_dates,
    'timeWord',
    (t) => {
      const key = seenTimeForms.has(t.form) ? `${t.form}#${t.english}` : t.form;
      seenTimeForms.add(t.form);
      return key;
    },
    assigner,
  );

  const colors = decodeSection<RawLexicon['colors'][number], Color>(
    colorMap,
    raw.colors,
    'color',
    (c) => c['Base color'],
    assigner,
  );

  const discourseParticles = decodeSection<
    RawLexicon['discourse_particles'][number],
    DiscourseParticle
  >(discourseParticleMap, raw.discourse_particles, 'discourseParticle', (d) => d.form, assigner);

  // Examples have no stable identity of their own; they are keyed by text.
  const examples: Example[] = raw.examples.map((rawExample) => {
    const decoded = decodeRecord(exampleMap, rawExample);
    decoded.isLive = decoded.status !== 'historical';
    return attachRaw(decoded as unknown as Example, rawExample);
  });

  // 1.0's and the carried 0.8 rulings, then every later edition's, in file order
  const rulings: Ruling[] = [
    ...decodeRulings(raw.rulings_1_0, '1.0'),
    ...decodeRulings(raw.rulings_0_8_carried, '0.8'),
    ...Object.keys(raw)
      .filter((k) => /^rulings_\d+_\d+$/.test(k) && k !== 'rulings_1_0')
      .flatMap((k) =>
        decodeRulings(
          (raw as unknown as Record<string, RawRuling[]>)[k] ?? [],
          k.slice('rulings_'.length).replace('_', '.'),
        ),
      ),
  ];

  const rawPattern = raw.image_compounds;
  const imageCompounds: ImageCompounds | null =
    rawPattern === undefined
      ? null
      : {
          ruling: rawPattern.ruling,
          rule: rawPattern.rule,
          modifiers: new Map(
            Object.entries(rawPattern.modifiers).map(([id, m]) => [
              id,
              { asModifier: m.as_modifier, sense: m.sense },
            ]),
          ),
          heads: new Map(
            Object.entries(rawPattern.heads).map(([id, h]) => [id, { template: h.template }]),
          ),
          attested: decodeSection<RawLexicon['headwords'][number], Headword>(
            headwordMap,
            rawPattern.attested,
            'headword',
            (h) => h.root,
            assigner,
          ),
          keptAsHeadwords: new Map(Object.entries(rawPattern.kept_as_headwords)),
        };
  const defaults = (raw.morphology as unknown as { derivation_defaults?: Record<string, string> })
    .derivation_defaults;

  const rhymeFamilies: RhymeFamily[] = raw.rhyme_families.map((r) => ({
    ending: r.ending,
    members: r.members,
    count: r.count,
  }));

  const migrationForms: MigrationForm[] = Object.entries(raw.legacy.migration_forms).map(
    ([from, m]) => {
      if (!MIGRATION_KINDS.includes(m.kind as MigrationKind)) {
        warnings.push(`${from}: unknown migration kind "${m.kind}"`);
      }
      return {
        from,
        to: m.to,
        slot: m.slot,
        via: m.via,
        kind: m.kind as MigrationKind,
        isPhrase: m.to.includes(' '),
      };
    },
  );

  const soundLedger: ReservedSpelling[] = raw.sound_ledger.map((s) => ({
    spelling: s.spelling,
    state: s.state,
    replacement: s.replacement,
    reusableFrom: s.reusable_from,
    whyReserved: s.why_reserved,
  }));

  const settledQuestions: SettledQuestion[] = raw.settled_open_questions_0_8.map((q) => ({
    question: q.q,
    answer: q.answer,
  }));

  const lexicon = Object.defineProperty(
    {
      language: raw.language,
      version: raw.version,
      builtUtc: raw.built_utc,
      source: raw.source,
      headwords,
      imageCompounds,
      derivationDefaults: defaults ?? null,
      functionWords,
      pronouns,
      correlatives,
      timeWords,
      colors,
      discourseParticles,
      examples,
      rulings,
      rhymeFamilies,
      migrationForms,
      soundLedger,
      settledQuestions,
    },
    RAW,
    { value: raw, enumerable: false, writable: false },
  ) as unknown as Lexicon;

  return {
    lexicon,
    ids: assigner.toFile(raw.version),
    newlyMinted: assigner.newlyMinted,
    warnings,
  };
}
