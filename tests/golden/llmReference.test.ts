import { PROPOSED_EDITIONS } from '../../scripts/proposed_editions';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FORM_SLOTS, SLOT_RAW_KEY, isUnusedGloss } from '../../src/core/config/slots';
import type { RawLexicon } from '../../src/core/model/raw';

/**
 * handoff/liraasa_3_4_llm.json: the one-file reference for language models
 * (npm run build:llm). Its dictionary is one line per headword; parsing every
 * line back must give exactly the lexicon's meaningful forms, so the compact
 * format is lossless and adds nothing.
 */

const read = (path: string): unknown =>
  JSON.parse(readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8'));

interface Reference {
  rulings: { id: string }[];
  word_building: {
    image_compounds?: { attested: Record<string, string>; modifiers: object; heads: object };
    derivation_defaults?: Record<string, string>;
  };
  dictionary: { role_codes: Record<string, string>; by_domain: Record<string, string[]> };
  small_words: { function_words: { rows: string[][] } };
  examples: { sentences: [string, string][] };
}

const llm = read('../../handoff/liraasa_3_4_llm.json') as Reference;
const latest = read('../../LirasaCodexLatest/liraasa_3_4_llm.json');
const lex = read('../../data/lexicon/liraasa_3_4.json') as RawLexicon;
const lines = Object.values(llm.dictionary.by_domain).flat();
const CODE = ['n', 'an', 'nn', 'v', 'na', 'a', 'aa'];
/** HEADWORD [PART+PART(+-SUFFIX)] {FLAGS}: … (a lexicalised suffix: 2.0:G38) */
const LINE = /^([a-z]+)(?: \[([a-z]+)\+([a-z]+)(?:\+-([a-z]+))?\])?(?: \{([^}]*)\})?: (.*)$/;
/** A form, or just `(n) …` for the noun form, which is the headword itself. */
const FORM = /^(?:([a-z]+) )?\(([a-z]+)\) (.*)$/;

interface Parsed {
  word: string;
  parts: [string, string] | null;
  suffix: string | null;
  flags: string[];
  forms: [string, string, string][];
}

function parse(line: string): Parsed {
  const m = LINE.exec(line);
  if (m === null) throw new Error(`unparseable line: ${line}`);
  const forms = (m[6] ?? '').split(' | ').map((f) => {
    const fm = FORM.exec(f);
    if (fm === null) throw new Error(`unparseable form "${f}" in ${line}`);
    if ((fm[1] === undefined) !== (fm[2] === 'n'))
      throw new Error(`form spelling misplaced in ${line}`);
    return [fm[1] ?? m[1] ?? '', fm[2] ?? '', fm[3] ?? ''] as [string, string, string];
  });
  return {
    word: m[1] ?? '',
    parts: m[2] === undefined ? null : [m[2], m[3] ?? ''],
    suffix: m[4] ?? null,
    flags: m[5] === undefined ? [] : m[5].split(', '),
    forms,
  };
}

describe('the LLM reference', () => {
  it('is published to LirasaCodexLatest identically', () => {
    expect(latest).toEqual(llm);
  });

  it('has a legend for every role code', () => {
    expect(Object.keys(llm.dictionary.role_codes)).toEqual(CODE);
  });

  it('lists every headword exactly once', () => {
    expect(lines.map((l) => parse(l).word).sort()).toEqual(lex.headwords.map((h) => h.root).sort());
  });

  it('round-trips: every line parses back to exactly the lexicon entry', () => {
    const byRoot = new Map(lex.headwords.map((h) => [h.root, h]));
    for (const line of lines) {
      const e = parse(line);
      const h = byRoot.get(e.word);
      if (h === undefined) throw new Error(`${e.word} is not a headword`);
      const g = h.glosses as unknown as Record<string, string>;
      const f = h.forms as unknown as Record<string, string>;
      const expected = FORM_SLOTS.map((s, i) => [
        f[SLOT_RAW_KEY[s]],
        CODE[i],
        g[SLOT_RAW_KEY[s]],
      ]).filter(([, , gloss]) => !isUnusedGloss(gloss ?? ''));
      expect(e.forms, e.word).toEqual(expected);
      expect(e.parts, e.word).toEqual(h.components);
      expect(e.suffix, e.word).toBe((h as unknown as { suffix?: string }).suffix ?? null);
      const flags = [
        ...(h.register === 'poetic' ? ['poetic'] : []),
        ...(h.since === lex.version || PROPOSED_EDITIONS.includes(h.since)
          ? [`new in ${h.since}`]
          : []),
        // the old roots of a respelled headword, and a listed derivation it replaced (2.3:G70),
        // for reading older texts
        ...Object.entries(lex.legacy.migration_forms)
          .filter(
            ([, m]) =>
              m.to === h.root &&
              ((m.slot === 'root' && m.kind === 'respelled') ||
                (m.slot === 'derivation' && m.kind === 'retired')),
          )
          .map(([w]) => `formerly ${w}`),
      ];
      expect(e.flags, e.word).toEqual(flags);
    }
  });

  it('carries every ruling, every function word and only canon examples', () => {
    const r = lex as unknown as Record<string, { id: string }[]>;
    // every edition's rulings, superseded ones included (kept and marked, 2.2)
    const total = Object.keys(r)
      .filter((k) => k.startsWith('rulings_'))
      .reduce((n, k) => n + (r[k]?.length ?? 0), 0);
    expect(llm.rulings).toHaveLength(total + 1); // + ADR-0011
    // 2.5 (I-44): the historical and formula rows are a table of their own
    const table = (f: object): string | undefined => (f as { table?: string }).table;
    const sw = llm.small_words as unknown as { historical_and_formulae: { rows: string[][] } };
    expect(llm.small_words.function_words.rows.map((row) => row[0])).toEqual(
      lex.function_words.filter((f) => table(f) === undefined).map((f) => f.form),
    );
    expect(sw.historical_and_formulae.rows.map((row) => row[0])).toEqual(
      lex.function_words.filter((f) => table(f) !== undefined).map((f) => f.form),
    );
    // 2.5 (I-40): canonical sentences apart from illustrations and contrasts
    const kind = (e: object): string => (e as { kind?: string }).kind ?? 'canonical';
    const live = lex.examples.filter((e) => e.status !== 'HISTORICAL');
    expect(llm.examples.sentences).toEqual(
      live.filter((e) => kind(e) === 'canonical').map((e) => [e.liraasa, e.english]),
    );
  });

  it('carries the image-compound pattern with every attested pair, and the derivation defaults', () => {
    const pc = lex.image_compounds;
    const ic = llm.word_building.image_compounds;
    if (pc === undefined || ic === undefined) throw new Error('no pattern');
    expect(ic.attested).toEqual(
      Object.fromEntries(pc.attested.map((h) => [h.root, h.glosses.root])),
    );
    expect(Object.keys(ic.modifiers)).toHaveLength(Object.keys(pc.modifiers).length);
    expect(Object.keys(ic.heads)).toHaveLength(Object.keys(pc.heads).length);
    expect(llm.word_building.derivation_defaults).toEqual(
      (lex.morphology as unknown as { derivation_defaults: unknown }).derivation_defaults,
    );
  });
});
