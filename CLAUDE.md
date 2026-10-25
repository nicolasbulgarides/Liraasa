# Liraasa Workbench

A local web app that is at once a codex, a translator, a learning system and a
command center for the evolution of **Liraasa**, a constructed language built
for singing. Single author, single user, one machine, Chrome or Edge.

Read `docs/SPEC.md` first — it is the build specification and the author owns
it. Then `docs/SCHEMA.md` for the data, `docs/ARCHITECTURE.md` for the module
map, `docs/decisions/` for why things are the way they are.

**The canonical data is Liraasa 1.0.** `docs/SPEC.md` has been revised against
it; the corrections from the 0.8-rc2 original are recorded in ADR-0001. Where
this file, SPEC or any document disagrees with
`data/source/liraasa_1_0.json`, **the JSON wins.**

**1.0 is released and frozen. Work happens in `1.1-draft`** with 1.0 as
baseline (ADR-0008). **The app owns the canonical JSON** from 1.1 on;
`build_1_0.py` was a one-time migration, not the ongoing editor (ADR-0007).

Phase 0 and Phase 1 are complete, the **1.0 → 1.1 vocabulary supplement is
integrated**, and **1.2 is built** (ADR-0013): `data/lexicon/liraasa_1_2.json`,
made from the frozen 1.1 by the two changesets in `data/changes/` via
`npm run integrate:1.2`. 1.2 has 1497 headwords (464 primal, 1033 compounds),
151 function words, rulings 1.2:G24–G36, and 25 of 25 validator checks passing
(`npm run validate:1.2`). 1.2 is now frozen as 2.0's baseline.

**3.5 is current** (ADR-0025): `data/lexicon/liraasa_3_5.json`, built from
frozen 3.4 by `npm run integrate:3.5`: first the author's ratification of
3.0, 3.3 and 3.4 (2026-10-25, "ratify everything": op **`ratify_ruling`** marks
each proposed ruling ratified, never touching its text; notes say ratified;
the 2.5 erratum _pilo de bumre_ is corrected to _li bumre de pilo_), then the
modular 3.5 patch with **every module** (bundle archived in
`archive/patch_3_5/`): 164 compounds, rulings 3.5:G150 (polygons, NUMERAL-gaki)
and G151 (copied names: pitsa), 150 aliases; 2094 headwords, 4951 meaningful
forms. **Everything up to 3.4 is canon; only 3.5 is proposed**
(`scripts/proposed_editions.ts`). From 3.5 a time noun may be a compound's
head (`felradeya`, `WordBuilding.timeHeads`). Validation 22 PASS, 3 WARN
(`npm run validate:3.5`). Five 3.5 sentences that broke an earlier ruling were
settled by the editor, as for 3.3 (`tests/grammar/patch_3_5.test.ts`). 3.4 is
frozen as 3.5's baseline.

**3.4, ratified** (ADR-0024): `data/lexicon/liraasa_3_4.json`,
built from frozen 3.3 by `npm run integrate:3.4`: the author's "Abstraction and
the human condition" patch (bundle archived whole in `archive/patch_3_4/`; no
new roots: 94 compounds, 18 derivations, 3 diminutives, 50 aliases, ruling
3.4:G149), then the editor's decisions on the four 3.3 sentences the author
left to best judgement (`…-3-4-decisions`: 3.2:G147's example is now `li lira de
Amerika`; the recipes and test sentence are fixed where they live). 1930
headwords, 4747 meaningful forms; validation 22 PASS, 3 WARN (`npm run
validate:3.4`); the LLM reference matches the author's own 3.4 build except that
one example. Proposed editions: 3.0, 3.3, 3.4 (`scripts/proposed_editions.ts`).
3.3 is frozen as 3.4's baseline.

**3.3, ratified** (ADR-0023): `data/lexicon/liraasa_3_3.json`,
built from frozen 3.1 by `npm run integrate:3.3`: first the author's
ratification of all of 3.1 (2026-10-25: **3.1 is canon**), then the combined
3.2 + 3.3 patch, "Archetypes and the top 2,000" (bundle archived whole in
`archive/patch_3_3/`): rulings 3.2:G142–G147 and 3.3:G148, the function word
`eho`, 9 roots, 163 compounds, 43 derivations, 21 diminutives, 74 English
aliases (`english_aliases`, form → English, for lookup only); 1836 headwords,
4614 meaningful forms. A time noun may be a compound's modifier (3.2:G142,
`WordBuilding.timeModifiers`). Validation 22 PASS, 3 WARN (`npm run validate:3.3`);
the LLM reference matches the author's own 3.3 build. The checker reads 3.2 /
3.3 (honorific titles, nationality and relational adjectives);
`tests/grammar/patch_3_3.test.ts` names the four patch sentences that break an
earlier ruling, which are the author's to decide (`review/questions_3_3.md`).
The author does not want similar sounds or spellings raised. 3.1 is frozen as
3.3's baseline.

**3.1, ratified** (ADR-0022): `data/lexicon/liraasa_3_1.json`,
built from frozen 3.0 by `npm run integrate:3.1` (changeset made by
`scripts/make_changeset_3_1.ts`, a config for 3.0's `makeAdditionsChangeset`,
from the author's "Everyday and Fiction" patch, archived in `archive/patch_3_1/`).
Vocabulary only: 5 roots, 69 compounds, 4 derivations, 6 diminutives, 4 restored
forms, each with its tier; 1664 headwords, 4404 meaningful forms. Validation 22
PASS, 3 WARN (`npm run validate:3.1`, which also runs the author's
`validate_patch.py`). Questions in `review/questions_3_1.md`. **The canon hymn**,
_The Song of the First Stars_, is `data/corpus/hymn/song_of_the_first_stars.json`
(read by `scripts/hymn.ts` into Learn's corpus, the editor bundle and the LLM
reference's `canon_texts`); `tests/grammar/hymn.test.ts` holds every line to the
strict checker, and the editor opens it from the masthead's "✦ The Hymn". The
editions whose words are proposed are listed in `scripts/proposed_editions.ts`.
3.0 is frozen as 3.1's baseline.

**3.0, ratified** (ADR-0021): `data/lexicon/liraasa_3_0.json`,
built from frozen 2.5 by one changeset via `npm run integrate:3.0` (made by
`scripts/make_changeset_3_0.ts` from the author's patch
`archive/patch_3_0/liraasa_3_0_patch.json`, its README `LIRAASA_3_0_README.md`
and analysis `Liraasa_3_0_Devotional_Analysis.md`; the author's own merge and
validator are in `archive/patch_3_0/tools/`). "Devotion, Music and Measure":
rulings 3.0:G129–G141 (the vocative `iya`, apposition, divine titles, absolute
`miyo`, fiat, emphatic `sela`, `gagu` after a work, acclamations, `en
rinbakrono`, `X krotiapo X`), 15 roots, 112 compounds, 17 derivations, 33
restored forms; 1590 headwords, 4260 meaningful forms. **Every 3.0 addition is
proposed** (`status: "proposed"` on each ruling) until the author ratifies it;
questions in `review/questions_3_0.md`. Four of the patch's compounds were
already 2.5 attested image compounds: op **`lexicalise_from_pattern`** brings
them back as headwords with their ids, their 2.5 readings archived. Validation
22 PASS, 3 WARN (`npm run validate:3.0`, which also runs the author's
validator on the LLM reference). **The strict checker reads 3.0**: its
parameters are `data/checker/rules_3_0.json`, and `tests/grammar/patch_3_0.test.ts`
holds it to every 3.0 example, hymn line and prayer line, and to every ✗.
_The Grammar in Lessons_ is the 3.0 course (`scripts/lessons/lessons_3_0.ts`):
the twenty 2.5 lessons, numbers kept, and a proposed Part 6. The patch's
files are archived in `archive/patch_3_0/`. 2.5 is frozen as 3.0's baseline.

**2.5** (ADR-0020): `data/lexicon/liraasa_2_5.json`, built from
frozen 2.3 by three changesets via `npm run integrate:2.5` (made by
`scripts/make_changeset_2_5.ts` from the author's grammar patch
`data/proposals/liraasa_2_5_patch.json` and its README `LIRAASA_2_5_README.md`):
rulings 2.5:G87–G128, the author's decisions on the 2.3 audit. **2.5:G87: the
album is not grammar canon** (2.2:G68 superseded); it stays as text and licenses
nothing. An amended ruling is kept as ruled and marked `amended_by` (op
`amend_ruling`); new ops `mark_ruling_covered`, `edit_value`. The one new word
is `antizi` (minus); no spelling changed. Validation 23 PASS, 2 WARN
(`npm run validate:2.5`, with `PYTHONUTF8=1` on Windows). **The strict checker**
is `src/core/grammar`: every word read, every sentence parsed against the 2.5
clause template with its edges (G126) and the noun-phrase template (G98), each
word's form checked against its slot, every finding with its rule id, what is
not ruled reported as `unruled`; its word lists and rule parameters are data
(`data/checker/rules_2_5.json`). **The translator** is `src/core/translate`:
English → meaning frame → Liraasa by the rulings → the strict checker →
back-translation, with an interlinear gloss; its English side is data
(`data/translate/english_2_5.json`). Both are bundled into `editor/grammar/` by
`npm run build:grammar`; the editor takes grammar only from them (the 2.3
checker in `editor/checker/` reads the frozen 2.3 reference and keeps the English
pairing check, calques and register notes). There is no approve button: the
editor records a **proposed ruling** instead. Open questions and drafts for the
author: `review/questions_2_5.md`. 2.3 is frozen as 2.5's baseline.

**2.3** (ADR-0019): `data/lexicon/liraasa_2_3.json`, built from
frozen 2.2 by `data/changes/2026-10-19-lexicon-2-3.json` via
`npm run integrate:2.3` (made by `scripts/make_changeset_2_3.ts` from the
author's sound-pass patch `data/proposals/liraasa_2_3_patch.json`; the
generator halts unless every pair, count, example and album line the patch
lists builds as listed). Rulings 2.3:G69–G71: thirteen roots respelled
(lenra → zarku, vanru → dokra, voho → kezdo, vabale → tobra, teyo → dento,
mege → yumli, kupa → ruko, jemla → zimzi, pesbi → bondo, menha → gamdo,
vugo → vizu, salye → bapi, senba → linle); the compounds for bear and cow made
the roots `bumbo` and `murmu` (op `respell_compound_as_root`); frog the new
root `kerku`, retiring the listed derivation `mirunululirayo` (op
`retire_derivation`); wolf rebuilt as `farvibudi` = farvi + budi (op
`recompose_compound`), superseding the wolf clause of 2.1:G59. Every id is
kept; kerku is the one new id. 1463 headwords (475 primal, 988 compounds),
4036 meaningful forms. **A superseded ruling is never respelled**; living
rulings, examples and notes follow a respelling as 2.1:G58 rules. Validation
is 22 PASS, 3 WARN (`npm run validate:2.3`); findings and the author's answers
in `review/2_3_integration.md`. The answers are a hand-written review changeset
(`…-lexicon-2-3-review.json`). Its op `archive_text` moves text that no longer
holds into **`legacy.archived_text`**, kept whole with its reason, rather than
deleting it. A third changeset (`…-lexicon-2-3-audit.json`) records the author's
answers to the grammar audit (`review/audit-report.md`, kit in `tests/audit/`):
the album's consistent usage is grammar (2.3:G72 line-initial `ata`, G73 manner
with `en`/`ko`, G74 `raho` opening a question, superseding that clause of
2.2:G64, G75 `taro-pagopa`), and G76–G86 on the editor's judgement (G77 `ki-oro`
for "whether", superseding that clause of 0.8:G4; G78–G83 clause edges, time
phrases, quotations; G84 superseded rulings stay grammatical; G85 retired
derivations stay buildable). Its op **`edit_text`** rewrites a stale text field
(never a ruling). The checker and composer fixes from the audit are listed in
the report; rerun the kit after any change to `editor/`.
2.2 is frozen as 2.3's baseline.

**2.2** (ADR-0018): `data/lexicon/liraasa_2_2.json`, built from
frozen 2.1 by `data/changes/2026-10-19-lexicon-2-2.json` via
`npm run integrate:2.2` (made by `scripts/make_changeset_2_2.ts` from the
author's `data/proposals/liraasa_2_2_patch.json` and its brief
`LIRAASA_2_2_PATCH.md`). It brought the grammar in line with the album:
rulings 2.2:G60–G68, of which G60–G62 **supersede** 2.1:G46, G47, G54 and the
embedded wh-word clause of 0.8:G4. Superseded rulings are kept and marked
`superseded_by` / `superseded_in_part` (op `supersede_ruling`), never deleted,
renumbered or reworded. 2.2 also undoes the 2.1 respelling `silro → puzu`
(the 2.1 legacy row is marked `reverted` and reserves nothing; `puzu` is
retired) and fills `soloasa` and `tarnulinusan`. **The album** is in
`data/corpus/album_2_0/`: recorded text never edited, readings AR-01…AR-16,
and `album_current.json` from `npm run build:album`. It is canon 2.0 text read
with 2.0 spellings (2.1:G58, 2.2:G68), shown in the guide's part "The album"
and in the LLM reference's `album` section. Validation is 23 PASS, 2 WARN
(`npm run validate:2.2`); findings in `review/2_2_integration.md`.

**2.1** (ADR-0017): `data/lexicon/liraasa_2_1.json`, built from
frozen 2.0 by `data/changes/2026-10-18-lexicon-2-1.json` via
`npm run integrate:2.1` (changeset made from the author's patch by
`scripts/make_changeset_2_1.ts`, which halts unless every pair the patch lists
builds as listed). It respells 28 roots and turns `taha`/`volda` into the
compounds `kezupago`/`larbopagobudi` **keeping every id**; every form,
compound, image compound, listed derivation and the lexicon's living prose
follow (2.1:G58). Rulings 2.1:G46–G56 are grammar (questions in place with a
final `ki`, exclamatives, blessings, N times, `fime` complements, evidentials,
prepositional relatives, partitive `de`, result clauses, duration,
prohibitions), G57 sound guidance, G58–G59 the respelling; the `grammar`
section itself is byte-identical to 2.0. Validation is 22 PASS, 3 WARN
(`npm run validate:2.1`): the kept 2.0 ambiguities, the new `kezupagolelde`
split, and 35 one-edit neighbours among the author's new spellings, listed
in `review/2_1_integration.md` for the author. Learn's corpus is the 1.0
corpus carried into 2.1 spelling (`data/corpus/*_2_1`). 2.0 is frozen as 2.1's
baseline. **A further change is a new changeset op, then a rebuild.**

**2.0** (ADR-0016): `data/lexicon/liraasa_2_0.json`, built from
frozen 1.2 by `data/changes/2026-10-18-lexicon-2-0.json` via
`npm run integrate:2.0`. It is a vocabulary release: grammar is byte-identical
to 1.2, and rulings 2.0:G37–G42 cover word-building only, and G43–G45 (sound values, vowels in song, foreign names) come from the guide review. 2.0 has 1462
headwords (474 primal, 988 compounds), 106 lexicalised derivations, and an
**`image_compounds`** section: 391 former headwords kept whole, with their ids,
in `attested`, plus modifiers × heads that make any pair a word (2.0:G40;
unattested pairs get synthetic ids `ic:<modId>+<headId>`). Validation is
23 PASS, 2 WARN, the two warnings being the four ambiguities the author chose to keep
(`npm run validate:2.0`; findings in `review/2_0_integration.md`). The editor,
checker, Learn, MFA export, handoff and grammar guide read 2.0.
**A further 2.0 change is a new changeset op, then a rebuild**: never hand-edit
`liraasa_2_0.json`. Every new spelling goes through `scripts/check_sounds.py`
first. Also shipped: the MFA phonetic export (`npm run export:mfa`) and the
standalone writing tool in `editor/` — a journal with collections, an
English-to-Liraasa assisted composer, MFA export, and a grammar checker
(`editor/checker/`, ADR-0014) that underlines each finding with its rule and
fix. The strict checker reads the 2.5 LLM reference; what the JSON does not say is
data in `data/checker/`, never code. **Learn** (ADR-0015) is the editor's
training program: a pure core in `src/core/learn/`, bundled into
`editor/learn/` by `npm run build:learn`, progress in IndexedDB, author
overrides in `data/lessons/overrides.json`, and a rename/retire tool whose
change records build through `apply.ts`. The **Training Hall** is Learn's new
home (`editor/learn/hall.js`, `strings.js`, `hall.css`; forms engine
`src/core/learn/forms.ts`), built in eight phases, all done: decisions in
`docs/TRAINING_DECISIONS.md`. Recordings are keyed by id in
`data/audio/manifest.json` (ships empty; `build:learn` bundles the files that
exist, D35); Learn never synthesises speech. The grammar guide is compact by
design: it teaches, reads the author's song `data/songs/Nemelira de devi.txt` word by word,
and leaves the full changelogs to the handoff JSON and every ruling, verbatim, to `handoff/Liraasa_2_3_Rulings.md`. Phase 2 is the TypeScript
validator and parser.

---

## Commands

### Daily

| Command              | What it does                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run dev`        | Vite dev server with HMR                                                                       |
| `npm run check`      | **The gate.** typecheck → lint → format:check → test. Run before reporting any phase complete. |
| `npm test`           | Vitest once                                                                                    |
| `npm run test:watch` | Vitest in watch mode                                                                           |

### Individually

| Command                | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run typecheck`    | `tsc -b --noEmit` across both projects                    |
| `npm run lint`         | ESLint, including the import-boundary rules (ADR-0003)    |
| `npm run lint:fix`     | ESLint with `--fix`                                       |
| `npm run format`       | Prettier write                                            |
| `npm run format:check` | Prettier check — what `npm run check` runs                |
| `npm run coverage`     | Vitest with v8 coverage over `src/core` and `src/storage` |
| `npm run build`        | Typecheck, then production build to `dist/`               |
| `npm run preview`      | Serve the built `dist/`                                   |

### Data CLIs

| Command                    | What it does                                                                                                                                                                                                                                                                                                      | Status      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `npm run lexicon:import`   | Import a lexicon into `data/lexicon/` and mint stable ids; prints the counts. Takes `[source.json]` and `--edition`.                                                                                                                                                                                              | **working** |
| `npm run lexicon:export`   | Export in the author's schema. **Verifies the round trip before writing** and exits non-zero if it is not lossless.                                                                                                                                                                                               | **working** |
| `npm run validate`         | The 24 checks plus the corpus run, shaped like `validation_1_0.json`. Also what the app runs before every save (ADR-0007).                                                                                                                                                                                        | Phase 2     |
| `npm run integrate:1.2`    | Build 1.2 from frozen 1.1 plus the 1.2 changesets; halts on any op that does not land. `-- --check` writes nothing (ADR-0013).                                                                                                                                                                                    | **working** |
| `npm run validate:1.2`     | validate.py unmodified plus the edition-aware checks 5/9/12/18/25 → `data/lexicon/validation_1_2.json`.                                                                                                                                                                                                           | **working** |
| `npm run integrate:2.0`    | Build 2.0 from frozen 1.2 plus the 2.0 changeset (sha-checked baseline). `-- --check` writes nothing (ADR-0016).                                                                                                                                                                                                  | **working** |
| `npm run validate:2.0`     | validate.py unmodified plus checks 3/7/12/13/18/24/25 re-run under the 2.0 rulings → `data/lexicon/validation_2_0.json`.                                                                                                                                                                                          | **working** |
| `npm run integrate:2.1`    | Build 2.1 from frozen 2.0 plus the 2.1 changeset (sha-checked baseline). `-- --check` writes nothing (ADR-0017).                                                                                                                                                                                                  | **working** |
| `npm run validate:2.1`     | validate.py unmodified plus checks 3/7/12/13/18/24 under the 2.0 and 2.1 rulings, and a respelling-aware 25 → `data/lexicon/validation_2_1.json`.                                                                                                                                                                 | **working** |
| `npm run integrate:2.2`    | Build 2.2 from frozen 2.1 plus the 2.2 changeset (sha-checked baseline). `-- --check` writes nothing (ADR-0018).                                                                                                                                                                                                  | **working** |
| `npm run validate:2.2`     | validate.py unmodified (on the lexicon less reverted respelling rows) plus the edition-aware re-runs → `data/lexicon/validation_2_2.json`.                                                                                                                                                                        | **working** |
| `npm run integrate:2.3`    | Build 2.3 from frozen 2.2 plus the 2.3 changeset (sha-checked baseline). `-- --check` writes nothing (ADR-0019).                                                                                                                                                                                                  |
| `npm run validate:2.3`     | validate.py unmodified plus the edition-aware re-runs (check 18 for the new and moved roots; 25 keeps superseded rulings as ruled) → `data/lexicon/validation_2_3.json`.                                                                                                                                          |
| `npm run integrate:2.5`    | Build 2.5 from frozen 2.3 plus the three 2.5 changesets (sha-checked baseline). `-- --check` writes nothing (ADR-0020).                                                                                                                                                                                           | **working** |
| `npm run integrate:3.0`    | Build 3.0 from frozen 2.5 plus the 3.0 changeset (sha-checked baseline). `-- --check` writes nothing (ADR-0021).                                                                                                                                                                                                  | **working** |
| `npm run integrate:3.1`    | Build 3.1 from frozen 3.0 plus the 3.1 changeset (sha-checked baseline). `-- --check` writes nothing (ADR-0022).                                                                                                                                                                                                  | **working** |
| `npm run integrate:3.3`    | Build 3.3 from frozen 3.1: the 3.1 ratification, then the 3.3 changeset (sha-checked baseline). `-- --check` writes nothing (ADR-0023).                                                                                                                                                                           | **working** |
| `npm run integrate:3.4`    | Build 3.4 from frozen 3.3: the 3.4 patch, then the editor's decisions on four 3.3 sentences (sha-checked baseline). `-- --check` writes nothing (ADR-0024).                                                                                                                                                       | **working** |
| `npm run integrate:3.5`    | Build 3.5 from frozen 3.4: the ratification of 3.0, 3.3 and 3.4, then the 3.5 patch with every module (sha-checked baseline). `-- --check` writes nothing (ADR-0025).                                                                                                                                             | **working** |
| `npm run validate:3.5`     | validate_3_0.py on 3.5 → `data/lexicon/validation_3_5.json`; then the author's `validate_patch.py` on `handoff/liraasa_3_5_llm.json`.                                                                                                                                                                             | **working** |
| `npm run validate:3.4`     | validate_3_0.py on 3.4 → `data/lexicon/validation_3_4.json`; then the author's `validate_patch.py` on `handoff/liraasa_3_4_llm.json`.                                                                                                                                                                             | **working** |
| `npm run validate:3.3`     | validate_3_0.py on 3.3 (check 7 re-run under 3.2:G142, 25 re-applies every 3.3 op) → `data/lexicon/validation_3_3.json`; then the author's `validate_patch.py` on `handoff/liraasa_3_3_llm.json`.                                                                                                                 | **working** |
| `npm run validate:3.1`     | validate_3_0.py on 3.1 (checks 1–24 by validate_2_3.py, 25 re-applies every 3.1 op) → `data/lexicon/validation_3_1.json`; then the author's `validate_patch.py` on `handoff/liraasa_3_1_llm.json`.                                                                                                                | **working** |
| `npm run validate:3.0`     | validate_2_3.py for checks 1–24; check 25 re-applies every 3.0 op independently → `data/lexicon/validation_3_0.json`; then the author's `validate_3_0.py` on `handoff/liraasa_3_0_llm.json` (run `build:llm` first).                                                                                              | **working** |
| `npm run validate:2.5`     | validate_2_3.py for checks 1–24 (2.5 respells nothing); check 25 re-applies every 2.5 op independently → `data/lexicon/validation_2_5.json`.                                                                                                                                                                      | **working** |
| `npm run build:grammar`    | The checker's derived data (`transitive_2_5.json`, the drafts) and the editor's bundle of the strict checker and translator → `editor/grammar/`. Run after `build:llm`.                                                                                                                                           | **working** |
| `npm run check:line`       | Read Liraasa lines through the strict checker: the gloss and every finding with its rule.                                                                                                                                                                                                                         | **working** |
| `npm run translate`        | English → Liraasa through the 2.5 pipeline, with the gloss, the back-translation and every flag.                                                                                                                                                                                                                  | **working** |
| `npm run build:album`      | Read the album against the live lexicon → `data/corpus/album_2_0/album_current.json`. Run by `build:llm`.                                                                                                                                                                                                         | **working** |
| `npm run check:sounds`     | Sound-collision audit of 3.0 (`--candidates FILE` vets proposed spellings: template, collision, distance, parse, singability). Python stdlib.                                                                                                                                                                     | **working** |
| `npm run integrate`        | Build 1.1 from the frozen 1.0 plus a vocabulary proposal. `-- --check` audits and writes nothing (ADR-0009).                                                                                                                                                                                                      | **working** |
| `npm run report:1.1`       | Regenerate the 1.1 changelog, LLM quickstart and compare report from the integration data.                                                                                                                                                                                                                        | **working** |
| `npm run export:mfa`       | Montreal Forced Aligner dictionary, phone inventory and syllable sheet into `data/export/`.                                                                                                                                                                                                                       | **working** |
| `npm run build:llm`        | The whole language in one JSON for language models → `handoff/liraasa_3_0_llm.json` (also published to `LirasaCodexLatest/`). Only meaningful forms.                                                                                                                                                              | **working** |
| `npm run build:checker`    | Wrap the LLM reference and `data/checker/*.json` as the scripts `editor/checker/` loads. Run by `build:llm`.                                                                                                                                                                                                      | **working** |
| `npm run build:learn`      | Bundle `src/core/learn` and its data (lexicon, corpus, overrides, previous edition) into `editor/learn/`. Run after any data change.                                                                                                                                                                              | **working** |
| `npm run learn:report`     | The Learn curriculum and every gap → `review/learn_report.md`.                                                                                                                                                                                                                                                    | **working** |
| `npm run build:editor`     | Rebuild the data bundle that `editor/index.html` loads.                                                                                                                                                                                                                                                           | **working** |
| `npm run build:guide`      | Rebuild the handoff JSON, then the 2.3 Reference Grammar and _Liraasa: An Invitation_ into `handoff/` (`-- --pdf` also prints them). Song, treasury and Invitation words in `scripts/grammar_guide/config.ts`; non-canon sentences and open decisions → `review/*_review.md`.                                     | **working** |
| `npm run build:invitation` | The Invitation alone. Fails on a non-canon word, or on a grammar term or ruling id it leaves to the Reference.                                                                                                                                                                                                    | **working** |
| `npm run build:lessons`    | _The Grammar in Lessons_ → `handoff/Liraasa_3_0_Lessons.html` (`-- --pdf` also prints it and copies both to `LirasaCodexLatest/`). Content in `scripts/lessons/lessons_3_0.ts`; halts unless every example reads clean under the strict checker. Also bundled into Learn's Grammar Lessons room by `build:learn`. | **working** |
| `npm run publish:guide`    | The Stop hook: rebuild if any input changed, copy to `LirasaCodexLatest/`, then commit the documents and the lexicon JSON to the `codex-latest` branch and push it (the Invitation links there). Never touches the working branch.                                                                                | **working** |

```sh
# Import the frozen 1.0: a byte-identical copy plus the id sidecar.
npm run lexicon:import

# Export at 1.1-draft: the source shape plus inline ids, nothing else.
npm run lexicon:export -- --edition 1.1-draft --out data/lexicon/liraasa_1_1_draft.json
```

### Author's Python tools

In `data/source/`, **read-only reference**. They cannot run as shipped:
`validate.py` and `build_1_0.py` both import `liraasa_core`, and `validate.py`
also imports `liraasa_lexicon`; neither module was supplied (ADR-0001,
finding 16). They are still the best available specification of the 24 checks
— read them before porting.

```sh
# For reference only; both fail on ModuleNotFoundError today.
python data/source/validate.py data/source/liraasa_1_0.json \
  --baseline lexicon_0_8_rc2.json --corpus CORPUS_DIR --out validation.json
```

**`validate.py` now runs.** `liraasa_core.py` and `liraasa_lexicon.py` were
reconstructed and verified by parity against `validation_1_0.json` (ADR-0010).
On Windows set `PYTHONUTF8=1`, because `validate.py` opens files without an
explicit encoding:

```sh
cd data/source
# 1.0, the parity check: must reproduce validation_1_0.json
PYTHONUTF8=1 python validate.py liraasa_1_0.json --baseline ../lexicon/lexicon_0_8_rc2.json

# 1.1, through the wrapper that un-gates the version-specific checks
PYTHONUTF8=1 python validate_1_1.py ../lexicon/liraasa_1_1.json   --baseline-1-0 liraasa_1_0.json --baseline ../lexicon/lexicon_0_8_rc2.json   --out ../lexicon/validation_1_1.json
```

`openpyxl` is not installed, so the workbook generators cannot run. The two
`.xlsx` files and the `.docx` guide in `data/source/` are generated artefacts
of the JSON; read the JSON, not them.

---

## Layout

```
data/source/     the author's original files, READ-ONLY. Never edit, never reformat.
data/lexicon/    the working canonical lexicon (author's schema + additive fields)
data/texts/      token documents (SCHEMA §3)
data/lessons/    lesson definitions
data/changes/    changesets and editions
data/proposals/  the author's 1.1 vocabulary proposal and 2.0 patch (inputs, read-only)
data/lexicon/    also holds lexicon_0_8_rc2.json, the validators' 0.8 baseline
data/songs/      the author's songs the guide reads (Nemelira de devi.txt)
src/core/        pure TypeScript: no DOM, no React, no I/O. Lint-enforced.
src/storage/     StorageAdapter implementations
src/ui/          shell, components, one folder per module
editor/          the standalone songbook editor; the GitHub Pages site root
scripts/         CLI entry points
tests/golden/    fixtures and assertions built from the real data
docs/            SPEC (author's), SCHEMA, ARCHITECTURE, decisions/, TRAINING_DECISIONS
handoff/         the generated documents and JSON for each edition
review/          generated review lists and audits for the author
tools/voice_lab/ the local voice-synthesis lab (its .venv is ignored)
archive/         superseded guides and documents, kept for reference
```

Import boundaries are enforced by ESLint, not convention:
`src/ui` → `src/storage` → `src/core`, never upward, and UI modules never
import each other. Aliases: `@core/*`, `@storage/*`, `@ui/*`.

---

## Working rules

**Build in the phases of SPEC §13.** Stop at the end of each phase, report
test results and open questions, and wait for the author's go-ahead. Phases 0
and 1 are done; Phase 2 is the validator and parser.

**Never edit anything in `data/source/`.** It is the author's reference set,
and `data/lexicon/liraasa_1_0.json` is a verified byte-for-byte copy of the
frozen edition — do not edit that either. `docs/SPEC.md` is in
`.prettierignore` so its tables are not repadded; revise it deliberately, not
by formatter.

**Never decide the language.** SPEC §14 lists what the tool must surface and
never resolve: a new root, a new gloss, activating an unused slot, a veto, a
respelling. The 1.0 data has already closed the eight 0.8 open questions in
`settled_open_questions_0_8` — read them rather than re-asking. Open questions
that are genuinely still live are in ADR-0001 §3 and the Phase 0 report.

**Never invent a Liraasa word.** Not in code, not in a test fixture, not in a
comment, not in a lesson draft. Use a lexicon entry, or build a transparent
MODIFIER+HEAD compound from existing headwords and flag it noncanonical. The
4608 slots glossed `"— (unused)"` have no meaning and never get one.

**Generated text is untrusted.** Every LLM output is tokenised, parsed and
checked before it is shown, and never stored as canonical unless it passes
(ADR-0006).

**Reference entries by `id`, never by spelling.** 63 roots retired and 7 were
respelled in one edition. A stored spelling is a bug, except
`surface_snapshot`, whose job is to be frozen.

**Every edit is a `ChangeRecord`** — what changed, old value, new value, reason
(ADR-0007). A record with no reason is rejected. **The validator runs before
every save**, and a save that would introduce a FAIL is refused.

**Ruling ids are edition-qualified**: `"1.0:G19"`, `"0.8:R2"`. `G1`–`G8`
are defined in both ruling sets with different content (ADR-0004).

**A golden test that fails is reported, never auto-corrected.** If the form
generator disagrees with a stored form, the stored form is canon and the
disagreement is the finding.

---

## Facts worth knowing before you touch the data

The numbers, with the full picture in `docs/SCHEMA.md`:

- **1099** headwords = **386** primal roots + **713** compounds. No `Root`
  type exists. 7693 forms, all distinct; **4608** glossed `"— (unused)"`.
- **All 7693 forms regenerate from the documented rules with zero mismatches.**
  Verified in Phase 0 and pinned by a test.
- **149** function words (27 new in 1.0), 8 pronouns, 36 correlatives, 43 time
  words, 9 colours, 4 discourse particles, 387 rhyme families.
- **452** examples, **447** live (5 are `HISTORICAL` and skipped).
- **24** validator checks, all PASS on 1.0. Check 12 needs
  `lexicon_0_8_rc2.json`, which is missing, so it cannot run.
- `protected: true` on **every** headword — no canon spelling is ever
  regenerated by rule.
- `english_synonyms` is an **array on all 1099** entries. No semicolon strings.
- Every compound has exactly **two** `components`, and every compound's
  spelling equals `components.join('')`.
- **One nested compound exists**: `mudusomubiti` = `mudu` + `somubiti`.
- **32 spellings live in more than one namespace** (`maivo` is both a pronoun
  and a root). A form index maps a spelling to a _list_, never one entry.
- `forms` is stored in **two key orders** (80 entries put `verb` second).
  Preserve each entry's own order on export (ADR-0002).
- Watch the characters: `≤0.7` in `since` (U+2264) and the em dash in
  `"— (unused)"` (U+2014). Both must survive a round-trip byte-for-byte, and
  the 1.0 export is **verified byte-identical** to the source, trailing newline
  included (there is none).
- **`migration_forms.kind` has five values**, not two: `retired`, `respelled`,
  `merged`, `rewritten`, `archived-phrase`. For the five `archived-phrase` rows
  the target is a **multi-word phrase**, not a form, so it cannot be looked up
  in a form index.
- **Colour words are their own closed class.** None of the 45 is a headword.
- **`opi` ("Hope") is a real Primal headword**, so the verb-rule irregular is
  live data, not a reserved case.
- **Registers are two vocabularies**: entries are `everyday`/`poetic` only
  (ruling 0.8:R10 — no sacred word list); texts are
  `everyday`/`poetic`/`sacred`, where sacred is a property of the _form_
  (`-asa`, `-asasan`). `irreverent` is an optional text-level tone flag and is
  never written into the lexicon.
- **`time_and_dates` has 43 rows but 40 distinct forms**: `eli-krono`,
  `toda-krono` and `nuna-krono` each appear twice.
- The clause template is the **20-slot** 1.0 one, not the 10-slot template
  SPEC §5.4 quotes. See SCHEMA §1.7.1.
- Transitivity is **usage-based** (settled question 5), so the `gome` check is
  implementable and **no `transitive` field should be added**.
- `phonology.protected_exceptions` says "36 amor- double-a roots". **That label
  is wrong**: they are compounds, and 1.0 has 39 (20 ending `-amor`, 19
  beginning `amor-`). 36 was the 0.8-rc2 count. The corrected list is in
  `src/core/config/phonology.ts`; the label is scheduled for repair in 1.1.

---

## Conventions

- TypeScript strict, plus `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`. Index reads are `T | undefined`; handle the
  missing case rather than asserting it away.
- Dependency versions are pinned exactly. A bump is a deliberate edit.
- Plain CSS with custom properties. Light palette on bare `:root`, dark
  redefined under both `prefers-color-scheme` and `[data-theme]`.
- Accessibility is a build requirement, not a final pass: WCAG 2.2 AA, full
  keyboard operation, visible focus, a keyboard alternative to every
  drag-and-drop exercise, nothing conveyed by colour alone.
- Liraasa text gets `class="liraasa"` and a serif stack. Spelling is never
  altered for display.
- Exports are deterministic — `JSON.stringify(v, null, 1)`, non-ASCII
  preserved, matching the author's `json.dump(..., ensure_ascii=False,
indent=1)` — so git diffs stay readable.
