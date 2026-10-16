# ADR-0004 — Ruling ids are edition-qualified

- **Status:** accepted
- **Date:** 2026-10-16
- **Phase:** 0

## Context

SPEC §5.4 and §7 ask every grammar finding and every logged change to carry a
rule id and link to "the relevant grammar entry". SPEC §7.7 lists "rulings
R1–R12 and G-rulings" as if the id space were flat.

It is not. The 1.0 lexicon ships two ruling arrays:

- `rulings_1_0` — 23 entries, ids **G1–G23**
- `rulings_0_8_carried` — 20 entries, ids **R1–R12 and G1–G8**

`G1` through `G8` are defined in both, with different content:

| id  | `rulings_1_0`                        | `rulings_0_8_carried`                |
| --- | ------------------------------------ | ------------------------------------ |
| G1  | Scope by position                    | Demonstratives as pronouns           |
| G2  | si and whether                       | Negation scope                       |
| G3  | Permission vs possibility vs ability | Ellipsis                             |
| G4  | Epistemic necessity                  | Quotation and embedded questions     |
| G5  | Intention                            | Relative time in subordinate clauses |
| G6  | Counterfactual                       | Nominalization                       |
| G7  | Imminence                            | Noun-phrase order                    |
| G8  | Continuation                         | Sameness, difference, similarity     |

Both sets are live. 1.0's G19 (version gating) is what makes a pre-1.0 text
readable at all, and 0.8's R2, R6, R9 and R12 are cited by SPEC §5.4 and §6.5
as checks the app must implement. Neither set can be dropped.

A bare `"G6"` on a grammar finding is therefore ambiguous between
"Counterfactual" and "Nominalization" — two unrelated rules, both plausibly
relevant to a sentence about a nominalised counterfactual.

(`legacy.rulings_0_8` is byte-identical to `rulings_0_8_carried`; the
duplication is harmless and the importer reads one.)

## Decision

**Every ruling reference is `<edition>:<id>`.** `"1.0:G1"`, `"0.8:G1"`,
`"0.8:R2"`.

- The internal id is the qualified string; it is what a finding, a changeset
  op (`ruling`) and a cross-reference store.
- The UI shows the bare id with the edition as a superscript or a
  parenthetical, because "G19" is what the author says out loud.
- Parsing a bare id is allowed **only** in author-typed input, and resolves
  to: the current edition if it is unique there, otherwise an explicit
  disambiguation prompt. It is never guessed.
- The `R`-prefixed ids (R1–R12) are unique across both sets, so `"0.8:R2"` is
  belt and braces — but uniformity beats a special case.

## Consequences

- The Grammar reference module shows two ruling sections, 1.0 and carried 0.8,
  and a reader landing on 0.8's G1 sees that 1.0's G1 is a different rule.
- `tests/golden/sourceData.test.ts` asserts the collision set is exactly
  `G1`–`G8`, so a future edition that adds a ninth collision — or resolves
  these — fails the test and gets a decision instead of a surprise.
- A future 1.1 that renumbers its G-rulings does not break stored references,
  because every stored reference already names its edition.
