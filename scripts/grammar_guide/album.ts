/**
 * The album (2.2:G68): twelve songs and the alternate 05, line by line as
 * recorded, with a gloss under each word read from the lexicon by the same
 * code that reads Nemelira de devi (song.ts).
 *
 * The album is canon 2.0 text, read with 2.0 spellings (2.1:G58). Its lines
 * are never edited: a word respelled since 2.0 is glossed through the
 * migration table, and the line's current spelling is noted beneath it. A line
 * that departs from the grammar once is an album reading (AR-…): it keeps its
 * meaning, is listed with its standard form, and is not a model for new text.
 * The album has no English yet; nothing is translated here.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Index } from './data';
import { esc, lir, md, part } from './html';
import { REFERENCE_STYLE, interlinear } from './song';

const DIR = 'data/corpus/album_2_0';

interface Reading {
  id: string;
  track: string;
  line: number;
  recorded: string;
  confidence: 'certain' | 'author_confirm';
  issue: string;
  standard_form: string | null;
  note: string | null;
  /** A ruling that made the reading's construction grammar (2.3:G74). */
  resolved_by?: string;
}

interface CurrentLine {
  n: number;
  recorded: string;
  /** The current edition's spelling, where it differs from the recording. */
  current: string | null;
  reading?: string;
}

interface CurrentSong {
  track: string;
  title: string;
  lines: CurrentLine[];
}

const load = (file: string): unknown =>
  JSON.parse(readFileSync(resolve(DIR, file), 'utf8').replace(/^\uFEFF/, ''));

/** The album as recorded, with each line's current spelling and its reading, if any. */
export function readAlbum(): { songs: CurrentSong[]; readings: Reading[] } {
  const { songs } = load('album_current.json') as { songs: CurrentSong[] };
  const { songs: recordedSongs } = load('liraasa_album_corpus.json') as {
    songs: { track: string; lines: { n: number; recorded: string }[] }[];
  };
  // the generated reading must still be the recording, word for word
  for (const s of songs) {
    const rec = recordedSongs.find((r) => r.track === s.track);
    for (const l of s.lines) {
      if (rec?.lines.find((x) => x.n === l.n)?.recorded !== l.recorded)
        throw new Error(
          `album ${s.track}:${String(l.n)}: album_current.json is stale; run scripts/build_album.ts`,
        );
    }
  }
  const { readings } = load('album_readings.json') as { readings: Reading[] };
  return { songs, readings };
}

/**
 * "Liraasa de Leldeasa (Crossing Lines)" → the Liraasa, then the rest as plain
 * text. A title is album text as recorded (2.2:G68): a title word the lexicon
 * does not read (Amorlavi) is listed for the author, never edited.
 */
function titleHtml(title: string): string {
  const m = /^(.*?)((?: \(|, ).*)?$/.exec(title);
  return `${lir(m?.[1] ?? title, 'album')}${esc(m?.[2] ?? '')}`;
}

function readingNote(r: Reading): string {
  // a construction a later ruling made grammar: the line is a model again
  if (r.resolved_by !== undefined)
    return `<p class="v-n album-reading"><strong>${esc(r.id)}</strong> was an album reading (${esc(r.issue)}); the construction is grammar since ${md(`[[${r.resolved_by}]]`)}.</p>`;
  const standard =
    r.standard_form === null
      ? 'Standard form: the author is to supply it.'
      : `Standard form${r.confidence === 'author_confirm' ? ', tentative until the author confirms' : ''}: ${lir(r.standard_form)}`;
  return `<p class="v-n album-reading"><strong>${esc(r.id)}</strong>, an album reading: ${esc(r.issue)} ${standard}${r.note === null ? '' : ` <span class="muted">${esc(r.note)}</span>`}</p>`;
}

export function albumPart(index: Index, n: string): string {
  const { songs, readings } = readAlbum();
  const tracks = songs
    .map((s) => {
      const lines = s.lines
        .map((l) => {
          const reading = readings.find((r) => r.id === l.reading);
          const now =
            l.current === null
              ? ''
              : `<p class="v-n album-now">Read today: ${lir(l.current)} ${md('[[2.1:G58]]')}</p>`;
          return `<li class="verse"><span class="v-num" aria-hidden="true">${String(l.n)}</span>${interlinear(index, l.recorded, REFERENCE_STYLE)}${now}${reading === undefined ? '' : readingNote(reading)}</li>`;
        })
        .join('\n');
      return `<section class="album-track" aria-label="Track ${esc(s.track)}">
<h3 class="album-title"><span class="album-no">${esc(s.track)}</span> ${titleHtml(s.title)}</h3>
<p class="album-en">English: to come from the author.</p>
<ol class="song album">${lines}</ol>
</section>`;
    })
    .join('\n');
  const active = readings.filter((r) => r.resolved_by === undefined);
  const certain = active.filter((r) => r.confidence === 'certain').length;
  return part(
    n,
    'The album',
    `Twelve songs and the alternate 05, as recorded: canon 2.0 text, read with 2.0 spellings [[2.2:G68]] [[2.1:G58]]. A construction the album uses consistently is grammar. A word respelled since 2.0 is glossed through the migration table, and the line’s current spelling is noted beneath (“Read today”). The ${String(active.length)} lines that depart from the grammar once are **album readings** (AR-…): each keeps its meaning and is listed with its standard form, ${String(certain)} certain and ${String(active.length - certain)} for the author to confirm.${readings.length > active.length ? ` ${String(readings.length - active.length)} more became grammar [[2.3:G74]].` : ''} They are not models for new text. Glosses use the labels of Part 7. No English is given yet.`,
    tracks,
  );
}
