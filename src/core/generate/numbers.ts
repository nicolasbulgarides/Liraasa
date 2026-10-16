/**
 * Number generation, 0 to 999,999,999.
 *
 * Verified against `numbers.lookup_0_999` — all 1000 stored values match.
 *
 * Rules, from `numbers.rules`:
 *  - 0-9 are fixed forms.
 *  - 10, 20, 30, 40, 50 are memorised contractions (`unzira`, `dozira`,
 *    `trezira`, `cuazira`, `penzira`); 60-90 are digit + `zira`.
 *  - 11-19 are `unzira-[digit]`; 21-99 are `[decade]-[digit]` unless the unit
 *    is 0.
 *  - 100 is `centa`, not `unacenta`; 200-900 are digit + `centa`.
 *  - 101-999 are `[hundred]-[remainder]`.
 *  - Groups are read descending 10^6, 10^3, 10^0, hyphen-joined, and an absent
 *    000 group is not pronounced. Exactly 1000 is `mililumi` and exactly
 *    1,000,000 is `megalumi`, with no `una-` prefix.
 */

export const DIGITS = [
  'zira',
  'una',
  'dossa',
  'tressa',
  'cuara',
  'penta',
  'sesa',
  'seta',
  'ocha',
  'niva',
] as const;

/** 10-50 are contractions; 60-90 follow digit + `zira`. */
export const DECADES: Readonly<Record<number, string>> = {
  10: 'unzira',
  20: 'dozira',
  30: 'trezira',
  40: 'cuazira',
  50: 'penzira',
  60: 'sesazira',
  70: 'setazira',
  80: 'ochazira',
  90: 'nivazira',
};

export const HUNDRED = 'centa';
export const THOUSAND = 'mililumi';
export const MILLION = 'megalumi';

export const MAX_NUMBER = 999_999_999;

export class NumberRangeError extends Error {}

function digit(n: number): string {
  const d = DIGITS[n];
  if (d === undefined) throw new NumberRangeError(`not a digit: ${String(n)}`);
  return d;
}

function decade(tens: number): string {
  const d = DECADES[tens * 10];
  if (d === undefined) throw new NumberRangeError(`not a decade: ${String(tens * 10)}`);
  return d;
}

/** 0-99. */
function under100(n: number): string {
  if (n < 10) return digit(n);
  const tens = Math.floor(n / 10);
  const unit = n % 10;
  return unit === 0 ? decade(tens) : `${decade(tens)}-${digit(unit)}`;
}

/** 0-999. */
export function under1000(n: number): string {
  if (n < 100) return under100(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const head = hundreds === 1 ? HUNDRED : digit(hundreds) + HUNDRED;
  return rest === 0 ? head : `${head}-${under100(rest)}`;
}

/**
 * Spell a non-negative integer up to 999,999,999.
 *
 * @throws NumberRangeError outside the range, or on a non-integer.
 */
export function spellNumber(n: number): string {
  if (!Number.isInteger(n)) throw new NumberRangeError(`not an integer: ${String(n)}`);
  if (n < 0) throw new NumberRangeError('negative numbers are not defined');
  if (n > MAX_NUMBER) throw new NumberRangeError(`above ${String(MAX_NUMBER)}: ${String(n)}`);

  if (n < 1000) return under1000(n);

  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;

  const groups: string[] = [];
  // Exactly one million or one thousand takes the bare scale word.
  if (millions === 1) groups.push(MILLION);
  else if (millions > 1) groups.push(`${under1000(millions)}-${MILLION}`);

  if (thousands === 1) groups.push(THOUSAND);
  else if (thousands > 1) groups.push(`${under1000(thousands)}-${THOUSAND}`);

  if (rest > 0) groups.push(under1000(rest));

  return groups.join('-');
}

/** An ordinal: `NUMBER-ne`. The `ne` after a number is never negation. */
export function spellOrdinal(n: number): string {
  return `${spellNumber(n)}-ne`;
}

/** A fraction: `NUMERATOR de DENOMINATOR`. */
export function spellFraction(numerator: number, denominator: number): string {
  return `${spellNumber(numerator)} de ${spellNumber(denominator)}`;
}
