import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { auditBuild, type LexiconChangeset } from '../../src/core/change/apply';
import { validateChangeset } from '../../src/core/change/changelog';
import type { RawLexicon } from '../../src/core/model/raw';
import { WORD_BUILDING_2_0 } from '../../scripts/integrate_2_0';
import { build2_1 } from '../../scripts/integrate_2_1';
import { type Checker, loadChecker } from '../checker/loadChecker';

/**
 * Liraasa 2.1 (ADR-0017): built from the frozen 2.0 by the changeset made from
 * the author's patch. A respelling keeps every id and meaning; every form,
 * compound, image compound and derivation the patch lists comes out as listed.
 */

const text = (path: string): string =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const json = (path: string): unknown => JSON.parse(text(path));

const v20 = json('../../data/lexicon/liraasa_2_0.json') as RawLexicon;
const onDisk = text('../../data/lexicon/liraasa_2_1.json');
const v21 = JSON.parse(onDisk) as RawLexicon;
const cs = json('../../data/changes/2026-10-18-lexicon-2-1.json') as LexiconChangeset;

interface PatchForm {
  old: string;
  new: string;
}
interface Patch {
  roots: { old: string; new: string; becomes_compound: string | null; forms: PatchForm[] }[];
  compounds: { old: string; new: string; forms: PatchForm[] }[];
  listed_derivations: PatchForm[];
  image_engine: { attested_renamed: PatchForm[] };
}
const patch = json('../../data/proposals/liraasa_2_1_patch.json') as Patch;

interface Head {
  id: string;
  root: string;
  type: string;
  components: string[] | null;
  glosses: Record<string, string>;
  forms: Record<string, string>;
}
const entries = (lex: RawLexicon): Head[] => [
  ...(lex.headwords as unknown as Head[]),
  ...((lex.image_compounds?.attested ?? []) as unknown as Head[]),
];
const byId = (lex: RawLexicon): Map<string, Head> => new Map(entries(lex).map((h) => [h.id, h]));
const migration = v21.legacy.migration_forms;

let checker: Checker;
beforeAll(() => {
  checker = loadChecker().checker;
});

describe('the 2.1 build', () => {
  it('is reproducible: rebuilding from 2.0 gives the file on disk, byte for byte', () => {
    expect(build2_1().text).toBe(onDisk);
  });

  it('passes its structural audit with the counts the patch promised', () => {
    const audit = auditBuild(v21, WORD_BUILDING_2_0);
    expect(audit.findings).toEqual([]);
    expect(audit.counts).toMatchObject({
      headwords: 1462,
      primalRoots: 472,
      compounds: 990,
      forms: 10234,
      distinctForms: 10234,
      lexicalisedDerivations: 106,
    });
    expect(v21.image_compounds?.attested).toHaveLength(391);
    expect(v21.version).toBe('2.1');
  });

  it('is traceable: every op has a reason and a ruling, and the changeset validates', () => {
    expect(() => {
      validateChangeset(cs);
    }).not.toThrow();
    for (const op of cs.ops) {
      expect(op.reason.trim().length, op.entry).toBeGreaterThan(0);
      expect(op.ruling, op.entry).toMatch(/^2\.1:G\d+$/);
    }
    const count = (op: string): number => cs.ops.filter((o) => o.op === op).length;
    expect({
      rulings: count('add_ruling'),
      respelled: count('respell_root'),
      becameCompounds: count('respell_as_compound'),
    }).toEqual({ rulings: 14, respelled: 28, becameCompounds: 2 });
  });

  it('keeps grammar, the clause template and the inflection rules byte-identical to 2.0', () => {
    expect(v21.grammar).toEqual(v20.grammar);
    expect(v21.morphology.seven_forms).toEqual(v20.morphology.seven_forms);
    expect(v21.morphology.verb_rule).toEqual(v20.morphology.verb_rule);
    expect(v21.phonology).toEqual(v20.phonology);
  });
});

describe('the respelling (2.1:G58, G59)', () => {
  it('keeps every id, every meaning and every empty slot', () => {
    const before = byId(v20);
    const after = byId(v21);
    expect([...after.keys()].sort()).toEqual([...before.keys()].sort());
    for (const [id, h] of before) expect(after.get(id)?.glosses, id).toEqual(h.glosses);
  });

  it('builds every form, compound, derivation and image compound exactly as the patch lists', () => {
    const pairs = [
      ...patch.roots.flatMap((r) => r.forms),
      ...patch.compounds.flatMap((c) => c.forms),
      ...patch.listed_derivations,
      ...patch.image_engine.attested_renamed,
    ];
    expect(pairs.length).toBeGreaterThan(500);
    for (const p of pairs) expect(migration[p.old]?.to, p.old).toBe(p.new);
    for (const d of patch.listed_derivations) {
      expect(v21.morphology.lexicalised_derivations, d.new).toHaveProperty(d.new);
      expect(v21.morphology.lexicalised_derivations).not.toHaveProperty(d.old);
    }
  });

  it('turns taha and volda into compounds that keep their ids (2.1:G59)', () => {
    const after = byId(v21);
    for (const r of patch.roots.filter((x) => x.becomes_compound !== null)) {
      const was = entries(v20).find((h) => h.root === r.old);
      const now = after.get(was?.id ?? '');
      expect(now?.root, r.old).toBe(r.new);
      expect(now?.type).toBe('Compound');
      expect(now?.components?.join('+')).toBe(r.becomes_compound);
    }
  });

  it('retires every 2.0 spelling: none is active in 2.1', () => {
    const active = new Set(entries(v21).flatMap((h) => Object.values(h.forms)));
    for (const r of patch.roots)
      for (const f of r.forms) expect(active.has(f.old), f.old).toBe(false);
  });

  it('leaves no direct question without its final ki (2.1:G46)', () => {
    const live = v21.examples.filter((e) => e.status !== 'HISTORICAL');
    // ki may close the clause before a vocative (1.2:G31); "Ata?" (So?) is a bare discourse
    // particle, not a clause (the author's 2.1 review, 2026-10-19)
    const open = live
      .map((e) => e.liraasa)
      .filter((l) => /[A-Za-z]\?/.test(l) && !/\bki[?,]/.test(l) && /^[A-Z]/.test(l));
    expect(open).toEqual(['Ata?']);
  });
});

describe('read by the checker', () => {
  it('reads the rewritten questions clean', () => {
    const serious = (line: string) =>
      checker.checkLine(line, 1).filter((d) => d.severity === 'error' || d.severity === 'warn');
    for (const line of [
      'Taivo pagopa ki-pago ki?',
      'Li bumre ka bezinasan. Li bezi ka ki-pago ki?',
      'Maivo desida, hema, baba buzakova de miru.',
    ]) {
      expect(serious(line), line).toEqual([]);
    }
  });

  it('reports a 2.0 spelling as a legacy spelling with its 2.1 replacement', () => {
    const [t] = checker.readLine('vurlova');
    expect(JSON.stringify(t)).toContain('desida');
  });
});
