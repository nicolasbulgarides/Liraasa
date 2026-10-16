/**
 * Phase 0 recon assertions.
 *
 * These are not feature tests: they pin the shape and counts of the real
 * source data, so the corrections recorded in ADR-0001 and docs/SCHEMA.md
 * cannot silently drift, and so Phase 1 starts from a verified baseline.
 * Every number here was read off data/source/liraasa_1_0.json.
 */
import { describe, expect, it } from 'vitest';
import { LEXICON_FILE, QUICKSTART_FILE, VALIDATION_FILE, readSourceJson } from './sourcePaths';

interface Slots {
  root: string;
  ascended: string;
  negative: string;
  verb: string;
  negative_adjective: string;
  adjective: string;
  ascended_adjective: string;
}

interface Headword {
  root: string;
  type: string;
  components: string[] | null;
  forms: Slots;
  glosses: Slots;
  register: string;
  english_synonyms: string[];
  status_1_0: string;
  protected: boolean;
}

interface Lexicon {
  language: string;
  version: string;
  headwords: Headword[];
  function_words: { form: string; status_1_0: string }[];
  pronouns: unknown[];
  correlatives: unknown[];
  time_and_dates: unknown[];
  colors: unknown[];
  discourse_particles: unknown[];
  examples: { status: string }[];
  rhyme_families: unknown[];
  rulings_1_0: { id: string }[];
  rulings_0_8_carried: { id: string }[];
  grammar: { slots: unknown[] };
  legacy: { migration_forms: Record<string, unknown> };
}

interface Validation {
  summary: {
    version: string;
    counts: Record<string, number>;
    status_counts: Record<string, number>;
  };
  checks: { id: number }[];
}

const UNUSED = '— (unused)';
const FORM_KEYS = [
  'root',
  'ascended',
  'negative',
  'verb',
  'negative_adjective',
  'adjective',
  'ascended_adjective',
] as const;

const lex = readSourceJson(LEXICON_FILE) as Lexicon;
const validation = readSourceJson(VALIDATION_FILE) as Validation;

describe('edition identity', () => {
  it('is Liraasa 1.0, not the 0.8-rc2 the spec was written against', () => {
    expect(lex.language).toBe('Liraasa');
    expect(lex.version).toBe('1.0');
    expect(validation.summary.version).toBe('1.0');
  });
});

describe('section counts', () => {
  it('matches the shipped validation summary', () => {
    expect(lex.headwords).toHaveLength(validation.summary.counts.headwords!);
    expect(lex.function_words).toHaveLength(validation.summary.counts.function_words!);
  });

  it('has the counts recorded in docs/SCHEMA.md', () => {
    expect(lex.headwords).toHaveLength(1099);
    expect(lex.function_words).toHaveLength(149);
    expect(lex.pronouns).toHaveLength(8);
    expect(lex.correlatives).toHaveLength(36);
    expect(lex.time_and_dates).toHaveLength(43);
    expect(lex.colors).toHaveLength(9);
    expect(lex.discourse_particles).toHaveLength(4);
    expect(lex.examples).toHaveLength(452);
    expect(lex.rhyme_families).toHaveLength(387);
    expect(lex.grammar.slots).toHaveLength(20);
    expect(Object.keys(lex.legacy.migration_forms)).toHaveLength(509);
  });

  it('counts 447 live examples, the number the validator reports', () => {
    expect(lex.examples.filter((e) => e.status !== 'HISTORICAL')).toHaveLength(447);
  });
});

describe('headwords', () => {
  it('splits into 386 primal roots and 713 compounds, with no "Root" type', () => {
    const byType = new Map<string, number>();
    for (const h of lex.headwords) byType.set(h.type, (byType.get(h.type) ?? 0) + 1);
    expect(Object.fromEntries(byType)).toEqual({ Primal: 386, Compound: 713 });
  });

  it('carries english_synonyms as an array on every entry', () => {
    expect(lex.headwords.every((h) => Array.isArray(h.english_synonyms))).toBe(true);
  });

  it('carries protected: true on every entry', () => {
    expect(lex.headwords.every((h) => h.protected)).toBe(true);
  });

  it('gives every compound exactly two components and every primal none', () => {
    for (const h of lex.headwords) {
      if (h.type === 'Compound') expect(h.components).toHaveLength(2);
      else expect(h.components).toBeNull();
    }
  });

  it('spells every compound as the concatenation of its components', () => {
    const offenders = lex.headwords
      .filter((h) => h.components !== null && h.components.join('') !== h.root)
      .map((h) => h.root);
    expect(offenders).toEqual([]);
  });

  it('resolves every component to an active headword', () => {
    const roots = new Set(lex.headwords.map((h) => h.root));
    const dangling = lex.headwords.flatMap((h) =>
      (h.components ?? []).filter((c) => !roots.has(c)).map((c) => `${h.root}:${c}`),
    );
    expect(dangling).toEqual([]);
  });

  it('contains exactly one nested compound, mudusomubiti', () => {
    const byRoot = new Map(lex.headwords.map((h) => [h.root, h]));
    const nested = lex.headwords
      .filter((h) => (h.components ?? []).some((c) => byRoot.get(c)?.type === 'Compound'))
      .map((h) => h.root);
    expect(nested).toEqual(['mudusomubiti']);
  });

  it('uses only everyday and poetic as entry registers', () => {
    expect(new Set(lex.headwords.map((h) => h.register))).toEqual(new Set(['everyday', 'poetic']));
  });

  it('has 4608 unused gloss slots', () => {
    const unused = lex.headwords.flatMap((h) => FORM_KEYS.filter((k) => h.glosses[k] === UNUSED));
    expect(unused).toHaveLength(4608);
    expect(unused).toHaveLength(validation.summary.counts.unused_forms!);
  });

  it('carries no harshness or authorized_changes field', () => {
    for (const h of lex.headwords) {
      expect(h).not.toHaveProperty('harshness');
      expect(h).not.toHaveProperty('authorized_changes');
    }
  });
});

describe('forms', () => {
  it('holds 7693 form strings, all distinct', () => {
    const all = lex.headwords.flatMap((h) => FORM_KEYS.map((k) => h.forms[k]));
    expect(all).toHaveLength(7693);
    expect(new Set(all).size).toBe(7693);
  });

  it('stores the seven slots in one of two key orders', () => {
    const orders = new Map<string, number>();
    for (const h of lex.headwords) {
      const key = Object.keys(h.forms).join(',');
      orders.set(key, (orders.get(key) ?? 0) + 1);
    }
    expect(Object.fromEntries(orders)).toEqual({
      'root,ascended,negative,verb,negative_adjective,adjective,ascended_adjective': 1019,
      'root,verb,ascended,negative,negative_adjective,adjective,ascended_adjective': 80,
    });
  });

  it('regenerates all 7693 forms from the documented rules with zero mismatches', () => {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const verbOf = (r: string): string => {
      if (r === 'opi') return 'opioa';
      const first = r[0]!;
      if (first === 'n') return `${r}nia`;
      if (first === 's') return `${r}sia`;
      if (vowels.has(first)) return `${r}a`;
      return `${r}${first}a`;
    };
    const mismatches: string[] = [];
    for (const h of lex.headwords) {
      const r = h.root;
      const expected: Slots = {
        root: r,
        ascended: `${r}asa`,
        negative: `${r}na`,
        verb: verbOf(r),
        negative_adjective: `${r}nasan`,
        adjective: `${r}san`,
        ascended_adjective: `${r}asasan`,
      };
      for (const k of FORM_KEYS) {
        if (h.forms[k] !== expected[k]) {
          mismatches.push(`${r}.${k}: ${h.forms[k]} != ${expected[k]}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });
});

describe('rulings', () => {
  it('has 23 1.0 rulings and 20 carried 0.8 rulings', () => {
    expect(lex.rulings_1_0).toHaveLength(23);
    expect(lex.rulings_0_8_carried).toHaveLength(20);
  });

  it('collides on G1-G8, which is why ruling ids must be namespaced by edition', () => {
    const ids = new Set(lex.rulings_1_0.map((r) => r.id));
    const colliding = lex.rulings_0_8_carried.map((r) => r.id).filter((id) => ids.has(id));
    expect(colliding).toEqual(['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8']);
  });
});

describe('validation oracle', () => {
  it('reports 24 checks, all PASS', () => {
    expect(validation.checks).toHaveLength(24);
    expect(validation.summary.status_counts).toEqual({ PASS: 24 });
  });
});

describe('quickstart', () => {
  it('is the machine form of the same edition', () => {
    const q = readSourceJson(QUICKSTART_FILE) as {
      version: string;
      primal_roots: unknown[];
      rulings: unknown[];
    };
    expect(q.version).toBe('1.0');
    expect(q.primal_roots).toHaveLength(386);
    expect(q.rulings).toHaveLength(23);
  });
});
