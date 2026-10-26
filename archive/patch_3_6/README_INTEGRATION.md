# Liraasa integration bundle: 2.5 → 3.6

This bundle takes `liraasa_2_5_llm.json` (1,463 headwords) to **Liraasa 3.6**: 2,236 headwords and 5,133 meaningful forms with every module. All patches are **proposed**: ratify each before treating it as canon.

| Patch | Headwords | Contents |
|---|---|---|
| `patches/liraasa_3_0_patch.json` | 1,463 → 1,590 | Devotion, music and measure: 13 rulings, 15 roots, 112 compounds |
| `patches/liraasa_3_1_patch.json` | 1,590 → 1,664 | Everyday and fiction: 5 roots, 69 compounds |
| `patches/liraasa_3_3_patch.json` | 1,664 → 1,836 | Archetypes and the top 2,000 (3.2 and 3.3 combined): 9 roots, 7 rulings |
| `patches/liraasa_3_4_patch.json` | 1,836 → 1,930 | Abstraction and the human condition: 0 roots, ruling G149 |
| `patches/liraasa_3_5_patch.json` | 1,930 → 2,094 (all modules) | Essentials, archetypes and optional domain packs: 0 roots, rulings G150–G151, **modular** |
| `patches/liraasa_3_6_patch.json` | 2,094 → 2,236 (all modules) | The *2100 Dreams* patch: roots *kibo* (robot) and *garza* (coarse register), the mental-health family, holo-tech, rulings G152–G154, a name sheet; **modular** (core, mind, world, nature, register, book.2100) |

Also included:
- `scripts/apply_patch.py` and `scripts/validate_patch.py`: one merger and one validator for every patch. Both accept `--modules=` for 3.5.
- `build/liraasa_3_6_llm.json`: the prebuilt result, with every module of 3.5 and 3.6.
- `docs/`: the rationale for each patch, plus the coverage and gap reports (the 3.4 missing-words report and its CSV are what 3.5 was built from).
- `SHA256SUMS`: checksums for every file.

## Build and verify

```
python3 scripts/apply_patch.py liraasa_2_5_llm.json patches/liraasa_3_0_patch.json liraasa_3_0_llm.json
python3 scripts/apply_patch.py liraasa_3_0_llm.json patches/liraasa_3_1_patch.json liraasa_3_1_llm.json
python3 scripts/apply_patch.py liraasa_3_1_llm.json patches/liraasa_3_3_patch.json liraasa_3_3_llm.json
python3 scripts/apply_patch.py liraasa_3_3_llm.json patches/liraasa_3_4_patch.json liraasa_3_4_llm.json
python3 scripts/apply_patch.py liraasa_3_4_llm.json patches/liraasa_3_5_patch.json liraasa_3_5_llm.json [--modules=...]
python3 scripts/validate_patch.py liraasa_3_5_llm.json patches/liraasa_3_5_patch.json [--modules=...]   # must print PASS
python3 scripts/apply_patch.py liraasa_3_5_llm.json patches/liraasa_3_6_patch.json liraasa_3_6_llm.json [--modules=...]
python3 scripts/validate_patch.py liraasa_3_6_llm.json patches/liraasa_3_6_patch.json [--modules=...]   # must print PASS
```

Validate every step with its own patch. With every module, the result must match `build/liraasa_3_6_llm.json` exactly.

3.6 is built on 3.5 with all modules. Its `names_sheet` (Liraasa forms of the book's place and institution names) is reference data for translators; the merger ignores it.

## 3.5 modules

| Module | Purpose |
|---|---|
| `core` | The 75 everyday essentials, get-recipes, shapes (G150) and copied names (G151) |
| `archetypes` | Compounds on existing heads: people, events, measures, tools, media, places, materials, animals, clothing, land, groups, ideas, body, food, verbs, ways, vehicles, plants |
| `qualities` | Quality adjectives and adverbs: worthy-of and heart compounds, aliases, recipes |
| `casual` | Casual register and discourse recipes |
| `pack.tech` | Optional: internet and devices |
| `pack.sport` | Optional: sport and games |
| `pack.civic` | Optional: government, law, politics |
| `pack.business` | Optional: business and money |
| `pack.health` | Optional: health and medicine |
| `pack.science` | Optional: science and academia |
| `derived-aliases` | English names for relational adjectives already formed by 3.3:G148 and for existing near-synonyms |

- `core` is always applied. Every other module works on its own with `core`; I tested each one separately.
- Pass the same `--modules=` list to the validator as to the merger.
- The merged file records which modules were applied, under `patch_history`.

**Typical selections:**
- **Core only:** 1,945 headwords.
- **General lexicon** (`--modules=archetypes,qualities,casual,derived-aliases`): 2,058 headwords.
- **Everything:** 2,094 headwords.

## How to ratify

Every entry carries a `tier` (1 or 2) and, in 3.5, a `module`.
1. Ratify tier 1 first.
2. Delete any rejected entry from its patch JSON.
3. Recompute `counts` (the expected totals in the patch), then re-run the chain.

Never hand-edit a merged JSON.

## Notes for the integrator

**Lexical rules to apply when generating text:**
- 3.2:G142 and G146: archetype compounds.
- 3.3:G148: the *-san* adjective of any compound or derivation.
- 3.4:G149: a compound names the quality; its *-san* form describes what has it.
- 3.5:G150: numeral + *gaki* names a polygon (*tressa-gaki* triangle).
- 3.5:G151: foreign dishes and products are copied like names (*pitsa*).
- 3.6:G152: the *-san* rule also applies to lexicalised diminutives (*mavofarutisan*, hypomanic).
- 3.6:G153: coarse register (*garza*, *rupu*); include or omit the `register` module.
- 3.6:G154: metric units (*bondopatu* gram; *-ti* = milli-, *-vu* = kilo-).

**`english_aliases`** only adds English names for existing words. Use it for English → Liraasa lookup; it never changes a Liraasa word.

**One known 2.5 erratum is outside these additions-only patches:** the example *pilo de bumre* (meant as "father's bread") should read *li bumre de pilo* (2.5:G95).
