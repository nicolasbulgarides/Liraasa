import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { type Checker, type Diagnostic, loadChecker } from './loadChecker';

/**
 * Phase 4: the English cross-check, run against each line's paired English.
 * Canon's own examples, which all carry English, are the false-positive test.
 */

interface SongLine {
  n: number;
  original: string;
  fixed: string;
  english: string;
  expect: { phase: number; severity: string; rule: string; token: string }[];
}
const read = (rel: string): unknown =>
  JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8'));
const song = read('./fixtures/song.json') as { lines: SongLine[] };

const ENGLISH_RULES = ['gloss drift', 'tense', 'passive', 'calque', '1.2:G31'];

let checker: Checker;
let ref: {
  examples: { sentences: [string, string][] };
  recipes: { liraasa: string; meaning: string }[];
  rulings: { examples?: { liraasa: string; english: string }[] }[];
  small_words: { function_words: { columns: string[]; rows: string[][] } };
};
beforeAll(() => {
  const loaded = loadChecker();
  checker = loaded.checker;
  ref = loaded.ref as unknown as typeof ref;
});

const english = (line: string, en: string): Diagnostic[] =>
  checker.checkLine(line, 1, en).filter((d) => ENGLISH_RULES.includes(d.rule));
const serious = (ds: Diagnostic[]): Diagnostic[] =>
  ds.filter((d) => d.severity === 'error' || d.severity === 'warn');

describe('the fixture song', () => {
  it('each original line produces its Phase 4 diagnostics', () => {
    for (const l of song.lines) {
      for (const e of l.expect.filter((x) => x.phase === 4)) {
        const d = checker.checkLine(l.original, l.n, l.english);
        expect(
          d.some(
            (x) =>
              x.rule === e.rule && x.severity === e.severity && x.token?.toLowerCase() === e.token,
          ),
          `line ${String(l.n)}: ${e.severity} ${e.rule} on “${e.token}”`,
        ).toBe(true);
      }
    }
  });

  it('every fixed line, with its English, has no errors or warnings at all', () => {
    for (const l of song.lines) {
      const d = serious(checker.checkLine(l.fixed, l.n, l.english));
      expect(
        d.map((x) => `${x.rule}: ${x.message}`),
        `line ${String(l.n)}`,
      ).toEqual([]);
    }
  });

  it('gloss drift points at the culprit and offers the form that means the English', () => {
    const [d] = english(
      'mareasasan velu po savalisia maivo su li lehe.',
      'A mother star kissed me on the cheek.',
    );
    expect(d).toMatchObject({
      severity: 'warn',
      rule: 'gloss drift',
      token: 'mareasasan',
      fix: 'maresan',
    });
  });
});

describe('the English rules', () => {
  it('tense: present English with a past marker warns; past English without one is a note (1.2:G31)', () => {
    expect(english('taivo po ke gonbihemlusan.', 'You are invited.')[0]).toMatchObject({
      rule: 'tense',
      token: 'po',
    });
    expect(english('maivo lirala.', 'I sang.')[0]).toMatchObject({
      rule: '1.2:G31',
      severity: 'note',
    });
    expect(english('maivo lirala.', 'I will sing.')[0]).toMatchObject({
      rule: 'tense',
      severity: 'warn',
    });
    expect(serious(english('Maivo po lesvu saivo pagopa.', 'I let them leave.'))).toEqual([]);
  });

  it('passive English needs gome, or a copula + adjective', () => {
    expect(english('li dorbi sevresia.', 'The door was closed.').map((d) => d.rule)).toContain(
      'passive',
    );
    expect(
      english('Li dorbi gome sevresia gagu li sora.', 'The door is closed by the friend.'),
    ).toEqual([]);
    expect(english('taivo ke gonbihemlusan.', 'You are invited.')).toEqual([]);
  });

  it('the calque table', () => {
    const calque = (l: string, e: string): string[] =>
      english(l, e)
        .filter((d) => d.rule === 'calque')
        .map((d) => d.message);
    expect(
      calque('ramumomvira taivo de lumiasasan kronobio ne.', 'Never forget your holy birth.')[0],
    ).toMatch(/nuna-krono/);
    expect(calque('Nuna-coda.', 'Never mind.')).toEqual([]);
    expect(calque('taivo farlafa maivo milobe.', 'You make me smile.')[0]).toMatch(/vaku/);
    expect(calque('fisa lavbula gase taivo venreva.', 'Please pray as you come.')[0]).toMatch(
      /nayo/,
    );
    expect(calque('Kureli taivo venreva, maivo lirala.', 'As soon as you come, I sing.')).toEqual(
      [],
    );
    expect(
      calque('saivo po senosia en baba melosan valla.', 'They spoke in a musical voice.')[0],
    ).toMatch(/yuta/);
    expect(calque('lirala maivo baba somulira.', 'Sing me a lullaby.')[0]).toMatch(/vobi/);
  });

  it('back-translation is literal, with markers', () => {
    expect(
      checker.backTranslate('taivo po ke gonbihemlusan ala li suma de maivo de yuge.').text,
    ).toBe('you PAST is(now) invited to the warmth of my body');
    expect(checker.backTranslate('Taivo lirala ki?').text).toBe('you sing Q');
  });
});

describe('canon English', () => {
  /** Canon pairs the cross-check flags: reported for the author, never auto-corrected. */
  const KNOWN = [
    'Li yalmu de li divmabiti po momvima. :: passive', // "was lost" in English, active "lost" in Liraasa
  ];

  it('canon examples with their English raise no English warnings beyond the known ones', () => {
    const fw = ref.small_words.function_words;
    const col = (name: string): number => fw.columns.indexOf(name);
    const pairs: [string, string][] = [
      ...ref.examples.sentences,
      ...ref.recipes.map((r): [string, string] => [r.liraasa, r.meaning]),
      ...ref.rulings.flatMap((r) =>
        (r.examples ?? []).map((e): [string, string] => [e.liraasa, e.english]),
      ),
      ...fw.rows.map((r): [string, string] => [
        r[col('example (Liraasa)')] ?? '',
        r[col('example (English)')] ?? '',
      ]),
    ];
    const found = new Set(
      pairs.flatMap(([l, e]) => serious(english(l, e)).map((d) => `${l} :: ${d.rule}`)),
    );
    expect([...found].sort()).toEqual(KNOWN);
  });
});
