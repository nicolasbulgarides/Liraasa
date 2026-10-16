/**
 * Index coverage and the performance budget (SPEC §6.2, §12).
 */
import { resolveSpelling } from '@core/model/indexes';
import { describe, expect, it } from 'vitest';
import { freshRawLexicon, imported, indexes, oracle } from './lexicon';
import { importLexicon } from '@core/model/importLexicon';
import { buildIndexes } from '@core/model/indexes';

const { lexicon } = imported();
const ix = indexes();

describe('stats', () => {
  it('agrees with the shipped validation summary', () => {
    const counts = oracle().summary.counts;
    expect(ix.stats.headwords).toBe(counts.headwords);
    expect(ix.stats.primalRoots).toBe(counts.primal_roots);
    expect(ix.stats.compounds).toBe(counts.compounds);
    expect(ix.stats.forms).toBe(counts.forms);
    expect(ix.stats.unusedGlossSlots).toBe(counts.unused_forms);
    expect(ix.stats.functionWords).toBe(counts.function_words);
  });
});

describe('byForm', () => {
  it('indexes every stored form', () => {
    for (const h of lexicon.headwords) {
      expect(ix.byForm.has(h.forms.root), h.forms.root).toBe(true);
      expect(ix.byForm.has(h.forms.verb), h.forms.verb).toBe(true);
    }
  });

  it('maps a spelling to a list, because 32 spellings span namespaces', () => {
    const multi = [...ix.byForm.entries()].filter(
      ([, refs]) => new Set(refs.map((r) => r.namespace)).size > 1,
    );
    // maivo is both a pronoun and a root: the one overlap the validator names.
    const maivo = ix.byForm.get('maivo');
    expect(maivo).toBeDefined();
    expect(new Set(maivo?.map((r) => r.namespace))).toContain('pronoun');
    expect(new Set(maivo?.map((r) => r.namespace))).toContain('headword');
    expect(multi.length).toBeGreaterThan(0);
  });

  it('resolves a slot for every headword form reference', () => {
    const refs = ix.byForm.get('amora') ?? [];
    const headwordRef = refs.find((r) => r.namespace === 'headword');
    expect(headwordRef?.spelling).toBe('amor');
    expect(headwordRef?.slot).toBe('verb');
  });
});

describe('byComponent', () => {
  it('finds the compounds built on a root, with their role', () => {
    const onAmor = ix.byComponent.get('amor') ?? [];
    const asModifier = onAmor.filter((u) => u.role === 'modifier');
    const asHead = onAmor.filter((u) => u.role === 'head');
    expect(asModifier).toHaveLength(19);
    expect(asHead).toHaveLength(20);
  });

  it('records the nested compound against its compound component', () => {
    const onSomubiti = ix.byComponent.get('somubiti') ?? [];
    expect(onSomubiti.map((u) => u.spelling)).toEqual(['mudusomubiti']);
  });

  it('covers every component of every compound', () => {
    for (const h of lexicon.headwords) {
      if (h.components === null) continue;
      for (const c of h.components) {
        const uses = ix.byComponent.get(c) ?? [];
        expect(
          uses.some((u) => u.spelling === h.spelling),
          `${h.spelling} via ${c}`,
        ).toBe(true);
      }
    }
  });
});

describe('byDerivation', () => {
  it('offers -yo, -vu and -pago on an ordinary root', () => {
    expect(ix.byDerivation.get('lira')).toEqual(['lirayo', 'liravu', 'lirapago']);
  });

  it('omits the blocked mavo + -pago', () => {
    expect(ix.byDerivation.get('mavo')).toEqual(['mavoyo', 'mavovu']);
  });
});

describe('search indexes', () => {
  it('finds entries by English synonym', () => {
    const ids = ix.bySynonym.get('love') ?? [];
    const spellings = ids.map((id) => ix.byId.get(id)?.spelling);
    expect(spellings).toContain('amor');
  });

  it('finds entries by a gloss word', () => {
    const ids = ix.byGloss.get('snowball') ?? [];
    expect(ids.map((id) => ix.byId.get(id)?.spelling)).toContain('nevlosolo');
  });

  it('groups rhymes by the last four letters', () => {
    const family = ix.byRhyme.get('aigo') ?? [];
    expect(new Set(family)).toEqual(new Set(['daigo', 'mirudaigo']));
  });
});

describe('legacy resolution (ruling 1.0:G19)', () => {
  it('maps all 509 pre-1.0 spellings', () => {
    expect(ix.legacyForms.size).toBe(509);
  });

  it('resolves a respelled form to its 1.0 replacement', () => {
    const result = resolveSpelling(ix, 'yoga');
    expect(result.viaLegacy?.to).toBe('yomla');
    expect(result.viaLegacy?.kind).toBe('respelled');
    expect(result.refs.length).toBeGreaterThan(0);
  });

  it('resolves a retired root to the compound that replaced it', () => {
    const result = resolveSpelling(ix, 'bede');
    expect(result.viaLegacy?.to).toBe('somubiti');
    expect(result.viaLegacy?.kind).toBe('retired');
  });

  it('points every single-form legacy target at an active form', () => {
    const dangling = [...ix.legacyForms.values()].filter(
      (m) => !m.isPhrase && !ix.byForm.has(m.to),
    );
    expect(dangling.map((m) => `${m.from} -> ${m.to}`)).toEqual([]);
  });

  it('carries all five migration kinds, not just retired and respelled', () => {
    const kinds = new Set([...ix.legacyForms.values()].map((m) => m.kind));
    expect([...kinds].sort()).toEqual([
      'archived-phrase',
      'merged',
      'respelled',
      'retired',
      'rewritten',
    ]);
  });

  it('resolves the five archived compounds to a phrase, not to an entry', () => {
    const phrases = [...ix.legacyForms.values()].filter((m) => m.isPhrase);
    expect(phrases.map((m) => m.from).sort()).toEqual([
      'liltunavu',
      'lilturuhe',
      'relpalomo',
      'vugifasbi',
      'vugisenru',
    ]);

    const result = resolveSpelling(ix, 'lilturuhe');
    expect(result.phrase).toBe('ruhe ko navufaru');
    expect(result.refs).toEqual([]);
    expect(result.viaLegacy?.kind).toBe('archived-phrase');
  });

  it('marks exactly the archived-phrase rows as phrases', () => {
    for (const m of ix.legacyForms.values()) {
      expect(m.isPhrase, m.from).toBe(m.kind === 'archived-phrase');
    }
  });

  it('prefers a live form over the legacy map', () => {
    const result = resolveSpelling(ix, 'amor');
    expect(result.viaLegacy).toBeUndefined();
  });
});

describe('reserved spellings', () => {
  it('holds the 77 sound-ledger rows', () => {
    expect(ix.reserved.size).toBe(77);
  });

  it('says why a reclaimed spelling is held and when it frees up', () => {
    const bede = ix.reserved.get('bede');
    expect(bede?.state).toBe('RECLAIMED-RESERVED');
    expect(bede?.reusableFrom).toBe('2.0');
  });
});

describe('performance budget', () => {
  it('imports and indexes the full lexicon in well under a second', () => {
    const raw = freshRawLexicon();
    const start = performance.now();
    const result = importLexicon(raw);
    buildIndexes(result.lexicon);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});
