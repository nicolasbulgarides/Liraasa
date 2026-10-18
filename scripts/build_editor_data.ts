/**
 * CLI: build the data bundle the standalone editor page loads.
 *
 *   npm run build:editor
 *
 * The page needs the lexicon, but not all of it. The seven forms are dropped
 * entirely because they regenerate from the root by rule with zero mismatches,
 * so the page derives them — which saves about half the payload. Everything the
 * editor cannot derive is kept verbatim.
 */
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { FORM_SLOTS, SLOT_RAW_KEY, isUnusedGloss } from '../src/core/config/slots';
import { phoneInventory } from '../src/core/phonetics/g2p';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';

const DEFAULT_LEXICON = 'data/lexicon/liraasa_2_0.json';
/**
 * Grammar rulings on top of 1.1 (ADR-0012). A 1.1 lexicon needs them applied
 * here; 1.2 already carries them as `rulings_1_2`, its examples revised
 * (ADR-0013).
 */
const GRAMMAR_CHANGESET = 'data/changes/2026-10-17-grammar-rulings.json';

interface GrammarChangeset {
  edition: string;
  rulings: { id: string; topic: string; ruling: string; examples: [string, string][] }[];
  ops: { entry: string; op: string; from: string | null; to: string | null }[];
}
const DEFAULT_OUT = 'data/editor';
const NAMES = 'data/checker/names.json';

function main(): void {
  const { flags } = parseArgs(process.argv.slice(2), ['lexicon', 'out-dir']);
  const lexPath = resolve(flags.lexicon ?? DEFAULT_LEXICON);
  const outDir = resolve(flags['out-dir'] ?? DEFAULT_OUT);
  const lex = JSON.parse(readFileSync(lexPath, 'utf8')) as RawLexicon;
  const grammar = JSON.parse(readFileSync(resolve(GRAMMAR_CHANGESET), 'utf8')) as GrammarChangeset;

  // The changeset's example revisions, applied by index to the 1.1 text.
  const lexRulings12 = (lex as unknown as { rulings_1_2?: GrammarChangeset['rulings'] })
    .rulings_1_2;
  const revised = new Map<number, string>();
  for (const op of lexRulings12 === undefined ? grammar.ops : []) {
    if (op.op !== 'edit_example' || op.to === null) continue;
    const index = Number(op.entry.replace('example:', ''));
    if (lex.examples[index]?.liraasa !== op.from) {
      throw new Error(`${op.entry}: expected "${String(op.from)}" in ${lexPath}`);
    }
    revised.set(index, op.to);
  }

  /*
   * Headwords, as compact tuples. Order:
   *   0 root  1 type('P'|'C')  2 components|0  3 glosses[7]  4 register('e'|'p')
   *   5 domain index  6 synonyms
   * An unused gloss becomes an empty string, so the page can test it cheaply
   * without carrying the em-dash marker 6460 times.
   */
  const domains: string[] = [];
  const domainIndex = new Map<string, number>();
  const indexOf = (d: string): number => {
    let i = domainIndex.get(d);
    if (i === undefined) {
      i = domains.length;
      domains.push(d);
      domainIndex.set(d, i);
    }
    return i;
  };

  const headwords = lex.headwords.map((h) => {
    const g = h.glosses as unknown as Record<string, string>;
    const glosses = FORM_SLOTS.map((slot) => {
      const value = g[SLOT_RAW_KEY[slot]] ?? '';
      return isUnusedGloss(value) ? '' : value;
    });
    return [
      h.root,
      h.type === 'Primal' ? 'P' : 'C',
      h.components ?? 0,
      glosses,
      h.register === 'poetic' ? 'p' : 'e',
      indexOf(h.domain),
      h.english_synonyms,
      h.since,
    ];
  });

  const bundle = {
    version: lex.version,
    built: lex.built_utc,
    domains,
    headwords,
    functionWords: lex.function_words.map((f) => [
      f.form,
      f.meaning,
      f.position,
      f.class ?? '',
      f.since,
    ]),
    pronouns: lex.pronouns.map((p) => [p.form, p.person, p.number, p.possessive, p.reflexive]),
    correlatives: lex.correlatives.map((c) => [c.form, c.determiner, c.concept, c.gloss]),
    timeWords: lex.time_and_dates.map((t) => [t.form, t.english]),
    colors: lex.colors.map((c) => [c['Base color'], c.Family, c['Example meanings / notes']]),
    particles: lex.discourse_particles.map((d) => [d.form, d.function, d.positions]),
    numbers: lex.numbers.lookup_0_999,
    grammar: {
      clauseTemplate: lex.grammar.clause_template,
      slots: lex.grammar.slots.map((s) => [s.n, s.slot, s.words, s.notes]),
      scopeOperators: lex.grammar.scope_operators.words,
      exclusions: lex.grammar.stacking.exclusions,
      maxPreverbal: lex.grammar.stacking.max_preverbal_operators_recommended,
      nounPhrase: lex.grammar.noun_phrase,
      valency: lex.grammar.valency,
    },
    morphology: lex.morphology,
    phonology: {
      vowels: lex.phonology.vowels,
      consonantsCore: lex.phonology.consonants_core,
      consonantsOther: lex.phonology.consonants_other,
      stress: lex.phonology.stress,
      phones: phoneInventory('ipa'),
    },
    motionPrefixes: Object.keys(lex.motion_prefixes.canon),
    // [id, topic, ruling, examples]; newest edition first (2.0, then 1.2, …).
    rulings: [
      ...Object.keys(lex)
        .filter((k) => /^rulings_\d+_\d+$/.test(k) && k !== 'rulings_1_0' && k !== 'rulings_1_2')
        .reverse()
        .flatMap((k) =>
          ((lex as unknown as Record<string, GrammarChangeset['rulings']>)[k] ?? []).map((r) => [
            `${k.slice('rulings_'.length).replace('_', '.')}:${r.id}`,
            r.topic,
            r.ruling,
            r.examples,
          ]),
        ),
      ...(lexRulings12 ?? grammar.rulings).map((r) => [
        `1.2:${r.id}`,
        r.topic,
        r.ruling,
        r.examples,
      ]),
      ...lex.rulings_1_0.map((r) => [`1.0:${r.id}`, r.topic, r.ruling, []]),
      ...lex.rulings_0_8_carried.map((r) => [`0.8:${r.id}`, r.topic, r.ruling, []]),
    ],
    // Pre-1.0 spellings, for ruling 1.0:G19 version gating.
    legacy: Object.fromEntries(
      Object.entries(lex.legacy.migration_forms).map(([from, m]) => [from, m.to]),
    ),
    // Proper names attested in the texts (data/checker/names.json), so the editor does not flag them.
    names: (JSON.parse(readFileSync(resolve(NAMES), 'utf8')) as { names: string[] }).names,
    examples: lex.examples
      .map((e, i) => ({ ...e, liraasa: revised.get(i) ?? e.liraasa }))
      .filter((e) => e.status !== 'HISTORICAL')
      .map((e) => [e.liraasa, e.english, e.feature]),
  };

  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, 'liraasa-data.js');
  const js = `window.LIRAASA=${JSON.stringify(bundle)};\n`;
  writeFileSync(path, js, 'utf8');
  // A copy beside editor/index.html, so the page opens straight from disk.
  mkdirSync(resolve('editor'), { recursive: true });
  writeFileSync(resolve('editor', 'liraasa-data.js'), js, 'utf8');

  const kb = (n: number): string => `${(n / 1024).toFixed(0)} kB`;
  console.log(`lexicon   ${lexPath}`);
  console.log(
    `            ${String(lex.headwords.length)} headwords, ${String(bundle.examples.length)} live examples`,
  );
  console.log(`bundle    ${path}`);
  console.log(`            ${kb(statSync(path).size)} (forms omitted: the page derives them)`);
  console.log(
    `            ${String(domains.length)} domains, ${String(bundle.rulings.length)} rulings, ${String(Object.keys(bundle.legacy).length)} legacy spellings`,
  );
}

main();
