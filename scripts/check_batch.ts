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

// Speech before its verb of saying is ruled since 4.0:G156 and read by the checker itself.
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
    const r = ck.checkLine(text);
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
        unruled: r.findings.filter((f) => f.severity === 'unruled').map(fmt),
        gloss,
      }),
    );
  } catch (e) {
    console.log(
      JSON.stringify({ id: req.id, ok: false, errors: [`checker crashed: ${String(e)}`] }),
    );
  }
});
