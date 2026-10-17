/**
 * CLI: build Liraasa 1.2 from the immutable 1.1 baseline plus the 1.2
 * changesets (ADR-0013).
 *
 *   npm run integrate:1.2            # audit + write
 *   npm run integrate:1.2 -- --check # audit only, write nothing
 *
 * Reversible by construction, like the 1.1 integration (ADR-0009): it reads
 * 1.1 and writes only new files, and halts unless 1.1 is byte-for-byte the
 * file the changesets were written against.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyChangesets, auditBuild, type LexiconChangeset } from '../src/core/change/apply';
import type { IdMapFile } from '../src/core/model/ids';
import { serializeLexicon } from '../src/core/model/exportLexicon';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { CHANGESETS_1_2 } from './changesets_1_2';

const BASELINE = 'data/lexicon/liraasa_1_1.json';
const EXPECTED_SHA = '819b002c48be6c570d8b9fc6c2d4101fe6accaddee9688d74ff3bb8269b06e18';
const IDS = 'data/lexicon/ids.json';
/** Fixed so repeated runs are byte-identical; the build did run on this date. */
const BUILT_UTC = '2026-10-17T12:00:00Z';
const VERSION = '1.2';

const sha256 = (text: string | Buffer): string => createHash('sha256').update(text).digest('hex');

function main(): void {
  const { flags, booleans } = parseArgs(process.argv.slice(2), ['out-dir']);
  const outDir = resolve(flags['out-dir'] ?? 'data/lexicon');

  const baselineBytes = readFileSync(resolve(BASELINE));
  const actualSha = sha256(baselineBytes);
  console.log(`baseline  ${BASELINE}\nsha256    ${actualSha}`);
  if (actualSha !== EXPECTED_SHA) {
    console.error(
      `\nHALTED: the 1.1 baseline is not the file the 1.2 changesets were written against.`,
    );
    console.error(`  expected ${EXPECTED_SHA}`);
    process.exit(1);
  }
  const baseline = JSON.parse(baselineBytes.toString('utf8')) as RawLexicon;
  const ids = JSON.parse(readFileSync(resolve(IDS), 'utf8')) as IdMapFile;
  const changesets = CHANGESETS_1_2.map(
    (p) => JSON.parse(readFileSync(resolve(p), 'utf8')) as LexiconChangeset,
  );

  const { lexicon, applied } = applyChangesets(baseline, changesets, {
    version: VERSION,
    builtUtc: BUILT_UTC,
    source:
      `Built deterministically from liraasa_1_1.json (sha256 ${actualSha}) by scripts/integrate_1_2.ts, ` +
      `applying the changesets ${changesets.map((c) => c.id).join(' and ')} (ADR-0012, ADR-0013). ` +
      'This JSON is the single source of truth for Liraasa 1.2.',
    ids,
  });
  const byOp = new Map<string, number>();
  for (const a of applied) byOp.set(a.op, (byOp.get(a.op) ?? 0) + 1);
  console.log(`applied   ${String(applied.length)} ops`);
  for (const [op, count] of byOp) console.log(`            ${op.padEnd(20)} ${String(count)}`);

  const audit = auditBuild(lexicon);
  const before = auditBuild(baseline);
  for (const f of audit.findings) console.error(`   FAIL    ${f}`);
  console.log('\ncounts           1.1 → 1.2');
  for (const [k, v] of Object.entries(audit.counts)) {
    console.log(
      `  ${k.padEnd(22)} ${String(before.counts[k as keyof typeof before.counts]).padStart(5)} → ${String(v)}`,
    );
  }
  // The 1.1 baseline carries no inline ids yet, so its own audit reports that; 1.2 must be clean.
  if (!audit.passed) {
    console.error('\nHALTED: the build audit found problems; nothing was written.');
    process.exit(1);
  }
  if (booleans.has('check')) {
    console.log('\n--check: audit passed, nothing written.');
    return;
  }

  mkdirSync(outDir, { recursive: true });
  const text = serializeLexicon(lexicon);
  writeFileSync(resolve(outDir, 'liraasa_1_2.json'), text, 'utf8');
  const report = {
    report: 'Liraasa 1.2 build',
    built_utc: BUILT_UTC,
    baseline: { file: 'liraasa_1_1.json', sha256: actualSha },
    changesets: CHANGESETS_1_2.map((p, i) => ({
      file: p,
      id: changesets[i]?.id,
      sha256: sha256(readFileSync(resolve(p))),
    })),
    output: {
      file: 'liraasa_1_2.json',
      sha256: sha256(text),
      bytes: Buffer.byteLength(text, 'utf8'),
    },
    counts: { before: before.counts, after: audit.counts },
    audit: { passed: audit.passed, findings: audit.findings },
    applied,
  };
  writeFileSync(
    resolve(outDir, 'integration_report_1_2.json'),
    `${JSON.stringify(report, null, 1)}\n`,
    'utf8',
  );
  console.log(`\nWrote ${outDir}/liraasa_1_2.json (${String(report.output.bytes)} bytes)`);
  console.log(`      sha256 ${report.output.sha256}`);
  console.log(`Wrote ${outDir}/integration_report_1_2.json`);
}

main();
