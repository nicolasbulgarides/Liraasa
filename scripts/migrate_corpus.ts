/**
 * CLI: carry the validated corpus into the current edition's spelling
 * (ADR-0017, ADR-0018).
 *
 *   npx tsx scripts/migrate_corpus.ts
 *
 * As data/source/migrate_text.py carried the songs into 1.0, this rewrites
 * the 1.0 corpora (data/corpus/songs_1_0, bumrepago_1_0) with the
 * respellings since 2.0 only: the forms of the roots a 2.1 or later op
 * respells, as legacy.migration_forms records them (a respelling undone, as
 * silro in 2.2, leaves no row), through the same `correctText` the
 * lexicon's own sentences go through (a -ri / -ti ending and a capital kept).
 * Comment lines (English, notes) are copied as they are. File names are kept,
 * so a learner's progress on a text, keyed by its name, carries over.
 * The originals are only read; the report lists every substitution.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { LexiconChangeset } from '../src/core/change/apply';
import { correctText } from '../src/core/change/respell';
import type { RawLexicon } from '../src/core/model/raw';
import { CHANGESETS_2_1 } from './changesets_2_1';
import { CHANGESETS_2_2 } from './changesets_2_2';

const LEXICON = 'data/lexicon/liraasa_2_2.json';
const DIRS: [string, string][] = [
  ['data/corpus/songs_1_0', 'data/corpus/songs_2_2'],
  ['data/corpus/bumrepago_1_0', 'data/corpus/bumrepago_2_2'],
];
const REPORT = 'data/corpus/corpus_migration_2_2.json';

const lex = JSON.parse(readFileSync(LEXICON, 'utf8')) as RawLexicon;
const respelled = new Set(
  [...CHANGESETS_2_1, ...CHANGESETS_2_2]
    .flatMap((p) => (JSON.parse(readFileSync(p, 'utf8')) as LexiconChangeset).ops)
    .filter((o) => o.op === 'respell_root' || o.op === 'respell_as_compound')
    .map((o) => o.from ?? ''),
);
const mapping = Object.fromEntries(
  Object.entries(lex.legacy.migration_forms)
    .filter(([, m]) => respelled.has(m.via))
    .map(([old, m]) => [old, m.to]),
);

const report: { file: string; line: number; from: string; to: string }[] = [];
for (const [from, to] of DIRS) {
  mkdirSync(to, { recursive: true });
  for (const f of readdirSync(from)
    .filter((x) => x.endsWith('.txt'))
    .sort()) {
    const lines = readFileSync(join(from, f), 'utf8').split('\n');
    const out = lines.map((line, i) => {
      if (line.trimStart().startsWith('#')) return line;
      const r = correctText(line, mapping);
      if (r.changed > 0)
        report.push({ file: `${basename(to)}/${f}`, line: i + 1, from: line, to: r.text });
      return r.text;
    });
    writeFileSync(join(to, f), out.join('\n'), 'utf8');
  }
}
writeFileSync(
  REPORT,
  `${JSON.stringify({ report: `Corpus carried into Liraasa ${lex.version} spelling`, lexicon: LEXICON, lines_changed: report.length, changes: report }, null, 1)}\n`,
  'utf8',
);
console.log(`${String(report.length)} lines respelled; wrote ${REPORT}`);
