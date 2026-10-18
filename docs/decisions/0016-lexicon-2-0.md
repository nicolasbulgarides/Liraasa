# ADR-0016 — Liraasa 2.0: the lexicon expansion, and how 2.0 is built

- **Status:** accepted
- **Date:** 2026-10-18
- **Phase:** 2.0

## Context

The author's patch, `liraasa_2_0_patch.json` ("Liraasa 2.0: the great lexicon
expansion (grammar untouched; proposed)"), adds 10 roots, 346 compounds, 77
lexicalised derivations, meanings for 276 unused forms, 207 sharpened glosses,
6 canon fixes and 5 rule changes, and moves 391 template compounds out of the
dictionary into an image-compound pattern. The author asked for it to be
integrated fully, following its directions, and expected no grammar change.

The patch was written against the LLM reference's vocabulary
(`dictionary_lines`, `word_building`, `authorized_changes`), not the canonical
JSON. Its five rule changes are word-building rulings; no clause, order or
inflection rule changes, as its own step 0 says.

An audit against 1.2 (every section cross-checked, every spelling through
`scripts/check_sounds.py`) found the patch sound, with four places that needed
the author: a contradiction (the `amorna` canon fix against its own dictionary
line), an open choice (`bumreasasan`), 15 nested compounds against 1.2's
no-nesting choice (ADR-0013 §7), and 4 compounds that make existing words read
two ways.

## Decision

### 1. 2.0 is built from frozen 1.2 by one changeset

`npm run integrate:2.0` (`scripts/integrate_2_0.ts`) reads
`data/lexicon/liraasa_1_2.json`, halts unless its sha256 is `12e9d262…41fe3`,
applies `data/changes/2026-10-18-lexicon-2-0.json` through `applyChangesets`,
audits, and writes `liraasa_2_0.json` and `integration_report_2_0.json`. The
build is deterministic; a test rebuilds it byte for byte.

The changeset is made from the patch by `scripts/make_changeset_2_0.ts`, a
one-time migration that follows the patch's `how_to_apply` step by step and
records the author's decisions in each op's reason. Every gloss change is
traced to a named section of the patch (new forms by tier, reglosses,
differentiations, sense additions, canon fixes); the generator halts on any
change no section accounts for. The dictionary lines are the merged result of
the patch's layered sections and are applied as authoritative, except where the
author decided otherwise.

Each id counter continues after the highest id 1.2 holds (`idsAfter`), so new
words are `lx_…_1498` on; the sidecar's 1.0 counter is not reused.

### 2. The rulings: 2.0:G37–G42, word-building only

| Ruling  | What it allows                                                                                     |
| ------- | -------------------------------------------------------------------------------------------------- |
| 2.0:G37 | `devo`/`devi` and `nevi`/`devi` are declared one-edit pairs                                        |
| 2.0:G38 | a colour base may be a compound's modifier; a compound may be lexicalised with `-ti` (`viofuroti`) |
| 2.0:G39 | `aurumijuba` and `vanajuba` are headwords as well as colour words                                  |
| 2.0:G40 | image compounds: any listed modifier + head is a word with a predictable reading                   |
| 2.0:G41 | `-yo`, `-vu`, `-pago`, `-ti` are productive with default readings; listed derivations override     |
| 2.0:G42 | a compound may take a compound as one of its two parts (author decision, 2026-10-18)               |

`grammar`, the clause template and the inflection rules are byte-identical to
1.2 (a test pins it).

### 3. The author's four decisions (2026-10-18)

- **amorna** follows the canon fix: "lovelessness; the absence of love" (the
  line still read "enemy, one who is hated", duplicating `lenra`). The old
  sense is archived.
- **bumreasasan**: the example is rewritten with `bumre`'s listed adjective
  and without the `li`: "Ola ka bumresan, zoke." — "That is baked. (Oh,
  sure.)" (`bumresan` is "baked").
- **Nesting** is allowed (2.0:G42): the 15 nested compounds stand.
- **The four ambiguous compounds** (`benamavo`, `kronosarbi`, `ralelira`,
  `sevulumi`) are kept. validate.py check 17 and the sound audit report the
  four ambiguities as warnings, by design.

### 4. New change ops

`edit_derivation`, `edit_particle_example`, `move_to_pattern`, `add_section`
and `edit_ledger` join the ops of ADR-0013; `edit_example` and
`edit_particle_example` take `field: 'english'`; `edit_metadata` appends a
declared pair; `add_derivation` may build on a lexicalised derivation
(`derivation:lexicalised:lavbupago:-ti`); `add_compound` takes a payload
`suffix`. The 2.0 rulings switch on `WordBuilding { nesting, colourModifiers }`;
the default stays strict, so the 1.2 build is unchanged (its test passes).

`move_to_pattern` keeps each of the 391 headwords whole, **with its id**, in
`image_compounds.attested`. Modifiers and heads are keyed by id.

### 5. Validation

`scripts/validate_2_0.py` runs validate.py unmodified, then re-runs the checks
a 2.0 ruling changes, each exemption read from the data or the changeset:
3 (a derivation that spells a kept-ambiguity headword: WARN), 7 (colour
modifiers and the `-ti` suffix), 12 (glosses recorded by 1.2 or 2.0 ops; moved
headwords disposed of, not missing), 13 and 24 (`rivla` reused on the sound
ledger's own terms: reserved until 2.0, reused in 2.0), 18 (declared pairs),
and 25 (1.2 carried verbatim except where a 2.0 op records the change).
**23 PASS, 2 WARN** (the kept ambiguities).

`scripts/check_sounds.py` now reads the lexicon's rulings: nesting with
2.0:G42, colour modifiers with 2.0:G38; and a ledger reservation lapses in its
`reusable_from` edition ("never" never lapses). The 1.2 audit is unchanged.
Under 2.0's rulings every new spelling passes except the four kept ambiguities.

### 6. The tools read 2.0

- **Model**: rulings of every edition; `imageCompounds` (attested entries with
  ids, modifiers, heads); `derivationDefaults`; the exporter keeps the
  source's key order, so every edition round-trips.
- **Indexes and linker**: attested image compounds index like headwords under
  a namespace of their own; every other pattern pair indexes by its root form
  under the id `ic:<modifier id>+<head id>`, glossed by its predictable
  reading. Productive `-yo`/`-vu`/`-pago` already linked; `-ti`/`-ri` attach
  to image compounds.
- **LLM reference** (`handoff/liraasa_2_0_llm.json`): the 2.0 rulings,
  productive derivations with their defaults, `word_building.image_compounds`,
  and `[vio+furo+-ti]` lines. **Checker**: reads that, so every pair of the
  pattern is a noun (attested gloss, or the predictable reading).
- **Learn**: attested image compounds are items of kind `imageCompound`, so a
  learner's cards on them stay live (they count as met, are not drawn by Ten
  Stars); colour-base parts link to their colour entry; a derivation built on
  a derivation shows on its root's card; "What changed" diffs 1.2 → 2.0.
- **Editor data, MFA export, handoff and grammar guide** read 2.0. The guide's
  Part 5 is "What 2.0 and 1.2 add" and Part 12 carries both changelogs.

## Consequences

- **2.0**: 1462 headwords (474 roots, 988 compounds), 10,234 forms, all
  distinct and all regenerated by rule; 106 lexicalised derivations; 391
  attested image compounds of 1,767 possible; rulings 2.0:G37–G42.
- **Learner progress survives**: nothing is removed or renamed; the 391 keep
  their ids. A test proves the 1.2 → 2.0 diff lesson is the changeset op by op.
- **Findings for the author** are in `review/2_0_integration.md`: the kept
  ambiguities, two `-pago + -ti` listings that equal their productive build,
  a regression-song expectation superseded by a regloss, the canon findings
  the patch mended, and the register filing of new words.

## Addendum: the guide review (2026-10-18)

A second 2.0 changeset, `data/changes/2026-10-18-lexicon-2-0-review.json`,
records the author's answers from the grammar-guide review. It applies after
the patch changeset, and `npm run integrate:2.0` builds both:

- **2.0:G43 Consonant values.** `c` is always "ch" /t͡ʃ/ (`ca` = cha, `co` =
  cho, and before every vowel); `j` is /d͡ʒ/; `r` is a single tap; `g` is always
  hard. The two letters `g2p.ts` had left open are closed, and the MFA export
  is rebuilt with them.
- **2.0:G44 Neighbouring vowels in song.** Each written vowel is a syllable,
  but in singing neighbouring vowels may glide into one note.
- **2.0:G45 Foreign names.** A foreign name is copied as closely as Liraasa
  letters allow, chosen by how it sounds and sings.
- `lumiasa` is reglossed "Divine Light, Goddess"; two gloss typos are mended
  (`Irredeemable`, a trailing comma).

Validation is unchanged: 23 PASS, 2 WARN. `renlisulba` and `nevlosulba` keep
sun as their first part, by the author's decision. `eli-pago` and `ola-pago`
stay filed under `time_and_dates`; the guide shows them only as correlatives.
