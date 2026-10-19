/**
 * CLI: write the whole language as one JSON file meant to be read by a
 * language model.
 *
 *   npm run build:llm
 *
 * Writes handoff/liraasa_2_2_llm.json from the canonical 2.1 lexicon. It holds
 * every grammar rule and the full dictionary. It is shaped for a reader that
 * goes top to bottom: instructions and hard rules first, then sound, word
 * building, the clause, recipes and every ruling, then the small words, the
 * dictionary and canon examples to imitate.
 *
 * Three choices make it easy for a model to read:
 * - Only meaningful forms are listed. The ~6,800 slots glossed "— (unused)"
 *   are left out, so a model cannot pick one up as if it were a word.
 * - Every form says what it is: "amora": "verb: to love; to care for".
 * - Keys are plain English and nothing is abbreviated.
 *
 * Nothing here is invented. Every word is copied from the lexicon, and
 * recipes, checker rules and open questions are shared with the grammar guide.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { FORM_SLOTS, SLOT_RAW_KEY, isUnusedGloss, type FormSlot } from '../src/core/config/slots';
import type { RawLexicon } from '../src/core/model/raw';
import { OPEN_QUESTIONS, READ_ORDER, RECIPES, RULES } from './grammar_guide/chapters';
import { canonTexts, isCanonText, type Lexicon } from './grammar_guide/data';
import { parseArgs } from './args';

const LEXICON = 'data/lexicon/liraasa_2_2.json';
const OUT = 'handoff/liraasa_2_2_llm.json';
/** The album, read against the live lexicon by scripts/build_album.ts (2.2:G68). */
const ALBUM = 'data/corpus/album_2_0/album_current.json';
const ALBUM_READINGS = 'data/corpus/album_2_0/album_readings.json';
/** Words the prose names, by id, so a respelling carries through (CLAUDE.md). */
const WANT = 'lx_vurlo_1061';
const SING = 'lx_lira_0272';
/** Every build also lands here, beside the published guide. */
const LATEST_DIR = 'LirasaCodexLatest';

/** Short role codes for the one-line dictionary; the legend is in the file. */
const SLOT_CODE: Record<FormSlot, string> = {
  root: 'n',
  ascended: 'an',
  negative: 'nn',
  verb: 'v',
  negativeAdjective: 'na',
  adjective: 'a',
  ascendedAdjective: 'aa',
};

/** What each of the seven slots is, for a reader who has not met them. */
const SLOT_ROLE: Record<FormSlot, string> = {
  root: 'noun',
  ascended: 'ascended noun',
  negative: 'negative noun',
  verb: 'verb',
  negativeAdjective: 'negative adjective',
  adjective: 'adjective',
  ascendedAdjective: 'ascended adjective',
};
const SLOT_BUILD: Record<FormSlot, string> = {
  root: 'R',
  ascended: 'R + asa',
  negative: 'R + na',
  verb: 'R + verb ending (see verb_rule)',
  negativeAdjective: 'R + nasan',
  adjective: 'R + san',
  ascendedAdjective: 'R + asasan',
};

interface Ruling {
  id: string;
  topic: string;
  ruling: string;
  refines?: string[];
  examples?: [string, string][];
  /** 2.2 on (ADR-0018): what replaces a ruling, whole or in part. */
  supersedes?: string[];
  superseded_by?: string;
  superseded_in_part?: { clause: string; by: string }[];
}
interface Head {
  root: string;
  type: string;
  components: [string, string] | null;
  /** A compound lexicalised with a suffix (2.0:G38). */
  suffix?: string;
  forms: Record<string, string>;
  glosses: Record<string, string>;
  register: string;
  domain: string;
  since: string;
}

/** Markdown from the guide's prose, made plain: `word` stays, **bold** does not. */
const plain = (text: string): string =>
  text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '($1)');

interface AlbumFile {
  songs: {
    track: string;
    title: string;
    lines: { n: number; recorded: string; current: string | null; reading?: string }[];
  }[];
}
interface AlbumReadingRow {
  id: string;
  confidence: string;
  issue: string;
  standard_form: string | null;
}

/**
 * The album as canon example text (2.2:G68): 2.0 text with 2.0 spellings, a
 * line's current spelling beside it where it differs, and every album reading
 * flagged with its standard form, so a model imitates the standard form and
 * never the reading. No English: the author has not supplied it.
 */
function albumSection(): Record<string, unknown> {
  if (!existsSync(ALBUM)) return {};
  const album = JSON.parse(readFileSync(ALBUM, 'utf8')) as AlbumFile;
  const readings = new Map(
    (
      JSON.parse(readFileSync(ALBUM_READINGS, 'utf8')) as { readings: AlbumReadingRow[] }
    ).readings.map((r) => [r.id, r]),
  );
  return {
    album: {
      how_to_use:
        'The album: twelve songs and the alternate 05, canon 2.0 text written in 2.0 spellings (2.1:G58, 2.2:G68). Read it for how Liraasa is sung. ' +
        'A line with "current" is spelled differently in this edition: write the current spelling. ' +
        'A line with "album_reading" departs from the grammar once: it keeps its meaning, but DO NOT IMITATE it; imitate its standard_form instead (null: the author has not given one). No English is given.',
      tracks: album.songs.map((s) => ({
        track: s.track,
        title: s.title,
        lines: s.lines.map((l) => {
          const r = l.reading === undefined ? undefined : readings.get(l.reading);
          return {
            liraasa: l.recorded,
            ...(l.current === null ? {} : { current: l.current }),
            ...(r === undefined
              ? {}
              : {
                  album_reading: {
                    id: r.id,
                    do_not_imitate: true,
                    issue: r.issue,
                    standard_form: r.standard_form,
                    ...(r.confidence === 'author_confirm' ? { awaiting_author: true } : {}),
                  },
                }),
          };
        }),
      })),
    },
  };
}

/** A ruling's example; the 2.2 rulings give none in English, and none is invented. */
const example = ([liraasa, english]: readonly [string, string]) =>
  english === '' ? { liraasa } : { liraasa, english };

/**
 * Pretty-printed down to the level of a list of records, and each record on
 * one line: readable by eye, and far fewer tokens than full indentation.
 */
function compactJson(value: unknown, indent = ''): string {
  const inner = `${indent} `;
  const isRecordList =
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((v) => (typeof v === 'object' && v !== null) || typeof v === 'string') &&
    JSON.stringify(value).length > 200;
  if (isRecordList) {
    const rows = (value as unknown[]).map((v) => inner + JSON.stringify(v));
    return `[\n${rows.join(',\n')}\n${indent}]`;
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    if (JSON.stringify(value).length <= 120) return JSON.stringify(value);
    const rows = Object.entries(value).map(
      ([k, v]) => `${inner}${JSON.stringify(k)}: ${compactJson(v, inner)}`,
    );
    return `{\n${rows.join(',\n')}\n${indent}}`;
  }
  return JSON.stringify(value);
}

function main(): void {
  const { flags } = parseArgs(process.argv.slice(2), ['lexicon', 'out']);
  const lexPath = flags.lexicon ?? LEXICON;
  const lex = JSON.parse(readFileSync(resolve(lexPath), 'utf8')) as RawLexicon;
  const canon = canonTexts(lex as unknown as Lexicon);
  const heads = lex.headwords as unknown as Head[];
  const bena = heads.find((h) => h.root === 'bena');
  if (bena === undefined) throw new Error('bena is missing');

  // the newest edition's rulings first, then each earlier one
  const later = Object.keys(lex)
    .filter((k) => /^rulings_\d+_\d+$/.test(k) && k !== 'rulings_1_0')
    .reverse();
  const rulings = [
    ...later.flatMap((k) =>
      ((lex as unknown as Record<string, Ruling[]>)[k] ?? []).map((r) => ({
        edition: k.slice('rulings_'.length).replace('_', '.'),
        r,
      })),
    ),
    ...(lex.rulings_1_0 as unknown as Ruling[]).map((r) => ({ edition: '1.0', r })),
    ...(lex.rulings_0_8_carried as unknown as Ruling[]).map((r) => ({ edition: '0.8', r })),
  ].map(({ edition, r }) => ({
    id: `${edition}:${r.id}`,
    topic: r.topic,
    rule: r.ruling,
    ...(r.refines !== undefined && r.refines.length > 0 ? { refines: r.refines } : {}),
    ...(r.supersedes !== undefined ? { supersedes: r.supersedes } : {}),
    // kept, never reworded: a superseded ruling says so, and a model must follow the newer one
    ...(r.superseded_by !== undefined
      ? { status: `SUPERSEDED by ${r.superseded_by}: do not follow; follow ${r.superseded_by}` }
      : {}),
    ...(r.superseded_in_part !== undefined
      ? {
          status: r.superseded_in_part
            .map((p) => `the clause "${p.clause}" is SUPERSEDED by ${p.by}; the rest stands`)
            .join('; '),
        }
      : {}),
    ...(r.examples !== undefined && r.examples.length > 0
      ? { examples: r.examples.map(example) }
      : {}),
  }));
  rulings.push({
    id: 'ADR-0011',
    topic: 'A noun does not modify a noun',
    rule:
      'Of two nouns side by side, the first becomes its adjective, which then describes the second: lira (song) + lavra (bird) is lirasan lavra, a songbird. ' +
      'The adjective follows the noun form: root noun takes -san, ascended noun (-asa) takes -asasan, negative noun (-na) takes -nasan. ' +
      'If that adjective form is not listed in the dictionary it does not exist; then use the compound of the two nouns if the dictionary has one, or a de phrase (lira de lavra).',
    examples: [{ liraasa: 'lirasan lavra', english: 'songbird' }],
  });

  // a headword respelled in an earlier edition: its old root, for reading older texts
  const formerly = new Map<string, string[]>();
  for (const [old, m] of Object.entries(lex.legacy.migration_forms)) {
    if (m.slot === 'root' && m.kind === 'respelled') {
      formerly.set(m.to, [...(formerly.get(m.to) ?? []), old]);
    }
  }
  const dictionary = heads
    .slice()
    .sort((a, b) => (a.root < b.root ? -1 : a.root > b.root ? 1 : 0))
    .map((h) => {
      const forms: string[] = [];
      for (const slot of FORM_SLOTS) {
        const key = SLOT_RAW_KEY[slot];
        const gloss = h.glosses[key] ?? '';
        if (isUnusedGloss(gloss)) continue;
        // The noun form is always the headword itself, so it is not repeated.
        const form = slot === 'root' ? '' : `${h.forms[key] ?? ''} `;
        forms.push(`${form}(${SLOT_CODE[slot]}) ${gloss}`);
      }
      const flags = [
        ...(h.register === 'poetic' ? ['poetic'] : []),
        ...(h.since === lex.version ? [`new in ${lex.version}`] : []),
        ...(formerly.get(h.root) ?? []).map((old) => `formerly ${old}`),
      ];
      const line =
        h.root +
        (h.components === null
          ? ''
          : ` [${h.components.join('+')}${h.suffix === undefined ? '' : `+-${h.suffix}`}]`) +
        (flags.length === 0 ? '' : ` {${flags.join(', ')}}`) +
        `: ${forms.join(' | ')}`;
      return { domain: h.domain, forms: forms.length, line };
    });

  const usedForms = dictionary.reduce((n, e) => n + e.forms, 0);

  // 2.0: the image-compound pattern and the productive derivations, by spelling
  const ids = new Map(heads.map((h) => [(h as unknown as { id: string }).id, h.root]));
  const pattern = lex.image_compounds;
  const imageCompounds =
    pattern === undefined
      ? undefined
      : {
          ruling: pattern.ruling,
          rule: pattern.rule,
          why: pattern.why,
          how_to_use:
            'Any modifier + any head below, written as one word, is a valid noun with a predictable meaning: "<modifier as_modifier> <head>". It needs no "new" flag. The attested ones have a canonical reading; prefer it. Its verb class follows its first letter, as for every compound.',
          modifiers: Object.fromEntries(
            Object.entries(pattern.modifiers).map(([id, m]) => [ids.get(id) ?? id, m]),
          ),
          heads: Object.fromEntries(
            Object.entries(pattern.heads).map(([id, h]) => [ids.get(id) ?? id, h]),
          ),
          attested: Object.fromEntries(pattern.attested.map((h) => [h.root, h.glosses.root])),
          count: { attested: pattern.attested.length, possible: pattern.capacity },
        };
  const defaults = (lex.morphology as unknown as { derivation_defaults?: Record<string, string> })
    .derivation_defaults;
  const has = (ref: string): boolean => rulings.some((r) => r.id === ref);
  const verbOf = (id: string): string =>
    heads.find((h) => (h as unknown as { id: string }).id === id)?.forms.verb ?? id;
  const live = lex.examples.filter((e) => e.status !== 'HISTORICAL');
  const numbers = lex.numbers.lookup_0_999;

  const out = {
    title: `Liraasa ${lex.version}: the complete grammar and dictionary, for language models`,
    read_me_first: [
      'Liraasa is a constructed language built for singing, by one author. This file is the complete, authoritative description of it: every grammar rule and every word.',
      'Read the sections in order: hard_rules, how_to_translate, sound, word_building, clause, recipes, rulings, small_words, dictionary, examples, album.',
      'Liraasa text in this file is always lowercase-spelled exactly as it must be written. Never change a spelling.',
      'When you write Liraasa, use only words that appear in this file (dictionary forms, small_words, numbers), or regular inflections and compounds built by the rules in word_building.',
      'After writing, check every line against self_check. If an English idea has no Liraasa word, say so instead of inventing one.',
    ],
    hard_rules: [
      'Never invent a word. A word is valid only if it appears in this file or is built by a rule stated in word_building.',
      `Every headword has seven possible forms, but only the forms listed on its dictionary line exist. A form not listed has no meaning and must never be used (${String(heads.length * 7 - usedForms)} such slots are deliberately left out).`,
      'Word order is fixed: SUBJECT, then preverbal operators, then VERB, then OBJECT, then adjuncts (see clause.template). Adjectives come before the noun.',
      'A noun never modifies a noun directly. Turn the first noun into its adjective, use a compound from the dictionary, or use a de phrase (rule ADR-0011).',
      'Questions keep statement order and end with ki. Negation is ne, placed immediately before what it negates.',
      'Spelling is phonetic and stress is always on the second-to-last syllable; every vowel is its own syllable.',
    ],
    how_to_translate: {
      steps: [
        'Identify each clause and its verb. One verb per clause; join clauses with a linker word (small_words.function_words, e.g. ata "and", nara "but", kasa "because", fime "that", raho "who/which").',
        'Find each content word in the dictionary by its English gloss. Pick the form whose role matches the job in the sentence (noun, verb, adjective).',
        'Place tense (po past, futu future; present needs none) after the subject and before the verb.',
        'Build noun phrases in the order of clause.noun_phrase: quantifier, article or owner, number, adjectives, noun, then de-phrase, then raho clause.',
        'Add -ri for a plural noun (optional after a number), -ti for a diminutive.',
        'Look for a matching pattern in recipes, and obey every ruling.',
        'Check the line against self_check.',
      ],
      how_a_reader_parses_one_word: READ_ORDER.map(plain),
    },
    sound: {
      vowels: lex.phonology.vowels,
      core_consonants: lex.phonology.consonants_core,
      other_consonants: lex.phonology.consonants_other,
      stress: `${lex.phonology.stress}. Every vowel is its own syllable: maivo is ma-i-vo (3 syllables), opioa is o-pi-o-a (4).`,
      new_root_template: lex.phonology.new_root_template,
      function_word_template: lex.phonology.function_word_template,
      protected_exceptions: lex.phonology.protected_exceptions,
      declared_one_edit_pairs: lex.phonology.declared_distance_1_pairs,
    },
    word_building: {
      seven_forms: {
        explanation:
          'Every headword R can have seven forms. Six are R plus a suffix; the verb follows verb_rule. Only forms listed in the dictionary have a meaning. Ascended forms (-asa, -asasan) are the sacred, exalted register; negative forms (-na, -nasan) give the opposite or the absence.',
        slots: FORM_SLOTS.map((slot) => ({
          slot: SLOT_ROLE[slot],
          build: SLOT_BUILD[slot],
          example_with_bena: `${bena.forms[SLOT_RAW_KEY[slot]] ?? ''}: ${bena.glosses[SLOT_RAW_KEY[slot]] ?? ''}`,
        })),
      },
      verb_rule: {
        ...lex.morphology.verb_rule,
        examples:
          'lira → lirala (consonant: + l + a), sabe → sabesia (s-initial), nedu → nedunia (n-initial), amor → amora (vowel-initial), opi → opioa (irregular)',
        compounds: 'A compound takes the verb class of its first letter.',
      },
      suffix_order: lex.morphology.suffix_order,
      suffixes: lex.morphology.suffixes,
      inflection_examples: {
        lirari: 'songs (-ri plural)',
        lirati: 'little song (-ti diminutive)',
        liratiri: 'little songs (-ti then -ri)',
      },
      derivations_note:
        defaults === undefined
          ? 'Derivations attach to the root spelling: R + yo (one who), R + vu (big, intense), R + pago (place of). A derivation takes no seven forms. Prefer the lexicalised ones below, which have fixed meanings.'
          : `Derivations are productive (${defaults.ruling ?? ''}): they attach to the spelling of any root or compound and take no seven forms. Default readings: ${Object.entries(
              defaults,
            )
              .filter(([k]) => k.startsWith('-'))
              .map(([k, v]) => `R${k} = ${v}`)
              .join(
                '; ',
              )}. ${defaults.constraints ?? ''} The lexicalised derivations below keep their fixed meanings and override the default.`,
      ...(defaults === undefined ? {} : { derivation_defaults: defaults }),
      lexicalised_derivations: lex.morphology.lexicalised_derivations,
      compounding:
        `${lex.morphology.compounding}. A compound is written as one word, modifier first and head last: lunolumi = moon-light. Use compounds listed in the dictionary; a new compound must join exactly two existing headwords and must be flagged as new.` +
        (has('2.0:G38')
          ? ' A colour base (small_words.colours) may be the modifier, and a compound may be lexicalised with -ti (2.0:G38).'
          : '') +
        (has('2.0:G42') ? ' Either part may itself be a compound (2.0:G42).' : '') +
        (imageCompounds === undefined
          ? ''
          : ' Image compounds (image_compounds below) are valid without a flag (2.0:G40).'),
      ...(imageCompounds === undefined ? {} : { image_compounds: imageCompounds }),
      motion_prefixes: lex.motion_prefixes,
      registers:
        'Entries are everyday or poetic. A text may be everyday, poetic or sacred; sacred is a property of the -asa / -asasan forms, not of a word list.',
    },
    clause: {
      template: lex.grammar.clause_template,
      explanation:
        'Twenty slots in fixed order. Only SUBJECT and VERB are required (a command has no subject). Bracketed slots are optional. One word per slot.',
      slots: lex.grammar.slots,
      noun_phrase: lex.grammar.noun_phrase,
      scope_operators: lex.grammar.scope_operators,
      stacking: lex.grammar.stacking,
      valency_operators: lex.grammar.valency,
      copulas:
        'ke = is (temporary state or location now); ka = is (permanent quality or identity). A predicate adjective may also stand bare: lira benasan.',
      questions:
        'Keep statement order: a question word stands where its answer would stand, and every direct question ends in ki (Taivo pagopa ki-pago ki? where are you going?). Question words are ki- correlatives (ki-coda what, ki-nela who, ki-pago where, ki-krono when, ki-kasa why, ki-modo how). A ki-word of time may open the clause as a frame. Embedded questions keep the word in place with no ki. A main clause with a ki-word and no final ki is an exclamation (2.1:G46, 2.1:G47).',
      linking: `fime = "that" introducing a clause; ola = the demonstrative "that". raho opens a relative clause, closed by a comma if the sentence continues. sidu joins two verbs with one subject (want to sing = ${verbOf(WANT)} sidu ${verbOf(SING)}); a second verb with its own subject goes in a fime clause (2.1:G50). ala means toward, never the infinitive "to".`,
    },
    recipes: RECIPES.map(([english, pattern, liraasa, gloss, ruling]) => ({
      english,
      pattern: pattern.replace(/`/g, ''),
      liraasa,
      meaning: gloss,
      ...(ruling === '' ? {} : { ruling }),
      // a sentence canon does not hold, though its words are canon: not yet approved
      ...(isCanonText(canon, liraasa) ? {} : { status: 'awaiting author review' }),
    })),
    rulings,
    settled_questions: lex.settled_open_questions_0_8,
    self_check: RULES.map(([severity, rule, id]) => ({ severity, rule, source: id })),
    open_questions_do_not_resolve: OPEN_QUESTIONS.map(plain),
    small_words: {
      function_words: {
        columns: ['form', 'meaning', 'use', 'example (Liraasa)', 'example (English)'],
        rows: lex.function_words.map((f) => [
          f.form,
          f.meaning,
          f.position,
          f.example,
          f.example_gloss,
        ]),
      },
      pronouns: lex.pronouns,
      correlatives: {
        columns: ['form', 'built from', 'meaning'],
        rows: lex.correlatives.map(({ form, determiner, concept, gloss }) => [
          form,
          `${determiner} + ${concept}`,
          gloss,
        ]),
      },
      numbers: {
        rules: lex.numbers.rules.map((r) => ({
          group: r.Group,
          value: r.Value,
          liraasa: r.Liraasa,
          rule: r['Construction rule'],
          comment: r['Usage / comment'],
        })),
        examples: Object.fromEntries(
          [
            '0',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '10',
            '11',
            '20',
            '24',
            '50',
            '60',
            '99',
            '100',
            '101',
            '365',
            '999',
          ].map((k) => [k, numbers[k] ?? '']),
        ),
        ordinals_and_fractions:
          'Ordinals add -ne: una-ne = first. Fractions are NUMBER de NUMBER: tressa de cuara = three quarters.',
      },
      time_words: {
        columns: ['form', 'meaning'],
        rows: lex.time_and_dates.map((t) => [t.form, t.english]),
      },
      colours: lex.colors.map((c) => ({
        family: c.Family,
        base: c['Base color'],
        dark: c['Dark + narvo'],
        vivid: c['Life + bio'],
        gem: c['Gem + juba'],
        light: c['Light + lumi'],
        notes: c['Example meanings / notes'],
      })),
      discourse_particles: lex.discourse_particles,
    },
    dictionary: {
      how_to_read:
        'One line per headword, grouped by domain, alphabetical within each. Line format: HEADWORD [PART+PART] {FLAGS}: (n) NOUN MEANING | FORM (ROLE) MEANING | … The noun form is the headword itself, so it is written only as (n) followed by its meaning: in "amor: (n) Love | amora (v) to love", amor means love and amora means to love. The [parts] appear only on compounds (both parts are headwords, or a colour base as the modifier; a lexicalised suffix follows as +-ti). {flags} appear only when the word is poetic or new in this edition. Only the forms on a line exist; a form not listed has no meaning. Add -ri / -ti to any noun form by the suffix rules.',
      role_codes: Object.fromEntries(FORM_SLOTS.map((s) => [SLOT_CODE[s], SLOT_ROLE[s]])),
      count: { headwords: dictionary.length, meaningful_forms: usedForms },
      by_domain: Object.fromEntries(
        [...new Set(dictionary.map((e) => e.domain))]
          .sort()
          .map((d) => [d, dictionary.filter((e) => e.domain === d).map((e) => e.line)]),
      ),
    },
    examples: {
      how_to_use: 'Canon sentences, all correct. Imitate their word order and choice of forms.',
      columns: ['liraasa', 'english'],
      sentences: live.map((e) => [e.liraasa, e.english]),
    },
    ...albumSection(),
    source: `Generated by scripts/build_llm_json.ts from ${lexPath} (Liraasa ${lex.version}, built ${lex.built_utc}). Regenerate with npm run build:llm; never edit by hand.`,
  };

  const text = compactJson(out);
  const path = resolve(flags.out ?? OUT);
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, text, 'utf8');
  if (flags.out === undefined) {
    mkdirSync(resolve(LATEST_DIR), { recursive: true });
    writeFileSync(resolve(LATEST_DIR, basename(OUT)), text, 'utf8');
    console.log(`wrote ${LATEST_DIR}/${basename(OUT)}`);
  }
  const kb = Buffer.byteLength(text, 'utf8') / 1024;
  console.log(`wrote ${path}`);
  console.log(
    `  ${String(dictionary.length)} headwords, ${String(usedForms)} meaningful forms, ${String(rulings.length)} rulings, ${String(live.length)} examples`,
  );
  console.log(
    `  ${kb.toFixed(0)} kB, roughly ${String(Math.round((kb * 1024) / 3.6 / 1000))}k tokens`,
  );
}

main();
