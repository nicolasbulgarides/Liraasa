import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  EMPTY_OVERRIDES,
  buildLearnSource,
  buildSkillGraph,
  isUnlocked,
  linkLine,
  parseOverrides,
  readCorpus,
  rootNode,
  conceptNode,
  validateCurriculum,
  writingToCorpusFile,
  type LearnData,
  type LearnInput,
  type LinkContext,
  type SkillGraph,
} from '@core/learn';
import type { RawLexicon } from '@core/model/raw';
import { loadLearnInput } from '../../scripts/learn_inputs';

/**
 * Learn Phase 1: the data adapter, the skill graph and the validator, on the
 * real 1.2 lexicon and the validated corpus.
 */

let input: LearnInput;
let data: LearnData;
let context: LinkContext;
let graph: SkillGraph;
let buildMs = 0;

beforeAll(() => {
  input = loadLearnInput();
  const t = performance.now();
  const source = buildLearnSource(input);
  graph = buildSkillGraph(source.data, EMPTY_OVERRIDES);
  buildMs = performance.now() - t;
  data = source.data;
  context = source.context;
});

const lexicon = (): RawLexicon => JSON.parse(JSON.stringify(input.lexicon)) as RawLexicon;

describe('the data adapter', () => {
  it('reads every headword and closed-class entry, by id', () => {
    const lex = input.lexicon;
    const expected =
      lex.headwords.length +
      lex.function_words.length +
      lex.pronouns.length +
      lex.correlatives.length +
      lex.time_and_dates.length +
      lex.colors.length +
      lex.discourse_particles.length +
      // the attested image compounds keep their ids (2.0:G40)
      (lex.image_compounds?.attested.length ?? 0);
    expect(data.items.size).toBe(expected);
    for (const h of lex.headwords) {
      const item = data.items.get(h.id!);
      expect(item?.spelling, h.root).toBe(h.root);
    }
    expect(data.edition).toBe(lex.version);
  });

  it('links compounds to their parts by id, never by spelling', () => {
    for (const item of data.items.values()) {
      if (item.kind !== 'compound') continue;
      expect(item.components, item.spelling).not.toBeNull();
      const [modifier, head] = item.components ?? [];
      // the modifier may be a colour base (2.0:G38) or a time noun (3.2:G142)
      expect(data.items.get(modifier ?? '')?.kind).toMatch(/root|compound|color|timeWord/);
      expect(data.items.get(head ?? '')?.kind).toMatch(/root|compound/);
      for (const part of item.components ?? []) {
        expect(data.items.get(part)?.usedIn, item.spelling).toContain(item.id);
      }
    }
  });

  it('marks unused slots as not meaningful, so nothing quizzes them', () => {
    for (const item of data.items.values()) {
      for (const f of item.forms) {
        expect(f.meaningful, `${f.form}: ${f.gloss}`).toBe(!f.gloss.startsWith('—'));
      }
    }
  });

  it('references only ids that exist, everywhere', () => {
    const ids = new Set(data.items.keys());
    for (const e of data.examples)
      for (const id of e.ids) expect(ids.has(id), e.liraasa).toBe(true);
    for (const c of data.concepts.values()) {
      for (const id of c.words) expect(ids.has(id), c.id).toBe(true);
      for (const p of c.prereqs) expect(data.concepts.has(p), `${c.id} → ${p}`).toBe(true);
    }
    for (const e of data.examples) {
      for (const c of e.concepts) expect(data.concepts.has(c), e.liraasa).toBe(true);
    }
  });

  it('derives every concept from a data section and quotes it', () => {
    expect([...data.concepts.keys()]).toEqual(
      expect.arrayContaining([
        'form:root',
        'form:verb',
        'clause',
        'compound',
        'nounPhrase',
        'numbers',
        'motion',
        'slot:TENSE',
        'rule:1.2:G24',
        'rule:1.0:G1',
        'rule:0.8:R1',
      ]),
    );
    const grammar = input.lexicon.grammar as unknown as { slots: { slot: string }[] };
    for (const s of grammar.slots) expect(data.concepts.has('slot:' + s.slot)).toBe(true);
    expect(data.concepts.get('clause')?.description).toBe(
      (input.lexicon.grammar as unknown as { clause_template: string }).clause_template,
    );
    const tense = data.concepts.get('slot:TENSE');
    expect(tense?.words.length).toBeGreaterThan(0);
  });

  it('links each 1.2 ruling example to its ruling', () => {
    const r12 = (input.lexicon.rulings_1_2 ?? []) as unknown as {
      id: string;
      examples?: unknown[];
    }[];
    for (const r of r12) {
      for (const [liraasa] of (r.examples ?? []) as string[][]) {
        const e = data.examples.find((x) => x.liraasa === liraasa && x.source !== 'corpus');
        expect(e?.concepts, `${r.id}: ${String(liraasa)}`).toContain('rule:1.2:' + r.id);
      }
    }
  });
});

describe('linking text', () => {
  it('links almost every word of the validated corpus', () => {
    const tokens = data.texts.flatMap((t) => t.lines.flatMap((l) => l.tokens));
    const linked = tokens.filter((t) => t.link.kind !== 'unknown').length;
    expect(linked / tokens.length).toBeGreaterThan(0.98);
  });

  it('reads plurals, diminutives, numbers, names, legacy forms and motion prefixes', () => {
    const lex = input.lexicon;
    const pago = lex.headwords.find((h) => h.root === 'velu');
    expect(pago).toBeDefined();
    const kinds = (line: string): string[] =>
      linkLine(context, line).map((t) =>
        t.link.kind === 'entry' ? (t.link.via ?? 'entry') : t.link.kind,
      );
    expect(kinds('li veluri')).toEqual(['entry', 'plural']);
    expect(kinds('Dorinti')).toEqual(['name']);
    expect(kinds('dossa')).toEqual(['number']);
    expect(kinds('burla')).toEqual(['legacy']); // respelled to sirla in 1.0 (1.0:G19)
    expect(kinds('revo-lirala')).toEqual(['motion']);
  });

  it('flags song refrains that extraction labelled as English', () => {
    expect(data.gaps).toContainEqual(
      expect.objectContaining({ code: 'corpus-mislabelled-english', ref: 'text:song_I_vorbalira' }),
    );
  });

  it('reads Bumrepago with its English beneath each line', () => {
    const play = data.texts.find((t) => t.id === 'text:bumrepago');
    const english = play?.lines.filter((l) => l.english !== null).length ?? 0;
    expect(english / (play?.lines.length ?? 1)).toBeGreaterThan(0.8);
  });

  it('reads a stored writing with its line-aligned English', () => {
    const first = data.texts[0]?.lines[0]?.liraasa ?? '';
    const second = data.texts[0]?.lines[1]?.liraasa ?? '';
    const file = writingToCorpusFile({
      id: 'w1',
      title: 'A writing',
      text: `${first}\n\n${second}`,
      englishLines: ['one', '', 'two'],
    });
    const { text } = readCorpus(context, file);
    expect(text.lines.map((l) => [l.liraasa, l.english])).toEqual([
      [first, 'one'],
      [second, 'two'],
    ]);
  });
});

describe('the skill graph', () => {
  it('places every node, prerequisites first', () => {
    expect(graph.order.length).toBe(graph.nodes.size);
    for (const node of graph.nodes.values()) {
      expect(node.unit, node.id).toBeGreaterThanOrEqual(0);
      for (const p of node.prereqs) {
        const pre = graph.nodes.get(p);
        expect(pre, `${node.id} needs ${p}`).toBeDefined();
        expect(pre?.order ?? Infinity, `${p} before ${node.id}`).toBeLessThan(node.order);
      }
    }
  });

  it('has a root node for every headword and nothing for unknown ids', () => {
    for (const h of input.lexicon.headwords) expect(graph.nodes.has(rootNode(h.id!))).toBe(true);
    for (const node of graph.nodes.values()) {
      const exists =
        node.kind === 'concept' ? data.concepts.has(node.ref) : data.items.has(node.ref);
      expect(exists, node.id).toBe(true);
      for (const m of node.members ?? []) expect(data.items.has(m)).toBe(true);
    }
  });

  it('teaches the commonest roots and the forms first, and the clause before its slots', () => {
    const first = graph.units[0];
    expect(first?.nodes[0]).toBe(conceptNode('form:root'));
    const at = (id: string): number => graph.nodes.get(id)?.order ?? -1;
    expect(at(conceptNode('clause'))).toBeLessThan(at(conceptNode('slot:TENSE')));
    expect(at(conceptNode('form:verb'))).toBeLessThan(at(conceptNode('clause')));
    // every core root comes before every advanced root
    const roots = graph.order.map((id) => graph.nodes.get(id)).filter((n) => n?.kind === 'root');
    const firstAdvanced = roots.findIndex((n) => n?.level === 'advanced');
    expect(roots.slice(firstAdvanced).every((n) => n?.level === 'advanced')).toBe(true);
  });

  it('groups each unit around one theme', () => {
    const themed = graph.units.slice(0, 40).filter((u) => {
      const roots = u.nodes.filter((n) => n.startsWith('root:'));
      const same = roots.filter((n) => data.items.get(n.slice(5))?.theme === u.theme).length;
      return roots.length > 0 && same / roots.length >= 0.5;
    });
    expect(themed.length).toBeGreaterThanOrEqual(24); // most units: frequency still wins over theme
  });

  it('is deterministic', () => {
    const again = buildSkillGraph(data, EMPTY_OVERRIDES);
    expect(again.order).toEqual(graph.order);
  });

  it('unlocks a node only when its prerequisites are mastered', () => {
    const compound = [...graph.nodes.values()].find(
      (n) => n.kind === 'root' && n.prereqs.length === 3,
    );
    expect(compound).toBeDefined();
    const id = compound?.id ?? '';
    expect(isUnlocked(graph, id, () => 0)).toBe(false);
    expect(isUnlocked(graph, id, () => 1)).toBe(true);
    const [, ...rest] = compound?.prereqs ?? [];
    expect(isUnlocked(graph, id, (p) => (rest.includes(p) ? 1 : 0.5))).toBe(false);
  });

  it('builds the whole curriculum quickly', () => {
    expect(buildMs).toBeLessThan(3000);
  });
});

describe('author overrides', () => {
  const lastRoot = (): string =>
    [...graph.order]
      .reverse()
      .find((id) => id.startsWith('root:') && graph.nodes.get(id)?.prereqs.length === 1) ?? '';

  it('a pin brings a root to the first unit it can reach', () => {
    const pinned = lastRoot();
    const g = buildSkillGraph(data, parseOverrides({ pins: [pinned] }));
    expect(g.nodes.get(pinned)?.unit).toBe(0);
  });

  it('a level overrides the derived one', () => {
    const id = lastRoot().slice('root:'.length);
    const g = buildSkillGraph(data, parseOverrides({ levels: { [id]: 'core' } }));
    expect(g.nodes.get(rootNode(id))?.level).toBe('core');
    expect(g.nodes.get(rootNode(id))?.unit ?? 0).toBeLessThan(
      graph.nodes.get(rootNode(id))?.unit ?? 0,
    );
  });

  it('rulingLinks replaces a ruling’s derived links', () => {
    const o = parseOverrides({ rulingLinks: { '1.0:G2': ['slot:NEGATION'] } });
    const d = buildLearnSource({ ...input, overrides: o }).data;
    expect(d.concepts.get('rule:1.0:G2')?.prereqs).toEqual(['slot:NEGATION']);
  });

  it('the validator reports ids that do not exist, instead of guessing', () => {
    const o = parseOverrides({
      pins: ['root:lx_nothing_9999'],
      notes: { lx_nothing_9998: { mnemonic: 'x' } },
      lessons: [
        { id: 'mine', title: 'Mine', refs: ['form:verb'], body: 'See [[lx_nothing_9997]].' },
      ],
      rulingLinks: { '9.9:G1': ['clause'] },
    });
    const d = buildLearnSource({ ...input, overrides: o }).data;
    const gaps = validateCurriculum(d, buildSkillGraph(d, o), o);
    const codes = gaps.filter((g) => g.severity === 'error').map((g) => `${g.code} ${g.ref}`);
    expect(codes).toEqual(
      expect.arrayContaining([
        'override-unknown-id root:lx_nothing_9999',
        'override-unknown-id lx_nothing_9998',
        'lesson-unknown-ref mine',
        'override-unknown-ruling 9.9:G1',
      ]),
    );
  });

  it('rejects a malformed overrides file', () => {
    expect(() => parseOverrides({ levels: { x: 'sometimes' } })).toThrow(/core/);
    expect(() => parseOverrides({ version: 2 })).toThrow(/version/);
  });
});

describe('the validator on the real data', () => {
  it('finds no errors, and reports the gaps the author should see', () => {
    const gaps = validateCurriculum(data, graph, EMPTY_OVERRIDES);
    expect(gaps.filter((g) => g.severity === 'error')).toEqual([]);
    const codes = new Set(gaps.map((g) => g.code));
    expect(codes).toContain('concept-no-examples'); // 1.0 and 0.8 rulings carry no examples
    expect(codes).toContain('root-no-examples');
  });
});

describe('stable ids across a respelling', () => {
  it('a respelled root keeps its id, its node and its compounds', () => {
    // sirla was burla before 1.0: respell it back, with the forms the data records
    const lex = lexicon();
    const legacy = (
      lex.legacy as unknown as {
        respelled_roots: { old: string; new: string; old_forms: Record<string, string> }[];
      }
    ).respelled_roots.find((r) => r.new === 'sirla');
    expect(legacy).toBeDefined();
    const h = lex.headwords.find((x) => x.root === 'sirla');
    expect(h).toBeDefined();
    if (h === undefined || legacy === undefined) return;
    h.root = legacy.old;
    (h as unknown as { forms: Record<string, string> }).forms = { ...legacy.old_forms };
    // the old spelling stops being a legacy form once it is the headword again
    const mf = (lex.legacy as unknown as { migration_forms: Record<string, unknown> })
      .migration_forms;
    const kept = Object.entries(mf).filter(
      ([form]) => !Object.values(legacy.old_forms).includes(form),
    );
    (lex.legacy as unknown as { migration_forms: Record<string, unknown> }).migration_forms =
      Object.fromEntries(kept);

    const before = data.items.get(h.id!);
    const after = buildLearnSource({ ...input, lexicon: lex }).data;
    const item = after.items.get(h.id!);
    expect(item?.spelling).toBe(legacy.old);
    expect(item?.meaning).toBe(before?.meaning);
    expect(item?.usedIn).toEqual(before?.usedIn);
    const g = buildSkillGraph(after, EMPTY_OVERRIDES);
    expect(g.nodes.has(rootNode(h.id!))).toBe(true);
  });
});

describe('no Liraasa in the learning code', () => {
  it('no string literal in the learning code or its UI spells a word of the lexicon', () => {
    const LANGUAGE_NAME = input.lexicon.language.toLowerCase();
    const files = [
      ...readdirSync('src/core/learn')
        .filter((f) => f.endsWith('.ts'))
        .map((f) => join('src/core/learn', f)),
      // the browser UI, but not the generated bundle and data
      ...readdirSync('editor/learn')
        .filter((f) => f.endsWith('.js') && !f.startsWith('learn-'))
        .map((f) => join('editor/learn', f)),
    ];
    const spellings = new Set<string>();
    for (const item of data.items.values()) {
      spellings.add(item.spelling.toLowerCase());
      for (const f of item.forms) spellings.add(f.form.toLowerCase());
    }
    for (const w of data.numbers.keys()) spellings.add(w);
    const hits: string[] = [];
    for (const file of files) {
      // markup is not text: tags, class names and styles in the UI are dropped first
      const source = readFileSync(file, 'utf8')
        .replace(/<\/?[a-z][^>]*>?/gi, ' ')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      for (const m of source.matchAll(/'([^'\n]*)'|`([^`]*)`|"([^"\n]*)"/g)) {
        const literal = m[1] ?? m[2] ?? m[3] ?? '';
        for (const word of literal.match(/[A-Za-z]+(?:-[A-Za-z]+)*/g) ?? []) {
          const w = word.toLowerCase();
          // an all-caps marker ("# EN:") and the language's own name are not Liraasa text
          if (word === word.toUpperCase() || w === LANGUAGE_NAME) continue;
          if (w.length >= 2 && spellings.has(w)) hits.push(`${file}: ${w} in "${literal}"`);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});
