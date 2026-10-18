import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildLearnSource,
  buildSandbox,
  createFormsEngine,
  createRng,
  sandboxMenus,
  seriousProblems,
  type FormsEngine,
  type LearnData,
  type LearnInput,
  type SandboxMenus,
  type SandboxSpec,
} from '@core/learn';
import type { RawLexicon } from '@core/model/raw';
import { loadChecker, type Checker } from '../checker/loadChecker';
import { loadLearnInput } from '../../scripts/learn_inputs';

/** The Loom Sandbox (Hall Phase 6): its menus and its order come from the data. */

let input: LearnInput;
let data: LearnData;
let forms: FormsEngine;
let menus: SandboxMenus;
let checker: Checker;

beforeAll(() => {
  input = loadLearnInput();
  data = buildLearnSource(input).data;
  forms = createFormsEngine({ data, morphology: input.lexicon.morphology });
  menus = sandboxMenus(data, forms, new Set());
  checker = loadChecker().checker;
});

const problems = (line: string) =>
  seriousProblems(checker.checkLine(line, 1, undefined, { register: 'poetic' }));
const slotWord = (slot: string, i = 0): string =>
  menus.slots.find((s) => s.id === slot)?.words[i]?.id ?? '';
const raw = (): RawLexicon => input.lexicon;

describe('the menus', () => {
  it('offer the determiners the noun-phrase template lists, and its plural suffix', () => {
    const template = data.concepts.get('nounPhrase')?.description ?? '';
    for (const d of menus.determiners) expect(template).toContain(d.spelling);
    expect(menus.determiners.length).toBeGreaterThan(0);
    const suffix = Object.entries(raw().morphology.suffixes).find(([, m]) =>
      m.startsWith('plural'),
    );
    expect(menus.plural?.spelling).toBe(suffix?.[0].replace(/^-/, ''));
  });

  it('offer one menu per slot with words of its own, in template order, with that slot’s words', () => {
    const numbers = menus.slots.map((s) => s.slot);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    for (const s of menus.slots) {
      const c = data.concepts.get(s.id);
      for (const w of s.words) expect(c?.words).toContain(w.id);
      expect(['slot:SUBJECT', 'slot:VERB', 'slot:OBJECT']).not.toContain(s.id);
    }
  });

  it('only offer words with a meaning in the form they are used in, and put known words in', () => {
    for (const v of menus.verbs) {
      expect(data.items.get(v.id)?.forms.find((f) => f.slot === 'verb')?.meaningful).toBe(true);
    }
    for (const a of menus.adjectives) {
      expect(data.items.get(a.id)?.forms.find((f) => f.slot === 'adjective')?.meaningful).toBe(
        true,
      );
    }
    const rare = [...data.items.values()].find(
      (i) =>
        i.forms.find((f) => f.slot === 'verb')?.meaningful === true &&
        !menus.verbs.some((v) => v.id === i.id),
    );
    if (rare === undefined) throw new Error('every verb is already in the menu');
    const mine = sandboxMenus(data, forms, new Set([rare.id]));
    expect(mine.verbs.find((v) => v.id === rare.id)?.known).toBe(true);
  });
});

describe('building', () => {
  it('puts every piece in the order of its slot, subject before verb before object', () => {
    const r = buildSandbox(data, forms, {
      subject: { id: menus.pronouns[0]?.id ?? '' },
      verb: menus.verbs[0]?.id ?? '',
      object: {
        id: menus.nouns[0]?.id ?? '',
        determiner: menus.determiners[0]?.id ?? '',
        plural: true,
      },
      ops: { 'slot:QUESTION': slotWord('slot:QUESTION'), 'slot:TENSE': slotWord('slot:TENSE') },
    });
    expect(r.pieces.map((p) => p.role)).toEqual([
      'subject',
      'operator',
      'verb',
      'object',
      'object',
      'operator',
    ]);
    expect(r.line.endsWith('?')).toBe(true);
    expect(r.pieces.at(-1)?.id).toBe(slotWord('slot:QUESTION'));
    expect(r.rules.map((x) => x.id)).toEqual(
      expect.arrayContaining([
        'clause',
        'slot:SUBJECT',
        'slot:VERB',
        'form:verb',
        'slot:OBJECT',
        'nounPhrase',
        'suffix:ri',
        'slot:TENSE',
        'slot:QUESTION',
      ]),
    );
    expect(r.reading).toMatch(/\(plural\)/);
    expect(problems(r.line)).toEqual([]);
  });

  it('writes a frame word with its comma', () => {
    const r = buildSandbox(data, forms, {
      subject: { id: menus.pronouns[0]?.id ?? '' },
      verb: menus.verbs[0]?.id ?? '',
      ops: { 'slot:FRAME': slotWord('slot:FRAME') },
    });
    expect(r.line).toMatch(/^\S+, /);
    expect(problems(r.line)).toEqual([]);
  });

  it('builds what the checker passes, except clashes the data itself forbids', () => {
    const exclusions = (raw().grammar as { stacking: { exclusions: string[][] } }).stacking
      .exclusions;
    const rng = createRng('sandbox');
    let clean = 0;
    for (let i = 0; i < 300; i += 1) {
      const ops: Record<string, string> = {};
      for (const s of rng.shuffle(menus.slots).slice(0, rng.int(4)))
        ops[s.id] = rng.pick(s.words)?.id ?? '';
      const spec: SandboxSpec = {
        subject:
          rng.next() < 0.6
            ? { id: rng.pick(menus.pronouns)?.id ?? '' }
            : {
                id: rng.pick(menus.nouns)?.id ?? '',
                determiner: rng.pick(menus.determiners)?.id ?? '',
              },
        verb: rng.pick(menus.verbs)?.id ?? '',
        ops,
      };
      const r = buildSandbox(data, forms, spec);
      const p = problems(r.line);
      if (p.length === 0) {
        clean += 1;
        continue;
      }
      const words = new Set(r.pieces.map((x) => x.text.replace(/,$/, '')));
      expect(
        exclusions.some(([a, b]) => words.has(a ?? '') && words.has(b ?? '')),
        `${r.line}: ${p.map((x) => x.message).join(' ')}`,
      ).toBe(true);
    }
    expect(clean).toBeGreaterThan(250);
  });

  it('is incomplete without a verb, and empty with nothing', () => {
    expect(buildSandbox(data, forms, { ops: {} }).line).toBe('');
    expect(
      buildSandbox(data, forms, { subject: { id: menus.pronouns[0]?.id ?? '' }, ops: {} })
        .incomplete,
    ).toBe(true);
  });
});

describe('from the data', () => {
  it('follows a change to the plural suffix with no code change', () => {
    const lex = JSON.parse(JSON.stringify(raw())) as RawLexicon;
    const key =
      Object.keys(lex.morphology.suffixes).find((k) =>
        lex.morphology.suffixes[k]?.startsWith('plural'),
      ) ?? '';
    const meaning = lex.morphology.suffixes[key] ?? '';
    lex.morphology.suffixes = {
      ...Object.fromEntries(Object.entries(lex.morphology.suffixes).filter(([k]) => k !== key)),
      '-qx': meaning,
    };
    const e = createFormsEngine({ data, morphology: lex.morphology });
    const noun = menus.nouns[0];
    const r = buildSandbox(data, e, { object: { id: noun?.id ?? '', plural: true }, ops: {} });
    expect(r.pieces[0]?.text).toBe(`${noun?.spelling ?? ''}qx`);
  });
});
