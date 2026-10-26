/**
 * CLI: build Liraasa 3.6 from the frozen 3.5 lexicon plus the 3.6 changeset
 * (ADR-0027).
 *
 *   npm run integrate:3.6            # audit + write
 *   npm run integrate:3.6 -- --check # audit only, write nothing
 *
 * As for 3.5 (ADR-0025): it reads 3.5, writes only new files, and halts unless
 * 3.5 is byte-for-byte the file the changeset was written against. 3.6 is the
 * 2100 Dreams patch, every module; every 3.6 entry proposed, with its tier and
 * module, until the author ratifies it.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyChangesets, auditBuild, type LexiconChangeset } from '../src/core/change/apply';
import type { IdMapFile } from '../src/core/model/ids';
import { serializeLexicon } from '../src/core/model/exportLexicon';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { CHANGESETS_3_6 } from './changesets_3_6';
import { WORD_BUILDING_3_6 } from './make_changeset_3_6';
import { idsAfter } from './integrate_2_0';

const BASELINE = 'data/lexicon/liraasa_3_5.json';
const EXPECTED_SHA = 'd9da6d94ad5e13bad95e519e81a858271cfced5419615217792dd7b869839304';
const IDS = 'data/lexicon/ids.json';
/** Fixed so repeated runs are byte-identical. */
const BUILT_UTC = '2026-10-25T23:00:00Z';
const VERSION = '3.6';

const sha256 = (text: string | Buffer): string => createHash('sha256').update(text).digest('hex');

export function build3_6(): {
  lexicon: RawLexicon;
  text: string;
  sha: string;
  changesets: LexiconChangeset[];
} {
  const baselineBytes = readFileSync(resolve(BASELINE));
  const sha = sha256(baselineBytes);
  if (sha !== EXPECTED_SHA) {
    throw new Error(
      `the 3.5 baseline is not the file the 3.6 changesets were written against (sha256 ${sha}, expected ${EXPECTED_SHA})`,
    );
  }
  const baseline = JSON.parse(baselineBytes.toString('utf8')) as RawLexicon;
  const ids = idsAfter(baseline, JSON.parse(readFileSync(resolve(IDS), 'utf8')) as IdMapFile);
  const changesets = CHANGESETS_3_6.map(
    (p) => JSON.parse(readFileSync(resolve(p), 'utf8')) as LexiconChangeset,
  );
  const { lexicon } = applyChangesets(baseline, changesets, {
    version: VERSION,
    builtUtc: BUILT_UTC,
    source:
      `Built deterministically from liraasa_3_5.json (sha256 ${sha}) by scripts/integrate_3_6.ts, ` +
      `applying the changeset ${changesets.map((c) => c.id).join(' and ')} (ADR-0027). ` +
      "This JSON is the single source of truth for Liraasa 3.6. PROPOSED: every 3.6 addition (everything up to 3.5 is ratified) awaits the author's ratification.",
    ids,
    wordBuilding: WORD_BUILDING_3_6, // a time noun as a modifier (3.2:G142) or a head
  });
  return { lexicon, text: serializeLexicon(lexicon), sha, changesets };
}

function main(): void {
  const { flags, booleans } = parseArgs(process.argv.slice(2), ['out-dir']);
  const outDir = resolve(flags['out-dir'] ?? 'data/lexicon');
  console.log(`baseline  ${BASELINE}`);
  let built: ReturnType<typeof build3_6>;
  try {
    built = build3_6();
  } catch (e) {
    console.error(`\nHALTED: ${(e as Error).message}`);
    process.exit(1);
  }
  const { lexicon, text, sha, changesets } = built;
  console.log(`sha256    ${sha}`);
  const baseline = JSON.parse(readFileSync(resolve(BASELINE), 'utf8')) as RawLexicon;
  const audit = auditBuild(lexicon, WORD_BUILDING_3_6);
  const before = auditBuild(baseline, WORD_BUILDING_3_6);
  for (const f of audit.findings) console.error(`   FAIL    ${f}`);
  console.log('\ncounts           3.5 → 3.6');
  for (const [k, v] of Object.entries(audit.counts)) {
    console.log(
      `  ${k.padEnd(22)} ${String(before.counts[k as keyof typeof before.counts]).padStart(5)} → ${String(v)}`,
    );
  }
  if (!audit.passed) {
    console.error('\nHALTED: the build audit found problems; nothing was written.');
    process.exit(1);
  }
  if (booleans.has('check')) {
    console.log('\n--check: audit passed, nothing written.');
    return;
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'liraasa_3_6.json'), text, 'utf8');
  const report = {
    report: 'Liraasa 3.6 build',
    built_utc: BUILT_UTC,
    baseline: { file: 'liraasa_3_5.json', sha256: sha },
    changesets: CHANGESETS_3_6.map((p, i) => ({
      file: p,
      id: changesets[i]?.id,
      sha256: sha256(readFileSync(resolve(p))),
    })),
    output: {
      file: 'liraasa_3_6.json',
      sha256: sha256(text),
      bytes: Buffer.byteLength(text, 'utf8'),
    },
    counts: { before: before.counts, after: audit.counts },
    audit: { passed: audit.passed, findings: audit.findings },
  };
  writeFileSync(
    resolve(outDir, 'integration_report_3_6.json'),
    `${JSON.stringify(report, null, 1)}\n`,
    'utf8',
  );
  console.log(`\nWrote ${outDir}/liraasa_3_6.json (${String(report.output.bytes)} bytes)`);
  console.log(`      sha256 ${report.output.sha256}`);
  console.log(`Wrote ${outDir}/integration_report_3_6.json`);
}

if (process.argv[1]?.endsWith('integrate_3_6.ts')) main();
