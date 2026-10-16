/**
 * CLI: export the working lexicon in the author's schema, losslessly.
 *
 * Verifies the round trip before writing: if the export does not reproduce the
 * source, it refuses rather than overwriting the canonical file (ADR-0002).
 *
 *   npm run lexicon:export -- [source.json] [--out path] [--edition 1.1-draft]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { exportLexicon, serializeLexicon } from '../src/core/model/exportLexicon';
import { importLexicon } from '../src/core/model/importLexicon';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';

const DEFAULT_SOURCE = 'data/source/liraasa_1_0.json';

/** Deep structural comparison, reporting the first differing path. */
function firstDifference(a: unknown, b: unknown, path = ''): string | null {
  if (a === b) return null;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return `${path}: length ${String(a.length)} vs ${String(b.length)}`;
    for (let i = 0; i < a.length; i += 1) {
      const d = firstDifference(a[i], b[i], `${path}[${String(i)}]`);
      if (d !== null) return d;
    }
    return null;
  }
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.join(',') !== kb.join(',')) return `${path}: keys differ`;
    for (const k of ka) {
      const d = firstDifference(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
        `${path}.${k}`,
      );
      if (d !== null) return d;
    }
    return null;
  }
  return `${path}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`;
}

function main(): void {
  const { positional, flags } = parseArgs(process.argv.slice(2), ['edition', 'out']);
  const sourcePath = resolve(positional[0] ?? DEFAULT_SOURCE);
  const raw = JSON.parse(readFileSync(sourcePath, 'utf8')) as RawLexicon;
  const edition = flags.edition ?? raw.version;

  const { lexicon } = importLexicon(raw);
  const exported = exportLexicon(lexicon, { edition });

  // At the source's own edition the export must be identical. At a later
  // edition it differs only by the additive id fields.
  if (edition === raw.version) {
    const diff = firstDifference(exported, raw);
    if (diff !== null) {
      console.error(`Refusing to write: the export is not lossless.\n  ${diff}`);
      process.exit(1);
    }
    console.log('Round trip verified: the export is identical to the source.');
  } else {
    console.log(`Exporting at ${edition}: adds inline ids to the source shape.`);
  }

  const out = flags.out;
  // No trailing newline, matching the author's json.dump.
  const text = serializeLexicon(exported);
  if (out === undefined) {
    process.stdout.write(text);
  } else {
    writeFileSync(resolve(out), text, 'utf8');
    console.log(`Wrote ${resolve(out)} (${String(Buffer.byteLength(text, 'utf8'))} bytes)`);
  }
}

main();
