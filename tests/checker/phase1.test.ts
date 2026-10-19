import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { type Checker, type Reading, loadChecker } from './loadChecker';

/**
 * Phase 1: the tokenizer, the form index and the reader order
 * (how_to_translate.how_a_reader_parses_one_word).
 */

interface Ref {
  dictionary: {
    by_domain: Record<string, string[]>;
    role_codes: Record<string, string>;
    count: { headwords: number; meaningful_forms: number };
  };
  small_words: {
    function_words: { columns: string[]; rows: string[][] };
    pronouns: { form: string }[];
    correlatives: { rows: string[][] };
    time_words: { rows: string[][] };
    numbers: { examples: Record<string, string> };
    discourse_particles: { form: string; examples: { liraasa: string }[] }[];
  };
  recipes: { liraasa: string }[];
  rulings: { id: string; examples?: { liraasa: string }[] }[];
  examples: { sentences: [string, string][] };
  word_building: { lexicalised_derivations: Record<string, string> };
}

interface SongLine {
  n: number;
  original: string;
  fixed: string;
  english: string;
}

const song = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/song.json', import.meta.url)), 'utf8'),
) as { lines: SongLine[] };

let checker: Checker;
let ref: Ref;
beforeAll(() => {
  const loaded = loadChecker();
  checker = loaded.checker;
  ref = loaded.ref as unknown as Ref;
});

const read = (word: string, line = 'x ' + word): Reading | null | undefined =>
  checker.readLine(line).find((t) => t.type === 'word' && t.text === word)?.reading;

describe('tokenizer', () => {
  it('keeps hyphenated words whole and records offsets and punctuation', () => {
    const toks = checker.readLine('Eli-krono, maivo lirala.');
    expect(toks.map((t) => [t.type, t.text, t.start, t.end])).toEqual([
      ['word', 'Eli-krono', 0, 9],
      ['punct', ',', 9, 10],
      ['word', 'maivo', 11, 16],
      ['word', 'lirala', 17, 23],
      ['punct', '.', 23, 24],
    ]);
  });
});

describe('the form index', () => {
  it('reads every listed dictionary form with its headword, role and gloss', () => {
    let count = 0;
    for (const lines of Object.values(ref.dictionary.by_domain)) {
      for (const line of lines) {
        const head = line.split(/[ :]/)[0] ?? '';
        const body = line.slice(line.indexOf(': ') + 2);
        for (const part of body.split(' | ')) {
          const m = /^(?:([a-z]+) )?\(([a-z]+)\) (.*)$/.exec(part);
          if (m === null) throw new Error(part);
          const form = m[1] ?? head;
          const r = read(form);
          expect(r?.kind, form).toBe('lexical');
          expect(
            r?.readings.some((x) => x.root === head && x.role === m[2] && x.gloss === m[3]),
            `${form} as ${String(m[2])} of ${head}`,
          ).toBe(true);
          count += 1;
        }
      }
    }
    // every listed form, as the reference counts them (3666 in 1.2, 4032 in 2.0)
    expect(count).toBe(ref.dictionary.count.meaningful_forms);
  });

  it('reads every small word as its class', () => {
    const fw = ref.small_words.function_words;
    const form = fw.columns.indexOf('form');
    const expectClass = (w: string, cls: string): void => {
      const r = read(w);
      expect(
        r?.kind === 'lexical' || r?.readings.some((x) => x.cls === cls),
        `${w} as ${cls}`,
      ).toBe(true);
    };
    for (const row of fw.rows) {
      const w = row[form] ?? '';
      if (!w.startsWith('-') && !w.includes(' ')) expectClass(w, 'function word');
    }
    for (const p of ref.small_words.pronouns) expectClass(p.form, 'pronoun');
    for (const [w] of ref.small_words.correlatives.rows) expectClass(w ?? '', 'correlative');
    for (const [w] of ref.small_words.time_words.rows) {
      if (!(w ?? '').includes(' ')) expectClass(w ?? '', 'time word');
    }
    for (const d of ref.small_words.discourse_particles) expectClass(d.form, 'discourse particle');
  });
});

describe('the reader order', () => {
  it('a listed spelling beats a decomposition (lexicon first)', () => {
    expect(read('mavopago')?.kind).toBe('lexical'); // society, a headword, not mavo + -pago
  });

  it('numerals, hyphenated numerals and ordinals', () => {
    for (const w of Object.values(ref.small_words.numbers.examples)) {
      expect(read(w)?.kind, w).toBe('numeral');
    }
    expect(read('una-ne')).toMatchObject({ kind: 'numeral', ordinal: true });
  });

  it('derivations, regular and lexicalised', () => {
    expect(read('lirayo')).toMatchObject({ kind: 'derivation', base: 'lira', suffix: 'yo' });
    for (const w of Object.keys(ref.word_building.lexicalised_derivations)) {
      const r = read(w);
      expect(r?.kind === 'derivation' || r?.kind === 'lexical' || r?.kind === 'closed', w).toBe(
        true,
      );
    }
    expect(read('soloti')).toMatchObject({ kind: 'derivation', lexicalised: true });
  });

  it('-ri and -ti on a known stem, in suffix order', () => {
    expect(read('lirari')).toMatchObject({ suffixes: ['ri'], stem: 'lira' });
    expect(read('lirati')).toMatchObject({ suffixes: ['ti'], stem: 'lira' });
    expect(read('liratiri')).toMatchObject({ suffixes: ['ti', 'ri'], stem: 'lira' });
    expect(read('lirayori')).toMatchObject({ kind: 'derivation', suffixes: ['ri'] });
  });

  it('motion prefixes: curated metaphors, and the rest reported as unsettled', () => {
    expect(read('revo-sabesia')).toMatchObject({ kind: 'motion', curated: true });
    const d = checker.checkLine('maivo va-venreva.', 1);
    expect(d.map((x) => [x.severity, x.rule])).toEqual([['unsettled', '1.2:G35']]);
  });

  it('fractions, legacy spellings and names', () => {
    expect(read('tressa-de-cuara')?.kind).toBe('fraction');
    expect(read('bede')).toMatchObject({ kind: 'legacy', to: 'somubiti' });
    expect(read('Kipo', 'Kipo lirala')?.kind).toBe('name');
    expect(read('Dorinti', 'Dorinti lirala')?.kind).toBe('name'); // -ti on a name, 0.8:R12
    expect(read('Zorvelin', 'li Zorvelin')?.kind).toBe('name'); // capitalised, not line-initial
  });

  it('otherwise: not a word of Liraasa, never a guessed meaning', () => {
    expect(read('blorpa')).toBeNull();
    const [d] = checker.checkLine('maivo blorpa.', 1);
    expect(d).toMatchObject({ severity: 'error', rule: 'never invent', token: 'blorpa' });
    // capitalised at the start of a line is not enough to be a name
    expect(checker.checkLine('Zorvelin lirala.', 1)[0]).toMatchObject({ rule: 'never invent' });
  });

  it('an unlisted rule-built form is an unused slot (0.8:R2), not an unknown word', () => {
    const [d] = checker.checkLine('li lazuasa.', 1);
    expect(d).toMatchObject({ severity: 'warn', rule: '0.8:R2', token: 'lazuasa' });
  });

  it('a pre-1.0 spelling warns and names its replacement (1.0:G19)', () => {
    const [d] = checker.checkLine('li bede.', 1);
    expect(d).toMatchObject({ severity: 'warn', rule: '1.0:G19', fix: 'somubiti', autoFix: true });
  });
});

describe('the fixture song and canon', () => {
  it('every word of the song, original and fixed, is a word of Liraasa', () => {
    const bad = song.lines.flatMap((l) =>
      [l.original, l.fixed].flatMap((text) =>
        checker
          .checkLine(text, l.n)
          .filter((d) => d.rule === 'never invent' || d.rule === '0.8:R2'),
      ),
    );
    expect(bad).toEqual([]);
  });

  /**
   * Canon text that breaks a word-level rule. A golden failure is reported,
   * never auto-corrected (CLAUDE.md), so these are pinned for the author: the
   * test fails if one is fixed (remove it here) or a new one appears.
   */
  // 2.0's canon fixes (ADR-0016) mended five: cupa → buvokova, pamlonasan →
  // sulnosovenasan, lallesan and vaniasasan listed, the bumreasasan example rewritten.
  // 2.1 made sola a word (sun, respelled from sulba), so the miyo and loya examples
  // ("Miyo baba sola.", "Li sola loya benasan.", glossed "solitude") are no longer
  // flagged: they now read "sun", against their English. Reported to the author.
  const KNOWN_CANON_FINDINGS = [
    // 'Ki-saivo lirala?', the historical ki-saivo example, was a 2.1:G46 finding: under 2.2:G60
    // a question with a ki-word may end without ki, so it now reads clean
    'Maivo po helnaha li linu ko li helna. :: 1.2:G33 :: ko', // instrumental ko, written before yuta existed
  ];

  it('every canon sentence in the reference reads word by word', () => {
    const fw = ref.small_words.function_words;
    const ex = fw.columns.indexOf('example (Liraasa)');
    const lines = [
      ...fw.rows.map((r) => r[ex] ?? ''),
      ...ref.small_words.discourse_particles.flatMap((d) => d.examples.map((e) => e.liraasa)),
      ...ref.recipes.map((r) => r.liraasa),
      ...ref.rulings.flatMap((r) => (r.examples ?? []).map((e) => e.liraasa)),
      ...ref.examples.sentences.map(([l]) => l),
    ]
      // annotations, not text: "Ki-saivo lirala? (historical)", formulas such as "lira + yo = lirayo"
      .map((l) => l.replace(/\s*\([^)]*\)\s*$/, ''))
      .filter((l) => !/ \+ | = /.test(l));
    const found = new Set(
      lines.flatMap((line) =>
        checker
          .checkLine(line, 1)
          .filter((d) => d.severity === 'error' || d.severity === 'warn')
          .map((d) => `${line} :: ${d.rule} :: ${String(d.token)}`),
      ),
    );
    expect([...found].sort()).toEqual([...KNOWN_CANON_FINDINGS].sort());
  });
});
