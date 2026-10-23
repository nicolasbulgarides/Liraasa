/**
 * CLI: open the real editor (editor/index.html) in headless Edge or Chrome,
 * compose three English lines and check two Liraasa lines, and print what the
 * page shows. A quick proof that the bundle (npm run build:grammar) loads and
 * the Compose and Check panels use it.
 *
 *   npx tsx scripts/smoke_editor.ts
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { findBrowser } from './grammar_guide/check';
const HOOK = `<script>
(function () {
  (function () {
    var out = [];
    try {
      document.getElementById('englishIn').value = ['Where are you going?','I open the door with the key.','I recognize you.'].join(String.fromCharCode(10));
      document.getElementById('composeBtn').click();
      out.push('COMPOSE: ' + document.getElementById('composeOut').innerText.slice(0, 1500));
      var ta = document.getElementById('text');
      ta.value = ['li veluasasan po lirala.','saivo po farufasbifa kube saivo ramusan raho maivo po ke.'].join(String.fromCharCode(10));
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      out.push('CHECK: ' + document.getElementById('panel-check').innerText.slice(0, 1500));
    } catch (e) { out.push('ERROR ' + e.stack); }
    var pre = document.createElement('pre'); pre.id = 'smoke-out'; pre.textContent = out.join(String.fromCharCode(10,10)); document.body.appendChild(pre);
  })();
})();
window.addEventListener('error', function (e) { var p = document.createElement('pre'); p.className='smoke-err'; p.textContent = 'PAGE ERROR ' + e.message; document.documentElement.appendChild(p); });
</script>`;
const browser = findBrowser();
if (browser === undefined) throw new Error('no browser');
const page = readFileSync(resolve('editor/index.html'), 'utf8').split('\n');
page.splice(1, 0, `<base href="${pathToFileURL(resolve('editor')).href}/">`);
const dir = mkdtempSync(join(tmpdir(), 'liraasa-smoke-'));
const file = join(dir, 'smoke.html');
writeFileSync(file, `${page.join('\n')}\n${HOOK}\n`, 'utf8');
const dom = execFileSync(
  browser,
  [
    '--headless=new',
    '--disable-gpu',
    '--allow-file-access-from-files',
    '--virtual-time-budget=8000',
    '--dump-dom',
    pathToFileURL(file).href,
  ],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);
const m = /<pre id="smoke-out">([\s\S]*?)<\/pre>/.exec(dom);
console.log(
  m?.[1] !== undefined
    ? m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    : 'NO OUTPUT',
);
for (const e of dom.matchAll(/<pre class="smoke-err">([\s\S]*?)<\/pre>/g)) console.log(e[1]);
