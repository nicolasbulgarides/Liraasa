import { describe, expect, it } from 'vitest';
import { patch, serious, strictChecker } from './loadGrammar';

/**
 * The author's 2.5 patch, as tests (README: every ✓ must parse, every ✗ must
 * be rejected, and the rejection must cite the right rule). The examples are
 * read from the patch itself, so a new decision is tested the day it lands.
 */
const ck = strictChecker();
const decisions = patch().decisions;

/** A ✗ example may be caught by the ruling it illustrates, or by the one that ruling applies. */
const ALSO: Record<string, string[]> = {
  // 2.5:G88's ✗ for ki-eli + noun is 2.3:G76, which G88 says stands
  '2.5:G88': ['2.3:G76'],
};

describe('every ✓ example of the 2.5 patch parses with no error or warning', () => {
  for (const d of decisions) {
    for (const e of d.examples_grammatical ?? []) {
      it(`${d.ruling_id ?? d.issue}: ${e.liraasa}`, () => {
        expect(serious(ck, e.liraasa)).toEqual([]);
      });
    }
  }
});

describe('every ✗ example of the 2.5 patch is rejected, citing its rule', () => {
  for (const d of decisions) {
    for (const e of d.examples_ungrammatical ?? []) {
      it(`${d.ruling_id ?? d.issue}: ${e.liraasa} (${e.why ?? ''})`, () => {
        const errors = ck.checkLine(e.liraasa).findings.filter((f) => f.severity === 'error');
        const rules = errors.map((f) => f.rule);
        const want = [d.ruling_id ?? '', ...(ALSO[d.ruling_id ?? ''] ?? [])];
        expect(
          rules.some((r) => want.includes(r)),
          `${e.liraasa}: ${rules.join(', ')}`,
        ).toBe(true);
      });
    }
  }
});

describe('the counts', () => {
  it('cover every decision with examples', () => {
    const good = decisions.flatMap((d) => d.examples_grammatical ?? []).length;
    const bad = decisions.flatMap((d) => d.examples_ungrammatical ?? []).length;
    expect({ good, bad }).toEqual({ good: 104, bad: 20 });
  });
});

describe('what the checker reports as unruled, not pass or fail', () => {
  it('two adjectives before one noun (A4.22)', () => {
    const f = ck.checkLine('li vanisan molusan lira').findings;
    expect(f.some((x) => x.severity === 'unruled' && x.rule === 'A4.22')).toBe(true);
    expect(f.filter((x) => x.severity === 'error')).toEqual([]);
  });
  it('kroti + a quantifier + a noun (2.5:G108)', () => {
    const f = ck.checkLine('Maivo po venreva kroti poka deyari.').findings;
    expect(f.some((x) => x.severity === 'unruled' && x.rule === '2.5:G108')).toBe(true);
  });
  it('a command with an operator other than ne (I-42)', () => {
    const f = ck.checkLine('Povi lirala!').findings;
    expect(f.some((x) => x.severity === 'unruled' && x.rule === 'I-42')).toBe(true);
  });
  it('ke sidu, "destined to" (an open question)', () => {
    const f = ck.checkLine('Maivo ke sidu lirala.').findings;
    expect(f.some((x) => x.severity === 'unruled')).toBe(true);
  });
});

describe('no exemptions (2.5:G87)', () => {
  it('an album line with an adjective where the verb belongs fails, album reading or not', () => {
    const f = serious(ck, 'saivo po farufasbifa kube saivo ramusan raho maivo po ke.');
    expect(f.map((x) => x.rule)).toContain('2.5:G126');
    expect(f.find((x) => x.rule === '2.5:G126')?.message).toMatch(/ramura/);
  });
});
