/**
 * CLI: build Liraasa 3.5 from the frozen 3.4 lexicon plus the 3.5 changesets
 * (ADR-0025).
 *
 *   npm run integrate:3.5            # audit + write
 *   npm run integrate:3.5 -- --check # audit only, write nothing
 *
 * As for 3.4 (ADR-0024): it reads 3.4, writes only new files, and halts unless
 * 3.4 is byte-for-byte the file the changesets were written against. 3.5 is
 * the author's ratification of 3.0, 3.3 and 3.4, then the 3.5 patch, every module; every 3.5
 * entry proposed, with its tier, until the author ratifies it.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyChangesets, auditBuild, type LexiconChangeset } from '../src/core/change/apply';
import type { IdMapFile } from '../src/core/model/ids';
import { serializeLexicon } from '../src/core/model/exportLexicon';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { CHANGESETS_3_5 } from './changesets_3_5';
import { WORD_BUILDING_3_5 } from './make_changeset_3_5';
import { idsAfter } from './integrate_2_0';

const BASELINE = 'data/lexicon/liraasa_3_4.json';
const EXPECTED_SHA = '5d4ba498f747fa003bf792951570091cc8fe732c68d9d4d110359d868ad98138';
const IDS = 'data/lexicon/ids.json';
/** Fixed so repeated runs are byte-identical. */
const BUILT_UTC = '2026-10-25T22:00:00Z';
const VERSION = '3.5';

const sha256 = (text: string | Buffer): string => createHash('sha256').update(text).digest('hex');

export function build3_5(): {
  lexicon: RawLexicon;
  text: string;
  sha: string;
  changesets: LexiconChangeset[];
} {
  const baselineBytes = readFileSync(resolve(BASELINE));
  const sha = sha256(baselineBytes);
  if (sha !== EXPECTED_SHA) {
    throw new Error(
      `the 3.4 baseline is not the file the 3.5 changesets were written against (sha256 ${sha}, expected ${EXPECTED_SHA})`,
    );
  }
  const baseline = JSON.parse(baselineBytes.toString('utf8')) as RawLexicon;
  const ids = idsAfter(baseline, JSON.parse(readFileSync(resolve(IDS), 'utf8')) as IdMapFile);
  const changesets = CHANGESETS_3_5.map(
    (p) => JSON.parse(readFileSync(resolve(p), 'utf8')) as LexiconChangeset,
  );
  const { lexicon } = applyChangesets(baseline, changesets, {
    version: VERSION,
    builtUtc: BUILT_UTC,
    source:
      `Built deterministically from liraasa_3_4.json (sha256 ${sha}) by scripts/integrate_3_5.ts, ` +
      `applying the changeset ${changesets.map((c) => c.id).join(' and ')} (ADR-0025). ` +
      "This JSON is the single source of truth for Liraasa 3.5. PROPOSED: every 3.5 addition (everything up to 3.4 is ratified) awaits the author's ratification.",
    ids,
    wordBuilding: WORD_BUILDING_3_5, // a time noun as a modifier (3.2:G142) or a head
  });
  return { lexicon, text: serializeLexicon(lexicon), sha, changesets };
}

function main(): void {
  const { flags, booleans } = parseArgs(process.argv.slice(2), ['out-dir']);
  const outDir = resolve(flags['out-dir'] ?? 'data/lexicon');
  console.log(`baseline  ${BASELINE}`);
  let built: ReturnType<typeof build3_5>;
  try {
    built = build3_5();
  } catch (e) {
    console.error(`\nHALTED: ${(e as Error).message}`);
    process.exit(1);
  }
  const { lexicon, text, sha, changesets } = built;
  console.log(`sha256    ${sha}`);
  const baseline = JSON.parse(readFileSync(resolve(BASELINE), 'utf8')) as RawLexicon;
  const audit = auditBuild(lexicon, WORD_BUILDING_3_5);
  const before = auditBuild(baseline, WORD_BUILDING_3_5);
  for (const f of audit.findings) console.error(`   FAIL    ${f}`);
  console.log('\ncounts           3.4 → 3.5');
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
  writeFileSync(resolve(outDir, 'liraasa_3_5.json'), text, 'utf8');
  const report = {
    report: 'Liraasa 3.5 build',
    built_utc: BUILT_UTC,
    baseline: { file: 'liraasa_3_4.json', sha256: sha },
    changesets: CHANGESETS_3_5.map((p, i) => ({
      file: p,
      id: changesets[i]?.id,
      sha256: sha256(readFileSync(resolve(p))),
    })),
    output: {
      file: 'liraasa_3_5.json',
      sha256: sha256(text),
      bytes: Buffer.byteLength(text, 'utf8'),
    },
    counts: { before: before.counts, after: audit.counts },
    audit: { passed: audit.passed, findings: audit.findings },
  };
  writeFileSync(
    resolve(outDir, 'integration_report_3_5.json'),
    `${JSON.stringify(report, null, 1)}\n`,
    'utf8',
  );
  console.log(`\nWrote ${outDir}/liraasa_3_5.json (${String(report.output.bytes)} bytes)`);
  console.log(`      sha256 ${report.output.sha256}`);
  console.log(`Wrote ${outDir}/integration_report_3_5.json`);
}

if (process.argv[1]?.endsWith('integrate_3_5.ts')) main();
