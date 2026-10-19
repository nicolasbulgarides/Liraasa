/**
 * Liraasa: An Invitation. A short, shareable introduction for a curious
 * outsider: how it sounds, how to say hello, how one root becomes seven
 * words, how words make words, just enough grammar to read the Goddess's
 * Lament, and then the Lament itself, first as a lyric sheet and then word
 * by word.
 *
 * The song carries the document: each idea is met in a line of it first.
 * Every taught sentence is shown the same way (Liraasa, a gloss under each
 * word, the English, and sometimes a note), and every gloss is read from the
 * lexicon. What the booklet shows differently from the lexicon (a shortened
 * gloss, a dropped parenthesis) and any sentence that is neither canon nor a
 * line of the song is registered for the author's review. The prose avoids
 * grammar terms on purpose; the build fails if one slips in (see `JARGON`).
 */
import { syllabify } from '../../src/core/phonetics/g2p';
import { CODEX, INVITATION, codexUrl } from './config';
import {
  canonTexts,
  firstSense,
  formOf,
  glossOf,
  isCanonText,
  isUsed,
  normGloss,
  respelledAs,
  tokenize,
  type Headword,
  type Index,
} from './data';
import { esc, forReview, lir, md, morph } from './html';
import { qrSvg } from './qr';
import { PLAIN_STYLE, interlinear, readSong, songVerses, type GlossStyle, type Note } from './song';

/**
 * Words the Invitation must never use, and ruling ids: they belong to the
 * Reference Grammar. Matched against the page's visible text.
 */
export const JARGON = [
  /\bslots?\b/i,
  /\boperators?\b/i,
  /\bvalenc(y|ies)\b/i,
  /\bevidentials?\b/i,
  /\bmiratives?\b/i,
  /\bframes?\b/i,
  /\bADRs?\b/,
  /\b\d\.\d:[GR]\d+\b/,
];

/** The booklet's ink for its QR codes: the Liraasa plum, dark enough on white to scan. */
const QR_INK = '#6b2d5c';

function byId(index: Index, id: string): Headword {
  const h = index.byId.get(id);
  if (h === undefined) throw new Error(`invitation config: ${id} is not a headword`);
  return h;
}

/** 1767 → “1,767”. */
function n(x: number): string {
  return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** One page of the booklet: a heading, an optional line above it, the body. */
function page(id: string, title: string, body: string, eyebrow = ''): string {
  return `<section class="page" aria-labelledby="${id}">
${eyebrow === '' ? '' : `<p class="page-eyebrow">${esc(eyebrow)}</p>`}<h2 id="${id}">${md(title)}</h2>
${body}
</section>`;
}

const p = (text: string): string => `<p>${md(text)}</p>`;

/** A link that shows its own address, so it survives printing; clickable in the PDF. */
function link(url: string, text = url.replace(/^https:\/\//, '')): string {
  return `<a class="url" href="${esc(url)}">${esc(text)}</a>`;
}

// --------------------------------------------------------- display glosses

/**
 * The booklet's way of showing glosses: plain words for the small words, the
 * author-approved overrides from config, and every difference from the
 * lexicon reported once for review.
 */
function displayStyle(): GlossStyle {
  const reported = new Set<string>();
  return {
    ...PLAIN_STYLE,
    overrides: INVITATION.displayGlosses,
    shown: (token, lexicon, display) => {
      if (reported.has(token)) return;
      reported.add(token);
      forReview(token, `shown as “${display}”; the lexicon has “${lexicon}”`, 'Invitation, gloss');
    },
  };
}

/** A whole gloss as the booklet shows it: the override, or the lexicon's without asides. */
function showGloss(style: GlossStyle, form: string, lexicon: string): string {
  const override = style.overrides?.[form];
  const display = override ?? normGloss(lexicon).replace(/\s*\([^)]*\)/g, '');
  if (display !== normGloss(lexicon)) style.shown?.(form, lexicon, display);
  return display;
}

// ------------------------------------------------------------- sentences

/**
 * Sentences the Invitation may show as they are: canon, or a line of the
 * author's song. Anything else is shown but registered for review.
 */
function sentenceCheck(index: Index): (liraasa: string, english: string, where: string) => void {
  const canon = [
    ...canonTexts(index.lex),
    ...readSong().lines.map((l) => ` ${tokenize(l.liraasa).join(' ')} `),
  ];
  return (liraasa, english, where) => {
    if (!isCanonText(canon, liraasa)) forReview(liraasa, english, where);
  };
}

interface Ctx {
  index: Index;
  style: GlossStyle;
  check: (liraasa: string, english: string, where: string) => void;
}

/** Liraasa / gloss / English, and an optional note: every taught sentence looks like this. */
function sentence(c: Ctx, liraasa: string, english: string, note = '', source = ''): string {
  return `<figure class="sentence">${interlinear(c.index, liraasa, c.style)}
<figcaption><span class="s-e">${esc(english)}</span>${source === '' ? '' : ` <span class="s-src">${esc(source)}</span>`}${
    note === '' ? '' : `<span class="s-n">${md(note)}</span>`
  }</figcaption></figure>`;
}

/** The line of the Lament containing `word`, with its number; the build fails if none does. */
function songLine(word: string): { at: number; liraasa: string; english: string } {
  const lines = readSong().lines;
  const at = lines.findIndex((l) => tokenize(l.liraasa).includes(word));
  const line = lines[at];
  if (line === undefined) throw new Error(`invitation: no line of the song has "${word}"`);
  return { at: at + 1, ...line };
}

/** A line of the Lament by a word it contains, as a taught sentence. */
function lamentLine(c: Ctx, word: string, note = ''): string {
  const { at, liraasa, english } = songLine(word);
  return sentence(c, liraasa, english, note, `The Lament, line ${String(at)}`);
}

/** The four motif words, sun, heart, moon and song, by id: a respelling carries through. */
const MOTIF = ['lx_sulba_0853', 'lx_lore_0286', 'lx_luno_0310', 'lx_lira_0272'] as const;

/** “`solanevra`, sun + descent, is sunset”, read from the lexicon. */
function compoundNote(index: Index, root: string): string {
  const h = index.byRoot.get(root);
  if (h?.components === undefined || h.components === null) {
    throw new Error(`${root} is not a compound headword`);
  }
  const [a, b] = h.components;
  return `\`${h.root}\`, ${index.senseOf(a)} + ${index.senseOf(b)}, is ${firstSense(normGloss(glossOf(h, 'root')))}`;
}

// ------------------------------------------------------------------ pages

function cover(index: Index, emblemSvg: string): string {
  const motif = MOTIF.map((id) => {
    const h = byId(index, id);
    return [h.root, firstSense(glossOf(h, 'root')).toLowerCase()] as const;
  });
  return `<header class="cover">
<div class="cover-inner">
${emblemSvg}
<p class="motif">${motif.map(([w]) => lir(w)).join('<span class="sep" aria-hidden="true"> · </span>')}<span class="motif-en">${motif.map(([, e]) => esc(e)).join(' · ')}</span></p>
<h1>${lir('Liraasa')}<span class="h1-sub">An Invitation</span></h1>
<p class="sub">To a language made for singing</p>
</div>
</header>`;
}

/** The album, its link and a small QR code. */
function album(lead: string): string {
  return `<div class="album"><div>${lead}<p>${link(INVITATION.albumUrl)}</p></div>${qrSvg(
    INVITATION.albumUrl,
    `QR code: ${INVITATION.album} on Apple Music`,
    QR_INK,
  )}</div>`;
}

function opening(c: Ctx): string {
  const lira = byId(c.index, 'lx_lira_0272');
  // the song first, as a singer would meet it: no glosses yet
  const verse = ['lunosavali', 'velumelo']
    .map((w) => {
      const { liraasa, english } = songLine(w);
      return `<p class="big-line">${lir(liraasa, 'older')}<span class="big-en">${esc(english)}</span></p>`;
    })
    .join('\n');
  return page(
    'opening',
    'A song before anything else',
    `<figure class="big-verse">${verse}<figcaption>The Goddess’s Lament, lines 12 and 13</figcaption></figure>
${p('These two lines come from *Nemelira de devi*, The Goddess’s Lament. A goddess sings to the one she loves, who fell from the sky and became mortal. By the end of this booklet you will read the whole song, word by word.')}
<h3>The name</h3>
<p class="name-line">${lir(formOf(lira, 'ascended'))} <span class="name-gloss">“${esc(glossOf(lira, 'ascended'))}”</span></p>
${p(
  `The word for song is \`lira\`. Raised to its highest degree it becomes \`${formOf(lira, 'ascended')}\`, ${glossOf(lira, 'ascended')}, and that is the language’s name. Four words carry most of its imagery: ${MOTIF.map(
    (id) => {
      const h = byId(c.index, id);
      return `\`${h.root}\` ${firstSense(glossOf(h, 'root')).toLowerCase()}`;
    },
  ).join(', ')}.`,
)}
${p('Liraasa is a language centred on a goddess, and it was built for singing. Its vowels are pure, most of its words end on an open vowel, and every word leans on the same syllable, so a melody always knows where to land.')}
<aside class="listen"><p class="listen-head">Listen first</p>
${album(`<p>The album <em>${esc(INVITATION.album)}</em> sets Liraasa to music. Hear a song before you read about one.</p>`)}</aside>`,
  );
}

function untranslatables(c: Ctx): string {
  const cards = INVITATION.untranslatables
    .map((id) => {
      const h = byId(c.index, id);
      const [a, b] = h.components ?? ['', ''];
      return `<li class="card"><span class="card-word">${lir(h.root)}</span>
<span class="card-parts">${lir(a)} ${esc(c.index.senseOf(a))} + ${lir(b)} ${esc(c.index.senseOf(b))}</span>
<span class="card-meaning">${esc(showGloss(c.style, h.root, glossOf(h, 'root')))}</span></li>`;
    })
    .join('\n');
  return page(
    'untranslatables',
    'Words English doesn’t have',
    `${p('Some feelings take English a whole sentence. Liraasa gives them a word, and each word is two older words joined, so you can see how the meaning was made.')}
<ul class="cards">${cards}</ul>`,
  );
}

/**
 * A Lament phrase on a beat grid: the stressed syllable of every longer word
 * takes a strong beat. The build fails unless the strong beats fall evenly,
 * and the text says how far apart they are.
 */
function beatGrid(phrase: string, english: string): string {
  const cells = phrase.split(/\s+/).flatMap((raw) => {
    const word = tokenize(raw)[0] ?? '';
    const { syllables, stressIndex } = syllabify(word);
    return syllables.map((s, i) => ({
      text: s.text,
      strong: syllables.length > 1 && i === stressIndex,
      first: i === 0,
    }));
  });
  const strong = cells.flatMap((x, i) => (x.strong ? [i] : []));
  const gaps = strong.slice(1).map((x, i) => x - (strong[i] ?? 0));
  const gap = gaps[0];
  if (gap === undefined || !gaps.every((g) => g === gap)) {
    throw new Error(`beat line "${phrase}": its strong beats are uneven (${gaps.join(', ')})`);
  }
  const metre = { 2: 'in two, like a march', 3: 'in three, like a waltz', 4: 'in four' }[gap];
  if (metre === undefined)
    throw new Error(`beat line "${phrase}": strong beats ${String(gap)} apart`);
  const row = cells
    .map(
      (x) =>
        `<td class="${x.strong ? 'strong' : 'weak'}${x.first ? ' wstart' : ''}"><span class="beat" aria-hidden="true">${x.strong ? '●' : '·'}</span><span class="syl">${esc(x.text)}</span></td>`,
    )
    .join('');
  const spoken = cells.map((x) => (x.strong ? x.text.toUpperCase() : x.text)).join(' ');
  // the phrase itself goes through lir(), so the word check sees it
  return `<figure class="beats"><p class="beats-head">${lir(phrase)} <span class="gloss">${esc(english)}: one way to set it</span></p><div class="table-wrap"><table><tbody><tr>${row}</tr></tbody></table></div>
<figcaption>The big dots are the strong beats: <span class="beat-text">${esc(spoken)}</span>. They fall on every ${gap === 2 ? 'second' : gap === 3 ? 'third' : 'fourth'} syllable, so the line moves ${metre}.</figcaption></figure>`;
}

function sound(): string {
  const [phrase, english] = INVITATION.beatLine;
  return page(
    'sound',
    'How it sounds',
    `${p('Liraasa is spelled exactly as it is sung. Nothing is silent, and nothing changes its sound from one word to the next.')}
<ul class="sound-list">
<li><strong>Five pure vowels</strong>, <em>a e i o u</em>, as in Italian or Spanish. Every vowel is its own syllable: ${lir('daigo')} is da-i-go, three syllables.</li>
<li><strong>Three letters to watch.</strong> <em>c</em> is always “ch”: ${lir('cilni')}, city, is “chil-ni”. <em>r</em> is a single tap of the tongue, as in Spanish <em>pero</em>. <em>g</em> is always hard, as in “go”: ${lir('gase')}.</li>
<li><strong>The weight falls on the second-to-last syllable</strong>: LI-ra, lu-no-LU-mi, ma-I-vo.</li>
</ul>
${beatGrid(phrase, english)}
${p('Every word falls from its strong syllable to a light last one, and the small words are light all through. Put the strong syllables on the strong beats and the line sings itself.')}
<aside class="singing"><p class="listen-head">A singer’s freedom</p>
${p('In song, neighbouring vowels may share one note. `daigo` can be sung da-i-go or dai-go; `navuasa`, the firmament, na-vu-a-sa or na-vua-sa. The spelling never changes. The melody chooses.')}</aside>`,
  );
}

function hello(c: Ctx): string {
  const lex = c.index.lex;
  const first = ['yeko', 'voge', 'zabo', 'kepi', 'fisa', 'yade', 'lorejuba']
    .map((f) => {
      const w = lex.function_words.find((x) => x.form === f);
      if (w === undefined) throw new Error(`function word ${f} is missing`);
      return `<li>${lir(f)} <span class="gloss">${esc(showGloss(c.style, f, w.meaning))}</span></li>`;
    })
    .join('');
  const exchange: readonly (readonly [string, string, string])[] = [
    ['A', 'Yeko, sora!', 'Hello, friend!'],
    ['B', 'Yeko! Taivo lirala ki?', 'Hello! Do you sing?'],
    ['A', 'Zabo. Maivo lirala muya-krono.', 'Yes. I sing often.'],
    ['B', 'Fisa, lirala!', 'Please sing!'],
    ['B', 'Lorejuba ala taivo.', 'Thank you, from the heart.'],
    ['A', 'Voge, sora.', 'Goodbye, friend.'],
  ];
  // the exchange is new as a whole, even where a line is canon: all of it waits for review
  for (const [, l, e] of exchange) forReview(l, e, 'Invitation, saying hello');
  const lines = exchange
    .map(
      ([who, l, e], i) =>
        `${i === 4 ? '<p class="stage">A sings.</p>' : ''}<div class="turn"><span class="who" aria-label="Speaker ${who}">${who}</span>${sentence(c, l, e)}</div>`,
    )
    .join('\n');
  return page(
    'hello',
    'Saying hello',
    `<ul class="first-words-list">${first}</ul>
${p('And a first conversation. Under each word is its meaning; the pages that follow show how the words are built.')}
<div class="exchange">${lines}</div>`,
  );
}

/** Plain names for the seven shapes, for a reader who has met none of them. */
const SHAPES: readonly (readonly [
  string,
  (
    | 'root'
    | 'ascended'
    | 'negative'
    | 'verb'
    | 'adjective'
    | 'ascendedAdjective'
    | 'negativeAdjective'
  ),
  string,
])[] = [
  ['the thing itself', 'root', ''],
  ['raised to its highest', 'ascended', '-asa'],
  ['turned around', 'negative', '-na'],
  ['to do it', 'verb', ''],
  ['describing', 'adjective', '-san'],
  ['describing, raised', 'ascendedAdjective', '-asasan'],
  ['describing, turned', 'negativeAdjective', '-nasan'],
];

function sevenWords(c: Ctx): string {
  const root = byId(c.index, INVITATION.sevenFormsRoot);
  const empty = byId(c.index, INVITATION.emptyCellRoot);
  if (isUsed(empty, 'verb')) {
    throw new Error(`${empty.root} now has a verb: choose another empty shape`);
  }
  const wheel = SHAPES.map(([label, slot, ending]) => {
    if (!isUsed(root, slot)) throw new Error(`${root.root} has no ${slot}: choose another root`);
    const form = formOf(root, slot);
    return `<li class="shape s-${slot}"><span class="shape-label">${esc(label)}${ending === '' ? '' : ` ${morph(ending)}`}</span>${lir(form)}<span class="shape-gloss">${esc(showGloss(c.style, form, glossOf(root, slot)))}</span></li>`;
  }).join('');
  const emptyMeaning = firstSense(glossOf(empty, 'root')).toLowerCase();
  return page(
    'seven',
    'One root, seven words',
    `${lamentLine(c, 'sulnosia', 'Death is a door, and so is the word for it: `daigo` opens onto six more.')}
${p(`Every root in Liraasa can take seven shapes. Here is \`${root.root}\`, ${firstSense(glossOf(root, 'root')).toLowerCase()}, in all of them:`)}
<ul class="wheel">${wheel}</ul>
${p(`The shapes are made by rule, but each meaning is the language’s own: the highest degree of death is the final death, and death turned around is \`${formOf(root, 'negative')}\`, resurrection.`)}
<p>${md(`Not every root fills every shape. A shape is a word only when the language has given it a meaning: \`${empty.root}\`, ${emptyMeaning}, has no verb, and`)} ${lir(formOf(empty, 'verb'), 'unused-slot')} ${md('stays empty.')}</p>
<h3>A word, not a “not”</h3>
${p(`\`${formOf(root, 'negative')}\` is a word of its own, resurrection, not “no death”. To say *not*, Liraasa uses a separate small word, \`ne\`, set just before what it denies:`)}
${lamentLine(c, 'kronorivla')}`,
  );
}

function compounds(c: Ctx): string {
  const { index } = c;
  const lunolumi = index.patterns.get('lunolumi');
  if (lunolumi === undefined) throw new Error('lunolumi is no longer a word of the pattern');
  // the song's own words; a word 2.1 respelled is shown in its 2.1 spelling (2.1:G58)
  const fromSong = ['solanevra', 'kronorivla', 'velumelo', 'ramuduha', 'velusolo']
    .map((w) => {
      const h = index.byRoot.get(respelledAs(index.lex, w) ?? w);
      if (h?.components === undefined || h.components === null) {
        throw new Error(`${w} is not a compound headword`);
      }
      const [a, b] = h.components;
      return `<li>${lir(a)} <span class="gloss">${esc(index.senseOf(a))}</span> + ${lir(b)} <span class="gloss">${esc(index.senseOf(b))}</span> = ${lir(h.root)} <span class="gloss">${esc(showGloss(c.style, h.root, glossOf(h, 'root')))}</span></li>`;
    })
    .join('');
  const soul = index.byRoot.get('mavolumi');
  const bond = index.byId.get('lx_mavolumitilma_1591');
  if (soul === undefined || bond === undefined) {
    throw new Error('mavolumi or the soulbond (lx_mavolumitilma_1591) is gone');
  }
  const [m1, m2] = soul.components ?? ['', ''];
  const [, b2] = bond.components ?? ['', ''];
  return page(
    'compounds',
    'Words from words',
    `${p('Two words make a third. The second word is what the thing *is*; the first tells you what kind.')}
<p class="equation">${lir('luno')} <span class="gloss">moon</span> + ${lir('lumi')} <span class="gloss">light</span> = ${lir('lunolumi')} <span class="gloss">${esc(showGloss(c.style, 'lunolumi', lunolumi.reading))}</span></p>
${p('The Lament is full of them:')}
<ul class="equations">${fromSong}</ul>
${p(`A word made this way can be used again. \`${soul.root}\`, soul, is \`${m1}\` ${index.senseOf(m1)} + \`${m2}\` ${index.senseOf(m2)}: the light of the mind. Add \`${b2}\`, ${index.senseOf(b2)}, and you have \`${bond.root}\`, a soulbond.`)}`,
  );
}

function pairOf(index: Index, modId: string, headId: string) {
  const spelling = byId(index, modId).root + byId(index, headId).root;
  const pair = index.patterns.get(spelling);
  if (pair === undefined) {
    throw new Error(`invitation config: ${modId} + ${headId} is not an image pair`);
  }
  const clash = (index.forms.get(spelling) ?? []).some(
    (hit) => !pair.attested || hit.headword.root !== spelling,
  );
  if (clash) throw new Error(`invitation config: ${spelling} collides with another form`);
  return pair;
}

function imageEngine(c: Ctx): string {
  const { index } = c;
  const ic = index.lex.image_compounds;
  if (ic === undefined) throw new Error('this lexicon has no image compounds');
  const mods = Object.keys(ic.modifiers).length;
  const heads = Object.keys(ic.heads).length;
  const rows = INVITATION.imageExamples
    .map(([m, h]) => {
      const pair = pairOf(index, m, h);
      if (pair.spelling === 'lunosavali') throw new Error('lunosavali is in the running text');
      return `<li>${lir(pair.spelling)} <span class="ie-parts">${esc(ic.modifiers[m]?.as_modifier ?? '')} + ${esc(index.senseOf(pair.head.root))}</span><span class="ie-reading">${esc(showGloss(c.style, pair.spelling, pair.reading))}</span></li>`;
    })
    .join('');
  const tries = INVITATION.tryPairs.map(([m, h]) => ({ pair: pairOf(index, m, h), m }));
  const questions = tries
    .map(
      ({ pair, m }, i) =>
        `<li>${lir(pair.modifier.root)} <span class="gloss">${esc(ic.modifiers[m]?.as_modifier ?? '')}</span> + ${lir(pair.head.root)} <span class="gloss">${esc(index.senseOf(pair.head.root))}</span> = <span class="blank" aria-label="answer ${String(i + 1)} at the foot of the box">?</span></li>`,
    )
    .join('');
  const answers = tries
    .map(
      ({ pair }, i) =>
        `${String(i + 1)}. ${lir(pair.spelling)}: ${esc(showGloss(c.style, pair.spelling, pair.reading))}`,
    )
    .join(' · ');
  return page(
    'engine',
    'The image engine',
    `${p(`Some words join so often that Liraasa lets them pair freely. Take any of ${String(mods)} words for a colour, a season or a feeling, and any of ${String(heads)} words for a thing: every pair is a word, ${n(mods * heads)} in all, and you can read its meaning straight off its parts.`)}
${p('The first word lends its colour; the second is the thing. So `lunosavali`, moon + kiss, is the moonlit kiss of the Lament, and here are a few more:')}
<ul class="engine">${rows}</ul>
<aside class="tryit" aria-labelledby="try1"><h3 id="try1">Try it</h3>
${p('Join each pair into one word, and say what it means.')}
<ol>${questions}</ol>
<p class="answers"><span class="visually-hidden">Answers: </span><span class="flip">${answers}</span></p></aside>`,
  );
}

function grammarOne(c: Ctx): string {
  // Saying hello already used “Taivo lirala ki?”; this one echoes the song
  const questions: readonly (readonly [string, string])[] = [
    ['Taivo futu relnura ki?', 'Will you come back?'],
  ];
  for (const [l, e] of questions) c.check(l, e, 'Invitation, questions');
  return page(
    'grammar-1',
    'Just enough grammar to read a song',
    `<h3>The order is English order</h3>
${p('Who, then what happens, then to what. The describing word comes first: `daigosan yuge`, a mortal body.')}
${lamentLine(c, 'yugeya')}
<h3>Two ways to say “is”</h3>
${p('`ka` is for what is so by nature; `ke` is for what is so for now. English needs a phrase for what Liraasa says in one small word.')}
${lamentLine(c, 'mavolumi', 'The soul is starlit for ever (`ka`); the body is wounded for a while (`ke`).')}
<h3>“Not” goes first</h3>
${p('`ne` stands just before what it denies. Before `povi`, can, it makes *cannot*.')}
${lamentLine(c, 'povi')}
<h3>A question ends in ${lir('ki')}</h3>
${p('Say it as a statement, then add `ki`.')}
${questions.map(([l, e]) => sentence(c, l, e)).join('\n')}`,
  );
}

function grammarTwo(c: Ctx): string {
  const ownerRows: readonly (readonly [string, string])[] = [
    ['maivo de lira', 'my song'],
    ['taivo de lira', 'your song'],
    ['pilo de bumre', 'father’s bread'],
    ['li bumre de li cilni', 'the bread of the city'],
  ];
  for (const [l, e] of ownerRows) c.check(l, e, 'Invitation, “de” table');
  const owners = ownerRows
    .map(([l, e]) => `<tr><td>${lir(l)}</td><td>${esc(e)}</td></tr>`)
    .join('');
  return page(
    'grammar-2',
    'Past, future, and “of”',
    `<h3>Past and future are small words</h3>
${p('A verb never changes its ending for time. `po` before it means it happened; `futu` means it will. With neither, it is happening now.')}
${lamentLine(c, 'lektaasa', 'The song begins with `po`, she *descended*, and ends with `futu` twice: I *will* embrace you, the reunion *will* come.')}
<h3>Whose is it?</h3>
${p('`de` means *of*. Usually the owner comes second, as in English “the bread of the city”. But when the first word is a person, *I*, *you* or someone’s name, that person is the owner.')}
<div class="table-wrap"><table class="owners"><thead><tr><th scope="col">Liraasa</th><th scope="col">English</th></tr></thead><tbody>${owners}</tbody></table></div>
${p('That is how the Lament opens: `Maivo de amor`, my love.')}
<aside class="tryit" aria-labelledby="try2"><h3 id="try2">Try it</h3>
${p('The Goddess says `maivo de amor`, my love. How does she say *your heart*? (Heart is `lore`.)')}
<p class="answers"><span class="visually-hidden">Answer: </span><span class="flip">${lir('taivo de lore')}, as in line 8 of the Lament</span></p></aside>`,
  );
}

/** The whole song as an album insert: Liraasa beside English, nothing else. */
function lyricSheet(): string {
  const { title, englishTitle, lines } = readSong();
  const rows = lines
    .map(
      (l, i) =>
        `<tr><td class="ly-n" aria-hidden="true">${String(i + 1)}</td><td class="ly-l">${lir(l.liraasa, 'older')}</td><td class="ly-e">${esc(l.english)}</td></tr>`,
    )
    .join('\n');
  return page(
    'lyrics',
    `\`${title}\``,
    `<p class="lyric-sub">${esc(englishTitle)}</p>
<div class="table-wrap"><table class="lyrics"><thead><tr><th scope="col"><span class="visually-hidden">Line</span></th><th scope="col">Liraasa</th><th scope="col">English</th></tr></thead><tbody>${rows}</tbody></table></div>
${p('Sing it through once. The pages that follow take it word by word.')}`,
    'The song',
  );
}

/**
 * The Lament's notes. Lines the earlier pages already taught get one short
 * line; the rest keep a fuller note. Compound notes are read from the lexicon.
 */
function lamentNotes(index: Index): readonly Note[] {
  return [
    [
      'navuasa',
      '`Maivo de amor`, my love: the Goddess is speaking. `navuasa` is `navu`, sky, raised to its highest: the firmament. `gase baba` …, like a …, makes a simile.',
    ],
    ['yugeya', 'A mortal body: the describing word comes first.'],
    [
      'cilniri',
      '`-ri` makes more than one: `cilni`, city, `cilniri`, cities; `nela`, person, `nelari`, people.',
    ],
    ['mavolumi', '`ka` by nature, `ke` for now.'],
    [
      'vuda',
      '`vuda` tells you how the singer knows: she sees this in a dream. `raho`, which, begins a description of the tears.',
    ],
    ['kronorivla', '`ne` comes right before what it denies.'],
    ['vemineme', `${compoundNote(index, 'lorenuravu')}; ${compoundNote(index, 'vemineme')}.`],
    [
      'solanevra',
      '`vobi`, for, and `hupi`, above, come before what they govern. `solanevra`, sun + going down, is sunset.',
    ],
    ['povi', '`ne povi`: cannot.'],
    ['sulnosia', '`lumiasa`: Her Divine Light, the Goddess’s own light.'],
    ['lunosavali', '`lunosavali`: the moonlit kiss.'],
    ['velumelo', '`velumelo`: the music of the spheres.'],
    [
      'vamrisevu',
      '`gase` … `gase` … is “as … as …”. `vamrisevu`, space + sea, is the dark between the stars.',
    ],
    [
      'nolsakerso',
      `\`kersoka\`, to grow, is the verb of \`kerso\`, growth; ${compoundNote(index, 'nolsakerso')}.`,
    ],
    ['lektaasa', '`futu` twice: the song ends in the future.'],
  ];
}

function lament(c: Ctx): string {
  const { title, englishTitle } = readSong();
  return page(
    'lament',
    `\`${title}\`, word by word`,
    `${p(`*${englishTitle}* again, now with its meaning under every word. ASC marks a word raised to its highest, PL more than one.`)}
${songVerses(c.index, c.style, lamentNotes(c.index))}`,
    'The centrepiece',
  );
}

/** Who made Liraasa and where to find it: on the last two pages. */
function credits(): string {
  return `<p class="credits">Liraasa was created by ${esc(INVITATION.author)}. Follow the language, read its source, or get in touch on GitHub: ${link(CODEX.repoUrl)}</p>`;
}

function nextSteps(index: Index): string {
  const lex = index.lex;
  const ic = lex.image_compounds;
  return page(
    'next',
    'Where to go next',
    `<ul class="next">
<li><strong>The Liraasa ${esc(lex.version)} Reference Grammar.</strong> Everything this booklet left out: every rule, how to say almost anything from English, the numbers and colours, and a treasury of words for songwriters. ${link(codexUrl(CODEX.stable.reference))}</li>
<li>${album(`<p><strong>The album, <em>${esc(INVITATION.album)}</em>.</strong> Listen on Apple Music.</p>`)}</li>
<li><strong>The Liraasa lexicon.</strong> ${n(lex.headwords.length)} words${ic === undefined ? '' : `, and the image engine’s ${n(ic.capacity)} more`}, each in its seven shapes, with the whole grammar, in one file built for reading and for language tools. ${link(codexUrl(CODEX.stable.lexicon))}</li>
</ul>
${credits()}
<p class="farewell">${lir('Voge, sora.')}<span class="gloss">Goodbye, friend.</span></p>`,
  );
}

function cheatSheet(index: Index): string {
  const small: readonly (readonly [string, string])[] = [
    ['li', 'the'],
    ['baba', 'a'],
    ['de', 'of'],
    ['ata', 'and'],
    ['nara', 'but'],
    ['ke / ka', 'is (now) / is (always)'],
    ['ne', 'not'],
    ['po', 'did (past)'],
    ['futu', 'will'],
    ['ki', 'makes a question'],
    ['maivo / taivo', 'I / you'],
  ];
  for (const [l] of small) {
    for (const t of tokenize(l)) {
      if (!index.isWord(t)) throw new Error(`cheat sheet: ${t} is not a word`);
    }
  }
  const root = byId(index, INVITATION.sevenFormsRoot);
  return page(
    'cheat',
    'On one page',
    `<div class="cheat">
<section><h3>Sounds</h3><ul><li>a e i o u: pure, each its own syllable</li><li>c = “ch”, r = a tap, g = hard</li><li>Weight on the second-to-last syllable</li></ul></section>
<section><h3>Seven shapes</h3><ul>${SHAPES.map(([label, slot]) => `<li>${lir(formOf(root, slot))} <span class="gloss">${esc(label)}</span></li>`).join('')}</ul></section>
<section><h3>Word order</h3><p class="order">who · (${lir('po')} / ${lir('futu')}) · (${lir('ne')}) · does · what · (${lir('ki')})</p><p>Describing words before the thing. Two words joined: the second is the thing.</p></section>
<section><h3>Small words</h3><ul>${small.map(([l, e]) => `<li>${lir(l)} <span class="gloss">${esc(e)}</span></li>`).join('')}</ul></section>
</div>
${credits()}`,
  );
}

/** The whole Invitation body, in reading order: it ends on the song. */
export function invitationBody(index: Index, emblemSvg: string): string {
  const c: Ctx = { index, style: displayStyle(), check: sentenceCheck(index) };
  const pages = [
    cover(index, emblemSvg),
    opening(c),
    untranslatables(c),
    sound(),
    hello(c),
    sevenWords(c),
    compounds(c),
    imageEngine(c),
    grammarOne(c),
    grammarTwo(c),
    lyricSheet(),
    lament(c),
    nextSteps(index),
    cheatSheet(index),
  ];
  return pages.join('\n');
}
