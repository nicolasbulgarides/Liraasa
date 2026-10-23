# ADR-0020 — Liraasa 2.5: the author's grammar decisions, a strict checker and a translator

- **Status:** accepted (the open questions in `review/questions_2_5.md` await the author)
- **Date:** 2026-10-22
- **Phase:** 2.5

## Context

The 2.3 grammar audit (`review/grammar_spec_2_3.md`) logged fifty-five issues.
The author decided them in "Liraasa 2.4 grammar decisions". The patch
(`data/proposals/liraasa_2_5_patch.json`, with its README
`LIRAASA_2_5_README.md`) records those decisions as forty-four entries, plus
housekeeping and eighteen open questions. The release is numbered 2.5.

The patch carries two verdicts on the tools:

- The album shipped with adjective forms where nouns belong, and the 2.3
  checker passed every line.
- The English composer produced many ungrammatical translations.

Part of the cause was 2.2:G68 ("the album's consistent usage is grammar"),
which the checker had been tuned to. The rest was structural, and is
diagnosed in `review/translator_diagnosis_2_5.md`:

- form against slot was checked only in the verb slot;
- the composer kept its own copy of the grammar and never checked its output.

## Decision

### 1. 2.5 is built from frozen 2.3 by three changesets, in the README's order

`npm run integrate:2.5` reads `liraasa_2_3.json`. It halts unless the file's
sha256 is `631b9ca4…d6acd5`, and then applies:

1. `…-2-5-album.json`: D-00, 2.5:G87, the album is not grammar canon. It
   supersedes 2.2:G68.
2. `…-2-5.json`: rulings 2.5:G88–G128, in the patch's order. G126–G128 stand
   in their topic's place, because their ids come last.
3. `…-2-5-housekeeping.json`: I-26, I-27, I-33, I-40, I-41 and I-44.

`scripts/make_changeset_2_5.ts` makes all three from the patch. The patch is
semantic, so each target was resolved against the real JSON:

- a target that is lexicon data became an op whose `from` must match what 2.3
  says;
- a target that is a summary the build writes (`hard_rules`, `clause.*`,
  `recipes`, `self_check`, the reader's steps, the open questions, the album
  text) was changed in `scripts/build_llm_json.ts` or
  `scripts/grammar_guide/chapters.ts`.

Each step was committed separately.

### 2. New ops, and the conventions they keep

**`add_ruling`.** The ruling payload keeps the existing format. It adds the
patch's fields verbatim: `issue`, `amends`, `examples_ungrammatical`,
`derived`, `settles_open_questions`, `translator_preference` and `notes`.

**`amend_ruling`.** An earlier ruling that a 2.5 ruling amends, rather than
supersedes, is kept as ruled and marked `amended_by: [{by, scope}]`. The
reference shows it as "AMENDED by …: where they differ, follow …". Twenty-three
rulings are marked.

**`mark_ruling_covered`.** 2.3:G75 is `covered_by` 2.5:G121 and still stands.

**`edit_value`.** A non-text value at a dotted path: a slot's word list, the
new `grammar.edges`, the -ti items in `morphology.lexicalised_diminutives`,
each example's `kind`, each time-table row's `time_class`. Rulings are never
edited this way.

**`edit_function_word` and `archive_text`.** `edit_function_word` may now
rewrite a row's meaning and use. `archive_text` takes a `text:` path:

- 1.2:G27's present-location example is archived for its `ke` form;
- 2.3:G73's album example is archived for 2.5:G104's;
- the obsolete digit comments are archived.

**A ruling is never reworded.** Where the patch asks for "0.8:R9 wording", the
function-word rows and the slot follow, and the ruling is left as it was
(questions §4).

**Validation.** `scripts/validate_2_5.py` runs `validate_2_3.py` for checks
1–24. It replaces check 25 with an independent re-application of every 2.5 op
to frozen 2.3, comparing section by section. The result is 23 PASS and 2 WARN
(the kept 2.0 ambiguities).

### 3. One strict checker, for the editor and the translator (`src/core/grammar`)

It is pure TypeScript, built from data:

- the 2.5 reference (`handoff/liraasa_2_5_llm.json`);
- `data/checker/lexicon_flags.json`;
- the new `data/checker/rules_2_5.json`, whose word lists and rule parameters
  are lifted from the ruling texts, each with its ruling;
- `data/checker/transitive_2_5.json`, computed from canon (2.5:G110).

What it does:

- **It reads every word into all its readings.** `maivo` is both I and Self
  (2.5:G100). Image compounds have seven forms (2.5:G124). Any verb takes a
  motion prefix (2.5:G121).
- **It parses each sentence** against the 2.5 clause template with its edges
  (linker, FRAME, TOPIC, a fronted ki-word, a vocative; 2.5:G126), and against
  the noun-phrase template (2.5:G98).
- **It checks each word's form against its slot.** This is the check that
  catches the album: an adjective standing as a noun (1.2:G29), an adjective
  where the verb belongs (2.5:G126), a noun after a degree word (2.5:G98).
- **Every finding names its rule.** What the author has not ruled is reported
  as `unruled`, never pass or fail: two adjectives before a noun,
  kroti + a quantifier, a command's operators, the drafted recipient verbs.
- **Nothing exempts a sentence**, album readings included.

The 2.3 checker in `editor/checker` is not deleted. It reads the frozen 2.3
reference, keeps its regression tests, and supplies the editor with what the
strict checker does not do: the English pairing check, calques and register
notes.

### 4. The translator (`src/core/translate`)

The translator runs as a pipeline:

1. **English → meaning frame** (`english.ts`, rule-based). Its English
   knowledge is data: `data/translate/english_2_5.json`. An LLM may fill this
   stage later; its output would be a frame, never Liraasa.
2. **Frame → Liraasa structure** by the rulings (`toLiraasa.ts`). It follows
   the patch's translator preferences: `li maivo` for Self, an article in
   partitives and similes, no right-grouped de chain, attested image compounds
   first.
3. **Words from the dictionary only** (`lexchoice.ts`). A gap is reported with
   the nearest listed words.
4. **The strict checker.** Other renderings are tried. If none passes, the
   reasons are returned, never broken Liraasa.
5. **Back-translation.** `fromParse.ts` reads the parse back into a frame,
   which must regenerate the same structure.
6. **The work shown.** Every output carries its interlinear gloss (word, form,
   slot, rules) and its flags.

An English word the reader cannot place fails the line rather than being
dropped.

### 5. The editor

`npm run build:grammar` bundles the checker and the translator into
`editor/grammar/`. The editor:

- takes its grammar findings from the strict checker alone, with rule ids;
- uses the translator for Compose;
- shows each word's slot in the gloss panel;
- has no approve button. **Propose a ruling** records the sentence and the
  rule it conflicts with, downloadable as `review/proposed_rulings.md`, and
  the sentence stays failing.

The 2.3 word-by-word composer stays one click away.

## Consequences

**Tests.**

- `tests/grammar`: every ✓ example of the patch reads clean and every ✗ is
  rejected citing its ruling. Canon reads clean except nine findings, pinned
  for the author. Forty-seven album lines are rejected. Every golden sentence
  round-trips through the frame except eight asides and quotations.
- `tests/translate`: 106 English cases, derived from the rulings.
- The 2.3 checker's tests are unchanged.

**Reports.** `review/changelog_2_5.md`, `review/resolution_report_2_5.md`,
`review/questions_2_5.md` (the open questions, the drafts, the conflicts found),
`review/translator_diagnosis_2_5.md` and `review/stored_writings_2_5.md`.

**Grammar is data.** A change is a new changeset op and a rebuild. The checker
reads the result, so a new ruling needs a parameter in `rules_2_5.json` or a
parse rule only where the template itself changes.
