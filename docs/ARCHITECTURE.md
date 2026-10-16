# Liraasa Workbench — Architecture

Status: **Phase 1 complete** (2026-10-16). Module map and data flow.

Implemented: `core/config`, `core/model`, `core/morphology`, `core/generate`,
and the changelog record in `core/change`. Still contracts only:
`core/parse`, `core/validate`, `core/grammar`, the rest of `core/change`,
`core/translate`, `core/learn`, `src/storage`, and every UI module.

Companion documents: `docs/SPEC.md` (what to build), `docs/SCHEMA.md` (the
data formats), `docs/decisions/` (why).

---

## 1. Shape of the thing

One static Vite build, run locally in Chrome or Edge, with no server. The
author's project folder is the database: the app reads and writes
`data/lexicon`, `data/texts`, `data/lessons` and `data/changes` directly
through the File System Access API, so everything lives in git.

Three layers, and the dependency arrows only ever point down:

```
          ┌─────────────────────────────────────────────┐
          │  src/ui     shell · components · modules    │
          │             React, DOM, routing             │
          └──────────────────┬──────────────────────────┘
                             │ imports
          ┌──────────────────▼──────────────────────────┐
          │  src/storage    StorageAdapter impls        │
          │                 FS Access · IndexedDB       │
          └──────────────────┬──────────────────────────┘
                             │ imports
          ┌──────────────────▼──────────────────────────┐
          │  src/core       pure TypeScript             │
          │                 no DOM · no React · no I/O  │
          └─────────────────────────────────────────────┘
```

`src/core` is pure: given the same input it returns the same output, and it
never reads a file, touches the DOM or calls the network. That is what makes
the 24 validator checks, the form generator and the change engine testable
against the real data without a browser. It is enforced by ESLint, not by
convention — see ADR-0003.

`src/ui/modules/*` are independent of each other. Two modules that need to
share something share it through `src/core`.

---

## 2. Core module map

### `core/config/` — the language, typed

The rules as TypeScript constants: the seven slot names and their order, the
verb rule, the suffix order and derivation set, the 20 clause slots, the 13
stacking exclusions, the phonotactic templates, the declared distance-1 pairs,
the registers.

The same facts also live in the lexicon JSON (`phonology`, `morphology`,
`grammar`). The config is the testable copy; a test asserts the two agree, so
a future edition that changes a rule in the JSON fails loudly instead of
drifting (SPEC §3).

Depends on: nothing.

### `core/model/` — types, mapping, indexes

- **`types.ts`** — the internal record types. Canonical, snake_case-free,
  edition-agnostic.
- **`import.ts` / `export.ts`** — the mapping layer. Import converts the
  author's schema to internal records; export reproduces the author's schema
  byte-for-byte apart from the additive fields. Both are driven by one
  per-section field map, so the pair cannot drift (ADR-0002).
- **`ids.ts`** — stable id assignment and the `data/lexicon/ids.json` map.
- **`indexes.ts`** — the in-memory indexes, all rebuilt on load:

| Index          | Key → value                                                                                    | Used by                       |
| -------------- | ---------------------------------------------------------------------------------------------- | ----------------------------- |
| `byId`         | id → entry                                                                                     | everything                    |
| `byForm`       | spelling → `{entryId, slot}[]` (**a list**: 32 spellings are multi-namespace, §1.11 of SCHEMA) | parser, collision checks      |
| `byComponent`  | root → compounds using it as modifier / as head                                                | Root Lab, impact analysis     |
| `byDerivation` | root → `-yo` / `-vu` / `-pago` derivations                                                     | Root Lab, check 3             |
| `bySynonym`    | English synonym → entries                                                                      | translator, search            |
| `byGloss`      | gloss word → entries                                                                           | translator, search            |
| `byRhyme`      | 4-letter ending → words                                                                        | rhyme finder, impact on songs |
| `byUsage`      | entry id → texts, examples, lessons citing it                                                  | impact preview                |
| `legacyForms`  | pre-1.0 spelling → its forward mapping (`migration_forms`, 509 entries)                        | G19 version gating            |
| `reserved`     | reserved spelling → why                                                                        | new-spelling validation       |

At current size — 1099 headwords, 7693 forms, 149 function words, 11,235
distinct spellings indexed — all of this is small. The budget is the full load
plus every index under one second; **measured at about 140 ms**.

Two details the indexes have to get right:

- **`byForm` values are lists.** 32 spellings span namespaces, and
  `time_and_dates` cross-lists three correlatives, so a lookup returns a set of
  candidates. Colour words are a namespace of their own: none of the 45 is a
  headword.
- **`legacyForms` targets are not always forms.** `migration_forms.kind` has
  five values, and for `archived-phrase` the target is a multi-word phrase.
  `resolveSpelling` returns `{ refs: [], phrase }` for those five, so a caller
  renders the phrase rather than failing to find an entry.

Depends on: `config`.

### `core/morphology/` — form generation

The seven forms from a spelling; the verb rule; the suffix stack
(`root → one form OR one derivation → -ti → -ri`); compound assembly.

Two rules worth stating because they are easy to get wrong:

- Concatenation is **literal**. No elision, so `dorva + asa` = `dorvaasa`.
- A compound's verb class follows the **first letter of the whole word**, which
  is its modifier's first letter.

`protected: true` is on every 1.0 headword, so in practice the generator never
overwrites a stored spelling; it _proposes_, and the golden test compares.

**Golden test:** regenerate all 1099 × 7 forms and compare with the stored
forms. **Green: zero mismatches**, and all 7693 are distinct. A mismatch is a
test failure that names the words; it is reported, never auto-corrected.

All five branches of the verb rule are exercised by real headwords, the
irregular included: `opi` ("Hope") is a Primal headword whose stored verb is
`opioa`, where the general vowel-initial rule would give `opia`.

Depends on: `config`.

### `core/parse/` — the word parser

**Lexicon-first, never blind suffix stripping.** Many roots end in letters
that look like suffixes (`navu`, `sevu`, `trana`, `pago`). The algorithm:

1. exact lookup in `byForm`
2. longest known word, then the closed list of endings
3. `-ti`
4. `-ri`

It also recognises function words, pronouns (with `-ri`), discourse particles,
correlatives (`ki-coda`…), hyphenated numbers
(`dossacenta-unzira-penta`), ordinals (`una-ne` — the `ne` after a number is
never negation), time words, colour compounds and proper names.

It returns **all** valid parses, ranked, never just the first — check 17 lists
the compounds with more than one valid two-part split, and `byForm` values are
lists. Capitalisation and punctuation are kept as token metadata.

Output: an interlinear gloss — surface / segmentation / per-morpheme gloss /
free gloss.

Depends on: `config`, `model`, `morphology`.

### `core/validate/` — the 24 checks

One function per check, each separately tested, each returning
`{id, check, status, details[], note}`. The suite is a port of
`data/source/validate.py`, whose two helper modules are missing (ADR-0001,
finding 16), so the port reimplements `liraasa_core` and `liraasa_lexicon`
from the Codex and the observable behaviour.

| Group                   | Checks                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Identity and collisions | 1 duplicates · 2 root-vs-form · 3 derivative collisions · 4 closed-class vs lexical                                                    |
| Shape of new material   | 5 phonotactics · 6 syllables and stress · 18 proximity ≥2 edits · 19 monosyllable neighbours · 20 particle misreading                  |
| Compounds               | 7 well-formedness · 8 dependency cycles · 17 segmentation ambiguity (WARN)                                                             |
| Metadata                | 9 required fields and unresolved glosses · 11 registers · 16 duplicate glosses (WARN)                                                  |
| Morphology              | 10 the seven forms follow the rules                                                                                                    |
| Baseline and legacy     | 12 every 0.8 headword accounted for · 13 reserved spellings unused · 23 migration completeness · 24 no compound on a retired primitive |
| Corpus                  | 14 no unknown words · 15 no retired spellings · 21 clause grammar                                                                      |
| Editorial               | 22 every candidate has one disposition                                                                                                 |

Parity target: equal to `data/source/validation_1_0.json` on the 1.0 lexicon —
24 checks, all PASS. **Check 12 cannot run**: it needs
`lexicon_0_8_rc2.json`, which is missing. It reports
`status: "FAIL", note: "not executed"`, exactly as `validate.py` does, until
the baseline arrives. That is a known, documented gap, not a silent pass.

Depends on: `config`, `model`, `morphology`, `parse`.

### `core/grammar/` — the sentence checker

The validator proves lexical validity; this proves grammaticality. It checks
the 20-slot clause template: operator order (left scopes over right), tense
before `ne`, one evidential per clause, the 13 stacking exclusions,
`hoyo`/`yasmo` before the attitude marker, attitude and `ki` clause-final only
(G22), `-ri` last and only on nouns and pronouns, `sige` clauses carrying their
own tense, `fuyi` only with a plural or coordinated subject, a non-final
`raho`-clause closed by a comma (G21).

Every finding carries a rule id, a message, the span, a severity
(error / warning / note) and a link to the grammar entry.

Two things SPEC §5.4 gets wrong, both resolved by the 1.0 data:

- The **`gome` check is now implementable.** SPEC calls it "skipped, needs
  data"; settled question 5 makes transitivity **usage-based** — `gome` may
  passivise any verb used with an object in the clause, and a verb used without
  one cannot take `gome`. No `transitive` field is needed, and none should be
  added.
- The **clause template is the 20-slot one** in SCHEMA §1.7.1, not the 10-slot
  0.8 template SPEC quotes.

Register-aware: poetic omissions (dropping `li`, a repeated subject, `ke`/`ka`
before a `-san` adjective) are never errors in poetic mode.

Depends on: `config`, `model`, `parse`.

### `core/generate/` — the generators

Correlatives (determiner × concept), numbers 0–999,999,999 with the hyphenation
rules, colours (hue × modifier), time words. Each is tested against the values
stored in the JSON — `numbers.lookup_0_999` is a ready-made 1000-case oracle.

Depends on: `config`, `model`.

### `core/change/` — the change engine

Impact analysis, changesets, atomic apply, undo, edition policies.

The impact preview for a respelling walks: the entry's seven forms → every
compound using it as modifier or head (`byComponent`) → their forms → every
derivation → every text line, example and lesson citing it (`byUsage`) →
rhyme families gained and lost (`byRhyme`) → collisions against `byForm` and
every closed class → phonotactics and proximity for the new spelling →
**verb-class changes** when a first letter changes, which cascade to every
compound that takes its class from that modifier.

`byUsage` is what makes this cheap, and stable ids are what make it correct:
texts cite ids, so a respelling is a re-render, not a rewrite.

Depends on: `config`, `model`, `morphology`, `validate`, `grammar`.

### `core/translate/` — the translator

A `TranslationProvider` interface with two implementations: the rule-based
offline engine (parse and gloss one way; assisted composition from the synonym
and gloss index the other) and the LLM-assisted provider.

The LLM provider calls the Anthropic Messages API from the browser with the
author's own key, which lives in local settings and never in the repo or the
exported data. **Every LLM output is tokenised, parsed and checked before it is
shown** — the provider boundary is where untrusted text stops being trusted.
See ADR-0006.

Depends on: `config`, `model`, `parse`, `grammar`.

### `core/learn/` — lessons, exercises, scheduling

The lesson engine, the exercise generators (each drawing only on real entries
and canonical meanings — never an unused slot), and a `Scheduler` interface
with an FSRS or SM-2 implementation behind it. Progress is stored per learner
profile.

Depends on: `config`, `model`, `morphology`, `parse`, `generate`.

---

## 3. Storage

```ts
interface StorageAdapter {
  readJson(path: string): Promise<unknown>;
  writeJson(path: string, value: unknown): Promise<void>;
  list(dir: string): Promise<string[]>;
}
```

- **`FileSystemAccessAdapter`** (primary). The author picks the project folder
  once; the handle is remembered in IndexedDB and permission is re-requested on
  load. Writes are atomic — write a temp file, then replace — and every save of
  the lexicon writes a timestamped backup to `data/lexicon/backups/`
  (gitignored).
- **`IndexedDBAdapter`**. Autosave of unsaved work and learner progress.
- **Bundle export/import**. The fallback, and the escape hatch.

The interface is deliberately path-shaped so a Tauri adapter is a drop-in
later.

---

## 4. UI

A thin shell: hash-based routing (so the build works from `file://`, a static
host or a Tauri window unchanged — ADR-0005), a command palette on Ctrl+K
reaching every word, text, lesson and action, and one shared component set.
Plain CSS with custom properties for tokens; the light palette is defined on
bare `:root` and the dark one redefined under both `prefers-color-scheme` and
an explicit `[data-theme]`, so the settings toggle wins in both directions.

Eleven modules, one folder each under `src/ui/modules/`, per SPEC §7:
Dashboard · Lexicon · Root Lab · Codex · Translator · Learn ·
Grammar reference · Validate · Changes & Editions · Open questions · Settings.

Accessibility is a build requirement, not a pass at the end: WCAG 2.2 AA, full
keyboard operation, visible focus, screen-reader labels on the ingredient chips
and a keyboard alternative to every drag-and-drop exercise, reduced motion
respected, nothing conveyed by colour alone.

---

## 5. Data flow

**Load.** `StorageAdapter` reads `data/lexicon/liraasa_1_0.json` →
`core/model/import` maps it to internal records and assigns or reads ids →
`core/model/indexes` builds every index → the UI renders. Under one second.

**Edit the language.** Root Lab collects an intent → `core/change` builds the
impact preview from the indexes → the author reviews it → apply writes one
changeset, mutates the records, rebuilds the indexes, re-renders every affected
text from its tokens, **runs the 24 checks**, and only then writes the lexicon
with a backup. A save that would introduce a FAIL is refused and reported
(ADR-0007). Undo replays the changeset inverted.

Every operation is recorded as a `ChangeRecord` — what changed, old value, new
value, reason, and an edition-qualified ruling reference where one applies. A
record with no reason is rejected before it reaches storage.

**Write a text.** The Codex editor holds tokens, not characters. Typing runs
`core/parse` per word and `core/grammar` per clause, live. An unknown word is
never invented: the quick actions are "build a compound from existing roots"
(a proposal, flagged noncanonical) or "add to open questions".

**Translate.** English in → synonym and gloss index → candidates the author
picks from → assembled in template order → checked → optionally saved as a
token document. The LLM path adds a model call before the check, never after.

**Validate.** `core/validate` over the records plus every stored text, with the
same output shape as `validation_1_0.json`, from both the UI and
`npm run validate`.

---

## 6. What the tool never decides

Hard-coded nowhere, surfaced in the Open questions module, resolvable only by
an explicit logged author action (SPEC §14). Note that the 1.0 data has
**already closed** the eight 0.8 open questions, including the three
unconfirmed compounds and transitivity, in `settled_open_questions_0_8`. The
module reads that section, shows them as settled, and its live list is the
questions in ADR-0001 §3 plus whatever the tool flags.
