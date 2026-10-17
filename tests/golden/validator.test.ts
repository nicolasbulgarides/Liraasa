import { beforeAll, describe, expect, it } from 'vitest';
import { type Composer, type Finding, loadComposer } from './editorComposer';
import { LEXICON_FILE, readSourceJson } from './sourcePaths';

/**
 * The editor's validator (checkLine / checkText in editor/index.html) against
 * the author's regression list: lines it must flag, lines it must pass, and
 * every example sentence in the 1.0 lexicon, which the grammar guide is
 * generated from. A guide example that fails is reported to the author, never
 * fixed by loosening a rule: it is pinned in GUIDE_FINDINGS below.
 */

let composer: Composer;
beforeAll(() => {
  composer = loadComposer();
});

const findings = (line: string, english?: string): Finding[] =>
  composer.checkLine(line, 1, 'poetic', english);
const of = (line: string, severity: Finding['severity'], english?: string): string[] =>
  findings(line, english)
    .filter((f) => f.severity === severity)
    .map((f) => f.message);
const errors = (line: string): string[] => of(line, 'error');

describe('must flag', () => {
  it('opi as a verb, a second clause without fime, de after an adjective', () => {
    const m = errors('maivo opi maivo de lira ke vardesan de taivo de felberi.');
    expect(m).toContainEqual(expect.stringMatching(/“opi”.*not a verb form.*opioa/));
    expect(m).toContainEqual(expect.stringMatching(/“ke” is a second verb.*fime/));
    expect(m).toContainEqual(expect.stringMatching(/de after the adjective “vardesan”/));
  });

  it('an unpaired oro across two questions', () => {
    const f = composer.checkText(
      ['maivo ke taivo de lirasan lavra ki?', 'oro maivo ke li suma ki?'],
      'poetic',
      [],
    );
    expect(f.filter((x) => x.severity === 'error').map((x) => [x.line, x.message])).toContainEqual([
      2,
      expect.stringMatching(/oro is paired/),
    ]);
  });

  it('adjacent bare nouns', () => {
    expect(errors('maivo po ke baba melo lavra.')).toContainEqual(
      expect.stringMatching(/“melo lavra”: a noun does not modify a noun/),
    );
  });

  it('sidu followed by a copula', () => {
    expect(errors('ata po sabesia ito sidu ke vera.')).toContainEqual(
      expect.stringMatching(/sidu takes a lexical verb, not the copula ke/),
    );
  });

  it('a stranded preposition', () => {
    expect(errors('li veluri lenila ala.')).toContainEqual(
      expect.stringMatching(/^ala needs a noun phrase after it/),
    );
  });

  it('de after a verb', () => {
    expect(errors('li veluri po sarbisia de li faru.')).toContainEqual(
      expect.stringMatching(/^de cannot follow the verb “sarbisia”/),
    );
  });

  it('a second verb with no linker', () => {
    expect(errors('mavopagoasa po ke baba cilni kronobioka en li vilneri.')).toContainEqual(
      expect.stringMatching(/“kronobioka” is a second verb/),
    );
  });

  it('po out of its slot, with no verb', () => {
    expect(errors('taivo de valla baba lira po.')).toContainEqual(
      expect.stringMatching(/^po has no verb or copula after it/),
    );
  });

  it('a frame word that does not open its clause', () => {
    expect(errors('maivo po lenila taivo de valla kenvi.')).toContainEqual(
      expect.stringMatching(/^kenvi is a clause-initial frame/),
    );
  });

  it('a copula before the subject in a question', () => {
    expect(errors('ke maivo taivo de lavra ki?')).toContainEqual(
      expect.stringMatching(/^questions keep statement order; ke/),
    );
  });

  it('warns on a give-type verb with two bare noun phrases', () => {
    expect(of('taivo de valla po donuda maivo lavi.', 'warn')).toContainEqual(
      expect.stringMatching(/donuda.*VERB THEME ala RECIPIENT.*donuda lavi ala maivo/),
    );
  });

  it('warns when the gloss is passive and the line is not', () => {
    expect(of('li peremori po ne relsira.', 'warn', 'were not answered')).toContainEqual(
      expect.stringMatching(/the English is passive \(“were not answered”\)/),
    );
  });
});

describe('the passive check', () => {
  it('lets a verb glossed "to be born" carry the passive itself', () => {
    const english = 'The city of heaven was born in the graceful eyes of the mother';
    const line = 'li cilni de mavopagoasa po kronobioka en li vanisan vilneri de li mareasa.';
    expect(findings(line, english).filter((f) => f.rule === 'passive')).toEqual([]);
  });
});

describe('must pass: Lira de Kronoasa', () => {
  it.each([
    'kube krono po lombila, maivo po lenila taivo de melonulu.',
    'taivo de manliri po ke li lumiasasan biti raho po farlafa li pagoasa.',
    'saivori po lenila li narvonasan vani de li melonulu raho po lumila.',
    'yesta li raleri de li sadori de li ramumomvisan po lenila maivori de lira.',
  ])('%s', (line) => {
    expect(findings(line).filter((f) => f.severity !== 'note')).toEqual([]);
  });
});

describe('advisories', () => {
  it('shows a mechanical back-translation beside the gloss', () => {
    expect(composer.backTranslate('maivo de letosan nimu')).toBe('my written home');
  });

  it('warns that 1.0 has no "about" after a communication verb with su', () => {
    expect(of('li veluri po sarbisia su li faru.', 'warn')).toContainEqual(
      "1.0 has no 'about'; “sarbisia su” reads literally",
    );
  });
});

/* ------------------------------------------------------------ the guide */

interface Lexicon {
  examples: { liraasa: string; english: string; status: string }[];
  function_words: { form: string; example: string | null }[];
  discourse_particles: { form: string; examples: { liraasa: string; english: string }[] }[];
}

/** Every example sentence in the 1.0 lexicon, which the grammar guide prints. */
function guideCorpus(): string[] {
  const lex = readSourceJson(LEXICON_FILE) as Lexicon;
  return [
    ...lex.examples.filter((e) => e.status !== 'HISTORICAL').map((e) => e.liraasa),
    ...lex.function_words.map((w) => w.example).filter((x): x is string => Boolean(x)),
    ...lex.discourse_particles.flatMap((d) => d.examples.map((e) => e.liraasa)),
  ];
}

/* Guide examples the validator flags. Each is a question for the author:
   either the rule or the example is wrong. Pinned so a change to either shows.

   - Retired or respelled words, and forms in an unused slot: the editor reads
     the 1.1 lexicon, the guide was written against 1.0.
   - Maivo melo bena opioa lumi: a pronoun owner without de, and two nouns.
   - Lotero silda: two nouns (ADR-0011).
   - Eli-krono maivo lirala, …pendi eli-krono: eli-krono without its comma,
     and not clause-initial.
   - Taivo guraga maivo (dossa) cono: guraga, "to owe", as VERB RECIPIENT
     THEME, where the give-type pattern expects THEME ala RECIPIENT.
   - miru oro nami: a lone oro, where oro is paired.
   - lira + yo = lirayo: a morphology formula, not a sentence.
   - Taivo futu yugemeyiya fututi: fututi after the verb (1.0:G1). */
const GUIDE_FINDINGS: string[] = [
  'Li lira ka vaniasasan. :: warn: “vaniasasan” is a form whose slot has no meaning — “— (unused)”',
  'Maivo melo bena opioa lumi :: error: “melo” is in the verb slot but is not a verb form; its verb is meloma',
  'Maivo melo bena opioa lumi :: error: “opioa” is a second verb in one clause; open its clause with a linker (fime, raho, ata, kopisa…)',
  'Maivo melo bena opioa lumi :: error: “melo bena”: a noun does not modify a noun; use the adjective melosan (musical; melodic): melosan bena',
  'Eli-krono maivo lirala. :: warn: eli-krono frames the clause and is followed by a comma',
  'lira + yo = lirayo :: error: “yo” is not a word of Liraasa',
  'lira + vu = liravu :: error: “vu” is not a word of Liraasa',
  'Ola ka li bumreasasan, zoke. :: warn: “bumreasasan” is a form whose slot has no meaning — “— (unused)”',
  'Lotero silda, li cilni ka lasona. :: error: “Lotero silda”: a noun does not modify a noun; use the adjective loterosan (other): loterosan silda',
  'Taivo guraga maivo dossa cono. :: warn: “guraga” is a give-type verb: the pattern is VERB THEME ala RECIPIENT (guraga dossa cono ala maivo)',
  'Taivo futu yugemeyiya fututi. :: error: fututi (APPROACH) cannot follow the verb',
  'Taivo guraga maivo cono. :: warn: “guraga” is a give-type verb: the pattern is VERB THEME ala RECIPIENT (guraga cono ala maivo)',
  'Taivo guraga maivo pendi dossa cono. :: warn: “guraga” is a give-type verb: the pattern is VERB THEME ala RECIPIENT (guraga pendi dossa cono ala maivo)',
  'Saivo po venreva pendi eli-krono. :: error: eli-krono is a clause-initial frame, followed by a comma',
  'Li dorbi ke lallesan hoyo! :: warn: “lallesan” is a form whose slot has no meaning — “— (unused)”',
  'miru oro nami :: error: oro is paired: oro A oro B (either A or B); this oro has no partner',
  'Ki-saivo lirala? (historical) :: error: “historical” is not a word of Liraasa',
  'Miyo baba sola. :: error: “sola” is not a word of Liraasa',
  'Li sola loya benasan. :: error: “sola” is not a word of Liraasa',
  'Taivo guraga maivo pendi dossa cono. :: warn: “guraga” is a give-type verb: the pattern is VERB THEME ala RECIPIENT (guraga pendi dossa cono ala maivo)',
  'Li dorbi ke lallesan hoyo! :: warn: “lallesan” is a form whose slot has no meaning — “— (unused)”',
  'Maivo vurlova, hema, baba cupa de miru. :: warn: “cupa” is pre-1.0; now buvokova',
  'Ola ka li bumreasasan, zoke. :: warn: “bumreasasan” is a form whose slot has no meaning — “— (unused)”',
  'Taivo ka ruli pamlonasan, zoke. — Ne zoke. Vera. :: warn: “pamlonasan” is pre-1.0; now sulnosovenasan',
];

describe('must pass: the 1.0 grammar guide', () => {
  it('flags no guide example beyond the ones reported to the author', () => {
    const hits = guideCorpus().flatMap((line) =>
      findings(line)
        .filter((f) => f.severity !== 'note')
        .map((f) => line + ' :: ' + f.severity + ': ' + f.message),
    );
    expect(hits).toEqual(GUIDE_FINDINGS);
  });
});
