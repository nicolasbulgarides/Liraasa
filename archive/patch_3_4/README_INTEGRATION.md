# Liraasa integration bundle: 2.5 → 3.4

This bundle takes `liraasa_2_5_llm.json` (1,463 headwords) to **Liraasa 3.4** (1,930 headwords, 4,747 meaningful forms).

There are **four patches, applied in order**. All are **proposed**: ratify each before treating it as canon.

| Patch | Base → result | Contents |
|---|---|---|
| `patches/liraasa_3_0_patch.json` | 1,463 → 1,590 | Devotion, music and measure: 13 rulings (vocative *iya*, apposition, absolute *miyo*, fiat …), 15 roots, 112 compounds |
| `patches/liraasa_3_1_patch.json` | 1,590 → 1,664 | Everyday and fiction: 5 roots, 69 compounds |
| `patches/liraasa_3_3_patch.json` | 1,664 → 1,836 | Archetypes and the top 2,000 (3.2 and 3.3 combined): 9 roots, 163 compounds, 7 rulings, aliases, recipes |
| `patches/liraasa_3_4_patch.json` | 1,836 → 1,930 | Abstraction and the human condition: **0 roots**, 94 compounds, 18 derivations, 1 ruling (G149), aliases, recipes |

Also included:
- `scripts/apply_patch.py` and `scripts/validate_patch.py`: one merger and one validator that work for every patch.
- `build/liraasa_3_4_llm.json`: the prebuilt result, for reference and diffing.
- `docs/`: the rationale and reports for each patch.
- `SHA256SUMS`: checksums for every file.

## Build and verify

```
python3 scripts/apply_patch.py liraasa_2_5_llm.json patches/liraasa_3_0_patch.json liraasa_3_0_llm.json
python3 scripts/apply_patch.py liraasa_3_0_llm.json patches/liraasa_3_1_patch.json liraasa_3_1_llm.json
python3 scripts/apply_patch.py liraasa_3_1_llm.json patches/liraasa_3_3_patch.json liraasa_3_3_llm.json
python3 scripts/apply_patch.py liraasa_3_3_llm.json patches/liraasa_3_4_patch.json liraasa_3_4_llm.json
python3 scripts/validate_patch.py liraasa_3_4_llm.json patches/liraasa_3_4_patch.json   # must print PASS
```

- Validate each step with its own patch.
- The final file must match `build/liraasa_3_4_llm.json` exactly.
- Each patch asserts its base headword count, so the patches cannot be applied out of order.

## What the validator checks

- Headword and form counts, and no duplicates.
- The new-root template: two syllables, at least two letters different from every existing word, and no suffix-like ending.
- Every compound part is a headword, a colour base or a time noun.
- The verb rule holds on every new verb.
- Every word in every example, recipe and test sentence is a known form. This includes forms built by 3.3:G148 and by motion prefixes.
- Preverbal operators are in the correct order.

## How to ratify

Every entry carries `tier` 1 or 2.
1. Ratify tier 1 first.
2. Delete any rejected entry from its patch JSON.
3. Recompute `counts` (the expected totals in the patch), then re-run the chain.

Never hand-edit a merged JSON.

## Notes for the integrator

**Lexical rules to apply when generating text:**
- 3.2:G142 and 3.2:G146: archetype compounds.
- 3.3:G148: the *-san* adjective of any compound or derivation.
- 3.4:G149: a compound names the quality; its *-san* form describes what has it.

**`english_aliases`** only adds English names for existing words. Use it for English → Liraasa lookup; it never changes a Liraasa word.

**One known 2.5 erratum is outside these additions-only patches:** the example *pilo de bumre* (meant as "father's bread") should read *li bumre de pilo* (2.5:G95).
