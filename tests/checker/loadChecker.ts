import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import vm from 'node:vm';

/**
 * Load the browser grammar checker (editor/checker/*.js) into a Node context,
 * exactly as editor/index.html loads it: the three generated data scripts,
 * then the modules in the order index.js declares (LiraasaChecker.MODULES).
 */

const at = (rel: string): string =>
  fileURLToPath(new URL(`../../editor/checker/${rel}`, import.meta.url));

export interface Diagnostic {
  line: number;
  start: number;
  end: number;
  token: string | null;
  severity: 'error' | 'warn' | 'note' | 'unsettled';
  rule: string;
  message: string;
  fix: string | null;
  fixStart: number | null;
  fixEnd: number | null;
  autoFix: boolean;
}

export interface Reading {
  kind: string;
  word: string;
  readings: { form?: string; root?: string; role?: string; gloss?: string; cls?: string }[];
  suffixes: string[];
  [key: string]: unknown;
}

export interface Token {
  type: 'word' | 'punct';
  text: string;
  lower?: string;
  start: number;
  end: number;
  reading?: Reading | null;
}

export interface Checker {
  readLine(line: string): Token[];
  checkLine(line: string, no: number, english?: string, opts?: { register?: string }): Diagnostic[];
  check(lines: string[], english?: string[], opts?: { register?: string }): Diagnostic[];
  applyFix(line: string, d: Diagnostic): string;
  backTranslate(line: string): { words: { text: string; gloss: string }[]; text: string };
  index: Record<string, unknown>;
}

export interface CheckerApi {
  create(ref: unknown, extra: unknown, flags: unknown): Checker;
  default?: Checker;
  loadError?: Error;
  MODULES: string[];
}

export function loadChecker(): { api: CheckerApi; checker: Checker; ref: Record<string, unknown> } {
  const context = vm.createContext({});
  vm.runInContext('var window = globalThis;', context);
  const run = (rel: string): void => {
    vm.runInContext(readFileSync(at(rel), 'utf8'), context, { filename: rel });
  };
  for (const data of ['data/reference.js', 'data/extra.js', 'data/flags.js', 'data/english.js'])
    run(data);
  // index.js declares the load order; read it from there so the tests and the page agree.
  const index = readFileSync(at('index.js'), 'utf8');
  const listed = /C\.MODULES = \[([^\]]*)\]/.exec(index);
  if (listed === null) throw new Error('index.js does not declare LiraasaChecker.MODULES');
  const modules = [...(listed[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1] ?? '');
  for (const m of modules) run(m);
  const api = (context as { LiraasaChecker: CheckerApi }).LiraasaChecker;
  if (api.loadError !== undefined) throw api.loadError;
  if (api.default === undefined) throw new Error('the checker did not start');
  return {
    api,
    checker: api.default,
    ref: (context as { LIRAASA_REF: Record<string, unknown> }).LIRAASA_REF,
  };
}
