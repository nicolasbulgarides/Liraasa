# ADR-0022 — Liraasa 3.1: Everyday and Fiction (proposed), and the canon hymn

- **Status:** accepted as a build; every 3.1 entry is **proposed**, with its tier, until the author ratifies it (`review/questions_3_1.md`)
- **Date:** 2026-10-25
- **Phase:** 3.1

## Context

The author supplied a 3.1 patch on 3.0, "Everyday and Fiction", archived in `archive/patch_3_1/`:

- the patch, `liraasa_3_1_patch.json`;
- its README, `README_3_1_CLAUDE_CODE.md`;
- the review, `Liraasa_3_1_Review_and_Patch.md`;
- the author's generalized merge and validator scripts, in `tools/`.

The patch is vocabulary only:

- 5 roots, 69 compounds, 4 listed derivations, 6 lexicalised diminutives and 4 restored forms;
- each entry has a tier: 35 entries in tier 1 (ratify first) and 53 in tier 2 (item by item);
- 6 recipes for senses already sayable without a new word, and 8 test sentences.

The author asked to install the patch whole. The author also asked to make the creation hymn, _The Song of the First Stars_, a canon corpus text in 3.1, shown prominently in the editor, with good grammar.

## Decision

### 1. 3.1 is built from frozen 3.0 by one changeset

`scripts/make_changeset_3_0.ts` now exports `makeAdditionsChangeset(config)`. 3.0's changeset regenerates from it byte-for-byte. `scripts/make_changeset_3_1.ts` is a config for the same function.

Each 3.1 entry's note records its tier. A lexicalised diminutive may now have a listed derivation as its base (`taradapagoti`).

`npm run integrate:3.1` checks that `liraasa_3_0.json` has sha256 `5b44b4e5…22ef` and builds `data/lexicon/liraasa_3_1.json`:

- 1664 headwords;
- 4404 meaningful forms.

`npm run validate:3.1` gives 22 PASS and 3 WARN. `scripts/validate_3_0.py` now serves any additions-only patch, and reads the edition from the lexicon. The author's `validate_patch.py` prints PASS on the generated LLM reference. That reference matches the author's own merge on every dictionary line, derivation and diminutive.

The five new recipes go into the guide's recipes. The 3.1 "recognize" recipe was already a 2.5 recipe.

### 2. Every tool reads 3.1

The 3.0 build's consumers move to 3.1:

- the LLM reference;
- the handoff JSON, the Reference Grammar and the Invitation;
- Learn, with its "What changed" lesson now covering 3.0 → 3.1;
- the editor bundle, the strict checker and the translator;
- the MFA export;
- the publish hook.

_The Grammar in Lessons_ is published as the 3.1 course. Its content, `lessons_3_0.ts`, is unchanged, because 3.1 adds no grammar.

The LLM reference keeps the "new in 3.0" flag on 3.0 words as well as "new in 3.1", because both editions are proposed. The list lives in `scripts/proposed_editions.ts`.

### 3. The hymn is a canon corpus text

`data/corpus/hymn/song_of_the_first_stars.json` is the one source for the hymn. It holds all 24 lines with their English, and gives each line's source.

**Where each line comes from:**

- lines 1, 3, 4, 5, 9 and 19 are the 2.5 translation, `data/songs/Liraasa_de_li_Vanisan_Lirayo_Translation.pdf`, unchanged by 3.0;
- the other eighteen are the 3.0 patch's revisions.

**Three things kept it from reading clean, and how each was resolved:**

- **Line 12's `kasi muya`** (`kasi` + a quantifier) is not ruled. It reads `muya loterosan patuti` instead: `loterosan` is the 2.5 translation's own word for "further". This is the one wording change, noted on the line and put to the author.
- **The PDF's Liraasa title** `Liraasa de li una-ne veluri` would read "Liraasa's first stars" under 3.0:G131. The title is the hymn's own name for itself in line 24, `li lira de li una-ne veluri`.
- **Two lines needed parser fixes, not rewording.** Both are within the rulings:
  - line 4: an embedded `ki-coda` before the predicate is the subject's gap, so `ki-coda po miyo` (what was) is absolute `miyo` (3.0:G132);
  - line 5: a verbless conjunct after `ata` may carry its own adjunct (`…, ata saivo de lumina gase li sadoasa`).

**Where the hymn is used, and how it is checked:**

- `scripts/hymn.ts` loads the hymn for Learn's corpus, the editor bundle (`hymn`) and the LLM reference (`canon_texts`).
- `tests/grammar/hymn.test.ts` holds every line and the title to the strict checker: no error, no warning, nothing unruled.

**The editor's Hymn view:**

- **Opening it:** a gold "✦ The Hymn" button stands first in the masthead and opens a full view of the hymn.
- **What it shows:** the Liraasa with its English, a word-by-word gloss from the strict checker, and each line's source.
- **The badge:** the page re-checks every line against the strict checker when the view opens, so the badge reports what the grammar says now.
- **Keyboard:** Escape closes the view.
- **"Open in the songbook":** puts a copy on a "Canon" shelf, devotional and sacred.

### 4. Two further checker fixes found on the way

- A relative clause on the subject with no object or adjunct needs no closing comma (2.5:G115). A tense or operator that opens a predicate after it now belongs to the main clause: `Li lira raho maivo po lirala po ke vanisan.` A genuinely misplaced `po` is still caught.
- Learn's "spot the pattern" drill no longer gives up on a grid whose verbs all share one class. One filler word gives way to a verb of another class.

## Consequences

- One of the patch's eight test sentences still gets a warning: `po gome tozeta`. Whether a verb takes an object (2.5:G110) is learned from usage in the data, and `tozeta` has none yet.
- Sound check findings for the author:
  - `dugo`, `bika` and `pega` are one edit from the reserved spellings `vugo`, `biya` and `fega`;
  - `famlilinu` gives `purmafamlilinu` a second split;
  - `lisicemokova` splits two ways.
- 3.0 is frozen as 3.1's baseline.
