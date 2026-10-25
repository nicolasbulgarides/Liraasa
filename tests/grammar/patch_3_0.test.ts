import { describe, expect, it } from 'vitest';
import { read, serious, strictChecker } from './loadGrammar';

/**
 * The author's 3.0 patch (proposed, ADR-0021), as tests: every example of a
 * 3.0 ruling, every hymn line and every prayer line must parse with no error
 * or warning, and every ungrammatical example must be rejected citing its
 * ruling. Read from the patch itself, so a change to it is tested at once.
 */
interface Patch30 {
  rulings_add: { id: string; examples?: [string, string][]; ungrammatical?: [string, string][] }[];
  hymn_test: { line: number; v3_0: string }[];
  prayer_test: { liraasa: string }[];
}
const ck = strictChecker();
const patch = read('../../archive/patch_3_0/liraasa_3_0_patch.json') as Patch30;

/** A gloss in brackets after the Liraasa is the patch's comment, not part of the line. */
const line = (s: string): string => s.replace(/\s*\([^)]*\)\s*$/, '');

/**
 * 3.0:G131's ✗ is grammatical Liraasa with the wrong meaning: Mareasa de li
 * lumi is "the Mother's light". The checker cannot know what the writer meant,
 * so it notes the reading, citing G131, instead of rejecting the line.
 */
const NOTED = new Set(['3.0:G131']);

/** A ✗ example may be caught by the ruling it illustrates, or by the one that ruling applies. */
const ALSO: Record<string, string[]> = {
  // G133's ✗ is a copula with no predicate, which G132 rules
  '3.0:G133': ['3.0:G132'],
};

describe('every example of a 3.0 ruling parses with no error or warning', () => {
  for (const r of patch.rulings_add) {
    for (const [l] of r.examples ?? []) {
      it(`${r.id}: ${l}`, () => {
        expect(serious(ck, line(l))).toEqual([]);
      });
    }
  }
});

describe('the hymn and the prayer, in 3.0, parse with no error or warning', () => {
  for (const h of patch.hymn_test) {
    it(`hymn line ${String(h.line)}: ${h.v3_0}`, () => {
      expect(serious(ck, h.v3_0)).toEqual([]);
    });
  }
  for (const p of patch.prayer_test) {
    it(`prayer: ${p.liraasa}`, () => {
      expect(serious(ck, p.liraasa)).toEqual([]);
    });
  }
});

describe('every ✗ example of a 3.0 ruling is rejected, citing its rule', () => {
  for (const r of patch.rulings_add) {
    for (const [l, why] of r.ungrammatical ?? []) {
      it(`${r.id}: ${l} (${why})`, () => {
        const found = ck.checkLine(line(l)).findings;
        if (NOTED.has(r.id)) {
          expect(found.some((f) => f.rule === r.id)).toBe(true);
          return;
        }
        const rules = found.filter((f) => f.severity === 'error').map((f) => f.rule);
        const want = [r.id, ...(ALSO[r.id] ?? [])];
        expect(
          rules.some((x) => want.includes(x)),
          `${l}: ${rules.join(', ')}`,
        ).toBe(true);
      });
    }
  }
});

describe('the counts', () => {
  it('cover every 3.0 example', () => {
    const good = patch.rulings_add.flatMap((r) => r.examples ?? []).length;
    const bad = patch.rulings_add.flatMap((r) => r.ungrammatical ?? []).length;
    expect({ good, bad, hymn: patch.hymn_test.length, prayer: patch.prayer_test.length }).toEqual({
      good: 41,
      bad: 9,
      hymn: 18,
      prayer: 7,
    });
  });
});
