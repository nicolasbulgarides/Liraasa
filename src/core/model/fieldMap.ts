/**
 * The field map (ADR-0002).
 *
 * One declaration per field, used by both directions. Import decodes; export
 * re-encodes **only the fields that actually changed** and writes them back
 * into a clone of the source object. Unknown fields survive because they are
 * never touched, and key order survives because the object is never rebuilt
 * from scratch.
 *
 * This is what makes the round-trip lossless without a hand-written exporter
 * that can drift from the importer.
 */

export interface FieldSpec<Raw, Internal> {
  /** The key in the author's JSON. */
  readonly rawKey: string;
  /** The key on the internal record. */
  readonly key: string;
  /** Read the internal value out of the raw object. */
  readonly decode: (raw: Raw) => Internal;
  /** Write an internal value back into raw form. */
  readonly encode: (value: Internal, raw: Raw) => unknown;
  /**
   * Omitted from the output when the encoded value is `undefined`, rather than
   * written as `null`. 71 headwords have `replaces` and 1028 do not; emitting
   * `"replaces": null` on the rest would diff the author's file.
   */
  readonly optional?: boolean;
}

/** A field whose raw and internal values are the same, with no transform. */
export function plain<Raw, V>(rawKey: string, key: string = rawKey): FieldSpec<Raw, V> {
  return {
    rawKey,
    key,
    decode: (raw) => (raw as Record<string, unknown>)[rawKey] as V,
    encode: (value) => value,
  };
}

/** An optional field: absent in, absent out. */
export function optional<Raw, V>(rawKey: string, key: string = rawKey): FieldSpec<Raw, V> {
  return { ...plain<Raw, V>(rawKey, key), optional: true };
}

/** A field with an explicit codec pair. */
export function mapped<Raw, V>(
  rawKey: string,
  key: string,
  decode: (raw: Raw) => V,
  encode: (value: V, raw: Raw) => unknown,
  opts: { optional?: boolean } = {},
): FieldSpec<Raw, V> {
  return opts.optional === true
    ? { rawKey, key, decode, encode, optional: true }
    : { rawKey, key, decode, encode };
}

/**
 * An enum codec that round-trips an author-side spelling.
 *
 * `dispositions` spells the same decision `RETIRE` in one section and
 * `RETIRED` in another. Decoding normalises; encoding restores whichever
 * spelling that section used, taken from the raw object so a value the map
 * does not know about still survives.
 */
export function enumField<Raw>(
  rawKey: string,
  key: string,
  toInternal: Readonly<Record<string, string>>,
  opts: { optional?: boolean } = {},
): FieldSpec<Raw, string> {
  const toRaw = new Map(Object.entries(toInternal).map(([r, i]) => [i, r]));
  return mapped<Raw, string>(
    rawKey,
    key,
    (raw) => {
      const value = (raw as Record<string, unknown>)[rawKey];
      if (typeof value !== 'string') return value as string;
      return toInternal[value] ?? value;
    },
    (value, raw) => {
      const original = (raw as Record<string, unknown>)[rawKey];
      // Keep the author's own spelling when the value has not changed.
      if (typeof original === 'string' && (toInternal[original] ?? original) === value) {
        return original;
      }
      return toRaw.get(value) ?? value;
    },
    opts,
  );
}

export interface SectionMap<Raw, Internal extends object> {
  readonly name: string;
  readonly fields: readonly FieldSpec<Raw, never>[];
  /** Build the internal record. Called with the decoded fields merged in. */
  readonly finish?: (record: Internal, raw: Raw) => Internal;
}

/** Decode one raw object into a plain internal object (before `attachRaw`). */
export function decodeRecord<Raw, Internal extends object>(
  map: SectionMap<Raw, Internal>,
  raw: Raw,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of map.fields) {
    const spec = field as unknown as FieldSpec<Raw, unknown>;
    const value = spec.decode(raw);
    if (spec.optional === true && value === undefined) continue;
    out[spec.key] = value;
  }
  return out;
}

/**
 * Produce the raw object for an internal record.
 *
 * Starts from a shallow clone of the source so unknown fields and key order
 * survive, then writes back only the fields whose value differs from what
 * `decode` would have produced. When nothing changed, the result is
 * structurally identical to the source.
 */
export function encodeRecord<Raw extends object, Internal extends object>(
  map: SectionMap<Raw, Internal>,
  record: Internal,
  raw: Raw,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
  // Keys to drop, collected rather than deleted so key order is untouched.
  const omit = new Set<string>();

  for (const field of map.fields) {
    const spec = field as unknown as FieldSpec<Raw, unknown>;
    const current = (record as Record<string, unknown>)[spec.key];
    const asDecoded = spec.decode(raw);

    if (sameValue(current, asDecoded)) continue;

    const encoded = spec.encode(current, raw);
    if (spec.optional === true && encoded === undefined) {
      omit.add(spec.rawKey);
    } else {
      out[spec.rawKey] = encoded;
    }
  }

  if (omit.size === 0) return out;
  return Object.fromEntries(Object.entries(out).filter(([key]) => !omit.has(key)));
}

/** Structural comparison, enough for the scalar/array/object shapes here. */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => sameValue(x, b[i]));
  }
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) =>
      sameValue((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
    );
  }
  return false;
}

export { sameValue };
