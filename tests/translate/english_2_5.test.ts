import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../src/core/translate';
import { loadTranslateSource } from '../../scripts/grammar_source';

/**
 * English → Liraasa (README 2e): every case is derived from a 2.5 ruling or a
 * function-word family. The translator must produce the expected sentence or
 * an equivalent the rulings allow; every rendering it returns passes the
 * strict checker and back-translates to the frame it was built from; and when
 * no listed word fits, it reports the gap instead of inventing one.
 */
interface Case {
  english: string;
  ruling: string;
  expect: string | null;
  equivalents?: string[];
  review?: string;
}
const { cases } = JSON.parse(
  readFileSync(fileURLToPath(new URL('./cases_2_5.json', import.meta.url)), 'utf8'),
) as { cases: Case[] };
const t = createTranslator(loadTranslateSource());

describe('English → Liraasa, by ruling', () => {
  for (const c of cases) {
    it(`${c.ruling}: ${c.english}`, () => {
      const [r] = t.translate(c.english);
      if (r === undefined) throw new Error('no sentence read');
      if (c.expect === null) {
        expect(r.ok).toBe(false);
        expect(r.liraasa).toBeNull();
        return;
      }
      expect(r.ok, r.tried.map((x) => `${x.liraasa}: ${x.failures.join('; ')}`).join(' | ')).toBe(
        true,
      );
      expect([c.expect, ...(c.equivalents ?? [])]).toContain(r.liraasa);
      // what is returned passed the checker and its back-translation matches
      expect(r.check?.findings.filter((f) => f.severity === 'error')).toEqual([]);
      expect(r.backTranslation.matches).toBe(true);
    });
  }
});

describe('what the translator never does', () => {
  it('never returns Liraasa that fails the checker, and says why', () => {
    const [r] = t.translate('I recognize you.');
    expect(r?.liraasa).toBeNull();
    expect(r?.tried.length).toBeGreaterThan(0);
    expect(r?.tried[0]?.failures.join(' ')).toMatch(/could not read|no listed/);
  });
  it('never drops an English word it could not read', () => {
    const [r] = t.translate('I sing zxqv.');
    expect(r?.ok).toBe(false);
  });
  it('flags a default choice (ke or ka, 2.5:G93)', () => {
    const [r] = t.translate('My song is beautiful.');
    expect(r?.flags.some((f) => f.startsWith('2.5:G93'))).toBe(true);
  });
  it('shows its work: every word with its slot', () => {
    const [r] = t.translate('I open the door with the key.');
    expect(r?.gloss.map((g) => g.role)).toEqual([
      'SUBJECT',
      'VERB',
      'OBJECT',
      'OBJECT',
      'ADJUNCT',
      'ADJUNCT',
      'ADJUNCT',
    ]);
  });
});
