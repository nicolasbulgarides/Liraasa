/**
 * Time-of-day words: `merno` / `vesno` / `nullo` + `pressa` / `futu`.
 *
 * Six generated forms. Note there is no `po` series — the lexicon has no
 * "yesterday morning" compound, so the generator must not offer one.
 *
 * The rest of `time_and_dates` is a stored list, not a paradigm. It has 43
 * rows but only 40 distinct forms: `eli-krono`, `toda-krono` and `nuna-krono`
 * each appear twice, once capitalised and once not. They are correlatives
 * cross-listed into the time table, which is why a form index maps a spelling
 * to a list rather than one entry.
 */

export const TIMES_OF_DAY = ['merno', 'vesno', 'nullo'] as const;
export type TimeOfDay = (typeof TIMES_OF_DAY)[number];

export const TIME_DEICTICS = ['pressa', 'futu'] as const;
export type TimeDeictic = (typeof TIME_DEICTICS)[number];

export const TIME_OF_DAY_SENSE: Readonly<Record<TimeOfDay, string>> = {
  merno: 'morning',
  vesno: 'evening',
  nullo: 'night',
};

export const DEICTIC_SENSE: Readonly<Record<TimeDeictic, string>> = {
  pressa: 'this',
  futu: 'tomorrow',
};

export function spellTimeWord(time: TimeOfDay, deictic: TimeDeictic): string {
  return time + deictic;
}

export interface TimeWordCell {
  form: string;
  time: TimeOfDay;
  deictic: TimeDeictic;
  gloss: string;
}

/** The six generated time-of-day words. */
export function timeWordGrid(): TimeWordCell[] {
  return TIMES_OF_DAY.flatMap((time) =>
    TIME_DEICTICS.map((deictic) => ({
      form: spellTimeWord(time, deictic),
      time,
      deictic,
      gloss:
        deictic === 'pressa'
          ? `this ${TIME_OF_DAY_SENSE[time]}`
          : `tomorrow ${TIME_OF_DAY_SENSE[time]}`,
    })),
  );
}

export function parseTimeWord(form: string): TimeWordCell | null {
  return timeWordGrid().find((cell) => cell.form === form) ?? null;
}
