/**
 * A whole song, read word by word: the author's *Nemelira de devi*, each line
 * with a gloss under every word, the author's English, and one note on what
 * it shows.
 *
 * The song and its translation are read from the author's text file
 * (`GUIDE.song`): a title line, an English title line, then Liraasa and
 * English lines in pairs. Every gloss is read from the lexicon; nothing here
 * says what a word means. A note names a word of its line, and the build
 * fails if no line has that word, so an edited song cannot misplace a note.
 *
 * Two documents read the song: the Reference Grammar glosses with the
 * standard labels (PST, COP.NOW …) and notes that cite rulings; the
 * Invitation glosses the small words in plain English and keeps its notes
 * free of grammar terms. Both share `interlinear`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { FormSlot } from '../../src/core/config/slots';
import { GUIDE } from './config';
import {
  firstSense,
  glossOf,
  isUsed,
  normGloss,
  tokenize,
  type Headword,
  type Index,
} from './data';
import { esc, lir, md, part } from './html';

/** A note on the line containing `word`: Markdown-ish prose, then optional HTML, built only when the note is shown. */
export type Note = readonly [word: string, text: string, html?: () => string];

/** The Reference Grammar's notes: one grammar point per line. */
export const REFERENCE_NOTES: readonly Note[] = [
  [
    'navuasa',
    'A pronoun before `de` owns what follows: `maivo de amor`, my love [[1.2:G27]]; the commas set it off as address [[1.2:G31]]. `navuasa` is the ascended form of `navu`, sky: the sky at its ultimate, the firmament. `gase baba` + noun is a simile, “like a …”.',
  ],
  [
    'yugeya',
    'One root, two jobs: `yugeya` is the verb of `yuge`, body (consonant-initial, so R + its first consonant + a), and `yuge` is its object. The adjective comes first: `daigosan yuge`, a mortal body.',
  ],
  [
    'cilniri',
    'A time word opens the clause and needs no comma [[1.2:G24]]. `ke` is the copula of a passing state; `-ri` makes the plural: `cilniri`, `nelari`.',
  ],
  [
    'mavolumi',
    'The line turns on the two copulas: `ka` for what is so by nature (the soul is starlit), `ke` for what is so for now (the body is wounded).',
  ],
  [
    'vuda',
    '`vuda` (DREAM.EVID) is the evidential of dream, set right before the verb: the speaker sees this only in a dream. `raho` opens a relative clause; it ends the sentence, so no comma closes it [[1.0:G21]].',
  ],
  [
    'kronorivla',
    '`ne` stands right before what it negates. `kronorivla` is time + flow: the flow of time.',
  ],
  [
    'vemineme',
    '`ata` joins two noun phrases as well as two clauses. Both nouns are compounds: heart + anguish, world + sorrow.',
  ],
  [
    'yanbaya',
    'No tense word means the present: the hands are aging now. Each half has its own subject and verb, so `ata` links them.',
  ],
  [
    'sulbanevra',
    '`vobi` (for) and `hupi` (above) are prepositions after the verb. `sulbanevra` is sun + descent: a compound is two headwords written as one word, the head last.',
  ],
  [
    'povi',
    '`kasa` opens a clause of cause. `ne` before the modal `povi` negates the ability: scope runs left over right [[1.0:G1]].',
  ],
  [
    'sulnosia',
    '`ka` again, for what death is. `sulnosia` shows the s-initial verb, R + `-sia`. `lumiasa`, the ascended form of `lumi`, light, is Her Divine Light: the Goddess’s own light, not the Goddess herself, who is `deviasa`.',
  ],
  [
    'lunosavali',
    '`lunosavali`, moon + kiss, is an image compound: any listed modifier and head make a word with a predictable reading [[2.0:G40]]. `loki`, still, stands before the verb, here the copula `ke`.',
  ],
  [
    'velumelo',
    '`lirala` shows the consonant-initial verb: `lira` + l + a. `velumelo`, stars + music, is the music of the spheres.',
  ],
  ['vamrisevu', '`gase` A `gase` B is “as A as B”: as deep as the dark between the stars.'],
  [
    'nolsakerso',
    '`kersoka`, to grow, and `nolsakerso`, new growth, are the same root `kerso` as verb and as the head of a compound.',
  ],
  [
    'lektaasa',
    '`kube` opens a clause of time, and the comma closes it. `futu` marks the future twice. `lektaasa`, the ascended form of gathering, is the great reunion of all souls.',
  ],
];

/** How the small words of a line are glossed. */
export interface GlossStyle {
  /** Grammatical words glossed by label rather than by English. */
  labels: Readonly<Record<string, string>>;
  /** A pronoun's gloss from its person and number. */
  pronoun: (person: string, number: string) => string;
  /** Glosses shown in place of the lexicon's, by spelling: each is reported through `shown`. */
  overrides?: Readonly<Record<string, string>>;
  /** Told whenever a gloss on the page differs from the lexicon's own words. */
  shown?: (token: string, lexicon: string, display: string) => void;
}

export const REFERENCE_STYLE: GlossStyle = {
  labels: {
    po: 'PST',
    futu: 'FUT',
    ne: 'NEG',
    ki: 'Q',
    ke: 'COP.NOW',
    ka: 'COP.NAT',
    vuda: 'DREAM.EVID',
  },
  pronoun: (person, number) =>
    `${{ First: '1', Second: '2', Third: '3' }[person.split(' ')[0] ?? ''] ?? ''}${number.startsWith('Plural') ? 'PL' : 'SG'}`,
};

/** Plain English for a reader who has never met a grammar label. */
export const PLAIN_STYLE: GlossStyle = {
  labels: {
    po: '(past)',
    futu: 'will',
    ne: 'not',
    ki: '(question)',
    ke: 'is (now)',
    ka: 'is (always)',
    vuda: 'in a dream',
  },
  pronoun: (person, number) => {
    const plural = number.startsWith('Plural');
    const p = person.split(' ')[0];
    if (p === 'First') return plural ? 'we' : 'I';
    if (p === 'Second') return plural ? 'you all' : 'you';
    if (number.includes('inanimate')) return plural ? 'they' : 'it';
    return 'they';
  },
};

/** Standard interlinear labels for the slots that change a word's kind. */
const SLOT_TAG: Partial<Record<FormSlot, string>> = {
  ascended: 'ASC',
  negative: 'NEG',
  negativeAdjective: 'NEG',
  ascendedAdjective: 'ASC',
};

/** “to descend; to go down” → “descend”; “the vault of creation” → “vault of creation”; “soul (mind light)” → “soul”. */
function short(gloss: string): string {
  return normGloss(firstSense(gloss).replace(/^to /i, ''))
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^(the|a|an) /i, '');
}

/** “past marker (preverbal)” → “past marker”; “of / belonging to” → “of”; “still; continuing” → “still”. */
function shortClosed(meaning: string): string {
  return firstSense(meaning.split(' / ')[0] ?? '')
    .replace(/\s*\(.*\)\s*/g, '')
    .trim();
}

interface Gloss {
  gloss: string;
  headword?: Headword;
  /** The lexicon's own words for this reading, before any shortening. */
  lexicon: string;
}

/**
 * The gloss of one token: an override if the style has one, else read from
 * the lexicon. An override, or a parenthesis dropped from the lexicon's
 * wording, is reported to `style.shown`.
 */
function glossToken(index: Index, token: string, style: GlossStyle): Gloss {
  const g = lexiconGloss(index, token, style);
  const override = style.overrides?.[token];
  if (override !== undefined) {
    style.shown?.(token, g.lexicon, override);
    return { ...g, gloss: override };
  }
  if (firstSense(g.lexicon).includes('(') && !g.gloss.includes('(')) {
    style.shown?.(token, g.lexicon, g.gloss);
  }
  return g;
}

/** The gloss of one token, read from the lexicon; a token it cannot read fails the build. */
function lexiconGloss(index: Index, token: string, style: GlossStyle): Gloss {
  const lex = index.lex;
  const pronoun = lex.pronouns.find((p) => p.form === token);
  if (pronoun !== undefined) {
    const gloss = style.pronoun(pronoun.person, pronoun.number);
    return { gloss, lexicon: gloss };
  }
  const label = style.labels[token];
  if (label !== undefined) return { gloss: label, lexicon: label };
  const fw = lex.function_words.find((w) => w.form === token);
  if (fw !== undefined) return { gloss: shortClosed(fw.meaning), lexicon: fw.meaning };
  const correlative = lex.correlatives.find((c) => c.form === token);
  if (correlative !== undefined) return { gloss: correlative.gloss, lexicon: correlative.gloss };
  const time = lex.time_and_dates.find((t) => t.form === token);
  if (time !== undefined) return { gloss: time.english.toLowerCase(), lexicon: time.english };

  const lexical = (word: string): Gloss | undefined => {
    const hits = (index.forms.get(word) ?? []).filter((h) => isUsed(h.headword, h.slot));
    const hit = hits[0];
    if (hit === undefined) return undefined;
    const tag = SLOT_TAG[hit.slot];
    // a changed form is glossed by its root and the label: navuasa = sky-ASC
    if (tag !== undefined) {
      const root = glossOf(hit.headword, 'root');
      return { gloss: `${short(root)}-${tag}`, headword: hit.headword, lexicon: root };
    }
    const gloss = glossOf(hit.headword, hit.slot);
    return { gloss: short(gloss), headword: hit.headword, lexicon: gloss };
  };
  const whole = lexical(token);
  if (whole !== undefined) return whole;
  for (const [suffix, mark] of [
    ['tiri', 'DIM-PL'],
    ['ri', 'PL'],
    ['ti', 'DIM'],
  ] as const) {
    if (!token.endsWith(suffix)) continue;
    const stem = lexical(token.slice(0, -suffix.length));
    if (stem !== undefined) return { ...stem, gloss: `${stem.gloss}-${mark}` };
  }
  throw new Error(`song: "${token}" has no reading in the lexicon`);
}

/**
 * One Liraasa line as words with a gloss under each. Every compound met is
 * added to `compounds`, so a caller can list them.
 */
export function interlinear(
  index: Index,
  liraasa: string,
  style: GlossStyle,
  compounds = new Map<string, Headword>(),
): string {
  const words = liraasa
    .split(/\s+/)
    .map((raw) => {
      const token = tokenize(raw)[0];
      if (token === undefined) return '';
      const g = glossToken(index, token, style);
      if (g.headword?.components) compounds.set(g.headword.root, g.headword);
      return `<span class="w">${lir(raw)}<span class="g">${esc(g.gloss)}</span></span>`;
    })
    .join(' ');
  return `<p class="v-g">${words}</p>`;
}

export interface Line {
  liraasa: string;
  english: string;
}

export function readSong(): { title: string; englishTitle: string; lines: Line[] } {
  const text = readFileSync(resolve(GUIDE.song), 'utf8').replace(/^\uFEFF/, '');
  const rows = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const [title, englishTitle, ...rest] = rows;
  if (title === undefined || englishTitle === undefined || rest.length % 2 !== 0) {
    throw new Error(`${GUIDE.song}: expected a title, an English title, then line pairs`);
  }
  const lines: Line[] = [];
  for (let i = 0; i < rest.length; i += 2) {
    lines.push({ liraasa: rest[i] ?? '', english: rest[i + 1] ?? '' });
  }
  return { title, englishTitle, lines };
}

/** The line of the song containing `word`, 1-based; the build fails if none does. */
export function lineWith(word: string): number {
  const at = readSong().lines.findIndex((l) => tokenize(l.liraasa).includes(word));
  if (at < 0) throw new Error(`no line of the song has "${word}"`);
  return at + 1;
}

/**
 * The song, verse by verse; with a title, followed by a box of its compounds.
 * Each verse number is text before its line, so every reader and every text
 * extraction meets the number first.
 */
export function songVerses(
  index: Index,
  style: GlossStyle,
  notes: readonly Note[],
  compoundsTitle?: string,
): string {
  const { lines } = readSong();
  const byLine = new Map<number, string>();
  for (const [word, note, html] of notes) {
    const at = lines.findIndex((l) => tokenize(l.liraasa).includes(word));
    if (at < 0) throw new Error(`song note on "${word}": no line of the song has it`);
    byLine.set(at, md(note) + (html?.() ?? ''));
  }

  const compounds = new Map<string, Headword>();
  const verses = lines
    .map((line, i) => {
      const note = byLine.get(i);
      return `<li class="verse"><span class="v-num" aria-hidden="true">${String(i + 1)}</span>${interlinear(index, line.liraasa, style, compounds)}<p class="v-e">${esc(line.english)}</p>${
        note === undefined ? '' : `<p class="v-n">${note}</p>`
      }</li>`;
    })
    .join('\n');

  const glossary = [...compounds.values()]
    .map((h) => {
      const [a, b] = h.components ?? ['', ''];
      const piece = (root: string) => `${lir(root)} ${esc(index.senseOf(root))}`;
      return `<li>${lir(h.root)} = ${piece(a)} + ${piece(b)}: ${esc(normGloss(glossOf(h, 'root')))}</li>`;
    })
    .join('');

  // the box closes the song: it follows the last line, never interrupts it
  if (compoundsTitle === undefined) return `<ol class="song">${verses}</ol>`;
  return `<ol class="song">${verses}</ol>
<aside class="closing-box" aria-labelledby="song-words"><h3 id="song-words">${esc(compoundsTitle)}</h3>
<ul class="glossary">${glossary}</ul></aside>`;
}

export function songPart(index: Index, n: string): string {
  const { title, englishTitle } = readSong();
  return part(
    n,
    `${title}: ${englishTitle}`,
    'A whole song, one line at a time: the Liraasa, a gloss under each word, the English, and the grammar the line shows. Glosses are read from the lexicon; a changed form is glossed by its root and a label (`navuasa`, sky-ASC). Labels: PST past, FUT future, NEG negation or negative form, Q question, PL plural, DIM diminutive, ASC ascended form, 1SG / 2SG I / you, COP.NOW `ke` (so now), COP.NAT `ka` (so by nature), DREAM.EVID `vuda` (seen in a dream).',
    songVerses(index, REFERENCE_STYLE, REFERENCE_NOTES, 'The compounds of the song'),
  );
}
