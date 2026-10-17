/** The guide's stylesheet: screen and print, light and dark, WCAG 2.2 AA contrast. */
export const CSS = `
:root {
  --bg: #fbf8f3; --surface: #ffffff; --ink: #1f1c24; --muted: #5b5563; --rule: #ddd5ca;
  --lir: #6b2d5c; --accent: #2f4f7a; --accent-soft: #e8eef6;
  --sing: #8a4b00; --sing-bg: #fdf3e4; --parse: #23566b; --parse-bg: #e6f2f5;
  --warn: #8b1e1e; --warn-bg: #fbeaea; --unused: #8a8490;
  --b12: #6b2d5c; --b10: #2f4f7a; --b08: #4b5a2a; --badr: #5b5563;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #17151b; --surface: #211e26; --ink: #ece7f0; --muted: #b3abbb; --rule: #3a3541;
    --lir: #e7a9d6; --accent: #9dbbe6; --accent-soft: #26303f;
    --sing: #f1bd77; --sing-bg: #2e2416; --parse: #8fcfe0; --parse-bg: #16282e;
    --warn: #f3a3a3; --warn-bg: #321a1a; --unused: #8f8897;
    --b12: #e7a9d6; --b10: #9dbbe6; --b08: #c4d39a; --badr: #b3abbb;
  }
}
:root[data-theme="dark"] {
  --bg: #17151b; --surface: #211e26; --ink: #ece7f0; --muted: #b3abbb; --rule: #3a3541;
  --lir: #e7a9d6; --accent: #9dbbe6; --accent-soft: #26303f;
  --sing: #f1bd77; --sing-bg: #2e2416; --parse: #8fcfe0; --parse-bg: #16282e;
  --warn: #f3a3a3; --warn-bg: #321a1a; --unused: #8f8897;
  --b12: #e7a9d6; --b10: #9dbbe6; --b08: #c4d39a; --badr: #b3abbb;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--ink);
  font: 16px/1.6 "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
}
main { max-width: 60rem; margin: 0 auto; padding: 0 1rem 4rem; }
a { color: var(--accent); }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.skip { position: absolute; left: -999px; top: 0; background: var(--surface); padding: .5rem 1rem; }
.skip:focus { left: 1rem; }

.liraasa {
  font-family: "Palatino Linotype", Palatino, "Book Antiqua", Georgia, "Times New Roman", serif;
  color: var(--lir); font-style: normal; hyphens: none; -webkit-hyphens: none; word-break: keep-all;
}
.liraasa.unused { color: var(--unused); text-decoration: line-through; }
.liraasa.retired { color: var(--muted); }
code, pre { font-family: Consolas, "Cascadia Mono", Menlo, monospace; font-size: .88em; }
code.morph { background: var(--accent-soft); color: var(--ink); padding: 0 .3em; border-radius: 4px; white-space: nowrap; }
pre.template { background: var(--surface); border: 1px solid var(--rule); border-radius: 8px; padding: .75rem 1rem; white-space: pre-wrap; overflow-wrap: anywhere; }

/* Cover */
.cover { min-height: 92vh; display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 3rem 1rem; }
.cover .eyebrow { letter-spacing: .3em; text-transform: uppercase; color: var(--muted); font-size: .85rem; }
.cover h1 { font-family: "Palatino Linotype", Palatino, Georgia, serif; font-weight: 400; font-size: clamp(2.4rem, 7vw, 4.2rem); line-height: 1.1; margin: .5rem 0; }
.cover h1 .liraasa { display: block; font-size: 1.15em; }
.cover .sub { font-size: 1.25rem; color: var(--muted); font-style: italic; }
.cover .meta { margin-top: 2.5rem; color: var(--muted); font-size: .9rem; }
.cover .ornament { font-size: 1.5rem; color: var(--lir); margin: 1.5rem 0; letter-spacing: .5em; }

/* TOC */
nav.toc { background: var(--surface); border: 1px solid var(--rule); border-radius: 12px; padding: 1.5rem 2rem; margin: 2rem 0; }
nav.toc h2 { margin-top: 0; font-size: 1.4rem; }
nav.toc ol { list-style: none; padding: 0; margin: 0; columns: 2 18rem; column-gap: 2rem; }
nav.toc li { break-inside: avoid; }
nav.toc li.l2 { font-weight: 600; margin-top: .6rem; }
nav.toc li.l3 { padding-left: 1rem; font-size: .92rem; }
nav.toc a { text-decoration: none; color: var(--ink); }
nav.toc a:hover { text-decoration: underline; }

/* Parts */
.part { margin-top: 4rem; }
.part-head { border-bottom: 2px solid var(--rule); padding-bottom: 1rem; margin-bottom: 1.5rem; }
.part-num { font-family: Georgia, serif; font-size: 3.2rem; line-height: 1; color: var(--lir); }
.part-head h2 { font-family: "Palatino Linotype", Palatino, Georgia, serif; font-weight: 400; font-size: 2.2rem; margin: .2rem 0 .4rem; }
.part-intro { font-size: 1.1rem; color: var(--muted); margin: 0; }
h3 { font-size: 1.35rem; margin: 2.2rem 0 .6rem; color: var(--accent); }
h4 { font-size: 1.02rem; margin: 1.4rem 0 .4rem; }
p, ul, ol { margin: .5rem 0 .9rem; }
.muted { color: var(--muted); }

/* Tables */
.table-wrap { overflow-x: auto; margin: .8rem 0 1.2rem; }
table { border-collapse: collapse; width: 100%; background: var(--surface); font-size: .92rem; }
caption { text-align: left; color: var(--muted); padding-bottom: .4rem; }
th, td { border-bottom: 1px solid var(--rule); padding: .45rem .6rem; text-align: left; vertical-align: top; }
thead th { background: var(--accent-soft); font-weight: 600; border-bottom: 2px solid var(--rule); }
td.num { text-align: right; font-variant-numeric: tabular-nums; color: var(--muted); width: 2.5rem; }
td.form .liraasa, td .liraasa:first-child { font-size: 1.08em; }
td.unused { color: var(--unused); }
.unused-note { font-style: italic; }
.gloss { display: block; color: var(--muted); font-size: .86em; }
table.compact { width: auto; min-width: 50%; }
table.reference td { font-size: .88rem; }
table.grid td { white-space: nowrap; }

/* Callouts and badges */
.callout { border-left: 5px solid; border-radius: 0 10px 10px 0; padding: .7rem 1rem; margin: 1rem 0; }
.callout p { margin: .2rem 0; }
.callout-head { font-weight: 700; font-size: .85rem; letter-spacing: .06em; text-transform: uppercase; }
.callout-icon { display: inline-block; width: 1.4em; }
.callout.singing { border-color: var(--sing); background: var(--sing-bg); }
.callout.singing .callout-head { color: var(--sing); }
.callout.parsing { border-color: var(--parse); background: var(--parse-bg); }
.callout.parsing .callout-head { color: var(--parse); }
.callout.caution { border-color: var(--warn); background: var(--warn-bg); }
.callout.caution .callout-head { color: var(--warn); }
.badge { display: inline-block; font: 600 .78rem/1.5 Consolas, Menlo, monospace; padding: 0 .45em; border-radius: 999px; border: 1.5px solid; white-space: nowrap; vertical-align: .08em; }
.badge.b12 { color: var(--b12); } .badge.b10 { color: var(--b10); } .badge.b08 { color: var(--b08); } .badge.badr { color: var(--badr); }
.sev { font-weight: 700; text-transform: uppercase; font-size: .78rem; }
.sev-error { color: var(--warn); } .sev-warn { color: var(--sing); } .sev-note { color: var(--parse); }

/* Examples */
.exs { margin: .6rem 0 1rem; display: grid; gap: .5rem; }
.ex { background: var(--surface); border: 1px solid var(--rule); border-radius: 8px; padding: .5rem .9rem; break-inside: avoid; }
.ex-l { font-size: 1.12rem; }
.ex-e { color: var(--muted); font-size: .92rem; }

/* Slot diagram */
figure.slots { margin: 1rem 0; }
.slot-row { list-style: none; display: flex; flex-wrap: wrap; gap: .35rem; padding: 0; margin: 0; }
.slot { border: 1.5px dashed var(--rule); border-radius: 8px; padding: .3rem .45rem; min-width: 4.2rem; text-align: center; background: var(--surface); color: var(--muted); font-size: .74rem; }
.slot.req { border: 2px solid var(--lir); color: var(--ink); font-weight: 700; background: var(--accent-soft); }
.slot-n { display: block; font-size: .68rem; opacity: .85; }
figcaption { color: var(--muted); font-size: .88rem; margin-top: .5rem; }
.pairs { line-height: 2; }

/* Rulings */
.ruling { background: var(--surface); border: 1px solid var(--rule); border-radius: 10px; padding: .4rem 1.1rem .6rem; margin: 1rem 0; break-inside: avoid; }
.ruling h4 { margin-top: .7rem; }
.refines { color: var(--muted); }

/* Word cards */
.core-group { margin-top: 2rem; }
.group-blurb { color: var(--muted); font-style: italic; }
.word-card { background: var(--surface); border: 1px solid var(--rule); border-radius: 14px; padding: 1.2rem 1.4rem; margin: 1.5rem 0; }
.word-head h3 { margin: 0; color: var(--ink); display: flex; flex-wrap: wrap; align-items: baseline; gap: .8rem; }
.word-head .big .liraasa { font-size: 2.2rem; font-weight: 400; }
.word-gloss { font-weight: 400; color: var(--muted); font-size: 1.15rem; }
.chips { display: flex; flex-wrap: wrap; gap: .35rem; margin: .5rem 0; }
.chip { font-size: .76rem; border: 1px solid var(--rule); border-radius: 999px; padding: .05rem .6rem; color: var(--muted); }
.chip.id { font-family: Consolas, Menlo, monospace; }
.word-sound, .sound { color: var(--muted); }
.sound .stress { font-family: Consolas, Menlo, monospace; color: var(--ink); }
.sound .ipa { font-family: "Segoe UI", "Lucida Sans Unicode", "DejaVu Sans", sans-serif; }
.sound .syl { font-size: .82em; }
.sound .stress, .sound .ipa { white-space: nowrap; }
table.forms .sound > span { display: block; }
table.forms .sound .ipa, table.forms .sound .syl { font-size: .85em; }
.build { display: block; margin-top: .15rem; }
.verb-note { margin-top: .2rem; }
.two-col { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1rem; }
.col-head { font-weight: 600; font-size: .9rem; margin: .2rem 0; }
ul.compounds { list-style: none; padding: 0; margin: 0; }
ul.compounds li { padding: .12rem 0; }
ul.compounds .gloss { display: inline; margin-left: .35rem; }
ul.compounds .more { color: var(--muted); font-style: italic; }
.rhymes { line-height: 1.9; }
.synonyms { font-size: .9rem; color: var(--muted); border-top: 1px solid var(--rule); padding-top: .6rem; margin-top: 1rem; }
.steps li { margin: .25rem 0; }
footer.colophon { margin-top: 4rem; padding-top: 1rem; border-top: 1px solid var(--rule); color: var(--muted); font-size: .85rem; }

@media (max-width: 600px) {
  .word-card { padding: 1rem; }
  th, td { padding: .35rem .4rem; }
}

@page { size: A4; margin: 16mm 14mm 18mm; }
@media print {
  :root, :root[data-theme="dark"] {
    --bg: #ffffff; --surface: #ffffff; --ink: #1a1a1a; --muted: #4f4f4f; --rule: #cfc8bd;
    --lir: #6b2d5c; --accent: #2f4f7a; --accent-soft: #eef2f8;
  }
  body { font-size: 10.5pt; background: #fff; }
  main { max-width: none; padding: 0; }
  .skip { display: none; }
  .cover { min-height: 260mm; break-after: page; }
  nav.toc { break-after: page; border: none; padding: 0; }
  .part { break-before: page; margin-top: 0; }
  .word-card { break-before: page; border: none; padding: 0; }
  .core-group > h3 + .group-blurb + .word-card { break-before: avoid; }
  h3, h4 { break-after: avoid; }
  tr, .ex, .callout { break-inside: avoid; }
  thead { display: table-header-group; }
  a { color: inherit; text-decoration: none; }
}
`;
