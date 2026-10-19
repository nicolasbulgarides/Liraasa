/* eslint-disable no-console -- a CLI, like scripts/: its output is the report */
/**
 * The grammar audit's integration test (Phase 5), rerunnable.
 *
 *   npx tsx tests/audit/myth.ts        # writes review/audit-myth.json
 *
 * Each sentence of tests/audit/myth.json goes through the editor's Compose
 * tab; the editor's draft and the hand translation made from the spec are both
 * run through the checker and back-translated (Liraasa → English), so a
 * divergence and any meaning lost on the way back are side by side.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { loadChecker } from '../checker/loadChecker';
import { compose } from './compose';

interface Sentence {
  en: string;
  spec: string;
  /** Other translations the spec allows equally (comma, clause order, ke or ka). */
  alts?: string[];
  cites: string[];
  gaps: string[];
}
const myth = JSON.parse(readFileSync('tests/audit/myth.json', 'utf8')) as {
  title: string;
  sentences: Sentence[];
};
const { checker } = loadChecker();
const drafts = compose(myth.sentences.map((s) => s.en));
const check = (line: string, en: string): string[] =>
  checker
    .checkLine(line, 1, en, { register: 'poetic' })
    .filter((d) => d.severity !== 'note')
    .map((d) => `${d.severity} ${d.rule}: ${d.message}`.slice(0, 200));
const norm = (s: string): string =>
  s.toLowerCase().replace(/[“”"]/g, '').replace(/\s+/g, ' ').trim();

const out = myth.sentences.map((s, i) => {
  const editor = drafts[i]?.liraasa ?? '';
  return {
    n: i + 1,
    en: s.en,
    editor,
    editor_gaps: drafts[i]?.gaps ?? [],
    spec: s.spec,
    same: [s.spec, ...(s.alts ?? [])].some((x) => norm(x) === norm(editor)),
    editor_checked: check(editor.replace(/\[[^\]]*\]/g, ''), s.en),
    spec_checked: check(s.spec, s.en),
    editor_back: checker.backTranslate(editor.replace(/\[[^\]]*\]/g, '')).text,
    spec_back: checker.backTranslate(s.spec).text,
    cites: s.cites,
    gaps: s.gaps,
  };
});
writeFileSync(
  'review/audit-myth.json',
  `${JSON.stringify({ title: myth.title, sentences: out }, null, 1)}\n`,
  'utf8',
);
console.log(
  JSON.stringify({
    sentences: out.length,
    identical: out.filter((o) => o.same).length,
    editor_with_gaps: out.filter((o) => o.editor_gaps.length > 0).length,
    spec_flagged: out.filter((o) => o.spec_checked.length > 0).length,
  }),
);
