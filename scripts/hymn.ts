/**
 * The Song of the First Stars, the author's creation hymn: a canon corpus text
 * (data/corpus/hymn/song_of_the_first_stars.json, ADR-0022). One source, read
 * by Learn's corpus, the editor's bundle and the LLM reference; the grammar
 * test (tests/grammar/hymn.test.ts) holds every line to the strict checker.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CorpusFile } from '../src/core/learn';

export const HYMN_FILE = 'data/corpus/hymn/song_of_the_first_stars.json';

export interface HymnLine {
  n: number;
  liraasa: string;
  english: string;
  /** Where the line comes from: the 2.5 translation, or the 3.0 patch. */
  source: string;
}

export interface Hymn {
  title: string;
  title_liraasa: string;
  edition: string;
  register: string;
  kind: string;
  status: string;
  about: string;
  lines: HymnLine[];
}

export const loadHymn = (path = HYMN_FILE): Hymn =>
  JSON.parse(readFileSync(resolve(path), 'utf8')) as Hymn;

/** The hymn as a corpus text, in the corpus files' shape: Liraasa lines, English on `# EN:` lines. */
export function hymnCorpusFile(hymn: Hymn = loadHymn()): CorpusFile {
  const text = [
    `# ${hymn.title} (${hymn.title_liraasa}): canon, ${hymn.register} register.`,
    ...hymn.lines.flatMap((l) => [`# EN: ${l.english}`, l.liraasa]),
  ].join('\n');
  return {
    id: 'text:song_of_the_first_stars',
    title: hymn.title,
    source: HYMN_FILE,
    text: `${text}\n`,
  };
}
