# Liraasa 3.1: questions for the author

**Answered on 2026-10-25, except the hymn's Liraasa title (section 3), which is still open.**

Liraasa 3.1 is installed whole, as **proposed** (ADR-0022): tier 1 and tier 2 together. To ratify tier 1 only, or to drop an item:

1. Edit `archive/patch_3_1/liraasa_3_1_patch.json`.
2. Run `make_changeset_3_1.ts`, then `integrate:3.1`, then `validate:3.1`.

The questions for 3.0 are still open, in `review/questions_3_0.md`.

## 1. The sound check

- **Close to retired spellings:** `dugo`, `bika` and `pega` are each one edit from a retired spelling that old texts still use (`vugo`, `biya`, `fega`). Keep them, or respell? **Answer:** keep; similar sounds and spellings are not a concern (2026-10-25).
- **`famlilinu`:** it makes `purmafamlilinu` split two ways, purmafamli + linu and purma + famlilinu. Keep it? **Answer:** keep (2026-10-25).
- **`lisicemokova`:** it splits as lisi + cemokova and as lisicemo + kova. Keep it? **Answer:** keep (2026-10-25).

## 2. The tiers

All 88 entries are installed. Ratify all of them, or tier 1 only? **Answer:** ratify all of 3.1 (2026-10-25). Done in 3.3: changeset `2026-10-25-lexicon-3-3-ratify-3-1` (ADR-0023).

## 3. The hymn, as canon

*The Song of the First Stars* is now a canon corpus text (`data/corpus/hymn/song_of_the_first_stars.json`), shown in the editor's Hymn view.

- **Line 12:** the 3.0 patch has `kasi muya patuti` ("further points"). `kasi` + a quantifier is not ruled, so the canon text reads `muya loterosan patuti` instead, using the 2.5 translation's word for "further". Rule on `kasi muya`, or keep the new wording? **Answer:** keep line 12 as it is (2026-10-25).
- **The Liraasa title:** under 3.0:G131 the PDF's title, `Liraasa de li una-ne veluri`, reads "Liraasa's first stars". The canon title is the hymn's own name in line 24, `Li lira de li una-ne veluri`. Agreed? **Answer:**
- **Line 15:** the English says "the heat of the listening stars", and the Liraasa follows it with `suma`. The translator noted this might be a slip for "heart" (`lore`). Which is it? **Answer:** heat, not heart (2026-10-25).
