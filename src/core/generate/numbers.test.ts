import { describe, expect, it } from 'vitest';
import { MAX_NUMBER, NumberRangeError, spellFraction, spellNumber, spellOrdinal } from './numbers';

describe('spellNumber', () => {
  it('spells the digits', () => {
    expect(spellNumber(0)).toBe('zira');
    expect(spellNumber(7)).toBe('seta');
    expect(spellNumber(9)).toBe('niva');
  });

  it('uses the memorised contractions for 10 to 50', () => {
    expect(spellNumber(10)).toBe('unzira');
    expect(spellNumber(20)).toBe('dozira');
    expect(spellNumber(30)).toBe('trezira');
    expect(spellNumber(40)).toBe('cuazira');
    expect(spellNumber(50)).toBe('penzira');
  });

  it('builds 60 to 90 as digit + zira', () => {
    expect(spellNumber(60)).toBe('sesazira');
    expect(spellNumber(90)).toBe('nivazira');
  });

  it('builds the teens on unzira', () => {
    expect(spellNumber(11)).toBe('unzira-una');
    expect(spellNumber(19)).toBe('unzira-niva');
  });

  it('builds mixed tens', () => {
    expect(spellNumber(21)).toBe('dozira-una');
    expect(spellNumber(99)).toBe('nivazira-niva');
  });

  it('spells exactly one hundred as centa, not unacenta', () => {
    expect(spellNumber(100)).toBe('centa');
    expect(spellNumber(200)).toBe('dossacenta');
  });

  it('builds hundreds with a remainder', () => {
    expect(spellNumber(101)).toBe('centa-una');
    expect(spellNumber(215)).toBe('dossacenta-unzira-penta');
    expect(spellNumber(999)).toBe('nivacenta-nivazira-niva');
  });

  it('spells exactly one thousand and one million as the bare scale words', () => {
    expect(spellNumber(1000)).toBe('mililumi');
    expect(spellNumber(1_000_000)).toBe('megalumi');
  });

  it('prefixes larger scale groups', () => {
    expect(spellNumber(2000)).toBe('dossa-mililumi');
    expect(spellNumber(2_000_000)).toBe('dossa-megalumi');
  });

  it('omits an absent group rather than pronouncing a zero triplet', () => {
    expect(spellNumber(1_000_001)).toBe('megalumi-una');
    expect(spellNumber(1_001_000)).toBe('megalumi-mililumi');
  });

  it('reads groups descending', () => {
    expect(spellNumber(1_234_567)).toBe(
      'megalumi-dossacenta-trezira-cuara-mililumi-pentacenta-sesazira-seta',
    );
  });

  it('spells the maximum', () => {
    expect(spellNumber(MAX_NUMBER)).toBe(
      'nivacenta-nivazira-niva-megalumi-nivacenta-nivazira-niva-mililumi-nivacenta-nivazira-niva',
    );
  });

  it('refuses what the rules do not define', () => {
    expect(() => spellNumber(-1)).toThrow(NumberRangeError);
    expect(() => spellNumber(1.5)).toThrow(NumberRangeError);
    expect(() => spellNumber(MAX_NUMBER + 1)).toThrow(NumberRangeError);
  });
});

describe('ordinals and fractions', () => {
  it('suffixes -ne for an ordinal; the ne is never negation', () => {
    expect(spellOrdinal(1)).toBe('una-ne');
    expect(spellOrdinal(2)).toBe('dossa-ne');
    expect(spellOrdinal(3)).toBe('tressa-ne');
  });

  it('joins a fraction with de', () => {
    expect(spellFraction(3, 4)).toBe('tressa de cuara');
  });
});
