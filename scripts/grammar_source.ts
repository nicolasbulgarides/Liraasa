/**
 * Read what the strict checker (src/core/grammar) is built from, for the CLIs
 * and the tests: the 3.0 LLM reference, the checker's overlay and rule
 * parameters, the known names and the legacy spellings. The browser bundle
 * (scripts/build_grammar.ts) packs the same object.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Flags, GrammarSource, Reference, RuleParams } from '../src/core/grammar/lexicon';
import type { EnglishData, TranslateSource } from '../src/core/translate';

export const GRAMMAR_FILES = {
  reference: 'handoff/liraasa_4_1_llm.json',
  lexicon: 'data/lexicon/liraasa_4_1.json',
  flags: 'data/checker/lexicon_flags.json',
  rules: 'data/checker/rules_3_0.json',
  names: 'data/checker/names.json',
  transitive: 'data/checker/transitive_2_5.json',
} as const;

const read = (path: string): unknown => JSON.parse(readFileSync(resolve(path), 'utf8'));

export function loadGrammarSource(): GrammarSource {
  const lex = read(GRAMMAR_FILES.lexicon) as {
    legacy: { migration_forms: Record<string, { to: string; kind: string }> };
  };
  let transitive: string[] = [];
  try {
    transitive = (read(GRAMMAR_FILES.transitive) as { verbs: string[] }).verbs;
  } catch {
    transitive = [];
  }
  return {
    ref: read(GRAMMAR_FILES.reference) as Reference,
    flags: read(GRAMMAR_FILES.flags) as Flags,
    rules: read(GRAMMAR_FILES.rules) as RuleParams,
    legacy: Object.fromEntries(
      Object.entries(lex.legacy.migration_forms)
        .filter(([, m]) => m.kind !== 'archived-phrase')
        .map(([old, m]) => [old, { to: m.to, kind: m.kind, edition: null }]),
    ),
    names: (read(GRAMMAR_FILES.names) as { names: string[] }).names,
    transitive,
  };
}

/** The translator's sources: the grammar, the English data, the numerals and the synonyms. */
export function loadTranslateSource(): TranslateSource {
  const lex = read(GRAMMAR_FILES.lexicon) as {
    numbers: { lookup_0_999: Record<string, string> };
    headwords: { root: string; english_synonyms: string[]; forms: Record<string, string> }[];
    english_aliases?: Record<string, string>;
  };
  // 3.3: an English alias of a headword's form is one more name to find the headword by
  const synonyms = Object.fromEntries(
    lex.headwords.map((h) => [h.root, [...h.english_synonyms]] as [string, string[]]),
  );
  for (const [form, english] of Object.entries(lex.english_aliases ?? {})) {
    const h = lex.headwords.find((x) => Object.values(x.forms).includes(form));
    const list = h === undefined ? undefined : synonyms[h.root];
    if (list === undefined) continue;
    for (const e of english.split(';').map((x) => x.trim()))
      if (e !== '' && !list.includes(e)) list.push(e);
  }
  return {
    grammar: loadGrammarSource(),
    english: read('data/translate/english_2_5.json') as EnglishData,
    numerals: lex.numbers.lookup_0_999,
    synonyms,
  };
}
