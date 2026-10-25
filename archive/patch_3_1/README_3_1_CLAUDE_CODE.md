# Liraasa 3.1 patch: instructions for Claude Code

**Liraasa 3.1 ("Everyday and Fiction")** is a **proposed, lexical-only** patch on top of **3.0**. It adds no grammar.
- It adds 5 roots, 69 compounds, 4 listed derivations, 6 lexicalized diminutives, 4 restored forms and 6 documented recipes.
- Every entry carries a `tier`:
  - **Tier 1 (35 entries):** genuine gaps; ratify first.
  - **Tier 2 (53 entries):** optional, decided item by item.

## Files

| File | Purpose |
|---|---|
| `liraasa_3_1_patch.json` | The patch, in the same structure as the 3.0 patch, plus `tier`, `recipes_add` and `test_sentences`. |
| `apply_patch.py` | Generalized merger. Works for 3.0 onto 2.5 **and** for 3.1 onto 3.0. Aborts on any collision. |
| `validate_patch.py` | Generalized validator, for either patch. Handles motion prefixes and `recipes_add` / `test_sentences`. |
| `Liraasa_3_1_Review_and_Patch.md` | Human review: the disposition of all 129 report candidates, plus the word lists. |

These two scripts replace `apply_patch.py` and `validate_3_0.py` from the 3.0 delivery.

## Steps

1. **Build 3.0** if it isn't built yet:
   ```
   python3 apply_patch.py liraasa_2_5_llm.json liraasa_3_0_patch.json liraasa_3_0_llm.json
   python3 validate_patch.py liraasa_3_0_llm.json liraasa_3_0_patch.json
   ```
2. **Build 3.1:**
   ```
   python3 apply_patch.py liraasa_3_0_llm.json liraasa_3_1_patch.json liraasa_3_1_llm.json
   python3 validate_patch.py liraasa_3_1_llm.json liraasa_3_1_patch.json
   ```
   Both runs must print `PASS`. Expected totals after 3.1: **1,664 headwords, 4,404 meaningful forms**.
3. **To ratify tier 1 only:** filter every list in the patch to `tier == 1` and recompute `counts`. Then run step 2. Never hand-edit a merged JSON.
4. **Regenerate the human documents** from the merged JSON.
   - The study guide gains the tier-1 words in its body, conversation and time pages.
   - Add the `recipes_add` rows (recognize, realize, prefer, favorite, misunderstand, envy vs jealousy) to the recipes page.

## Rules

- **Additions only.** No 2.5 or 3.0 word is changed. *velsona* (unveiling) remains the poetic and sacred "revelation"; *silrosudesia* is the everyday "reveal a secret".
- **Keep the 3.0 decisions independent.** If 3.0 is revised or rejected, rebuild 3.1 against the new base. The patch asserts the base headword count, 1,590.
- **Gaps that remain open:** leak, ankle (and other joint words), sock. Do not invent them in documents.
