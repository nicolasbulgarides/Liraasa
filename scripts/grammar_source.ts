/**
 * Read what the strict checker (src/core/grammar) is built from, for the CLIs
 * and the tests: the 2.5 LLM reference, the checker's overlay and rule
 * parameters, the known names and the legacy spellings. The browser bundle
 * (scripts/build_grammar.ts) packs the same object.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Flags, GrammarSource, Reference, RuleParams } from '../src/core/grammar/lexicon';

export const GRAMMAR_FILES = {
  reference: 'handoff/liraasa_2_5_llm.json',
  lexicon: 'data/lexicon/liraasa_2_5.json',
  flags: 'data/checker/lexicon_flags.json',
  rules: 'data/checker/rules_2_5.json',
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
