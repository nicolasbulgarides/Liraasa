# Liraasa 3.0 patch: instructions for Claude Code

You are applying a **proposed** patch that takes the Liraasa constructed language from **2.5 to 3.0**. The patch adds devotional grammar, plus vocabulary for devotion, music and measurement. It is **additions only**: no 2.5 word, spelling, meaning or ruling may be changed or removed.

## Files

| File | What it is |
|---|---|
| `liraasa_3_0_patch.json` | The patch. The single source of truth for every addition. |
| `apply_patch.py` | Merges the patch into the 2.5 JSON. Aborts on any collision. |
| `validate_3_0.py` | Validates the merged file against the patch. |
| `Liraasa_3_0_Devotional_Analysis.md` | Human-readable rationale, rulings and word lists, for the author. |
| `liraasa_2_5_llm.json` | The base. **Never modify it in place.** |

## Patch structure (`liraasa_3_0_patch.json`)

- **`function_words_add`**
  - One new function word, the vocative `iya` (3.0:G129).
  - Rows match `small_words.function_words.rows`: `[form, meaning, use, example_liraasa, example_english]`.
- **`roots_add`**
  - 15 new roots.
  - Each has `forms` (only the meaningful slots), `domain`, `sound_class`, and a ready-made `dictionary_line` in the 2.5 line format, flagged `{new in 3.0}`.
- **`compounds_add`**
  - 112 new compounds, each with `parts` (head last), `image_compound` (true when the pair also fits the 2.0:G40 engine) and `title` (true for titles of the Goddess, see 3.0:G131).
  - Each also carries `dictionary_line`.
- **`listed_derivations_add`, `lexicalised_diminutives_add`**
  - Go into `word_building.lexicalised_derivations` and `word_building.lexicalised_diminutives`, as `"meaning: base + suffix"` strings.
- **`restored_forms_add`**
  - 33 forms that fill empty slots of existing 2.5 headwords.
  - `append_to_line` is the exact text to append, after ` | `, to that headword's dictionary line.
- **`rulings_add`**
  - 3.0:G129–G141, with `rule`, `examples`, `ungrammatical`, and `resolves` where an open question is settled.
- **`open_questions_resolved`, `open_questions_after`**
  - `open_questions_after` replaces `open_questions_do_not_resolve`.
- **`hymn_test`, `prayer_test`**
  - Acceptance sentences. They must all validate after merging.
- **`counts`**
  - Expected totals after merging: 1,590 headwords, 4,260 meaningful forms.
- **`rejected_proposals`**
  - Proposals that were checked and refused, with the reason. **Do not add them.**

## Steps

1. **Back up.** Copy `liraasa_2_5_llm.json` and leave the original untouched.
2. **Merge.**
   `python3 apply_patch.py liraasa_2_5_llm.json liraasa_3_0_patch.json liraasa_3_0_llm.json`
   The script asserts the base has 1,463 headwords and aborts if any new form already exists. It then:
   - adds the function word, root and compound lines (sorted alphabetically within each domain);
   - appends the restored forms to their lines;
   - adds the derivations, diminutives and rulings;
   - replaces the open questions, updates the counts and title, and adds a `patch_history` entry.
3. **Validate.**
   `python3 validate_3_0.py liraasa_3_0_llm.json liraasa_3_0_patch.json` must print `PASS`. It checks:
   - headword and form counts, and that there are no duplicate headwords;
   - the root template (2.1:G57 shape, no doubled letter, no suffix-like ending);
   - edit distance of at least 2 from every active word;
   - that every compound part is a headword;
   - the verb rule on every new verb;
   - that every new form is present;
   - every acceptance sentence, for known words, operator order, and *ne* before tense.
4. **Propagate the rulings into the JSON's other sections.** The merge adds rulings; it does not rewrite prose elsewhere. Update by hand:
   - `clause.template`: allow `iya` + NP as the vocative edge (G129), apposition (G130), and `SUBJECT [TENSE] miyo` with no object (G132).
   - `clause.copulas` and the `miyo` row in `small_words.function_words`: add the absolute and fiat uses (G132, G133).
   - `clause.commands`: add G135.
   - The `sela` and `gagu` rows: add G134 and G136.
   - `recipes`: add rows for *O …!*, *Glory to …!*, *let there be*, *so be it*, *she herself*, *by (author)*, *one by one*, *for ever*.
   - `self_check`: add "a descriptive epithet keeps li; only a title used as a name drops it (G131)".
5. **Regenerate human documents** from the merged JSON:
   - the Reference Grammar;
   - the study guide (*Grammar by Example*): new sections for invocation and epithets, being and fiat, and the music and measure vocabulary;
   - the hymn PDF, using the 3.0 lines in `hymn_test`.

## Rules you must keep

- **Proposed until ratified.** Mark the 3.0 edition as proposed until the author approves each ruling. If the author rejects an item, remove it from the patch and re-run steps 2–3; do not hand-edit the merged file.
- **Never invent a form.** Only listed slots exist. Image compounds (2.0:G40) remain valid by rule but are not listed unless the patch lexicalizes them.
- **Additions only.** Do not fix 2.5 errata inside this patch. One known erratum is outside scope: the 2.5 example *Eli bumre ka sambasan ko pilo de bumre* contradicts 2.5:G95 (it should be *… ko li bumre de pilo*). Raise it with the author as a separate change.
- **Read the 3.0 titles carefully.** A title written as a name (capitalized, no *li*) owns like a name before *de*: *Mareasa de li lumi* means "the Mother's light", not "the mother of light" (G131).
- **The technology vocabulary is out of scope.** From the same external proposal, it belongs in a separate patch.

## Decisions the author still has to make

These are listed in section 8 of the analysis: the spelling `iya`; absolute `miyo`; the comma-less `ola-modo … miyo` formula; and the four goddess-title compounds (*Soladevi, Lunodevi, Loredevi, Liradevi*).
