/**
 * CLI: build Liraasa 1.1 from the immutable 1.0 baseline plus the vocabulary
 * proposal.
 *
 * Reversible by construction: it reads 1.0 and writes only new files. It never
 * opens the baseline for writing, and `--check` runs the whole pipeline and
 * the audit without writing anything.
 *
 *   npm run integrate            # audit + write
 *   npm run integrate -- --check # audit only, write nothing
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { auditIntegration } from '../src/core/integrate/audit';
import { integrate } from '../src/core/integrate/integrate';
import type { Proposal } from '../src/core/integrate/proposalTypes';
import { serializeLexicon } from '../src/core/model/exportLexicon';
import type { RawLexicon } from '../src/core/model/raw';
import { buildNewExamples } from '../src/core/integrate/examples';
import { parseArgs } from './args';

const BASELINE = 'data/source/liraasa_1_0.json';
const PROPOSAL = 'data/proposals/1.1/Liraasa_1_1_Vocabulary_Proposal.json';
const EXPECTED_SHA = 'adc013cf99b79ec597c8cfcb9aee9f942e520010556ab6b072bcaa9a606608f3';

/**
 * Fixed so repeated runs are byte-identical, and distinct from 1.0's stamp so
 * the edition is self-identifying. The integration did run on this date.
 */
const BUILT_UTC = '2026-10-16T12:00:00Z';
const VERSION = '1.1';

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function main(): void {
  const { flags, booleans } = parseArgs(process.argv.slice(2), ['out-dir']);
  const checkOnly = booleans.has('check');
  const outDir = resolve(flags['out-dir'] ?? 'data/lexicon');

  /* -- step 1: the baseline checksum ------------------------------------- */
  const baselinePath = resolve(BASELINE);
  const actualSha = sha256(baselinePath);
  console.log(`baseline  ${BASELINE}`);
  console.log(`sha256    ${actualSha}`);
  if (actualSha !== EXPECTED_SHA) {
    console.error(`\nHALTED: baseline sha256 does not match the proposal's target.`);
    console.error(`  expected ${EXPECTED_SHA}`);
    console.error(`  actual   ${actualSha}`);
    console.error('Reconcile the baseline before integrating.');
    process.exit(1);
  }
  console.log('          matches the proposal target\n');

  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as RawLexicon;
  const proposal = JSON.parse(readFileSync(resolve(PROPOSAL), 'utf8')) as Proposal;

  /* -- step 2: examples -------------------------------------------------- */
  const examples = buildNewExamples(baseline, proposal);
  console.log(`examples  ${String(examples.length)} new sentences generated`);

  /* -- step 3: integrate ------------------------------------------------- */
  const result = integrate(baseline, proposal, {
    version: VERSION,
    builtUtc: BUILT_UTC,
    baselineSha256: actualSha,
    newExamples: examples,
  });

  const narrowed = result.added.filter((a) => a.outcome === 'narrowed');
  console.log(`added     ${String(result.added.length)} entries`);
  console.log(
    `            ${String(result.added.filter((a) => a.type === 'Primal').length)} primal roots`,
  );
  console.log(
    `            ${String(result.added.filter((a) => a.type === 'Compound').length)} compounds`,
  );
  console.log(`narrowed  ${String(narrowed.length)} glosses`);
  console.log(`rejected  ${String(result.rejected.length)}`);
  for (const r of result.rejected) console.log(`            ${r.headword}: ${r.reason}`);

  /* -- step 4: independent audit ----------------------------------------- */
  const report = auditIntegration(baseline, result.lexicon);
  console.log(
    `\naudit     ${String(report.clean.length)} checks clean, ${String(report.findings.length)} findings`,
  );
  for (const c of report.clean) console.log(`   ok      ${c}`);
  for (const f of report.findings) console.error(`   FAIL    ${f.check}: ${f.detail}`);

  console.log(
    `\ncounts    ${String(report.counts.headwords)} headwords = ` +
      `${String(report.counts.primalRoots)} primal + ${String(report.counts.compounds)} compounds`,
  );
  console.log(
    `          ${String(report.counts.forms)} forms, ${String(report.counts.distinctForms)} distinct`,
  );

  if (!report.passed) {
    console.error('\nHALTED: the audit found problems; nothing was written.');
    process.exit(1);
  }

  if (checkOnly) {
    console.log('\n--check: audit passed, nothing written.');
    return;
  }

  /* -- step 5: write ----------------------------------------------------- */
  mkdirSync(outDir, { recursive: true });
  const lexPath = resolve(outDir, 'liraasa_1_1.json');
  const text = serializeLexicon(result.lexicon);
  writeFileSync(lexPath, text, 'utf8');
  // Byte length, not string length: the em dashes and U+2264 are multi-byte.
  const bytes = Buffer.byteLength(text, 'utf8');

  const reportPath = resolve(outDir, 'integration_report_1_1.json');
  writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        report: 'Liraasa 1.1 vocabulary integration',
        built_utc: BUILT_UTC,
        baseline: { file: 'liraasa_1_0.json', sha256: actualSha },
        proposal: { file: PROPOSAL, sha256: sha256(resolve(PROPOSAL)) },
        output: {
          file: 'liraasa_1_1.json',
          sha256: createHash('sha256').update(text).digest('hex'),
          bytes,
        },
        counts: report.counts,
        audit: { passed: report.passed, clean: report.clean, findings: report.findings },
        added: result.added,
        rejected: result.rejected,
        new_examples: examples.length,
      },
      null,
      1,
    )}\n`,
    'utf8',
  );

  console.log(`\nWrote ${lexPath} (${String(bytes)} bytes)`);
  console.log(`      sha256 ${createHash('sha256').update(text).digest('hex')}`);
  console.log(`Wrote ${reportPath}`);
}

main();
