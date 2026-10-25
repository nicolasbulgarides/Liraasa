# Liraasa 3.0: questions for the author

**All answered on 2026-10-25: the author ratified everything up to 3.4 (ADR-0025).**

Liraasa 3.0 is installed as **proposed** (ADR-0021). Nothing in it is canon until you ratify it. Fill in the **Answer** lines. To reject or change an item, edit the patch (`archive/patch_3_0/liraasa_3_0_patch.json`) and rebuild: run `make_changeset_3_0.ts`, then `integrate:3.0`, then `validate:3.0`. Never hand-edit the built file.

## 1. Found while installing

### 1.1 Four "new" compounds already exist in 2.5

The patch lists `mernolira`, `velulira`, `velurinba` and `velunulu` as new compounds. 2.5 already has all four as attested image compounds, with these readings:

| word | 2.5 reading (now archived) | 3.0 patch meaning |
|---|---|---|
| mernolira | dawn-fresh song; a melody given the color of morning | aubade; a dawn song |
| velulira | starlit song; a melody given the color of distant stars | star-song; the note each star sings in the cosmic melody |
| velurinba | starlit ring; a small circular pledge of distant stars | crown of stars |
| velunulu | starlit path; a trail shaped by distant stars | the path of stars; a road through the heavens |

The build keeps each word's id, makes it a headword again with the patch's meaning, and archives the 2.5 reading in `legacy.archived_senses`. Keep the new meanings, keep the old readings, or respell?

**Answer:** keep the new meanings; ratified with everything else (2026-10-25, ADR-0025).

### 1.2 Five new roots are one edit from a retired spelling (validator check 18, WARN)

`dobo` ~ yobo, `lenda` ~ lenra, `lilya` ~ lilba, `nelmo` ~ selmo, `velni` ~ velbi.

Old texts may still use the retired spellings, which are kept so they can be read. The author's validator compares only against active words, so it did not see these. Keep, or respell?

**Answer:** keep; similar spellings are not a concern (2026-10-25).

### 1.3 `devipago` also reads as devi + `-pago` (sound check)

As a compound, `devipago` (devi + pago) means "shrine; a dwelling of the Goddess". The same spelling also parses as the derivation devi + `-pago`, "place of the Goddess". The meanings agree, so this may be harmless. Keep?

**Answer:** keep; ratified (2026-10-25).

### 1.4 Two near neighbours (sound check, WARN)

`meralumi` is one edit from `megalumi`, and `biojuba` is one edit from `viojuba`. Keep?

**Answer:** keep; ratified (2026-10-25).

## 2. The patch's own decisions (its analysis, section 8)

1. The vocative spelling `iya` (3.0:G129). **Answer:** ratified (2026-10-25).
2. Absolute `miyo` (3.0:G132), "I am". **Answer:** ratified (2026-10-25).
3. The comma-less `ola-modo … miyo` formula (3.0:G133). **Answer:** ratified (2026-10-25).
4. The title compounds `soladevi`, `lunodevi`, `loredevi` and `liradevi`. **Answer:** ratified (2026-10-25).
5. The 2.5 erratum, outside this patch: *Eli bumre ka sambasan ko pilo de bumre* contradicts 2.5:G95. Should it read *… ko li bumre de pilo*? **Answer:** yes; applied in 3.5 (`edit_example`, changeset `2026-10-25-lexicon-3-5-ratify`, ADR-0025).

## 3. Found while teaching the checker 3.0

### 3.1 `kasi muya` in hymn line 12

*Ata una krotiapo una, velu krotiapo velu, **kasi muya** patuti de sizosan lumi po gome farlafa ala li pagoasa.* 2.5:G106 rules `kasi` + a noun (more X), but not `kasi` + a quantifier. The checker reports it as unruled. Is `kasi muya` + noun grammatical ("further, more")?

**Answer:** line 12 kept as `muya loterosan patuti` (2026-10-25); `kasi` + a quantifier stays unruled.

### 3.2 The rest of the hymn

The patch lists 18 of the hymn's 24 lines. For the hymn PDF the README asks for, please supply lines 1, 3, 4, 5, 9 and 19 (or the whole hymn).

**Answer:** the full hymn came with the translation PDF (`data/songs/Liraasa_de_li_Vanisan_Lirayo_Translation.pdf`); the canon text is `data/corpus/hymn/song_of_the_first_stars.json` (ADR-0022).
