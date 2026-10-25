# ADR-0026: 3.5 ratified; maivori by context; the translator, Lessons and Reference teach 3.x

- **Status:** accepted
- **Date:** 2026-10-25
- **Phase:** 3.5

## Context

On 2026-10-25 the author ratified 3.5 ("I ratify 3.5!"). They gave three more decisions:

- `maivori` is context-specific;
- `zefrolalfo` keeps "levitation";
- every open question goes in one file.

They also asked for the translator, _The Grammar in Lessons_ and the Reference Grammar to be updated.

## Decision

### 1. A third 3.5 changeset, the author's (`…-3-5-author`)

- `ratify_ruling` marks 3.5:G150 and G151 ratified. Every 3.5 headword's note says it is ratified.
- **3.5:G152** (ratified) rules that `maivori` is "we, with or without the listener, as the context shows". When it matters, name who is meant: `maivo ata taivo`, you and I.
- `zefrolalfo` keeps "levitation". `navulalfo`, which had the same gloss, is re-glossed "a rise into the sky; skyward floating", and its verb "to float up into the sky". The old gloss is archived. The duplicate-gloss warning is gone.
- The 2.5 erratum's `edit_example` moved into the ratification changeset.

`PROPOSED_EDITIONS` is now empty: everything up to 3.5 is canon. `npm run validate:3.5` gives 23 PASS and 2 WARN.

The 3.4 decisions changeset now also corrects the **English** of 3.2:G147's second example: "Peta from America" becomes "a song from America", to match `li lira de Amerika`. `archive_text` takes `example:N:english` for this, in both `apply.ts` and `validate_2_5.py`. 3.4 and 3.5 were rebuilt and revalidated: 3.4 gives 22 PASS and 3 WARN, as before.

### 2. Every open question in one file

`review/open_questions.md` holds every open question:

- ten grammar points;
- the two drafted word lists;
- recordings and the old checker.

Each one is reported as unruled, never as wrong.

### 3. The translator renders the 3.x constructions

The translator now renders these constructions. Its data is in `data/translate/english_2_5.json`.

- vocative O → `iya`, first, last or alone (G129);
- absolute being, she is → `Saivo miyo.`, including the was/is/will be chain (G132);
- let there be → fiat; may there be → `… pifu` (G133);
- the fixed formulas: So be it, Amen, So it was… (G133), from a `formulas` table that the checker still verifies;
- emphatic she herself → `saivo sela` (G134);
- the song by X → `gagu` (G136);
- Glory/Praise to X! → NP `ala` NP (G137);
- forever → `en rinbakrono` (G139);
- one by one → X `krotiapo` X (G140);
- Mr/Mrs/sir → `zilenela` (G145);
- built and copied words, such as polygons, origin adjectives and `pitsa`, from a `rule_words` table, flagged as built by rule (G147, G150, G151).

Eighteen cases in `tests/translate/cases_2_5.json` pin these renderings.

### 4. Lessons and Reference

- _The Grammar in Lessons_ gains Part 7, "Word families, names and shapes (3.2 to 3.5)", with three lessons. Every example comes from a ruling or a ratified recipe, and every example reads clean.
- The Reference Grammar gains Part 7, "Devotion, families and shapes". It uses only the rulings' own examples, and the build fails if one is gone. The song, the album, the treasury and the open questions move to Parts 8–11.
- The 3.5 recipes are ratified.
