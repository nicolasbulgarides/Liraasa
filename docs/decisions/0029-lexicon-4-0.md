# ADR-0029: Liraasa 4.0, what translating _2100 Dreams_ needed (proposed)

- **Status:** accepted as a build. 4.0 is proposed, as 3.6 is, until the author ratifies it.
- **Date:** 2026-10-26
- **Phase:** 4.0

## Context

The author asked the editor to "make all changes as needed" to raise the draft's meaning kept. They also asked to document every change "as a 4.0 patch so that Liraasa 4.0 is defined by what was necessary to translate _2100 Dreams_", with the editor and all tooling synced to 4.0.

## Decision

### 1. The 4.0 patch is generated from the draft

`translation/tools/make_patch_4_0.py` writes `data/proposals/liraasa_4_0_patch.json` in the author's patch shape. It builds through the same additions builder as the 3.x patches: `scripts/make_changeset_4_0.ts`, then `npm run integrate:4.0` from frozen 3.6.

- **220 compounds.** These are the coinages the finished draft uses, taken from `translation/registry.json` and counted in `out/`. Each is two existing headwords, colour bases or time nouns; there are no new roots. Senses that share a compound are joined, for example _ertasabaye_ for "brown hair; brunette hair". 17 coinages were already words of 3.6 and are listed in the patch's `rejected_proposals`.
- **2 English aliases:** heaven → _mavopagoasa_; dedication → _lavbujuba_, "offering". _loredonu_ means "surrender" first.
- **Rulings 4.0:G156–G161.** These are the grammar defaults the draft relied on, settled as rulings. Each ruling's examples read clean, and each closes an open question.

| Ruling | Topic                            | What it rules                                                              |
| ------ | -------------------------------- | -------------------------------------------------------------------------- |
| G156   | Speech before its verb of saying | `“…,” saivo po senosia` (the draft's G-9)                                  |
| G157   | Adjective order                  | opinion, size, age, shape, colour, origin, material, purpose (A4.22, I-28) |
| G158   | Durations                        | `en` + NUMBER + time noun (I-17)                                           |
| G159   | Comparing actions                | `la kasi` + adjective + `tamo`                                             |
| G160   | Destined to                      | `fatofa sidu` + verb, never `ke sidu`                                      |
| G161   | Decimals and percentages         | a fraction, NUMBER `de` NUMBER (2.5:G125)                                  |

The build gives 2,462 headwords. `npm run validate:4.0` gives 23 PASS and 2 WARN, and the author's validator gives PASS.

### 2. The tools read 4.0

The following tools now read `liraasa_4_0.json`:

- the LLM reference, the handoff and the guide;
- the Lessons and Learn (whose diff lesson is 3.6 → 4.0);
- the editor, the MFA export and the album.

`PROPOSED_EDITIONS` is `['3.6', '4.0']`. Three tools change their behaviour:

- **The checker** reads G156 and G157 as ruled. It declares `quotation_first` and `adjective_order_rule` in `data/checker/rules_3_0.json`, and code in `src/core/grammar` handles them.
- **The translator** renders a duration by G158.
- **The Reference Grammar** gains a 4.0 section in Part 7.

### 3. The draft re-translates on 4.0

The meaning-first pass re-runs on 4.0, with a re-indexed lexicon and a rebuilt system prompt.
