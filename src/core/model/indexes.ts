/**
 * The in-memory indexes, rebuilt on load.
 *
 * `byForm` maps a spelling to a **list**: 32 spellings live in more than one
 * namespace (`maivo` is both a pronoun and a root), and `time_and_dates`
 * cross-lists three correlatives. A spelling therefore resolves to a set of
 * candidates, never to one entry.
 */
import { DERIVATION_KEYS, isBlockedDerivation } from '../config/morphology';
import { FORM_SLOTS, isUnusedGloss, type FormSlot } from '../config/slots';
import { colorGrid } from '../generate/colors';
import type { EntryId, Headword, Lexicon, MigrationForm, ReservedSpelling } from './types';

export type Namespace =
  | 'headword'
  | 'derivation'
  | 'functionWord'
  | 'pronoun'
  | 'correlative'
  | 'timeWord'
  | 'color'
  | 'discourseParticle';

export interface FormRef {
  namespace: Namespace;
  entryId: EntryId;
  /** The spelling of the entry this form belongs to. */
  spelling: string;
  /** Which of the seven slots, for a headword form. */
  slot?: FormSlot;
  /** Which derivation, for a `-yo` / `-vu` / `-pago` form. */
  derivation?: string;
}

export interface ComponentUse {
  /** The compound. */
  spelling: string;
  entryId: EntryId;
  role: 'modifier' | 'head';
}

export interface LexiconIndexes {
  /** Every entry with a stable id, by id. */
  byId: ReadonlyMap<EntryId, { namespace: Namespace; spelling: string }>;
  /** Headwords by their current spelling. */
  headwordBySpelling: ReadonlyMap<string, Headword>;
  /** Any spelling to every entry that claims it. */
  byForm: ReadonlyMap<string, readonly FormRef[]>;
  /** A root to the compounds built on it. */
  byComponent: ReadonlyMap<string, readonly ComponentUse[]>;
  /** A root to its `-yo` / `-vu` / `-pago` derivations. */
  byDerivation: ReadonlyMap<string, readonly string[]>;
  /** An English synonym, lowercased, to the headwords offering it. */
  bySynonym: ReadonlyMap<string, readonly EntryId[]>;
  /** A gloss word, lowercased, to the headwords using it. */
  byGloss: ReadonlyMap<string, readonly EntryId[]>;
  /** A four-letter ending to the headword spellings sharing it. */
  byRhyme: ReadonlyMap<string, readonly string[]>;
  /** A pre-1.0 spelling to its 1.0 replacement (ruling 1.0:G19). */
  legacyForms: ReadonlyMap<string, MigrationForm>;
  /** A reserved spelling to why it is reserved. */
  reserved: ReadonlyMap<string, ReservedSpelling>;
  /** Counts, for the dashboard and for assertions. */
  stats: IndexStats;
}

export interface IndexStats {
  headwords: number;
  primalRoots: number;
  compounds: number;
  forms: number;
  unusedGlossSlots: number;
  functionWords: number;
  distinctSpellings: number;
  multiNamespaceSpellings: number;
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const existing = map.get(key);
  if (existing === undefined) map.set(key, [value]);
  else existing.push(value);
}

/** Split a gloss into indexable words, dropping the unused marker. */
function glossWords(gloss: string): string[] {
  if (isUnusedGloss(gloss)) return [];
  return gloss
    .toLowerCase()
    .split(/[^a-z']+/)
    .filter((w) => w.length > 2);
}

export function buildIndexes(lexicon: Lexicon): LexiconIndexes {
  const byId = new Map<EntryId, { namespace: Namespace; spelling: string }>();
  const headwordBySpelling = new Map<string, Headword>();
  const byForm = new Map<string, FormRef[]>();
  const byComponent = new Map<string, ComponentUse[]>();
  const byDerivation = new Map<string, string[]>();
  const bySynonym = new Map<string, EntryId[]>();
  const byGloss = new Map<string, EntryId[]>();
  const byRhyme = new Map<string, string[]>();

  let unusedGlossSlots = 0;
  let primalRoots = 0;
  let compounds = 0;

  for (const h of lexicon.headwords) {
    byId.set(h.id, { namespace: 'headword', spelling: h.spelling });
    headwordBySpelling.set(h.spelling, h);

    if (h.type === 'primal') primalRoots += 1;
    else compounds += 1;

    for (const slot of FORM_SLOTS) {
      push(byForm, h.forms[slot], {
        namespace: 'headword',
        entryId: h.id,
        spelling: h.spelling,
        slot,
      });
      if (isUnusedGloss(h.glosses[slot])) unusedGlossSlots += 1;
    }

    // Derivations are proposals, not stored forms, but the parser must know
    // them and check 3 looks for collisions among them.
    for (const derivation of DERIVATION_KEYS) {
      if (isBlockedDerivation(h.spelling, derivation)) continue;
      const derived = h.spelling + derivation;
      push(byDerivation, h.spelling, derived);
      push(byForm, derived, {
        namespace: 'derivation',
        entryId: h.id,
        spelling: h.spelling,
        derivation,
      });
    }

    if (h.components !== null) {
      const [modifier, head] = h.components;
      push(byComponent, modifier, { spelling: h.spelling, entryId: h.id, role: 'modifier' });
      push(byComponent, head, { spelling: h.spelling, entryId: h.id, role: 'head' });
    }

    for (const synonym of h.englishSynonyms) {
      const key = synonym.trim().toLowerCase();
      if (key.length > 0) push(bySynonym, key, h.id);
    }

    for (const slot of FORM_SLOTS) {
      for (const word of glossWords(h.glosses[slot])) push(byGloss, word, h.id);
    }

    if (h.spelling.length >= 4) {
      push(byRhyme, h.spelling.slice(-4), h.spelling);
    }
  }

  const addClosed = (
    namespace: Namespace,
    rows: readonly { id: EntryId; form: string }[],
  ): void => {
    for (const row of rows) {
      byId.set(row.id, { namespace, spelling: row.form });
      push(byForm, row.form, { namespace, entryId: row.id, spelling: row.form });
    }
  };

  addClosed('functionWord', lexicon.functionWords);
  addClosed('pronoun', lexicon.pronouns);
  addClosed('correlative', lexicon.correlatives);
  addClosed('timeWord', lexicon.timeWords);
  addClosed('discourseParticle', lexicon.discourseParticles);

  // Colour words are their own closed class: none of the 45 is a headword.
  const colorIdByBase = new Map(lexicon.colors.map((c) => [c.base, c.id]));
  for (const c of lexicon.colors) {
    byId.set(c.id, { namespace: 'color', spelling: c.base });
  }
  for (const cell of colorGrid()) {
    const entryId = colorIdByBase.get(cell.base);
    if (entryId === undefined) continue;
    push(byForm, cell.form, { namespace: 'color', entryId, spelling: cell.base });
  }

  const legacyForms = new Map(lexicon.migrationForms.map((m) => [m.from, m]));
  const reserved = new Map(lexicon.soundLedger.map((s) => [s.spelling, s]));

  const multiNamespaceSpellings = [...byForm.values()].filter(
    (refs) => new Set(refs.map((r) => r.namespace)).size > 1,
  ).length;

  return {
    byId,
    headwordBySpelling,
    byForm,
    byComponent,
    byDerivation,
    bySynonym,
    byGloss,
    byRhyme,
    legacyForms,
    reserved,
    stats: {
      headwords: lexicon.headwords.length,
      primalRoots,
      compounds,
      forms: lexicon.headwords.length * FORM_SLOTS.length,
      unusedGlossSlots,
      functionWords: lexicon.functionWords.length,
      distinctSpellings: byForm.size,
      multiNamespaceSpellings,
    },
  };
}

export interface Resolution {
  /** The entries that claim this spelling. Empty when nothing matches. */
  refs: readonly FormRef[];
  /** Set when the spelling was reached through the 1.0:G19 legacy map. */
  viaLegacy?: MigrationForm;
  /**
   * Set when the legacy target is a multi-word phrase rather than a form.
   * Five archived compounds resolve this way, so `refs` is empty by design and
   * a reader must render the phrase instead of looking up a single entry.
   */
  phrase?: string;
}

/**
 * Resolve a spelling, following the legacy map when it is a retired form.
 *
 * A live form always wins over the legacy map.
 */
export function resolveSpelling(indexes: LexiconIndexes, spelling: string): Resolution {
  const direct = indexes.byForm.get(spelling);
  if (direct !== undefined && direct.length > 0) return { refs: direct };

  const legacy = indexes.legacyForms.get(spelling);
  if (legacy === undefined) return { refs: [] };

  if (legacy.isPhrase) {
    return { refs: [], viaLegacy: legacy, phrase: legacy.to };
  }
  return { refs: indexes.byForm.get(legacy.to) ?? [], viaLegacy: legacy };
}
