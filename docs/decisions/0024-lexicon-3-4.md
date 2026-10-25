# ADR-0024 — Liraasa 3.4: Abstraction and the human condition (proposed), and the four 3.3 sentences

- **Status:** accepted as a build; every 3.4 entry is **proposed**, with its tier, until the author ratifies it
- **Date:** 2026-10-25
- **Phase:** 3.4

## Context

The author supplied a 2.5 → 3.4 integration bundle, archived whole in `archive/patch_3_4/` with its `SHA256SUMS`, all of which verify. It contains:

- copies of the 3.0, 3.1 and 3.3 patches, byte-identical to the ones already installed;
- the 3.4 patch;
- the author's merge and validator scripts;
- the author's own 3.4 build.

The 3.4 patch adds:

- no roots;
- 94 compounds, 18 derivations, 3 diminutives and 1 restored form;
- 50 English aliases;
- ruling 3.4:G149, quality nouns and their adjectives;
- 6 recipes and 5 test sentences.

The author also asked the editor to settle by best judgement the four 3.3 sentences that broke an earlier ruling (`review/questions_3_3.md`).

## Decision

### 1. 3.4 is built from frozen 3.3 by two changesets

`scripts/make_changeset_3_4.ts` writes both changesets, using 3.0's `makeAdditionsChangeset`:

1. **The 3.4 patch** (`…-3-4`). One compound, `miruvaye`, was already a 3.3 attested image compound. It is lexicalised as in 3.0: it keeps its id, takes the patch's meaning ("evaporation"), and its old reading ("water-clear wind") is archived.
2. **The editor's decisions** (`…-3-4-decisions`). One `archive_text` op replaces 3.2:G147's example `Peta da Amerika` with `li lira de Amerika` and keeps the old example whole. The ruling's text is unchanged.

The build gives 1930 headwords and 4747 meaningful forms. `npm run validate:3.4` gives 22 PASS and 3 WARN, and the author's `validate_patch.py` prints PASS.

The new warning is check 16, a duplicate gloss: `navulalfo` (new) and `zefrolalfo` are both "levitation".

### 2. The four 3.3 sentences

| 3.3 patch                                                     | Now                                               | Why                                                                                                                                                                        |
| ------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Peta da Amerika` (3.2:G147 example)                          | `li lira de Amerika` (a song from America)        | the ruling's own text: "de + the name means from the place"; a noun phrase takes de, not a prepositional phrase (2.5:G98). For a person, `Peta ka da Amerika.` reads clean |
| `Saivo milobema la menu.` (recipe "slightly")                 | `Saivo ke menu lavisan.` (She is slightly happy.) | `la` takes an adjective (2.5:G105); "slightly" is `menu` before an adjective                                                                                               |
| `Nayo ola, li linu ke somusia.` (recipe "meanwhile · asleep") | `Ola-krono, li linu somusia.`                     | `nayo` opens a clause; `ke` takes no verb (2.5:G93); "meanwhile" is the correlative `ola-krono`                                                                            |
| `… nayo li dapakadu po kadurivla.` (test sentence)            | `… nayo li dapakadu po ke en li kadurivla.`       | `kadurivla` is a noun only: "in traffic" is a place predicate                                                                                                              |

`tests/grammar/patch_3_3.test.ts` checks each pair: the original is still rejected and the replacement reads clean. Both recipes are in the guide in their new form.

### 3. Every tool reads 3.4

The following read 3.4:

- the LLM reference, the handoff JSON, the Reference Grammar, the Invitation and the Lessons;
- Learn, whose "What changed" lesson now covers 3.3 → 3.4;
- the editor bundle, the strict checker and the translator;
- the MFA export and the publish hook.

The proposed editions are 3.0, 3.3 and 3.4 (`scripts/proposed_editions.ts`).

The guide's word check also applies 3.3:G148: a compound's `-san` is a word by rule, so a 3.4 recipe's `loterokezusan` is not reported as an unused slot.

`tests/grammar/patch_3_4.test.ts` holds G149's examples, the recipes and the test sentences to the checker. All of them read clean, and so does the hymn.

## Consequences

- The generated LLM reference matches the author's 3.4 build except for G147's second example, which is the editor's decision above.
- 3.3 is frozen as 3.4's baseline.
