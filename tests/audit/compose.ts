/* eslint-disable no-console -- a CLI, like scripts/: its output is the report */
/**
 * Run English through the songbook editor's own Compose tab, headless.
 *
 * The page (editor/index.html) declares composeSentence and draftLine as
 * globals of its main script. A scratch copy of the page, with a <base> so its
 * scripts load from editor/ and one extra script at the end, composes every
 * input and writes the drafts into the DOM; Edge or Chrome prints the DOM
 * (--dump-dom). The editor itself is never modified.
 *
 *   npx tsx tests/audit/compose.ts "I sing." "We were singing."
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { findBrowser } from '../../scripts/grammar_guide/check';

export interface Composed {
  english: string;
  /** The draft with the composer's default choices; a gap is written [english]. */
  liraasa: string;
  gaps: string[];
}

const HOOK = `
<script>
(function () {
  var input = JSON.parse(document.getElementById('audit-in').textContent);
  var out = input.map(function (en) {
    try {
      var d = composeSentence(en);
      var parts = draftLine(d);
      var gaps = parts.filter(function (p) { return p.gap; }).map(function (p) { return p.text; });
      var text = parts.map(function (p) { return p.gap ? '[' + p.text + ']' : p.text; }).join(' ')
        .replace(/\\s+([,:])/g, '$1').trim() + draftEnd(d);
      return { english: en, liraasa: text, gaps: gaps };
    } catch (e) {
      return { english: en, liraasa: 'ERROR: ' + e.message, gaps: [] };
    }
  });
  var pre = document.createElement('pre');
  pre.id = 'audit-out';
  pre.textContent = JSON.stringify(out);
  document.body.appendChild(pre);
})();
</script>`;

export function compose(sentences: readonly string[]): Composed[] {
  const browser = findBrowser();
  if (browser === undefined) throw new Error('no Edge or Chrome found; set GUIDE_BROWSER');
  const editor = resolve('editor/index.html');
  const page = readFileSync(editor, 'utf8');
  const base = `<base href="${pathToFileURL(resolve('editor')).href}/">`;
  const input = `<script type="application/json" id="audit-in">${JSON.stringify(sentences).replace(/</g, '\\u003c')}</script>`;
  const lines = page.split('\n');
  lines.splice(1, 0, base);
  // the page has no </body> of its own (one appears only inside a script string): append
  const html = `${lines.join('\n')}\n${input}${HOOK}\n`;
  const dir = mkdtempSync(join(tmpdir(), 'liraasa-audit-'));
  const file = join(dir, 'compose.html');
  writeFileSync(file, html, 'utf8');
  try {
    const dom = execFileSync(
      browser,
      [
        '--headless=new',
        '--disable-gpu',
        '--allow-file-access-from-files',
        '--virtual-time-budget=15000',
        '--dump-dom',
        pathToFileURL(file).href,
      ],
      { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] },
    );
    const m = /<pre id="audit-out">([\s\S]*?)<\/pre>/.exec(dom);
    if (m === null) throw new Error('the page did not compose (no audit-out in the DOM)');
    const json = (m[1] ?? '')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    return JSON.parse(json) as Composed[];
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1]?.endsWith('compose.ts')) {
  for (const c of compose(process.argv.slice(2))) console.log(`${c.english}\n  → ${c.liraasa}`);
}
