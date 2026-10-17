/**
 * Corpus files (data/corpus, data/corpus/README.md): Liraasa lines
 * unprefixed, English on `# EN:` comment lines beneath the line they
 * translate, other `#` lines ignored. The editor's stored writings arrive in
 * the same shape through `writingToCorpusFile`.
 *
 * Some `# EN:` lines are Liraasa that the PDF extraction mislabelled (the
 * songs' refrains). A block whose words nearly all link to the lexicon is read
 * as Liraasa and reported, never silently trusted as a translation.
 */
import { linkLine, linkedShare, type LinkContext } from './link';
import type { CorpusFile, CorpusLine, CorpusText, Gap } from './types';

const EN = /^#\s*EN:\s?(.*)$/;

/** A block of `# EN:` lines this Liraasa-like is Liraasa, not English. */
export const MISLABELLED_SHARE = 0.75;

/**
 * A text whose lines are mostly followed by English is translated line by
 * line (Bumrepago). Below this share the English is stanza notes and
 * headings (the songs), which must not be paired with single lines.
 */
export const LINE_ALIGNED_SHARE = 0.6;

export function readCorpus(ctx: LinkContext, file: CorpusFile): { text: CorpusText; gaps: Gap[] } {
  const lines: CorpusLine[] = [];
  let mislabelled = 0;
  let english: string[] = [];
  const flushEnglish = (): void => {
    if (english.length === 0) return;
    const joined = english.join(' ').replace(/\s+/g, ' ').trim();
    english = [];
    const tokens = linkLine(ctx, joined);
    if (tokens.length >= 2 && linkedShare(tokens) >= MISLABELLED_SHARE) {
      mislabelled += 1;
      lines.push({ n: lines.length + 1, liraasa: joined, english: null, tokens });
      return;
    }
    // English before the first Liraasa line is a heading, not a translation
    const last = lines[lines.length - 1];
    if (last !== undefined && last.english === null) {
      lines[lines.length - 1] = { ...last, english: joined };
    }
  };

  for (const raw of file.text.split(/\r?\n/)) {
    const line = raw.trim();
    const en = EN.exec(line);
    if (en !== null) {
      english.push(en[1] ?? '');
      continue;
    }
    if (line === '' || line.startsWith('#')) {
      flushEnglish();
      continue;
    }
    flushEnglish();
    lines.push({ n: lines.length + 1, liraasa: line, english: null, tokens: linkLine(ctx, line) });
  }
  flushEnglish();

  const gaps: Gap[] = [];
  const translated = lines.filter((l) => l.english !== null).length;
  if (lines.length > 0 && translated / lines.length < LINE_ALIGNED_SHARE) {
    for (const [i, l] of lines.entries()) lines[i] = { ...l, english: null };
    if (translated > 0) {
      gaps.push({
        severity: 'note',
        code: 'corpus-english-not-line-aligned',
        ref: file.id,
        message: `${String(translated)} of ${String(lines.length)} lines in ${file.source} are followed by English, too few to be a line-by-line translation: the English is read as stanza notes and not paired with lines.`,
      });
    }
  }
  if (mislabelled > 0) {
    gaps.push({
      severity: 'warn',
      code: 'corpus-mislabelled-english',
      ref: file.id,
      message: `${String(mislabelled)} "# EN:" block(s) in ${file.source} read as Liraasa, not English: probably lines mislabelled in extraction. They are taught as Liraasa lines with no translation.`,
    });
  }
  const untranslated = lines.filter((l) => l.english === null).length;
  if (untranslated > 0) {
    gaps.push({
      severity: 'note',
      code: 'corpus-no-english',
      ref: file.id,
      message: `${String(untranslated)} of ${String(lines.length)} lines in ${file.source} have no English, so comprehension questions cannot be drawn from them.`,
    });
  }
  return { text: { id: file.id, title: file.title, source: file.source, lines }, gaps };
}

/** A stored writing from the editor, as a corpus file (English is line-aligned). */
export function writingToCorpusFile(writing: {
  id: string;
  title: string;
  text: string;
  englishLines?: readonly string[];
}): CorpusFile {
  const english = writing.englishLines ?? [];
  const text = writing.text
    .split(/\r?\n/)
    .map((line, i) => {
      const en = english[i]?.trim();
      return line.trim() === '' ? '' : line + (en ? '\n# EN: ' + en : '');
    })
    .join('\n');
  return { id: 'writing:' + writing.id, title: writing.title, source: 'songbook', text };
}
