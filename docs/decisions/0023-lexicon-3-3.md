# ADR-0023 — Liraasa 3.3: the ratification of 3.1, and Archetypes and the top 2,000 (proposed)

- **Status:** accepted as a build; every 3.3 entry is **proposed**, with its tier, until the author ratifies it (`review/questions_3_3.md`). 3.1 is ratified.
- **Date:** 2026-10-25
- **Phase:** 3.3

## Context

The author made four decisions on 3.1 (2026-10-25):

- ratify all of it, both tiers;
- ignore similar sounds and spellings;
- keep the hymn's line 12 as it reads;
- line 15 means "heat", not "heart".

The author also supplied a 3.3 integration bundle, archived whole in `archive/patch_3_3/` with its `SHA256SUMS`, all of which verify. It contains:

- copies of the 3.0 and 3.1 patches, byte-identical to the ones already installed;
- a combined 3.2 + 3.3 patch;
- the author's merge and validator scripts;
- the author's own 2.5 → 3.3 build, `build/liraasa_3_3_llm.json`, to compare against.

  3.3 brings:

- archetype roots and compounds (gudo, zile, pocu, kadu …);
- rulings 3.2:G142–G147 and 3.3:G148;
- the function word `eho`;
- 74 English aliases for existing words;
- 12 recipes and 14 test sentences.

## Decision

### 1. 3.3 is built from frozen 3.1 by two changesets

`scripts/make_changeset_3_3.ts` writes both changesets:

1. **The ratification** (`…-3-3-ratify-3-1`). Each of the 74 3.1 headwords' notes now says "Ratified by the author on 2026-10-25" instead of "Proposed in 3.1". This uses `edit_metadata`, which can now edit `notes`. Nothing else about the entries changes. The LLM reference no longer flags 3.1 words: the proposed editions are now 3.0 and 3.3 (`scripts/proposed_editions.ts`), and the 3.1 recipes lose their "awaiting author review" status.
2. **The 3.3 patch** (`…-3-3`), built by 3.0's `makeAdditionsChangeset`. 3.0 and 3.1 still regenerate byte-for-byte from it. The generator gained three things:
   - **Function-word class:** a function word's class comes from the config (`iya` vocative, `eho` none).
   - **Archetype notes:** each entry's archetype role is written into its notes.
   - **English aliases:** the 74 aliases each become one `edit_value` op on a new `english_aliases` table (form → English). The build halts if an alias names a form that does not exist.

3.2:G142 lets a time noun be a compound's modifier (`deyanole`, date = `deya` + `nole`). `WordBuilding` gains `timeModifiers`, and only 3.3's build turns it on.

The 3.3 build gives 1836 headwords and 4614 meaningful forms. `npm run validate:3.3` gives 22 PASS and 3 WARN:

- check 7 is re-run under 3.2:G142;
- the author's `validate_patch.py` prints PASS.

The generated LLM reference matches the author's own 3.3 build on every dictionary line, derivation, diminutive, alias, function word and ruling (169).

### 2. The checker reads 3.2 and 3.3

`data/checker/rules_3_0.json` gains three parameters:

- **honorific** (3.2:G145): `zilenela`, or a person noun such as `pilo`, directly before a name is one noun phrase;
- **nationality** (3.2:G147): a capitalised copied name + `-san` is an adjective of origin (`Fransasan lira`);
- **relational_adjectives** (3.3:G148): the `-san` of a compound or listed derivation is an adjective by rule. A root's unlisted `-san` stays an unused slot.

`eho` is an interjection in the flags. Two older gaps are closed:

- `ne` + a bare adjective contrasts a predicate (`…, ne gudosan`);
- a failed trial read of `ne` + subject no longer leaves a stray finding behind.

`tests/grammar/patch_3_3.test.ts` holds every 3.2 and 3.3 ruling example, recipe, test sentence and the `eho` example to the checker. Example word lists are read word by word.

Four sentences break an earlier ruling, so they are the author's to decide (`review/questions_3_3.md`). The test lists them by name and fails if one starts to read clean, so the list cannot go stale. The two failing recipes stay out of the guide; the other ten are in it.

The translator takes the English aliases as extra names for each word's headword.

### 3. Every tool reads 3.3

- **Learn:** its "What changed" lesson now covers 3.1 → 3.3, and a time-noun modifier links to its time-word entry.
- **Everything else:** the editor, the strict checker, the translator, the LLM reference (with `english_aliases`), the handoff JSON, the Reference Grammar, the Invitation, the Lessons, the MFA export and the publish hook.

The hymn records the author's decisions on lines 12 and 15, and reads clean under 3.3.

## Consequences

- 3.1 is canon. 3.0 and 3.3 remain proposed.
- 3.1 is frozen as 3.3's baseline. There is no 3.2 edition: 3.3 supersedes the 3.2 draft. Its rulings keep their 3.2 ids, as `rulings_3_2`.
