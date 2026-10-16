import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

/** Absolute path to a file under data/source/, the read-only reference set. */
export function sourcePath(name: string): string {
  return fileURLToPath(new URL(`../../data/source/${name}`, import.meta.url));
}

/** Parse a source JSON file. Callers assert the shape they expect. */
export function readSourceJson(name: string): unknown {
  return JSON.parse(readFileSync(sourcePath(name), 'utf8'));
}

export const LEXICON_FILE = 'liraasa_1_0.json';
export const VALIDATION_FILE = 'validation_1_0.json';
export const QUICKSTART_FILE = 'liraasa_1_0_quickstart.json';
