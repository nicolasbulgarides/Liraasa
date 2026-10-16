/**
 * CLI: import a canonical lexicon into `data/lexicon/` and mint stable ids.
 *
 * The released 1.0 is copied through unchanged and its ids go to the sidecar,
 * so the canonical file stays byte-identical (Q3).
 *
 *   npm run lexicon:import -- [source.json] [--edition 1.1-draft]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { exportLexicon, serializeLexicon } from '../src/core/model/exportLexicon';
import { idStorageFor } from '../src/core/model/ids';
import { importLexicon } from '../src/core/model/importLexicon';
import type { IdMapFile } from '../src/core/model/ids';
import { buildIndexes } from '../src/core/model/indexes';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';

const DEFAULT_SOURCE = 'data/source/liraasa_1_0.json';
const LEXICON_DIR = 'data/lexicon';

function main(): void {
  const { positional, flags } = parseArgs(process.argv.slice(2), ['edition']);
  const sourcePath = resolve(positional[0] ?? DEFAULT_SOURCE);

  const raw = JSON.parse(readFileSync(sourcePath, 'utf8')) as RawLexicon;
  const edition = flags.edition ?? raw.version;

  const idsPath = resolve(LEXICON_DIR, 'ids.json');
  let existingIds: IdMapFile | undefined;
  try {
    existingIds = JSON.parse(readFileSync(idsPath, 'utf8')) as IdMapFile;
  } catch {
    // No sidecar yet: this is a first import and every id will be minted.
    existingIds = undefined;
  }

  const result = importLexicon(raw, existingIds === undefined ? {} : { ids: existingIds });
  const indexes = buildIndexes(result.lexicon);

  console.log(`Imported ${sourcePath}`);
  console.log(`  language        ${result.lexicon.language} ${result.lexicon.version}`);
  console.log(`  target edition  ${edition} (ids: ${idStorageFor(edition)})`);
  console.log(`  headwords       ${String(indexes.stats.headwords)}`);
  console.log(
    `    primal        ${String(indexes.stats.primalRoots)}` +
      `   compound ${String(indexes.stats.compounds)}`,
  );
  console.log(
    `  forms           ${String(indexes.stats.forms)}` +
      `   unused glosses ${String(indexes.stats.unusedGlossSlots)}`,
  );
  console.log(`  function words  ${String(indexes.stats.functionWords)}`);
  console.log(`  distinct forms  ${String(indexes.stats.distinctSpellings)}`);
  console.log(`  ids minted      ${String(result.newlyMinted)}`);

  if (result.warnings.length > 0) {
    console.warn(`\n${String(result.warnings.length)} warning(s):`);
    for (const w of result.warnings.slice(0, 20)) console.warn(`  ${w}`);
  }

  const outPath = resolve(LEXICON_DIR, `liraasa_${edition.replace(/[.-]/g, '_')}.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  // No trailing newline: a released edition must stay byte-identical, and
  // the author's json.dump writes none.
  writeFileSync(outPath, serializeLexicon(exportLexicon(result.lexicon, { edition })), 'utf8');
  writeFileSync(idsPath, `${JSON.stringify(result.ids, null, 1)}\n`, 'utf8');

  console.log(`\nWrote ${outPath}`);
  console.log(`Wrote ${idsPath}`);
}

main();
