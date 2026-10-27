import { describe, expect, it } from 'vitest';
import { read, serious, strictChecker } from './loadGrammar';

/**
 * Liraasa 4.0 (proposed, ADR-0029), what translating 2100 Dreams needed, as tests: every
 * example of rulings 4.0:G156-G161 reads with no error or warning under the strict checker, and
 * the two rulings the checker reads itself hold.
 */
interface Patch40 {
  rulings_add: { id: string; examples?: [string, string][] }[];
  compounds_add: { headword: string; parts: [string, string] }[];
}
const ck = strictChecker();
const patch = read('../../data/proposals/liraasa_4_0_patch.json') as Patch40;

describe('every 4.0 ruling example parses with no error or warning', () => {
  for (const r of patch.rulings_add)
    for (const [l] of r.examples ?? [])
      it(`${r.id}: ${l}`, () => {
        expect(serious(ck, l)).toEqual([]);
      });
});

describe('4.0 grammar in the checker', () => {
  it('speech may come before its verb of saying (4.0:G156)', () => {
    expect(serious(ck, '“Maivo ne pagopa,” saivo po senosia.')).toEqual([]);
    const r = ck.checkLine('“Maivo ne pagopa,” saivo po senosia.');
    expect(r.findings.filter((f) => f.severity === 'unruled')).toEqual([]);
  });
  it('the order of adjectives is ruled (4.0:G157)', () => {
    const r = ck.checkLine('Saivo po vimova baba vanisan nolsasan kadu.');
    expect(r.findings.filter((f) => f.rule === 'A4.22')).toEqual([]);
  });
  it('a 4.0 compound reads as a noun', () => {
    const c = patch.compounds_add[0];
    expect(c).toBeDefined();
    expect(serious(ck, `Li ${c?.headword ?? ''} ka vanisan.`)).toEqual([]);
  });
});
