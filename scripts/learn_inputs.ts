/**
 * The learning module's inputs from disk: the current lexicon, the validated
 * corpus, the attested names and the author's overrides. The browser gets the
 * same inputs from the editor's data bundle; this is the Node side, for the
 * report and the tests.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseOverrides, type CorpusFile, type LearnInput } from '../src/core/learn';
import type { RawLexicon } from '../src/core/model/raw';

export const LEARN_LEXICON = 'data/lexicon/liraasa_2_2.json';
export const LEARN_OVERRIDES = 'data/lessons/overrides.json';
export const CORPUS_DIRS = ['data/corpus/songs_2_2', 'data/corpus/bumrepago_2_2'];
const NAMES = 'data/checker/names.json';
const ENGLISH = 'data/checker/english.json';

/** `song_I_vorbalira.txt` → `Song I vorbalira`; the file's first comment wins if it has a title. */
function titleOf(file: string): string {
  return basename(file, '.txt')
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

export function readCorpusFiles(dirs: readonly string[] = CORPUS_DIRS): CorpusFile[] {
  return dirs.flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => f.endsWith('.txt'))
      .sort()
      .map((f) => {
        const source = join(dir, f).replace(/\\/g, '/');
        return {
          id: 'text:' + basename(f, '.txt'),
          title: titleOf(f),
          source,
          text: readFileSync(source, 'utf8'),
        };
      }),
  );
}

export function loadLearnInput(lexiconPath = LEARN_LEXICON): LearnInput {
  const lexicon = JSON.parse(readFileSync(lexiconPath, 'utf8')) as RawLexicon;
  const names = (JSON.parse(readFileSync(NAMES, 'utf8')) as { names: string[] }).names;
  const overrides = parseOverrides(
    existsSync(LEARN_OVERRIDES) ? JSON.parse(readFileSync(LEARN_OVERRIDES, 'utf8')) : undefined,
  );
  // the subject forms (I, you, she…) from the checker's marker table
  const english = JSON.parse(readFileSync(ENGLISH, 'utf8')) as { markers?: Record<string, string> };
  const pronouns = new Set(lexicon.pronouns.map((p) => p.form));
  const pronounEnglish = Object.fromEntries(
    Object.entries(english.markers ?? {}).filter(([k]) => pronouns.has(k)),
  );
  return { lexicon, corpus: readCorpusFiles(), names, overrides, pronounEnglish };
}
