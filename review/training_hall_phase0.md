# Training Hall — Phase 0 reconnaissance

Read-only survey against `data/lexicon/liraasa_1_2.json` (1497 headwords) and
the code at `31ed81c`. No code or data was changed.

## The headline

**Most of what the brief asks for already exists.** ADR-0015 ("Learn") built a
pure, seeded, id-keyed training core with a lot of tests behind it. The Training Hall should be
**a redesign of Learn's views on top of that core**, not a second program.
The real work is three things: the Ten Stars and Loom experiences, a forms
engine that reads its rules from the data instead of from TS constants, and the
visual redesign.

Two facts about the language change the brief's examples:

1. **Tense is not a word form.** Past is the particle `po` in clause slot 4
   (TENSE), a function word with its own id. It is not an affix on the root.
   Changing it is a function-word respelling, and Learn already follows that by id.
   A "past" row does not belong in a word's form table.
2. **There is one morphological irregular in the whole language**: the verb
   of `opi` (`opioa`). All 1497 × 7 stored forms match the rule, and `opi` is
   the only exception. So "Spot the Irregular" as specified would almost never
   have anything to spot. See "Irregulars" below for what can stand in for it.

---

## 1. Current training program

| Where                                    | What                                                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/core/learn/*.ts` (18 files, ~4.4k lines) | pure core: adapter, linker, concepts, skill graph, lessons, 12 exercise types, diagnostic grader, seeded RNG, FSRS + SM-2, progress/reconcile, edition diff     |
| `editor/learn/learn-core.js`             | that core bundled by `npm run build:learn` (`window.LiraasaLearn`)                                                                                                  |
| `editor/learn/learn-data.js`             | bundled data: lexicon, linked corpus, names, overrides, previous-edition snapshot                                                                                 |
| `editor/learn/app.js` (1771 lines)       | views: Today · Path · Unit · Review · Practice · Read · Card · Rule · What changed · Progress (with settings)                                                       |
| `editor/learn/session.js`, `author.js`   | the exercise runner; Author → Overrides / Audio / Roots (rename and retire)                                                                                        |
| `editor/learn/store.js`                  | IndexedDB `liraasa-learn` (progress, overrides draft, pending root changes, audio blobs), with a localStorage fallback                                             |
| `editor/learn/learn.css` (800 lines)     | styles, built on the songbook's tokens                                                                                                                             |
| `editor/index.html`                      | the `Learn` button (l.1430), `#learnView` (l.1565), script tags (l.1662), event bridge (l.4763)                                                                    |
| `data/lessons/overrides.json`            | author overrides keyed by id: pins, levels, notes, lessons, ruling links, exclusions, ruling examples                                                               |
| `tests/learn/*.test.ts`                  | 76 tests: no Liraasa in UI code, rename keeps progress, 1000 seeded exercises, byte-identical export/import, 1.1→1.2 diff                                            |

**Does well:** fully derived content; ids everywhere; edition snapshots plus
`reconcile`, so renames, reglosses and retirements are noticed; distractors are
chosen by theme and sound, not at random; the grader names its errors
(`wrong-form`, `wrong-root`, `old-spelling`, `wrong-order`…); a test proves
the UI holds no Liraasa.

**Brittle / hard-coded:**

- **Morphology rules are TS constants**: `src/core/config/morphology.ts`
  (`VERB_RULE`, including `opi`) and `src/core/config/slots.ts`
  (`SLOT_SUFFIX`). They mirror the JSON, and a test fails on drift. A
  marker change in the data therefore breaks the build. It does not flow
  through, which fails acceptance criterion 1 as written.
- The views are a 1771-line string-template file, organised as a course
  (path, units). It has no draw-ten flow, no study card with a full form
  table, and no rule-by-rule workshop.
- Microcopy is inline in `app.js`; there is no strings file.

## 2. Lexicon data model

A headword (`headwords[]`, 464 `Primal` + 1033 `Compound`), verbatim:

```json
{ "root": "belda", "type": "Primal", "components": null,
  "forms":   { "root": "belda", "ascended": "beldaasa", "negative": "beldana", "verb": "beldaba",
               "negative_adjective": "beldanasan", "adjective": "beldasan", "ascended_adjective": "beldaasasan" },
  "glosses": { "root": "bell", "ascended": "— (unused)", "negative": "— (unused)", "verb": "to ring",
               "negative_adjective": "— (unused)", "adjective": "ringing", "ascended_adjective": "— (unused)" },
  "register": "everyday", "domain": "Home & objects",
  "english_synonyms": ["bell", "to ring", "ringing"],
  "status_1_0": "CARRIED", "since": "≤0.7",
  "history_0_8": { "status": "NEW", "editorial_note": "…" },
  "notes": "", "protected": true, "id": "lx_belda_0026" }
```

Here is how the brief's fields map onto this:

| Brief        | Data                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| id           | `id` (`lx_…`, `fw_…` for function words); stable across respellings                                  |
| spelling     | `root`                                                                                                |
| gloss        | `glosses.root`. It can hold `;`-separated senses                                                      |
| altMeanings  | the other meaningful `glosses.*`. **Not** raw `english_synonyms`, which is noisy (`"loving garden a"`)  |
| theme        | `domain` (56 values)                                                                                  |
| **pos**      | **none.** Every headword carries all seven forms; a form "applies" when its gloss is not `— (unused)`   |
| compounds    | `components: [modifier, head]` on the compound; the reverse index is `LearnItem.usedIn`                 |
| version      | `since` (`≤0.7`, `0.8`, `1.0`, `1.1`, `1.2`), `status_1_1` / `status_1_2` (NEW / REGLOSSED), `replaces` |

Closed classes, each with ids: 151 function words (`form`, `meaning`,
`position`, `example`), 8 pronouns, 39 correlatives, 43 time words, 9 colours,
4 discourse particles, and numbers 0–999 (a table plus rules).

## 3. Grammar data model

Grammar is **structured data, not prose only**:

- `morphology`: `seven_forms` (`"R+asa"`…), `verb_rule`, `suffix_order`,
  `suffixes`, `compounding`, 29 `lexicalised_derivations`
- `grammar.clause_template` (20 slots), `grammar.slots[]` (each with its words
  and notes), `scope_operators`, `stacking` (one per slot + 13 exclusion pairs),
  `valency`, `noun_phrase`
- `motion_prefixes`; rulings `1.0:G*` (23), `0.8:R*` (20), `1.2:G24–G36` (13),
  each with topic, ruling text, `refines` and examples; 586 `examples`

**Engines:**

- Word level: `src/core/morphology/` (`formOf`, `sevenForms`, `assemble`
  for the suffix stack, `deriveOrNull`). It is pure and tested.
- Sentence level: **no generator, and no TS parser** (`src/core/parse/` and
  `src/core/grammar/` are empty; that is the unbuilt Phase 2). What exists is
  the **grammar checker** in `editor/checker/` (ADR-0014). It is data-driven, it
  reads slot order, stacking and exclusions, and it is tested in `tests/checker/`.
  It **checks** a sentence and does not build one. The songbook's Compose tab
  does assisted English→Liraasa.
- Learn's `concepts.ts` already turns all of this into concepts
  (`form:verb`, `slot:TENSE`, `rule:1.2:G24`…) with prerequisites. This is the
  Loom's rule map, already derived.

## 4. Forms & irregulars (the key finding)

- **Forms are stored**, all seven, on every headword, and `protected: true`
  makes the stored form canon. The generator reproduces **all 10,479 with zero
  mismatches** in 1.2.
- **Irregulars are stored in data, but only one**: `morphology.verb_rule.opi =
  "opioa"`. The rule alone would give `opia` (vowel-initial). The data says
  nothing about *why*.
- Things that are regular but go against intuition, and are worth teaching as
  "goes its own way" moments:
  - a compound's verb class follows its **modifier's** first letter
    (`amorganre` → `amorganrea`, vowel class, though the head begins with `g`);
  - concatenation is literal, so vowels double (`belda` + `asa` = `beldaasa`);
  - 29 **lexicalised derivations** have fixed, non-compositional glosses
    (ruling 1.0:G20). They live only in `morphology.lexicalised_derivations`, are
    **not headwords**, and their glosses are stored as prose strings
    (`"sword (big knife): tisebiti + -vu"`);
  - one **blocked** derivation: `mavo + -pago` (`mavopago` is the fixed word
    "society");
  - 4 compounds whose split was **inferred** (`INFERRED_COMPONENTS`).

### Forms Map

| Category                  | Applies to                                     | Rule (data source)                                                                        | Stored?                        | Irregular / exceptions                         |
| ------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| root                      | every headword                                 | `R`                                                                                       | yes                            | none                                           |
| ascended                  | headwords (172 meaningful)                     | `R+asa` (`seven_forms`)                                                                   | yes                            | none; makes the token *sacred* (text-level)    |
| negative                  | headwords (332)                                | `R+na`                                                                                    | yes                            | none                                           |
| verb                      | headwords (674)                                | `verb_rule`: n→`R+nia`, s→`R+sia`, vowel→`R+a`, else `R`+first consonant+`a`; whole-word first letter | yes             | **`opi` → `opioa`** (rule: `opia`); compounds follow the modifier |
| negative adjective        | headwords (217)                                | `R+nasan`                                                                                 | yes                            | none                                           |
| adjective                 | headwords (630)                                | `R+san`                                                                                   | yes                            | none                                           |
| ascended adjective        | headwords (144)                                | `R+asasan`                                                                                | yes                            | none; sacred                                   |
| diminutive `-ti`          | after a form or derivation                     | `suffix_order`, `suffixes["-ti"]`                                                         | no (productive)                | `monruti`, `soloti`… lexicalised (fixed gloss) |
| plural `-ri`              | always last                                    | `suffix_order`, `suffixes["-ri"]`                                                         | no                             | none                                           |
| agent `-yo`               | the root only; never with a form               | `suffixes["-yo"]`                                                                         | no                             | lexicalised: `lemuyo`, `juseyo`… (fixed gloss) |
| augmentative `-vu`        | the root only                                  | `suffixes["-vu"]`                                                                         | no                             | lexicalised: `tibivu`, `solovu`…               |
| place `-pago`             | the root only                                  | `suffixes["-pago"]`                                                                       | no                             | **blocked**: `mavo` + `-pago`; lexicalised: `lemupago`… |
| compound                  | MODIFIER+HEAD headwords                        | `compounding`; `components`                                                               | yes (as headwords)             | 4 inferred splits; 1 nested (`mudusomubiti`)   |
| motion prefix             | motion verbs + listed metaphors only           | `motion_prefixes.canon` (`va-` `du-` `taro-` `yave-` `revo-`), closed list                 | no                             | not productive; 4 retired prefixes             |
| number                    | 0–999                                          | `numbers.rules` + `lookup_0_999`                                                          | yes (lookup)                   | rules carry their own usage notes              |
| *clause particles*        | *not word forms*                               | `grammar.slots` (TENSE `po`/`futu`/`pressa`, `ne`, modals, aspect…)                         | function words                 | stacking exclusions (13 pairs)                 |

## 5. Shared infrastructure

- **Module pattern.** The working app is the **songbook editor**
  (`editor/index.html`, plain scripts, opens from `file://`, no framework).
  Its tabs (Check, Compose, Gloss, Sound, Lexicon, Grammar) are the
  translator/codex. Learn is a view swapped in by the `Learn` button. The
  React app in `src/ui/` is an empty shell.
- **"Root viewer" / root swaps.** These happen in Learn's Author → Roots tool
  (`src/core/change/respell.ts`). It records a `ChangeRecord`, replays it over
  the bundled lexicon at every load, fires `liraasa:lexicon-changed`, and
  `reconcile` moves progress by id. That is the mechanism the Hall should reuse.
- **Styling.** CSS custom properties in `editor/index.html` (`--paper`, `--ink`,
  `--accent`, `--gold`, `--lira` = EB Garamond…), light on `:root`, dark under
  `prefers-color-scheme` and `[data-theme]`. The fonts come from Google Fonts
  and fall back to local serifs offline.
- **Persistence.** IndexedDB `liraasa-learn`, schema-versioned
  (`PROGRESS_SCHEMA`, `migrateStore`; a newer schema is refused).
  Export/backup/restore already exist.
- **Spaced repetition.** FSRS-4.5 (default) and SM-2 behind one interface,
  tested (`scheduler.ts`).
- **Audio.** No recordings exist yet. Learn can attach a clip to an item id
  or sentence key (stored as a blob in IndexedDB), and listening exercises
  appear only when a clip exists. `Speech/` holds the phonetic recording
  script; `liraasa_voice_lab/` is a separate TTS experiment that is not wired in.
  There is no file manifest, and a `file://` page cannot list a folder.

## 6. Gaps & risks, with the fix I recommend

| # | Gap                                                                                                     | Recommended fix                                                                                                                                                                                                                                                                       |
| - | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Rules are TS constants, so a data change breaks the build instead of flowing through                     | The forms engine **parses `morphology.seven_forms`, `verb_rule` and `suffixes` from the loaded lexicon** (`"R+asa"` → suffix `asa`; a `verb_rule` key that is a word = an irregular). The TS config stays as the validated reference. **No schema change.**                          |
| 2 | Stored forms are canon, so a marker change means rewriting 1497 entries                                   | The engine **shows the stored form**, computes `regularWouldBe` from the data's rule, and sets `irregular` = they differ. The test simulates a real marker change (a rule edit plus a changeset that rewrites the forms) and proves every table re-derives. A rule edited *without* the forms is reported as a gap, never shown silently. |
| 3 | No "why" for the one irregular                                                                          | Add `formNotes` to `data/lessons/overrides.json`, keyed `"<id>\|<slot>"`, written by you. Until then the card shows only what is derivable: "the rule gives `opia`; the data records `opioa`." The lexicon is untouched.                                                       |
| 4 | No part of speech                                                                                       | "Applies" = the slot's gloss is meaningful. 785 headwords have only their root slot meaningful, so their table is one row. That is honest, not a bug.                                                                                                                                       |
| 5 | Spot the Irregular has almost nothing to spot                                                           | Reframe it as **"Spot the Pattern"**: verb class (n / s / vowel / consonant / compound-follows-modifier), plus `opi`, plus lexicalised derivations, whose meaning is not the sum of the parts.                                                                                  |
| 6 | No sentence generator, and no English generator                                                         | Loom exercises are built from **real sentences** (examples, ruling examples, corpus) and **checked mutations** of them: Weave, Unravel, Reverse, Mend and Choose (wrong options made by breaking one rule, confirmed wrong by the checker). Transform comes from slot particles (`po`/`futu`, `ne`, `ki`). In the Sandbox the **English line is assembled from glosses and labelled unverified**. There is no grader for free English→Liraasa beyond the checker plus "here is a version you can compare against". |
| 7 | The checker lives in `editor/checker/` (browser JS), not in the core                                    | The Loom calls it at runtime, as the songbook does. Porting it to TS is Phase 2 work and is not needed here.                                                                                                                                                                          |
| 8 | "Night observatory" against the convention of light on `:root`                                          | A question for you (below).                                                                                                                                                                                                                                                         |
| 9 | An audio manifest of local files                                                                        | Keep in-app recording (IndexedDB) and add `data/audio/manifest.json` (id → path) bundled by `build:learn`. Coverage comes from both. No TTS, ever.                                                                                                                                                  |
| 10 | The brief's "only words I've missed", "due words", "changed since" filters                              | All derivable from the existing `Profile`, cards and `diff.ts`. No new data needed.                                                                                                                                                                                                  |

## Questions for the author

1. **Build on Learn?** I recommend the Training Hall as new views over the
   existing `src/core/learn` core, with the current views kept behind a
   "classic" toggle until you approve. The alternative is a separate program
   that duplicates the scheduler, progress and reconcile code.
2. **Palette.** (a) The Hall is night-first: dark by default inside the Hall,
   with a light variant for the light theme. Or (b) it follows the songbook's
   theme, with the starlight treatment applied to both.
3. **Irregular notes.** Is `formNotes` in `overrides.json` the right home for
   your "why" notes, rather than a new field in the lexicon?
4. **Audio.** Do you want the file manifest (§9) as well as in-app recording,
   or is in-app recording enough?
