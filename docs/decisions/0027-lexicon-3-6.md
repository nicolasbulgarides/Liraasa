# ADR-0027: Liraasa 3.6, the _2100 Dreams_ patch (proposed)

- **Status:** accepted as a build. Everything up to 3.5 is canon. Every 3.6 entry is proposed, with its tier and module, until the author ratifies it.
- **Date:** 2026-10-25
- **Phase:** 3.6

## Context

The author supplied a 2.5 → 3.6 bundle, "The _2100 Dreams_ patch: robots, the mind, the neocity". It is archived whole in `archive/patch_3_6/` with its `SHA256SUMS`, and every checksum verifies.

- Its 3.0–3.5 patches and its merger are byte-identical to the installed ones.
- Its validator differs from 3.5's in two ways. It adds the copied drug names to the names it accepts, and it accepts the `-san` of a lexicalised diminutive under 3.6:G152.

The bundle was made before the author's 3.5 decisions of 2026-10-25 (ADR-0026). 3.6 adds to them and changes none.

## Decision

### 1. 3.6 is built from frozen 3.5 by one changeset

`scripts/make_changeset_3_6.ts` writes `…-lexicon-3-6`. It is a config for `makeAdditionsChangeset`, and installs every module: core, mind, world, nature, register and book.2100.

- It adds two roots, `kibo` (robot) and `garza` (the coarse curse).
- It adds 140 compounds, 10 derivations, 7 diminutives, 1 restored form and 59 English aliases.
- It adds rulings 3.6:G152 (the `-san` of a lexicalised diminutive), G153 (the coarse register) and G154 (metric units).

Each entry notes its tier and module. The build gives 2,236 headwords and 5,133 meaningful forms, the patch's own counts. `npm run validate:3.6` gives 23 PASS and 2 WARN, and the author's validator gives PASS.

The patch's `names_sheet` is reference data for translators. It stays in the archive and is not a lexicon entry.

**3.6:G152 and 3.5:G152** share a number. Ruling ids are edition-qualified (ADR-0004), so the author's numbering is kept, and the question is raised in `review/questions_3_6.md`.

### 2. The tools read 3.6

- `PROPOSED_EDITIONS` is `['3.6']`.
- The LLM reference, handoff, guide, Lessons, Learn, the editor, the MFA export and the album build read `liraasa_3_6.json`.
- The checker's `copied_words` gains `ativan`, `herona` and `elesede`, the 3.6 recipe's drugs under 3.5:G151.
- G152 needs no new checker code. The 3.3:G148 reader already reads a lexicalised diminutive's `-san`.
- The guide's word check accepts the checker's copied words.
- The translator's `rule_words` gains the drug names.
- `tests/grammar/patch_3_6.test.ts` holds every 3.6 example, recipe and test sentence to the strict checker.

### 3. One recipe, settled as for 3.5

`Li renli lisrola ne menu.` (unabated) puts `ne` after the verb, against 1.0:G1. The guide gives `Li renli po ne teklata.`, "the rain did not stop", instead. The original stays rejected in the test.

### 4. Documents

- The Reference Grammar's Part 7 gains "Units, minds and the coarse register (3.6, proposed)". Its examples are the rulings' own.
- The 3.6 recipes are in the Patterns table, marked for review.
- _The Grammar in Lessons_ gains a proposed Part 8, with one lesson.

### 5. The author's decisions (2026-10-25)

The author answered the questions in `review/questions_3_6.md`. Their decisions are applied to the patch as read, by `decide3_6`. The patch file is never edited; the decided patch is written to `data/proposals/liraasa_3_6_patch_decided.json`.

- The rulings are renumbered 3.6:G153–G155.
- `lavipavma` and `sovepavma` are dropped. The checker reads the copied names `dopamina` and `serotonina`.
- Seven compounds are built from existing words for the novel's sound-words and slang. The attested image compound `vayesonbu` is lexicalised for wazoop, keeping its id and its old reading.

The build gives 2,242 headwords and 5,140 meaningful forms.

The author's validator runs on the decided patch as `scripts/validate_patch_3_6.py`. That is the author's file with one change: the id it looks for, G152, becomes G153. Sections 1 and 4 give the ids as first installed.
