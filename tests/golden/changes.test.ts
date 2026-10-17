import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { type Changeset, validateChangeset } from '../../src/core/change/changelog';
import { type Checker, loadChecker } from '../checker/loadChecker';

/**
 * The grammar changeset of 2026-10-17 (ADR-0012): traceable, aimed at the
 * example text it says it replaces, and clean under the checker it changed.
 */

interface RulingsChangeset extends Changeset {
  rulings: { id: string; topic: string; ruling: string; examples: [string, string][] }[];
}

const read = (path: string): unknown =>
  JSON.parse(readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8'));

const changeset = read('../../data/changes/2026-10-17-grammar-rulings.json') as RulingsChangeset;
const lexicon = read('../../data/lexicon/liraasa_1_1.json') as {
  examples: { liraasa: string }[];
};

let checker: Checker;
beforeAll(() => {
  checker = loadChecker().checker;
});

describe('the 1.2 grammar changeset', () => {
  it('is traceable: every op has an entry, a reason and a value', () => {
    expect(() => {
      validateChangeset(changeset);
    }).not.toThrow();
  });

  it('records an add_ruling op for every ruling, and nothing else', () => {
    const added = changeset.ops.filter((o) => o.op === 'add_ruling').map((o) => o.entry);
    expect(added).toEqual(changeset.rulings.map((r) => '1.2:' + r.id));
  });

  it('replaces example text that is really there', () => {
    for (const op of changeset.ops.filter((o) => o.op === 'edit_example')) {
      const index = Number(op.entry.replace('example:', ''));
      expect(lexicon.examples[index]?.liraasa, op.entry).toBe(op.from);
    }
  });

  it('every revised example and every ruling example checks clean', () => {
    const lines = [
      ...changeset.ops.filter((o) => o.op === 'edit_example').map((o) => o.to ?? ''),
      ...changeset.rulings.flatMap((r) => r.examples.map(([liraasa]) => liraasa)),
    ];
    const hits = lines.flatMap((line) =>
      checker
        .checkLine(line, 1, '', { register: 'poetic' })
        .filter((f) => f.severity === 'error' || f.severity === 'warn')
        .map((f) => line + ' :: ' + f.message),
    );
    expect(hits).toEqual([]);
  });
});
