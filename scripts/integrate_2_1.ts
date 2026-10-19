/**
 * CLI: build Liraasa 2.1 from the frozen 2.0 lexicon plus the 2.1 changeset
 * (ADR-0017).
 *
 *   npm run integrate:2.1            # audit + write
 *   npm run integrate:2.1 -- --check # audit only, write nothing
 *
 * As for 2.0 (ADR-0016): it reads 2.0, writes only new files, and halts unless
 * 2.0 is byte-for-byte the file the changeset was written against. The 2.0
 * word-building rulings stay on, and each id counter continues after the
 * highest id 2.0 holds. 2.1 mints no new ids: a respelled root, and a root
 * replaced by a compound, keep theirs (2.1:G58, G59).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyChangesets, auditBuild, type LexiconChangeset } from '../src/core/change/apply';
import type { IdMapFile } from '../src/core/model/ids';
import { serializeLexicon } from '../src/core/model/exportLexicon';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { CHANGESETS_2_1 } from './changesets_2_1';
import { WORD_BUILDING_2_0, idsAfter } from './integrate_2_0';

const BASELINE = 'data/lexicon/liraasa_2_0.json';
const EXPECTED_SHA = 'f958e760fa41ac10e21d8a5e04f68d7c18e98539b436e436ef0d1ca211706ae2';
const IDS = 'data/lexicon/ids.json';
/** Fixed so repeated runs are byte-identical. */
const BUILT_UTC = '2026-10-18T20:00:00Z';
const VERSION = '2.1';

const sha256 = (text: string | Buffer): string => createHash('sha256').update(text).digest('hex');

export function build2_1(): {
  lexicon: RawLexicon;
  text: string;
  sha: string;
  changesets: LexiconChangeset[];
} {
  const baselineBytes = readFileSync(resolve(BASELINE));
  const sha = sha256(baselineBytes);
  if (sha !== EXPECTED_SHA) {
    throw new Error(
      `the 2.0 baseline is not the file the 2.1 changeset was written against (sha256 ${sha}, expected ${EXPECTED_SHA})`,
    );
  }
  const baseline = JSON.parse(baselineBytes.toString('utf8')) as RawLexicon;
  const ids = idsAfter(baseline, JSON.parse(readFileSync(resolve(IDS), 'utf8')) as IdMapFile);
  const changesets = CHANGESETS_2_1.map(
    (p) => JSON.parse(readFileSync(resolve(p), 'utf8')) as LexiconChangeset,
  );
  const { lexicon } = applyChangesets(baseline, changesets, {
    version: VERSION,
    builtUtc: BUILT_UTC,
    source:
      `Built deterministically from liraasa_2_0.json (sha256 ${sha}) by scripts/integrate_2_1.ts, ` +
      `applying the changeset ${changesets.map((c) => c.id).join(' and ')} (ADR-0017). ` +
      'This JSON is the single source of truth for Liraasa 2.1.',
    ids,
    wordBuilding: WORD_BUILDING_2_0, // unchanged in 2.1
  });
  return { lexicon, text: serializeLexicon(lexicon), sha, changesets };
}

function main(): void {
  const { flags, booleans } = parseArgs(process.argv.slice(2), ['out-dir']);
  const outDir = resolve(flags['out-dir'] ?? 'data/lexicon');
  console.log(`baseline  ${BASELINE}`);
  let built: ReturnType<typeof build2_1>;
  try {
    built = build2_1();
  } catch (e) {
    console.error(`\nHALTED: ${(e as Error).message}`);
    process.exit(1);
  }
  const { lexicon, text, sha, changesets } = built;
  console.log(`sha256    ${sha}`);
  const baseline = JSON.parse(readFileSync(resolve(BASELINE), 'utf8')) as RawLexicon;
  const audit = auditBuild(lexicon, WORD_BUILDING_2_0);
  const before = auditBuild(baseline, WORD_BUILDING_2_0);
  for (const f of audit.findings) console.error(`   FAIL    ${f}`);
  console.log('\ncounts           2.0 → 2.1');
  for (const [k, v] of Object.entries(audit.counts)) {
    console.log(
      `  ${k.padEnd(22)} ${String(before.counts[k as keyof typeof before.counts]).padStart(5)} → ${String(v)}`,
    );
  }
  const attested = (lexicon as unknown as { image_compounds?: { attested: unknown[] } })
    .image_compounds;
  console.log(
    `  ${'imageCompoundsAttested'.padEnd(22)} ${String(baseline.image_compounds?.attested.length ?? 0).padStart(5)} → ${String(attested?.attested.length ?? 0)}`,
  );
  if (!audit.passed) {
    console.error('\nHALTED: the build audit found problems; nothing was written.');
    process.exit(1);
  }
  if (booleans.has('check')) {
    console.log('\n--check: audit passed, nothing written.');
    return;
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'liraasa_2_1.json'), text, 'utf8');
  const report = {
    report: 'Liraasa 2.1 build',
    built_utc: BUILT_UTC,
    baseline: { file: 'liraasa_2_0.json', sha256: sha },
    changesets: CHANGESETS_2_1.map((p, i) => ({
      file: p,
      id: changesets[i]?.id,
      sha256: sha256(readFileSync(resolve(p))),
    })),
    output: {
      file: 'liraasa_2_1.json',
      sha256: sha256(text),
      bytes: Buffer.byteLength(text, 'utf8'),
    },
    counts: {
      before: before.counts,
      after: audit.counts,
      imageCompoundsAttested: attested?.attested.length ?? 0,
    },
    audit: { passed: audit.passed, findings: audit.findings },
  };
  writeFileSync(
    resolve(outDir, 'integration_report_2_1.json'),
    `${JSON.stringify(report, null, 1)}\n`,
    'utf8',
  );
  console.log(`\nWrote ${outDir}/liraasa_2_1.json (${String(report.output.bytes)} bytes)`);
  console.log(`      sha256 ${report.output.sha256}`);
  console.log(`Wrote ${outDir}/integration_report_2_1.json`);
}

if (process.argv[1]?.endsWith('integrate_2_1.ts')) main();
