import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { type Checker, type Diagnostic, loadChecker } from './loadChecker';

/**
 * The old editor checker's tests (tests/golden/checker.test.ts), ported to the
 * new checker before the editor switches over. The lines are the author's own,
 * from the "Song of Time" audits (docs/reviews/2026-10-16-song-of-time.md).
 * Assertions name the rule and the word, not the old wording.
 */

let checker: Checker;
beforeAll(() => {
  checker = loadChecker().checker;
});

const check = (line: string, english?: string): Diagnostic[] =>
  checker.checkLine(line, 1, english, { register: 'poetic' });
const serious = (line: string): Diagnostic[] =>
  check(line).filter((d) => d.severity === 'error' || d.severity === 'warn');
const has = (line: string, rule: string, token: string, text?: RegExp): boolean =>
  check(line).some(
    (d) =>
      d.rule === rule &&
      d.token?.toLowerCase() === token &&
      (text === undefined || text.test(d.message)),
  );

describe('Song of Time', () => {
  it('flags a clause-final po: no verb or copula after the tense (L2)', () => {
    expect(
      has('taivo de valla baba lira de sizo lumi po.', 'slot', 'po', /no verb or copula/),
    ).toBe(true);
  });

  it('flags a relative clause with a noun where its verb should be (L3, L4, L8, L15)', () => {
    for (const [line, noun, verb] of [
      ['taivo li lumiasasan biti po raho farla li pagoasa po.', 'farla', 'farlafa'],
      ['maivo baba lavra de lirari po raho lemu taivo de valla po.', 'lemu', 'lemula'],
      ['oro ke maivo li sili raho tivrori taivo de mare lore ki?', 'tivrori', 'tivrota'],
    ] as const) {
      expect(has(line, 'slot', noun, new RegExp('its verb is ' + verb)), line).toBe(true);
    }
  });

  it('flags ala used as the English infinitive "to" (L5, L7, L12)', () => {
    for (const line of [
      'mavopago po lenila taivo de valla ata sabe ito ala po ke simvoasa.',
      'eli-krono fime ke baba lumiasasan lumi dapa pifu ala loya.',
      'lumiasasan lumi po sarbisia lirari vobi li yanba veluri ala leni ala.',
    ]) {
      expect(has(line, 'noun phrase', 'ala'), line).toBe(true);
    }
  });

  it('flags fime used as the demonstrative "that" (L7)', () => {
    expect(
      has('eli-krono fime ke baba lumiasasan lumi dapa pifu ala loya.', 'fime', 'fime', /ola/),
    ).toBe(true);
  });

  it('flags a question formed by moving the copula to the front (L14, L15)', () => {
    expect(has('ke maivo taivo de jomru lavra de lirari ki?', 'ki', 'ke')).toBe(true);
    expect(has('oro ke maivo li sili raho tivrori taivo de mare lore ki?', 'ki', 'ke')).toBe(true);
  });

  it('flags kenvi away from the start of its clause (L16)', () => {
    const line = 'maivo po lenila taivo de valla kenvi, ata eli maivo de leto nimu po.';
    expect(has(line, 'slot 1', 'kenvi')).toBe(true);
    expect(check(line).filter((d) => d.token === 'kenvi')).toHaveLength(1); // once, not twice
  });

  it('flags two bare nouns, turning the first into its adjective (L2, L12)', () => {
    const fixOf = (line: string): string | null | undefined =>
      check(line).find((d) => d.rule === 'ADR-0011')?.fix;
    expect(fixOf('taivo de valla baba lira de sizo lumi po.')).toBe('sizosan lumi');
    expect(fixOf('lumiasasan lumi po sarbisia lirari vobi li yanba veluri.')).toBe(
      'yanbasan veluri',
    );
  });

  it('leaves L9, which the audit found clean, alone', () => {
    expect(
      serious('yesta li raleri de li sadori de li ramumomvisan po lenila taivo de lira.'),
    ).toEqual([]);
  });

  it.each([
    'Taivo de valla po ka baba lira de sizosan lumi.',
    'Taivo de vani po ka baba sizosan lumi raho lumila.',
    'Lumiasasan lumi po sarbisia lirari, kopisa li yanbasan veluri lenila itori.',
    'Li masudevori de li mavopago po gome ramumomvira.',
  ])('passes the audit’s corrected line: %s', (line) => {
    expect(serious(line)).toEqual([]);
  });
});

describe('what the canon allows', () => {
  it.each([
    'Krotiapo, maivo futu conodonuca.', // a lone preposition is an adverb
    'Pilo po ne povi talita. Ata maivo po ne povi—', // a cut-off line keeps its elided verb
    'Taivo maskama fime taivo ne lemvosan, nara maivo vimova taivo de vilneri.', // verbless adjective predicate after fime
    'Li dorbi gome sevresia gagu li sora.', // gome fills the verb slot, its verb follows
  ])('%s', (line) => {
    expect(serious(line)).toEqual([]);
  });
});

describe('Song of Time, round 2', () => {
  it('turns the first of two nouns into its adjective', () => {
    for (const [line, fix] of [
      ['li lira lavra ka lumisan.', 'lirasan lavra'],
      ['maivo po ke baba melo lavra raho po lemula taivo de valla.', 'melosan lavra'],
      [
        'ata li veluri po sarbisia lirari de li faru de maivori de farulavra amor.',
        'farulavrasan amor',
      ],
      ['oro maivo ke li suma raho tivrota taivo de mare lore ki?', 'maresan lore'],
      ['maivo po lenila taivo de yomla valla, ata eli po ke maivo de leto nimu.', 'yomlasan valla'],
    ] as const) {
      expect(
        check(line).some((d) => d.rule === 'ADR-0011' && d.fix === fix),
        line,
      ).toBe(true);
    }
  });

  it('falls back to a compound or a de phrase when the adjective is unused', () => {
    // 2.0 lists lavrasan ("avian; birdlike"), so ADR-0011's first choice, the adjective, applies
    expect(check('li lavra lira ka lumisan.').find((d) => d.rule === 'ADR-0011')?.fix).toBe(
      'lavrasan lira',
    );
    // 2.0 also lists lordinasan ("chaotic; disordered")
    expect(
      check('li masudevori de li lordina mavopago po ke ramumomvisan ata po ne relsira.').find(
        (d) => d.rule === 'ADR-0011',
      )?.fix,
    ).toBe('lordinasan mavopago');
    // where the adjective is still unused, the fallback is the de phrase
    expect(check('li kova lira ka lumisan.').find((d) => d.rule === 'ADR-0011')?.fix).toBe(
      'lira de kova',
    );
  });

  it('flags sidu with a noun before it or a copula after it (L4, L5, L6)', () => {
    expect(
      has(
        'maivo po ke baba melosan lavra raho po lemula taivo de valla sidu lirala.',
        'sidu',
        'sidu',
        /“valla” before it/,
      ),
    ).toBe(true);
    expect(
      has(
        'mavopago po lenila maivori de melonulu ata po sabesia ito sidu ke vera.',
        'sidu',
        'ke',
        /copula/,
      ),
    ).toBe(true);
    expect(
      has(
        'eli-krono ola ke baba lumiasasan lumi dapa opi sidu loya, saivori po senosia.',
        'sidu',
        'sidu',
        /its verb is opioa/,
      ),
    ).toBe(true);
  });

  it('flags a second verb in one clause (L10)', () => {
    expect(
      has(
        'mavopagoasa po ke baba cilni kronobioka en taivo de vanisan vilneri.',
        'slot',
        'kronobioka',
        /second verb/,
      ),
    ).toBe(true);
  });

  it('flags de straight after a verb (L12)', () => {
    expect(
      has(
        'ata li veluri po sarbisia de li namina de li faru de maivori de farulavrasan amor.',
        'noun phrase',
        'de',
        /sarbisia/,
      ),
    ).toBe(true);
  });

  it('warns when zafra, finra, lanto or kenvi opens a clause without its comma', () => {
    expect(
      check('zafra li dorbi po lallela.').some((d) => d.rule === 'slot 1' && d.severity === 'warn'),
    ).toBe(true);
    expect(serious('Zafra, li dorbi po lallela.')).toEqual([]);
  });

  it('shows what a -na form inverts', () => {
    expect(check('li lordina ka sahi.').map((d) => d.message)).toContain(
      '“lordina” is the negative of lordi (“order”): “chaos”.',
    );
  });

  it('flags an English passive the Liraasa line leaves active (L9)', () => {
    const english = 'The doubts of the society of chaos were forgotten and were not answered.';
    const passive = (line: string): Diagnostic[] =>
      check(line, english).filter((d) => d.rule === 'passive');
    expect(
      passive('li masudevori de li mavopago de lordina po ke ramumomvisan ata po ne relsira.'),
    ).toEqual([]); // ke + adjective
    expect(
      passive('li masudevori de li mavopago de lordina po ramumomvira ata po ne relsira.'),
    ).toHaveLength(1);
    expect(
      passive(
        'li masudevori de li mavopago de lordina po gome ramumomvira ata po ne gome relsira.',
      ),
    ).toEqual([]);
  });

  it('lets eli-krono close a clause', () => {
    expect(
      serious(
        'oro maivo ke taivo de kronoasasan jomrusan lavra de lirari eli-krono ata toda-krono ki?',
      ),
    ).toEqual([]);
  });

  it.each([
    'maivo po ke baba melosan lavra raho po lemula sidu lirala taivo de valla.',
    'mavopago po lenila maivori de melonulu ata po sabesia fime ito ka vera.',
    'eli-krono, ola ke baba lumiasasan lumi raho maivori kopi loya, saivori po senosia.',
    'li masudevori de li mavopago de lordina po ke ramumomvisan ata po ne gome relsira.',
    'mavopagoasa po ke baba cilni raho po kronobioka en taivo de vanisan vilneri.',
    'lumiasasan lumi po sarbisia lirari kopisa li yanbasan veluri de vera lenila itori.',
    'ata li veluri po sarbisia lirari de li namina de li faru de maivori de farulavrasan amor.',
    'oro maivo ke li suma raho tivrota taivo de maresan lore ki?',
    // in 2.1 spelling: leto (letter) is cuza (2.1:G58)
    'maivo po lenila taivo de yomlasan valla, ata eli po ke maivo de cuza de nimu.',
  ])('passes the corrected song: %s', (line) => {
    expect(serious(line).filter((d) => d.severity === 'error' || d.severity === 'warn')).toEqual(
      [],
    );
  });
});

describe('register notes (0.8:R10)', () => {
  it('notes an ascended form outside a sacred text, and not inside one', () => {
    const ascended = (register: string): Diagnostic[] =>
      checker
        .checkLine('Li lira ka lumiasasan.', 1, '', { register })
        .filter((d) => d.rule === '0.8:R10');
    expect(ascended('poetic')).toHaveLength(1);
    expect(ascended('sacred')).toEqual([]);
  });
});

describe('the editor page', () => {
  it('loads the checker data, then every module in the order index.js declares', () => {
    const html = readFileSync(
      fileURLToPath(new URL('../../editor/index.html', import.meta.url)),
      'utf8',
    );
    const srcs = [...html.matchAll(/<script src="checker\/([^"]+)"><\/script>/g)].map((m) => m[1]);
    const api = loadChecker().api;
    expect(srcs).toEqual([
      'data/reference.js',
      'data/extra.js',
      'data/flags.js',
      'data/english.js',
      ...api.MODULES,
    ]);
  });
});
