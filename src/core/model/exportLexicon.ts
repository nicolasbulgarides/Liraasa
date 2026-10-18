/**
 * Export: the internal model back to the author's JSON.
 *
 * Starts from the source object and writes back only what changed (ADR-0002).
 * Unknown fields, per-entry key order, the `≤` in `since` and the em dash in
 * `"— (unused)"` all survive because nothing is rebuilt from scratch.
 *
 * `id` placement depends on the edition (Q3): the released 1.0 keeps ids in
 * the sidecar and exports byte-identically; 1.1 onwards writes `id` inline.
 */
import { encodeRecord, type SectionMap } from './fieldMap';
import { idStorageFor } from './ids';
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
import { TOP_LEVEL_KEY_ORDER, type RawLexicon } from './raw';
import { RAW, type Lexicon } from './types';

export interface ExportOptions {
  /**
   * Which edition is being written. Decides whether `id` goes inline.
   * Defaults to the lexicon's own version.
   */
  edition?: string;
}

function encodeSection<Raw extends object, Internal extends object>(
  map: SectionMap<Raw, Internal>,
  records: readonly Internal[],
  inlineIds: boolean,
): Record<string, unknown>[] {
  return records.map((record) => {
    const raw = (record as unknown as { [RAW]: Raw })[RAW];
    const out = encodeRecord(map, record, raw);
    if (inlineIds) {
      const id = (record as unknown as Record<string, unknown>).id;
      if (typeof id === 'string') out.id = id;
    }
    return out;
  });
}

/**
 * Rebuild the top-level object in the author's key order.
 *
 * Keys the app does not model are copied through from the source, so a section
 * added by a future edition survives untouched.
 */
export function exportLexicon(lexicon: Lexicon, options: ExportOptions = {}): RawLexicon {
  const source = lexicon[RAW];
  const edition = options.edition ?? lexicon.version;
  const inlineIds = idStorageFor(edition) === 'inline';

  const replaced: Record<string, unknown> = {
    headwords: encodeSection(headwordMap, lexicon.headwords, inlineIds),
    function_words: encodeSection(functionWordMap, lexicon.functionWords, inlineIds),
    pronouns: encodeSection(pronounMap, lexicon.pronouns, inlineIds),
    correlatives: encodeSection(correlativeMap, lexicon.correlatives, inlineIds),
    time_and_dates: encodeSection(timeWordMap, lexicon.timeWords, inlineIds),
    colors: encodeSection(colorMap, lexicon.colors, inlineIds),
    discourse_particles: encodeSection(discourseParticleMap, lexicon.discourseParticles, inlineIds),
    // Examples carry no id: they have no identity apart from their text.
    examples: encodeSection(exampleMap, lexicon.examples, false),
    language: lexicon.language,
    version: lexicon.version,
    built_utc: lexicon.builtUtc,
    source: lexicon.source,
  };

  const out: Record<string, unknown> = {};

  // The source's own key order, so every edition round-trips (1.0's is
  // TOP_LEVEL_KEY_ORDER; later editions insert sections of their own).
  for (const key of Object.keys(source)) {
    out[key] = key in replaced ? replaced[key] : (source as Record<string, unknown>)[key];
  }
  // A known key the source lacks, in the author's order.
  for (const key of TOP_LEVEL_KEY_ORDER) {
    if (!(key in out) && key in replaced) out[key] = replaced[key];
  }

  return out as unknown as RawLexicon;
}

/**
 * Serialise exactly as the author's build does:
 * `json.dump(..., ensure_ascii=False, indent=1)`.
 *
 * Deterministic, so a git diff shows only real changes (SPEC §11). Note that
 * `json.dump` writes **no trailing newline**, and neither does this: a
 * released edition must round-trip byte for byte, and one stray byte would
 * break that.
 */
export function serializeLexicon(raw: RawLexicon): string {
  return JSON.stringify(raw, null, 1);
}
