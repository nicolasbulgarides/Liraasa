import { beforeAll, describe, expect, it } from 'vitest';
import { type Composer, type Piece, type Songbook, loadComposer } from './editorComposer';

/**
 * The editor's songbook helpers: deleting a piece behind a typed [FOREVER],
 * and typesetting pieces for the PDF export, each Liraasa line with its
 * English beneath. The lines are the lexicon's own examples.
 */

let composer: Composer;
beforeAll(() => {
  composer = loadComposer();
});

const piece = (id: string, collectionId: string, updated: string, text = ''): Piece => ({
  id,
  collectionId,
  title: id,
  kind: 'song',
  register: 'poetic',
  text,
  updated,
});
const blank = (collectionId: string): Piece => piece('fresh', collectionId, '2026-10-16');

describe('deleting a piece', () => {
  it('asks for [FOREVER], exactly', () => {
    expect(composer.confirmsDelete('[FOREVER]')).toBe(true);
    expect(composer.confirmsDelete('  [FOREVER] ')).toBe(true);
    for (const typed of ['', 'FOREVER', '[forever]', 'forever', '[FOREVER', 'yes']) {
      expect(composer.confirmsDelete(typed), typed).toBe(false);
    }
  });

  it('opens the most recent piece on the same shelf next', () => {
    const book: Songbook = {
      activeId: 'a',
      pieces: [
        piece('a', 'songs', '2026-10-16'),
        piece('b', 'songs', '2026-10-01'),
        piece('c', 'songs', '2026-10-10'),
        piece('d', 'drafts', '2026-10-15'),
      ],
    };
    expect(composer.removePiece(book, 'a', blank)).toBe('c');
    expect(book.pieces.map((p) => p.id)).toEqual(['b', 'c', 'd']);
  });

  it('falls back to another shelf, then to a blank piece', () => {
    const book: Songbook = {
      activeId: 'a',
      pieces: [piece('a', 'songs', '2026-10-16'), piece('d', 'drafts', '2026-10-15')],
    };
    expect(composer.removePiece(book, 'a', blank)).toBe('d');
    expect(composer.removePiece(book, 'd', blank)).toBe('fresh');
    expect(book.pieces.map((p) => [p.id, p.collectionId])).toEqual([['fresh', 'drafts']]);
  });
});

describe('the PDF pages', () => {
  const song: Piece = {
    ...piece('p1', 'songs', '2026-10-16'),
    title: 'Li veluri',
    text: 'Li veluri po hiro lirala.\nMaivo amora taivo.\n\nKube taivo venreva, maivo lirala.',
    englishLines: ['The stars began to sing.', 'I love you.', '', ''],
  };
  const opts = {
    collections: new Map([['songs', 'Devotionals']]),
    edition: '1.1',
    title: 'Li veluri',
  };

  it('sets each Liraasa line with its English beneath, stanza by stanza', () => {
    const html = composer.songbookHtml([song], opts);
    const stanzas = html.split('<div class="stanza">').slice(1);
    expect(stanzas).toHaveLength(2);
    expect(stanzas[0]).toContain(
      '<p class="liraasa" lang="art-x-liraasa">Li veluri po hiro lirala.</p>' +
        '<p class="english" lang="en">The stars began to sing.</p>',
    );
    // a line with no English is set alone, never with an empty gloss
    expect(stanzas[1]).toContain(
      '<div class="pair"><p class="liraasa" lang="art-x-liraasa">Kube taivo venreva, maivo lirala.</p></div>',
    );
  });

  it('gives a piece its shelf, title and kind, and the document its title', () => {
    const html = composer.songbookHtml([song], opts);
    expect(html).toContain('<title>Li veluri</title>');
    expect(html).toContain('<div class="kicker sans">Devotionals</div>');
    expect(html).toContain('size: A5');
    expect(html).not.toContain('class="cover"');
  });

  it('adds a title page and contents for more than one piece', () => {
    const other = { ...song, id: 'p2', title: 'Maivo amora taivo' };
    const html = composer.songbookHtml([song, other], { ...opts, title: 'Songbook' });
    expect(html).toContain('<section class="cover">');
    expect(html).toContain('2 pieces');
    expect(html.split('<li>')).toHaveLength(3);
  });

  it('escapes what the writer typed', () => {
    const html = composer.songbookHtml([{ ...song, title: 'a <b> & "c"' }], opts);
    expect(html).toContain('a &lt;b&gt; &amp; &quot;c&quot;');
    expect(html).not.toContain('<b>');
  });
});
