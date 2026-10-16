import { describe, expect, it } from 'vitest';
import { assemble, deriveOrNull, lexicalisedGloss, SuffixError } from './suffixes';

describe('assemble', () => {
  it('returns the bare root with no stem', () => {
    expect(assemble({ root: 'lira' })).toBe('lira');
  });

  it('builds a form', () => {
    expect(assemble({ root: 'lira', stem: { kind: 'form', slot: 'verb' } })).toBe('lirala');
  });

  it('builds a derivation on the root, not on a verb form', () => {
    expect(assemble({ root: 'lira', stem: { kind: 'derivation', derivation: 'yo' } })).toBe(
      'lirayo',
    );
    expect(assemble({ root: 'lira', stem: { kind: 'derivation', derivation: 'vu' } })).toBe(
      'liravu',
    );
    expect(assemble({ root: 'lira', stem: { kind: 'derivation', derivation: 'pago' } })).toBe(
      'lirapago',
    );
  });

  it('orders the stack as root, stem, -ti, -ri', () => {
    expect(
      assemble({
        root: 'lira',
        stem: { kind: 'form', slot: 'root' },
        diminutive: true,
        plural: true,
      }),
    ).toBe('liratiri');
  });

  it('puts -ri last even without -ti', () => {
    expect(assemble({ root: 'velu', plural: true })).toBe('veluri');
  });

  it('blocks mavo + -pago and says why', () => {
    expect(() =>
      assemble({ root: 'mavo', stem: { kind: 'derivation', derivation: 'pago' } }),
    ).toThrow(SuffixError);
    expect(() =>
      assemble({ root: 'mavo', stem: { kind: 'derivation', derivation: 'pago' } }),
    ).toThrow(/society/);
  });

  it('allows mavo with the other derivations', () => {
    expect(assemble({ root: 'mavo', stem: { kind: 'derivation', derivation: 'yo' } })).toBe(
      'mavoyo',
    );
  });
});

describe('deriveOrNull', () => {
  it('returns null for a blocked derivation', () => {
    expect(deriveOrNull('mavo', 'pago')).toBeNull();
  });

  it('returns the spelling otherwise', () => {
    expect(deriveOrNull('kaldo', 'pago')).toBe('kaldopago');
  });
});

describe('lexicalisedGloss', () => {
  it('gives the fixed meaning of a lexicalised derivation (1.0:G20)', () => {
    expect(lexicalisedGloss('tisebitivu')).toMatch(/sword/);
    expect(lexicalisedGloss('zeldoyo')).toMatch(/rebel/);
    expect(lexicalisedGloss('kaldopago')).toMatch(/prison/);
  });

  it('is undefined for an ordinary derivation', () => {
    expect(lexicalisedGloss('lirayo')).toBeUndefined();
  });
});
