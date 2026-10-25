import { describe, expect, it } from 'vitest';
import { read, serious, strictChecker } from './loadGrammar';

/**
 * The author's 3.3 patch (proposed, ADR-0023), as tests: every example of a
 * 3.2 / 3.3 ruling, every recipe, the function word's example and every test
 * sentence reads with no error or warning under the strict checker. A ruling
 * example that is a list of words (`gudopocu · zilepocu`) is read word by word.
 *
 * Four of the patch's sentences break an earlier ruling. They are the
 * author's to decide (review/questions_3_3.md), so they are listed here, and
 * the test fails if one of them starts to read clean: then the list is stale.
 */
interface Patch33 {
  rulings_add: { id: string; examples?: [string, string][] }[];
  recipes_add: { liraasa: string }[];
  test_sentences: { liraasa: string }[];
  function_words_add: { example_liraasa: string }[];
}
const ck = strictChecker();
const patch = read('../../archive/patch_3_3/patches/liraasa_3_3_patch.json') as Patch33;

const FOR_THE_AUTHOR: Record<string, string> = {
  'Peta da Amerika':
    '3.2:G147 says de + the name means "from the place"; its example uses da, and a noun phrase takes no prepositional phrase after it (2.5:G98)',
  'Saivo milobema la menu.': 'la takes an adjective (2.5:G105); menu is a degree word',
  'Nayo ola, li linu ke somusia.':
    'nayo opens a clause, not a noun phrase; ke takes no verb (2.5:G93)',
  'Saivo po semnesia su maivo de damvatabu nayo li dapakadu po kadurivla.':
    'kadurivla is listed as a noun only: po kadurivla has no verb',
};

const sentences: [string, string][] = [
  ...patch.rulings_add.flatMap((r) =>
    (r.examples ?? []).flatMap(([l]): [string, string][] =>
      l.includes(' · ') ? l.split(' · ').map((w) => [r.id, w]) : [[r.id, l]],
    ),
  ),
  ...patch.recipes_add.map((r) => ['recipe', r.liraasa] as [string, string]),
  ...patch.function_words_add.map((f) => ['eho', f.example_liraasa] as [string, string]),
  ...patch.test_sentences.map((t) => ['test sentence', t.liraasa] as [string, string]),
];

describe('every 3.3 example, recipe and test sentence parses with no error or warning', () => {
  for (const [where, l] of sentences.filter(([, s]) => !(s in FOR_THE_AUTHOR))) {
    it(`${where}: ${l}`, () => {
      expect(serious(ck, l)).toEqual([]);
    });
  }
});

describe('the four sentences that break an earlier ruling are still rejected', () => {
  for (const [l, why] of Object.entries(FOR_THE_AUTHOR)) {
    it(`${l} (${why})`, () => {
      expect(sentences.some(([, s]) => s === l)).toBe(true);
      expect(serious(ck, l).length).toBeGreaterThan(0);
    });
  }
});

describe('3.2 and 3.3 grammar in the checker', () => {
  it('a title before a name is one noun phrase (3.2:G145)', () => {
    expect(serious(ck, 'Zilenela Peta lirala.')).toEqual([]);
    expect(serious(ck, 'Pilo Peta lirala.')).toEqual([]);
  });
  it('a copied place name + -san is an adjective of origin (3.2:G147)', () => {
    expect(serious(ck, 'Fransasan lira')).toEqual([]);
  });
  it("a compound's -san is an adjective by rule, a root's unlisted -san is not (3.3:G148)", () => {
    expect(serious(ck, 'kadulendasan')).toEqual([]);
    expect(ck.checkLine('Li lira ka kadulendasan.').findings.some((f) => f.rule === '0.8:R2')).toBe(
      false,
    );
  });
  it('ne + a bare adjective contrasts the predicate (0.8:G2)', () => {
    expect(serious(ck, 'Eli lira ka gudonasan, ne gudosan.')).toEqual([]);
  });
});
