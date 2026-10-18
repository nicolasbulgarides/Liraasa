/**
 * What every document built from the lexicon shares: the canon check run
 * before anything is written, the review list, and printing to PDF.
 *
 * Both the Reference Grammar and the Invitation run `checkWords` over every
 * Liraasa string they recorded; a word that is not canon fails the build
 * (CLAUDE.md: never invent a word).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { tokenize, type Index } from './data';
import { awaitingReview, decisionsNeeded, recorded } from './html';

const MORPHEME = /^[-+]|[-+]$|\+|^R\b|^VERB$/;

/** Every recorded Liraasa string must be canon. Returns the problems found. */
export function checkWords(index: Index): string[] {
  const problems = new Set<string>();
  const ph = index.lex.phonology;
  const letters = new Set(
    `${ph.vowels} ${ph.consonants_core} ${ph.consonants_other}`
      .split(/[^a-z]+/)
      .filter((t) => t.length === 1),
  );
  for (const { text, use } of recorded) {
    if (use === 'name') {
      // a name is not checked against the lexicon, only against the alphabet
      const odd = [...text.toLowerCase()].filter((ch) => !letters.has(ch));
      if (odd.length > 0)
        problems.add(`name "${text}" uses letters Liraasa lacks: ${odd.join(' ')}`);
      continue;
    }
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

export function findBrowser(): string | undefined {
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

/** Print an HTML file to PDF with Edge or Chrome; exits if neither is found. */
export function printPdf(htmlPath: string, pdfPath: string): void {
  const browser = findBrowser();
  if (browser === undefined) {
    console.error('--pdf: no Edge or Chrome found; set GUIDE_BROWSER to its path');
    process.exit(1);
  }
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
}

/** The page count of a PDF the browser printed (its page objects, counted). */
export function pdfPages(pdfPath: string): number {
  return (readFileSync(pdfPath, 'latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
}

/** The review and decision lists as Markdown, for review/. */
export function reviewMarkdown(title: string): string {
  const lines = [
    `# ${title}: for the author`,
    '',
    'Written by the build. Nothing here is canon until the author says so.',
    '',
  ];
  lines.push('## REVIEW: sentences that are not canon examples', '');
  if (awaitingReview.length === 0) lines.push('None.', '');
  for (const r of awaitingReview) lines.push(`- *${r.liraasa}* — ${r.english} (${r.where})`);
  lines.push('', '## DECISIONS NEEDED', '');
  if (decisionsNeeded.length === 0) lines.push('None.', '');
  for (const d of decisionsNeeded) lines.push(`- ${d.what} (${d.where})`);
  lines.push('');
  return lines.join('\n');
}
