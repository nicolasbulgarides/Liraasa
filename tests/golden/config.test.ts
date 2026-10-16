/**
 * SPEC §3: the typed config in `src/core/config/` and the rules block in the
 * JSON must agree. A future edition that changes a rule in the data fails here
 * rather than drifting silently.
 */
import {
  CLAUSE_TEMPLATE,
  CLAUSE_SLOT_NAMES,
  MAX_PREVERBAL_OPERATORS_RECOMMENDED,
  NOUN_PHRASE_TEMPLATE,
  SCOPE_OPERATORS,
  SLOT_WORDS,
  STACKING_EXCLUSIONS,
  VALENCY_OPERATORS,
} from '@core/config/grammar';
import { DERIVATIONS, LEXICALISED_DERIVATIONS, SUFFIXES, VERB_RULE } from '@core/config/morphology';
import {
  AMOR_COMPOUNDS_PREFIX,
  AMOR_COMPOUNDS_SUFFIX,
  CONSONANTS_CORE,
  CONSONANTS_OTHER,
  DECLARED_DISTANCE_1_PAIRS,
  RESTRICTED_DIGRAPHS,
  RESTRICTED_DIGRAPH_NOTE,
  VOWEL_SET,
  editDistance,
  syllableCount,
} from '@core/config/phonology';
import { ENTRY_REGISTERS } from '@core/config/registers';
import { FORM_SLOTS, SLOT_BUILD, SLOT_RAW_KEY } from '@core/config/slots';
import { AMBIGUOUS_RULING_IDS, PENDING_1_1_DECISIONS } from '@core/config/editions';
import { describe, expect, it } from 'vitest';
import { rawLexicon } from './lexicon';

const raw = rawLexicon();

describe('morphology config agrees with morphology in the JSON', () => {
  it('lists the seven forms in the same order', () => {
    expect(FORM_SLOTS.map((s) => SLOT_BUILD[s])).toEqual(raw.morphology.seven_forms);
  });

  it('states the same verb rule', () => {
    expect(raw.morphology.verb_rule).toEqual({
      opi: VERB_RULE.irregular.opi,
      'n-initial': `R+${VERB_RULE.nInitial}`,
      's-initial': `R+${VERB_RULE.sInitial}`,
      'vowel-initial': `R+${VERB_RULE.vowelInitial}`,
      otherwise: 'R + first consonant + a',
    });
  });

  it('declares the same suffixes and derivations', () => {
    const stored = Object.keys(raw.morphology.suffixes).sort();
    const ours = [
      ...Object.values(SUFFIXES).map((s) => `-${s.spelling}`),
      ...Object.values(DERIVATIONS).map((d) => `-${d.spelling}`),
    ].sort();
    expect(stored).toEqual(ours);
  });

  it('lists the same lexicalised derivations', () => {
    expect(Object.keys(LEXICALISED_DERIVATIONS).sort()).toEqual(
      Object.keys(raw.morphology.lexicalised_derivations).sort(),
    );
  });

  it('records that mavo + -pago is blocked', () => {
    expect(raw.morphology.suffixes['-pago']).toMatch(/mavo\+pago blocked/);
  });

  it('agrees on the suffix order: one form or one derivation, then -ti, then -ri', () => {
    expect(raw.morphology.suffix_order).toBe('ROOT + (one form OR one derivation) + -ti + -ri');
  });
});

describe('slot keys match the JSON', () => {
  it('maps each internal slot to the raw key used by forms and glosses', () => {
    const first = raw.headwords[0];
    expect(first).toBeDefined();
    for (const slot of FORM_SLOTS) {
      expect(Object.keys(first!.forms)).toContain(SLOT_RAW_KEY[slot]);
      expect(Object.keys(first!.glosses)).toContain(SLOT_RAW_KEY[slot]);
    }
  });
});

describe('phonology config agrees with phonology in the JSON', () => {
  it('has the same vowel inventory', () => {
    expect(raw.phonology.vowels.startsWith(VOWEL_SET.join(' '))).toBe(true);
  });

  it('has the same consonant inventories', () => {
    expect(raw.phonology.consonants_core).toBe(CONSONANTS_CORE.join(' '));
    // `consonants_other` appends a parenthetical about the restricted digraphs.
    expect(raw.phonology.consonants_other).toBe(
      `${CONSONANTS_OTHER.join(' ')} (${RESTRICTED_DIGRAPH_NOTE})`,
    );
  });

  it('restricts sh and ch to colour and number words', () => {
    const roots = raw.headwords.map((h) => h.root);
    for (const digraph of RESTRICTED_DIGRAPHS) {
      expect(
        roots.filter((r) => r.includes(digraph)),
        digraph,
      ).toEqual([]);
    }
    // They appear only where the note allows: `shada` (black), `ocha` (eight).
    expect(raw.colors.some((c) => c['Base color'] === 'shada')).toBe(true);
    expect(raw.numbers.rules.some((r) => r.Liraasa === 'ocha')).toBe(true);
  });

  it('has the same declared distance-1 pairs', () => {
    const stored = raw.phonology.declared_distance_1_pairs
      .map((p) => [...p].sort().join('~'))
      .sort();
    const ours = DECLARED_DISTANCE_1_PAIRS.map((p) => [...p].sort().join('~')).sort();
    expect(ours).toEqual(stored);
  });

  it('confirms every declared pair really is one edit apart', () => {
    for (const [a, b] of DECLARED_DISTANCE_1_PAIRS) {
      expect(editDistance(a, b), `${a}~${b}`).toBeLessThanOrEqual(1);
    }
  });

  it('counts hiatus as separate syllables', () => {
    expect(syllableCount('dorvaasa')).toBe(4);
    expect(syllableCount('amor')).toBe(2);
    expect(syllableCount('mudusomubiti')).toBe(6);
  });
});

describe('the amor exemption list (Q7)', () => {
  it('holds the 39 amor compounds the 1.0 data actually contains', () => {
    const roots = raw.headwords.map((h) => h.root);
    const endAmor = roots.filter((r) => r.endsWith('amor') && r !== 'amor');
    const begAmor = roots.filter((r) => r.startsWith('amor') && r !== 'amor');

    expect([...AMOR_COMPOUNDS_SUFFIX].sort()).toEqual([...endAmor].sort());
    expect([...AMOR_COMPOUNDS_PREFIX].sort()).toEqual([...begAmor].sort());
    expect(AMOR_COMPOUNDS_SUFFIX).toHaveLength(20);
    expect(AMOR_COMPOUNDS_PREFIX).toHaveLength(19);
  });

  it('shows all 39 are compounds, not roots, as the JSON label wrongly says', () => {
    const byRoot = new Map(raw.headwords.map((h) => [h.root, h]));
    for (const w of [...AMOR_COMPOUNDS_SUFFIX, ...AMOR_COMPOUNDS_PREFIX]) {
      expect(byRoot.get(w)?.type, w).toBe('Compound');
    }
  });

  it('explains the 36 in the JSON label: three amor-X compounds are new in 1.0', () => {
    const byRoot = new Map(raw.headwords.map((h) => [h.root, h]));
    const newIn10 = AMOR_COMPOUNDS_PREFIX.filter((w) => byRoot.get(w)?.since === '1.0');
    expect(newIn10).toEqual(['amorpeli', 'amorserbu', 'amorvorba']);
    // 20 + (19 - 3) = 36, the 0.8-rc2 count the label still carries.
    expect(AMOR_COMPOUNDS_SUFFIX.length + AMOR_COMPOUNDS_PREFIX.length - newIn10.length).toBe(36);
  });

  it('still carries the stale label, pending the 1.1 repair', () => {
    expect(raw.phonology.protected_exceptions).toContain('36 amor- double-a roots (legacy canon)');
  });
});

describe('grammar config agrees with grammar in the JSON', () => {
  it('states the same clause template', () => {
    expect(CLAUSE_TEMPLATE).toBe(raw.grammar.clause_template);
  });

  it('lists the same 20 slots in the same order', () => {
    expect(raw.grammar.slots.map((s) => s.slot)).toEqual([...CLAUSE_SLOT_NAMES]);
    expect(raw.grammar.slots.map((s) => s.n)).toEqual(CLAUSE_SLOT_NAMES.map((_, i) => i + 1));
  });

  it('lists the same closed words for every slot that has them', () => {
    for (const stored of raw.grammar.slots) {
      const ours = SLOT_WORDS[stored.slot as (typeof CLAUSE_SLOT_NAMES)[number]];
      if (ours === undefined) continue;
      expect([...ours], stored.slot).toEqual(stored.words);
    }
  });

  it('states the same scope operators', () => {
    expect([...SCOPE_OPERATORS]).toEqual(raw.grammar.scope_operators.words);
  });

  it('states the same 13 stacking exclusions', () => {
    const stored = raw.grammar.stacking.exclusions.map((p) => [...p].sort().join('+')).sort();
    const ours = STACKING_EXCLUSIONS.map((p) => [...p].sort().join('+')).sort();
    expect(ours).toEqual(stored);
    expect(STACKING_EXCLUSIONS).toHaveLength(13);
  });

  it('agrees on the recommended operator ceiling', () => {
    expect(MAX_PREVERBAL_OPERATORS_RECOMMENDED).toBe(
      raw.grammar.stacking.max_preverbal_operators_recommended,
    );
  });

  it('lists the same valency operators and noun-phrase template', () => {
    for (const op of VALENCY_OPERATORS) expect(raw.grammar.valency[op]).toBeDefined();
    expect(NOUN_PHRASE_TEMPLATE).toBe(raw.grammar.noun_phrase);
  });
});

describe('registers (Q6)', () => {
  it('uses only everyday and poetic at entry level, as check 11 requires', () => {
    expect(new Set(raw.headwords.map((h) => h.register))).toEqual(new Set(ENTRY_REGISTERS));
  });

  it('finds no sacred word list, per ruling 0.8:R10', () => {
    expect(raw.headwords.filter((h) => h.register === 'sacred')).toEqual([]);
  });
});

describe('ruling identity (ADR-0004)', () => {
  it('confirms G1-G8 collide between the two ruling sets', () => {
    const ids10 = new Set(raw.rulings_1_0.map((r) => r.id));
    const colliding = raw.rulings_0_8_carried.map((r) => r.id).filter((id) => ids10.has(id));
    expect(colliding).toEqual([...AMBIGUOUS_RULING_IDS]);
  });

  it('confirms the colliding ids mean different things', () => {
    const a = new Map(raw.rulings_1_0.map((r) => [r.id, r.topic]));
    const b = new Map(raw.rulings_0_8_carried.map((r) => [r.id, r.topic]));
    for (const id of AMBIGUOUS_RULING_IDS) {
      expect(a.get(id), id).not.toBe(b.get(id));
    }
  });
});

describe('settled questions the tool must not re-ask (SPEC §14)', () => {
  it('records all eight as closed', () => {
    expect(raw.settled_open_questions_0_8).toHaveLength(8);
    for (const q of raw.settled_open_questions_0_8) {
      expect(q.answer.length).toBeGreaterThan(0);
    }
  });

  it('settles transitivity as usage-based, so no transitive field is added', () => {
    const q = raw.settled_open_questions_0_8.find((x) => x.q.includes('transitive'));
    expect(q?.answer).toMatch(/[Uu]sage-based/);
    expect(q?.answer).toMatch(/No lexical flag/);
    expect(raw.headwords.filter((h) => 'transitive' in h)).toEqual([]);
  });

  it('settles that derivations never combine with forms', () => {
    const q = raw.settled_open_questions_0_8.find((x) => x.q.includes('-yo/-vu/-pago'));
    expect(q?.answer).toMatch(/^No\./);
  });
});

describe('the two decisions deferred to 1.1 (ADR-0008)', () => {
  it('names roots that really are retired and reserved', () => {
    const retired = new Map(raw.legacy.retired_roots.map((r) => [r.old, r]));
    const ledger = new Map(raw.sound_ledger.map((x) => [x.spelling, x]));
    const heads = new Set(raw.headwords.map((h) => h.root));

    for (const decision of PENDING_1_1_DECISIONS) {
      for (const root of decision.roots) {
        expect(heads.has(root), `${root} should not be active`).toBe(false);
        expect(retired.has(root), `${root} should be a retired root`).toBe(true);
        expect(ledger.get(root)?.state, root).toBe('RECLAIMED-RESERVED');
        expect(ledger.get(root)?.reusable_from, root).toBe('2.0');
      }
    }
  });

  it('shows what each restoration would displace', () => {
    const retired = new Map(raw.legacy.retired_roots.map((r) => [r.old, r.replacement]));
    expect(retired.get('lalma')).toBe('lumibiti');
    expect(retired.get('sanlu')).toBe('loteronela');
    expect(retired.get('rohu')).toBe('folnipatu');
    expect(retired.get('sabire')).toBe('sasvapago');
    expect(retired.get('sonsa')).toBe('farufasbi');
  });
});
