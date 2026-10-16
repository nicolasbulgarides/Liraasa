# Liraasa Workbench

A local web app that is at once a codex, a translator, a learning system and a
command center for the evolution of **Liraasa**, a constructed language built
for singing. Single author, single user, one machine, Chrome or Edge.

Read `docs/SPEC.md` first — it is the build specification and the author owns
it. Then `docs/SCHEMA.md` for the data, `docs/ARCHITECTURE.md` for the module
map, `docs/decisions/` for why things are the way they are.

**The canonical data is Liraasa 1.0.** `docs/SPEC.md` has been revised against
it; the corrections from the 0.8-rc2 original are recorded in ADR-0001. Where
this file, SPEC or any document disagrees with
`data/source/liraasa_1_0.json`, **the JSON wins.**

**1.0 is released and frozen. Work happens in `1.1-draft`** with 1.0 as
baseline (ADR-0008). **The app owns the canonical JSON** from 1.1 on;
`build_1_0.py` was a one-time migration, not the ongoing editor (ADR-0007).

Phase 0 and Phase 1 are complete, and the **1.0 → 1.1 vocabulary supplement is
integrated**: 1418 headwords (407 primal, 1011 compounds), 25 of 25 validator
checks passing **against the real corpus** — the six migrated songs and
Bumrepago. Also shipped: the MFA phonetic export (`npm run export:mfa`) and the
standalone writing tool in `editor/` — a journal with collections, an
English-to-Liraasa assisted composer, live checking and MFA export. Phase 2 is the TypeScript validator and
parser.

---

## Commands

### Daily

| Command              | What it does                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run dev`        | Vite dev server with HMR                                                                       |
| `npm run check`      | **The gate.** typecheck → lint → format:check → test. Run before reporting any phase complete. |
| `npm test`           | Vitest once                                                                                    |
| `npm run test:watch` | Vitest in watch mode                                                                           |

### Individually

| Command                | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run typecheck`    | `tsc -b --noEmit` across both projects                    |
| `npm run lint`         | ESLint, including the import-boundary rules (ADR-0003)    |
| `npm run lint:fix`     | ESLint with `--fix`                                       |
| `npm run format`       | Prettier write                                            |
| `npm run format:check` | Prettier check — what `npm run check` runs                |
| `npm run coverage`     | Vitest with v8 coverage over `src/core` and `src/storage` |
| `npm run build`        | Typecheck, then production build to `dist/`               |
| `npm run preview`      | Serve the built `dist/`                                   |

### Data CLIs

| Command                  | What it does                                                                                                               | Status      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `npm run lexicon:import` | Import a lexicon into `data/lexicon/` and mint stable ids; prints the counts. Takes `[source.json]` and `--edition`.       | **working** |
| `npm run lexicon:export` | Export in the author's schema. **Verifies the round trip before writing** and exits non-zero if it is not lossless.        | **working** |
| `npm run validate`       | The 24 checks plus the corpus run, shaped like `validation_1_0.json`. Also what the app runs before every save (ADR-0007). | Phase 2     |
| `npm run integrate`      | Build 1.1 from the frozen 1.0 plus a vocabulary proposal. `-- --check` audits and writes nothing (ADR-0009).               | **working** |
| `npm run report:1.1`     | Regenerate the 1.1 changelog, LLM quickstart and compare report from the integration data.                                 | **working** |
| `npm run export:mfa`     | Montreal Forced Aligner dictionary, phone inventory and syllable sheet into `data/export/`.                                | **working** |
| `npm run build:editor`   | Rebuild the data bundle that `editor/index.html` loads.                                                                    | **working** |

```sh
# Import the frozen 1.0: a byte-identical copy plus the id sidecar.
npm run lexicon:import

# Export at 1.1-draft: the source shape plus inline ids, nothing else.
npm run lexicon:export -- --edition 1.1-draft --out data/lexicon/liraasa_1_1_draft.json
```

### Author's Python tools

In `data/source/`, **read-only reference**. They cannot run as shipped:
`validate.py` and `build_1_0.py` both import `liraasa_core`, and `validate.py`
also imports `liraasa_lexicon`; neither module was supplied (ADR-0001,
finding 16). They are still the best available specification of the 24 checks
— read them before porting.

```sh
# For reference only; both fail on ModuleNotFoundError today.
python data/source/validate.py data/source/liraasa_1_0.json \
  --baseline lexicon_0_8_rc2.json --corpus CORPUS_DIR --out validation.json
```

**`validate.py` now runs.** `liraasa_core.py` and `liraasa_lexicon.py` were
reconstructed and verified by parity against `validation_1_0.json` (ADR-0010).
On Windows set `PYTHONUTF8=1`, because `validate.py` opens files without an
explicit encoding:

```sh
cd data/source
# 1.0, the parity check: must reproduce validation_1_0.json
PYTHONUTF8=1 python validate.py liraasa_1_0.json --baseline ../../lexicon_0_8_rc2.json

# 1.1, through the wrapper that un-gates the version-specific checks
PYTHONUTF8=1 python validate_1_1.py ../lexicon/liraasa_1_1.json   --baseline-1-0 liraasa_1_0.json --baseline ../../lexicon_0_8_rc2.json   --out ../lexicon/validation_1_1.json
```

`openpyxl` is not installed, so the workbook generators cannot run. The two
`.xlsx` files and the `.docx` guide in `data/source/` are generated artefacts
of the JSON; read the JSON, not them.

---

## Layout

```
data/source/     the author's original files, READ-ONLY. Never edit, never reformat.
data/lexicon/    the working canonical lexicon (author's schema + additive fields)
data/texts/      token documents (SCHEMA §3)
data/lessons/    lesson definitions
data/changes/    changesets and editions
src/core/        pure TypeScript: no DOM, no React, no I/O. Lint-enforced.
src/storage/     StorageAdapter implementations
src/ui/          shell, components, one folder per module
scripts/         CLI entry points
tests/golden/    fixtures and assertions built from the real data
docs/            SPEC (author's), SCHEMA, ARCHITECTURE, decisions/
```

Import boundaries are enforced by ESLint, not convention:
`src/ui` → `src/storage` → `src/core`, never upward, and UI modules never
import each other. Aliases: `@core/*`, `@storage/*`, `@ui/*`.

---

## Working rules

**Build in the phases of SPEC §13.** Stop at the end of each phase, report
test results and open questions, and wait for the author's go-ahead. Phases 0
and 1 are done; Phase 2 is the validator and parser.

**Never edit anything in `data/source/`.** It is the author's reference set,
and `data/lexicon/liraasa_1_0.json` is a verified byte-for-byte copy of the
frozen edition — do not edit that either. `docs/SPEC.md` is in
`.prettierignore` so its tables are not repadded; revise it deliberately, not
by formatter.

**Never decide the language.** SPEC §14 lists what the tool must surface and
never resolve: a new root, a new gloss, activating an unused slot, a veto, a
respelling. The 1.0 data has already closed the eight 0.8 open questions in
`settled_open_questions_0_8` — read them rather than re-asking. Open questions
that are genuinely still live are in ADR-0001 §3 and the Phase 0 report.

**Never invent a Liraasa word.** Not in code, not in a test fixture, not in a
comment, not in a lesson draft. Use a lexicon entry, or build a transparent
MODIFIER+HEAD compound from existing headwords and flag it noncanonical. The
4608 slots glossed `"— (unused)"` have no meaning and never get one.

**Generated text is untrusted.** Every LLM output is tokenised, parsed and
checked before it is shown, and never stored as canonical unless it passes
(ADR-0006).

**Reference entries by `id`, never by spelling.** 63 roots retired and 7 were
respelled in one edition. A stored spelling is a bug, except
`surface_snapshot`, whose job is to be frozen.

**Every edit is a `ChangeRecord`** — what changed, old value, new value, reason
(ADR-0007). A record with no reason is rejected. **The validator runs before
every save**, and a save that would introduce a FAIL is refused.

**Ruling ids are edition-qualified**: `"1.0:G19"`, `"0.8:R2"`. `G1`–`G8`
are defined in both ruling sets with different content (ADR-0004).

**A golden test that fails is reported, never auto-corrected.** If the form
generator disagrees with a stored form, the stored form is canon and the
disagreement is the finding.

---

## Facts worth knowing before you touch the data

The numbers, with the full picture in `docs/SCHEMA.md`:

- **1099** headwords = **386** primal roots + **713** compounds. No `Root`
  type exists. 7693 forms, all distinct; **4608** glossed `"— (unused)"`.
- **All 7693 forms regenerate from the documented rules with zero mismatches.**
  Verified in Phase 0 and pinned by a test.
- **149** function words (27 new in 1.0), 8 pronouns, 36 correlatives, 43 time
  words, 9 colours, 4 discourse particles, 387 rhyme families.
- **452** examples, **447** live (5 are `HISTORICAL` and skipped).
- **24** validator checks, all PASS on 1.0. Check 12 needs
  `lexicon_0_8_rc2.json`, which is missing, so it cannot run.
- `protected: true` on **every** headword — no canon spelling is ever
  regenerated by rule.
- `english_synonyms` is an **array on all 1099** entries. No semicolon strings.
- Every compound has exactly **two** `components`, and every compound's
  spelling equals `components.join('')`.
- **One nested compound exists**: `mudusomubiti` = `mudu` + `somubiti`.
- **32 spellings live in more than one namespace** (`maivo` is both a pronoun
  and a root). A form index maps a spelling to a _list_, never one entry.
- `forms` is stored in **two key orders** (80 entries put `verb` second).
  Preserve each entry's own order on export (ADR-0002).
- Watch the characters: `≤0.7` in `since` (U+2264) and the em dash in
  `"— (unused)"` (U+2014). Both must survive a round-trip byte-for-byte, and
  the 1.0 export is **verified byte-identical** to the source, trailing newline
  included (there is none).
- **`migration_forms.kind` has five values**, not two: `retired`, `respelled`,
  `merged`, `rewritten`, `archived-phrase`. For the five `archived-phrase` rows
  the target is a **multi-word phrase**, not a form, so it cannot be looked up
  in a form index.
- **Colour words are their own closed class.** None of the 45 is a headword.
- **`opi` ("Hope") is a real Primal headword**, so the verb-rule irregular is
  live data, not a reserved case.
- **Registers are two vocabularies**: entries are `everyday`/`poetic` only
  (ruling 0.8:R10 — no sacred word list); texts are
  `everyday`/`poetic`/`sacred`, where sacred is a property of the _form_
  (`-asa`, `-asasan`). `irreverent` is an optional text-level tone flag and is
  never written into the lexicon.
- **`time_and_dates` has 43 rows but 40 distinct forms**: `eli-krono`,
  `toda-krono` and `nuna-krono` each appear twice.
- The clause template is the **20-slot** 1.0 one, not the 10-slot template
  SPEC §5.4 quotes. See SCHEMA §1.7.1.
- Transitivity is **usage-based** (settled question 5), so the `gome` check is
  implementable and **no `transitive` field should be added**.
- `phonology.protected_exceptions` says "36 amor- double-a roots". **That label
  is wrong**: they are compounds, and 1.0 has 39 (20 ending `-amor`, 19
  beginning `amor-`). 36 was the 0.8-rc2 count. The corrected list is in
  `src/core/config/phonology.ts`; the label is scheduled for repair in 1.1.

---

## Conventions

- TypeScript strict, plus `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`. Index reads are `T | undefined`; handle the
  missing case rather than asserting it away.
- Dependency versions are pinned exactly. A bump is a deliberate edit.
- Plain CSS with custom properties. Light palette on bare `:root`, dark
  redefined under both `prefers-color-scheme` and `[data-theme]`.
- Accessibility is a build requirement, not a final pass: WCAG 2.2 AA, full
  keyboard operation, visible focus, a keyboard alternative to every
  drag-and-drop exercise, nothing conveyed by colour alone.
- Liraasa text gets `class="liraasa"` and a serif stack. Spelling is never
  altered for display.
- Exports are deterministic — `JSON.stringify(v, null, 1)`, non-ASCII
  preserved, matching the author's `json.dump(..., ensure_ascii=False,
indent=1)` — so git diffs stay readable.
