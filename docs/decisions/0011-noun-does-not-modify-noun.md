# ADR-0011 — A noun does not modify a noun

- **Status:** accepted
- **Date:** 2026-10-16
- **Phase:** 1.1, editor

## Context

The _Song of Time_ audit (`docs/reviews/2026-10-16-song-of-time.md`) found
two bare nouns side by side, read as English noun + noun, in six of the song's
remaining errors: `melo lavra`, `mare lore`, `yomla valla`, `leto nimu`. 1.0
writes modifiers as an adjective, a one-word compound or a `de` phrase, but
the canon also has three noun + noun phrases, so whether the pattern is an
error or a feature was put to the author.

## Decision

The author's ruling: **a noun does not modify a noun.** Of two nouns side by
side, the first becomes its adjective, which then describes the second.
`lira` (song) + `lavra` (bird) is `lirasan lavra`, a lyrical bird, a songbird.

Each noun form has its own adjective, so the adjective follows the form:

| Noun form        | Adjective | Example                             |
| ---------------- | --------- | ----------------------------------- |
| root             | `-san`    | `sizo` → `sizosan` (shimmering)     |
| ascended, `-asa` | `-asasan` | `mavopagoasa` → `mavopagoasasan`    |
| negative, `-na`  | `-nasan`  | `melona` → `melonasan` (discordant) |

An adjective slot glossed `— (unused)` has no meaning and is never used. 845
of the 1418 headwords have an unused `-san`, `lavra` and `lordi` among them.
Then the fix is the lexicon's compound of the two, if there is one, or else a
`de` phrase: `lavra lira` → `lira de lavra`.

## Consequences

- The editor's checker reports noun + noun as an **error**, with the
  adjective, compound or `de` phrase as the fix.
- The composer turns the first of two nouns into its adjective when that slot
  is glossed: "song bird" → `lirasan lavra`, "phoenix love" →
  `farulavrasan amor`.
- **Three canonical examples now break the rule.** They are reported, not
  corrected, and pinned by `tests/golden/checker.test.ts` for the author:

  | Example                              | The fix the rule gives |
  | ------------------------------------ | ---------------------- |
  | `Maivo melo bena opioa lumi`         | `melosan bena`         |
  | `Lotero silda, li cilni ka lasona.`  | `loterosan silda`      |
  | `Maivo po lemula baba lotero lermi.` | `loterosan lermi`      |

  Revising them is a 1.1 edit, each with a `ChangeRecord` (ADR-0007).

- Compounds are untouched: a compound is one word, modifier first, head last,
  and is not two nouns side by side.
