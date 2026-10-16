/**
 * Morphology config: the verb rule, the suffix stack, the derivations.
 *
 * Mirrors `morphology` in the lexicon JSON. `config.test.ts` asserts the two
 * agree, so an edition that changes a rule in the data fails loudly rather
 * than drifting (SPEC §3).
 */

export const VOWELS = 'aeiou';

export function isVowel(ch: string): boolean {
  return VOWELS.includes(ch);
}

/**
 * The verb rule, in the order it must be checked. `opi` is the single
 * irregular; only the first letter of the **whole word** decides the rest, so
 * a compound takes the class of its modifier.
 */
export const VERB_RULE = {
  irregular: { opi: 'opioa' } as Readonly<Record<string, string>>,
  nInitial: 'nia',
  sInitial: 'sia',
  vowelInitial: 'a',
  /** otherwise: first consonant + 'a' */
} as const;

/** `-ti` and `-ri` attach after a form or a derivation; `-ri` is always last. */
export const SUFFIX_ORDER = ['form-or-derivation', 'ti', 'ri'] as const;

export const SUFFIXES = {
  ti: { spelling: 'ti', meaning: 'diminutive' },
  ri: { spelling: 'ri', meaning: 'plural (always last)' },
} as const;

export type SuffixKey = keyof typeof SUFFIXES;

/**
 * Derivations attach to the **root**, never to a form, and never combine with
 * one (settled question 4). A word takes one form OR one derivation.
 */
export const DERIVATIONS = {
  yo: { spelling: 'yo', meaning: 'agent' },
  vu: { spelling: 'vu', meaning: 'augmentative' },
  pago: { spelling: 'pago', meaning: 'place' },
} as const;

export type DerivationKey = keyof typeof DERIVATIONS;

export const DERIVATION_KEYS = ['yo', 'vu', 'pago'] as const;

/**
 * `mavo + -pago` is blocked. `mavopago` is the fixed word "society" and is a
 * headword with recorded components; it is not this derivation (Q5).
 */
export const BLOCKED_DERIVATIONS: readonly { root: string; derivation: DerivationKey }[] = [
  { root: 'mavo', derivation: 'pago' },
];

export function isBlockedDerivation(root: string, derivation: DerivationKey): boolean {
  return BLOCKED_DERIVATIONS.some((b) => b.root === root && b.derivation === derivation);
}

/**
 * Regular derivations with fixed, lexicalised meanings. The generator may
 * propose these spellings but must use the stored gloss, never a compositional
 * guess (ruling 1.0:G20).
 */
export const LEXICALISED_DERIVATIONS: Readonly<Record<string, string>> = {
  tisebitivu: 'sword (big knife): tisebiti + -vu',
  tibivu: 'rope (big thread): tibi + -vu',
  kaldopago: 'prison (place of confinement): kaldo + -pago',
  zeldoyo: 'rebel; resister: zeldo + -yo',
  kronopago: 'anniversary (0.8 canon time word): krono + -pago',
};

/** Compounds are MODIFIER+HEAD, written together, head rightmost. */
export const COMPOUND_ARITY = 2;

/**
 * Four compounds had no recorded split in 0.8; the 1.0 build inferred one from
 * the spelling and logged it in `changelog_1_0`. The UI shows these as
 * inferred (Q5).
 */
export const INFERRED_COMPONENTS: readonly string[] = [
  'kronobio',
  'lumivera',
  'mavopago',
  'mavolumi',
];

/** Fixed words whose components are etymological, not a productive derivation. */
export const FIXED_WORDS: Readonly<Record<string, string>> = {
  mavopago: 'Fixed word "society". mavo + -pago is blocked as a productive derivation.',
};
