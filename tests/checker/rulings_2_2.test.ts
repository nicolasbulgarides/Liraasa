import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { type Checker, type Diagnostic, loadChecker } from './loadChecker';

/**
 * Liraasa 2.2 (ADR-0018): the grammar of the album. Every example of
 * 2.2:G60–G68 and every album reading's standard form reads clean; the
 * question and exclamation rules (G60, G61, G64), adjective + sidu (G65) and
 * the side nouns as prepositions (G67) are read; a 2.1 spelling 2.2 undid
 * says so.
 */

const read = (path: string): unknown =>
  JSON.parse(readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8'));
const lexicon = read('../../data/lexicon/liraasa_2_2.json') as {
  rulings_2_2: { id: string; examples: [string, string][] }[];
};
const readings = (
  read('../../data/corpus/album_2_0/album_readings.json') as {
    readings: { id: string; standard_form: string | null }[];
  }
).readings;

let checker: Checker;
beforeAll(() => {
  checker = loadChecker().checker;
});

const serious = (line: string): Diagnostic[] =>
  checker.checkLine(line, 1).filter((d) => d.severity === 'error' || d.severity === 'warn');
const errors = (line: string): Diagnostic[] =>
  checker.checkLine(line, 1).filter((d) => d.severity === 'error');
const has = (line: string, rule: string): boolean => serious(line).some((d) => d.rule === rule);

describe('the 2.2 rulings', () => {
  it('give examples, and every one reads clean', () => {
    const lines = lexicon.rulings_2_2.flatMap((r) => r.examples.map(([l]) => l));
    expect(lines.length).toBe(16);
    for (const line of lines) expect(serious(line), line).toEqual([]);
  });

  it('every album reading’s standard form reads with no error', () => {
    const forms = readings.flatMap((r) => (r.standard_form === null ? [] : [r.standard_form]));
    expect(forms.length).toBe(14);
    for (const line of forms) expect(serious(line), line).toEqual([]);
  });
});

describe('questions (2.2:G60, superseding 2.1:G46)', () => {
  it('reads a ki-word fronted or in place, with or without the final ki', () => {
    for (const line of [
      'Ki-pago taivo pagopa ki?',
      'Ki-pago taivo pagopa?',
      'Taivo pagopa ki-pago ki?',
      'Taivo pagopa ki-pago?',
      'Ki-kasa taivo po amora maivo?',
      'Maivo ne sabesia ki-pago taivo futu pagopa.', // embedded, no ki
    ])
      expect(serious(line), line).toEqual([]);
  });

  it('asks a yes/no question for its final ki, and fixes it', () => {
    const [d] = serious('Taivo lirala?').filter((x) => x.rule === '2.2:G60');
    expect(d?.autoFix).toBe(true);
    expect(d && checker.applyFix('Taivo lirala?', d)).toBe('Taivo lirala ki?');
    // an embedded wh-question does not make the main question a wh-question
    expect(has('Taivo sabesia ki-pago maivo pagopa?', '2.2:G60')).toBe(true);
  });

  it('raho may open a question that ends in ki (2.3:G74 supersedes that clause of 2.2:G64)', () => {
    expect(errors('raho povi sabesia baba kasi polvasan sove ki?')).toEqual([]);
    expect(errors('raho povi sabesia baba kasi polvasan sove?')[0]?.rule).toBe('2.3:G74');
    expect(serious('ki-nela povi sabesia baba kasi polvasan sove ki?')).toEqual([]);
    expect(serious('Maivo lirala raho taivo amora.')).toEqual([]); // headless raho
  });
});

describe('exclamations, narrowed (2.2:G61, superseding 2.1:G47)', () => {
  it('reads the three exclamative shapes without ki', () => {
    for (const line of ['Li nullo ka ki-modo vanisan!', 'Ki-eli nullo!'])
      expect(serious(line), line).toEqual([]);
  });

  it('reads any other ki-word clause without ki as a question', () => {
    expect(has('Li nullo ka ki-pago!', '2.2:G61')).toBe(true);
    expect(has('Ki-pago taivo pagopa!', '2.2:G61')).toBe(true);
  });

  it('asks a degree question for its final ki', () => {
    expect(has('Li nullo ka ki-modo vanisan?', '2.2:G61')).toBe(true);
    expect(serious('Li nullo ka ki-modo vanisan ki?')).toEqual([]);
  });
});

describe('sidu (2.2:G65)', () => {
  it('lets an adjective take sidu + verb', () => {
    expect(serious('ito ke ruli levasan sidu zeldoza trana.')).toEqual([]);
  });

  it('still refuses sidu after a copula (album AR-10; “destined to” is an open question)', () => {
    expect(
      errors('si maivo ke sidu daigoda, maivo kopi daigoda en saivo de varori.')[0]?.rule,
    ).toBe('sidu');
  });
});

describe('side nouns (2.2:G67)', () => {
  it('stand bare before a noun phrase, or after a verb', () => {
    expect(serious('Li lavra semnesia nazru li nimu.')).toEqual([]);
    expect(serious('saivo de melonulu venreva nazru gase baba lira de ruhesonbu.')).toEqual([]);
  });
});

describe('a 2.1 spelling 2.2 undid', () => {
  it('names the edition that brought it in and the 2.2 spelling', () => {
    const [d] = serious('puzucono');
    expect(d?.rule).toBe('1.0:G19');
    expect(d?.fix).toBe('silrocono');
    expect(d?.message).toMatch(/spelling of 2\.1; 2\.2 spells it/);
    expect(serious('silrocono')).toEqual([]);
  });
});
