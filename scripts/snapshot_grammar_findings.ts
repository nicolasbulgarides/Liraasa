/**
 * CLI: pin the strict checker's findings on canon and the album into
 * tests/grammar/fixtures/known_findings_2_5.json. Run after a grammar change,
 * then read the diff: every new line is a finding for the author.
 *
 *   npx tsx scripts/snapshot_grammar_findings.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createChecker } from '../src/core/grammar';
import { loadGrammarSource } from './grammar_source';
const ck = createChecker(loadGrammarSource());
interface Ref {
  examples: { sentences: [string, string][] };
  recipes: { liraasa: string }[];
  rulings: { id: string; status?: string; examples?: { liraasa: string }[] }[];
  album: { tracks: { track: string; lines: { liraasa: string; current?: string }[] }[] };
}
const ref = JSON.parse(readFileSync('handoff/liraasa_2_5_llm.json', 'utf8')) as Ref;
const serious = (l: string) =>
  ck
    .checkLine(l)
    .findings.filter((f) => f.severity === 'error' || f.severity === 'warn')
    .map((f) => `${f.severity} ${f.rule}`);
const canon: Record<string, string[]> = {};
const add = (where: string, l: string) => {
  const f = serious(l);
  if (f.length) canon[`${where}: ${l}`] = [...new Set(f)].sort();
};
for (const [l] of ref.examples.sentences) add('examples.sentences', l);
for (const r of ref.recipes) add('recipes', r.liraasa);
for (const r of ref.rulings)
  if (!String(r.status ?? '').includes('SUPERSEDED by'))
    for (const e of r.examples ?? []) add(`rulings[${r.id}]`, e.liraasa);
const album: Record<string, string[]> = {};
for (const t of ref.album.tracks)
  for (const [i, l] of t.lines.entries()) {
    const text = l.current ?? l.liraasa;
    const f = serious(text);
    if (f.length) album[`${t.track}:${String(i + 1)} ${text}`] = [...new Set(f)].sort();
  }
writeFileSync(
  'tests/grammar/fixtures/known_findings_2_5.json',
  JSON.stringify(
    {
      about:
        'Canon (canonical sentences, recipes, living ruling examples) that the 2.5 strict checker rejects or warns on: findings for the author (review/stored_writings_2_5.md), pinned so a change is noticed. Not exemptions: each stays failing until the grammar or the text changes.',
      canon,
      album,
    },
    null,
    1,
  ) + '\n',
);
console.log(Object.keys(canon).length, 'canon', Object.keys(album).length, 'album');
