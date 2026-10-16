/**
 * The SPEC §5.1 golden test: regenerate every stored form.
 *
 * Every 1.0 headword carries `protected: true`, so a stored spelling is canon.
 * A mismatch is reported with the words named; it is never auto-corrected.
 */
import { FORM_SLOTS } from '@core/config/slots';
import { diffForms, sevenForms, verbClassOf } from '@core/morphology/sevenForms';
import { describe, expect, it } from 'vitest';
import { imported, oracle } from './lexicon';

const { lexicon } = imported();

describe('form regeneration', () => {
  it('regenerates all 1099 x 7 forms with no mismatches', () => {
    const mismatches = lexicon.headwords.flatMap((h) => diffForms(h.spelling, h.forms));
    // Name the offenders rather than just failing on a count.
    expect(mismatches.map((m) => `${m.spelling}.${m.slot}: ${m.stored} != ${m.generated}`)).toEqual(
      [],
    );
  });

  it('covers the number of forms the validator reports', () => {
    const total = lexicon.headwords.length * FORM_SLOTS.length;
    expect(total).toBe(oracle().summary.counts.forms!);
    expect(total).toBe(7693);
  });

  it('produces 7693 distinct spellings, so no two entries collide', () => {
    const all = lexicon.headwords.flatMap((h) => FORM_SLOTS.map((s) => h.forms[s]));
    expect(new Set(all).size).toBe(all.length);
  });

  it('agrees with the stored forms for every verb class present in the data', () => {
    const seen = new Set<string>();
    for (const h of lexicon.headwords) {
      const cls = verbClassOf(h.spelling);
      if (seen.has(cls)) continue;
      seen.add(cls);
      expect(sevenForms(h.spelling).verb).toBe(h.forms.verb);
    }
    // The data exercises all five branches: `opi` ("Hope") is a Primal
    // headword, so the irregular is not a special case off to one side.
    expect([...seen].sort()).toEqual([
      'consonant',
      'irregular',
      'n-initial',
      's-initial',
      'vowel-initial',
    ]);
  });

  it('needs the opi irregular: the general rule would give the wrong verb', () => {
    const opi = lexicon.headwords.find((h) => h.spelling === 'opi');
    expect(opi).toBeDefined();
    expect(opi?.type).toBe('primal');
    expect(opi?.forms.verb).toBe('opioa');
    // Without the irregular, the vowel-initial branch would produce `opia`.
    expect(sevenForms('opi').verb).toBe('opioa');
  });
});

describe('the data the generator must respect', () => {
  it('counts 386 primal roots and 713 compounds', () => {
    const primal = lexicon.headwords.filter((h) => h.type === 'primal');
    const compound = lexicon.headwords.filter((h) => h.type === 'compound');
    expect(primal).toHaveLength(oracle().summary.counts.primal_roots!);
    expect(compound).toHaveLength(oracle().summary.counts.compounds!);
  });

  it('marks every headword protected', () => {
    expect(lexicon.headwords.filter((h) => !h.protected)).toEqual([]);
  });

  it('keeps the 23 consonant-final roots, all headed by amor or apok', () => {
    const consonantFinal = lexicon.headwords
      .filter((h) => !'aeiou'.includes(h.spelling.slice(-1)))
      .map((h) => h.spelling);
    expect(consonantFinal).toHaveLength(23);
    expect(consonantFinal.every((s) => s.endsWith('amor') || s.endsWith('apok'))).toBe(true);
  });
});
