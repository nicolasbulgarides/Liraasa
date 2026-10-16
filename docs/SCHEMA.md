# Liraasa Workbench — Data formats

Status: **current as of the 1.1 integration** (2026-10-16), written against
`data/source/liraasa_1_0.json` (`built_utc` 2026-10-16T00:00:00Z).

This document describes the data the app reads and writes. Section 1 is the
**author's canonical schema** — observed, not designed, and reproduced exactly on
export. Sections 2 onwards are the app's own formats.

> Where this document and the JSON disagree, the JSON wins. Every count here was
> read off the file and is pinned by `tests/golden/sourceData.test.ts`.

---

## 1. The canonical lexicon (`liraasa_1_0.json`)

The single source of truth for vocabulary. 1.77 MB, 26 top-level keys, in this
order:

| #   | Key                          | Shape  | Count                              | Notes                                                                                       |
| --- | ---------------------------- | ------ | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | `language`                   | string | —                                  | `"Liraasa"`                                                                                 |
| 2   | `version`                    | string | —                                  | `"1.0"`                                                                                     |
| 3   | `built_utc`                  | string | —                                  | ISO 8601 build timestamp                                                                    |
| 4   | `source`                     | string | —                                  | Provenance sentence naming `build_1_0.py` / `decisions_1_0.py`                              |
| 5   | `snapshot_0_8`               | object | 7 keys                             | The 0.8-rc2 baseline: `source_file`, `source_version`, `source_sha256`, and the four counts |
| 6   | `phonology`                  | object | 8 keys                             | §1.3                                                                                        |
| 7   | `morphology`                 | object | 6 keys                             | §1.4 — this is the "rules block"                                                            |
| 8   | `motion_prefixes`            | object | `canon` (5), `retired` (4), `rule` | Closed list; not productive                                                                 |
| 9   | `settled_open_questions_0_8` | array  | 8                                  | `{q, answer}`; all eight 0.8 questions are closed                                           |
| 10  | `headwords`                  | array  | **1099**                           | §1.1                                                                                        |
| 11  | `function_words`             | array  | **149**                            | §1.5                                                                                        |
| 12  | `pronouns`                   | array  | 8                                  | `{form, person, number, possessive, reflexive}`                                             |
| 13  | `correlatives`               | array  | 36                                 | `{form, determiner, concept, gloss}`                                                        |
| 14  | `numbers`                    | object | 2 keys                             | `rules` (40 rows, §1.6) and `lookup_0_999` (1000 entries)                                   |
| 15  | `time_and_dates`             | array  | 43 rows, 40 distinct forms         | `{form, english}`; `eli-krono`, `toda-krono` and `nuna-krono` each appear twice             |
| 16  | `colors`                     | array  | 9                                  | §1.6 — spreadsheet column names                                                             |
| 17  | `discourse_particles`        | array  | 4                                  | `{form, function, positions, register, examples[]}`                                         |
| 18  | `grammar`                    | object | 6 keys                             | §1.7                                                                                        |
| 19  | `rulings_1_0`                | array  | 23                                 | `{id, topic, ruling}`; ids `G1`–`G23`                                                       |
| 20  | `rulings_0_8_carried`        | array  | 20                                 | `{id, topic, ruling}`; ids `R1`–`R12`, `G1`–`G8`                                            |
| 21  | `examples`                   | array  | **452**                            | §1.8                                                                                        |
| 22  | `rhyme_families`             | array  | 387                                | `{ending, members[], count}`; ending = last four letters                                    |
| 23  | `legacy`                     | object | 9 keys                             | §1.9                                                                                        |
| 24  | `sound_ledger`               | array  | 77                                 | `{spelling, state, replacement, reusable_from, why_reserved}`                               |
| 25  | `dispositions`               | object | 4 keys                             | §1.10                                                                                       |
| 26  | `changelog_1_0`              | array  | 139                                | `{stage, item, detail}`                                                                     |

### 1.1 Headwords

Fourteen possible keys, all snake_case. Thirteen appear on every entry;
`replaces` appears on 71.

```json
{
  "root": "amorpeli",
  "type": "Compound",
  "components": ["amor", "peli"],
  "forms": { "root": "amorpeli", "ascended": "amorpeliasa", "...": "..." },
  "glosses": { "root": "flirtation; playful courtship", "...": "..." },
  "register": "everyday",
  "domain": "Romance",
  "english_synonyms": ["flirtation", "affection"],
  "status_1_0": "NEW",
  "since": "1.0",
  "replaces": "nonte",
  "history_0_8": null,
  "notes": "Replaces retired primal root nonte. ...",
  "protected": true
}
```

| Field              | Type                         | Domain                                                                                                                                                                       |
| ------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`             | string                       | The headword spelling. Unique across all 1099 (check 1).                                                                                                                     |
| `type`             | string                       | `Primal` (386) or `Compound` (713). **No `Root` type exists.**                                                                                                               |
| `components`       | `[string, string]` \| `null` | `null` on all 386 primals; a 2-tuple on all 713 compounds.                                                                                                                   |
| `forms`            | object                       | The seven slots. §1.2.                                                                                                                                                       |
| `glosses`          | object                       | The same seven keys. `"— (unused)"` (em dash, U+2014) marks an unused slot. 4608 of 7693 slots.                                                                              |
| `register`         | string                       | `everyday` (652) or `poetic` (447). **No `sacred` value.**                                                                                                                   |
| `domain`           | string                       | 38 distinct values, e.g. `Romance`, `Flowers & Plants`, `Established concepts`. Free text.                                                                                   |
| `english_synonyms` | `string[]`                   | **An array on all 1099 entries.** Never a semicolon string.                                                                                                                  |
| `status_1_0`       | string                       | `CARRIED` (888), `NEW` (198), `REPLACED` (7), `REDEFINED` (3), `REWRITTEN` (2), `MERGED` (1).                                                                                |
| `since`            | string                       | `≤0.7` (812), `1.0` (207), `0.8` (80). Note the `≤` (U+2264).                                                                                                                |
| `replaces`         | string                       | Present on 71 entries: the 0.8 spelling this entry replaces.                                                                                                                 |
| `history_0_8`      | object \| `null`             | `{status, editorial_note}` on 901 entries; `null` on the 198 new in 1.0. `status` is the old four-value enum: `NEW` (726), `CHANGED` (147), `EXISTING` (25), `PROPOSAL` (3). |
| `notes`            | string                       | 1.0 editorial note. Empty string on 888 entries.                                                                                                                             |
| `protected`        | boolean                      | **`true` on all 1099.** Canon spellings are never regenerated by rule.                                                                                                       |

Fields that do **not** exist: `status`, `compound`, `modifier`, `head`,
`added_in`, `batch`, `authorized_changes`, `harshness`, `editorial_note`.
The last two are gone entirely; `editorial_note` survives inside `history_0_8`.

### 1.2 The seven forms

Slot keys, in canonical order:

```
root · ascended · negative · verb · negative_adjective · adjective · ascended_adjective
```

Built from the root by rule (`morphology.seven_forms`):

| Slot                 | Build      | Example (`dorva`) | Gloss       |
| -------------------- | ---------- | ----------------- | ----------- |
| `root`               | `R`        | dorva             | intention   |
| `ascended`           | `R+asa`    | dorvaasa          | divine will |
| `negative`           | `R+na`     | dorvana           | accident    |
| `verb`               | verb rule  | dorvada           | to intend   |
| `negative_adjective` | `R+nasan`  | dorvanasan        | accidental  |
| `adjective`          | `R+san`    | dorvasan          | deliberate  |
| `ascended_adjective` | `R+asasan` | dorvaasasan       | — (unused)  |

**Verb rule**, checked in this order:

1. `opi` → `opioa` (the single irregular — and `opi`, "Hope", **is a real Primal
   headword**, so this branch is live data, not a reserved case; the general
   vowel-initial rule would wrongly give `opia`)
2. first letter `n` → `R+nia`
3. first letter `s` → `R+sia`
4. first letter a vowel → `R+a`
5. otherwise → `R` + first consonant + `a`

Only the first letter of the **whole word** counts, so a compound takes its
modifier's verb class. Concatenation is literal: no elision, so `dorva+asa`
gives `dorvaasa` with a double `a`, and `amor+asa` gives `amorasa`.

**Verified:** all 1099 × 7 = 7693 forms regenerate from these rules with zero
mismatches, and all 7693 strings are distinct.

**Key-order caveat.** `forms` is stored in two different key orders: 1019
entries use the canonical order above; 80 entries (the 0.8 additions) put
`verb` second. `glosses` uses the canonical order on all 1099. A lossless
export must preserve each entry's own order — see ADR-0002.

### 1.3 `phonology`

| Key                                                       | Shape                                                                                                                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vowels`, `consonants_core`, `consonants_other`, `stress` | strings                                                                                                                                                                               |
| `new_root_template`                                       | string: two syllables, consonant-initial, vowel-final, no initial cluster (`kr-`/`tr-` grandfathered), no three-consonant cluster, no doubled letter, ≥2 edits from every active word |
| `function_word_template`                                  | string: 1–3 syllables, vowel-final, no initial cluster, ≥2 edits from every active word                                                                                               |
| `protected_exceptions`                                    | array of 5 strings (prose, not machine-readable): `amor`, `apok`, `opi→opioa`, `36 amor- double-a roots (legacy canon)`, `kr-, tr- initial clusters`                                  |
| `declared_distance_1_pairs`                               | array of 11 `[string, string]` pairs exempt from the proximity rule                                                                                                                   |

23 roots are consonant-final: `amor`, `apok`, and 21 compounds whose head is
`amor` or `apok`. (The `protected_exceptions` entry says "36 amor- double-a
roots"; only 20 roots begin with `amor` and only 6 root spellings contain
`aa`. Open question Q7.)

### 1.4 `morphology` — the rules block

| Key                       | Shape                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `seven_forms`             | `["R", "R+asa", "R+na", "VERB", "R+nasan", "R+san", "R+asasan"]`                                                                    |
| `verb_rule`               | object keyed `opi`, `n-initial`, `s-initial`, `vowel-initial`, `otherwise`                                                          |
| `suffix_order`            | `"ROOT + (one form OR one derivation) + -ti + -ri"`                                                                                 |
| `suffixes`                | object: `-ti` diminutive, `-ri` plural (always last), `-yo` agent, `-vu` augmentative, `-pago` place                                |
| `compounding`             | prose: MODIFIER+HEAD written together, head rightmost, components must be active 1.0 headwords, verb class follows the first letter |
| `lexicalised_derivations` | 5 fixed meanings: `tisebitivu` sword, `tibivu` rope, `kaldopago` prison, `zeldoyo` rebel, `kronopago` anniversary                   |

`mavo + pago` is blocked; `mavopago` is the fixed word "society".

A derivation and a form never combine (settled question 4): a word takes one
form **or** one derivation, then `-ti`, then `-ri`.

This block is mirrored as typed config in `src/core/config/`, with a test
asserting the two agree (SPEC §3).

### 1.5 `function_words`

```json
{
  "form": "tu",
  "meaning": "also; too (additive focus)",
  "position": "before its constituent",
  "example": "Tu Kipo po bumreba.",
  "example_gloss": "Kipo baked too.",
  "class": "scope",
  "status_1_0": "NEW",
  "since": "1.0"
}
```

Eight keys always present; `notes` on 33 and `examples` (array) on 27.
`class` is `null` on 122 entries and one of 14 slot names on the 27 new in 1.0.
`status_1_0`: `CARRIED` 117, `REDEFINED` 5, `NEW` 27. Two forms are
multi-word (`ki-nela de`, `lorejuba ala taivo`) and must not be treated as
single tokens.

### 1.6 Sections that still use spreadsheet column names

Only two. Everywhere else the 1.0 build normalised the keys.

**`colors`** (9 rows): `Family`, `Base color`, `Dark + narvo`, `Life + bio`,
`Gem + juba`, `Light + lumi`, `Example meanings / notes`.

Colour words are **their own closed class**: none of the 45 spellings (9 bases plus 4
modifiers each) is a headword. Every modified form is a plain concatenation of base +
modifier, verified against all 36. `shada` carries the `sh` digraph, which
`phonology.consonants_other` permits only in colour and number words — the other case
being `ocha`, eight.

**`numbers.rules`** (40 rows): `Group`, `Value`, `Liraasa`,
`Construction rule`, `English interpretation`, `Usage / comment`. `Group` has
14 values: `Digit` (10), `Decade` (9), `Hundreds` (9), `Scale` (2), and one row
each for `Order`, `Hyphen`, `Omit zero groups`, `Teen forms`, `Mixed tens`,
`Mixed hundreds`, `Thousands`, `Millions`, `Count noun`, `Non-integers`.
`numbers.lookup_0_999` is a 1000-entry object keyed by the decimal string
(`"999"` → `"nivacenta-nivazira-niva"`), usable directly as a generator oracle.

`legacy.editorial_notes_0_7` (76 rows) also keeps workbook column names:
`Type`, `Topic`, `Original / issue`, `Resolution`, `Why`,
`Decision / caveat`, `Version`.

**Not present anywhere:** `schema_note`, `Stormsong`/`Dreamsong` key names
(the string "Stormsong" survives only inside `legacy.data_fixes_0_8` prose),
`rhyme_pairs`, `root_review_proposals`, `grammar_examples_0_8`,
`grammar_rulings_0_8`, `carry_forward_open_items`, `validation_0_7_workbook`,
`rhyme_families_0_7`, `rules`.

### 1.7 `grammar`

| Key               | Shape                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `clause_template` | The 20-slot string, §1.7.1                                                                          |
| `slots`           | 20 × `{n, slot, words[], notes}`                                                                    |
| `scope_operators` | `{words: [ne, doli, tu, yesta, pendi, vinto], rule}`                                                |
| `stacking`        | `{one_per_slot: true, exclusions: [[a,b]×13], max_preverbal_operators_recommended: 4, scope}`       |
| `valency`         | `{vaku, lesvu, tekvu, pattern}`                                                                     |
| `noun_phrase`     | `"[QUANTIFIER] [li\|eli\|ola\|OWNER de] [NUMBER] [ADJECTIVES] NOUN[-ti][-ri] [de …] [raho CLAUSE]"` |

#### 1.7.1 The clause template

```
[FRAME] [TOPIC hozi] SUBJECT [TENSE] [noma] [ne] [MODAL] [APPROACH] [PHASE]
[EFFORT] [ASPECT] [ITERATION] [EVIDENTIAL] VERB [OBJECT] [ADJUNCTS] [fuyi]
[hoyo|yasmo] [ATTITUDE] [ki]
```

| #   | Slot       | Words                                                                               |
| --- | ---------- | ----------------------------------------------------------------------------------- |
| 1   | FRAME      | time words, correlatives of time, `zafra`, `finra`, `lanto`, `kenvi`                |
| 2   | TOPIC      | NP + `hozi`                                                                         |
| 3   | SUBJECT    | noun phrase, pronoun                                                                |
| 4   | TENSE      | `po`, `futu`, `pressa`                                                              |
| 5   | REALITY    | `noma`                                                                              |
| 6   | NEGATION   | `ne` (floats: may also precede any later operator or the verb)                      |
| 7   | MODAL      | `povi`, `nosi`, `dagi`, `musi`, `suvi`, `viki`, `kopi`                              |
| 8   | APPROACH   | `tavki`, `fututi`                                                                   |
| 9   | PHASE      | `hiro`, `teki`                                                                      |
| 10  | EFFORT     | `telvo`, `vazdi`, `fesmo`                                                           |
| 11  | ASPECT     | `roni`, `tefa`, `sahi`                                                              |
| 12  | ITERATION  | `bodu`, `reve`, `loki`                                                              |
| 13  | EVIDENTIAL | `yehu`, `gesu`, `bisu`, `vuda`, `buyu`, `tosu`                                      |
| 14  | VERB       | any verb form; copulas `ke ka kapoki loya miyo`; valency `vaku lesvu tekvu`; `gome` |
| 15  | OBJECT     | noun phrase                                                                         |
| 16  | ADJUNCTS   | prepositional phrases, `la` + adjective, `vobi`/`sabri`/`korsi` NP                  |
| 17  | RECIPROCAL | `fuyi`                                                                              |
| 18  | STATUS     | `hoyo`, `yasmo`                                                                     |
| 19  | ATTITUDE   | `seye`, `mufe`, `poye`, `pifu`, `zoke`                                              |
| 20  | QUESTION   | `ki`                                                                                |

This replaces the 0.8 template quoted in SPEC §5.4, which had 10 positions and
no FRAME, TOPIC, REALITY, APPROACH, PHASE, EFFORT or STATUS slots.

### 1.8 `examples`

452 entries of `{liraasa, english, feature, status, source}` plus `changes`
(array) on 412.

- `status`: `CARRIED` 394, `NEW` 36, `MIGRATED` 14, `HISTORICAL` 5, `FORMULA` 3.
- `source`: `0.8 examples` 223, `0.8 grammar examples` 193, `1.0 particle examples` 36.
- **447 live examples** (all but the 5 `HISTORICAL`) — the number the validator
  reports. `HISTORICAL` is skipped by checks 14, 15 and 21; for `FORMULA`
  entries the validator takes the text after the last `=`.

### 1.9 `legacy`

The version-gating record (ruling G19: text dated before 1.0 is read with the
0.8 lexicon).

| Key                   | Shape                                                                                                                | Count                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `policy`              | string                                                                                                               | —                                                     |
| `retired_roots`       | `{old, replacement, components, old_forms, old_glosses, new_forms, new_glosses, slot_fate, reason, tier?, reserved}` | 63                                                    |
| `respelled_roots`     | `{old, new, old_forms, glosses, reason, reserved}`                                                                   | 7                                                     |
| `retired_compounds`   | `{old, disposition, new?, old_glosses, note, phrase?}`                                                               | 7 (2 `REWRITE`, 5 archived with a replacement phrase) |
| `archived_senses`     | `{word, 0_8_gloss, historical_sense, note}`                                                                          | 4                                                     |
| `migration_forms`     | map: old spelling → `{to, slot, via, kind}`                                                                          | **509**                                               |
| `editorial_notes_0_7` | workbook rows                                                                                                        | 76                                                    |
| `data_fixes_0_8`      | `{sheet, row, field, from, to, reason}`                                                                              | 6                                                     |
| `rulings_0_8`         | identical to top-level `rulings_0_8_carried`                                                                         | 20                                                    |

**`migration_forms.kind` has five values**, not two:

| `kind`            | Meaning                                           | `to` is                 |
| ----------------- | ------------------------------------------------- | ----------------------- |
| `retired`         | the root left the lexicon; a compound replaced it | a single form           |
| `respelled`       | same meaning, new spelling                        | a single form           |
| `merged`          | absorbed into an existing entry                   | a single form           |
| `rewritten`       | the compound was rebuilt on new components        | a single form           |
| `archived-phrase` | **the compound has no replacement word**          | a **multi-word phrase** |

The last breaks the one-spelling-to-one-form assumption. Five compounds resolve this
way and cannot be looked up in a form index:

| From        | To (a phrase)        |
| ----------- | -------------------- |
| `lilturuhe` | `ruhe ko navufaru`   |
| `liltunavu` | `navu de navufaru`   |
| `vugifasbi` | `vulraramusan fasbi` |
| `vugisenru` | `vulraramusan senru` |
| `relpalomo` | `mubomomvisan lomo`  |

`resolveSpelling` returns these as `{ refs: [], phrase }` so a reader renders the
phrase instead of resolving an entry. 497 spellings are reserved (check 13); retired
roots may be reused from 2.0, respelled ones never.

### 1.10 `dispositions`

Every editorial candidate with its final decision. No open items.

| Key                     | Count | `disposition` values                                                                 |
| ----------------------- | ----- | ------------------------------------------------------------------------------------ |
| `retirement_candidates` | 182   | `KEEP` 115, `RETIRE` 62, `REPLACE` 4, `MERGE` 1                                      |
| `storytelling`          | 150   | `ADD` 107, `KEEP` 15, `REPLACE` 11, `REJECT` 9, `MERGE` 5, `REDEFINE` 2, `ARCHIVE` 1 |
| `root_review`           | 40    | `KEEP` 23, `RETIRED` 10, `REPLACE` 7                                                 |
| `unresolved_compounds`  | 3     | `REDEFINE` 3                                                                         |

Note `RETIRE` (retirement audit) vs `RETIRED` (root review) — two spellings of
the same decision in two sections. The importer normalises; the exporter
restores each section's own spelling.

### 1.11 Cross-section spelling overlaps

32 spellings appear in more than one namespace. These are **not** collisions;
they are the same lexeme listed in two places, and the validator exempts them.
A spelling therefore resolves to a _set_ of candidates, never one.

| Kind                             | Count | Examples                                                                                   |
| -------------------------------- | ----- | ------------------------------------------------------------------------------------------ |
| Headword root also a time word   | 6     | `lornu`, `mambi`, `merno`, `nullo`, `vesno`, and `maivo` (pronoun)                         |
| Function word also a time word   | 9     | `po`, `pressa`, `futu`, `kroti`, `krotiapo`, `futupago`, `fututi`, `deyapressa`, `deyaapo` |
| Function word also a correlative | 5     | `ki-coda`, `ki-pago`, `ki-krono`, `ki-kasa`, `ki-modo` (`ki-krono` is all three)           |
| Other                            | 12    | remaining time/correlative overlaps                                                        |

`maivo` (pronoun) = `maivo` (root, "Self, I") is the one overlap the validator
names explicitly.

---

## 1.12 What edition 1.1 adds

1.1 is a **vocabulary-only** supplement (ADR-0009). Every section listed in §1
is byte-identical to 1.0 except `version`, `built_utc`, `source`, `headwords`
and `examples`.

| Measure            | 1.0  | 1.1                      |
| ------------------ | ---- | ------------------------ |
| Headwords          | 1099 | **1418**                 |
| Primal roots       | 386  | **407**                  |
| Compounds          | 713  | **1011**                 |
| Form strings       | 7693 | **9926** (all distinct)  |
| Unused gloss slots | 4608 | **6460**                 |
| Examples           | 452  | **586** (447 + 134 live) |
| Function words     | 149  | 149, unchanged           |

A 1.1 headword has the same 13 keys as a 1.0 one, **plus `status_1_1`**:

```json
{
  "root": "lazu",
  "type": "Primal",
  "components": null,
  "forms": { "root": "lazu", "verb": "lazula", "...": "..." },
  "glosses": { "root": "animal; living member of the animal kingdom", "...": "..." },
  "register": "everyday",
  "domain": "Ecology & biology",
  "english_synonyms": ["animal", "living member of the animal kingdom", "zoological"],
  "status_1_0": "NEW",
  "status_1_1": "NEW",
  "since": "1.1",
  "history_0_8": null,
  "notes": "Added in 1.1 (vocabulary-only supplement). Scope: ...",
  "protected": true
}
```

**Both status fields are present on purpose.** `status_1_0: "NEW"` is what the
author's unmodified `validate.py` requires (check 9) and what makes checks 5
and 18 actually test the new roots instead of skipping them; `status_1_1` is
the edition record. `since: "1.1"` is the unambiguous discriminator — read it,
not the status fields, to tell a 1.1 addition from a 1.0 one. Reasoning in
ADR-0009 §4.

Two structural facts change with 1.1:

- **Nesting is common now.** 1.0 had one compound built on another
  (`mudusomubiti`); 1.1 has 38, and `farvisimvodivmabiti` is the first whose
  _both_ components are compounds.
- **Four more spellings carry two analyses.** `zavmepago`, `nazrupago`,
  `lazupago` and `tilnupago` are compounds whose head is the root `pago`, so
  each also reads as `X + -pago`. 1.0 already does this with `larbopago`,
  `mavopago` and `sasvapago`, and check 3 excuses it when the declared
  components are exactly `[base, "pago"]`.

### 1.12.1 Files

| File                                              | What it is                                             |
| ------------------------------------------------- | ------------------------------------------------------ |
| `data/lexicon/liraasa_1_1.json`                   | the 1.1 lexicon                                        |
| `data/lexicon/validation_1_1.json`                | 25 checks, all PASS, with `executed_against` per check |
| `data/lexicon/integration_report_1_1.json`        | every added entry, every narrowing, checksums          |
| `data/lexicon/compare_1_0_to_1_1.json`            | machine-readable 1.0 → 1.1 comparison with checksums   |
| `1.1 upgrade/Liraasa_1_1_Vocabulary_Changelog.md` | the human-readable changelog                           |
| `1.1 upgrade/Liraasa_1_1_LLM_Quickstart.md`       | vocabulary addendum to the unchanged 1.0 grammar       |

---

## 2. Additive fields the app may write

The working lexicon stays in the author's schema so the author's Python tools
keep working. The app adds **only** these, and `docs/SCHEMA.md` is the record
(SPEC §6.1):

| Field     | Where                                                                                      | Shape                                | Why                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `id`      | every headword, function word, pronoun, correlative, time word, colour, discourse particle | `string`                             | Stable identity across respellings. Assigned once on first import, never changed. This is what makes root swaps safe. |
| `retired` | headwords                                                                                  | `{in_edition, replaced_by?, reason}` | Retired entries stay in the data so old texts resolve.                                                                |

`protected` is **not** an additive field: the author already ships it as
`true` on every headword. Examples get no id: they have no identity apart from their
text.

### 2.0 Where the id lives

`idStorageFor(edition)` decides (ADR-0008):

| Edition               | Storage   | Consequence                                                                                                                                                                                          |
| --------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0.8`, `1.0`          | `sidecar` | `data/lexicon/ids.json` only. The canonical file is written **byte-identically** to the source — verified against the bytes on disk, trailing newline included: there is none, matching `json.dump`. |
| `1.1-draft` and later | `inline`  | each entry carries `"id"`. Stripping the ids from the export gives back the source exactly.                                                                                                          |

An inline id always wins over the sidecar. 1348 ids were minted on first import: 1099
headwords, 149 function words, 43 time words, 36 correlatives, 9 colours, 8 pronouns,
4 discourse particles.

### 2.1 Id format

`lx_<slug>_<nnnn>` where `<slug>` is the spelling at first import and `<nnnn>`
a zero-padded sequence in first-import order — e.g. `lx_amorpeli_0042`. The
slug is a human-readable convenience only; **the id is opaque** and never
re-derived from the spelling. Namespace prefixes: `lx_` headword, `fw_`
function word, `pn_` pronoun, `cr_` correlative, `tw_` time word,
`cl_` colour, `dp_` discourse particle.

An id map is also written to `data/lexicon/ids.json` so ids survive even if a
caller strips additive fields.

### 2.2 Round-trip guarantee

Import → export → import → deep-equal, and the export differs from the
source **only** by the additive fields. This requires preserving:
per-entry `forms` key order (two variants), the `≤` in `since`, the em dash in
`"— (unused)"`, every unknown field, and the 26-key top-level order.
See ADR-0002.

---

## 3. Token documents (`data/texts/*.json`)

Per SPEC §6.4, unchanged except that `register` takes the values the data
actually uses. A text's `register` is a document-level label
(`everyday` | `poetic` | `sacred`), which is **not** the same vocabulary as a
headword's entry-level `register` (`everyday` | `poetic`) — see open question
Q6.

```json
{
  "id": "text_ruli_nosvo",
  "title": "Ruli Nosvo",
  "kind": "song",
  "register": "sacred",
  "edition_written": "1.0",
  "sections": [
    {
      "label": "Verse 1",
      "lines": [
        {
          "tokens": [
            { "t": "lex", "entry": "lx_lira_0311", "slot": "verb", "sfx": [], "cap": true },
            { "t": "fn", "entry": "fw_po_0004" },
            { "t": "name", "value": "Melodia" },
            { "t": "punct", "value": "," }
          ],
          "en": "English translation of the line",
          "surface_snapshot": "Lirala po Melodia,"
        }
      ]
    }
  ]
}
```

Token types: `lex`, `fn`, `pron`, `particle`, `correlative`, `number`
(stores the value, renders through the generator), `time`, `color`, `name`,
`punct`, `break`, `unknown` (raw text, always flagged).

`edition_written` drives G19 version gating: a text written before 1.0 is
rendered and validated under the 0.8 lexicon.

---

## 4. Changesets (`data/changes/*.json`)

SPEC §6.5 says to reuse the `authorized_changes` shape. **That field no longer
exists in the data** (ADR-0001, finding 11), so the shape is taken from
ruling R2, which still references it, and extended as SPEC §6.5 directs:

```json
{
  "id": "cs_20261016_0001",
  "edition": "1.1-draft",
  "created": "2026-10-16T18:22:00Z",
  "author": "nicolas",
  "summary": "Retire kronobelda in favour of a phrase",
  "ops": [
    {
      "entry": "lx_kronobelda_0588",
      "op": "retire_root",
      "slot": "root",
      "from": "kronobelda",
      "to": null,
      "ruling": "1.0:G19",
      "added_in": "1.1-draft",
      "reason": "Author decision, 2026-10-16"
    }
  ]
}
```

`op` values: `add_root`, `add_compound`, `edit_gloss`, `edit_metadata`,
`respell_root`, `retire_root`, `retire_and_replace`, `activate_slot`,
`merge_entries`, `split_entry`.

**`ruling` references are edition-qualified** (`"1.0:G1"`, `"0.8:G1"`) because
`G1`–`G8` mean different things in `rulings_1_0` and `rulings_0_8_carried`.
See ADR-0004.

---

## 5. Editions (`data/changes/editions.json`)

```json
{
  "editions": [
    {
      "id": "1.0",
      "status": "released",
      "released": "2026-10-16",
      "lexicon": "liraasa_1_0.json",
      "policies": []
    },
    {
      "id": "1.1-draft",
      "status": "working",
      "baseline": "1.0",
      "policies": [{ "id": "reserved_until_2_0", "rule": "...", "overridable": true }]
    }
  ]
}
```

Released editions are read-only snapshots. Baseline comparison (checks 12 and 13) runs against the previous released edition — for 1.1 that is 1.0, whose
`snapshot_0_8` records its own baseline hash.

The 0.8 policy "R3 freezes the Root Review queue" quoted in SPEC §6.6 is
**spent**: the queue closed in 1.0. Policies are data, so this costs nothing.

---

## 6. Lessons (`data/lessons/*.json`)

Per SPEC §9. Entries are referenced by `id`, never by spelling, so a
respelling updates every lesson automatically.

---

## 7. Validation output

`npm run validate` emits the shape of `data/source/validation_1_0.json`:

```json
{
  "summary": {
    "lexicon": "liraasa_1_0.json",
    "version": "1.0",
    "counts": {
      "headwords": 1099,
      "primal_roots": 386,
      "compounds": 713,
      "forms": 7693,
      "unused_forms": 4608,
      "function_words": 149,
      "new_function_words_1_0": 27
    },
    "status_counts": { "PASS": 24 }
  },
  "checks": [
    {
      "id": 1,
      "check": "...",
      "status": "PASS",
      "count": 0,
      "details": [],
      "details_total": 0,
      "note": ""
    }
  ]
}
```

`details` is capped at 60 entries; `details_total` is the true count.
Statuses are `PASS`, `WARN` (editorial attention, not an error) and `FAIL`.
Checks 16 and 17 are `WARN`-on-finding; the rest are `FAIL`-on-finding.

Parity target: **24 checks, all PASS**, byte-comparable to
`validation_1_0.json` on the 1.0 lexicon. Checks 12 and 23 need the 0.8
baseline, which is missing (ADR-0001, finding 16), so check 12 currently
cannot run.
