/** The guide's stylesheet: screen and print, light and dark, WCAG 2.2 AA contrast. */
export const CSS = `
:root {
  --bg: #fbf8f3; --surface: #ffffff; --ink: #1f1c24; --muted: #5b5563; --rule: #ddd5ca;
  --lir: #6b2d5c; --accent: #2f4f7a; --accent-soft: #e8eef6;
  --sing: #8a4b00; --sing-bg: #fdf3e4; --parse: #23566b; --parse-bg: #e6f2f5;
  --warn: #8b1e1e; --warn-bg: #fbeaea; --unused: #8a8490;
  --b22: #1f5f8b; --b21: #0b6656; --b20: #8a4b00; --b12: #6b2d5c; --b10: #2f4f7a; --b08: #4b5a2a; --badr: #5b5563;
  --sun: #b0700f; --sun-bg: #fbe9c2; --moon: #3f5f8f; --moon-bg: #e3ebf7;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #17151b; --surface: #211e26; --ink: #ece7f0; --muted: #b3abbb; --rule: #3a3541;
    --lir: #e7a9d6; --accent: #9dbbe6; --accent-soft: #26303f;
    --sing: #f1bd77; --sing-bg: #2e2416; --parse: #8fcfe0; --parse-bg: #16282e;
    --warn: #f3a3a3; --warn-bg: #321a1a; --unused: #8f8897;
    --b22: #8cc4ef; --b21: #7fd6c4; --b20: #f1bd77; --b12: #e7a9d6; --b10: #9dbbe6; --b08: #c4d39a; --badr: #b3abbb;
    --sun: #f2c26b; --sun-bg: #3b2c12; --moon: #b9cbea; --moon-bg: #222c3d;
  }
}
:root[data-theme="dark"] {
  --bg: #17151b; --surface: #211e26; --ink: #ece7f0; --muted: #b3abbb; --rule: #3a3541;
  --lir: #e7a9d6; --accent: #9dbbe6; --accent-soft: #26303f;
  --sing: #f1bd77; --sing-bg: #2e2416; --parse: #8fcfe0; --parse-bg: #16282e;
  --warn: #f3a3a3; --warn-bg: #321a1a; --unused: #8f8897;
  --b22: #8cc4ef; --b21: #7fd6c4; --b20: #f1bd77; --b12: #e7a9d6; --b10: #9dbbe6; --b08: #c4d39a; --badr: #b3abbb;
  --sun: #f2c26b; --sun-bg: #3b2c12; --moon: #b9cbea; --moon-bg: #222c3d;
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
.cover { position: relative; overflow: hidden; isolation: isolate; }
.cover-inner { position: relative; z-index: 1; }
.cover-stars { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -2; }
.field-star { fill: var(--sun); opacity: .5; }
.field-spark { fill: var(--moon); opacity: .45; }
.cover-rosette { position: absolute; left: 50%; top: 50%; width: min(48rem, 125vw); height: auto; transform: translate(-50%, -50%); z-index: -1;
  fill: none; stroke: var(--lir); stroke-width: 1; opacity: .1; }
.cover-rosette .dash { stroke-dasharray: 2 6; }
.cover-corner { position: absolute; width: clamp(4.5rem, 14vw, 8rem); height: auto; fill: none; stroke: var(--lir); stroke-width: 1.2; opacity: .6; }
.cover-corner .dash { stroke-dasharray: 1 4; stroke-linecap: round; }
.cover-corner.tl { top: .5rem; left: .5rem; }
.cover-corner.tr { top: .5rem; right: .5rem; transform: scaleX(-1); }
.cover-corner.bl { bottom: .5rem; left: .5rem; transform: scaleY(-1); }
.cover-corner.br { bottom: .5rem; right: .5rem; transform: scale(-1, -1); }
.corner-spark { fill: var(--sun); stroke: none; }
.corner-heart { fill: var(--lir); stroke: none; opacity: .8; }
.corner-dot { fill: var(--lir); stroke: none; }
.cover-emblem { display: block; width: min(30rem, 100%); height: auto; margin: 0 auto .4rem; }
.ray { fill: var(--sun); }
.ray.short { opacity: .55; }
.sun-disc { fill: var(--sun-bg); stroke: var(--sun); stroke-width: 1.6; }
.sun-ring { fill: none; stroke: var(--sun); stroke-width: 1; stroke-dasharray: 2 3; }
.sun-dot { fill: var(--sun); }
.core-heart { fill: var(--lir); }
.moon { fill: var(--moon-bg); stroke: var(--moon); stroke-width: 1.6; }
.orbit { fill: none; stroke: var(--moon); stroke-width: 1.4; stroke-dasharray: .5 6; stroke-linecap: round; }
.spark { fill: var(--sun); }
.small-heart { fill: none; stroke: var(--lir); stroke-width: 1.4; }
.cover .motif { margin: 0 0 1.6rem; font-size: 1.15rem; letter-spacing: .08em; }
.cover .motif .sep { color: var(--muted); }
.cover .motif-en { display: block; font-size: .78rem; letter-spacing: .25em; text-transform: uppercase; color: var(--muted); }
.cover-divider { display: block; width: min(22rem, 90%); height: auto; margin: 1.6rem auto .4rem; }
.cover-divider line { stroke: var(--lir); stroke-width: 1; opacity: .6; }
.cover-divider .diamond { fill: var(--sun); }
.cover-melody { display: block; width: min(40rem, 100%); height: auto; margin: .2rem auto 0; }
.staff { fill: none; stroke: var(--muted); stroke-width: .9; opacity: .7; }
.note-head { fill: var(--lir); }
.note-head.hollow { fill: none; stroke: var(--lir); stroke-width: 1.8; }
.note-stem { stroke: var(--lir); stroke-width: 1.4; }
.note-flag { fill: none; stroke: var(--lir); stroke-width: 1.4; }
.beam { fill: var(--lir); }
.note-heart { fill: var(--lir); }

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
.part-word { font-family: "Segoe UI", system-ui, sans-serif; font-size: .8rem; letter-spacing: .3em; text-transform: uppercase; color: var(--muted); margin-right: .6rem; vertical-align: .9em; }
.decide { display: inline-block; border: 2px dashed var(--warn); color: var(--warn); background: var(--warn-bg); border-radius: 6px; padding: 0 .4em; font-size: .88em; font-weight: 600; }
.review-tag { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: var(--sing); border: 1px solid; border-radius: 999px; padding: 0 .4em; margin-left: .3em; white-space: nowrap; }
.closing-box { background: var(--surface); border: 1px solid var(--rule); border-left: 4px solid var(--lir); border-radius: 0 10px 10px 0; padding: .3rem 1.2rem .6rem; margin: 1.4rem 0; break-inside: avoid; }
.closing-box h3 { margin: .6rem 0 .3rem; }
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
.badge.b22 { color: var(--b22); } .badge.b21 { color: var(--b21); } .badge.b20 { color: var(--b20); } .badge.b12 { color: var(--b12); } .badge.b10 { color: var(--b10); } .badge.b08 { color: var(--b08); } .badge.badr { color: var(--badr); }
.sev { font-weight: 700; text-transform: uppercase; font-size: .78rem; }
.sev-error { color: var(--warn); } .sev-warn { color: var(--sing); } .sev-note { color: var(--parse); }

/* Examples */
.exs { margin: .6rem 0 1rem; display: grid; gap: .5rem; }
.ex { background: var(--surface); border: 1px solid var(--rule); border-radius: 8px; padding: .5rem .9rem; break-inside: avoid; }
.ex-l { font-size: 1.12rem; }
.ex-e { color: var(--muted); font-size: .92rem; }

/* Compact lists */
.pairs { line-height: 2; }
.chips { line-height: 1.9; margin: .5rem 0 1rem; }
.chips .gloss, .treasure .gloss { display: inline; margin-left: .2rem; }
.chips strong { margin-right: .4rem; }
.essentials li { margin: .2rem 0; }
.steps li { margin: .25rem 0; }
.sound { color: var(--muted); }
.sound .stress { font-family: Consolas, Menlo, monospace; color: var(--ink); }
.sound .ipa { font-family: "Segoe UI", "Lucida Sans Unicode", "DejaVu Sans", sans-serif; }
.sound .syl { font-size: .82em; }
.sound .stress, .sound .ipa { white-space: nowrap; }
table.roots td:last-child { font-size: .88rem; line-height: 1.7; }
table.roots td:last-child .gloss { display: inline; margin-left: .15rem; }
table.rulings td:first-child { width: 5.5rem; }
ul.treasure { list-style: none; padding: 0; columns: 2 20rem; column-gap: 2rem; }
ul.treasure li { break-inside: avoid; padding: .2rem 0; }
ul.treasure .liraasa { font-size: 1.08em; }
.parts { color: var(--muted); font-size: .82em; }
.parts::before { content: "("; } .parts::after { content: ")"; }

/* First words */
.first-words { background: var(--surface); border: 1px solid var(--rule); border-left: 4px solid var(--lir); border-radius: 0 10px 10px 0; padding: .4rem 1.2rem .6rem; margin: 1.2rem 0; break-inside: avoid; }
.first-words h3 { margin: .5rem 0; }
.first-words ul { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: .2rem 1.5rem; }
.first-words .liraasa { font-size: 1.1em; }
.first-words .gloss, .families .gloss { display: inline; margin-left: .35rem; }
table.grid7 td:first-child { width: 7rem; }
.ruling-index { list-style: none; padding: 0; line-height: 2; }

/* The song */
ol.song { list-style: none; padding: 0; }
.verse { background: var(--surface); border: 1px solid var(--rule); border-radius: 10px; padding: .6rem 1rem .5rem 2.6rem; margin: .7rem 0; position: relative; break-inside: avoid; }
.v-num { position: absolute; left: .9rem; top: .7rem; color: var(--lir); font-family: Georgia, serif; }
.v-g { display: flex; flex-wrap: wrap; gap: .1rem .7rem; margin: 0; }
.w { display: inline-flex; flex-direction: column; }
.w .liraasa { font-size: 1.12rem; }
.w .g { font-size: .74rem; color: var(--muted); line-height: 1.25; }
.v-e { margin: .35rem 0 .1rem; font-style: italic; }
.v-n { margin: .2rem 0 0; font-size: .86rem; color: var(--muted); border-top: 1px dashed var(--rule); padding-top: .3rem; }
.album-track { margin: 1.4rem 0 .6rem; }
.album-title { margin-bottom: .1rem; }
.album-no { color: var(--muted); font-variant-numeric: tabular-nums; margin-right: .3rem; }
.album-en { margin: 0 0 .3rem; font-size: .86rem; color: var(--muted); font-style: italic; }
ol.song.album { font-size: .86em; }
ol.song.album .verse { padding: .3rem .8rem .25rem 2.2rem; margin: .3rem 0; border-radius: 7px; }
ol.song.album .v-num { top: .35rem; left: .7rem; }
ol.song.album .v-n { font-size: .8rem; margin-top: .15rem; padding-top: .15rem; }
ul.glossary { columns: 2 20rem; column-gap: 2rem; font-size: .92rem; }
ul.glossary li { break-inside: avoid; }
.new { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: var(--sing); border: 1px solid; border-radius: 999px; padding: 0 .4em; }
footer.colophon { margin-top: 4rem; padding-top: 1rem; border-top: 1px solid var(--rule); color: var(--muted); font-size: .85rem; }

@media (max-width: 600px) {
  .verse { padding-left: 2rem; }
  th, td { padding: .35rem .4rem; }
}

@page { size: A4; margin: 16mm 14mm 18mm; }
@media print {
  :root, :root[data-theme="dark"] {
    --bg: #ffffff; --surface: #ffffff; --ink: #1a1a1a; --muted: #4f4f4f; --rule: #cfc8bd;
    --lir: #6b2d5c; --accent: #2f4f7a; --accent-soft: #eef2f8;
    --sun: #b0700f; --sun-bg: #fbe9c2; --moon: #3f5f8f; --moon-bg: #e3ebf7;
  }
  body { font-size: 10.5pt; background: #fff; }
  main { max-width: none; padding: 0; }
  .skip { display: none; }
  .cover { min-height: 262mm; break-after: page; }
  .cover-rosette { width: 175mm; }
  .cover-corner { width: 26mm; }
  nav.toc { break-after: page; border: none; padding: 0; }
  .part { break-before: page; margin-top: 0; }
  h3, h4 { break-after: avoid; }
  tr, .ex, .callout, .verse { break-inside: avoid; }
  thead { display: table-header-group; }
  a { color: inherit; text-decoration: none; }
}
`;

/** The Invitation's own pages, on top of the shared stylesheet: roomier, one idea per page. */
export const INVITATION_CSS = `
body.invitation { font-size: 17px; line-height: 1.65; }
.invitation main { max-width: 46rem; }
.invitation .cover h1 { font-size: clamp(3rem, 10vw, 5.4rem); }
.invitation .cover h1 .liraasa { display: block; }
.h1-sub { display: block; font-size: .38em; letter-spacing: .32em; text-transform: uppercase; color: var(--muted); margin-top: .8rem; }
.page { margin-top: 4.5rem; }
.page h2 { font-family: "Palatino Linotype", Palatino, Georgia, serif; font-weight: 400; font-size: 2.1rem; line-height: 1.2; margin: .2rem 0 1rem; color: var(--lir); }
.page-eyebrow { letter-spacing: .3em; text-transform: uppercase; font-size: .78rem; color: var(--muted); margin: 0; }
.page h3 { color: var(--accent); font-size: 1.2rem; margin: 1.6rem 0 .4rem; }

.sentence { margin: 1rem 0; padding: .7rem 1rem; background: var(--surface); border: 1px solid var(--rule); border-left: 4px solid var(--lir); border-radius: 0 10px 10px 0; break-inside: avoid; }
.sentence figcaption { margin-top: .35rem; }
.s-e { font-style: italic; }
.s-src { color: var(--muted); font-size: .8rem; letter-spacing: .04em; white-space: nowrap; }
.s-src::before { content: "— "; }
.s-n { display: block; margin-top: .3rem; padding-top: .3rem; border-top: 1px dashed var(--rule); color: var(--muted); font-size: .9rem; }

.name-line { font-size: 1.9rem; text-align: center; margin: .6rem 0; }
.name-gloss { display: block; font-size: 1rem; color: var(--muted); font-style: italic; }
.listen, .singing { margin: 1.4rem 0; padding: .7rem 1.1rem; border-radius: 10px; background: var(--sing-bg); border: 1px solid var(--sing); break-inside: avoid; }
.album { display: flex; gap: 1rem; align-items: center; }
.album > div { flex: 1; }
.album .qr { flex: none; width: 5.5rem; height: 5.5rem; border-radius: 4px; }
a.url { overflow-wrap: anywhere; font-size: .86rem; }
.big-verse { margin: 1.4rem 0 1.6rem; padding: 1.2rem 1.4rem; background: var(--surface); border: 1px solid var(--rule); border-left: 4px solid var(--lir); border-radius: 0 12px 12px 0; }
.big-line { margin: 0 0 1rem; }
.big-line .liraasa { display: block; font-size: 1.55rem; line-height: 1.35; }
.big-en { display: block; font-style: italic; color: var(--muted); margin-top: .2rem; }
.big-verse figcaption { font-size: .8rem; color: var(--muted); letter-spacing: .04em; }
.lyric-sub { font-style: italic; color: var(--muted); margin-top: -.6rem; }
table.lyrics { background: none; font-size: .88rem; line-height: 1.38; }
table.lyrics th, table.lyrics td { border-bottom: 1px dotted var(--rule); padding: .2rem .45rem; }
table.lyrics td.ly-l { width: 52%; }
table.lyrics thead th { background: none; font-size: .75rem; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
td.ly-n { width: 1.8rem; color: var(--lir); font-family: Georgia, serif; text-align: right; }
td.ly-l .liraasa { font-size: 1rem; }
td.ly-e { font-style: italic; color: var(--ink); }
.credits { margin-top: 1.6rem; padding-top: .8rem; border-top: 1px solid var(--rule); font-size: .9rem; color: var(--muted); }
@media (max-width: 520px) { .album { flex-direction: column; align-items: flex-start; } }
.listen-head { margin: 0 0 .2rem; font-weight: 700; font-size: .8rem; letter-spacing: .12em; text-transform: uppercase; color: var(--sing); }

ul.cards { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr)); gap: .8rem; }
.card { background: var(--surface); border: 1px solid var(--rule); border-radius: 10px; padding: .6rem .9rem; break-inside: avoid; }
.card-word .liraasa { font-size: 1.35rem; }
.card-parts { display: block; font-size: .82rem; color: var(--muted); }
.card-meaning { display: block; margin-top: .2rem; }

.sound-list li { margin: .4rem 0; }
figure.beats { margin: 1.2rem 0; }
figure.beats table { width: auto; background: none; }
figure.beats caption { font-size: 1.05rem; color: var(--ink); }
figure.beats td { border: none; text-align: center; padding: .2rem .35rem; font-family: "Palatino Linotype", Palatino, Georgia, serif; }
figure.beats td.wstart { border-left: 1px solid var(--rule); }
figure.beats .beat { display: block; color: var(--sun); font-size: 1.1rem; line-height: 1; }
figure.beats td.strong .syl { font-weight: 700; color: var(--lir); }
figure.beats td.weak .syl { color: var(--muted); }
figure.beats figcaption { font-size: .88rem; color: var(--muted); }
.beat-text { font-family: Consolas, Menlo, monospace; color: var(--ink); }
.beats-head { margin: 0 0 .2rem; font-size: 1.15rem; }
.beats-head .gloss { display: inline; margin-left: .4rem; font-size: .85rem; }
.invitation ol.song { font-size: .95em; }
.invitation .verse { padding: .35rem .9rem .3rem 2.3rem; margin: .4rem 0; }
.invitation .v-num { top: .45rem; left: .8rem; }
.invitation .v-e { margin: .2rem 0 0; }
.invitation .v-n { font-size: .82rem; margin-top: .15rem; padding-top: .15rem; }
.invitation .closing-box { margin-top: .8rem; padding-bottom: .3rem; }
.invitation ul.glossary { font-size: .84rem; margin: .2rem 0; }

ul.wheel { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); gap: .6rem; }
.shape { background: var(--surface); border: 1px solid var(--rule); border-radius: 10px; padding: .5rem .8rem; }
.shape.s-root { border: 2px solid var(--lir); }
.shape-label { display: block; font-size: .74rem; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.shape .liraasa { font-size: 1.3rem; }
.shape-gloss { display: block; font-size: .88rem; }

.equation { font-size: 1.3rem; text-align: center; margin: 1rem 0; }
.equation .gloss, .equations .gloss, .engine .gloss, .tryit .gloss { display: inline; margin: 0 .2rem; }
ul.equations, ul.engine { list-style: none; padding: 0; }
ul.equations li, ul.engine li { padding: .3rem 0; border-bottom: 1px dotted var(--rule); }
.ie-parts { color: var(--muted); font-size: .85rem; margin-left: .3rem; }
.ie-reading { display: block; font-size: .92rem; }

.tryit { margin: 1.4rem 0; padding: .6rem 1.1rem .8rem; border: 2px dashed var(--accent); border-radius: 12px; break-inside: avoid; }
.tryit h3 { margin-top: .3rem; }
.blank { display: inline-block; min-width: 6rem; border-bottom: 1.5px solid var(--ink); text-align: center; color: var(--muted); }
.answers { margin: .8rem 0 0; font-size: .82rem; color: var(--muted); text-align: right; }
.flip { display: inline-block; transform: rotate(180deg); }

table.owners { width: auto; min-width: 60%; }
.exchange { margin: .5rem 0; }
.turn { display: flex; gap: .7rem; align-items: flex-start; }
.turn .sentence { flex: 1; margin: .4rem 0; }
.who { flex: none; width: 2rem; height: 2rem; border-radius: 50%; background: var(--accent-soft); color: var(--accent); font-weight: 700; display: flex; align-items: center; justify-content: center; margin-top: .9rem; }
.stage { font-style: italic; color: var(--muted); text-align: center; margin: .3rem 0; }
ul.first-words-list { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: .2rem 1.2rem; }
ul.first-words-list .liraasa { font-size: 1.15rem; }
ul.first-words-list .gloss { display: inline; margin-left: .3rem; }
ul.next li { margin: .8rem 0; }
.farewell { text-align: center; font-size: 1.6rem; margin-top: 3rem; }
.farewell .gloss { font-size: .9rem; }

.cheat { display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; }
.cheat section { background: var(--surface); border: 1px solid var(--rule); border-radius: 10px; padding: .3rem 1rem .6rem; }
.cheat h3 { margin-top: .5rem; }
.cheat ul { padding-left: 1.1rem; margin: .2rem 0; }
.cheat .gloss { display: inline; margin-left: .3rem; }
.order { font-size: 1.05rem; }

@media print {
  body.invitation { font-size: 11.5pt; }
  .page { break-before: page; margin-top: 0; }
  .sentence, .card, .shape, .tryit, .turn { break-inside: avoid; }
  .cheat section { break-inside: avoid; }
}
`;
