# Liraasa 2.2 patch — task for Claude Code

You are applying the **Liraasa 2.2** patch to the Liraasa Workbench, the project that holds the lexicon, rulings, and generators for the reference grammar PDF and `liraasa_*_llm.json`. The author already applied **2.1**. 2.2 brings the grammar in line with the published album, restores one 2.1 respelling, fills two empty forms, and adds the album as a reference corpus.

All data is in two files that ship with this one:

- `liraasa_2_2_patch.json`: rulings, superseded rulings, lexicon changes, the full `silro` revert cascade, album readings, open questions, edition note.
- `liraasa_album_corpus.json`: all 13 album texts line by line, as recorded, with a precomputed 2.2 spelling where it differs.

## 0. Before changing anything

1. Find where the Workbench stores rulings, the dictionary, image-compound data, listed derivations, open questions and edition notes. Find also the generators that build the PDF and the LLM JSON. Summarize the layout to the author in a few lines.
2. Confirm 2.1 is applied: rulings `2.1:G46`–`2.1:G59` exist, and the lexicon has `puzu` (secret) where 2.0 had `silro`. If either check fails, **stop and report**. Do not guess.
3. Compare the text of `2.1:G46`, `2.1:G47` and `2.1:G54` in the project with what this patch supersedes: question-word position, exclamatives, and “so … that” with `ola-modo`. If the author changed them, report the difference and ask before superseding.
4. Ask the author to confirm or rewrite the two glosses marked `confirm_with_author: true`: `soloasa` and `tarnulinusan`. Write them only after confirmation.
5. Make a branch or backup first. Commit each numbered step below separately.

## 1. Rulings

- Add `2.2:G60`–`2.2:G68` from `rulings`, with topic, rule text and examples, in the project’s ruling format.
- Mark each entry in `superseded` with the project’s superseded/status field. **Do not delete or renumber** any ruling. For `0.8:G4`, mark only its embedded wh-question clause as superseded; its quotation clause stands.
- Wherever the project lists “where each ruling is taught”, place G60–G62 with the clause/questions section, G63–G66 with linking clauses, G67 with the small words and prepositions, and G68 with the corpus/appendix.
- Fix the small-words table’s question examples so they agree with G60. Both orders are now valid, so the existing fronted examples can stay; just add a final `ki` where G60 allows it.

## 2. Lexicon

### 2a. Restore `silro` (reverts the 2.1 respelling `silro → puzu`)

Apply `lexicon.revert_silro` exactly:

- The root `puzu` and every listed form go back to `silro` and its 2.0 forms. The verb goes from `puzupa` back to `silrosia`.
- The 12 compounds in `compounds`, each with every form, go back.
- The image-engine modifier `puzu` goes back to `silro`, and so do the 8 attested image compounds.
- Keep `protected: true` on the restored spellings. `puzu` becomes a retired spelling. Record it however the project records retired spellings, so 2.1 texts can still be read.

Afterwards, check that no `puzu…` form remains anywhere except the retired-spellings record.

### 2b. Fill two forms (after author confirmation)

- `solo` gets the ascended noun `soloasa`.
- `tarnulinu` gets the adjective `tarnulinusan`.

## 3. Album corpus

- Import `liraasa_album_corpus.json` as a corpus: 12 tracks plus the alternate 05. **Never edit `recorded` text.**
- Import `album_readings` (`AR-01`…`AR-16`) linked to track and line. Items marked `author_confirm` have no standard form or a tentative one. List them for the author and do not fill them in yourself.
- In the grammar generator, add a part after the Nemelira chapter: **“The album”**. For each track:
  - Show the title, then each line as recorded, with a gloss under each word from the lexicon. Use the same glossing code the Nemelira chapter uses.
  - Where `spelling_2_2` differs, add a quiet note under the line giving the current spelling. Cite 2.1:G58: 2.0 texts are read with 2.0 spellings.
  - Mark album-reading lines with their `AR-` id and give the standard form in a footnote or note.
  - Don’t write English translations. If the project lacks them, leave a placeholder for the author.
- Recompute `spelling_2_2` from the live lexicon. Don’t trust the precomputed value. If the author adopted any 2.1 review items, such as `desi → diso`, the live lexicon will differ from the precomputed values. Report any differences.
- Add the album to the LLM JSON as canon example text, tagged as 2.0 text with 2.0 spellings, and with readings flagged so a model does not imitate them.

## 4. Open questions, counts and edition notes

- Add the two items in `open_questions.add`. Note that `open_questions.closed` partly answers “to + verb” through `2.2:G65`. Update that entry; don’t remove it, because the general case remains open.
- Bump the version to **2.2** wherever it appears: cover, footer, JSON title.
- Add `edition_note` to Appendix D (Editions and rulings).
- Recompute headword and form counts from data. Don’t hand-edit them. Headwords stay 1,462. Meaningful forms go up by 2.

## 5. Validation (all must pass before you report done)

1. Every word in the examples of `2.2:G60`–`G68`, and in every non-null `standard_form`, resolves in the 2.2 lexicon, as a listed form, a small word, a regular inflection, a derivation, or an image compound.
2. No two headwords or forms share a spelling, and no `puzu` form survives outside the retired list.
3. Every album line resolves under the 2.0 reading, except the two filled forms. Those must now resolve too.
4. Run the project’s existing checks and tests, if any.
5. Regenerate the reference grammar PDF and the LLM JSON. Open the PDF. Check the new album part and the new rulings render, and the Nemelira chapter is unchanged.

## Don’t

- Don’t change any spelling other than `silro` and the two filled forms.
- Don’t alter album `recorded` text, or invent translations or meanings.
- Don’t renumber, reword or delete existing rulings. Supersede them.
- Don’t silently resolve anything marked `author_confirm`.

## Report back

Give a short summary: files changed, rulings added and superseded, revert counts (1 root, 12 compounds, 8 image compounds), album readings imported, `author_confirm` items still open, `spelling_2_2` differences found, validation results, and paths to the regenerated PDF and JSON.
