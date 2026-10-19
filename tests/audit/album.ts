/* eslint-disable no-console -- a CLI, like scripts/: its output is the report */
/**
 * The grammar audit's album regression (Phase 6), rerunnable.
 *
 *   npx tsx tests/audit/album.ts        # writes review/audit-album.json
 *
 * Every album line, read today (its current spelling, so the 2.0 spellings
 * the recording keeps are not reported again), goes through the editor's
 * checker. Each finding is listed with the rule it cites and whether the line
 * is already a documented album reading (AR-…). Nothing is judged: a finding
 * is a place where the album's usage and the current grammar disagree.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { loadChecker } from '../checker/loadChecker';

const album = JSON.parse(readFileSync('data/corpus/album_2_0/album_current.json', 'utf8')) as {
  songs: {
    track: string;
    title: string;
    lines: { n: number; recorded: string; current: string | null; reading?: string }[];
  }[];
};
const { checker } = loadChecker();
const findings: {
  track: string;
  line: number;
  text: string;
  reading: string | null;
  severity: string;
  rule: string;
  token: string | null;
  message: string;
}[] = [];
let lines = 0;
for (const s of album.songs)
  for (const l of s.lines) {
    lines += 1;
    const text = l.current ?? l.recorded;
    for (const d of checker.checkLine(text, l.n, '', { register: 'poetic' }))
      if (d.severity !== 'note')
        findings.push({
          track: s.track,
          line: l.n,
          text,
          reading: l.reading ?? null,
          severity: d.severity,
          rule: d.rule,
          token: d.token,
          message: d.message,
        });
  }
const byRule: Record<string, number> = {};
for (const f of findings) byRule[f.rule] = (byRule[f.rule] ?? 0) + 1;
const out = {
  lines,
  lines_with_findings: new Set(findings.map((f) => `${f.track}:${String(f.line)}`)).size,
  findings_total: findings.length,
  on_album_readings: findings.filter((f) => f.reading !== null).length,
  by_rule: byRule,
  findings,
};
writeFileSync('review/audit-album.json', `${JSON.stringify(out, null, 1)}\n`, 'utf8');
console.log(JSON.stringify({ ...out, findings: undefined }));
