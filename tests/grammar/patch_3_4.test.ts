import { describe, expect, it } from 'vitest';
import { read, serious, strictChecker } from './loadGrammar';

/**
 * The author's 3.4 patch (proposed, ADR-0024), as tests: every example of
 * 3.4:G149, every recipe and every test sentence reads with no error or
 * warning under the strict checker. A ruling example that is a list of words
 * (`tibilekta · tibilektasan`) is read word by word.
 */
interface Patch34 {
  rulings_add: { id: string; examples?: [string, string][] }[];
  recipes_add: { liraasa: string }[];
  test_sentences: { liraasa: string }[];
}
const ck = strictChecker();
const patch = read('../../archive/patch_3_4/patches/liraasa_3_4_patch.json') as Patch34;

const sentences: [string, string][] = [
  ...patch.rulings_add.flatMap((r) =>
    (r.examples ?? []).flatMap(([l]): [string, string][] =>
      l.includes(' · ') ? l.split(' · ').map((w) => [r.id, w]) : [[r.id, l]],
    ),
  ),
  ...patch.recipes_add.map((r) => ['recipe', r.liraasa] as [string, string]),
  ...patch.test_sentences.map((t) => ['test sentence', t.liraasa] as [string, string]),
];

describe('every 3.4 example, recipe and test sentence parses with no error or warning', () => {
  for (const [where, l] of sentences) {
    it(`${where}: ${l}`, () => {
      expect(serious(ck, l)).toEqual([]);
    });
  }
  it('covers the patch', () => {
    expect(sentences.length).toBeGreaterThanOrEqual(13);
  });
});
