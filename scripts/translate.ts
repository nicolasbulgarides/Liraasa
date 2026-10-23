/**
 * CLI: translate English to Liraasa through the 2.5 pipeline and show the
 * work: the Liraasa (or why there is none), the interlinear gloss with each
 * word's slot and rules, the back-translation, and every flag.
 *
 *   npm run translate -- "I sing a song to you." "Where are you going?"
 */
import { createTranslator } from '../src/core/translate';
import { loadTranslateSource } from './grammar_source';

const t = createTranslator(loadTranslateSource());
for (const english of process.argv.slice(2)) {
  for (const r of t.translate(english)) {
    console.log(`\n${r.english}`);
    if (r.liraasa === null) {
      console.log('  no rendering passes the checker:');
      for (const x of r.tried)
        console.log(`    ${x.liraasa}\n      ${x.failures.join('\n      ')}`);
    } else {
      console.log(`  ${r.liraasa}`);
      for (const g of r.gloss)
        console.log(
          `    ${g.word.padEnd(16)} ${(g.role || '-').padEnd(11)} ${g.analysis.padEnd(30)} ${g.gloss.slice(0, 36)}${g.rules.length > 0 ? `  [${g.rules.join(' ')}]` : ''}`,
        );
      console.log(`  back: ${r.backTranslation.english}`);
    }
    for (const f of r.flags) console.log(`  ! ${f}`);
  }
}
