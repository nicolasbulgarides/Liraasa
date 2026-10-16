import { describe, expect, it } from 'vitest';
import {
  ChangelogError,
  toAuthorChangelogRows,
  validateChangeRecord,
  validateChangeset,
  type ChangeRecord,
} from './changelog';

const base: ChangeRecord = {
  entry: 'lx_yomla_0712',
  op: 'respell_root',
  slot: 'root',
  from: 'yoga',
  to: 'yomla',
  addedIn: '1.1-draft',
  reason: "Reads as English 'yoga' inside Merrowind.",
  at: '2026-10-16T18:00:00Z',
  author: 'nicolas',
};

describe('validateChangeRecord', () => {
  it('accepts a traceable record', () => {
    expect(() => {
      validateChangeRecord(base);
    }).not.toThrow();
  });

  it('requires an entry id', () => {
    expect(() => {
      validateChangeRecord({ ...base, entry: '' });
    }).toThrow(ChangelogError);
  });

  it('requires a reason, because a change without one is not traceable', () => {
    expect(() => {
      validateChangeRecord({ ...base, reason: '   ' });
    }).toThrow(/reason/);
  });

  it('requires a from or a to', () => {
    expect(() => {
      validateChangeRecord({ ...base, from: null, to: null });
    }).toThrow(/from or a to/);
  });

  it('requires a ruling reference to activate an unused slot (0.8:R2)', () => {
    const activate: ChangeRecord = {
      ...base,
      op: 'activate_slot',
      slot: 'ascended',
      from: null,
      to: 'a new gloss',
    };
    expect(() => {
      validateChangeRecord(activate);
    }).toThrow(/ruling reference/);
    expect(() => {
      validateChangeRecord({ ...activate, ruling: '0.8:R2' });
    }).not.toThrow();
  });
});

describe('validateChangeset', () => {
  it('rejects an empty changeset', () => {
    expect(() => {
      validateChangeset({
        id: 'cs_1',
        edition: '1.1-draft',
        created: base.at,
        author: 'nicolas',
        summary: 'nothing',
        ops: [],
      });
    }).toThrow(/at least one operation/);
  });
});

describe('toAuthorChangelogRows', () => {
  it('renders in the shape of the author own changelog_1_0 rows', () => {
    const rows = toAuthorChangelogRows(
      {
        id: 'cs_1',
        edition: '1.1-draft',
        created: base.at,
        author: 'nicolas',
        summary: 'Respell yoga',
        ops: [base],
      },
      () => 'yomla',
    );
    expect(rows).toEqual([
      {
        stage: 'respell-root',
        item: 'yomla',
        detail: "root: yoga → yomla — Reads as English 'yoga' inside Merrowind.",
      },
    ]);
  });

  it('shows a retirement as a null target and cites the ruling', () => {
    const rows = toAuthorChangelogRows(
      {
        id: 'cs_2',
        edition: '1.1-draft',
        created: base.at,
        author: 'nicolas',
        summary: 'Retire',
        ops: [
          {
            ...base,
            op: 'retire_root',
            to: null,
            ruling: '1.0:G19',
            reason: 'Expressible as a compound.',
          },
        ],
      },
      () => 'kronobelda',
    );
    expect(rows[0]?.detail).toBe('root: yoga → (retired) — Expressible as a compound. [1.0:G19]');
  });
});
