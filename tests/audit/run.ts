/* eslint-disable no-console -- a CLI, like scripts/: its output is the report */
/**
 * The grammar audit's rule tests (Phase 4), rerunnable after any patch.
 *
 *   npx tsx tests/audit/run.ts              # checker + composer; writes review/audit-results.json
 *   npx tsx tests/audit/run.ts --no-compose # checker only (no browser needed)
 *
 * For every case in tests/audit/cases.json:
 *   - the expected sentence (`good`) must check clean: no error and no warning;
 *   - the rule-breaking sentence (`bad`) must be flagged (error, warning or
 *     unsettled; a note is recorded as weak), ideally citing `expect`;
 *   - the English (`en`) goes through the editor's Compose tab, and the draft
 *     must equal `good` or one of `alts` (case and spacing ignored);
 *   - `good` is back-translated, to see what meaning survives.
 * Each rule's status is then derived from its cases:
 *   IMPLEMENTED  every good sentence clean and every bad one flagged, citing the rule
 *   PARTIAL      some of it: a bad one flagged under another rule, or only as a note
 *   DIVERGENT    the checker rejects a sentence the spec allows
 *   MISSING      a rule-breaking sentence passes unflagged
 *   ACCEPTS      no bad case: the checker accepts the spec's sentences (nothing enforced)
 * Nothing here is a verdict on the language: a failure means the editor and
 * the spec disagree, and the audit report says which side is wrong.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { loadChecker, type Diagnostic } from '../checker/loadChecker';
import { compose, type Composed } from './compose';

interface Case {
  rule: string;
  en?: string;
  good: string;
  alts?: string[];
  bad?: string;
  /** The rule the flag should cite; any of a list will do. */
  expect?: string | string[];
  english_check?: string;
  /** A note is the strength the spec asks for (a recommendation). */
  weak_ok?: boolean;
  /** The spec does not decide this case: recorded, never counted. */
  gap?: boolean;
  note?: string;
}
interface Rule {
  id: string;
  source: string;
  title: string;
  kind: string;
  status: string;
}

const SERIOUS = new Set(['error', 'warn']);
const FLAG = new Set(['error', 'warn', 'unsettled']);
const norm = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.$/, ''); // a phrase has no full stop of its own
const brief = (d: Diagnostic): string => `${d.severity} ${d.rule}: ${d.message}`.slice(0, 220);

function main(): void {
  const withCompose = !process.argv.includes('--no-compose');
  const { cases } = JSON.parse(readFileSync('tests/audit/cases.json', 'utf8')) as { cases: Case[] };
  const rules = JSON.parse(readFileSync('tests/audit/rules.json', 'utf8')) as Rule[];
  const idOf = new Map(rules.map((r) => [r.source, r.id]));
  const { checker } = loadChecker();

  const english = [...new Set(cases.flatMap((c) => (c.en === undefined ? [] : [c.en])))];
  const composed = new Map<string, Composed>();
  if (withCompose) for (const c of compose(english)) composed.set(c.english, c);

  const results = cases.map((c, i) => {
    const goodDiags = checker.checkLine(c.good, 1, c.english_check ?? '');
    const goodIssues = goodDiags.filter((d) => SERIOUS.has(d.severity)).map(brief);
    let bad: null | { flagged: boolean; weak: boolean; cited: boolean; diagnostics: string[] } =
      null;
    if (c.bad !== undefined) {
      const ds = checker.checkLine(c.bad, 1, c.english_check ?? '');
      const weak = !ds.some((d) => FLAG.has(d.severity)) && ds.length > 0;
      const flagged = ds.some((d) => FLAG.has(d.severity)) || (weak && c.weak_ok === true);
      const expect = c.expect === undefined ? [] : [c.expect].flat();
      const cited = ds.some((d) => expect.some((e) => d.rule === e || d.rule.startsWith(e)));
      bad = { flagged, weak, cited, diagnostics: ds.map(brief) };
    }
    const comp = c.en === undefined ? undefined : composed.get(c.en);
    const want = [c.good, ...(c.alts ?? [])].map(norm);
    return {
      n: i + 1,
      rule: c.rule,
      ruleId: idOf.get(c.rule) ?? '?',
      en: c.en ?? null,
      good: c.good,
      bad: c.bad ?? null,
      expect: c.expect ?? null,
      gap: c.gap === true,
      note: c.note ?? null,
      goodClean: goodIssues.length === 0,
      goodIssues,
      badResult: bad,
      composed: comp?.liraasa ?? null,
      composeGaps: comp?.gaps ?? [],
      composeMatch: comp === undefined ? null : want.includes(norm(comp.liraasa)),
      backTranslation: checker.backTranslate(c.good).text,
    };
  });

  // a rule's status from its cases
  const byRule = new Map<string, typeof results>();
  for (const r of results) byRule.set(r.rule, [...(byRule.get(r.rule) ?? []), r]);
  const status = [...byRule].map(([source, all]) => {
    const rs = all.filter((r) => !r.gap);
    const bads = rs.filter((r) => r.badResult !== null);
    let s: string;
    if (rs.length === 0) s = 'SPEC GAP';
    else if (rs.some((r) => !r.goodClean)) s = 'DIVERGENT';
    else if (bads.length === 0) s = 'ACCEPTS';
    else if (bads.every((r) => r.badResult?.flagged === true && r.badResult.cited))
      s = 'IMPLEMENTED';
    else if (bads.some((r) => r.badResult?.flagged === true || r.badResult?.weak === true))
      s = 'PARTIAL';
    else s = 'MISSING';
    const comp = rs.filter((r) => r.composeMatch !== null);
    return {
      ruleId: idOf.get(source) ?? '?',
      source,
      checker: s,
      composer:
        comp.length === 0
          ? null
          : `${String(comp.filter((r) => r.composeMatch === true).length)}/${String(comp.length)}`,
      cases: all.map((r) => r.n),
    };
  });

  const summary = {
    cases: results.length,
    goodClean: results.filter((r) => r.goodClean).length,
    badCases: results.filter((r) => r.badResult !== null).length,
    badFlagged: results.filter((r) => r.badResult?.flagged === true).length,
    badCited: results.filter((r) => r.badResult?.cited === true).length,
    composed: results.filter((r) => r.composeMatch !== null).length,
    composeMatch: results.filter((r) => r.composeMatch === true).length,
    rules: Object.fromEntries(
      ['IMPLEMENTED', 'PARTIAL', 'DIVERGENT', 'MISSING', 'ACCEPTS', 'SPEC GAP'].map((k) => [
        k,
        status.filter((s) => s.checker === k).length,
      ]),
    ),
  };
  writeFileSync(
    'review/audit-results.json',
    `${JSON.stringify({ summary, status, results }, null, 1)}\n`,
    'utf8',
  );
  console.log(JSON.stringify(summary));
  for (const s of status)
    console.log(
      `${s.ruleId.padEnd(5)} ${s.source.padEnd(40)} ${s.checker.padEnd(12)} composer ${String(s.composer)}`,
    );
}

main();
