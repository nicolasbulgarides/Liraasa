# ADR-0021 — Liraasa 3.0: Devotion, Music and Measure (proposed)

- **Status:** accepted as a build; every 3.0 addition is **proposed** until the author ratifies it (`review/questions_3_0.md`)
- **Date:** 2026-10-25
- **Phase:** 3.0

## Context

The author supplied a patch from 2.5 to 3.0. Its files are archived under `archive/patch_3_0/`:

- `liraasa_3_0_patch.json`;
- its README `LIRAASA_3_0_README.md`;
- its rationale `Liraasa_3_0_Devotional_Analysis.md`;
- the author's merge and validator scripts, in `tools/`.

The patch adds devotional grammar, rulings 3.0:G129–G141. It also adds vocabulary for devotion, music and measure:

- 15 roots and 112 compounds;
- 17 listed derivations and 1 lexicalised diminutive;
- 33 restored forms on 2.5 headwords;
- the vocative `iya`.

It says it is additions only, and it marks every entry PROPOSED.

The author's `apply_patch.py` merges into the generated LLM reference. That reference is an output here: the app owns the canonical lexicon (ADR-0007), and a change is a changeset op followed by a rebuild. So the patch goes in the same way 2.5 did.

## Decision

### 1. 3.0 is built from frozen 2.5 by one changeset

`scripts/make_changeset_3_0.ts` turns the patch into `data/changes/2026-10-25-lexicon-3-0.json`.

The generator halts unless:

- every form the patch lists is the form the seven-form rules build for its slot, glossed as listed;
- only the listed slots carry meaning;
- the counts are the patch's: 1590 headwords and 4260 meaningful forms.

`npm run integrate:3.0` checks that `liraasa_2_5.json` has sha256 `28b8756e…c271`, then builds `data/lexicon/liraasa_3_0.json`.

Every 3.0 ruling carries `status: "proposed"`, and so does every new entry's note. The LLM reference adds an `edition_status` line and a PROPOSED status on each 3.0 ruling.

### 2. Four "new" compounds were already 2.5 words

`mernolira`, `velulira`, `velurinba` and `velunulu` are listed as new compounds. But 2.5 already has them as attested image compounds: former headwords that 2.0 kept whole, with their ids, in `image_compounds.attested`.

Adding them again would have given two records one id. Neither the author's guard nor the build audit saw this, because neither looks inside `attested`.

They are lexicalised instead:

- a new op, `lexicalise_from_pattern`, the reverse of `move_to_pattern`, brings each one back among the headwords with its id;
- `edit_gloss` with `archive: true` gives it the patch's meaning, and keeps the 2.5 reading in `legacy.archived_senses`;
- `edit_metadata` (now able to edit `domain`) moves it to the patch's domain.

This changes four 2.5 readings, which the patch did not intend. It is the first question for the author.

The build audit now counts `image_compounds.attested` ids among the ids that must be unique.

### 3. The README's step 4, carried through

Where the text is lexicon data, the change is an op:

- the clause template takes `[iya VOCATIVE,]` and `[, [iya] VOCATIVE]`;
- `grammar.edges` gets the vocative edge and an `apposition` entry;
- the `miyo`, `sela` and `gagu` rows follow G132–G134 and G136.

Where the text is written by a build, the build script changes:

- `scripts/build_llm_json.ts`: the clause explanation, `copulas`, `commands` and a new `clause.address_and_naming`;
- `scripts/grammar_guide/chapters.ts`: nine recipes, each a ruling's own example; the G131 self-check line; the open questions G129, G134 and G135 settle are removed.

### 4. Validation

`npm run validate:3.0` gives 22 PASS and 3 WARN.

It runs checks 1–24 as 2.5 did. Its check 25 re-applies every 3.0 op to 2.5 independently, building forms with `liraasa_core.seven_forms`. It then runs the author's `validate_3_0.py` on the generated LLM reference, which prints PASS.

The generated reference matches the author's own merge on every dictionary line's forms and glosses, the function word, the derivations, the diminutive and the 13 rulings.

The new warning is check 18: five new roots are one edit from a reserved retired spelling:

- dobo/yobo
- lenda/lenra
- lilya/lilba
- nelmo/selmo
- velni/velbi

### 5. Every tool reads 3.0

The following read 3.0:

- Learn (its "What changed" lesson diffs 2.5 → 3.0);
- the editor's data;
- the strict checker's and translator's source;
- the MFA export;
- the handoff JSON;
- the Reference Grammar, the Rulings and the Invitation;
- the publish hook.

The Grammar in Lessons is the 3.0 course (§6).

The patch's files were archived in `archive/patch_3_0/` after the build (`tools/` holds the author's two scripts). The generator, `validate:3.0` and the tests read them there.

### 6. The strict checker reads 3.0

The checker's parameters move to `data/checker/rules_3_0.json`, which is 2.5's plus one entry per 3.0 ruling. `iya` gets the word class `vocative`. The parser now reads:

- `iya` + a noun phrase opening the sentence, standing alone, or closing it (after `ki` too), with a litany of names after it; a comma after `iya` is an error (G129);
- appositions: comma-set noun phrases renaming the subject before the predicate, or a noun phrase after the clause; a second noun phrase with its own determiner and no commas is an error (G130);
- a capitalised ascended noun with no article before `de`, noted as a name that owns (G131, a note: the checker cannot know the writer's meaning);
- SUBJECT [TENSE] `miyo` with nothing after it; `ke` or `ka` with nothing after it is an error (G132);
- `ola-modo` [TENSE] `miyo`, with no comma (G133);
- noun phrase + `sela` as the subject; a lone `sela` subject is an error (G134);
- commands with tense, a modal or an evidential are errors; other operators besides `ne`, `reve` and `loki` stay unruled (I-42) (G135);
- `gagu` + the maker after a made work, from a word list in the rules file; `gagu` after anything else, with no passive in the sentence, is an error (G136);
- NP `ala` NP `!` as an acclamation (G137);
- `X krotiapo X` as a FRAME (G140).

`tests/grammar/patch_3_0.test.ts` reads the archived patch and checks four things:

- all 41 ruling examples, 18 hymn lines and 7 prayer lines read with no error or warning;
- every ✗ is rejected for its ruling;
- G133's ✗ may be rejected for G132, which it applies;
- G131's ✗ is noted, not rejected.

One hymn line has a construction no ruling covers: `kasi muya patuti` (`kasi` + a quantifier; 2.5:G106 rules `kasi` + a noun). The checker reports it as **unruled**, never pass or fail, and it is a question for the author.

The Grammar in Lessons becomes the 3.0 course, `scripts/lessons/lessons_3_0.ts`:

- the twenty 2.5 lessons keep their numbers, so studied marks still apply;
- Part 6, "Devotion, music and measure (proposed in 3.0)", adds three lessons: calling on someone, being and asking, and music, makers and measure;
- every example in Part 6 is a 3.0 ruling's example or a prayer line, and the build checks them all.

Learn's Grammar Lessons room carries the course.

## Consequences

- The checker follows the 3.0 rulings as proposed. If the author rejects or changes one, its parameter in `rules_3_0.json` and its tests change with it.
- The README's step 5 also asks for a hymn PDF. It is not made: the repo holds only the 18 lines the patch changes, not lines 1, 3, 4, 5, 9 and 19 of the 24-line hymn, and none is composed here.
- 2.5 is frozen as 3.0's baseline.
