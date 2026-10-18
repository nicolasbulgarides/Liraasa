/**
 * CLI: build *Liraasa: An Invitation*, the short introduction, from the same
 * handoff lexicon as the Reference Grammar.
 *
 *   npm run build:invitation            # HTML only
 *   npm run build:invitation -- --pdf   # also print it to PDF
 *
 * Writes handoff/Liraasa_Invitation.html (and .pdf), and the sentences and
 * decisions waiting for the author to review/Liraasa_Invitation_review.md.
 *
 * Two checks run before anything is written: every Liraasa word on the page
 * must be canon (as for the Reference), and the page must use none of the
 * grammar terms or ruling ids the Invitation leaves to the Reference.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from './args';
import { checkWords, pdfPages, printPdf, reviewMarkdown } from './grammar_guide/check';
import { GUIDE, INVITATION } from './grammar_guide/config';
import { emblem } from './grammar_guide/cover';
import { Index, loadLexicon } from './grammar_guide/data';
import { esc, recorded } from './grammar_guide/html';
import { JARGON, invitationBody } from './grammar_guide/invitation';
import { CSS, INVITATION_CSS } from './grammar_guide/style';

/** The text a reader sees: no tags, no stylesheet, entities decoded. */
function visibleText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function main(): void {
  const args = parseArgs(process.argv.slice(2), ['lexicon', 'out']);
  const lex = loadLexicon(args.flags.lexicon ?? GUIDE.lexicon);
  const index = new Index(lex);

  const body = invitationBody(index, emblem());
  const problems = checkWords(index);
  if (problems.length > 0) {
    console.error(`The Invitation uses ${String(problems.length)} word(s) that are not canon:`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  const text = visibleText(body);
  const jargon = JARGON.flatMap((re) => {
    const m = re.exec(text);
    return m === null
      ? []
      : [`“${m[0]}” near “${text.slice(Math.max(0, m.index - 40), m.index + 40).trim()}”`];
  });
  if (jargon.length > 0) {
    console.error('The Invitation uses terms it leaves to the Reference Grammar:');
    for (const j of jargon) console.error(`  ${j}`);
    process.exit(1);
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(INVITATION.title)}</title>
<meta name="description" content="A short introduction to Liraasa, a language built for singing, read through the Goddess's Lament.">
<style>${CSS}${INVITATION_CSS}</style>
</head>
<body class="invitation">
<main id="content">
${body}
<footer class="colophon">
<p>Liraasa ${esc(lex.version)} · ${esc(lex.built_utc.slice(0, 10))}. Every Liraasa word in this booklet was checked against the lexicon.</p>
</footer>
</main>
</body>
</html>
`;

  const outDir = resolve(args.flags.out ?? GUIDE.outDir);
  mkdirSync(outDir, { recursive: true });
  const htmlPath = resolve(outDir, `${INVITATION.outName}.html`);
  writeFileSync(htmlPath, html, 'utf8');
  console.log(`wrote ${htmlPath}`);
  const reviewPath = resolve('review', `${INVITATION.outName}_review.md`);
  writeFileSync(reviewPath, reviewMarkdown(INVITATION.title), 'utf8');
  console.log(`wrote ${reviewPath}`);
  console.log(`  ${String(recorded.length)} Liraasa strings checked; no jargon`);

  if (args.booleans.has('pdf')) {
    const pdfPath = resolve(outDir, `${INVITATION.outName}.pdf`);
    printPdf(htmlPath, pdfPath);
    console.log(`wrote ${pdfPath} (${String(pdfPages(pdfPath))} pages)`);
  }
}

main();
