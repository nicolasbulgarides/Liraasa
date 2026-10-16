# ADR-0001 — Build against lexicon 1.0, and the 18 corrections to SPEC §3

- **Status:** accepted
- **Date:** 2026-10-16
- **Phase:** 0

## Context

`docs/SPEC.md` is written against `lexicon_0_8_rc2.json` and says its §3 facts
"were checked directly" against that file. The file is not present.
`data/source/` contains **Liraasa 1.0** instead: `liraasa_1_0.json`, built
deterministically from `lexicon_0_8_rc2.json` (sha256
`b2702d1c…acd81fa2`, recorded in `snapshot_0_8`) by `build_1_0.py` on
2026-10-16.

1.0 is not a revision of 0.8-rc2; it is a deliberate breaking edition. 63
primal roots retired, 7 respelled, 28 added, 170 new compounds, 27 new
grammatical operators, a fixed 20-slot clause template, and all eight 0.8 open
questions closed. The editorial report lists ten deliberate breaking changes.

So almost every quantitative claim in SPEC §3 is now wrong, and several
structural ones describe a schema that no longer exists.

## Decision

**Build against `liraasa_1_0.json` as the canonical lexicon.** Treat SPEC §3 as
superseded by `docs/SCHEMA.md`, which records the observed 1.0 schema. Keep
every SPEC requirement that is about behaviour (lossless round-trip, golden
tests, stable ids, impact preview, no invented words) — those all survive the
edition change intact.

Where SPEC describes a 0.8 shape the app must still _read_ — the two-place
compound split, the semicolon synonym string, `harshness` — implement nothing
now. They belong to a file we do not have. If `lexicon_0_8_rc2.json` arrives
(it is needed for check 12 anyway), add an 0.8 reader behind the same mapping
layer.

## Verification of SPEC §3, fact by fact

Every row was checked against `data/source/liraasa_1_0.json` and is pinned by
`tests/golden/sourceData.test.ts`.

### 1. Top-level keys

| SPEC §3 says                                                            | The file has                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 24 keys, led by `language`, `version`, `source`, `schema_note`, `rules` | **26 keys.** `language`, `version`, `built_utc`, `source`, `snapshot_0_8`, `phonology`, `morphology`, `motion_prefixes`, `settled_open_questions_0_8`, `headwords`, `function_words`, `pronouns`, `correlatives`, `numbers`, `time_and_dates`, `colors`, `discourse_particles`, `grammar`, `rulings_1_0`, `rulings_0_8_carried`, `examples`, `rhyme_families`, `legacy`, `sound_ledger`, `dispositions`, `changelog_1_0` |

**Gone:** `schema_note`, `rules`, `rhyme_pairs` (100), `root_review_proposals`
(40), `grammar_examples_0_8` (193), `grammar_rulings_0_8` (20),
`carry_forward_open_items`, `validation_0_7_workbook`, `rhyme_families_0_7`.
`editorial_notes_0_7` and `data_fixes_0_8` moved inside `legacy`.

**New:** `built_utc`, `snapshot_0_8`, `phonology`, `morphology`,
`motion_prefixes`, `settled_open_questions_0_8`, `rulings_1_0`,
`rulings_0_8_carried`, `legacy`, `sound_ledger`, `dispositions`,
`changelog_1_0`.

### 2. Counts

| Section                 | SPEC §3      | Actual                                       | Δ                                                                   |
| ----------------------- | ------------ | -------------------------------------------- | ------------------------------------------------------------------- |
| `headwords`             | 969          | **1099**                                     | +130                                                                |
| `function_words`        | 123          | **149**                                      | +26                                                                 |
| `pronouns`              | 8            | 8                                            | —                                                                   |
| `correlatives`          | 36           | 36                                           | —                                                                   |
| `time_and_dates`        | 43           | 43                                           | —                                                                   |
| `colors`                | 9            | 9                                            | —                                                                   |
| `discourse_particles`   | 4            | 4                                            | —                                                                   |
| `grammar`               | 155 (a list) | **an object of 6 keys**                      | shape change                                                        |
| `examples`              | 223          | **452** (447 live)                           | 0.8 examples + 0.8 grammar examples + 1.0 particle examples, merged |
| `rhyme_families`        | 420          | **387**                                      | −33                                                                 |
| `rhyme_pairs`           | 100          | **absent**                                   | —                                                                   |
| `root_review_proposals` | 40           | **absent** → `dispositions.root_review` (40) | moved                                                               |
| `grammar_examples_0_8`  | 193          | **absent** → folded into `examples`          | moved                                                               |
| `grammar_rulings_0_8`   | 20           | **absent** → `rulings_0_8_carried` (20)      | renamed                                                             |

The editorial report explains the function-word delta as 123 + 27 new − 1
retired (`grasia`); the shipped count is 149.

### 3. Headword keys

SPEC lists `root`, `status`, `domain`, `type`, `forms`, `glosses`, `register`,
`english_synonyms`, `harshness`, `editorial_note`, and sometimes `compound`,
`modifier`, `head`, `added_in`, `batch`, `authorized_changes`.

Actual: 14 keys — `root`, `type`, `components`, `forms`, `glosses`, `register`,
`domain`, `english_synonyms`, `status_1_0`, `since`, `history_0_8`, `notes`,
`protected`, and `replaces` (71 entries).

| SPEC field                       | Fate                                                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `status`                         | renamed `status_1_0`, with a new value set                                                                      |
| `harshness`                      | **removed entirely** (0 entries)                                                                                |
| `editorial_note`                 | removed from the top level; survives inside `history_0_8`                                                       |
| `compound` / `modifier` / `head` | replaced by one `components` array                                                                              |
| `added_in`                       | replaced by `since`                                                                                             |
| `batch`                          | removed                                                                                                         |
| `authorized_changes`             | **removed** (0 entries). The string survives only inside ruling R2's text, which still describes the mechanism. |

### 4. The seven slots — **correct**

`forms` and `glosses` both carry exactly `root`, `ascended`, `negative`,
`verb`, `negative_adjective`, `adjective`, `ascended_adjective` on all 1099
entries.

**But** `forms` is stored in two key orders: 1019 entries in the order above,
and 80 entries (the 0.8 additions, e.g. `biti`, `cemofaru`) with `verb`
second. `glosses` uses the canonical order throughout. SPEC §6.1 asks for key
order to be preserved "where practical" — see ADR-0002.

### 5. Unused gloss slots

SPEC: 4,103. Actual: **4,608** of 7,693, confirmed by
`validation_1_0.json` → `summary.counts.unused_forms`. The instruction stands:
display them as unused, never fill them.

### 6. `type` values

SPEC: `Primal` (361), `Root` (60), `Compound` (548), and asks for an ADR on
whether `Primal` and `Root` differ.

Actual: `Primal` (386) and `Compound` (713). **The `Root` type does not
exist** — the 1.0 build collapsed it. The question SPEC asked for an ADR about
is therefore moot, and is answered here: there is one primal type.

### 7. `english_synonyms`

SPEC: a semicolon-separated string on 888 entries, an array on 81.

Actual: **an array on all 1099.** No semicolon strings remain. The
normalise-on-import / restore-original-shape requirement in SPEC §3 reduces to
a no-op for 1.0, and the importer keeps it only as a defensive branch for a
future 0.8 reader.

### 8. Compound splits

SPEC: three sources — a `compound: {modifier, head}` object (479), top-level
`modifier`+`head` (65), or nothing (4: `kronobio`, `lumivera`, `mavopago`,
`mavolumi`), with the last group to be derived by lookup and flagged "derived".

Actual: **one source.** `components: [modifier, head]` on all 713 compounds,
`null` on all 386 primals. The four gap words are filled in; `changelog_1_0`
records exactly that work:
`"components inferred from spelling: krono+bio (absent in 0.8 record)"`, and
the same for `lumivera`, `mavopago`, `mavolumi`.

Consequences:

- **No "derived" flag is needed.** The UI shows the recorded split. If the
  provenance matters, it is in `changelog_1_0`, stage `metadata`.
- Every compound spelling equals `components.join('')` (check 7 verifies).
- Every component resolves to an active headword (check 7, check 24).
- `mavopago` now carries `components: ["mavo", "pago"]` even though it is the
  fixed word "society". `morphology.suffixes` still blocks productive
  `mavo + pago`. Both are true: the split is etymological, the derivation is
  blocked. The generator must not offer `mavo + -pago`; the Root Lab may still
  show `mavopago`'s ingredients. See open question Q3.

### 9. Compound nesting

SPEC: "No compound in 0.8 contains another compound, but the engine must
support nesting."

Actual: **one nested compound exists** — `mudusomubiti` = `mudu` +
`somubiti`, where `somubiti` is itself `somu` + `biti`. It arrived as a
dependent rewrite when `bede` retired into `somubiti`. Nesting is no longer
hypothetical; it is a live case with a golden test.

### 10. `status` values

SPEC: `NEW`, `CHANGED`, `EXISTING`, `PROPOSAL`, plus `HISTORICAL` on examples.

Actual, two layers:

- `status_1_0`: `CARRIED` (888), `NEW` (198), `REPLACED` (7), `REDEFINED` (3),
  `REWRITTEN` (2), `MERGED` (1).
- `history_0_8.status` carries the old enum: `NEW` (726), `CHANGED` (147),
  `EXISTING` (25), `PROPOSAL` (3).
- `examples.status`: `CARRIED` (394), `NEW` (36), `MIGRATED` (14),
  `HISTORICAL` (5), `FORMULA` (3). `HISTORICAL` is still skipped in
  validation; `FORMULA` is new and needs the text after the last `=`.

### 11. `authorized_changes`

SPEC: items have `slot`, `from`, `to`, `ruling`, `added_in`, `reason`, and the
shape should be reused for every logged change.

Actual: **the field does not exist on any entry.** The 1.0 record keeps change
history in three other places: `changelog_1_0` (139 `{stage, item, detail}`
rows), `legacy.*` (the retirement and respelling record) and
`dispositions` (the editorial decisions).

The SPEC §6.5 instruction still holds — ruling R2 continues to name
`authorized_changes` as where an activated slot is recorded — so the changeset
op shape in SCHEMA §4 uses those six fields plus `entry`, `op`, timestamp and
author, as SPEC directs. It is now a shape we define rather than one we
inherit.

### 12. `harshness.score`

SPEC: an approximation (count of stops) on 0.8 entries.

Actual: **absent.** 1.0 replaces it with `sound_ledger` (77 rows tracking
reserved spellings) and the `phonology` templates. Nothing to port.

### 13. Spreadsheet column names in secondary sections

SPEC: secondary sections use spreadsheet column names, e.g. `function_words`
keyed `"English / function"`, `"Liraasa"`, `"Use / position"`; and
`root_review_proposals` keyed `"Current root"`, `"Candidate 1"`,
`"Author choice"`, `frozen_in_0_8`.

Actual: the 1.0 build normalised nearly all of them. `function_words` is keyed
`form`, `meaning`, `position`, `example`, `example_gloss`, `class`,
`status_1_0`, `since`. `root_review_proposals` is gone;
`dispositions.root_review` is keyed `root`, `disposition`, `result`, `reason`.

**Only two sections still use workbook column names:** `colors`
(`Family`, `Base color`, `Dark + narvo`, `Life + bio`, `Gem + juba`,
`Light + lumi`, `Example meanings / notes`) and `numbers.rules`
(`Group`, `Value`, `Liraasa`, `Construction rule`,
`English interpretation`, `Usage / comment`). A third,
`legacy.editorial_notes_0_7`, keeps `Type`, `Topic`, `Original / issue`,
`Resolution`, `Why`, `Decision / caveat`, `Version`.

The per-section mapping layer SPEC asks for is still the right design — it is
just that 23 of the 26 sections map near-identically.

### 14. `Stormsong` / `Dreamsong` key names

SPEC: per `schema_note`, older files may use these; accept both.

Actual: there is no `schema_note`, and no key is named `Stormsong` or
`Dreamsong`. The string "Stormsong" appears four times, all inside
`legacy.data_fixes_0_8` prose referring to a 0.7 workbook sheet
(`{"sheet": "grammar", "field": "Stormsong example", …}`). No dual-key support
is needed for 1.0. "Dreamsong" does not appear at all.

### 15. The `rules` block

SPEC: a `rules` block holds the seven forms, the verb rule, the suffixes and
the compounding rule.

Actual: **there is no `rules` key.** The content is split across
`morphology` (seven forms, verb rule, suffix order, suffixes, compounding,
lexicalised derivations), `phonology` (inventory, stress, templates, exempt
pairs) and `grammar` (clause template, slots, scope, stacking, valency, noun
phrase).

The SPEC §3 requirement survives unchanged in substance: load them as data,
keep the typed copy in `src/core/config/`, and assert the two agree.

### 16. `validate.py` and the companion tools

SPEC §2: if `validate.py` is present, port it faithfully.

It is present, and it implements **24 checks, not 15** — matching
`validation_1_0.json` (24 PASS, 0 WARN, 0 FAIL). The parity oracle SPEC names
(`validation_rc2.json`, 14 PASS + 1 WARN on the three unconfirmed compounds)
does not exist; those three compounds were resolved in 1.0.

**`validate.py` cannot be run as shipped.** It imports two modules that are
not in `data/source/`:

```python
from liraasa_core import (FORM_KEYS, seven_forms, edit_distance, syllable_count,
                         syllabify, new_root_phonotactics,
                         function_word_phonotactics, is_unused, tokenize)
from liraasa_lexicon import Lexicon
```

`build_1_0.py` needs `liraasa_core` too. So the port is a reimplementation
guided by readable source, not a line-by-line translation. The readable parts
are worth a lot: the exact check order, the exclusion list, the `RANK` table
for clause-order checking, and the exemptions (the `maivo` overlap, time nouns
listed in the time table, lexicalised derivations).

### 17. The validator's own facts, confirmed

Independently recomputed from the lexicon in Phase 0 and all matching
`validation_1_0.json`:

- 1099 headwords · 386 primal · 713 compounds · 7693 forms · 4608 unused ·
  149 function words · 27 new in 1.0
- **All 7693 forms regenerate from the documented rules with zero
  mismatches**, and all 7693 are distinct. The SPEC §5.1 golden test is
  already known to pass.
- 509 `migration_forms` entries; 497 reserved spellings
- 447 live example sentences
- 23 `rulings_1_0` (G1–G23), 20 `rulings_0_8_carried` (R1–R12, G1–G8)

### 18. A collision SPEC could not have known about

`rulings_1_0` and `rulings_0_8_carried` **both define G1 through G8, with
different content.** 1.0's G1 is "Scope by position"; 0.8's G1 is
"Demonstratives as pronouns". A bare ruling id is ambiguous. See ADR-0004.

## Consequences

- `docs/SCHEMA.md` replaces SPEC §3 as the data reference.
- Phase 2's target is **24 checks**, with check 12 blocked on the missing 0.8
  baseline.
- Three pieces of planned work are cancelled as unnecessary: the semicolon
  synonym normaliser, the three-way compound-split reader with its "derived"
  flag, and `Stormsong`/`Dreamsong` dual-key support.
- One piece of planned work becomes real rather than hypothetical: compound
  nesting.
- One check becomes implementable that SPEC marked as blocked: `gome`
  transitivity, now usage-based by settled question 5.
- The counts in SPEC §1, §4, §6.2 and §12 (969 headwords, ~6,800 forms, 15
  checks) should be read as 1099, 7693 and 24.
