/**
 * Stable ids (ADR-0006, ADR-0008).
 *
 * Assigned once on first import and never changed — not on respell, not on
 * retire, not on merge. The spelling slug inside an id is a reading
 * convenience; the id is opaque and is never re-derived from a spelling.
 *
 * **Storage depends on the edition (Q3).** For the released, frozen 1.0 the
 * ids live only in the `ids.json` sidecar so the canonical file stays
 * byte-identical. From 1.1 on they are written into the JSON as an additive
 * `id` field, which the author's Python tools ignore.
 */

export const ID_PREFIX = {
  headword: 'lx',
  functionWord: 'fw',
  pronoun: 'pn',
  correlative: 'cr',
  timeWord: 'tw',
  color: 'cl',
  discourseParticle: 'dp',
} as const;

export type IdKind = keyof typeof ID_PREFIX;

/** Where a given edition keeps its ids. */
export type IdStorage = 'sidecar' | 'inline';

export function idStorageFor(edition: string): IdStorage {
  return edition === '1.0' || edition === '0.8' ? 'sidecar' : 'inline';
}

/** Lowercase, strip anything outside the alphabet, cap the length. */
function slugify(spelling: string): string {
  const slug = spelling.toLowerCase().replace(/[^a-z]/g, '');
  return slug.length > 0 ? slug.slice(0, 24) : 'x';
}

export function formatId(kind: IdKind, spelling: string, sequence: number): string {
  const n = sequence.toString().padStart(4, '0');
  return `${ID_PREFIX[kind]}_${slugify(spelling)}_${n}`;
}

/**
 * The persisted id map: `kind` → natural key → id.
 *
 * The natural key is the spelling **at first import**. It is how an existing id
 * is found again on reload; once assigned, the id outlives any respelling, and
 * the map records the key it was minted under.
 */
export interface IdMapFile {
  version: 1;
  edition: string;
  minted: Record<string, Record<string, string>>;
  /** Next sequence number per kind. */
  next: Record<string, number>;
}

export function emptyIdMap(edition: string): IdMapFile {
  return { version: 1, edition, minted: {}, next: {} };
}

export class IdAssigner {
  private readonly minted: Map<IdKind, Map<string, string>>;
  private readonly next: Map<IdKind, number>;
  private readonly used = new Set<string>();
  private mintedCount = 0;

  constructor(file: IdMapFile = emptyIdMap('')) {
    this.minted = new Map();
    this.next = new Map();

    for (const [kind, entries] of Object.entries(file.minted)) {
      const inner = new Map(Object.entries(entries));
      this.minted.set(kind as IdKind, inner);
      for (const id of inner.values()) this.used.add(id);
    }
    for (const [kind, n] of Object.entries(file.next)) {
      this.next.set(kind as IdKind, n);
    }
  }

  /** How many ids this assigner has minted (as opposed to reused). */
  get newlyMinted(): number {
    return this.mintedCount;
  }

  /**
   * The id for a natural key, minting one on first sight.
   *
   * `preexisting` is an `id` already present in the data; when given it is
   * adopted rather than replaced, so an inline id always wins over the sidecar.
   */
  assign(kind: IdKind, naturalKey: string, preexisting?: string): string {
    let inner = this.minted.get(kind);
    if (inner === undefined) {
      inner = new Map();
      this.minted.set(kind, inner);
    }

    if (preexisting !== undefined && preexisting.length > 0) {
      inner.set(naturalKey, preexisting);
      this.used.add(preexisting);
      return preexisting;
    }

    const existing = inner.get(naturalKey);
    if (existing !== undefined) return existing;

    let sequence = this.next.get(kind) ?? 1;
    let id = formatId(kind, naturalKey, sequence);
    while (this.used.has(id)) {
      sequence += 1;
      id = formatId(kind, naturalKey, sequence);
    }

    inner.set(naturalKey, id);
    this.used.add(id);
    this.next.set(kind, sequence + 1);
    this.mintedCount += 1;
    return id;
  }

  /** Serialise for `data/lexicon/ids.json`, with keys sorted for a stable diff. */
  toFile(edition: string): IdMapFile {
    const minted: Record<string, Record<string, string>> = {};
    for (const [kind, inner] of [...this.minted.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      minted[kind] = Object.fromEntries(
        [...inner.entries()].sort(([a], [b]) => a.localeCompare(b)),
      );
    }

    const next = Object.fromEntries(
      [...this.next.entries()].sort(([a], [b]) => a.localeCompare(b)),
    );

    return { version: 1, edition, minted, next };
  }
}
