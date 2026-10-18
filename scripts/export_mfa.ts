/**
 * CLI: export a Montreal Forced Aligner pronunciation dictionary.
 *
 *   npm run export:mfa
 *
 * MFA's dictionary format is one entry per line, `word<TAB>phone phone phone`,
 * with repeated lines for pronunciation variants. Everything else here — the
 * phone inventory file, the syllable reference — is a companion for training
 * and for the author, not something MFA requires.
 *
 * Word coverage is deliberately generous, because an aligner fails on any word
 * missing from the dictionary:
 *
 *  - all seven forms of every headword
 *  - `-ti` and `-ri` on each form, since both appear in real texts
 *  - the `-yo` / `-vu` / `-pago` derivations
 *  - every closed class: function words, pronouns (with `-ri`), correlatives,
 *    numerals 0-999 plus the scale words, time words, colour words, particles
 *  - every word actually attested in the examples and the corpus, which is what
 *    picks up proper names (Melodia, Kipo, Aviya …), motion-prefixed verbs and
 *    hyphenated numerals
 */
import { readdirSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { colorGrid } from '../src/core/generate/colors';
import { DERIVATION_KEYS, isBlockedDerivation } from '../src/core/config/morphology';
import { FORM_SLOTS, SLOT_RAW_KEY } from '../src/core/config/slots';
import {
  G2PError,
  OPEN_QUESTIONS,
  glidedVariant,
  markStress,
  phoneInventory,
  syllabify,
  toPhones,
  toStressedPhones,
  type PhoneSet,
} from '../src/core/phonetics/g2p';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';

const DEFAULT_LEXICON = 'data/lexicon/liraasa_2_0.json';
const DEFAULT_OUT = 'data/export';
const CORPUS_DIRS = ['data/corpus/songs_1_0', 'data/corpus/bumrepago_1_0'];

/** Where each word came from, so the report can say what covers what. */
type Source =
  | 'form'
  | 'inflection'
  | 'derivation'
  | 'closed class'
  | 'colour'
  | 'numeral'
  | 'corpus'
  | 'name';

interface Entry {
  word: string;
  sources: Set<Source>;
}

function addWord(map: Map<string, Entry>, word: string, source: Source): void {
  const key = word.toLowerCase();
  if (key.length === 0) return;
  // A bound morpheme is not a word; never let one into the dictionary.
  if (key.startsWith('-')) return;
  const existing = map.get(key);
  if (existing === undefined) map.set(key, { word: key, sources: new Set([source]) });
  else existing.sources.add(source);
}

/** Tokenise a corpus line the way the validator does. */
function tokenize(text: string): string[] {
  const out: string[] = [];
  let current = '';
  for (const ch of text) {
    if (/[A-Za-z]/.test(ch) || ((ch === '-' || ch === "'") && current.length > 0)) current += ch;
    else {
      if (current.length > 0) out.push(current);
      current = '';
    }
  }
  if (current.length > 0) out.push(current);
  return out.map((t) => t.replace(/^[-']+|[-']+$/g, '')).filter((t) => t.length > 0);
}

function main(): void {
  const { flags } = parseArgs(process.argv.slice(2), ['lexicon', 'out-dir']);
  const lexPath = resolve(flags.lexicon ?? DEFAULT_LEXICON);
  const outDir = resolve(flags['out-dir'] ?? DEFAULT_OUT);
  const lex = JSON.parse(readFileSync(lexPath, 'utf8')) as RawLexicon;

  const words = new Map<string, Entry>();

  /* -- the lexical paradigm ---------------------------------------------- */
  for (const h of lex.headwords) {
    const forms = h.forms as unknown as Record<string, string>;
    for (const slot of FORM_SLOTS) {
      const form = forms[SLOT_RAW_KEY[slot]];
      if (form === undefined) continue;
      addWord(words, form, 'form');
      // -ti diminutive, -ri plural, and both: all attested in real texts.
      addWord(words, `${form}ti`, 'inflection');
      addWord(words, `${form}ri`, 'inflection');
      addWord(words, `${form}tiri`, 'inflection');
    }
    for (const d of DERIVATION_KEYS) {
      if (isBlockedDerivation(h.root, d)) continue;
      addWord(words, h.root + d, 'derivation');
      addWord(words, `${h.root}${d}ri`, 'derivation');
    }
  }

  /* -- the closed classes ------------------------------------------------ */
  for (const f of lex.function_words) {
    // Entries beginning with a hyphen are bound suffixes (-ti, -ri, -yo, -vu,
    // -pago, -na), not words. validate.py filters them the same way; a bound
    // morpheme must never be a dictionary entry or the aligner will try to
    // match it as a standalone token.
    if (f.form.startsWith('-')) continue;
    for (const part of f.form.split(' / ')) {
      const p = part.trim();
      if (p.length > 0 && !p.includes(' ')) addWord(words, p, 'closed class');
    }
  }
  for (const p of lex.pronouns) {
    addWord(words, p.form, 'closed class');
    addWord(words, `${p.form}ri`, 'closed class');
  }
  for (const c of lex.correlatives) addWord(words, c.form, 'closed class');
  for (const t of lex.time_and_dates) {
    if (t.form.includes(' ')) continue;
    addWord(words, t.form, 'closed class');
    // deyari, montari, montafamari all occur in the texts.
    addWord(words, `${t.form}ri`, 'closed class');
  }
  for (const d of lex.discourse_particles) addWord(words, d.form, 'closed class');
  for (const cell of colorGrid()) addWord(words, cell.form, 'colour');

  for (const rule of lex.numbers.rules) {
    // Most rows are numerals, but some are construction templates
    // ("[decade]-[digit]", "unzira-[digit]") or the empty-group marker. Only
    // rows with an integer Value are actual words.
    const value = typeof rule.Value === 'number' ? rule.Value : Number(rule.Value);
    if (!Number.isInteger(value)) continue;
    const v = String(rule.Liraasa).trim();
    if (v.length > 0 && !v.includes(' ')) addWord(words, v, 'numeral');
  }
  for (const v of Object.values(lex.numbers.lookup_0_999)) addWord(words, v, 'numeral');

  /* -- everything attested in the examples and the corpus ---------------- */
  const known = new Set(words.keys());
  /** A token is a name when it is capitalised mid-text and not already known. */
  const label = (token: string): Source =>
    known.has(token.toLowerCase()) ? 'corpus' : /^[A-Z]/.test(token) ? 'name' : 'corpus';

  for (const e of lex.examples) {
    // HISTORICAL examples quote words the 0.7 workbook itself marks undefined
    // (daza, raetae, azurae); they are not words of the language.
    if (e.status === 'HISTORICAL') continue;
    for (const t of tokenize(e.liraasa)) addWord(words, t, label(t));
  }
  let corpusLines = 0;
  for (const dir of CORPUS_DIRS) {
    let files: string[];
    try {
      files = readdirSync(resolve(dir)).filter((f) => f.endsWith('.txt'));
    } catch {
      console.warn(`  (no corpus at ${dir}; skipped)`);
      continue;
    }
    for (const file of files) {
      for (const raw of readFileSync(join(resolve(dir), file), 'utf8').split('\n')) {
        const line = raw.trim();
        if (line.length === 0 || line.startsWith('#')) continue;
        corpusLines += 1;
        for (const t of tokenize(line)) addWord(words, t, label(t));
      }
    }
  }

  /* -- convert ----------------------------------------------------------- */
  const sorted = [...words.values()].sort((a, b) => a.word.localeCompare(b.word));
  const failed: { word: string; reason: string }[] = [];

  const render = (set: PhoneSet, stressed: boolean): string => {
    const lines: string[] = [];
    for (const entry of sorted) {
      try {
        const primary = stressed ? toStressedPhones(entry.word, set) : toPhones(entry.word, set);
        lines.push(`${entry.word}\t${primary.join(' ')}`);
        // A rapid-speech variant, per the guide: "hiatus vowels may glide
        // without changing spelling". Only emitted when there is hiatus.
        if (!stressed) {
          const glided = glidedVariant(entry.word, set);
          if (glided !== null) lines.push(`${entry.word}\t${glided.join(' ')}`);
        }
      } catch (error) {
        if (error instanceof G2PError) failed.push({ word: entry.word, reason: error.message });
        else throw error;
      }
    }
    return `${lines.join('\n')}\n`;
  };

  mkdirSync(outDir, { recursive: true });

  const dicts: [string, string][] = [
    ['liraasa_mfa_ipa.dict', render('ipa', false)],
    ['liraasa_mfa_ascii.dict', render('ascii', false)],
    ['liraasa_mfa_ipa_stressed.dict', render('ipa', true)],
  ];
  for (const [name, text] of dicts) {
    writeFileSync(join(outDir, name), text, 'utf8');
  }

  // The phone inventory, which MFA wants when training a new acoustic model.
  for (const set of ['ipa', 'ascii'] as const) {
    writeFileSync(
      join(outDir, `liraasa_phones_${set}.txt`),
      `${phoneInventory(set).join('\n')}\n`,
      'utf8',
    );
  }

  // Syllable and stress reference, for the author rather than for MFA.
  const syl = ['word\tsyllables\tstress\tsyllable_count\tphones_ipa'];
  for (const entry of sorted) {
    try {
      const s = syllabify(entry.word);
      syl.push(
        [
          entry.word,
          s.syllables.map((x) => x.text).join('-'),
          markStress(entry.word),
          String(s.syllables.length),
          s.phones.join(' '),
        ].join('\t'),
      );
    } catch {
      /* already reported in `failed` */
    }
  }
  writeFileSync(join(outDir, 'liraasa_syllables.tsv'), `${syl.join('\n')}\n`, 'utf8');

  /* -- report ------------------------------------------------------------ */
  const bySource = new Map<Source, number>();
  for (const e of sorted) {
    for (const s of e.sources) bySource.set(s, (bySource.get(s) ?? 0) + 1);
  }
  const names = sorted.filter((e) => e.sources.has('name') && e.sources.size === 1);

  console.log(`lexicon    ${lexPath}`);
  console.log(
    `            ${String(lex.headwords.length)} headwords, ${String(corpusLines)} corpus lines read`,
  );
  console.log(`words      ${String(sorted.length)} distinct orthographic words`);
  for (const [s, n] of [...bySource.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`            ${String(n).padStart(6)}  ${s}`);
  }
  console.log(`phones     ${String(phoneInventory('ipa').length)} in the inventory`);
  console.log(`names      ${String(names.length)} proper names picked up from the texts`);
  console.log(
    `            ${names
      .slice(0, 12)
      .map((n) => n.word)
      .join(', ')}`,
  );
  if (failed.length > 0) {
    console.warn(`\n${String(failed.length)} word(s) could not be converted:`);
    for (const f of failed.slice(0, 10)) console.warn(`   ${f.reason}`);
  }

  writeFileSync(
    join(outDir, 'mfa_export_report.json'),
    `${JSON.stringify(
      {
        report: 'Liraasa MFA dictionary export',
        lexicon: lexPath.replace(/\\/g, '/'),
        version: lex.version,
        words: sorted.length,
        by_source: Object.fromEntries(bySource),
        phones: { ipa: phoneInventory('ipa'), ascii: phoneInventory('ascii') },
        proper_names: names.map((n) => n.word),
        unconvertible: failed,
        open_questions: OPEN_QUESTIONS,
      },
      null,
      1,
    )}\n`,
    'utf8',
  );

  console.log(`\nWrote to ${outDir}:`);
  for (const [name] of dicts) console.log(`   ${name}`);
  console.log('   liraasa_phones_ipa.txt, liraasa_phones_ascii.txt');
  console.log('   liraasa_syllables.tsv');
  console.log('   mfa_export_report.json');
}

main();
