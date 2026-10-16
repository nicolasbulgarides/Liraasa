# ADR-0007 — The app owns the canonical JSON

- **Status:** accepted
- **Date:** 2026-10-16
- **Phase:** 1
- **Decided by:** the author, answering Phase 0 question 1 (option c)

## Context

The author's pipeline built 1.0 as `decisions_1_0.py` → `build_1_0.py` →
`liraasa_1_0.json`, and `data/source/README.md` says "never edit generated
files by hand". Taken literally that makes the app a second generator of a
file the pipeline claims to own, and the two would fight.

The author resolved it: **`build_1_0.py` was a one-time migration that built
1.0; it is not the ongoing editor.** From 1.1 the app is the editor.

## Decision

The app owns `data/lexicon/liraasa_*.json` and exports the change history
alongside it, under two conditions the author set.

### Condition 1 — every edit is a structured changelog entry

What changed, the old value, the new value, and why. Implemented as
`ChangeRecord` in `src/core/change/changelog.ts`:

```ts
{ entry, op, slot?, from, to, ruling?, addedIn, reason, at, author }
```

`slot`, `from`, `to`, `ruling`, `addedIn` and `reason` are the six fields
ruling 0.8:R2 names, so an activated slot is logged the way the language's own
rules require. `entry` is a **stable id, never a spelling** (ADR-0006), `op` is
one of the ten operations in SCHEMA §4, and `at`/`author` make it an audit
record.

`validateChangeRecord` refuses a record with no reason, a record with neither a
`from` nor a `to`, and an `activate_slot` with no ruling reference. A change
that is not traceable does not get written.

`toAuthorChangelogRows` renders a changeset as the `{stage, item, detail}`
rows `changelog_1_0` uses, so the app's history reads like the migration's and
the author's own tooling can consume it.

### Condition 2 — the validator runs before every save

The 24 checks live in `src/core/validate/` (Phase 2) and the save path calls
them. A save that would introduce a FAIL is refused and reported, not written.
`npm run validate` is the same code behind a CLI.

`data/source/validate.py` stays in the repo as an **independent** check on
whatever JSON the app writes. It is not the app's validator re-run; it is a
second opinion with a different implementation, which is the point. It needs
`liraasa_core.py` and `liraasa_lexicon.py` to run at all (ADR-0001,
finding 16).

### What this does not change

The schema. The app writes the author's shape, byte-identically where the
edition is frozen (ADR-0008), so every Python tool that reads only the keys it
needs keeps working.

## Consequences

- `scripts/export.ts` verifies the round trip **before** writing and exits
  non-zero if the export is not lossless, rather than overwriting the
  canonical file with something it cannot reproduce.
- The changeset log is the provenance that `decisions_1_0.py` used to provide.
  Phase 5 adds the engine that produces changesets; Phase 1 fixes their shape
  so nothing written earlier has to be migrated.
- A 1.1 release can still be reproduced from 1.0 plus the changesets, which is
  the property the author's decisions-file pattern had and that it would have
  been easy to lose.
