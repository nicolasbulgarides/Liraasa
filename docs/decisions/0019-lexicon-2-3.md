# ADR-0019 — Liraasa 2.3: the sound pass

- **Status:** accepted
- **Date:** 2026-10-19
- **Phase:** 2.3

## Context

The author's sound-pass patch (`data/proposals/liraasa_2_3_patch.json`) asks for
better-sounding spellings for seventeen words. Two of the spellings it
requested were taken, so the patch substitutes free ones: `dento` for `deti` /
`denta` (tooth), and `ruko` for `ruka` (blood). It brings:

- **2.3:G69:** thirteen roots respelled, under 2.1:G58 in full:
  lenra → zarku, vanru → dokra, voho → kezdo, vabale → tobra, teyo → dento,
  mege → yumli, kupa → ruko, jemla → zimzi, pesbi → bondo, menha → gamdo,
  vugo → vizu, salye → bapi, senba → linle;
- **2.3:G70:** roots for common animals. The compounds larbopagoregna and
  maremirulazu become the roots `bumbo` (bear) and `murmu` (cow; cattle). The
  listed derivation mirunululirayo gives way to a new root, `kerku` (frog),
  with the verb `kerkuka`, "to croak";
- **2.3:G71:** wolf rebuilt as `farvibudi` (farvi + budi, "wild dog"),
  superseding the wolf half of 2.1:G59.

The patch also lists everything that should follow, precomputed: 122 old
spellings, 47 headwords, 72 forms, 3 derivations, 13 example sentences, 14
album lines and the counts.

## Decision

### 1. 2.3 is built from frozen 2.2 by one changeset

`npm run integrate:2.3` reads `liraasa_2_2.json` and halts unless its sha256 is
`318d7ef9…2676c77`. It applies `data/changes/2026-10-19-lexicon-2-3.json`, which
`scripts/make_changeset_2_3.ts` makes from the patch. Nothing in the changeset
is copied from the patch's precomputed lists. The generator applies its own
changeset to 2.2 and halts unless every list above comes out exactly as the
patch has it.

Every new spelling passed `check_sounds.py` against 2.2 first, with no error and
no warning.

### 2. Three new ops

The respelling code (`src/core/change/respell.ts`) moved only primal roots. It
now takes a compound as the source too, and keeps the old parts in the legacy
row as `old_components`. Three ops use it:

- **`recompose_compound`**: a compound is rebuilt on other parts and keeps its
  id and glosses. Every compound built on it follows: werewolf follows wolf.
- **`respell_compound_as_root`**: a compound becomes a primal root and keeps its
  id, glosses and empty slots. Bear and cow are the first.
- **`retire_derivation`**: a listed derivation leaves the table, and its
  meaning is now carried by a headword. Old texts read it as that headword,
  and the lexicon's own sentences follow. It stays buildable by its default
  reading.

kerku is an ordinary `add_root`. It is the one id 2.3 mints.

### 3. A superseded ruling is never respelled

The respelling code rewrites the lexicon's living text, ruling text included.
It now skips a ruling marked `superseded_by` or `superseded_in_part`, so
2.1:G59 keeps "volda -> larbopagobudi" as ruled. The 2.0, 2.1 and 2.2
rebuilds are still byte-identical: none of their respellings touched a
superseded ruling.

Living rulings follow the respelling, as 2.1:G58 rules and G69 restates. One
consequence departs from the patch's `rulings_left_verbatim`: the example of
1.2:G28 is respelled (`jemlari` → `zimziri`). The patch's own G69 applies 2.1:G58
in full, and 2.1 respelled living rulings' examples. This is listed for the
author in `review/2_3_integration.md`.

### 4. Validation

`scripts/validate_2_3.py` gives **22 PASS, 3 WARN**. It runs validate.py
unmodified, then the edition-aware re-runs:

- check 18 now also covers the compounds made roots and the new root;
- check 25 accepts only what an op records, and compares superseded rulings
  unrespelled.

The new warning is check 18: `murmu` is one edit from `mormu`, and `vizu` from
`vibu`. Both are reserved spellings whose ledger reservation lapsed in 2.0.

`tests/golden/lexicon_2_3.test.ts` holds the patch's lists as tests, and checks
that the build is reproducible byte for byte.

### 5. The tools read 2.3

Every tool reads 2.3:

- the editor, the checker and Learn. Learn's 2.2 → 2.3 diff is 47 renamed by
  id and kerku added, with nothing removed or reglossed;
- the MFA export, the handoff and the LLM reference
  (`handoff/liraasa_2_3_llm.json`). The reference lists kerku as `formerly
mirunululirayo`;
- the guide (`Liraasa_2_3_Reference_Grammar`), with a 2.3 note in Appendix D;
- Learn's corpus, now `data/corpus/songs_2_3` and `bumrepago_2_3`.

The album reader halts unless the lines 2.3 respells are exactly the patch's
`album_read_today`.

Three code paths learned to read an older spelling that carries a `-ri` /
`-ti` ending, as `correctText` always has: the guide's interlinear, its canon
check, and the checker's reader. The album's `lenrari` (01:7) is the first
such word.

The checker overlay `data/checker/lexicon_flags.json` renames its `jemla` key
to `zimzi`.

## Consequences

- **The numbers.** 1463 headwords (475 roots, 988 compounds) and 4036
  meaningful forms. The rulings now run to 2.3:G71, and 2.2 is frozen as 2.3's
  baseline.
- **Open for the author** (`review/2_3_integration.md`):
  - the substituted spellings `dento` and `ruko`;
  - the two check-18 neighbours;
  - the respelled 1.2:G28 example;
  - stale notes on bumbo, murmu and mirunululira;
  - seven bank roots now one edit from a new root;
  - whether bear, cow and frog join the checker's animal class.

## Addendum: the author's answers (2026-10-19)

A hand-written review changeset, `data/changes/2026-10-19-lexicon-2-3-review.json`,
applies after the patch's changeset. `CHANGESETS_2_3` lists both.

- **Spellings.** `dento` and `ruko` are kept, and the root bank is left as it is.
- **An archive.** A new op, `archive_text`, moves a text out of the living
  lexicon into `legacy.archived_text`. Each row keeps the entry, the field,
  the text, what the field reads now, the edition and the reason.
- **What is archived:**
  - the 2.2 text of 1.2:G28's example, which stays respelled;
  - the history that no longer holds in the notes of `bumbo`, `murmu` and
    `mirunululira`.
- **Validation.** Check 25 accepts exactly these changes.
- **The checker.** `bumbo`, `murmu` and `kerku` join its animal class.
