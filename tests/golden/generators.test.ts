/**
 * SPEC §5.5: every generator is tested against the values stored in the JSON.
 */
import { colorGrid, parseColor } from '@core/generate/colors';
import { correlativeGrid, parseCorrelative } from '@core/generate/correlatives';
import { spellNumber, under1000 } from '@core/generate/numbers';
import { timeWordGrid } from '@core/generate/timeWords';
import { describe, expect, it } from 'vitest';
import { rawLexicon } from './lexicon';

const raw = rawLexicon();

describe('numbers', () => {
  it('matches all 1000 stored values in lookup_0_999', () => {
    const mismatches: string[] = [];
    for (const [key, want] of Object.entries(raw.numbers.lookup_0_999)) {
      const got = under1000(Number(key));
      if (got !== want) mismatches.push(`${key}: ${got} != ${want}`);
    }
    expect(mismatches).toEqual([]);
  });

  it('covers the whole table', () => {
    expect(Object.keys(raw.numbers.lookup_0_999)).toHaveLength(1000);
  });

  it('matches every single-value row of numbers.rules', () => {
    const mismatches: string[] = [];
    for (const rule of raw.numbers.rules) {
      const value = typeof rule.Value === 'number' ? rule.Value : Number(rule.Value);
      if (!Number.isInteger(value)) continue; // Order, Hyphen, Teen forms … are prose rows
      const got = spellNumber(value);
      if (got !== rule.Liraasa) mismatches.push(`${String(value)}: ${got} != ${rule.Liraasa}`);
    }
    expect(mismatches).toEqual([]);
  });
});

describe('correlatives', () => {
  it('generates exactly the 36 stored forms', () => {
    const generated = correlativeGrid().map((c) => c.form);
    const stored = raw.correlatives.map((c) => c.form);
    expect(new Set(generated)).toEqual(new Set(stored));
    expect(generated).toHaveLength(36);
  });

  it('generates them in the order the lexicon stores them', () => {
    expect(correlativeGrid().map((c) => c.form)).toEqual(raw.correlatives.map((c) => c.form));
  });

  it('agrees with the stored determiner and concept of every form', () => {
    for (const stored of raw.correlatives) {
      const parsed = parseCorrelative(stored.form);
      expect(parsed).not.toBeNull();
      expect(parsed?.determiner).toBe(stored.determiner);
      expect(parsed?.concept).toBe(stored.concept);
    }
  });
});

describe('colours', () => {
  it('generates the 9 bases and 36 modified forms the workbook lists', () => {
    const grid = colorGrid();
    expect(grid).toHaveLength(45);

    const mismatches: string[] = [];
    for (const stored of raw.colors) {
      const base = stored['Base color'];
      const expected: Record<string, string> = {
        'Dark + narvo': `${base}narvo`,
        'Life + bio': `${base}bio`,
        'Gem + juba': `${base}juba`,
        'Light + lumi': `${base}lumi`,
      };
      for (const [key, want] of Object.entries(expected)) {
        const got = stored[key];
        if (got !== want) mismatches.push(`${base} ${key}: ${String(got)} != ${want}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('lists the nine families in the stored order', () => {
    const families = [...new Set(colorGrid().map((c) => c.base))];
    expect(families).toEqual(raw.colors.map((c) => c['Base color']));
  });

  it('round-trips every generated colour word', () => {
    for (const cell of colorGrid()) {
      expect(parseColor(cell.form)).toEqual(cell);
    }
  });

  it('confirms no colour word is a headword, so colours are their own class', () => {
    const roots = new Set(raw.headwords.map((h) => h.root));
    expect(colorGrid().filter((c) => roots.has(c.form))).toEqual([]);
  });
});

describe('time words', () => {
  it('generates the six time-of-day words that the stored table lists', () => {
    const stored = new Set(raw.time_and_dates.map((t) => t.form));
    for (const cell of timeWordGrid()) {
      expect(stored.has(cell.form), `${cell.form} should be stored`).toBe(true);
    }
    expect(timeWordGrid()).toHaveLength(6);
  });

  it('offers no po series, because the lexicon has none', () => {
    const generated = new Set(timeWordGrid().map((c) => c.form));
    for (const w of ['mernopo', 'vesnopo', 'nullopo']) {
      expect(generated.has(w)).toBe(false);
      expect(raw.time_and_dates.some((t) => t.form === w)).toBe(false);
    }
  });
});
