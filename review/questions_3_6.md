# Liraasa 3.6: questions for the author

3.6, the _2100 Dreams_ patch, is installed with every module: core, mind, world, nature, register and book.2100. It is **proposed**: none of it is canon until you ratify it (ADR-0027).

The result:

- as first installed: 2,236 headwords and 5,133 meaningful forms, the counts your patch gives (after your decisions, below: 2,242 and 5,140);
- `validate:3.6` gives 23 PASS and 2 WARN;
- your `validate_patch.py` gives PASS.

## Answered by the author (2026-10-25)

1. **Register:** kept, `dapalore` kept.
2. **The mental-health images:** kept.
3. **`kibo`:** kept.
4. **Chemistry:** dopamine and serotonin are copied as their scientific names, `dopamina` and `serotonina` (3.5:G151). `lavipavma` and `sovepavma` are dropped. `sulmepavma` (nicotine) was not in the question and stays.
5. **Sound-words and slang:** built from existing words, each read from its use in the manuscript:

   | The book's word | Liraasa | Built from |
   | --- | --- | --- |
   | moonfox | `lunovurfa` | moon + fox |
   | sneakerettes | `pelipebuvelma` | play + shoe |
   | zeep zoop (a robot's chime) | `kibosonbu` | robot + sound |
   | wazoop | `vayesonbu` | wind + sound (the attested image compound, now a headword, its old reading kept) |
   | tottle (along) | `linuvalmi`, verb `linuvalmila` | child + walking |
   | Hydrocune | `mirufarvibudi` | water + wolf |
   | zazzle | `lumiyelmi` | light + glitter |
   | goldies | `auruminela` | gold + person |

6. **The name sheet:** the patch's list of Liraasa forms for the book's places and institutions, for example Light's Hope → `Lumiopi` and Everse → `Rinbavemi`. It is used by the translation; it is not a lexicon entry.
7. **Numbering:** 3.6's rulings are renumbered **3.6:G153** (the `-san` of a lexicalised diminutive), **G154** (coarse register) and **G155** (metric units).

These decisions are applied to the patch as read (`decide3_6` in `scripts/make_changeset_3_6.ts`); the patch file itself is never edited. The decided patch is `data/proposals/liraasa_3_6_patch_decided.json`. Your validator runs on it as `scripts/validate_patch_3_6.py`, which is yours with the G152 id changed to G153. Result: 2,242 headwords and 5,140 meaningful forms, `validate:3.6` 23 PASS and 2 WARN, your validator PASS.

## Settled by the editor, as for 3.3 and 3.5

- **The "unabated" recipe.** `Li renli lisrola ne menu.` puts `ne` after the verb, against 1.0:G1. The guide gives `Li renli po ne teklata.` (the rain did not stop) instead.
