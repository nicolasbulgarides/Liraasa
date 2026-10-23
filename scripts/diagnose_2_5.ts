/**
 * CLI: measure the 2.3 tools against the 2.5 grammar, and the 2.5 tools
 * beside them (README 2a). Writes the numbers and every case into
 * review/translator_diagnosis_2_5.data.json, which the diagnosis cites.
 *
 *   npx tsx scripts/diagnose_2_5.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createChecker } from '../src/core/grammar';
import { createTranslator } from '../src/core/translate';
import { loadChecker } from '../tests/checker/loadChecker';
import { loadComposer } from '../tests/golden/editorComposer';
import { loadGrammarSource, loadTranslateSource } from './grammar_source';

interface Ex {
  liraasa: string;
  english?: string;
  why?: string;
}
const patch = JSON.parse(readFileSync('data/proposals/liraasa_2_5_patch.json', 'utf8')) as {
  decisions: {
    ruling_id: string | null;
    examples_grammatical?: Ex[];
    examples_ungrammatical?: Ex[];
  }[];
};
const album = JSON.parse(readFileSync('data/corpus/album_2_0/album_current.json', 'utf8')) as {
  songs: { track: string; lines: { n: number; recorded: string; current: string | null }[] }[];
};

const old = loadChecker().checker;
const composer = loadComposer();
const strict = createChecker(loadGrammarSource());
const translator = createTranslator(loadTranslateSource());

const oldSerious = (l: string) =>
  old.checkLine(l, 1).filter((d) => d.severity === 'error' || d.severity === 'warn');
const newSerious = (l: string) =>
  strict.checkLine(l).findings.filter((f) => f.severity === 'error' || f.severity === 'warn');
const norm = (x: string) =>
  x
    .toLowerCase()
    .replace(/[.!?,;]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const good = patch.decisions.flatMap((d) =>
  (d.examples_grammatical ?? []).map((e) => ({ rule: d.ruling_id ?? '', ...e })),
);
const bad = patch.decisions.flatMap((d) =>
  (d.examples_ungrammatical ?? []).map((e) => ({ rule: d.ruling_id ?? '', ...e })),
);

const goodRows = good.map((e) => ({
  rule: e.rule,
  liraasa: e.liraasa,
  old: oldSerious(e.liraasa).map((d) => `${d.rule}: ${d.message}`),
  new: newSerious(e.liraasa).map((f) => `${f.rule}: ${f.message}`),
}));
const badRows = bad.map((e) => {
  const o = old.checkLine(e.liraasa, 1).filter((d) => d.severity === 'error');
  const n = strict.checkLine(e.liraasa).findings.filter((f) => f.severity === 'error');
  return {
    rule: e.rule,
    liraasa: e.liraasa,
    why: e.why ?? '',
    old: o.map((d) => d.rule),
    oldCitesRule: o.some((d) => d.rule === e.rule),
    new: n.map((f) => f.rule),
    newCitesRule: n.some((f) => f.rule === e.rule),
  };
});
const translate = good
  .filter((e) => e.english !== undefined && /[.!?]$/.test(e.liraasa))
  .map((e) => {
    const en =
      (e.english ?? '')
        .split(' / ')[0]
        ?.replace(/\s*\(.*?\)\s*/g, ' ')
        .replace(/\s+([.!?])/g, '$1')
        .trim() ?? '';
    const d = composer.composeSentence(en);
    const oldText = composer.draftText(d);
    const oldGaps = d.clauses.flatMap((k) => k.chunks).filter((c) => c.role === 'gap').length;
    const oldPasses = newSerious(oldText).length === 0 && oldGaps === 0;
    const r = translator.translate(en)[0];
    return {
      rule: e.rule,
      english: en,
      want: e.liraasa,
      old: oldText,
      oldPasses,
      oldExact: norm(oldText) === norm(e.liraasa),
      oldFindings: newSerious(oldText).map((f) => f.rule),
      new: r?.liraasa ?? null,
      newOk: r?.ok === true,
      newExact:
        r?.liraasa !== null && r?.liraasa !== undefined && norm(r.liraasa) === norm(e.liraasa),
    };
  });
const albumRows = album.songs.flatMap((s) =>
  s.lines.map((l) => {
    const text = l.current ?? l.recorded;
    return {
      where: `${s.track}:${String(l.n)}`,
      text,
      old: oldSerious(text).map((d) => d.rule),
      new: newSerious(text).map((f) => f.rule),
    };
  }),
);
const count = <T>(xs: T[], p: (x: T) => boolean) => xs.filter(p).length;
const summary = {
  patch_good: {
    total: goodRows.length,
    old_flags: count(goodRows, (r) => r.old.length > 0),
    new_flags: count(goodRows, (r) => r.new.length > 0),
  },
  patch_bad: {
    total: badRows.length,
    old_accepts: count(badRows, (r) => r.old.length === 0),
    old_cites_rule: count(badRows, (r) => r.oldCitesRule),
    new_accepts: count(badRows, (r) => r.new.length === 0),
    new_cites_rule: count(badRows, (r) => r.newCitesRule),
  },
  translate: {
    total: translate.length,
    old_passes_2_5_checker: count(translate, (r) => r.oldPasses),
    old_exact: count(translate, (r) => r.oldExact),
    new_ok: count(translate, (r) => r.newOk),
    new_exact: count(translate, (r) => r.newExact),
  },
  album: {
    lines: albumRows.length,
    old_flags: count(albumRows, (r) => r.old.length > 0),
    new_flags: count(albumRows, (r) => r.new.length > 0),
  },
};
writeFileSync(
  'review/translator_diagnosis_2_5.data.json',
  `${JSON.stringify({ summary, patch_good: goodRows, patch_bad: badRows, translate, album: albumRows }, null, 1)}\n`,
  'utf8',
);
console.log(JSON.stringify(summary, null, 1));
