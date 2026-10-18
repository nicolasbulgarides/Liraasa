/**
 * CLI: build Liraasa 2.0 from the frozen 1.2 lexicon plus the 2.0 changeset
 * (ADR-0016).
 *
 *   npm run integrate:2.0            # audit + write
 *   npm run integrate:2.0 -- --check # audit only, write nothing
 *
 * As for 1.2 (ADR-0013): it reads 1.2, writes only new files, and halts unless
 * 1.2 is byte-for-byte the file the changeset was written against. Two things
 * differ: the 2.0 word-building rulings (2.0:G38 colour modifiers, 2.0:G42
 * nesting) are switched on, and each id counter continues after the highest
 * id 1.2 holds, so 2.0's new words never reuse an earlier number.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  applyChangesets,
  auditBuild,
  type LexiconChangeset,
  type WordBuilding,
} from '../src/core/change/apply';
import type { IdMapFile } from '../src/core/model/ids';
import { serializeLexicon } from '../src/core/model/exportLexicon';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { CHANGESETS_2_0 } from './changesets_2_0';

const BASELINE = 'data/lexicon/liraasa_1_2.json';
const EXPECTED_SHA = '12e9d262ec56b1515dba196b2ecf7de432dae611d7a5af213dc206f477441fe3';
const IDS = 'data/lexicon/ids.json';
/** Fixed so repeated runs are byte-identical. */
const BUILT_UTC = '2026-10-18T12:00:00Z';
const VERSION = '2.0';

/** What the 2.0 rulings allow (2.0:G38, 2.0:G42). */
export const WORD_BUILDING_2_0: WordBuilding = { nesting: true, colourModifiers: true };

const sha256 = (text: string | Buffer): string => createHash('sha256').update(text).digest('hex');

/** The sidecar, with each kind's counter moved past the highest number the baseline holds. */
export function idsAfter(baseline: RawLexicon, ids: IdMapFile): IdMapFile {
  const sections: [string, readonly unknown[]][] = [
    ['headword', baseline.headwords],
    ['functionWord', baseline.function_words],
    ['pronoun', baseline.pronouns],
    ['correlative', baseline.correlatives],
    ['timeWord', baseline.time_and_dates],
    ['color', baseline.colors],
    ['discourseParticle', baseline.discourse_particles],
  ];
  const next = { ...ids.next };
  for (const [kind, rows] of sections) {
    const numbers = (rows as { id?: string }[])
      .map((r) =>
        Number(
          String(r.id ?? '')
            .split('_')
            .pop(),
        ),
      )
      .filter((n) => Number.isFinite(n));
    const top = numbers.length === 0 ? 0 : Math.max(...numbers);
    next[kind] = Math.max(next[kind] ?? 1, top + 1);
  }
  return { ...ids, next };
}

export function build2_0(): {
  lexicon: RawLexicon;
  text: string;
  sha: string;
  changesets: LexiconChangeset[];
} {
  const baselineBytes = readFileSync(resolve(BASELINE));
  const sha = sha256(baselineBytes);
  if (sha !== EXPECTED_SHA) {
    throw new Error(
      `the 1.2 baseline is not the file the 2.0 changeset was written against (sha256 ${sha}, expected ${EXPECTED_SHA})`,
    );
  }
  const baseline = JSON.parse(baselineBytes.toString('utf8')) as RawLexicon;
  const ids = idsAfter(baseline, JSON.parse(readFileSync(resolve(IDS), 'utf8')) as IdMapFile);
  const changesets = CHANGESETS_2_0.map(
    (p) => JSON.parse(readFileSync(resolve(p), 'utf8')) as LexiconChangeset,
  );
  const { lexicon } = applyChangesets(baseline, changesets, {
    version: VERSION,
    builtUtc: BUILT_UTC,
    source:
      `Built deterministically from liraasa_1_2.json (sha256 ${sha}) by scripts/integrate_2_0.ts, ` +
      `applying the changeset ${changesets.map((c) => c.id).join(' and ')} (ADR-0016). ` +
      'This JSON is the single source of truth for Liraasa 2.0.',
    ids,
    wordBuilding: WORD_BUILDING_2_0,
  });
  return { lexicon, text: serializeLexicon(lexicon), sha, changesets };
}

function main(): void {
  const { flags, booleans } = parseArgs(process.argv.slice(2), ['out-dir']);
  const outDir = resolve(flags['out-dir'] ?? 'data/lexicon');
  console.log(`baseline  ${BASELINE}`);
  let built: ReturnType<typeof build2_0>;
  try {
    built = build2_0();
  } catch (e) {
    console.error(`\nHALTED: ${(e as Error).message}`);
    process.exit(1);
  }
  const { lexicon, text, sha, changesets } = built;
  console.log(`sha256    ${sha}`);
  const baseline = JSON.parse(readFileSync(resolve(BASELINE), 'utf8')) as RawLexicon;
  const audit = auditBuild(lexicon, WORD_BUILDING_2_0);
  const before = auditBuild(baseline);
  for (const f of audit.findings) console.error(`   FAIL    ${f}`);
  console.log('\ncounts           1.2 → 2.0');
  for (const [k, v] of Object.entries(audit.counts)) {
    console.log(
      `  ${k.padEnd(22)} ${String(before.counts[k as keyof typeof before.counts]).padStart(5)} → ${String(v)}`,
    );
  }
  const attested = (lexicon as unknown as { image_compounds?: { attested: unknown[] } })
    .image_compounds;
  console.log(
    `  ${'imageCompoundsAttested'.padEnd(22)} ${'0'.padStart(5)} → ${String(attested?.attested.length ?? 0)}`,
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
  writeFileSync(resolve(outDir, 'liraasa_2_0.json'), text, 'utf8');
  const report = {
    report: 'Liraasa 2.0 build',
    built_utc: BUILT_UTC,
    baseline: { file: 'liraasa_1_2.json', sha256: sha },
    changesets: CHANGESETS_2_0.map((p, i) => ({
      file: p,
      id: changesets[i]?.id,
      sha256: sha256(readFileSync(resolve(p))),
    })),
    output: {
      file: 'liraasa_2_0.json',
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
    resolve(outDir, 'integration_report_2_0.json'),
    `${JSON.stringify(report, null, 1)}\n`,
    'utf8',
  );
  console.log(`\nWrote ${outDir}/liraasa_2_0.json (${String(report.output.bytes)} bytes)`);
  console.log(`      sha256 ${report.output.sha256}`);
  console.log(`Wrote ${outDir}/integration_report_2_0.json`);
}

if (process.argv[1]?.endsWith('integrate_2_0.ts')) main();
