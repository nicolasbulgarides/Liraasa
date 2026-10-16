# ADR-0009 — How a vocabulary-only supplement is integrated

- **Status:** accepted
- **Date:** 2026-10-16
- **Phase:** 1.1 integration

## Context

The author supplied a 1.1 vocabulary proposal — 21 primal roots and 298
compounds — with an integration prompt whose first instruction is
**"NON-NEGOTIABLE: NO GRAMMAR CHANGES"**, and whose last is "preserve editorial
honesty where [the data and rules] do not [settle the issue]".

That shape of change will recur: 1.2 will almost certainly be another
vocabulary supplement. This records how it is done so the next one is a rerun
rather than a redesign.

## Decision

### 1. A supplement is a new file built from an immutable baseline

`scripts/integrate.ts` reads 1.0 and writes 1.1. It never opens the baseline
for writing, so the operation is reversible by deleting the outputs. It halts
unless the baseline's sha256 matches the one the proposal names
(`adc013cf…608f3`), and `--check` runs the whole pipeline plus the audit
without writing anything.

The build is deterministic: a fixed `built_utc`, derived synonyms, insertion in
the proposal's `safe_integration_order`. A test asserts two runs produce
byte-identical output.

### 2. Frozen sections are passed through by reference

Twenty sections — every grammar, phonology and closed-class section, plus
`legacy`, `dispositions` and the existing `examples` — are copied by reference
and never rebuilt. Only `version`, `built_utc`, `source`, `headwords` and
`examples` differ from the baseline, and a test enumerates exactly that set.

### 3. Forms are generated, never copied from the proposal

The proposal supplies seven-form spellings. The integration ignores them and
generates all seven from the unchanged 1.0 rule, then compares; a disagreement
is fatal. All 319 × 7 agreed, but the check is what makes that a finding rather
than an assumption.

### 4. New entries carry both `status_1_0` and `status_1_1`

This is the one judgement call worth recording, because the obvious choice was
wrong.

The semantically clean option is `status_1_1: "NEW"` alone: an entry that did
not exist in 1.0 has no 1.0 status. That was tried, and it broke the author's
own validator — check 9 requires the literal key `status_1_0` and reported 319
failures. Worse, checks 5 (phonotactics of new roots) and 18 (proximity) select
new material by `status_1_0 in ("NEW","REPLACED")`, so with only `status_1_1`
they inspected **nothing** and reported PASS. A vacuous pass is worse than a
failure.

So new entries carry both:

| Field        | Value | Why                                                                                                                                                                                               |
| ------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status_1_0` | `NEW` | What the unmodified `validate.py` requires, and what makes checks 5 and 18 genuinely test the 21 new roots. True in the sense the field carries: this entry is new material, not carried forward. |
| `status_1_1` | `NEW` | The edition-specific record, matching the proposal's own `status_1_1`.                                                                                                                            |
| `since`      | `1.1` | The unambiguous discriminator. Anything that must tell a 1.1 addition from a 1.0 one reads this.                                                                                                  |

The cost is one redundant field. The benefit is that the author's independent
check passes on 1.1 unmodified, which is the whole point of keeping it
(ADR-0007).

### 5. `validate_1_1.py` is a wrapper, not a fork

It runs the unmodified `validate.py` as a subprocess, then re-runs the three
version-gated checks against `since == "1.1"` and adds check 25, "previous
edition carried verbatim". Each check in the output records
`executed_against`, so a reader can see which results came from the shipped
validator and which from the wrapper. **No rule and no grammar is changed** —
only which entries count as new.

Because of decision 4 the wrapper is now belt-and-braces: the shipped validator
already tests the new roots, and the wrapper independently confirms it.

### 6. Narrowing is allowed; inventing is not

Eight glosses were narrowed. Each narrowing either resolves a contradiction
between a candidate's own `english_gloss` and its own `meaning_scope` (four
cases, e.g. `germabiti` glossed "steel tool" while its scope said it "does NOT
always imply steel"), or adds the qualifier that keeps a 1.0 sense intact (four
cases, e.g. `biotinosolma` qualified to species extinction because bare
"extinction" is already `faruna`, a fire going out).

The decisions live in `src/core/integrate/decisions.ts` as data with reasons,
so the changelog is generated from them rather than written alongside them.
Nine further overlaps were checked and accepted unchanged, recorded in the same
file: all were English homographs or 1.0 synonym padding.

### 7. Synonyms are derived from the entry's own glosses

The proposal supplies a synonym _policy_, not synonym lists. Rather than
inventing them, `deriveSynonyms` splits the entry's own glosses on the
separators they already use. Nothing is invented and nothing is padded — which
matters, because 1.0's own padded lists are what produced most of the false
overlap reports during the audit (`folninevlo`, "flower-soft snow", lists
"weather" and "climate").

## Consequences

- 1418 headwords: 407 primal roots and 1011 compounds, matching the prompt's
  acceptance criteria exactly, with zero rejections.
- 25 of 25 validator checks pass, including all 24 from the unmodified
  `validate.py`.
- `liraasa_core.py` and `liraasa_lexicon.py` had to be reconstructed before any
  of this could be checked; see ADR-0010.
- A 1.2 supplement reruns `npm run integrate` against a new proposal with a new
  baseline hash. The decisions file is the only part expected to need editing.
