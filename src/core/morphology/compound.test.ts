import { describe, expect, it } from 'vitest';
import {
  compoundVerbClass,
  fixedWordNote,
  hasInferredComponents,
  nestingDepth,
  partsOf,
  primalRootsOf,
  spellCompound,
} from './compound';

/** The real nesting case: mudusomubiti = mudu + (somu + biti). */
const LOOKUP: Record<string, readonly string[] | null> = {
  mudusomubiti: ['mudu', 'somubiti'],
  somubiti: ['somu', 'biti'],
  mudu: null,
  somu: null,
  biti: null,
};

const lookup = (s: string): readonly string[] | null | undefined => LOOKUP[s];

describe('spellCompound and partsOf', () => {
  it('writes modifier and head together, head rightmost', () => {
    expect(spellCompound({ modifier: 'somu', head: 'biti' })).toBe('somubiti');
  });

  it('round-trips a two-component array', () => {
    expect(partsOf(['somu', 'biti'])).toEqual({ modifier: 'somu', head: 'biti' });
  });

  it('rejects an arity other than two', () => {
    expect(() => partsOf(['somu'])).toThrow();
    expect(() => partsOf(['a', 'b', 'c'])).toThrow();
  });
});

describe('compoundVerbClass', () => {
  it('follows the modifier, not the head', () => {
    // somu is s-initial, biti is not.
    expect(compoundVerbClass({ modifier: 'somu', head: 'biti' })).toBe('s-initial');
    // mudu is m-initial, so the nested compound takes the consonant branch.
    expect(compoundVerbClass({ modifier: 'mudu', head: 'somubiti' })).toBe('consonant');
  });
});

describe('primalRootsOf', () => {
  it('returns a primal as itself', () => {
    expect(primalRootsOf('biti', lookup)).toEqual(['biti']);
  });

  it('flattens one level', () => {
    expect(primalRootsOf('somubiti', lookup)).toEqual(['somu', 'biti']);
  });

  it('follows nesting through mudusomubiti', () => {
    expect(primalRootsOf('mudusomubiti', lookup)).toEqual(['mudu', 'somu', 'biti']);
  });

  it('detects a cycle instead of recursing forever', () => {
    const cyclic = (s: string): readonly string[] | null =>
      s === 'a' ? ['b', 'b'] : s === 'b' ? ['a', 'a'] : null;
    expect(() => primalRootsOf('a', cyclic)).toThrow(/cycle/);
  });
});

describe('nestingDepth', () => {
  it('is 0 for a primal, 1 for a plain compound, 2 for the nested one', () => {
    expect(nestingDepth('biti', lookup)).toBe(0);
    expect(nestingDepth('somubiti', lookup)).toBe(1);
    expect(nestingDepth('mudusomubiti', lookup)).toBe(2);
  });
});

describe('provenance badges', () => {
  it('flags the four compounds whose split the 1.0 build inferred', () => {
    for (const w of ['kronobio', 'lumivera', 'mavopago', 'mavolumi']) {
      expect(hasInferredComponents(w)).toBe(true);
    }
    expect(hasInferredComponents('somubiti')).toBe(false);
  });

  it('badges mavopago as a fixed word whose derivation is blocked', () => {
    expect(fixedWordNote('mavopago')).toMatch(/society/);
    expect(fixedWordNote('mavopago')).toMatch(/blocked/);
    expect(fixedWordNote('kaldopago')).toBeUndefined();
  });
});
