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

## Addendum: the grammar audit's decisions (2026-10-19)

A grammar audit of the editor against 2.3 (`review/audit-report.md`, with a
rerunnable kit in `tests/audit/`) raised four questions for the author. A
third 2.3 changeset, `data/changes/2026-10-19-lexicon-2-3-audit.json`, records
the answers.

- **The album's consistent usage is grammar** (2.2:G68). It becomes four
  rulings, each with album lines as its examples and no invented English:
  - **2.3:G72:** `ata` may open a line that continues the one before, as `oro`
    may (1.2:G25).
  - **2.3:G73:** `en` + an abstract noun names the manner, and `ko` + a
    feeling the spirit in which the act is done. `yuta` stays the means (1.2:G33).
  - **2.3:G74:** `raho` may open a direct question, which ends in `ki`. It
    supersedes the clause of 2.2:G64 that says `raho` is never a question word
    (`supersede_ruling`, in part). Album reading AR-16 is marked
    `resolved_by: "2.3:G74"` and is no longer shown as "do not imitate".
  - **2.3:G75:** `pagopa` takes the motion prefixes (`taro-pagopa`).
- **2.3:G76, the editor's judgement, as asked:** a question with `ki-eli` or
  `ki-muya` + a noun ends in `ki`, and without `ki` the clause is an
  exclamation. This keeps 2.2:G61 exact and extends its own rule for degree
  questions.
- **Left open:** tense inheritance after `kureli`, `sina`, `si` and `nevi`,
  now in the guide's open questions.
- **No rule:** whether an ascended (`-asa`) form is sacred depends on the
  word.

What changed in the checker:

- Line-initial `ata` is no longer questioned.
- `en`/`ko` + an abstract noun is a note offering `yuta`; a substance with
  `ko` still warns.
- A `raho` question without `ki` is an error (2.3:G74), and so is a
  `ki-eli`/`ki-muya` question without `ki` (2.3:G76).
- `motion_verbs` in `data/checker/lexicon_flags.json` names `pagopa`.
- Three misreadings of album lines are fixed: `gase` + noun + `raho` (a
  simile), `ne A ne B` with no verb (a fragment), and a verbless list of
  operator words.
- Existential `miyo` may open a question.

The album now reads with one finding, AR-10, which departs once.

The author's 1.2-era fix table had corrected album line 03:3 from `en baba
melosan valla` to `yuta baba melosan valla`. Under 2.3:G73 both are grammar,
and the corrected line stays the canonical one in `tests/checker/fixtures/song.json`.

## Addendum: the rest of the audit, on the editor's judgement (2026-10-19)

The author left the remaining decisions to the editor's judgement. The same
audit changeset carries them:

- **2.3:G77:** an embedded yes/no question uses `ki-oro`. It supersedes in
  part the clause of 0.8:G4 that has `si` mean "whether". Canon example 555
  was corrected accordingly (`edit_example`): "Maivo ne sabesia ki-oro li
  lazu nurminia."
- **2.3:G78:** opening and closing a clause. A line may open with `nara`,
  `yava` opens its clause, a clause may carry several frames, and a clause
  closes time → attitude → `ki`.
- **2.3:G79:** time phrases: a measure, `da ola-krono` ("since then") and
  `tuni` + a noun phrase.
- **2.3:G80:** after hearing and knowing verbs, "about X" is `li telne de X`.
- **2.3:G81:** `lusu` and `mosa`.
- **2.3:G82:** an adjective used as a noun keeps `li`.
- **2.3:G83:** quotations follow a colon, and a past exclamation is written
  with `ki-modo`.
- **2.3:G84:** a superseded construction stays grammatical; new text prefers
  the current ruling.
- **2.3:G85:** a retired listed derivation stays buildable by rule.
- **2.3:G86:** whether an ascended form is sacred depends on the word.

The changeset adds one op, **`edit_text`**. It replaces a text field at a
dotted path whose current value must equal `from`, and it refuses `rulings_*`
paths, so a ruling is still never reworded. It corrects three stale texts:

- `morphology.compounding`;
- the `-yo`/`-vu` suffix notes;
- numbers rule 39.

The same changeset also gives `ki-saivo` the example "Ki-saivo lirala?" and
archives `daigozayu`'s stale note.

Changes to the checker:

- New checks:
  - ne before the tense;
  - two `hozi`, and `vinto` on `hozi`;
  - a stranded scope word;
  - `ata` between a subject and its verb;
  - `ki` closing a statement;
  - an attitude word opening a clause;
  - `ne … nuna-` anywhere in its scope;
  - `ko` with a substance (warning) or a tool (note);
  - untensed `sige`;
  - "whether" written as `si` (a calque).
- `noma` with no context is a note, because a canon example has its context in
  the line before.
- Image compounds' unused slots read as unused slots.
- The back-translation follows G55, G62 and G67.

The songbook offers to correct spellings retired since the edition it was
written in.

Changes to the composer:

- **Grammar:**
  - the progressive (`roni`);
  - counterfactuals;
  - blessings, `yava` and `fime` complements;
  - exclamations, quotations and wh-questions;
  - recipients with `ala`;
  - the valency operators.
- **Words and phrases:**
  - number words, ordinals and N times;
  - listed derivations;
  - time measures with `kroti`/`krotiapo`;
  - names;
  - comparatives and `-ly` adverbs;
  - reflexives;
  - `yuta` for tools.

The composer's copula default stays `ke` before a noun phrase, as the author's
reviewed Song of Time drafts write it. Whether identity wants `ka` there is left
to the author.

Still open: two Liraasa lines in the corpus are labelled as English (L01), and
the two "birth" senses (L04).
