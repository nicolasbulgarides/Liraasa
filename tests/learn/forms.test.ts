import { beforeAll, describe, expect, it } from 'vitest';
import {
  FORM_SLOTS,
  buildLearnSource,
  createFormsEngine,
  parseOverrides,
  readFormRules,
  ruleForm,
  snapshotEdition,
  validateCurriculum,
  buildSkillGraph,
  type FormsEngine,
  type LearnData,
  type LearnInput,
} from '@core/learn';
import { SLOT_SUFFIX } from '@core/config/slots';
import { VERB_RULE } from '@core/config/morphology';
import type { RawLexicon } from '@core/model/raw';
import { loadLearnInput } from '../../scripts/learn_inputs';

/**
 * The forms engine (Training Hall Phase 1), on the real 1.2 lexicon, and on
 * copies of it with a marker changed, to prove that every form re-derives
 * from the data with no code change.
 *
 * Simulated markers use `qx`: neither letter is in the phonology's inventory,
 * so no simulated form can be mistaken for a Liraasa word.
 */

const IMPOSSIBLE = 'qx';

let input: LearnInput;
let data: LearnData;
let engine: FormsEngine;

beforeAll(() => {
  input = loadLearnInput();
  data = buildLearnSource(input).data;
  engine = createFormsEngine({
    data,
    morphology: input.lexicon.morphology,
    phonology: input.lexicon.phonology,
  });
});

const copy = (): RawLexicon => JSON.parse(JSON.stringify(input.lexicon)) as RawLexicon;
const engineFor = (lexicon: RawLexicon): FormsEngine =>
  createFormsEngine({
    data: buildLearnSource({ ...input, lexicon, corpus: [] }).data,
    morphology: lexicon.morphology,
    phonology: lexicon.phonology,
  });
const headwords = (): { id: string; spelling: string }[] =>
  [...data.items.values()]
    .filter((i) => i.kind === 'root' || i.kind === 'compound')
    .map((i) => ({ id: i.id, spelling: i.spelling }));
/** Every entry with stored forms: headwords, and from 2.0 the attested image compounds. */
const withForms = (): number => [...data.items.values()].filter((i) => i.forms.length > 0).length;
/** Every stored paradigm a marker change must rewrite: headwords and attested image compounds. */
const paradigms = (lex: RawLexicon): { root: string; forms: Record<string, string> }[] => [
  ...(lex.headwords as unknown as { root: string; forms: Record<string, string> }[]),
  ...((lex.image_compounds?.attested ?? []) as unknown as {
    root: string;
    forms: Record<string, string>;
  }[]),
];

describe('reading the rules from the data', () => {
  it('reads every slot and every verb class, and agrees with the typed config', () => {
    const { rules, gaps } = readFormRules(
      input.lexicon.morphology,
      data.edition,
      input.lexicon.phonology,
    );
    expect(gaps).toEqual([]);
    for (const s of rules.slots) {
      const expected = SLOT_SUFFIX[s.slot];
      if (expected === null) expect(s.kind).toBe('verb');
      else expect(s).toMatchObject({ kind: 'suffix', suffix: expected });
    }
    expect(rules.verb.map((v) => v.cls)).toEqual([
      'n-initial',
      's-initial',
      'vowel-initial',
      'otherwise',
    ]);
    expect(rules.verb.find((v) => v.cls === 'n-initial')?.ending).toBe(VERB_RULE.nInitial);
    expect(rules.verb.find((v) => v.cls === 's-initial')?.ending).toBe(VERB_RULE.sInitial);
    expect(rules.verb.find((v) => v.cls === 'vowel-initial')?.ending).toBe(VERB_RULE.vowelInitial);
    expect(rules.irregularVerbs).toEqual(VERB_RULE.irregular);
    expect(rules.vowels).toBe('aeiou');
  });

  it('reads every lexicalised derivation as base + suffix with its fixed gloss', () => {
    const { rules } = engine;
    // 2.5:G122: the lexicalised -ti words are a list of their own, read the same way
    const m = input.lexicon.morphology as unknown as {
      lexicalised_diminutives?: Record<string, string>;
    };
    const stored = [
      ...Object.keys(input.lexicon.morphology.lexicalised_derivations),
      ...Object.keys(m.lexicalised_diminutives ?? {}),
    ];
    expect(rules.lexicalised.map((d) => d.spelling).sort()).toEqual([...stored].sort());
    for (const d of rules.lexicalised) {
      expect(d.base + d.suffix).toBe(d.spelling);
      expect(d.gloss.length).toBeGreaterThan(0);
    }
  });

  it('reports a pattern it cannot read instead of guessing', () => {
    const lex = copy();
    lex.morphology.seven_forms[1] = 'R with something';
    const { rules, gaps } = readFormRules(lex.morphology, '1.2');
    expect(rules.slots[1]?.kind).toBe('unknown');
    expect(gaps.map((g) => g.code)).toContain('forms-rule-unreadable');
    expect(ruleForm(rules, 'x', FORM_SLOTS[1]).form).toBeNull();
  });
});

describe('the real forms of the current edition', () => {
  it('finds no unexplained form: every stored form is the rule or a listed irregular', () => {
    expect(engine.gaps).toEqual([]);
  });

  it('marks exactly the words verb_rule lists as irregular, and nothing else', () => {
    const listed = Object.keys(input.lexicon.morphology.verb_rule).filter(
      (k) => !k.includes('-') && k !== 'otherwise',
    );
    const ids = headwords()
      .filter((h) => listed.includes(h.spelling))
      .map((h) => h.id);
    expect(ids.length).toBe(listed.length);
    expect([...engine.irregularIds()].sort()).toEqual(ids.sort());

    for (const id of ids) {
      const w = engine.getForms(id);
      const verb = w?.forms.find((f) => f.category === 'verb');
      expect(w?.hasIrregular).toBe(true);
      expect(verb).toMatchObject({
        irregular: true,
        irregularReason: 'listed',
        verbClass: 'listed',
        parts: [{ role: 'whole' }],
      });
      // what the rule alone would give: not the stored form, and what ruleForm says
      expect(verb?.regularWouldBe).not.toBe(verb?.form);
      expect(verb?.regularWouldBe).toBe(
        ruleForm(engine.rules, w?.root.spelling ?? '', 'verb').form,
      );
      // every other form of the word is regular
      for (const f of w?.forms ?? []) if (f.category !== 'verb') expect(f.irregular).toBe(false);
    }
  });

  it('splits every regular form at its morpheme boundary, and the parts spell the form', () => {
    let checked = 0;
    for (const h of headwords()) {
      for (const f of engine.getForms(h.id, { includeUnused: true })?.forms ?? []) {
        if (f.irregular) continue;
        expect(f.parts.map((p) => p.text).join('')).toBe(f.form);
        expect(f.parts[0]).toEqual({ text: h.spelling, role: 'root' });
        expect(f.regularWouldBe).toBeNull();
        checked += 1;
      }
    }
    expect(checked).toBe(headwords().length * FORM_SLOTS.length - engine.irregularIds().length);
  });

  it('returns only the forms that apply, and lists the unused slots', () => {
    for (const h of headwords().slice(0, 300)) {
      const item = data.items.get(h.id);
      const w = engine.getForms(h.id);
      const meaningful = item?.forms.filter((f) => f.meaningful).map((f) => f.slot) ?? [];
      expect(w?.forms.map((f) => f.category)).toEqual(meaningful);
      expect([...(w?.unused ?? []), ...meaningful].sort()).toEqual([...FORM_SLOTS].sort());
      expect(engine.getForms(h.id, { includeUnused: true })?.forms.length).toBe(7);
    }
  });

  it('gives a word whose only meaning is its root a one-row table', () => {
    const only = [...data.items.values()].find(
      (i) => i.forms.length > 0 && i.forms.filter((f) => f.meaningful).length === 1,
    );
    expect(only).toBeDefined();
    const w = engine.getForms(only?.id ?? '');
    expect(w?.forms.length).toBe(1);
    expect(w?.unused.length).toBe(6);
  });

  it('gives a closed-class word no forms, and an unknown id null', () => {
    const fw = [...data.items.values()].find((i) => i.kind === 'functionWord');
    const w = engine.getForms(fw?.id ?? '');
    expect(w?.forms).toEqual([]);
    expect(w?.root.kind).toBe('functionWord');
    expect(engine.getForms('lx_no_such_entry')).toBeNull();
  });

  it("notes a compound's verb whose class comes from its modifier, not its head", () => {
    let flagged = 0;
    for (const item of data.items.values()) {
      if (item.components === null) continue;
      const verb = engine
        .getForms(item.id, { includeUnused: true })
        ?.forms.find((f) => f.category === 'verb');
      const head = data.items.get(item.components[1]);
      if (verb === undefined || head === undefined || verb.verbClass === undefined) continue;
      const headClass = ruleForm(engine.rules, head.spelling, 'verb').verbClass;
      if (headClass !== verb.verbClass) {
        expect(verb.classFromModifier).toEqual({ headClass });
        flagged += 1;
      } else {
        expect(verb.classFromModifier).toBeUndefined();
      }
    }
    expect(flagged).toBeGreaterThan(0);
  });

  it('gives a compound its parts and a root the compounds built on it', () => {
    const compound = [...data.items.values()].find((i) => i.components !== null);
    const w = engine.getForms(compound?.id ?? '');
    expect(w?.root.parts?.map((p) => p.id)).toEqual(compound?.components);
    const modifier = engine.getForms(compound?.components?.[0] ?? '');
    expect(modifier?.compounds.map((c) => c.id)).toContain(compound?.id);
  });

  it('attaches every lexicalised derivation to the headword it is built on', () => {
    const shown = headwords().flatMap((h) => engine.getForms(h.id)?.derivations ?? []);
    expect(shown.length).toBe(engine.rules.lexicalised.length);
    for (const d of shown) expect(d.ruleId).toBe(`suffix:${d.suffix}`);
  });

  it('collects alternate meanings without repeating the primary one', () => {
    for (const h of headwords().slice(0, 300)) {
      const w = engine.getForms(h.id);
      expect(w?.root.altMeanings).not.toContain(w?.root.gloss);
      expect(w?.root.altMeanings).not.toContain(w?.root.sense);
      // the headline and the other senses together say what the gloss says
      expect([w?.root.sense, ...(w?.root.altMeanings ?? [])].join('; ')).toBe(
        w?.root.gloss
          .split(';')
          .map((x) => x.trim())
          .filter(Boolean)
          .join('; '),
      );
      expect(new Set(w?.root.altMeanings).size).toBe(w?.root.altMeanings.length);
    }
  });

  it('pulls example sentences that use the word, corpus first', () => {
    const used = data.examples.find((e) => e.source === 'corpus' && e.ids.length > 0);
    const id = used?.ids.find((i) => (data.items.get(i)?.forms.length ?? 0) > 0) ?? '';
    const w = engine.getForms(id, { examples: 5 });
    expect(w?.examples.length).toBeGreaterThan(0);
    expect(w?.examples[0]?.source).toBe('corpus');
    for (const e of w?.examples ?? []) {
      expect(data.examples.find((x) => x.key === e.key)?.ids).toContain(id);
    }
  });
});

describe("the author's form notes", () => {
  it('show beside the form they are keyed to, and an unknown key is reported', () => {
    const id = engine.irregularIds()[0] ?? '';
    const overrides = parseOverrides({
      formNotes: { [`${id}|verb`]: 'Author note.', 'lx_no_such_entry|verb': 'Lost.' },
    });
    const withNotes = createFormsEngine({
      data,
      morphology: input.lexicon.morphology,
      overrides,
    });
    const verb = withNotes.getForms(id)?.forms.find((f) => f.category === 'verb');
    expect(verb?.irregularNote).toBe('Author note.');
    const gaps = validateCurriculum(data, buildSkillGraph(data, overrides), overrides);
    expect(gaps.filter((g) => g.code === 'form-note-unknown').map((g) => g.ref)).toEqual([
      'lx_no_such_entry|verb',
    ]);
  });

  it('refuses a malformed key', () => {
    expect(() => parseOverrides({ formNotes: { nopipe: 'x' } })).toThrow(/entry id/);
  });
});

describe('a marker change in the data re-derives every form', () => {
  it('a changed suffix, released with its forms, changes every table and leaves no finding', () => {
    const lex = copy();
    const i = FORM_SLOTS.indexOf('ascended');
    lex.morphology.seven_forms[i] = `R+${IMPOSSIBLE}`;
    for (const h of paradigms(lex)) h.forms.ascended = h.root + IMPOSSIBLE;
    const e = engineFor(lex);
    expect(e.gaps).toEqual([]);
    for (const h of headwords().slice(0, 200)) {
      const f = e
        .getForms(h.id, { includeUnused: true })
        ?.forms.find((x) => x.category === 'ascended');
      expect(f?.form).toBe(h.spelling + IMPOSSIBLE);
      expect(f?.pattern).toBe(`R+${IMPOSSIBLE}`);
      expect(f?.parts).toEqual([
        { text: h.spelling, role: 'root' },
        { text: IMPOSSIBLE, role: 'marker' },
      ]);
      expect(f?.irregular).toBe(false);
    }
  });

  it('a changed verb class re-derives its verbs, and the listed irregular stays irregular', () => {
    const lex = copy();
    lex.morphology.verb_rule['vowel-initial'] = `R+${IMPOSSIBLE}`;
    const listed = new Set(Object.keys(VERB_RULE.irregular));
    for (const h of paradigms(lex)) {
      if ('aeiou'.includes(h.root[0] ?? '') && !listed.has(h.root)) {
        h.forms.verb = h.root + IMPOSSIBLE;
      }
    }
    const e = engineFor(lex);
    expect(e.gaps).toEqual([]);
    expect([...e.irregularIds()].sort()).toEqual([...engine.irregularIds()].sort());
    const vowelInitial = headwords().find(
      (h) => 'aeiou'.includes(h.spelling[0] ?? '') && !listed.has(h.spelling),
    );
    const verb = e
      .getForms(vowelInitial?.id ?? '', { includeUnused: true })
      ?.forms.find((f) => f.category === 'verb');
    expect(verb).toMatchObject({
      form: (vowelInitial?.spelling ?? '') + IMPOSSIBLE,
      irregular: false,
    });
    const opi = e.irregularIds()[0] ?? '';
    expect(e.getForms(opi)?.forms.find((f) => f.category === 'verb')?.regularWouldBe).toBe(
      (e.getForms(opi)?.root.spelling ?? '') + IMPOSSIBLE,
    );
  });

  it('a rule changed without its forms is a finding, never a silent change', () => {
    const lex = copy();
    lex.morphology.seven_forms[FORM_SLOTS.indexOf('ascended')] = `R+${IMPOSSIBLE}`;
    const e = engineFor(lex);
    const gap = e.gaps.find((g) => g.code === 'form-off-rule');
    expect(gap?.ref).toBe('form:ascended');
    expect(gap?.message).toContain(`${String(withForms())} stored ascended forms`);
    const h = headwords()[0];
    const f = e
      .getForms(h?.id ?? '', { includeUnused: true })
      ?.forms.find((x) => x.category === 'ascended');
    // the stored form is still what is shown; the rule's result sits beside it
    expect(f).toMatchObject({
      form: data.items.get(h?.id ?? '')?.forms.find((x) => x.slot === 'ascended')?.form,
      irregular: true,
      irregularReason: 'unexplained',
      regularWouldBe: (h?.spelling ?? '') + IMPOSSIBLE,
    });
  });

  it('a verb_rule irregular for a word that is gone is reported', () => {
    const lex = copy();
    lex.morphology.verb_rule[IMPOSSIBLE] = IMPOSSIBLE;
    expect(engineFor(lex).gaps.map((g) => g.code)).toContain('irregular-unmatched');
  });
});

describe('across editions', () => {
  it('keeps the id, and says what the word and its glosses were', () => {
    const previous = snapshotEdition(data);
    const target = headwords().find((h) =>
      engine.getForms(h.id)?.forms.some((f) => f.category === 'verb'),
    );
    const id = target?.id ?? '';
    const was = previous.items[id];
    if (was === undefined) throw new Error('no snapshot row');
    const verbIndex = FORM_SLOTS.indexOf('verb');
    previous.items[id] = [
      `${was[0]}${IMPOSSIBLE}`,
      was[1],
      was[2],
      was[3].map((g, i) => (i === verbIndex ? `${g} (before)` : g)),
    ];
    const w = engine.getForms(id, { previous });
    expect(w?.root.id).toBe(id);
    expect(w?.root.spellingWas).toBe(`${was[0]}${IMPOSSIBLE}`);
    const verb = w?.forms.find((f) => f.category === 'verb');
    expect(verb?.glossWas).toBe(`${was[3][verbIndex] ?? ''} (before)`);
    expect(w?.forms.filter((f) => f.glossWas !== undefined).length).toBe(1);
  });
});
