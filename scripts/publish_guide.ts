/**
 * CLI and Claude Code Stop hook: keep LirasaCodexLatest/ holding the current
 * Reference Grammar, the Invitation and The Grammar in Lessons.
 *
 *   npm run publish:guide             # rebuild only if an input changed
 *   npm run publish:guide -- --force  # rebuild regardless
 *
 * It fingerprints everything the guide is built from: the lexicon, the
 * changesets, the generator and the core modules it imports. If the
 * fingerprint matches the last publish, it exits at once and prints nothing,
 * so running it at the end of every Claude turn is cheap. Otherwise it runs
 * `npm run build:guide -- --pdf` and copies the HTML and PDF into
 * LirasaCodexLatest/.
 *
 * Then it commits the published files to the `codex-latest` branch of the
 * GitHub repository and pushes it, so the lexicon, the grammar and both
 * documents are always on GitHub (the Invitation links there). The commit is
 * built with git plumbing on that branch alone: the working tree, the index
 * and the current branch are never touched. A push that fails (offline, no
 * credentials) is reported and retried on the next run.
 *
 * As a Stop hook (registered in .claude/settings.json) a failed build exits 2,
 * which hands the error back to Claude to fix in the same session. If the hook
 * is already re-running after such a failure, it reports instead of blocking
 * again, so a build Claude cannot fix never traps the session in a loop.
 */
import { execFileSync, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { CODEX, GUIDE, INVITATION, codexUrl } from './grammar_guide/config';

const PUBLISH_DIR = 'LirasaCodexLatest';
const STAMP = join(PUBLISH_DIR, '.build-stamp.json');
const LLM_FILE = 'liraasa_2_5_llm.json';
/** The Grammar in Lessons, built by `npm run build:lessons -- --pdf` (file stem in handoff/). */
const LESSONS = 'Liraasa_2_5_Lessons';

/** What the guide is built from. A change to any of these means a rebuild. */
const INPUTS = [
  'data/lexicon/liraasa_2_5.json',
  'data/lexicon/integration_report_2_5.json',
  'data/lexicon/liraasa_2_3.json',
  'data/lexicon/integration_report_2_3.json',
  'data/lexicon/liraasa_2_2.json',
  'data/lexicon/integration_report_2_2.json',
  'data/lexicon/liraasa_2_1.json',
  'data/lexicon/integration_report_2_1.json',
  'data/lexicon/liraasa_2_0.json',
  'data/lexicon/integration_report_2_0.json',
  'data/lexicon/liraasa_1_2.json',
  'data/lexicon/integration_report_1_2.json',
  'data/lexicon/ids.json',
  'data/songs/Nemelira de devi.txt',
  'data/changes',
  'scripts/build_handoff.ts',
  'scripts/changesets_1_2.ts',
  'scripts/changesets_2_0.ts',
  'scripts/changesets_2_1.ts',
  'scripts/changesets_2_2.ts',
  'scripts/changesets_2_3.ts',
  'scripts/changesets_2_5.ts',
  'data/corpus/album_2_0',
  'scripts/build_grammar_guide.ts',
  'scripts/build_invitation.ts',
  'scripts/build_lessons.ts',
  'scripts/lessons',
  'src/core/grammar',
  'data/checker/rules_2_5.json',
  'data/checker/transitive_2_5.json',
  'data/checker/drafts_2_5.json',
  'scripts/build_llm_json.ts',
  'scripts/grammar_guide',
  'src/core/config',
  'src/core/morphology',
  'src/core/phonetics',
  'src/core/change',
];

function files(path: string): string[] {
  if (!existsSync(path)) return [];
  if (statSync(path).isFile()) return [path];
  return readdirSync(path)
    .sort()
    .flatMap((name) => files(join(path, name)));
}

function fingerprint(): string {
  const hash = createHash('sha256');
  for (const input of INPUTS) {
    for (const file of files(resolve(input))) {
      hash.update(relative(process.cwd(), file).replace(/\\/g, '/'));
      hash.update('\0');
      hash.update(readFileSync(file));
      hash.update('\0');
    }
  }
  return hash.digest('hex');
}

/** The Stop hook's input, if we were run as one. */
function hookInput(): { stop_hook_active?: boolean } {
  if (process.stdin.isTTY) return {};
  try {
    const raw = readFileSync(0, 'utf8').trim();
    return raw.length > 0 ? (JSON.parse(raw) as { stop_hook_active?: boolean }) : {};
  } catch {
    return {};
  }
}

function git(args: readonly string[], input?: string): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 120_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  }).trim();
}

function revision(ref: string): string | undefined {
  try {
    return git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
  } catch {
    return undefined;
  }
}

/** What the codex branch holds: published name → file on disk. Stable names keep printed links alive. */
function codexFiles(version: string): Record<string, string> {
  const ed = version.replace('.', '_');
  const at = (f: string): string => join(GUIDE.outDir, f);
  return {
    [`${GUIDE.outName}.html`]: at(`${GUIDE.outName}.html`),
    [`${GUIDE.outName}.pdf`]: at(`${GUIDE.outName}.pdf`),
    [CODEX.stable.referenceHtml]: at(`${GUIDE.outName}.html`),
    [CODEX.stable.reference]: at(`${GUIDE.outName}.pdf`),
    [`${INVITATION.outName}.html`]: at(`${INVITATION.outName}.html`),
    [`${INVITATION.outName}.pdf`]: at(`${INVITATION.outName}.pdf`),
    [`${LESSONS}.html`]: at(`${LESSONS}.html`),
    [`${LESSONS}.pdf`]: at(`${LESSONS}.pdf`),
    [LLM_FILE]: at(LLM_FILE),
    [CODEX.stable.lexicon]: at(LLM_FILE),
    [`liraasa_${ed}_complete.json`]: at(`liraasa_${ed}_complete.json`),
    [`Liraasa_${ed}_Rulings.md`]: at(`Liraasa_${ed}_Rulings.md`),
  };
}

function codexReadme(version: string, files: readonly string[]): string {
  const ed = version.replace('.', '_');
  return [
    `# Liraasa ${version}: the published codex`,
    '',
    `Generated by \`npm run publish:guide\` in the Liraasa Workbench and committed here after every rebuild. Do not edit this branch by hand: its source is on \`master\` of ${CODEX.repoUrl}.`,
    '',
    `- **${CODEX.stable.lexicon}**: the whole language in one JSON, lexicon and grammar, for reading and for language tools (the same file as liraasa_${ed}_llm.json).`,
    `- **${CODEX.stable.reference}**: the Reference Grammar (also as HTML).`,
    `- **${INVITATION.outName}.pdf**: *${INVITATION.title}*, a short introduction.`,
    `- **${LESSONS}.pdf**: *The Grammar in Lessons*, twenty short lessons to study the grammar a little each day (also as HTML).`,
    `- **liraasa_${ed}_complete.json**: the complete lexicon, every form and every ruling.`,
    '',
    `The names without an edition number stay the same from edition to edition, so links to them keep working: ${codexUrl(CODEX.stable.lexicon)}`,
    '',
    `Files: ${files.join(', ')}`,
    '',
  ].join('\n');
}

/**
 * Commit the published files to the codex branch and push it. Returns what
 * happened, for the hook's message; a git failure on this machine throws.
 */
function pushCodex(version: string): { pushed: boolean; message: string } {
  const ref = `refs/heads/${CODEX.branch}`;
  const remote = `refs/remotes/origin/${CODEX.branch}`;
  // build on what GitHub has, so a publish from elsewhere is never overwritten
  try {
    git(['fetch', '--quiet', 'origin', `+${ref}:${remote}`]);
  } catch {
    // no such branch yet, or offline: build on the local branch if there is one
  }
  const parent = revision(remote) ?? revision(ref);
  const files = codexFiles(version);
  const missing = Object.values(files).filter((f) => !existsSync(f));
  if (missing.length > 0) return { pushed: false, message: `missing ${missing.join(', ')}` };

  const readme = codexReadme(version, Object.keys(files).sort());
  const entries = [
    ...Object.entries(files).map(
      ([name, path]) => `100644 blob ${git(['hash-object', '-w', path])}\t${name}`,
    ),
    `100644 blob ${git(['hash-object', '-w', '--stdin'], readme)}\tREADME.md`,
  ];
  const tree = git(['mktree'], `${entries.join('\n')}\n`);
  let commit = parent;
  if (parent === undefined || git(['rev-parse', `${parent}^{tree}`]) !== tree) {
    const message = `Publish Liraasa ${version}: lexicon, grammar and documents (${new Date().toISOString().slice(0, 10)})`;
    commit = git([
      'commit-tree',
      tree,
      ...(parent === undefined ? [] : ['-p', parent]),
      '-m',
      message,
    ]);
  }
  if (commit === undefined) return { pushed: false, message: 'nothing to commit' };
  git(['update-ref', ref, commit]);
  if (commit === revision(remote)) return { pushed: true, message: 'already up to date on GitHub' };
  try {
    git(['push', '--quiet', 'origin', `${ref}:${ref}`]);
    return { pushed: true, message: `pushed ${commit.slice(0, 7)} to ${CODEX.branch}` };
  } catch (e) {
    const last = ((e as { stderr?: string }).stderr ?? '').trim().split('\n').pop() ?? '';
    return { pushed: false, message: `push failed (will retry next run): ${last}` };
  }
}

/** The edition being published, read from the handoff lexicon the documents were built from. */
function lexiconVersion(): string {
  return (JSON.parse(readFileSync(GUIDE.lexicon, 'utf8')) as { version: string }).version;
}

function main(): void {
  const force = process.argv.includes('--force');
  const hook = hookInput();
  const guide = [GUIDE.outName, INVITATION.outName, LESSONS].flatMap((name) =>
    ['html', 'pdf'].map((ext) => `${name}.${ext}`),
  );
  // The one-file reference for language models, built beside the guide.
  const outputs = [...guide, LLM_FILE];

  const current = fingerprint();
  const stamp = existsSync(STAMP)
    ? (JSON.parse(readFileSync(STAMP, 'utf8')) as { inputs?: string; pushed?: boolean })
    : {};
  const published = outputs.every((f) => existsSync(join(PUBLISH_DIR, f)));
  if (!force && published && stamp.inputs === current) {
    if (stamp.pushed === true) return;
    // built, but not yet on GitHub: try the push again, nothing else
    const retry = pushCodex(lexiconVersion());
    writeFileSync(STAMP, `${JSON.stringify({ ...stamp, pushed: retry.pushed }, null, 1)}\n`);
    console.log(JSON.stringify({ systemMessage: `Liraasa codex: ${retry.message}` }));
    return;
  }

  try {
    execSync('npm run build:guide -- --pdf', { stdio: 'pipe', encoding: 'utf8' });
    execSync('npm run build:lessons -- --pdf', { stdio: 'pipe', encoding: 'utf8' });
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    const detail = `${err.stderr ?? ''}\n${err.stdout ?? ''}`
      .trim()
      .split('\n')
      .slice(-25)
      .join('\n');
    if (hook.stop_hook_active === true) {
      // Already blocked once for this; report and let the turn end.
      console.log(
        JSON.stringify({
          systemMessage: `Grammar guide rebuild still failing; ${PUBLISH_DIR}/ was not updated. Run npm run publish:guide to see why.`,
        }),
      );
      return;
    }
    console.error(
      `The grammar guide failed to rebuild, so ${PUBLISH_DIR}/ was not updated:\n${detail}`,
    );
    process.exit(2);
  }

  mkdirSync(PUBLISH_DIR, { recursive: true });
  // Only the current edition is published: an older edition's guide stays in handoff/.
  for (const f of readdirSync(PUBLISH_DIR)) {
    if (
      /^(Liraasa_.*_(Grammar_Guide|Reference_Grammar)\.(html|pdf)|Liraasa_Invitation\.(html|pdf)|Liraasa_.*_Lessons\.(html|pdf)|liraasa_.*_llm\.json)$/.test(
        f,
      ) &&
      !outputs.includes(f)
    ) {
      rmSync(join(PUBLISH_DIR, f));
    }
  }
  for (const f of outputs) copyFileSync(join(GUIDE.outDir, f), join(PUBLISH_DIR, f));
  let push: { pushed: boolean; message: string };
  try {
    push = pushCodex(lexiconVersion());
  } catch (e) {
    push = { pushed: false, message: `git failed: ${(e as Error).message.split('\n')[0] ?? ''}` };
  }
  const record = {
    inputs: current,
    published: new Date().toISOString(),
    files: outputs,
    pushed: push.pushed,
  };
  writeFileSync(STAMP, `${JSON.stringify(record, null, 1)}\n`);
  console.log(
    JSON.stringify({
      systemMessage: `Grammar guide rebuilt and published to ${PUBLISH_DIR}/; GitHub: ${push.message}`,
    }),
  );
}

main();
