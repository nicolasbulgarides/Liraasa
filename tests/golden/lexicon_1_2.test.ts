import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  applyChangesets,
  auditBuild,
  rhymeFamilies,
  type LexiconChangeset,
} from '../../src/core/change/apply';
import { validateChangeset } from '../../src/core/change/changelog';
import type { IdMapFile } from '../../src/core/model/ids';
import { serializeLexicon } from '../../src/core/model/exportLexicon';
import type { RawLexicon } from '../../src/core/model/raw';
import { type Checker, loadChecker } from '../checker/loadChecker';

/**
 * Liraasa 1.2 (ADR-0013): built from the frozen 1.1 by the two 1.2
 * changesets, reproducibly, and clean under the editor's checker.
 */

const text = (path: string): string =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const json = (path: string): unknown => JSON.parse(text(path));

const v10 = json('../../data/lexicon/liraasa_1_0.json') as RawLexicon;
const v11 = json('../../data/lexicon/liraasa_1_1.json') as RawLexicon;
const onDisk = text('../../data/lexicon/liraasa_1_2.json');
const v12 = JSON.parse(onDisk) as RawLexicon;
const ids = json('../../data/lexicon/ids.json') as IdMapFile;
const grammar = json('../../data/changes/2026-10-17-grammar-rulings.json') as LexiconChangeset;
const lexiconCs = json('../../data/changes/2026-10-17-lexicon-1-2.json') as LexiconChangeset;

const build = () =>
  applyChangesets(v11, [grammar, lexiconCs], {
    version: '1.2',
    builtUtc: v12.built_utc,
    source: v12.source,
    ids,
  });

interface Head {
  root: string;
  type: string;
  since: string;
  id: string;
  glosses: Record<string, string>;
}
const heads = v12.headwords as unknown as Head[];

let checker: Checker;
beforeAll(() => {
  checker = loadChecker().checker;
});

describe('the 1.2 build', () => {
  it('is reproducible: rebuilding from 1.1 gives the file on disk, byte for byte', () => {
    expect(serializeLexicon(build().lexicon)).toBe(onDisk);
  });

  it('passes its structural audit with the expected counts', () => {
    const audit = auditBuild(v12);
    expect(audit.findings).toEqual([]);
    expect(audit.counts).toMatchObject({
      headwords: 1497,
      primalRoots: 464,
      compounds: 1033,
      forms: 10479,
      distinctForms: 10479,
      functionWords: 151,
      correlatives: 39,
      lexicalisedDerivations: 29,
    });
    expect(heads.filter((h) => h.since === '1.2')).toHaveLength(79);
  });

  it('both changesets are traceable', () => {
    expect(() => {
      validateChangeset(grammar);
      validateChangeset(lexiconCs);
    }).not.toThrow();
  });

  it('keeps every 1.0 id from the sidecar and mints the rest without collision', () => {
    const sidecar = ids.minted.headword ?? {};
    for (const h of heads) {
      const old = sidecar[h.root];
      if (old !== undefined) expect(h.id).toBe(old);
    }
    expect(new Set(heads.map((h) => h.id)).size).toBe(heads.length);
    expect(heads.find((h) => h.root === 'lazu')?.id).toMatch(/^lx_lazu_1\d{3}$/);
  });

  it('rebuilds rhyme families the way build_1_0.py did', () => {
    expect(rhymeFamilies(v10.headwords.map((h) => h.root))).toEqual(v10.rhyme_families);
  });

  it('carries every 1.2 ruling, G24 to G36', () => {
    const r12 = (v12 as unknown as { rulings_1_2: { id: string }[] }).rulings_1_2;
    expect(r12.map((r) => r.id)).toEqual(
      Array.from({ length: 13 }, (_, i) => `G${String(24 + i)}`),
    );
  });

  it('archives the old sense of daigosan and repairs the protected-exceptions label', () => {
    const daigo = heads.find((h) => h.root === 'daigo');
    expect(daigo?.glosses.adjective).toBe('dead; mortal');
    const archived = (v12.legacy as unknown as { archived_senses: { word: string }[] })
      .archived_senses;
    expect(archived.map((a) => a.word)).toContain('daigosan');
    expect(v12.phonology.protected_exceptions.join(' ')).not.toContain('36 amor');
  });

  it('refuses a changeset written against another baseline', () => {
    const wrong = structuredClone(lexiconCs);
    const edit = wrong.ops.find((o) => o.op === 'edit_gloss');
    if (edit === undefined) throw new Error('no edit_gloss op');
    edit.from = 'not the 1.1 gloss';
    expect(() =>
      applyChangesets(v11, [grammar, wrong], {
        version: '1.2',
        builtUtc: v12.built_utc,
        source: '',
        ids,
      }),
    ).toThrow(/expected/);
  });
});

describe('1.2 text under the editor checker', () => {
  it('every 1.2 ruling example and every new function-word example checks clean', () => {
    const r12 = (v12 as unknown as { rulings_1_2: { id: string; examples?: [string, string][] }[] })
      .rulings_1_2;
    const lines = [
      ...r12.flatMap((r) => (r.examples ?? []).map(([l]) => l)),
      ...v12.function_words.flatMap((f) =>
        f.since === '1.2' && f.example !== null ? [f.example] : [],
      ),
    ];
    const hits = lines.flatMap((line) =>
      checker
        .checkLine(line, 1, '', { register: 'poetic' })
        .filter((f) => f.severity === 'error' || f.severity === 'warn')
        .map((f) => `${line} :: ${f.message}`),
    );
    expect(hits).toEqual([]);
  });

  it('reads yuta as a preposition and back-translates the new kin words', () => {
    expect(checker.backTranslate('Maivo de minvalinu lirala.').text).toMatch(/daughter/);
    expect(checker.backTranslate('Maivo lallela li dorbi yuta li kemye.').text).toMatch(/with/);
  });
});
