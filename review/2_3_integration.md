# Liraasa 2.3 integration: findings for the author

Built 2026-10-19 from `data/proposals/liraasa_2_3_patch.json`, the sound-pass
patch (ADR-0019). Nothing here is resolved by the tool.

## Before building

- Every new spelling went through `scripts/check_sounds.py` against 2.2:
  zarku, dokra, kezdo, tobra, dento, yumli, ruko, zimzi, bondo, gamdo, vizu,
  bapi, linle, bumbo, murmu, kerku and the compound farvibudi. **0 errors,
  0 warnings.** Each starts a new rhyme family.
- The patch's substitutions hold. The requested `deti` is one edit from
  `desi`, `devi` and `zeti`. `denta` is one edit from `penta` and `centa`.
  `ruka` is one edit from `luka` and `ruva`. The patch's replacements
  (**`dento`** for tooth, **`ruko`** for blood) are what 2.3 uses. They are
  the patch's choice, not yours yet: confirm them, or name others.
- The patch's draft rulings are now **2.3:G69–G71**, word for word, with
  "(draft)" dropped from their ids.

## Results

| | |
| --- | --- |
| Rulings added | 2.3:G69 (second respelling pass), G70 (roots for common animals), G71 (wolf) |
| Ruling superseded | 2.1:G59, the wolf clause only (`volda -> larbopagobudi (larbopago + budi)`) → 2.3:G71; its `taha -> kezupago` clause stands, and its text is kept as ruled |
| Roots respelled | 13, under their ids, with every form and the 30 compounds built on them |
| Compounds made roots | larbopagoregna → **bumbo** (bear), maremirulazu → **murmu** (cow; cattle), under their ids |
| Wolf | larbopagobudi → **farvibudi** (farvi + budi); lunolarbopagobudi → lunofarvibudi; 2.1's `volda` now reads straight through to farvibudi |
| Frog | **kerku**, a new root (`lx_kerku_1854`), with the verb kerkuka "to croak"; `mirunululirayo` leaves the listed derivations and reads as kerku in older texts; `mirunululira` (river-song) stays |
| Derivations | vanruyo → dokrayo, vanrupago → dokrapago |
| Counts | 1462 → 1463 headwords (472 → 475 roots, 990 → 988 compounds); meaningful forms 4034 → 4036; 122 spellings retired |
| Patch check | every pair in `token_map`, `headword_migration`, `form_migration`, `lexicalised_derivations`, `example_sentences`, `album_read_today` and `counts` builds exactly as listed |
| Album | 14 lines read differently today, the 14 the patch lists; the recording is untouched |
| Validation | `npm run validate:2.3`: **22 PASS, 3 WARN** |
| Sound audit | `npm run check:sounds` → `review/sound_audit_2_3.json`: nothing new. Gone since 2.2: kupa's one-edit neighbours (kulpa, zupa), two lenra form neighbours, and vabale's three-syllable template breach |

## The three warnings

- **Check 3:** the ambiguities kept in 2.0, unchanged.
- **Check 17:** five compounds with two valid splits, unchanged from 2.2.
- **Check 18, new:** two new roots are one edit from a reserved spelling:
  - `murmu` ~ `mormu`;
  - `vizu` ~ `vibu`.

  Both are 0.8 roots retired in 1.0, and the sound ledger lets both
  reservations lapse from 2.0 (ADR-0016), so `check_sounds.py` passes them.
  validate.py's check 18 does not read the ledger. Keep them, or respell?

## One departure from the patch

The patch lists two ruling texts as "left verbatim". 2.3 keeps one of them:

- **2.1:G59 is kept word for word.** It is superseded in part, and a
  superseded ruling is never reworded. The respelling code now skips every
  superseded ruling.
- **1.2:G28's example is respelled:** `Maivo po vimova muya jemlari en li
  folni.` becomes `… zimziri …`. G28 is a living ruling. G69 says 2.1:G58
  "applies in full", and in 2.1 living rulings' examples were respelled. The
  same sentence is also example 449, which the patch respells. Left as
  `jemlari`, a current ruling would teach a retired spelling, and the checker
  would flag it.

If you want it verbatim after all, that is a one-line change to the build.

## For you to decide

- **Stale notes.** These notes still describe the 2.2 shape. Changing them
  would be a new op:
  - `bumbo`: "forest-king, now built on regna";
  - `murmu`: "milk-animal";
  - `mirunululira`: "Needed as the base for frog".
- **The root bank.** Seven unassigned roots in `reserved_root_bank` are now one
  edit from a new root, against the bank's own note ("at least two edits from
  every active word"):
  - `bape`, `bayi`, `yapi` ~ bapi;
  - `huko`, `ruyo` ~ ruko;
  - `jizu`, `vibu` ~ vizu.

  Remove them from the bank, or keep them?
- **The checker's animal class.** `data/checker/lexicon_flags.json` classes
  `jemla` as an animal; the key now reads `zimzi`. Before 2.3 the class did not
  reach bear, cow or frog either, since a compound is not classed by its head.
  Add `bumbo`, `murmu` and `kerku`?
- **`mirunululirayo`.** As G70 says, it stays buildable by the default `-yo`
  reading ("one devoted to river-song"), and the checker reads it so. An older
  text that meant "frog" by it reads as `kerku` through the legacy table.

## What changed in the tools

- **The guide's album part and the checker** now read an older spelling that
  carries a `-ri` / `-ti` ending. The album's `lenrari` (track 01:7) is the first:
  it reads as the older spelling of `zarkuri`, and the checker offers that fix.
- **Learn's sentence ids** follow the text, so the 13 respelled example
  sentences and the respelled corpus lines start fresh in a learner's review
  queue. 2.1 behaved the same way.

## Your answers (2026-10-19)

Applied by the review changeset `data/changes/2026-10-19-lexicon-2-3-review.json`
(ADR-0019 addendum):

1. **`dento` and `ruko` are kept.** Of the patch's other fallbacks, `dete`,
   `rudo` and `runka` were also clean. `detu` was not: it is one edit from the
   reserved `deyu`.
2. **The 1.2:G28 example stays respelled.** Its 2.2 text (`…jemlari…`) is
   retired to the new archive, `legacy.archived_text`.
3. **Stale history is archived.** The full old notes of `bumbo`, `murmu` and
   `mirunululira` are in `legacy.archived_text`. The live notes keep only what
   still holds:
   - `bumbo` and `murmu`: "Added in 2.0 (changeset 2026-10-18-lexicon-2-0).";
   - `mirunululira`: the same, then "A lovely word in its own right."
4. **The root bank is left as it is.** A couple of similar sounds are acceptable.
5. **`bumbo`, `murmu` and `kerku` are animals** in
   `data/checker/lexicon_flags.json`. The class changes no warning today,
   since 1.2:G33 fires only on substance and abstract nouns.
