import { describe, expect, it } from 'vitest';
import { loadHymn } from '../../scripts/hymn';
import { serious, strictChecker } from './loadGrammar';

/**
 * The Song of the First Stars is a canon corpus text (ADR-0022): every line,
 * and its Liraasa title, reads with no error, warning or unruled finding under
 * the strict checker, and it has all 24 lines, in order.
 */
const ck = strictChecker();
const hymn = loadHymn();

describe('the canon hymn reads clean', () => {
  it('has its 24 lines, numbered in order', () => {
    expect(hymn.lines.map((l) => l.n)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    expect(hymn.status).toBe('canon');
  });
  for (const l of [{ n: 0, liraasa: hymn.title_liraasa }, ...hymn.lines]) {
    it(`${l.n === 0 ? 'title' : `line ${String(l.n)}`}: ${l.liraasa}`, () => {
      expect(serious(ck, l.liraasa)).toEqual([]);
      const unruled = ck.checkLine(l.liraasa).findings.filter((f) => f.severity === 'unruled');
      expect(unruled).toEqual([]);
    });
  }
});
