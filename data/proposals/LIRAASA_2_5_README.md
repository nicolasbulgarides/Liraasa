# Liraasa 2.5: grammar patch and translator rebuild

This README is for Claude Code. It comes with `liraasa_2_5_patch.json`, which records the author's decisions on every issue in the 2.3 grammar audit. Your job has two parts:

1. Apply the patch to produce Liraasa 2.5.
2. Rebuild the English-to-Liraasa translator and the grammar editor so they stop producing and approving broken grammar.

Part 2 matters as much as part 1. The current grammar editor and translator mistranslated English and approved ungrammatical Liraasa. The album shipped with adjective forms used where nouns belong, and the checker passed every line. A correct grammar is worthless if the tools that write in it ignore it.

## Inputs

- `liraasa_2_5_patch.json`: the decisions (authoritative for every grammar change).
- `data/lexicon/liraasa_2_3.json`: the canonical grammar and lexicon. Never hand-edit the generated handoff file; regenerate it.
- `review/grammar_spec_2_3.md` and `review/grammar_spec_2_3_parses.md`: the 2.3 audit (axioms A*, issues I-*) and its parse baseline.
- The Liraasa tool in this repo (translator, grammar editor, codex, root viewer, stored writings).

Paths may differ. Inspect the repo first and report what you find before changing anything.

## Ground rules

1. **The patch is the only authority for grammar changes.** Apply every entry in `decisions` (all are marked `"status": "apply"`). Never invent an answer to anything in `author_inputs_needed`.
2. **Paths are hints.** The patch is a semantic patch, not an RFC 6902 JSON Patch. Its target paths come from the audit. Resolve each one against the real JSON. If a target doesn't exist or doesn't say what the patch expects, stop and report it rather than guessing.
3. **Rulings.** Add each new ruling in the existing ruling format with the id given (2.5:G87 onward). Check the highest existing ruling number first; if it is above G86, renumber the patch's rulings in order and update every cross-reference. Each new ruling cites its issue id. Mark superseded rulings with the existing SUPERSEDED convention and a pointer to the new ruling. Never delete a ruling.
4. **Summaries follow rulings.** After each change, rewrite every summary that restates the changed rule: `read_me_first`, `hard_rules`, `clause`, `recipes`, `how_to_translate`, `self_check`, `small_words`. No summary may restate a superseded rule.
5. **Never change a root's spelling.** The only new word is `antizi` (2.5:G125), and it must pass the function-word template first.
6. **The album is non-normative** (2.5:G87). Keep its text. Nothing in it licenses anything.
7. **Derived entries.** Entries with a `derived` field spell out a consequence the patch needed to be unambiguous. Apply them, and list each one in your report for the author to confirm.
8. **Stop and ask** when two decisions conflict, when an edit would change more than the patch describes, or when a ✓ example fails or a ✗ example passes after you apply its ruling.

## Part 1: apply the grammar patch

Work on a branch named `liraasa-2-5`. Follow the repo's existing versioning convention (look at how 2.2 became 2.3) and make this release 2.5.

Apply in this order, committing after each step:

1. D-00 (2.5:G87, retire the album as canon).
2. The remaining `decisions` entries, in file order. Rulings 2.5:G126 to G128 appear in their topic's place in the file even though their ids come last; apply them where they appear.
3. The `housekeeping` items.

After each step:

- Validate the JSON (parses, schema intact).
- Turn the entry's `examples_grammatical` and `examples_ungrammatical` into tests: every ✓ must parse, every ✗ must be rejected, and the rejection must cite the right rule.
- Run any `edits` with an `audit` action across the whole file, and log every change you make.

When all steps are done, regenerate the handoff file with the repo's build step.

Write the questions in `author_inputs_needed` to `review/questions_2_5.md` as a fill-in list, with the relevant ✓ / ✗ examples beside each. Where a decision asks you to draft something for approval (change-of-state verbs for 2.5:G110, recipient-verb tags for 2.5:G112), put the draft in that file too. Mark drafts as drafts. Don't treat them as final until the author approves.

## Part 2: rebuild the translator and grammar editor

### 2a. Diagnose first

Before changing either tool, find out exactly how they work today:

- Where the translator produces Liraasa, where the grammar editor validates it, and whether any step is an LLM call whose output is trusted without checking.
- Run both tools on every ✓ and ✗ example in the patch, and on the album lines. Record what each tool produced or accepted.
- Classify the failures: wrong word form in a slot (for example an adjective standing as a noun), wrong word order, wrong function word, invented words, rules applied from memory instead of from the data, and approvals of anything the rules forbid.

Write this up in `review/translator_diagnosis_2_5.md`. If the rebuild would remove a feature the author uses, stop and ask. Otherwise continue.

### 2b. A strict checker, independent of the translator

Build (or rebuild) one checker that both the translator and the grammar editor call. Requirements:

- **All grammar comes from the 2.5 JSON.** Templates, slot orders, word lists and rulings are read from the data. No hard-coded grammar and no grammar recalled by a model.
- **Segment every word** into root + form or derivation + -ti + -ri (or a closed-class word, numeral, correlative, compound, or prefixed verb), following the reader steps in `how_to_translate`.
- **Check every word's form against its slot.** A noun slot takes a noun form, an adjective slot an adjective form, and so on. This is the check that would have caught the album.
- **Check order and co-occurrence:** the clause template, the noun-phrase template (2.5:G98), the operator order and exclusions, the clause-end order, and every rule in the patch.
- **Every error names its rule id** (for example `2.5:G99: li dropped after a side noun`).
- **No exceptions for "approved" text.** Album readings, earlier approvals, and author-approved flags cannot make a failing sentence pass. A failing sentence fails.
- **Open items are reported, not guessed.** Where something in `author_inputs_needed` is still unruled (for example the order of two adjectives), report it as `unruled` rather than pass or fail.
- **Use the full clause shape from 2.5:G126,** including the edge positions: line linker, FRAME, TOPIC and a fronted ki-word before the clause, and a vocative after it.

### 2c. The translator: from English to a meaning frame to Liraasa

Rebuild the English-to-Liraasa path as a pipeline in which each stage can be checked:

1. **English → meaning frame.** Parse the English into a structured frame: clause type (statement, question, command, exclamation, wish), subject, verb, object, recipient, tense, aspect, modal, evidential, negation and its scope, adjuncts (time, place, manner, means, companion), and links between clauses (relative, complement, purpose, condition, cause, time). An LLM may help at this stage only, and its output is a frame for the next stage, never Liraasa text.
2. **Frame → Liraasa structure.** Fill the clause and noun-phrase templates deterministically from the frame, using the 2.5 rulings: question marking (2.5:G88), ke vs ka (2.5:G93), possession (2.5:G95, 2.5:G96), purpose with kopisa (2.5:G113), "would have" as po noma viki (2.5:G114), relatives with resumptive pronouns (2.5:G120), and so on.
3. **Word choice from the dictionary only.** Match each English sense to a listed form in the right slot. If no listed word fits, say so and offer the nearest listed words or a compound for the author to approve. Never invent a word, and never put a form in a slot that doesn't take it.
4. **Check.** Run the strict checker. If it fails, the translator tries another valid rendering. If none passes, it reports why instead of returning broken Liraasa.
5. **Back-translate.** Parse the Liraasa back into a frame and compare it with the input frame. If they differ, the output fails.
6. **Show the work.** Every output comes with an interlinear gloss (word, form, slot, rule ids) and flags for anything uncertain: a predicted image-compound form, an unruled construction, or a meaning with no listed word.

Where the grammar deliberately allows an ambiguity, the translator should still produce the unambiguous form. The `translator_preference` fields in the patch list these. In short:

- Write the noun "Self" as `li maivo` (2.5:G100).
- Write a partitive with an article, `una de li dossa` (2.5:G97).
- Write a simile with an article, `gase li …` (2.5:G107).
- Avoid three-part `de` chains when the meaning groups from the right (2.5:G96).
- Prefer attested image compounds over predicted forms (2.5:G124).

### 2d. The grammar editor

- It calls the same strict checker, and shows each error with its rule id and the offending word highlighted.
- It has no approve button that bypasses the checker. If the author believes a rejected sentence should be grammatical, the editor records a proposed ruling in `review/proposed_rulings.md`, with the sentence and the rule it conflicts with. The sentence stays failing until the grammar changes.
- It shows the same interlinear gloss as the translator.

### 2e. Tests

Create a test suite that runs with one command:

- **Golden:** every ✓ example in the patch, plus every canonical example sentence and recipe after the 2.5 edits.
- **Negative:** every ✗ example in the patch, plus the album's known errors (find every album line where a word's form doesn't match its slot; adjective-for-noun cases first). The checker must reject all of them.
- **English → Liraasa:** write a set of English sentences that covers every 2.5 ruling and every function-word family (questions, copulas, possession, time, manner, comparison, causatives, passives, relatives, purpose, motion prefixes, negative numbers …). Derive each expected Liraasa sentence only from the rulings, and mark any expected output you aren't sure of for author review. The translator must produce the expected output, or an equivalent that passes the checker and back-translates to the same frame.
- **Round trip:** every golden sentence parses to a frame and regenerates to the same sentence.

### 2f. Re-check stored writings

Run the strict checker over every stored Liraasa text in the tool (songs, devotionals, codex entries, saved translations). Report every failure with its rule id in `review/stored_writings_2_5.md`. Don't auto-correct grammar. The root viewer's auto-correct is for respellings; a grammar fix changes meaning and needs the author.

## Outputs

- `review/changelog_2_5.md`: every new ruling with its id, issue and one-line summary; every superseded ruling; every example changed by an audit edit; housekeeping done.
- `review/resolution_report_2_5.md`: each issue marked RESOLVED (ruling id), DEFERRED or NEEDS AUTHOR INPUT; every derived entry for confirmation; test results.
- `review/questions_2_5.md`: the author's fill-in list, including the drafts.
- `review/translator_diagnosis_2_5.md` and `review/stored_writings_2_5.md`.
- Test counts before and after: how many golden, negative, translation and round-trip tests pass.

Finish with a short summary: what changed, what's still open, and the five most important things the author needs to look at.
