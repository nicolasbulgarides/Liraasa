import { describe, expect, it } from 'vitest';
import { diffForms, formOf, sevenForms, verbClassOf, verbOf } from './sevenForms';

describe('verbOf', () => {
  it('handles the opi irregular', () => {
    expect(verbOf('opi')).toBe('opioa');
  });

  it('adds -nia after an initial n', () => {
    expect(verbOf('nerpo')).toBe('nerponia');
    expect(verbOf('nevra')).toBe('nevrania');
  });

  it('adds -sia after an initial s', () => {
    expect(verbOf('semvi')).toBe('semvisia');
    expect(verbOf('somubiti')).toBe('somubitisia');
  });

  it('adds -a after an initial vowel', () => {
    expect(verbOf('amor')).toBe('amora');
    expect(verbOf('apok')).toBe('apoka');
    expect(verbOf('eli')).toBe('elia');
  });

  it('otherwise copies the first consonant before the a', () => {
    expect(verbOf('vordu')).toBe('vorduva');
    expect(verbOf('dorva')).toBe('dorvada');
    expect(verbOf('bede')).toBe('bedeba');
    expect(verbOf('falne')).toBe('falnefa');
  });

  it('takes the class from the first letter of the whole word, so a compound follows its modifier', () => {
    // somubiti starts with s even though its head, biti, does not.
    expect(verbOf('somubiti')).toBe('somubitisia');
    // mudusomubiti starts with m, so it takes the consonant-copy branch.
    expect(verbOf('mudusomubiti')).toBe('mudusomubitima');
  });

  it('rejects an empty spelling', () => {
    expect(() => verbOf('')).toThrow();
  });
});

describe('verbClassOf', () => {
  it('names the branch taken', () => {
    expect(verbClassOf('opi')).toBe('irregular');
    expect(verbClassOf('nerpo')).toBe('n-initial');
    expect(verbClassOf('semvi')).toBe('s-initial');
    expect(verbClassOf('amor')).toBe('vowel-initial');
    expect(verbClassOf('dorva')).toBe('consonant');
  });
});

describe('sevenForms', () => {
  it('builds the seven slots of dorva as the Quickstart documents them', () => {
    expect(sevenForms('dorva')).toEqual({
      root: 'dorva',
      ascended: 'dorvaasa',
      negative: 'dorvana',
      verb: 'dorvada',
      negativeAdjective: 'dorvanasan',
      adjective: 'dorvasan',
      ascendedAdjective: 'dorvaasasan',
    });
  });

  it('concatenates literally, with no elision, so a-final roots double the a', () => {
    expect(formOf('dorva', 'ascended')).toBe('dorvaasa');
    expect(formOf('bena', 'ascended')).toBe('benaasa');
  });

  it('does not double the a when the root does not end in one', () => {
    expect(formOf('amor', 'ascended')).toBe('amorasa');
  });
});

describe('diffForms', () => {
  it('is empty when stored forms agree with the rules', () => {
    expect(diffForms('dorva', sevenForms('dorva'))).toEqual([]);
  });

  it('reports a mismatch rather than correcting it', () => {
    const stored = { ...sevenForms('dorva'), verb: 'dorvara' };
    expect(diffForms('dorva', stored)).toEqual([
      { spelling: 'dorva', slot: 'verb', stored: 'dorvara', generated: 'dorvada' },
    ]);
  });
});
