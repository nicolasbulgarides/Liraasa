/**
 * CLI and Claude Code Stop hook: keep LirasaCodexLatest/ holding the current
 * grammar guide.
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
 * As a Stop hook (registered in .claude/settings.json) a failed build exits 2,
 * which hands the error back to Claude to fix in the same session. If the hook
 * is already re-running after such a failure, it reports instead of blocking
 * again, so a build Claude cannot fix never traps the session in a loop.
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { GUIDE } from './grammar_guide/config';

const PUBLISH_DIR = 'LirasaCodexLatest';
const STAMP = join(PUBLISH_DIR, '.build-stamp.json');

/** What the guide is built from. A change to any of these means a rebuild. */
const INPUTS = [
  'data/lexicon/liraasa_1_1.json',
  'data/lexicon/ids.json',
  'data/changes',
  'scripts/build_handoff.ts',
  'scripts/build_grammar_guide.ts',
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

function main(): void {
  const force = process.argv.includes('--force');
  const hook = hookInput();
  const outputs = ['html', 'pdf'].map((ext) => `${GUIDE.outName}.${ext}`);

  const current = fingerprint();
  const previous = existsSync(STAMP)
    ? (JSON.parse(readFileSync(STAMP, 'utf8')) as { inputs?: string }).inputs
    : undefined;
  const published = outputs.every((f) => existsSync(join(PUBLISH_DIR, f)));
  if (!force && published && previous === current) return;

  try {
    execSync('npm run build:guide -- --pdf', { stdio: 'pipe', encoding: 'utf8' });
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
  for (const f of outputs) copyFileSync(join(GUIDE.outDir, f), join(PUBLISH_DIR, f));
  writeFileSync(
    STAMP,
    `${JSON.stringify({ inputs: current, published: new Date().toISOString(), files: outputs }, null, 1)}\n`,
  );
  console.log(
    JSON.stringify({ systemMessage: `Grammar guide rebuilt and published to ${PUBLISH_DIR}/` }),
  );
}

main();
