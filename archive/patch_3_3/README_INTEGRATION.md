# Liraasa 3.3 integration bundle

This bundle takes `liraasa_2_5_llm.json` (1,463 headwords) to **Liraasa 3.3** (1,836 headwords, 4,614 meaningful forms).

There are **three patches, applied in order**:
- **3.0** (devotion, music, measure);
- **3.1** (everyday and fiction);
- **3.3** (archetypes and the top 2,000). 3.3 is the combined 3.2 + 3.3 patch and supersedes the separate 3.2 draft.

Every patch is **proposed**: ratify it before it is treated as canon.

## Contents

| Path | What it is |
|---|---|
| `patches/liraasa_3_0_patch.json` | 3.0: 13 rulings (vocative *iya*, apposition, absolute *miyo*, fiat …), 15 roots, 112 compounds |
| `patches/liraasa_3_1_patch.json` | 3.1: lexical only; 5 roots, 69 compounds (body, kitchen, touch, fiction plot) |
| `patches/liraasa_3_3_patch.json` | 3.3 (combined): 9 roots, 163 compounds, 43 derivations, 21 diminutives, 7 rulings, 74 English aliases, 12 recipes, 1 function word |
| `scripts/apply_patch.py` | Merges one patch onto a base. Additions only; it aborts if any new form would collide with an existing one. |
| `scripts/validate_patch.py` | Checks a merged file against the patch that produced it. It must print `PASS`. |
| `build/liraasa_3_3_llm.json` | The prebuilt 2.5 → 3.3 result, for reference and diffing |
| `docs/` | Rationale and analysis for each patch, plus the coverage reports |
| `SHA256SUMS` | Checksums for every file |

## Build and verify

```
python3 scripts/apply_patch.py liraasa_2_5_llm.json patches/liraasa_3_0_patch.json liraasa_3_0_llm.json
python3 scripts/validate_patch.py liraasa_3_0_llm.json patches/liraasa_3_0_patch.json
python3 scripts/apply_patch.py liraasa_3_0_llm.json patches/liraasa_3_1_patch.json liraasa_3_1_llm.json
python3 scripts/validate_patch.py liraasa_3_1_llm.json patches/liraasa_3_1_patch.json
python3 scripts/apply_patch.py liraasa_3_1_llm.json patches/liraasa_3_3_patch.json liraasa_3_3_llm.json
python3 scripts/validate_patch.py liraasa_3_3_llm.json patches/liraasa_3_3_patch.json
```

All three validations print `PASS`, and your `liraasa_3_3_llm.json` should match `build/liraasa_3_3_llm.json` exactly. Each patch asserts its base headword count (1,463 → 1,590 → 1,664 → 1,836), so the patches cannot be applied out of order.

## What each validator run checks

- Headword and form counts.
- No duplicate headwords.
- The new-root template:
  - two syllables;
  - no doubled letter;
  - no ending that looks like a suffix (-ti, -ri, -na, -vu, -yo);
  - at least two letters different from every existing word.
- Every compound part is a headword, a colour base or a time noun.
- The verb rule holds on every new verb.
- Every word in every example, recipe and test sentence is a known form, and preverbal operators are in the correct order.

## How to ratify

Every entry carries `tier` 1 or 2.
1. Ratify tier 1 first.
2. Drop or defer any tier-2 item by deleting it from the patch JSON.
3. Recompute `counts` (the expected totals in the patch), then re-run the chain.

Never hand-edit a merged JSON. Rulings are listed under `rulings_add`, and each can be accepted or rejected on its own.

## Notes for the integrator

- **Lexical rules to apply when generating text:**
  - 3.2:G142 and 3.2:G146 (archetype compounds): listed meanings are binding; an unlisted pair may be built by rule but must be flagged as new.
  - 3.3:G148: the *-san* adjective of any compound or derivation is available by rule.
- **`english_aliases`** in the merged JSON only adds English names for existing words. Use it for English → Liraasa lookup; it never changes a Liraasa word.
- **One known 2.5 erratum is outside these additions-only patches:** the example *pilo de bumre* (meant as "father's bread") should read *li bumre de pilo* (2.5:G95).
