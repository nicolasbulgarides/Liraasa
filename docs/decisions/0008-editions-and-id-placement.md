# ADR-0008 — 1.0 is frozen; ids go to a sidecar until 1.1

- **Status:** accepted
- **Date:** 2026-10-16
- **Phase:** 1
- **Decided by:** the author, answering Phase 0 questions 2 and 3

## Context

SPEC §6.1 asks for an additive `id` on every entry. Writing it into the
canonical file is the simplest thing, but 1.0 is a released edition whose
sha256 is recorded, whose workbooks and guide were generated from it, and whose
bytes other tools have seen.

## Decision

### 1.0 is released and frozen

Work happens in **1.1-draft**, with 1.0 as the baseline for comparison.
Released editions are read-only snapshots; 1.0 is never edited in place.

### Ids live in a sidecar for 1.0 and inline from 1.1

`idStorageFor(edition)` returns `sidecar` for 0.8 and 1.0, `inline` for
anything later.

- **Sidecar** (`data/lexicon/ids.json`): the canonical 1.0 file is written
  **byte-identically** to the source — verified, not assumed; the round-trip
  test compares the serialised output to the file on disk including the absence
  of a trailing newline, because the author's `json.dump` writes none.
- **Inline**: from 1.1 each entry carries `"id"`. The author confirmed the
  Python tools read only the keys they need, so an extra field is harmless.
  `exportLexicon(lexicon, { edition: '1.1-draft' })` adds `id` and
  nothing else — the test strips the ids back out and asserts the result equals
  the source exactly.

An inline `id` always wins over the sidecar, so once 1.1 writes them the
sidecar is a backup rather than the authority. Examples get no id: they have
no identity apart from their text.

### Two decisions are deferred to 1.1

Recorded as data in `src/core/config/editions.ts` and surfaced by the Open
questions module. The tool never resolves them (SPEC §14):

| Question                                    | Roots                     | Why                            |
| ------------------------------------------- | ------------------------- | ------------------------------ |
| Restore `lalma` and `sanlu`?                | `lalma`, `sanlu`          | Needed for _Bumrepago_         |
| Possibly restore `rohu`, `sabire`, `sonsa`? | `rohu`, `sabire`, `sonsa` | Would avoid re-recording songs |

Checked against the data: all five are retired roots, `RECLAIMED-RESERVED` in
`sound_ledger` and reusable from 2.0. Restoring one means displacing the
compound that replaced it:

| Root     | Replaced in 1.0 by |
| -------- | ------------------ |
| `lalma`  | `lumibiti`         |
| `sanlu`  | `loteronela`       |
| `rohu`   | `folnipatu`        |
| `sabire` | `sasvapago`        |
| `sonsa`  | `farufasbi`        |

So restoring any of them means overriding the reserve policy with a logged
author action, and deciding what becomes of the replacement compound — exactly
the case SPEC §6.6 describes. The tool surfaces both halves and resolves
neither.

## Consequences

- The 1.0 file in `data/lexicon/` is a verified byte-for-byte copy of
  `data/source/liraasa_1_0.json`, so having both is cheap and the working copy
  can be diffed against the frozen one trivially.
- `ids.json` is sorted by key for a stable git diff, and carries a `next`
  counter per kind so a later import mints without collision.
- An id survives a respelling: the test respells and re-imports with the saved
  map and asserts the id is unchanged. That is the property that makes root
  swaps safe.
- 1348 ids were minted on first import: 1099 headwords, 149 function words,
  43 time words, 36 correlatives, 9 colours, 8 pronouns, 4 discourse particles.
