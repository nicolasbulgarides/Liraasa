import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { createChecker, type Checker } from '../../src/core/grammar';
import { loadGrammarSource } from '../../scripts/grammar_source';

/** The 2.5 strict checker, built once for a test file from the same data the editor bundles. */
let cached: Checker | undefined;
export function strictChecker(): Checker {
  cached ??= createChecker(loadGrammarSource());
  return cached;
}

export const read = (rel: string): unknown =>
  JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8'));

export interface PatchExample {
  liraasa: string;
  english?: string;
  why?: string;
}
export interface PatchDecision {
  ruling_id: string | null;
  issue: string;
  examples_grammatical?: PatchExample[];
  examples_ungrammatical?: PatchExample[];
}

export const patch = (): { decisions: PatchDecision[] } =>
  read('../../data/proposals/liraasa_2_5_patch.json') as { decisions: PatchDecision[] };

export const reference = (): {
  examples: { sentences: [string, string][]; contrasts_to_avoid: [string, string][] };
  recipes: { liraasa: string }[];
  rulings: { id: string; status?: string; examples?: { liraasa: string }[] }[];
  album: { tracks: { track: string; lines: { liraasa: string; current?: string }[] }[] };
} => read('../../handoff/liraasa_2_5_llm.json') as never;

/** errors and warnings: what makes a sentence fail */
export const serious = (
  ck: Checker,
  line: string,
): { severity: string; rule: string; message: string }[] =>
  ck.checkLine(line).findings.filter((f) => f.severity === 'error' || f.severity === 'warn');
