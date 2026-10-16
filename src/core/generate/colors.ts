/**
 * Colour generation: 9 base hues × 4 modifiers, plain concatenation.
 *
 * Colour words are **their own closed class**. None of the 45 spellings is a
 * headword — they live only in the `colors` section — so the parser treats
 * them as a separate namespace rather than looking them up as compounds.
 *
 * `shada` carries the `sh` digraph, which phonology permits only in colour and
 * number words.
 */

export const COLOR_MODIFIERS = ['narvo', 'bio', 'juba', 'lumi'] as const;
export type ColorModifier = (typeof COLOR_MODIFIERS)[number];

export const MODIFIER_SENSE: Readonly<Record<ColorModifier, string>> = {
  narvo: 'dark',
  bio: 'life',
  juba: 'gem',
  lumi: 'light',
};

export interface ColorFamily {
  family: string;
  base: string;
}

/** The nine families, in the order the lexicon stores them. */
export const COLOR_FAMILIES: readonly ColorFamily[] = [
  { family: 'Red', base: 'rubi' },
  { family: 'Orange', base: 'ojo' },
  { family: 'Yellow', base: 'aurumi' },
  { family: 'Blue', base: 'azuri' },
  { family: 'Green', base: 'verde' },
  { family: 'Violet', base: 'vio' },
  { family: 'Black', base: 'shada' },
  { family: 'White', base: 'vana' },
  { family: 'Brown', base: 'erta' },
];

export function spellColor(base: string, modifier: ColorModifier): string {
  return base + modifier;
}

export interface ColorCell {
  form: string;
  base: string;
  family: string;
  modifier: ColorModifier | null;
}

/** Every colour word: the 9 bases plus the 36 modified forms. */
export function colorGrid(): ColorCell[] {
  return COLOR_FAMILIES.flatMap(({ family, base }) => [
    { form: base, base, family, modifier: null },
    ...COLOR_MODIFIERS.map((modifier) => ({
      form: spellColor(base, modifier),
      base,
      family,
      modifier,
    })),
  ]);
}

/** Split a colour word into base and modifier, or `null` if it is not one. */
export function parseColor(form: string): ColorCell | null {
  for (const { family, base } of COLOR_FAMILIES) {
    if (form === base) return { form, base, family, modifier: null };
    for (const modifier of COLOR_MODIFIERS) {
      if (form === base + modifier) return { form, base, family, modifier };
    }
  }
  return null;
}
