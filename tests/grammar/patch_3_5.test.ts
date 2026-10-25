import { describe, expect, it } from 'vitest';
import { read, serious, strictChecker } from './loadGrammar';

/**
 * The author's 3.5 patch (proposed, ADR-0025), every module, as tests: every
 * example of 3.5:G150-G151, every recipe and every test sentence reads with
 * no error or warning under the strict checker. A ruling example that is a
 * list of words (`tressa-gaki · cuara-gaki`) is read word by word.
 *
 * Five of the patch's sentences broke an earlier ruling. As with 3.3, the
 * editor settled them (ADR-0025): each original is still rejected, and each
 * replacement reads clean.
 */
interface Patch35 {
  rulings_add: { id: string; examples?: [string, string][] }[];
  recipes_add: { liraasa: string }[];
  test_sentences: { liraasa: string }[];
}
const ck = strictChecker();
const patch = read('../../archive/patch_3_5/patches/liraasa_3_5_patch.json') as Patch35;

const DECIDED: Record<string, { now: string; why: string }> = {
  'Saivo vaku li tise pidisan.': {
    now: 'Saivo vaku li tise loya pidisan.',
    why: 'vaku ACTOR is followed by the actor’s verb (2.5:G109): the knife becomes pointed',
  },
  'Mufe saivo po pagopa.': {
    now: 'Saivo po pagopa mufe.',
    why: 'an attitude word closes its clause (1.0:G22)',
  },
  'Sina, maivori futu pagopa.': {
    now: 'Sina taivo lirala, maivori futu pagopa.',
    why: 'sina is "unless" and opens a clause',
  },
  'Li vilalirbu po zarkuhata li regnacilni en li deyafamapuku.': {
    now: 'Li vilalirbu po zarkuhataza li regnacilni en li deyafamapuku.',
    why: 'zarkuhata is the noun; the patch lists the verb zarkuhataza',
  },
  'Li cibuti po vizuduvla li sevubudi.': {
    now: 'Li cibuti po vizuduvlava li sevubudi.',
    why: 'vizuduvla is the noun; the patch lists the verb vizuduvlava',
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

describe('every 3.5 example, recipe and test sentence parses with no error or warning', () => {
  for (const [where, l] of sentences.filter(([, s]) => !(s in DECIDED))) {
    it(`${where}: ${l}`, () => {
      expect(serious(ck, l)).toEqual([]);
    });
  }
});

describe('the five sentences decided by the editor: the original is rejected, the replacement reads clean', () => {
  for (const [was, { now, why }] of Object.entries(DECIDED)) {
    it(`${was} → ${now} (${why})`, () => {
      expect(sentences.some(([, s]) => s === was)).toBe(true);
      expect(serious(ck, was).length).toBeGreaterThan(0);
      expect(serious(ck, now)).toEqual([]);
    });
  }
});

describe('3.5 grammar in the checker', () => {
  it('a numeral + gaki is a polygon, and its -san the shape (3.5:G150)', () => {
    expect(serious(ck, 'Li tabu ka cuara-gakisan.')).toEqual([]);
    expect(serious(ck, 'tressa-gaki')).toEqual([]);
    expect(serious(ck, 'Li tabu ka lira-gakisan.').length).toBeGreaterThan(0);
  });
  it('a copied foreign word is a noun (3.5:G151)', () => {
    expect(serious(ck, 'Maivo sapusia pitsa.')).toEqual([]);
  });
});
