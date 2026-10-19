import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { applyChangesets, auditBuild, type LexiconChangeset } from '../../src/core/change/apply';
import { validateChangeset } from '../../src/core/change/changelog';
import { correctText } from '../../src/core/change/respell';
import type { RawLexicon } from '../../src/core/model/raw';
import { WORD_BUILDING_2_0, build2_0, idsAfter } from '../../scripts/integrate_2_0';
import { readCorpusFiles } from '../../scripts/learn_inputs';
import { type Checker, loadChecker } from '../checker/loadChecker';

/**
 * Liraasa 2.0 (ADR-0016): built from the frozen 1.2 by the 2.0 changeset made
 * from the author's patch, reproducibly, with the author's four decisions, and
 * read by the editor's checker — image compounds included.
 */

const text = (path: string): string =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const json = (path: string): unknown => JSON.parse(text(path));

const v12 = json('../../data/lexicon/liraasa_1_2.json') as RawLexicon;
const onDisk = text('../../data/lexicon/liraasa_2_0.json');
const v20 = JSON.parse(onDisk) as RawLexicon;
const cs = json('../../data/changes/2026-10-18-lexicon-2-0.json') as LexiconChangeset;

interface Head {
  root: string;
  type: string;
  since: string;
  id: string;
  components: string[] | null;
  suffix?: string;
  glosses: Record<string, string>;
}
const heads = v20.headwords as unknown as Head[];
const byRoot = new Map(heads.map((h) => [h.root, h]));
const attested = (v20.image_compounds?.attested ?? []) as unknown as Head[];
const idNumber = (id: string): number => Number(id.split('_').pop());

let checker: Checker;
beforeAll(() => {
  checker = loadChecker().checker;
});

describe('the 2.0 build', () => {
  it('is reproducible: rebuilding from 1.2 gives the file on disk, byte for byte', () => {
    expect(build2_0().text).toBe(onDisk);
  });

  it('passes its structural audit with the counts the patch promised', () => {
    const audit = auditBuild(v20, WORD_BUILDING_2_0);
    expect(audit.findings).toEqual([]);
    expect(audit.counts).toMatchObject({
      headwords: 1462,
      primalRoots: 474,
      compounds: 988,
      forms: 10234,
      distinctForms: 10234,
      lexicalisedDerivations: 106,
    });
    expect(attested).toHaveLength(391);
    expect(v20.version).toBe('2.0');
  });

  it('is traceable: every op has a reason, and the changeset validates', () => {
    expect(() => {
      validateChangeset(cs);
    }).not.toThrow();
    for (const op of cs.ops) expect(op.reason.trim().length, op.entry).toBeGreaterThan(0);
    const count = (op: string): number => cs.ops.filter((o) => o.op === op).length;
    expect({
      roots: count('add_root'),
      compounds: count('add_compound'),
      activated: count('activate_slot'),
      edited: count('edit_gloss'),
      derivations: count('add_derivation'),
      moved: count('move_to_pattern'),
    }).toEqual({
      roots: 10,
      compounds: 346,
      activated: 276,
      edited: 207,
      derivations: 77,
      moved: 391,
    });
  });

  it('keeps every 1.2 id, and numbers 2.0’s new words after the highest', () => {
    const old = new Map((v12.headwords as unknown as Head[]).map((h) => [h.root, h.id]));
    for (const h of [...heads, ...attested]) {
      if (old.has(h.root)) expect(h.id, h.root).toBe(old.get(h.root));
      else expect(idNumber(h.id), h.root).toBeGreaterThan(1497);
    }
    const all = [...heads, ...attested].map((h) => h.id);
    expect(new Set(all).size).toBe(all.length);
    expect(idsAfter(v12, { version: 1, edition: '1.0', minted: {}, next: {} }).next.headword).toBe(
      1498,
    );
  });

  it('refuses to apply to anything but 1.2', () => {
    const v11 = json('../../data/lexicon/liraasa_1_1.json') as RawLexicon;
    expect(() =>
      applyChangesets(v11, [cs], {
        version: '2.0',
        builtUtc: v20.built_utc,
        source: v20.source,
        ids: idsAfter(v11, { version: 1, edition: '1.0', minted: {}, next: {} }),
        wordBuilding: WORD_BUILDING_2_0,
      }),
    ).toThrow();
  });
});

describe('the patch, as the author decided it', () => {
  it('adds the six word-building rulings, the three review rulings and the two declared pairs; no clause rule changes', () => {
    expect((v20.rulings_2_0 ?? []).map((r) => r.id)).toEqual([
      'G37',
      'G38',
      'G39',
      'G40',
      'G41',
      'G42',
      // the guide review (2026-10-18): sound values, vowels in song, foreign names
      'G43',
      'G44',
      'G45',
    ]);
    expect(v20.phonology.declared_distance_1_pairs).toEqual(
      expect.arrayContaining([
        ['devo', 'devi'],
        ['nevi', 'devi'],
      ]),
    );
    expect(v20.grammar).toEqual(v12.grammar);
  });

  it('the review: lumiasa is Her Divine Light (the Goddess’s own light), and two typos are mended', () => {
    const lumi = byRoot.get('lumi');
    expect(lumi?.glosses.ascended).toBe('Her Divine Light');
    expect(lumi?.glosses.negative_adjective).toBe('Without Light (Irredeemable)');
    expect(byRoot.get('krono')?.glosses.ascended_adjective).toBe('Beyond Time, Timeless');
  });

  it('amorna follows the canon fix, not the dictionary line', () => {
    expect(byRoot.get('amor')?.glosses.negative).toBe('lovelessness; the absence of love');
    expect(byRoot.get('amor')?.glosses.negative_adjective).toBe('unloving; loveless');
  });

  it('rewrites the bumreasasan example with a listed word, its English to match', () => {
    const ex = v20.examples.find((e) => e.liraasa === 'Ola ka bumresan, zoke.');
    expect(ex?.english).toBe('That is baked. (Oh, sure.)');
    // no live sentence uses the three non-words any more (forms, history and legacy may)
    const sentences = [
      ...v20.examples.map((e) => e.liraasa),
      ...(v20.discourse_particles as unknown as { examples: { liraasa: string }[] }[]).flatMap(
        (d) => d.examples.map((e) => e.liraasa),
      ),
    ].join(' ');
    for (const w of ['bumreasasan', 'pamlonasan', 'cupa'])
      expect(sentences).not.toMatch(new RegExp(`\b${w}\b`));
  });

  it('allows nesting: compounds built on compounds stand', () => {
    const nested = heads.filter(
      (h) => h.components?.some((c) => byRoot.get(c)?.type === 'Compound') && h.since === '2.0',
    );
    expect(nested.map((h) => h.root)).toEqual(
      expect.arrayContaining(['larbopagosafa', 'mavolumitali']),
    );
  });

  it('keeps the four ambiguous compounds', () => {
    for (const w of ['benamavo', 'kronosarbi', 'ralelira', 'sevulumi'])
      expect(byRoot.has(w), w).toBe(true);
  });

  it('builds colour compounds on colour bases, and viofuroti with its -ti', () => {
    expect(byRoot.get('aurumijuba')?.components).toEqual(['aurumi', 'juba']);
    expect(byRoot.get('viofuroti')).toMatchObject({ components: ['vio', 'furo'], suffix: 'ti' });
  });

  it('reuses rivla on the sound ledger’s own terms', () => {
    const row = v20.sound_ledger.find((s) => s.spelling === 'rivla') as unknown as Record<
      string,
      string
    >;
    expect(row).toMatchObject({ state: 'REUSED', reusable_from: '2.0', reused_in: '2.0' });
    expect(byRoot.get('rivla')?.glosses.root).toBe('flow; current');
    // 0.8 texts still find their old word
    expect(v20.legacy.migration_forms.rivla?.to).toBe('mirunulu');
  });
});

describe('read by the checker', () => {
  it('the mended canon examples read clean', () => {
    // the checker reads the current edition: a 2.0 sentence is read in 2.1 spelling (2.1:G58)
    const v21 = json('../../data/lexicon/liraasa_2_1.json') as RawLexicon;
    const to21 = Object.fromEntries(
      Object.entries(v21.legacy.migration_forms).map(([old, m]) => [old, m.to]),
    );
    const serious = (line: string) =>
      checker
        .checkLine(correctText(line, to21).text, 1)
        .filter((d) => d.severity === 'error' || d.severity === 'warn');
    for (const line of [
      'Ola ka bumresan, zoke.',
      'Maivo vurlova, hema, baba buvokova de miru.',
      'Li lira ka vaniasasan.',
      'Li dorbi ke lallesan hoyo!',
    ]) {
      expect(serious(line), line).toEqual([]);
    }
  });

  it('reads every image compound in the songs as a word, with its attested gloss', () => {
    const pattern = new Map(attested.map((h) => [h.root, h.glosses.root]));
    let seen = 0;
    for (const file of readCorpusFiles()) {
      for (const word of file.text.toLowerCase().match(/[a-z]+/g) ?? []) {
        if (!pattern.has(word)) continue;
        seen += 1;
        const [t] = checker.readLine(word);
        expect(t?.reading?.kind, word).toBe('lexical');
        expect(t?.reading?.readings[0]?.gloss, word).toBe(pattern.get(word));
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('reads an unattested pair of the pattern by its predictable reading', () => {
    const pc = v20.image_compounds;
    if (pc === undefined) throw new Error('no pattern');
    const idToRoot = new Map(heads.map((h) => [h.id, h.root]));
    const [modId, mod] = Object.entries(pc.modifiers)[0] ?? [];
    const headId = Object.keys(pc.heads).find((h) => {
      const word = `${idToRoot.get(modId ?? '') ?? ''}${idToRoot.get(h) ?? ''}`;
      return !byRoot.has(word) && !attested.some((a) => a.root === word);
    });
    const word = `${idToRoot.get(modId ?? '') ?? ''}${idToRoot.get(headId ?? '') ?? ''}`;
    const [t] = checker.readLine(word);
    expect(t?.reading?.kind, word).toBe('lexical');
    const gloss = String(t?.reading?.readings[0]?.gloss ?? '');
    expect(gloss.startsWith(mod?.as_modifier ?? '?'), `${word}: ${gloss}`).toBe(true);
  });
});
