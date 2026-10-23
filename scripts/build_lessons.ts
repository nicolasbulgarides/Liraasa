/**
 * CLI: build Liraasa 2.5: The Grammar in Lessons → handoff/Liraasa_2_5_Lessons.html
 *
 *   npm run build:lessons            # the HTML
 *   npm run build:lessons -- --pdf   # also the PDF (Edge or Chrome), both copied to LirasaCodexLatest/
 *
 * The content is scripts/lessons/lessons_2_5.ts. The build refuses to write
 * the page unless, under the 2.5 strict checker (src/core/grammar):
 *   - every example and every practice answer reads with no error or warning;
 *   - every "watch out" sentence is rejected, citing the rule it names;
 *   - every Liraasa word in the prose is a word of Liraasa;
 *   - every rule cited exists in the 2.5 reference.
 */
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pdfPages, printPdf } from './grammar_guide/check';
import { createChecker } from '../src/core/grammar';
import { loadGrammarSource } from './grammar_source';
import { INTRO, MAP, OPEN, PARTS } from './lessons/lessons_2_5';

const OUT = 'handoff/Liraasa_2_5_Lessons.html';
const PDF = 'handoff/Liraasa_2_5_Lessons.pdf';
/** With --pdf, the HTML and the PDF also land here, beside the published guide. */
const LATEST_DIR = 'LirasaCodexLatest';
const ck = createChecker(loadGrammarSource());
const ref = JSON.parse(readFileSync('handoff/liraasa_2_5_llm.json', 'utf8')) as {
  rulings: { id: string }[];
};
const rulingIds = new Set(ref.rulings.map((r) => r.id));
const problems: string[] = [];

const serious = (line: string): string[] =>
  ck
    .checkLine(line)
    .findings.filter((f) => f.severity === 'error' || f.severity === 'warn')
    .map((f) => `${f.rule}: ${f.message}`);

/** Each Liraasa word in a prose span (`…`): an affix or a template is let through. */
function checkWords(span: string, where: string): void {
  for (const w of span.split(/[\s,.?!;:…]+/)) {
    if (
      w === '' ||
      w.startsWith('-') ||
      w.endsWith('-') ||
      /[A-Z]{2}|\[|\]/.test(w) ||
      w === 'X' ||
      w === 'Y'
    )
      continue;
    const unknown = ck
      .checkLine(w)
      .findings.filter((f) => f.rule === 'hard_rules[0]' || f.rule === '0.8:R2');
    if (unknown.length > 0) problems.push(`${where}: "${w}" is not a word of Liraasa`);
  }
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** `liraasa`, **bold**, *italic*. */
function md(s: string, where: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, (_m, l: string) => {
      checkWords(l, where);
      return `<span class="li" lang="x-liraasa">${l}</span>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

let n = 0;
const toc: string[] = [];
const body: string[] = [];
for (const [pi, part] of PARTS.entries()) {
  body.push(
    `<section class="part" id="part-${String(pi + 1)}"><h2><span class="part-no">Part ${String(pi + 1)}</span> ${esc(part.title)}</h2>`,
  );
  toc.push(`<li><span class="toc-part">${esc(part.title)}</span><ol start="${String(n + 1)}">`);
  for (const l of part.lessons) {
    n += 1;
    const id = `lesson-${String(n)}`;
    const where = `Lesson ${String(n)} (${l.title})`;
    for (const [li] of [...l.examples, ...l.practice.map(([, a]) => [a, ''] as [string, string])]) {
      const s = serious(li);
      if (s.length > 0) problems.push(`${where}: "${li}" does not read clean: ${s.join('; ')}`);
    }
    for (const [bad, , rule] of l.watch ?? []) {
      const rules = ck
        .checkLine(bad)
        .findings.filter((f) => f.severity === 'error')
        .map((f) => f.rule);
      if (!rules.includes(rule))
        problems.push(
          `${where}: "${bad}" is not rejected for ${rule} (${rules.join(', ') || 'no error'})`,
        );
    }
    for (const r of l.rules) if (!rulingIds.has(r)) problems.push(`${where}: no ruling ${r}`);
    toc.push(`<li><a href="#${id}">${esc(l.title)}</a></li>`);
    body.push(`<article class="lesson" id="${id}" aria-labelledby="${id}-h">
<header><span class="no" aria-hidden="true">${String(n)}</span><h3 id="${id}-h">${esc(l.title)}</h3>
<label class="done"><input type="checkbox" data-lesson="${String(n)}"> studied</label></header>
<p class="welcome">${md(l.welcome, where)}</p>
<ul class="points">${l.points.map((p) => `<li>${md(p, where)}</li>`).join('')}</ul>
<div class="examples">${l.examples.map(([li, en]) => `<p><span class="li" lang="x-liraasa">${esc(li)}</span><span class="en">${esc(en)}</span></p>`).join('')}</div>
${(l.watch ?? []).map(([bad, why]) => `<p class="watch"><span class="tag">Watch out</span> <s class="li" lang="x-liraasa">${esc(bad)}</s> <span>${md(why, where)}</span></p>`).join('')}
<div class="practice"><p class="tag">Try it</p>${l.practice.map(([q, a]) => `<details><summary>${md(q, where)}</summary><p class="li" lang="x-liraasa">${esc(a)}</p></details>`).join('')}</div>
<footer>Rules: ${l.rules.map(esc).join(' · ')}</footer>
</article>`);
  }
  toc.push('</ol></li>');
  body.push('</section>');
}

if (problems.length > 0) {
  console.error(`HALTED: ${String(problems.length)} problems; nothing was written.`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Liraasa Grammar Lessons</title>
<style>
:root{--bg:#fbf8f3;--ink:#2b2a28;--muted:#6b665e;--card:#fffdf9;--rule:#e6dfd3;--accent:#7a4f9a;--accent-soft:#f1eaf6;--li:#5b3a78;--warn:#a2462e;--warn-soft:#fbefe9}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1c1b1f;--ink:#ece8e1;--muted:#a7a199;--card:#242329;--rule:#38353d;--accent:#c4a3e0;--accent-soft:#2f2938;--li:#d6bdf0;--warn:#f0a089;--warn-soft:#3a2724}}
:root[data-theme="dark"]{--bg:#1c1b1f;--ink:#ece8e1;--muted:#a7a199;--card:#242329;--rule:#38353d;--accent:#c4a3e0;--accent-soft:#2f2938;--li:#d6bdf0;--warn:#f0a089;--warn-soft:#3a2724}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 Georgia,"Iowan Old Style","Palatino Linotype",serif}
main{max-width:46rem;margin:0 auto;padding:2.5rem 16px 4rem}
h1{font-size:2.1rem;line-height:1.2;margin:0 0 .3rem;font-weight:normal}
.sub{color:var(--muted);margin:0 0 2rem;font-style:italic}
.intro p{margin:0 0 1rem}
nav{background:var(--card);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.25rem;margin:2rem 0 3rem}
nav h2{font-size:1rem;margin:0 0 .5rem;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);font-family:system-ui,sans-serif}
nav>ol{list-style:none;padding:0;margin:0;columns:2 16rem;column-gap:2rem}
nav>ol>li{break-inside:avoid;margin-bottom:.75rem}
.toc-part{font-family:system-ui,sans-serif;font-size:.85rem;color:var(--accent);font-weight:600}
nav ol ol{margin:.2rem 0 0;padding-left:1.6rem}
nav a{color:var(--ink);text-decoration:none}nav a:hover{text-decoration:underline}
.part h2{font-weight:normal;font-size:1.5rem;margin:3rem 0 1rem;border-bottom:1px solid var(--rule);padding-bottom:.4rem}
.part-no{font-family:system-ui,sans-serif;font-size:.8rem;color:var(--accent);text-transform:uppercase;letter-spacing:.06em;display:block}
.lesson{background:var(--card);border:1px solid var(--rule);border-radius:12px;padding:1.4rem 1.5rem 1rem;margin:0 0 1.5rem}
.lesson header{display:flex;align-items:baseline;gap:.75rem;flex-wrap:wrap}
.no{font-family:system-ui,sans-serif;color:var(--accent);background:var(--accent-soft);border-radius:999px;min-width:2rem;height:2rem;display:inline-flex;align-items:center;justify-content:center;font-weight:600}
.lesson h3{margin:0;font-weight:normal;font-size:1.3rem;flex:1}
.done{font-family:system-ui,sans-serif;font-size:.8rem;color:var(--muted);cursor:pointer}
.welcome{color:var(--muted);font-style:italic;margin:.6rem 0 .8rem}
.points{padding-left:1.2rem;margin:0 0 1rem}.points li{margin:.3rem 0}
.li{color:var(--li);font-style:normal}
.examples{border-left:3px solid var(--accent);padding:.2rem 0 .2rem 1rem;margin:1rem 0}
.examples p{margin:.35rem 0}
.examples .li{display:block;font-size:1.05rem}
.en{display:block;color:var(--muted);font-size:.92rem}
.watch{background:var(--warn-soft);border-radius:8px;padding:.6rem .8rem;font-size:.95rem}
.watch s{color:var(--warn)}
.tag{font-family:system-ui,sans-serif;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);font-weight:600;margin:0 .3rem 0 0}
.watch .tag{color:var(--warn)}
.practice{margin:1rem 0 .4rem}.practice .tag{margin-bottom:.3rem}
details{border:1px solid var(--rule);border-radius:8px;padding:.45rem .75rem;margin:.4rem 0}
summary{cursor:pointer}details p{margin:.4rem 0 .1rem;font-size:1.05rem}
.lesson footer{font-family:system-ui,sans-serif;font-size:.75rem;color:var(--muted);margin-top:.6rem}
.map{background:var(--accent-soft);border-radius:12px;padding:1.2rem 1.4rem;margin:3rem 0 1.5rem}
.map h2{margin:0 0 .6rem;font-weight:normal}
.map code{display:block;white-space:pre-wrap;font:0.88rem/1.55 ui-monospace,Consolas,monospace;margin:.35rem 0}
.open{color:var(--muted);font-size:.95rem}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media print{nav,.done{display:none}.lesson{break-inside:avoid;border:none;padding:0}details{border:none}details>p{display:block}body{background:#fff}}
</style>
</head>
<body>
<main>
<h1>Liraasa: The Grammar in Lessons</h1>
<p class="sub">Edition 2.5 · twenty short lessons, about ten minutes each</p>
<div class="intro">${INTRO.map((p) => `<p>${md(p, 'intro')}</p>`).join('')}</div>
<nav aria-label="Lessons"><h2>The lessons</h2><ol>${toc.join('')}</ol></nav>
${body.join('\n')}
<section class="map"><h2>${esc(MAP.title)}</h2>
<p>Every sentence fits this frame. Brackets are optional; the order never changes.</p>
${MAP.lines.map((l) => `<code>${esc(l)}</code>`).join('')}
<p>And every noun phrase fits this one:</p><code>${esc(MAP.np)}</code></section>
<section class="open"><h2 style="font-weight:normal">Still being decided</h2>
<p>A living language: these points are not yet ruled. Avoid them for now.</p>
<ul>${OPEN.map((o) => `<li>${md(o, 'open')}</li>`).join('')}</ul></section>
</main>
<script>
(function(){
  var KEY='liraasa-lessons-2-5';
  var done={};
  try{done=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
  document.querySelectorAll('input[data-lesson]').forEach(function(box){
    box.checked=!!done[box.dataset.lesson];
    box.addEventListener('change',function(){
      done[box.dataset.lesson]=box.checked;
      try{localStorage.setItem(KEY,JSON.stringify(done))}catch(e){}
    });
  });
})();
</script>
</body>
</html>
`;
writeFileSync(OUT, html, 'utf8');
console.log(`wrote ${OUT}: ${String(n)} lessons, every example checked`);

if (process.argv.includes('--pdf')) {
  // on paper every answer is shown: the print copy opens each practice line
  const printCopy = 'handoff/.Liraasa_2_5_Lessons.print.html';
  writeFileSync(printCopy, html.replace(/<details>/g, '<details open>'), 'utf8');
  printPdf(resolve(printCopy), resolve(PDF));
  rmSync(printCopy);
  console.log(`wrote ${PDF} (${String(pdfPages(PDF))} pages)`);
  mkdirSync(LATEST_DIR, { recursive: true });
  for (const f of [OUT, PDF]) copyFileSync(f, `${LATEST_DIR}/${f.split('/').pop() ?? f}`);
  console.log(`copied both to ${LATEST_DIR}/`);
}
