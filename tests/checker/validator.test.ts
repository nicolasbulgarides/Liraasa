import { beforeAll, describe, expect, it } from 'vitest';
import { LEXICON_FILE, readSourceJson } from '../golden/sourcePaths';
import { type Checker, type Diagnostic, loadChecker } from './loadChecker';

/**
 * The author's regression list for the editor's validator, ported from
 * tests/golden/validator.test.ts to the new checker: lines it must flag, lines
 * it must pass, and every example sentence in the frozen 1.0 lexicon, which
 * the grammar guide was generated from. A guide example that fails is reported
 * to the author, never fixed by loosening a rule: it is pinned below.
 */

let checker: Checker;
beforeAll(() => {
  checker = loadChecker().checker;
});

const check = (line: string, english?: string): Diagnostic[] =>
  checker.checkLine(line, 1, english, { register: 'poetic' });
const serious = (line: string): Diagnostic[] =>
  check(line).filter((d) => d.severity === 'error' || d.severity === 'warn');
const has = (
  line: string,
  severity: string,
  rule: string,
  token: string | null,
  text?: RegExp,
  english?: string,
): boolean =>
  check(line, english).some(
    (d) =>
      d.severity === severity &&
      d.rule === rule &&
      (token === null || d.token?.toLowerCase() === token) &&
      (text === undefined || text.test(d.message)),
  );

describe('must flag', () => {
  it('opi as a verb, a second clause without fime, de after an adjective', () => {
    const line = 'maivo opi maivo de lira ke vardesan de taivo de felberi.';
    expect(check(line).filter((d) => d.severity === 'error').length).toBeGreaterThan(0);
    expect(
      has(line, 'error', 'noun phrase', 'de', /de needs a noun or pronoun on both sides/),
    ).toBe(true);
  });

  it('adjacent bare nouns', () => {
    expect(has('maivo po ke baba melo lavra.', 'error', 'ADR-0011', 'melo lavra')).toBe(true);
  });

  it('sidu followed by a copula', () => {
    expect(has('ata po sabesia ito sidu ke vera.', 'error', 'sidu', 'ke', /copula/)).toBe(true);
  });

  it('a stranded preposition', () => {
    expect(has('li veluri lenila ala.', 'error', 'noun phrase', 'ala')).toBe(true);
  });

  it('de after a verb', () => {
    expect(has('li veluri po sarbisia de li faru.', 'error', 'noun phrase', 'de', /sarbisia/)).toBe(
      true,
    );
  });

  it('a second verb with no linker', () => {
    expect(
      has(
        'mavopagoasa po ke baba cilni kronobioka en li vilneri.',
        'error',
        'slot',
        'kronobioka',
        /second verb/,
      ),
    ).toBe(true);
  });

  it('po out of its slot, with no verb', () => {
    expect(has('taivo de valla baba lira po.', 'error', 'slot', 'po', /no verb or copula/)).toBe(
      true,
    );
  });

  it('a frame word that does not open its clause', () => {
    expect(has('maivo po lenila taivo de valla kenvi.', 'error', 'slot 1', 'kenvi')).toBe(true);
  });

  it('a copula before the subject in a question', () => {
    expect(has('ke maivo taivo de lavra ki?', 'error', 'ki', 'ke')).toBe(true);
  });

  it('warns on a give-type verb whose bare recipient is not a pronoun (1.2:G26)', () => {
    const d = check('taivo de valla po donuda li linu lavi.').find((x) => x.rule === '1.2:G26');
    expect(d).toMatchObject({ severity: 'warn', fix: 'donuda lavi ala li linu' });
  });

  it('warns when the gloss is passive and the line is not', () => {
    expect(
      has(
        'li peremori po ne relsira.',
        'warn',
        'passive',
        null,
        /were not answered/,
        'were not answered',
      ),
    ).toBe(true);
  });
});

describe('the 1.2 rulings', () => {
  it('a time word may close its clause, and its opening comma is optional (G24)', () => {
    expect(serious('Saivo po venreva pendi eli-krono.')).toEqual([]);
    expect(serious('Eli-krono maivo lirala.')).toEqual([]);
    expect(serious('Eli-krono, maivo lirala.')).toEqual([]);
  });

  it('a lone oro joins two parts, and may open a line (G25)', () => {
    expect(serious('miru oro nami')).toEqual([]);
    const all = checker.check(
      ['maivo ke taivo de lirasan lavra ki?', 'oro maivo ke li suma ki?'],
      [],
      {
        register: 'poetic',
      },
    );
    expect(all.filter((d) => d.severity === 'error' || d.severity === 'warn')).toEqual([]);
  });

  it('a pronoun recipient may stand bare after a give-type verb (G26)', () => {
    expect(serious('Taivo guraga maivo dossa cono.')).toEqual([]);
    expect(serious('taivo de valla po donuda maivo lavi.')).toEqual([]);
  });

  it('back-translates a pronoun after de as the owner (G27)', () => {
    expect(checker.backTranslate('li purma de maivo').text).toMatch(/of me$/);
  });
});

describe('the passive check', () => {
  it('lets a verb glossed "to be born" carry the passive itself', () => {
    const english = 'The city of heaven was born in the graceful eyes of the mother';
    const line = 'li cilni de mavopagoasa po kronobioka en li vanisan vilneri de li mareasa.';
    expect(check(line, english).filter((d) => d.rule === 'passive')).toEqual([]);
  });
});

describe('must pass: Lira de Kronoasa', () => {
  it.each([
    'kube krono po lombila, maivo po lenila taivo de melonulu.',
    'taivo de manliri po ke li lumiasasan biti raho po farlafa li pagoasa.',
    'saivori po lenila li narvonasan vani de li melonulu raho po lumila.',
    'yesta li raleri de li sadori de li ramumomvisan po lenila maivori de lira.',
  ])('%s', (line) => {
    expect(serious(line)).toEqual([]);
  });
});

describe('advisories', () => {
  it('shows a mechanical back-translation beside the gloss', () => {
    // 2.0 differentiated letosan: "lettered; set down in a letter" (it was "written");
    // 2.1 respelled leto as cuza (2.1:G58), so the adjective is cuzasan
    expect(checker.backTranslate('maivo de cuzasan nimu').text).toBe('my lettered home');
  });

  it('warns that there is no "about" after a communication verb with su (1.2:G30)', () => {
    expect(has('li veluri po sarbisia su li faru.', 'warn', '1.2:G30', 'su')).toBe(true);
  });
});

/* ------------------------------------------------------------ the guide */

interface Lexicon {
  examples: { liraasa: string; status: string }[];
  function_words: { example: string | null }[];
  discourse_particles: { examples: { liraasa: string }[] }[];
}

/** Every example sentence in the 1.0 lexicon, which the 1.0 grammar guide prints. */
function guideCorpus(): string[] {
  const lex = readSourceJson(LEXICON_FILE) as Lexicon;
  return [
    ...lex.examples.filter((e) => e.status !== 'HISTORICAL').map((e) => e.liraasa),
    ...lex.function_words.map((w) => w.example).filter((x): x is string => Boolean(x)),
    ...lex.discourse_particles.flatMap((d) => d.examples.map((e) => e.liraasa)),
  ];
}

/* Guide examples the checker flags. Each is a question for the author: either
   the rule or the example is wrong. Pinned so a change to either shows.

   - Retired or respelled words, unused slots, sola: the 1.0 text predates the
     lexicon the checker reads. lallesan and vaniasasan are listed in 2.0, so
     those two are no longer flagged; cupa, pamlonasan and bumreasasan were
     mended in the lexicon's own examples (ADR-0016), not in the frozen guide.
   - Maivo melo bena opioa lumi, Lotero silda: noun + noun (ADR-0011). Revised
     in 1.2 (data/changes/2026-10-17-grammar-rulings.json); the 1.0 text is
     frozen, so the finding stays pinned here.
   - "lira + yo = lirayo" and its siblings are morphology formulas, not sentences.
   - Taivo futu yugemeyiya fututi, which the old checker flagged, is correct:
     fututi is also a time word, and a time word may close its clause (1.2:G24).
   - 2.1 adds two kinds of finding the frozen text cannot avoid, counted rather
     than listed: a spelling 2.1 respelled (1.0:G19, naming its 2.1 spelling),
     and a fronted or ki-less question (2.1:G46). "Miyo baba sola" and "Li sola
     loya benasan" are no longer flagged: 2.1 made sola a word (sun, respelled
     from sulba), so they now read "there is a sun", against their English
     ("solitude"). Reported to the author. */
const SINCE_2_1 = { respelled: 28, questions: 18 };
const GUIDE_FINDINGS = [
  'Ki-saivo lirala? (historical) :: never invent :: historical',
  'Lotero silda, li cilni ka lasona. :: ADR-0011 :: Lotero silda',
  'Maivo melo bena opioa lumi :: ADR-0011 :: melo bena',
  'Maivo melo bena opioa lumi :: slot :: melo',
  'Maivo vurlova, hema, baba cupa de miru. :: 1.0:G19 :: cupa',
  'Ola ka li bumreasasan, zoke. :: 0.8:R2 :: bumreasasan',
  'Taivo ka ruli pamlonasan, zoke. — Ne zoke. Vera. :: 1.0:G19 :: pamlonasan',
  'lemu + pago = lemupago :: ADR-0011 :: lemu pago',
  'lemu + pago = lemupago :: slot :: lemupago',
  'lira + vu = liravu :: never invent :: vu',
  'lira + vu = liravu :: slot :: vu',
  'lira + yo = lirayo :: never invent :: yo',
  'lira + yo = lirayo :: slot :: yo',
];

/** What 2.1 adds to the frozen text: its respellings and its question rule. */
function since2_1(d: Diagnostic): boolean {
  const legacy = checker.index.legacy as Map<string, { edition?: string }>;
  return (
    d.rule === '2.1:G46' ||
    (d.rule === '1.0:G19' && legacy.get(String(d.token).toLowerCase())?.edition === '2.1')
  );
}

describe('must pass: the 1.0 grammar guide', () => {
  it('flags no guide example beyond the ones reported to the author', () => {
    const all = guideCorpus().flatMap((line) => serious(line).map((d) => ({ line, d })));
    const found = new Set(
      all
        .filter(({ d }) => !since2_1(d))
        .map(({ line, d }) => `${line} :: ${d.rule} :: ${String(d.token)}`),
    );
    expect([...found].sort()).toEqual(GUIDE_FINDINGS);
    const added = all.filter(({ d }) => since2_1(d));
    expect({
      respelled: added.filter(({ d }) => d.rule === '1.0:G19').length,
      questions: added.filter(({ d }) => d.rule === '2.1:G46').length,
    }).toEqual(SINCE_2_1);
  });
});
