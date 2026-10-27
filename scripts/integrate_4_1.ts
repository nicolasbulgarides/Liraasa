/**
 * CLI: build Liraasa 4.1 from the frozen 4.0 lexicon plus the 4.1 changeset
 * (ADR-0031).
 *
 *   npm run integrate:4.1            # audit + write
 *   npm run integrate:4.1 -- --check # audit only, write nothing
 *
 * As for 4.0 (ADR-0029): it reads 4.0, writes only new files, and halts unless
 * 4.0 is byte-for-byte the file the changeset was written against. 4.1 is the
 * vocabulary the 2100 Dreams draft still paraphrased; proposed until the author ratifies it.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyChangesets, auditBuild, type LexiconChangeset } from '../src/core/change/apply';
import type { IdMapFile } from '../src/core/model/ids';
import { serializeLexicon } from '../src/core/model/exportLexicon';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { CHANGESETS_4_1 } from './changesets_4_1';
import { WORD_BUILDING_4_1 } from './make_changeset_4_1';
import { idsAfter } from './integrate_2_0';

const BASELINE = 'data/lexicon/liraasa_4_0.json';
const EXPECTED_SHA = '9fbc87d384ea2ce8896c6846995f98fdf7f5a59dc73fd8ed8fb49f3bb32a5313';
const IDS = 'data/lexicon/ids.json';
/** Fixed so repeated runs are byte-identical. */
const BUILT_UTC = '2026-10-27T18:00:00Z';
const VERSION = '4.1';

const sha256 = (text: string | Buffer): string => createHash('sha256').update(text).digest('hex');

export function build4_1(): {
  lexicon: RawLexicon;
  text: string;
  sha: string;
  changesets: LexiconChangeset[];
} {
  const baselineBytes = readFileSync(resolve(BASELINE));
  const sha = sha256(baselineBytes);
  if (sha !== EXPECTED_SHA) {
    throw new Error(
      `the 4.0 baseline is not the file the 4.1 changesets were written against (sha256 ${sha}, expected ${EXPECTED_SHA})`,
    );
  }
  const baseline = JSON.parse(baselineBytes.toString('utf8')) as RawLexicon;
  const ids = idsAfter(baseline, JSON.parse(readFileSync(resolve(IDS), 'utf8')) as IdMapFile);
  const changesets = CHANGESETS_4_1.map(
    (p) => JSON.parse(readFileSync(resolve(p), 'utf8')) as LexiconChangeset,
  );
  const { lexicon } = applyChangesets(baseline, changesets, {
    version: VERSION,
    builtUtc: BUILT_UTC,
    source:
      `Built deterministically from liraasa_4_0.json (sha256 ${sha}) by scripts/integrate_4_1.ts, ` +
      `applying the changeset ${changesets.map((c) => c.id).join(' and ')} (ADR-0031). ` +
      "This JSON is the single source of truth for Liraasa 4.1. PROPOSED: every 4.1 addition (everything up to 4.0 is ratified) awaits the author's ratification.",
    ids,
    wordBuilding: WORD_BUILDING_4_1, // a time noun as a modifier (3.2:G142) or a head
  });
  return { lexicon, text: serializeLexicon(lexicon), sha, changesets };
}

function main(): void {
  const { flags, booleans } = parseArgs(process.argv.slice(2), ['out-dir']);
  const outDir = resolve(flags['out-dir'] ?? 'data/lexicon');
  console.log(`baseline  ${BASELINE}`);
  let built: ReturnType<typeof build4_1>;
  try {
    built = build4_1();
  } catch (e) {
    console.error(`\nHALTED: ${(e as Error).message}`);
    process.exit(1);
  }
  const { lexicon, text, sha, changesets } = built;
  console.log(`sha256    ${sha}`);
  const baseline = JSON.parse(readFileSync(resolve(BASELINE), 'utf8')) as RawLexicon;
  const audit = auditBuild(lexicon, WORD_BUILDING_4_1);
  const before = auditBuild(baseline, WORD_BUILDING_4_1);
  for (const f of audit.findings) console.error(`   FAIL    ${f}`);
  console.log('\ncounts           4.0 → 4.1');
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
  writeFileSync(resolve(outDir, 'liraasa_4_1.json'), text, 'utf8');
  const report = {
    report: 'Liraasa 4.1 build',
    built_utc: BUILT_UTC,
    baseline: { file: 'liraasa_4_0.json', sha256: sha },
    changesets: CHANGESETS_4_1.map((p, i) => ({
      file: p,
      id: changesets[i]?.id,
      sha256: sha256(readFileSync(resolve(p))),
    })),
    output: {
      file: 'liraasa_4_1.json',
      sha256: sha256(text),
      bytes: Buffer.byteLength(text, 'utf8'),
    },
    counts: { before: before.counts, after: audit.counts },
    audit: { passed: audit.passed, findings: audit.findings },
  };
  writeFileSync(
    resolve(outDir, 'integration_report_4_1.json'),
    `${JSON.stringify(report, null, 1)}\n`,
    'utf8',
  );
  console.log(`\nWrote ${outDir}/liraasa_4_1.json (${String(report.output.bytes)} bytes)`);
  console.log(`      sha256 ${report.output.sha256}`);
  console.log(`Wrote ${outDir}/integration_report_4_1.json`);
}

if (process.argv[1]?.endsWith('integrate_4_1.ts')) main();
