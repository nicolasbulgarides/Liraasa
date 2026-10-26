/**
 * CLI: the strict checker as a batch service for the 2100 Dreams draft translation
 * (translation/tools/parse.py). Reads JSON lines {id, text, coined?} on stdin and writes
 * one JSON line per input: {id, ok, errors[], warnings[], unruled[], gloss}.
 *
 *   echo '{"id":"x","text":"Maivo po lirala."}' | npx tsx scripts/check_batch.ts
 *
 * `coined` maps the run's registered coinages (compounds of headwords awaiting the author,
 * never canon) to their slot: n, v or a. Each is checked as a listed word of the same slot
 * would be, so the clause still parses; its gloss reads "(coinage)".
 */
import { createInterface } from 'node:readline';
import { createChecker } from '../src/core/grammar';
import { loadGrammarSource } from './grammar_source';

const ck = createChecker(loadGrammarSource());

/**
 * Dialogue the novel writes speech first ("“…,” she said") or after a comma. 2.3:G83 rules only
 * VERB: “…”, so this order is not ruled: the author decided (2026-10-26) that the draft counts it
 * as unruled, not wrong. The speech is checked as its own sentences, the frame around it as a
 * clause, and one unruled finding marks the order. A quotation after a colon is left to the
 * checker; a quoted single word with no punctuation is a mention, also left to the checker.
 */
const QUOTE_FIRST =
  'quote-first: a quotation before its verb of saying, or after it without a colon, is not ruled (2.3:G83 rules VERB: “…”)';
function splitSpeech(text: string): { frame: string; speech: string[] } | null {
  const speech: string[] = [];
  let frame = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i] ?? '';
    if (ch === '“' || ch === '"') {
      const close = ch === '“' ? text.indexOf('”', i + 1) : text.indexOf('"', i + 1);
      const end = close < 0 ? text.length : close;
      const inner = text.slice(i + 1, end);
      const before = frame.trimEnd();
      const isSpeech = inner.trim().split(/\s+/).length > 1 || /[.,!?…]\s*$/.test(inner);
      if (isSpeech && !before.endsWith(':')) {
        speech.push(inner.trim().replace(/,\s*$/, '.'));
        i = end + 1;
        continue;
      }
      frame += text.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    frame += ch;
    i += 1;
  }
  if (speech.length === 0) return null;
  // tidy the frame: drop punctuation left orphaned by the removed speech
  const tidy = frame
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/^[\s,.;:—–-]+/, '')
    .replace(/,\s*([.!?]|$)/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { frame: /[A-Za-z]/.test(tidy) ? tidy : '', speech };
}
/** A listed word for each slot, standing in for a coinage while the line is checked. */
const STAND_IN: Record<string, string> = { n: 'lira', v: 'lirala', a: 'vanisan' };
const rl = createInterface({ input: process.stdin });
rl.on('line', (line) => {
  if (line.trim() === '') return;
  let req: { id: string; text: string; coined?: Record<string, string> };
  try {
    req = JSON.parse(line) as typeof req;
  } catch {
    return;
  }
  try {
    const coined = new Map(
      Object.entries(req.coined ?? {}).map(([w, slot]) => [w.toLowerCase(), slot]),
    );
    const used: string[] = [];
    const text = req.text.replace(/[A-Za-z][A-Za-z-]*/g, (w) => {
      const slot = coined.get(w.toLowerCase());
      if (slot === undefined) return w;
      used.push(w);
      const s = STAND_IN[slot] ?? 'lira';
      return /^[A-Z]/.test(w) ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    });
    const split = splitSpeech(text);
    const parts =
      split === null ? [text] : [...split.speech, ...(split.frame === '' ? [] : [split.frame])];
    const results = parts.map((t) => ck.checkLine(t));
    const r = {
      findings: results.flatMap((x) => x.findings),
      sentences: results.flatMap((x) => x.sentences),
    };
    const fmt = (f: { rule: string; message: string }): string => `${f.rule}: ${f.message}`;
    const errors = r.findings.filter((f) => f.severity === 'error').map(fmt);
    let k = 0;
    const gloss = r.sentences
      .flatMap((s) => s.gloss)
      .map((g) => {
        const stood = Object.values(STAND_IN).includes(g.word.toLowerCase()) && k < used.length;
        const w = stood && used[k] !== undefined && text !== req.text ? used[k++] : g.word;
        return `${w ?? g.word}=${stood && w !== g.word ? '(coinage)' : (g.gloss.split(/[;(]/)[0] ?? '').trim()}`;
      })
      .join(' ');
    console.log(
      JSON.stringify({
        id: req.id,
        ok: errors.length === 0,
        errors,
        warnings: r.findings.filter((f) => f.severity === 'warn').map(fmt),
        unruled: [
          ...r.findings.filter((f) => f.severity === 'unruled').map(fmt),
          ...(split === null ? [] : [QUOTE_FIRST]),
        ],
        gloss,
      }),
    );
  } catch (e) {
    console.log(
      JSON.stringify({ id: req.id, ok: false, errors: [`checker crashed: ${String(e)}`] }),
    );
  }
});
