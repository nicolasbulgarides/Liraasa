/**
 * The seven forms, as a typed config.
 *
 * `FORM_SLOTS` is the canonical order. 80 of 1099 headwords store `forms` with
 * `verb` second (ADR-0002); that is a storage detail the exporter preserves and
 * nothing else should care about.
 */

export const FORM_SLOTS = [
  'root',
  'ascended',
  'negative',
  'verb',
  'negativeAdjective',
  'adjective',
  'ascendedAdjective',
] as const;

export type FormSlot = (typeof FORM_SLOTS)[number];

/** The raw JSON key for each slot. */
export const SLOT_RAW_KEY: Readonly<Record<FormSlot, string>> = {
  root: 'root',
  ascended: 'ascended',
  negative: 'negative',
  verb: 'verb',
  negativeAdjective: 'negative_adjective',
  adjective: 'adjective',
  ascendedAdjective: 'ascended_adjective',
};

/** The build rule for each slot, as `morphology.seven_forms` states it. */
export const SLOT_BUILD: Readonly<Record<FormSlot, string>> = {
  root: 'R',
  ascended: 'R+asa',
  negative: 'R+na',
  verb: 'VERB',
  negativeAdjective: 'R+nasan',
  adjective: 'R+san',
  ascendedAdjective: 'R+asasan',
};

/**
 * The suffix appended to the root for each slot. `verb` is `null` because it
 * follows the verb rule rather than a fixed suffix.
 */
export const SLOT_SUFFIX: Readonly<Record<FormSlot, string | null>> = {
  root: '',
  ascended: 'asa',
  negative: 'na',
  verb: null,
  negativeAdjective: 'nasan',
  adjective: 'san',
  ascendedAdjective: 'asasan',
};

/** The two slots that make a token sacred at text level (ruling R10, Q6). */
export const ASCENDED_SLOTS: readonly FormSlot[] = ['ascended', 'ascendedAdjective'];

/** The marker for a slot that has no meaning. Em dash, U+2014. */
export const UNUSED_GLOSS = '— (unused)';

export function isUnusedGloss(gloss: string | null | undefined): boolean {
  return gloss === undefined || gloss === null || gloss.trim().startsWith('—');
}
