import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FORM_SLOTS, SLOT_RAW_KEY, isUnusedGloss } from '../../src/core/config/slots';
import type { RawLexicon } from '../../src/core/model/raw';

/**
 * handoff/liraasa_1_2_llm.json: the one-file reference for language models
 * (npm run build:llm). Its dictionary is one line per headword; parsing every
 * line back must give exactly the lexicon's meaningful forms, so the compact
 * format is lossless and adds nothing.
 */

const read = (path: string): unknown =>
  JSON.parse(readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8'));

interface Reference {
  rulings: { id: string }[];
  dictionary: { role_codes: Record<string, string>; by_domain: Record<string, string[]> };
  small_words: { function_words: { rows: string[][] } };
  examples: { sentences: [string, string][] };
}

const llm = read('../../handoff/liraasa_1_2_llm.json') as Reference;
const latest = read('../../LirasaCodexLatest/liraasa_1_2_llm.json');
const lex = read('../../data/lexicon/liraasa_1_2.json') as RawLexicon;
const lines = Object.values(llm.dictionary.by_domain).flat();
const CODE = ['n', 'an', 'nn', 'v', 'na', 'a', 'aa'];
const LINE = /^([a-z]+)(?: \[([a-z]+)\+([a-z]+)\])?(?: \{([^}]*)\})?: (.*)$/;
/** A form, or just `(n) …` for the noun form, which is the headword itself. */
const FORM = /^(?:([a-z]+) )?\(([a-z]+)\) (.*)$/;

interface Parsed {
  word: string;
  parts: [string, string] | null;
  flags: string[];
  forms: [string, string, string][];
}

function parse(line: string): Parsed {
  const m = LINE.exec(line);
  if (m === null) throw new Error(`unparseable line: ${line}`);
  const forms = (m[5] ?? '').split(' | ').map((f) => {
    const fm = FORM.exec(f);
    if (fm === null) throw new Error(`unparseable form "${f}" in ${line}`);
    if ((fm[1] === undefined) !== (fm[2] === 'n'))
      throw new Error(`form spelling misplaced in ${line}`);
    return [fm[1] ?? m[1] ?? '', fm[2] ?? '', fm[3] ?? ''] as [string, string, string];
  });
  return {
    word: m[1] ?? '',
    parts: m[2] === undefined ? null : [m[2], m[3] ?? ''],
    flags: m[4] === undefined ? [] : m[4].split(', '),
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
      const flags = [
        ...(h.register === 'poetic' ? ['poetic'] : []),
        ...(h.since === lex.version ? [`new in ${lex.version}`] : []),
      ];
      expect(e.flags, e.word).toEqual(flags);
    }
  });

  it('carries every ruling, every function word and only canon examples', () => {
    const r = lex as unknown as Record<string, { id: string }[]>;
    const total = ['rulings_1_2', 'rulings_1_0', 'rulings_0_8_carried'].reduce(
      (n, k) => n + (r[k]?.length ?? 0),
      0,
    );
    expect(llm.rulings).toHaveLength(total + 1); // + ADR-0011
    expect(llm.small_words.function_words.rows.map((row) => row[0])).toEqual(
      lex.function_words.map((f) => f.form),
    );
    const live = lex.examples.filter((e) => e.status !== 'HISTORICAL');
    expect(llm.examples.sentences).toEqual(live.map((e) => [e.liraasa, e.english]));
  });
});
