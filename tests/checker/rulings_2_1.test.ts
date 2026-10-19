import { beforeAll, describe, expect, it } from 'vitest';
import { type Checker, type Diagnostic, loadChecker } from './loadChecker';

/**
 * Liraasa 2.1 (ADR-0017): every sentence the 2.1 rulings print reads clean,
 * and the N-times adverbials (2.1:G49) are read. The question rules 2.1:G46
 * and G47 are superseded by 2.2:G60 and G61 (ADR-0018): what they allowed is
 * still clean; what they forbade, 2.2 allows.
 */

let checker: Checker;
let rulings: { id: string; rule: string }[];
beforeAll(() => {
  const loaded = loadChecker();
  checker = loaded.checker;
  rulings = (loaded.ref as unknown as { rulings: { id: string; rule: string }[] }).rulings;
});

const serious = (line: string): Diagnostic[] =>
  checker.checkLine(line, 1).filter((d) => d.severity === 'error' || d.severity === 'warn');
const has = (line: string, rule: string, token: string): boolean =>
  serious(line).some((d) => d.rule === rule && d.token === token);

/**
 * The Liraasa sentences in a ruling's text: a capitalised run ending in . ? or !,
 * after a colon or the end of an earlier sentence, whose every word reads.
 */
function sentencesOf(rule: string): string[] {
  return [...rule.matchAll(/(?:^|[:;.!?] )([A-Z][a-z]+(?:[ ,-]+[a-z-]+)*[.?!])/g)]
    .map((m) => m[1] ?? '')
    .filter((s) => checker.readLine(s).every((t) => t.type !== 'word' || t.reading));
}

describe('the 2.1 rulings', () => {
  it('print sentences, and every one reads clean', () => {
    const lines = rulings
      .filter((r) => r.id.startsWith('2.1:'))
      .flatMap((r) => sentencesOf(r.rule));
    expect(lines.length).toBeGreaterThanOrEqual(8);
    for (const line of lines) expect(serious(line), line).toEqual([]);
  });
});

describe('questions in place (2.1:G46), superseded by 2.2:G60', () => {
  it('still reads a question word in its answer’s place, closed by ki', () => {
    for (const line of [
      'Taivo pagopa ki-pago ki?',
      'Taivo amora ki-eli lira ki?',
      'Li tisebiti ka ki-pago ki?',
      'Ki-nela lirala ki?',
      'ki-krono maivo lirala ki?',
      'Maivo ne sabesia ki-pago taivo futu pagopa.', // embedded: no ki
      'Li nullo ka ki-modo vanisan!', // an exclamation (2.1:G47, now 2.2:G61)
    ])
      expect(serious(line), line).toEqual([]);
  });

  it('no longer flags a fronted question word: 2.2:G60 lets it open the clause', () => {
    for (const line of [
      'Ki-pago taivo pagopa ki?',
      'Ki-eli lira taivo amora ki?',
      'Ki-pago ka li tisebiti ki?',
    ])
      expect(serious(line), line).toEqual([]);
  });

  it('no longer asks a ki-word question for its final ki (2.2:G60)', () => {
    expect(serious('Taivo pagopa ki-pago?')).toEqual([]);
    // a yes/no question still ends in ki, now under 2.2:G60
    expect(has('Taivo lirala?', '2.2:G60', 'lirala')).toBe(true);
  });
});

describe('once and N times (2.1:G49)', () => {
  it('reads NUMBER-krono and ki-muya-krono as adverbials', () => {
    expect(serious('Maivo lirala una-krono.')).toEqual([]);
    expect(serious('Maivo lirala dossa-krono.')).toEqual([]);
    expect(serious('Taivo lirala ki-muya-krono ki?')).toEqual([]);
  });
});

describe('a spelling 2.1 retired (2.1:G58)', () => {
  it('names its 2.1 spelling and the edition that respelled it', () => {
    const [d] = serious('Maivo vurlova sidu lirala.');
    expect(d?.rule).toBe('1.0:G19');
    expect(d?.fix).toBe('desida');
    expect(d?.message).toMatch(/before 2\.1/);
  });
});
