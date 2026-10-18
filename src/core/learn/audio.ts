/**
 * Audio: the author's recordings, from two places (TRAINING_DECISIONS D9).
 *
 * - **Files** listed in `data/audio/manifest.json`, key → path under
 *   `data/audio/`, bundled by `build:learn`.
 * - **Recordings** attached in Learn's Author view, kept in IndexedDB.
 *
 * A key is a word's id or a sentence's key, the same keys the in-app
 * recordings use. An audio button appears only when one of the two has the
 * key. Pronunciation is never synthesised: a recording or nothing.
 *
 * Pure: the build checks that each listed file exists; this module only reads
 * the manifest's shape against the data and counts coverage.
 */
import type { EntryId } from '../model/types';
import type { LearnData, LearnItem } from './types';

/** Where manifest paths are resolved from, relative to the repository root. */
export const AUDIO_DIR = 'data/audio';

export interface ManifestCheck {
  /** key → path under `data/audio/`, for every entry that is well formed. */
  files: Record<string, string>;
  /** Keys that name no word or sentence in this edition. */
  unknownKeys: string[];
  /** Keys whose path is empty, absolute, or climbs out of `data/audio/`. */
  badPaths: string[];
}

/** A path that stays inside the audio folder: relative, forward slashes, no `..`. */
function safePath(path: string): boolean {
  return (
    path.length > 0 &&
    !path.startsWith('/') &&
    !/^[a-z]+:/i.test(path) &&
    !path.includes('\\') &&
    !path.split('/').includes('..')
  );
}

/** Read a manifest's `files` against the data. A malformed manifest reads as empty. */
export function readAudioManifest(raw: unknown, data: LearnData): ManifestCheck {
  const out: ManifestCheck = { files: {}, unknownKeys: [], badPaths: [] };
  const files =
    raw !== null && typeof raw === 'object' ? (raw as { files?: unknown }).files : undefined;
  if (files === null || typeof files !== 'object') return out;
  const sentences = new Set(data.examples.map((e) => e.key));
  for (const [key, path] of Object.entries(files as Record<string, unknown>)) {
    if (!data.items.has(key) && !sentences.has(key)) {
      out.unknownKeys.push(key);
      continue;
    }
    if (typeof path !== 'string' || !safePath(path)) {
      out.badPaths.push(key);
      continue;
    }
    out.files[key] = path;
  }
  return out;
}

export interface CoverageCount {
  have: number;
  total: number;
}

export interface AudioCoverage {
  roots: CoverageCount;
  compounds: CoverageCount;
  sentences: CoverageCount;
  /** Headwords with no recording, the most used first: the next to record. */
  missing: EntryId[];
}

/** How many words and sentences have a recording, and which words still need one. */
export function audioCoverage(data: LearnData, have: ReadonlySet<string>): AudioCoverage {
  const headwords = [...data.items.values()].filter(
    (i) => i.kind === 'root' || i.kind === 'compound',
  );
  const count = (items: readonly LearnItem[]): CoverageCount => ({
    have: items.filter((i) => have.has(i.id)).length,
    total: items.length,
  });
  const use = (i: LearnItem): number => {
    const f = data.frequency.get(i.id);
    return (f?.corpus ?? 0) + (f?.examples ?? 0) + i.usedIn.length;
  };
  const missing = headwords
    .filter((i) => !have.has(i.id))
    .sort(
      (a, b) =>
        Number(b.kind === 'root') - Number(a.kind === 'root') ||
        use(b) - use(a) ||
        a.spelling.localeCompare(b.spelling),
    )
    .map((i) => i.id);
  return {
    roots: count(headwords.filter((i) => i.kind === 'root')),
    compounds: count(headwords.filter((i) => i.kind === 'compound')),
    sentences: {
      have: data.examples.filter((e) => have.has(e.key)).length,
      total: data.examples.length,
    },
    missing,
  };
}
