/**
 * Shared loader for the golden tests.
 *
 * Imports the real 1.0 file once and memoises it, so the whole golden suite
 * pays for one parse and one index build.
 */
import { buildIndexes, type LexiconIndexes } from '@core/model/indexes';
import { importLexicon, type ImportResult } from '@core/model/importLexicon';
import type { RawLexicon } from '@core/model/raw';
import { LEXICON_FILE, readSourceJson, VALIDATION_FILE } from './sourcePaths';

export interface ValidationOracle {
  summary: {
    lexicon: string;
    version: string;
    counts: Record<string, number>;
    status_counts: Record<string, number>;
  };
  checks: { id: number; check: string; status: string; note: string }[];
}

let rawCache: RawLexicon | undefined;
let importCache: ImportResult | undefined;
let indexCache: LexiconIndexes | undefined;
let oracleCache: ValidationOracle | undefined;

export function rawLexicon(): RawLexicon {
  rawCache ??= readSourceJson(LEXICON_FILE) as RawLexicon;
  return rawCache;
}

/** A fresh parse, for tests that must not share a mutated object. */
export function freshRawLexicon(): RawLexicon {
  return readSourceJson(LEXICON_FILE) as RawLexicon;
}

export function imported(): ImportResult {
  importCache ??= importLexicon(rawLexicon());
  return importCache;
}

export function indexes(): LexiconIndexes {
  indexCache ??= buildIndexes(imported().lexicon);
  return indexCache;
}

export function oracle(): ValidationOracle {
  oracleCache ??= readSourceJson(VALIDATION_FILE) as ValidationOracle;
  return oracleCache;
}
