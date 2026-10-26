import { describe, expect, it } from 'vitest';
import { read, serious, strictChecker } from './loadGrammar';

/**
 * The author's 3.6 patch, "The 2100 Dreams patch" (proposed, ADR-0027), every
 * module, as the author decided it (data/proposals/liraasa_3_6_patch_decided.json), as tests: every example of 3.6:G153-G155, every recipe and every
 * test sentence reads with no error or warning under the strict checker. A
 * ruling example that is a list of words (`mavofaruti · mavofarutisan`) is
 * read word by word.
 *
 * One recipe sentence broke an earlier ruling. As with 3.3 and 3.5, the editor
 * settled it (ADR-0027): the original is still rejected, the replacement reads
 * clean, and the author has it in review/questions_3_6.md.
 */
interface Patch36 {
  rulings_add: { id: string; examples?: [string, string][] }[];
  recipes_add: { liraasa: string }[];
  test_sentences: { liraasa: string }[];
}
const ck = strictChecker();
const patch = read('../../data/proposals/liraasa_3_6_patch_decided.json') as Patch36;

const DECIDED: Record<string, { now: string; why: string }> = {
  'Li renli lisrola ne menu.': {
    now: 'Li renli po ne teklata.',
    why: 'ne stands before the verb (1.0:G1); "went on unabated" is "did not stop"',
  },
};

const sentences: [string, string][] = [
  ...patch.rulings_add.flatMap((r) =>
    (r.examples ?? []).flatMap(([l]): [string, string][] =>
      l.includes(' · ') ? l.split(' · ').map((w) => [r.id, w]) : [[r.id, l]],
    ),
  ),
  ...patch.recipes_add.map((r) => ['recipe', r.liraasa] as [string, string]),
  ...patch.test_sentences.map((t) => ['test sentence', t.liraasa] as [string, string]),
];

describe('every 3.6 example, recipe and test sentence parses with no error or warning', () => {
  for (const [where, l] of sentences.filter(([, s]) => !(s in DECIDED))) {
    it(`${where}: ${l}`, () => {
      expect(serious(ck, l)).toEqual([]);
    });
  }
});

describe('the sentence decided by the editor: the original is rejected, the replacement reads clean', () => {
  for (const [was, { now, why }] of Object.entries(DECIDED)) {
    it(`${was} → ${now} (${why})`, () => {
      expect(sentences.some(([, s]) => s === was)).toBe(true);
      expect(serious(ck, was).length).toBeGreaterThan(0);
      expect(serious(ck, now)).toEqual([]);
    });
  }
});

describe('3.6 grammar in the checker', () => {
  it('the -san of a lexicalised diminutive is an adjective (3.6:G153)', () => {
    expect(serious(ck, 'Saivo ka mavofarutisan.')).toEqual([]);
    expect(serious(ck, 'Saivo ka vizudemrotisan.')).toEqual([]);
  });
  it('garza and rupu stand alone as interjections (3.6:G154)', () => {
    expect(serious(ck, 'Garza!')).toEqual([]);
    expect(serious(ck, 'Rupu!')).toEqual([]);
  });
  it('metric units count with a numeral (3.6:G155)', () => {
    expect(serious(ck, 'Maivo po helnaha dossa bondopatuti.')).toEqual([]);
  });
  it('a copied drug name is a noun (3.5:G151)', () => {
    expect(serious(ck, 'Li mavohelnayo po helnaha ativan.')).toEqual([]);
    // dopamine and serotonin are copied as their scientific names (the author, 2026-10-25)
    expect(serious(ck, 'Li dopamina ka benasan.')).toEqual([]);
    expect(serious(ck, 'Maivo desida serotonina.')).toEqual([]);
  });
  it('the novel’s sound-words and slang are compounds of existing words (the author, 2026-10-25)', () => {
    for (const l of [
      'Li lunovurfa po valmiva.',
      'Vayesonbu!',
      'Li auruminelari ka volrusan.',
      'Taivo linuvalmila ala li nimu.',
    ])
      expect(serious(ck, l)).toEqual([]);
  });
});
