/**
 * Registers. Two different vocabularies, which SPEC originally conflated (Q6).
 *
 * **Entry level** is `everyday` or `poetic` only. By ruling 0.8:R10 there is no
 * sacred word list, so no headword is ever labelled sacred. Check 11 enforces
 * exactly these two values.
 *
 * **Text level** is `everyday`, `poetic` or `sacred`. A *token* counts as
 * sacred because of its form — an ascended slot (`-asa`, `-asasan`) or a
 * divine title (`li X-asasan`) — not because of its entry.
 *
 * `irreverent` is neither: it is an optional text-level tone flag for ascended
 * forms used ironically (`bumreasasan`, `Narvoasa!`). It is not in the lexicon
 * and must never be written there.
 */

export const ENTRY_REGISTERS = ['everyday', 'poetic'] as const;
export type EntryRegister = (typeof ENTRY_REGISTERS)[number];

export const TEXT_REGISTERS = ['everyday', 'poetic', 'sacred'] as const;
export type TextRegister = (typeof TEXT_REGISTERS)[number];

/** Optional tone flag on a text. Orthogonal to its register. */
export const TEXT_TONES = ['plain', 'irreverent'] as const;
export type TextTone = (typeof TEXT_TONES)[number];

export function isEntryRegister(value: string): value is EntryRegister {
  return (ENTRY_REGISTERS as readonly string[]).includes(value);
}

export function isTextRegister(value: string): value is TextRegister {
  return (TEXT_REGISTERS as readonly string[]).includes(value);
}
