# ADR-0012 — Grammar rulings G24–G31

- **Status:** accepted
- **Date:** 2026-10-17
- **Phase:** 1.1, editor

## Context

The validator rewrite on `songbook-validator` left a list of open questions
(`docs/OPEN_QUESTIONS.md`): four rules the guide's own examples break, and the
language gaps the _Song of Time_ and _Lira de Kronoasa_ audits found. They were
discussed with the author on 2026-10-17. For each one the aim was the same:
lines that sing well, and grammar that converts mechanically from English to
Liraasa and back. Where the canon already did something consistently, the
ruling writes down what it does.

1.1 is a vocabulary-only supplement, and its integration is pinned to change
no grammar (ADR-0009). So these rulings do not edit `liraasa_1_1.json`. They
are numbered on from `1.0:G23` and qualified with the next edition, **1.2**
(ADR-0004). They are recorded as a changeset,
`data/changes/2026-10-17-grammar-rulings.json`, together with the three example
revisions ADR-0011 called for.

## Decision

| Ruling  | Topic                                | In short                                                                                                                                                        |
| ------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.2:G24 | Time words                           | A time word opens **or** closes its clause; the comma after an opening one is optional. Only `zafra`, `finra`, `lanto`, `kenvi` are opening-only, with a comma. |
| 1.2:G25 | `oro`                                | A lone `oro` joins two equal parts, like `ata`, and may open a continuing clause ("Or …"). `oro A oro B` is the emphatic "either A or B". Refines 1.0:G10.      |
| 1.2:G26 | Give-type verbs                      | VERB THEME `ala` RECIPIENT; a **pronoun** recipient may stand bare straight after the verb (`guraga maivo dossa cono`).                                         |
| 1.2:G27 | Which side of `de` is the owner      | In `X de Y` the owner is Y ("X of Y"). A pronoun or personal name **before** `de` is the owner ("X's Y"). A pronoun is the owner wherever it stands.            |
| 1.2:G28 | `-ri` after a number or quantifier   | Optional; the number already says how many. Choose by meter.                                                                                                    |
| 1.2:G29 | Adjective as a noun                  | Only after an article or determiner: `li ramumomvisan`, "the forgotten".                                                                                        |
| 1.2:G30 | "About"                              | No new word: a `de` phrase (`li lira de amor`), or give the verb an object.                                                                                     |
| 1.2:G31 | Commands, address, narrative present | A command has no subject (`fisa` softens it); a person addressed is set off by commas; verse may narrate past events in the present.                            |

The full text and examples of each are in the changeset.

### Why G27 is phrased this way

During the discussion the first proposal was that the article decides
direction. Checking it against all 65 `de` phrases in the canon found two that
break it: `livna de taivo` ("your choice") and `nullo de deyaapo` ("last
night"). The rule adopted, "the owner follows `de` unless a pronoun or name
comes first, and a pronoun is always the owner", fits all 65 with no
exceptions. It also makes "about" (G30) and the Song of Time's `lavra de
lirari` ("bird of songs") read correctly with no extra rule. Fractions
(`tressa de cuara`) are their own construction, as the 0.8 settled questions
already say.

### The example revisions

| Example (1.1)                        | Revised (1.2)                           |
| ------------------------------------ | --------------------------------------- |
| `Maivo melo bena opioa lumi`         | `Maivo de benasan melo opioa lumi.`     |
| `Lotero silda, li cilni ka lasona.`  | `Loterosan silda, li cilni ka lasona.`  |
| `Maivo po lemula baba lotero lermi.` | `Maivo po lemula baba loterosan lermi.` |

Each uses only existing forms and keeps its English gloss.

## Consequences

- The editor's checker:
  - drops the frame rule for `eli-krono` (G24) and the `oro` pairing rule (G25);
  - warns on a bare give-type recipient only when it is not a pronoun (G26);
  - back-translates a pronoun after `de` as the owner, "of me" (G27);
  - cites G24 and G30 in its notes.
- Rules unchanged: G28 and G29 were already accepted by the checker, and G31
  matches how the canon already writes commands and address.
- The 1.0 and 1.1 guide examples that break ADR-0011 stay pinned in the
  tests, because those files are frozen. `tests/golden/changes.test.ts`
  checks that each revision replaces text that is really there and passes the
  checker.
- `npm run build:handoff` writes `handoff/liraasa_1_1_complete.json`: the 1.1
  lexicon with this changeset applied, for the grammar-guide handoff.
- Still open, for a song that needs them: "once / N times", a general "to +
  verb" complement, evidentials in detail, and relative clauses on a
  prepositional object.
