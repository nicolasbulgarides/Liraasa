/**
 * One-time tool: turn the author's Liraasa 2.5 grammar patch
 * (data/proposals/liraasa_2_5_patch.json, with its README
 * LIRAASA_2_5_README.md) into the three changesets `npm run integrate:2.5`
 * applies (ADR-0020), in the README's order:
 *
 *   1. 2026-10-22-lexicon-2-5-album         D-00: 2.5:G87, the album is not canon
 *   2. 2026-10-22-lexicon-2-5               every other decision, in file order
 *   3. 2026-10-22-lexicon-2-5-housekeeping  the housekeeping items
 *
 *   npx tsx scripts/make_changeset_2_5.ts               # write all three
 *   npx tsx scripts/make_changeset_2_5.ts --through 1   # write step 1 only
 *   npx tsx scripts/make_changeset_2_5.ts --check       # build, write nothing
 *
 * The patch is a semantic patch: its targets are the paths the 2.3 audit
 * cites, most of them in the generated LLM reference. A target that is
 * lexicon data becomes an op below, written against what 2.3 actually says
 * (every op checks its `from`); a target that is a summary the build scripts
 * write (hard_rules, clause.questions, recipes, self_check, how_to_translate,
 * small_words) is changed in those scripts, and listed in RESOLVED_IN_CODE so
 * the changelog names where it went. A ruling is never reworded: an amended
 * ruling is marked `amended_by`, a superseded one `superseded_by`, and a
 * ruling example that no longer holds goes to `legacy.archived_text`.
 *
 * The generator applies its own changesets to frozen 2.3 and halts unless
 * every op lands and every ruling the patch names exists.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  applyChangesets,
  type ChangesetRuling,
  type LexiconChangeset,
} from '../src/core/change/apply';
import type { ChangeRecord } from '../src/core/change/changelog';
import { IdAssigner, type IdMapFile } from '../src/core/model/ids';
import type { RawLexicon } from '../src/core/model/raw';
import { parseArgs } from './args';
import { WORD_BUILDING_2_0, idsAfter } from './integrate_2_0';

const PATCH = 'data/proposals/liraasa_2_5_patch.json';
const BASELINE = 'data/lexicon/liraasa_2_3.json';
const EDITION = '2.5';
const AT = '2026-10-22T18:00:00Z';
const AUTHOR = 'nicolas';
export const STEPS = [
  { id: '2026-10-22-lexicon-2-5-album', file: 'data/changes/2026-10-22-lexicon-2-5-album.json' },
  { id: '2026-10-22-lexicon-2-5', file: 'data/changes/2026-10-22-lexicon-2-5.json' },
  {
    id: '2026-10-22-lexicon-2-5-housekeeping',
    file: 'data/changes/2026-10-22-lexicon-2-5-housekeeping.json',
  },
] as const;

interface Example {
  liraasa: string;
  english?: string;
  why?: string;
}
interface Decision {
  ruling_id: string | null;
  issue: string;
  author_choice: string;
  text: string;
  supersedes?: string[];
  amends?: string[];
  settles_open_questions?: string[];
  examples_grammatical?: Example[];
  examples_ungrammatical?: Example[];
  edits?: { target: string; action: string; from?: string; to?: string; note?: string }[];
  derived?: string[];
  translator_preference?: string;
  notes?: string;
}
interface Patch {
  decisions: Decision[];
  housekeeping: { items: { issue: string; action: string }[] };
}

/** A short title for each new ruling, in the style of the earlier topics. */
const TOPIC: Record<string, string> = {
  G87: 'The album is not grammar canon',
  G88: 'Questions end in ki; a fronted ki-word may drop it',
  G89: 'Which clause a final ki or attitude word belongs to',
  G126: "The clause's closing order and its edge positions",
  G127: 'What may stand in FRAME',
  G90: 'A command is marked',
  G91: 'Fragment questions',
  G92: 'Echo ki',
  G93: 'ke and ka: one contrast for every predicate',
  G128: 'The minimal clause',
  G94: 'po ka and kapoki',
  G95: 'Kinship nouns are not names for possession',
  G96: 'Chains of de',
  G97: 'NUMBER de NUMBER',
  G98: 'Noun-phrase order',
  G99: 'li after a side noun',
  G100: 'maivo: I and Self',
  G101: 'Which words take -ri, and plural agreement',
  G102: 'Pronouns for animals',
  G103: 'Time nouns as "when"',
  G104: 'yuta, en, ko and la: one test per word',
  G105: 'Where la + adjective stands',
  G106: 'Comparing amounts and manner',
  G107: 'gase + a number',
  G108: 'Measures with kroti and krotiapo',
  G109: 'Valency operators: the full pattern',
  G110: 'Passives, and change-of-state verbs',
  G111: 'Adjective + sidu + verb: no dummy ito',
  G112: 'A bare pronoun recipient',
  G113: 'Purpose always uses kopisa',
  G114: '"Would have" is po noma viki',
  G115: 'The comma that closes a raho clause',
  G116: 'Hopeful purpose: kopisa + nosi',
  G117: 'tonsi: therefore, and so',
  G118: 'Tense in subordinate clauses',
  G119: 'Picking up a hozi topic',
  G120: 'Relatives on a possessor, a time or a place',
  G121: 'The motion prefixes are productive',
  G122: '-ti is an inflection',
  G123: 'Words ending in pago',
  G124: 'Image compounds have all seven forms',
  G125: 'Negative numbers: antizi',
};

/**
 * Patch targets that are summaries written by the build scripts, not lexicon
 * data: where each one is changed. Reported, so nothing is silently dropped.
 */
export const RESOLVED_IN_CODE: Record<string, string> = {
  'album.how_to_use': 'scripts/build_llm_json.ts albumSection',
  'album.tracks[*].lines[*].album_reading': 'scripts/build_llm_json.ts albumSection',
  'read_me_first / any summary that cites 2.2:G68 or calls the album canon':
    'scripts/build_llm_json.ts read_me_first; scripts/grammar_guide/album.ts',
  'hard_rules[4]': 'scripts/build_llm_json.ts hard_rules',
  'hard_rules[1] (add the exception)': 'scripts/build_llm_json.ts hard_rules',
  'clause.questions': 'scripts/build_llm_json.ts clause.questions',
  'clause.copulas': 'scripts/build_llm_json.ts clause.copulas',
  'clause.explanation': 'scripts/build_llm_json.ts clause.explanation',
  'clause.copulas definitions of ke and ka': 'scripts/build_llm_json.ts clause.copulas',
  'recipes[5]': 'scripts/grammar_guide/chapters.ts RECIPES',
  'recipes[6]': 'scripts/grammar_guide/chapters.ts RECIPES',
  'recipes[20]': 'scripts/grammar_guide/chapters.ts RECIPES',
  'recipes[50]': 'scripts/grammar_guide/chapters.ts RECIPES',
  'recipes[61]': 'scripts/grammar_guide/chapters.ts RECIPES',
  'recipes[63]': 'scripts/grammar_guide/chapters.ts RECIPES',
  'recipes[24], recipes[68] status': 'scripts/grammar_guide/chapters.ts REVIEWED_RECIPES',
  'self_check[6]': 'scripts/grammar_guide/chapters.ts RULES',
  'how_to_translate.how_a_reader_parses_one_word[5]':
    'scripts/grammar_guide/chapters.ts READ_ORDER',
  'how_to_translate.how_a_reader_parses_one_word[6]':
    'scripts/grammar_guide/chapters.ts READ_ORDER',
  'open_questions_do_not_resolve[0], [2], [4], [5]':
    'scripts/grammar_guide/chapters.ts OPEN_QUESTIONS',
  'word_building.image_compounds.how_to_use': 'scripts/build_llm_json.ts imageCompounds',
  'small_words.time_words (split; duplicates out of the table)': 'scripts/build_llm_json.ts',
  'examples.how_to_use': 'scripts/build_llm_json.ts examples',
  'correlative bases glossed as bound bases': 'scripts/build_llm_json.ts correlatives',
};

const record = (
  op: ChangeRecord['op'],
  entry: string,
  from: string | null,
  to: string | null,
  ruling: string,
  reason: string,
  field?: string,
): ChangeRecord => ({
  entry,
  op,
  ...(field === undefined ? {} : { field }),
  from,
  to,
  ruling: ruling as NonNullable<ChangeRecord['ruling']>,
  reason,
  addedIn: EDITION,
  at: AT,
  author: AUTHOR,
});

const RULING_REF = /\b(\d\.\d):([GR]\d+)\b/g;
const refsIn = (text: string): string[] => [...text.matchAll(RULING_REF)].map((m) => m[0]);

function rulingOf(lex: RawLexicon, ref: string): { id: string; topic: string } | undefined {
  const [edition, id] = ref.split(':');
  const key = `rulings_${(edition ?? '').replace('.', '_')}${edition === '0.8' ? '_carried' : ''}`;
  const set = (lex as unknown as Record<string, { id: string; topic: string }[] | undefined>)[key];
  return set?.find((r) => r.id === id);
}

/** The ruling payload, in the existing format plus the patch's additive fields. */
function rulingPayload(d: Decision): ChangesetRuling {
  const id = (d.ruling_id ?? '').split(':')[1] ?? '';
  const topic = TOPIC[id];
  if (topic === undefined) throw new Error(`${String(d.ruling_id)}: no topic`);
  const refines = [...new Set((d.amends ?? []).flatMap(refsIn))];
  return {
    id,
    topic,
    ruling: d.text,
    ...(refines.length > 0 ? { refines } : {}),
    ...(d.supersedes === undefined ? {} : { supersedes: d.supersedes }),
    examples: (d.examples_grammatical ?? []).map((e) => [e.liraasa, e.english ?? '']),
    issue: d.issue,
    ...(d.amends === undefined ? {} : { amends: d.amends }),
    ...(d.examples_ungrammatical === undefined
      ? {}
      : { examples_ungrammatical: d.examples_ungrammatical.map((e) => [e.liraasa, e.why ?? '']) }),
    ...(d.derived === undefined ? {} : { derived: d.derived }),
    ...(d.settles_open_questions === undefined
      ? {}
      : { settles_open_questions: d.settles_open_questions }),
    ...(d.translator_preference === undefined
      ? {}
      : { translator_preference: d.translator_preference }),
    ...(d.notes === undefined ? {} : { notes: d.notes }),
  };
}

/** add_ruling, then the supersede and amend marks every earlier ruling it names gets. */
function rulingOps(lex: RawLexicon, d: Decision): ChangeRecord[] {
  const ref = d.ruling_id ?? '';
  const why = `The author's 2.5 decision on ${d.issue} (option ${d.author_choice}).`;
  const ops = [record('add_ruling', ref, null, TOPIC[ref.split(':')[1] ?? ''] ?? '', ref, why)];
  for (const s of d.supersedes ?? []) {
    for (const old of refsIn(s)) {
      const r = rulingOf(lex, old);
      if (r === undefined) throw new Error(`${ref} supersedes ${old}, which does not exist`);
      // "the closed-list part of 1.2:G35": only that part is superseded
      const part =
        s === old
          ? undefined
          : s
              .replace(old, '')
              .replace(/\s+of\s*$/, '')
              .trim();
      ops.push(
        record(
          'supersede_ruling',
          old,
          r.topic,
          ref,
          ref,
          `${why} ${old} is kept as ruled, never reworded; ${part === undefined ? 'it is' : `${part} is`} superseded by ${ref}.`,
          part,
        ),
      );
    }
  }
  for (const a of d.amends ?? []) {
    for (const old of refsIn(a)) {
      const r = rulingOf(lex, old);
      if (r === undefined) throw new Error(`${ref} amends ${old}, which does not exist`);
      ops.push(
        record(
          'amend_ruling',
          old,
          r.topic,
          ref,
          ref,
          `${why} ${old} is kept as ruled; where the two differ, ${ref} is followed.`,
          a,
        ),
      );
    }
  }
  return ops;
}

/** Find a function word's id by its form. */
const fwId = (lex: RawLexicon, form: string): string => {
  const row = (lex.function_words as unknown as { form: string; id: string }[]).find(
    (f) => f.form === form,
  );
  if (row === undefined) throw new Error(`no function word ${form}`);
  return row.id;
};
const fwField = (lex: RawLexicon, form: string, field: string): string =>
  String(
    (lex.function_words as unknown as Record<string, unknown>[]).find((f) => f.form === form)?.[
      field
    ],
  );

/** An example's text, by its index in the lexicon's `examples` (2.3 order). */
const exampleAt = (lex: RawLexicon, i: number, field: 'liraasa' | 'english' = 'liraasa'): string =>
  String((lex.examples[i] as unknown as Record<string, unknown> | undefined)?.[field]);

/** The lexicon index of the LLM reference's `examples.sentences[n]` (HISTORICAL rows left out). */
const liveIndex = (lex: RawLexicon, n: number): number => {
  const live = lex.examples
    .map((e, i) => [e, i] as const)
    .filter(([e]) => e.status !== 'HISTORICAL')
    .map(([, i]) => i);
  const i = live[n];
  if (i === undefined) throw new Error(`examples.sentences[${String(n)}] does not exist`);
  return i;
};

/**
 * The data edits each decision makes, written against 2.3. Each returns the
 * ops; a `from` that does not match is caught when the build applies them.
 */
function decisionEdits(lex: RawLexicon, d: Decision): ChangeRecord[] {
  const ref = d.ruling_id ?? '';
  const why = (what: string): string =>
    `${d.issue}, ${ref === '' ? 'no new ruling' : ref}: ${what}`;
  const slotNotes = (n: number): string =>
    String((lex.grammar.slots as unknown as { notes: string }[])[n]?.notes);
  const fw = (form: string, field: 'meaning' | 'position', to: string, what: string) =>
    record(
      'edit_function_word',
      fwId(lex, form),
      fwField(lex, form, field),
      to,
      ref,
      why(what),
      field,
    );
  const example = (n: number, to: string, what: string, field?: 'english') => {
    const i = liveIndex(lex, n);
    return record(
      'edit_example',
      `example:${String(i)}`,
      exampleAt(lex, i, field ?? 'liraasa'),
      to,
      ref,
      why(what),
      field,
    );
  };
  const exampleByIndex = (i: number, to: string, what: string) =>
    record('edit_example', `example:${String(i)}`, exampleAt(lex, i), to, ref, why(what));

  switch (d.issue) {
    case 'I-01 + I-02':
    case 'D-00':
      return [];
    case 'I-50':
      return [
        record(
          'edit_text',
          'text:grammar.slots.19.notes',
          slotNotes(19),
          'last word of the sentence, and it belongs to the main clause; only a vocative set off by a comma may follow it (2.5:G89)',
          ref,
          why('clause.slots[19] amended'),
        ),
      ];
    case 'I-23 + I-03':
      return [
        record(
          'edit_text',
          'text:grammar.clause_template',
          lex.grammar.clause_template,
          '[LINKER] [FRAME,] [TOPIC hozi,] [ki-WORD] SUBJECT [TENSE] [noma] [ne] [MODAL] [APPROACH] [PHASE] [EFFORT] [ASPECT] [ITERATION] [EVIDENTIAL] VERB [OBJECT] [ADJUNCTS] [fuyi] [hoyo|yasmo] [ATTITUDE] [ki] [, VOCATIVE]',
          ref,
          why('the template gains the edge positions'),
        ),
        record(
          'edit_value',
          'value:grammar.edges',
          null,
          JSON.stringify({
            before_the_clause: [
              {
                position: 'LINKER',
                words: ['ata', 'oro', 'nara'],
                notes: 'a line or clause that continues the one before (1.2:G25, 2.3:G72)',
              },
              { position: 'FRAME', words: ['see slot 1'], notes: 'set off by a comma (2.5:G127)' },
              { position: 'TOPIC', words: ['NP + hozi'], notes: 'set off by a comma (2.5:G119)' },
              {
                position: 'ki-WORD',
                words: ['a fronted ki-word'],
                notes: 'the question may then end without ki (2.5:G88)',
              },
            ],
            after_the_clause: [
              {
                position: 'VOCATIVE',
                words: ['a noun phrase or name'],
                notes: 'set off by a comma; may follow ki (2.5:G89)',
              },
            ],
            closing_order:
              'VERB [OBJECT] [ADJUNCTS] [fuyi] [STATUS: hoyo | yasmo] [ATTITUDE] [ki]; closing time words, durations and clause-final reve / loki stand among the ADJUNCTS, before fuyi (2.5:G126)',
            ruling: '2.5:G126',
          }),
          ref,
          why('the edge positions, in order'),
        ),
        record(
          'edit_text',
          'text:grammar.slots.11.notes',
          slotNotes(11),
          'already / again / still; reve and loki may instead close the clause, among the adjuncts before fuyi (2.5:G126)',
          ref,
          why('clause.slots[11].notes amended'),
        ),
      ];
    case 'I-27':
      return [
        record(
          'edit_value',
          'value:grammar.slots.0.words',
          JSON.stringify(lex.grammar.slots[0]?.words),
          JSON.stringify([
            'time adverbials (time_and_dates rows with time_class adverbial)',
            'correlatives of time and place (eli-krono, eli-pago, ola-pago …)',
            'prepositional phrases of place (En li nimu, …)',
            'zafra',
            'finra',
            'lanto',
            'kenvi',
          ]),
          ref,
          why('FRAME holds a time or a place adverbial'),
        ),
        record(
          'edit_text',
          'text:grammar.slots.0.notes',
          slotNotes(0),
          'clause-initial, set off by a comma; a time or place adverbial, never a tense word (po, futu, pressa) or an iteration word (reve, loki, bodu) (2.5:G127)',
          ref,
          why('clause.slots[0] amended'),
        ),
      ];
    case 'I-20': {
      // the audit: every command written without '!' or fisa gets '!' (each one reported)
      const commands: [number, string][] = [
        [356, 'Palvipa li miru en li kova!'],
        [366, 'Palvipa li bumre su li namikova!'],
        [372, 'Cemoyanoca li marnapusa ko li miru!'],
        [392, 'Ne kulpaka Kipo! Maivo po livnala.'],
        [394, 'Ne kulpahelvika! Lenila!'],
      ];
      return commands.map(([i, to]) =>
        exampleByIndex(i, to, 'a command written without ! or fisa: ! added (audit)'),
      );
    }
    case 'I-31':
      return [
        example(236, 'Ata ki?', 'examples.sentences[236] replaced'),
        example(236, 'And?', 'examples.sentences[236] replaced', 'english'),
      ];
    case 'I-04 + I-10':
      return [
        fw(
          'ke',
          'meaning',
          'is / are: holds now, or for a time',
          'the ke row follows the one contrast',
        ),
        fw(
          'ke',
          'position',
          'copula for any predicate (adjective, noun phrase or location) that holds now or for a time (2.5:G93)',
          'the ke row follows the one contrast',
        ),
        fw(
          'ka',
          'meaning',
          'is / are: lasting, defining, by nature',
          'the ka row follows the one contrast',
        ),
        fw(
          'ka',
          'position',
          'copula for any predicate (adjective, noun phrase or location) that is lasting, defining or by nature (2.5:G93)',
          'the ka row follows the one contrast',
        ),
        // review: ka for an ordinary present location → ke (the glosses are present locations)
        example(
          328,
          exampleAt(lex, liveIndex(lex, 328)).replace(' ka su ', ' ke su '),
          'a present location takes ke',
        ),
        example(
          353,
          exampleAt(lex, liveIndex(lex, 353)).replace(' ka en ', ' ke en '),
          'a present location takes ke',
        ),
        example(
          364,
          exampleAt(lex, liveIndex(lex, 364)).replace(' ka su ', ' ke su '),
          'a present location takes ke',
        ),
        // examples.sentences[352] is also 1.2:G27's example 1: the ruling's copy goes to the archive
        example(
          352,
          exampleAt(lex, liveIndex(lex, 352)).replace(' ka su ', ' ke su '),
          'a present location takes ke',
        ),
        record(
          'archive_text',
          '1.2:G27',
          'Li bitiri de pilo ka su li tabu.',
          'Li bitiri de pilo ke su li tabu.',
          ref,
          why(
            "the example's gloss is a present location, which takes ke; the ruling is kept, its old example archived",
          ),
          'example:1',
        ),
      ];
    case 'I-09':
      return [
        record(
          'edit_text',
          'text:grammar.slots.2.notes',
          slotNotes(2),
          'obligatory except in commands, hortatives, permitted ellipsis and existential miyo clauses; a bare adjective predicate (SUBJECT ADJECTIVE) only in the present with no operators (2.5:G128)',
          ref,
          why('clause.slots[2].notes amended'),
        ),
      ];
    case 'I-11':
      return [
        fw(
          'kapoki',
          'meaning',
          'previously was, no longer is; contrasts with po ka (was, no claim about now)',
          'the patch gives the row',
        ),
        fw(
          'po',
          'position',
          'Preverbal tense. po ka = was (lasting), with no claim about now; po ke = was, at that time; kapoki = was, and no longer is (2.5:G94).',
          'aligned with 2.5:G94',
        ),
      ];
    case 'I-12 + I-14':
      return [
        fw(
          'de',
          'position',
          'a pronoun or a personal name before de owns (taivo de lira, your song); otherwise the noun after de owns (li bumre de li cilni, the bread of the city); kinship nouns are not names (2.5:G95)',
          'the row states both directions',
        ),
      ];
    case 'I-29': {
      const row = lex.numbers.rules.findIndex((r) => r.Value === 'I');
      return [
        record(
          'edit_text',
          `text:numbers.rules.${String(row)}.Usage / comment`,
          String(lex.numbers.rules[row]?.['Usage / comment']),
          'Plural -ri is optional after a number; choose by sound and meter (1.2:G28, 2.5:G101).',
          ref,
          why('small_words.numbers.rules row I rewritten'),
        ),
      ];
    }
    case 'I-25':
      return [
        example(
          470,
          'Maivo po helnaha li linu yuta li helna.',
          'medicine is a substance used: yuta',
        ),
      ];
    case 'I-21':
      return [
        fw(
          'vaku',
          'position',
          'CAUSER [TENSE] [noma] [ne] [MODAL] … [EVIDENTIAL] vaku ACTOR [ne] [APPROACH] [PHASE] [EFFORT] VERB [OBJECT]; the embedded verb may take an object (2.5:G109).',
          "'intransitive VERB' removed; the 2.5:G109 pattern stated",
        ),
        record(
          'edit_text',
          'text:grammar.valency.pattern',
          lex.grammar.valency.pattern ?? null,
          'CAUSER [TENSE] [noma] [ne] [MODAL] … [EVIDENTIAL] OP ACTOR [ne] [APPROACH] [PHASE] [EFFORT] VERB [OBJECT] (2.5:G109)',
          ref,
          why('clause.valency_operators.pattern matches 2.5:G109'),
        ),
      ];
    case 'I-22':
      return [
        fw(
          'gome',
          'position',
          'PATIENT + [TENSE] + gome + VERB + [gagu AGENT]; any verb attested with an object anywhere in the data may take gome (2.5:G110)',
          'the gome row amended',
        ),
        record(
          'edit_value',
          'value:settled_open_questions_0_8.4.amended_by',
          null,
          JSON.stringify('2.5:G110'),
          ref,
          why('settled question 5 is amended; the settled answer is kept as written and marked'),
        ),
      ];
    case 'I-55':
    case 'I-39': {
      if (d.issue === 'I-55') return [];
      // the audit: every 'po viki' meaning 'would have' becomes 'po noma viki'
      return [220, 435].map((i) =>
        exampleByIndex(
          i,
          exampleAt(lex, i).replace(' po viki ', ' po noma viki '),
          "'would have' is po noma viki (audit)",
        ),
      );
    }
    case 'I-19':
      // the audit: a comma after every clause-initial tonsi
      return [
        exampleByIndex(
          510,
          'Li lanve po tranata, tonsi, maivo po lemula ito.',
          'clause-initial tonsi takes a comma (audit)',
        ),
      ];
    case 'I-51':
      return [
        fw(
          'hozi',
          'position',
          'after a clause-initial noun phrase, followed by a pause; a subject topic is picked up by a pronoun, a non-subject topic may be picked up or left as a gap read as the object (2.5:G119)',
          'the hozi row states 2.5:G119',
        ),
      ];
    case 'I-07':
      return [example(210, 'Maivo po vimova fime taivo pagopa.', 'fime is "that"')];
    case 'I-05 + I-06':
      return [
        record(
          'edit_text',
          'text:motion_prefixes.rule',
          lex.motion_prefixes.rule,
          'productive on any verb, with compositional meanings; a listed meaning (the curated metaphors) overrides the compositional one; lu-, nu-, mi-, so- stay retired (2.5:G121)',
          ref,
          why('word_building.motion_prefixes.rule superseded'),
        ),
        record(
          'edit_value',
          'value:settled_open_questions_0_8.6.amended_by',
          null,
          JSON.stringify('2.5:G121'),
          ref,
          why(
            'settled question 7 is superseded in its closed-list part; the answer is kept as written and marked',
          ),
        ),
        record(
          'mark_ruling_covered',
          '2.3:G75',
          rulingOf(lex, '2.3:G75')?.topic ?? '',
          ref,
          ref,
          why('pagopa no longer needs to be ruled a motion verb; the ruling is kept'),
        ),
      ];
    case 'I-30': {
      const table = lex.morphology.lexicalised_derivations;
      const ti = ['monruti', 'mirunuluti', 'kezumiruti', 'soloti', 'larbopagoti', 'lavbupagoti'];
      for (const w of ti)
        if (!(w in table)) throw new Error(`I-30: ${w} is not a lexicalised derivation`);
      const kept = Object.fromEntries(Object.entries(table).filter(([w]) => !ti.includes(w)));
      const moved = Object.fromEntries(Object.entries(table).filter(([w]) => ti.includes(w)));
      return [
        record(
          'edit_value',
          'value:morphology.lexicalised_derivations',
          JSON.stringify(table),
          JSON.stringify(kept),
          ref,
          why('the -ti items leave the derivations'),
        ),
        record(
          'edit_value',
          'value:morphology.lexicalised_diminutives',
          null,
          JSON.stringify(moved),
          ref,
          why("the -ti items, kept whole, in a 'lexicalised diminutives' list"),
        ),
      ];
    }
    case 'I-45': {
      const row = lex.numbers.rules.findIndex((r) => r.Value === 'J');
      const cell = String(lex.numbers.rules[row]?.['Construction rule']);
      return [
        record(
          'add_function_word',
          '',
          null,
          'antizi',
          ref,
          why('antizi, a new function word (passes the function-word template)'),
        ),
        record(
          'edit_text',
          `text:numbers.rules.${String(row)}.Construction rule`,
          cell,
          cell.replace(
            'negative and decimal numbers await separate policy',
            'negative numbers: antizi + NUMBER (antizi dossa, minus two; 2.5:G125); decimal numbers await separate policy',
          ),
          ref,
          why('the numbers table states the negative rule'),
        ),
      ];
    }
    case 'I-34':
      return declaredPairs(lex, ref, why);
    default:
      return [];
  }
}

/**
 * I-34: of the fourteen undeclared one-edit monosyllable pairs, declare those
 * that never compete for one slot. Two words compete when both may stand
 * before the same kind of word in the same place. Every competing pair is
 * reported for the author (review/questions_2_5.md), li/la first.
 */
export const ONE_EDIT_PAIRS: { pair: [string, string]; competes: boolean; why: string }[] = [
  {
    pair: ['li', 'la'],
    competes: true,
    why: 'both may stand before an adjective after the verb: li molusan (the gentle one, an object) / la molusan (gently, an adjunct) (2.3:G82, 2.5:G105)',
  },
  { pair: ['li', 'si'], competes: false, why: 'li opens a noun phrase; si opens a clause' },
  { pair: ['li', 'ki'], competes: false, why: 'li opens a noun phrase; ki closes a sentence' },
  {
    pair: ['de', 'ne'],
    competes: true,
    why: 'both may stand right before a noun phrase: X de li nimu / X ne li nimu ("not the home", ne scoping one constituent, I-33)',
  },
  {
    pair: ['de', 'ke'],
    competes: true,
    why: 'after a noun, both may precede a noun phrase: li lira de li sora / li lira ke li sora (copula)',
  },
  {
    pair: ['ne', 'ke'],
    competes: true,
    why: 'both may stand between a subject and a predicate adjective: nela ne vanisan (✗ under 2.5:G128, but a reader must still tell them apart) / nela ke vanisan',
  },
  {
    pair: ['ke', 'ko'],
    competes: true,
    why: 'after a subject, both may precede a noun phrase: maivo ke li sora / maivo ko li sora (a verbless fragment)',
  },
  {
    pair: ['ke', 'ki'],
    competes: false,
    why: 'ke stands in the verb slot; ki only at the end of a sentence',
  },
  {
    pair: ['ka', 'da'],
    competes: true,
    why: 'after a subject, both may precede a noun phrase: saivo ka li nimu / saivo da li nimu (a verbless fragment)',
  },
  {
    pair: ['ka', 'ko'],
    competes: true,
    why: 'after a subject, both may precede a noun phrase (as ke / ko)',
  },
  {
    pair: ['ka', 'la'],
    competes: true,
    why: 'both may precede an adjective: maivo ka molusan / maivo la molusan (✗ under 2.5:G105, but a reader must still tell them apart)',
  },
  { pair: ['si', 'ki'], competes: false, why: 'si opens a clause; ki closes a sentence' },
  {
    pair: ['ko', 'ki'],
    competes: false,
    why: 'ko opens a noun phrase; ki is the last word of a sentence and is never followed by a noun phrase except a comma-set vocative',
  },
  {
    pair: ['da', 'la'],
    competes: false,
    why: 'da precedes a noun phrase; la precedes an adjective',
  },
];

function declaredPairs(lex: RawLexicon, ref: string, why: (w: string) => string): ChangeRecord[] {
  const declared = new Set(
    (lex.phonology.declared_distance_1_pairs as string[][]).map((p) => p.join('/')),
  );
  return ONE_EDIT_PAIRS.filter(
    (p) =>
      !p.competes &&
      !declared.has(p.pair.join('/')) &&
      !declared.has([...p.pair].reverse().join('/')),
  ).map((p) =>
    record(
      'edit_metadata',
      'phonology.declared_distance_1_pairs',
      null,
      JSON.stringify(p.pair),
      ref,
      why(`${p.pair.join('/')} declared: a position check shows they never compete (${p.why})`),
    ),
  );
}

/** I-27: each time-table row's class, so FRAME and the reader can tell them apart. */
const OPERATORS = new Set(['po', 'futu', 'pressa', 'reve', 'loki', 'bodu', 'kroti', 'krotiapo']);
const TIME_NOUNS = new Set([
  'seca',
  'minota',
  'deya',
  'deyafama',
  'monta',
  'montafama',
  'codamontafama',
  'kronopago',
  'nullo',
  'merno',
  'vesno',
  'mambi',
  'lornu',
]);
const PLACE = new Set(['eli-pago', 'ola-pago']);
function timeClass(form: string): string {
  if (OPERATORS.has(form)) return 'operator';
  if (TIME_NOUNS.has(form)) return 'noun';
  if (PLACE.has(form)) return 'place_adverbial';
  return 'adverbial';
}

function housekeepingOps(lex: RawLexicon): ChangeRecord[] {
  const ops: ChangeRecord[] = [];
  const hk = (issue: string, what: string): string =>
    `Housekeeping ${issue} (the author approved all): ${what}`;

  // I-26: the 2.3:G73 example with su after a writing verb (an album line) → ko + a feeling
  ops.push(
    record(
      'archive_text',
      '2.3:G73',
      'ata li veluri po sarbisia ko bapi su li doza de farulavrasan amor.',
      'Maivo lirala ko amor.',
      '2.5:G104',
      hk(
        'I-26',
        "the example used su after a writing verb, against 1.2:G30; replaced by 2.5:G104's ko + feeling example",
      ),
      'example:1',
    ),
  );
  const g73 = (lex.rulings_2_3 as unknown as { id: string; examples: [string, string][] }[]).find(
    (r) => r.id === 'G73',
  );
  if (
    g73?.examples[1]?.[0] !== 'ata li veluri po sarbisia ko bapi su li doza de farulavrasan amor.'
  )
    throw new Error('I-26: 2.3:G73 example 1 is not the album line');

  // I-27: time words get a class; the three duplicate rows are marked; eli-pago, ola-pago are place adverbials
  const seen = new Map<string, string>();
  for (const [i, t] of (
    lex.time_and_dates as unknown as { form: string; id: string }[]
  ).entries()) {
    const first = seen.get(t.form);
    seen.set(t.form, first ?? t.id);
    ops.push(
      record(
        'edit_value',
        `value:time_and_dates.${String(i)}.time_class`,
        null,
        JSON.stringify(first === undefined ? timeClass(t.form) : 'duplicate'),
        '2.5:G127',
        hk(
          'I-27',
          `${t.form}: ${first === undefined ? timeClass(t.form) : `a duplicate of ${first}, left out of the time table`}`,
        ),
      ),
    );
  }

  // I-33: one wording for ne's scope everywhere
  const NE =
    'a preverbal ne scopes over everything to its right up to the verb; a ne elsewhere scopes over the single constituent that follows it';
  ops.push(
    record(
      'edit_function_word',
      fwId(lex, 'ne'),
      fwField(lex, 'ne', 'position'),
      `${NE} (I-33)`,
      '1.0:G1',
      hk('I-33', 'one wording for the scope of ne'),
      'position',
    ),
    record(
      'edit_text',
      'text:grammar.slots.5.notes',
      String(lex.grammar.slots[5]?.notes),
      `may also stand before any later operator or the verb; ${NE} (I-33)`,
      '1.0:G1',
      hk('I-33', 'one wording for the scope of ne'),
    ),
    record(
      'edit_text',
      'text:grammar.stacking.scope',
      lex.grammar.stacking.scope,
      `left scopes over right (G1); ${NE}`,
      '1.0:G1',
      hk('I-33', 'one wording for the scope of ne'),
    ),
  );

  // I-40: illustrations and contrasts are marked; every other live example is canonical
  for (const [i, e] of lex.examples.entries()) {
    if (e.status === 'HISTORICAL') continue;
    const kind = exampleKind(e.liraasa, e.english);
    if (kind === 'canonical') continue;
    ops.push(
      record(
        'edit_value',
        `value:examples.${String(i)}.kind`,
        null,
        JSON.stringify(kind),
        '2.5:G87',
        hk('I-40', `${e.liraasa}: ${kind}`),
      ),
    );
  }

  // I-41: ATTITUDE words everywhere (the rows; a ruling's own wording is never changed)
  for (const form of ['seye', 'mufe', 'poye', 'pifu']) {
    const meaning = fwField(lex, form, 'meaning');
    ops.push(
      record(
        'edit_function_word',
        fwId(lex, form),
        meaning,
        meaning.replace('final certainty:', 'attitude:'),
        '1.0:G22',
        hk('I-41', `${form} is an ATTITUDE word`),
        'meaning',
      ),
    );
  }

  // I-44: historical and formulae rows; the obsolete digit comments go to the archive
  for (const form of ['ki-saivo', 'lorejuba ala taivo']) {
    ops.push(
      record(
        'edit_value',
        `value:function_words.${String(lex.function_words.findIndex((f) => f.form === form))}.table`,
        null,
        JSON.stringify('historical_and_formulae'),
        '1.0:G19',
        hk('I-44', `${form} moves to the "historical and formulae" table`),
      ),
    );
  }
  for (const value of [7, 9]) {
    const row = lex.numbers.rules.findIndex((r) => r.Value === value);
    const text = String(lex.numbers.rules[row]?.['Usage / comment']);
    ops.push(
      record(
        'archive_text',
        `text:numbers.rules.${String(row)}.Usage / comment`,
        text,
        'Ten is unzira, not una-zira.',
        '1.0:G19',
        hk(
          'I-44',
          'an obsolete 0.7 digit comment, archived; the row reads as every other digit row',
        ),
        'text',
      ),
    );
  }
  return ops;
}

/** I-40: a word-building illustration has no sentence-final mark; a contrast is labelled so. */
export function exampleKind(
  liraasa: string,
  english: string,
): 'canonical' | 'illustration' | 'contrast' {
  if (/\bavoid\b|\balternative\)/i.test(english)) return 'contrast';
  if (!/[.!?…—]["”]?\s*$/.test(liraasa.trim()) || liraasa.includes(' → ')) return 'illustration';
  return 'canonical';
}

/** antizi's row (2.5:G125), its id minted as the build mints it. */
function antiziRow(
  lex: RawLexicon,
  ids: IdMapFile,
): Record<string, unknown> & { id: string; form: string } {
  const minting = new IdAssigner(ids);
  for (const f of lex.function_words as unknown as { form: string; id: string }[])
    minting.assign('functionWord', f.form, f.id);
  return {
    form: 'antizi',
    meaning: 'minus (a negative number)',
    position: 'number sign: directly before a number',
    example: 'antizi dossa',
    example_gloss: 'minus two',
    class: 'number sign',
    status_1_0: 'NEW',
    status_2_5: 'NEW',
    since: EDITION,
    id: minting.assign('functionWord', 'antizi'),
  };
}

export function makeChangesets2_5(): LexiconChangeset[] {
  const patch = JSON.parse(readFileSync(resolve(PATCH), 'utf8')) as Patch;
  const lex = JSON.parse(readFileSync(resolve(BASELINE), 'utf8')) as RawLexicon;
  const ids = idsAfter(
    lex,
    JSON.parse(readFileSync(resolve('data/lexicon/ids.json'), 'utf8')) as IdMapFile,
  );
  const [album, ...rest] = patch.decisions;
  if (album?.issue !== 'D-00') throw new Error('the patch does not open with D-00');

  const build = (id: string, summary: string, decisions: Decision[], extra: ChangeRecord[]) => {
    const rulings = decisions.filter((d) => d.ruling_id !== null).map(rulingPayload);
    const antizi = decisions.some((d) => d.issue === 'I-45') ? [antiziRow(lex, ids)] : [];
    const ops = [
      ...decisions.flatMap((d) => [
        ...(d.ruling_id === null ? [] : rulingOps(lex, d)),
        ...decisionEdits(lex, d).map((op) =>
          op.op === 'add_function_word' ? { ...op, entry: antizi[0]?.id ?? '' } : op,
        ),
      ]),
      ...extra,
    ];
    const cs: LexiconChangeset = {
      id,
      edition: EDITION,
      created: AT,
      author: AUTHOR,
      summary,
      ops,
      ...(rulings.length > 0 ? { rulings } : {}),
      ...(antizi.length > 0 ? { function_words: antizi } : {}),
    };
    return cs;
  };
  return [
    build(
      STEPS[0].id,
      "Liraasa 2.5, step 1 (D-00): 2.5:G87 retires the album as grammar canon, superseding 2.2:G68. The album stays as text, marked non-normative; its readings grant no exceptions. From the author's 2.5 patch (data/proposals/liraasa_2_5_patch.json).",
      [album],
      [],
    ),
    build(
      STEPS[1].id,
      "Liraasa 2.5, step 2: the author's decisions on the 2.3 grammar audit (review/grammar_spec_2_3.md), rulings 2.5:G88-G128 in the patch's order. Amended rulings are marked amended_by, superseded ones superseded_by; a ruling example that no longer holds is archived. Function-word rows, slot notes, the clause and noun-phrase templates, the valency pattern and the motion-prefix rule follow; antizi is added; the -ti items leave the derivations; examples fixed by the patch's audits (commands, po viki, tonsi, ka for present location).",
      rest,
      [],
    ),
    build(
      STEPS[2].id,
      "Liraasa 2.5, step 3: the housekeeping the author approved: I-26 (2.3:G73's album example archived), I-27 (time words classed, duplicates marked), I-33 (one wording for ne's scope), I-40 (examples classed as canonical, illustration or contrast), I-41 (ATTITUDE words), I-44 (historical and formulae rows; obsolete digit comments archived). I-02 and I-52 are summaries, changed in the build scripts.",
      [],
      housekeepingOps(lex),
    ),
  ];
}

function main(): void {
  const { flags, booleans } = parseArgs(process.argv.slice(2), ['through']);
  const through = Number(flags.through ?? STEPS.length);
  const all = makeChangesets2_5();
  const lex = JSON.parse(readFileSync(resolve(BASELINE), 'utf8')) as RawLexicon;
  const ids = idsAfter(
    lex,
    JSON.parse(readFileSync(resolve('data/lexicon/ids.json'), 'utf8')) as IdMapFile,
  );
  // halts on any op that does not land
  const { applied } = applyChangesets(lex, all.slice(0, through), {
    version: EDITION,
    builtUtc: AT,
    source: 'make_changeset_2_5 dry run',
    ids,
    wordBuilding: WORD_BUILDING_2_0,
  });
  for (const cs of all.slice(0, through)) {
    const n = (op: string) => cs.ops.filter((o) => o.op === op).length;
    console.log(
      `${cs.id}: ${String(cs.ops.length)} ops (${String(n('add_ruling'))} rulings, ${String(n('supersede_ruling'))} superseded, ${String(n('amend_ruling'))} amended)`,
    );
  }
  console.log(`${String(applied.length)} ops applied to frozen 2.3`);
  if (booleans.has('check')) return;
  STEPS.slice(0, through).forEach((s, i) => {
    writeFileSync(resolve(s.file), `${JSON.stringify(all[i], null, 1)}\n`, 'utf8');
    console.log(`wrote ${s.file}`);
  });
}

if (process.argv[1]?.endsWith('make_changeset_2_5.ts')) main();
