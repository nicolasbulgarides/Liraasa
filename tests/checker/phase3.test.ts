import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { type Checker, type Diagnostic, loadChecker } from './loadChecker';

/**
 * Phase 3: the semantic overlay (data/checker/lexicon_flags.json) and the
 * rules that use it. Each rule is shown firing, and next to it the canon use
 * it must leave alone.
 */

interface SongLine {
  n: number;
  original: string;
  fixed: string;
  expect: { phase: number; severity: string; rule: string; token: string }[];
}
const song = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/song.json', import.meta.url)), 'utf8'),
) as { lines: SongLine[] };

let checker: Checker;
beforeAll(() => {
  checker = loadChecker().checker;
});
const hits = (line: string, rule: string): Diagnostic[] =>
  checker.checkLine(line, 1).filter((d) => d.rule === rule);
const fixed = (line: string, rule: string): string => {
  const d = hits(line, rule)[0];
  if (d === undefined) throw new Error(`${rule} did not fire on ${line}`);
  return checker.applyFix(line, d);
};

describe('the fixture song', () => {
  it('each original line produces its Phase 3 diagnostics', () => {
    for (const l of song.lines) {
      for (const e of l.expect.filter((x) => x.phase === 3)) {
        const d = checker.checkLine(l.original, l.n);
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

  it('the suggested fixes rebuild the author’s corrections', () => {
    // en + an abstract noun may now be the manner (2.3:G73); the note still offers yuta
    expect(fixed('saivo po senosia en baba melosan valla.', '2.3:G73')).toBe(
      'saivo po senosia yuta baba melosan valla.',
    );
    expect(fixed('ata maivo futu lisila taivo ko maivo de mavolumisan miru.', '1.2:G33')).toBe(
      'ata maivo futu lisila taivo yuta maivo de mavolumisan miru.',
    );
    expect(fixed('faruti, taivo de corvi farlafa maivo milobe.', '1.0:G14')).toBe(
      'faruti, taivo de corvi vaku maivo milobema.',
    );
    expect(fixed('taivo ke baba farulavra.', 'clause.copulas')).toBe('taivo ka baba farulavra.');
  });
});

describe('the semantic rules', () => {
  it('ko + substance is the instrument, except after a verb of mixing (1.2:G33)', () => {
    expect(hits('maivo lisila taivo ko li miru.', '1.2:G33')).toHaveLength(1);
    expect(hits('Cemoyanoca li marnapusa ko li miru.', '1.2:G33')).toEqual([]);
    expect(hits('maivo lirala ko saivo.', '1.2:G33')).toEqual([]);
  });

  it('en + abstract may be the manner, noted with yuta for the means; a place stays (2.3:G73)', () => {
    const [d] = hits('saivo po senosia en baba melosan valla.', '2.3:G73');
    expect(d?.severity).toBe('note');
    expect(d?.fix).toBe('yuta');
    expect(hits('Taivo po lumila en li narvo.', '1.2:G33')).toEqual([]);
    expect(hits('li luno salrusia ata taivo somusia en maivo de varori.', '1.2:G33')).toEqual([]);
  });

  it('a not-causative verb used as “make someone do” (1.0:G14)', () => {
    expect(hits('taivo farlafa maivo milobe.', '1.0:G14')[0]).toMatchObject({
      severity: 'warn',
      autoFix: true,
    });
    expect(hits('maivo farlafa baba tabu.', '1.0:G14')).toEqual([]);
  });

  it('ke + noun: a temporary identity, with the adjective offered when it exists', () => {
    const [d] = hits('taivo ke nimu.', 'clause.copulas');
    expect(d).toMatchObject({ severity: 'note', fix: 'ka' });
    expect(d?.message).toMatch(/nimusan/);
    expect(hits('taivo ke nimusan.', 'clause.copulas')).toEqual([]);
    expect(hits('li nela ke benasan', 'clause.copulas')).toEqual([]);
  });

  it('gase compares; it does not open a clause (0.8:G8)', () => {
    const [d] = hits('maivo lirala gase taivo venreva.', '0.8:G8');
    expect(d?.message).toMatch(/nayo/);
    expect(d?.message).toMatch(/kube/);
    expect(hits('gase vanisan gase taivo', '0.8:G8')).toEqual([]);
    expect(hits('Li bumre ka gase somusan gase Dorin.', '0.8:G8')).toEqual([]);
  });
});
