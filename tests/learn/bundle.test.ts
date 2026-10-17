import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

/**
 * The files the songbook editor actually loads: the bundled core and its
 * data, run in a bare browser-like context with no Node modules. Catches a
 * bundle that is stale or that reaches for something the browser lacks.
 * Run `npm run build:learn` first; `npm run check` relies on the committed
 * bundle being current.
 */

interface Bundle {
  LiraasaLearn: {
    buildLearnSource: (input: unknown) => {
      data: { edition: string; items: Map<string, unknown> };
    };
    buildSkillGraph: (data: unknown, overrides: unknown) => { units: unknown[] };
    parseOverrides: (x: unknown) => unknown;
    createStore: (edition: string, now: number) => unknown;
    exportStore: (s: unknown) => string;
    importStore: (s: string) => unknown;
  };
  LIRAASA_LEARN: {
    lexicon: { version: string };
    corpus: unknown[];
    names: string[];
    overrides: unknown;
    previous: { edition: string };
  };
}

describe('the browser bundle', () => {
  it('loads with no Node modules and builds the curriculum from its own data', () => {
    const context = vm.createContext({ console }) as unknown as Bundle & { window: unknown };
    context.window = context;
    vm.runInContext(readFileSync('editor/learn/learn-data.js', 'utf8'), context);
    vm.runInContext(
      readFileSync('editor/learn/learn-core.js', 'utf8') + '\n;window.LiraasaLearn = LiraasaLearn;',
      context,
    );
    const L = context.LiraasaLearn;
    const P = context.LIRAASA_LEARN;
    const source = L.buildLearnSource({ ...P, overrides: L.parseOverrides(P.overrides) });
    const graph = L.buildSkillGraph(source.data, L.parseOverrides(P.overrides));
    expect(source.data.edition).toBe(P.lexicon.version);
    expect(source.data.items.size).toBeGreaterThan(1000);
    expect(graph.units.length).toBeGreaterThan(100);
    expect(P.previous.edition).not.toBe(P.lexicon.version);
    const store = L.createStore(P.lexicon.version, 0);
    expect(L.exportStore(L.importStore(L.exportStore(store)))).toBe(L.exportStore(store));
  });

  it('is built from the current lexicon and overrides', () => {
    const data = readFileSync('editor/learn/learn-data.js', 'utf8');
    const lexicon = JSON.parse(readFileSync('data/lexicon/liraasa_1_2.json', 'utf8')) as {
      built_utc: string;
    };
    const overrides = JSON.parse(readFileSync('data/lessons/overrides.json', 'utf8')) as unknown;
    expect(data).toContain(`"built_utc":"${lexicon.built_utc}"`);
    expect(data).toContain(JSON.stringify(overrides).slice(0, 60));
  });

  it('the editor loads Learn’s scripts, and Learn’s data only on demand', () => {
    const html = readFileSync('editor/index.html', 'utf8');
    for (const f of ['store.js', 'session.js', 'author.js', 'app.js'])
      expect(html).toContain(`<script src="learn/${f}"></script>`);
    expect(html).not.toContain('<script src="learn/learn-data.js">');
    expect(html).toContain('id="learnView"');
    expect(html).toContain('id="learnBtn"');
  });
});
