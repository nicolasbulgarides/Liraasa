/**
 * CLI: build the Liraasa Reference Grammar from the handoff lexicon.
 *
 *   npm run build:guide            # rebuild the handoff JSON, then the guide
 *   npm run build:guide -- --pdf   # also print it to PDF with Edge or Chrome
 *
 * Then builds the Invitation (scripts/build_invitation.ts) with the same flags.
 *
 * Writes handoff/<name>.html (and .pdf). Every table, count, ruling and
 * example is read from handoff/liraasa_3_1_complete.json; the teaching prose
 * lives in scripts/grammar_guide/chapters.ts; the song, the treasury words
 * and the image-compound samples are set in scripts/grammar_guide/config.ts.
 *
 * Before writing, every piece of Liraasa on the page is checked against the
 * lexicon. A word that is not canon, or a form whose slot is unused shown as
 * if it meant something, fails the build (CLAUDE.md: never invent a word).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  appendices,
  clausePart,
  openQuestionsPart,
  recipesPart,
  smallWordsPart,
  soundPart,
  welcome,
  wordsPart,
} from './grammar_guide/chapters';
import { checkWords, pdfPages, printPdf, reviewMarkdown } from './grammar_guide/check';
import { GUIDE } from './grammar_guide/config';
import { albumPart } from './grammar_guide/album';
import { songPart } from './grammar_guide/song';
import { treasuryPart } from './grammar_guide/treasury';
import { rulingIndex, rulingsMarkdown, type RenderedPart } from './grammar_guide/rulings';
import { corner, divider, emblem, melody, rosette, starfield } from './grammar_guide/cover';
import { Index, loadLexicon, tokenize } from './grammar_guide/data';
import { esc, lir, recorded, tocEntries, type TocEntry } from './grammar_guide/html';
import { CSS } from './grammar_guide/style';
import { parseArgs } from './args';

function tocHtml(toc: readonly TocEntry[]): string {
  const items = toc
    .map((t) => `<li class="l${String(t.level)}"><a href="#${t.id}">${esc(t.title)}</a></li>`)
    .join('');
  return `<nav class="toc" aria-labelledby="toc-h"><h2 id="toc-h">Contents</h2><ol>${items}</ol></nav>`;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2), ['lexicon', 'out']);
  const lexPath = args.flags.lexicon ?? GUIDE.lexicon;
  const lex = loadLexicon(lexPath);
  const index = new Index(lex);

  const editions = lex as unknown as {
    counts_1_1_to_1_2?: { before: { headwords: number }; after: { headwords: number } };
    counts_1_2_to_2_0?: { after: { headwords: number }; imageCompoundsAttested: number };
    counts_2_0_to_2_1?: { after: { headwords: number } };
    changesets_2_1_full?: { ops: { op: string }[] }[];
    changesets_2_2_full?: { summary: string; ops: { op: string }[] }[];
    counts_2_2_to_2_3?: { before: { headwords: number } };
  };
  const ops21 = (editions.changesets_2_1_full ?? []).flatMap((c) => c.ops);
  const ops22 = (editions.changesets_2_2_full ?? []).flatMap((c) => c.ops);
  const v10 = (
    JSON.parse(readFileSync(resolve(GUIDE.lexicon10), 'utf8')) as { headwords: unknown[] }
  ).headwords.length;

  const parts = [
    welcome(index),
    soundPart(index),
    wordsPart(index),
    smallWordsPart(index),
    clausePart(index),
    recipesPart(index),
    songPart(index, '7'),
    albumPart(index, '8'),
    treasuryPart(index, '9'),
    openQuestionsPart('10'),
  ];
  // every Liraasa word and phrase shown so far: Appendix A lists only the function words not among them
  const shownTexts = recorded.filter((r) => r.use !== 'morpheme').map((r) => r.text.toLowerCase());
  const shownTokens = new Set(shownTexts.flatMap((t) => tokenize(t)));
  const isShown = (form: string): boolean =>
    form.includes(' ') ? shownTexts.some((t) => t.includes(form)) : shownTokens.has(form);
  const rendered: RenderedPart[] = parts.map((html) => ({
    title: /data-toc="([^"]*)"/.exec(html)?.[1] ?? '',
    html,
  }));
  const rulingsFile = `${GUIDE.outName.replace('Reference_Grammar', 'Rulings')}.md`;
  const body = [
    ...parts,
    appendices(
      index,
      isShown,
      {
        v10,
        v11: editions.counts_1_1_to_1_2?.before.headwords ?? 0,
        v12: editions.counts_1_1_to_1_2?.after.headwords ?? 0,
        v20: editions.counts_1_2_to_2_0?.after.headwords ?? 0,
        attested: editions.counts_1_2_to_2_0?.imageCompoundsAttested ?? 0,
        v21: editions.counts_2_0_to_2_1?.after.headwords ?? lex.headwords.length,
        respelled: ops21.filter((o) => o.op === 'respell_root' || o.op === 'respell_as_compound')
          .length,
        becameCompounds: ops21.filter((o) => o.op === 'respell_as_compound').length,
        note22: (editions.changesets_2_2_full ?? []).map((c) => c.summary).join(' '),
        filled22: ops22.filter((o) => o.op === 'activate_slot').length,
        v22: editions.counts_2_2_to_2_3?.before.headwords ?? lex.headwords.length,
      },
      rulingIndex(lex, rendered, rulingsFile),
    ),
  ].join('\n');
  const toc = tocEntries(body);

  const problems = checkWords(index);
  if (problems.length > 0) {
    console.error(`The guide uses ${String(problems.length)} word(s) that are not canon:`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }

  const built = lex.built_utc.slice(0, 10);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(GUIDE.title)}</title>
<meta name="description" content="The grammar of Liraasa ${esc(lex.version)}, generated from the canonical lexicon.">
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#content">Skip to contents</a>
<main id="content">
<header class="cover">
${starfield()}${rosette()}${corner('tl')}${corner('tr')}${corner('bl')}${corner('br')}
<div class="cover-inner">
${emblem()}
<p class="motif">${GUIDE.coverMotif.map(([id]) => lir(index.byId.get(id)?.root ?? id)).join('<span class="sep" aria-hidden="true"> · </span>')}<span class="motif-en">${GUIDE.coverMotif.map(([, e]) => esc(e)).join(' · ')}</span></p>
<p class="eyebrow">The grammar of</p>
<h1>${lir('Liraasa')}<span class="visually-hidden"> </span>${esc(lex.version)} Reference Grammar</h1>
<p class="sub">${esc(GUIDE.subtitle)}</p>
${divider()}
${melody()}
<p class="meta">Liraasa ${esc(lex.version)} · ${esc(built)}</p>
</div>
</header>
${tocHtml(toc)}
${body}
<footer class="colophon">
<p>Generated by the Liraasa Workbench on ${esc(built)}. Every Liraasa word on these pages was checked against the lexicon; where they disagree, the lexicon wins.</p>
</footer>
</main>
</body>
</html>
`;

  const outDir = resolve(args.flags.out ?? GUIDE.outDir);
  mkdirSync(outDir, { recursive: true });
  const htmlPath = resolve(outDir, `${GUIDE.outName}.html`);
  writeFileSync(htmlPath, html, 'utf8');
  console.log(`wrote ${htmlPath}`);
  // each old spelling with what it reads as today: the migration table follows later
  // respellings (barni → kupa in 2.1, → ruko in 2.3), where a legacy row names its own edition's
  const today = (old: string, then: string): string => lex.legacy.migration_forms[old]?.to ?? then;
  const legacy = [
    ...lex.legacy.retired_roots.map((r) => ({ ...r, replacement: today(r.old, r.replacement) })),
    ...lex.legacy.respelled_roots.map((r) => ({
      old: r.old,
      replacement:
        r.reverted === true
          ? `${r.new} (respelling undone: ${r.old} is the word again)`
          : today(r.old, r.new),
    })),
  ];
  writeFileSync(resolve(outDir, rulingsFile), rulingsMarkdown(lex, GUIDE.title, legacy), 'utf8');
  console.log(`wrote ${resolve(outDir, rulingsFile)}`);
  const reviewPath = resolve('review', `${GUIDE.outName}_review.md`);
  writeFileSync(reviewPath, reviewMarkdown(GUIDE.title), 'utf8');
  console.log(`wrote ${reviewPath}`);
  console.log(
    `  ${String(toc.length)} contents entries, ${String(recorded.length)} Liraasa strings checked`,
  );

  if (args.booleans.has('pdf')) {
    const pdfPath = resolve(outDir, `${GUIDE.outName}.pdf`);
    printPdf(htmlPath, pdfPath);
    console.log(`wrote ${pdfPath} (${String(pdfPages(pdfPath))} pages)`);
  }

  // The Invitation is built from the same lexicon, in its own process: each
  // document's word check reads only the words that document recorded.
  execFileSync(
    process.execPath,
    [...process.execArgv, resolve('scripts/build_invitation.ts'), ...process.argv.slice(2)],
    {
      stdio: 'inherit',
    },
  );
}

main();
