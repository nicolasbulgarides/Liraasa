/**
 * CLI: build the Liraasa grammar guide from the handoff lexicon.
 *
 *   npm run build:guide            # rebuild the handoff JSON, then the guide
 *   npm run build:guide -- --pdf   # also print it to PDF with Edge or Chrome
 *
 * Writes handoff/<name>.html (and .pdf). Every table, count, ruling and
 * example is read from handoff/liraasa_1_2_complete.json; the teaching prose
 * lives in scripts/grammar_guide/chapters.ts; which words get a full
 * breakdown is set in scripts/grammar_guide/config.ts.
 *
 * Before writing, every piece of Liraasa on the page is checked against the
 * lexicon. A word that is not canon, or a form whose slot is unused shown as
 * if it meant something, fails the build (CLAUDE.md: never invent a word).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  appendices,
  clausePart,
  openQuestionsPart,
  parsingPart,
  recipesPart,
  rulingsPart,
  smallWordsPart,
  soundPart,
  welcome,
  wordsPart,
} from './grammar_guide/chapters';
import { GUIDE } from './grammar_guide/config';
import { coreWordsPart } from './grammar_guide/core_words';
import { changelogPart, newWordsPart } from './grammar_guide/new_in_1_2';
import { corner, divider, emblem, melody, rosette, starfield } from './grammar_guide/cover';
import { Index, loadIdIndex, loadLexicon, tokenize } from './grammar_guide/data';
import { esc, lir, recorded, tocEntries, type TocEntry } from './grammar_guide/html';
import { CSS } from './grammar_guide/style';
import { parseArgs } from './args';

const MORPHEME = /^[-+]|[-+]$|\+|^R\b|^VERB$/;

/** Every recorded Liraasa string must be canon. Returns the problems found. */
function checkWords(index: Index): string[] {
  const problems = new Set<string>();
  for (const { text, use } of recorded) {
    if (use === 'morpheme') {
      if (!MORPHEME.test(text) && !index.isWord(text.toLowerCase())) {
        problems.add(`morpheme "${text}" is neither a bound form nor a word`);
      }
      continue;
    }
    for (const token of tokenize(text)) {
      if (use === 'retired') continue;
      if (!index.isWord(token)) problems.add(`"${token}" (in "${text}") is not a word of Liraasa`);
      if (use === 'text' && index.unusedReadings(token).length > 0) {
        problems.add(`"${token}" is an unused slot shown as live text`);
      }
    }
  }
  return [...problems];
}

function tocHtml(toc: readonly TocEntry[]): string {
  const items = toc
    .map((t) => `<li class="l${String(t.level)}"><a href="#${t.id}">${esc(t.title)}</a></li>`)
    .join('');
  return `<nav class="toc" aria-labelledby="toc-h"><h2 id="toc-h">Contents</h2><ol>${items}</ol></nav>`;
}

function findBrowser(): string | undefined {
  const candidates = [
    process.env.GUIDE_BROWSER,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  return candidates.find((c): c is string => c !== undefined && existsSync(c));
}

function main(): void {
  const args = parseArgs(process.argv.slice(2), ['lexicon', 'out']);
  const lexPath = args.flags.lexicon ?? GUIDE.lexicon;
  const lex = loadLexicon(lexPath);
  const index = new Index(lex);
  const ids = loadIdIndex(GUIDE.ids);

  const body = [
    welcome(index),
    soundPart(index),
    wordsPart(index),
    coreWordsPart(index, ids),
    newWordsPart(index),
    smallWordsPart(index),
    clausePart(index),
    recipesPart(),
    rulingsPart(index),
    parsingPart(),
    openQuestionsPart(),
    changelogPart(index),
    appendices(index),
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
<p class="motif">${GUIDE.coverMotif.map(([w]) => lir(w)).join('<span class="sep" aria-hidden="true"> · </span>')}<span class="motif-en">${GUIDE.coverMotif.map(([, e]) => esc(e)).join(' · ')}</span></p>
<p class="eyebrow">The grammar of</p>
<h1>${lir('Liraasa')}<span class="visually-hidden"> </span>${esc(lex.version)} Grammar Guide</h1>
<p class="sub">${esc(GUIDE.subtitle)}</p>
${divider()}
${melody()}
<p class="meta">Liraasa ${esc(lex.version)}: all of 1.0, the 1.1 vocabulary supplement, and the 1.2 rulings and new words<br>
Lexicon built ${esc(built)} · ${String(lex.headwords.length)} headwords · generated by the Liraasa Workbench</p>
</div>
</header>
${tocHtml(toc)}
${body}
<footer class="colophon">
<p>Generated by <code>npm run build:guide</code> from <code>${esc(lexPath)}</code>. Every Liraasa word on these pages was checked against the lexicon at build time; where this guide and the lexicon disagree, the lexicon wins.</p>
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
  console.log(
    `  ${String(toc.length)} contents entries, ${String(recorded.length)} Liraasa strings checked`,
  );

  if (args.booleans.has('pdf')) {
    const browser = findBrowser();
    if (browser === undefined) {
      console.error('--pdf: no Edge or Chrome found; set GUIDE_BROWSER to its path');
      process.exit(1);
    }
    const pdfPath = resolve(outDir, `${GUIDE.outName}.pdf`);
    execFileSync(
      browser,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-pdf-header-footer',
        `--print-to-pdf=${pdfPath}`,
        pathToFileURL(htmlPath).href,
      ],
      { stdio: 'ignore' },
    );
    console.log(`wrote ${pdfPath}`);
  }
}

main();
