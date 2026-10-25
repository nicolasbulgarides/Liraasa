# ADR-0025 — Liraasa 3.5: everything up to 3.4 ratified; Essentials, archetypes and domain packs (proposed)

- **Status:** accepted as a build. **Everything up to 3.4 is canon.** Every 3.5 entry is proposed, with its tier and module, until the author ratifies it.
- **Date:** 2026-10-25
- **Phase:** 3.5

## Context

On 2026-10-25 the author said "ratify everything". That covers 3.0, 3.3 and 3.4, which were proposed; 3.1 was already ratified (ADR-0023). It also settles the two questions still open:

- the hymn's Liraasa title, `Li lira de li una-ne veluri`;
- time nouns as compound modifiers (`deyanole`).

The author supplied a 2.5 → 3.5 bundle, archived whole in `archive/patch_3_5/` with its `SHA256SUMS`, all of which verify. Its 3.0–3.4 patches are byte-identical to the installed ones.

The 3.5 patch is **modular**:

- `core`;
- `archetypes`, `qualities`, `casual` and `derived-aliases`;
- six optional domain packs: `pack.tech`, `.sport`, `.civic`, `.business`, `.health` and `.science`.

## Decision

### 1. 3.5 is built from frozen 3.4 by two changesets

`scripts/make_changeset_3_5.ts` writes both changesets:

1. **The ratification** (`…-3-5-ratify`).
   - A new op, `ratify_ruling`, marks each of the 21 proposed rulings (3.0:G129–G141, 3.2:G142–G147, 3.3:G148, 3.4:G149) `status: ratified`, with `ratified_in: 3.5`. A ruling's text and examples never change.
   - The 388 3.0, 3.3 and 3.4 headwords' notes say they are ratified (`edit_metadata`, `notes`).
   - The guide's recipes from those editions lose their "awaiting author review" status.
   - The 2.5 erratum every bundle README names is corrected with the rest (`edit_example`): _Eli bumre ka sambasan ko pilo de bumre_ now reads _… ko li bumre de pilo_ (2.5:G95).
2. **The 3.5 patch, every module** (`…-3-5`). This is the bundle's default and the author's own build. It adds no roots: 164 compounds, 20 derivations, 11 diminutives, 2 restored forms, 150 aliases, and rulings 3.5:G150 (polygons) and G151 (copied names). Each entry notes its tier and module.
   - `lumirinba`, already an attested image compound, is lexicalised as in 3.0.
   - A form that gets aliases from two modules (`mellisan`) has them joined in order, as the author's merge joins them.

The build gives 2094 headwords and 4951 meaningful forms. `npm run validate:3.5` gives 22 PASS and 3 WARN. The proposed editions are now 3.5 only (`scripts/proposed_editions.ts`).

### 2. A time noun may be a compound's head

`felradeya` (holiday) = `felra` + `deya`. 3.2:G142 licenses a time noun as a modifier. The author's validator accepts "a headword, a colour base or a time noun" for every part. The editor followed that:

- `WordBuilding.timeHeads` is on from 3.5;
- the build audit, validator check 7 and Learn accept a time noun as the head.

### 3. The checker reads 3.5

`data/checker/rules_3_0.json` gains two parameters:

- **polygon** (G150): NUMERAL-`gaki` is a polygon, and its `-san` is the shape (`cuara-gakisan`, square);
- **copied_words** (G151): `pitsa` and `hamburga`, the ruling's own examples, are copied nouns, and each takes `-san`.

### 4. Five 3.5 sentences, settled as for 3.3

| 3.5 patch                                             | Now                                       | Why                                                       |
| ----------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| `Saivo vaku li tise pidisan.` (recipe "sharpen")      | `Saivo vaku li tise loya pidisan.`        | `vaku` ACTOR is followed by the actor's verb (2.5:G109)   |
| `Mufe saivo po pagopa.` (recipe "presumably")         | `Saivo po pagopa mufe.`                   | an attitude word closes its clause (1.0:G22)              |
| `Sina, maivori futu pagopa.` (recipe "otherwise")     | `Sina taivo lirala, maivori futu pagopa.` | `sina` is "unless", and opens a clause                    |
| `… po zarkuhata li regnacilni …` (test sentence)      | `… po zarkuhataza …`                      | the noun stood in the verb slot; the patch lists the verb |
| `Li cibuti po vizuduvla li sevubudi.` (test sentence) | `… po vizuduvlava …`                      | likewise                                                  |

`tests/grammar/patch_3_5.test.ts` checks each pair: the original is rejected and the replacement reads clean. All the other examples, recipes and test sentences also read clean, and so does the hymn.

### 5. Every tool reads 3.5

The following read 3.5:

- the LLM reference, the handoff JSON, the Reference Grammar, the Invitation and the Lessons;
- Learn, whose "What changed" lesson now covers 3.4 → 3.5;
- the editor bundles, the strict checker and the translator;
- the MFA export and the publish hook.

## Consequences

- Canon is everything up to 3.4; 3.5 is proposed.
- 3.4 is frozen as 3.5's baseline.
