# ADR-0002 — One field map drives both import and export

- **Status:** accepted
- **Date:** 2026-10-16
- **Phase:** 0

## Context

SPEC §6.1 requires a lossless round-trip: import → export → import →
deep-equal, with the export differing from the source **only** by the additive
fields (`id`, `retired`). The working lexicon must stay in the author's schema
so `validate.py`, `build_*.py` and the workbook generators keep working on it.

The 1.0 file makes this harder than it looks:

1. **`forms` has two key orders.** 1019 entries order the slots
   `root, ascended, negative, verb, …`; 80 entries put `verb` second. `glosses`
   uses one order throughout. Normalising would produce a diff on 80 entries.
2. **Non-ASCII characters carry meaning.** `since` uses `≤0.7` (U+2264);
   unused glosses use an em dash, `"— (unused)"` (U+2014). Both must survive
   byte-for-byte.
3. **Two sections keep workbook column names** (`colors`, `numbers.rules`) and
   a third does inside `legacy` (`editorial_notes_0_7`), so the key style is
   not uniform.
4. **One decision has two spellings** across sections: `RETIRE` in
   `dispositions.retirement_candidates`, `RETIRED` in
   `dispositions.root_review`.
5. **Optional fields are genuinely optional.** `replaces` on 71 headwords,
   `notes` on 33 function words, `examples` on 27, `tier` on 62 of 63 retired
   roots, `changes` on 412 of 452 examples. An exporter that emits them
   uniformly changes 26 sections' worth of diff.
6. **26 top-level keys in a specific order**, and the author's tools read the
   file as a whole.

A hand-written importer and a hand-written exporter will drift. They always do,
and here the drift is invisible until it corrupts the author's canonical data.

## Decision

**Write one declarative field map per section; derive both directions from
it.** Neither an importer nor an exporter is written by hand.

```ts
// sketch — the real types land in Phase 1
interface FieldMap<Internal, Raw> {
  section: string;
  fields: FieldSpec[]; // raw key ↔ internal key ↔ codec
  optional: readonly string[]; // omitted when absent, never emitted as null
  enums: Record<string, Record<string, string>>; // per-section value spellings
}
```

Plus three mechanical rules:

1. **Keep the raw object.** Every internal record holds a non-enumerable
   `__raw` reference to the object it was parsed from. Export starts from
   `__raw`, applies only the fields that actually changed, and adds the
   additive fields. Unknown fields survive because they are never touched, and
   key order survives because the object is never rebuilt.
2. **Serialise with the author's formatting.** `JSON.stringify(value, null, 1)`
   with non-ASCII preserved, matching the
   `json.dump(..., ensure_ascii=False, indent=1)` in `build_1_0.py`, so a git
   diff shows only real changes.
3. **A new entry gets a key order from the field map**, in the canonical order,
   because there is no raw object to preserve.

## Why not normalise

Normalising `forms` key order to one canonical order, and letting the exporter
emit that, would be simpler to write. It is rejected because it produces an
80-entry diff on the author's source of truth the first time the app saves —
noise in exactly the file where a real change must be visible. The author's own
tools generate that order; the app has no business reordering it.

## Consequences

- The round-trip test is a true deep-equal on the parsed JSON **and** a
  string comparison on the serialised output, modulo additive fields.
- `__raw` must be non-enumerable, or it leaks into `JSON.stringify` output and
  into structural equality assertions.
- Adding a field to a section means editing one map, and both directions
  follow.
- Export is deterministic, so git diffs stay readable (SPEC §11).
- If `lexicon_0_8_rc2.json` arrives, an 0.8 field map slots in beside the 1.0
  one — including the semicolon-string synonym codec and the three-way compound
  split that 1.0 no longer needs (ADR-0001, findings 7 and 8).
