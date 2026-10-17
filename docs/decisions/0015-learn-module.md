# ADR-0015 — The learning module

- **Status:** accepted
- **Date:** 2026-10-17
- **Phase:** Learn 1–7 (SPEC §9)

## Context

The author asked for a full training program, from zero to reading, writing
and composing, that keeps working as Liraasa changes: roots renamed, cut into
compounds, added; rules revised between editions. Its non-negotiables: never
invent Liraasa; generate everything from the live data; key everything by
stable id; know which edition progress was learned under; pure, seeded,
tested exercise and grading code.

SPEC placed Learn in the React workbench (Phase 7), after an app shell,
storage, Codex texts and a Root Lab that were never built. The working app is
the songbook editor. The author chose (Step 0 audit): **Learn lives in the
songbook editor**, and **a minimal rename/retire tool is built with it**.

## Decision

### 1. A pure core, bundled for the editor

`src/core/learn/` is strict TypeScript with no DOM and no I/O:

| File                                            | What                                                                             |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `adapter.ts`, `link.ts`, `corpus.ts`            | read-only view of an edition and the corpus; every word linked to entry ids      |
| `concepts.ts`, `graph.ts`                       | grammar concepts from the data's grammar sections; the skill graph and its units |
| `overrides.ts`, `validate.ts`, `candidates.ts`  | the author's overrides, the curriculum validator, candidate examples for rulings |
| `lessons.ts`                                    | root cards, grammar explainers, readings, unit lessons (view models)             |
| `exercises.ts`, `grade.ts`, `rng.ts`, `text.ts` | eleven exercise types plus audio, the diagnostic grader, a seeded RNG            |
| `scheduler.ts`, `progress.ts`                   | FSRS (and SM-2) behind one interface; profiles, cards, queue, mastery, reconcile |
| `diff.ts`                                       | edition snapshots and diffs for "What changed"                                   |

`npm run build:learn` bundles it with Vite into one classic script,
`editor/learn/learn-core.js` (`window.LiraasaLearn`), and writes the data it
reads into `editor/learn/learn-data.js`: the lexicon, the validated corpus,
the names, `data/lessons/overrides.json`, and the previous edition's snapshot.
The editor still opens from `file://`; the data loads on first use or when
the editor is idle.

### 2. The UI is plain scripts beside the checker

`editor/learn/{store,session,author,app}.js` draw the core's view models.
They hold no Liraasa: a test scans them, and the core, for any string that
spells a word of the lexicon. Learn talks to the songbook only through window
events (`liraasa:lexicon-changed`, `liraasa:open-lexicon`,
`liraasa:open-piece`, `liraasa:learn-ready`).

### 3. Everything is keyed by id

Items by entry id, concepts by derived id (`form:verb`, `slot:TENSE`,
`rule:1.2:G24`), nodes by `root:`/`concept:`/`pattern:` + id, cards by
`id|skill|direction`, sentences by a hash of their text. A card keeps the
edition it was learned under and a snapshot of its target; `reconcile`
compares snapshots with the current data, so a rename, a regloss or a
retirement is noticed whether it came from a release or from the rename tool
a minute ago.

### 4. Derived, never written: the curriculum

Concepts and their order come from the data (forms before the clause, the
clause before its slots, a ruling after what it refines or names). Root
order is corpus frequency, examples and compound count, grouped by theme;
roots in no sentence are `advanced` and come last. The author's overrides
(`data/lessons/overrides.json`: pins, levels, notes, lessons, ruling links,
exclusions, confirmed ruling examples) sit on top, keyed by id, and the
validator reports any id that no longer exists.

### 5. Root changes are change records

The roots tool (Author → Roots) runs `src/core/change/respell.ts`: it checks a
new spelling against `phonology.new_root_template` and every existing word,
previews the impact (forms, compounds, verb class, sentences, writings,
cards), and on Apply records a `respell_root` or `retire_and_replace`
`ChangeRecord`. The records are replayed over the bundled lexicon at every
load and exported as a changeset; `apply.ts` runs the same code, so
`npm run integrate` builds exactly what the browser showed. The lexicon file
is never written by the browser.

### 6. Persistence

IndexedDB (`liraasa-learn`): progress as the core's deterministic export,
the overrides draft, pending root changes, audio blobs. Schema-versioned
(`PROGRESS_SCHEMA`, `migrateStore`); a newer schema is refused, never
half-read. Export, full backup (with audio) and restore are one click.

## Consequences

- The brief's acceptance tests are unit tests in `tests/learn/` and were run
  in the browser: rename live without a reload, retire-and-replace, no
  Liraasa in the code, 1000 seeded exercises with no bad id and no duplicate
  answer, the 1.1 → 1.2 diff lesson, byte-identical export/import.
- Until a root change is released (integrate, validate, `build:llm`,
  `build:learn`), the songbook's checker and composer still know the old
  spelling; Learn and the writings already use the new one.
- `data/lexicon/ids.json` still records only the 1.0 ids. Later ids are
  minted deterministically by the build and verified against each changeset;
  the rename tool never mints one.
- Song English in the corpus is stanza-level, not line-aligned; Learn reads
  it as notes and asks for line English (the songbook's English column).
