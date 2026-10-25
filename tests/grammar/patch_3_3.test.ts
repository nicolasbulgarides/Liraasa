import { describe, expect, it } from 'vitest';
import { read, serious, strictChecker } from './loadGrammar';

/**
 * The author's 3.3 patch (proposed, ADR-0023), as tests: every example of a
 * 3.2 / 3.3 ruling, every recipe, the function word's example and every test
 * sentence reads with no error or warning under the strict checker. A ruling
 * example that is a list of words (`gudopocu · zilepocu`) is read word by word.
 *
 * Four of the patch's sentences broke an earlier ruling. The author left them
 * to the editor's judgement (2026-10-25, ADR-0024): each original is still
 * rejected, and each is replaced by a form that reads clean.
 */
interface Patch33 {
  rulings_add: { id: string; examples?: [string, string][] }[];
  recipes_add: { liraasa: string }[];
  test_sentences: { liraasa: string }[];
  function_words_add: { example_liraasa: string }[];
}
const ck = strictChecker();
const patch = read('../../archive/patch_3_3/patches/liraasa_3_3_patch.json') as Patch33;

const DECIDED: Record<string, { now: string; why: string }> = {
  'Peta da Amerika': {
    now: 'li lira de Amerika',
    why: '3.2:G147 says de + the name means from the place; a noun phrase takes de, not a prepositional phrase (2.5:G98)',
  },
  'Saivo milobema la menu.': {
    now: 'Saivo ke menu lavisan.',
    why: 'la takes an adjective (2.5:G105); "slightly" is menu before an adjective',
  },
  'Nayo ola, li linu ke somusia.': {
    now: 'Ola-krono, li linu somusia.',
    why: 'nayo opens a clause, and ke takes no verb (2.5:G93): meanwhile is ola-krono, asleep is somusia',
  },
  'Saivo po semnesia su maivo de damvatabu nayo li dapakadu po kadurivla.': {
    now: 'Saivo po semnesia su maivo de damvatabu nayo li dapakadu po ke en li kadurivla.',
    why: 'kadurivla is a noun only: "in traffic" is ke en li kadurivla',
  },
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
  for (const [where, l] of sentences.filter(([, s]) => !(s in DECIDED))) {
    it(`${where}: ${l}`, () => {
      expect(serious(ck, l)).toEqual([]);
    });
  }
});

describe('the four sentences decided by the editor: the original is rejected, the replacement reads clean', () => {
  for (const [was, { now, why }] of Object.entries(DECIDED)) {
    it(`${was} → ${now} (${why})`, () => {
      expect(sentences.some(([, s]) => s === was)).toBe(true);
      expect(serious(ck, was).length).toBeGreaterThan(0);
      expect(serious(ck, now)).toEqual([]);
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
