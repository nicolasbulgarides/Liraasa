# ADR-0014 — The editor's grammar checker

- **Status:** accepted
- **Date:** 2026-10-17
- **Phase:** 1.2

## Context

The songbook editor had grown a checker inline in `editor/index.html`: about
800 lines of hand-kept word lists (determiners, give-type verbs, say-type verbs,
pronoun glosses) beside the slot logic. Every lexicon change risked leaving it
behind, its messages named no rule, and it had no notion of a fix.

The author's brief for a replacement set the ground rules: the JSON is the
source of truth and nothing readable from it is hardcoded; an unknown word is
an error, never a guess; every diagnostic carries a severity, a rule id, a
plain message and a fix when one exists; a construction no rule covers is
reported as `unsettled`; no dependencies, offline, in the browser.

## Decision

### 1. A separate checker under `editor/checker/`, read from the 1.2 LLM reference

Plain classic scripts, each an IIFE registering on `window.LiraasaChecker`, so
the editor still opens from `file://` with no bundler, no modules and no fetch.
Load order is the `MODULES` list in `editor/checker/index.js`; a test pins the
editor's `<script>` tags to it.

The grammar comes from `handoff/liraasa_1_2_llm.json` (the dictionary lines,
closed words, morphology, the 20-slot clause template), wrapped as a JS global
by `npm run build:checker`, which `npm run build:llm` also runs.

### 2. What the JSON does not say lives in `data/checker/`, as data

- `lexicon_flags.json` — word classes the JSON leaves implicit (determiners,
  prepositions and their senses, coordinators, give- and say-type verbs, the
  one not-causative verb, 92 noun classes for the 1.2:G33 instrument check).
- `english.json` — English stopwords, irregular forms, past and participle
  lists, the marker glosses and pronoun owner/object glosses for the
  back-translation.
- `calques.json` — English calques as regexes, each tied to the JSON entry it
  needs (`valency:causative`, `correlative:never`, …), so a calque disappears
  if its Liraasa side does.
- `names.json` — the proper names.

Every overlay entry is a curation the author can read and correct; none is a
new word or a new meaning.

### 3. The pipeline

tokenize → read each word (exact form, closed word, numeral, derivation,
`-ri`/`-ti`, motion prefix, fraction, legacy, name, unknown) → assign slot
roles → split clauses at linkers, relatives and commas → place each clause in
the 20-slot template → run the rule files. Each rule file emits diagnostics of
one shape: `{line, start, end, token, severity, rule, message, fix, fixStart,
fixEnd, autoFix}`. `autoFix` is true only when the fix is unambiguous; only
those get the per-line Apply button.

Rule ids are edition-qualified (`1.2:G33`, `0.8:G2`) or name their source
(`ADR-0011`, `slot`, `never invent`, `gloss drift`, `calque`).

### 4. The editor uses only the new checker

The old inline checker was removed with its tests ported first
(`tests/checker/legacy.test.ts`, `tests/checker/validator.test.ts`). If the
checker fails to load, the editor says so in the Check tab rather than falling
back to a second, divergent opinion.

### 5. Canon is the false-positive test

Every live example, function-word example and particle example in the lexicon
is checked; every finding on canon is pinned in a `KNOWN_*` / `GUIDE_FINDINGS`
list and reported to the author, never silenced by loosening a rule.

## Consequences

- A lexicon change reaches the checker by `npm run build:llm`; a class the JSON
  lacks is one line in `lexicon_flags.json`.
- The 1.0 grammar guide examples still produce 17 findings, all pinned: words
  retired or respelled since 1.0, unused slots, noun + noun pairs revised in
  1.2, and morphology formulas that are not sentences.
- The composer (`composeSentence`) remains inline in `editor/index.html`; its
  output is checked by the new checker in `tests/golden/composer.test.ts`.
