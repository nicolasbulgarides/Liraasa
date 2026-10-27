/**
 * CLI: build Liraasa 4.0 from the frozen 3.6 lexicon plus the 4.0 changeset
 * (ADR-0029).
 *
 *   npm run integrate:4.0            # audit + write
 *   npm run integrate:4.0 -- --check # audit only, write nothing
 *
 * As for 3.6 (ADR-0027): it reads 3.6, writes only new files, and halts unless
 * 3.6 is byte-for-byte the file the changeset was written against. 4.0 is what
 * translating 2100 Dreams needed; every 4.0 entry proposed until the author ratifies it.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyChangesets, auditBuild, type LexiconChangeset } from '../src/core/change/apply';
import type { IdMapFile } from '../src/core/model/ids';
import { serializeLexicon } from '../src/core/model/exportLexicon';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { CHANGESETS_4_0 } from './changesets_4_0';
import { WORD_BUILDING_4_0 } from './make_changeset_4_0';
import { idsAfter } from './integrate_2_0';

const BASELINE = 'data/lexicon/liraasa_3_6.json';
const EXPECTED_SHA = 'f467cb1a216e23823888fbbebb19b4cd084fcccd139bf7848abc6c070c8ad0c2';
const IDS = 'data/lexicon/ids.json';
/** Fixed so repeated runs are byte-identical. */
const BUILT_UTC = '2026-10-26T23:00:00Z';
const VERSION = '4.0';

const sha256 = (text: string | Buffer): string => createHash('sha256').update(text).digest('hex');

export function build4_0(): {
  lexicon: RawLexicon;
  text: string;
  sha: string;
  changesets: LexiconChangeset[];
} {
  const baselineBytes = readFileSync(resolve(BASELINE));
  const sha = sha256(baselineBytes);
  if (sha !== EXPECTED_SHA) {
    throw new Error(
      `the 3.6 baseline is not the file the 4.0 changesets were written against (sha256 ${sha}, expected ${EXPECTED_SHA})`,
    );
  }
  const baseline = JSON.parse(baselineBytes.toString('utf8')) as RawLexicon;
  const ids = idsAfter(baseline, JSON.parse(readFileSync(resolve(IDS), 'utf8')) as IdMapFile);
  const changesets = CHANGESETS_4_0.map(
    (p) => JSON.parse(readFileSync(resolve(p), 'utf8')) as LexiconChangeset,
  );
  const { lexicon } = applyChangesets(baseline, changesets, {
    version: VERSION,
    builtUtc: BUILT_UTC,
    source:
      `Built deterministically from liraasa_3_6.json (sha256 ${sha}) by scripts/integrate_4_0.ts, ` +
      `applying the changeset ${changesets.map((c) => c.id).join(' and ')} (ADR-0029). ` +
      "This JSON is the single source of truth for Liraasa 4.0. PROPOSED: every 4.0 addition (3.6 is proposed too) awaits the author's ratification.",
    ids,
    wordBuilding: WORD_BUILDING_4_0, // a time noun as a modifier (3.2:G142) or a head
  });
  return { lexicon, text: serializeLexicon(lexicon), sha, changesets };
}

function main(): void {
  const { flags, booleans } = parseArgs(process.argv.slice(2), ['out-dir']);
  const outDir = resolve(flags['out-dir'] ?? 'data/lexicon');
  console.log(`baseline  ${BASELINE}`);
  let built: ReturnType<typeof build4_0>;
  try {
    built = build4_0();
  } catch (e) {
    console.error(`\nHALTED: ${(e as Error).message}`);
    process.exit(1);
  }
  const { lexicon, text, sha, changesets } = built;
  console.log(`sha256    ${sha}`);
  const baseline = JSON.parse(readFileSync(resolve(BASELINE), 'utf8')) as RawLexicon;
  const audit = auditBuild(lexicon, WORD_BUILDING_4_0);
  const before = auditBuild(baseline, WORD_BUILDING_4_0);
  for (const f of audit.findings) console.error(`   FAIL    ${f}`);
  console.log('\ncounts           3.6 → 4.0');
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
  writeFileSync(resolve(outDir, 'liraasa_4_0.json'), text, 'utf8');
  const report = {
    report: 'Liraasa 4.0 build',
    built_utc: BUILT_UTC,
    baseline: { file: 'liraasa_3_6.json', sha256: sha },
    changesets: CHANGESETS_4_0.map((p, i) => ({
      file: p,
      id: changesets[i]?.id,
      sha256: sha256(readFileSync(resolve(p))),
    })),
    output: {
      file: 'liraasa_4_0.json',
      sha256: sha256(text),
      bytes: Buffer.byteLength(text, 'utf8'),
    },
    counts: { before: before.counts, after: audit.counts },
    audit: { passed: audit.passed, findings: audit.findings },
  };
  writeFileSync(
    resolve(outDir, 'integration_report_4_0.json'),
    `${JSON.stringify(report, null, 1)}\n`,
    'utf8',
  );
  console.log(`\nWrote ${outDir}/liraasa_4_0.json (${String(report.output.bytes)} bytes)`);
  console.log(`      sha256 ${report.output.sha256}`);
  console.log(`Wrote ${outDir}/integration_report_4_0.json`);
}

if (process.argv[1]?.endsWith('integrate_4_0.ts')) main();
