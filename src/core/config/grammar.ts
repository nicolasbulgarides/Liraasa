/**
 * Grammar config: the 20-slot clause template and the stacking rules.
 *
 * Mirrors `grammar` in the lexicon JSON. Phase 1 loads and checks it; the
 * sentence checker that uses it arrives in Phase 6.
 */

export const CLAUSE_TEMPLATE =
  '[FRAME] [TOPIC hozi] SUBJECT [TENSE] [noma] [ne] [MODAL] [APPROACH] [PHASE] ' +
  '[EFFORT] [ASPECT] [ITERATION] [EVIDENTIAL] VERB [OBJECT] [ADJUNCTS] [fuyi] ' +
  '[hoyo|yasmo] [ATTITUDE] [ki]';

export const CLAUSE_SLOT_NAMES = [
  'FRAME',
  'TOPIC',
  'SUBJECT',
  'TENSE',
  'REALITY',
  'NEGATION',
  'MODAL',
  'APPROACH',
  'PHASE',
  'EFFORT',
  'ASPECT',
  'ITERATION',
  'EVIDENTIAL',
  'VERB',
  'OBJECT',
  'ADJUNCTS',
  'RECIPROCAL',
  'STATUS',
  'ATTITUDE',
  'QUESTION',
] as const;

export type ClauseSlotName = (typeof CLAUSE_SLOT_NAMES)[number];

/**
 * The closed word lists, by slot. Only slots with a fixed membership appear;
 * FRAME, SUBJECT, OBJECT and ADJUNCTS take open phrases.
 */
export const SLOT_WORDS: Readonly<Partial<Record<ClauseSlotName, readonly string[]>>> = {
  TENSE: ['po', 'futu', 'pressa'],
  REALITY: ['noma'],
  NEGATION: ['ne'],
  MODAL: ['povi', 'nosi', 'dagi', 'musi', 'suvi', 'viki', 'kopi'],
  APPROACH: ['tavki', 'fututi'],
  PHASE: ['hiro', 'teki'],
  EFFORT: ['telvo', 'vazdi', 'fesmo'],
  ASPECT: ['roni', 'tefa', 'sahi'],
  ITERATION: ['bodu', 'reve', 'loki'],
  EVIDENTIAL: ['yehu', 'gesu', 'bisu', 'vuda', 'buyu', 'tosu'],
  RECIPROCAL: ['fuyi'],
  STATUS: ['hoyo', 'yasmo'],
  ATTITUDE: ['seye', 'mufe', 'poye', 'pifu', 'zoke'],
  QUESTION: ['ki'],
};

/** Preverbal slot ranks, for the order check. Left scopes over right (1.0:G1). */
export const PREVERBAL_RANK: Readonly<Record<string, number>> = Object.freeze(
  Object.fromEntries(
    (
      [
        ['TENSE', 4],
        ['REALITY', 5],
        ['MODAL', 7],
        ['APPROACH', 8],
        ['PHASE', 9],
        ['EFFORT', 10],
        ['ASPECT', 11],
        ['ITERATION', 12],
        ['EVIDENTIAL', 13],
      ] as const
    ).flatMap(([slot, rank]) => (SLOT_WORDS[slot] ?? []).map((w) => [w, rank] as const)),
  ),
);

export const COPULAS = ['ke', 'ka', 'kapoki', 'loya', 'miyo'] as const;

/** `vaku` make, `lesvu` let, `tekvu` prevent. They fill the verb slot (1.0:G14). */
export const VALENCY_OPERATORS = ['vaku', 'lesvu', 'tekvu'] as const;

export const VALENCY_PATTERN =
  'CAUSER [TENSE…] OP ACTOR [ne] [APPROACH] [PHASE] [EFFORT] VERB [OBJECT]';

/** Scope words sit immediately before the single constituent they scope over. */
export const SCOPE_OPERATORS = ['ne', 'doli', 'tu', 'yesta', 'pendi', 'vinto'] as const;

/** Pairs that never co-occur in one clause (1.0:G16). */
export const STACKING_EXCLUSIONS: readonly (readonly [string, string])[] = [
  ['hiro', 'roni'],
  ['hiro', 'tefa'],
  ['teki', 'roni'],
  ['teki', 'tefa'],
  ['telvo', 'tefa'],
  ['vazdi', 'tefa'],
  ['fesmo', 'tefa'],
  ['zoke', 'seye'],
  ['zoke', 'mufe'],
  ['zoke', 'poye'],
  ['zoke', 'pifu'],
  ['tavki', 'fututi'],
  ['hoyo', 'yasmo'],
];

export const MAX_PREVERBAL_OPERATORS_RECOMMENDED = 4;

export const NOUN_PHRASE_TEMPLATE =
  '[QUANTIFIER] [li|eli|ola|OWNER de] [NUMBER] [ADJECTIVES] NOUN[-ti][-ri] [de …] [raho CLAUSE]';

/**
 * Transitivity is usage-based (settled question 5): `gome` may passivise any
 * verb used with an object in its clause, and a verb used without one cannot
 * take it. **No `transitive` field exists or should be added.**
 */
export const TRANSITIVITY_IS_USAGE_BASED = true;

/** Ordinals are `NUMBER-ne`; the `ne` after a number is never negation. */
export const ORDINAL_SUFFIX = 'ne';

/** Fractions are `NUMBER de NUMBER`. */
export const FRACTION_JOINER = 'de';
