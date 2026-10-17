import { beforeAll, describe, expect, it } from 'vitest';
import { type Composer, type Finding, loadComposer } from './editorComposer';

/**
 * The editor's line checker against relexified English: Liraasa words in
 * English word order. The lines are the author's own, from "Song of Time",
 * whose audit (docs/reviews/2026-10-16-song-of-time.md) found these patterns
 * more than once. The other direction is pinned too: no live lexicon example
 * may trip one of these rules.
 */

let composer: Composer;
beforeAll(() => {
  composer = loadComposer();
});

/** The rules checkShape reports under; the older checks keep their own. */
const SHAPE_RULES = new Set([
  'clause template',
  'noun phrase',
  'fime',
  'sidu',
  'slot',
  '1.0 slot 1 FRAME',
  'ki',
]);

const check = (line: string, english?: string): Finding[] =>
  composer.checkLine(line, 1, 'poetic', english);
const shape = (line: string, severity: Finding['severity'] = 'error'): string[] =>
  check(line)
    .filter((f) => SHAPE_RULES.has(f.rule) && f.severity === severity)
    .map((f) => f.message);

describe('the lexicon examples pass', () => {
  /* The canon has three noun + noun phrases. The author has ruled that a
     noun never modifies a noun (ADR-0011), so they are errors now: reported
     here for the author, never corrected. Nothing else in the canon trips a
     shape error. */
  /* And two that use eli-krono at the end of the clause, where the author's
     frame rule wants it clause-initial: reported, not loosened. */
  const NOUN_NOUN = [
    'Maivo melo bena opioa lumi :: “melo” is in the verb slot but is not a verb form; its verb is meloma',
    'Maivo melo bena opioa lumi :: “opioa” is a second verb in one clause; open its clause with a linker (fime, raho, ata, kopisa…)',
    'Maivo melo bena opioa lumi :: “melo bena”: a noun does not modify a noun; use the adjective melosan (musical; melodic): melosan bena',
    'Lotero silda, li cilni ka lasona. :: “Lotero silda”: a noun does not modify a noun; use the adjective loterosan (other): loterosan silda',
    'Saivo po venreva pendi eli-krono. :: eli-krono is a clause-initial frame, followed by a comma',
    'Li navutrana ne ka sovesan eli-krono. :: eli-krono is a clause-initial frame, followed by a comma',
    'Maivo po lemula baba lotero lermi. :: “lotero lermi”: a noun does not modify a noun; use the adjective loterosan (other): loterosan lermi',
  ];

  it('no live example trips a shape error but the ones reported to the author', () => {
    const hits = composer.examples.flatMap(([liraasa]) =>
      shape(liraasa).map((m) => liraasa + ' :: ' + m),
    );
    expect(hits).toEqual(NOUN_NOUN);
  });

  it('warns only on eli-krono without its comma', () => {
    const hits = composer.examples.flatMap(([liraasa]) =>
      shape(liraasa, 'warn').map((m) => liraasa + ' :: ' + m),
    );
    expect(hits).toEqual([
      'Eli-krono maivo lirala. :: eli-krono frames the clause and is followed by a comma',
    ]);
  });
});

describe('Song of Time', () => {
  it('flags a clause-final po: no verb or copula after the tense (L2)', () => {
    const m = shape('taivo de valla baba lira de sizo lumi po.');
    expect(m).toContainEqual(expect.stringMatching(/^po has no verb or copula after it/));
  });

  it('flags a relative clause with a noun where its verb should be (L3, L4, L8, L15)', () => {
    expect(shape('taivo li lumiasasan biti po raho farla li pagoasa po.')).toContain(
      'raho opens a clause with no verb (“farla” is not a verb form; its verb is farlafa)',
    );
    expect(shape('maivo baba lavra de lirari po raho lemu taivo de valla po.')).toContain(
      'raho opens a clause with no verb (“lemu” is not a verb form; its verb is lemula)',
    );
    expect(shape('oro ke maivo li sili raho tivrori taivo de mare lore ki?')).toContain(
      'raho opens a clause with no verb (“tivrori” is not a verb form; its verb is tivrota)',
    );
  });

  it('flags ala used as the English infinitive "to" (L5, L7, L12)', () => {
    for (const line of [
      'mavopago po lenila taivo de valla ata sabe ito ala po ke simvoasa.',
      'eli-krono fime ke baba lumiasasan lumi dapa pifu ala loya.',
      'lumiasasan lumi po sarbisia lirari vobi li yanba veluri ala leni ala.',
    ]) {
      expect(shape(line)).toContainEqual(expect.stringMatching(/^ala needs a noun phrase/));
    }
  });

  it('flags fime used as the demonstrative "that" (L7)', () => {
    expect(shape('eli-krono fime ke baba lumiasasan lumi dapa pifu ala loya.')).toContainEqual(
      expect.stringMatching(/the demonstrative “that” is ola/),
    );
  });

  it('flags a question formed by moving the copula to the front (L14, L15)', () => {
    expect(shape('ke maivo taivo de jomru lavra de lirari ki?')).toContain(
      'questions keep statement order; ke is not moved to the front',
    );
    expect(shape('oro ke maivo li sili raho tivrori taivo de mare lore ki?')).toContain(
      'questions keep statement order; ke is not moved to the front',
    );
  });

  it('flags kenvi away from the start of its clause (L16)', () => {
    expect(shape('maivo po lenila taivo de valla kenvi, ata eli maivo de leto nimu po.')).toContain(
      'kenvi is a clause-initial frame, followed by a comma',
    );
  });

  it('flags two bare nouns, turning the first into its adjective (L2, L12)', () => {
    expect(shape('taivo de valla baba lira de sizo lumi po.')).toContain(
      '“sizo lumi”: a noun does not modify a noun; use the adjective sizosan (shimmering; iridescent): sizosan lumi',
    );
    expect(shape('lumiasasan lumi po sarbisia lirari vobi li yanba veluri.')).toContain(
      '“yanba veluri”: a noun does not modify a noun; use the adjective yanbasan (old): yanbasan veluri',
    );
  });

  it('leaves L9, which the audit found clean, alone', () => {
    expect(
      shape('yesta li raleri de li sadori de li ramumomvisan po lenila taivo de lira.'),
    ).toEqual([]);
  });

  it('passes the audit’s corrected lines that use only lexicon words', () => {
    for (const line of [
      'Taivo de valla po ka baba lira de sizosan lumi.',
      'Taivo de vani po ka baba sizosan lumi raho lumila.',
      'Lumiasasan lumi po sarbisia lirari, kopisa li yanbasan veluri lenila itori.',
      'Li masudevori de li mavopago po gome ramumomvira.',
    ]) {
      expect(shape(line), line).toEqual([]);
    }
  });
});

describe('what the canon allows', () => {
  it.each([
    // a lone preposition is an adverb
    'Krotiapo, maivo futu conodonuca.',
    // a cut-off line keeps its elided verb
    'Pilo po ne povi talita. Ata maivo po ne povi—',
    // a verbless adjective predicate after fime
    'Taivo maskama fime taivo ne lemvosan, nara maivo vimova taivo de vilneri.',
    // the passive: gome fills the verb slot, its verb follows
    'Li dorbi gome sevresia gagu li sora.',
  ])('%s', (line) => {
    expect(shape(line)).toEqual([]);
  });
});

/* Round 2: the song after the composer fixes, with 13 errors left. Each test
   is one of them, on the line as the author had it. */
describe('Song of Time, round 2', () => {
  /* ADR-0011: the first noun becomes its -san adjective (lira lavra is
     lirasan lavra). An unused -san is never used: then the lexicon's
     compound, or a de phrase. */
  it('turns the first of two nouns into its adjective', () => {
    expect(shape('li lira lavra ka lumisan.')).toContain(
      '“lira lavra”: a noun does not modify a noun; use the adjective lirasan (lyrical; sung): lirasan lavra',
    );
    for (const [line, fix] of [
      ['maivo po ke baba melo lavra raho po lemula taivo de valla.', 'melosan lavra'],
      [
        'ata li veluri po sarbisia lirari de li faru de maivori de farulavra amor.',
        'farulavrasan amor',
      ],
      ['oro maivo ke li suma raho tivrota taivo de mare lore ki?', 'maresan lore'],
      ['maivo po lenila taivo de yomla valla, ata eli po ke maivo de leto nimu.', 'yomlasan valla'],
    ] as const) {
      expect(
        shape(line).some((m) => m.endsWith(': ' + fix)),
        line,
      ).toBe(true);
    }
  });

  it('falls back to a compound or a de phrase when the -san slot is unused', () => {
    expect(shape('li lavra lira ka lumisan.')).toContain(
      '“lavra lira”: a noun does not modify a noun; lavrasan is unused, so use a de phrase (lira de lavra)',
    );
    expect(
      shape('li masudevori de li lordina mavopago po ke ramumomvisan ata po ne relsira.'),
    ).toContain(
      '“lordina mavopago”: a noun does not modify a noun; lordinasan is unused, so use a de phrase (mavopago de lordina)',
    );
  });

  it('flags sidu with a noun before it or a copula after it (L4, L5, L6)', () => {
    expect(
      shape('maivo po ke baba melosan lavra raho po lemula taivo de valla sidu lirala.'),
    ).toContainEqual(expect.stringMatching(/^sidu joins two verbs; “valla” before it/));
    expect(
      shape('mavopago po lenila maivori de melonulu ata po sabesia ito sidu ke vera.'),
    ).toContainEqual(expect.stringMatching(/^sidu takes a lexical verb, not the copula ke/));
    expect(
      shape('eli-krono ola ke baba lumiasasan lumi dapa opi sidu loya, saivori po senosia.'),
    ).toContainEqual(
      expect.stringMatching(/“opi” before it is not a verb form; its verb is opioa/),
    );
  });

  it('flags a second verb in one clause (L10)', () => {
    expect(shape('mavopagoasa po ke baba cilni kronobioka en taivo de vanisan vilneri.')).toContain(
      '“kronobioka” is a second verb in one clause; open its clause with a linker (fime, raho, ata, kopisa…)',
    );
  });

  it('flags de straight after a verb (L12)', () => {
    expect(
      shape('ata li veluri po sarbisia de li namina de li faru de maivori de farulavrasan amor.'),
    ).toContainEqual(expect.stringMatching(/^de cannot follow the verb “sarbisia”/));
  });

  it('warns when zafra, finra, lanto or kenvi opens a clause without its comma', () => {
    expect(shape('zafra li dorbi po lallela.', 'warn')).toContain(
      'zafra frames the clause and is followed by a comma',
    );
    expect(shape('Zafra, li dorbi po lallela.', 'warn')).toEqual([]);
  });

  it('shows what a -na form inverts', () => {
    expect(check('li lordina ka sahi.').map((f) => f.message)).toContain(
      '“lordina” is the negative of lordi (“order”): “chaos”',
    );
  });

  it('notes an English passive the Liraasa line leaves active (L9)', () => {
    const english = 'The doubts of the society of chaos were forgotten and were not answered.';
    const passive = (line: string) => check(line, english).filter((f) => f.rule === 'passive');
    expect(
      passive('li masudevori de li mavopago de lordina po ke ramumomvisan ata po ne relsira.'),
    ).toHaveLength(1);
    expect(
      passive('li masudevori de li mavopago de lordina po ke ramumomvisan ata po ne gome relsira.'),
    ).toEqual([]);
  });

  /* The author's frame rule makes eli-krono clause-initial only, so the
     round-2 line that ends "… eli-krono ata toda-krono ki?" is flagged now.
     Reported to the author, as the canon does the same. */
  it('flags eli-krono at the end of a clause under the frame rule', () => {
    expect(
      shape(
        'oro maivo ke taivo de kronoasasan jomrusan lavra de lirari eli-krono ata toda-krono ki?',
      ),
    ).toContain('eli-krono is a clause-initial frame, followed by a comma');
  });

  /* The corrected song (docs/reviews/2026-10-16-song-of-time.md, round 2):
     every word a lexicon entry, every line clean. */
  it.each([
    'maivo po ke baba melosan lavra raho po lemula sidu lirala taivo de valla.',
    'mavopago po lenila maivori de melonulu ata po sabesia fime ito ka vera.',
    'eli-krono, ola ke baba lumiasasan lumi raho maivori kopi loya, saivori po senosia.',
    'li masudevori de li mavopago de lordina po ke ramumomvisan ata po ne gome relsira.',
    'mavopagoasa po ke baba cilni raho po kronobioka en taivo de vanisan vilneri.',
    'lumiasasan lumi po sarbisia lirari kopisa li yanbasan veluri de vera lenila itori.',
    'ata li veluri po sarbisia lirari de li namina de li faru de maivori de farulavrasan amor.',
    'oro maivo ke li suma raho tivrota taivo de maresan lore ki?',
    'maivo po lenila taivo de yomlasan valla, ata eli po ke maivo de leto de nimu.',
  ])('passes: %s', (line) => {
    expect(check(line).filter((f) => f.severity !== 'note')).toEqual([]);
  });
});
