import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { auditBuild, type LexiconChangeset } from '../../src/core/change/apply';
import { validateChangeset } from '../../src/core/change/changelog';
import { correctText } from '../../src/core/change/respell';
import type { RawLexicon } from '../../src/core/model/raw';
import { since20, type AlbumReading, type AlbumSong } from '../../scripts/build_album';
import { WORD_BUILDING_2_0 } from '../../scripts/integrate_2_0';
import { build2_2 } from '../../scripts/integrate_2_2';
import { type Checker, loadChecker } from '../checker/loadChecker';

/**
 * Liraasa 2.2 (ADR-0018): built from frozen 2.1 by the changeset made from the
 * author's patch. The checks of the patch's step 5 (LIRAASA_2_2_PATCH.md).
 */

const text = (path: string): string =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const json = (path: string): unknown => JSON.parse(text(path));

const v20 = json('../../data/lexicon/liraasa_2_0.json') as RawLexicon;
const v21 = json('../../data/lexicon/liraasa_2_1.json') as RawLexicon;
const onDisk = text('../../data/lexicon/liraasa_2_2.json');
const v22 = JSON.parse(onDisk) as RawLexicon;
const cs = json('../../data/changes/2026-10-19-lexicon-2-2.json') as LexiconChangeset;

interface Revert {
  from_2_1: string;
  restore: string;
  forms?: { from_2_1: string; restore: string }[];
}
interface Patch {
  rulings: { id: string; examples: string[] }[];
  superseded: Record<string, string>;
  lexicon: {
    fill_slots: { headword: string; form: string; gloss: string }[];
    revert_silro: {
      root: {
        from_2_1: string;
        restore_2_0: string;
        forms: { from_2_1: string; restore: string }[];
      };
      compounds: Revert[];
      image_engine: { modifier: Revert; attested: Revert[] };
    };
  };
}
const patch = json('../../data/proposals/liraasa_2_2_patch.json') as Patch;
const album = (
  json('../../data/corpus/album_2_0/liraasa_album_corpus.json') as { songs: AlbumSong[] }
).songs;
const readings = (
  json('../../data/corpus/album_2_0/album_readings.json') as { readings: AlbumReading[] }
).readings;

interface Head {
  id: string;
  root: string;
  forms: Record<string, string>;
  glosses: Record<string, string>;
}
const entries = (lex: RawLexicon): Head[] => [
  ...(lex.headwords as unknown as Head[]),
  ...((lex.image_compounds?.attested ?? []) as unknown as Head[]),
];
const live = new Set(entries(v22).flatMap((h) => Object.values(h.forms)));

let checker: Checker;
beforeAll(() => {
  checker = loadChecker().checker;
});

/** The word tokens of a line the checker cannot read. */
const unread = (line: string): string[] =>
  checker
    .readLine(line)
    .filter(
      (t) => t.type === 'word' && ((t.reading ?? null) === null || t.reading?.kind === 'unknown'),
    )
    .map((t) => t.text);

describe('the 2.2 build', () => {
  it('is reproducible: rebuilding from 2.1 gives the file on disk, byte for byte', () => {
    expect(build2_2().text).toBe(onDisk);
  });

  it('passes its audit; headwords stay 1462, and two more forms carry meaning', () => {
    const audit = auditBuild(v22, WORD_BUILDING_2_0);
    expect(audit.findings).toEqual([]);
    expect(audit.counts).toMatchObject({ headwords: 1462, primalRoots: 472, compounds: 990 });
    const meaningful = (lex: RawLexicon): number =>
      (lex.headwords as unknown as Head[])
        .flatMap((h) => Object.values(h.glosses))
        .filter((g) => !g.includes('(unused)')).length;
    expect(meaningful(v22) - meaningful(v21)).toBe(2);
    expect(v22.version).toBe('2.2');
  });

  it('is traceable: every op has a reason and a ruling, and the changeset validates', () => {
    expect(() => {
      validateChangeset(cs);
    }).not.toThrow();
    for (const op of cs.ops) expect(op.ruling, op.entry).toMatch(/^2\.2:G\d+$/);
  });
});

describe('the rulings (step 1)', () => {
  it('adds G60–G68, and supersedes without deleting, renumbering or rewording', () => {
    expect((v22.rulings_2_2 ?? []).map((r) => r.id)).toEqual(
      Array.from({ length: 9 }, (_, i) => `G${String(60 + i)}`),
    );
    for (const key of Object.keys(v21).filter((k) => k.startsWith('rulings_'))) {
      const before = v21[key] as { id: string; ruling: string }[];
      const after = v22[key] as { id: string; ruling: string; superseded_by?: string }[];
      expect(
        after.map((r) => r.id),
        key,
      ).toEqual(before.map((r) => r.id));
      // the ruling text changes only where silro comes back (2.2 respelling)
      for (const [i, r] of after.entries())
        expect(r.ruling.replace(/silro/g, 'puzu'), r.id).toBe(before[i]?.ruling);
    }
    const g = (key: string, id: string): Record<string, unknown> | undefined =>
      (v22[key] as { id: string }[]).find((r) => r.id === id) as Record<string, unknown>;
    expect(g('rulings_2_1', 'G46')?.superseded_by).toBe('2.2:G60');
    expect(g('rulings_2_1', 'G47')?.superseded_by).toBe('2.2:G61');
    expect(g('rulings_2_1', 'G54')?.superseded_by).toBe('2.2:G62');
    // only the embedded wh-question clause of 0.8:G4; its quotation clause stands
    expect(g('rulings_0_8_carried', 'G4')?.superseded_by).toBeUndefined();
    expect(g('rulings_0_8_carried', 'G4')?.superseded_in_part).toEqual([
      { clause: 'embedded wh-word stays in place', by: '2.2:G60' },
    ]);
  });

  it('every word in the examples of G60–G68 resolves in 2.2 (step 5.1)', () => {
    for (const r of patch.rulings) for (const e of r.examples) expect(unread(e), e).toEqual([]);
  });
});

describe('the lexicon (step 2)', () => {
  const revert = patch.lexicon.revert_silro;
  const pairs = [
    ...revert.root.forms,
    ...revert.compounds.flatMap((c) => c.forms ?? []),
    ...revert.image_engine.attested,
  ];

  it('restores silro: 1 root, 12 compounds, 8 image compounds, with their ids', () => {
    expect(revert.compounds).toHaveLength(12);
    expect(revert.image_engine.attested).toHaveLength(8);
    const before = new Map(entries(v21).map((h) => [h.root, h.id]));
    const after = new Map(entries(v22).map((h) => [h.id, h.root]));
    const root = { from_2_1: revert.root.from_2_1, restore: revert.root.restore_2_0 };
    for (const c of [root, ...revert.compounds, ...revert.image_engine.attested])
      expect(after.get(before.get(c.from_2_1) ?? ''), c.from_2_1).toBe(c.restore);
    for (const p of pairs) expect(live.has(p.restore), p.restore).toBe(true);
    // and every restored spelling is the 2.0 one, form for form
    const was = new Set(entries(v20).flatMap((h) => Object.values(h.forms)));
    for (const p of pairs) expect(was.has(p.restore), p.restore).toBe(true);
  });

  it('retires puzu: readable through the legacy table, alive nowhere else (step 5.2)', () => {
    const migration = v22.legacy.migration_forms;
    for (const p of pairs) expect(migration[p.from_2_1]?.to, p.from_2_1).toBe(p.restore);
    for (const p of pairs) expect(migration[p.restore], p.restore).toBeUndefined();
    expect([...live].filter((f) => f.includes('puzu'))).toEqual([]);
    const { legacy: _legacy, changesets_2_2: _note, ...rest } = v22;
    expect(JSON.stringify(rest)).not.toMatch(/puzu/);
    const row = v22.legacy.respelled_roots.find((r) => r.old === 'silro');
    expect((row as unknown as { reverted?: boolean }).reverted).toBe(true);
  });

  it('no two forms share a spelling (step 5.2)', () => {
    const forms = entries(v22).flatMap((h) => Object.values(h.forms));
    expect(new Set(forms).size).toBe(forms.length);
  });

  it('fills soloasa and tarnulinusan with the glosses the author confirmed', () => {
    const byRoot = new Map(entries(v22).map((h) => [h.root, h]));
    expect(byRoot.get('solo')?.glosses.ascended).toBe(
      'the living stone; a jewel of countless faces',
    );
    expect(byRoot.get('tarnulinu')?.glosses.adjective).toBe('boyish; like a son');
  });
});

describe('the album (step 3)', () => {
  it('holds 12 tracks and the alternate 05, and 16 readings on their recorded lines', () => {
    expect(album.map((s) => s.track)).toEqual([
      ...Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')),
      '05alt',
    ]);
    expect(readings.map((r) => r.id)).toEqual(
      Array.from({ length: 16 }, (_, i) => `AR-${String(i + 1).padStart(2, '0')}`),
    );
    for (const r of readings) {
      const line = album.find((s) => s.track === r.track)?.lines.find((l) => l.n === r.line);
      expect(line?.recorded, r.id).toBe(r.recorded);
    }
  });

  it('recomputes every current spelling from the live lexicon, as the patch has it', () => {
    const mapping = since20(v22, v20);
    for (const s of album) {
      for (const l of s.lines) {
        const r = correctText(l.recorded, mapping);
        expect(r.changed > 0 ? r.text : null, `${s.track}:${String(l.n)}`).toBe(l.spelling_2_2);
      }
    }
  });

  it('every album line resolves under the 2.0 reading (step 5.3)', () => {
    const was = new Set(entries(v20).flatMap((h) => Object.values(h.forms)));
    const filled = new Set(patch.lexicon.fill_slots.map((f) => f.form));
    for (const s of album) {
      for (const l of s.lines) {
        expect(unread(l.recorded), `${s.track}:${String(l.n)}`).toEqual([]);
        // a word read as a legacy spelling is a 2.0 spelling, read under 2.0 (2.1:G58)
        for (const t of checker.readLine(l.recorded)) {
          if (t.reading?.kind === 'legacy')
            expect(was.has(t.text.toLowerCase()), t.text).toBe(true);
        }
      }
    }
    // the two filled forms are words now
    for (const f of filled) expect(checker.readLine(f)[0]?.reading?.kind, f).toBe('lexical');
  });

  it('every non-null standard form resolves in 2.2 (step 5.1)', () => {
    for (const r of readings)
      if (r.standard_form !== null) expect(unread(r.standard_form), r.id).toEqual([]);
  });
});
