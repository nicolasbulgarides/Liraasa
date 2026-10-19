import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { auditBuild, type LexiconChangeset } from '../../src/core/change/apply';
import { validateChangeset } from '../../src/core/change/changelog';
import { correctText } from '../../src/core/change/respell';
import type { RawLexicon } from '../../src/core/model/raw';
import { since20, type AlbumSong } from '../../scripts/build_album';
import { WORD_BUILDING_2_0 } from '../../scripts/integrate_2_0';
import { build2_3 } from '../../scripts/integrate_2_3';
import { type Checker, loadChecker } from '../checker/loadChecker';

/**
 * Liraasa 2.3 (ADR-0019): built from frozen 2.2 by the changeset made from the
 * author's sound-pass patch (data/proposals/liraasa_2_3_patch.json). Every
 * pair, count, example and album line the patch lists, as built.
 */

const text = (path: string): string =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const json = (path: string): unknown => JSON.parse(text(path));

const v20 = json('../../data/lexicon/liraasa_2_0.json') as RawLexicon;
const v22 = json('../../data/lexicon/liraasa_2_2.json') as RawLexicon;
const onDisk = text('../../data/lexicon/liraasa_2_3.json');
const v23 = JSON.parse(onDisk) as RawLexicon;
const cs = json('../../data/changes/2026-10-19-lexicon-2-3.json') as LexiconChangeset;

interface Patch {
  counts: Record<string, number>;
  root_respellings: { old: string; new: string }[];
  headword_migration: { old: string; new: string; new_parts: string | null }[];
  form_migration: { old: string; new: string; gloss: string }[];
  lexicalised_derivations: { old: string; new: string | null; new_listing?: string }[];
  album_read_today: { track: string; line: number; current_after_patch: string }[];
  example_sentences: { path: string; before: string; after: string }[];
  rulings_left_verbatim: { path: string; text: string }[];
  token_map: Record<string, string>;
}
const patch = json('../../data/proposals/liraasa_2_3_patch.json') as Patch;
const album = (
  json('../../data/corpus/album_2_0/liraasa_album_corpus.json') as { songs: AlbumSong[] }
).songs;

interface Head {
  id: string;
  root: string;
  type: string;
  components: string[] | null;
  forms: Record<string, string>;
  glosses: Record<string, string>;
}
const entries = (lex: RawLexicon): Head[] => [
  ...(lex.headwords as unknown as Head[]),
  ...((lex.image_compounds?.attested ?? []) as unknown as Head[]),
];
const live = new Set(entries(v23).flatMap((h) => Object.values(h.forms)));
const byRoot = new Map(entries(v23).map((h) => [h.root, h]));

let checker: Checker;
beforeAll(() => {
  checker = loadChecker().checker;
});

describe('the 2.3 build', () => {
  it('is reproducible: rebuilding from 2.2 gives the file on disk, byte for byte', () => {
    expect(build2_3().text).toBe(onDisk);
  });

  it('passes its audit, with the patch’s counts', () => {
    const audit = auditBuild(v23, WORD_BUILDING_2_0);
    expect(audit.findings).toEqual([]);
    expect(audit.counts).toMatchObject({
      headwords: patch.counts.headwords_after,
      primalRoots: patch.counts.roots_after,
      compounds: patch.counts.compounds_after,
    });
    const meaningful = (v23.headwords as unknown as Head[])
      .flatMap((h) => Object.values(h.glosses))
      .filter((g) => !g.includes('(unused)')).length;
    expect(meaningful).toBe(patch.counts.meaningful_forms_after);
    expect(v23.version).toBe('2.3');
  });

  it('is traceable: every op has a reason and a 2.3 ruling, and the changeset validates', () => {
    expect(() => {
      validateChangeset(cs);
    }).not.toThrow();
    for (const op of cs.ops) expect(op.ruling, op.entry).toMatch(/^2\.3:G\d+$/);
  });
});

describe('the rulings', () => {
  const g = (lex: RawLexicon, key: string, id: string): Record<string, unknown> | undefined =>
    (lex[key] as { id: string }[]).find((r) => r.id === id) as Record<string, unknown>;

  it('adds G69–G86 and keeps every earlier ruling, renumbering none', () => {
    expect((v23.rulings_2_3 ?? []).map((r) => r.id)).toEqual(
      Array.from({ length: 18 }, (_, i) => `G${String(69 + i)}`),
    );
    for (const key of Object.keys(v22).filter((k) => k.startsWith('rulings_')))
      expect(
        (v23[key] as { id: string }[]).map((r) => r.id),
        key,
      ).toEqual((v22[key] as { id: string }[]).map((r) => r.id));
  });

  it('supersedes the wolf clause of 2.1:G59 and keeps its text as ruled', () => {
    const before = g(v22, 'rulings_2_1', 'G59');
    const after = g(v23, 'rulings_2_1', 'G59');
    expect(after?.ruling).toBe(before?.ruling);
    expect(after?.ruling).toBe(patch.rulings_left_verbatim[0]?.text);
    expect(after?.superseded_by).toBeUndefined();
    expect(after?.superseded_in_part).toEqual([
      { clause: 'volda -> larbopagobudi (larbopago + budi)', by: '2.3:G71' },
    ]);
  });

  it('carries a living ruling’s example into 2.3 spelling, and archives its old text', () => {
    // the author's answer of 2026-10-19: G69 applies 2.1:G58 in full, so the example
    // follows; its 2.2 text is retired to the archive (review changeset)
    const g28 = g(v23, 'rulings_1_2', 'G28') as { examples: [string, string][] };
    expect(g28.examples[2]?.[0]).toBe('Maivo po vimova muya zimziri en li folni.');
    expect(v23.legacy.archived_text?.[0]).toMatchObject({
      entry: '1.2:G28',
      field: 'example:2',
      text: 'Maivo po vimova muya jemlari en li folni.',
      archived_in: '2.3',
    });
  });
});

describe('the respellings (2.3:G69–G71)', () => {
  it('maps every spelling the patch lists to its new spelling, and none is alive', () => {
    const migration = v23.legacy.migration_forms;
    for (const [old, now] of Object.entries(patch.token_map)) {
      expect(migration[old]?.to, old).toBe(now);
      expect(live.has(old), old).toBe(false);
    }
  });

  it('keeps every headword’s id, with the parts the patch lists', () => {
    const before = new Map(entries(v22).map((h) => [h.root, h.id]));
    for (const m of patch.headword_migration) {
      const h = byRoot.get(m.new);
      expect(h?.id, m.new).toBe(before.get(m.old));
      expect(h?.components?.join('+') ?? null, m.new).toBe(m.new_parts);
    }
  });

  it('gives every respelled form the meaning it had', () => {
    for (const f of patch.form_migration) {
      const h = entries(v23).find((x) => Object.values(x.forms).includes(f.new));
      const slot = Object.entries(h?.forms ?? {}).find(([, v]) => v === f.new)?.[0] ?? '';
      expect(h?.glosses[slot], f.new).toBe(f.gloss);
    }
  });

  it('makes bear and cow roots, and rebuilds wolf and werewolf on farvi', () => {
    expect(byRoot.get('bumbo')).toMatchObject({ type: 'Primal', components: null });
    expect(byRoot.get('murmu')).toMatchObject({ type: 'Primal', components: null });
    expect(byRoot.get('farvibudi')?.components).toEqual(['farvi', 'budi']);
    expect(byRoot.get('lunofarvibudi')?.components).toEqual(['luno', 'farvibudi']);
    // 2.1's volda reads straight through to the 2.3 spelling
    expect(v23.legacy.migration_forms.volda?.to).toBe('farvibudi');
  });

  it('makes frog the new root kerku, and retires mirunululirayo for it', () => {
    const kerku = byRoot.get('kerku');
    expect(kerku).toMatchObject({ type: 'Primal', components: null });
    expect(kerku?.glosses.root).toBe('frog');
    expect(kerku?.forms.verb).toBe('kerkuka');
    expect(kerku?.glosses.verb).toBe('to croak');
    const table = v23.morphology.lexicalised_derivations;
    expect(table.mirunululirayo).toBeUndefined();
    expect(v23.legacy.migration_forms.mirunululirayo).toMatchObject({
      to: 'kerku',
      kind: 'retired',
    });
    // river-song stays
    expect(byRoot.get('mirunululira')?.glosses.root).toMatch(/river-song/);
    for (const d of patch.lexicalised_derivations)
      if (d.new !== null) expect(table[d.new], d.new).toBe(d.new_listing);
  });

  it('archives the stale history of bear, cow and river-song, keeping what still holds', () => {
    const archived = new Map(
      (v23.legacy.archived_text ?? []).filter((a) => a.field === 'notes').map((a) => [a.entry, a]),
    );
    for (const w of ['bumbo', 'murmu', 'mirunululira']) {
      const h = byRoot.get(w) as (Head & { notes: string }) | undefined;
      const before = entries(v22).find((x) => x.id === h?.id) as { notes: string } | undefined;
      expect(archived.get(h?.id ?? '')?.text, w).toBe(before?.notes);
      expect(h?.notes, w).toBe(archived.get(h?.id ?? '')?.now);
      expect(h?.notes, w).toMatch(/^Added in 2\.0 \(changeset 2026-10-18-lexicon-2-0\)\./);
      expect(h?.notes, w).not.toMatch(/regna|milk-animal|base for frog/);
    }
  });

  it('respells the example sentences the patch lists', () => {
    const sentences = new Set(v23.examples.map((e) => e.liraasa));
    for (const e of patch.example_sentences) expect(sentences.has(e.after), e.after).toBe(true);
  });

  it('no two forms share a spelling', () => {
    const forms = entries(v23).flatMap((h) => Object.values(h.forms));
    expect(new Set(forms).size).toBe(forms.length);
  });
});

describe('the album, read today', () => {
  it('respells exactly the lines the patch lists, as it lists them', () => {
    const mapping = since20(v23, v20);
    const before = since20(v22, v20);
    const changed = album.flatMap((s) =>
      s.lines
        .filter(
          (l) => correctText(l.recorded, mapping).text !== correctText(l.recorded, before).text,
        )
        .map((l) => ({
          track: s.track,
          line: l.n,
          current_after_patch: correctText(l.recorded, mapping).text,
        })),
    );
    expect(changed).toEqual(
      patch.album_read_today.map((a) => ({
        track: a.track,
        line: a.line,
        current_after_patch: a.current_after_patch,
      })),
    );
  });

  it('the checker reads an older spelling, ending and all, and names its 2.3 spelling', () => {
    const [d] = checker
      .checkLine('li merasan minva po milobema ala saivo de lenrari.', 1)
      .filter((x) => x.rule === '1.0:G19');
    expect(d?.token).toBe('lenrari');
    expect(d?.fix).toBe('zarkuri');
    expect(d?.message).toMatch(/2\.3/);
  });
});
