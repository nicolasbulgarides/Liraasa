# ADR-0030: 3.6 and 4.0 ratified; the vocabulary candidates approved; the Liraasa draft in git

- **Status:** accepted
- **Date:** 2026-10-27

## Context

On 2026-10-27 the author wrote: "Ratify 3.6 and 4.0 and approve the vocabulary candidates for closing the remaining gaps, only push the liraasa novel to git not the interlinear text."

## Decision

### Vocabulary

The approved candidates join 4.0, which nothing yet builds on. They are taken from `review/2100_dreams_vocabulary_suggestions.json` by `translation/tools/make_patch_4_0.py`.

- **Four new compounds:** _harlujomrupilo_ (adventure guide), _lulfavelma_ (shoulder hood), _sernafavro_ (tablet) and _helvikova_ (cubby).
- **Already in 4.0:** the other suggested compounds, because the draft had used them.
- **Two compounds coined by the last meaning pass** are also in 4.0, which now has 226 compounds.
- **Six English aliases** make existing words findable: soul → _lulfaasa_, reflection → _ramulumi_, rulebreaker → _mavopagona_, blessing → _jubaseno_, nurse → _molusasvayo_ and saved → _hirnaasasan_.
- **Left out:**
  - _harlulore_, because one of its parts is not a headword;
  - the "existing word" suggestions whose form is not a listed form, such as colour words. Those remain recipes.

The generator now judges what is already a word against 3.6, the edition 4.0 is built on. Before this fix, it read the current lexicon and so counted 4.0's own words as already existing.

### Ratification

A second 4.0 changeset, `2026-10-27-lexicon-4-0-ratify`, made by `ratify4_0` in `scripts/make_changeset_4_0.ts`:

- marks rulings 3.6:G153–G155 and 4.0:G156–G161 ratified, using `ratify_ruling` (their text is unchanged);
- updates 373 headword notes to say they are ratified, using `edit_metadata`.

`PROPOSED_EDITIONS` is empty, so every edition is canon. The documents no longer call 3.6 or 4.0 proposed.

4.0 now has 2,468 headwords. `validate:4.0` passes check 25, and the author's validator gives PASS.

### Git

The Liraasa text of the novel, `translation/draft/2100_Dreams_Liraasa_DRAFT.md`, is committed. `translation/draft/interlinear.md` stays out of git, as do the manuscript, the segments and the run outputs, all of which carry the English text.
