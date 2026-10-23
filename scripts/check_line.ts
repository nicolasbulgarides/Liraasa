/**
 * CLI: read Liraasa through the 2.5 strict checker and print the interlinear
 * gloss and every finding with its rule.
 *
 *   npm run check:line -- "Maivo po lirala." "Taivo lirala ki?"
 */
import { createChecker } from '../src/core/grammar';
import { loadGrammarSource } from './grammar_source';
const ck = createChecker(loadGrammarSource());
for (const l of process.argv.slice(2)) {
  const r = ck.checkLine(l);
  for (const s of r.sentences) {
    console.log('>>', s.text, `[${s.type}]`);
    for (const g of s.gloss)
      console.log(
        '   ',
        g.word.padEnd(14),
        (g.role || '-').padEnd(11),
        g.analysis.padEnd(32),
        g.gloss.slice(0, 40),
        g.rules.join(' '),
      );
    for (const f of s.findings) console.log('   !', f.severity, f.rule, f.message);
  }
}
