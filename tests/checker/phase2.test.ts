import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { type Checker, type Diagnostic, loadChecker } from './loadChecker';

/**
 * Phase 2: the slot parser and every self_check rule it carries.
 * Examples use canon words only; each one isolates a single rule.
 */

interface Expect {
  phase: number;
  severity: string;
  rule: string;
  token: string;
}
interface SongLine {
  n: number;
  original: string;
  fixed: string;
  expect: Expect[];
}

const read = (rel: string): unknown =>
  JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8'));
const song = read('./fixtures/song.json') as { lines: SongLine[] };
const flags = read('../../data/checker/lexicon_flags.json') as Record<
  string,
  Record<string, string>
>;

let checker: Checker;
let ref: { self_check: { source: string }[]; rulings: { id: string }[] };
beforeAll(() => {
  const loaded = loadChecker();
  checker = loaded.checker;
  ref = loaded.ref as unknown as typeof ref;
});

const findings = (line: string): Diagnostic[] => checker.checkLine(line, 1);
const serious = (line: string): Diagnostic[] =>
  findings(line).filter((d) => d.severity === 'error' || d.severity === 'warn');
const hits = (line: string, rule: string, severity?: string): Diagnostic[] =>
  findings(line).filter(
    (d) => d.rule === rule && (severity === undefined || d.severity === severity),
  );

describe('the fixture song', () => {
  it('each original line produces its Phase 2 diagnostics', () => {
    for (const l of song.lines) {
      for (const e of l.expect.filter((x) => x.phase <= 2)) {
        const d = checker.checkLine(l.original, l.n);
        expect(
          d.some(
            (x) =>
              x.rule === e.rule && x.severity === e.severity && x.token?.toLowerCase() === e.token,
          ),
          `line ${String(l.n)}: ${e.severity} ${e.rule} on “${e.token}” in ${JSON.stringify(d.map((x) => [x.severity, x.rule, x.token]))}`,
        ).toBe(true);
      }
    }
  });

  it('every fixed line has no errors or warnings', () => {
    for (const l of song.lines) {
      expect(
        serious(l.fixed).map((d) => `${d.rule}: ${d.message}`),
        `line ${String(l.n)}`,
      ).toEqual([]);
    }
  });

  it('the suggested fixes rebuild the author’s corrections', () => {
    const fixOf = (n: number, rule: string): string => {
      const l = song.lines.find((x) => x.n === n);
      if (l === undefined) throw new Error(String(n));
      const d = checker.checkLine(l.original, n).find((x) => x.rule === rule);
      if (d === undefined) throw new Error(`${String(n)} ${rule}`);
      return checker.applyFix(l.original, d);
    };
    expect(fixOf(10, '1.0:G21')).toBe(
      'maivo de savali, raho ke su taivo de lehe, donuda taivo opi.',
    );
    expect(fixOf(15, 'slot')).toBe('fisa lavbula gase taivo venreva ala maivo de lumiasasan pago.');
    expect(fixOf(5, '0.8:G2')).toBe('ne ramumomvira taivo de lumiasasan kronobio.');
  });
});

describe('the self_check rules', () => {
  it('a non-verb in the verb slot names its verb form (slot)', () => {
    const [d] = hits('maivo po milobe.', 'slot');
    expect(d).toMatchObject({ severity: 'error', token: 'milobe', fix: 'milobema', autoFix: true });
  });

  it('a second verb in one clause with no linker (slot)', () => {
    expect(hits('maivo lirala venreva.', 'slot', 'error')).toHaveLength(1);
  });

  it('a second noun phrase but no verb or copula (slot)', () => {
    expect(hits('maivo li lira.', 'slot', 'error')[0]?.message).toMatch(/no verb or copula/);
  });

  it('give-type verbs: a pronoun recipient stands bare, any other takes ala (1.2:G26)', () => {
    expect(serious('Taivo guraga maivo dossa cono.')).toEqual([]);
    expect(hits('maivo donuda li sora li bumre.', '1.2:G26', 'warn')).toHaveLength(1);
  });

  it('two bare nouns: the first becomes its adjective (ADR-0011)', () => {
    const [d] = hits('lira lavra', 'ADR-0011');
    expect(d).toMatchObject({ severity: 'error', fix: 'lirasan lavra', autoFix: true });
  });

  it('de with nothing after it, or after a verb (noun phrase)', () => {
    expect(hits('maivo lirala de.', 'noun phrase', 'error')).toHaveLength(1);
  });

  it('a stranded preposition; ala is never the infinitive (noun phrase)', () => {
    expect(hits('maivo vurlova ala lirala.', 'noun phrase')[0]?.message).toMatch(
      /never the infinitive/,
    );
    expect(hits('maivo lirala en.', 'noun phrase', 'error')).toHaveLength(1);
  });

  it('sidu joins two verbs, never a copula (sidu)', () => {
    expect(serious('Maivo vurlova sidu lirala.')).toEqual([]);
    expect(hits('maivo vurlova sidu ka benasan.', 'sidu', 'error')).toHaveLength(1);
  });

  it('fime is followed by its clause’s subject (fime)', () => {
    expect(hits('maivo sabesia fime ka vera.', 'fime', 'error')).toHaveLength(1);
  });

  it('frame words open their clause, with a comma (slot 1)', () => {
    expect(hits('maivo zafra lirala.', 'slot 1', 'error')).toHaveLength(1);
    expect(hits('Zafra li dorbi po lallela.', 'slot 1', 'warn')[0]).toMatchObject({
      fix: 'Zafra,',
    });
    expect(serious('Zafra, li dorbi po lallela.')).toEqual([]);
  });

  it('a time word opening a clause: the comma is optional (1.2:G24)', () => {
    expect(hits('Eli-krono maivo lirala.', '1.2:G24', 'note')).toHaveLength(1);
    expect(findings('Eli-krono, maivo lirala.')).toEqual([]);
  });

  it('operators before the verb, in slot order, one per slot (1.0:G1, 1.0:G16)', () => {
    expect(hits('maivo lirala po.', '1.0:G1', 'error')).toHaveLength(1);
    expect(hits('maivo roni po lirala.', '1.0:G1', 'error')).toHaveLength(1);
    expect(hits('maivo yehu gesu lirala.', '1.0:G16', 'error')).toHaveLength(1);
    expect(hits('maivo hiro roni lirala.', '1.0:G16', 'error')).toHaveLength(1);
    expect(serious('Maivo po noma suvi lirala.')).toEqual([]);
  });

  it('ki last; attitude words clause-final (1.0:G22)', () => {
    expect(hits('taivo lirala ki poye.', '1.0:G22', 'error')).toHaveLength(1);
    expect(hits('Poye maivo lirala.', '1.0:G22', 'error')).toHaveLength(1);
    expect(serious('Taivo lirala poye ki?')).toEqual([]);
  });

  it('a question keeps statement order (ki)', () => {
    expect(hits('Ka taivo benasan ki?', 'ki', 'error')).toHaveLength(1);
  });

  it('a saying verb with su is not “about” (1.2:G30)', () => {
    expect(hits('maivo senosia su li lira.', '1.2:G30', 'warn')).toHaveLength(1);
  });

  it('ne with nothing after it, when the clause has a verb (0.8:G2)', () => {
    const [d] = hits('maivo lirala ne.', '0.8:G2', 'error');
    expect(d?.message).toMatch(/nuna-krono/);
    expect(serious('Kipo resora. Dorin, ne.')).toEqual([]); // ellipsis (0.8:G3)
  });

  it('a relative clause not closed by a comma is noted (1.0:G21)', () => {
    expect(hits('Li nela raho lirala ka benasan.', '1.0:G21', 'note')).toHaveLength(1);
    expect(findings('Li nela, raho lirala, ka benasan.')).toEqual([]);
  });

  it('commands, address and the hortative need no subject (1.2:G31)', () => {
    for (const line of [
      'Vulravelmava maivo de yendo, fisa.',
      'Taivo viki pagopa ligo maivo ki, maivo de amor?',
      'Yava lirala!',
      'fisa, lirala',
    ]) {
      expect(serious(line), line).toEqual([]);
    }
  });
});

describe('rule ids and the overlay', () => {
  it('every rule id a diagnostic cites exists in self_check or the rulings', () => {
    const known = new Set([
      ...ref.self_check.map((s) => s.source),
      ...ref.rulings.map((r) => r.id),
      'clause.copulas', // a note pointing at the reference section it enforces
      '-na', // self_check: "-na direction; hema as hesitation" (no id of its own)
      'hema',
      'gloss drift', // the English cross-check (Phase 4)
      'tense',
      'passive',
      'calque',
    ]);
    const lines = song.lines
      .flatMap((l) => [l.original, l.fixed])
      .concat([
        'maivo po milobe.',
        'lira lavra',
        'maivo lirala de.',
        'maivo zafra lirala.',
        'maivo lirala po.',
        'taivo lirala ki poye.',
        'Ka taivo benasan ki?',
        'maivo vurlova sidu ka benasan.',
        'maivo sabesia fime ka vera.',
        'maivo blorpa.',
        'taivo ke baba farulavra.',
      ]);
    const used = new Set(lines.flatMap((l) => findings(l).map((d) => d.rule)));
    for (const rule of used) expect(known.has(rule), rule).toBe(true);
  });

  it('every overlay key is a word the reference knows', () => {
    for (const table of [
      'word_class',
      'give_type',
      'say_type',
      'noun_class',
      'not_causative',
      'ko_combines',
      'preposition_sense',
    ]) {
      for (const w of Object.keys(flags[table] ?? {})) {
        if (w.startsWith('_')) continue;
        const r = checker.readLine(w)[0]?.reading;
        expect(r?.kind === 'lexical' || r?.kind === 'closed', `${table}.${w}`).toBe(true);
      }
    }
  });
});
