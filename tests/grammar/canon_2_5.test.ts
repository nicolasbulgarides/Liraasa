import { describe, expect, it } from 'vitest';
import { fromParse } from '../../src/core/translate/fromParse';
import { realize } from '../../src/core/translate/realize';
import { read, reference, serious, strictChecker } from './loadGrammar';

/**
 * Golden and negative: every canonical sentence, recipe and living ruling
 * example after the 2.5 edits reads clean under the strict checker, except the
 * pinned findings for the author; the album's errors are rejected; and every
 * golden sentence round-trips through the frame (parse → frame → realize).
 */
const ck = strictChecker();
const ref = reference();
const known = read('./fixtures/known_findings_2_5.json') as {
  canon: Record<string, string[]>;
  album: Record<string, string[]>;
};
const findings = (line: string): string[] =>
  [...new Set(serious(ck, line).map((f) => `${f.severity} ${f.rule}`))].sort();

const golden: [string, string][] = [
  ...ref.examples.sentences.map(([l]) => ['examples.sentences', l] as [string, string]),
  ...ref.recipes.map((r) => ['recipes', r.liraasa] as [string, string]),
  ...ref.rulings
    .filter((r) => !String(r.status ?? '').includes('SUPERSEDED by'))
    .flatMap((r) =>
      (r.examples ?? []).map((e) => [`rulings[${r.id}]`, e.liraasa] as [string, string]),
    ),
];

describe('golden: canon reads clean, but for the findings pinned for the author', () => {
  it('has the expected size', () => {
    expect(golden.length).toBeGreaterThan(700);
  });
  it('every sentence, recipe and ruling example', () => {
    const got: Record<string, string[]> = {};
    for (const [where, l] of golden) {
      const f = findings(l);
      if (f.length > 0) got[`${where}: ${l}`] = f;
    }
    expect(got).toEqual(known.canon);
  });
  it('no canonical sentence has an unknown word', () => {
    for (const [, l] of golden) {
      const unknown = ck.checkLine(l).findings.filter((f) => f.rule === 'hard_rules[0]');
      expect(unknown, l).toEqual([]);
    }
  });
});

describe('negative: the album is not canon, and its errors are rejected (2.5:G87)', () => {
  const lines = ref.album.tracks.flatMap((t) =>
    t.lines.map(
      (l, i) =>
        [`${t.track}:${String(i + 1)} ${l.current ?? l.liraasa}`, l.current ?? l.liraasa] as const,
    ),
  );
  it('the same album lines fail, with the same rules', () => {
    const got: Record<string, string[]> = {};
    for (const [key, l] of lines) {
      const f = findings(l);
      if (f.length > 0) got[key] = f;
    }
    expect(got).toEqual(known.album);
  });
  it('every album line with a word in the wrong form for its slot is rejected', () => {
    const formSlot = ['1.2:G29', '2.5:G98', 'ADR-0011', '0.8:G7'];
    const rejected = Object.entries(known.album).filter(([, f]) =>
      f.some((x) => formSlot.some((r) => x.endsWith(r))),
    );
    expect(rejected.length).toBeGreaterThanOrEqual(6);
    for (const [key] of rejected) {
      const l = key.slice(key.indexOf(' ') + 1);
      expect(ck.checkLine(l).ok, l).toBe(false);
    }
  });
  it('the contrasts to avoid are not imitated as canon', () => {
    expect(ref.examples.contrasts_to_avoid.length).toBe(2);
  });
});

describe('round trip: every golden sentence parses to a frame and regenerates to itself', () => {
  const norm = (x: string): string =>
    x
      .replace(/\s+/g, ' ')
      .replace(/^./, (c) => c.toLowerCase())
      .trim();
  /** asides and quotations the frame does not carry yet (review/resolution_report_2_5.md) */
  const GAPS = new Set([
    'Maivo desida, hema, baba buzakova de miru.',
    'Maivo po bumreba tressa, nido, cuara bumreri.',
    'Maivo amora taivo, nido, maivo devoda taivo.',
    'Maivo po senosia ne "juba", nara "donu".',
    'Dorin, ne.',
    'Ne, ne, ne.',
    'Taivo desida fime maivo senosia: "Pagopa, lirala!" ki?',
    'Li devi po masuma: “Ki-nela roni lirala ki?”',
  ]);
  it('regenerates every sentence that reads clean, but the listed gaps', () => {
    const misses: string[] = [];
    let n = 0;
    for (const [, l] of golden) {
      for (const s of ck.checkLine(l).sentences) {
        if (s.findings.some((f) => f.severity === 'error')) continue;
        n += 1;
        if (norm(realize(fromParse(s))) !== norm(s.text) && !GAPS.has(s.text)) misses.push(s.text);
      }
    }
    expect(misses).toEqual([]);
    expect(n).toBeGreaterThan(700);
  });
});
