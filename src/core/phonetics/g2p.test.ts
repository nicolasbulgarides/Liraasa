import { describe, expect, it } from 'vitest';
import {
  G2PError,
  glidedVariant,
  hyphenate,
  markStress,
  phoneInventory,
  syllabify,
  toPhones,
  toStressedPhones,
} from './g2p';

describe('toPhones', () => {
  it('maps the five pure vowels', () => {
    expect(toPhones('aeiou')).toEqual(['a', 'e', 'i', 'o', 'u']);
  });

  it('maps y to the glide, not a vowel', () => {
    expect(toPhones('yuge')).toEqual(['j', 'u', 'ɡ', 'e']);
  });

  it('keeps g hard everywhere, as the guide states for gura', () => {
    expect(toPhones('gura')).toEqual(['ɡ', 'u', 'r', 'a']);
    expect(toPhones('mege')).toEqual(['m', 'e', 'ɡ', 'e']);
  });

  it('reads the sh and ch digraphs, which occur only in colour and number words', () => {
    expect(toPhones('shada')).toEqual(['ʃ', 'a', 'd', 'a']);
    expect(toPhones('ocha')).toEqual(['o', 't͡ʃ', 'a']);
  });

  it('treats a hyphen as a boundary with no phone of its own', () => {
    expect(toPhones('toda-nela')).toEqual(['t', 'o', 'd', 'a', 'n', 'e', 'l', 'a']);
  });

  it('rejects a letter outside the inventory', () => {
    expect(() => toPhones('qwx')).toThrow(G2PError);
  });

  it('emits an ASCII alphabet on request, phone for phone', () => {
    expect(toPhones('yuge', 'ascii')).toEqual(['Y', 'U', 'G', 'E']);
    expect(toPhones('shada', 'ascii')).toEqual(['SH', 'A', 'D', 'A']);
    expect(toPhones('juba', 'ascii')).toEqual(['JH', 'U', 'B', 'A']);
  });

  it('keeps the two alphabets the same length for any word', () => {
    for (const w of ['lira', 'dorvaasa', 'opioa', 'krono', 'amor', 'mudusomubiti']) {
      expect(toPhones(w, 'ascii')).toHaveLength(toPhones(w, 'ipa').length);
    }
  });
});

describe('syllabify', () => {
  it('counts every vowel as a nucleus, so hiatus never contracts', () => {
    // The guide's own examples.
    expect(hyphenate('soraasa')).toBe('so-ra-a-sa');
    expect(hyphenate('opioa')).toBe('o-pi-o-a');
  });

  it('splits a medial cluster between its consonants', () => {
    // The guide's own examples.
    expect(hyphenate('balbu')).toBe('bal-bu');
    expect(hyphenate('maska')).toBe('mas-ka');
    expect(hyphenate('lemvo')).toBe('lem-vo');
  });

  it('keeps a grandfathered initial cluster together', () => {
    expect(hyphenate('krono')).toBe('kro-no');
    expect(hyphenate('trana')).toBe('tra-na');
  });

  it('closes the last syllable with a final consonant', () => {
    expect(hyphenate('amor')).toBe('a-mor');
    expect(hyphenate('apok')).toBe('a-pok');
  });

  it('handles a long nested compound', () => {
    expect(hyphenate('mudusomubiti')).toBe('mu-du-so-mu-bi-ti');
  });

  it('reports phones identical to toPhones', () => {
    for (const w of ['lira', 'dorvaasa', 'balbu', 'krono', 'amor', 'shada']) {
      expect(syllabify(w).phones).toEqual(toPhones(w));
    }
  });

  it('rejects a word with no vowel', () => {
    expect(() => syllabify('br')).toThrow(G2PError);
  });
});

describe('stress', () => {
  it('falls on the penultimate syllable, as the guide writes it', () => {
    // The guide's own examples: LI-ra, lu-mi-A-sa, da-pa-DO-nu.
    expect(markStress('lira')).toBe('LI-ra');
    expect(markStress('lumiasa')).toBe('lu-mi-A-sa');
    expect(markStress('dapadonu')).toBe('da-pa-DO-nu');
  });

  it('falls on the only syllable of a monosyllable', () => {
    expect(syllabify('po').stressIndex).toBe(0);
    expect(syllabify('ki').stressIndex).toBe(0);
  });

  it('marks the stressed nucleus when asked for stressed phones', () => {
    expect(toStressedPhones('lira')).toEqual(['l', 'i1', 'r', 'a0']);
    expect(toStressedPhones('dapadonu')).toEqual(['d', 'a0', 'p', 'a0', 'd', 'o1', 'n', 'u0']);
  });
});

describe('glidedVariant', () => {
  it('reduces a doubled vowel, which is what hiatus gliding does in rapid speech', () => {
    expect(glidedVariant('dorvaasa')).toEqual(['d', 'o', 'r', 'v', 'a', 's', 'a']);
  });

  it('is null when there is no hiatus to glide', () => {
    expect(glidedVariant('lira')).toBeNull();
    expect(glidedVariant('amor')).toBeNull();
  });
});

describe('phoneInventory', () => {
  it('lists each phone once, sorted', () => {
    const ipa = phoneInventory('ipa');
    expect(new Set(ipa).size).toBe(ipa.length);
    expect([...ipa].sort((a, b) => a.localeCompare(b))).toEqual(ipa);
  });

  it('collapses c and k to one phone, as the documented default does', () => {
    expect(toPhones('cono')[0]).toBe(toPhones('kova')[0]);
    // 23 letters map to 22 phones, because c and k share one, plus the two
    // digraphs that appear only in colour and number words.
    expect(phoneInventory('ipa')).toHaveLength(24);
    expect(phoneInventory('ascii')).toHaveLength(24);
  });
});
